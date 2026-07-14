-- ============================================================================
-- v2 Batch 6 — Intelligence Layer + Notifications
-- Tickets 51-60 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 51: Intelligence sources table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.intelligence_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN (
    'rss', 'api', 'web_scrape', 'manual', 'user_submission',
    'linkedin', 'glassdoor', 'job_board', 'news', 'regulatory'
  )),
  url TEXT,
  api_endpoint TEXT,
  refresh_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT,
  reliability_score DECIMAL(3,2) DEFAULT 0.5,
  last_fetched_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_sources_type ON public.intelligence_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_active ON public.intelligence_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_category ON public.intelligence_sources(category);

ALTER TABLE public.intelligence_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all intelligence sources"
  ON public.intelligence_sources FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admin can manage intelligence sources"
  ON public.intelligence_sources FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_intelligence_sources_updated_at ON public.intelligence_sources;
CREATE TRIGGER trg_intelligence_sources_updated_at
  BEFORE UPDATE ON public.intelligence_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 52: Intelligence signals table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.intelligence_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.intelligence_sources(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'funding', 'hiring', 'departure', 'expansion', 'restructuring',
    'acquisition', 'ipo', 'partnership', 'regulatory', 'market_shift',
    'competitor_move', 'talent_movement', 'compensation_trend',
    'industry_report', 'executive_change', 'office_change'
  )),
  title TEXT NOT NULL,
  summary TEXT,
  raw_content TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  relevance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  companies_related UUID[] DEFAULT '{}',
  mandates_related UUID[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  geography TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  ai_enriched BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_type ON public.intelligence_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_org ON public.intelligence_signals(org_id);
CREATE INDEX IF NOT EXISTS idx_signals_relevance ON public.intelligence_signals(relevance_score);
CREATE INDEX IF NOT EXISTS idx_signals_companies ON public.intelligence_signals USING GIN(companies_related);
CREATE INDEX IF NOT EXISTS idx_signals_industries ON public.intelligence_signals USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_signals_discovered ON public.intelligence_signals(discovered_at);
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON public.intelligence_signals(confidence);
CREATE INDEX IF NOT EXISTS idx_signals_impact ON public.intelligence_signals(impact_level);

ALTER TABLE public.intelligence_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org signals"
  ON public.intelligence_signals FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admin can manage all signals"
  ON public.intelligence_signals FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_intelligence_signals_updated_at ON public.intelligence_signals;
CREATE TRIGGER trg_intelligence_signals_updated_at
  BEFORE UPDATE ON public.intelligence_signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 53: Company intelligence table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.v2_companies(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.intelligence_signals(id) ON DELETE SET NULL,
  data_type TEXT CHECK (data_type IN (
    'headcount_trend', 'hiring_velocity', 'attrition_rate',
    'compensation_benchmark', 'funding_status', 'growth_metrics',
    'org_changes', 'tech_stack', 'culture_signals', 'risk_indicators'
  )),
  period TEXT,
  value JSONB NOT NULL,
  previous_value JSONB,
  change_percentage DECIMAL(8,2),
  confidence DECIMAL(3,2) DEFAULT 0.5,
  source_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_intel_company ON public.company_intelligence(company_id);
CREATE INDEX IF NOT EXISTS idx_company_intel_type ON public.company_intelligence(data_type);
CREATE INDEX IF NOT EXISTS idx_company_intel_date ON public.company_intelligence(effective_date);
CREATE INDEX IF NOT EXISTS idx_company_intel_signal ON public.company_intelligence(signal_id);

ALTER TABLE public.company_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view company intelligence for their org"
  ON public.company_intelligence FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_companies c
      JOIN public.v2_org_memberships om ON c.org_id = om.org_id
      WHERE c.id = company_intelligence.company_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

CREATE POLICY "Admin can manage all company intelligence"
  ON public.company_intelligence FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

DROP TRIGGER IF EXISTS trg_company_intelligence_updated_at ON public.company_intelligence;
CREATE TRIGGER trg_company_intelligence_updated_at
  BEFORE UPDATE ON public.company_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 54: Notifications table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'mention', 'assignment', 'status_change', 'reminder',
    'system', 'billing', 'event', 'coaching', 'intelligence',
    'ai_insight', 'deadline', 'approval'
  )),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  channels TEXT[] DEFAULT '{in_app}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

CREATE POLICY "Admin can manage all notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- ── Ticket 55: RLS policies for intelligence_sources ──────────────────────
-- Defined inline with intelligence_sources above.
-- Key policies: admin only (internal configuration).

-- ── Ticket 56: RLS policies for intelligence_signals ──────────────────────
-- Defined inline with intelligence_signals above.
-- Key policies: org-scoped read, admin management.

-- ── Ticket 57: RLS policies for company_intelligence ──────────────────────
-- Defined inline with company_intelligence above.
-- Key policies: org-scoped read (via company), admin management.

-- ── Ticket 58: RLS policies for notifications ─────────────────────────────
-- Defined inline with notifications above.
-- Key policies: owner read/update, admin create/manage.

-- ── Ticket 59: Indexes & constraints for Intelligence + Notifications ─────
-- All indexes and constraints defined inline:
--   intelligence_sources: 3 indexes (type, active, category)
--   intelligence_signals: 8 indexes (type, org, relevance, companies GIN, industries GIN, discovered, confidence, impact)
--   company_intelligence: 4 indexes (company, type, effective_date, signal)
--   notifications: 4 indexes (user, user+read, created DESC, type)
--   CHECK constraints: all enum-style columns + 0-1 bounds for confidence/relevance

-- ── Ticket 60: Triggers for Intelligence + Notifications ──────────────────
-- 3 tables have updated_at triggers (notifications is append-only):
--   trg_intelligence_sources_updated_at, trg_intelligence_signals_updated_at,
--   trg_company_intelligence_updated_at
