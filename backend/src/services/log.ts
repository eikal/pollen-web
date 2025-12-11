/**
 * Structured logging utility for observability.
 * Outputs JSON-formatted logs for refresh jobs and other events.
 */

import config from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[config.logLevel];
}

function log(level: LogLevel, message: string, context?: Record<string, any>): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context })
  };
  
  console.log(JSON.stringify(entry));
}

export function debug(message: string, context?: Record<string, any>): void {
  log('debug', message, context);
}

export function info(message: string, context?: Record<string, any>): void {
  log('info', message, context);
}

export function warn(message: string, context?: Record<string, any>): void {
  log('warn', message, context);
}

export function error(message: string, context?: Record<string, any>): void {
  log('error', message, context);
}

/**
 * Log a refresh job event with structured fields.
 */
export function logRefreshJob(
  productId: string,
  event: 'started' | 'completed' | 'failed',
  details?: { duration_ms?: number; outcome?: string; message?: string }
): void {
  info(`Refresh job ${event}`, {
    product_id: productId,
    event,
    ...details
  });
}

export default { debug, info, warn, error, logRefreshJob };
