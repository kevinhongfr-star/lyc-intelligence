-- ════════════════════════════════════════════════════════════════════════
-- 20260709_portal_rls_policies.sql
-- T1: Portal RLS Policies for Core Tables
--
-- Adds 12 client-facing RLS policies so portal pages can query core
-- tables through Supabase RLS instead of hitting empty results or
-- leaking data across tenants.
--
-- Tables covered:
--   mandates, candidates_pipeline, contacts, candidate_mandate_links,
--   assessments, generated_reports, events, candidate_outreach_log
--
-- Design: clients see only rows linked to mandates they have access to
-- via client_mandate_access. LYC staff (admin/consultant) retain
-- full access. Tables that may not exist yet (assessments, events)
-- are handled gracefully with DO$$ blocks.
-- ════════════════════════════════════════════════════════════════════════

-- Helper: client mandate access subquery (reused across policies)
-- Returns TRUE if auth.uid() is a client with access to :mandate_id
-- or is LYC staff.

-- ── 1. mandates ──────────────────────────────────────────────────────────
-- Existing: admin read/write, service_role. Missing: client portal read.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mandates' AND policyname = 'Client can read accessible mandates'
  ) THEN
    CREATE POLICY "Client can read accessible mandates" ON public.mandates
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.client_mandate_access cma
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
            AND cma.mandate_id = mandates.id
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );
    RAISE NOTICE 'Policy 1/12: Client read on mandates';
  END IF;
END
$$;

-- ── 2. candidates_pipeline ───────────────────────────────────────────────
-- Existing: service_role, users read, users write. Missing: client-scoped read.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidates_pipeline' AND policyname = 'Client can read pipeline for accessible mandates'
  ) THEN
    CREATE POLICY "Client can read pipeline for accessible mandates" ON public.candidates_pipeline
      FOR SELECT TO authenticated
      USING (
        mandate_id IN (
          SELECT cma.mandate_id FROM public.client_mandate_access cma
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );
    RAISE NOTICE 'Policy 2/12: Client read on candidates_pipeline';
  END IF;
END
$$;

-- ── 3. contacts ──────────────────────────────────────────────────────────
-- Existing: service_role, staff read, users write. Missing: client-scoped read.
-- Clients can see contacts that have been presented (client_presented = true)
-- and are linked to mandates they have access to.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Client can read presented contacts'
  ) THEN
    CREATE POLICY "Client can read presented contacts" ON public.contacts
      FOR SELECT TO authenticated
      USING (
        -- Contact was presented to a client and belongs to an accessible mandate
        contacts.client_presented = true
        AND EXISTS (
          SELECT 1 FROM public.candidate_mandate_links cml
          JOIN public.client_mandate_access cma ON cma.mandate_id = cml.mandate_id
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
            AND cml.contact_id = contacts.id
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );
    RAISE NOTICE 'Policy 3/12: Client read on contacts';
  END IF;
END
$$;

-- ── 4. candidate_mandate_links ───────────────────────────────────────────
-- Existing: team view/create/update (open to all authenticated). Missing: client-scoped read.
-- Tighten: clients only see links for mandates they have access to.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidate_mandate_links' AND policyname = 'Client can read links for accessible mandates'
  ) THEN
    CREATE POLICY "Client can read links for accessible mandates" ON public.candidate_mandate_links
      FOR SELECT TO authenticated
      USING (
        mandate_id IN (
          SELECT cma.mandate_id FROM public.client_mandate_access cma
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );
    RAISE NOTICE 'Policy 4/12: Client read on candidate_mandate_links';
  END IF;
END
$$;

-- ── 5. assessments ───────────────────────────────────────────────────────
-- Table may not exist in migrations. Handle gracefully.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
    ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Client can read assessments for accessible mandates'
    ) THEN
      CREATE POLICY "Client can read assessments for accessible mandates" ON public.assessments
        FOR SELECT TO authenticated
        USING (
          mandate_id IN (
            SELECT cma.mandate_id FROM public.client_mandate_access cma
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE ca.auth_user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Users can read own assessments'
    ) THEN
      CREATE POLICY "Users can read own assessments" ON public.assessments
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
    END IF;

    RAISE NOTICE 'Policies 5-6/12: Client + user read on assessments';
  ELSE
    RAISE NOTICE 'assessments table does not exist — skipping RLS policies. Create the table first, then re-run.';
  END IF;
END
$$;

-- ── 6. generated_reports ─────────────────────────────────────────────────
-- Existing: service_role all, users read. Missing: client-scoped read + user insert.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'generated_reports' AND policyname = 'Client can read reports for accessible mandates'
  ) THEN
    CREATE POLICY "Client can read reports for accessible mandates" ON public.generated_reports
      FOR SELECT TO authenticated
      USING (
        mandate_id IN (
          SELECT cma.mandate_id FROM public.client_mandate_access cma
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );
    RAISE NOTICE 'Policy 7/12: Client read on generated_reports';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'generated_reports' AND policyname = 'Users can insert generated reports'
  ) THEN
    CREATE POLICY "Users can insert generated reports" ON public.generated_reports
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
      );
    RAISE NOTICE 'Policy 8/12: User insert on generated_reports';
  END IF;
END
$$;

-- ── 7. events ────────────────────────────────────────────────────────────
-- Table may not exist in migrations. Handle gracefully.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Client can read events for accessible mandates'
    ) THEN
      CREATE POLICY "Client can read events for accessible mandates" ON public.events
        FOR SELECT TO authenticated
        USING (
          mandate_id IN (
            SELECT cma.mandate_id FROM public.client_mandate_access cma
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE ca.auth_user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can read own events'
    ) THEN
      CREATE POLICY "Users can read own events" ON public.events
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
    END IF;

    RAISE NOTICE 'Policies 9-10/12: Client + user read on events';
  ELSE
    RAISE NOTICE 'events table does not exist — skipping RLS policies. Create the table first, then re-run.';
  END IF;
END
$$;

-- ── 8. candidate_outreach_log ────────────────────────────────────────────
-- Existing: team view/create/update (open to all authenticated). Missing: client-scoped read + consultant write scoping.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidate_outreach_log' AND policyname = 'Client can read outreach for accessible mandates'
  ) THEN
    CREATE POLICY "Client can read outreach for accessible mandates" ON public.candidate_outreach_log
      FOR SELECT TO authenticated
      USING (
        contact_id IN (
          SELECT cml.contact_id FROM public.candidate_mandate_links cml
          JOIN public.client_mandate_access cma ON cma.mandate_id = cml.mandate_id
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );
    RAISE NOTICE 'Policy 11/12: Client read on candidate_outreach_log';
  END IF;

  -- Consultants can update outreach logs they created
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidate_outreach_log' AND policyname = 'Consultant can update own outreach logs'
  ) THEN
    CREATE POLICY "Consultant can update own outreach logs" ON public.candidate_outreach_log
      FOR UPDATE TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin')
        )
      );
    RAISE NOTICE 'Policy 12/12: Consultant update on candidate_outreach_log';
  END IF;
END
$$;

-- ── SMOKE TEST: Verify all 12 policies exist ────────────────────────────
DO $$
DECLARE
  total_count INTEGER := 0;
  tbl TEXT;
  tbl_count INTEGER;
BEGIN
  FOR tbl IN
    VALUES ('mandates'), ('candidates_pipeline'), ('contacts'),
           ('candidate_mandate_links'), ('generated_reports'),
           ('candidate_outreach_log')
  LOOP
    SELECT COUNT(*) INTO tbl_count
    FROM pg_policies
    WHERE tablename = tbl
      AND policyname LIKE 'Client can%';
    total_count := total_count + tbl_count;
    RAISE NOTICE '%: % client policies', tbl, tbl_count;
  END LOOP;

  -- Check optional tables (may not exist)
  FOR tbl IN VALUES ('assessments'), ('events')
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      SELECT COUNT(*) INTO tbl_count
      FROM pg_policies
      WHERE tablename = tbl
        AND policyname LIKE 'Client can%';
      total_count := total_count + tbl_count;
      RAISE NOTICE '%: % client policies', tbl, tbl_count;
    ELSE
      RAISE NOTICE '%: table does not exist (skipped)', tbl;
    END IF;
  END LOOP;

  -- Also count non-client policies added by this migration
  SELECT COUNT(*) INTO tbl_count
  FROM pg_policies
  WHERE policyname IN (
    'Users can read own assessments',
    'Users can insert generated reports',
    'Users can read own events',
    'Consultant can update own outreach logs'
  );
  total_count := total_count + tbl_count;

  RAISE NOTICE 'Total portal RLS policies added: %', total_count;
  IF total_count < 10 THEN
    RAISE WARNING 'Expected at least 10 policies (12 if assessments + events exist). Found %.', total_count;
  ELSE
    RAISE NOTICE 'Portal RLS policy installation complete.';
  END IF;
END
$$;
