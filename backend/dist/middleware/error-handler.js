"use strict";
/**
 * Error handler middleware for CSV/Excel ETL service.
 * Maps PostgreSQL errors to business-friendly messages.
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
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const log = __importStar(require("../services/log"));
// PostgreSQL error codes
const PG_ERROR_CODES = {
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
/**
 * Global error handler middleware.
 * Should be registered last in Express app: app.use(errorHandler)
 */
function errorHandler(err, req, res, next) {
    var _a, _b, _c, _d;
    // Check if response already sent
    if (res.headersSent) {
        next(err);
        return;
    }
    const pgError = err;
    // Map PostgreSQL errors to business messages
    if (pgError.code && PG_ERROR_CODES[pgError.code]) {
        const mapped = PG_ERROR_CODES[pgError.code];
        log.warn('PostgreSQL error mapped to business message', {
            pgCode: pgError.code,
            errorCode: mapped.code,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
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
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
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
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
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
        userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d.id,
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
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `The requested endpoint ${req.method} ${req.path} was not found.`,
        errorCode: 'NOT_FOUND',
    });
}
