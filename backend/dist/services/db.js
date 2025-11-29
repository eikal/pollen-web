"use strict";
/**
 * Database client wrapper using pg (PostgreSQL).
 * Supports per-user schema isolation via search_path.
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
exports.getPool = getPool;
exports.query = query;
exports.queryInUserSchema = queryInUserSchema;
exports.getClientWithSchema = getClientWithSchema;
exports.sanitizeIdentifier = sanitizeIdentifier;
exports.close = close;
const pg_1 = require("pg");
const config_1 = __importDefault(require("./config"));
const log = __importStar(require("./log"));
let pool = null;
/**
 * Get or create database connection pool.
 */
function getPool() {
    if (!pool) {
        pool = new pg_1.Pool({
            connectionString: config_1.default.databaseUrl,
            max: config_1.default.dbPoolMax || 20,
            idleTimeoutMillis: config_1.default.dbPoolIdleTimeoutMs || 30000,
            connectionTimeoutMillis: 2000,
            statement_timeout: config_1.default.queryTimeoutMs || 30000, // 30s query timeout
        });
        pool.on('error', (err) => {
            log.error('Unexpected database pool error', { error: err.message });
        });
    }
    return pool;
}
/**
 * Execute a query with parameters (public schema).
 */
async function query(text, params) {
    const start = Date.now();
    const client = getPool();
    try {
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        log.debug('Database query executed', {
            query: text.substring(0, 100),
            duration_ms: duration,
            rows: result.rowCount,
        });
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        log.error('Database query failed', {
            query: text.substring(0, 100),
            duration_ms: duration,
            error: error.message,
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
async function queryInUserSchema(schemaName, text, params) {
    const start = Date.now();
    const pool = getPool();
    let client = null;
    try {
        client = await pool.connect();
        // Set search_path to user's schema + public (for metadata tables)
        await client.query(`SET search_path = ${sanitizeIdentifier(schemaName)}, public`);
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        log.debug('Database query executed in user schema', {
            schema: schemaName,
            query: text.substring(0, 100),
            duration_ms: duration,
            rows: result.rowCount,
        });
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        log.error('Database query failed in user schema', {
            schema: schemaName,
            query: text.substring(0, 100),
            duration_ms: duration,
            error: error.message,
        });
        throw error;
    }
    finally {
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
async function getClientWithSchema(schemaName) {
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
function sanitizeIdentifier(identifier) {
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
async function close() {
    if (pool) {
        await pool.end();
        pool = null;
        log.info('Database pool closed');
    }
}
exports.default = { getPool, query, queryInUserSchema, getClientWithSchema, sanitizeIdentifier, close };
