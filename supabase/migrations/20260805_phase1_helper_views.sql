-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.2 — Helper views + composite index + health snapshot
-- Tickets: 1.2.17, 1.2.18, 1.2.19, 1.2.20, 1.2.23
--
-- Defensive: vista_contacts / consultants / companies exist in the live DB
-- but not in committed migrations. All view DDL guards with information_schema
-- checks so the migration runs cleanly regardless.
-- ──────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.17  Composite index on vista_contacts(engagement_score, priority_score)
-- ════════════════════════════════════════════════════════════════════════
-- Only if vista_contacts exists AND both columns are present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='vista_contacts'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vista_contacts'
      AND column_name='engagement_score'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='vista_contacts'
      AND column_name='priority_score'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vista_contacts_engagement_priority ON public.vista_contacts (engagement_score DESC, priority_score DESC)';
    RAISE NOTICE '1.2.17: created composite index on vista_contacts';
  ELSE
    RAISE NOTICE '1.2.17: vista_contacts or its columns not present — skipped';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.18  v_unified_contacts — UNION contacts + vista_contacts (dedup email)
-- ════════════════════════════════════════════════════════════════════════
-- Single contact view merging the operational contacts table with the
-- Notion-synced vista_contacts, deduplicated by lowercased email. Prefers the
-- operational row (richer schema) when both exist for the same email.
-- Defensive: only created if vista_contacts exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='vista_contacts'
  ) THEN
    EXECUTE $f$
      CREATE OR REPLACE VIEW public.v_unified_contacts AS
      SELECT
        COALESCE(c.id, v.id) AS id,
        COALESCE(c.email, v.email) AS email,
        COALESCE(c.name, v.name) AS name,
        COALESCE(c.company_id, v.company_id) AS company_id,
        COALESCE(c.current_title, v.current_title) AS current_title,
        COALESCE(c.seniority, v.seniority) AS seniority,
        COALESCE(c.location, v.location) AS location,
        COALESCE(c.country, v.country) AS country,
        COALESCE(c.engagement_score, v.engagement_score) AS engagement_score,
        c.notion_id,
        c.source,
        c.updated_at,
        CASE WHEN c.id IS NOT NULL THEN 'contacts' ELSE 'vista_contacts' END AS origin
      FROM public.contacts c
      FULL OUTER JOIN public.vista_contacts v
        ON LOWER(COALESCE(c.email,'')) = LOWER(COALESCE(v.email,''))
        AND c.email IS NOT NULL AND v.email IS NOT NULL;
    $f$;
    EXECUTE 'GRANT SELECT ON public.v_unified_contacts TO authenticated, anon';
    RAISE NOTICE '1.2.18: created v_unified_contacts';
  ELSE
    RAISE NOTICE '1.2.18: vista_contacts not present — v_unified_contacts skipped';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.19  v_active_mandates — mandates WHERE status NOT IN ('6_closed','on_hold')
-- ════════════════════════════════════════════════════════════════════════
-- Closed/cancelled mandates are excluded. Status values per master migration:
-- 1_search, 2_sourcing, 3_screen, 4_interview, 5_offer, 6_closed, on_hold.
CREATE OR REPLACE VIEW public.v_active_mandates AS
SELECT
  m.*,
  c.company_name,
  COALESCE(c.name, m.client_name) AS client_display_name,
  TRIM(COALESCE(cs.first_name,'') || ' ' || COALESCE(cs.last_name,'')) AS consultant_name,
  cs.email AS consultant_email
FROM public.mandates m
LEFT JOIN public.companies c ON c.id = m.client_id
LEFT JOIN public.consultants cs ON cs.id = m.lead_consultant_id
WHERE m.status NOT IN ('6_closed', 'on_hold', 'closed', 'cancelled');

GRANT SELECT ON public.v_active_mandates TO authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.20  v_consultant_workload — mandates grouped by consultant
-- ════════════════════════════════════════════════════════════════════════
-- One row per consultant with active mandate counts + candidate throughput.
CREATE OR REPLACE VIEW public.v_consultant_workload AS
SELECT
  cs.id AS consultant_id,
  cs.consultant_code,
  TRIM(COALESCE(cs.first_name,'') || ' ' || COALESCE(cs.last_name,'')) AS consultant_name,
  cs.email,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status NOT IN ('6_closed','on_hold','closed','cancelled')) AS active_mandates,
  COUNT(DISTINCT m.id) AS total_mandates,
  COUNT(DISTINCT cp.id) AS total_candidates_in_pipeline,
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.stage = 'HIRED') AS placed_count,
  COUNT(DISTINCT cp.id) FILTER (WHERE cp.stage IN ('INTERVIEW','OFFER')) AS in_interview
FROM public.consultants cs
LEFT JOIN public.mandates m ON m.lead_consultant_id = cs.id
LEFT JOIN public.candidates_pipeline cp ON cp.mandate_id = m.id
GROUP BY cs.id, cs.consultant_code, cs.first_name, cs.last_name, cs.email;

GRANT SELECT ON public.v_consultant_workload TO authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.23  fn_refresh_data_health_snapshot() — scheduled quality check
-- ════════════════════════════════════════════════════════════════════════
-- Persists the current fn_reconcile_data_integrity() output into a snapshot
-- table so trends can be tracked over time. Call via Supabase cron
-- (pg_cron) daily:
--   SELECT cron.schedule('data-health-snapshot', '0 6 * * *',
--     $$SELECT public.fn_refresh_data_health_snapshot()$$);
CREATE TABLE IF NOT EXISTS public.data_health_snapshots (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  table_name  TEXT,
  issue_type  TEXT,
  severity    TEXT,
  detail      TEXT
);

-- Snapshot table is append-only for the system; admins read.
ALTER TABLE public.data_health_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dhs_admin_select" ON public.data_health_snapshots;
CREATE POLICY "dhs_admin_select"
  ON public.data_health_snapshots FOR SELECT TO authenticated
  USING (public.fn_is_admin());
DROP POLICY IF EXISTS "dhs_admin_insert" ON public.data_health_snapshots;
CREATE POLICY "dhs_admin_insert"
  ON public.data_health_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_admin());

CREATE OR REPLACE FUNCTION public.fn_refresh_data_health_snapshot()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.data_health_snapshots (captured_at, table_name, issue_type, severity, detail)
  SELECT now(), table_name, issue_type, severity, detail
  FROM public.fn_reconcile_data_integrity();
END;
$$;

GRANT EXECUTE ON public.fn_refresh_data_health_snapshot TO authenticated, anon;
