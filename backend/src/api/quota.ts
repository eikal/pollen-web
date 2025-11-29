/**
 * Quota API endpoints.
 * Provides storage quota information for authenticated users.
 */

import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import * as storageService from '../services/storage-service';
import * as schemaService from '../services/schema-service';
import * as log from '../services/log';

const router = express.Router();

/**
 * GET /api/quota
 * Get current storage quota information for the authenticated user.
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
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
  } catch (error) {
    log.error('Failed to get quota', {
      userId: req.user.id,
      error: (error as Error).message,
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
router.post('/recalculate', authenticateJWT, async (req: Request, res: Response) => {
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
  } catch (error) {
    log.error('Failed to recalculate quota', {
      userId: req.user.id,
      error: (error as Error).message,
    });

    return res.status(500).json({
      success: false,
      errorCode: 'QUOTA_RECALC_FAILED',
      message: 'Unable to recalculate storage. Please try again.',
    });
  }
});

export default router;
