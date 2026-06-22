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
  panel_members uuid[] REFERENCES profiles(id),
  
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
