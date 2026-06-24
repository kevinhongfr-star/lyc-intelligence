-- Team Lead / Partner Portal Tables
-- Approvals, SLA tracking, team assignments

CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_lead_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consultant_id, is_active)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
  candidate_id TEXT,
  requester_id UUID REFERENCES profiles(id),
  approver_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  request_data JSONB DEFAULT '{}'::jsonb,
  reviewer_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mandate_slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE UNIQUE,
  shortlist_due_at TIMESTAMPTZ,
  interview_due_at TIMESTAMPTZ,
  offer_due_at TIMESTAMPTZ,
  fill_due_at TIMESTAMPTZ,
  sla_status TEXT DEFAULT 'on_track',
  days_to_next_milestone INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_slas ENABLE ROW LEVEL SECURITY;

-- Team Assignments RLS
CREATE POLICY team_assign_read ON team_assignments
  FOR SELECT
  USING (
    team_lead_id = auth.uid() OR
    consultant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY team_assign_admin ON team_assignments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Approval Requests RLS
CREATE POLICY approval_read ON approval_requests
  FOR SELECT
  USING (
    requester_id = auth.uid() OR
    approver_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY approval_insert ON approval_requests
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY approval_update ON approval_requests
  FOR UPDATE
  USING (
    approver_id = auth.uid() OR
    requester_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Mandate SLAs RLS
CREATE POLICY sla_read ON mandate_slas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mandates m
      WHERE m.id = mandate_id AND (
        m.consultant_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM team_assignments ta WHERE ta.consultant_id = m.consultant_id AND ta.team_lead_id = auth.uid())
      )
    )
  );

CREATE POLICY sla_update ON mandate_slas
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX idx_team_assignments_lead ON team_assignments(team_lead_id) WHERE is_active;
CREATE INDEX idx_team_assignments_consultant ON team_assignments(consultant_id) WHERE is_active;
CREATE INDEX idx_approvals_approver ON approval_requests(approver_id) WHERE status = 'pending';
CREATE INDEX idx_approvals_requester ON approval_requests(requester_id);
CREATE INDEX idx_approvals_status ON approval_requests(status);
CREATE INDEX idx_sla_status ON mandate_slas(sla_status);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_approval_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_approval_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_updated_at();

CREATE OR REPLACE FUNCTION update_sla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sla_updated_at
  BEFORE UPDATE ON mandate_slas
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();

COMMENT ON TABLE approval_requests IS 'Approval workflow for success profiles, offer terms, SLA waivers, fee adjustments';
COMMENT ON COLUMN approval_requests.request_type IS 'success_profile, offer_terms, sla_waiver, fee_adjustment';
COMMENT ON TABLE mandate_slas IS 'SLA tracking per mandate with milestone deadlines and status';
COMMENT ON TABLE team_assignments IS 'Maps consultants to team leads for management and reporting';
