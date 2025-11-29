-- Migration: create metadata schema for One-Click DWH
-- Run this against a Postgres database

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_idx ON organizations (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS organizations_domain_idx ON organizations (lower(domain)) WHERE domain IS NOT NULL;

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  features JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (org_id, subject)
);

-- AdapterConfig
CREATE TABLE IF NOT EXISTS adapter_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (org_id, provider)
);

-- ProvisioningJob
CREATE TABLE IF NOT EXISTS provisioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  adapter_config_id UUID REFERENCES adapter_configs(id) ON DELETE SET NULL,
  provider TEXT,
  requested_by UUID REFERENCES users(id),
  idempotency_key TEXT,
  params JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING',
  last_error TEXT,
  result JSONB,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS provisioning_jobs_org_status_idx ON provisioning_jobs (org_id, status);
CREATE INDEX IF NOT EXISTS provisioning_jobs_idempotency_idx ON provisioning_jobs (idempotency_key);

-- ProvisionedInstance
CREATE TABLE IF NOT EXISTS provisioned_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT,
  name TEXT,
  connection JSONB,
  credential_ref TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX IF NOT EXISTS provisioned_instances_org_name_idx ON provisioned_instances (org_id, name);

-- ETL templates and jobs
CREATE TABLE IF NOT EXISTS etl_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  spec JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS etl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES etl_templates(id) ON DELETE SET NULL,
  params JSONB,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Basic function to update updated_at on change (optional trigger)
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to tables that have updated_at column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_orgs_updated_at') THEN
    CREATE TRIGGER touch_orgs_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_adapter_configs_updated_at') THEN
    CREATE TRIGGER touch_adapter_configs_updated_at BEFORE UPDATE ON adapter_configs FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_provisioning_jobs_updated_at') THEN
    CREATE TRIGGER touch_provisioning_jobs_updated_at BEFORE UPDATE ON provisioning_jobs FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_provisioned_instances_updated_at') THEN
    CREATE TRIGGER touch_provisioned_instances_updated_at BEFORE UPDATE ON provisioned_instances FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
END$$;
