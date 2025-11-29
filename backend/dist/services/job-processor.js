"use strict";
/**
 * Job processor for background ETL operations using BullMQ.
 * Handles asynchronous file uploads and data processing.
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
exports.initializeQueue = initializeQueue;
exports.enqueueUpload = enqueueUpload;
exports.shutdown = shutdown;
exports.getQueueStats = getQueueStats;
const bullmq_1 = require("bullmq");
const fs = __importStar(require("fs"));
const log = __importStar(require("./log"));
const fileParser = __importStar(require("./file-parser"));
const etlService = __importStar(require("./etl-service"));
const schemaService = __importStar(require("./schema-service"));
const storageService = __importStar(require("./storage-service"));
const UploadSession = __importStar(require("../models/UploadSession"));
const Table = __importStar(require("../models/Table"));
let uploadQueue = null;
let worker = null;
/**
 * Initialize BullMQ queue and worker.
 */
async function initializeQueue(redisUrl) {
    try {
        // Create queue
        uploadQueue = new bullmq_1.Queue('upload-queue', {
            connection: {
                host: redisUrl.includes('://') ? new URL(redisUrl).hostname : redisUrl,
                port: redisUrl.includes('://') ? parseInt(new URL(redisUrl).port || '6379') : 6379,
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 100, // Keep last 100 completed jobs
                removeOnFail: 200, // Keep last 200 failed jobs
            },
        });
        log.info('BullMQ queue initialized', { queueName: 'upload-queue' });
        // Create worker
        worker = new bullmq_1.Worker('upload-queue', async (job) => {
            return await processUploadJob(job);
        }, {
            connection: {
                host: redisUrl.includes('://') ? new URL(redisUrl).hostname : redisUrl,
                port: redisUrl.includes('://') ? parseInt(new URL(redisUrl).port || '6379') : 6379,
            },
            concurrency: 5, // Process up to 5 jobs concurrently
        });
        // Worker event handlers
        worker.on('completed', (job) => {
            log.info('Job completed', {
                jobId: job.id,
                sessionId: job.data.sessionId,
                tableName: job.data.tableName,
            });
        });
        worker.on('failed', (job, err) => {
            log.error('Job failed', {
                jobId: job === null || job === void 0 ? void 0 : job.id,
                sessionId: job === null || job === void 0 ? void 0 : job.data.sessionId,
                tableName: job === null || job === void 0 ? void 0 : job.data.tableName,
                error: err.message,
            });
        });
        log.info('BullMQ worker started', { concurrency: 5 });
    }
    catch (error) {
        log.error('Failed to initialize BullMQ', {
            error: error.message,
        });
        throw error;
    }
}
/**
 * Add an upload job to the queue.
 */
async function enqueueUpload(data) {
    if (!uploadQueue) {
        throw new Error('Upload queue not initialized');
    }
    try {
        const job = await uploadQueue.add('upload', data, {
            jobId: data.sessionId, // Use session ID as job ID for idempotency
        });
        log.info('Upload job enqueued', {
            jobId: job.id,
            userId: data.userId,
            sessionId: data.sessionId,
            tableName: data.tableName,
        });
        return job.id;
    }
    catch (error) {
        log.error('Failed to enqueue upload job', {
            sessionId: data.sessionId,
            error: error.message,
        });
        throw error;
    }
}
/**
 * Process an upload job.
 */
async function processUploadJob(job) {
    const { userId, sessionId, filePath, filename, tableName, operationType, conflictColumns } = job.data;
    log.info('Processing upload job', {
        jobId: job.id,
        userId,
        sessionId,
        tableName,
        operationType,
    });
    try {
        // Update session status to processing
        await UploadSession.updateProgress(sessionId, 10);
        // Ensure user has a schema
        const schemaName = await schemaService.ensureUserSchema(userId);
        await UploadSession.updateProgress(sessionId, 20);
        // Parse file and collect rows
        const rows = [];
        let columns = [];
        const parseOptions = {
            onRow: (row, rowIndex) => {
                rows.push(row);
                // Update progress every 1000 rows
                if (rowIndex % 1000 === 0) {
                    const progress = 20 + Math.min(40, (rowIndex / 10000) * 40);
                    UploadSession.updateProgress(sessionId, progress).catch((err) => {
                        log.warn('Failed to update progress', { sessionId, error: err.message });
                    });
                }
            },
            onComplete: (totalRows) => {
                log.info('File parsing completed', {
                    sessionId,
                    tableName,
                    totalRows,
                });
            },
            onError: (error) => {
                throw error;
            },
        };
        // Parse file
        columns = await fileParser.parseFile(filePath, parseOptions);
        await UploadSession.updateProgress(sessionId, 60);
        // Check if table exists
        const tableExists = await schemaService.tableExists(userId, tableName);
        if (!tableExists) {
            // Create table
            await etlService.createTable(userId, schemaName, tableName, columns);
            // Create metadata record
            await Table.insertTableMetadata({
                userId,
                schemaName,
                tableName,
                rowCount: 0,
                sizeMb: 0,
            });
            await storageService.afterTableCreated(userId, schemaName);
        }
        await UploadSession.updateProgress(sessionId, 70);
        // Insert or upsert rows
        let rowsAffected = 0;
        if (operationType === 'upsert' && conflictColumns && conflictColumns.length > 0) {
            rowsAffected = await etlService.upsertRows(userId, schemaName, tableName, rows, conflictColumns);
        }
        else {
            rowsAffected = await etlService.insertRows(userId, schemaName, tableName, rows);
        }
        await UploadSession.updateProgress(sessionId, 90);
        // Update table metadata
        const tableRecord = await Table.getTableByName(userId, tableName);
        if (tableRecord) {
            const { sizeMb, rowCount } = await storageService.getTableSize(schemaName, tableName);
            await Table.updateTableStats(tableRecord.id, rowCount, sizeMb);
        }
        // Recalculate quota
        await storageService.recalculateQuota(userId, schemaName);
        // Mark session as completed
        await UploadSession.markCompleted(sessionId, rowsAffected);
        // Clean up temp file
        try {
            fs.unlinkSync(filePath);
            log.info('Deleted temp file', { filePath });
        }
        catch (err) {
            log.warn('Failed to delete temp file', {
                filePath,
                error: err.message,
            });
        }
        log.info('Upload job completed successfully', {
            jobId: job.id,
            userId,
            sessionId,
            tableName,
            rowsAffected,
        });
    }
    catch (error) {
        log.error('Upload job failed', {
            jobId: job.id,
            userId,
            sessionId,
            tableName,
            error: error.message,
        });
        // Mark session as failed
        await UploadSession.markFailed(sessionId, error.message);
        // Clean up temp file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (err) {
            log.warn('Failed to delete temp file after error', {
                filePath,
                error: err.message,
            });
        }
        throw error;
    }
}
/**
 * Shutdown queue and worker gracefully.
 */
async function shutdown() {
    log.info('Shutting down BullMQ queue and worker');
    if (worker) {
        await worker.close();
        log.info('Worker closed');
    }
    if (uploadQueue) {
        await uploadQueue.close();
        log.info('Queue closed');
    }
}
/**
 * Get queue statistics.
 */
async function getQueueStats() {
    if (!uploadQueue) {
        return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
    const counts = await uploadQueue.getJobCounts();
    return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
    };
}
