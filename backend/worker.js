/**
 * BullMQ worker for CSV/Excel upload processing.
 * This is a separate Node.js process that listens to the upload queue
 * and processes file uploads in the background.
 */

require('dotenv').config();

// Import compiled TypeScript service
const jobProcessor = require('./dist/services/job-processor');
const log = require('./dist/services/log');
const config = require('./dist/services/config').default;

let running = true;

async function start() {
  try {
    log.info('Starting BullMQ worker');

    // Initialize queue and worker
    const redisUrl = config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    await jobProcessor.initializeQueue(redisUrl);

    log.info('Worker started successfully', { redisUrl });

    // Keep process alive
    process.on('SIGINT', async () => {
      if (!running) return;
      running = false;

      log.info('Received SIGINT, shutting down gracefully');
      await jobProcessor.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      if (!running) return;
      running = false;

      log.info('Received SIGTERM, shutting down gracefully');
      await jobProcessor.shutdown();
      process.exit(0);
    });

  } catch (error) {
    log.error('Worker startup failed', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

start();
