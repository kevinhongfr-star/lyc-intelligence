-- Phase 3.12: Client SLA & Mandate Timeline Tracking
-- SLA monitoring system for mandate timelines

-- SLA configurations per organization
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_type TEXT NOT NULL,
  milestones JSONB NOT NULL,
  escalation_rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, mandate_type)
);

-- Per-mandate timeline instances
CREATE TABLE IF NOT EXISTS mandate_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  sla_config_id UUID NOT NULL REFERENCES sla_configurations(id),
  start_date TIMESTAMPTZ NOT NULL,
  current_stage TEXT NOT NULL,
  milestones JSONB NOT NULL,
  overall_progress_pct INTEGER DEFAULT 0,
  days_remaining INTEGER,
  health_status TEXT DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA escalations
CREATE TABLE IF NOT EXISTS sla_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  timeline_id UUID NOT NULL REFERENCES mandate_timelines(id),
  escalation_type TEXT NOT NULL,
  milestone_stage TEXT NOT NULL,
  message TEXT NOT NULL,
  notified_roles TEXT[] NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical SLA performance
CREATE TABLE IF NOT EXISTS sla_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_id UUID REFERENCES mandates(id),
  mandate_type TEXT NOT NULL,
  total_duration_days INTEGER,
  stages_completed JSONB,
  sla_met BOOLEAN,
  breached_milestones TEXT[],
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mandate_timelines_org ON mandate_timelines(org_id);
CREATE INDEX IF NOT EXISTS idx_mandate_timelines_health ON mandate_timelines(health_status);
CREATE INDEX IF NOT EXISTS idx_sla_escalations_active ON sla_escalations(org_id) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sla_perf_org ON sla_performance_history(org_id, completed_at DESC);

-- RLS policies
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_performance_history ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view org SLA configs" ON sla_configurations
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create org SLA configs" ON sla_configurations
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org SLA configs" ON sla_configurations
  FOR UPDATE USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org mandate timelines" ON mandate_timelines
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org escalations" ON sla_escalations
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org SLA performance" ON sla_performance_history
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Default SLA configurations
INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'executive_search',
  '[
    {"stage": "discovery", "target_days": 5, "warning_days": 2},
    {"stage": "shortlist", "target_days": 10, "warning_days": 3},
    {"stage": "interviews", "target_days": 14, "warning_days": 3},
    {"stage": "offer", "target_days": 7, "warning_days": 2},
    {"stage": "onboarding", "target_days": 14, "warning_days": 3}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant", "manager"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager", "director"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director", "partner"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'executive_search');

INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'retained',
  '[
    {"stage": "discovery", "target_days": 3, "warning_days": 1},
    {"stage": "shortlist", "target_days": 7, "warning_days": 2},
    {"stage": "interviews", "target_days": 10, "warning_days": 2},
    {"stage": "offer", "target_days": 5, "warning_days": 1},
    {"stage": "onboarding", "target_days": 10, "warning_days": 2}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant", "manager"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager", "director"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director", "partner"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'retained');

INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'contingency',
  '[
    {"stage": "discovery", "target_days": 7, "warning_days": 3},
    {"stage": "shortlist", "target_days": 14, "warning_days": 4},
    {"stage": "interviews", "target_days": 21, "warning_days": 5},
    {"stage": "offer", "target_days": 10, "warning_days": 3},
    {"stage": "onboarding", "target_days": 14, "warning_days": 4}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'contingency');