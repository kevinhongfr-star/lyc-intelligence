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
