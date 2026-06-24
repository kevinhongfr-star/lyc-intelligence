-- Phase 4.6: Post-Placement & Alumni Tracking
-- Alumni lifecycle management system

-- Alumni records (placed candidates)
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES contacts(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  placement_mandate_id UUID NOT NULL REFERENCES mandates(id),
  placement_date DATE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  guarantee_end_date DATE NOT NULL,
  guarantee_status TEXT DEFAULT 'active',
  alumni_status TEXT DEFAULT 'active',
  last_engagement_date DATE,
  engagement_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni engagement log
CREATE TABLE IF NOT EXISTS alumni_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  engagement_type TEXT NOT NULL,
  engagement_date TIMESTAMPTZ NOT NULL,
  initiated_by UUID REFERENCES profiles(id),
  summary TEXT,
  outcome TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarantee period tracking
CREATE TABLE IF NOT EXISTS guarantee_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  check_in_dates DATE[] NOT NULL,
  check_ins_completed JSONB DEFAULT '[]',
  fee_refund_pct NUMERIC(5,2),
  dispute_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni referrals
CREATE TABLE IF NOT EXISTS alumni_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  referred_candidate_id UUID REFERENCES contacts(id),
  referred_name TEXT NOT NULL,
  referred_email TEXT,
  referred_phone TEXT,
  mandate_id UUID REFERENCES mandates(id),
  referral_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'received',
  referral_source TEXT DEFAULT 'alumni',
  referral_fee_owed BOOLEAN DEFAULT false,
  referral_fee_amount NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-engagement campaigns
CREATE TABLE IF NOT EXISTS alumni_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  target_tags TEXT[] DEFAULT '{}',
  target_companies TEXT[] DEFAULT '{}',
  message_template TEXT NOT NULL,
  send_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alumni_org ON alumni(org_id);
CREATE INDEX IF NOT EXISTS idx_alumni_status ON alumni(alumni_status);
CREATE INDEX IF NOT EXISTS idx_alumni_guarantee ON alumni(guarantee_status) WHERE guarantee_status = 'active';
CREATE INDEX IF NOT EXISTS idx_alumni_engagements ON alumni_engagements(alumni_id, engagement_date DESC);
CREATE INDEX IF NOT EXISTS idx_guarantee_periods_active ON guarantee_periods(org_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_alumni_referrals ON alumni_referrals(alumni_id, referral_date DESC);

-- RLS policies
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_campaigns ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view org alumni" ON alumni
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create org alumni" ON alumni
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org alumni" ON alumni
  FOR UPDATE USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni engagements" ON alumni_engagements
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org guarantee periods" ON guarantee_periods
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni referrals" ON alumni_referrals
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni campaigns" ON alumni_campaigns
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );