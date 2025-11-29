"use strict";
/**
 * Quota API endpoints.
 * Provides storage quota information for authenticated users.
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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const storageService = __importStar(require("../services/storage-service"));
const schemaService = __importStar(require("../services/schema-service"));
const log = __importStar(require("../services/log"));
const router = express_1.default.Router();
/**
 * GET /api/quota
 * Get current storage quota information for the authenticated user.
 */
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            errorCode: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required.',
        });
    }
    try {
        const quota = await storageService.getQuota(req.user.id);
        const warnings = await storageService.getQuotaWarnings(req.user.id);
        return res.json({
            success: true,
            quota: {
                totalTables: quota.totalTables,
                totalSizeMb: parseFloat(quota.totalSizeMb.toFixed(2)),
                limitMb: quota.limitMb,
                availableMb: parseFloat(quota.availableMb.toFixed(2)),
                usagePercent: parseFloat(quota.usagePercent.toFixed(1)),
                lastCalculatedAt: quota.lastCalculatedAt,
            },
            warnings: {
                hasWarnings: warnings.hasWarnings,
                messages: warnings.warnings,
            },
        });
    }
    catch (error) {
        log.error('Failed to get quota', {
            userId: req.user.id,
            error: error.message,
        });
        return res.status(500).json({
            success: false,
            errorCode: 'QUOTA_FETCH_FAILED',
            message: 'Unable to retrieve storage information. Please try again.',
        });
    }
});
/**
 * POST /api/quota/recalculate
 * Manually trigger quota recalculation (for admin/debugging).
 */
router.post('/recalculate', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            errorCode: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required.',
        });
    }
    try {
        const schemaName = await schemaService.ensureUserSchema(req.user.id);
        await storageService.recalculateQuota(req.user.id, schemaName);
        const quota = await storageService.getQuota(req.user.id);
        log.info('Quota recalculated manually', {
            userId: req.user.id,
            totalTables: quota.totalTables,
            totalSizeMb: quota.totalSizeMb,
        });
        return res.json({
            success: true,
            quota: {
                totalTables: quota.totalTables,
                totalSizeMb: parseFloat(quota.totalSizeMb.toFixed(2)),
                limitMb: quota.limitMb,
                availableMb: parseFloat(quota.availableMb.toFixed(2)),
                usagePercent: parseFloat(quota.usagePercent.toFixed(1)),
                lastCalculatedAt: quota.lastCalculatedAt,
            },
        });
    }
    catch (error) {
        log.error('Failed to recalculate quota', {
            userId: req.user.id,
            error: error.message,
        });
        return res.status(500).json({
            success: false,
            errorCode: 'QUOTA_RECALC_FAILED',
            message: 'Unable to recalculate storage. Please try again.',
        });
    }
});
exports.default = router;
