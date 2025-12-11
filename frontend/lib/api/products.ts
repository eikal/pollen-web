/**
 * API client for data products endpoints.
 */

import type {
  DataProduct,
  CreateProductParams,
  KPIMetric,
  UpdateMetricParams,
  RefreshJob,
  APIError,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function createProduct(params: CreateProductParams): Promise<DataProduct> {
  const response = await fetch(`${API_BASE}/api/data-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to create data product');
  }

  return response.json();
}

export async function listProducts(orgId: string, workspaceId?: string): Promise<DataProduct[]> {
  const params = new URLSearchParams({ org_id: orgId });
  if (workspaceId) params.append('workspace_id', workspaceId);

  const response = await fetch(`${API_BASE}/api/data-products?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to list products');
  }

  return response.json();
}

export async function triggerRefresh(productId: string): Promise<RefreshJob> {
  const response = await fetch(`${API_BASE}/api/data-products/${productId}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to trigger refresh');
  }

  return response.json();
}

export async function duplicateProduct(productId: string, userId: string): Promise<DataProduct> {
  const response = await fetch(`${API_BASE}/api/data-products/${productId}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to duplicate product');
  }

  return response.json();
}

export async function updateMetric(
  productId: string,
  metricId: string,
  params: UpdateMetricParams
): Promise<KPIMetric> {
  const response = await fetch(`${API_BASE}/api/data-products/${productId}/metrics/${metricId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to update metric');
  }

  return response.json();
}

export default {
  createProduct,
  listProducts,
  triggerRefresh,
  duplicateProduct,
  updateMetric,
};
