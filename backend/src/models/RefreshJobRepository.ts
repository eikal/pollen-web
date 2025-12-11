/**
 * Refresh Job repository for database operations.
 */

import { query } from '../services/db';
import RefreshJob, { CreateRefreshJobParams, CompleteRefreshJobParams } from '../models/RefreshJob';

/**
 * Create a new refresh job.
 */
export async function createJob(params: CreateRefreshJobParams): Promise<RefreshJob> {
  const result = await query<RefreshJob>(
    'INSERT INTO refresh_jobs (product_id) VALUES ($1) RETURNING *',
    [params.product_id]
  );

  return result.rows[0];
}

/**
 * Complete a refresh job with outcome.
 */
export async function completeJob(
  jobId: string,
  params: CompleteRefreshJobParams
): Promise<RefreshJob> {
  // Calculate duration if not provided
  let durationMs = params.duration_ms;
  if (!durationMs) {
    const jobResult = await query<{ started_at: Date }>(
      'SELECT started_at FROM refresh_jobs WHERE id = $1',
      [jobId]
    );
    if (jobResult.rows[0]) {
      const startedAt = new Date(jobResult.rows[0].started_at);
      const finishedAt = new Date(params.finished_at);
      durationMs = finishedAt.getTime() - startedAt.getTime();
    }
  }

  const result = await query<RefreshJob>(
    `UPDATE refresh_jobs 
     SET finished_at = $2, outcome = $3, message = $4, duration_ms = $5, metadata = $6 
     WHERE id = $1 
     RETURNING *`,
    [
      jobId,
      params.finished_at,
      params.outcome,
      params.message || null,
      durationMs || null,
      params.metadata ? JSON.stringify(params.metadata) : null
    ]
  );

  return result.rows[0];
}

/**
 * Get recent refresh jobs for a product (for rate limiting check).
 */
export async function getRecentJobs(
  productId: string,
  since: Date
): Promise<RefreshJob[]> {
  const result = await query<RefreshJob>(
    `SELECT * FROM refresh_jobs 
     WHERE product_id = $1 AND started_at > $2 
     ORDER BY started_at DESC`,
    [productId, since]
  );

  return result.rows;
}

/**
 * Get job history for a product.
 */
export async function getJobHistory(
  productId: string,
  limit: number = 10
): Promise<RefreshJob[]> {
  const result = await query<RefreshJob>(
    `SELECT * FROM refresh_jobs 
     WHERE product_id = $1 
     ORDER BY started_at DESC 
     LIMIT $2`,
    [productId, limit]
  );

  return result.rows;
}

export default {
  createJob,
  completeJob,
  getRecentJobs,
  getJobHistory
};
