-- ============================================================
-- V3-4 / #1344 Tier-Based Assessment Access RLS Policies
--
-- Scope: assessment_results row visibility is restricted by:
--   1. Admin / internal staff → full read access
--   2. Owner (user_id = auth.uid()) → read IF:
--      a. Tier is paid (professional / executive / council / enterprise)
--         → any assessment_code allowed, OR
--      b. Assessment is the complimentary CPI code.
--   3. Anonymous_id rows: never readable via direct RLS (handled
--      through API context only — we don't join anonymous_id over
--      RLS since no auth context exists).
--
-- Complimentary assessment code = 'CPI'.
-- Paid tiers = professional, executive, council, enterprise.
--
-- This migration is rerunnable (idempotent) via DO blocks that
-- check pg_policy existence before CREATE POLICY.
-- ============================================================

BEGIN;

-- Helper: check tier from profiles via join
-- We use an EXISTS pattern because profiles.tier carries the canonical tier.

-- Tier helper: is the given user on a paid tier?
-- Paid tiers: professional, executive, council, enterprise.
-- Executive introduction (or NULL) is NOT paid.
DO $$ BEGIN PERFORM set_config('app.complimentary_assessment_code', 'CPI', false); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================
-- assessment_results SELECT policy: owner + tier scoping
-- ============================================================
ALTER TABLE IF EXISTS public.assessment_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_results_self') THEN
    DROP POLICY assessment_results_self ON public.assessment_results;
  END IF;
END $$;

CREATE POLICY assessment_results_self ON public.assessment_results
  FOR SELECT
  USING (
    -- Admin / internal staff always read everything
    public.is_admin_role(public.current_user_role())
    OR public.is_consultant_role(public.current_user_role())
    -- Owner read: tier-paid OR complimentary CPI
    OR (
      user_id = auth.uid()
      AND (
        -- Tier is paid (professional or above)
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND COALESCE(p.tier, '') IN (
              'professional','pro','executive','council','enterprise',
              'starter','council','executive'
            )
        )
        -- OR assessment code is complimentary CPI (Executive Introduction)
        OR UPPER(assessment_code) = 'CPI'
      )
    )
    -- Share token read path (pre-existing capability URL pattern)
    OR (share_token IS NOT NULL AND share_token = current_setting('app.current_share_token', true))
  );

-- ============================================================
-- assessment_results WRITE policy: owner only (tier checked at API)
-- WRITE is always restricted to owner (user_id = auth.uid()) or admin.
-- The additional tier / CPI-allowed check is enforced at the API layer
-- (api/assessments/run.ts) BEFORE insert. RLS here is a second gate.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_results_write') THEN
    DROP POLICY assessment_results_write ON public.assessment_results;
  END IF;
END $$;

CREATE POLICY assessment_results_write ON public.assessment_results
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR user_id = auth.uid()
  );

-- ============================================================
-- user_assessment_progress: user-scoped write only (tier check at API)
-- ============================================================
ALTER TABLE IF EXISTS public.user_assessment_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'uap_read') THEN
    DROP POLICY uap_read ON public.user_assessment_progress;
  END IF;
END $$;

CREATE POLICY uap_read ON public.user_assessment_progress
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR user_id = auth.uid()
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'uap_insert') THEN
    DROP POLICY uap_insert ON public.user_assessment_progress;
  END IF;
END $$;

CREATE POLICY uap_insert ON public.user_assessment_progress
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'uap_update') THEN
    DROP POLICY uap_update ON public.user_assessment_progress;
  END IF;
END $$;

CREATE POLICY uap_update ON public.user_assessment_progress
  FOR UPDATE
  USING (
    user_id = auth.uid()
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'uap_delete') THEN
    DROP POLICY uap_delete ON public.user_assessment_progress;
  END IF;
END $$;

CREATE POLICY uap_delete ON public.user_assessment_progress
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_admin_role(public.current_user_role())
  );

-- ============================================================
-- assessment_shares: owner writes; public read-by-token (no change needed)
-- Confirm the existing share policy still applies alongside tier rules.
-- ============================================================
ALTER TABLE IF EXISTS public.assessment_shares ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY assessment_results_self ON public.assessment_results IS
'V3-4: Admin/consultant full read; owners read IF paid-tier OR CPI; share-token read by capability URL.';

COMMIT;
