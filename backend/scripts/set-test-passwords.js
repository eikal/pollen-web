require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || 'pollen_dev',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
});

// MVP Test Users with passwords
// See docs/mvp-use-cases.md for user-to-use-case mapping
const USERS = [
  // Main demo user
  { email: 'demo@pollen.dev', password: 'demo123' },
  
  // Test scenario users (all use test123)
  { email: 'fresh-user@test.pollen.dev', password: 'test123' },
  { email: 'active-user@test.pollen.dev', password: 'test123' },
  { email: 'table-limit@test.pollen.dev', password: 'test123' },
  { email: 'storage-limit@test.pollen.dev', password: 'test123' },
  { email: 'error-user@test.pollen.dev', password: 'test123' },
  { email: 'admin@test.pollen.dev', password: 'test123' },
  
  // Legacy demo users
  { email: 'sarah@brightmarketing.com', password: 'demo1234' },
  { email: 'mike@trendyshop.com', password: 'demo1234' },
  { email: 'lisa@globalfinance.com', password: 'demo1234' },
  { email: 'alex@cloudmetrics.io', password: 'demo1234' },
  { email: 'dev@example.com', password: 'demo1234' }
];

(async () => {
  const client = await pool.connect();
  try {
    console.log('[POLLEN] Setting passwords for test users...');
    console.log('');
    for (const u of USERS) {
      const q = await client.query('SELECT id FROM users WHERE lower(email) = lower($1)', [u.email]);
      if (q.rowCount === 0) {
        console.warn(` - SKIP ${u.email}: user not found`);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      await client.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, q.rows[0].id]);
      console.log(` - OK   ${u.email}`);
    }
    console.log('');
    console.log('[POLLEN] Done. All passwords set.');
  } catch (err) {
    console.error('Error setting demo passwords:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
