/**
 * /api/setup/assessment-table — One-time migration endpoint.
 *
 * Creates the assessment_results table if it doesn't exist.
 * Uses the same pg connection pattern as apply-rls.ts.
 *
 * DELETE THIS ENDPOINT AFTER USE — not for production long-term.
 * Auth: requires x-setup-key header matching SETUP_SECRET env var.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const SETUP_SECRET = process.env.SETUP_SECRET || 'lyc-p0fix-20260811-temp';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function buildConnectionString(): string {
  const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : '';
  const host = `db.${projectRef}.supabase.co`;
  return `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${host}:5432/postgres`;
}

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

-- Self read policy
DROP POLICY IF EXISTS assessment_results_self ON public.assessment_results;
CREATE POLICY assessment_results_self ON public.assessment_results FOR SELECT USING (
  (SELECT current_user_role()) IN ('admin', 'lyc_admin', 'super_admin')
  OR (SELECT current_user_role()) IN ('consultant', 'lyc_consultant')
  OR user_id = auth.uid()
);

-- Self write policy  
DROP POLICY IF EXISTS assessment_results_write ON public.assessment_results;
CREATE POLICY assessment_results_write ON public.assessment_results FOR ALL USING (
  (SELECT current_user_role()) IN ('admin', 'lyc_admin', 'super_admin')
  OR user_id = auth.uid()
);

-- Allow anon inserts for anonymous assessments (no user_id, uses anonymous_id)
DROP POLICY IF EXISTS assessment_results_anon_insert ON public.assessment_results;
CREATE POLICY assessment_results_anon_insert ON public.assessment_results FOR INSERT WITH CHECK (
  auth.uid() IS NULL AND anonymous_id IS NOT NULL
);

-- Allow anon select by anonymous_id
DROP POLICY IF EXISTS assessment_results_anon_select ON public.assessment_results;
CREATE POLICY assessment_results_anon_select ON public.assessment_results FOR SELECT USING (
  auth.uid() IS NULL AND anonymous_id IS NOT NULL
);
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = req.headers['x-setup-key'] || req.headers['X-Setup-Key'];
  if (!key || key !== SETUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: buildConnectionString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    const result = await pool.query(CREATE_TABLE_SQL);
    const rowsAffected = Array.isArray(result) ? result.length : (result.rowCount || 0);

    // Verify table exists
    const verify = await pool.query(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_results'"
    );
    const exists = verify.rows[0].count > 0;

    // Check column count
    const cols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assessment_results' ORDER BY ordinal_position"
    );

    res.status(200).json({
      status: 'success',
      table_created: exists,
      columns: cols.rows.map((r: any) => r.column_name),
      column_count: cols.rows.length,
      rows_affected: rowsAffected,
      message: 'assessment_results table created successfully with RLS policies',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create table',
      message: error.message,
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
