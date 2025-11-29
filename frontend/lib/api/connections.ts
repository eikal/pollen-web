/**
 * API client for connections endpoints.
 */

import type {
  DataSourceConnection,
  CreateConnectionParams,
  SchemaPreview,
  APIError,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function createConnection(
  params: CreateConnectionParams
): Promise<DataSourceConnection> {
  const response = await fetch(`${API_BASE}/api/connections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to create connection');
  }

  return response.json();
}

export async function listConnections(
  orgId: string,
  workspaceId?: string
): Promise<DataSourceConnection[]> {
  const params = new URLSearchParams({ org_id: orgId });
  if (workspaceId) params.append('workspace_id', workspaceId);

  const response = await fetch(`${API_BASE}/api/connections?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to list connections');
  }

  return response.json();
}

export async function getConnectionSchema(connectionId: string): Promise<SchemaPreview> {
  const response = await fetch(`${API_BASE}/api/connections/${connectionId}/schema`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to retrieve schema');
  }

  return response.json();
}

export default {
  createConnection,
  listConnections,
  getConnectionSchema,
};
