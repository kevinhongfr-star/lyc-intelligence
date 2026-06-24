-- Phase 3.10: Workflow Automation Rules Engine
-- 011_workflow_automation.sql

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'stage_change',
    'score_threshold',
    'time_elapsed',
    'status_change',
    'manual',
    'candidate_created',
    'mandate_created'
  )),
  trigger_config JSONB NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  condition_logic TEXT NOT NULL DEFAULT 'AND' CHECK (condition_logic IN ('AND', 'OR')),
  actions JSONB NOT NULL DEFAULT '[]',
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_org_active ON automation_rules(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rules_trigger ON automation_rules(trigger_type);

-- Rule execution log
CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  trigger_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  actions_executed JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_rule ON rule_executions(rule_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_entity ON rule_executions(entity_type, entity_id, executed_at DESC);

-- Scheduled rule checks (for time-based triggers)
CREATE TABLE IF NOT EXISTS rule_scheduled_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  check_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON rule_scheduled_checks(status, check_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_rule ON rule_scheduled_checks(rule_id, check_at DESC);

-- RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_scheduled_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_rules" ON automation_rules
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_executions" ON rule_executions
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_scheduled" ON rule_scheduled_checks
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
