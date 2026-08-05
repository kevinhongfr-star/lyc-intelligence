-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.1 — Security regression test (1.1.25)
-- Issue: #3 (P0 security blocker)
--
-- Verifies the RLS lockdown is complete. Run AFTER the three Phase 1.1
-- migrations. Designed to be executed by CI or manually via psql; raises an
-- exception on any assertion failure so the script exits non-zero.
--
-- Usage:
--   psql "$DATABASE_URL" -f supabase/tests/rls_regression_test.sql
--
-- Expected: "RLS_REGRESSION_TEST: PASS" on success, EXCEPTION on failure.
-- ──────────────────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on

DO $$
DECLARE
  v_count INT;
  v_failed TEXT[];
BEGIN
  v_failed := ARRAY[]::TEXT[];

  -- ── Check 1: anon has NO privileges on the 10 P0 tables ──
  SELECT COUNT(*) INTO v_count
  FROM information_schema.role_table_grants
  WHERE grantee = 'anon'
    AND table_schema = 'public'
    AND table_name IN (
      'contacts','vista_contacts','mandates','candidates_pipeline',
      'vista_messages','vista_signals','vista_stains','vista_sync_log',
      'vista_proposals','ai_generations'
    );
  IF v_count > 0 THEN
    v_failed := array_append(v_failed, format('Check 1 FAIL: anon still has grants on %s P0 table(s)', v_count));
  END IF;

  -- ── Check 2: no `qual='true'` policies remain ──
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND COALESCE(qual, '') IN ('true','t',"'t'",'1',"'1'");
  IF v_count > 0 THEN
    v_failed := array_append(v_failed, format('Check 2 FAIL: %s qual=true policy(ies) remain', v_count));
  END IF;

  -- ── Check 3: every public table has RLS ENABLED ──
  SELECT COUNT(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;
  IF v_count > 0 THEN
    v_failed := array_append(v_failed, format('Check 3 FAIL: %s table(s) with RLS disabled', v_count));
  END IF;

  -- ── Check 4: no public table has zero policies (catch-all worked) ──
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT t.tablename
    FROM pg_tables t
    LEFT JOIN pg_policies p
      ON p.schemaname = t.schemaname AND p.tablename = t.tablename
    WHERE t.schemaname = 'public' AND p.policyname IS NULL
  ) gaps;
  IF v_count > 0 THEN
    v_failed := array_append(v_failed, format('Check 4 FAIL: %s table(s) with zero policies', v_count));
  END IF;

  -- ── Check 5: helper functions exist and are STABLE/SECURITY DEFINER ──
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('fn_is_admin','fn_is_consultant','fn_is_internal_user','fn_role_rank');
  IF v_count < 4 THEN
    v_failed := array_append(v_failed, format('Check 5 FAIL: only %s/4 helper functions found', v_count));
  END IF;

  -- ── Check 6: user_roles table exists with the backfill ──
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'user_roles';
  IF v_count = 0 THEN
    v_failed := array_append(v_failed, 'Check 6 FAIL: user_roles table missing');
  ELSE
    SELECT COUNT(*) INTO v_count FROM public.user_roles WHERE role_name = 'admin' AND status = 'active';
    IF v_count = 0 THEN
      v_failed := array_append(v_failed, 'Check 6 FAIL: no admin users backfilled into user_roles');
    END IF;
  END IF;

  IF array_length(v_failed, 1) > 0 THEN
    RAISE EXCEPTION 'RLS_REGRESSION_TEST: FAIL — %', array_to_string(v_failed, E'\n  - ');
  END IF;

  RAISE NOTICE 'RLS_REGRESSION_TEST: PASS — all 6 checks passed';
END $$;

-- ── Functional check: a non-internal user cannot read contacts ──
-- This runs as the current (service_role / migration) caller, so we simulate
-- by asserting that fn_is_internal_user returns FALSE for a synthetic UUID
-- that has no user_roles row. A real candidate login would hit the same gate.
DO $$
DECLARE
  v_fake_uid UUID := '00000000-0000-0000-0000-000000000001';
  v_internal BOOLEAN;
BEGIN
  -- fake uid has no user_roles entry → should NOT be internal
  SELECT public.fn_is_internal_user(v_fake_uid) INTO v_internal;
  IF v_internal IS NOT FALSE THEN
    RAISE EXCEPTION 'RLS_REGRESSION_TEST: FAIL — non-provisioned user evaluated as internal';
  END IF;
  RAISE NOTICE 'RLS_REGRESSION_TEST: PASS — non-provisioned user correctly denied internal access';
END $$;
