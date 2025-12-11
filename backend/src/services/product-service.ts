/**
 * Product Service: Manages data product lifecycle (create, duplicate, list, versioning).
 */

import { validateFormula } from './formula-validator';
import * as log from './log';
import ProductRepository from '../models/ProductRepository';
import type DataProduct from '../models/DataProduct';
import type KPIMetric from '../models/KPIMetric';

export interface CreateProductParams {
  org_id: string;
  workspace_id: string;
  connection_id: string;
  type: DataProduct['type'];
  template_id?: string;
  owner_user_id: string;
  refresh_frequency?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMetricParams {
  name?: string;
  formula_expression?: string;
}

/**
 * Create a new data product from template.
 * @param params - Product creation parameters
 * @returns Created product
 */
export async function createProduct(params: CreateProductParams): Promise<DataProduct> {
  const product = await ProductRepository.createProduct({
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
export async function duplicateProduct(productId: string, userId: string): Promise<DataProduct> {
  const duplicate = await ProductRepository.duplicateProduct(productId, userId);

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
export async function listProducts(orgId: string, workspaceId?: string): Promise<DataProduct[]> {
  log.debug('Listing products', { org_id: orgId, workspace_id: workspaceId });
  return await ProductRepository.listProductsByWorkspace(orgId, workspaceId);
}

/**
 * Update a KPI metric formula and increment version.
 * @param productId - Product identifier
 * @param metricId - Metric identifier
 * @param params - Update parameters
 * @returns Updated metric
 */
export async function updateMetric(
  productId: string,
  metricId: string,
  params: UpdateMetricParams
): Promise<KPIMetric> {
  if (params.formula_expression) {
    // validateFormula throws on error
    validateFormula(params.formula_expression);
  }

  const currentMetrics = await ProductRepository.getActiveMetrics(productId);
  const current = currentMetrics.find(m => m.id === metricId);

  if (!current) {
    throw new Error(`Metric ${metricId} not found in product ${productId}`);
  }

  const updated = await ProductRepository.updateMetric(
    metricId,
    params.formula_expression || current.formula_expression
  );

  log.info('KPI metric updated', {
    metric_id: metricId,
    product_id: productId,
    old_version: current.version,
    new_version: updated.version
  });

  return updated;
}

export default {
  createProduct,
  duplicateProduct,
  listProducts,
  updateMetric
};
