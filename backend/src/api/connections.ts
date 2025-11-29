/**
 * Connections API endpoints.
 * Provides REST interface for data source connection management and schema preview.
 */

import express, { Request, Response } from 'express';
import { getAdapter } from '../adapters/registry';
import config from '../services/config';
import ConnectionRepository from '../models/ConnectionRepository';
import type DataSourceConnection from '../models/DataSourceConnection';

const router = express.Router();

export interface SchemaField {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface SchemaPreview {
  fields: SchemaField[];
  total_fields: number;
  truncated: boolean;
}

/**
 * POST /api/connections
 * Create a new data source connection.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { org_id, workspace_id, type, label, credential_ref } = req.body;

    if (!org_id || !type || !label) {
      return res.status(400).json({
        error: 'Missing required fields: org_id, type, label'
      });
    }

    const adapter = getAdapter(type);
    if (!adapter) {
      return res.status(400).json({
        error: `We don't currently support "${type}" data sources. Please choose CSV or Google Sheets.`
      });
    }

    const connection = await ConnectionRepository.createConnection({
      org_id,
      workspace_id,
      type,
      label,
      credential_ref
    });

    res.status(201).json(connection);
  } catch (error: any) {
    if (error.message?.includes('duplicate key')) {
      return res.status(409).json({
        error: 'A connection with this name already exists in your workspace.'
      });
    }
    res.status(500).json({
      error: 'We could not create your connection. Please review your access permissions and try again.'
    });
  }
});

/**
 * GET /api/connections
 * List all connections for current workspace (extended with freshness classification).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { org_id, workspace_id } = req.query;

    if (!org_id || typeof org_id !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter: org_id'
      });
    }

    const connections = await ConnectionRepository.listConnectionsWithFreshness(
      org_id,
      workspace_id as string | undefined
    );

    res.json(connections);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to retrieve connections.'
    });
  }
});

/**
 * GET /api/connections/:id/schema
 * Preview inferred schema for a connection.
 */
router.get('/:id/schema', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const connection = await ConnectionRepository.getConnectionById(id);

    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found.'
      });
    }

    const adapter = getAdapter(connection.type);
    if (!adapter) {
      return res.status(500).json({
        error: 'Adapter not available for this connection type.'
      });
    }

    // TODO: Call adapter's schema discovery method with connection credentials
    // For now, return mock schema
    const fields: SchemaField[] = [
      { name: 'id', type: 'string' },
      { name: 'price', type: 'number' },
      { name: 'quantity', type: 'number' },
      { name: 'created_at', type: 'date' }
    ];

    const preview: SchemaPreview = {
      fields: fields.slice(0, config.maxSchemaFields),
      total_fields: fields.length,
      truncated: fields.length > config.maxSchemaFields
    };

    res.json(preview);
  } catch (error) {
    res.status(500).json({
      error: 'We could not retrieve the schema. Please ensure your connection is active.'
    });
  }
});

export default router;
