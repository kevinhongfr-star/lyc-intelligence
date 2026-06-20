-- ================================================================
-- Multi-Tenant Authorization: mandate_members table
-- Problem: No way to assign users to specific mandates
-- Solution: Create mandate_members table to track assignments
-- Run in Supabase Dashboard → SQL Editor.
-- ================================================================

-- 1. Create mandate_members table
CREATE TABLE IF NOT EXISTS mandate_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'lead', 'member', 'viewer'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(mandate_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE mandate_members ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can see their own assignments
CREATE POLICY "mandate_members_select_own"
  ON mandate_members FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Only admins can insert assignments
CREATE POLICY "mandate_members_insert_admin"
  ON mandate_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Only admins can update assignments
CREATE POLICY "mandate_members_update_admin"
  ON mandate_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Only admins can delete assignments
CREATE POLICY "mandate_members_delete_admin"
  ON mandate_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 4. Index for fast lookups
CREATE INDEX idx_mandate_members_mandate ON mandate_members(mandate_id);
CREATE INDEX idx_mandate_members_user ON mandate_members(user_id);

-- 5. Helper function: Check if user is assigned to mandate
CREATE OR REPLACE FUNCTION is_user_assigned_to_mandate(p_user_id UUID, p_mandate_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mandate_members 
    WHERE mandate_id = p_mandate_id 
    AND (user_id = p_user_id OR EXISTS (
      SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin'
    ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
