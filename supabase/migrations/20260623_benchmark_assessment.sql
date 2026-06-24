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