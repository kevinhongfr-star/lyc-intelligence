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