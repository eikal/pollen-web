const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')
require('dotenv').config()

/**
 * Pollen Backend API Server
 * 
 * MVP SCOPE (001-csv-upload-mvp):
 * ================================
 * ACTIVE:
 *   - /auth/* (signup, login, me)
 *   - /api/uploads/* (file upload, tables, preview)
 *   - /provisioning (org creation for onboarding)
 *   - /user/organizations, /org (org info for onboarding)
 * 
 * OUT OF MVP SCOPE (kept for future phases):
 *   - /instances, /instances/:id (DWH instance management)
 *   - /provisioning/:jobId (job status polling)
 *   - /etl/* (templates, jobs, connectors)
 *   - /api/connections (data source connections)
 *   - /api/data-products (data products)
 *   - /org/invite, /org/members/* (team management)
 */

// Import TypeScript API routes (compiled)
// MVP: Only uploads and quota routers are active
// const connectionsRouter = require('./dist/api/connections').default  // Out of MVP scope
// const dataProductsRouter = require('./dist/api/data-products').default  // Out of MVP scope
const uploadsRouter = require('./dist/api/uploads').default
const quotaRouter = require('./dist/api/quota').default

const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// Postgres connection settings (use env vars or defaults for dev)
const pgConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || 'pollen_dev',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
}

const pool = new Pool(pgConfig)

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(bodyParser.json())

// Mount API routes - MVP only
// app.use('/api/connections', connectionsRouter)  // Out of MVP scope
// app.use('/api/data-products', dataProductsRouter)  // Out of MVP scope
app.use('/api/uploads', uploadsRouter)
app.use('/api/quota', quotaRouter)

function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}
 

async function ensureDbConnection() {
  try {
    await pool.query('SELECT 1')
  } catch (err) {
    console.error('Unable to connect to Postgres with config:', pgConfig)
    console.error(err)
    process.exit(1)
  }
}

// Persist users into Postgres users table (requires migrations to be applied)
app.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const client = await pool.connect()
    try {
      // check existing
      const exists = await client.query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email])
      if (exists.rowCount > 0) { return res.status(409).json({ error: 'user exists' }) }
      const hashed = await bcrypt.hash(password, 10)
      const insert = await client.query(
        `INSERT INTO users (org_id, subject, email, display_name, role, password_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, display_name`,
        [null, `local:${email}`, email, displayName || '', 'member', hashed]
      )
      const user = insert.rows[0]
      const token = generateToken(user)
      return res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('signup error', err)
    return res.status(500).json({ error: 'internal error' })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const client = await pool.connect()
    try {
      const q = await client.query('SELECT id, email, display_name, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1', [email])
      if (q.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' })
      const user = q.rows[0]
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) return res.status(401).json({ error: 'invalid credentials' })
      const token = generateToken(user)
      return res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'internal error' })
  }
})

app.get('/auth/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      const q = await client.query('SELECT id, email, display_name, org_id FROM users WHERE id = $1 LIMIT 1', [decoded.id])
      if (q.rowCount === 0) return res.status(404).json({ error: 'not found' })
      const user = q.rows[0]
      return res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, orgId: user.org_id } })
    } finally {
      client.release()
    }
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
})

// Provisioning endpoint - lightweight: create org if missing and enqueue a provisioning job
app.post('/provisioning', async (req, res) => {
  const { orgName, domain, plan, template, requestedByEmail } = req.body || {}
  if (!orgName) return res.status(400).json({ error: 'orgName required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // find or create organization
    let orgId = null
    const orgQ = await client.query('SELECT id FROM organizations WHERE lower(name) = lower($1) LIMIT 1', [orgName])
    if (orgQ.rowCount > 0) {
      orgId = orgQ.rows[0].id
    } else {
      const cfg = { createdVia: 'onboarding' }
      const ins = await client.query('INSERT INTO organizations (name, domain, config) VALUES ($1,$2,$3) RETURNING id', [orgName, domain || null, cfg])
      orgId = ins.rows[0].id
    }

    // try to resolve requesting user from Authorization header (JWT) first
    let requestedBy = null
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization
      if (authHeader) {
        const parts = authHeader.split(' ')
        if (parts.length === 2 && parts[0] === 'Bearer') {
          const decoded = jwt.verify(parts[1], JWT_SECRET)
          if (decoded && decoded.id) {
            requestedBy = decoded.id
          }
        }
      }
    } catch (e) {
      // invalid token — ignore and fall back to requestedByEmail
      requestedBy = null
    }

    // fallback: try to resolve requesting user by email if provided
    if (!requestedBy && requestedByEmail) {
      const u = await client.query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [requestedByEmail])
      if (u.rowCount > 0) requestedBy = u.rows[0].id
    }

    // Associate user with org if they don't have one yet
    if (requestedBy && orgId) {
      await client.query('UPDATE users SET org_id = $1 WHERE id = $2 AND org_id IS NULL', [orgId, requestedBy])
    }

    // insert provisioning job
    const params = { plan: plan || 'basic', template: template || null }
    const idempotencyKey = require('crypto').randomBytes(12).toString('hex')
    const pj = await client.query(
      'INSERT INTO provisioning_jobs (org_id, provider, requested_by, idempotency_key, params, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, status',
      [orgId, 'generic', requestedBy, idempotencyKey, params, 'PENDING']
    )

    await client.query('COMMIT')
    return res.json({ job: pj.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('provisioning error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Get all provisioned instances for the logged-in user's org
app.get('/instances', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      // get user's org_id
      const userQ = await client.query('SELECT org_id FROM users WHERE id = $1 LIMIT 1', [decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      
      // if user has no org, return empty list
      if (!orgId) {
        return res.json({ instances: [] })
      }
      
      // get all instances for this org
      const instancesQ = await client.query(`
        SELECT 
          pi.id,
          pi.org_id,
          pi.provider,
          pi.name as instance_name,
          pi.connection,
          pi.status,
          pi.created_at
        FROM provisioned_instances pi
        WHERE pi.org_id = $1 AND pi.deleted_at IS NULL
        ORDER BY pi.created_at DESC
      `, [orgId])
      
      // also get provisioning jobs for this org to show pending jobs
      const jobsQ = await client.query(`
        SELECT id, provider, params, status, created_at
        FROM provisioning_jobs
        WHERE org_id = $1 AND status IN ('PENDING', 'IN_PROGRESS')
        ORDER BY created_at DESC
      `, [orgId])
      
      const instances = instancesQ.rows.map(row => ({
        id: row.id,
        provider: row.provider,
        name: row.instance_name || 'Unnamed Instance',
        status: row.status || 'ACTIVE',
        createdAt: row.created_at,
        plan: 'basic' // future: extract from instance metadata
      }))
      
      // add pending jobs as instances with special status
      const pendingInstances = jobsQ.rows.map(row => ({
        id: row.id,
        jobId: row.id,
        provider: row.provider,
        name: `${row.provider} (provisioning...)`,
        status: row.status,
        createdAt: row.created_at,
        plan: row.params?.plan || 'basic'
      }))
      
      return res.json({ instances: [...pendingInstances, ...instances] })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('get instances error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// Get a single instance details for the logged-in user's org
app.get('/instances/:id', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  const instanceId = req.params.id

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      // get user's org_id
      const userQ = await client.query('SELECT org_id FROM users WHERE id = $1 LIMIT 1', [decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      if (!orgId) return res.status(404).json({ error: 'no organization' })

      // fetch instance owned by this org
      const instQ = await client.query(
        `SELECT id, org_id, provider, name, connection, status, created_at, updated_at
         FROM provisioned_instances
         WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL
         LIMIT 1`,
        [instanceId, orgId]
      )

      if (instQ.rowCount === 0) return res.status(404).json({ error: 'instance not found' })
      const row = instQ.rows[0]

      // Sanitize connection info (mask secrets)
      const conn = row.connection || {}
      const masked = { ...conn }
      const secretKeys = ['password', 'secret', 'token', 'key', 'privateKey']
      secretKeys.forEach(k => {
        if (k in masked) masked[k] = '****'
      })

      // Try to build a masked connection string for UX (never include real secrets here)
      let connectionStringMasked = null
      try {
        if (conn && conn.driver && conn.host) {
          const driver = conn.driver
          const user = conn.username || conn.user || 'user'
          const pass = (conn.password ? '****' : '')
          const host = conn.host
          const port = conn.port ? `:${conn.port}` : ''
          const db = conn.database ? `/${conn.database}` : ''
          if (driver === 'postgres' || driver === 'postgresql') {
            connectionStringMasked = `postgres://${user}${pass ? ':'+pass : ''}@${host}${port}${db}`
          } else if (driver === 'mysql') {
            connectionStringMasked = `mysql://${user}${pass ? ':'+pass : ''}@${host}${port}${db}`
          } else if (driver === 'snowflake') {
            connectionStringMasked = `snowflake://${user}${pass ? ':'+pass : ''}@${host}${db}`
          }
        }
      } catch (_) {
        connectionStringMasked = null
      }

      // Basic usage metrics stub (to be replaced by real telemetry later)
      const metrics = {
        queriesToday: 0,
        storageMB: null
      }

      return res.json({
        instance: {
          id: row.id,
          provider: row.provider,
          name: row.name || 'Unnamed Instance',
          status: row.status || 'ACTIVE',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          connection: masked,
          connectionStringMasked,
          metrics
        }
      })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('get instance detail error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// Get a single provisioning job status for the logged-in user's org
app.get('/provisioning/:jobId', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  const jobId = req.params.jobId

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      // get user's org_id
      const userQ = await client.query('SELECT org_id FROM users WHERE id = $1 LIMIT 1', [decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      if (!orgId) return res.status(404).json({ error: 'no organization' })

      const jobQ = await client.query(
        `SELECT id, org_id, status, attempts, last_error, result, created_at, updated_at, finished_at
         FROM provisioning_jobs
         WHERE id = $1 AND org_id = $2
         LIMIT 1`,
        [jobId, orgId]
      )
      if (jobQ.rowCount === 0) return res.status(404).json({ error: 'job not found' })
      const row = jobQ.rows[0]

      // derive progress from result JSON (if present)
      let progress = 0
      if (row.result && typeof row.result.progress !== 'undefined') {
        progress = parseInt(row.result.progress, 10)
        if (Number.isNaN(progress)) progress = 0
      } else {
        if (row.status === 'COMPLETED') progress = 100
        else if (row.status === 'IN_PROGRESS') progress = 10
        else progress = 0
      }

      return res.json({
        job: {
          id: row.id,
          status: row.status,
          attempts: row.attempts,
          lastError: row.last_error || null,
          progress,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          finishedAt: row.finished_at || null
        }
      })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('get job status error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// --- ETL Templates & Jobs Endpoints (T007) ---
// Create a new ETL template for the user's organization
app.post('/etl/templates', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  const { name, description, provider, spec } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  let decoded
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
  try {
    const client = await pool.connect()
    try {
      const userQ = await client.query('SELECT id, org_id, email FROM users WHERE id=$1 LIMIT 1',[decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      let orgId = userQ.rows[0].org_id
      // Auto-create a default org for users without one (dev convenience)
      if (!orgId) {
        const email = userQ.rows[0].email || decoded.email || ''
        const local = email.includes('@') ? email.split('@')[0] : 'user'
        const domain = null // prevent unique domain collisions in tests
        const orgName = `Personal ${local}`
        const cfg = { createdVia: 'etl-templates' }
        const orgIns = await client.query('INSERT INTO organizations (name, domain, config) VALUES ($1,$2,$3) RETURNING id', [orgName, domain, cfg])
        orgId = orgIns.rows[0].id
        await client.query('UPDATE users SET org_id = $1 WHERE id = $2', [orgId, decoded.id])
      }
      const ins = await client.query(
        `INSERT INTO etl_templates (org_id, name, description, provider, spec)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, name, description, provider, spec, created_at`,
        [orgId, name, description || '', provider || 'generic', spec || {}]
      )
      return res.json({ template: ins.rows[0] })
    } finally { client.release() }
  } catch (err) {
    console.error('create template error', err)
    return res.status(500).json({ error: 'internal error', detail: err && err.message })
  }
})

// List ETL templates
app.get('/etl/templates', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      const userQ = await client.query('SELECT org_id FROM users WHERE id=$1 LIMIT 1',[decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      if (!orgId) return res.json({ templates: [] })
      const q = await client.query(
        `SELECT id, name, description, provider, spec, created_at
         FROM etl_templates WHERE org_id=$1 ORDER BY created_at DESC`,[orgId]
      )
      return res.json({ templates: q.rows })
    } finally { client.release() }
  } catch (err) {
    console.error('list templates error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// Create / schedule an ETL job
app.post('/etl/jobs', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  const { templateId, params } = req.body || {}
  if (!templateId) return res.status(400).json({ error: 'templateId required' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      const userQ = await client.query('SELECT org_id FROM users WHERE id=$1 LIMIT 1',[decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      if (!orgId) return res.status(400).json({ error: 'no organization' })
      // verify template belongs to org
      const tplQ = await client.query('SELECT id FROM etl_templates WHERE id=$1 AND org_id=$2 LIMIT 1',[templateId, orgId])
      if (tplQ.rowCount === 0) return res.status(404).json({ error: 'template not found' })
      const ins = await client.query(
        `INSERT INTO etl_jobs (org_id, template_id, params, status)
         VALUES ($1,$2,$3,'SCHEDULED') RETURNING id, status, created_at`,
        [orgId, templateId, params || {}]
      )
      return res.json({ job: ins.rows[0] })
    } finally { client.release() }
  } catch (err) {
    console.error('create etl job error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// List ETL jobs
app.get('/etl/jobs', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      const userQ = await client.query('SELECT org_id FROM users WHERE id=$1 LIMIT 1',[decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      if (!orgId) return res.json({ jobs: [] })
      const q = await client.query(
        `SELECT id, template_id, status, created_at, updated_at, result
         FROM etl_jobs WHERE org_id=$1 ORDER BY created_at DESC`,[orgId]
      )
      // derive progress from result json
      const jobs = q.rows.map(r => {
        let progress = 0
        if (r.result && typeof r.result.progress !== 'undefined') {
          progress = parseInt(r.result.progress,10); if (Number.isNaN(progress)) progress = 0
        } else if (r.status === 'SUCCESS') progress = 100
        return { id: r.id, templateId: r.template_id, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at, progress }
      })
      return res.json({ jobs })
    } finally { client.release() }
  } catch (err) {
    console.error('list etl jobs error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// Get single ETL job
app.get('/etl/jobs/:id', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  const jobId = req.params.id
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      const userQ = await client.query('SELECT org_id FROM users WHERE id=$1 LIMIT 1',[decoded.id])
      if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
      const orgId = userQ.rows[0].org_id
      const q = await client.query(
        `SELECT id, template_id, status, created_at, updated_at, result
         FROM etl_jobs WHERE id=$1 AND org_id=$2 LIMIT 1`,[jobId, orgId]
      )
      if (q.rowCount === 0) return res.status(404).json({ error: 'job not found' })
      const r = q.rows[0]
      let progress = 0
      if (r.result && typeof r.result.progress !== 'undefined') {
        progress = parseInt(r.result.progress,10); if (Number.isNaN(progress)) progress = 0
      } else if (r.status === 'SUCCESS') progress = 100
      return res.json({ job: { id: r.id, templateId: r.template_id, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at, progress, result: r.result || null } })
    } finally { client.release() }
  } catch (err) {
    console.error('get etl job error', err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

// Get ETL connector catalog (sources & destinations)
app.get('/etl/connectors', async (req, res) => {
  // Static catalog for now; will be dynamic when T027 implemented
  const connectors = {
    sources: [
      {
        id: 'postgres',
        name: 'PostgreSQL',
        description: 'Connect to PostgreSQL database',
        icon: 'database',
        category: 'database',
        configSchema: [
          { name: 'host', type: 'text', label: 'Host', required: true, placeholder: 'localhost' },
          { name: 'port', type: 'number', label: 'Port', required: true, default: 5432 },
          { name: 'database', type: 'text', label: 'Database', required: true },
          { name: 'username', type: 'text', label: 'Username', required: true },
          { name: 'password', type: 'password', label: 'Password', required: true },
          { name: 'schema', type: 'text', label: 'Schema', default: 'public' },
          { name: 'table', type: 'text', label: 'Table', required: true }
        ]
      },
      {
        id: 'mysql',
        name: 'MySQL',
        description: 'Connect to MySQL database',
        icon: 'database',
        category: 'database',
        configSchema: [
          { name: 'host', type: 'text', label: 'Host', required: true, placeholder: 'localhost' },
          { name: 'port', type: 'number', label: 'Port', required: true, default: 3306 },
          { name: 'database', type: 'text', label: 'Database', required: true },
          { name: 'username', type: 'text', label: 'Username', required: true },
          { name: 'password', type: 'password', label: 'Password', required: true },
          { name: 'table', type: 'text', label: 'Table', required: true }
        ]
      },
      {
        id: 'csv_upload',
        name: 'CSV File Upload',
        description: 'Upload a CSV file',
        icon: 'file',
        category: 'file',
        configSchema: [
          { name: 'delimiter', type: 'select', label: 'Delimiter', required: true, default: ',', options: [{value:',',label:'Comma'},{value:';',label:'Semicolon'},{value:'\\t',label:'Tab'}] },
          { name: 'hasHeader', type: 'checkbox', label: 'First row is header', default: true },
          { name: 'encoding', type: 'select', label: 'Encoding', default: 'utf-8', options: [{value:'utf-8',label:'UTF-8'},{value:'latin1',label:'Latin-1'}] }
        ]
      },
      {
        id: 'rest_api',
        name: 'REST API',
        description: 'Pull data from REST API endpoint',
        icon: 'api',
        category: 'api',
        configSchema: [
          { name: 'url', type: 'text', label: 'API URL', required: true, placeholder: 'https://api.example.com/data' },
          { name: 'method', type: 'select', label: 'Method', required: true, default: 'GET', options: [{value:'GET',label:'GET'},{value:'POST',label:'POST'}] },
          { name: 'authType', type: 'select', label: 'Auth Type', default: 'none', options: [{value:'none',label:'None'},{value:'bearer',label:'Bearer Token'},{value:'basic',label:'Basic Auth'}] },
          { name: 'authToken', type: 'password', label: 'Token/Key', dependsOn: { field: 'authType', value: 'bearer' } },
          { name: 'jsonPath', type: 'text', label: 'JSON Path to data', placeholder: '$.data' }
        ]
      }
    ],
    destinations: [
      {
        id: 'dwh_instance',
        name: 'Data Warehouse',
        description: 'Load into your provisioned DWH instance',
        icon: 'warehouse',
        category: 'warehouse',
        configSchema: [
          { name: 'instanceId', type: 'select', label: 'Instance', required: true, dynamic: 'instances' },
          { name: 'schema', type: 'text', label: 'Schema', default: 'public' },
          { name: 'table', type: 'text', label: 'Table Name', required: true },
          { name: 'writeMode', type: 'select', label: 'Write Mode', required: true, default: 'append', options: [{value:'append',label:'Append'},{value:'replace',label:'Replace'},{value:'upsert',label:'Upsert'}] }
        ]
      },
      {
        id: 'csv_export',
        name: 'CSV Export',
        description: 'Export to CSV file',
        icon: 'file',
        category: 'file',
        configSchema: [
          { name: 'filename', type: 'text', label: 'Filename', required: true, placeholder: 'output.csv' },
          { name: 'delimiter', type: 'select', label: 'Delimiter', default: ',', options: [{value:',',label:'Comma'},{value:';',label:'Semicolon'}] }
        ]
      }
    ]
  }
  return res.json({ connectors })
})

// RBAC Middleware
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'missing auth' })
    const parts = auth.split(' ')
    if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
    const token = parts[1]
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const client = await pool.connect()
      try {
        const userQ = await client.query('SELECT id, email, org_id, role FROM users WHERE id = $1 LIMIT 1', [decoded.id])
        if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
        const user = userQ.rows[0]
        
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({ error: 'forbidden', message: `Requires one of: ${allowedRoles.join(', ')}` })
        }
        
        req.user = user
        next()
      } finally {
        client.release()
      }
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' })
    }
  }
}

// Helper to extract user from token (doesn't enforce role)
async function getUserFromToken(req) {
  const auth = req.headers.authorization
  if (!auth) return null
  const parts = auth.split(' ')
  if (parts.length !== 2) return null
  const token = parts[1]
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const client = await pool.connect()
    try {
      const userQ = await client.query('SELECT id, email, org_id, role FROM users WHERE id = $1 LIMIT 1', [decoded.id])
      if (userQ.rowCount === 0) return null
      return userQ.rows[0]
    } finally {
      client.release()
    }
  } catch (err) {
    return null
  }
}

// Get user's organizations
app.get('/user/organizations', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'not authenticated' })
  
  const client = await pool.connect()
  try {
    // For MVP: users belong to one org. In future: support multi-org via user_organizations table
    // Return current org if user has one
    if (user.org_id) {
      const orgQ = await client.query(
        'SELECT id, name, domain, created_at FROM organizations WHERE id = $1',
        [user.org_id]
      )
      if (orgQ.rowCount > 0) {
        return res.json({
          organizations: orgQ.rows.map(o => ({
            id: o.id,
            name: o.name,
            domain: o.domain,
            createdAt: o.created_at,
            isActive: true
          }))
        })
      }
    }
    
    // User has no org yet
    return res.json({ organizations: [] })
  } catch (err) {
    console.error('get user orgs error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Get organization details
app.get('/org', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'not authenticated' })
  if (!user.org_id) return res.status(404).json({ error: 'no organization' })
  
  const client = await pool.connect()
  try {
    const orgQ = await client.query('SELECT id, name, domain, config, created_at FROM organizations WHERE id = $1', [user.org_id])
    if (orgQ.rowCount === 0) return res.status(404).json({ error: 'organization not found' })
    
    const membersQ = await client.query(
      'SELECT id, email, display_name, role, created_at FROM users WHERE org_id = $1 ORDER BY created_at',
      [user.org_id]
    )
    
    const org = orgQ.rows[0]
    return res.json({
      org: {
        id: org.id,
        name: org.name,
        domain: org.domain,
        config: org.config,
        createdAt: org.created_at
      },
      members: membersQ.rows.map(m => ({
        id: m.id,
        email: m.email,
        displayName: m.display_name,
        role: m.role,
        createdAt: m.created_at
      }))
    })
  } catch (err) {
    console.error('get org error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Switch active organization (for future multi-org support)
app.post('/user/switch-org', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'not authenticated' })
  
  const { orgId } = req.body || {}
  if (!orgId) return res.status(400).json({ error: 'orgId required' })
  
  const client = await pool.connect()
  try {
    // Verify org exists and user has access (for now, just check if it's their current org)
    // In future: check user_organizations table for multi-org membership
    const orgQ = await client.query('SELECT id FROM organizations WHERE id = $1', [orgId])
    if (orgQ.rowCount === 0) return res.status(404).json({ error: 'organization not found' })
    
    // For MVP: only allow switching to their current org (no-op)
    // In future: update user's active_org_id
    if (user.org_id !== orgId) {
      return res.status(403).json({ error: 'access denied to this organization' })
    }
    
    return res.json({ success: true, activeOrgId: orgId })
  } catch (err) {
    console.error('switch org error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Update organization settings (admin only)
app.put('/org', requireRole('admin'), async (req, res) => {
  const { name, domain } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  
  const client = await pool.connect()
  try {
    await client.query(
      'UPDATE organizations SET name = $1, domain = $2, updated_at = now() WHERE id = $3',
      [name, domain || null, req.user.org_id]
    )
    
    // Log in audit_log
    await client.query(
      `INSERT INTO audit_log (org_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, 'org.settings_updated', 'organization', $3, $4, $5)`,
      [req.user.org_id, req.user.id, req.user.org_id, { name, domain }, req.ip]
    )
    
    return res.json({ success: true })
  } catch (err) {
    console.error('update org error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Invite user to organization (admin only)
app.post('/org/invite', requireRole('admin'), async (req, res) => {
  const { email, role } = req.body || {}
  if (!email || !role) return res.status(400).json({ error: 'email and role required' })
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'invalid role. must be admin, member, or viewer' })
  }
  
  const client = await pool.connect()
  try {
    // Check if user already exists
    const existingQ = await client.query('SELECT id, org_id FROM users WHERE lower(email) = lower($1)', [email])
    if (existingQ.rowCount > 0) {
      const existing = existingQ.rows[0]
      if (existing.org_id === req.user.org_id) {
        return res.status(409).json({ error: 'user already in organization' })
      }
      return res.status(409).json({ error: 'user already exists in another organization' })
    }
    
    // Create invitation token (simple implementation - store in DB or send via email)
    const inviteToken = require('crypto').randomBytes(32).toString('hex')
    
    // For MVP: create user immediately with pending status
    // In production: send email with invite link
    const insertQ = await client.query(
      `INSERT INTO users (org_id, subject, email, display_name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role`,
      [req.user.org_id, `invite:${inviteToken}`, email, email.split('@')[0], role, null]
    )
    
    // Log in audit_log
    await client.query(
      `INSERT INTO audit_log (org_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, 'user.invited', 'user', $3, $4, $5)`,
      [req.user.org_id, req.user.id, insertQ.rows[0].id, { email, role }, req.ip]
    )
    
    return res.json({
      success: true,
      user: insertQ.rows[0],
      inviteLink: `http://localhost:3000/auth/accept-invite?token=${inviteToken}` // For MVP
    })
  } catch (err) {
    console.error('invite user error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Update user role (admin only)
app.put('/org/members/:userId/role', requireRole('admin'), async (req, res) => {
  const { userId } = req.params
  const { role } = req.body || {}
  if (!role) return res.status(400).json({ error: 'role required' })
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'invalid role. must be admin, member, or viewer' })
  }
  
  const client = await pool.connect()
  try {
    // Verify user is in same org
    const userQ = await client.query('SELECT org_id FROM users WHERE id = $1', [userId])
    if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
    if (userQ.rows[0].org_id !== req.user.org_id) {
      return res.status(403).json({ error: 'user not in your organization' })
    }
    
    // Update role
    await client.query('UPDATE users SET role = $1, updated_at = now() WHERE id = $2', [role, userId])
    
    // Log in audit_log
    await client.query(
      `INSERT INTO audit_log (org_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, 'user.role_changed', 'user', $3, $4, $5)`,
      [req.user.org_id, req.user.id, userId, { role }, req.ip]
    )
    
    return res.json({ success: true })
  } catch (err) {
    console.error('update role error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Remove user from organization (admin only)
app.delete('/org/members/:userId', requireRole('admin'), async (req, res) => {
  const { userId } = req.params
  
  const client = await pool.connect()
  try {
    // Verify user is in same org
    const userQ = await client.query('SELECT org_id, email FROM users WHERE id = $1', [userId])
    if (userQ.rowCount === 0) return res.status(404).json({ error: 'user not found' })
    if (userQ.rows[0].org_id !== req.user.org_id) {
      return res.status(403).json({ error: 'user not in your organization' })
    }
    
    // Don't allow removing yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'cannot remove yourself' })
    }
    
    // Remove user (set org_id to null instead of deleting)
    await client.query('UPDATE users SET org_id = NULL, updated_at = now() WHERE id = $1', [userId])
    
    // Log in audit_log
    await client.query(
      `INSERT INTO audit_log (org_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, 'user.removed', 'user', $3, $4, $5)`,
      [req.user.org_id, req.user.id, userId, { email: userQ.rows[0].email }, req.ip]
    )
    
    return res.json({ success: true })
  } catch (err) {
    console.error('remove user error', err)
    return res.status(500).json({ error: 'internal error' })
  } finally {
    client.release()
  }
})

// Ensure DB is reachable before starting
ensureDbConnection().then(() => {
  app.listen(PORT, () => console.log(`Auth server listening on http://localhost:${PORT}`))
})
