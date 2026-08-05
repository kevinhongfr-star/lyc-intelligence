-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.5 — Admin tools & migration validation
-- Tickets: 1.5.01-04, 1.5.08-11, 1.5.16-18, 1.5.21-25
--
-- Already done (skipped): 1.5.16 backup script = S4-T06
--   scripts/backup-critical-tables.mjs + docs/operations/RECOVERY_RUNBOOK.md
-- ──────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════
-- 1.5.01  migration_audit_log — every migration run logged here
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.migration_audit_log (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filename      TEXT NOT NULL,
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_by    TEXT,                       -- 'supabase-migration' | user email
  checksum      TEXT,                       -- sha256 of file content
  status        TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','rolled_back')),
  error_message TEXT
);
ALTER TABLE public.migration_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mal_admin_all" ON public.migration_audit_log;
CREATE POLICY "mal_admin_all"
  ON public.migration_audit_log FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.5.02  migration_validation_results — per-migration check outcomes
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.migration_validation_results (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  migration_filename TEXT NOT NULL,
  check_name    TEXT NOT NULL,
  passed        BOOLEAN NOT NULL,
  detail        TEXT,
  validated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mvr_filename ON public.migration_validation_results (migration_filename);
ALTER TABLE public.migration_validation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mvr_admin_all" ON public.migration_validation_results;
CREATE POLICY "mvr_admin_all"
  ON public.migration_validation_results FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.5.03  fn_validate_migration(filename) — run post-migration checks
-- ════════════════════════════════════════════════════════════════════════
-- Checks: file logged in audit, RLS enabled on all tables, no qual='true'
-- policies. (fn_audit_migration persists the results.)
CREATE OR REPLACE FUNCTION public.fn_validate_migration(p_filename TEXT)
RETURNS TABLE(check_name TEXT, passed BOOLEAN, detail TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_rls_off INT;
  v_qual_true INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.migration_audit_log WHERE filename = p_filename;
  SELECT COUNT(*) INTO v_rls_off FROM pg_tables WHERE schemaname='public' AND rowsecurity = false;
  SELECT COUNT(*) INTO v_qual_true FROM pg_policies WHERE schemaname='public'
    AND COALESCE(qual,'') IN ('true','t',"'t'",'1',"'1'");

  RETURN QUERY VALUES
    ('logged_in_audit', v_count > 0, format('%s audit entries', v_count)),
    ('all_tables_rls_enabled', v_rls_off = 0, format('%s tables with RLS off', v_rls_off)),
    ('no_qual_true_policies', v_qual_true = 0, format('%s qual=true policies', v_qual_true));
END;
$$;
GRANT EXECUTE ON public.fn_validate_migration TO authenticated;

-- 1.5.04  fn_audit_migration(filename) — convenience wrapper that runs
-- validate + persists results
CREATE OR REPLACE FUNCTION public.fn_audit_migration(p_filename TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.migration_validation_results (migration_filename, check_name, passed, detail)
  SELECT p_filename, check_name, passed, detail
  FROM public.fn_validate_migration(p_filename);
END;
$$;
GRANT EXECUTE ON public.fn_audit_migration TO authenticated;

-- Log all Phase 1 migrations as applied
INSERT INTO public.migration_audit_log (filename, applied_by, status)
SELECT filename, 'supabase-migration', 'success' FROM (VALUES
  ('20260805_phase1_user_roles_and_helpers.sql'),
  ('20260805_phase1_revoke_public.sql'),
  ('20260805_phase1_rls_policies.sql'),
  ('20260805_phase1_data_integrity.sql'),
  ('20260805_phase1_helper_views.sql'),
  ('20260805_phase1_auth_infra.sql'),
  ('20260805_phase1_portal_wiring.sql'),
  ('20260805_phase1_admin_tools.sql')
) AS v(filename)
WHERE NOT EXISTS (
  SELECT 1 FROM public.migration_audit_log mal WHERE mal.filename = v.filename
);

-- ════════════════════════════════════════════════════════════════════════
-- 1.5.08  maintenance_windows
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.maintenance_windows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','completed','cancelled')),
  created_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mw_status ON public.maintenance_windows (status);
ALTER TABLE public.maintenance_windows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mw_select_all" ON public.maintenance_windows;
CREATE POLICY "mw_select_all"
  ON public.maintenance_windows FOR SELECT TO authenticated
  USING (TRUE);  -- all authenticated users can see maintenance windows
DROP POLICY IF EXISTS "mw_admin_write" ON public.maintenance_windows;
CREATE POLICY "mw_admin_write"
  ON public.maintenance_windows FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

-- 1.5.09/10  fn_create/close_maintenance_window
CREATE OR REPLACE FUNCTION public.fn_create_maintenance_window(
  p_title TEXT, p_starts_at TIMESTAMPTZ, p_ends_at TIMESTAMPTZ DEFAULT NULL, p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.fn_is_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
  INSERT INTO public.maintenance_windows (title, description, starts_at, ends_at, created_by)
  VALUES (p_title, p_description, p_starts_at, p_ends_at, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_close_maintenance_window(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
  UPDATE public.maintenance_windows
  SET status = 'completed', ends_at = LEAST(COALESCE(ends_at, now()), now())
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON public.fn_create_maintenance_window, public.fn_close_maintenance_window TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.5.11  system_alerts + v_active_alerts
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity    TEXT NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  message     TEXT NOT NULL,
  source      TEXT,                          -- 'rls' | 'migration' | 'backup' | 'manual'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);
CREATE INDEX IF NOT EXISTS idx_sa_resolved ON public.system_alerts (resolved_at) WHERE resolved_at IS NULL;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sa_admin_all" ON public.system_alerts;
CREATE POLICY "sa_admin_all"
  ON public.system_alerts FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

CREATE OR REPLACE VIEW public.v_active_alerts AS
SELECT id, severity, message, source, created_at
FROM public.system_alerts
WHERE resolved_at IS NULL
ORDER BY
  CASE severity WHEN 'critical' THEN 0 WHEN 'error' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
  created_at DESC;
GRANT SELECT ON public.v_active_alerts TO authenticated;

-- Seed an info alert noting Phase 1 completion
INSERT INTO public.system_alerts (severity, message, source)
VALUES ('info', 'Phase 1 (Database Foundation) migrations applied — run fn_validate_phase1_acceptance() to verify.', 'migration')
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- 1.5.21-25  Phase 1 acceptance test
-- ════════════════════════════════════════════════════════════════════════
-- Comprehensive end-of-phase validator. Returns (phase, check_name, passed, detail).
CREATE OR REPLACE FUNCTION public.fn_validate_phase1_acceptance()
RETURNS TABLE(phase TEXT, check_name TEXT, passed BOOLEAN, detail TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rls_off INT; v_qual_true INT; v_unprotected INT; v_helpers INT; v_admins INT; v_migrations INT;
BEGIN
  SELECT COUNT(*) INTO v_rls_off FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;
  SELECT COUNT(*) INTO v_qual_true FROM pg_policies WHERE schemaname='public'
    AND COALESCE(qual,'') IN ('true','t',"'t'",'1',"'1'");
  SELECT COUNT(*) INTO v_unprotected FROM (
    SELECT t.tablename FROM pg_tables t
    LEFT JOIN pg_policies p ON p.schemaname=t.schemaname AND p.tablename=t.tablename
    WHERE t.schemaname='public' AND p.policyname IS NULL
  ) z;
  SELECT COUNT(*) INTO v_helpers FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('fn_is_admin','fn_is_consultant','fn_is_internal_user','fn_role_rank');
  SELECT COUNT(*) INTO v_admins FROM public.user_roles WHERE role_name='admin' AND status='active';
  SELECT COUNT(*) INTO v_migrations FROM public.migration_audit_log WHERE status='success' AND filename LIKE '20260805_phase1_%';

  RETURN QUERY VALUES
    ('1.1', 'rls_enabled_all_tables', v_rls_off = 0, format('%s tables with RLS off', v_rls_off)),
    ('1.1', 'no_qual_true_policies', v_qual_true = 0, format('%s qual=true policies', v_qual_true)),
    ('1.1', 'no_unprotected_tables', v_unprotected = 0, format('%s tables with zero policies', v_unprotected)),
    ('1.1', 'helper_functions_present', v_helpers = 4, format('%s/4 helpers', v_helpers)),
    ('1.1', 'admins_backfilled', v_admins > 0, format('%s admin users', v_admins)),
    ('1.3', 'user_type_system_present',
      EXISTS(SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='user_type'),
      'user_type enum exists'),
    ('1.4', 'portal_tables_present',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='credit_packages')
      AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='council_profiles'),
      'credit_packages + council_profiles exist'),
    ('1.5', 'phase1_migrations_logged', v_migrations >= 8, format('%s/8 phase1 migrations logged', v_migrations));
END;
$$;
GRANT EXECUTE ON public.fn_validate_phase1_acceptance TO authenticated;

-- 1.5.17  Note: backup script (S4-T06) already exists at scripts/backup-critical-tables.mjs
-- 1.5.18  Note: RECOVERY_RUNBOOK.md already exists at docs/operations/RECOVERY_RUNBOOK.md
INSERT INTO public.data_seeding_log (table_name, rows_seeded, notes)
VALUES ('backup_infra', 1, 'S4-T06 backup script + recovery runbook already in place');
