"use strict";
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
exports.ensureDbUser = ensureDbUser;
exports.resetDbPassword = resetDbPassword;
const db_1 = require("./db");
const log = __importStar(require("./log"));
function pgIdent(s) {
    return s.replace(/[^a-zA-Z0-9_]/g, '');
}
async function ensureDbUser(userId, schema) {
    const pool = (0, db_1.getPool)();
    const client = await pool.connect();
    const username = `user_${pgIdent(userId)}`;
    try {
        await client.query('BEGIN');
        // Create role if not exists
        await client.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${username}') THEN
        CREATE ROLE ${username} LOGIN PASSWORD '${username}';
      END IF;
    END$$;`);
        // Grant schema usage
        await client.query(`GRANT USAGE ON SCHEMA ${schema} TO ${username};`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${username};`);
        await client.query('COMMIT');
    }
    catch (err) {
        await client.query('ROLLBACK');
        log.error('ensureDbUser failed', { error: err.message });
        throw err;
    }
    finally {
        client.release();
    }
    // Persist username to users table if column exists
    try {
        await (0, db_1.query)('UPDATE users SET db_username = $2 WHERE id = $1', [userId, username]);
    }
    catch (_) {
        // ignore if column missing in MVP
    }
    return { username };
}
async function resetDbPassword(userId) {
    const pool = (0, db_1.getPool)();
    const client = await pool.connect();
    const username = `user_${pgIdent(userId)}`;
    const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
    const newPassword = crypto.randomBytes(12).toString('hex');
    try {
        await client.query(`ALTER ROLE ${username} WITH PASSWORD '${newPassword}';`);
        // Optionally persist a hash or last rotated timestamp
        try {
            await (0, db_1.query)('UPDATE users SET updated_at = now() WHERE id = $1', [userId]);
        }
        catch (_) { }
    }
    finally {
        client.release();
    }
    return newPassword;
}
exports.default = { ensureDbUser, resetDbPassword };
