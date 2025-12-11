/**
 * Table model for managing user_tables metadata.
 * Tracks metadata about tables created in user schemas.
 */

import { query, queryInUserSchema } from '../services/db';
import * as log from '../services/log';

export interface TableMetadata {
  id: number;
  userId: string;
  schemaName: string;
  tableName: string;
  rowCount: number;
  sizeMb: number;
  lastUpdatedAt: Date;
  createdAt: Date;
}

export interface CreateTableParams {
  userId: string;
  schemaName: string;
  tableName: string;
  rowCount?: number;
  sizeMb?: number;
}

/**
 * Insert a new table metadata record.
 */
export async function insertTableMetadata(params: CreateTableParams): Promise<number> {
  const { userId, schemaName, tableName, rowCount = 0, sizeMb = 0 } = params;

  try {
    const result = await query<{ id: number }>(
      `INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, schemaName, tableName, rowCount, sizeMb]
    );

    log.info('Inserted table metadata', {
      userId,
      schemaName,
      tableName,
      tableId: result.rows[0].id,
    });

    return result.rows[0].id;
  } catch (error) {
    log.error('Failed to insert table metadata', {
      userId,
      schemaName,
      tableName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get table metadata by ID.
 */
export async function getTableById(tableId: number): Promise<TableMetadata | null> {
  const result = await query<TableMetadata>(
    `SELECT id, user_id as "userId", schema_name as "schemaName", 
            table_name as "tableName", row_count as "rowCount", 
            size_mb as "sizeMb", last_updated_at as "lastUpdatedAt", 
            created_at as "createdAt"
     FROM user_tables 
     WHERE id = $1`,
    [tableId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get table metadata by user ID and table name.
 */
export async function getTableByName(
  userId: string,
  tableName: string
): Promise<TableMetadata | null> {
  const result = await query<TableMetadata>(
    `SELECT id, user_id as "userId", schema_name as "schemaName", 
            table_name as "tableName", row_count as "rowCount", 
            size_mb as "sizeMb", last_updated_at as "lastUpdatedAt", 
            created_at as "createdAt"
     FROM user_tables 
     WHERE user_id = $1 AND table_name = $2`,
    [userId, tableName]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * List all tables for a user.
 */
export async function listTablesForUser(userId: string): Promise<TableMetadata[]> {
  const result = await query<TableMetadata>(
    `SELECT id, user_id as "userId", schema_name as "schemaName", 
            table_name as "tableName", row_count as "rowCount", 
            size_mb as "sizeMb", last_updated_at as "lastUpdatedAt", 
            created_at as "createdAt"
     FROM user_tables 
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Update row count for a table.
 */
export async function updateRowCount(tableId: number, rowCount: number): Promise<void> {
  try {
    await query(
      `UPDATE user_tables 
       SET row_count = $1, last_updated_at = NOW()
       WHERE id = $2`,
      [rowCount, tableId]
    );

    log.info('Updated table row count', { tableId, rowCount });
  } catch (error) {
    log.error('Failed to update row count', {
      tableId,
      rowCount,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Update size in MB for a table.
 */
export async function updateSize(tableId: number, sizeMb: number): Promise<void> {
  try {
    await query(
      `UPDATE user_tables 
       SET size_mb = $1, last_updated_at = NOW()
       WHERE id = $2`,
      [sizeMb, tableId]
    );

    log.info('Updated table size', { tableId, sizeMb });
  } catch (error) {
    log.error('Failed to update table size', {
      tableId,
      sizeMb,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Update both row count and size for a table.
 */
export async function updateTableStats(
  tableId: number,
  rowCount: number,
  sizeMb: number
): Promise<void> {
  try {
    await query(
      `UPDATE user_tables 
       SET row_count = $1, size_mb = $2, last_updated_at = NOW()
       WHERE id = $3`,
      [rowCount, sizeMb, tableId]
    );

    log.info('Updated table stats', { tableId, rowCount, sizeMb });
  } catch (error) {
    log.error('Failed to update table stats', {
      tableId,
      rowCount,
      sizeMb,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Delete table metadata.
 * NOTE: This only deletes metadata, not the actual PostgreSQL table.
 */
export async function deleteTableMetadata(tableId: number): Promise<void> {
  try {
    await query('DELETE FROM user_tables WHERE id = $1', [tableId]);

    log.info('Deleted table metadata', { tableId });
  } catch (error) {
    log.error('Failed to delete table metadata', {
      tableId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Calculate actual table size from PostgreSQL.
 * Uses pg_total_relation_size to get table + indexes + TOAST size.
 */
export async function calculateActualSize(
  schemaName: string,
  tableName: string
): Promise<number> {
  const result = await queryInUserSchema<{ size_bytes: number }>(
    schemaName,
    `SELECT pg_total_relation_size($1 || '.' || $2) as size_bytes`,
    [schemaName, tableName]
  );

  const sizeBytes = result.rows[0].size_bytes;
  const sizeMb = sizeBytes / (1024 * 1024);

  return sizeMb;
}

/**
 * Get actual row count from PostgreSQL table.
 */
export async function getActualRowCount(
  schemaName: string,
  tableName: string
): Promise<number> {
  const result = await queryInUserSchema<{ count: number }>(
    schemaName,
    `SELECT COUNT(*) as count FROM ${tableName}`,
    []
  );

  return result.rows[0].count;
}
