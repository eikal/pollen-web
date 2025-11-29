/**
 * Refresh Service: Manages manual and scheduled refresh jobs with rate limiting.
 */

import config from './config';
import * as log from './log';
import RefreshJobRepository from '../models/RefreshJobRepository';
import type RefreshJob from '../models/RefreshJob';

/**
 * Trigger a manual refresh for a data product with rate limiting.
 * @param productId - Product identifier
 * @throws Error if rate limit exceeded
 * @returns Created refresh job
 */
export async function triggerManualRefresh(productId: string): Promise<RefreshJob> {
  await checkRateLimit(productId);

  const job = await RefreshJobRepository.createJob({ product_id: productId });

  log.logRefreshJob(productId, 'started');

  // TODO: Enqueue actual refresh work (worker.js integration)
  // For now, simulate completion
  setTimeout(() => {
    completeRefreshJob(job.id, 'success');
  }, 1000);

  return job;
}

/**
 * Complete a refresh job with outcome.
 * @param jobId - Job identifier
 * @param outcome - Result status
 * @param message - Optional message
 */
export async function completeRefreshJob(
  jobId: string,
  outcome: RefreshJob['outcome'],
  message?: string
): Promise<void> {
  await RefreshJobRepository.completeJob(jobId, {
    finished_at: new Date(),
    outcome: outcome!,
    message
  });

  log.logRefreshJob('unknown', outcome === 'success' ? 'completed' : 'failed', {
    outcome,
    message
  });
}

/**
 * Check if product has exceeded manual refresh rate limit.
 * @param productId - Product identifier
 * @throws Error if limit exceeded
 */
async function checkRateLimit(productId: string): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentJobs = await RefreshJobRepository.getRecentJobs(productId, oneHourAgo);

  if (recentJobs.length >= config.manualRefreshRateLimit) {
    throw new Error(
      `Manual refresh limit exceeded. You can trigger up to ${config.manualRefreshRateLimit} refreshes per hour.`
    );
  }
}

/**
 * Schedule daily refresh for a product.
 * @param productId - Product identifier
 */
export async function scheduleRefresh(productId: string): Promise<void> {
  log.info('Scheduled refresh registered', { product_id: productId });
  // TODO: Integrate with cron/worker scheduler
}

export default {
  triggerManualRefresh,
  completeRefreshJob,
  scheduleRefresh
};
