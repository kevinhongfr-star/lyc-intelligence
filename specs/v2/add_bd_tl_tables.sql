-- Migration: Add BD and Team Lead tables
-- Date: 2026-08-02
-- Description: Creates bd_opportunities, bd_activities, bd_proposals, tl_approvals tables

-- ═══════════════════════════════════════════════════
-- BD (Business Development) Tables
-- ═══════════════════════════════════════════════════

-- BD Opportunities (pipeline tracking)
CREATE TABLE IF NOT EXISTS bd_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  title TEXT,
  stage TEXT DEFAULT 'initial_contact',
  estimated_value BIGINT,
  probability INTEGER DEFAULT 10,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_bd_opp_org ON bd_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_bd_opp_stage ON bd_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_bd_opp_owner ON bd_opportunities(owner_id);

-- BD Activities (touchpoints per opportunity)
CREATE TABLE IF NOT EXISTS bd_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'note',
  subject TEXT,
  body TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bd_act_opp ON bd_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_bd_act_org ON bd_activities(org_id);

-- BD Proposals
CREATE TABLE IF NOT EXISTS bd_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,
  proposed_fee BIGINT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_bd_prop_org ON bd_proposals(org_id);
CREATE INDEX IF NOT EXISTS idx_bd_prop_opp ON bd_proposals(opportunity_id);

-- ═══════════════════════════════════════════════════
-- Team Lead Tables
-- ═══════════════════════════════════════════════════

-- Team Lead Approvals (workflow queue)
CREATE TABLE IF NOT EXISTS tl_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  requester_id UUID,
  requester_name TEXT,
  details TEXT,
  amount BIGINT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  related_mandate_id UUID,
  related_opportunity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tl_appr_org ON tl_approvals(org_id);
CREATE INDEX IF NOT EXISTS idx_tl_appr_status ON tl_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tl_appr_type ON tl_approvals(type);

-- ═══════════════════════════════════════════════════
-- Seed data for demo (optional — can be removed)
-- ═══════════════════════════════════════════════════

-- Sample BD opportunities for demo/testing
-- INSERT INTO bd_opportunities (org_id, owner_id, company_name, title, stage, estimated_value, probability)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   '00000000-0000-0000-0000-000000000000',
--   'Demo Corp',
--   'CFO Search',
--   'initial_contact',
--   180000,
--   20
-- );

-- Sample TL approvals for demo/testing
-- INSERT INTO tl_approvals (org_id, title, type, requester_name, details, amount)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'New executive search mandate — Demo Corp, CFO',
--   'mandate_creation',
--   'Marie Lavoie',
--   'Retained search for CFO, $180K fee, 90-day target placement.',
--   180000
-- );
