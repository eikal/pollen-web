"use strict";
/**
 * Data Source Connection repository for database operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = createConnection;
exports.getConnectionById = getConnectionById;
exports.listConnectionsByWorkspace = listConnectionsByWorkspace;
exports.updateConnectionStatus = updateConnectionStatus;
exports.listConnectionsWithFreshness = listConnectionsWithFreshness;
const db_1 = require("../services/db");
/**
 * Create a new data source connection.
 */
async function createConnection(params) {
    const result = await (0, db_1.query)(`INSERT INTO data_source_connections 
      (org_id, workspace_id, type, label, credential_ref) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`, [
        params.org_id,
        params.workspace_id || null,
        params.type,
        params.label,
        params.credential_ref || null
    ]);
    return result.rows[0];
}
/**
 * Get a connection by ID.
 */
async function getConnectionById(connectionId) {
    const result = await (0, db_1.query)('SELECT * FROM data_source_connections WHERE id = $1', [connectionId]);
    return result.rows[0] || null;
}
/**
 * List connections for a workspace.
 */
async function listConnectionsByWorkspace(orgId, workspaceId) {
    const result = await (0, db_1.query)(`SELECT * FROM data_source_connections 
     WHERE org_id = $1 AND ($2::UUID IS NULL OR workspace_id = $2)
     ORDER BY created_at DESC`, [orgId, workspaceId || null]);
    return result.rows;
}
/**
 * Update connection status and error message.
 */
async function updateConnectionStatus(connectionId, status, errorMessage) {
    const result = await (0, db_1.query)(`UPDATE data_source_connections 
     SET status = $2, error_message = $3, last_tested_at = NOW() 
     WHERE id = $1 
     RETURNING *`, [connectionId, status, errorMessage || null]);
    return result.rows[0];
}
async function listConnectionsWithFreshness(orgId, workspaceId) {
    const result = await (0, db_1.query)(`SELECT * FROM data_source_connections 
     WHERE org_id = $1 AND ($2::UUID IS NULL OR workspace_id = $2)
     ORDER BY created_at DESC`, [orgId, workspaceId || null]);
    return result.rows.map(conn => ({
        ...conn,
        freshness: calculateFreshness(conn.last_tested_at)
    }));
}
function calculateFreshness(lastTestedAt) {
    if (!lastTestedAt)
        return 'Unknown';
    const now = new Date();
    const ageHours = (now.getTime() - new Date(lastTestedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours <= 24)
        return 'Fresh';
    if (ageHours <= 72)
        return 'Recent';
    return 'Stale';
}
exports.default = {
    createConnection,
    getConnectionById,
    listConnectionsByWorkspace,
    updateConnectionStatus,
    listConnectionsWithFreshness
};
