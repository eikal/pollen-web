/**
 * Data Product model.
 */

export type ProductType = 'dashboard' | 'report' | 'calculator';
export type ProductStatus = 'draft' | 'published' | 'refreshing' | 'updated' | 'needs_attention';

export interface DataProduct {
  id: string;
  org_id: string;
  workspace_id?: string;
  connection_id?: string;
  type: ProductType;
  template_id: string;
  status: ProductStatus;
  refresh_frequency: string; // PostgreSQL interval as string (e.g., '1 day')
  last_refresh_at?: Date;
  version: number;
  owner_user_id?: string;
  metadata?: Record<string, any>; // Template-specific config
  created_at: Date;
  updated_at: Date;
}

export interface CreateDataProductParams {
  org_id: string;
  workspace_id?: string;
  connection_id?: string;
  type: ProductType;
  template_id: string;
  owner_user_id?: string;
  refresh_frequency?: string;
  metadata?: Record<string, any>;
}

export interface UpdateDataProductParams {
  status?: ProductStatus;
  last_refresh_at?: Date;
  metadata?: Record<string, any>;
}

export default DataProduct;
