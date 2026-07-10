-- Phase 2 Schema Migration (T7-T16)
-- Revenue Forecast, Change Detection, Capacity, Communication, Reports, Agents, Intelligence, AI Infrastructure

-- ============================================================
-- T7: Revenue Forecast & Change Detection
-- ============================================================

CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('month','quarter','year')),
  generated_at TIMESTAMPTZ DEFAULT now(),
  conservative_total NUMERIC DEFAULT 0,
  expected_total NUMERIC DEFAULT 0,
  optimistic_total NUMERIC DEFAULT 0,
  monthly_rollup JSONB DEFAULT '{}',
  confidence_level NUMERIC CHECK (confidence_level BETWEEN 0 AND 1),
  mandate_count INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(forecast_date, period)
);

CREATE TABLE IF NOT EXISTS revenue_forecast_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES revenue_forecasts(id) ON DELETE CASCADE,
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  scenario TEXT NOT NULL CHECK (scenario IN ('conservative','expected','optimistic')),
  fee_amount NUMERIC NOT NULL,
  probability NUMERIC NOT NULL CHECK (probability BETWEEN 0 AND 1),
  expected_month DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rfd_forecast ON revenue_forecast_details(forecast_id);

CREATE TABLE IF NOT EXISTS change_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  snapshot_type TEXT DEFAULT 'daily' CHECK (snapshot_type IN ('daily','weekly','manual','trigger')),
  total_mandates INTEGER,
  total_candidates INTEGER,
  pipeline_value NUMERIC,
  mandate_summary JSONB DEFAULT '{}',
  consultant_summary JSONB DEFAULT '{}',
  flag_summary JSONB DEFAULT '{}',
  data_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(snapshot_date, snapshot_type)
);

CREATE TABLE IF NOT EXISTS change_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_snapshot_id UUID REFERENCES change_snapshots(id),
  to_snapshot_id UUID REFERENCES change_snapshots(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mandate','candidate','consultant','revenue')),
  entity_id UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'added','removed','status_changed','tier_changed','stage_changed',
    'fee_changed','deadline_changed','consultant_changed'
  )),
  from_value TEXT,
  to_value TEXT,
  narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_snapshots ON change_records(from_snapshot_id, to_snapshot_id);

-- ============================================================
-- T8: Team Capacity & Load Balancer
-- ============================================================

CREATE TABLE IF NOT EXISTS capacity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mandate_count INTEGER DEFAULT 0,
  weighted_load NUMERIC DEFAULT 0,
  max_capacity NUMERIC DEFAULT 8,
  capacity_ratio NUMERIC CHECK (capacity_ratio >= 0),
  status TEXT CHECK (status IN ('underloaded','balanced','at_capacity','overloaded')),
  active_mandate_ids UUID[] DEFAULT '{}',
  difficulty_weighted_sum NUMERIC DEFAULT 0,
  stage_weighted_sum NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consultant_id, snapshot_date)
);

-- ============================================================
-- T9: Communication Engine
-- ============================================================

CREATE TABLE IF NOT EXISTS client_comm_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_org_id UUID NOT NULL REFERENCES organizations(id),
  contact_name TEXT NOT NULL,
  email_addresses TEXT[] DEFAULT '{}',
  language_primary TEXT DEFAULT 'en' CHECK (language_primary IN ('en','fr','zh','th','my','other')),
  language_secondary TEXT,
  tone TEXT DEFAULT 'semi-formal' CHECK (tone IN ('formal','semi-formal','informal','casual')),
  greeting TEXT DEFAULT 'Dear',
  closing TEXT DEFAULT 'Best regards',
  cultural_notes TEXT,
  preferred_send_window JSONB DEFAULT '{"timezone":"HKT","hours":"09:00-11:00","days":["Mon","Tue","Wed","Thu","Fri"]}',
  communication_preferences JSONB DEFAULT '{"update_frequency":"per_deliverable","detail_level":"summary","attachment_format":"xlsx"}',
  learned_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id),
  type TEXT NOT NULL CHECK (type IN ('client_email','candidate_outreach','internal_update','auto_followup')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email','linkedin','feishu','internal')),
  timestamp_sent TIMESTAMPTZ,
  timestamp_delivered TIMESTAMPTZ,
  timestamp_read TIMESTAMPTZ,
  timestamp_replied TIMESTAMPTZ,
  sender_address TEXT,
  recipients JSONB DEFAULT '[]',
  subject TEXT,
  body_text TEXT,
  language TEXT DEFAULT 'en',
  attachments JSONB DEFAULT '[]',
  related_candidate_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','pending_review','approved','sent','delivered','read','replied','bounced','failed'
  )),
  reply_classification TEXT CHECK (reply_classification IN (
    'interested','asking_questions','not_now','declined','referral','hostile'
  )),
  reply_text TEXT,
  actor TEXT DEFAULT 'user' CHECK (actor IN ('agent','user','automated')),
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved_by_kevin','auto_approved')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comm_mandate ON communication_records(mandate_id);
CREATE INDEX IF NOT EXISTS idx_comm_status ON communication_records(status);
CREATE INDEX IF NOT EXISTS idx_comm_type ON communication_records(type);

CREATE TABLE IF NOT EXISTS outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  template_chain JSONB NOT NULL DEFAULT '[]',
  current_stage TEXT DEFAULT 'connection_request',
  overall_status TEXT DEFAULT 'in_progress' CHECK (overall_status IN (
    'in_progress','completed','paused','candidate_responded','exhausted','blacklisted'
  )),
  response_received BOOLEAN DEFAULT false,
  response_classification TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mandate_id, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_sequences(overall_status);

CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'outreach_connection','outreach_first_message','follow_up_1','follow_up_2',
    'break_up','client_update','client_deliverable','internal_update'
  )),
  language TEXT DEFAULT 'en',
  tone TEXT DEFAULT 'semi-formal',
  channel TEXT DEFAULT 'email' CHECK (channel IN ('linkedin','email','both')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  personalization_rules JSONB DEFAULT '{}',
  max_length_chars INTEGER DEFAULT 500,
  usage_count INTEGER DEFAULT 0,
  response_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- T10: Report Templates & Distribution
-- ============================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  sections JSONB NOT NULL DEFAULT '[]',
  output_format TEXT DEFAULT 'markdown' CHECK (output_format IN ('markdown','pdf','html','feishu_card')),
  routing JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  content TEXT,
  format TEXT,
  delivery_status JSONB DEFAULT '{}',
  triggered_by TEXT DEFAULT 'scheduled' CHECK (triggered_by IN ('scheduled','trigger','manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS distribution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES report_instances(id),
  target_type TEXT CHECK (target_type IN ('feishu_group','feishu_dm','email')),
  target_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed','retrying')),
  message_id TEXT,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- T11: Agent Orchestration
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  role TEXT,
  type TEXT DEFAULT 'executor' CHECK (type IN ('orchestrator','executor','specialist')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','dormant','inactive_hold','decommissioned')),
  capabilities TEXT[] DEFAULT '{}',
  limitations TEXT[] DEFAULT '{}',
  models_available TEXT[] DEFAULT '{deepseek-flash,deepseek-pro}',
  daily_budget_cny NUMERIC DEFAULT 80,
  monthly_budget_cny NUMERIC DEFAULT 1800,
  avg_cost_per_task NUMERIC DEFAULT 3.50,
  max_concurrent_tasks INTEGER DEFAULT 3,
  working_hours JSONB DEFAULT '{"timezone":"Asia/Shanghai","start":"08:00","end":"22:00","days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}',
  reporting_to TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id),
  parent_task_id UUID REFERENCES tasks(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('sweep','analysis','outreach','deliverable','research','communication','coordination','custom')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical','high','normal','low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','dispatched','in_progress','review','completed','failed','cancelled','paused')),
  assigned_agent TEXT REFERENCES agent_registry(id),
  dispatched_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  context_package JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '[]',
  cost JSONB DEFAULT '{"tokens_input":0,"tokens_output":0,"api_calls":0,"total_cny":0}',
  quality_score NUMERIC CHECK (quality_score BETWEEN 0 AND 100),
  escalation_count INTEGER DEFAULT 0,
  clarification_requests INTEGER DEFAULT 0,
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  agent_id TEXT NOT NULL REFERENCES agent_registry(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'task_started','task_completed','task_failed','handoff_sent','handoff_received',
    'clarification_requested','escalation_triggered','quality_check_passed',
    'quality_check_failed','budget_alert','cost_update'
  )),
  timestamp TIMESTAMPTZ DEFAULT now(),
  details JSONB DEFAULT '{}',
  cost_snapshot JSONB DEFAULT '{}',
  output_refs TEXT[] DEFAULT '{}',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_worklogs_task ON work_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_agent ON work_logs(agent_id);

-- ============================================================
-- T12: Scoring Calibration & Intelligence
-- ============================================================

CREATE TABLE IF NOT EXISTS sweep_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  mandate_type TEXT CHECK (mandate_type IN ('mapping','sweep','speaker_search','assessment')),
  scoring_model JSONB NOT NULL,
  input_metrics JSONB DEFAULT '{}',
  output_metrics JSONB DEFAULT '{}',
  outcome_data JSONB DEFAULT '{}',
  outreach_metrics JSONB DEFAULT '{}',
  cost_metrics JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'geographic','company','seniority','template','seasonal','pipeline','client','scoring'
  )),
  title TEXT NOT NULL,
  description TEXT,
  supporting_data JSONB DEFAULT '{}',
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','superseded','invalidated')),
  superseded_by UUID REFERENCES patterns(id),
  action_taken TEXT,
  action_effectiveness TEXT CHECK (action_effectiveness IN ('improved','no_change','worsened')),
  first_observed TIMESTAMPTZ,
  last_observed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- T13: DEX AI Advanced Infrastructure
-- ============================================================

CREATE TABLE IF NOT EXISTS prompt_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  template_path TEXT,
  template_content TEXT,
  variables TEXT[] DEFAULT '{}',
  model TEXT DEFAULT 'deepseek_flash' CHECK (model IN ('deepseek_flash','deepseek_pro')),
  max_tokens INTEGER DEFAULT 2000,
  temperature NUMERIC DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 2),
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- T5: Notification Settings (supporting table)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  feishu_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  weekly_report BOOLEAN DEFAULT true,
  alert_level TEXT DEFAULT 'high' CHECK (alert_level IN ('low','medium','high','critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- Seed Data
-- ============================================================

-- Seed communication templates
INSERT INTO communication_templates (name, category, language, tone, channel, subject_template, body_template, variables)
VALUES
('Initial LinkedIn Connection', 'outreach_connection', 'en', 'semi-formal', 'linkedin', NULL,
 'Hi {{first_name}}, I came across your profile and was impressed by your experience at {{current_company}}. I am working on a {{role_type}} role in {{location}} and thought your background could be a strong match. Would you be open to a brief conversation?', '{"first_name","current_company","role_type","location"}'),

('Follow-up #1', 'follow_up_1', 'en', 'semi-formal', 'email',
 'Following up: {{role_type}} opportunity',
 'Hi {{first_name}}, I wanted to follow up on my message regarding the {{role_type}} role. I would love to share more details about the position and the company. Are you available for a quick call this week?', '{"first_name","role_type"}'),

('Client Weekly Update', 'client_update', 'en', 'semi-formal', 'email',
 'Weekly Update: {{position_title}}',
 'Dear {{contact_name}}, Please find attached the weekly update for the {{position_title}} search. This week we have {{cv_count}} new candidates in screening and {{interview_count}} interviews scheduled. Best regards, LYC Partners', '{"contact_name","position_title","cv_count","interview_count"}')
ON CONFLICT DO NOTHING;

-- Seed report templates
INSERT INTO report_templates (name, description, sections, output_format, routing, schedule)
VALUES
('daily_dashboard_v2', 'Daily Pipeline Dashboard',
 '[{"name":"overview","type":"summary"},{"name":"mandates","type":"table"},{"name":"flags","type":"alert"}]',
 'markdown', '{"targets":["alessio_ai_group"]}', '{"cron":"30 10 * * 1-5"}'),

('weekly_recap', 'Weekly Pipeline Recap',
 '[{"name":"week_summary","type":"summary"},{"name":"metrics","type":"chart"},{"name":"upcoming","type":"list"}]',
 'markdown', '{"targets":["alessio_ai_group","lyc_partners"]}', '{"cron":"0 10 * * 5"}'),

('executive_summary', 'Executive Summary for Kevin',
 '[{"name":"headline","type":"summary"},{"name":"wins","type":"list"},{"name":"risks","type":"alert"},{"name":"actions","type":"list"}]',
 'markdown', '{"targets":["kevin_dm"]}', '{"cron":"0 1 * * 1"}'),

('revenue_forecast', 'Revenue Forecast Report',
 '[{"name":"scenarios","type":"table"},{"name":"monthly_rollup","type":"chart"},{"name":"contributors","type":"table"}]',
 'markdown', '{"targets":["kevin_dm","lyc_partners"]}', '{"cron":"0 1 1 * *"}')
ON CONFLICT DO NOTHING;

-- Seed prompt registry
INSERT INTO prompt_registry (feature_key, name, model, max_tokens, temperature, description)
VALUES
('jd_generator', 'Job Description Generator', 'deepseek_pro', 4000, 0.7, 'Generates optimized job descriptions'),
('cv_optimizer', 'CV Optimizer', 'deepseek_pro', 4000, 0.5, 'Optimizes CVs for specific mandates'),
('executive_summary', 'Executive Summary', 'deepseek_pro', 3000, 0.3, 'Generates board-level executive summaries'),
('shortlist_rationale', 'Shortlist Rationale', 'deepseek_flash', 2000, 0.5, 'Generates rationale for shortlist candidates'),
('follow_up_draft', 'Follow-up Draft', 'deepseek_flash', 1500, 0.6, 'Drafts follow-up messages'),
('data_query', 'Data Query', 'deepseek_flash', 1000, 0.2, 'Parses natural language to SQL'),
('flag_description', 'Flag Description', 'deepseek_flash', 500, 0.4, 'Generates human-readable flag descriptions'),
('outreach_message', 'Outreach Message', 'deepseek_flash', 800, 0.6, 'Generates personalized outreach messages'),
('response_classifier', 'Response Classifier', 'deepseek_flash', 500, 0.1, 'Classifies candidate responses')
ON CONFLICT DO NOTHING;

-- Seed agent registry
INSERT INTO agent_registry (id, name, display_name, role, type, capabilities, limitations, daily_budget_cny, monthly_budget_cny)
VALUES
('sweep_agent', 'Sweep Agent', 'Sweep AI', 'sourcing', 'executor',
 '{"sweep","research","data_entry"}', '{"client_communication","offer_negotiation"}', 50, 1200),

('scoring_agent', 'Scoring Agent', 'Scoring AI', 'assessment', 'specialist',
 '{"scoring","analysis","calibration"}', '{"sourcing","outreach"}', 30, 800),

('comm_agent', 'Communication Agent', 'Comm AI', 'communication', 'executor',
 '{"drafting","follow_up","response_classification"}', '{"final_decision_making"}', 40, 1000),

('orchestrator', 'Orchestrator', 'Orchestrator AI', 'coordination', 'orchestrator',
 '{"task_dispatch","monitoring","escalation"}', '{"direct_execution"}', 20, 600)
ON CONFLICT DO NOTHING;
