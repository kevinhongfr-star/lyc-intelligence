import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_TOKEN = 'lyc-rls-apply-2026-admin';

function buildConnectionString(): string {
  const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : '';
  const host = `db.${projectRef}.supabase.co`;
  return `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${host}:5432/postgres`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers['x-admin-token'];
  if (auth !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = typeof req.body === 'string' ? req.body : (req.body?.sql || '');
  if (!sql || sql.trim().length < 10) {
    return res.status(400).json({ error: 'No SQL provided' });
  }

  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: buildConnectionString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    const result = await pool.query(sql);
    res.status(200).json({
      status: 'success',
      rowCount: result.rowCount,
      command: result.command,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to execute SQL',
      message: error.message,
    });
  } finally {
    if (pool) await pool.end();
  }
}
