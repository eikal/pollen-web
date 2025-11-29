/**
 * UploadSession model for tracking file upload progress.
 * Provides real-time status updates for long-running uploads.
 */

import { query } from '../services/db';
import * as log from '../services/log';
import * as crypto from 'crypto';

export type UploadStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface UploadSessionRecord {
  sessionId: string;
  userId: string;
  filename: string;
  fileSizeBytes: number;
  status: UploadStatus;
  progressPct: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionParams {
  userId: string;
  filename: string;
  fileSizeBytes: number;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a new upload session.
 */
export async function createSession(params: CreateSessionParams): Promise<string> {
  const { userId, filename, fileSizeBytes } = params;
  const sessionId = generateSessionId();

  try {
    await query(
      `INSERT INTO upload_sessions 
       (session_id, user_id, filename, file_size_bytes, status, progress_pct)
       VALUES ($1, $2, $3, $4, 'uploading', 0)`,
      [sessionId, userId, filename, fileSizeBytes]
    );

    log.info('Created upload session', {
      userId,
      sessionId,
      filename,
      fileSizeBytes,
    });

    return sessionId;
  } catch (error) {
    log.error('Failed to create upload session', {
      userId,
      filename,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get upload session by ID.
 */
export async function getSession(sessionId: string): Promise<UploadSessionRecord | null> {
  const result = await query<UploadSessionRecord>(
    `SELECT session_id as "sessionId", user_id as "userId", 
            filename, file_size_bytes as "fileSizeBytes",
            status, progress_pct as "progressPct", 
            error_message as "errorMessage",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM upload_sessions
     WHERE session_id = $1`,
    [sessionId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Update session progress percentage.
 */
export async function updateProgress(sessionId: string, progressPct: number): Promise<void> {
  try {
    await query(
      `UPDATE upload_sessions
       SET progress_pct = $1, status = 'processing', updated_at = NOW()
       WHERE session_id = $2`,
      [progressPct, sessionId]
    );

    log.info('Updated upload progress', { sessionId, progressPct });
  } catch (error) {
    log.error('Failed to update upload progress', {
      sessionId,
      progressPct,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Mark session as completed.
 */
export async function markCompleted(sessionId: string, rowsInserted: number): Promise<void> {
  try {
    await query(
      `UPDATE upload_sessions
       SET status = 'completed', progress_pct = 100, updated_at = NOW()
       WHERE session_id = $1`,
      [sessionId]
    );

    log.info('Marked upload session as completed', {
      sessionId,
      rowsInserted,
    });
  } catch (error) {
    log.error('Failed to mark session as completed', {
      sessionId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Mark session as failed with error message.
 */
export async function markFailed(sessionId: string, errorMessage: string): Promise<void> {
  try {
    await query(
      `UPDATE upload_sessions
       SET status = 'failed', error_message = $1, updated_at = NOW()
       WHERE session_id = $2`,
      [errorMessage, sessionId]
    );

    log.error('Marked upload session as failed', {
      sessionId,
      errorMessage,
    });
  } catch (error) {
    log.error('Failed to mark session as failed', {
      sessionId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get recent upload sessions for a user.
 */
export async function getRecentSessions(
  userId: string,
  limit: number = 20
): Promise<UploadSessionRecord[]> {
  const result = await query<UploadSessionRecord>(
    `SELECT session_id as "sessionId", user_id as "userId", 
            filename, file_size_bytes as "fileSizeBytes",
            status, progress_pct as "progressPct", 
            error_message as "errorMessage",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM upload_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

/**
 * Delete old upload sessions (older than 1 hour).
 * This should be run periodically as a cleanup job.
 */
export async function deleteOldSessions(): Promise<number> {
  const result = await query<{ deleted_count: number }>(
    `WITH deleted AS (
       DELETE FROM upload_sessions
       WHERE created_at < NOW() - INTERVAL '1 hour'
       RETURNING session_id
     )
     SELECT COUNT(*) as deleted_count FROM deleted`
  );

  const deletedCount = Number(result.rows[0].deleted_count);

  if (deletedCount > 0) {
    log.info('Deleted old upload sessions', { deletedCount });
  }

  return deletedCount;
}

/**
 * Get session statistics for a user.
 */
export async function getSessionStats(userId: string): Promise<{
  totalSessions: number;
  completedCount: number;
  failedCount: number;
  inProgressCount: number;
}> {
  const result = await query<{
    total_sessions: number;
    completed_count: number;
    failed_count: number;
    in_progress_count: number;
  }>(
    `SELECT 
       COUNT(*) as total_sessions,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
       SUM(CASE WHEN status IN ('uploading', 'processing') THEN 1 ELSE 0 END) as in_progress_count
     FROM upload_sessions
     WHERE user_id = $1`,
    [userId]
  );

  return {
    totalSessions: Number(result.rows[0].total_sessions),
    completedCount: Number(result.rows[0].completed_count),
    failedCount: Number(result.rows[0].failed_count),
    inProgressCount: Number(result.rows[0].in_progress_count),
  };
}
