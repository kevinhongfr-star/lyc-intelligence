-- Audit logs table for tracking platform activity
-- Created: 2026-06-15

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- e.g. 'score_created', 'contact_updated', 'company_created', 'mandate_status_change'
  entity_type TEXT NOT NULL,     -- e.g. 'contact', 'company', 'mandate', 'candidate_pipeline'
  entity_id UUID,
  details JSONB DEFAULT '{}',   -- Flexible payload for what changed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Auto-trigger: log contact updates
CREATE OR REPLACE FUNCTION fn_audit_contacts() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, details)
  VALUES (
    CASE WHEN TG_OP = 'INSERT' THEN 'contact_created' ELSE 'contact_updated' END,
    'contact',
    NEW.id,
    jsonb_build_object('name', NEW.name, 'title', NEW.current_title, 'source', NEW.source)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_contacts ON contacts;
CREATE TRIGGER trg_audit_contacts
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_audit_contacts();

-- Auto-trigger: log scoring runs
CREATE OR REPLACE FUNCTION fn_audit_scoring() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, details)
  VALUES (
    'score_created',
    'scoring_run',
    NEW.id,
    jsonb_build_object('run_type', NEW.run_type, 'composite', NEW.composite_score, 'verdict', NEW.verdict)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_scoring ON scoring_runs;
CREATE TRIGGER trg_audit_scoring
  AFTER INSERT ON scoring_runs
  FOR EACH ROW EXECUTE FUNCTION fn_audit_scoring();

-- Auto-trigger: log mandate status changes
CREATE OR REPLACE FUNCTION fn_audit_mandates() RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS NULL OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (
      CASE WHEN TG_OP = 'INSERT' THEN 'mandate_created' ELSE 'mandate_status_change' END,
      'mandate',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_mandates ON mandates;
CREATE TRIGGER trg_audit_mandates
  AFTER INSERT OR UPDATE ON mandates
  FOR EACH ROW EXECUTE FUNCTION fn_audit_mandates();

-- RLS: admin-only read
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read audit_logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
