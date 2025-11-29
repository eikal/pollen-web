"use strict";
/**
 * StorageQuota model for managing user storage limits.
 * Tracks table count and storage size with 20 table / 1GB limits.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuota = getQuota;
exports.checkAvailable = checkAvailable;
exports.reserveSpace = reserveSpace;
exports.updateTotals = updateTotals;
exports.recalculateQuota = recalculateQuota;
exports.incrementTableCount = incrementTableCount;
exports.decrementTableCount = decrementTableCount;
const db_1 = require("../services/db");
const log = __importStar(require("../services/log"));
const config_1 = __importDefault(require("../services/config"));
/**
 * Get quota information for a user.
 * Initializes quota if not exists.
 */
async function getQuota(userId) {
    let result = await (0, db_1.query)(`SELECT total_tables, total_size_mb, limit_mb, last_calculated_at
     FROM storage_quota
     WHERE user_id = $1`, [userId]);
    // Initialize if not exists
    if (result.rows.length === 0) {
        await (0, db_1.query)(`INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
       VALUES ($1, 0, 0, $2)`, [userId, config_1.default.defaultStorageLimitMb]);
        log.info('Initialized storage quota', {
            userId,
            limitMb: config_1.default.defaultStorageLimitMb,
        });
        result = await (0, db_1.query)(`SELECT total_tables, total_size_mb, limit_mb, last_calculated_at
       FROM storage_quota
       WHERE user_id = $1`, [userId]);
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
async function checkAvailable(userId, estimatedSizeMb) {
    const quota = await getQuota(userId);
    // Check table limit
    if (quota.totalTables >= config_1.default.defaultTableLimit) {
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
async function reserveSpace(userId, estimatedSizeMb) {
    // Use advisory lock to prevent concurrent quota modifications
    // Lock ID is hash of user ID (integer)
    const lockId = parseInt(require('crypto').createHash('sha256').update(userId).digest('hex').substring(0, 8), 16);
    // Get transaction-level advisory lock
    const lockResult = await (0, db_1.query)('SELECT pg_try_advisory_xact_lock($1) as locked', [lockId]);
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
async function updateTotals(userId, totalTables, totalSizeMb) {
    try {
        await (0, db_1.query)(`UPDATE storage_quota
       SET total_tables = $1, total_size_mb = $2, last_calculated_at = NOW()
       WHERE user_id = $3`, [totalTables, totalSizeMb, userId]);
        log.info('Updated storage quota totals', {
            userId,
            totalTables,
            totalSizeMb,
        });
    }
    catch (error) {
        log.error('Failed to update quota totals', {
            userId,
            totalTables,
            totalSizeMb,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Recalculate quota from actual database state.
 * Aggregates pg_total_relation_size across all user tables.
 */
async function recalculateQuota(userId, schemaName) {
    try {
        // Get table count from metadata
        const tableCountResult = await (0, db_1.query)('SELECT COUNT(*) as count FROM user_tables WHERE user_id = $1', [userId]);
        const totalTables = Number(tableCountResult.rows[0].count);
        // Calculate total size from PostgreSQL
        let totalSizeMb = 0;
        if (totalTables > 0) {
            const sizeResult = await (0, db_1.queryInUserSchema)(schemaName, `SELECT COALESCE(SUM(pg_total_relation_size(schemaname || '.' || tablename)), 0) as total_size_bytes
         FROM pg_tables
         WHERE schemaname = $1`, [schemaName]);
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
    }
    catch (error) {
        log.error('Failed to recalculate quota', {
            userId,
            schemaName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Increment table count (called after successful table creation).
 */
async function incrementTableCount(userId) {
    try {
        await (0, db_1.query)(`UPDATE storage_quota
       SET total_tables = total_tables + 1, last_calculated_at = NOW()
       WHERE user_id = $1`, [userId]);
        log.info('Incremented table count', { userId });
    }
    catch (error) {
        log.error('Failed to increment table count', {
            userId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Decrement table count (called after table deletion).
 */
async function decrementTableCount(userId) {
    try {
        await (0, db_1.query)(`UPDATE storage_quota
       SET total_tables = GREATEST(total_tables - 1, 0), last_calculated_at = NOW()
       WHERE user_id = $1`, [userId]);
        log.info('Decremented table count', { userId });
    }
    catch (error) {
        log.error('Failed to decrement table count', {
            userId,
            error: error.message,
        });
        throw error;
    }
}
