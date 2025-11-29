"use strict";
/**
 * Data Product repository for database operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.getProductById = getProductById;
exports.listProductsByWorkspace = listProductsByWorkspace;
exports.updateProduct = updateProduct;
exports.duplicateProduct = duplicateProduct;
exports.createMetric = createMetric;
exports.getActiveMetrics = getActiveMetrics;
exports.updateMetric = updateMetric;
const db_1 = require("../services/db");
/**
 * Create a new data product.
 */
async function createProduct(params) {
    const result = await (0, db_1.query)(`INSERT INTO data_products 
      (org_id, workspace_id, connection_id, type, template_id, owner_user_id, refresh_frequency, metadata) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING *`, [
        params.org_id,
        params.workspace_id || null,
        params.connection_id || null,
        params.type,
        params.template_id,
        params.owner_user_id || null,
        params.refresh_frequency || '1 day',
        params.metadata ? JSON.stringify(params.metadata) : null
    ]);
    return result.rows[0];
}
/**
 * Get a product by ID.
 */
async function getProductById(productId) {
    const result = await (0, db_1.query)('SELECT * FROM data_products WHERE id = $1', [productId]);
    return result.rows[0] || null;
}
/**
 * List products for a workspace.
 */
async function listProductsByWorkspace(orgId, workspaceId) {
    const result = await (0, db_1.query)(`SELECT * FROM data_products 
     WHERE org_id = $1 AND ($2::UUID IS NULL OR workspace_id = $2)
     ORDER BY created_at DESC`, [orgId, workspaceId || null]);
    return result.rows;
}
/**
 * Update product fields.
 */
async function updateProduct(productId, params) {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (params.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(params.status);
    }
    if (params.last_refresh_at !== undefined) {
        updates.push(`last_refresh_at = $${paramIndex++}`);
        values.push(params.last_refresh_at);
    }
    if (params.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(params.metadata));
    }
    values.push(productId);
    const result = await (0, db_1.query)(`UPDATE data_products 
     SET ${updates.join(', ')} 
     WHERE id = $${paramIndex} 
     RETURNING *`, values);
    return result.rows[0];
}
/**
 * Duplicate a product (copy with new ID, draft status).
 */
async function duplicateProduct(productId, newOwnerId) {
    const result = await (0, db_1.query)(`INSERT INTO data_products 
      (org_id, workspace_id, connection_id, type, template_id, status, refresh_frequency, owner_user_id, metadata)
     SELECT org_id, workspace_id, connection_id, type, template_id, 'draft', refresh_frequency, 
            $2, metadata
     FROM data_products 
     WHERE id = $1 
     RETURNING *`, [productId, newOwnerId || null]);
    const newProduct = result.rows[0];
    // Copy active KPI metrics
    await (0, db_1.query)(`INSERT INTO kpi_metrics (product_id, name, formula_expression, version)
     SELECT $1, name, formula_expression, 1
     FROM kpi_metrics
     WHERE product_id = $2 AND deprecated_at IS NULL`, [newProduct.id, productId]);
    return newProduct;
}
/**
 * Create a KPI metric.
 */
async function createMetric(params) {
    const result = await (0, db_1.query)(`INSERT INTO kpi_metrics (product_id, name, formula_expression, version) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`, [params.product_id, params.name, params.formula_expression, params.version || 1]);
    return result.rows[0];
}
/**
 * Get active metrics for a product (not deprecated).
 */
async function getActiveMetrics(productId) {
    const result = await (0, db_1.query)(`SELECT * FROM kpi_metrics 
     WHERE product_id = $1 AND deprecated_at IS NULL 
     ORDER BY created_at`, [productId]);
    return result.rows;
}
/**
 * Deprecate a metric and create new version.
 */
async function updateMetric(metricId, newFormula) {
    // Mark old version deprecated
    await (0, db_1.query)('UPDATE kpi_metrics SET deprecated_at = NOW() WHERE id = $1', [metricId]);
    // Get old metric to copy fields
    const oldResult = await (0, db_1.query)('SELECT * FROM kpi_metrics WHERE id = $1', [metricId]);
    const old = oldResult.rows[0];
    // Create new version
    const result = await (0, db_1.query)(`INSERT INTO kpi_metrics (product_id, name, formula_expression, version) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`, [old.product_id, old.name, newFormula, old.version + 1]);
    return result.rows[0];
}
exports.default = {
    createProduct,
    getProductById,
    listProductsByWorkspace,
    updateProduct,
    duplicateProduct,
    createMetric,
    getActiveMetrics,
    updateMetric
};
