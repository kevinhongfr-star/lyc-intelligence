-- =====================================================================
-- #94 / #1344 — B2C Tier-Based Access Control — RLS policy supplement
-- =====================================================================
-- Adds explicit RLS SELECT/INSERT/UPDATE/DELETE policies to all 8 tables
-- in the assessment domain. Rerunnable (CREATE POLICY … DO ALTERNATIVE not
-- standard, so each policy block checks for existence first via DO block).
--
-- Canonical tiers (from tiers lookup):
--   executive_introduction  complimentary entry, 3 dimensions, no PDF, no NEXUS
--   professional            6 dimensions, PDF export, basic NEXUS
--   executive               everything + advanced NEXUS
--   council                 everything + priority
--   enterprise              B2B (not B2C focus)
--
-- Roles per #1344:
--   anonymous   → not logged in; public catalog + share_token reads only
--   user        → logged in; owner-writes-own-rows (user_id = auth.uid())
--   admin       → JWT claim: app_metadata -> role = 'admin'; bypass via
--                 (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' checks
--
-- RUN AFTER: supabase/migrations/20260812_assessment_domain_tables.sql
-- =====================================================================

BEGIN;

-- 1. admin helper: any authenticated user whose JWT carries
--    app_metadata.role = 'admin' is considered an admin.
DO $$ BEGIN PERFORM set_config('app.admin_claim_path', 'app_metadata.role', false); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Public catalog tables — anonymous+authenticated read, admin write.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_definitions_public_read_catalog') THEN
    CREATE POLICY assessment_definitions_public_read_catalog
      ON public.assessment_definitions FOR SELECT
      USING (is_published = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_definitions_admin_write') THEN
    CREATE POLICY assessment_definitions_admin_write
      ON public.assessment_definitions FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_dimensions_public_read') THEN
    CREATE POLICY assessment_dimensions_public_read
      ON public.assessment_dimensions FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_questions_public_read') THEN
    CREATE POLICY assessment_questions_public_read
      ON public.assessment_questions FOR SELECT
      USING (true);
  END IF;
END $$;

-- 3. User-owned rows (attempts / responses / results / result_dimensions)
--    Owner = user_id = auth.uid(). Results additionally allow read via
--    share_token lookup (via session variable OR a caller that SETs
--    app.current_share_token, e.g. edge function / api route).
-- ---------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_attempts_owner_rw') THEN
    CREATE POLICY assessment_attempts_owner_rw
      ON public.assessment_attempts FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_attempts_admin_all') THEN
    CREATE POLICY assessment_attempts_admin_all
      ON public.assessment_attempts FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_responses_owner_rw') THEN
    CREATE POLICY assessment_responses_owner_rw
      ON public.assessment_responses FOR ALL
      USING (attempt_id IN (
        SELECT attempt_id FROM public.assessment_attempts WHERE user_id = auth.uid()
      ))
      WITH CHECK (attempt_id IN (
        SELECT attempt_id FROM public.assessment_attempts WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_responses_admin_all') THEN
    CREATE POLICY assessment_responses_admin_all
      ON public.assessment_responses FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

-- assessment_results: owner (user_id = auth.uid()) OR share_token matches
-- current_share_token session var (set by API when resolving a share URL).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_results_owner_rw') THEN
    CREATE POLICY assessment_results_owner_rw
      ON public.assessment_results FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_results_share_token_read') THEN
    CREATE POLICY assessment_results_share_token_read
      ON public.assessment_results FOR SELECT
      USING (share_token IS NOT NULL AND share_token = current_setting('app.current_share_token', true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_results_admin_all') THEN
    CREATE POLICY assessment_results_admin_all
      ON public.assessment_results FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

-- result dimensions: inherit visibility from parent result.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_result_dimensions_via_result') THEN
    CREATE POLICY assessment_result_dimensions_via_result
      ON public.assessment_result_dimensions FOR ALL
      USING (result_id IN (
        SELECT result_id FROM public.assessment_results
        WHERE user_id = auth.uid()
           OR (share_token IS NOT NULL AND share_token = current_setting('app.current_share_token', true))
           OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      ));
  END IF;
END $$;

-- 4. Archetypes — read-only by everyone (content, not per-user data).
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_archetypes_public_read') THEN
    CREATE POLICY assessment_archetypes_public_read
      ON public.assessment_archetypes FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'assessment_archetypes_admin_write') THEN
    CREATE POLICY assessment_archetypes_admin_write
      ON public.assessment_archetypes FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

COMMIT;
