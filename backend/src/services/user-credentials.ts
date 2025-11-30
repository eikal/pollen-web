import { getPool, query } from './db';
import * as log from './log';

function pgIdent(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, '');
}

export async function ensureDbUser(userId: string, schema: string): Promise<{ username: string }> {
  const pool = getPool();
  const client = await pool.connect();
  const username = `user_${pgIdent(userId)}`;

  try {
    await client.query('BEGIN');
    // Create role if not exists
    await client.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${username}') THEN
        CREATE ROLE ${username} LOGIN PASSWORD '${username}';
      END IF;
    END$$;`);

    // Grant schema usage
    await client.query(`GRANT USAGE ON SCHEMA ${schema} TO ${username};`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${username};`);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    log.error('ensureDbUser failed', { error: (err as Error).message });
    throw err;
  } finally {
    client.release();
  }

  // Persist username to users table if column exists
  try {
    await query('UPDATE users SET db_username = $2 WHERE id = $1', [userId, username]);
  } catch (_) {
    // ignore if column missing in MVP
  }

  return { username };
}

export async function resetDbPassword(userId: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  const username = `user_${pgIdent(userId)}`;
  const crypto = await import('crypto');
  const newPassword = crypto.randomBytes(12).toString('hex');

  try {
    await client.query(`ALTER ROLE ${username} WITH PASSWORD '${newPassword}';`);
    // Optionally persist a hash or last rotated timestamp
    try {
      await query('UPDATE users SET updated_at = now() WHERE id = $1', [userId]);
    } catch (_) {}
  } finally {
    client.release();
  }
}

export default { ensureDbUser, resetDbPassword };
