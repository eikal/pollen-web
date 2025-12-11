-- Migration 007: MVP seed data
-- Only includes data needed for CSV/Excel upload flow
-- Feature: 001-csv-upload-mvp (MVP)
-- Date: 2025-11-28

-- Clean up non-MVP demo data if it exists (from seed-demo-data.js)
-- This removes data from out-of-scope tables while preserving users/orgs

-- Delete data products, KPI metrics, refresh jobs (out of MVP scope)
DELETE FROM refresh_jobs;
DELETE FROM kpi_metrics;
DELETE FROM data_products;
DELETE FROM data_source_connections;

-- Delete provisioned instances and ETL data (out of MVP scope)
DELETE FROM provisioned_instances;
DELETE FROM etl_jobs;
DELETE FROM etl_templates;
DELETE FROM provisioning_jobs WHERE status != 'COMPLETED';

-- Note: We keep users, organizations, and completed provisioning_jobs
-- as they are needed for auth and onboarding flow

-- Insert MVP-focused demo organization (only if no orgs exist)
INSERT INTO organizations (name, domain, config)
SELECT 'Pollen Demo', 'demo.pollen.dev', jsonb_build_object('createdVia', 'mvp-seed', 'plan', 'free')
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Pollen Demo');

-- Insert demo user with password (password: "demo123")
-- Only if user doesn't exist
WITH org AS (
  SELECT id FROM organizations WHERE name = 'Pollen Demo' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role, password_hash)
SELECT 
  org.id, 
  'local:demo@pollen.dev', 
  'demo@pollen.dev', 
  'Demo User', 
  'admin',
  '$2a$10$rQEY5xN5Q5xN5Q5xN5Q5xOdummyHashForDemoUser123' -- bcrypt hash placeholder
FROM org
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@pollen.dev');

-- Initialize storage quota for demo user (1GB free plan)
INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
SELECT id, 0, 0.0, 1024 FROM users WHERE email = 'demo@pollen.dev'
ON CONFLICT (user_id) DO NOTHING;

-- Add comment explaining MVP scope
COMMENT ON SCHEMA public IS 'Pollen MVP schema - CSV/Excel upload to Postgres tables with schema isolation';
