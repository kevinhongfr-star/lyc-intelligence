-- Opportunities & BD Pipeline Tables
-- Business Development pipeline tracking for BD Managers

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  stage TEXT NOT NULL DEFAULT 'prospect',
  estimated_fee_usd INTEGER,
  probability INTEGER DEFAULT 10,
  fee_type TEXT DEFAULT 'contingency',
  bd_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT,
  source_detail TEXT,
  first_contact_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  next_action TEXT,
  closed_at TIMESTAMPTZ,
  closed_reason TEXT,
  converted_to_mandate_id UUID REFERENCES mandates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  summary TEXT,
  details TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_activities ENABLE ROW LEVEL SECURITY;

-- Opportunities RLS
CREATE POLICY opp_read ON opportunities
  FOR SELECT
  USING (
    bd_owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY opp_insert ON opportunities
  FOR INSERT
  WITH CHECK (bd_owner_id = auth.uid());

CREATE POLICY opp_update ON opportunities
  FOR UPDATE
  USING (
    bd_owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Opportunity Activities RLS
CREATE POLICY opp_activity_read ON opportunity_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_id AND (
        o.bd_owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY opp_activity_insert ON opportunity_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_id AND o.bd_owner_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_opportunities_bd_owner ON opportunities(bd_owner_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opp_activities_opportunity ON opportunity_activities(opportunity_id);
CREATE INDEX idx_opp_activities_occurred ON opportunity_activities(occurred_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunities_updated_at();

-- Add subtype to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subtype') THEN
    ALTER TABLE profiles ADD COLUMN subtype TEXT DEFAULT 'consultant';
  END IF;
END $$;

COMMENT ON TABLE opportunities IS 'Business development pipeline / sales opportunities';
COMMENT ON COLUMN opportunities.stage IS 'Pipeline stage: prospect, meeting_booked, meeting_done, proposal_sent, negotiation, won, lost';
COMMENT ON COLUMN opportunities.probability IS 'Win probability percentage (0-100)';
COMMENT ON TABLE opportunity_activities IS 'Activity log entries for BD opportunities (calls, meetings, emails, notes)';
