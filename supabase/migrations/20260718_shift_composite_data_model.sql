-- ────────────────────────────────────────────────────────────────────────────
-- SHIFT Composite Data Model — Psychological Assessment System
-- Issue #18: Online Assessment Platform
-- ────────────────────────────────────────────────────────────────────────────

-- SHIFT Assessment Templates (admin-defined assessment structures)
CREATE TABLE IF NOT EXISTS shift_assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  dimensions JSONB NOT NULL DEFAULT '[]', -- [{name, description, weight, facets: [{name, weight}]}]
  scoring_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- SHIFT Assessment Items (questions/tasks)
CREATE TABLE IF NOT EXISTS shift_assessment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES shift_assessment_templates(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL, -- maps to dimension name in template
  facet TEXT, -- optional facet within dimension
  item_type TEXT NOT NULL DEFAULT 'likert', -- likert, forced_choice, slider, open_text, scenario
  item_text TEXT NOT NULL,
  item_description TEXT,
  options JSONB, -- for likert: [{value, label}], for forced_choice: [{value, label}]
  scoring_key JSONB, -- {correct_option, dimension_scores: {}}
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SHIFT Assessment Instances (user assessment sessions)
CREATE TABLE IF NOT EXISTS shift_assessment_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES shift_assessment_templates(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, expired
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  proctoring_data JSONB, -- browser lock, tab switches, etc.
  device_info JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, template_id, id) -- allows multiple attempts per user
);

-- SHIFT Assessment Responses (individual item responses)
CREATE TABLE IF NOT EXISTS shift_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES shift_assessment_instances(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES shift_assessment_items(id),
  response_value JSONB NOT NULL, -- {selected: value, text: "...", confidence: 0.8}
  response_time_ms INTEGER,
  is_correct BOOLEAN,
  dimension_score NUMERIC(5,2) DEFAULT 0,
  facet_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instance_id, item_id)
);

-- SHIFT Dimension Scores (aggregated results per dimension)
CREATE TABLE IF NOT EXISTS shift_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES shift_assessment_instances(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  raw_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentile NUMERIC(5,2), -- normalized against cohort
  stanine INTEGER, -- 1-9 standardized score
  confidence_interval_low NUMERIC(5,2),
  confidence_interval_high NUMERIC(5,2),
  facet_scores JSONB DEFAULT '{}', -- {facet_name: score}
  interpretation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instance_id, dimension)
);

-- SHIFT Composite Profiles (overall assessment results for a user)
CREATE TABLE IF NOT EXISTS shift_composite_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES shift_assessment_instances(id) ON DELETE SET NULL,
  composite_score NUMERIC(5,2), -- overall composite
  leadership_style TEXT, -- derived archetype
  strengths JSONB DEFAULT '[]', -- top 3 dimension names
  development_areas JSONB DEFAULT '[]', -- bottom 2 dimension names
  career_trajectory_prediction JSONB, -- {recommended_roles: [], industries: []}
  coaching_recommendations JSONB DEFAULT '[]',
  benchmark_cohort TEXT, -- e.g., "C-suite Tech", "VP Finance"
  benchmark_percentile NUMERIC(5,2),
  is_valid BOOLEAN DEFAULT true, -- false if suspicious response patterns
  validity_flags JSONB DEFAULT '[]', -- [{flag: "inconsistent_responses", severity: "moderate"}]
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- profiles expire after 2 years
  UNIQUE(user_id, instance_id)
);

-- SHIFT Norm Groups (benchmarking populations)
CREATE TABLE IF NOT EXISTS shift_norm_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cohort_definition JSONB NOT NULL, -- {role_levels: [], industries: [], geos: []}
  sample_size INTEGER DEFAULT 0,
  dimension_means JSONB DEFAULT '{}', -- {dimension: mean}
  dimension_sds JSONB DEFAULT '{}', -- {dimension: standard_deviation}
  percentiles JSONB DEFAULT '{}', -- {dimension: {1: score, 5: score, ...}}
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- SHIFT Item Bank (master item repository for adaptive testing)
CREATE TABLE IF NOT EXISTS shift_item_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension TEXT NOT NULL,
  facet TEXT,
  item_type TEXT NOT NULL,
  item_text TEXT NOT NULL,
  options JSONB,
  difficulty NUMERIC(3,2), -- IRT difficulty parameter
  discrimination NUMERIC(3,2), -- IRT discrimination
  guessing_parameter NUMERIC(3,2), -- IRT guessing (3PL)
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SHIFT Adaptive Test Sessions (CAT algorithm state)
CREATE TABLE IF NOT EXISTS shift_adaptive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES shift_assessment_instances(id) ON DELETE CASCADE,
  current_dimension TEXT,
  current_ability_estimate NUMERIC(5,2) DEFAULT 0,
  standard_error NUMERIC(5,2) DEFAULT 1,
  items_administered INTEGER DEFAULT 0,
  next_item_id UUID REFERENCES shift_item_bank(id),
  termination_reason TEXT, -- "precision_reached", "max_items", "time_expired"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shift_instances_user ON shift_assessment_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_instances_status ON shift_assessment_instances(status);
CREATE INDEX IF NOT EXISTS idx_shift_responses_instance ON shift_assessment_responses(instance_id);
CREATE INDEX IF NOT EXISTS idx_shift_dimension_instance ON shift_dimension_scores(instance_id);
CREATE INDEX IF NOT EXISTS idx_shift_profiles_user ON shift_composite_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_items_template ON shift_assessment_items(template_id);

-- Row Level Security
ALTER TABLE shift_assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assessment_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_composite_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY shift_templates_admin ON shift_assessment_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY shift_instances_own ON shift_assessment_instances
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY shift_responses_own ON shift_assessment_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shift_assessment_instances WHERE id = instance_id AND user_id = auth.uid())
  );

CREATE POLICY shift_scores_own ON shift_dimension_scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shift_assessment_instances WHERE id = instance_id AND user_id = auth.uid())
  );

CREATE POLICY shift_profiles_own ON shift_composite_profiles
  FOR ALL USING (user_id = auth.uid());

-- Trigger: Update timestamp
CREATE OR REPLACE FUNCTION update_shift_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shift_templates_updated
  BEFORE UPDATE ON shift_assessment_templates
  FOR EACH ROW EXECUTE FUNCTION update_shift_timestamp();

CREATE TRIGGER shift_instances_updated
  BEFORE UPDATE ON shift_assessment_instances
  FOR EACH ROW EXECUTE FUNCTION update_shift_timestamp();

-- Function: Calculate dimension scores from responses
CREATE OR REPLACE FUNCTION calculate_dimension_scores(p_instance_id UUID)
RETURNS void AS $$
DECLARE
  v_dimension TEXT;
  v_score NUMERIC;
BEGIN
  FOR v_dimension IN
    SELECT DISTINCT dimension FROM shift_assessment_items
    WHERE id IN (SELECT item_id FROM shift_assessment_responses WHERE instance_id = p_instance_id)
  LOOP
    SELECT COALESCE(SUM(r.dimension_score), 0) / NULLIF(COUNT(*), 0)
    INTO v_score
    FROM shift_assessment_responses r
    JOIN shift_assessment_items i ON i.id = r.item_id
    WHERE r.instance_id = p_instance_id AND i.dimension = v_dimension;

    INSERT INTO shift_dimension_scores (instance_id, dimension, raw_score)
    VALUES (p_instance_id, v_dimension, v_score)
    ON CONFLICT (instance_id, dimension) DO UPDATE SET raw_score = v_score, updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed: Default assessment template (Leadership Composite)
INSERT INTO shift_assessment_templates (id, name, description, version, dimensions) VALUES
('00000000-0000-0000-0000-000000000001', 'Executive Leadership Assessment', 'Comprehensive leadership assessment covering strategic, operational, and interpersonal dimensions.', 1,
'[
  {"name": "Strategic Thinking", "weight": 0.25, "facets": [{"name": "Vision", "weight": 0.4}, {"name": "Analysis", "weight": 0.3}, {"name": "Decision Making", "weight": 0.3}]},
  {"name": "Operational Excellence", "weight": 0.20, "facets": [{"name": "Execution", "weight": 0.4}, {"name": "Resource Management", "weight": 0.3}, {"name": "Process Optimization", "weight": 0.3}]},
  {"name": "People Leadership", "weight": 0.20, "facets": [{"name": "Team Building", "weight": 0.35}, {"name": "Communication", "weight": 0.35}, {"name": "Conflict Resolution", "weight": 0.3}]},
  {"name": "Innovation", "weight": 0.15, "facets": [{"name": "Creativity", "weight": 0.4}, {"name": "Risk Taking", "weight": 0.3}, {"name": "Adaptability", "weight": 0.3}]},
  {"name": "Emotional Intelligence", "weight": 0.10, "facets": [{"name": "Self-Awareness", "weight": 0.35}, {"name": "Empathy", "weight": 0.35}, {"name": "Social Skills", "weight": 0.3}]},
  {"name": "Drive", "weight": 0.10, "facets": [{"name": "Achievement", "weight": 0.4}, {"name": "Persistence", "weight": 0.35}, {"name": "Ambition", "weight": 0.25}]}
]')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON shift_assessment_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON shift_assessment_instances TO authenticated;
GRANT SELECT, INSERT ON shift_assessment_responses TO authenticated;
GRANT SELECT ON shift_dimension_scores TO authenticated;
GRANT SELECT ON shift_composite_profiles TO authenticated;