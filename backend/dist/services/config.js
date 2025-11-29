"use strict";
/**
 * Configuration loader for environment variables and runtime settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const defaultConfig = {
    manualRefreshRateLimit: 5,
    refreshJobTimeout: 15 * 60 * 1000, // 15 minutes
    maxSchemaFields: 200,
    wizardResponseTimeout: 2000, // 2s
    schemaInferenceTimeout: 5000, // 5s
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/pollen',
    dbPoolMax: 20,
    dbPoolIdleTimeoutMs: 30000,
    queryTimeoutMs: 30000,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    maxFileSizeMb: 50,
    tempFileCleanupIntervalMs: 300000, // 5 minutes
    defaultStorageLimitMb: 1024, // 1GB
    defaultTableLimit: 20,
    quotaRecalcIntervalMs: 300000, // 5 minutes
    rateLimitRequestsPerMinute: 100,
    logLevel: process.env.LOG_LEVEL || 'info',
};
function getConfig() {
    return {
        ...defaultConfig,
        manualRefreshRateLimit: parseInt(process.env.MANUAL_REFRESH_RATE_LIMIT || '5', 10),
        refreshJobTimeout: parseInt(process.env.REFRESH_JOB_TIMEOUT || String(15 * 60 * 1000), 10),
        maxSchemaFields: parseInt(process.env.MAX_SCHEMA_FIELDS || '200', 10),
        wizardResponseTimeout: parseInt(process.env.WIZARD_RESPONSE_TIMEOUT || '2000', 10),
        schemaInferenceTimeout: parseInt(process.env.SCHEMA_INFERENCE_TIMEOUT || '5000', 10),
        databaseUrl: process.env.DATABASE_URL || defaultConfig.databaseUrl,
        dbPoolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
        dbPoolIdleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000', 10),
        queryTimeoutMs: parseInt(process.env.QUERY_TIMEOUT_MS || '30000', 10),
        redisUrl: process.env.REDIS_URL || defaultConfig.redisUrl,
        maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
        tempFileCleanupIntervalMs: parseInt(process.env.TEMP_FILE_CLEANUP_INTERVAL_MS || '300000', 10),
        defaultStorageLimitMb: parseInt(process.env.DEFAULT_STORAGE_LIMIT_MB || '1024', 10),
        defaultTableLimit: parseInt(process.env.DEFAULT_TABLE_LIMIT || '20', 10),
        quotaRecalcIntervalMs: parseInt(process.env.QUOTA_RECALC_INTERVAL_MS || '300000', 10),
        rateLimitRequestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100', 10),
        logLevel: process.env.LOG_LEVEL || defaultConfig.logLevel,
    };
}
exports.default = getConfig();
