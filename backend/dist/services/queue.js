"use strict";
/**
 * Queue client for adding upload jobs without starting a worker in-process.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadQueue = getUploadQueue;
const bullmq_1 = require("bullmq");
const config_1 = __importDefault(require("./config"));
let uploadQueue = null;
function getUploadQueue() {
    if (!uploadQueue) {
        const redisUrl = config_1.default.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
        uploadQueue = new bullmq_1.Queue('upload-queue', {
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
