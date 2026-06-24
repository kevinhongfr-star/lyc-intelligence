-- Phase 0.7: KPI Definitions & Success Metrics
-- kpi_values + kpi_alerts tables

-- KPI values store (computed metrics)
CREATE TABLE IF NOT EXISTS kpi_values (
  id BIGSERIAL PRIMARY KEY,
  kpi_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  value NUMERIC NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sample_size INTEGER NOT NULL DEFAULT 0,
  UNIQUE(kpi_id, org_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_kpi_values_org ON kpi_values(org_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi ON kpi_values(kpi_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_org_kpi ON kpi_values(org_id, kpi_id, period_start DESC);

ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_kpis" ON kpi_values
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- KPI alerts (threshold breaches)
CREATE TABLE IF NOT EXISTS kpi_alerts (
  id BIGSERIAL PRIMARY KEY,
  kpi_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  current_value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_active ON kpi_alerts(org_id, created_at DESC)
  WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_org ON kpi_alerts(org_id, created_at DESC);

ALTER TABLE kpi_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_alerts" ON kpi_alerts
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_manage_alerts" ON kpi_alerts
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::UUID);
