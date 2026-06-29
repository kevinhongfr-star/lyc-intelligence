-- ════════════════════════════════════════════════════════════════════════
-- 20260629_client_portal.sql
-- DEX AI Client Visibility Portal — T5 Schema Migration
-- Implements: Spec 05 (DEX-BS-005) + Technical Blueprint 05 (DEX-TB-005)
-- Client accounts, mandate access, structured feedback, Kevin oversight
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CLIENT ACCOUNTS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  email                 TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  organization          TEXT NOT NULL,
  title                 TEXT,
  auth_user_id          UUID REFERENCES auth.users(id),
  role                  TEXT NOT NULL DEFAULT 'client_user' CHECK (role IN ('client_user', 'client_admin')),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  access_expires        TIMESTAMPTZ,
  last_login_at         TIMESTAMPTZ,
  notify_email          BOOLEAN NOT NULL DEFAULT TRUE,
  notify_in_app         BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_email ON public.client_accounts (email);
CREATE INDEX IF NOT EXISTS idx_client_accounts_org ON public.client_accounts (organization);
CREATE INDEX IF NOT EXISTS idx_client_accounts_auth ON public.client_accounts (auth_user_id);

ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client account read — self only" ON public.client_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin full access on client accounts" ON public.client_accounts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 2. CLIENT MANDATE ACCESS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_mandate_access (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id     UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id            UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  access_level          TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'feedback')),
  archive_until         TIMESTAMPTZ,
  UNIQUE(client_account_id, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_cma_client ON public.client_mandate_access (client_account_id);
CREATE INDEX IF NOT EXISTS idx_cma_mandate ON public.client_mandate_access (mandate_id);

ALTER TABLE public.client_mandate_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client mandate access — self or admin" ON public.client_mandate_access
  FOR SELECT TO authenticated
  USING (
    client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. CLIENT FEEDBACK TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id     UUID NOT NULL REFERENCES public.client_accounts(id),
  mandate_id            UUID NOT NULL REFERENCES public.mandates(id),
  contact_id            UUID NOT NULL REFERENCES public.contacts(id),
  feedback_type         TEXT NOT NULL CHECK (feedback_type IN ('interested', 'not_interested', 'need_more_info', 'hold')),
  reason                TEXT,
  additional_info       TEXT,
  status                TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'actioned', 'closed')),
  processed_by          UUID REFERENCES auth.users(id),
  processed_at          TIMESTAMPTZ,
  consultant_note       TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cf_mandate ON public.client_feedback (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cf_contact ON public.client_feedback (contact_id);
CREATE INDEX IF NOT EXISTS idx_cf_status ON public.client_feedback (status) WHERE status = 'new';
CREATE INDEX IF NOT EXISTS idx_cf_client ON public.client_feedback (client_account_id, created_at DESC);

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client feedback read — self or admin or consultant" ON public.client_feedback
  FOR SELECT TO authenticated
  USING (
    client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR EXISTS (SELECT 1 FROM public.mandates WHERE id = mandate_id AND lead_consultant_id = auth.uid())
  );

CREATE POLICY "Client can create feedback" ON public.client_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    AND mandate_id IN (
      SELECT mandate_id FROM public.client_mandate_access
      WHERE client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can update feedback" ON public.client_feedback
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR EXISTS (SELECT 1 FROM public.mandates WHERE id = mandate_id AND lead_consultant_id = auth.uid())
  );

-- ── 4. MANDATES TABLE EXTENSIONS ───────────────────────────────────────
ALTER TABLE IF EXISTS public.mandates
  ADD COLUMN IF NOT EXISTS client_visible BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.mandates
  ADD COLUMN IF NOT EXISTS client_summary TEXT;

ALTER TABLE IF EXISTS public.mandates
  ADD COLUMN IF NOT EXISTS target_close_date DATE;

-- ── 5. CONTACTS TABLE EXTENSIONS ───────────────────────────────────────
ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS client_presented BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS client_presented_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS client_presented_by UUID REFERENCES auth.users(id);

-- ── 6. NOTIFICATIONS TABLE (client-facing) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id     UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id            UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  contact_id            UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type                  TEXT NOT NULL CHECK (type IN ('new_candidate', 'interview_scheduled', 'grid_report', 'status_change')),
  title                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  read                  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cn_client ON public.client_notifications (client_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cn_unread ON public.client_notifications (client_account_id) WHERE read = FALSE;

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client notifications read — self only" ON public.client_notifications
  FOR SELECT TO authenticated
  USING (client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()));

CREATE POLICY "Client can mark notification as read" ON public.client_notifications
  FOR UPDATE TO authenticated
  USING (client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()))
  WITH CHECK (client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can create client notifications" ON public.client_notifications
  FOR INSERT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
