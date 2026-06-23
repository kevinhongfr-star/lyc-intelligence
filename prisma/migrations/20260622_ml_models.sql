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
