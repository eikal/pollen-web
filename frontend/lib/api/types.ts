/**
 * Type definitions for API requests and responses.
 */

export type ProductType = 'dashboard' | 'report' | 'calculator';
export type ProductStatus = 'draft' | 'published' | 'refreshing' | 'updated' | 'needs_attention';
export type RefreshOutcome = 'success' | 'needs_attention' | 'failed';
export type ConnectionStatus = 'active' | 'error' | 'needs_attention';
export type Freshness = 'Fresh' | 'Recent' | 'Stale' | 'Unknown';

export interface DataSourceConnection {
  id: string;
  org_id: string;
  workspace_id?: string;
  type: string;
  label: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  error_message?: string;
  credential_ref?: string;
  freshness?: Freshness;
}

export interface DataProduct {
  id: string;
  org_id: string;
  workspace_id?: string;
  connection_id: string;
  type: ProductType;
  template_id?: string;
  status: ProductStatus;
  refresh_frequency: string;
  last_refresh_at?: string;
  version: number;
  owner_user_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface KPIMetric {
  id: string;
  product_id: string;
  name: string;
  formula_expression: string;
  version: number;
  created_at: string;
  deprecated_at?: string;
}

export interface RefreshJob {
  id: string;
  product_id: string;
  started_at: string;
  finished_at?: string;
  outcome?: RefreshOutcome;
  message?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface SchemaField {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface SchemaPreview {
  fields: SchemaField[];
  total_fields: number;
  truncated: boolean;
}

export interface CreateConnectionParams {
  org_id: string;
  workspace_id?: string;
  type: string;
  label: string;
  credential_ref?: string;
}

export interface CreateProductParams {
  org_id: string;
  workspace_id?: string;
  connection_id: string;
  type: ProductType;
  template_id?: string;
  owner_user_id: string;
  metadata?: Record<string, any>;
}

export interface UpdateMetricParams {
  name?: string;
  formula_expression?: string;
}

export interface APIError {
  error: string;
}
