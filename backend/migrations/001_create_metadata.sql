-- Migration 001: Core metadata schema for CSV/Excel Upload MVP
-- Feature: 001-csv-upload-mvp
-- Scope: Auth only (organizations, users)
-- Date: 2025-11-15

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations (MVP: required for auth only)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_idx ON organizations (lower(name));

-- Users (MVP: auth + schema_name for data isolation)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (email)
);

-- Basic function to update updated_at on change
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_orgs_updated_at') THEN
    CREATE TRIGGER touch_orgs_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_users_updated_at') THEN
    CREATE TRIGGER touch_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
END$$;
