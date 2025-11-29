-- Migration 008: MVP test scenarios seed data
-- Creates multiple test users with different quota states
-- Feature: 001-csv-upload-mvp (MVP Testing)
-- Date: 2025-11-28

-- ==============================================================
-- TEST SCENARIO 1: Fresh user (no uploads yet)
-- ==============================================================
-- User: fresh-user@test.pollen.dev
-- State: Just signed up, no tables, empty quota

WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash)
SELECT 
  org.id, 
  'local:fresh-user@test.pollen.dev', 
  'fresh-user@test.pollen.dev', 
  'Fresh Test User', 
  'member',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForTestUser123'
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fresh-user@test.pollen.dev');

INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 0, 0.0, 1024 FROM users WHERE email = 'fresh-user@test.pollen.dev'
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================
-- TEST SCENARIO 2: Active user with some tables
-- ==============================================================
-- User: active-user@test.pollen.dev
-- State: Has 5 tables, ~100MB used, well within quota

WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash, schema_name)
SELECT 
  org.id, 
  'local:active-user@test.pollen.dev', 
  'active-user@test.pollen.dev', 
  'Active Test User', 
  'member',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForTestUser456',
  'user_active_test'
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'active-user@test.pollen.dev');

INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 5, 102.5, 1024 FROM users WHERE email = 'active-user@test.pollen.dev'
ON CONFLICT (user_id) DO UPDATE SET total_tables = 5, total_size_mb = 102.5;

-- Simulate user_tables metadata for active user
INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
SELECT u.id, 'user_active_test', 'sales_data', 5000, 25.5
FROM users u WHERE u.email = 'active-user@test.pollen.dev'
ON CONFLICT (schema_name, table_name) DO NOTHING;

INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
SELECT u.id, 'user_active_test', 'inventory', 3000, 18.2
FROM users u WHERE u.email = 'active-user@test.pollen.dev'
ON CONFLICT (schema_name, table_name) DO NOTHING;

INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
SELECT u.id, 'user_active_test', 'customers', 2500, 22.8
FROM users u WHERE u.email = 'active-user@test.pollen.dev'
ON CONFLICT (schema_name, table_name) DO NOTHING;

INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
SELECT u.id, 'user_active_test', 'transactions', 10000, 28.0
FROM users u WHERE u.email = 'active-user@test.pollen.dev'
ON CONFLICT (schema_name, table_name) DO NOTHING;

INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
SELECT u.id, 'user_active_test', 'employees', 500, 8.0
FROM users u WHERE u.email = 'active-user@test.pollen.dev'
ON CONFLICT (schema_name, table_name) DO NOTHING;

-- ETL operation history for active user
INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'sales_data', 'success', 5000
FROM users u WHERE u.email = 'active-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'inventory', 'success', 3000
FROM users u WHERE u.email = 'active-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'upsert', 'inventory', 'success', 500
FROM users u WHERE u.email = 'active-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'customers', 'success', 2500
FROM users u WHERE u.email = 'active-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'transactions', 'success', 10000
FROM users u WHERE u.email = 'active-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'employees', 'success', 500
FROM users u WHERE u.email = 'active-user@test.pollen.dev';

-- ==============================================================
-- TEST SCENARIO 3: User near table limit
-- ==============================================================
-- User: table-limit@test.pollen.dev
-- State: Has 18 of 20 tables, testing limit warnings

WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash, schema_name)
SELECT 
  org.id, 
  'local:table-limit@test.pollen.dev', 
  'table-limit@test.pollen.dev', 
  'Table Limit Test User', 
  'member',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForTestUser789',
  'user_table_limit'
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'table-limit@test.pollen.dev');

INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 18, 450.0, 1024 FROM users WHERE email = 'table-limit@test.pollen.dev'
ON CONFLICT (user_id) DO UPDATE SET total_tables = 18, total_size_mb = 450.0;

-- ==============================================================
-- TEST SCENARIO 4: User near storage limit
-- ==============================================================
-- User: storage-limit@test.pollen.dev
-- State: 950MB of 1024MB used (93%), testing storage warnings

WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash, schema_name)
SELECT 
  org.id, 
  'local:storage-limit@test.pollen.dev', 
  'storage-limit@test.pollen.dev', 
  'Storage Limit Test User', 
  'member',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForTestUserABC',
  'user_storage_limit'
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'storage-limit@test.pollen.dev');

INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 8, 950.0, 1024 FROM users WHERE email = 'storage-limit@test.pollen.dev'
ON CONFLICT (user_id) DO UPDATE SET total_tables = 8, total_size_mb = 950.0;

-- ==============================================================
-- TEST SCENARIO 5: User with failed operations
-- ==============================================================
-- User: error-user@test.pollen.dev
-- State: Has some failed ETL operations in history

WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash, schema_name)
SELECT 
  org.id, 
  'local:error-user@test.pollen.dev', 
  'error-user@test.pollen.dev', 
  'Error Test User', 
  'member',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForTestUserDEF',
  'user_error_test'
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'error-user@test.pollen.dev');

INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 2, 45.0, 1024 FROM users WHERE email = 'error-user@test.pollen.dev'
ON CONFLICT (user_id) DO UPDATE SET total_tables = 2, total_size_mb = 45.0;

-- Successful operations
INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'products', 'success', 1000
FROM users u WHERE u.email = 'error-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected)
SELECT u.id, 'insert', 'orders', 'success', 500
FROM users u WHERE u.email = 'error-user@test.pollen.dev';

-- Failed operations
INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected, error_message)
SELECT u.id, 'upsert', 'products', 'failed', 0, 'Column "sku" does not exist for upsert key'
FROM users u WHERE u.email = 'error-user@test.pollen.dev';

INSERT INTO etl_operations (user_id, operation_type, table_name, status, rows_affected, error_message)
SELECT u.id, 'insert', 'bad_data', 'failed', 0, 'Type mismatch: expected INTEGER for column "quantity", got TEXT'
FROM users u WHERE u.email = 'error-user@test.pollen.dev';

-- ==============================================================
-- TEST SCENARIO 6: Power user (admin)
-- ==============================================================
-- User: admin@test.pollen.dev
-- State: Admin user for testing admin features

WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash)
SELECT 
  org.id, 
  'local:admin@test.pollen.dev', 
  'admin@test.pollen.dev', 
  'Admin Test User', 
  'admin',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForAdminUser'
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.pollen.dev');

INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 0, 0.0, 2048 FROM users WHERE email = 'admin@test.pollen.dev'
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================
-- Summary: Test Users Created
-- ==============================================================
-- 1. fresh-user@test.pollen.dev   - New user, no data
-- 2. active-user@test.pollen.dev  - 5 tables, 100MB, healthy
-- 3. table-limit@test.pollen.dev  - 18/20 tables (near limit)
-- 4. storage-limit@test.pollen.dev - 950MB/1GB (93% full)
-- 5. error-user@test.pollen.dev   - Has failed operations
-- 6. admin@test.pollen.dev        - Admin role, 2GB quota
--
-- All test users have password: (use test auth or set via script)
-- ==============================================================
