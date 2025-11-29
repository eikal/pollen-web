"use strict";
/**
 * Refresh Job repository for database operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.completeJob = completeJob;
exports.getRecentJobs = getRecentJobs;
exports.getJobHistory = getJobHistory;
const db_1 = require("../services/db");
/**
 * Create a new refresh job.
 */
async function createJob(params) {
    const result = await (0, db_1.query)('INSERT INTO refresh_jobs (product_id) VALUES ($1) RETURNING *', [params.product_id]);
    return result.rows[0];
}
/**
 * Complete a refresh job with outcome.
 */
async function completeJob(jobId, params) {
    // Calculate duration if not provided
    let durationMs = params.duration_ms;
    if (!durationMs) {
        const jobResult = await (0, db_1.query)('SELECT started_at FROM refresh_jobs WHERE id = $1', [jobId]);
        if (jobResult.rows[0]) {
            const startedAt = new Date(jobResult.rows[0].started_at);
            const finishedAt = new Date(params.finished_at);
            durationMs = finishedAt.getTime() - startedAt.getTime();
        }
    }
    const result = await (0, db_1.query)(`UPDATE refresh_jobs 
     SET finished_at = $2, outcome = $3, message = $4, duration_ms = $5, metadata = $6 
     WHERE id = $1 
     RETURNING *`, [
        jobId,
        params.finished_at,
        params.outcome,
        params.message || null,
        durationMs || null,
        params.metadata ? JSON.stringify(params.metadata) : null
    ]);
    return result.rows[0];
}
/**
 * Get recent refresh jobs for a product (for rate limiting check).
 */
async function getRecentJobs(productId, since) {
    const result = await (0, db_1.query)(`SELECT * FROM refresh_jobs 
     WHERE product_id = $1 AND started_at > $2 
     ORDER BY started_at DESC`, [productId, since]);
    return result.rows;
}
/**
 * Get job history for a product.
 */
async function getJobHistory(productId, limit = 10) {
    const result = await (0, db_1.query)(`SELECT * FROM refresh_jobs 
     WHERE product_id = $1 
     ORDER BY started_at DESC 
     LIMIT $2`, [productId, limit]);
    return result.rows;
}
exports.default = {
    createJob,
    completeJob,
    getRecentJobs,
    getJobHistory
};
