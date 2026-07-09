-- ════════════════════════════════════════════════════════════════════════
-- 20260709_portal_rls_policies.sql
-- T1 Portal Data Wiring — Add RLS policies for client_user and candidate roles
--
-- Without these policies, the existing RLS in 20260625_create_missing_core_tables.sql
-- only allows admin/super_admin/lyc_admin/lyc_consultant to read core tables,
-- which means /client/* and /candidate/* portal queries always return 0 rows.
--
-- RLS strategy:
--   client_user  → sees only mandates they have access to (via client_mandate_access),
--                  candidates within those mandates (candidates_pipeline),
--                  documents scoped by organization_id.
--   candidate    → sees their own contact row (matched by email),
--                  candidate_mandate_links for their contact_id,
--                  their own assessments and outreach_log.
--   member       → sees their own profile, assessments, credits, career_benchmarks
--                  (already covered by existing RLS for profiles/assessments).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. MANDATES: client_user can see mandates they have access to ──
-- (Existing admin policies remain intact. We add a client_user policy.)
DROP POLICY IF EXISTS "Client users see mandates they have access to" ON public.mandates;
CREATE POLICY "Client users see mandates they have access to" ON public.mandates
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.client_mandate_access cma
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE cma.mandate_id = mandates.id
              AND ca.auth_user_id = auth.uid())
  );

-- ── 2. CANDIDATES_PIPELINE: client_user can see pipeline for their mandates ──
DROP POLICY IF EXISTS "Client users see pipeline for accessible mandates" ON public.candidates_pipeline;
CREATE POLICY "Client users see pipeline for accessible mandates" ON public.candidates_pipeline
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.client_mandate_access cma
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE cma.mandate_id = candidates_pipeline.mandate_id
              AND ca.auth_user_id = auth.uid())
  );

-- ── 3. CANDIDATES_PIPELINE: candidate role can see their own pipeline rows ──
DROP POLICY IF EXISTS "Candidates see their own pipeline rows" ON public.candidates_pipeline;
CREATE POLICY "Candidates see their own pipeline rows" ON public.candidates_pipeline
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.contacts c
            WHERE c.id = candidates_pipeline.contact_id
              AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ── 4. CONTACTS: candidate role can read their own row ──
DROP POLICY IF EXISTS "Candidates read own contact row" ON public.contacts;
CREATE POLICY "Candidates read own contact row" ON public.contacts
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ── 5. CONTACTS: client_user can see contacts linked to their mandate pipeline ──
DROP POLICY IF EXISTS "Client users see pipeline candidates" ON public.contacts;
CREATE POLICY "Client users see pipeline candidates" ON public.contacts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.candidates_pipeline cp
            JOIN public.client_mandate_access cma ON cma.mandate_id = cp.mandate_id
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE cp.contact_id = contacts.id
              AND ca.auth_user_id = auth.uid())
  );

-- ── 6. CANDIDATE_MANDATE_LINKS: candidate role reads their own links ──
DROP POLICY IF EXISTS "Candidates read own mandate links" ON public.candidate_mandate_links;
CREATE POLICY "Candidates read own mandate links" ON public.candidate_mandate_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.contacts c
            WHERE c.id = candidate_mandate_links.contact_id
              AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ── 7. CANDIDATE_MANDATE_LINKS: client_user reads links for accessible mandates ──
DROP POLICY IF EXISTS "Client users see mandate links" ON public.candidate_mandate_links;
CREATE POLICY "Client users see mandate links" ON public.candidate_mandate_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.client_mandate_access cma
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE cma.mandate_id = candidate_mandate_links.mandate_id
              AND ca.auth_user_id = auth.uid())
  );

-- ── 8. ASSESSMENTS: candidate role reads their own assessments ──
-- Check if table exists first; assessments table is created elsewhere
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
    -- Drop existing duplicate policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS "Candidates read own assessments" ON public.assessments';
    EXECUTE 'CREATE POLICY "Candidates read own assessments" ON public.assessments
      FOR SELECT TO authenticated
      USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
      )';
  END IF;
END$$;

-- ── 9. GENERATED_REPORTS: client_user reads reports for accessible mandates ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'generated_reports') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Client users see reports for accessible mandates" ON public.generated_reports';
    EXECUTE 'CREATE POLICY "Client users see reports for accessible mandates" ON public.generated_reports
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.client_mandate_access cma
                JOIN public.client_accounts ca ON ca.id = cma.client_account_id
                WHERE cma.mandate_id = generated_reports.mandate_id
                  AND ca.auth_user_id = auth.uid())
      )';
  END IF;
END$$;

-- ── 10. EVENTS: client_user reads events for accessible mandates ──
DROP POLICY IF EXISTS "Client users see mandate events" ON public.events;
CREATE POLICY "Client users see mandate events" ON public.events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.client_mandate_access cma
            JOIN public.client_accounts ca ON ca.id = cma.client_account_id
            WHERE cma.mandate_id = events.mandate_id
              AND ca.auth_user_id = auth.uid())
  );

-- ── 11. EVENTS: candidate reads events where they are the contact ──
DROP POLICY IF EXISTS "Candidates see their own events" ON public.events;
CREATE POLICY "Candidates see their own events" ON public.events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.contacts c
            WHERE c.id = events.contact_id
              AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ── 12. CANDIDATE_OUTREACH_LOG: candidate reads own log ──
DROP POLICY IF EXISTS "Candidates read own outreach log" ON public.candidate_outreach_log;
CREATE POLICY "Candidates read own outreach log" ON public.candidate_outreach_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.contacts c
            WHERE c.id = candidate_outreach_log.contact_id
              AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ════════════════════════════════════════════════════════════════════════
-- SMOKE TEST
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify policies exist
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('mandates', 'candidates_pipeline', 'contacts', 'candidate_mandate_links', 'events', 'candidate_outreach_log')
    AND policyname LIKE '%client%' OR policyname LIKE '%Candidate%';

  IF v_count < 8 THEN
    RAISE WARNING 'Expected at least 8 portal RLS policies, found %', v_count;
  ELSE
    RAISE NOTICE '✅ Portal RLS policies created (found % policies)', v_count;
  END IF;
END$$;
