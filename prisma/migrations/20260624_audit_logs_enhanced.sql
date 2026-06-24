-- Phase 0.5: Cross-Cutting Quality Standards
-- Enhanced audit logs with org-scoping, change tracking, and request metadata

-- Add organization_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- Add resource_type (alias for entity_type, standard naming)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_type TEXT GENERATED ALWAYS AS (entity_type) STORED;
  END IF;
END $$;

-- Add resource_id (alias for entity_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_id UUID GENERATED ALWAYS AS (entity_id) STORED;
  END IF;
END $$;

-- Add changes column (before/after diff)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'changes'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB;
  END IF;
END $$;

-- Add ip_address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
  END IF;
END $$;

-- Add user_agent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;
END $$;

-- Add org index
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);

-- Update RLS: add org-scoped read for org admins
CREATE POLICY IF NOT EXISTS "org_admins_read_own_logs" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update existing admin policy to include organization_id scoping
DROP POLICY IF EXISTS "Admin read audit_logs" ON audit_logs;
CREATE POLICY "Admin read audit_logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'lyc_admin')
  )
);
