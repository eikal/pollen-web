-- Migration 009: Drop out-of-scope tables for MVP
-- Feature: 001-csv-upload-mvp cleanup
-- Date: 2025-11-29
-- Purpose: Remove tables not used in CSV/Excel upload MVP

-- Drop tables from 004_create_data_products.sql (not in MVP scope)
DROP TABLE IF EXISTS refresh_jobs CASCADE;
DROP TABLE IF EXISTS kpi_metrics CASCADE;
DROP TABLE IF EXISTS data_products CASCADE;
DROP TABLE IF EXISTS data_source_connections CASCADE;

-- Drop tables from 001_create_metadata.sql (not in MVP scope)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS etl_jobs CASCADE;
DROP TABLE IF EXISTS etl_templates CASCADE;
DROP TABLE IF EXISTS provisioned_instances CASCADE;
DROP TABLE IF EXISTS provisioning_jobs CASCADE;
DROP TABLE IF EXISTS adapter_configs CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- Remove unnecessary columns from organizations
ALTER TABLE organizations DROP COLUMN IF EXISTS domain CASCADE;
ALTER TABLE organizations DROP COLUMN IF EXISTS config CASCADE;
DROP INDEX IF EXISTS organizations_domain_idx;

-- Remove unnecessary columns from users
ALTER TABLE users DROP COLUMN IF EXISTS subject CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_org_id_subject_key;

COMMENT ON SCHEMA public IS 'MVP Schema: CSV/Excel upload to per-user PostgreSQL schemas';
