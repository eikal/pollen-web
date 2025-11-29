"use strict";
/**
 * Product Service: Manages data product lifecycle (create, duplicate, list, versioning).
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
exports.createProduct = createProduct;
exports.duplicateProduct = duplicateProduct;
exports.listProducts = listProducts;
exports.updateMetric = updateMetric;
const formula_validator_1 = require("./formula-validator");
const log = __importStar(require("./log"));
const ProductRepository_1 = __importDefault(require("../models/ProductRepository"));
/**
 * Create a new data product from template.
 * @param params - Product creation parameters
 * @returns Created product
 */
async function createProduct(params) {
    const product = await ProductRepository_1.default.createProduct({
        org_id: params.org_id,
        workspace_id: params.workspace_id,
        connection_id: params.connection_id,
        type: params.type,
        template_id: params.template_id || '',
        owner_user_id: params.owner_user_id,
        metadata: params.metadata
    });
    log.info('Data product created', {
        product_id: product.id,
        type: product.type,
        template_id: product.template_id,
        workspace_id: product.workspace_id
    });
    return product;
}
/**
 * Duplicate an existing product for iteration.
 * @param productId - Source product ID
 * @param userId - User requesting duplication
 * @returns New product instance
 */
async function duplicateProduct(productId, userId) {
    const duplicate = await ProductRepository_1.default.duplicateProduct(productId, userId);
    log.info('Data product duplicated', {
        original_id: productId,
        duplicate_id: duplicate.id
    });
    return duplicate;
}
/**
 * List data products for a workspace.
 * @param orgId - Organization identifier
 * @param workspaceId - Workspace identifier (optional)
 * @returns Array of products
 */
async function listProducts(orgId, workspaceId) {
    log.debug('Listing products', { org_id: orgId, workspace_id: workspaceId });
    return await ProductRepository_1.default.listProductsByWorkspace(orgId, workspaceId);
}
/**
 * Update a KPI metric formula and increment version.
 * @param productId - Product identifier
 * @param metricId - Metric identifier
 * @param params - Update parameters
 * @returns Updated metric
 */
async function updateMetric(productId, metricId, params) {
    if (params.formula_expression) {
        // validateFormula throws on error
        (0, formula_validator_1.validateFormula)(params.formula_expression);
    }
    const currentMetrics = await ProductRepository_1.default.getActiveMetrics(productId);
    const current = currentMetrics.find(m => m.id === metricId);
    if (!current) {
        throw new Error(`Metric ${metricId} not found in product ${productId}`);
    }
    const updated = await ProductRepository_1.default.updateMetric(metricId, params.formula_expression || current.formula_expression);
    log.info('KPI metric updated', {
        metric_id: metricId,
        product_id: productId,
        old_version: current.version,
        new_version: updated.version
    });
    return updated;
}
exports.default = {
    createProduct,
    duplicateProduct,
    listProducts,
    updateMetric
};
