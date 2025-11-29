-- Migration: Create data product tables
-- Adds support for data products, KPI metrics, and refresh jobs

-- Data Source Connections (extends provisioned_instances concept for data sources)
CREATE TABLE IF NOT EXISTS data_source_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID, -- Future: link to workspaces table
  type TEXT NOT NULL, -- csv, google_sheets, etc.
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, error, needs_attention
  credential_ref TEXT, -- Indirect reference to stored secret
  last_tested_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_connection_label UNIQUE (org_id, workspace_id, label)
);

CREATE INDEX IF NOT EXISTS data_source_connections_org_workspace_idx 
  ON data_source_connections (org_id, workspace_id);
CREATE INDEX IF NOT EXISTS data_source_connections_status_idx 
  ON data_source_connections (status);

-- Data Products (dashboards, reports, calculators)
CREATE TABLE IF NOT EXISTS data_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID, -- Future: link to workspaces table
  connection_id UUID REFERENCES data_source_connections(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- dashboard, report, calculator
  template_id TEXT NOT NULL, -- e.g., mgmt_weekly_v1, pricing_calc_v1
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, refreshing, updated, needs_attention
  refresh_frequency INTERVAL NOT NULL DEFAULT '1 day',
  last_refresh_at TIMESTAMP WITH TIME ZONE,
  version INT NOT NULL DEFAULT 1,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB, -- Flexible storage for template-specific config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_products_org_workspace_idx 
  ON data_products (org_id, workspace_id);
CREATE INDEX IF NOT EXISTS data_products_status_idx 
  ON data_products (status);
CREATE INDEX IF NOT EXISTS data_products_owner_idx 
  ON data_products (owner_user_id);

-- KPI Metrics (belongs to data products)
CREATE TABLE IF NOT EXISTS kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES data_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  formula_expression TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deprecated_at TIMESTAMP WITH TIME ZONE -- Set when superseded by new version
);

CREATE INDEX IF NOT EXISTS kpi_metrics_product_idx 
  ON kpi_metrics (product_id);
CREATE INDEX IF NOT EXISTS kpi_metrics_active_idx 
  ON kpi_metrics (product_id, deprecated_at) WHERE deprecated_at IS NULL;

-- Refresh Jobs (execution records for product refreshes)
CREATE TABLE IF NOT EXISTS refresh_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES data_products(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  outcome TEXT, -- success, needs_attention, failed
  message TEXT,
  duration_ms INT,
  metadata JSONB -- Additional context (e.g., row counts, errors)
);

CREATE INDEX IF NOT EXISTS refresh_jobs_product_idx 
  ON refresh_jobs (product_id, started_at DESC);
CREATE INDEX IF NOT EXISTS refresh_jobs_outcome_idx 
  ON refresh_jobs (outcome);

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_data_source_connections_updated_at') THEN
    CREATE TRIGGER touch_data_source_connections_updated_at 
      BEFORE UPDATE ON data_source_connections 
      FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_data_products_updated_at') THEN
    CREATE TRIGGER touch_data_products_updated_at 
      BEFORE UPDATE ON data_products 
      FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();
  END IF;
END$$;
