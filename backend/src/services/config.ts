/**
 * Configuration loader for environment variables and runtime settings.
 */

interface Config {
  // Refresh job limits (legacy - may be removed)
  manualRefreshRateLimit: number; // max manual refreshes per hour per product
  refreshJobTimeout: number; // max job duration in milliseconds (15 min default)
  
  // Schema inference
  maxSchemaFields: number; // max fields displayed in preview
  
  // Performance targets
  wizardResponseTimeout: number; // p95 target in ms
  schemaInferenceTimeout: number; // max time for schema discovery in ms
  
  // Database
  databaseUrl: string;
  dbPoolMax: number; // max connections in pool
  dbPoolIdleTimeoutMs: number; // idle connection timeout
  queryTimeoutMs: number; // query execution timeout
  
  // Redis
  redisUrl: string;
  
  // File upload limits
  maxFileSizeMb: number; // max file size in MB
  tempFileCleanupIntervalMs: number; // cleanup interval for temp files
  
  // Storage quota
  defaultStorageLimitMb: number; // free plan storage limit (1GB)
  defaultTableLimit: number; // free plan table limit (20 tables)
  quotaRecalcIntervalMs: number; // quota recalculation interval
  
  // Rate limiting
  rateLimitRequestsPerMinute: number; // API rate limit per user
  
  // Observability
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const defaultConfig: Config = {
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
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
};

export function getConfig(): Config {
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
    logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || defaultConfig.logLevel,
  };
}

export default getConfig();
