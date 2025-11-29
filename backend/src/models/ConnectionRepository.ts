/**
 * Data Source Connection repository for database operations.
 */

import { query } from '../services/db';
import DataSourceConnection, { CreateConnectionParams } from '../models/DataSourceConnection';

/**
 * Create a new data source connection.
 */
export async function createConnection(params: CreateConnectionParams): Promise<DataSourceConnection> {
  const result = await query<DataSourceConnection>(
    `INSERT INTO data_source_connections 
      (org_id, workspace_id, type, label, credential_ref) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [
      params.org_id,
      params.workspace_id || null,
      params.type,
      params.label,
      params.credential_ref || null
    ]
  );

  return result.rows[0];
}

/**
 * Get a connection by ID.
 */
export async function getConnectionById(connectionId: string): Promise<DataSourceConnection | null> {
  const result = await query<DataSourceConnection>(
    'SELECT * FROM data_source_connections WHERE id = $1',
    [connectionId]
  );

  return result.rows[0] || null;
}

/**
 * List connections for a workspace.
 */
export async function listConnectionsByWorkspace(
  orgId: string,
  workspaceId?: string
): Promise<DataSourceConnection[]> {
  const result = await query<DataSourceConnection>(
    `SELECT * FROM data_source_connections 
     WHERE org_id = $1 AND ($2::UUID IS NULL OR workspace_id = $2)
     ORDER BY created_at DESC`,
    [orgId, workspaceId || null]
  );

  return result.rows;
}

/**
 * Update connection status and error message.
 */
export async function updateConnectionStatus(
  connectionId: string,
  status: DataSourceConnection['status'],
  errorMessage?: string
): Promise<DataSourceConnection> {
  const result = await query<DataSourceConnection>(
    `UPDATE data_source_connections 
     SET status = $2, error_message = $3, last_tested_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [connectionId, status, errorMessage || null]
  );

  return result.rows[0];
}

/**
 * Calculate freshness classification for connections.
 */
export interface ConnectionWithFreshness extends DataSourceConnection {
  freshness: 'Fresh' | 'Recent' | 'Stale' | 'Unknown';
}

export async function listConnectionsWithFreshness(
  orgId: string,
  workspaceId?: string
): Promise<ConnectionWithFreshness[]> {
  const result = await query<DataSourceConnection>(
    `SELECT * FROM data_source_connections 
     WHERE org_id = $1 AND ($2::UUID IS NULL OR workspace_id = $2)
     ORDER BY created_at DESC`,
    [orgId, workspaceId || null]
  );

  return result.rows.map(conn => ({
    ...conn,
    freshness: calculateFreshness(conn.last_tested_at)
  }));
}

function calculateFreshness(lastTestedAt?: Date): 'Fresh' | 'Recent' | 'Stale' | 'Unknown' {
  if (!lastTestedAt) return 'Unknown';

  const now = new Date();
  const ageHours = (now.getTime() - new Date(lastTestedAt).getTime()) / (1000 * 60 * 60);

  if (ageHours <= 24) return 'Fresh';
  if (ageHours <= 72) return 'Recent';
  return 'Stale';
}

export default {
  createConnection,
  getConnectionById,
  listConnectionsByWorkspace,
  updateConnectionStatus,
  listConnectionsWithFreshness
};
