/**
 * Queue client for adding upload jobs without starting a worker in-process.
 */

import { Queue } from 'bullmq';
import config from './config';

export type UploadJobData = {
  userId: string;
  sessionId: string;
  filePath: string;
  filename: string;
  tableName: string;
  operationType: 'insert' | 'upsert';
  conflictColumns?: string[];
  sheet?: string;
};

let uploadQueue: Queue<UploadJobData> | null = null;

export function getUploadQueue(): Queue<UploadJobData> {
  if (!uploadQueue) {
    const redisUrl = config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    uploadQueue = new Queue<UploadJobData>('upload-queue', {
      connection: { url: redisUrl },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return uploadQueue;
}
