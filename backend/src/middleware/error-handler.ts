/**
 * Error handler middleware for CSV/Excel ETL service.
 * Maps PostgreSQL errors to business-friendly messages.
 */

import { Request, Response, NextFunction } from 'express';
import * as log from '../services/log';

// PostgreSQL error codes
const PG_ERROR_CODES: Record<string, { message: string; code: string }> = {
  '42P01': {
    message: 'The table could not be found. It may have been deleted.',
    code: 'TABLE_NOT_FOUND',
  },
  '42703': {
    message: 'The specified column was not found in the table. Please check the column name.',
    code: 'COLUMN_NOT_FOUND',
  },
  '23505': {
    message: 'A row with this key already exists. Use upsert to update existing rows.',
    code: 'DUPLICATE_KEY',
  },
  '23502': {
    message: 'Required column cannot be empty. Please provide a value.',
    code: 'NOT_NULL_VIOLATION',
  },
  '22P02': {
    message: 'Invalid data format. Please check your data types match the table schema.',
    code: 'INVALID_TEXT_REPRESENTATION',
  },
  '42P07': {
    message: 'A table with this name already exists. Please choose a different name.',
    code: 'DUPLICATE_TABLE',
  },
  '3F000': {
    message: 'Schema not found. Please contact support.',
    code: 'INVALID_SCHEMA_NAME',
  },
  '57014': {
    message: 'Query took too long and was cancelled. Please try with less data or contact support.',
    code: 'QUERY_CANCELED',
  },
};

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  column?: string;
}

/**
 * Global error handler middleware.
 * Should be registered last in Express app: app.use(errorHandler)
 */
export function errorHandler(
  err: Error | PostgresError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if response already sent
  if (res.headersSent) {
    next(err);
    return;
  }

  const pgError = err as PostgresError;
  
  // Map PostgreSQL errors to business messages
  if (pgError.code && PG_ERROR_CODES[pgError.code]) {
    const mapped = PG_ERROR_CODES[pgError.code];
    
    log.warn('PostgreSQL error mapped to business message', {
      pgCode: pgError.code,
      errorCode: mapped.code,
      userId: req.user?.id,
      path: req.path,
    });

    res.status(400).json({
      success: false,
      message: mapped.message,
      errorCode: mapped.code,
      details: pgError.detail || null,
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    log.warn('Validation error', {
      error: err.message,
      userId: req.user?.id,
      path: req.path,
    });

    res.status(400).json({
      success: false,
      message: err.message,
      errorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // Handle file too large errors
  if (err.message.includes('File too large') || err.message.includes('PayloadTooLarge')) {
    log.warn('File too large', {
      userId: req.user?.id,
      path: req.path,
    });

    res.status(413).json({
      success: false,
      message: 'Your file is too large. Maximum file size is 50MB.',
      errorCode: 'FILE_TOO_LARGE',
    });
    return;
  }

  // Log unexpected errors with stack trace (not shown to user per NFR-007)
  log.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
  });

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Our team has been notified. Please try again later.',
    errorCode: 'INTERNAL_ERROR',
  });
}

/**
 * 404 handler for undefined routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `The requested endpoint ${req.method} ${req.path} was not found.`,
    errorCode: 'NOT_FOUND',
  });
}
