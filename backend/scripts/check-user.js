require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || 'pollen_dev',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
});

const email = process.argv[2] || 'sarah@brightmarketing.com';

(async () => {
  const client = await pool.connect();
  try {
    console.log(`\n🔍 Looking up user: ${email}\n`);
    
    const userQ = await client.query(`
      SELECT u.id, u.email, u.org_id, u.role, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      WHERE lower(u.email) = lower($1)
    `, [email]);
    
    if (userQ.rowCount === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = userQ.rows[0];
    console.log('User Info:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Org ID: ${user.org_id}`);
    console.log(`  Org Name: ${user.org_name || '(none)'}`);
    
    if (user.org_id) {
      console.log(`\n📦 Data Products for org ${user.org_id}:\n`);
      const productsQ = await client.query(`
        SELECT id, type, template_id, status, refresh_frequency, last_refresh_at
        FROM data_products
        WHERE org_id = $1
        ORDER BY created_at DESC
      `, [user.org_id]);
      
      if (productsQ.rowCount === 0) {
        console.log('  (no products found)');
      } else {
        productsQ.rows.forEach((p, i) => {
          console.log(`  ${i+1}. ${p.type} (${p.template_id}) - ${p.status}`);
          console.log(`     ID: ${p.id}`);
        });
      }
      
      console.log(`\n🔌 Connections for org ${user.org_id}:\n`);
      const connsQ = await client.query(`
        SELECT id, type, label, status, last_tested_at
        FROM data_source_connections
        WHERE org_id = $1
        ORDER BY created_at DESC
      `, [user.org_id]);
      
      if (connsQ.rowCount === 0) {
        console.log('  (no connections found)');
      } else {
        connsQ.rows.forEach((c, i) => {
          console.log(`  ${i+1}. ${c.type}: ${c.label} - ${c.status}`);
          console.log(`     ID: ${c.id}`);
        });
      }
    }
    
    console.log('');
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
