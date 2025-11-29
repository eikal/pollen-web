"use strict";
/**
 * Connections API endpoints.
 * Provides REST interface for data source connection management and schema preview.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registry_1 = require("../adapters/registry");
const config_1 = __importDefault(require("../services/config"));
const ConnectionRepository_1 = __importDefault(require("../models/ConnectionRepository"));
const router = express_1.default.Router();
/**
 * POST /api/connections
 * Create a new data source connection.
 */
router.post('/', async (req, res) => {
    var _a;
    try {
        const { org_id, workspace_id, type, label, credential_ref } = req.body;
        if (!org_id || !type || !label) {
            return res.status(400).json({
                error: 'Missing required fields: org_id, type, label'
            });
        }
        const adapter = (0, registry_1.getAdapter)(type);
        if (!adapter) {
            return res.status(400).json({
                error: `We don't currently support "${type}" data sources. Please choose CSV or Google Sheets.`
            });
        }
        const connection = await ConnectionRepository_1.default.createConnection({
            org_id,
            workspace_id,
            type,
            label,
            credential_ref
        });
        res.status(201).json(connection);
    }
    catch (error) {
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('duplicate key')) {
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
router.get('/', async (req, res) => {
    try {
        const { org_id, workspace_id } = req.query;
        if (!org_id || typeof org_id !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: org_id'
            });
        }
        const connections = await ConnectionRepository_1.default.listConnectionsWithFreshness(org_id, workspace_id);
        res.json(connections);
    }
    catch (error) {
        res.status(500).json({
            error: 'Unable to retrieve connections.'
        });
    }
});
/**
 * GET /api/connections/:id/schema
 * Preview inferred schema for a connection.
 */
router.get('/:id/schema', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await ConnectionRepository_1.default.getConnectionById(id);
        if (!connection) {
            return res.status(404).json({
                error: 'Connection not found.'
            });
        }
        const adapter = (0, registry_1.getAdapter)(connection.type);
        if (!adapter) {
            return res.status(500).json({
                error: 'Adapter not available for this connection type.'
            });
        }
        // TODO: Call adapter's schema discovery method with connection credentials
        // For now, return mock schema
        const fields = [
            { name: 'id', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'quantity', type: 'number' },
            { name: 'created_at', type: 'date' }
        ];
        const preview = {
            fields: fields.slice(0, config_1.default.maxSchemaFields),
            total_fields: fields.length,
            truncated: fields.length > config_1.default.maxSchemaFields
        };
        res.json(preview);
    }
    catch (error) {
        res.status(500).json({
            error: 'We could not retrieve the schema. Please ensure your connection is active.'
        });
    }
});
exports.default = router;
