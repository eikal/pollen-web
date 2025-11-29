"use strict";
/**
 * Data Products API endpoints.
 * Provides REST interface for product CRUD operations.
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
const productService = __importStar(require("../services/product-service"));
const refreshService = __importStar(require("../services/refresh-service"));
const router = express_1.default.Router();
/**
 * POST /api/data-products
 * Create a new data product from template.
 */
router.post('/', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            error: 'Unable to create data product. Please check your configuration and try again.'
        });
    }
});
/**
 * GET /api/data-products
 * List all data products for current workspace.
 */
router.get('/', async (req, res) => {
    try {
        const { org_id, workspace_id } = req.query;
        if (!org_id || typeof org_id !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: org_id'
            });
        }
        const products = await productService.listProducts(org_id, workspace_id);
        res.json(products);
    }
    catch (error) {
        res.status(500).json({
            error: 'Unable to retrieve data products.'
        });
    }
});
/**
 * POST /api/data-products/:id/refresh
 * Trigger manual refresh (rate limited).
 */
router.post('/:id/refresh', async (req, res) => {
    try {
        const { id } = req.params;
        const job = await refreshService.triggerManualRefresh(id);
        res.status(202).json(job);
    }
    catch (error) {
        const message = error.message;
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
router.post('/:id/duplicate', async (req, res) => {
    try {
        const { id } = req.params;
        // TODO: Extract from JWT token
        const userId = 'user_placeholder';
        const duplicate = await productService.duplicateProduct(id, userId);
        res.status(201).json(duplicate);
    }
    catch (error) {
        res.status(500).json({
            error: 'Unable to duplicate product.'
        });
    }
});
/**
 * PATCH /api/data-products/:id/metrics/:metricId
 * Update KPI metric formula (versioned).
 */
router.patch('/:id/metrics/:metricId', async (req, res) => {
    try {
        const { id: productId, metricId } = req.params;
        const { name, formula_expression } = req.body;
        const updated = await productService.updateMetric(productId, metricId, {
            name,
            formula_expression
        });
        res.json(updated);
    }
    catch (error) {
        const message = error.message;
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
exports.default = router;
