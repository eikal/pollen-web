import express, { Request, Response } from 'express';
import path from 'path';
import { authenticateJWT } from '../middleware/auth';
import { upload, checkQuotaBeforeUpload, handleMulterError } from '../middleware/upload-limits';
import * as UploadSession from '../models/UploadSession';
import * as schemaService from '../services/schema-service';
import * as etlService from '../services/etl-service';
import { getUploadQueue, UploadJobData } from '../services/queue';
import * as log from '../services/log';

const router = express.Router();

function deriveTableName(filename: string): string {
  const base = path.parse(filename).name;
  // Simple sanitization: lowercase, replace non-alphanum with underscore, collapse repeats
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 63) || 'uploaded_table';
}

// POST /api/uploads - upload CSV/Excel and enqueue background job
router.post(
  '/',
  authenticateJWT,
  checkQuotaBeforeUpload,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, errorCode: 'NO_FILE', message: 'Please attach a file in the "file" field.' });
      }

      const operationType = (req.body?.operationType || 'insert').toLowerCase() as 'insert' | 'upsert';
      const conflictColumns = (req.body?.conflictColumns ? String(req.body.conflictColumns).split(',').map(s => s.trim()).filter(Boolean) : undefined);

      const filename = req.file.originalname;
      const filePath = req.file.path;
      const fileSizeBytes = req.file.size;

      // Resolve table name
      const requestedTableName: string | undefined = req.body?.tableName;
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
      const data: UploadJobData = {
        userId: req.user.id,
        sessionId,
        filePath,
        filename,
        tableName,
        operationType,
        conflictColumns,
      };

      const queue = getUploadQueue();
      await queue.add('upload', data, { jobId: sessionId });

      log.info('Upload job enqueued via API', { userId: req.user.id, sessionId, tableName, operationType });

      return res.status(202).json({
        success: true,
        sessionId,
        tableName,
        status: 'queued',
      });
    } catch (error) {
      log.error('Upload API failed', { error: (error as Error).message });
      return res.status(500).json({ success: false, errorCode: 'UPLOAD_ENQUEUE_FAILED', message: 'Unable to start upload. Please try again.' });
    }
  },
  handleMulterError
);

// GET /api/uploads/sessions - list recent upload sessions
router.get('/sessions', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const sessions = await UploadSession.getRecentSessions(req.user.id, 20);
  return res.json({ sessions });
});

// GET /api/uploads/tables - list user tables
router.get('/tables', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const tables = await schemaService.listTables(req.user.id);
  return res.json({ tables });
});

// GET /api/uploads/tables/:table/preview?limit=100
router.get('/tables/:table/preview', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });

  const { table } = req.params;
  const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 1000);

  try {
    const schemaName = await schemaService.ensureUserSchema(req.user.id);
    const exists = await schemaService.tableExists(req.user.id, table);
    if (!exists) return res.status(404).json({ error: 'table not found' });

    const rows = await etlService.getTablePreview(schemaName, table, limit);
    return res.json({ rows });
  } catch (error) {
    log.error('Table preview failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'failed to fetch preview' });
  }
});

// DELETE /api/uploads/tables/:table/rows?ids=1,2,3
router.delete('/tables/:table/rows', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });

  const { table } = req.params;
  const idsParam = req.query.ids as string;

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
  } catch (error) {
    log.error('Delete rows failed', { error: (error as Error).message });
    return res.status(500).json({ success: false, errorCode: 'DELETE_FAILED', message: 'Unable to delete rows. Please try again.' });
  }
});

// DELETE /api/uploads/tables/:table (drop table)
router.delete('/tables/:table', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });

  const { table } = req.params;
  const confirmToken = req.query.confirm as string;

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
  } catch (error) {
    log.error('Drop table failed', { error: (error as Error).message });
    return res.status(500).json({ success: false, errorCode: 'DROP_FAILED', message: 'Unable to drop table. Please try again.' });
  }
});

// DELETE /api/uploads/tables/:table/data (truncate table)
router.delete('/tables/:table/data', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, errorCode: 'AUTHENTICATION_REQUIRED', message: 'Authentication required.' });

  const { table } = req.params;
  const confirmToken = req.query.confirm as string;

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
  } catch (error) {
    log.error('Truncate table failed', { error: (error as Error).message });
    return res.status(500).json({ success: false, errorCode: 'TRUNCATE_FAILED', message: 'Unable to clear table data. Please try again.' });
  }
});

export default router;
