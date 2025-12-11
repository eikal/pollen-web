/**
 * StorageQuota model for managing user storage limits.
 * Tracks table count and storage size with 20 table / 1GB limits.
 */

import { query, queryInUserSchema, getClientWithSchema } from '../services/db';
import * as log from '../services/log';
import config from '../services/config';

export interface QuotaInfo {
  userId: string;
  totalTables: number;
  totalSizeMb: number;
  limitMb: number;
  lastCalculatedAt: Date;
}

/**
 * Get quota information for a user.
 * Initializes quota if not exists.
 */
export async function getQuota(userId: string): Promise<QuotaInfo> {
  let result = await query<{
    total_tables: number;
    total_size_mb: number;
    limit_mb: number;
    last_calculated_at: Date;
  }>(
    `SELECT total_tables, total_size_mb, limit_mb, last_calculated_at
     FROM storage_quota
     WHERE user_id = $1`,
    [userId]
  );

  // Initialize if not exists
  if (result.rows.length === 0) {
    await query(
      `INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
       VALUES ($1, 0, 0, $2)`,
      [userId, config.defaultStorageLimitMb]
    );

    log.info('Initialized storage quota', {
      userId,
      limitMb: config.defaultStorageLimitMb,
    });

    result = await query<{
      total_tables: number;
      total_size_mb: number;
      limit_mb: number;
      last_calculated_at: Date;
    }>(
      `SELECT total_tables, total_size_mb, limit_mb, last_calculated_at
       FROM storage_quota
       WHERE user_id = $1`,
      [userId]
    );
  }

  const row = result.rows[0];
  return {
    userId,
    totalTables: row.total_tables,
    totalSizeMb: row.total_size_mb,
    limitMb: row.limit_mb,
    lastCalculatedAt: row.last_calculated_at,
  };
}

/**
 * Check if user has available quota for estimated size.
 * Returns true if upload can proceed, false otherwise.
 */
export async function checkAvailable(
  userId: string,
  estimatedSizeMb: number
): Promise<{
  available: boolean;
  reason?: string;
  currentTables?: number;
  currentSizeMb?: number;
  limitMb?: number;
}> {
  const quota = await getQuota(userId);

  // Check table limit
  if (quota.totalTables >= config.defaultTableLimit) {
    return {
      available: false,
      reason: 'TABLE_LIMIT_EXCEEDED',
      currentTables: quota.totalTables,
    };
  }

  // Check storage limit
  if (quota.totalSizeMb + estimatedSizeMb > quota.limitMb) {
    return {
      available: false,
      reason: 'STORAGE_QUOTA_EXCEEDED',
      currentSizeMb: quota.totalSizeMb,
      limitMb: quota.limitMb,
    };
  }

  return { available: true };
}

/**
 * Reserve space for an upload using PostgreSQL advisory lock.
 * This ensures no race conditions when multiple uploads happen simultaneously.
 * 
 * IMPORTANT: Must be called within a transaction.
 */
export async function reserveSpace(
  userId: string,
  estimatedSizeMb: number
): Promise<boolean> {
  // Use advisory lock to prevent concurrent quota modifications
  // Lock ID is hash of user ID (integer)
  const lockId = parseInt(
    require('crypto').createHash('sha256').update(userId).digest('hex').substring(0, 8),
    16
  );

  // Get transaction-level advisory lock
  const lockResult = await query<{ locked: boolean }>(
    'SELECT pg_try_advisory_xact_lock($1) as locked',
    [lockId]
  );

  if (!lockResult.rows[0].locked) {
    log.warn('Failed to acquire advisory lock for quota reservation', { userId });
    return false;
  }

  // Check quota with lock held
  const check = await checkAvailable(userId, estimatedSizeMb);

  if (!check.available) {
    log.warn('Quota check failed during reservation', {
      userId,
      estimatedSizeMb,
      reason: check.reason,
    });
    return false;
  }

  log.info('Reserved storage space', { userId, estimatedSizeMb });
  return true;
}

/**
 * Update quota totals manually.
 * Used after successful ETL operations.
 */
export async function updateTotals(
  userId: string,
  totalTables: number,
  totalSizeMb: number
): Promise<void> {
  try {
    await query(
      `UPDATE storage_quota
       SET total_tables = $1, total_size_mb = $2, last_calculated_at = NOW()
       WHERE user_id = $3`,
      [totalTables, totalSizeMb, userId]
    );

    log.info('Updated storage quota totals', {
      userId,
      totalTables,
      totalSizeMb,
    });
  } catch (error) {
    log.error('Failed to update quota totals', {
      userId,
      totalTables,
      totalSizeMb,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Recalculate quota from actual database state.
 * Aggregates pg_total_relation_size across all user tables.
 */
export async function recalculateQuota(userId: string, schemaName: string): Promise<QuotaInfo> {
  try {
    // Get table count from metadata
    const tableCountResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_tables WHERE user_id = $1',
      [userId]
    );

    const totalTables = Number(tableCountResult.rows[0].count);

    // Calculate total size from PostgreSQL
    let totalSizeMb = 0;

    if (totalTables > 0) {
      const sizeResult = await queryInUserSchema<{ total_size_bytes: number }>(
        schemaName,
        `SELECT COALESCE(SUM(pg_total_relation_size(schemaname || '.' || tablename)), 0) as total_size_bytes
         FROM pg_tables
         WHERE schemaname = $1`,
        [schemaName]
      );

      totalSizeMb = Number(sizeResult.rows[0].total_size_bytes) / (1024 * 1024);
    }

    // Update quota
    await updateTotals(userId, totalTables, totalSizeMb);

    log.info('Recalculated storage quota', {
      userId,
      totalTables,
      totalSizeMb,
    });

    return await getQuota(userId);
  } catch (error) {
    log.error('Failed to recalculate quota', {
      userId,
      schemaName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Increment table count (called after successful table creation).
 */
export async function incrementTableCount(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE storage_quota
       SET total_tables = total_tables + 1, last_calculated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    log.info('Incremented table count', { userId });
  } catch (error) {
    log.error('Failed to increment table count', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Decrement table count (called after table deletion).
 */
export async function decrementTableCount(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE storage_quota
       SET total_tables = GREATEST(total_tables - 1, 0), last_calculated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    log.info('Decremented table count', { userId });
  } catch (error) {
    log.error('Failed to decrement table count', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}
