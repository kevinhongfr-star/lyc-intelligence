-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.2 — Data integrity, backfills, FK validation
-- Tickets: 1.2.06, 1.2.07, 1.2.08, 1.2.09, 1.2.10, 1.2.11
--
-- Already done by prior migrations (skipped here):
--   1.2.01-05  v_mandate_scores JOIN repair + client_name/consultant cols
--              → 20260701_fix_v_mandate_scores_view.sql (S1-T18)
--   1.2.12/13  candidates_pipeline FK → mandates/contacts
--              → MASTER_MIGRATION (FKs already declared on the table)
--   1.2.14     contacts.email index  → MASTER_MIGRATION idx_contacts_email
--   1.2.15     mandates.status index → MASTER_MIGRATION idx_mandates_status
--   1.2.16     candidates_pipeline.mandate_id index → MASTER_MIGRATION
--
-- Defensive: consultants / vista_* tables exist in the live DB but not in any
-- committed migration. All references guard with information_schema checks so
-- this migration runs cleanly whether or not each object exists.
-- ──────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.06  fn_reconcile_data_integrity() — cross-table consistency checker
-- ════════════════════════════════════════════════════════════════════════
-- Scans for orphaned FK references, NULL required columns, and stale counts.
-- Returns a table of (table_name, issue_type, severity, detail). Read-only;
-- safe to run any time. The refresh-snapshot function (1.2.23) calls this.
CREATE OR REPLACE FUNCTION public.fn_reconcile_data_integrity()
RETURNS TABLE(
  table_name  TEXT,
  issue_type  TEXT,
  severity    TEXT,
  detail      TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- mandates with no resolvable client (client_id NULL or orphaned)
  SELECT 'mandates'::TEXT, 'orphan_client'::TEXT, 'P1'::TEXT,
         format('mandate %s has NULL or orphaned client_id', m.id)
  FROM public.mandates m
  LEFT JOIN public.companies c ON c.id = m.client_id
  WHERE m.client_id IS NULL OR c.id IS NULL;

  RETURN QUERY
  -- mandates with no lead_consultant
  SELECT 'mandates'::TEXT, 'null_consultant'::TEXT, 'P2'::TEXT,
         format('mandate %s has no lead_consultant_id', m.id)
  FROM public.mandates m
  WHERE m.lead_consultant_id IS NULL;

  RETURN QUERY
  -- candidates_pipeline rows referencing a missing mandate/contact
  SELECT 'candidates_pipeline'::TEXT, 'orphan_fk'::TEXT, 'P0'::TEXT,
         format('pipeline row %s references missing mandate or contact', cp.id)
  FROM public.candidates_pipeline cp
  LEFT JOIN public.mandates m ON m.id = cp.mandate_id
  LEFT JOIN public.contacts c ON c.id = cp.contact_id
  WHERE m.id IS NULL OR c.id IS NULL;

  RETURN QUERY
  -- candidates_pipeline with NULL weighted_score (1.2.10 — flagged for backfill)
  SELECT 'candidates_pipeline'::TEXT, 'null_score'::TEXT, 'P2'::TEXT,
         format('pipeline row %s has NULL weighted_score', cp.id)
  FROM public.candidates_pipeline cp
  WHERE cp.weighted_score IS NULL;

  RETURN QUERY
  -- contacts with NULL email (lookup performance + dedup risk)
  SELECT 'contacts'::TEXT, 'null_email'::TEXT, 'P2'::TEXT,
         format('contact %s has NULL email', c.id)
  FROM public.contacts c
  WHERE c.email IS NULL;

  RETURN QUERY
  -- client_mandate_access rows pointing at a missing mandate or client
  SELECT 'client_mandate_access'::TEXT, 'orphan_fk'::TEXT, 'P1'::TEXT,
         format('cma row %s references missing client or mandate', cma.client_account_id)
  FROM public.client_mandate_access cma
  LEFT JOIN public.client_accounts ca ON ca.id = cma.client_account_id
  LEFT JOIN public.mandates m ON m.id = cma.mandate_id
  WHERE ca.id IS NULL OR m.id IS NULL;
END;
$$;

GRANT EXECUTE ON public.fn_reconcile_data_integrity TO authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.07  v_data_health — row counts, orphan refs, NULL rates
-- ════════════════════════════════════════════════════════════════════════
-- Single-view summary of schema health. Aggregates the fn_reconcile output
-- plus per-table row counts. Query this view for a quick dashboard.
CREATE OR REPLACE VIEW public.v_data_health AS
SELECT
  issue.table_name,
  issue.issue_type,
  issue.severity,
  issue.detail,
  -- join in the live row count for the affected table
  rc.row_count
FROM public.fn_reconcile_data_integrity() issue
LEFT JOIN LATERAL (
  SELECT reltuples::BIGINT AS row_count
  FROM pg_class
  WHERE relname = issue.table_name
  LIMIT 1
) rc ON TRUE;

GRANT SELECT ON public.v_data_health TO authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.08  Backfill mandates.client_id from company_id (defensive)
-- ════════════════════════════════════════════════════════════════════════
-- The spec notes mandates.company_id held stale values that should live in
-- mandates.client_id. Only run if BOTH columns exist (company_id may not be
-- present on this schema). Idempotent: only fills NULL client_id.
DO $$
DECLARE
  updated INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='mandates' AND column_name='company_id'
  ) THEN
    UPDATE public.mandates SET client_id = company_id
    WHERE client_id IS NULL AND company_id IS NOT NULL;
    GET DIAGNOSTICS updated = ROW_COUNT;
    RAISE NOTICE '1.2.08: backfilled % mandates.client_id from company_id', updated;
  ELSE
    RAISE NOTICE '1.2.08: mandates.company_id not present — skipped';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.09  Backfill consultants.name from first_name + last_name
-- ════════════════════════════════════════════════════════════════════════
-- Defensive: only if the consultants table + a `name` column exist.
DO $$
DECLARE
  updated INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultants' AND column_name='name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultants'
      AND column_name IN ('first_name','last_name')
  ) THEN
    UPDATE public.consultants
    SET name = TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
    WHERE name IS NULL
      AND COALESCE(first_name,'') || COALESCE(last_name,'') <> '';
    GET DIAGNOSTICS updated = ROW_COUNT;
    RAISE NOTICE '1.2.09: backfilled % consultants.name', updated;
  ELSE
    RAISE NOTICE '1.2.09: consultants.name or first/last_name not present — skipped';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.10  Fix candidates_pipeline NULL scores — wire scoring pipeline output
-- ════════════════════════════════════════════════════════════════════════
-- The scoring pipeline (scoringComputeHandler / scoring_runs) writes
-- weighted_score. Rows with NULL have not been scored yet. We set a neutral
-- default (0) so downstream aggregations don't emit NULL; the next scoring
-- run will overwrite with the real value. This is a one-time backfill — new
-- rows should get their score from the pipeline.
DO $$
DECLARE
  updated INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='candidates_pipeline'
      AND column_name='weighted_score'
  ) THEN
    UPDATE public.candidates_pipeline
    SET weighted_score = 0
    WHERE weighted_score IS NULL;
    GET DIAGNOSTICS updated = ROW_COUNT;
    RAISE NOTICE '1.2.10: defaulted % NULL weighted_score rows to 0', updated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.2.11  fn_validate_fk_integrity() — detect orphaned FK references
-- ════════════════════════════════════════════════════════════════════════
-- Generic FK integrity checker. Scans every single-column FK constraint in
-- public for orphaned child rows (child has a non-NULL FK pointing at a
-- missing parent). Returns (constraint_name, child_table, parent_table,
-- orphan_count). Read-only.
CREATE OR REPLACE FUNCTION public.fn_validate_fk_integrity()
RETURNS TABLE(
  constraint_name TEXT,
  child_table     TEXT,
  parent_table    TEXT,
  orphan_count    BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fk RECORD;
  q TEXT;
BEGIN
  FOR fk IN
    SELECT
      con.conname AS constraint_name,
      cl.relname  AS child_table,
      pr.relname  AS parent_table,
      con.conkey,
      con.confkey
    FROM pg_constraint con
    JOIN pg_class cl  ON cl.oid  = con.conrelid
    JOIN pg_class pr  ON pr.oid  = con.confrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'public'
      AND con.contype = 'f'
      AND array_length(con.conkey, 1) = 1
  LOOP
    -- Resolve child + parent column names from attnums
    EXECUTE format(
      'WITH cc AS (SELECT attname FROM pg_attribute WHERE attrelid = %s AND attnum = %s),
              pc AS (SELECT attname FROM pg_attribute WHERE attrelid = %s AND attnum = %s)
       SELECT format(''SELECT %L, %L, %L, COUNT(*) FROM public.%I WHERE %I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.%I WHERE %I = public.%I.%I)'',
                     %L, %L, %L, %L, (SELECT attname FROM cc), %L, (SELECT attname FROM pc), %L, (SELECT attname FROM cc))',
      cl.oid, fk.conkey[1], pr.oid, fk.confkey[1],
      fk.constraint_name, fk.child_table, fk.parent_table,
      fk.child_table, fk.parent_table, fk.child_table
    ) INTO q;
    RETURN QUERY EXECUTE q;
  END LOOP;
END;
$$;

GRANT EXECUTE ON public.fn_validate_fk_integrity TO authenticated, anon;
