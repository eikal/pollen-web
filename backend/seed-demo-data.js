/**
 * Seed script for demo data - showcases different use cases for the data products platform.
 * 
 * Use Cases Demonstrated:
 * 1. Small Business (Marketing Agency) - CSV files, weekly reports
 * 2. Medium Business (E-commerce) - Multiple sources, daily dashboards
 * 3. Existing Data Team (Finance) - Environment inventory with stale connections
 * 4. Startup (SaaS) - Real-time calculator, frequent refreshes
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pollen_dev'
});

async function seedData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting seed process...\n');
    
    // ============================================================
    // USE CASE 1: Small Marketing Agency
    // ============================================================
    console.log('📊 USE CASE 1: Small Marketing Agency');
    console.log('   Scenario: First-time user, wants weekly campaign reports from CSV files');
    
    // Create organization
    const org1Result = await client.query(
      `INSERT INTO organizations (name, domain, config) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['Bright Marketing Agency', 'brightmarketing.com', { createdVia: 'onboarding', plan: 'starter' }]
    );
    const org1Id = org1Result.rows[0].id;
    console.log(`   ✓ Created org: ${org1Id}`);
    
    // Create user
    const user1Result = await client.query(
      `INSERT INTO users (org_id, subject, email, display_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [org1Id, 'demo:sarah', 'sarah@brightmarketing.com', 'Sarah Chen', 'admin']
    );
    const user1Id = user1Result.rows[0].id;
    console.log(`   ✓ Created user: sarah@brightmarketing.com`);
    
    // Create connections (Fresh CSV files)
    const conn1aResult = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '2 hours') 
       RETURNING id`,
      [org1Id, 'csv', 'Google Ads Campaign Data', 'active']
    );
    const conn1a = conn1aResult.rows[0].id;
    
    const conn1bResult = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '8 hours') 
       RETURNING id`,
      [org1Id, 'csv', 'Facebook Ads Performance', 'active']
    );
    const conn1b = conn1bResult.rows[0].id;
    console.log(`   ✓ Created 2 connections (Fresh - tested recently)`);
    
    // Create weekly dashboard
    const product1Result = await client.query(
      `INSERT INTO data_products 
         (org_id, connection_id, type, template_id, status, refresh_frequency, last_refresh_at, version, owner_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '1 day', 1, $7, $8)
       RETURNING id`,
      [
        org1Id, 
        conn1a, 
        'dashboard', 
        'weekly_marketing_performance', 
        'updated', 
        '7 days', 
        user1Id,
        JSON.stringify({ description: 'Weekly campaign performance overview', autoRefresh: true })
      ]
    );
    const product1Id = product1Result.rows[0].id;
    
    // Add KPI metrics
    await client.query(
      `INSERT INTO kpi_metrics (product_id, name, formula_expression, version)
       VALUES 
         ($1, 'Total Impressions', 'SUM(impressions)', 1),
         ($1, 'Total Clicks', 'SUM(clicks)', 1),
         ($1, 'Click-Through Rate', 'SUM(clicks) / SUM(impressions)', 1),
         ($1, 'Cost Per Click', 'SUM(cost) / SUM(clicks)', 1)`,
      [product1Id]
    );
    console.log(`   ✓ Created dashboard with 4 KPI metrics\n`);
    
    // ============================================================
    // USE CASE 2: Medium E-commerce Business
    // ============================================================
    console.log('🛒 USE CASE 2: Medium E-commerce Business');
    console.log('   Scenario: Daily sales dashboard with multiple data sources');
    
    const org2Result = await client.query(
      `INSERT INTO organizations (name, domain, config) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['TrendyShop Online', 'trendyshop.com', { createdVia: 'platform', plan: 'professional' }]
    );
    const org2Id = org2Result.rows[0].id;
    
    const user2Result = await client.query(
      `INSERT INTO users (org_id, subject, email, display_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [org2Id, 'demo:mike', 'mike@trendyshop.com', 'Mike Rodriguez', 'admin']
    );
    const user2Id = user2Result.rows[0].id;
    console.log(`   ✓ Created org and user: mike@trendyshop.com`);
    
    // Multiple connections with varying freshness
    const conn2aResult = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '30 minutes') 
       RETURNING id`,
      [org2Id, 'google-sheets', 'Sales Orders', 'active']
    );
    const conn2a = conn2aResult.rows[0].id;
    
    const conn2bResult = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '50 hours') 
       RETURNING id`,
      [org2Id, 'csv', 'Product Inventory', 'active']
    );
    const conn2b = conn2bResult.rows[0].id;
    
    const conn2cResult = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '25 hours') 
       RETURNING id`,
      [org2Id, 'google-sheets', 'Customer Reviews', 'active']
    );
    const conn2c = conn2cResult.rows[0].id;
    console.log(`   ✓ Created 3 connections (Fresh, Recent, Recent)`);
    
    // Create daily dashboard (currently refreshing)
    const product2aResult = await client.query(
      `INSERT INTO data_products 
         (org_id, connection_id, type, template_id, status, refresh_frequency, last_refresh_at, version, owner_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '3 hours', 1, $7, $8)
       RETURNING id`,
      [
        org2Id, 
        conn2a, 
        'dashboard', 
        'daily_sales_dashboard', 
        'refreshing', 
        '1 day', 
        user2Id,
        JSON.stringify({ description: 'Daily sales and revenue tracking', autoRefresh: true })
      ]
    );
    const product2aId = product2aResult.rows[0].id;
    
    await client.query(
      `INSERT INTO kpi_metrics (product_id, name, formula_expression, version)
       VALUES 
         ($1, 'Daily Revenue', 'SUM(order_total)', 1),
         ($1, 'Average Order Value', 'SUM(order_total) / SUM(order_count)', 1),
         ($1, 'Total Orders', 'SUM(order_count)', 1)`,
      [product2aId]
    );
    
    // Create inventory calculator (draft)
    const product2bResult = await client.query(
      `INSERT INTO data_products 
         (org_id, connection_id, type, template_id, status, refresh_frequency, version, owner_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8)
       RETURNING id`,
      [
        org2Id, 
        conn2b, 
        'calculator', 
        'inventory_reorder_calculator', 
        'draft', 
        '6 hours', 
        user2Id,
        JSON.stringify({ description: 'Calculate optimal reorder quantities', autoRefresh: false })
      ]
    );
    const product2bId = product2bResult.rows[0].id;
    
    await client.query(
      `INSERT INTO kpi_metrics (product_id, name, formula_expression, version)
       VALUES 
         ($1, 'Reorder Quantity', 'SUM(lead_time_demand) + SUM(safety_stock)', 1),
         ($1, 'Days Until Stockout', 'SUM(current_stock) / SUM(daily_sales)', 1)`,
      [product2bId]
    );
    
    console.log(`   ✓ Created 2 products: 1 refreshing dashboard, 1 draft calculator\n`);
    
    // Create refresh jobs to show history
    await client.query(
      `INSERT INTO refresh_jobs (product_id, started_at, finished_at, outcome, duration_ms, message)
       VALUES 
         ($1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 58 minutes', 'success', 120000, 'Refresh completed successfully'),
         ($1, NOW() - INTERVAL '1 day 3 hours', NOW() - INTERVAL '1 day 2 hours 57 minutes', 'success', 180000, 'Refresh completed successfully'),
         ($1, NOW() - INTERVAL '2 days 3 hours', NOW() - INTERVAL '2 days 2 hours 59 minutes', 'success', 60000, 'Refresh completed successfully')`,
      [product2aId]
    );
    console.log(`   ✓ Created refresh job history (3 successful runs)\n`);
    
    // ============================================================
    // USE CASE 3: Finance Team with Existing Infrastructure
    // ============================================================
    console.log('💰 USE CASE 3: Finance Department (Existing Data Tools)');
    console.log('   Scenario: Team wants to inventory existing connections and see what needs attention');
    
    const org3Result = await client.query(
      `INSERT INTO organizations (name, domain, config) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['Global Finance Corp', 'globalfinance.com', { createdVia: 'platform', plan: 'enterprise' }]
    );
    const org3Id = org3Result.rows[0].id;
    
    const user3Result = await client.query(
      `INSERT INTO users (org_id, subject, email, display_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [org3Id, 'demo:lisa', 'lisa@globalfinance.com', 'Lisa Wang', 'admin']
    );
    const user3Id = user3Result.rows[0].id;
    console.log(`   ✓ Created org and user: lisa@globalfinance.com`);
    
    // Create diverse connections showing different freshness states
    await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES 
         ($1, 'snowflake', 'Production DWH', 'active', NOW() - INTERVAL '5 hours'),
         ($1, 'bigquery', 'Analytics Warehouse', 'active', NOW() - INTERVAL '15 hours'),
         ($1, 'google-sheets', 'Budget Tracker 2024', 'active', NOW() - INTERVAL '48 hours'),
         ($1, 'csv', 'Q3 Expense Reports', 'active', NOW() - INTERVAL '96 hours'),
         ($1, 'snowflake', 'Legacy Reports DB', 'needs_attention', NOW() - INTERVAL '168 hours'),
         ($1, 'csv', 'Old Sales Data', 'active', NULL)`,
      [org3Id]
    );
    console.log(`   ✓ Created 6 connections with varying freshness:`);
    console.log(`     - 1 Fresh (< 24h)`);
    console.log(`     - 2 Recent (24-72h)`);
    console.log(`     - 2 Stale (> 72h)`);
    console.log(`     - 1 Unknown (never tested)\n`);
    
    // ============================================================
    // USE CASE 4: Fast-Growing SaaS Startup
    // ============================================================
    console.log('🚀 USE CASE 4: SaaS Startup (High-Frequency Updates)');
    console.log('   Scenario: Real-time pricing calculator with frequent refreshes');
    
    const org4Result = await client.query(
      `INSERT INTO organizations (name, domain, config) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['CloudMetrics SaaS', 'cloudmetrics.io', { createdVia: 'onboarding', plan: 'professional' }]
    );
    const org4Id = org4Result.rows[0].id;
    
    const user4Result = await client.query(
      `INSERT INTO users (org_id, subject, email, display_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [org4Id, 'demo:alex', 'alex@cloudmetrics.io', 'Alex Thompson', 'admin']
    );
    const user4Id = user4Result.rows[0].id;
    console.log(`   ✓ Created org and user: alex@cloudmetrics.io`);
    
    const conn4Result = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '15 minutes') 
       RETURNING id`,
      [org4Id, 'google-sheets', 'Real-time Cost Data', 'active']
    );
    const conn4Id = conn4Result.rows[0].id;
    
    // Create pricing calculator with high refresh frequency
    const product4Result = await client.query(
      `INSERT INTO data_products 
         (org_id, connection_id, type, template_id, status, refresh_frequency, last_refresh_at, version, owner_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '25 minutes', 1, $7, $8)
       RETURNING id`,
      [
        org4Id, 
        conn4Id, 
        'calculator', 
        'dynamic_pricing_calculator', 
        'updated', 
        '30 minutes', 
        user4Id,
        JSON.stringify({ description: 'Dynamic SaaS pricing based on resource costs', autoRefresh: true })
      ]
    );
    const product4Id = product4Result.rows[0].id;
    
    await client.query(
      `INSERT INTO kpi_metrics (product_id, name, formula_expression, version)
       VALUES 
         ($1, 'Base Price', 'SUM(compute_cost) + SUM(storage_cost)', 1),
         ($1, 'Markup Factor', 'SUM(base_price) * 1.4', 1),
         ($1, 'Recommended Price', 'SUM(markup_factor) + SUM(support_cost)', 1)`,
      [product4Id]
    );
    
    // Show hitting rate limit
    await client.query(
      `INSERT INTO refresh_jobs (product_id, started_at, finished_at, outcome, duration_ms, message)
       VALUES 
         ($1, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '24 minutes 55 seconds', 'success', 5000, 'Refresh completed'),
         ($1, NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '54 minutes 50 seconds', 'success', 10000, 'Refresh completed'),
         ($1, NOW() - INTERVAL '1 hour 25 minutes', NOW() - INTERVAL '1 hour 24 minutes 58 seconds', 'success', 2000, 'Refresh completed'),
         ($1, NOW() - INTERVAL '1 hour 55 minutes', NOW() - INTERVAL '1 hour 54 minutes 52 seconds', 'success', 8000, 'Refresh completed'),
         ($1, NOW() - INTERVAL '2 hours 25 minutes', NOW() - INTERVAL '2 hours 24 minutes 55 seconds', 'success', 5000, 'Refresh completed')`,
      [product4Id]
    );
    console.log(`   ✓ Created high-frequency calculator`);
    console.log(`   ✓ Created 5 recent refresh jobs (demonstrating rate limiting)\n`);
    
    // ============================================================
    // USE CASE 5: Product with Needs Attention Status
    // ============================================================
    console.log('⚠️  USE CASE 5: Product Requiring Attention');
    console.log('   Scenario: Report with failed refresh that needs user intervention');
    
    const conn5Result = await client.query(
      `INSERT INTO data_source_connections (org_id, type, label, status, last_tested_at, error_message) 
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '12 hours', $5) 
       RETURNING id`,
      [org2Id, 'csv', 'Monthly Revenue Report', 'error', 'File format changed - unexpected column names']
    );
    const conn5Id = conn5Result.rows[0].id;
    
    const product5Result = await client.query(
      `INSERT INTO data_products 
         (org_id, connection_id, type, template_id, status, refresh_frequency, last_refresh_at, version, owner_user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '12 hours', 1, $7, $8)
       RETURNING id`,
      [
        org2Id, 
        conn5Id, 
        'report', 
        'monthly_revenue_report', 
        'needs_attention', 
        '1 month', 
        user2Id,
        JSON.stringify({ description: 'Monthly revenue breakdown by product category', autoRefresh: true })
      ]
    );
    const product5Id = product5Result.rows[0].id;
    
    await client.query(
      `INSERT INTO kpi_metrics (product_id, name, formula_expression, version)
       VALUES 
         ($1, 'Total Revenue', 'SUM(revenue)', 1),
         ($1, 'Revenue Growth', 'SUM(revenue) / SUM(previous_revenue)', 1)`,
      [product5Id]
    );
    
    await client.query(
      `INSERT INTO refresh_jobs (product_id, started_at, finished_at, outcome, duration_ms, message)
       VALUES 
         ($1, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours' + INTERVAL '5 seconds', 'needs_attention', 5000, 'Column mismatch: Expected column "product_category" but found "category"'),
         ($1, NOW() - INTERVAL '1 month 12 hours', NOW() - INTERVAL '1 month 12 hours' + INTERVAL '3 seconds', 'success', 3000, 'Refresh completed')`,
      [product5Id]
    );
    console.log(`   ✓ Created report with "needs_attention" status`);
    console.log(`   ✓ Created connection with error status\n`);
    
    await client.query('COMMIT');
    
    console.log('✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - 4 Organizations');
    console.log('   - 4 Users');
    console.log('   - 12 Data Source Connections (varying freshness)');
    console.log('   - 6 Data Products (dashboards, reports, calculators)');
    console.log('   - 15 KPI Metrics');
    console.log('   - 10 Refresh Jobs (showing history)\n');
    
    console.log('🎯 Demo Scenarios Ready:');
    console.log('   1. Small business weekly marketing dashboard');
    console.log('   2. E-commerce with multiple sources (1 refreshing, 1 draft)');
    console.log('   3. Finance team environment inventory (all freshness states)');
    console.log('   4. SaaS startup with high-frequency calculator (rate limiting demo)');
    console.log('   5. Failed refresh requiring attention\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData()
  .then(() => {
    console.log('👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
