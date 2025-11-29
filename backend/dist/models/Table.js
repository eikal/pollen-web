"use strict";
/**
 * Table model for managing user_tables metadata.
 * Tracks metadata about tables created in user schemas.
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
exports.insertTableMetadata = insertTableMetadata;
exports.getTableById = getTableById;
exports.getTableByName = getTableByName;
exports.listTablesForUser = listTablesForUser;
exports.updateRowCount = updateRowCount;
exports.updateSize = updateSize;
exports.updateTableStats = updateTableStats;
exports.deleteTableMetadata = deleteTableMetadata;
exports.calculateActualSize = calculateActualSize;
exports.getActualRowCount = getActualRowCount;
const db_1 = require("../services/db");
const log = __importStar(require("../services/log"));
/**
 * Insert a new table metadata record.
 */
async function insertTableMetadata(params) {
    const { userId, schemaName, tableName, rowCount = 0, sizeMb = 0 } = params;
    try {
        const result = await (0, db_1.query)(`INSERT INTO user_tables (user_id, schema_name, table_name, row_count, size_mb)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`, [userId, schemaName, tableName, rowCount, sizeMb]);
        log.info('Inserted table metadata', {
            userId,
            schemaName,
            tableName,
            tableId: result.rows[0].id,
        });
        return result.rows[0].id;
    }
    catch (error) {
        log.error('Failed to insert table metadata', {
            userId,
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get table metadata by ID.
 */
async function getTableById(tableId) {
    const result = await (0, db_1.query)(`SELECT id, user_id as "userId", schema_name as "schemaName", 
            table_name as "tableName", row_count as "rowCount", 
            size_mb as "sizeMb", last_updated_at as "lastUpdatedAt", 
            created_at as "createdAt"
     FROM user_tables 
     WHERE id = $1`, [tableId]);
    return result.rows.length > 0 ? result.rows[0] : null;
}
/**
 * Get table metadata by user ID and table name.
 */
async function getTableByName(userId, tableName) {
    const result = await (0, db_1.query)(`SELECT id, user_id as "userId", schema_name as "schemaName", 
            table_name as "tableName", row_count as "rowCount", 
            size_mb as "sizeMb", last_updated_at as "lastUpdatedAt", 
            created_at as "createdAt"
     FROM user_tables 
     WHERE user_id = $1 AND table_name = $2`, [userId, tableName]);
    return result.rows.length > 0 ? result.rows[0] : null;
}
/**
 * List all tables for a user.
 */
async function listTablesForUser(userId) {
    const result = await (0, db_1.query)(`SELECT id, user_id as "userId", schema_name as "schemaName", 
            table_name as "tableName", row_count as "rowCount", 
            size_mb as "sizeMb", last_updated_at as "lastUpdatedAt", 
            created_at as "createdAt"
     FROM user_tables 
     WHERE user_id = $1
     ORDER BY created_at DESC`, [userId]);
    return result.rows;
}
/**
 * Update row count for a table.
 */
async function updateRowCount(tableId, rowCount) {
    try {
        await (0, db_1.query)(`UPDATE user_tables 
       SET row_count = $1, last_updated_at = NOW()
       WHERE id = $2`, [rowCount, tableId]);
        log.info('Updated table row count', { tableId, rowCount });
    }
    catch (error) {
        log.error('Failed to update row count', {
            tableId,
            rowCount,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Update size in MB for a table.
 */
async function updateSize(tableId, sizeMb) {
    try {
        await (0, db_1.query)(`UPDATE user_tables 
       SET size_mb = $1, last_updated_at = NOW()
       WHERE id = $2`, [sizeMb, tableId]);
        log.info('Updated table size', { tableId, sizeMb });
    }
    catch (error) {
        log.error('Failed to update table size', {
            tableId,
            sizeMb,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Update both row count and size for a table.
 */
async function updateTableStats(tableId, rowCount, sizeMb) {
    try {
        await (0, db_1.query)(`UPDATE user_tables 
       SET row_count = $1, size_mb = $2, last_updated_at = NOW()
       WHERE id = $3`, [rowCount, sizeMb, tableId]);
        log.info('Updated table stats', { tableId, rowCount, sizeMb });
    }
    catch (error) {
        log.error('Failed to update table stats', {
            tableId,
            rowCount,
            sizeMb,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Delete table metadata.
 * NOTE: This only deletes metadata, not the actual PostgreSQL table.
 */
async function deleteTableMetadata(tableId) {
    try {
        await (0, db_1.query)('DELETE FROM user_tables WHERE id = $1', [tableId]);
        log.info('Deleted table metadata', { tableId });
    }
    catch (error) {
        log.error('Failed to delete table metadata', {
            tableId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Calculate actual table size from PostgreSQL.
 * Uses pg_total_relation_size to get table + indexes + TOAST size.
 */
async function calculateActualSize(schemaName, tableName) {
    const result = await (0, db_1.queryInUserSchema)(schemaName, `SELECT pg_total_relation_size($1 || '.' || $2) as size_bytes`, [schemaName, tableName]);
    const sizeBytes = result.rows[0].size_bytes;
    const sizeMb = sizeBytes / (1024 * 1024);
    return sizeMb;
}
/**
 * Get actual row count from PostgreSQL table.
 */
async function getActualRowCount(schemaName, tableName) {
    const result = await (0, db_1.queryInUserSchema)(schemaName, `SELECT COUNT(*) as count FROM ${tableName}`, []);
    return result.rows[0].count;
}
