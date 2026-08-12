-- ============================================================
--  PHASE 16 RLS POLICIES — LYC Intelligence Supabase seed
--
--  Run this via: Supabase SQL Editor OR `psql $DATABASE_URL < rls.sql`
--  Coverage: every table referenced in the src codebase.
--  Enforces: role classification (admin/consultant/client/leader/candidate)
--             + organization_id scoping where applicable.
--
--  Role taxonomy (mirrors services/portalClassification.ts):
--    admin | lyc_admin | super_admin
--    consultant | lyc_consultant
--    client_admin | client_viewer | client
--    member | leader | candidate | (NULL ⇒ leader default)
-- ============================================================

-- 1. Ensure pgcrypto + helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Role taxonomy helper (Postgres function)
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS text AS $$
DECLARE
  r text;
BEGIN
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'role', ''),
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  ) INTO r;
  RETURN COALESCE(r, 'leader');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.current_user_org() RETURNS uuid AS $$
DECLARE
  o uuid;
BEGIN
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() INTO o;
  RETURN o;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_role(r text) RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(r, '') IN ('admin','lyc_admin','super_admin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.is_consultant_role(r text) RETURNS boolean AS $$
BEGIN
  -- Includes admins for backward compat (many tables grant blanket staff access).
  -- Per-user scoping for mandates/contacts uses is_scoped_consultant() instead.
  RETURN COALESCE(r, '') IN ('consultant','lyc_consultant','team_lead','admin','lyc_admin','super_admin');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Scoped consultant: internal staff who are NOT admins. These users see only
-- their own mandates (lead_consultant_id) and contacts (owner_id).
-- Ticket #1306, #1307 — Phase 3 consultant RLS scoping.
CREATE OR REPLACE FUNCTION public.is_scoped_consultant(r text) RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(r, '') IN ('consultant','lyc_consultant','team_lead');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.is_client_role(r text) RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(r, '') IN ('client','client_admin','client_viewer');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
--  TABLE: profiles (identity + role + org)
-- ============================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles can READ their own row; consultants+ read profiles within org; admins read all
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      is_admin_role(current_user_role())
      OR id = auth.uid()
      OR (is_consultant_role(current_user_role()))
      OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
    )
  );

-- Profiles can UPDATE their own row only; admins full
-- NOTE: privileged columns (role, tier, organization_id, subtype,
-- miles_balance, billing/advisory fields) are protected by a
-- BEFORE INSERT/UPDATE trigger — see
-- supabase/migrations/20260812_role_escalation_prevention.sql
-- (Ticket #1308 — Phase 3 role escalation prevention).
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (
    is_admin_role(current_user_role()) OR id = auth.uid()
  );

-- INSERT: self-register (matches profiles.id = auth.uid()) — signup flow
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
    OR is_admin_role(current_user_role())
  );

-- DELETE: admins only
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE USING (is_admin_role(current_user_role()));

-- ============================================================
--  TABLE: credits / credit_transactions
-- ============================================================
ALTER TABLE IF EXISTS public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credits_select ON public.credits;
CREATE POLICY credits_select ON public.credits FOR SELECT USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS credits_insert ON public.credits;
CREATE POLICY credits_insert ON public.credits FOR INSERT WITH CHECK (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS credits_update ON public.credits;
CREATE POLICY credits_update ON public.credits FOR UPDATE USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);

DROP POLICY IF EXISTS credit_tx_select ON public.credit_transactions;
CREATE POLICY credit_tx_select ON public.credit_transactions FOR SELECT USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS credit_tx_insert ON public.credit_transactions;
CREATE POLICY credit_tx_insert ON public.credit_transactions FOR INSERT WITH CHECK (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);

-- ============================================================
--  TABLE: organizations (client B2B org context)
-- ============================================================
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orgs_read ON public.organizations;
CREATE POLICY orgs_read ON public.organizations FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND id = current_user_org())
);
DROP POLICY IF EXISTS orgs_write ON public.organizations;
CREATE POLICY orgs_write ON public.organizations FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

-- ============================================================
--  TABLE: mandates + mandate_timelines (consultant work)
-- ============================================================
ALTER TABLE IF EXISTS public.mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mandate_timelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mandates_read ON public.mandates;
CREATE POLICY mandates_read ON public.mandates FOR SELECT USING (
  is_admin_role(current_user_role())
  OR (is_scoped_consultant(current_user_role()) AND lead_consultant_id = auth.uid())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS mandates_write ON public.mandates;
CREATE POLICY mandates_write ON public.mandates FOR ALL USING (
  is_admin_role(current_user_role())
  OR (is_scoped_consultant(current_user_role()) AND lead_consultant_id = auth.uid())
);

-- mandate_timelines mirrors mandates' scoping via join to mandates
DROP POLICY IF EXISTS mandate_tl_read ON public.mandate_timelines;
CREATE POLICY mandate_tl_read ON public.mandate_timelines FOR SELECT USING (
  is_admin_role(current_user_role())
  OR (is_scoped_consultant(current_user_role()) AND EXISTS (
    SELECT 1 FROM public.mandates m
    WHERE m.id = mandate_timelines.mandate_id AND m.lead_consultant_id = auth.uid()
  ))
  OR (
    is_client_role(current_user_role())
    AND EXISTS (
      SELECT 1 FROM public.mandates m
      WHERE m.id = mandate_timelines.mandate_id AND m.organization_id = current_user_org()
    )
  )
);
DROP POLICY IF EXISTS mandate_tl_write ON public.mandate_timelines;
CREATE POLICY mandate_tl_write ON public.mandate_timelines FOR ALL USING (
  is_admin_role(current_user_role())
  OR (is_scoped_consultant(current_user_role()) AND EXISTS (
    SELECT 1 FROM public.mandates m
    WHERE m.id = mandate_timelines.mandate_id AND m.lead_consultant_id = auth.uid()
  ))
);

-- ============================================================
--  TABLE: candidates / contacts (TRIDENT + Saved Searches)
-- ============================================================
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_read ON public.contacts;
CREATE POLICY contacts_read ON public.contacts FOR SELECT USING (
  is_admin_role(current_user_role())
  OR (is_scoped_consultant(current_user_role()) AND owner_id = auth.uid())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
  OR id::text = auth.uid()::text   -- candidate reading their own contact
);
DROP POLICY IF EXISTS contacts_write ON public.contacts;
CREATE POLICY contacts_write ON public.contacts FOR ALL USING (
  is_admin_role(current_user_role())
  OR (is_scoped_consultant(current_user_role()) AND owner_id = auth.uid())
);

-- ============================================================
--  TABLE: documents
-- ============================================================
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS docs_read ON public.documents;
CREATE POLICY docs_read ON public.documents FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS docs_write ON public.documents;
CREATE POLICY docs_write ON public.documents FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);

-- ============================================================

-- ============================================================
--  TABLE CREATION: assessment_results (P0 fix 2026-08-11)
-- ============================================================
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

--  TABLE: assessment_results (private per user)
-- ============================================================
ALTER TABLE IF EXISTS public.assessment_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_results_self ON public.assessment_results;
CREATE POLICY assessment_results_self ON public.assessment_results FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR user_id = auth.uid()
);
DROP POLICY IF EXISTS assessment_results_write ON public.assessment_results;
CREATE POLICY assessment_results_write ON public.assessment_results FOR ALL USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);

-- ============================================================
--  TABLE: memories / chat_sessions / chat_messages (NEXUS)
-- ============================================================
ALTER TABLE IF EXISTS public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memories_self ON public.memories;
CREATE POLICY memories_self ON public.memories FOR ALL USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS chat_sessions_self ON public.chat_sessions;
CREATE POLICY chat_sessions_self ON public.chat_sessions FOR ALL USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS chat_messages_self ON public.chat_messages;
CREATE POLICY chat_messages_self ON public.chat_messages FOR SELECT USING (
  is_admin_role(current_user_role())
  OR EXISTS (
    SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS chat_messages_insert_self ON public.chat_messages;
CREATE POLICY chat_messages_insert_self ON public.chat_messages FOR INSERT WITH CHECK (
  is_admin_role(current_user_role())
  OR EXISTS (
    SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()
  )
);

-- ============================================================
--  TABLE: saved_searches / talent_alerts / search_executions
-- ============================================================
ALTER TABLE IF EXISTS public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.talent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.search_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_searches_self_org ON public.saved_searches;
CREATE POLICY saved_searches_self_org ON public.saved_searches FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS talent_alerts_self ON public.talent_alerts;
CREATE POLICY talent_alerts_self ON public.talent_alerts FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS search_executions_self ON public.search_executions;
CREATE POLICY search_executions_self ON public.search_executions FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS search_executions_insert ON public.search_executions;
CREATE POLICY search_executions_insert ON public.search_executions FOR INSERT WITH CHECK (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);

-- ============================================================
--  TABLE: approval_* workflow tables
-- ============================================================
ALTER TABLE IF EXISTS public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_step_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_wf ON public.approval_workflows;
CREATE POLICY approval_wf ON public.approval_workflows FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS approval_req ON public.approval_requests;
CREATE POLICY approval_req ON public.approval_requests FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
  OR requester_id = auth.uid()
  OR approver_id = auth.uid()
);
DROP POLICY IF EXISTS approval_req_write ON public.approval_requests;
CREATE POLICY approval_req_write ON public.approval_requests FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR requester_id = auth.uid()
  OR approver_id = auth.uid()
);
DROP POLICY IF EXISTS approval_step_records_read ON public.approval_step_records;
CREATE POLICY approval_step_records_read ON public.approval_step_records FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR EXISTS (
    SELECT 1 FROM public.approval_requests r
    WHERE r.id = approval_step_records.request_id
      AND (r.organization_id = current_user_org() OR r.requester_id = auth.uid() OR r.approver_id = auth.uid())
  )
);
DROP POLICY IF EXISTS approval_step_records_write ON public.approval_step_records;
CREATE POLICY approval_step_records_write ON public.approval_step_records FOR INSERT WITH CHECK (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR actor_id = auth.uid()
);
DROP POLICY IF EXISTS approval_del ON public.approval_delegations;
CREATE POLICY approval_del ON public.approval_delegations FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR delegator_id = auth.uid() OR delegatee_id = auth.uid()
);
DROP POLICY IF EXISTS approval_audit_log_read ON public.approval_audit_log;
CREATE POLICY approval_audit_log_read ON public.approval_audit_log FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS approval_audit_log_insert ON public.approval_audit_log;
CREATE POLICY approval_audit_log_insert ON public.approval_audit_log FOR INSERT WITH CHECK (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

-- ============================================================
--  TABLE: audit_logs / notifications
-- ============================================================
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_admin ON public.audit_logs;
CREATE POLICY audit_logs_admin ON public.audit_logs FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR user_id = auth.uid()
);
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR user_id = auth.uid()
);

ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_self ON public.notifications;
CREATE POLICY notifications_self ON public.notifications FOR ALL USING (
  is_admin_role(current_user_role())
  OR user_id = auth.uid()
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);

-- ============================================================
--  TABLE: nexus_event_outbox / nexus_event_log / nexus_sync_state
-- ============================================================
ALTER TABLE IF EXISTS public.nexus_event_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nexus_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nexus_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nexus_outbox_self ON public.nexus_event_outbox;
CREATE POLICY nexus_outbox_self ON public.nexus_event_outbox FOR ALL USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS nexus_event_log_self ON public.nexus_event_log;
CREATE POLICY nexus_event_log_self ON public.nexus_event_log FOR SELECT USING (
  is_admin_role(current_user_role()) OR user_id = auth.uid()
);
DROP POLICY IF EXISTS nexus_sync_state_self ON public.nexus_sync_state;
CREATE POLICY nexus_sync_state_self ON public.nexus_sync_state FOR ALL USING (
  is_admin_role(current_user_role())
);

-- ============================================================
--  TABLE: bd_opportunities / bd_proposals / bd_activities
-- ============================================================
ALTER TABLE IF EXISTS public.bd_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bd_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bd_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bd_read ON public.bd_opportunities;
CREATE POLICY bd_read ON public.bd_opportunities FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS bd_write ON public.bd_opportunities;
CREATE POLICY bd_write ON public.bd_opportunities FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
);

DROP POLICY IF EXISTS bd_proposals_org ON public.bd_proposals;
CREATE POLICY bd_proposals_org ON public.bd_proposals FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS bd_proposals_write ON public.bd_proposals;
CREATE POLICY bd_proposals_write ON public.bd_proposals FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

DROP POLICY IF EXISTS bd_activities_read ON public.bd_activities;
CREATE POLICY bd_activities_read ON public.bd_activities FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS bd_activities_insert ON public.bd_activities;
CREATE POLICY bd_activities_insert ON public.bd_activities FOR INSERT WITH CHECK (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);

-- ============================================================
--  TABLE: alumni + alumni_engagements + alumni_referrals
--         + guarantee_periods
-- ============================================================
ALTER TABLE IF EXISTS public.alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guarantee_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alumni_org ON public.alumni;
CREATE POLICY alumni_org ON public.alumni FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND org_id = current_user_org())
  OR contact_id::text = auth.uid()::text
);
DROP POLICY IF EXISTS alumni_write ON public.alumni;
CREATE POLICY alumni_write ON public.alumni FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

DROP POLICY IF EXISTS alumni_engagements_org ON public.alumni_engagements;
CREATE POLICY alumni_engagements_org ON public.alumni_engagements FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR EXISTS (
    SELECT 1 FROM public.alumni a WHERE a.id = alumni_engagements.alumnus_id AND a.org_id = current_user_org()
  )
);
DROP POLICY IF EXISTS alumni_engagements_write ON public.alumni_engagements;
CREATE POLICY alumni_engagements_write ON public.alumni_engagements FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

DROP POLICY IF EXISTS alumni_referrals_org ON public.alumni_referrals;
CREATE POLICY alumni_referrals_org ON public.alumni_referrals FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND org_id = current_user_org())
  OR referrer_id::text = auth.uid()::text
);
DROP POLICY IF EXISTS alumni_referrals_write ON public.alumni_referrals;
CREATE POLICY alumni_referrals_write ON public.alumni_referrals FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR referrer_id::text = auth.uid()::text
);

DROP POLICY IF EXISTS guarantee_periods_org ON public.guarantee_periods;
CREATE POLICY guarantee_periods_org ON public.guarantee_periods FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND org_id = current_user_org())
);
DROP POLICY IF EXISTS guarantee_periods_write ON public.guarantee_periods;
CREATE POLICY guarantee_periods_write ON public.guarantee_periods FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

-- ============================================================
--  TABLE: scoring_runs / benchmark_runs
-- ============================================================
ALTER TABLE IF EXISTS public.scoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.benchmark_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scoring_runs_scope ON public.scoring_runs;
CREATE POLICY scoring_runs_scope ON public.scoring_runs FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
  OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS scoring_runs_write ON public.scoring_runs;
CREATE POLICY scoring_runs_write ON public.scoring_runs FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS benchmark_runs_scope ON public.benchmark_runs;
CREATE POLICY benchmark_runs_scope ON public.benchmark_runs FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS benchmark_runs_write ON public.benchmark_runs;
CREATE POLICY benchmark_runs_write ON public.benchmark_runs FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

-- ============================================================
--  TABLE: sla_configurations / sla_escalations / sla_performance_history
-- ============================================================
ALTER TABLE IF EXISTS public.sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sla_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sla_performance_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sla_conf_scope ON public.sla_configurations;
CREATE POLICY sla_conf_scope ON public.sla_configurations FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS sla_conf_write ON public.sla_configurations;
CREATE POLICY sla_conf_write ON public.sla_configurations FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

DROP POLICY IF EXISTS sla_escalations_scope ON public.sla_escalations;
CREATE POLICY sla_escalations_scope ON public.sla_escalations FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);
DROP POLICY IF EXISTS sla_escalations_write ON public.sla_escalations;
CREATE POLICY sla_escalations_write ON public.sla_escalations FOR ALL USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

DROP POLICY IF EXISTS sla_perf_scope ON public.sla_performance_history;
CREATE POLICY sla_perf_scope ON public.sla_performance_history FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
);

-- ============================================================
--  TABLE: data_residency_tags / data_consents / cross_border_transfers
-- ============================================================
ALTER TABLE IF EXISTS public.data_residency_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cross_border_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drt_scope ON public.data_residency_tags;
CREATE POLICY drt_scope ON public.data_residency_tags FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND org_id = current_user_org())
  OR subject_id = auth.uid()
);

DROP POLICY IF EXISTS consents_scope ON public.data_consents;
CREATE POLICY consents_scope ON public.data_consents FOR SELECT USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR (is_client_role(current_user_role()) AND organization_id = current_user_org())
  OR subject_id = auth.uid()
);
DROP POLICY IF EXISTS consents_write ON public.data_consents;
CREATE POLICY consents_write ON public.data_consents FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR subject_id = auth.uid()
);

DROP POLICY IF EXISTS cbt_admin ON public.cross_border_transfers;
CREATE POLICY cbt_admin ON public.cross_border_transfers FOR SELECT USING (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);
DROP POLICY IF EXISTS cbt_insert ON public.cross_border_transfers;
CREATE POLICY cbt_insert ON public.cross_border_transfers FOR INSERT WITH CHECK (
  is_admin_role(current_user_role()) OR is_consultant_role(current_user_role())
);

-- ============================================================
--  TABLE: automation_rules
-- ============================================================
ALTER TABLE IF EXISTS public.automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS automation_rules_scope ON public.automation_rules;
CREATE POLICY automation_rules_scope ON public.automation_rules FOR ALL USING (
  is_admin_role(current_user_role())
  OR is_consultant_role(current_user_role())
  OR owner_id = auth.uid()
);

-- ============================================================
--  CANDIDATE -> LEADER identity migration helper
-- ============================================================
-- This function is idempotent: given (candidate_id, new_role='leader' | 'member',
-- optional new_org_id) it promotes a candidate contact row into a leader profile,
-- preserving assessments + documents, and writes an audit row.
CREATE OR REPLACE FUNCTION public.promote_candidate_to_leader(
  _user_id uuid,
  _new_role text DEFAULT 'leader',
  _new_org_id uuid DEFAULT NULL,
  _consent_given boolean DEFAULT false
) RETURNS jsonb AS $$
DECLARE
  res jsonb;
BEGIN
  IF NOT _consent_given THEN
    RAISE EXCEPTION 'Candidate identity migration requires explicit consent';
  END IF;

  UPDATE public.profiles
  SET role = _new_role,
      organization_id = COALESCE(_new_org_id, organization_id),
      subtype = COALESCE(subtype, 'promoted_from_candidate'),
      updated_at = now()
  WHERE id = _user_id
  RETURNING jsonb_build_object('id', id, 'role', role, 'organization_id', organization_id) INTO res;

  INSERT INTO public.audit_logs(user_id, action, entity_type, entity_id, extra, created_at)
  VALUES (_user_id, 'candidate.promoted_to_leader', 'profile', _user_id::text,
          jsonb_build_object('new_role', _new_role, 'new_org_id', _new_org_id, 'consent', true),
          now());

  RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.promote_candidate_to_leader IS
'Candidate → Leader identity migration (PHASE 16). Requires explicit consent flag. Writes audit trail. SECURITY DEFINER so consent enforcement is always enforced.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2 Amendments / Ticket #1334 + #1337 — Assessment metadata + shares
-- ═══════════════════════════════════════════════════════════════════════════

-- assessments catalog: public read on published, admin-only write
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessments_read ON public.assessments;
CREATE POLICY assessments_read ON public.assessments FOR SELECT USING (
  is_published = true
  OR is_admin_role(current_user_role())
);
DROP POLICY IF EXISTS assessments_write ON public.assessments;
CREATE POLICY assessments_write ON public.assessments FOR ALL USING (
  is_admin_role(current_user_role())
);

-- user_assessment_progress: user-scoped (user_id = auth.uid())
ALTER TABLE public.user_assessment_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS uap_read ON public.user_assessment_progress;
CREATE POLICY uap_read ON public.user_assessment_progress FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin_role(current_user_role())
);
DROP POLICY IF EXISTS uap_insert ON public.user_assessment_progress;
CREATE POLICY uap_insert ON public.user_assessment_progress FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
DROP POLICY IF EXISTS uap_update ON public.user_assessment_progress;
CREATE POLICY uap_update ON public.user_assessment_progress FOR UPDATE USING (
  user_id = auth.uid()
);
DROP POLICY IF EXISTS uap_delete ON public.user_assessment_progress;
CREATE POLICY uap_delete ON public.user_assessment_progress FOR DELETE USING (
  user_id = auth.uid()
  OR is_admin_role(current_user_role())
);

-- assessment_shares: owner CRUD + public read by token (capability URL)
ALTER TABLE public.assessment_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shares_owner_all ON public.assessment_shares;
CREATE POLICY shares_owner_all ON public.assessment_shares FOR ALL USING (
  owner_id = auth.uid()
  OR is_admin_role(current_user_role())
);
-- Public read: the share_token IS the auth (capability URL pattern).
-- RLS allows SELECT on active (non-revoked, non-expired) shares.
-- The API layer validates the token matches the request.
DROP POLICY IF EXISTS shares_public_read ON public.assessment_shares;
CREATE POLICY shares_public_read ON public.assessment_shares FOR SELECT USING (
  revoked_at IS NULL
  AND expires_at > now()
  AND (max_views IS NULL OR view_count < max_views)
);
