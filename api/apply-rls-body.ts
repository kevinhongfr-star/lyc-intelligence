import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_TOKEN = 'lyc-rls-apply-2026-admin';

function extractProjectRef(): string {
  const m = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? m[1] : '';
}

async function tryConnect(connStr: string, label: string): Promise<{ label: string; ok: boolean; error?: string }> {
  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    await pool.query('SELECT 1');
    return { label, ok: true };
  } catch (e: any) {
    return { label, ok: false, error: e.message.substring(0, 120) };
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
  
  // Supabase has several connection string patterns
  const connStrs: { label: string; str: string }[] = [
    // Pattern 1: old direct DB
    { label: 'db.ref.supabase.co', str: `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${ref}.supabase.co:5432/postgres` },
    // Pattern 2: pooler with project ref in user
    { label: 'aws-0-us-east-1.pooler (user=ref.postgres)', str: `postgresql://${ref}.postgres:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
    // Pattern 3: pooler with options parameter  
    { label: 'aws-0-us-east-1.pooler (options=ref)', str: `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?options=project%3D${ref}` },
    // Pattern 4: regional direct (try common regions)
    { label: 'ref.supabase.co port 6543', str: `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${ref}.supabase.co:6543/postgres` },
  ];

  const results: Record<string, string> = {};
  let workingConn = '';
  let workingLabel = '';

  for (const { label, str } of connStrs) {
    const r = await tryConnect(str, label);
    results[label] = r.ok ? 'OK' : (r.error || 'fail');
    if (r.ok && !workingConn) {
      workingConn = str;
      workingLabel = label;
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ results, workingLabel });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', results, workingLabel });
  }

  if (!workingConn) {
    return res.status(500).json({ error: 'No working DB connection found', results });
  }

  const sql = typeof req.body === 'string' ? req.body : (req.body?.sql || '');
  if (!sql || sql.trim().length < 10) {
    return res.status(400).json({ error: 'No SQL provided', results, workingLabel });
  }

  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: workingConn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    const result = await pool.query(sql);
    res.status(200).json({
      status: 'success',
      workingLabel,
      rowCount: result.rowCount,
      command: result.command,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to execute SQL',
      message: error.message.substring(0, 300),
      workingLabel,
    });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
