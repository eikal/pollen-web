/**
 * UserSchema model for managing per-user PostgreSQL schemas.
 * Each user gets an isolated schema (e.g., user123abc) for their tables.
 */

import { query, queryInUserSchema, sanitizeIdentifier } from '../services/db';
import * as log from '../services/log';
import * as crypto from 'crypto';

export interface UserSchemaInfo {
  userId: string;
  schemaName: string;
  createdAt: Date;
}

/**
 * Generate a unique schema name for a user.
 * Format: user{hash} where hash is first 8 chars of SHA256(userId)
 */
export function generateSchemaName(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
  return `user${hash}`;
}

/**
 * Create a new schema for a user and update users table.
 * This is idempotent - if schema already exists, just returns the name.
 */
export async function createUserSchema(userId: string): Promise<string> {
  const schemaName = generateSchemaName(userId);

  try {
    // Check if user already has a schema
    const userResult = await query<{ schema_name: string | null }>(
      'SELECT schema_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    if (userResult.rows[0].schema_name) {
      log.info('User schema already exists', { userId, schemaName: userResult.rows[0].schema_name });
      return userResult.rows[0].schema_name;
    }

    // Create schema (PostgreSQL will error if it exists, but we handle that)
    const sanitizedSchema = sanitizeIdentifier(schemaName);
    await query(`CREATE SCHEMA IF NOT EXISTS ${sanitizedSchema}`, []);

    // Grant permissions to the schema owner (application role)
    await query(`GRANT ALL ON SCHEMA ${sanitizedSchema} TO CURRENT_USER`, []);

    // Update users table with schema name
    await query(
      'UPDATE users SET schema_name = $1 WHERE id = $2',
      [schemaName, userId]
    );

    log.info('Created user schema', { userId, schemaName });

    return schemaName;
  } catch (error) {
    log.error('Failed to create user schema', {
      userId,
      schemaName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get the schema name for a user.
 * Returns null if user has no schema yet.
 */
export async function getUserSchema(userId: string): Promise<string | null> {
  const result = await query<{ schema_name: string | null }>(
    'SELECT schema_name FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error(`User ${userId} not found`);
  }

  return result.rows[0].schema_name;
}

/**
 * Drop a user's schema and all its tables.
 * WARNING: This is destructive and cannot be undone.
 */
export async function dropUserSchema(userId: string): Promise<void> {
  const schemaName = await getUserSchema(userId);

  if (!schemaName) {
    log.warn('Attempted to drop non-existent schema', { userId });
    return;
  }

  try {
    // Drop schema and all objects in it
    const sanitizedSchema = sanitizeIdentifier(schemaName);
    await query(`DROP SCHEMA IF EXISTS ${sanitizedSchema} CASCADE`, []);

    // Clear schema name from users table
    await query(
      'UPDATE users SET schema_name = NULL WHERE id = $1',
      [userId]
    );

    // Delete all metadata for this user
    await query('DELETE FROM user_tables WHERE user_id = $1', [userId]);
    await query('DELETE FROM etl_operations WHERE user_id = $1', [userId]);
    await query('DELETE FROM upload_sessions WHERE user_id = $1', [userId]);
    await query('DELETE FROM storage_quota WHERE user_id = $1', [userId]);

    log.info('Dropped user schema', { userId, schemaName });
  } catch (error) {
    log.error('Failed to drop user schema', {
      userId,
      schemaName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * List all tables in a user's schema.
 */
export async function listUserTables(userId: string): Promise<string[]> {
  const schemaName = await getUserSchema(userId);

  if (!schemaName) {
    return [];
  }

  const result = await queryInUserSchema<{ table_name: string }>(
    schemaName,
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = $1 
     AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [schemaName]
  );

  return result.rows.map((row) => row.table_name);
}

/**
 * Check if a table exists in a user's schema.
 */
export async function tableExists(userId: string, tableName: string): Promise<boolean> {
  const schemaName = await getUserSchema(userId);

  if (!schemaName) {
    return false;
  }

  const result = await queryInUserSchema<{ exists: boolean }>(
    schemaName,
    `SELECT EXISTS (
       SELECT 1 
       FROM information_schema.tables 
       WHERE table_schema = $1 
       AND table_name = $2
     ) as exists`,
    [schemaName, tableName]
  );

  return result.rows[0].exists;
}
