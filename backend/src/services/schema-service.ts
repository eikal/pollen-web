/**
 * Schema service for provisioning user-isolated PostgreSQL schemas.
 * Each user gets a dedicated schema (e.g., user123abc) for data isolation.
 */

import * as UserSchema from '../models/UserSchema';
import * as log from './log';

/**
 * Provision a schema for a user.
 * Creates schema if it doesn't exist and updates users table.
 * This is idempotent - safe to call multiple times.
 */
export async function provisionUserSchema(userId: string): Promise<string> {
  try {
    log.info('Provisioning user schema', { userId });

    const schemaName = await UserSchema.createUserSchema(userId);

    log.info('User schema provisioned', { userId, schemaName });

    return schemaName;
  } catch (error) {
    log.error('Failed to provision user schema', {
      userId,
      error: (error as Error).message,
    });
    throw new Error(`Failed to provision schema for user: ${(error as Error).message}`);
  }
}

/**
 * Get the schema name for a user.
 * Returns null if user has no schema yet.
 */
export async function getSchemaName(userId: string): Promise<string | null> {
  try {
    return await UserSchema.getUserSchema(userId);
  } catch (error) {
    log.error('Failed to get schema name', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Ensure user has a schema, creating one if necessary.
 * Convenience method for API endpoints.
 */
export async function ensureUserSchema(userId: string): Promise<string> {
  let schemaName = await UserSchema.getUserSchema(userId);

  if (!schemaName) {
    schemaName = await provisionUserSchema(userId);
  }

  return schemaName;
}

/**
 * Delete a user's schema and all their data.
 * WARNING: This is destructive and cannot be undone.
 */
export async function deleteUserSchema(userId: string): Promise<void> {
  try {
    log.warn('Deleting user schema', { userId });

    await UserSchema.dropUserSchema(userId);

    log.info('User schema deleted', { userId });
  } catch (error) {
    log.error('Failed to delete user schema', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * List all tables in a user's schema.
 */
export async function listTables(userId: string): Promise<string[]> {
  try {
    return await UserSchema.listUserTables(userId);
  } catch (error) {
    log.error('Failed to list user tables', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Check if a table exists in user's schema.
 */
export async function tableExists(userId: string, tableName: string): Promise<boolean> {
  try {
    return await UserSchema.tableExists(userId, tableName);
  } catch (error) {
    log.error('Failed to check table existence', {
      userId,
      tableName,
      error: (error as Error).message,
    });
    throw error;
  }
}
