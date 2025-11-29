"use strict";
/**
 * ETLOperation model for logging ETL operations.
 * Provides audit trail for all data modifications.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOperation = logOperation;
exports.getRecentOperations = getRecentOperations;
exports.getOperationsForTable = getOperationsForTable;
exports.getOperationById = getOperationById;
exports.getOperationStats = getOperationStats;
exports.deleteOldOperations = deleteOldOperations;
const db_1 = require("../services/db");
const log = __importStar(require("../services/log"));
/**
 * Log an ETL operation to the audit trail.
 */
async function logOperation(params) {
    const { userId, operationType, tableName, status, rowsAffected = 0, errorMessage = null, } = params;
    try {
        const result = await (0, db_1.query)(`INSERT INTO etl_operations 
       (user_id, operation_type, table_name, status, rows_affected, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`, [userId, operationType, tableName, status, rowsAffected, errorMessage]);
        const operationId = result.rows[0].id;
        if (status === 'failed') {
            log.error('ETL operation failed', {
                userId,
                operationType,
                tableName,
                operationId,
                errorMessage,
            });
        }
        else {
            log.info('ETL operation succeeded', {
                userId,
                operationType,
                tableName,
                operationId,
                rowsAffected,
            });
        }
        return operationId;
    }
    catch (error) {
        log.error('Failed to log ETL operation', {
            userId,
            operationType,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get recent operations for a user.
 * Limited to last 100 operations by default.
 */
async function getRecentOperations(userId, limit = 100) {
    const result = await (0, db_1.query)(`SELECT id, user_id as "userId", operation_type as "operationType",
            table_name as "tableName", status, rows_affected as "rowsAffected",
            error_message as "errorMessage", created_at as "createdAt"
     FROM etl_operations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`, [userId, limit]);
    return result.rows;
}
/**
 * Get operations for a specific table.
 */
async function getOperationsForTable(userId, tableName, limit = 50) {
    const result = await (0, db_1.query)(`SELECT id, user_id as "userId", operation_type as "operationType",
            table_name as "tableName", status, rows_affected as "rowsAffected",
            error_message as "errorMessage", created_at as "createdAt"
     FROM etl_operations
     WHERE user_id = $1 AND table_name = $2
     ORDER BY created_at DESC
     LIMIT $3`, [userId, tableName, limit]);
    return result.rows;
}
/**
 * Get operation by ID.
 */
async function getOperationById(operationId) {
    const result = await (0, db_1.query)(`SELECT id, user_id as "userId", operation_type as "operationType",
            table_name as "tableName", status, rows_affected as "rowsAffected",
            error_message as "errorMessage", created_at as "createdAt"
     FROM etl_operations
     WHERE id = $1`, [operationId]);
    return result.rows.length > 0 ? result.rows[0] : null;
}
/**
 * Get operation statistics for a user.
 */
async function getOperationStats(userId) {
    const result = await (0, db_1.query)(`SELECT 
       COUNT(*) as total_operations,
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
       SUM(rows_affected) as total_rows_affected
     FROM etl_operations
     WHERE user_id = $1`, [userId]);
    const byTypeResult = await (0, db_1.query)(`SELECT operation_type, COUNT(*) as count
     FROM etl_operations
     WHERE user_id = $1
     GROUP BY operation_type`, [userId]);
    const operationsByType = {
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
async function deleteOldOperations() {
    const result = await (0, db_1.query)(`WITH deleted AS (
       DELETE FROM etl_operations
       WHERE created_at < NOW() - INTERVAL '90 days'
       RETURNING id
     )
     SELECT COUNT(*) as deleted_count FROM deleted`);
    const deletedCount = Number(result.rows[0].deleted_count);
    if (deletedCount > 0) {
        log.info('Deleted old ETL operations', { deletedCount });
    }
    return deletedCount;
}
