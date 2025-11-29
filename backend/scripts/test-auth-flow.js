/**
 * Quick test script to verify auth flow and data products API.
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';
const TEST_USER = {
  email: 'sarah@brightmarketing.com',
  password: 'demo1234'
};

async function test() {
  console.log('🧪 Testing auth flow and data products API\n');
  
  // Step 1: Login
  console.log('1. Logging in as', TEST_USER.email);
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });
  
  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    process.exit(1);
  }
  
  const loginData = await loginRes.json();
  console.log('✓ Login successful');
  console.log('  Token:', loginData.token.substring(0, 20) + '...');
  console.log('  User:', loginData.user);
  
  const token = loginData.token;
  
  // Step 2: Get user info with org_id
  console.log('\n2. Getting user info with org_id');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!meRes.ok) {
    console.error('❌ /auth/me failed:', await meRes.text());
    process.exit(1);
  }
  
  const meData = await meRes.json();
  console.log('✓ User info retrieved');
  console.log('  User ID:', meData.user.id);
  console.log('  Email:', meData.user.email);
  console.log('  Org ID:', meData.user.orgId);
  
  const orgId = meData.user.orgId;
  
  if (!orgId) {
    console.error('❌ User has no org_id!');
    process.exit(1);
  }
  
  // Step 3: Get data products
  console.log('\n3. Getting data products for org', orgId);
  const productsRes = await fetch(`${API_BASE}/api/data-products?org_id=${orgId}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!productsRes.ok) {
    console.error('❌ Products API failed:', await productsRes.text());
    process.exit(1);
  }
  
  const products = await productsRes.json();
  console.log('✓ Data products retrieved');
  console.log('  Count:', products.length);
  
  if (products.length > 0) {
    console.log('\n  Products:');
    products.forEach((p, i) => {
      console.log(`    ${i+1}. ${p.type} (${p.template_id}) - ${p.status}`);
      console.log(`       ID: ${p.id}`);
    });
  }
  
  // Step 4: Get connections
  console.log('\n4. Getting connections for org', orgId);
  const connsRes = await fetch(`${API_BASE}/api/connections?org_id=${orgId}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!connsRes.ok) {
    console.error('❌ Connections API failed:', await connsRes.text());
    process.exit(1);
  }
  
  const connections = await connsRes.json();
  console.log('✓ Connections retrieved');
  console.log('  Count:', connections.length);
  
  if (connections.length > 0) {
    console.log('\n  Connections:');
    connections.forEach((c, i) => {
      console.log(`    ${i+1}. ${c.type}: ${c.label} - ${c.status}`);
      console.log(`       Freshness: ${c.freshness || 'Unknown'}`);
    });
  }
  
  console.log('\n✅ All tests passed! The frontend should now work correctly.\n');
}

test().catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});
