/**
 * Database client wrapper using pg (PostgreSQL).
 * Supports per-user schema isolation via search_path.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import config from './config';
import * as log from './log';

let pool: Pool | null = null;

/**
 * Get or create database connection pool.
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: config.dbPoolMax || 20,
      idleTimeoutMillis: config.dbPoolIdleTimeoutMs || 30000,
      connectionTimeoutMillis: 2000,
      statement_timeout: config.queryTimeoutMs || 30000, // 30s query timeout
    });

    pool.on('error', (err: Error) => {
      log.error('Unexpected database pool error', { error: err.message });
    });
  }

  return pool;
}

/**
 * Execute a query with parameters (public schema).
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const client = getPool();

  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    log.debug('Database query executed', {
      query: text.substring(0, 100),
      duration_ms: duration,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log.error('Database query failed', {
      query: text.substring(0, 100),
      duration_ms: duration,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Execute a query within a user's schema.
 * Sets search_path to user's schema + public before executing query.
 * 
 * @param schemaName - User's schema (e.g., 'user123abc')
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
export async function queryInUserSchema<T extends QueryResultRow = any>(
  schemaName: string,
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const pool = getPool();
  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Set search_path to user's schema + public (for metadata tables)
    await client.query(`SET search_path = ${sanitizeIdentifier(schemaName)}, public`);

    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    log.debug('Database query executed in user schema', {
      schema: schemaName,
      query: text.substring(0, 100),
      duration_ms: duration,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log.error('Database query failed in user schema', {
      schema: schemaName,
      query: text.substring(0, 100),
      duration_ms: duration,
      error: (error as Error).message,
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Get a client from the pool with custom search_path.
 * Caller is responsible for releasing the client.
 * 
 * @param schemaName - User's schema (optional, defaults to public)
 * @returns PoolClient with search_path set
 */
export async function getClientWithSchema(schemaName?: string): Promise<PoolClient> {
  const pool = getPool();
  const client = await pool.connect();

  if (schemaName) {
    await client.query(`SET search_path = ${sanitizeIdentifier(schemaName)}, public`);
  }

  return client;
}

/**
 * Sanitize SQL identifier to prevent injection.
 * Uses quote_ident-style escaping (double quotes).
 * 
 * @param identifier - Schema or table name
 * @returns Sanitized identifier
 */
export function sanitizeIdentifier(identifier: string): string {
  // Remove any characters that aren't alphanumeric or underscore
  const cleaned = identifier.replace(/[^a-z0-9_]/gi, '');
  
  if (cleaned !== identifier) {
    throw new Error(`Invalid identifier: ${identifier}`);
  }
  
  return `"${cleaned}"`;
}

/**
 * Close database pool (for graceful shutdown).
 */
export async function close(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    log.info('Database pool closed');
  }
}

export default { getPool, query, queryInUserSchema, getClientWithSchema, sanitizeIdentifier, close };
