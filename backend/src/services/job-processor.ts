/**
 * Job processor for background ETL operations using BullMQ.
 * Handles asynchronous file uploads and data processing.
 */

import { Queue, Worker, Job } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import * as log from './log';
import * as fileParser from './file-parser';
import * as etlService from './etl-service';
import * as schemaService from './schema-service';
import * as storageService from './storage-service';
import * as UploadSession from '../models/UploadSession';
import * as Table from '../models/Table';
import config from './config';

export interface UploadJobData {
  userId: string;
  sessionId: string;
  filePath: string;
  filename: string;
  tableName: string;
  operationType: 'insert' | 'upsert';
  conflictColumns?: string[]; // For upsert operations
}

let uploadQueue: Queue<UploadJobData> | null = null;
let worker: Worker<UploadJobData> | null = null;

/**
 * Initialize BullMQ queue and worker.
 */
export async function initializeQueue(redisUrl: string): Promise<void> {
  try {
    // Create queue
    uploadQueue = new Queue<UploadJobData>('upload-queue', {
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
    worker = new Worker<UploadJobData>(
      'upload-queue',
      async (job: Job<UploadJobData>) => {
        return await processUploadJob(job);
      },
      {
        connection: {
          host: redisUrl.includes('://') ? new URL(redisUrl).hostname : redisUrl,
          port: redisUrl.includes('://') ? parseInt(new URL(redisUrl).port || '6379') : 6379,
        },
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

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
        jobId: job?.id,
        sessionId: job?.data.sessionId,
        tableName: job?.data.tableName,
        error: err.message,
      });
    });

    log.info('BullMQ worker started', { concurrency: 5 });
  } catch (error) {
    log.error('Failed to initialize BullMQ', {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Add an upload job to the queue.
 */
export async function enqueueUpload(data: UploadJobData): Promise<string> {
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

    return job.id!;
  } catch (error) {
    log.error('Failed to enqueue upload job', {
      sessionId: data.sessionId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Process an upload job.
 */
async function processUploadJob(job: Job<UploadJobData>): Promise<void> {
  const { userId, sessionId, filePath, filename, tableName, operationType, conflictColumns } =
    job.data;

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
    const rows: any[] = [];
    let columns: fileParser.Column[] = [];

    const parseOptions: fileParser.ParseOptions = {
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
      rowsAffected = await etlService.upsertRows(
        userId,
        schemaName,
        tableName,
        rows,
        conflictColumns
      );
    } else {
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
    } catch (err) {
      log.warn('Failed to delete temp file', {
        filePath,
        error: (err as Error).message,
      });
    }

    log.info('Upload job completed successfully', {
      jobId: job.id,
      userId,
      sessionId,
      tableName,
      rowsAffected,
    });
  } catch (error) {
    log.error('Upload job failed', {
      jobId: job.id,
      userId,
      sessionId,
      tableName,
      error: (error as Error).message,
    });

    // Mark session as failed
    await UploadSession.markFailed(sessionId, (error as Error).message);

    // Clean up temp file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      log.warn('Failed to delete temp file after error', {
        filePath,
        error: (err as Error).message,
      });
    }

    throw error;
  }
}

/**
 * Shutdown queue and worker gracefully.
 */
export async function shutdown(): Promise<void> {
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
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
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
