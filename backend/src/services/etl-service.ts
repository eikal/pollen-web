/**
 * ETL service for executing data operations.
 * Supports: INSERT, UPSERT, DELETE, DROP, TRUNCATE.
 */

import { queryInUserSchema, sanitizeIdentifier } from './db';
import * as ETLOperation from '../models/ETLOperation';
import * as Table from '../models/Table';
import * as log from './log';
import { Column, ParsedRow, generateCreateTableSQL } from './file-parser';

export type OperationType = 'insert' | 'upsert' | 'delete' | 'drop' | 'truncate';

/**
 * Create a table in user schema from column definitions.
 */
export async function createTable(
  userId: string,
  schemaName: string,
  tableName: string,
  columns: Column[]
): Promise<void> {
  try {
    const sql = generateCreateTableSQL(tableName, columns);

    log.info('Creating table', {
      userId,
      schemaName,
      tableName,
      columns: columns.map((c) => `${c.name}:${c.type}`),
    });

    await queryInUserSchema(schemaName, sql, []);

    log.info('Table created successfully', {
      userId,
      schemaName,
      tableName,
    });
  } catch (error) {
    log.error('Failed to create table', {
      userId,
      schemaName,
      tableName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Insert rows into a table.
 * Uses batched INSERT statements for performance.
 */
export async function insertRows(
  userId: string,
  schemaName: string,
  tableName: string,
  rows: ParsedRow[],
  batchSize: number = 1000
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const startTime = Date.now();
  let totalInserted = 0;

  try {
    // Get column names from first row
    const columnNames = Object.keys(rows[0]);
    const sanitizedTable = sanitizeIdentifier(tableName);
    const columnList = columnNames.map((c) => `"${c}"`).join(', ');

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      // Build VALUES clause
      const valuePlaceholders: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const row of batch) {
        const rowPlaceholders: string[] = [];
        for (const col of columnNames) {
          rowPlaceholders.push(`$${paramIndex}`);
          params.push(row[col]);
          paramIndex++;
        }
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const sql = `INSERT INTO ${sanitizedTable} (${columnList}) VALUES ${valuePlaceholders.join(', ')}`;

      await queryInUserSchema(schemaName, sql, params);

      totalInserted += batch.length;

      log.info('Inserted batch', {
        userId,
        schemaName,
        tableName,
        batchSize: batch.length,
        totalInserted,
      });
    }

    const duration = Date.now() - startTime;
    const rowsPerSec = (totalInserted / duration) * 1000;

    // Log operation
    await ETLOperation.logOperation({
      userId,
      operationType: 'insert',
      tableName,
      status: 'success',
      rowsAffected: totalInserted,
    });

    log.info('Insert operation completed', {
      userId,
      schemaName,
      tableName,
      rowsInserted: totalInserted,
      durationMs: duration,
      rowsPerSec: Math.round(rowsPerSec),
    });

    return totalInserted;
  } catch (error) {
    await ETLOperation.logOperation({
      userId,
      operationType: 'insert',
      tableName,
      status: 'failed',
      rowsAffected: totalInserted,
      errorMessage: (error as Error).message,
    });

    log.error('Insert operation failed', {
      userId,
      schemaName,
      tableName,
      rowsInserted: totalInserted,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Upsert rows into a table (INSERT ... ON CONFLICT DO UPDATE).
 * Requires a unique constraint or primary key.
 */
export async function upsertRows(
  userId: string,
  schemaName: string,
  tableName: string,
  rows: ParsedRow[],
  conflictColumns: string[],
  batchSize: number = 1000
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const startTime = Date.now();
  let totalUpserted = 0;

  try {
    const columnNames = Object.keys(rows[0]);
    const sanitizedTable = sanitizeIdentifier(tableName);
    const columnList = columnNames.map((c) => `"${c}"`).join(', ');
    const conflictList = conflictColumns.map((c) => `"${c}"`).join(', ');

    // Build UPDATE clause (exclude conflict columns)
    const updateColumns = columnNames.filter((c) => !conflictColumns.includes(c));
    const updateClause = updateColumns.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const valuePlaceholders: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const row of batch) {
        const rowPlaceholders: string[] = [];
        for (const col of columnNames) {
          rowPlaceholders.push(`$${paramIndex}`);
          params.push(row[col]);
          paramIndex++;
        }
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const sql = `
        INSERT INTO ${sanitizedTable} (${columnList}) 
        VALUES ${valuePlaceholders.join(', ')}
        ON CONFLICT (${conflictList}) 
        DO UPDATE SET ${updateClause}
      `;

      await queryInUserSchema(schemaName, sql, params);

      totalUpserted += batch.length;

      log.info('Upserted batch', {
        userId,
        schemaName,
        tableName,
        batchSize: batch.length,
        totalUpserted,
      });
    }

    const duration = Date.now() - startTime;
    const rowsPerSec = (totalUpserted / duration) * 1000;

    await ETLOperation.logOperation({
      userId,
      operationType: 'upsert',
      tableName,
      status: 'success',
      rowsAffected: totalUpserted,
    });

    log.info('Upsert operation completed', {
      userId,
      schemaName,
      tableName,
      rowsUpserted: totalUpserted,
      durationMs: duration,
      rowsPerSec: Math.round(rowsPerSec),
    });

    return totalUpserted;
  } catch (error) {
    await ETLOperation.logOperation({
      userId,
      operationType: 'upsert',
      tableName,
      status: 'failed',
      rowsAffected: totalUpserted,
      errorMessage: (error as Error).message,
    });

    log.error('Upsert operation failed', {
      userId,
      schemaName,
      tableName,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Delete rows from a table based on WHERE clause.
 */
export async function deleteRows(
  userId: string,
  schemaName: string,
  tableName: string,
  whereClause: string,
  whereParams: any[]
): Promise<number> {
  try {
    const sanitizedTable = sanitizeIdentifier(tableName);
    const sql = `DELETE FROM ${sanitizedTable} WHERE ${whereClause}`;

    const result = await queryInUserSchema(schemaName, sql, whereParams);

    const rowsDeleted = result.rowCount || 0;

    await ETLOperation.logOperation({
      userId,
      operationType: 'delete',
      tableName,
      status: 'success',
      rowsAffected: rowsDeleted,
    });

    log.info('Delete operation completed', {
      userId,
      schemaName,
      tableName,
      rowsDeleted,
    });

    return rowsDeleted;
  } catch (error) {
    await ETLOperation.logOperation({
      userId,
      operationType: 'delete',
      tableName,
      status: 'failed',
      errorMessage: (error as Error).message,
    });

    log.error('Delete operation failed', {
      userId,
      schemaName,
      tableName,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Drop a table from user schema.
 */
export async function dropTable(
  userId: string,
  schemaName: string,
  tableName: string
): Promise<void> {
  try {
    const sanitizedTable = sanitizeIdentifier(tableName);
    const sql = `DROP TABLE IF EXISTS ${sanitizedTable}`;

    await queryInUserSchema(schemaName, sql, []);

    await ETLOperation.logOperation({
      userId,
      operationType: 'drop',
      tableName,
      status: 'success',
      rowsAffected: 0,
    });

    log.info('Drop table completed', {
      userId,
      schemaName,
      tableName,
    });
  } catch (error) {
    await ETLOperation.logOperation({
      userId,
      operationType: 'drop',
      tableName,
      status: 'failed',
      errorMessage: (error as Error).message,
    });

    log.error('Drop table failed', {
      userId,
      schemaName,
      tableName,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Truncate a table (delete all rows).
 */
export async function truncateTable(
  userId: string,
  schemaName: string,
  tableName: string
): Promise<void> {
  try {
    const sanitizedTable = sanitizeIdentifier(tableName);
    const sql = `TRUNCATE TABLE ${sanitizedTable}`;

    await queryInUserSchema(schemaName, sql, []);

    await ETLOperation.logOperation({
      userId,
      operationType: 'truncate',
      tableName,
      status: 'success',
      rowsAffected: 0,
    });

    log.info('Truncate table completed', {
      userId,
      schemaName,
      tableName,
    });
  } catch (error) {
    await ETLOperation.logOperation({
      userId,
      operationType: 'truncate',
      tableName,
      status: 'failed',
      errorMessage: (error as Error).message,
    });

    log.error('Truncate table failed', {
      userId,
      schemaName,
      tableName,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Get table preview (first N rows).
 */
export async function getTablePreview(
  schemaName: string,
  tableName: string,
  limit: number = 100
): Promise<ParsedRow[]> {
  try {
    const sanitizedTable = sanitizeIdentifier(tableName);
    const sql = `SELECT * FROM ${sanitizedTable} LIMIT $1`;

    const result = await queryInUserSchema(schemaName, sql, [limit]);

    return result.rows;
  } catch (error) {
    log.error('Failed to get table preview', {
      schemaName,
      tableName,
      error: (error as Error).message,
    });
    throw error;
  }
}
