-- Technical Blueprint 13: Client Intelligence Reports
-- DEX-TB-013

-- ============================================
-- 2.1 Table: client_intelligence_reports
-- ============================================

CREATE TABLE IF NOT EXISTS client_intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mandate_id UUID REFERENCES mandates(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'quarterly_landscape',
    'comp_snapshot',
    'talent_radar',
    'market_alert',
    'pre_mandate_assessment'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  executive_summary TEXT,
  overall_confidence TEXT CHECK (overall_confidence IN ('high', 'medium', 'low')),
  data_sources JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'generating',
    'under_review',
    'approved',
    'delivered',
    'archived'
  )),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  review_changes_made BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  delivery_channel TEXT CHECK (delivery_channel IN ('email', 'agent_message', 'portal', 'pdf')),
  opened_at TIMESTAMPTZ,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  period_start DATE,
  period_end DATE,
  generated_by TEXT DEFAULT 'deepseek-chat',
  tokens_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_client ON client_intelligence_reports(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_type ON client_intelligence_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_status ON client_intelligence_reports(status);
CREATE INDEX IF NOT EXISTS idx_report_period ON client_intelligence_reports(period_start, period_end);

ALTER TABLE client_intelligence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view all reports" ON client_intelligence_reports
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "Consultants manage assigned client reports" ON client_intelligence_reports
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR EXISTS (
      SELECT 1 FROM mandates
      WHERE lead_consultant_id = auth.uid()
      AND client_id = client_intelligence_reports.client_id
    )
  );

-- ============================================
-- 2.2 Table: client_market_subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS client_market_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN (
    'quarterly_landscape',
    'comp_monitor',
    'talent_radar',
    'market_alerts'
  )),
  industry_sectors JSONB DEFAULT '[]'::jsonb,
  job_functions JSONB DEFAULT '[]'::jsonb,
  geographies JSONB DEFAULT '[]'::jsonb,
  key_companies JSONB DEFAULT '[]'::jsonb,
  alert_thresholds JSONB DEFAULT '{}'::jsonb,
  delivery_preferences JSONB DEFAULT '{}'::jsonb,
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('premium', 'standard', 'basic')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, subscription_type)
);

CREATE INDEX IF NOT EXISTS idx_subscription_client ON client_market_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_active ON client_market_subscriptions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_type ON client_market_subscriptions(subscription_type);

ALTER TABLE client_market_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view subscriptions" ON client_market_subscriptions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "Admin/Consultant manages subscriptions" ON client_market_subscriptions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );

-- ============================================
-- 2.3 Table: market_signals
-- ============================================

CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'layoff',
    'restructuring',
    'merger',
    'comp_shift',
    'talent_movement',
    'regulation_change',
    'market_expansion',
    'market_contraction',
    'leadership_change',
    'company_expansion'
  )),
  source TEXT NOT NULL CHECK (source IN (
    'internal',
    'external_news',
    'candidate_conversation',
    'grid_update',
    'client_feedback',
    'manual'
  )),
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  affected_industries JSONB DEFAULT '[]'::jsonb,
  affected_geographies JSONB DEFAULT '[]'::jsonb,
  affected_companies JSONB DEFAULT '[]'::jsonb,
  affected_job_functions JSONB DEFAULT '[]'::jsonb,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  client_relevance JSONB DEFAULT '{}'::jsonb,
  alerts_generated JSONB DEFAULT '[]'::jsonb,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_type ON market_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_severity ON market_signals(severity);
CREATE INDEX IF NOT EXISTS idx_signal_detected ON market_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_source ON market_signals(source);

ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view signals" ON market_signals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Consultant creates signals" ON market_signals
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );

-- ============================================
-- 2.4 Table: anonymized_talent_profiles
-- ============================================

CREATE TABLE IF NOT EXISTS anonymized_talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  anonymized_label TEXT NOT NULL UNIQUE,
  industry TEXT,
  function_field TEXT,
  seniority_level TEXT CHECK (seniority_level IN (
    'director',
    'vp',
    'svp',
    'c_suite',
    'head_of',
    'manager',
    'individual_contributor'
  )),
  geography TEXT,
  years_experience INTEGER,
  key_skills JSONB DEFAULT '[]'::jsonb,
  trident_capability NUMERIC,
  trident_overall NUMERIC,
  career_tier TEXT,
  engagement_score INTEGER,
  movement_signal_count INTEGER DEFAULT 0,
  availability_assessment TEXT,
  first_anonymized_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  shown_to_clients JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_anon_label ON anonymized_talent_profiles(anonymized_label);
CREATE INDEX IF NOT EXISTS idx_anon_real_contact ON anonymized_talent_profiles(real_contact_id);
CREATE INDEX IF NOT EXISTS idx_anon_active ON anonymized_talent_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_anon_trident ON anonymized_talent_profiles(trident_overall DESC);

ALTER TABLE anonymized_talent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Consultant can view anonymized profiles" ON anonymized_talent_profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "System manages anonymized profiles" ON anonymized_talent_profiles
  FOR ALL TO authenticated USING (true);

-- ============================================
-- 2.5 Table: intelligence_queries
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL CHECK (channel IN ('feishu', 'wechat', 'platform', 'email')),
  query_text TEXT NOT NULL,
  response_summary TEXT,
  response_full JSONB,
  report_generated UUID REFERENCES client_intelligence_reports(id),
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_client ON intelligence_queries(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_channel ON intelligence_queries(channel);

ALTER TABLE intelligence_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view queries" ON intelligence_queries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "System inserts queries" ON intelligence_queries
  FOR INSERT TO authenticated WITH CHECK (true);
