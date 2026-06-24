-- Phase 2.8: BD Pipeline (Business Development)
-- Opportunities, activities, proposals, and metrics tables

-- BD opportunities (potential mandates)
CREATE TABLE IF NOT EXISTS bd_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Company info
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'mid_market', 'enterprise', 'mnc')),
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,
  website TEXT,

  -- Contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  primary_contact_title TEXT,
  linkedin_url TEXT,

  -- Opportunity
  stage TEXT NOT NULL DEFAULT 'prospect'
    CHECK (stage IN ('prospect', 'qualified', 'proposal_sent', 'pitch_delivered', 'negotiate', 'signed', 'lost', 'deferred')),
  opportunity_type TEXT CHECK (opportunity_type IN ('retained', 'contingent', 'exclusive', 'non_exclusive')),
  estimated_roles INTEGER DEFAULT 1,
  estimated_fee_total NUMERIC,
  estimated_fee_currency TEXT NOT NULL DEFAULT 'CNY',
  fee_structure TEXT CHECK (fee_structure IN ('percentage', 'fixed', 'retainer_plus_success')),

  -- Ownership
  owner_id UUID NOT NULL,
  team_members UUID[] DEFAULT '{}',

  -- Source
  source TEXT CHECK (source IN ('referral', 'networking', 'inbound', 'cold_outreach', 'repeat_client')),
  source_detail TEXT,

  -- Timeline
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  proposal_sent_at TIMESTAMPTZ,
  pitch_delivered_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  deferred_until DATE,

  -- Outcome
  lost_reason TEXT CHECK (lost_reason IN ('budget', 'timing', 'competitor', 'internal', 'no_response')),
  competitor_firm TEXT,
  notes TEXT,

  -- Link to mandate (when signed)
  mandate_id UUID
);

CREATE INDEX IF NOT EXISTS idx_bd_org_stage ON bd_opportunities(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_bd_owner ON bd_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_bd_company ON bd_opportunities(company_name);
CREATE INDEX IF NOT EXISTS idx_bd_deferred ON bd_opportunities(deferred_until)
  WHERE stage = 'deferred';

-- BD activities (interactions with prospects)
CREATE TABLE IF NOT EXISTS bd_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'lunch', 'networking_event',
    'proposal_sent', 'follow_up', 'note', 'stage_change'
  )),
  description TEXT NOT NULL,
  outcome TEXT,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Linked entities
  contact_id UUID,
  related_document_id UUID
);

CREATE INDEX IF NOT EXISTS idx_bd_activities_opp ON bd_activities(opportunity_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bd_activities_owner ON bd_activities(performed_by, performed_at DESC);

-- BD proposals (documents sent to prospects)
CREATE TABLE IF NOT EXISTS bd_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'superseded')),

  -- Fee details
  fee_structure TEXT,
  fee_amount NUMERIC,
  fee_currency TEXT NOT NULL DEFAULT 'CNY',
  payment_terms TEXT,
  guarantee_period_months INTEGER DEFAULT 3,

  -- Scope
  role_count INTEGER DEFAULT 1,
  scope_description TEXT,
  timeline_weeks INTEGER,

  -- Document
  document_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_opp ON bd_proposals(opportunity_id, version DESC);

-- BD pipeline metrics (computed weekly)
CREATE TABLE IF NOT EXISTS bd_pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Funnel counts
  new_prospects INTEGER NOT NULL DEFAULT 0,
  new_qualified INTEGER NOT NULL DEFAULT 0,
  proposals_sent INTEGER NOT NULL DEFAULT 0,
  pitches_delivered INTEGER NOT NULL DEFAULT 0,
  signed INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,

  -- Conversion rates
  prospect_to_qualified_pct NUMERIC,
  qualified_to_signed_pct NUMERIC,
  overall_win_rate_pct NUMERIC,

  -- Value
  total_pipeline_value NUMERIC,
  signed_value NUMERIC,
  avg_deal_size NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, period_start)
);

-- RLS
ALTER TABLE bd_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_pipeline_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_bd_opps" ON bd_opportunities
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_activities" ON bd_activities
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_proposals" ON bd_proposals
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_metrics" ON bd_pipeline_metrics
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);
