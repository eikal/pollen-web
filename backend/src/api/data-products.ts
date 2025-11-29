/**
 * Data Products API endpoints.
 * Provides REST interface for product CRUD operations.
 */

import express, { Request, Response } from 'express';
import * as productService from '../services/product-service';
import * as refreshService from '../services/refresh-service';

const router = express.Router();

/**
 * POST /api/data-products
 * Create a new data product from template.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { org_id, workspace_id, connection_id, type, template_id, refresh_frequency, metadata } = req.body;

    if (!org_id || !connection_id || !type) {
      return res.status(400).json({
        error: 'Missing required fields: org_id, connection_id, type'
      });
    }

    // TODO: Extract from JWT token
    const userId = 'user_placeholder';

    const product = await productService.createProduct({
      org_id,
      workspace_id,
      connection_id,
      type,
      template_id,
      owner_user_id: userId,
      refresh_frequency,
      metadata
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to create data product. Please check your configuration and try again.'
    });
  }
});

/**
 * GET /api/data-products
 * List all data products for current workspace.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { org_id, workspace_id } = req.query;

    if (!org_id || typeof org_id !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: org_id'
      });
    }

    const products = await productService.listProducts(org_id, workspace_id as string | undefined);
    res.json(products);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to retrieve data products.'
    });
  }
});

/**
 * POST /api/data-products/:id/refresh
 * Trigger manual refresh (rate limited).
 */
router.post('/:id/refresh', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await refreshService.triggerManualRefresh(id);
    res.status(202).json(job);
  } catch (error) {
    const message = (error as Error).message;
    
    if (message.includes('rate limit')) {
      return res.status(429).json({
        error: message
      });
    }

    res.status(500).json({
      error: 'Unable to trigger refresh. Please try again later.'
    });
  }
});

/**
 * POST /api/data-products/:id/duplicate
 * Duplicate a product for iteration.
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Extract from JWT token
    const userId = 'user_placeholder';

    const duplicate = await productService.duplicateProduct(id, userId);
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to duplicate product.'
    });
  }
});

/**
 * PATCH /api/data-products/:id/metrics/:metricId
 * Update KPI metric formula (versioned).
 */
router.patch('/:id/metrics/:metricId', async (req: Request, res: Response) => {
  try {
    const { id: productId, metricId } = req.params;
    const { name, formula_expression } = req.body;

    const updated = await productService.updateMetric(
      productId,
      metricId,
      {
        name,
        formula_expression
      }
    );

    res.json(updated);
  } catch (error) {
    const message = (error as Error).message;
    
    if (message.includes('Invalid formula')) {
      return res.status(400).json({
        error: 'The formula you entered is invalid. Please check your syntax and try again.',
        details: message
      });
    }

    res.status(500).json({
      error: 'Unable to update metric.'
    });
  }
});

export default router;
