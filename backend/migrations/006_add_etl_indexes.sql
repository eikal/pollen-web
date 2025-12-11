-- Migration 006: Add indexes for ETL metadata tables
-- Feature: 001-csv-upload-mvp
-- Date: 2025-11-15

-- Indexes for user_tables (for fast user-scoped queries)
CREATE INDEX IF NOT EXISTS user_tables_user_id_idx ON user_tables(user_id);
CREATE INDEX IF NOT EXISTS user_tables_schema_name_idx ON user_tables(schema_name);

-- Indexes for etl_operations (for audit log queries)
CREATE INDEX IF NOT EXISTS etl_operations_user_id_idx ON etl_operations(user_id);
CREATE INDEX IF NOT EXISTS etl_operations_created_at_idx ON etl_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS etl_operations_table_name_idx ON etl_operations(table_name);

-- Indexes for upload_sessions (for session status queries)
CREATE INDEX IF NOT EXISTS upload_sessions_user_id_idx ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS upload_sessions_status_idx ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS upload_sessions_created_at_idx ON upload_sessions(created_at DESC);

-- Index for users.schema_name (for fast schema lookup)
CREATE INDEX IF NOT EXISTS users_schema_name_idx ON users(schema_name) WHERE schema_name IS NOT NULL;

COMMENT ON INDEX user_tables_user_id_idx IS 'Fast lookup of tables by user';
COMMENT ON INDEX etl_operations_created_at_idx IS 'Fast sorting for operation history (newest first)';
COMMENT ON INDEX upload_sessions_status_idx IS 'Fast filtering for cleanup jobs (completed/failed sessions)';
