"use strict";
/**
 * UserSchema model for managing per-user PostgreSQL schemas.
 * Each user gets an isolated schema (e.g., user123abc) for their tables.
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
exports.generateSchemaName = generateSchemaName;
exports.createUserSchema = createUserSchema;
exports.getUserSchema = getUserSchema;
exports.dropUserSchema = dropUserSchema;
exports.listUserTables = listUserTables;
exports.tableExists = tableExists;
const db_1 = require("../services/db");
const log = __importStar(require("../services/log"));
const crypto = __importStar(require("crypto"));
/**
 * Generate a unique schema name for a user.
 * Format: user{hash} where hash is first 8 chars of SHA256(userId)
 */
function generateSchemaName(userId) {
    const hash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
    return `user${hash}`;
}
/**
 * Create a new schema for a user and update users table.
 * This is idempotent - if schema already exists, just returns the name.
 */
async function createUserSchema(userId) {
    const schemaName = generateSchemaName(userId);
    try {
        // Check if user already has a schema
        const userResult = await (0, db_1.query)('SELECT schema_name FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            throw new Error(`User ${userId} not found`);
        }
        if (userResult.rows[0].schema_name) {
            log.info('User schema already exists', { userId, schemaName: userResult.rows[0].schema_name });
            return userResult.rows[0].schema_name;
        }
        // Create schema (PostgreSQL will error if it exists, but we handle that)
        const sanitizedSchema = (0, db_1.sanitizeIdentifier)(schemaName);
        await (0, db_1.query)(`CREATE SCHEMA IF NOT EXISTS ${sanitizedSchema}`, []);
        // Grant permissions to the schema owner (application role)
        await (0, db_1.query)(`GRANT ALL ON SCHEMA ${sanitizedSchema} TO CURRENT_USER`, []);
        // Update users table with schema name
        await (0, db_1.query)('UPDATE users SET schema_name = $1 WHERE id = $2', [schemaName, userId]);
        log.info('Created user schema', { userId, schemaName });
        return schemaName;
    }
    catch (error) {
        log.error('Failed to create user schema', {
            userId,
            schemaName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get the schema name for a user.
 * Returns null if user has no schema yet.
 */
async function getUserSchema(userId) {
    const result = await (0, db_1.query)('SELECT schema_name FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new Error(`User ${userId} not found`);
    }
    return result.rows[0].schema_name;
}
/**
 * Drop a user's schema and all its tables.
 * WARNING: This is destructive and cannot be undone.
 */
async function dropUserSchema(userId) {
    const schemaName = await getUserSchema(userId);
    if (!schemaName) {
        log.warn('Attempted to drop non-existent schema', { userId });
        return;
    }
    try {
        // Drop schema and all objects in it
        const sanitizedSchema = (0, db_1.sanitizeIdentifier)(schemaName);
        await (0, db_1.query)(`DROP SCHEMA IF EXISTS ${sanitizedSchema} CASCADE`, []);
        // Clear schema name from users table
        await (0, db_1.query)('UPDATE users SET schema_name = NULL WHERE id = $1', [userId]);
        // Delete all metadata for this user
        await (0, db_1.query)('DELETE FROM user_tables WHERE user_id = $1', [userId]);
        await (0, db_1.query)('DELETE FROM etl_operations WHERE user_id = $1', [userId]);
        await (0, db_1.query)('DELETE FROM upload_sessions WHERE user_id = $1', [userId]);
        await (0, db_1.query)('DELETE FROM storage_quota WHERE user_id = $1', [userId]);
        log.info('Dropped user schema', { userId, schemaName });
    }
    catch (error) {
        log.error('Failed to drop user schema', {
            userId,
            schemaName,
            error: error.message,
        });
        throw error;
    }
}
/**
 * List all tables in a user's schema.
 */
async function listUserTables(userId) {
    const schemaName = await getUserSchema(userId);
    if (!schemaName) {
        return [];
    }
    const result = await (0, db_1.queryInUserSchema)(schemaName, `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = $1 
     AND table_type = 'BASE TABLE'
     ORDER BY table_name`, [schemaName]);
    return result.rows.map((row) => row.table_name);
}
/**
 * Check if a table exists in a user's schema.
 */
async function tableExists(userId, tableName) {
    const schemaName = await getUserSchema(userId);
    if (!schemaName) {
        return false;
    }
    const result = await (0, db_1.queryInUserSchema)(schemaName, `SELECT EXISTS (
       SELECT 1 
       FROM information_schema.tables 
       WHERE table_schema = $1 
       AND table_name = $2
     ) as exists`, [schemaName, tableName]);
    return result.rows[0].exists;
}
