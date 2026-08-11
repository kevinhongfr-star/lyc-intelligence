import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_TOKEN = 'lyc-rls-apply-2026-admin';

function extractProjectRef(): string {
  const m = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? m[1] : '';
}

function buildConnectionString(host: string): string {
  return `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${host}:5432/postgres`;
}

async function tryConnect(host: string): Promise<{ ok: boolean; error?: string }> {
  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: buildConnectionString(host),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers['x-admin-token'];
  if (auth !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ref = extractProjectRef();
  const hosts = [
    `db.${ref}.supabase.co`,
    `${ref}.supabase.co`,
    `db.${ref}.pooler.supabase.com`,
    `aws-0-us-east-1.pooler.supabase.com`,
  ];

  // First, find a working host
  const results: Record<string, string> = {};
  let workingHost = '';
  
  for (const host of hosts) {
    const r = await tryConnect(host);
    results[host] = r.ok ? 'OK' : (r.error || 'fail');
    if (r.ok && !workingHost) {
      workingHost = host;
      break; // stop at first working host
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ hosts: results, workingHost });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', hosts: results });
  }

  if (!workingHost) {
    return res.status(500).json({ error: 'No working DB host found', hosts: results });
  }

  const sql = typeof req.body === 'string' ? req.body : (req.body?.sql || '');
  if (!sql || sql.trim().length < 10) {
    return res.status(400).json({ error: 'No SQL provided', hosts: results, workingHost });
  }

  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: buildConnectionString(workingHost),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    const result = await pool.query(sql);
    res.status(200).json({
      status: 'success',
      workingHost,
      rowCount: result.rowCount,
      command: result.command,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to execute SQL',
      message: error.message,
      workingHost,
    });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
