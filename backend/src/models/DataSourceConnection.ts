/**
 * Data Source Connection model.
 */

export interface DataSourceConnection {
  id: string;
  org_id: string;
  workspace_id?: string;
  type: string; // csv, google_sheets, etc.
  label: string;
  status: 'active' | 'error' | 'needs_attention';
  credential_ref?: string;
  last_tested_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConnectionParams {
  org_id: string;
  workspace_id?: string;
  type: string;
  label: string;
  credential_ref?: string;
}

export default DataSourceConnection;
