/**
 * Integration test for database layer (repositories + database).
 * Requires PostgreSQL to be running.
 */

import { query, close } from '../../src/services/db';
import ConnectionRepository from '../../src/models/ConnectionRepository';
import ProductRepository from '../../src/models/ProductRepository';
import RefreshJobRepository from '../../src/models/RefreshJobRepository';

describe('Database Layer Integration', () => {
  let testOrgId: string;
  let testUserId: string;
  let testConnectionId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Create test organization
    const orgResult = await query(
      "INSERT INTO organizations (name, domain) VALUES ('Test Org', 'test.com') RETURNING id",
      []
    );
    testOrgId = orgResult.rows[0].id;

    // Create test user
    const userResult = await query(
      "INSERT INTO users (org_id, email, subject, display_name) VALUES ($1, 'test@test.com', 'test-subject', 'Test User') RETURNING id",
      [testOrgId]
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    await close();
  });

  describe('ConnectionRepository', () => {
    it('should create a data source connection', async () => {
      const connection = await ConnectionRepository.createConnection({
        org_id: testOrgId,
        type: 'csv',
        label: 'Test CSV Connection',
        credential_ref: 'test-cred-123'
      });

      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.org_id).toBe(testOrgId);
      expect(connection.type).toBe('csv');
      expect(connection.label).toBe('Test CSV Connection');
      expect(connection.status).toBe('active');

      testConnectionId = connection.id;
    });

    it('should list connections with freshness', async () => {
      const connections = await ConnectionRepository.listConnectionsWithFreshness(testOrgId);

      expect(connections.length).toBeGreaterThan(0);
      expect(connections[0].freshness).toBe('Unknown'); // No last_tested_at yet
    });

    it('should update connection status', async () => {
      const updated = await ConnectionRepository.updateConnectionStatus(
        testConnectionId,
        'active',
        undefined
      );

      expect(updated.status).toBe('active');
      expect(updated.last_tested_at).toBeDefined();
    });
  });

  describe('ProductRepository', () => {
    it('should create a data product', async () => {
      const product = await ProductRepository.createProduct({
        org_id: testOrgId,
        connection_id: testConnectionId,
        type: 'dashboard',
        template_id: 'weekly_mgmt_v1',
        owner_user_id: testUserId
      });

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.type).toBe('dashboard');
      expect(product.status).toBe('draft');
      expect(product.version).toBe(1);

      testProductId = product.id;
    });

    it('should list products by workspace', async () => {
      const products = await ProductRepository.listProductsByWorkspace(testOrgId);

      expect(products.length).toBeGreaterThan(0);
      expect(products[0].org_id).toBe(testOrgId);
    });

    it('should create a KPI metric', async () => {
      const metric = await ProductRepository.createMetric({
        product_id: testProductId,
        name: 'Total Revenue',
        formula_expression: 'SUM(price * quantity)'
      });

      expect(metric).toBeDefined();
      expect(metric.name).toBe('Total Revenue');
      expect(metric.formula_expression).toBe('SUM(price * quantity)');
      expect(metric.version).toBe(1);
      expect(metric.deprecated_at).toBeFalsy();
    });

    it('should update metric with versioning', async () => {
      const metrics = await ProductRepository.getActiveMetrics(testProductId);
      const oldMetric = metrics[0];

      const updatedMetric = await ProductRepository.updateMetric(
        oldMetric.id,
        'SUM(price * quantity * 1.1)' // Updated formula
      );

      expect(updatedMetric.version).toBe(2);
      expect(updatedMetric.formula_expression).toBe('SUM(price * quantity * 1.1)');

      // Verify old metric is deprecated
      const allMetrics = await query(
        'SELECT * FROM kpi_metrics WHERE product_id = $1 ORDER BY version',
        [testProductId]
      );
      expect(allMetrics.rows.length).toBe(2);
      expect(allMetrics.rows[0].deprecated_at).toBeTruthy();
      expect(allMetrics.rows[1].deprecated_at).toBeFalsy();
    });

    it('should duplicate a product', async () => {
      const duplicate = await ProductRepository.duplicateProduct(testProductId, testUserId);

      expect(duplicate.id).not.toBe(testProductId);
      expect(duplicate.type).toBe('dashboard');
      expect(duplicate.status).toBe('draft');
      expect(duplicate.owner_user_id).toBe(testUserId);

      // Verify metrics were copied
      const duplicateMetrics = await ProductRepository.getActiveMetrics(duplicate.id);
      expect(duplicateMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('RefreshJobRepository', () => {
    it('should create a refresh job', async () => {
      const job = await RefreshJobRepository.createJob({ product_id: testProductId });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.product_id).toBe(testProductId);
      expect(job.started_at).toBeDefined();
      expect(job.finished_at).toBeFalsy();
    });

    it('should complete a refresh job', async () => {
      const job = await RefreshJobRepository.createJob({ product_id: testProductId });

      const completed = await RefreshJobRepository.completeJob(job.id, {
        finished_at: new Date(),
        outcome: 'success',
        message: 'Refresh completed successfully'
      });

      expect(completed.finished_at).toBeDefined();
      expect(completed.outcome).toBe('success');
      expect(completed.message).toBe('Refresh completed successfully');
      expect(completed.duration_ms).toBeGreaterThan(0);
    });

    it('should get recent jobs for rate limiting', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentJobs = await RefreshJobRepository.getRecentJobs(testProductId, oneHourAgo);

      expect(recentJobs.length).toBeGreaterThan(0);
    });

    it('should get job history', async () => {
      const history = await RefreshJobRepository.getJobHistory(testProductId, 10);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].product_id).toBe(testProductId);
    });
  });
});
