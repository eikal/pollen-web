"use strict";
/**
 * Storage service for managing user quota and space reservation.
 * Enforces 20 table / 1GB limits with pessimistic locking.
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
exports.checkQuotaAvailable = checkQuotaAvailable;
exports.reserveSpace = reserveSpace;
exports.getQuota = getQuota;
exports.recalculateQuota = recalculateQuota;
exports.afterTableCreated = afterTableCreated;
exports.afterTableDeleted = afterTableDeleted;
exports.getQuotaWarnings = getQuotaWarnings;
exports.getTableSize = getTableSize;
const StorageQuota = __importStar(require("../models/StorageQuota"));
const Table = __importStar(require("../models/Table"));
const log = __importStar(require("./log"));
const config_1 = __importDefault(require("./config"));
/**
 * Check if user has available quota for an upload.
 * Returns detailed availability information.
 */
async function checkQuotaAvailable(userId, estimatedSizeMb) {
    try {
        return await StorageQuota.checkAvailable(userId, estimatedSizeMb);
    }
    catch (error) {
        log.error('Failed to check quota availability', {
            userId,
            estimatedSizeMb,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Reserve space for an upload using advisory lock.
 * IMPORTANT: Must be called within a transaction.
 */
async function reserveSpace(userId, estimatedSizeMb) {
    try {
        return await StorageQuota.reserveSpace(userId, estimatedSizeMb);
    }
    catch (error) {
        log.error('Failed to reserve space', {
            userId,
            estimatedSizeMb,
            error: error.message,
        });
        return false;
    }
}
/**
 * Get current quota information for a user.
 */
async function getQuota(userId) {
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
    }
    catch (error) {
        log.error('Failed to get quota', {
            userId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Recalculate quota from actual database state.
 * This should be run after table modifications.
 */
async function recalculateQuota(userId, schemaName) {
    try {
        log.info('Recalculating quota', { userId, schemaName });
        await StorageQuota.recalculateQuota(userId, schemaName);
        log.info('Quota recalculated', { userId });
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
 * Update quota after successful table creation.
 */
async function afterTableCreated(userId, schemaName) {
    try {
        await StorageQuota.incrementTableCount(userId);
        // Recalculate to get accurate size
        await recalculateQuota(userId, schemaName);
    }
    catch (error) {
        log.error('Failed to update quota after table creation', {
            userId,
            schemaName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Update quota after table deletion.
 */
async function afterTableDeleted(userId, schemaName) {
    try {
        await StorageQuota.decrementTableCount(userId);
        // Recalculate to get accurate size
        await recalculateQuota(userId, schemaName);
    }
    catch (error) {
        log.error('Failed to update quota after table deletion', {
            userId,
            schemaName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get quota warnings if user is approaching limits.
 */
async function getQuotaWarnings(userId) {
    try {
        const quota = await getQuota(userId);
        const warnings = [];
        // Check table limit (warn at 80%)
        const tableUsagePercent = (quota.totalTables / config_1.default.defaultTableLimit) * 100;
        if (tableUsagePercent >= 80) {
            warnings.push(`You have ${quota.totalTables} of ${config_1.default.defaultTableLimit} tables. ` +
                `Consider deleting unused tables.`);
        }
        // Check storage limit (warn at 80%)
        if (quota.usagePercent >= 80) {
            warnings.push(`Your storage is ${quota.usagePercent.toFixed(1)}% full ` +
                `(${quota.totalSizeMb.toFixed(2)}MB of ${quota.limitMb}MB). ` +
                `Consider deleting old data.`);
        }
        return {
            hasWarnings: warnings.length > 0,
            warnings,
        };
    }
    catch (error) {
        log.error('Failed to get quota warnings', {
            userId,
            error: error.message,
        });
        return { hasWarnings: false, warnings: [] };
    }
}
/**
 * Calculate actual table size from PostgreSQL.
 */
async function getTableSize(schemaName, tableName) {
    try {
        const sizeMb = await Table.calculateActualSize(schemaName, tableName);
        const rowCount = await Table.getActualRowCount(schemaName, tableName);
        return { sizeMb, rowCount };
    }
    catch (error) {
        log.error('Failed to get table size', {
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
