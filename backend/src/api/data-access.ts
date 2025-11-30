import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { query } from '../services/db';
import * as schemaService from '../services/schema-service';

const router = Router();

// TODO: plug in real auth middleware
router.get('/settings/data-access', authenticateJWT, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  try {
    const schema = await schemaService.ensureUserSchema(req.user.id);

    // Fetch db username from users table if present; else default to email-based
    const result = await query<{ db_username?: string }>(
      'SELECT db_username FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );
    const row = result.rows[0] || {};
    const username = row.db_username || `user_${req.user.id}`;

    return res.json({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'pollen_dev',
      schema,
      username,
      passwordMasked: true,
    });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load data access' });
  }
});

router.post('/settings/data-access/reset-password', authenticateJWT, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  try {
    // Generate a new password and store hash; real implementation should update DB grants as needed
    const crypto = await import('crypto');
    const newPassword = crypto.randomBytes(12).toString('hex');
    // Store hash (placeholder):
    await query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [req.user.id, newPassword]);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'failed to reset password' });
  }
});

export default router;
