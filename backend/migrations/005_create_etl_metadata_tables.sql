-- Migration 001: Create metadata tables for CSV/Excel ETL service
-- Feature: 001-csv-upload-mvp
-- Date: 2025-11-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add schema_name column to existing users table
-- (Assumes users table exists from previous migrations)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS schema_name VARCHAR(63) UNIQUE;

-- Create user_tables metadata table
CREATE TABLE IF NOT EXISTS user_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schema_name VARCHAR(63) NOT NULL,
    table_name VARCHAR(63) NOT NULL,
    row_count BIGINT DEFAULT 0,
    size_mb DECIMAL(10,2) DEFAULT 0.0,
    last_updated_at TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(schema_name, table_name)
);

-- Create etl_operations audit log table
CREATE TABLE IF NOT EXISTS etl_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('insert', 'upsert', 'delete', 'drop', 'truncate')),
    table_name VARCHAR(63) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    rows_affected INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create storage_quota table
CREATE TABLE IF NOT EXISTS storage_quota (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_tables INTEGER DEFAULT 0,
    total_size_mb DECIMAL(10,2) DEFAULT 0.0,
    limit_mb INTEGER DEFAULT 1024,  -- 1GB free plan limit
    last_calculated_at TIMESTAMP DEFAULT now()
);

-- Create upload_sessions table for temporary upload state
CREATE TABLE IF NOT EXISTS upload_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create trigger to update last_updated_at on user_tables
CREATE OR REPLACE FUNCTION update_user_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_tables_last_updated ON user_tables;
CREATE TRIGGER update_user_tables_last_updated
    BEFORE UPDATE ON user_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tables_timestamp();

-- Create trigger to update upload_sessions updated_at
CREATE OR REPLACE FUNCTION update_upload_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_upload_sessions_updated_at ON upload_sessions;
CREATE TRIGGER update_upload_sessions_updated_at
    BEFORE UPDATE ON upload_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_upload_sessions_timestamp();

COMMENT ON TABLE user_tables IS 'Metadata tracking for user-created tables in per-user schemas';
COMMENT ON TABLE etl_operations IS 'Audit log for all ETL operations (90-day retention)';
COMMENT ON TABLE storage_quota IS 'Per-user storage consumption tracking (20 tables, 1GB limit)';
COMMENT ON TABLE upload_sessions IS 'Temporary state for ongoing file uploads (1-hour TTL)';
