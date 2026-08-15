/**
 * /api/setup/[task] — Consolidated one-time admin/setup endpoint.
 *
 * Replaces the former api/apply-rls.ts and api/setup/assessment-table.ts
 * (Vercel Hobby plan: 13 → 12 serverless functions per deployment).
 *
 * Routes:
 *   /api/setup/assessment-table → create assessment_results table + RLS policies
 *   /api/setup/apply-rls        → apply supabase/rls_policies.sql
 *
 * Auth differs per task (preserved from originals):
 *   assessment-table: x-setup-key header matching SETUP_SECRET, POST only
 *   apply-rls:         Authorization: Bearer <CRON_SECRET>
 *
 * DELETE AFTER USE.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// --- Shared env ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function buildConnectionString(): string {
  const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : '';
  if (!projectRef) {
    throw new Error(`Cannot extract Supabase project ref from URL: ${SUPABASE_URL}`);
  }
  const host = `db.${projectRef}.supabase.co`;
  return `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${host}:5432/postgres`;
}

// --- assessment-table SQL (inline, preserved verbatim) ---
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    anonymous_id text,
    assessment_code text NOT NULL,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    duration_seconds integer DEFAULT 0,
    score_summary jsonb,
    miles_debited integer DEFAULT 0,
    idempotency_key text,
    organization_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_anonymous_id ON public.assessment_results(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_code ON public.assessment_results(assessment_code);
CREATE INDEX IF NOT EXISTS idx_assessment_results_idempotency ON public.assessment_results(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_assessment_results_org ON public.assessment_results(organization_id);

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS assessment_results_self ON public.assessment_results;
DROP POLICY IF EXISTS assessment_results_write ON public.assessment_results;
DROP POLICY IF EXISTS assessment_results_anon_insert ON public.assessment_results;
DROP POLICY IF EXISTS assessment_results_anon_select ON public.assessment_results;

-- Self read policy (authenticated users see their own)
CREATE POLICY assessment_results_self ON public.assessment_results FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('admin', 'lyc_admin', 'super_admin')
    OR (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('consultant', 'lyc_consultant')
    OR user_id = auth.uid()
  )
);

-- Self write policy
CREATE POLICY assessment_results_write ON public.assessment_results FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('admin', 'lyc_admin', 'super_admin')
    OR user_id = auth.uid()
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('admin', 'lyc_admin', 'super_admin')
    OR user_id = auth.uid()
  )
);

-- Allow anon inserts for anonymous assessments
CREATE POLICY assessment_results_anon_insert ON public.assessment_results FOR INSERT WITH CHECK (
  auth.uid() IS NULL AND anonymous_id IS NOT NULL
);

-- Allow anon select by anonymous_id
CREATE POLICY assessment_results_anon_select ON public.assessment_results FOR SELECT USING (
  auth.uid() IS NULL AND anonymous_id IS NOT NULL
);
`;

// ============================================================
// Task: assessment-table
// Auth: x-setup-key header matching SETUP_SECRET, POST only
// ============================================================
async function runAssessmentTable(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  const SETUP_SECRET = process.env.SETUP_SECRET || '';
  const key = req.headers['x-setup-key'] || req.headers['X-Setup-Key'];
  if (!key || !SETUP_SECRET || key !== SETUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized', has_secret: !!SETUP_SECRET });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  let pool: Pool | null = null;
  try {
    const connString = buildConnectionString();
    const maskedConn = connString.replace(/:.*@/, ':***@');
    console.log('[setup:assessment-table] Connecting to:', maskedConn);

    pool = new Pool({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    const client = await pool.connect();
    console.log('[setup:assessment-table] Connected to DB');

    try {
      await client.query('BEGIN');
      await client.query(CREATE_TABLE_SQL);
      await client.query('COMMIT');

      const verify = await client.query(
        "SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_results'"
      );
      const exists = verify.rows[0].cnt > 0;

      const cols = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessment_results' ORDER BY ordinal_position"
      );

      res.status(200).json({
        status: 'success',
        table_created: exists,
        column_count: cols.rows.length,
        columns: cols.rows.map((r: any) => r.column_name),
        message: 'assessment_results table created successfully with RLS policies',
      });
    } catch (queryErr: any) {
      await client.query('ROLLBACK');
      throw queryErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[setup:assessment-table] Error:', error.message);
    res.status(500).json({
      error: 'Failed to create table',
      message: error.message,
      code: error.code,
      supabase_url_present: !!SUPABASE_URL,
      service_key_present: !!SUPABASE_SERVICE_ROLE_KEY,
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// ============================================================
// Task: apply-rls
// Auth: Authorization: Bearer <CRON_SECRET>
// ============================================================
async function runApplyRls(req: VercelRequest, res: VercelResponse) {
  const CRON_SECRET = process.env.CRON_SECRET || '';

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
      connectionTimeoutMillis: 10000,
    });

    const rlsSqlPath = path.join(process.cwd(), 'supabase', 'rls_policies.sql');
    let rlsSql = '';
    try {
      rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    } catch (e) {
      return res.status(500).json({ error: 'Cannot read RLS SQL file', path: rlsSqlPath });
    }

    const result = await pool.query(rlsSql);

    res.status(200).json({
      status: 'success',
      message: 'RLS policies applied successfully',
      rowsAffected: Array.isArray(result) ? result.length : (result.rowCount || 0),
      note: 'Policies applied. Run a verification query to confirm.',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to apply RLS policies',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// ============================================================
// Dispatcher
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { task } = req.query;

  if (task === 'assessment-table') {
    return runAssessmentTable(req, res);
  }
  if (task === 'apply-rls') {
    return runApplyRls(req, res);
  }

  return res.status(404).json({
    error: 'Unknown setup task',
    task: task || null,
    available: ['assessment-table', 'apply-rls'],
  });
}
