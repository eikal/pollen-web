/**
 * Storage service for managing user quota and space reservation.
 * Enforces 20 table / 1GB limits with pessimistic locking.
 */

import * as StorageQuota from '../models/StorageQuota';
import * as Table from '../models/Table';
import * as log from './log';
import config from './config';

/**
 * Check if user has available quota for an upload.
 * Returns detailed availability information.
 */
export async function checkQuotaAvailable(
  userId: string,
  estimatedSizeMb: number
): Promise<{
  available: boolean;
  reason?: string;
  currentTables?: number;
  currentSizeMb?: number;
  limitMb?: number;
}> {
  try {
    return await StorageQuota.checkAvailable(userId, estimatedSizeMb);
  } catch (error) {
    log.error('Failed to check quota availability', {
      userId,
      estimatedSizeMb,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Reserve space for an upload using advisory lock.
 * IMPORTANT: Must be called within a transaction.
 */
export async function reserveSpace(userId: string, estimatedSizeMb: number): Promise<boolean> {
  try {
    return await StorageQuota.reserveSpace(userId, estimatedSizeMb);
  } catch (error) {
    log.error('Failed to reserve space', {
      userId,
      estimatedSizeMb,
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Get current quota information for a user.
 */
export async function getQuota(userId: string): Promise<{
  totalTables: number;
  totalSizeMb: number;
  limitMb: number;
  availableMb: number;
  usagePercent: number;
  lastCalculatedAt: Date;
}> {
  try {
    const quota = await StorageQuota.getQuota(userId);

    const availableMb = Math.max(0, quota.limitMb - quota.totalSizeMb);
    const usagePercent = (quota.totalSizeMb / quota.limitMb) * 100;

    return {
      totalTables: quota.totalTables,
      totalSizeMb: quota.totalSizeMb,
      limitMb: quota.limitMb,
      availableMb,
      usagePercent,
      lastCalculatedAt: quota.lastCalculatedAt,
    };
  } catch (error) {
    log.error('Failed to get quota', {
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Recalculate quota from actual database state.
 * This should be run after table modifications.
 */
export async function recalculateQuota(userId: string, schemaName: string): Promise<void> {
  try {
    log.info('Recalculating quota', { userId, schemaName });

    await StorageQuota.recalculateQuota(userId, schemaName);

    log.info('Quota recalculated', { userId });
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
 * Update quota after successful table creation.
 */
export async function afterTableCreated(userId: string, schemaName: string): Promise<void> {
  try {
    await StorageQuota.incrementTableCount(userId);

    // Recalculate to get accurate size
    await recalculateQuota(userId, schemaName);
  } catch (error) {
    log.error('Failed to update quota after table creation', {
      userId,
      schemaName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Update quota after table deletion.
 */
export async function afterTableDeleted(userId: string, schemaName: string): Promise<void> {
  try {
    await StorageQuota.decrementTableCount(userId);

    // Recalculate to get accurate size
    await recalculateQuota(userId, schemaName);
  } catch (error) {
    log.error('Failed to update quota after table deletion', {
      userId,
      schemaName,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get quota warnings if user is approaching limits.
 */
export async function getQuotaWarnings(userId: string): Promise<{
  hasWarnings: boolean;
  warnings: string[];
}> {
  try {
    const quota = await getQuota(userId);
    const warnings: string[] = [];

    // Check table limit (warn at 80%)
    const tableUsagePercent = (quota.totalTables / config.defaultTableLimit) * 100;
    if (tableUsagePercent >= 80) {
      warnings.push(
        `You have ${quota.totalTables} of ${config.defaultTableLimit} tables. ` +
          `Consider deleting unused tables.`
      );
    }

    // Check storage limit (warn at 80%)
    if (quota.usagePercent >= 80) {
      warnings.push(
        `Your storage is ${quota.usagePercent.toFixed(1)}% full ` +
          `(${quota.totalSizeMb.toFixed(2)}MB of ${quota.limitMb}MB). ` +
          `Consider deleting old data.`
      );
    }

    return {
      hasWarnings: warnings.length > 0,
      warnings,
    };
  } catch (error) {
    log.error('Failed to get quota warnings', {
      userId,
      error: (error as Error).message,
    });
    return { hasWarnings: false, warnings: [] };
  }
}

/**
 * Calculate actual table size from PostgreSQL.
 */
export async function getTableSize(
  schemaName: string,
  tableName: string
): Promise<{ sizeMb: number; rowCount: number }> {
  try {
    const sizeMb = await Table.calculateActualSize(schemaName, tableName);
    const rowCount = await Table.getActualRowCount(schemaName, tableName);

    return { sizeMb, rowCount };
  } catch (error) {
    log.error('Failed to get table size', {
      schemaName,
      tableName,
      error: (error as Error).message,
    });
    throw error;
  }
}
