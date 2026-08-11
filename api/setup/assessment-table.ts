/**
 * /api/setup/assessment-table — One-time migration endpoint.
 *
 * Creates the assessment_results table if it doesn't exist.
 * Auth: requires x-setup-key header matching SETUP_SECRET env var.
 *
 * DELETE AFTER USE.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const SETUP_SECRET = process.env.SETUP_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function buildConnectionString(): string {
  // Extract project ref from Supabase URL
  const urlMatch = SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : '';
  
  if (!projectRef) {
    throw new Error(`Cannot extract Supabase project ref from URL: ${SUPABASE_URL}`);
  }
  
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  const key = req.headers['x-setup-key'] || req.headers['X-Setup-Key'];
  if (!key || !SETUP_SECRET || key !== SETUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized', has_secret: !!SETUP_SECRET });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connString = buildConnectionString();
    // Don't log the full string (contains password)
    const maskedConn = connString.replace(/:.*@/, ':***@');
    console.log('[setup] Connecting to:', maskedConn);

    const pool = new Pool({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    const client = await pool.connect();
    console.log('[setup] Connected to DB');

    try {
      await client.query('BEGIN');
      const result = await client.query(CREATE_TABLE_SQL);
      await client.query('COMMIT');

      // Verify
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
      await pool.end();
    }
  } catch (error: any) {
    console.error('[setup] Error:', error.message);
    res.status(500).json({
      error: 'Failed to create table',
      message: error.message,
      code: error.code,
      supabase_url_present: !!SUPABASE_URL,
      service_key_present: !!SUPABASE_SERVICE_ROLE_KEY,
    });
  }
}
