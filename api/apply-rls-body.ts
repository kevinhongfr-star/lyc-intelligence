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
    return { label, ok: false, error: e.message.substring(0, 150) };
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
  
  // Try multiple regional poolers + user formats
  const poolers = [
    'ap-southeast-1.pooler.supabase.com',  // Singapore
    'aws-ap-southeast-1.pooler.supabase.com',
    'sgp-1.pooler.supabase.com',
    'ap-south-1.pooler.supabase.com',
  ];
  
  const userFormats = [
    { label: 'ref.postgres', user: `${ref}.postgres` },
    { label: 'postgres', user: 'postgres' },
  ];

  const connStrs: { label: string; str: string }[] = [];
  
  for (const pooler of poolers) {
    for (const uf of userFormats) {
      connStrs.push({
        label: `${pooler.split('.')[0]} ${uf.label}`,
        str: `postgresql://${uf.user}:${SUPABASE_SERVICE_ROLE_KEY}@${pooler}:6543/postgres`,
      });
    }
  }
  
  // Also try old-style direct with .supabase.com
  connStrs.push({
    label: 'db.ref.supabase.com',
    str: `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${ref}.supabase.com:5432/postgres`,
  });

  const results: Record<string, string> = {};
  let workingConn = '';
  let workingLabel = '';

  for (const { label, str } of connStrs) {
    const r = await tryConnect(str, label);
    results[label] = r.ok ? 'OK' : (r.error || 'fail').substring(0, 80);
    if (r.ok && !workingConn) {
      workingConn = str;
      workingLabel = label;
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ results, workingLabel, ref });
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
