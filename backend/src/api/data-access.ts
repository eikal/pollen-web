import { Router } from 'express';

const router = Router();

// TODO: plug in real auth middleware
router.get('/settings/data-access', async (req, res) => {
  // Placeholder: return masked credentials; integrate with actual user/session
  return res.json({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'pollen',
    schema: 'user_<uuid>',
    username: 'user_<uuid>',
    passwordMasked: true,
  });
});

router.post('/settings/data-access/reset-password', async (req, res) => {
  // Placeholder: initiate password reset for current user
  return res.status(200).json({ ok: true });
});

export default router;
