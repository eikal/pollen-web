"use strict";
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
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const upload_limits_1 = require("../middleware/upload-limits");
const UploadSession = __importStar(require("../models/UploadSession"));
const schemaService = __importStar(require("../services/schema-service"));
const etlService = __importStar(require("../services/etl-service"));
const queue_1 = require("../services/queue");
const log = __importStar(require("../services/log"));
const exceljs_1 = __importDefault(require("exceljs"));
const router = express_1.default.Router();
function deriveTableName(filename) {
    const base = path_1.default.parse(filename).name;
    // Simple sanitization: lowercase, replace non-alphanum with underscore, collapse repeats
    return base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 63) || 'uploaded_table';
}
// POST /api/uploads - upload CSV/Excel and enqueue background job
router.post('/', auth_1.authenticateJWT, upload_limits_1.checkQuotaBeforeUpload, upload_limits_1.upload.single('file'), async (req, res) => {
    var _a, _b, _c, _d;
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, errorCode: 'NO_FILE', message: 'Please attach a file in the "file" field.' });
        }
        const operationType = (((_a = req.body) === null || _a === void 0 ? void 0 : _a.operationType) || 'insert').toLowerCase();
        const conflictColumns = (((_b = req.body) === null || _b === void 0 ? void 0 : _b.conflictColumns) ? String(req.body.conflictColumns).split(',').map(s => s.trim()).filter(Boolean) : undefined);
        const filename = req.file.originalname;
        const filePath = req.file.path;
        const fileSizeBytes = req.file.size;
        // Resolve table name
        const requestedTableName = (_c = req.body) === null || _c === void 0 ? void 0 : _c.tableName;
        const tableName = requestedTableName && requestedTableName.trim().length > 0 ? requestedTableName.trim() : deriveTableName(filename);
        // Ensure user schema exists (idempotent)
        await schemaService.ensureUserSchema(req.user.id);
        // Create upload session record
        const sessionId = await UploadSession.createSession({
            userId: req.user.id,
            filename,
            fileSizeBytes,
        });
        // Enqueue background job
        const data = {
            userId: req.user.id,
            sessionId,
            filePath,
            filename,
            tableName,
            operationType,
            conflictColumns,
            sheet: ((_d = req.body) === null || _d === void 0 ? void 0 : _d.sheet) || undefined,
        };
        const queue = (0, queue_1.getUploadQueue)();
        await queue.add('upload', data, { jobId: sessionId });
        log.info('Upload job enqueued via API', { userId: req.user.id, sessionId, tableName, operationType });
        return res.status(202).json({
            success: true,
            sessionId,
            tableName,
            status: 'queued',
        });
    }
    catch (error) {
        log.error('Upload API failed', { error: error.message });
        return res.status(500).json({ success: false, errorCode: 'UPLOAD_ENQUEUE_FAILED', message: 'Unable to start upload. Please try again.' });
    }
}, upload_limits_1.handleMulterError);
// GET /api/uploads/sessions - list recent upload sessions
router.get('/sessions', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'unauthorized' });
    const sessions = await UploadSession.getRecentSessions(req.user.id, 20);
    return res.json({ sessions });
});
// GET /api/uploads/tables - list user tables
router.get('/tables', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'unauthorized' });
    const tables = await schemaService.listTables(req.user.id);
    return res.json({ tables });
});
// GET /api/uploads/tables/:table/preview?limit=100
router.get('/tables/:table/preview', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'unauthorized' });
    const { table } = req.params;
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 1000);
    try {
        const schemaName = await schemaService.ensureUserSchema(req.user.id);
        const exists = await schemaService.tableExists(req.user.id, table);
        if (!exists)
            return res.status(404).json({ error: 'table not found' });
        const rows = await etlService.getTablePreview(schemaName, table, limit);
        return res.json({ rows });
    }
    catch (error) {
        log.error('Table preview failed', { error: error.message });
        return res.status(500).json({ error: 'failed to fetch preview' });
    }
});
// DELETE /api/uploads/tables/:table/rows?ids=1,2,3
router.delete('/tables/:table/rows', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });
    const { table } = req.params;
    const idsParam = req.query.ids;
    if (!idsParam || !idsParam.trim()) {
        return res.status(400).json({ success: false, errorCode: 'MISSING_IDS', message: 'Please provide row IDs to delete (e.g., ?ids=1,2,3).' });
    }
    try {
        const schemaName = await schemaService.ensureUserSchema(req.user.id);
        const exists = await schemaService.tableExists(req.user.id, table);
        if (!exists) {
            return res.status(404).json({ success: false, errorCode: 'TABLE_NOT_FOUND', message: `Table "${table}" not found.` });
        }
        // Parse comma-separated IDs
        const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
        if (ids.length === 0) {
            return res.status(400).json({ success: false, errorCode: 'INVALID_IDS', message: 'No valid IDs provided.' });
        }
        // Build WHERE clause for id IN (...)
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const whereClause = `id IN (${placeholders})`;
        const rowsDeleted = await etlService.deleteRows(req.user.id, schemaName, table, whereClause, ids);
        log.info('Rows deleted via API', { userId: req.user.id, table, rowsDeleted, ids: ids.length });
        return res.json({
            success: true,
            rowsDeleted,
            message: `${rowsDeleted} row(s) deleted from "${table}".`,
        });
    }
    catch (error) {
        log.error('Delete rows failed', { error: error.message });
        return res.status(500).json({ success: false, errorCode: 'DELETE_FAILED', message: 'Unable to delete rows. Please try again.' });
    }
});
// DELETE /api/uploads/tables/:table (drop table)
router.delete('/tables/:table', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });
    const { table } = req.params;
    const confirmToken = req.query.confirm;
    // Require confirmation token to prevent accidental deletion
    if (confirmToken !== table) {
        return res.status(400).json({
            success: false,
            errorCode: 'CONFIRMATION_REQUIRED',
            message: `To drop this table, please confirm by providing ?confirm=${table}`,
        });
    }
    try {
        const schemaName = await schemaService.ensureUserSchema(req.user.id);
        const exists = await schemaService.tableExists(req.user.id, table);
        if (!exists) {
            return res.status(404).json({ success: false, errorCode: 'TABLE_NOT_FOUND', message: `Table "${table}" not found.` });
        }
        await etlService.dropTable(req.user.id, schemaName, table);
        log.info('Table dropped via API', { userId: req.user.id, table });
        return res.json({
            success: true,
            message: `Table "${table}" has been permanently deleted.`,
        });
    }
    catch (error) {
        log.error('Drop table failed', { error: error.message });
        return res.status(500).json({ success: false, errorCode: 'DROP_FAILED', message: 'Unable to drop table. Please try again.' });
    }
});
// DELETE /api/uploads/tables/:table/data (truncate table)
router.delete('/tables/:table/data', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });
    const { table } = req.params;
    const confirmToken = req.query.confirm;
    // Require confirmation token
    if (confirmToken !== table) {
        return res.status(400).json({
            success: false,
            errorCode: 'CONFIRMATION_REQUIRED',
            message: `To clear all data from this table, please confirm by providing ?confirm=${table}`,
        });
    }
    try {
        const schemaName = await schemaService.ensureUserSchema(req.user.id);
        const exists = await schemaService.tableExists(req.user.id, table);
        if (!exists) {
            return res.status(404).json({ success: false, errorCode: 'TABLE_NOT_FOUND', message: `Table "${table}" not found.` });
        }
        await etlService.truncateTable(req.user.id, schemaName, table);
        log.info('Table truncated via API', { userId: req.user.id, table });
        return res.json({
            success: true,
            message: `All data cleared from table "${table}". Table structure remains.`,
        });
    }
    catch (error) {
        log.error('Truncate table failed', { error: error.message });
        return res.status(500).json({ success: false, errorCode: 'TRUNCATE_FAILED', message: 'Unable to clear table data. Please try again.' });
    }
});
exports.default = router;
// POST /api/uploads/excel/sheets - enumerate sheets in an uploaded Excel file
router.post('/excel/sheets', auth_1.authenticateJWT, upload_limits_1.upload.single('file'), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'unauthorized' });
        if (!req.file)
            return res.status(400).json({ error: 'no file' });
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const sheets = workbook.worksheets.map(ws => ws.name).filter(Boolean);
        return res.json({ sheets });
    }
    catch (error) {
        log.error('Excel sheet enumeration failed', { error: error.message });
        return res.status(500).json({ error: 'failed to enumerate sheets' });
    }
});
