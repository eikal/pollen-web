"use strict";
/**
 * Upload limits middleware for CSV/Excel ETL service.
 * Validates file size and checks storage quota before upload.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.checkQuotaBeforeUpload = checkQuotaBeforeUpload;
exports.handleMulterError = handleMulterError;
const multer_1 = __importDefault(require("multer"));
const config_1 = __importDefault(require("../services/config"));
const log = __importStar(require("../services/log"));
const db_1 = require("../services/db");
/**
 * Multer configuration for file uploads.
 * Stores files in OS temp directory with unique names.
 */
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            // Use OS temp directory
            cb(null, require('os').tmpdir());
        },
        filename: (req, file, cb) => {
            // Generate unique filename: timestamp-random-originalname
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `upload-${uniqueSuffix}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: config_1.default.maxFileSizeMb * 1024 * 1024, // Convert MB to bytes
    },
    fileFilter: (req, file, cb) => {
        // Accept only CSV and Excel files
        const allowedMimes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedMimes.includes(file.mimetype) ||
            file.originalname.endsWith('.csv') ||
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls).'));
        }
    },
});
/**
 * Middleware to check storage quota before upload.
 * Must be used after authenticateJWT middleware.
 *
 * Usage:
 * app.post('/upload', authenticateJWT, checkQuotaBeforeUpload, upload.single('file'), ...)
 */
async function checkQuotaBeforeUpload(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.',
            errorCode: 'AUTHENTICATION_REQUIRED',
        });
        return;
    }
    try {
        // Get current storage quota
        const result = await (0, db_1.query)(`SELECT total_tables, total_size_mb, limit_mb 
       FROM storage_quota 
       WHERE user_id = $1`, [req.user.id]);
        // Initialize quota if not exists
        if (result.rows.length === 0) {
            await (0, db_1.query)(`INSERT INTO storage_quota (user_id, total_tables, total_size_mb, limit_mb)
         VALUES ($1, 0, 0, $2)`, [req.user.id, config_1.default.defaultStorageLimitMb]);
            log.info('Initialized storage quota for new user', {
                userId: req.user.id,
                limitMb: config_1.default.defaultStorageLimitMb,
            });
            next();
            return;
        }
        const quota = result.rows[0];
        // Check table limit (20 tables for free plan)
        if (quota.total_tables >= config_1.default.defaultTableLimit) {
            res.status(507).json({
                success: false,
                message: `You have reached the maximum number of tables (${config_1.default.defaultTableLimit}). Please delete some tables to continue.`,
                errorCode: 'TABLE_LIMIT_EXCEEDED',
                details: {
                    currentTables: quota.total_tables,
                    tableLimit: config_1.default.defaultTableLimit,
                },
            });
            return;
        }
        // Check storage limit (1GB for free plan)
        // Estimate: assume uploaded file will use at most 2x its size when loaded into DB
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        const estimatedSizeMb = (contentLength * 2) / (1024 * 1024);
        if (quota.total_size_mb + estimatedSizeMb > quota.limit_mb) {
            const availableMb = Math.max(0, quota.limit_mb - quota.total_size_mb);
            res.status(507).json({
                success: false,
                message: `Your storage is full (${quota.total_size_mb.toFixed(2)}MB used of ${quota.limit_mb}MB limit). Please delete some tables to free up space.`,
                errorCode: 'STORAGE_QUOTA_EXCEEDED',
                details: {
                    currentSizeMb: quota.total_size_mb,
                    limitMb: quota.limit_mb,
                    availableMb: availableMb.toFixed(2),
                },
            });
            return;
        }
        // Warn if approaching limit (80% threshold)
        const usagePercent = (quota.total_size_mb / quota.limit_mb) * 100;
        if (usagePercent >= 80) {
            log.warn('User approaching storage limit', {
                userId: req.user.id,
                usagePercent: usagePercent.toFixed(1),
                currentSizeMb: quota.total_size_mb,
                limitMb: quota.limit_mb,
            });
            // Add warning to response headers (frontend can display banner)
            res.setHeader('X-Storage-Warning', 'true');
            res.setHeader('X-Storage-Usage-Percent', usagePercent.toFixed(1));
        }
        next();
    }
    catch (error) {
        log.error('Quota check failed', {
            userId: req.user.id,
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: 'Unable to verify storage quota. Please try again.',
            errorCode: 'QUOTA_CHECK_FAILED',
        });
    }
}
/**
 * Multer error handler middleware.
 * Converts Multer errors to business-friendly messages.
 */
function handleMulterError(err, req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({
                success: false,
                message: `Your file is too large. Maximum file size is ${config_1.default.maxFileSizeMb}MB.`,
                errorCode: 'FILE_TOO_LARGE',
                details: {
                    maxSizeMb: config_1.default.maxFileSizeMb,
                },
            });
            return;
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            res.status(400).json({
                success: false,
                message: 'Unexpected file field. Please use "file" as the field name.',
                errorCode: 'INVALID_FILE_FIELD',
            });
            return;
        }
        res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            errorCode: 'UPLOAD_ERROR',
        });
        return;
    }
    // Pass to global error handler
    next(err);
}
