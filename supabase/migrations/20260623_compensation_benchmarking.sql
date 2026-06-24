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
