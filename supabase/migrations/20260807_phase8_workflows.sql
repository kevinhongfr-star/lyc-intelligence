-- ════════════════════════════════════════════════════════════════════
-- Phase 8 — B2B Client Portal Backend Integration
-- Migration: 20260807_phase8_workflows.sql
--
-- Creates tables required by 3 dispatch modules:
--   client-portal   (clientPortalHandler.ts)   — extends existing portal tables
--   client-workflow (clientWorkflowEngine.ts)  — workflow + approval tables
--   client-engagement (clientEngagementHandler.ts) — NPS, surveys, feedback, metrics
--
-- Existing tables (20260629_client_portal.sql) are NOT modified:
--   client_accounts, client_mandate_access, client_feedback, client_notifications
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Client Workflows ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  trigger_type    TEXT NOT NULL DEFAULT 'manual',
  status          TEXT NOT NULL DEFAULT 'draft',
  nodes           JSONB NOT NULL DEFAULT '[]',
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_client_workflows_account ON public.client_workflows(client_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_workflows_status  ON public.client_workflows(status) WHERE status = 'active';

ALTER TABLE public.client_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own workflows"
  ON public.client_workflows FOR SELECT
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can insert own workflows"
  ON public.client_workflows FOR INSERT
  WITH CHECK (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can update own workflows"
  ON public.client_workflows FOR UPDATE
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

-- ── 2. Client Approvals ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at      TIMESTAMPTZ,
  workflow_id     UUID REFERENCES public.client_workflows(id) ON DELETE CASCADE,
  node_id         TEXT,
  approver_id     UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  requester_name  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  decision        TEXT,
  comments        TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_approvals_approver ON public.client_approvals(approver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_approvals_status   ON public.client_approvals(status) WHERE status = 'pending';

ALTER TABLE public.client_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own approvals"
  ON public.client_approvals FOR SELECT
  USING (approver_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can update own approvals"
  ON public.client_approvals FOR UPDATE
  USING (approver_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

-- ── 3. Client NPS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_nps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  score           INTEGER NOT NULL,
  category        TEXT NOT NULL,
  comment         TEXT,
  context         TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_nps_account ON public.client_nps(client_account_id, created_at DESC);

ALTER TABLE public.client_nps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own NPS"
  ON public.client_nps FOR SELECT
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can insert own NPS"
  ON public.client_nps FOR INSERT
  WITH CHECK (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

-- ── 4. Surveys ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.surveys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  title           TEXT NOT NULL,
  description     TEXT,
  questions       JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status) WHERE status = 'active';

-- ── 5. Survey Submissions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.survey_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  survey_id       UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  responses       JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_survey_submissions_account ON public.survey_submissions(client_account_id, submitted_at DESC);

ALTER TABLE public.survey_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own survey submissions"
  ON public.survey_submissions FOR SELECT
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can insert own survey submissions"
  ON public.survey_submissions FOR INSERT
  WITH CHECK (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

-- ── 6. Client Feedback Submissions ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_feedback_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  subject         TEXT,
  message         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cfs_account ON public.client_feedback_submissions(client_account_id, created_at DESC);

ALTER TABLE public.client_feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own feedback submissions"
  ON public.client_feedback_submissions FOR SELECT
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can insert own feedback submissions"
  ON public.client_feedback_submissions FOR INSERT
  WITH CHECK (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

-- ── 7. Client Check-ins ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_check_ins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'requested',
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_checkins_account ON public.client_check_ins(client_account_id, created_at DESC);

ALTER TABLE public.client_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own check-ins"
  ON public.client_check_ins FOR SELECT
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Client can insert own check-ins"
  ON public.client_check_ins FOR INSERT
  WITH CHECK (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));

-- ── 8. Login Events (for engagement metrics) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.login_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id         UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_events_user ON public.login_events(user_id, created_at DESC);

-- ── 9. Document Views (for engagement metrics) ───────────────────────

CREATE TABLE IF NOT EXISTS public.document_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  document_id     UUID,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_views_account ON public.document_views(client_account_id, viewed_at DESC);

ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can read own document views"
  ON public.document_views FOR SELECT
  USING (client_account_id IN (
    SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()
  ));
