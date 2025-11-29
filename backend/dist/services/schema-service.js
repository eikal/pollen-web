"use strict";
/**
 * Schema service for provisioning user-isolated PostgreSQL schemas.
 * Each user gets a dedicated schema (e.g., user123abc) for data isolation.
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
exports.provisionUserSchema = provisionUserSchema;
exports.getSchemaName = getSchemaName;
exports.ensureUserSchema = ensureUserSchema;
exports.deleteUserSchema = deleteUserSchema;
exports.listTables = listTables;
exports.tableExists = tableExists;
const UserSchema = __importStar(require("../models/UserSchema"));
const log = __importStar(require("./log"));
/**
 * Provision a schema for a user.
 * Creates schema if it doesn't exist and updates users table.
 * This is idempotent - safe to call multiple times.
 */
async function provisionUserSchema(userId) {
    try {
        log.info('Provisioning user schema', { userId });
        const schemaName = await UserSchema.createUserSchema(userId);
        log.info('User schema provisioned', { userId, schemaName });
        return schemaName;
    }
    catch (error) {
        log.error('Failed to provision user schema', {
            userId,
            error: error.message,
        });
        throw new Error(`Failed to provision schema for user: ${error.message}`);
    }
}
/**
 * Get the schema name for a user.
 * Returns null if user has no schema yet.
 */
async function getSchemaName(userId) {
    try {
        return await UserSchema.getUserSchema(userId);
    }
    catch (error) {
        log.error('Failed to get schema name', {
            userId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Ensure user has a schema, creating one if necessary.
 * Convenience method for API endpoints.
 */
async function ensureUserSchema(userId) {
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
async function deleteUserSchema(userId) {
    try {
        log.warn('Deleting user schema', { userId });
        await UserSchema.dropUserSchema(userId);
        log.info('User schema deleted', { userId });
    }
    catch (error) {
        log.error('Failed to delete user schema', {
            userId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * List all tables in a user's schema.
 */
async function listTables(userId) {
    try {
        return await UserSchema.listUserTables(userId);
    }
    catch (error) {
        log.error('Failed to list user tables', {
            userId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Check if a table exists in user's schema.
 */
async function tableExists(userId, tableName) {
    try {
        return await UserSchema.tableExists(userId, tableName);
    }
    catch (error) {
        log.error('Failed to check table existence', {
            userId,
            tableName,
            error: error.message,
        });
        throw error;
    }
}
