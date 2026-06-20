-- ================================================================
-- RLS Fix: contacts table
-- Problem: contacts table has NO Row Level Security enabled.
--          Anonymous key can INSERT/UPDATE/DELETE all contacts.
-- This script enables RLS and creates policies for safe access.
-- Run in Supabase Dashboard → SQL Editor.
-- ================================================================

-- 1. Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 2. Allow SELECT for all (public read for talent pool, match engine)
CREATE POLICY "contacts_select_all"
  ON contacts FOR SELECT
  USING (true);

-- 3. Allow INSERT only for authenticated users (service role bypasses RLS)
CREATE POLICY "contacts_insert_authenticated"
  ON contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow UPDATE only for authenticated users
CREATE POLICY "contacts_update_authenticated"
  ON contacts FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. No DELETE policy for anon/authenticated — only service_role can delete
--    (service_role bypasses RLS by default)
