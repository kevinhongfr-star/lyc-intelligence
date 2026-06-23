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