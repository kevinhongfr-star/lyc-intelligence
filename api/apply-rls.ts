import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const CRON_SECRET = process.env.CRON_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Build connection string from Supabase URL and service role key
function buildConnectionString(): string {
  // Supabase URL: https://rnnlteyqmtxkzllbohuu.supabase.co
  // Extract project ref: rnnlteyqmtxkzllbohuu
  const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : '';
  
  if (!projectRef) {
    throw new Error('Cannot extract Supabase project ref from URL');
  }
  
  // Postgres connection string format for Supabase
  // postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
  const host = `db.${projectRef}.supabase.co`;
  return `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${host}:5432/postgres`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  let pool: Pool | null = null;
  
  try {
    const connString = buildConnectionString();
    pool = new Pool({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    // Read the RLS SQL file
    const rlsSqlPath = path.join(process.cwd(), 'supabase', 'rls_policies.sql');
    let rlsSql = '';
    
    try {
      rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    } catch (e) {
      return res.status(500).json({ error: 'Cannot read RLS SQL file', path: rlsSqlPath });
    }

    // Execute the SQL
    const result = await pool.query(rlsSql);
    
    res.status(200).json({
      status: 'success',
      message: 'RLS policies applied successfully',
      rowsAffected: Array.isArray(result) ? result.length : (result.rowCount || 0),
      note: 'Policies applied. Run a verification query to confirm.'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to apply RLS policies', 
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
