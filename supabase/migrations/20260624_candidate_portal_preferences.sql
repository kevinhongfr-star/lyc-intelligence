-- Candidate Preferences Table
-- Stores candidate career preferences, availability, and profile settings

CREATE TABLE IF NOT EXISTS candidate_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  target_geographies TEXT[] DEFAULT '{}',
  target_industries TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'exploring',
  preferred_contact TEXT DEFAULT 'email',
  linkedin_url TEXT,
  open_to_relocate BOOLEAN DEFAULT false,
  min_compensation_usd INTEGER,
  short_term_goals TEXT,
  long_term_goals TEXT,
  profile_visibility TEXT DEFAULT 'lyc_network',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE candidate_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_own_preferences_read ON candidate_preferences
  FOR SELECT
  USING (candidate_id = auth.uid());

CREATE POLICY candidate_own_preferences_insert ON candidate_preferences
  FOR INSERT
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY candidate_own_preferences_update ON candidate_preferences
  FOR UPDATE
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY candidate_own_preferences_delete ON candidate_preferences
  FOR DELETE
  USING (candidate_id = auth.uid());

-- Candidate Pipeline RLS - candidates can only see their own pipeline entries
CREATE POLICY IF NOT EXISTS candidate_own_pipeline_select ON candidates_pipeline
  FOR SELECT
  USING (candidate_id = auth.uid());

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_candidate_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_preferences_updated_at
  BEFORE UPDATE ON candidate_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_preferences_updated_at();

COMMENT ON TABLE candidate_preferences IS 'Career preferences and availability settings for candidate users';
COMMENT ON COLUMN candidate_preferences.profile_visibility IS 'Who can view the candidate profile: lyc_network, clients, private';
