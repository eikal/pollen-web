"use strict";
/**
 * Refresh Service: Manages manual and scheduled refresh jobs with rate limiting.
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
exports.triggerManualRefresh = triggerManualRefresh;
exports.completeRefreshJob = completeRefreshJob;
exports.scheduleRefresh = scheduleRefresh;
const config_1 = __importDefault(require("./config"));
const log = __importStar(require("./log"));
const RefreshJobRepository_1 = __importDefault(require("../models/RefreshJobRepository"));
/**
 * Trigger a manual refresh for a data product with rate limiting.
 * @param productId - Product identifier
 * @throws Error if rate limit exceeded
 * @returns Created refresh job
 */
async function triggerManualRefresh(productId) {
    await checkRateLimit(productId);
    const job = await RefreshJobRepository_1.default.createJob({ product_id: productId });
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
async function completeRefreshJob(jobId, outcome, message) {
    await RefreshJobRepository_1.default.completeJob(jobId, {
        finished_at: new Date(),
        outcome: outcome,
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
async function checkRateLimit(productId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentJobs = await RefreshJobRepository_1.default.getRecentJobs(productId, oneHourAgo);
    if (recentJobs.length >= config_1.default.manualRefreshRateLimit) {
        throw new Error(`Manual refresh limit exceeded. You can trigger up to ${config_1.default.manualRefreshRateLimit} refreshes per hour.`);
    }
}
/**
 * Schedule daily refresh for a product.
 * @param productId - Product identifier
 */
async function scheduleRefresh(productId) {
    log.info('Scheduled refresh registered', { product_id: productId });
    // TODO: Integrate with cron/worker scheduler
}
exports.default = {
    triggerManualRefresh,
    completeRefreshJob,
    scheduleRefresh
};
