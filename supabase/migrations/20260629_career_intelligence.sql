-- Technical Blueprint 12: Career Intelligence Agent
-- DEX-TB-012

-- ============================================
-- 2.1 Schema Extensions to contacts Table
-- ============================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS career_tier TEXT DEFAULT 'DORMANT' CHECK (career_tier IN ('ALPHA', 'BETA', 'GAMMA', 'DORMANT'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_engaged_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preference_model JSONB DEFAULT '{}'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_enrolled BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_stage TEXT DEFAULT NULL CHECK (nurture_stage IN ('WAITING', 'ENGAGED', 'RESPONDED', 'DECLINED_NURTURE', 'CONVERTED'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_next_touch TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS intelligence_subscriptions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS movement_signals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS career_benchmark JSONB DEFAULT '{}'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS agent_conversation_log JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_contacts_career_tier ON contacts(career_tier) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_contacts_nurture ON contacts(nurture_enrolled, nurture_next_touch) WHERE nurture_enrolled = true;
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON contacts(engagement_score DESC) WHERE is_archived = false;

-- ============================================
-- 2.2 Table: career_intelligence_log
-- ============================================

CREATE TABLE IF NOT EXISTS career_intelligence_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  intelligence_type TEXT NOT NULL CHECK (intelligence_type IN (
    'comp_benchmark',
    'career_trajectory',
    'skill_demand',
    'movement_intel',
    'company_signal',
    'market_timing',
    'nurture_touch',
    'check_in',
    'benchmark_offer',
    'general'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('wechat', 'wecom', 'feishu', 'email', 'platform')),
  content_summary TEXT,
  full_content JSONB,
  signals_captured JSONB DEFAULT '{}'::jsonb,
  engagement_impact TEXT CHECK (engagement_impact IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_RESPONSE')),
  consultant_id UUID REFERENCES auth.users(id),
  agent_model TEXT DEFAULT 'deepseek-chat',
  agent_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_log_contact ON career_intelligence_log(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_log_type ON career_intelligence_log(intelligence_type);
CREATE INDEX IF NOT EXISTS idx_career_log_direction ON career_intelligence_log(direction);
CREATE INDEX IF NOT EXISTS idx_career_log_consultant ON career_intelligence_log(consultant_id);
CREATE INDEX IF NOT EXISTS idx_career_log_date ON career_intelligence_log(created_at DESC);

ALTER TABLE career_intelligence_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view intelligence log" ON career_intelligence_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert intelligence log" ON career_intelligence_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "No updates to intelligence log" ON career_intelligence_log
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No deletes from intelligence log" ON career_intelligence_log
  FOR DELETE TO authenticated USING (false);

-- ============================================
-- 2.3 Table: nurture_sequences
-- ============================================

CREATE TABLE IF NOT EXISTS nurture_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN (
    'ALPHA_CAREER',
    'BETA_QUARTERLY',
    'GAMMA_SEMI_ANNUAL',
    'SIGNAL_REACTIVATION',
    'S8_NOT_INTERESTED',
    'S4_NO_RESPONSE'
  )),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  cadence_days INTEGER NOT NULL,
  next_touch_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CONVERTED', 'DECLINED')),
  intelligence_types JSONB DEFAULT '["comp_benchmark", "skill_demand"]'::jsonb,
  pause_reason TEXT,
  touch_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  last_touch_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,
  consultant_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_nurture_contact ON nurture_sequences(contact_id);
CREATE INDEX IF NOT EXISTS idx_nurture_next_touch ON nurture_sequences(next_touch_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_nurture_status ON nurture_sequences(status);
CREATE INDEX IF NOT EXISTS idx_nurture_type ON nurture_sequences(sequence_type);

ALTER TABLE nurture_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view nurture sequences" ON nurture_sequences
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage nurture sequences" ON nurture_sequences
  FOR ALL TO authenticated USING (true);

-- ============================================
-- 2.4 Table: career_benchmarks
-- ============================================

CREATE TABLE IF NOT EXISTS career_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  data_confidence NUMERIC CHECK (data_confidence >= 0 AND data_confidence <= 1),
  data_sources_used JSONB DEFAULT '[]'::jsonb,
  comp_percentile NUMERIC,
  comp_range_low NUMERIC,
  comp_range_high NUMERIC,
  comp_currency TEXT DEFAULT 'USD',
  comp_data_points INTEGER DEFAULT 0,
  trajectory_paths JSONB DEFAULT '[]'::jsonb,
  current_skills JSONB DEFAULT '[]'::jsonb,
  required_skills JSONB DEFAULT '[]'::jsonb,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  market_demand_score NUMERIC CHECK (market_demand_score >= 0 AND market_demand_score <= 100),
  active_mandates_matching INTEGER DEFAULT 0,
  demand_trend TEXT CHECK (demand_trend IN ('increasing', 'stable', 'decreasing')),
  narrative_summary TEXT,
  full_report JSONB,
  generated_by TEXT DEFAULT 'deepseek-chat',
  tokens_used INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES career_benchmarks(id)
);

CREATE INDEX IF NOT EXISTS idx_benchmark_contact ON career_benchmarks(contact_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_current ON career_benchmarks(contact_id) WHERE is_current = TRUE;

ALTER TABLE career_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view benchmarks" ON career_benchmarks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage benchmarks" ON career_benchmarks
  FOR ALL TO authenticated USING (true);

-- ============================================
-- 2.5 Table: movement_signal_definitions
-- ============================================

CREATE TABLE IF NOT EXISTS movement_signal_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'company_restructuring',
    'company_layoff',
    'company_merger',
    'company_expansion',
    'leadership_change',
    'competitor_hiring',
    'tenure_threshold',
    'contract_ending',
    'peer_movement',
    'linkedin_activity',
    'promotion_passed_over',
    'project_completion'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detection_method TEXT NOT NULL CHECK (detection_method IN ('manual', 'automated', 'hybrid')),
  detection_rules JSONB DEFAULT '{}'::jsonb,
  auto_alert_consultant BOOLEAN DEFAULT FALSE,
  alert_threshold INTEGER DEFAULT 2,
  alert_window_days INTEGER DEFAULT 30,
  can_auto_enroll BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movement_signal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages signal definitions" ON movement_signal_definitions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
  );
CREATE POLICY "Team can view signal definitions" ON movement_signal_definitions
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- Seed default signal definitions
INSERT INTO movement_signal_definitions (signal_type, severity, detection_method, auto_alert_consultant, alert_threshold, can_auto_enroll)
VALUES
  ('company_restructuring', 'high', 'hybrid', true, 1, true),
  ('company_layoff', 'critical', 'hybrid', true, 1, true),
  ('company_merger', 'high', 'hybrid', true, 1, false),
  ('company_expansion', 'medium', 'manual', false, 1, false),
  ('leadership_change', 'medium', 'manual', false, 1, false),
  ('competitor_hiring', 'low', 'manual', false, 2, false),
  ('tenure_threshold', 'low', 'automated', false, 1, true),
  ('contract_ending', 'medium', 'manual', true, 1, true),
  ('peer_movement', 'medium', 'automated', true, 2, true),
  ('linkedin_activity', 'low', 'manual', false, 1, false),
  ('promotion_passed_over', 'high', 'manual', true, 1, true),
  ('project_completion', 'low', 'manual', false, 1, false)
ON CONFLICT DO NOTHING;
