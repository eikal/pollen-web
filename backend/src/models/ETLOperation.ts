/**
 * ETLOperation model for logging ETL operations.
 * Provides audit trail for all data modifications.
 */

import { query } from '../services/db';
import * as log from '../services/log';

export type OperationType = 'insert' | 'upsert' | 'delete' | 'drop' | 'truncate';
export type OperationStatus = 'success' | 'failed';

export interface ETLOperationRecord {
  id: number;
  userId: string;
  operationType: OperationType;
  tableName: string;
  status: OperationStatus;
  rowsAffected: number;
  errorMessage: string | null;
  createdAt: Date;
}

export interface LogOperationParams {
  userId: string;
  operationType: OperationType;
  tableName: string;
  status: OperationStatus;
  rowsAffected?: number;
  errorMessage?: string | null;
}

/**
 * Log an ETL operation to the audit trail.
 */
export async function logOperation(params: LogOperationParams): Promise<number> {
  const {
    userId,
    operationType,
    tableName,
    status,
    rowsAffected = 0,
    errorMessage = null,
  } = params;

  try {
    const result = await query<{ id: number }>(
      `INSERT INTO etl_operations 
       (user_id, operation_type, table_name, status, rows_affected, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, operationType, tableName, status, rowsAffected, errorMessage]
    );

    const operationId = result.rows[0].id;

    if (status === 'failed') {
      log.error('ETL operation failed', {
        userId,
        operationType,
        tableName,
        operationId,
        errorMessage,
      });
    } else {
      log.info('ETL operation succeeded', {
        userId,
        operationType,
        tableName,
        operationId,
        rowsAffected,
      });
    }

    return operationId;
  } catch (error) {
    log.error('Failed to log ETL operation', {
      userId,
      operationType,
      tableName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get recent operations for a user.
 * Limited to last 100 operations by default.
 */
export async function getRecentOperations(
  userId: string,
  limit: number = 100
): Promise<ETLOperationRecord[]> {
  const result = await query<ETLOperationRecord>(
    `SELECT id, user_id as "userId", operation_type as "operationType",
            table_name as "tableName", status, rows_affected as "rowsAffected",
            error_message as "errorMessage", created_at as "createdAt"
     FROM etl_operations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

/**
 * Get operations for a specific table.
 */
export async function getOperationsForTable(
  userId: string,
  tableName: string,
  limit: number = 50
): Promise<ETLOperationRecord[]> {
  const result = await query<ETLOperationRecord>(
    `SELECT id, user_id as "userId", operation_type as "operationType",
            table_name as "tableName", status, rows_affected as "rowsAffected",
            error_message as "errorMessage", created_at as "createdAt"
     FROM etl_operations
     WHERE user_id = $1 AND table_name = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [userId, tableName, limit]
  );

  return result.rows;
}

/**
 * Get operation by ID.
 */
export async function getOperationById(operationId: number): Promise<ETLOperationRecord | null> {
  const result = await query<ETLOperationRecord>(
    `SELECT id, user_id as "userId", operation_type as "operationType",
            table_name as "tableName", status, rows_affected as "rowsAffected",
            error_message as "errorMessage", created_at as "createdAt"
     FROM etl_operations
     WHERE id = $1`,
    [operationId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get operation statistics for a user.
 */
export async function getOperationStats(userId: string): Promise<{
  totalOperations: number;
  successCount: number;
  failedCount: number;
  totalRowsAffected: number;
  operationsByType: Record<OperationType, number>;
}> {
  const result = await query<{
    total_operations: number;
    success_count: number;
    failed_count: number;
    total_rows_affected: number;
  }>(
    `SELECT 
       COUNT(*) as total_operations,
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
       SUM(rows_affected) as total_rows_affected
     FROM etl_operations
     WHERE user_id = $1`,
    [userId]
  );

  const byTypeResult = await query<{
    operation_type: OperationType;
    count: number;
  }>(
    `SELECT operation_type, COUNT(*) as count
     FROM etl_operations
     WHERE user_id = $1
     GROUP BY operation_type`,
    [userId]
  );

  const operationsByType: Record<OperationType, number> = {
    insert: 0,
    upsert: 0,
    delete: 0,
    drop: 0,
    truncate: 0,
  };

  byTypeResult.rows.forEach((row) => {
    operationsByType[row.operation_type] = Number(row.count);
  });

  return {
    totalOperations: Number(result.rows[0].total_operations),
    successCount: Number(result.rows[0].success_count),
    failedCount: Number(result.rows[0].failed_count),
    totalRowsAffected: Number(result.rows[0].total_rows_affected),
    operationsByType,
  };
}

/**
 * Delete old operations (older than 90 days).
 * This should be run periodically as a cleanup job.
 */
export async function deleteOldOperations(): Promise<number> {
  const result = await query<{ deleted_count: number }>(
    `WITH deleted AS (
       DELETE FROM etl_operations
       WHERE created_at < NOW() - INTERVAL '90 days'
       RETURNING id
     )
     SELECT COUNT(*) as deleted_count FROM deleted`
  );

  const deletedCount = Number(result.rows[0].deleted_count);

  if (deletedCount > 0) {
    log.info('Deleted old ETL operations', { deletedCount });
  }

  return deletedCount;
}
