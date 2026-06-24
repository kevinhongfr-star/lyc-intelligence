-- Phase 5.7: PIPL Compliance (China Data Privacy)
-- Consent, residency, cross-border transfers, and data subject rights

-- Consent records (PIPL Articles 14-17)
CREATE TABLE IF NOT EXISTS data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  data_subject_type TEXT NOT NULL CHECK (data_subject_type IN ('candidate', 'client_contact', 'user')),
  data_subject_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN (
    'consent',
    'contract_performance',
    'legal_obligation',
    'public_interest',
    'legitimate_interest'
  )),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT NOT NULL,
  consent_version INTEGER NOT NULL DEFAULT 1,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, data_subject_type, data_subject_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_consents_subject ON data_consents(data_subject_type, data_subject_id);
CREATE INDEX IF NOT EXISTS idx_consents_org ON data_consents(org_id);
CREATE INDEX IF NOT EXISTS idx_consents_expiring ON data_consents(expires_at)
  WHERE expires_at IS NOT NULL AND withdrawn_at IS NULL AND consent_given = true;

-- Data residency tags
CREATE TABLE IF NOT EXISTS data_residency_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'CN',
  is_china_resident BOOLEAN NOT NULL DEFAULT false,
  data_category TEXT NOT NULL DEFAULT 'standard'
    CHECK (data_category IN ('standard', 'sensitive', 'biometric', 'financial', 'minor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_residency_china ON data_residency_tags(is_china_resident)
  WHERE is_china_resident = true;
CREATE INDEX IF NOT EXISTS idx_residency_org ON data_residency_tags(org_id);

-- Cross-border transfer log
CREATE TABLE IF NOT EXISTS cross_border_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  transfer_type TEXT NOT NULL CHECK (transfer_type IN (
    'api_response',
    'backup_replication',
    'analytics_export',
    'manual_export'
  )),
  data_subject_count INTEGER NOT NULL,
  destination_country TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_org ON cross_border_transfers(org_id, created_at DESC);

-- Data subject rights requests (PIPL Chapter IV)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',
    'correction',
    'deletion',
    'portability',
    'withdraw_consent'
  )),
  data_subject_type TEXT NOT NULL,
  data_subject_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  request_details JSONB,
  response_details JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_requests_pending ON data_subject_requests(org_id, status, due_at)
  WHERE status IN ('pending', 'in_progress');

-- RLS
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_residency_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_border_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_consents" ON data_consents
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_residency" ON data_residency_tags
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "service_role_transfers" ON cross_border_transfers
  FOR ALL USING (false);

CREATE POLICY "org_requests" ON data_subject_requests
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);
