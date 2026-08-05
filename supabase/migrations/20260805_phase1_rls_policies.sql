-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.1 — Role-based RLS policies (P0 security lockdown)
-- Tickets: 1.1.18 – 1.1.24 (+ template applied to all public tables)
-- Issue: #3 (P0 security blocker)
--
-- Depends on: 20260805_phase1_user_roles_and_helpers.sql (provides
--             fn_is_admin / fn_is_consultant / fn_is_internal_user)
--             20260805_phase1_revoke_public.sql (removes anon + qual='true')
--
-- Policy model (per specs/v2/02_Supabase_Backend_Architecture.md §2.3):
--   • Internal data (contacts, mandates, pipeline, etc.)
--       SELECT  → fn_is_internal_user()
--       INSERT/UPDATE → fn_is_consultant()
--       DELETE        → fn_is_admin()
--   • Self-scope data (profiles, notifications, credits, memories)
--       user reads/writes rows WHERE user_id = auth.uid()
--       admins read all
--   • Client-scoped data (client_mandate_access, client_feedback)
--       client sees own rows; internal sees all
--   • Audit/log tables
--       INSERT (authenticated) + admin SELECT
--
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ──────────────────────────────────────────────────────────────────────────

-- Helper: grant table privileges to authenticated (anon already revoked).
-- Authenticated users can attempt queries; RLS is the real gate.
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.tablename);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.1.18 / 1.1.19  profiles — self + admin
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.fn_is_admin());

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (id = auth.uid() OR public.fn_is_admin());

DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.fn_is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.1.20 – 1.1.22  contacts — internal SELECT, consultant write, admin delete
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "contacts_internal_select" ON public.contacts;
CREATE POLICY "contacts_internal_select"
  ON public.contacts FOR SELECT TO authenticated
  USING (public.fn_is_internal_user());

DROP POLICY IF EXISTS "contacts_authenticated_insert" ON public.contacts;
CREATE POLICY "contacts_authenticated_insert"
  ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_consultant());

DROP POLICY IF EXISTS "contacts_consultant_update" ON public.contacts;
CREATE POLICY "contacts_consultant_update"
  ON public.contacts FOR UPDATE TO authenticated
  USING (public.fn_is_consultant())
  WITH CHECK (public.fn_is_consultant());

DROP POLICY IF EXISTS "contacts_admin_delete" ON public.contacts;
CREATE POLICY "contacts_admin_delete"
  ON public.contacts FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.1.23 / 1.1.24  mandates — internal SELECT, admin write
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "mandates_internal_select" ON public.mandates;
CREATE POLICY "mandates_internal_select"
  ON public.mandates FOR SELECT TO authenticated
  USING (public.fn_is_internal_user());

DROP POLICY IF EXISTS "mandates_admin_insert" ON public.mandates;
CREATE POLICY "mandates_admin_insert"
  ON public.mandates FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_admin());

DROP POLICY IF EXISTS "mandates_admin_update" ON public.mandates;
CREATE POLICY "mandates_admin_update"
  ON public.mandates FOR UPDATE TO authenticated
  USING (public.fn_is_admin())
  WITH CHECK (public.fn_is_admin());

DROP POLICY IF EXISTS "mandates_admin_delete" ON public.mandates;
CREATE POLICY "mandates_admin_delete"
  ON public.mandates FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- candidates_pipeline / candidate_pipeline — internal SELECT, consultant write
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "candidates_pipeline_internal_select" ON public.candidates_pipeline;
CREATE POLICY "candidates_pipeline_internal_select"
  ON public.candidates_pipeline FOR SELECT TO authenticated
  USING (public.fn_is_internal_user());

DROP POLICY IF EXISTS "candidates_pipeline_consultant_write" ON public.candidates_pipeline;
CREATE POLICY "candidates_pipeline_consultant_write"
  ON public.candidates_pipeline FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_consultant());

DROP POLICY IF EXISTS "candidates_pipeline_consultant_update" ON public.candidates_pipeline;
CREATE POLICY "candidates_pipeline_consultant_update"
  ON public.candidates_pipeline FOR UPDATE TO authenticated
  USING (public.fn_is_consultant())
  WITH CHECK (public.fn_is_consultant());

DROP POLICY IF EXISTS "candidates_pipeline_admin_delete" ON public.candidates_pipeline;
CREATE POLICY "candidates_pipeline_admin_delete"
  ON public.candidates_pipeline FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- candidate_pipeline (singular, legacy alias) — same policies
DROP POLICY IF EXISTS "candidate_pipeline_internal_select" ON public.candidate_pipeline;
CREATE POLICY "candidate_pipeline_internal_select"
  ON public.candidate_pipeline FOR SELECT TO authenticated
  USING (public.fn_is_internal_user());

DROP POLICY IF EXISTS "candidate_pipeline_consultant_write" ON public.candidate_pipeline;
CREATE POLICY "candidate_pipeline_consultant_write"
  ON public.candidate_pipeline FOR ALL TO authenticated
  USING (public.fn_is_consultant())
  WITH CHECK (public.fn_is_consultant());

-- ════════════════════════════════════════════════════════════════════════
-- Self-scope tables — user owns rows by user_id (or contact_id)
-- ════════════════════════════════════════════════════════════════════════
-- Pattern applied to: notifications, notification_preferences, credits,
-- credit_transactions, memories, share_cards, saved_searches,
-- candidate_saved_insights, canvas_profiles, dex_user_profiles (if exists),
-- user_preferences (if exists), user_api_keys (if exists).

-- notifications
DROP POLICY IF EXISTS "notifications_self_select" ON public.notifications;
CREATE POLICY "notifications_self_select"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "notifications_self_insert" ON public.notifications;
CREATE POLICY "notifications_self_insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "notifications_admin_delete" ON public.notifications;
CREATE POLICY "notifications_admin_delete"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- notification_preferences
DROP POLICY IF EXISTS "notif_prefs_self_all" ON public.notification_preferences;
CREATE POLICY "notif_prefs_self_all"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- credits (per-user balance)
DROP POLICY IF EXISTS "credits_self_select" ON public.credits;
CREATE POLICY "credits_self_select"
  ON public.credits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "credits_admin_write" ON public.credits;
CREATE POLICY "credits_admin_write"
  ON public.credits FOR ALL TO authenticated
  USING (public.fn_is_admin())
  WITH CHECK (public.fn_is_admin());

-- credit_transactions (ledger — append + admin read)
DROP POLICY IF EXISTS "credit_tx_admin_select" ON public.credit_transactions;
CREATE POLICY "credit_tx_admin_select"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "credit_tx_self_insert" ON public.credit_transactions;
CREATE POLICY "credit_tx_self_insert"
  ON public.credit_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- memories
DROP POLICY IF EXISTS "memories_self_all" ON public.memories;
CREATE POLICY "memories_self_all"
  ON public.memories FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- share_cards
DROP POLICY IF EXISTS "share_cards_self_all" ON public.share_cards;
CREATE POLICY "share_cards_self_all"
  ON public.share_cards FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- saved_searches
DROP POLICY IF EXISTS "saved_searches_self_all" ON public.saved_searches;
CREATE POLICY "saved_searches_self_all"
  ON public.saved_searches FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- candidate_saved_insights
DROP POLICY IF EXISTS "cand_insights_self_all" ON public.candidate_saved_insights;
CREATE POLICY "cand_insights_self_all"
  ON public.candidate_saved_insights FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- canvas_profiles
DROP POLICY IF EXISTS "canvas_profiles_self_all" ON public.canvas_profiles;
CREATE POLICY "canvas_profiles_self_all"
  ON public.canvas_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- Client-scoped tables — client sees own rows, internal sees all
-- ════════════════════════════════════════════════════════════════════════
-- client_mandate_access: client_account_id links to the client's company.
-- A client user's profile.organization_id matches client_accounts.id.
DROP POLICY IF EXISTS "cma_select" ON public.client_mandate_access;
CREATE POLICY "cma_select"
  ON public.client_mandate_access FOR SELECT TO authenticated
  USING (
    public.fn_is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = client_mandate_access.client_account_id
    )
  );
DROP POLICY IF EXISTS "cma_admin_write" ON public.client_mandate_access;
CREATE POLICY "cma_admin_write"
  ON public.client_mandate_access FOR ALL TO authenticated
  USING (public.fn_is_admin())
  WITH CHECK (public.fn_is_admin());

-- client_feedback
DROP POLICY IF EXISTS "cf_select" ON public.client_feedback;
CREATE POLICY "cf_select"
  ON public.client_feedback FOR SELECT TO authenticated
  USING (
    public.fn_is_internal_user()
    OR client_feedback.client_user_id = auth.uid()
  );
DROP POLICY IF EXISTS "cf_insert" ON public.client_feedback;
CREATE POLICY "cf_insert"
  ON public.client_feedback FOR INSERT TO authenticated
  WITH CHECK (client_feedback.client_user_id = auth.uid() OR public.fn_is_consultant());
DROP POLICY IF EXISTS "cf_consultant_update" ON public.client_feedback;
CREATE POLICY "cf_consultant_update"
  ON public.client_feedback FOR UPDATE TO authenticated
  USING (public.fn_is_consultant())
  WITH CHECK (public.fn_is_consultant());

-- client_notifications
DROP POLICY IF EXISTS "cn_self_select" ON public.client_notifications;
CREATE POLICY "cn_self_select"
  ON public.client_notifications FOR SELECT TO authenticated
  USING (client_user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "cn_self_update" ON public.client_notifications;
CREATE POLICY "cn_self_update"
  ON public.client_notifications FOR UPDATE TO authenticated
  USING (client_user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (client_user_id = auth.uid() OR public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- Internal-only tables — apply the standard internal template via DO block.
-- SELECT: internal_user. INSERT/UPDATE: consultant. DELETE: admin.
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  internal_tables TEXT[] := ARRAY[
    'companies','clients','client_accounts','consultants',
    'candidate_mandate_links','candidate_mandate_matches','candidate_outreach_log',
    'candidate_assessment_responses','candidate_assessment_results','assessment_configs',
    'mandate_members','mandate_payment_milestones','mandate_success_profiles',
    'mandate_analytics_snapshots','pipeline_stage_history','pipeline_transitions',
    'match_history','match_runs','scoring_runs','trident_scorecards',
    'sourcing_channels','target_companies','signals','one_pagers',
    'generated_reports','import_logs','org_evaluations','org_evaluation_scores',
    'org_snapshots','org_talent_attachments','org_talent_pools','organizations',
    'org_audit_log','agent_actions','ai_generations','automation_executions',
    'alumni_placements','grid_candidate_entries','grid_companies','grid_functions',
    'grid_mappings','grid_minimum_standards','grid_reports','grid_sectors',
    'email_messages','email_notification_queue','email_sync_state','email_templates',
    'email_threads','channel_accounts','wechat_interactions','success_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY internal_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_internal_select" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_internal_select" ON public.%I FOR SELECT TO authenticated USING (public.fn_is_internal_user())',
        t, t
      );
      EXECUTE format('DROP POLICY IF EXISTS "%s_consultant_insert" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_consultant_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.fn_is_consultant())',
        t, t
      );
      EXECUTE format('DROP POLICY IF EXISTS "%s_consultant_update" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_consultant_update" ON public.%I FOR UPDATE TO authenticated USING (public.fn_is_consultant()) WITH CHECK (public.fn_is_consultant())',
        t, t
      );
      EXECUTE format('DROP POLICY IF EXISTS "%s_admin_delete" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_admin_delete" ON public.%I FOR DELETE TO authenticated USING (public.fn_is_admin())',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- Audit / permission tables — admin read, authenticated insert (audit trail)
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  audit_tables TEXT[] := ARRAY[
    'permission_audit_log','role_permissions','permission_overrides'
  ];
BEGIN
  FOREACH t IN ARRAY audit_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_admin_select" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_admin_select" ON public.%I FOR SELECT TO authenticated USING (public.fn_is_admin())',
        t, t
      );
      EXECUTE format('DROP POLICY IF EXISTS "%s_admin_write" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_admin_write" ON public.%I FOR ALL TO authenticated USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin())',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- Nexus content tables — internal read, admin write
-- (B2C users access via server-side handlers with service role, not direct)
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  nexus_tables TEXT[] := ARRAY[
    'nexus_content_library','nexus_content_chunks','nexus_content_citations',
    'nexus_proactive_suggestions'
  ];
BEGIN
  FOREACH t IN ARRAY nexus_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_internal_select" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_internal_select" ON public.%I FOR SELECT TO authenticated USING (public.fn_is_internal_user())',
        t, t
      );
      EXECUTE format('DROP POLICY IF EXISTS "%s_admin_write" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "%s_admin_write" ON public.%I FOR ALL TO authenticated USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin())',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- Catch-all: any remaining public table with NO policies gets locked to
-- admin-only. This guarantees zero unprotected tables after this migration.
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t RECORD;
  policy_count INT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = t.tablename;

    IF policy_count = 0 THEN
      EXECUTE format(
        'CREATE POLICY "%s_admin_only_fallback" ON public.%I FOR ALL TO authenticated USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin())',
        t.tablename, t.tablename
      );
    END IF;
  END LOOP;
END $$;
