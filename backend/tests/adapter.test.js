/* Minimal contract tests for the adapter interface (ExampleAdapter) */
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

async function run() {
  // Load compiled example (after `npm run build`)
  const Example = require('../dist/adapters/example').default || require('../dist/adapters/example')
  const adapter = new Example()

  // validateConfig should reject invalid config
  let threw = false
  try {
    await adapter.validateConfig()
  } catch (e) {
    threw = true
  }
  assert(threw, 'validateConfig should throw on missing config')

  // validateConfig should pass for any object
  await adapter.validateConfig({ region: 'test' })

  // create returns ProvisionResult with created=true and instanceId
  const res = await adapter.create({ region: 'test' }, { instanceName: 'demo' }, 'idem-1')
  assert(res && typeof res.instanceId === 'string', 'create should return instanceId')
  assert(res.created === true, 'create.created should be true for first run')
  assert(res.connection && res.connection.host, 'create should return connection meta')

  // status returns StatusDetail
  const st = await adapter.status(res.instanceId)
  assert(st && st.status && typeof st.status === 'string', 'status should return a status detail')

  // credentials returns an object
  const creds = await adapter.credentials(res.instanceId)
  assert(creds && typeof creds === 'object', 'credentials should return object')

  // destroy is idempotent
  await adapter.destroy(res.instanceId)
  await adapter.destroy(res.instanceId)

  console.log('Adapter contract tests: OK')
}

run().catch(err => { console.error(err); process.exit(1) })
