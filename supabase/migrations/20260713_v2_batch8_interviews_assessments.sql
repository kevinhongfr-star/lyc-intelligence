-- ============================================================================
-- v2 Batch 8 — Interviews, Assessments, Placements, Email Templates, Integrations
-- Tickets 71-80 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 71: Interviews table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  mandate_candidate_id UUID NOT NULL REFERENCES public.v2_mandate_candidates(id) ON DELETE CASCADE,
  round INTEGER DEFAULT 1,
  interview_type TEXT CHECK (interview_type IN (
    'phone', 'video', 'in_person', 'panel', 'technical',
    'behavioral', 'culture_fit', 'case_study', 'presentation', 'final'
  )),
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled', 'no_show')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  interviewers JSONB DEFAULT '[]',
  meeting_url TEXT,
  meeting_notes TEXT,
  feedback JSONB DEFAULT '{}',
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  recommendation TEXT CHECK (recommendation IN ('hire', 'strong_hire', 'no_hire', 'hold', 'revise')),
  rejection_reason TEXT,
  next_steps TEXT,
  candidate_availability JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_interviews_org ON public.v2_interviews(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_interviews_mc ON public.v2_interviews(mandate_candidate_id);
CREATE INDEX IF NOT EXISTS idx_v2_interviews_status ON public.v2_interviews(status);
CREATE INDEX IF NOT EXISTS idx_v2_interviews_scheduled ON public.v2_interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_v2_interviews_round ON public.v2_interviews(mandate_candidate_id, round);

ALTER TABLE public.v2_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view interviews"
  ON public.v2_interviews FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage interviews"
  ON public.v2_interviews FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_interviews.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_interviews_updated_at ON public.v2_interviews;
CREATE TRIGGER trg_v2_interviews_updated_at
  BEFORE UPDATE ON public.v2_interviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 72: Assessments table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.v2_candidates(id) ON DELETE CASCADE,
  mandate_id UUID REFERENCES public.v2_mandates(id) ON DELETE SET NULL,
  assessment_type TEXT CHECK (assessment_type IN (
    'skills_test', 'personality', 'cognitive', 'technical',
    'culture_fit', 'leadership', 'case_study', 'writing_sample', 'reference_check'
  )),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'expired', 'cancelled')),
  provider TEXT,
  provider_assessment_id TEXT,
  start_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  score DECIMAL(5,2),
  score_max DECIMAL(5,2),
  score_percentage DECIMAL(5,2),
  is_passed BOOLEAN,
  pass_threshold DECIMAL(5,2),
  report_url TEXT,
  ai_summary TEXT,
  sections JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_assessments_org ON public.v2_assessments(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_assessments_candidate ON public.v2_assessments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_v2_assessments_mandate ON public.v2_assessments(mandate_id);
CREATE INDEX IF NOT EXISTS idx_v2_assessments_status ON public.v2_assessments(status);
CREATE INDEX IF NOT EXISTS idx_v2_assessments_type ON public.v2_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_v2_assessments_score ON public.v2_assessments(score_percentage);

ALTER TABLE public.v2_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view assessments"
  ON public.v2_assessments FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage assessments"
  ON public.v2_assessments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_assessments.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_assessments_updated_at ON public.v2_assessments;
CREATE TRIGGER trg_v2_assessments_updated_at
  BEFORE UPDATE ON public.v2_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 73: Placements table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  mandate_candidate_id UUID NOT NULL REFERENCES public.v2_mandate_candidates(id) ON DELETE CASCADE,
  mandate_id UUID REFERENCES public.v2_mandates(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.v2_candidates(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.v2_companies(id) ON DELETE SET NULL,
  placement_date DATE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'placed'
    CHECK (status IN ('placed', 'probation', 'permanent', 'temp_ended', 'terminated', 'resigned')),
  fee_amount BIGINT,
  fee_currency TEXT DEFAULT 'CNY',
  fee_paid BOOLEAN DEFAULT FALSE,
  fee_paid_at TIMESTAMPTZ,
  payment_terms TEXT,
  guarantee_period_days INTEGER DEFAULT 90,
  guarantee_ends_at TIMESTAMPTZ,
  replacement_required BOOLEAN DEFAULT FALSE,
  replacement_status TEXT CHECK (replacement_status IN ('none', 'requested', 'completed', 'denied')),
  salary_amount BIGINT,
  salary_currency TEXT DEFAULT 'CNY',
  salary_frequency TEXT CHECK (salary_frequency IN ('monthly', 'yearly')),
  equity_details TEXT,
  benefits JSONB DEFAULT '{}',
  notes TEXT,
  feedback JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_placements_org ON public.v2_placements(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_placements_mc ON public.v2_placements(mandate_candidate_id);
CREATE INDEX IF NOT EXISTS idx_v2_placements_mandate ON public.v2_placements(mandate_id);
CREATE INDEX IF NOT EXISTS idx_v2_placements_candidate ON public.v2_placements(candidate_id);
CREATE INDEX IF NOT EXISTS idx_v2_placements_company ON public.v2_placements(company_id);
CREATE INDEX IF NOT EXISTS idx_v2_placements_status ON public.v2_placements(status);
CREATE INDEX IF NOT EXISTS idx_v2_placements_date ON public.v2_placements(placement_date);
CREATE INDEX IF NOT EXISTS idx_v2_placements_fee_paid ON public.v2_placements(fee_paid);

ALTER TABLE public.v2_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view placements"
  ON public.v2_placements FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage placements"
  ON public.v2_placements FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_placements.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_placements_updated_at ON public.v2_placements;
CREATE TRIGGER trg_v2_placements_updated_at
  BEFORE UPDATE ON public.v2_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 74: Email templates table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT CHECK (template_type IN (
    'candidate_outreach', 'candidate_update', 'client_update',
    'interview_invite', 'offer_extended', 'rejection',
    'welcome', 'onboarding', 'reminder', 'notification', 'custom'
  )),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  sender_name TEXT,
  sender_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  merge_fields TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_email_templates_org ON public.v2_email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_email_templates_type ON public.v2_email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_v2_email_templates_active ON public.v2_email_templates(is_active, is_default);

ALTER TABLE public.v2_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view email templates"
  ON public.v2_email_templates FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage email templates"
  ON public.v2_email_templates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_email_templates.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_email_templates_updated_at ON public.v2_email_templates;
CREATE TRIGGER trg_v2_email_templates_updated_at
  BEFORE UPDATE ON public.v2_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 75: Integration connections table ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_integration_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'stripe', 'resend', 'deepseek', 'openai', 'notion', 'feishu',
    'slack', 'discord', 'calendly', 'linkedin', 'glassdoor', 'greenhouse'
  )),
  connection_name TEXT NOT NULL,
  status TEXT DEFAULT 'connected'
    CHECK (status IN ('connected', 'disconnected', 'error', 'pending', 'expired')),
  credentials JSONB DEFAULT '{}',
  webhook_secret TEXT,
  webhook_endpoint TEXT,
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('idle', 'running', 'completed', 'failed', 'queued')),
  error_message TEXT,
  settings JSONB DEFAULT '{}',
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_integrations_org ON public.v2_integration_connections(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_integrations_type ON public.v2_integration_connections(integration_type);
CREATE INDEX IF NOT EXISTS idx_v2_integrations_status ON public.v2_integration_connections(status);
CREATE INDEX IF NOT EXISTS idx_v2_integrations_sync ON public.v2_integration_connections(sync_enabled);

ALTER TABLE public.v2_integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view integrations"
  ON public.v2_integration_connections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_integration_connections.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Org admins can manage integrations"
  ON public.v2_integration_connections FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_integration_connections.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_integrations_updated_at ON public.v2_integration_connections;
CREATE TRIGGER trg_v2_integrations_updated_at
  BEFORE UPDATE ON public.v2_integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 76: RLS policies for interviews ─────────────────────────────────
-- Defined inline with v2_interviews above.

-- ── Ticket 77: RLS policies for assessments ────────────────────────────────
-- Defined inline with v2_assessments above.

-- ── Ticket 78: RLS policies for placements ────────────────────────────────
-- Defined inline with v2_placements above.

-- ── Ticket 79: Indexes & constraints for HR/Recruitment tables ─────────────
-- All indexes and constraints defined inline:
--   v2_interviews: 5 indexes (org, mandate_candidate, status, scheduled, round)
--   v2_assessments: 6 indexes (org, candidate, mandate, status, type, score)
--   v2_placements: 8 indexes (org, mandate_candidate, mandate, candidate, company, status, date, fee_paid)
--   v2_email_templates: 3 indexes (org, type, active+default)
--   v2_integration_connections: 4 indexes (org, type, status, sync_enabled)
--   CHECK constraints: all enum-style columns + bounds

-- ── Ticket 80: updated_at triggers for HR/Recruitment tables ────────────────
-- All 5 tables have BEFORE UPDATE triggers using shared set_updated_at().
-- Triggers: trg_v2_interviews_updated_at, trg_v2_assessments_updated_at,
--           trg_v2_placements_updated_at, trg_v2_email_templates_updated_at,
--           trg_v2_integrations_updated_at
