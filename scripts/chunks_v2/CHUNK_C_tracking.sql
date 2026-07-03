
-- --- 20260623_alumni_tracking.sql ---

-- Phase 4.6: Post-Placement & Alumni Tracking
-- Alumni lifecycle management system

-- Alumni records (placed candidates)
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES contacts(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  placement_mandate_id UUID NOT NULL REFERENCES mandates(id),
  placement_date DATE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  guarantee_end_date DATE NOT NULL,
  guarantee_status TEXT DEFAULT 'active',
  alumni_status TEXT DEFAULT 'active',
  last_engagement_date DATE,
  engagement_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni engagement log
CREATE TABLE IF NOT EXISTS alumni_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  engagement_type TEXT NOT NULL,
  engagement_date TIMESTAMPTZ NOT NULL,
  initiated_by UUID REFERENCES profiles(id),
  summary TEXT,
  outcome TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarantee period tracking
CREATE TABLE IF NOT EXISTS guarantee_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  check_in_dates DATE[] NOT NULL,
  check_ins_completed JSONB DEFAULT '[]',
  fee_refund_pct NUMERIC(5,2),
  dispute_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni referrals
CREATE TABLE IF NOT EXISTS alumni_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  referred_candidate_id UUID REFERENCES contacts(id),
  referred_name TEXT NOT NULL,
  referred_email TEXT,
  referred_phone TEXT,
  mandate_id UUID REFERENCES mandates(id),
  referral_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'received',
  referral_source TEXT DEFAULT 'alumni',
  referral_fee_owed BOOLEAN DEFAULT false,
  referral_fee_amount NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-engagement campaigns
CREATE TABLE IF NOT EXISTS alumni_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  target_tags TEXT[] DEFAULT '{}',
  target_companies TEXT[] DEFAULT '{}',
  message_template TEXT NOT NULL,
  send_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alumni_org ON alumni(org_id);
CREATE INDEX IF NOT EXISTS idx_alumni_status ON alumni(alumni_status);
CREATE INDEX IF NOT EXISTS idx_alumni_guarantee ON alumni(guarantee_status) WHERE guarantee_status = 'active';
CREATE INDEX IF NOT EXISTS idx_alumni_engagements ON alumni_engagements(alumni_id, engagement_date DESC);
CREATE INDEX IF NOT EXISTS idx_guarantee_periods_active ON guarantee_periods(org_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_alumni_referrals ON alumni_referrals(alumni_id, referral_date DESC);

-- RLS policies
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_campaigns ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view org alumni" ON alumni
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create org alumni" ON alumni
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org alumni" ON alumni
  FOR UPDATE USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni engagements" ON alumni_engagements
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org guarantee periods" ON guarantee_periods
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni referrals" ON alumni_referrals
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni campaigns" ON alumni_campaigns
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- --- 20260623_approval_workflows.sql ---

-- Phase 3.11: Approval Workflows
-- 012_approval_workflows.sql

-- Approval workflow definitions
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'candidate_submission',
    'fee_change',
    'offer_approval',
    'mandate_creation',
    'budget_exception',
    'data_export',
    'custom'
  )),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  steps JSONB NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON approval_workflows(org_id, approval_type);

-- Approval requests (instances)
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  approval_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  request_data JSONB NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'cancelled',
    'escalated'
  )),
  final_decision TEXT CHECK (final_decision IN ('approved', 'rejected')),
  final_comment TEXT,
  decided_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON approval_requests(org_id, status, current_step);
CREATE INDEX IF NOT EXISTS idx_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_requests_approver ON approval_requests(org_id, status) WHERE status IN ('pending', 'in_review');

-- Individual step approvals
CREATE TABLE IF NOT EXISTS approval_step_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  approver_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'delegated',
    'escalated'
  )),
  decision TEXT CHECK (decision IN ('approved', 'rejected')),
  comment TEXT,
  decided_at TIMESTAMPTZ,
  delegated_from UUID,
  delegated_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steps_request ON approval_step_records(request_id, step_order);
CREATE INDEX IF NOT EXISTS idx_steps_pending ON approval_step_records(approver_id, status) WHERE status = 'pending';

-- Approval delegation rules
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  approval_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_delegations_active ON approval_delegations(org_id, delegator_id, approval_type) WHERE is_active = true;

-- Approval audit log
CREATE TABLE IF NOT EXISTS approval_audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL,
  request_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_request ON approval_audit_log(request_id, created_at);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_step_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_workflows" ON approval_workflows
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_requests" ON approval_requests
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_steps" ON approval_step_records
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_delegations" ON approval_delegations
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_audit" ON approval_audit_log
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Default approval workflows
INSERT INTO approval_workflows (org_id, name, approval_type, description, is_active, steps, conditions, created_by)
SELECT 
  o.id,
  'Candidate Submission Approval',
  'candidate_submission',
  'Default candidate submission approval workflow',
  true,
  '[{"step_order": 1, "approver_role": "partner", "approver_id": null, "escalation_hours": 24, "escalation_approver_role": "managing_partner", "is_parallel": false}]',
  '{}',
  o.owner_id
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO approval_workflows (org_id, name, approval_type, description, is_active, steps, conditions, created_by)
SELECT 
  o.id,
  'Offer Approval',
  'offer_approval',
  'Default offer letter approval workflow',
  true,
  '[{"step_order": 1, "approver_role": "partner", "approver_id": null, "escalation_hours": 24, "escalation_approver_role": "managing_partner", "is_parallel": false}]',
  '{}',
  o.owner_id
FROM organizations o
ON CONFLICT DO NOTHING;

-- --- 20260623_background_checks.sql ---

-- Phase 7.4: Background Checks

CREATE TABLE IF NOT EXISTS background_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id),
  check_type text NOT NULL CHECK (check_type IN ('criminal', 'employment', 'education', 'credit', 'drug_screening', 'comprehensive')),
  provider text,
  order_date date,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  result text CHECK (result IN ('clear', 'discrepancy', 'unresolved')),
  result_summary text,
  report_url text,
  ordered_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_background_checks_candidate ON background_checks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_background_checks_status ON background_checks(status);

ALTER TABLE background_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org background checks" ON background_checks
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create background checks" ON background_checks
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update background checks" ON background_checks
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- --- 20260623_bd_pipeline.sql ---

-- Phase 2.8: BD Pipeline (Business Development)
-- Opportunities, activities, proposals, and metrics tables

-- BD opportunities (potential mandates)
CREATE TABLE IF NOT EXISTS bd_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Company info
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'mid_market', 'enterprise', 'mnc')),
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,
  website TEXT,

  -- Contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  primary_contact_title TEXT,
  linkedin_url TEXT,

  -- Opportunity
  stage TEXT NOT NULL DEFAULT 'prospect'
    CHECK (stage IN ('prospect', 'qualified', 'proposal_sent', 'pitch_delivered', 'negotiate', 'signed', 'lost', 'deferred')),
  opportunity_type TEXT CHECK (opportunity_type IN ('retained', 'contingent', 'exclusive', 'non_exclusive')),
  estimated_roles INTEGER DEFAULT 1,
  estimated_fee_total NUMERIC,
  estimated_fee_currency TEXT NOT NULL DEFAULT 'CNY',
  fee_structure TEXT CHECK (fee_structure IN ('percentage', 'fixed', 'retainer_plus_success')),

  -- Ownership
  owner_id UUID NOT NULL,
  team_members UUID[] DEFAULT '{}',

  -- Source
  source TEXT CHECK (source IN ('referral', 'networking', 'inbound', 'cold_outreach', 'repeat_client')),
  source_detail TEXT,

  -- Timeline
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  proposal_sent_at TIMESTAMPTZ,
  pitch_delivered_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  deferred_until DATE,

  -- Outcome
  lost_reason TEXT CHECK (lost_reason IN ('budget', 'timing', 'competitor', 'internal', 'no_response')),
  competitor_firm TEXT,
  notes TEXT,

  -- Link to mandate (when signed)
  mandate_id UUID
);

CREATE INDEX IF NOT EXISTS idx_bd_org_stage ON bd_opportunities(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_bd_owner ON bd_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_bd_company ON bd_opportunities(company_name);
CREATE INDEX IF NOT EXISTS idx_bd_deferred ON bd_opportunities(deferred_until)
  WHERE stage = 'deferred';

-- BD activities (interactions with prospects)
CREATE TABLE IF NOT EXISTS bd_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'lunch', 'networking_event',
    'proposal_sent', 'follow_up', 'note', 'stage_change'
  )),
  description TEXT NOT NULL,
  outcome TEXT,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Linked entities
  contact_id UUID,
  related_document_id UUID
);

CREATE INDEX IF NOT EXISTS idx_bd_activities_opp ON bd_activities(opportunity_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bd_activities_owner ON bd_activities(performed_by, performed_at DESC);

-- BD proposals (documents sent to prospects)
CREATE TABLE IF NOT EXISTS bd_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'superseded')),

  -- Fee details
  fee_structure TEXT,
  fee_amount NUMERIC,
  fee_currency TEXT NOT NULL DEFAULT 'CNY',
  payment_terms TEXT,
  guarantee_period_months INTEGER DEFAULT 3,

  -- Scope
  role_count INTEGER DEFAULT 1,
  scope_description TEXT,
  timeline_weeks INTEGER,

  -- Document
  document_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_opp ON bd_proposals(opportunity_id, version DESC);

-- BD pipeline metrics (computed weekly)
CREATE TABLE IF NOT EXISTS bd_pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Funnel counts
  new_prospects INTEGER NOT NULL DEFAULT 0,
  new_qualified INTEGER NOT NULL DEFAULT 0,
  proposals_sent INTEGER NOT NULL DEFAULT 0,
  pitches_delivered INTEGER NOT NULL DEFAULT 0,
  signed INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,

  -- Conversion rates
  prospect_to_qualified_pct NUMERIC,
  qualified_to_signed_pct NUMERIC,
  overall_win_rate_pct NUMERIC,

  -- Value
  total_pipeline_value NUMERIC,
  signed_value NUMERIC,
  avg_deal_size NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, period_start)
);

-- RLS
ALTER TABLE bd_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_pipeline_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_bd_opps" ON bd_opportunities
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_activities" ON bd_activities
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_proposals" ON bd_proposals
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_metrics" ON bd_pipeline_metrics
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- --- 20260623_benchmark_assessment.sql ---

-- Phase 7.5: BENCHMARK Assessment

CREATE TABLE IF NOT EXISTS benchmark_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_type text NOT NULL CHECK (assessment_type IN ('SHIFT_LEAP', 'SHIFT_QUEST', 'SHIFT_DRIVE', 'SHIFT_COACH', 'SHIFT_IMPACT')),
  benchmark_scope text NOT NULL CHECK (benchmark_scope IN ('industry', 'function', 'seniority', 'custom')),
  industry_filter text[],
  function_filter text[],
  seniority_filter text[],
  team_member_ids uuid[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  results jsonb,
  peer_sample_size int,
  credits_charged int DEFAULT 15,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_benchmark_runs_org ON benchmark_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_status ON benchmark_runs(status);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_type ON benchmark_runs(assessment_type);

ALTER TABLE benchmark_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org benchmark runs" ON benchmark_runs
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create benchmark runs" ON benchmark_runs
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org benchmark runs" ON benchmark_runs
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- --- 20260623_compensation_benchmarking.sql ---

-- Phase 3.8: Compensation Benchmarking Module
-- Benchmarks, data points, and survey imports tables

-- Compensation benchmarks (aggregated market data)
CREATE TABLE IF NOT EXISTS comp_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_title_pattern TEXT NOT NULL,
  industry TEXT,
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,
  level TEXT CHECK (level IN ('junior', 'mid', 'senior', 'executive')),
  currency TEXT NOT NULL DEFAULT 'CNY',

  -- Percentiles (annual total cash compensation)
  p10 NUMERIC,
  p25 NUMERIC,
  p50 NUMERIC,
  p75 NUMERIC,
  p90 NUMERIC,
  mean NUMERIC,

  -- Metadata
  sample_size INTEGER NOT NULL DEFAULT 0,
  data_sources TEXT[] NOT NULL DEFAULT '{}',
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON comp_benchmarks(
  job_title_pattern, industry, country, city
);
CREATE INDEX IF NOT EXISTS idx_benchmarks_org ON comp_benchmarks(org_id);

-- Raw compensation data points (from placements)
CREATE TABLE IF NOT EXISTS comp_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('placement', 'candidate_expectation', 'imported', 'survey')),
  source_id UUID,

  -- Role info
  job_title TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'mid_market', 'enterprise', 'mnc')),
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,

  -- Compensation
  currency TEXT NOT NULL DEFAULT 'CNY',
  base_salary_annual NUMERIC,
  bonus_target_pct NUMERIC,
  equity_value_annual NUMERIC,
  total_cash_annual NUMERIC,

  -- Candidate info (anonymized for privacy)
  experience_years INTEGER,
  education_level TEXT CHECK (education_level IN ('bachelor', 'master', 'phd', 'mba')),

  -- Timestamps
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_points_title ON comp_data_points(job_title, industry, country);
CREATE INDEX IF NOT EXISTS idx_data_points_org ON comp_data_points(org_id);
CREATE INDEX IF NOT EXISTS idx_data_points_date ON comp_data_points(data_date);

-- External survey imports
CREATE TABLE IF NOT EXISTS comp_survey_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  survey_name TEXT NOT NULL,
  survey_year INTEGER NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID,
  row_count INTEGER NOT NULL DEFAULT 0,
  file_path TEXT
);

-- RLS
ALTER TABLE comp_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_survey_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_benchmarks" ON comp_benchmarks
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_data_points" ON comp_data_points
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_surveys" ON comp_survey_imports
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- --- 20260623_kpi_metrics.sql ---

-- Phase 0.7: KPI Definitions & Success Metrics
-- kpi_values + kpi_alerts tables

-- KPI values store (computed metrics)
CREATE TABLE IF NOT EXISTS kpi_values (
  id BIGSERIAL PRIMARY KEY,
  kpi_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  value NUMERIC NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sample_size INTEGER NOT NULL DEFAULT 0,
  UNIQUE(kpi_id, org_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_kpi_values_org ON kpi_values(org_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi ON kpi_values(kpi_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_org_kpi ON kpi_values(org_id, kpi_id, period_start DESC);

ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_kpis" ON kpi_values
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- KPI alerts (threshold breaches)
CREATE TABLE IF NOT EXISTS kpi_alerts (
  id BIGSERIAL PRIMARY KEY,
  kpi_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  current_value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_active ON kpi_alerts(org_id, created_at DESC)
  WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_org ON kpi_alerts(org_id, created_at DESC);

ALTER TABLE kpi_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_alerts" ON kpi_alerts
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_manage_alerts" ON kpi_alerts
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- --- 20260623_notification_foundation.sql ---

-- Phase 7.3: Notification Foundation Migration
-- Centralized notification system with preferences

-- Notifications table (create if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) UNIQUE,
  -- Per notification type preferences: 'email', 'in_app', 'both', 'none'
  feedback_received text DEFAULT 'both',
  candidate_advanced text DEFAULT 'in_app',
  interview_scheduled text DEFAULT 'both',
  new_candidate_added text DEFAULT 'in_app',
  report_ready text DEFAULT 'both',
  reference_submitted text DEFAULT 'both',
  offer_status_changed text DEFAULT 'both',
  milestone_at_risk text DEFAULT 'both',
  message_received text DEFAULT 'both',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Users can view their own preferences
CREATE POLICY "Users can view their preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- --- 20260623_pipl_compliance.sql ---

-- Phase 5.7: PIPL Compliance (China Data Privacy)
-- Consent, residency, cross-border transfers, and data subject rights

-- Consent records (PIPL Articles 14-17)
CREATE TABLE IF NOT EXISTS data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  data_subject_type TEXT NOT NULL CHECK (data_subject_type IN ('candidate', 'client_contact', 'user')),
  data_subject_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN (
    'consent',
    'contract_performance',
    'legal_obligation',
    'public_interest',
    'legitimate_interest'
  )),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT NOT NULL,
  consent_version INTEGER NOT NULL DEFAULT 1,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, data_subject_type, data_subject_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_consents_subject ON data_consents(data_subject_type, data_subject_id);
CREATE INDEX IF NOT EXISTS idx_consents_org ON data_consents(org_id);
CREATE INDEX IF NOT EXISTS idx_consents_expiring ON data_consents(expires_at)
  WHERE expires_at IS NOT NULL AND withdrawn_at IS NULL AND consent_given = true;

-- Data residency tags
CREATE TABLE IF NOT EXISTS data_residency_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'CN',
  is_china_resident BOOLEAN NOT NULL DEFAULT false,
  data_category TEXT NOT NULL DEFAULT 'standard'
    CHECK (data_category IN ('standard', 'sensitive', 'biometric', 'financial', 'minor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_residency_china ON data_residency_tags(is_china_resident)
  WHERE is_china_resident = true;
CREATE INDEX IF NOT EXISTS idx_residency_org ON data_residency_tags(org_id);

-- Cross-border transfer log
CREATE TABLE IF NOT EXISTS cross_border_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  transfer_type TEXT NOT NULL CHECK (transfer_type IN (
    'api_response',
    'backup_replication',
    'analytics_export',
    'manual_export'
  )),
  data_subject_count INTEGER NOT NULL,
  destination_country TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_org ON cross_border_transfers(org_id, created_at DESC);

-- Data subject rights requests (PIPL Chapter IV)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',
    'correction',
    'deletion',
    'portability',
    'withdraw_consent'
  )),
  data_subject_type TEXT NOT NULL,
  data_subject_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  request_details JSONB,
  response_details JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_requests_pending ON data_subject_requests(org_id, status, due_at)
  WHERE status IN ('pending', 'in_progress');

-- RLS
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_residency_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_border_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_consents" ON data_consents
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_residency" ON data_residency_tags
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "service_role_transfers" ON cross_border_transfers
  FOR ALL USING (false);

CREATE POLICY "org_requests" ON data_subject_requests
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- --- 20260623_question_library.sql ---

-- Phase 7.2: Question Library Migration
-- Pre-built question bank organized by competency and difficulty

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Question content
  question_text text NOT NULL,
  competency text NOT NULL CHECK (competency IN (
    'technical', 'leadership', 'communication', 'problem_solving',
    'teamwork', 'cultural_fit', 'strategic_thinking', 'adaptability',
    'decision_making', 'customer_focus', 'innovation', 'execution'
  )),
  difficulty int CHECK (difficulty BETWEEN 1 AND 3),
  expected_answer text,
  follow_up_question text,
  -- Metadata
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  starred_by uuid[] DEFAULT '{}',
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Question sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_competency ON questions(competency);
CREATE INDEX IF NOT EXISTS idx_questions_org ON questions(organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_system ON questions(is_system);
CREATE INDEX IF NOT EXISTS idx_questions_starred ON questions(starred_by);
CREATE INDEX IF NOT EXISTS idx_question_sets_org ON question_sets(organization_id);

-- RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

-- Users can view system questions and their org's questions
CREATE POLICY "Users can view accessible questions" ON questions
  FOR SELECT USING (
    is_system = true
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Users can create questions for their org
CREATE POLICY "Users can create questions" ON questions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own questions
CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Users can delete their own questions
CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Question sets policies
CREATE POLICY "Users can view accessible sets" ON question_sets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create sets" ON question_sets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sets" ON question_sets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own sets" ON question_sets
  FOR DELETE USING (created_by = auth.uid());

-- --- 20260623_referee_system.sql ---

-- Phase 7.1: Referee System Migration
-- Reference checks without friction

-- Reference requests table
CREATE TABLE IF NOT EXISTS reference_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id),
  -- Referee details
  referee_name text NOT NULL,
  referee_email text NOT NULL,
  referee_title text,
  referee_company text,
  referee_relationship text,
  -- Access
  invite_token text UNIQUE NOT NULL,
  invite_url text,
  -- Status
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'reminded', 'submitted', 'expired', 'declined')),
  invited_at timestamptz DEFAULT now(),
  reminded_at timestamptz,
  submitted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Reference responses table
CREATE TABLE IF NOT EXISTS reference_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_request_id uuid REFERENCES reference_requests(id) ON DELETE CASCADE,
  -- Question + answer
  question_number int NOT NULL,
  question_text text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  response_text text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reference_requests_candidate ON reference_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_status ON reference_requests(status);
CREATE INDEX IF NOT EXISTS idx_reference_requests_token ON reference_requests(invite_token);
CREATE INDEX IF NOT EXISTS idx_reference_responses_request ON reference_responses(reference_request_id);

-- RLS policies
ALTER TABLE reference_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_responses ENABLE ROW LEVEL SECURITY;

-- Consultant/org can view all references for their candidates
CREATE POLICY "Consultants can view reference requests" ON reference_requests
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Referees can view/update their own request (via token)
CREATE POLICY "Referee can view own request" ON reference_requests
  FOR SELECT USING (true);

CREATE POLICY "Referee can update own request" ON reference_requests
  FOR UPDATE USING (true);

-- Responses follow request permissions
CREATE POLICY "Responses follow request access" ON reference_responses
  FOR ALL USING (
    reference_request_id IN (
      SELECT id FROM reference_requests
    )
  );

-- --- 20260623_saved_searches.sql ---

-- Phase 2.7: Saved Searches & Talent Alerts

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  search_name TEXT NOT NULL,
  search_description TEXT,
  search_filters JSONB NOT NULL,
  alert_frequency TEXT DEFAULT 'daily',
  alert_threshold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  shared_with_team TEXT,
  last_executed_at TIMESTAMPTZ,
  last_match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Talent alert log
CREATE TABLE IF NOT EXISTS talent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  candidate_id UUID NOT NULL REFERENCES contacts(id),
  alert_type TEXT NOT NULL,
  match_score NUMERIC(5,2),
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared search subscriptions
CREATE TABLE IF NOT EXISTS saved_search_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  notification_preference TEXT DEFAULT 'inherit',
  UNIQUE(saved_search_id, user_id)
);

-- Search execution log
CREATE TABLE IF NOT EXISTS search_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  saved_search_id UUID REFERENCES saved_searches(id),
  search_filters JSONB NOT NULL,
  result_count INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_org ON saved_searches(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_talent_alerts_user ON talent_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_alerts_unviewed ON talent_alerts(user_id) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_search_executions_org ON search_executions(org_id, created_at DESC);

-- RLS policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_executions ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view their saved searches" ON saved_searches
  FOR SELECT USING (
    user_id = auth.uid() OR
    (is_shared = true AND org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create saved searches" ON saved_searches
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their saved searches" ON saved_searches
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can view their talent alerts" ON talent_alerts
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can view their subscriptions" ON saved_search_subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- --- 20260623_sla_tracking.sql ---

-- Phase 3.12: Client SLA & Mandate Timeline Tracking
-- SLA monitoring system for mandate timelines

-- SLA configurations per organization
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_type TEXT NOT NULL,
  milestones JSONB NOT NULL,
  escalation_rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, mandate_type)
);

-- Per-mandate timeline instances
CREATE TABLE IF NOT EXISTS mandate_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  sla_config_id UUID NOT NULL REFERENCES sla_configurations(id),
  start_date TIMESTAMPTZ NOT NULL,
  current_stage TEXT NOT NULL,
  milestones JSONB NOT NULL,
  overall_progress_pct INTEGER DEFAULT 0,
  days_remaining INTEGER,
  health_status TEXT DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA escalations
CREATE TABLE IF NOT EXISTS sla_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  timeline_id UUID NOT NULL REFERENCES mandate_timelines(id),
  escalation_type TEXT NOT NULL,
  milestone_stage TEXT NOT NULL,
  message TEXT NOT NULL,
  notified_roles TEXT[] NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical SLA performance
CREATE TABLE IF NOT EXISTS sla_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_id UUID REFERENCES mandates(id),
  mandate_type TEXT NOT NULL,
  total_duration_days INTEGER,
  stages_completed JSONB,
  sla_met BOOLEAN,
  breached_milestones TEXT[],
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mandate_timelines_org ON mandate_timelines(org_id);
CREATE INDEX IF NOT EXISTS idx_mandate_timelines_health ON mandate_timelines(health_status);
CREATE INDEX IF NOT EXISTS idx_sla_escalations_active ON sla_escalations(org_id) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sla_perf_org ON sla_performance_history(org_id, completed_at DESC);

-- RLS policies
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_performance_history ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view org SLA configs" ON sla_configurations
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create org SLA configs" ON sla_configurations
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org SLA configs" ON sla_configurations
  FOR UPDATE USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org mandate timelines" ON mandate_timelines
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org escalations" ON sla_escalations
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org SLA performance" ON sla_performance_history
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Default SLA configurations
INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'executive_search',
  '[
    {"stage": "discovery", "target_days": 5, "warning_days": 2},
    {"stage": "shortlist", "target_days": 10, "warning_days": 3},
    {"stage": "interviews", "target_days": 14, "warning_days": 3},
    {"stage": "offer", "target_days": 7, "warning_days": 2},
    {"stage": "onboarding", "target_days": 14, "warning_days": 3}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant", "manager"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager", "director"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director", "partner"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'executive_search');

INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'retained',
  '[
    {"stage": "discovery", "target_days": 3, "warning_days": 1},
    {"stage": "shortlist", "target_days": 7, "warning_days": 2},
    {"stage": "interviews", "target_days": 10, "warning_days": 2},
    {"stage": "offer", "target_days": 5, "warning_days": 1},
    {"stage": "onboarding", "target_days": 10, "warning_days": 2}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant", "manager"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager", "director"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director", "partner"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'retained');

INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'contingency',
  '[
    {"stage": "discovery", "target_days": 7, "warning_days": 3},
    {"stage": "shortlist", "target_days": 14, "warning_days": 4},
    {"stage": "interviews", "target_days": 21, "warning_days": 5},
    {"stage": "offer", "target_days": 10, "warning_days": 3},
    {"stage": "onboarding", "target_days": 14, "warning_days": 4}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'contingency');

-- --- 20260623_workflow_automation.sql ---

-- Phase 3.10: Workflow Automation Rules Engine
-- 011_workflow_automation.sql

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'stage_change',
    'score_threshold',
    'time_elapsed',
    'status_change',
    'manual',
    'candidate_created',
    'mandate_created'
  )),
  trigger_config JSONB NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  condition_logic TEXT NOT NULL DEFAULT 'AND' CHECK (condition_logic IN ('AND', 'OR')),
  actions JSONB NOT NULL DEFAULT '[]',
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_org_active ON automation_rules(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rules_trigger ON automation_rules(trigger_type);

-- Rule execution log
CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  trigger_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  actions_executed JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_rule ON rule_executions(rule_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_entity ON rule_executions(entity_type, entity_id, executed_at DESC);

-- Scheduled rule checks (for time-based triggers)
CREATE TABLE IF NOT EXISTS rule_scheduled_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  check_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON rule_scheduled_checks(status, check_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_rule ON rule_scheduled_checks(rule_id, check_at DESC);

-- RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_scheduled_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_rules" ON automation_rules
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_executions" ON rule_executions
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_scheduled" ON rule_scheduled_checks
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
