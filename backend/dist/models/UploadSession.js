"use strict";
/**
 * UploadSession model for tracking file upload progress.
 * Provides real-time status updates for long-running uploads.
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
exports.createSession = createSession;
exports.getSession = getSession;
exports.updateProgress = updateProgress;
exports.markCompleted = markCompleted;
exports.markFailed = markFailed;
exports.getRecentSessions = getRecentSessions;
exports.deleteOldSessions = deleteOldSessions;
exports.getSessionStats = getSessionStats;
const db_1 = require("../services/db");
const log = __importStar(require("../services/log"));
const crypto = __importStar(require("crypto"));
/**
 * Generate a unique session ID.
 */
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}
/**
 * Create a new upload session.
 */
async function createSession(params) {
    const { userId, filename, fileSizeBytes } = params;
    const sessionId = generateSessionId();
    try {
        await (0, db_1.query)(`INSERT INTO upload_sessions 
       (session_id, user_id, filename, file_size_bytes, status, progress_pct)
       VALUES ($1, $2, $3, $4, 'uploading', 0)`, [sessionId, userId, filename, fileSizeBytes]);
        log.info('Created upload session', {
            userId,
            sessionId,
            filename,
            fileSizeBytes,
        });
        return sessionId;
    }
    catch (error) {
        log.error('Failed to create upload session', {
            userId,
            filename,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get upload session by ID.
 */
async function getSession(sessionId) {
    const result = await (0, db_1.query)(`SELECT session_id as "sessionId", user_id as "userId", 
            filename, file_size_bytes as "fileSizeBytes",
            status, progress_pct as "progressPct", 
            error_message as "errorMessage",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM upload_sessions
     WHERE session_id = $1`, [sessionId]);
    return result.rows.length > 0 ? result.rows[0] : null;
}
/**
 * Update session progress percentage.
 */
async function updateProgress(sessionId, progressPct) {
    try {
        await (0, db_1.query)(`UPDATE upload_sessions
       SET progress_pct = $1, status = 'processing', updated_at = NOW()
       WHERE session_id = $2`, [progressPct, sessionId]);
        log.info('Updated upload progress', { sessionId, progressPct });
    }
    catch (error) {
        log.error('Failed to update upload progress', {
            sessionId,
            progressPct,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Mark session as completed.
 */
async function markCompleted(sessionId, rowsInserted) {
    try {
        await (0, db_1.query)(`UPDATE upload_sessions
       SET status = 'completed', progress_pct = 100, updated_at = NOW()
       WHERE session_id = $1`, [sessionId]);
        log.info('Marked upload session as completed', {
            sessionId,
            rowsInserted,
        });
    }
    catch (error) {
        log.error('Failed to mark session as completed', {
            sessionId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Mark session as failed with error message.
 */
async function markFailed(sessionId, errorMessage) {
    try {
        await (0, db_1.query)(`UPDATE upload_sessions
       SET status = 'failed', error_message = $1, updated_at = NOW()
       WHERE session_id = $2`, [errorMessage, sessionId]);
        log.error('Marked upload session as failed', {
            sessionId,
            errorMessage,
        });
    }
    catch (error) {
        log.error('Failed to mark session as failed', {
            sessionId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Get recent upload sessions for a user.
 */
async function getRecentSessions(userId, limit = 20) {
    const result = await (0, db_1.query)(`SELECT session_id as "sessionId", user_id as "userId", 
            filename, file_size_bytes as "fileSizeBytes",
            status, progress_pct as "progressPct", 
            error_message as "errorMessage",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM upload_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`, [userId, limit]);
    return result.rows;
}
/**
 * Delete old upload sessions (older than 1 hour).
 * This should be run periodically as a cleanup job.
 */
async function deleteOldSessions() {
    const result = await (0, db_1.query)(`WITH deleted AS (
       DELETE FROM upload_sessions
       WHERE created_at < NOW() - INTERVAL '1 hour'
       RETURNING session_id
     )
     SELECT COUNT(*) as deleted_count FROM deleted`);
    const deletedCount = Number(result.rows[0].deleted_count);
    if (deletedCount > 0) {
        log.info('Deleted old upload sessions', { deletedCount });
    }
    return deletedCount;
}
/**
 * Get session statistics for a user.
 */
async function getSessionStats(userId) {
    const result = await (0, db_1.query)(`SELECT 
       COUNT(*) as total_sessions,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
       SUM(CASE WHEN status IN ('uploading', 'processing') THEN 1 ELSE 0 END) as in_progress_count
     FROM upload_sessions
     WHERE user_id = $1`, [userId]);
    return {
        totalSessions: Number(result.rows[0].total_sessions),
        completedCount: Number(result.rows[0].completed_count),
        failedCount: Number(result.rows[0].failed_count),
        inProgressCount: Number(result.rows[0].in_progress_count),
    };
}
