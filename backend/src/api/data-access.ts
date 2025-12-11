import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { query } from '../services/db';
import * as userCreds from '../services/user-credentials';
import * as schemaService from '../services/schema-service';

const router = Router();

// TODO: plug in real auth middleware
router.get('/settings/data-access', authenticateJWT, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  try {
    const schema = await schemaService.ensureUserSchema(req.user.id);
    const { username } = await userCreds.ensureDbUser(req.user.id, schema);

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
    const schema = await schemaService.ensureUserSchema(req.user.id);
    const { username } = await userCreds.ensureDbUser(req.user.id, schema);
    const newPassword = await userCreds.resetDbPassword(req.user.id);

    return res.status(200).json({
      ok: true,
      credentials: {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || 'pollen_dev',
        schema,
        username,
        password: newPassword,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'failed to reset password' });
  }
});

export default router;
