-- Phase 3.11: Approval Workflows
-- 012_approval_workflows.sql

-- Approval workflow definitions
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'candidate_submission',
    'fee_change',
    'offer_approval',
    'mandate_creation',
    'budget_exception',
    'data_export',
    'custom'
  )),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  steps JSONB NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON approval_workflows(org_id, approval_type);

-- Approval requests (instances)
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  approval_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  request_data JSONB NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'cancelled',
    'escalated'
  )),
  final_decision TEXT CHECK (final_decision IN ('approved', 'rejected')),
  final_comment TEXT,
  decided_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON approval_requests(org_id, status, current_step);
CREATE INDEX IF NOT EXISTS idx_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_requests_approver ON approval_requests(org_id, status) WHERE status IN ('pending', 'in_review');

-- Individual step approvals
CREATE TABLE IF NOT EXISTS approval_step_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  approver_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'delegated',
    'escalated'
  )),
  decision TEXT CHECK (decision IN ('approved', 'rejected')),
  comment TEXT,
  decided_at TIMESTAMPTZ,
  delegated_from UUID,
  delegated_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steps_request ON approval_step_records(request_id, step_order);
CREATE INDEX IF NOT EXISTS idx_steps_pending ON approval_step_records(approver_id, status) WHERE status = 'pending';

-- Approval delegation rules
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  approval_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_delegations_active ON approval_delegations(org_id, delegator_id, approval_type) WHERE is_active = true;

-- Approval audit log
CREATE TABLE IF NOT EXISTS approval_audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL,
  request_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_request ON approval_audit_log(request_id, created_at);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_step_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_workflows" ON approval_workflows
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_requests" ON approval_requests
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_steps" ON approval_step_records
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_delegations" ON approval_delegations
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_audit" ON approval_audit_log
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Default approval workflows
INSERT INTO approval_workflows (org_id, name, approval_type, description, is_active, steps, conditions, created_by)
SELECT 
  o.id,
  'Candidate Submission Approval',
  'candidate_submission',
  'Default candidate submission approval workflow',
  true,
  '[{"step_order": 1, "approver_role": "partner", "approver_id": null, "escalation_hours": 24, "escalation_approver_role": "managing_partner", "is_parallel": false}]',
  '{}',
  o.owner_id
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO approval_workflows (org_id, name, approval_type, description, is_active, steps, conditions, created_by)
SELECT 
  o.id,
  'Offer Approval',
  'offer_approval',
  'Default offer letter approval workflow',
  true,
  '[{"step_order": 1, "approver_role": "partner", "approver_id": null, "escalation_hours": 24, "escalation_approver_role": "managing_partner", "is_parallel": false}]',
  '{}',
  o.owner_id
FROM organizations o
ON CONFLICT DO NOTHING;
