-- ============================================================================
-- v2 Batch 2 — Client Portal Schema
-- Tickets 11-20 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 11: Mandates table (v2 schema) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_mandates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  role_type TEXT CHECK (role_type IN ('full_time', 'part_time', 'contract', 'internship', 'board')),
  level TEXT CHECK (level IN ('junior', 'mid', 'senior', 'director', 'vp', 'c_suite', 'board')),
  function TEXT,
  department TEXT,
  city TEXT,
  country TEXT DEFAULT 'CN',
  remote_policy TEXT CHECK (remote_policy IN ('onsite', 'hybrid', 'remote', 'flexible')),
  salary_min BIGINT,
  salary_max BIGINT,
  salary_currency TEXT DEFAULT 'CNY',
  equity_offered BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical', 'executive')),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'active', 'on_hold', 'shortlisting',
    'interviewing', 'offer_pending', 'filled', 'cancelled', 'reopened'
  )),
  opening_count INTEGER DEFAULT 1,
  placed_count INTEGER DEFAULT 0,
  fee_percentage DECIMAL(5,2) DEFAULT 20.00,
  fee_min BIGINT,
  fee_structure TEXT CHECK (fee_structure IN ('percentage', 'flat', 'retainer', 'contingency')),
  start_date DATE,
  target_fill_date DATE,
  deadline_date DATE,
  confidential BOOLEAN DEFAULT FALSE,
  search_type TEXT CHECK (search_type IN ('retained', 'contingent', 'rpo')),
  requirements JSONB DEFAULT '{}',
  ideal_profile JSONB DEFAULT '{}',
  interview_process JSONB DEFAULT '[]',
  stakeholders JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_mandates_org ON public.v2_mandates(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_mandates_company ON public.v2_mandates(company_id);
CREATE INDEX IF NOT EXISTS idx_v2_mandates_status ON public.v2_mandates(status);
CREATE INDEX IF NOT EXISTS idx_v2_mandates_priority ON public.v2_mandates(priority);
CREATE INDEX IF NOT EXISTS idx_v2_mandates_level ON public.v2_mandates(level);
CREATE INDEX IF NOT EXISTS idx_v2_mandates_slug ON public.v2_mandates(org_id, slug);

ALTER TABLE public.v2_mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read mandates"
  ON public.v2_mandates FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage mandates"
  ON public.v2_mandates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_mandates.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_mandates_updated_at ON public.v2_mandates;
CREATE TRIGGER trg_v2_mandates_updated_at
  BEFORE UPDATE ON public.v2_mandates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 12: Candidates table (v2 schema) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  current_company TEXT,
  current_title TEXT,
  current_city TEXT,
  current_country TEXT DEFAULT 'CN',
  years_experience INTEGER,
  education JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  languages JSONB DEFAULT '[]',
  certifications TEXT[] DEFAULT '{}',
  expected_salary_min BIGINT,
  expected_salary_max BIGINT,
  expected_salary_currency TEXT DEFAULT 'CNY',
  notice_period_days INTEGER,
  availability TEXT CHECK (availability IN ('immediate', '1_month', '2_months', '3_months', 'negotiable', 'not_looking')),
  source TEXT CHECK (source IN (
    'referral', 'linkedin', 'job_board', 'direct_application', 'agency',
    'conference', 'database', 'ai_discovery', 'council_member', 'other'
  )),
  stage TEXT DEFAULT 'discovered' CHECK (stage IN (
    'discovered', 'contacted', 'screening', 'qualified', 'submitted',
    'first_interview', 'second_interview', 'final_interview', 'offer',
    'accepted', 'placed', 'rejected', 'withdrawn', 'blacklisted'
  )),
  talent_score INTEGER DEFAULT 0 CHECK (talent_score BETWEEN 0 AND 100),
  ai_assessment JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  resume_url TEXT,
  cover_letter_url TEXT,
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_candidates_org ON public.v2_candidates(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_stage ON public.v2_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_source ON public.v2_candidates(source);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_skills ON public.v2_candidates USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_tags ON public.v2_candidates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_score ON public.v2_candidates(talent_score);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_email ON public.v2_candidates(email);
CREATE INDEX IF NOT EXISTS idx_v2_candidates_name ON public.v2_candidates(first_name, last_name);

ALTER TABLE public.v2_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read candidates"
  ON public.v2_candidates FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage candidates"
  ON public.v2_candidates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_candidates.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_candidates_updated_at ON public.v2_candidates;
CREATE TRIGGER trg_v2_candidates_updated_at
  BEFORE UPDATE ON public.v2_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 13: Mandate candidates junction table ───────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_mandate_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mandate_id UUID NOT NULL REFERENCES public.v2_mandates(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.v2_candidates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'sourced' CHECK (status IN (
    'sourced', 'screening', 'submitted', 'client_review', 'interview',
    'offer', 'placed', 'rejected', 'withdrawn', 'shortlisted'
  )),
  consultant_rating INTEGER CHECK (consultant_rating BETWEEN 1 AND 5),
  client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),
  ai_match_score DECIMAL(5,2),
  ai_match_reasoning TEXT,
  submission_notes TEXT,
  rejection_reason TEXT,
  interview_feedback JSONB DEFAULT '[]',
  rank INTEGER,
  submitted_at TIMESTAMPTZ,
  interviewed_at TIMESTAMPTZ,
  offered_at TIMESTAMPTZ,
  placed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(mandate_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_v2_mc_mandate ON public.v2_mandate_candidates(mandate_id);
CREATE INDEX IF NOT EXISTS idx_v2_mc_candidate ON public.v2_mandate_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_v2_mc_status ON public.v2_mandate_candidates(status);
CREATE INDEX IF NOT EXISTS idx_v2_mc_score ON public.v2_mandate_candidates(ai_match_score);

ALTER TABLE public.v2_mandate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read mandate candidates"
  ON public.v2_mandate_candidates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_mandates m
      JOIN public.v2_org_memberships om ON m.org_id = om.org_id
      WHERE m.id = v2_mandate_candidates.mandate_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage mandate candidates"
  ON public.v2_mandate_candidates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_mandates m
      JOIN public.v2_org_memberships om ON m.org_id = om.org_id
      WHERE m.id = v2_mandate_candidates.mandate_id
        AND om.user_id = auth.uid()
        AND om.role IN ('super_admin', 'admin', 'consultant')
        AND om.status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_mc_updated_at ON public.v2_mandate_candidates;
CREATE TRIGGER trg_v2_mc_updated_at
  BEFORE UPDATE ON public.v2_mandate_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 14: Activities table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'mandate', 'candidate', 'contact', 'task', 'deal')),
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'call', 'email', 'meeting', 'task', 'status_change',
    'comment', 'file_upload', 'ai_analysis', 'pipeline_move',
    'reminder', 'follow_up', 'interview', 'feedback', 'system'
  )),
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_activities_org ON public.v2_activities(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_activities_entity ON public.v2_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_v2_activities_type ON public.v2_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_v2_activities_due ON public.v2_activities(due_at);
CREATE INDEX IF NOT EXISTS idx_v2_activities_created ON public.v2_activities(created_at);

ALTER TABLE public.v2_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read non-private activities"
  ON public.v2_activities FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND is_private = false
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can read their own private activities"
  ON public.v2_activities FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    AND is_private = true
    AND deleted_at IS NULL
  );

CREATE POLICY "Org members can create activities"
  ON public.v2_activities FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own activities"
  ON public.v2_activities FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage all activities"
  ON public.v2_activities FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_activities.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_activities_updated_at ON public.v2_activities;
CREATE TRIGGER trg_v2_activities_updated_at
  BEFORE UPDATE ON public.v2_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 15: RLS policies for mandates ───────────────────────────────────
-- Defined inline with v2_mandates above.
-- Key policy pattern: org-scoped read access, consultant/admin write access.

-- ── Ticket 16: RLS policies for candidates ─────────────────────────────────
-- Defined inline with v2_candidates above.
-- Key policy pattern: org-scoped read access, consultant/admin write access.

-- ── Ticket 17: RLS policies for mandate_candidates ────────────────────────
-- Defined inline with v2_mandate_candidates above.
-- Key policy pattern: derived from mandate org membership.

-- ── Ticket 18: RLS policies for activities ────────────────────────────────
-- Defined inline with v2_activities above.
-- Key policy pattern: public read for non-private, owner read for private.

-- ── Ticket 19: Indexes & constraints summary ──────────────────────────────
-- All indexes and constraints defined inline:
--   v2_mandates: 6 indexes (org, company, status, priority, level, slug)
--   v2_candidates: 7 indexes (org, stage, source, skills GIN, tags GIN, score, email, name)
--   v2_mandate_candidates: 4 indexes (mandate, candidate, status, score)
--   v2_activities: 5 indexes (org, entity, type, due, created)
--   UNIQUE constraints: mandate_candidates(mandate_id, candidate_id)
--   CHECK constraints: all enum-style columns

-- ── Ticket 20: updated_at triggers summary ────────────────────────────────
-- All 4 tables have BEFORE UPDATE triggers using shared set_updated_at().
-- Triggers: trg_v2_mandates_updated_at, trg_v2_candidates_updated_at,
--           trg_v2_mc_updated_at, trg_v2_activities_updated_at
