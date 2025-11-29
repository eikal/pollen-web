"use strict";
/**
 * ETL service for executing data operations.
 * Supports: INSERT, UPSERT, DELETE, DROP, TRUNCATE.
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
exports.createTable = createTable;
exports.insertRows = insertRows;
exports.upsertRows = upsertRows;
exports.deleteRows = deleteRows;
exports.dropTable = dropTable;
exports.truncateTable = truncateTable;
exports.getTablePreview = getTablePreview;
const db_1 = require("./db");
const ETLOperation = __importStar(require("../models/ETLOperation"));
const log = __importStar(require("./log"));
const file_parser_1 = require("./file-parser");
/**
 * Create a table in user schema from column definitions.
 */
async function createTable(userId, schemaName, tableName, columns) {
    try {
        const sql = (0, file_parser_1.generateCreateTableSQL)(tableName, columns);
        log.info('Creating table', {
            userId,
            schemaName,
            tableName,
            columns: columns.map((c) => `${c.name}:${c.type}`),
        });
        await (0, db_1.queryInUserSchema)(schemaName, sql, []);
        log.info('Table created successfully', {
            userId,
            schemaName,
            tableName,
        });
    }
    catch (error) {
        log.error('Failed to create table', {
            userId,
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Insert rows into a table.
 * Uses batched INSERT statements for performance.
 */
async function insertRows(userId, schemaName, tableName, rows, batchSize = 1000) {
    if (rows.length === 0) {
        return 0;
    }
    const startTime = Date.now();
    let totalInserted = 0;
    try {
        // Get column names from first row
        const columnNames = Object.keys(rows[0]);
        const sanitizedTable = (0, db_1.sanitizeIdentifier)(tableName);
        const columnList = columnNames.map((c) => `"${c}"`).join(', ');
        // Process in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            // Build VALUES clause
            const valuePlaceholders = [];
            const params = [];
            let paramIndex = 1;
            for (const row of batch) {
                const rowPlaceholders = [];
                for (const col of columnNames) {
                    rowPlaceholders.push(`$${paramIndex}`);
                    params.push(row[col]);
                    paramIndex++;
                }
                valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
            }
            const sql = `INSERT INTO ${sanitizedTable} (${columnList}) VALUES ${valuePlaceholders.join(', ')}`;
            await (0, db_1.queryInUserSchema)(schemaName, sql, params);
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
    }
    catch (error) {
        await ETLOperation.logOperation({
            userId,
            operationType: 'insert',
            tableName,
            status: 'failed',
            rowsAffected: totalInserted,
            errorMessage: error.message,
        });
        log.error('Insert operation failed', {
            userId,
            schemaName,
            tableName,
            rowsInserted: totalInserted,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Upsert rows into a table (INSERT ... ON CONFLICT DO UPDATE).
 * Requires a unique constraint or primary key.
 */
async function upsertRows(userId, schemaName, tableName, rows, conflictColumns, batchSize = 1000) {
    if (rows.length === 0) {
        return 0;
    }
    const startTime = Date.now();
    let totalUpserted = 0;
    try {
        const columnNames = Object.keys(rows[0]);
        const sanitizedTable = (0, db_1.sanitizeIdentifier)(tableName);
        const columnList = columnNames.map((c) => `"${c}"`).join(', ');
        const conflictList = conflictColumns.map((c) => `"${c}"`).join(', ');
        // Build UPDATE clause (exclude conflict columns)
        const updateColumns = columnNames.filter((c) => !conflictColumns.includes(c));
        const updateClause = updateColumns.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');
        // Process in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const valuePlaceholders = [];
            const params = [];
            let paramIndex = 1;
            for (const row of batch) {
                const rowPlaceholders = [];
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
            await (0, db_1.queryInUserSchema)(schemaName, sql, params);
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
    }
    catch (error) {
        await ETLOperation.logOperation({
            userId,
            operationType: 'upsert',
            tableName,
            status: 'failed',
            rowsAffected: totalUpserted,
            errorMessage: error.message,
        });
        log.error('Upsert operation failed', {
            userId,
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Delete rows from a table based on WHERE clause.
 */
async function deleteRows(userId, schemaName, tableName, whereClause, whereParams) {
    try {
        const sanitizedTable = (0, db_1.sanitizeIdentifier)(tableName);
        const sql = `DELETE FROM ${sanitizedTable} WHERE ${whereClause}`;
        const result = await (0, db_1.queryInUserSchema)(schemaName, sql, whereParams);
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
    }
    catch (error) {
        await ETLOperation.logOperation({
            userId,
            operationType: 'delete',
            tableName,
            status: 'failed',
            errorMessage: error.message,
        });
        log.error('Delete operation failed', {
            userId,
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Drop a table from user schema.
 */
async function dropTable(userId, schemaName, tableName) {
    try {
        const sanitizedTable = (0, db_1.sanitizeIdentifier)(tableName);
        const sql = `DROP TABLE IF EXISTS ${sanitizedTable}`;
        await (0, db_1.queryInUserSchema)(schemaName, sql, []);
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
    }
    catch (error) {
        await ETLOperation.logOperation({
            userId,
            operationType: 'drop',
            tableName,
            status: 'failed',
            errorMessage: error.message,
        });
        log.error('Drop table failed', {
            userId,
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Truncate a table (delete all rows).
 */
async function truncateTable(userId, schemaName, tableName) {
    try {
        const sanitizedTable = (0, db_1.sanitizeIdentifier)(tableName);
        const sql = `TRUNCATE TABLE ${sanitizedTable}`;
        await (0, db_1.queryInUserSchema)(schemaName, sql, []);
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
    }
    catch (error) {
        await ETLOperation.logOperation({
            userId,
            operationType: 'truncate',
            tableName,
            status: 'failed',
            errorMessage: error.message,
        });
        log.error('Truncate table failed', {
            userId,
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get table preview (first N rows).
 */
async function getTablePreview(schemaName, tableName, limit = 100) {
    try {
        const sanitizedTable = (0, db_1.sanitizeIdentifier)(tableName);
        const sql = `SELECT * FROM ${sanitizedTable} LIMIT $1`;
        const result = await (0, db_1.queryInUserSchema)(schemaName, sql, [limit]);
        return result.rows;
    }
    catch (error) {
        log.error('Failed to get table preview', {
            schemaName,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
