
-- >>> 04_20260615_create_audit_logs.sql
20260615_create_audit_logs.sql


-- >>> 04_20260622_advisory_workshops.sql

-- Phase 3.4: Advisory Assessment Engine
-- Workshop and participant management tables

CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('PRISM', 'FORGE', 'SPARK', 'BRIDGE', 'MOSAIC')),
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  scheduled_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  max_participants integer DEFAULT 15,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'launched', 'completed', 'cancelled')),
  allow_report_download boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'completed')),
  responses jsonb,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES workshop_participants(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  dimension_scores jsonb,
  archetype text,
  style text,
  strengths text[],
  development_areas text[],
  recommendations text[],
  raw_analysis text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workshops_org ON workshops(organization_id);
CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop ON workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_token ON workshop_participants(token);
CREATE INDEX IF NOT EXISTS idx_workshop_scores_workshop ON workshop_scores(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_scores_participant ON workshop_scores(participant_id);


-- >>> 05_20260622_client_notifications.sql

-- Phase 3.2: Client Portal Notifications Table
-- Migration for client feedback and notification system

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'feedback_received', 'candidate_advanced', 'interview_scheduled', 'new_candidate_added', 'report_ready'
  title text NOT NULL,
  message text,
  link text, -- deep link to relevant page
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add client_feedback column to candidates_pipeline table for storing feedback
ALTER TABLE IF EXISTS candidates_pipeline
ADD COLUMN IF NOT EXISTS client_feedback jsonb;

-- Add index for client feedback queries
CREATE INDEX IF NOT EXISTS idx_pipeline_client_feedback ON candidates_pipeline((client_feedback->>'decision'));


-- >>> 06_20260622_create_outreach_attempts.sql

CREATE TABLE IF NOT EXISTS outreach_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (
    channel IN (
      'cold_call',
      'wechat_add',
      'email',
      'linkedin_message',
      'phone_call',
      'in_person'
    )
  ),
  attempt_number int NOT NULL DEFAULT 1,
  attempt_date date NOT NULL DEFAULT CURRENT_DATE,
  outcome text CHECK (
    outcome IN (
      'no_response',
      'positive',
      'negative',
      'interested',
      'not_interested',
      'scheduled_interview',
      'referred_other',
      'invalid_contact'
    )
  ),
  response_text text,
  notes text,
  next_action text,
  next_action_date date,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_candidate ON outreach_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_outreach_mandate ON outreach_attempts(mandate_id);
CREATE INDEX IF NOT EXISTS idx_outreach_channel ON outreach_attempts(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_outcome ON outreach_attempts(outcome);
CREATE INDEX IF NOT EXISTS idx_outreach_next_action ON outreach_attempts(next_action_date)
  WHERE next_action_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_created_by ON outreach_attempts(created_by);
CREATE INDEX IF NOT EXISTS idx_outreach_date ON outreach_attempts(attempt_date);


-- >>> 07_20260622_client_notifications.sql
20260622_client_notifications.sql


-- >>> 07_20260622_create_success_profiles.sql

-- Phase 1.2: Success Profile Builder
-- Creates success_profiles table for defining candidate evaluation criteria

CREATE TABLE IF NOT EXISTS success_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  
  -- Experience requirements
  required_experience_years int,
  required_industries text[],
  required_geographies text[],
  required_companies text[],
  deal_size_range text,
  team_size_managed int,
  
  -- Personality / character (DISC-aligned)
  target_disc_profile text,
  personality_indicators jsonb,
  character_requirements jsonb,
  
  -- Background requirements
  education_requirements jsonb,
  certifications text[],
  language_requirements jsonb,
  
  -- Metadata
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  defined_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approval_notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_success_profiles_mandate ON success_profiles(mandate_id);
CREATE INDEX IF NOT EXISTS idx_success_profiles_status ON success_profiles(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS success_profiles_updated_at ON success_profiles;
CREATE TRIGGER success_profiles_updated_at
BEFORE UPDATE ON success_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- >>> 08_20260622_extend_target_companies_market_definition.sql

-- Phase 1.5: Market Definition Enhancement
-- Extend target_companies with mandate linkage, AI overviews, fit scores

-- Add mandate_id to link target companies to specific mandates
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL;

-- Add AI-generated company overview (JSONB)
-- Structure:
-- {
--   "description": "string",
--   "revenue": "string (e.g., '$1B-$5B')",
--   "employee_count": "string (e.g., '5,000-10,000')",
--   "founded": number,
--   "headquarters": "string",
--   "key_products": ["string"],
--   "recent_news": "string (summary)",
--   "generated_at": "timestamp"
-- }
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS company_overview jsonb;

-- Add fit score based on success profile (0-100)
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS fit_score numeric;

-- Add ranking notes for manual adjustments
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS ranking_notes text;

-- Add sector classification for market map grouping
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS sector text;

-- Add region classification for market map grouping
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS region text;

-- Add primary contact at company
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_name text;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_title text;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_linkedin text;

-- Add generation status for tracking AI overview generation
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS overview_status text DEFAULT 'pending'
  CHECK (overview_status IN ('pending', 'generating', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_target_companies_mandate ON target_companies(mandate_id);
CREATE INDEX IF NOT EXISTS idx_target_companies_fit_score ON target_companies(fit_score) WHERE fit_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_sector ON target_companies(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_region ON target_companies(region) WHERE region IS NOT NULL;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS industry TEXT;
CREATE INDEX IF NOT EXISTS idx_target_companies_industry ON target_companies(industry) WHERE industry IS NOT NULL;


-- >>> 09_20260622_interviews.sql

-- Phase 4.3: Interview Management Tables
-- Created: 2026-06-22

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id),
  mandate_id uuid REFERENCES mandates(id),
  
  -- Interview details
  round int NOT NULL CHECK (round BETWEEN 1 AND 5),
  interview_date timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  location text, -- physical address or virtual link
  meeting_link text, -- Zoom/Teams/Meet URL
  
  -- Panel
  panel_members uuid[], -- FK not supported on array columns; enforce at app layer
  
  -- Status
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  
  -- Feedback
  scorecards jsonb, -- [{panelist_id, competency_scores, overall_score, strengths, concerns, recommendation}]
  aggregate_feedback jsonb,
  notes text,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_mandate ON interviews(mandate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Create interview_invitations table for tracking invites
CREATE TABLE IF NOT EXISTS interview_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES contacts(id),
  sent_at timestamptz,
  opened_at timestamptz,
  confirmed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'confirmed', 'declined')),
  email_subject text,
  email_body text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for interview invitations
CREATE INDEX IF NOT EXISTS idx_invitation_interview ON interview_invitations(interview_id);
CREATE INDEX IF NOT EXISTS idx_invitation_candidate ON interview_invitations(candidate_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to interviews table
DROP TRIGGER IF EXISTS interviews_updated_at ON interviews;
CREATE TRIGGER interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply trigger to interview_invitations table
DROP TRIGGER IF EXISTS invitations_updated_at ON interview_invitations;
CREATE TRIGGER invitations_updated_at
BEFORE UPDATE ON interview_invitations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Round to stage mapping view
CREATE OR REPLACE VIEW interview_stage_mapping AS
SELECT
  id,
  round,
  CASE
    WHEN round = 1 THEN 'interview_1'
    WHEN round = 2 THEN 'interview_2'
    WHEN round = 3 THEN 'interview_3'
    WHEN round >= 4 THEN 'final_interview'
  END AS next_stage,
  CASE
    WHEN round = 1 THEN 'Interview 1'
    WHEN round = 2 THEN 'Interview 2'
    WHEN round = 3 THEN 'Interview 3'
    WHEN round >= 4 THEN 'Final Interview'
  END AS round_label
FROM interviews;


-- >>> 10_20260622_create_success_profiles.sql
20260622_create_success_profiles.sql


-- >>> 10_20260622_mandate_solutions.sql

-- Phase 3.3: Solution Definition Module
-- Creates mandate_solutions table for HR business solutions

CREATE TABLE IF NOT EXISTS mandate_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  solution_type text NOT NULL CHECK (solution_type IN (
    'succession', 'assessment', 'diagnostics', 'density', 'org_design', 'role_definition'
  )),
  solution_detail jsonb,
  linked_assessment_type text CHECK (linked_assessment_type IN (
    'prism', 'forge', 'spark', 'bridge', 'mosaic', 
    'shift_leap', 'shift_quest', 'shift_drive', 'shift_coach', 'shift_impact'
  )),
  linked_assessment_id uuid,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  defined_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approval_notes text,
  rejection_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandate_solutions_mandate ON mandate_solutions(mandate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_solutions_status ON mandate_solutions(status);
CREATE INDEX IF NOT EXISTS idx_mandate_solutions_type ON mandate_solutions(solution_type);


-- >>> 11_20260622_milestones.sql

-- Phase 4.4: Engagement Timeline Tracker (Methodology Step 8)
-- Add milestones JSONB column to mandates table

ALTER TABLE mandates ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN mandates.milestones IS 'JSONB object containing milestone definitions with target dates, actual dates, and status';

-- Create index for querying mandates with at-risk or overdue milestones
CREATE INDEX IF NOT EXISTS idx_mandates_has_milestones ON mandates ((milestones IS NOT NULL AND milestones != '{}'::jsonb));

-- milestones structure example:
-- {
--   "intake_complete": { "target_date": "2026-07-01", "actual_date": "2026-07-02", "status": "completed" },
--   "solution_defined": { "target_date": "2026-07-08", "actual_date": null, "status": "on_track" },
--   "jd_approved": { "target_date": "2026-07-15", "actual_date": null, "status": "pending" },
--   "market_defined": { "target_date": "2026-07-22", "actual_date": null, "status": "pending" },
--   "longlist_ready": { "target_date": "2026-08-05", "actual_date": null, "status": "pending" },
--   "shortlist_ready": { "target_date": "2026-08-19", "actual_date": null, "status": "pending" },
--   "client_presentation": { "target_date": "2026-08-26", "actual_date": null, "status": "pending" },
--   "first_interview": { "target_date": "2026-09-09", "actual_date": null, "status": "pending" },
--   "offer_extended": { "target_date": "2026-09-30", "actual_date": null, "status": "pending" },
--   "placement": { "target_date": "2026-10-14", "actual_date": null, "status": "pending" }
-- }

-- Milestone statuses:
-- pending, on_track, at_risk, overdue, completed, completed_late

-- Helper function to get milestone status
CREATE OR REPLACE FUNCTION get_milestone_status(
  target_date timestamptz,
  actual_date timestamptz,
  check_date timestamptz DEFAULT now()
) RETURNS text AS $$
DECLARE
  days_until_due integer;
BEGIN
  -- If completed, check if on time or late
  IF actual_date IS NOT NULL THEN
    IF actual_date <= target_date THEN
      RETURN 'completed';
    ELSE
      RETURN 'completed_late';
    END IF;
  END IF;

  -- Calculate days until due
  days_until_due := (target_date::date - check_date::date);

  IF days_until_due < 0 THEN
    RETURN 'overdue';
  ELSIF days_until_due <= 7 THEN
    RETURN 'at_risk';
  ELSE
    RETURN 'on_track';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to initialize milestones with default SLA targets
CREATE OR REPLACE FUNCTION initialize_milestones(mandate_created_at timestamptz) RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}'::jsonb;
BEGIN
  result := jsonb_build_object(
    'intake_complete', jsonb_build_object(
      'target_date', (mandate_created_at + interval '7 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'solution_defined', jsonb_build_object(
      'target_date', (mandate_created_at + interval '14 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'jd_approved', jsonb_build_object(
      'target_date', (mandate_created_at + interval '21 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'market_defined', jsonb_build_object(
      'target_date', (mandate_created_at + interval '28 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'longlist_ready', jsonb_build_object(
      'target_date', (mandate_created_at + interval '42 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'shortlist_ready', jsonb_build_object(
      'target_date', (mandate_created_at + interval '56 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'client_presentation', jsonb_build_object(
      'target_date', (mandate_created_at + interval '63 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'first_interview', jsonb_build_object(
      'target_date', (mandate_created_at + interval '77 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'offer_extended', jsonb_build_object(
      'target_date', (mandate_created_at + interval '98 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'placement', jsonb_build_object(
      'target_date', (mandate_created_at + interval '112 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for mandates with computed milestone statuses
CREATE OR REPLACE VIEW mandate_milestone_status AS
SELECT
  m.id,
  m.title,
  m.status as mandate_status,
  m.created_at,
  m.milestones,
  -- Count of milestones by status
  (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each_text(
      COALESCE(m.milestones, '{}'::jsonb)::jsonb
    )
    WHERE key = 'status'
  ) as milestone_statuses,
  -- Check if any milestone is at_risk or overdue
  (
    SELECT bool_or(
      CASE
        WHEN (value->>'status') IN ('at_risk', 'overdue') THEN true
        ELSE false
      END
    )
    FROM jsonb_each_text(COALESCE(m.milestones, '{}'::jsonb))
  ) as has_at_risk_milestones
FROM mandates m;

-- Trigger to auto-initialize milestones on mandate creation
CREATE OR REPLACE FUNCTION set_default_milestones()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.milestones IS NULL OR NEW.milestones = '{}'::jsonb THEN
    NEW.milestones := initialize_milestones(NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment the following line to enable auto-initialization on mandate creation
-- CREATE TRIGGER tr_mandates_set_default_milestones
--   BEFORE INSERT OR UPDATE ON mandates
--   FOR EACH ROW
--   EXECUTE FUNCTION set_default_milestones();


-- >>> 12_20260622_ml_models.sql

-- Phase 6.1: Predictive Matching
-- ML models table for storing trained model weights

CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model metadata
  model_type text NOT NULL, -- e.g., 'predictive_matching', 'candidate_ranking'
  model_version text NOT NULL, -- e.g., 'v1.0', 'v2.1'
  description text,
  
  -- Model parameters (JSONB for flexibility)
  weights jsonb NOT NULL, -- array of feature weights
  bias float NOT NULL DEFAULT 0,
  feature_names jsonb NOT NULL, -- array of feature names in order
  
  -- Training metrics
  accuracy float, -- overall accuracy on test set
  precision_score float,
  recall_score float,
  f1_score float,
  roc_auc_score float,
  training_samples integer NOT NULL,
  test_samples integer,
  
  -- Training data range
  training_start_date date,
  training_end_date date,
  trained_at timestamptz NOT NULL DEFAULT now(),
  
  -- Status
  is_active boolean DEFAULT false,
  is_deployed boolean DEFAULT false,
  
  -- Feature engineering info
  feature_engineering_config jsonb, -- normalization params, encoding info
  
  -- Validation
  validation_results jsonb, -- cross-validation results
  
  -- Metadata
  organization_id uuid REFERENCES organizations(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_model_version UNIQUE (model_type, model_version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ml_models_deployed ON ml_models(is_deployed) WHERE is_deployed = true;
CREATE INDEX IF NOT EXISTS idx_ml_models_org ON ml_models(organization_id);

-- Comments
COMMENT ON TABLE ml_models IS 'Trained ML models stored with weights and metadata';
COMMENT ON COLUMN ml_models.weights IS 'JSON array of feature weights for prediction';
COMMENT ON COLUMN ml_models.feature_names IS 'JSON array of feature names corresponding to weights';
COMMENT ON COLUMN ml_models.feature_engineering_config IS 'Normalization params, encodings, etc.';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ml_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_ml_models_updated_at
  BEFORE UPDATE ON ml_models
  FOR EACH ROW
  EXECUTE FUNCTION update_ml_models_updated_at();

-- Table for prediction logs (audit trail)
CREATE TABLE IF NOT EXISTS prediction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Prediction context
  model_id uuid REFERENCES ml_models(id),
  candidate_id uuid REFERENCES contacts(id),
  mandate_id uuid REFERENCES mandates(id),
  
  -- Input features (for debugging/re-training)
  features jsonb NOT NULL,
  
  -- Prediction output
  raw_score float NOT NULL, -- 0-1 probability
  final_score integer NOT NULL, -- 0-100 rounded score
  
  -- Override tracking
  consultant_override boolean DEFAULT false,
  override_score integer,
  override_reason text,
  overridden_by uuid REFERENCES profiles(id),
  
  -- Timing
  predicted_at timestamptz NOT NULL DEFAULT now(),
  
  -- Outcome (filled later for validation)
  actual_outcome boolean, -- null until outcome known
  outcome_recorded_at timestamptz
);

-- Indexes for prediction logs
CREATE INDEX IF NOT EXISTS idx_prediction_logs_candidate ON prediction_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_mandate ON prediction_logs(mandate_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_model ON prediction_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_date ON prediction_logs(predicted_at);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_outcome ON prediction_logs(actual_outcome) WHERE actual_outcome IS NOT NULL;

-- Comments
COMMENT ON TABLE prediction_logs IS 'Audit trail for all ML predictions';
COMMENT ON COLUMN prediction_logs.features IS 'Feature vector used for prediction';
COMMENT ON COLUMN prediction_logs.actual_outcome IS 'True if candidate was ultimately placed';

-- Function to check data availability (500+ placements)
CREATE OR REPLACE FUNCTION check_placement_count()
RETURNS TABLE(has_sufficient_data boolean, placement_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) >= 500 AS has_sufficient_data,
    COUNT(*)::bigint AS placement_count
  FROM candidates_pipeline
  WHERE stage IN ('offer_accepted', 'onboarded', 'probation_passed');
END;
$$ LANGUAGE plpgsql;

-- View for model performance over time
CREATE OR REPLACE VIEW ml_model_performance AS
SELECT 
  m.id,
  m.model_type,
  m.model_version,
  m.accuracy,
  m.precision_score,
  m.recall_score,
  m.f1_score,
  m.trained_at,
  m.training_samples,
  m.is_active,
  -- Prediction accuracy from logs (if available)
  COALESCE(
    (SELECT 
      COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM prediction_logs pl2 WHERE pl2.model_id = m.id), 0)
     FROM prediction_logs pl
     WHERE pl.model_id = m.id
       AND pl.actual_outcome IS NOT NULL
       AND (
         (pl.final_score >= 50 AND pl.actual_outcome = true) OR
         (pl.final_score < 50 AND pl.actual_outcome = false)
       )
    ), m.accuracy
  ) AS actual_accuracy
FROM ml_models m
ORDER BY m.trained_at DESC;

-- Helper function to get latest active model
CREATE OR REPLACE FUNCTION get_latest_model(p_model_type text)
RETURNS ml_models AS $$
DECLARE
  latest_model ml_models;
BEGIN
  SELECT * INTO latest_model
  FROM ml_models
  WHERE model_type = p_model_type AND is_active = true
  ORDER BY trained_at DESC
  LIMIT 1;
  
  RETURN latest_model;
END;
$$ LANGUAGE plpgsql;


-- >>> 13_20260622_interviews.sql
20260622_interviews.sql


-- >>> 13_20260622_offers.sql

-- Phase 4.5: Offer + Onboarding + Post-Placement
-- Create offers table for managing employment offers

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  
  -- Position details
  position_title text NOT NULL,
  start_date date NOT NULL,
  compensation jsonb, -- {base_salary, bonus, equity, benefits}
  conditions text, -- background check, references, etc.
  expiration_date date,
  
  -- Approval workflow
  status text DEFAULT 'draft' CHECK (status IN (
    'draft', 
    'pending_partner_approval', 
    'pending_client_approval', 
    'sent', 
    'accepted', 
    'rejected', 
    'withdrawn',
    'onboarding',
    'active',
    'probation',
    'completed'
  )),
  
  -- Approvals
  created_by uuid REFERENCES profiles(id),
  partner_approved_by uuid REFERENCES profiles(id),
  partner_approval_notes text,
  client_approved_by uuid, -- client user ID from client_users table
  client_approval_notes text,
  client_rejection_reason text,
  partner_rejection_reason text,
  
  -- Timing
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES profiles(id),
  
  -- Onboarding
  onboarding_checklist jsonb DEFAULT '[]'::jsonb, -- [{task, completed, completed_at, completed_by, notes}]
  onboarding_completed_at timestamptz,
  
  -- Post-placement follow-up
  follow_up_1m_sent boolean DEFAULT false,
  follow_up_1m_at timestamptz,
  follow_up_3m_sent boolean DEFAULT false,
  follow_up_3m_at timestamptz,
  follow_up_6m_sent boolean DEFAULT false,
  follow_up_6m_at timestamptz,
  follow_up_1m_response text,
  follow_up_3m_response text,
  follow_up_6m_response text,
  
  -- Probation
  probation_end_date date,
  probation_status text DEFAULT 'pending' CHECK (probation_status IN ('pending', 'passed', 'extended', 'failed')),
  probation_notes text,
  probation_extended_to date,
  
  -- Additional fields
  cover_letter text,
  additional_notes text,
  offer_letter_url text, -- URL to generated PDF offer letter
  
  -- Metadata
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_candidate ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_mandate ON offers(mandate_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_start_date ON offers(start_date);
CREATE INDEX IF NOT EXISTS idx_offers_probation_end ON offers(probation_end_date);
CREATE INDEX IF NOT EXISTS idx_offers_followup_1m ON offers(follow_up_1m_sent) WHERE follow_up_1m_sent = false;
CREATE INDEX IF NOT EXISTS idx_offers_followup_3m ON offers(follow_up_3m_sent) WHERE follow_up_3m_sent = false;
CREATE INDEX IF NOT EXISTS idx_offers_followup_6m ON offers(follow_up_6m_sent) WHERE follow_up_6m_sent = false;

-- Comments
COMMENT ON TABLE offers IS 'Employment offers with approval workflow, onboarding, and post-placement follow-up';
COMMENT ON COLUMN offers.compensation IS 'JSON: {base_salary, bonus, bonus_percentage, equity, benefits, total_compensation}';
COMMENT ON COLUMN offers.onboarding_checklist IS 'JSON array: [{task, category, completed, completed_at, completed_by, notes}]';
COMMENT ON COLUMN offers.status IS 'draft -> pending_partner_approval -> pending_client_approval -> sent -> accepted/rejected -> onboarding -> active -> probation -> completed';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to generate default onboarding checklist
CREATE OR REPLACE FUNCTION generate_onboarding_checklist()
RETURNS jsonb AS $$
BEGIN
  RETURN '[
    {
      "task": "Signed offer letter received",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    },
    {
      "task": "Background check initiated",
      "category": "verification",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 5
    },
    {
      "task": "References verified",
      "category": "verification",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "Employment contract signed",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "NDA signed",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "IT accounts created",
      "category": "setup",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Equipment delivered/setup",
      "category": "setup",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Welcome email sent",
      "category": "communication",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "First day agenda prepared",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Team introduction scheduled",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    },
    {
      "task": "Buddy/mentor assigned",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 5
    },
    {
      "task": "Orientation schedule confirmed",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    }
  ]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- View for offers with candidate and mandate info
CREATE OR REPLACE VIEW offers_with_details AS
SELECT 
  o.*,
  c.first_name as candidate_first_name,
  c.last_name as candidate_last_name,
  c.email as candidate_email,
  c.phone as candidate_phone,
  c.current_title as candidate_title,
  c.current_company as candidate_company,
  m.title as mandate_title,
  m.client_id,
  cl.company_name as client_name,
  cl.first_name as client_first_name,
  cl.last_name as client_last_name,
  p.name as created_by_name,
  p.email as created_by_email,
  pp.name as partner_approved_by_name,
  org.name as organization_name
FROM offers o
LEFT JOIN contacts c ON o.candidate_id = c.id
LEFT JOIN mandates m ON o.mandate_id = m.id
LEFT JOIN clients cl ON m.client_id = cl.id
LEFT JOIN profiles p ON o.created_by = p.id
LEFT JOIN profiles pp ON o.partner_approved_by = pp.id
LEFT JOIN organizations org ON o.organization_id = org.id;

-- View for onboarding task progress
CREATE OR REPLACE VIEW onboarding_progress AS
SELECT 
  o.id as offer_id,
  o.position_title,
  c.first_name || ' ' || c.last_name as candidate_name,
  o.start_date,
  o.onboarding_checklist,
  jsonb_array_length(o.onboarding_checklist) as total_tasks,
  jsonb_array_length(o.onboarding_checklist) - 
    jsonb_array_length(o.onboarding_checklist) as completed_tasks,
  ROUND(
    (jsonb_array_length(o.onboarding_checklist) - 
      jsonb_array_length(o.onboarding_checklist))::numeric / 
    NULLIF(jsonb_array_length(o.onboarding_checklist), 0) * 100
  , 0) as completion_percentage
FROM offers o
LEFT JOIN contacts c ON o.candidate_id = c.id;

