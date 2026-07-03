
-- --- 20260630_create_grid_mapping.sql ---

-- ════════════════════════════════════════════════════════════════════════
-- 20260630_create_grid_mapping.sql
-- TICKET T-2b: GRID Market Mapping (TECH-02)
-- 6 new tables for GRID market mapping with RLS enabled
-- ADDITIVE only - uses IF NOT EXISTS to preserve existing tables
-- ════════════════════════════════════════════════════════════════════════

--- grid_mappings TABLE ---
CREATE TABLE IF NOT EXISTS grid_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_grid_mandate ON grid_mappings(mandate_id);

ALTER TABLE grid_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team can view GRID mappings" ON grid_mappings;
DROP POLICY IF EXISTS "Team can view GRID mappings" ON grid_mappings;
CREATE POLICY "Team can view GRID mappings" ON grid_mappings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Team can create GRID mappings" ON grid_mappings;
DROP POLICY IF EXISTS "Team can create GRID mappings" ON grid_mappings;
CREATE POLICY "Team can create GRID mappings" ON grid_mappings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Team can update GRID mappings" ON grid_mappings;
DROP POLICY IF EXISTS "Team can update GRID mappings" ON grid_mappings;
CREATE POLICY "Team can update GRID mappings" ON grid_mappings FOR UPDATE TO authenticated USING (true);

--- grid_sectors TABLE ---
CREATE TABLE IF NOT EXISTS grid_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  sector_name TEXT NOT NULL,
  sector_description TEXT,
  priority TEXT CHECK (priority IN ('primary', 'secondary', 'tertiary')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_sectors_mapping ON grid_sectors(mapping_id);
ALTER TABLE grid_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team can view sectors" ON grid_sectors;
DROP POLICY IF EXISTS "Team can view sectors" ON grid_sectors;
CREATE POLICY "Team can view sectors" ON grid_sectors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Team can manage sectors" ON grid_sectors;
DROP POLICY IF EXISTS "Team can manage sectors" ON grid_sectors;
CREATE POLICY "Team can manage sectors" ON grid_sectors FOR ALL TO authenticated USING (true);

--- grid_companies TABLE ---
CREATE TABLE IF NOT EXISTS grid_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES grid_sectors(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_size TEXT,
  headquarters TEXT,
  relevance_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_companies_mapping ON grid_companies(mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_companies_sector ON grid_companies(sector_id);
ALTER TABLE grid_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team can view companies" ON grid_companies;
DROP POLICY IF EXISTS "Team can view companies" ON grid_companies;
CREATE POLICY "Team can view companies" ON grid_companies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Team can manage companies" ON grid_companies;
DROP POLICY IF EXISTS "Team can manage companies" ON grid_companies;
CREATE POLICY "Team can manage companies" ON grid_companies FOR ALL TO authenticated USING (true);

--- grid_functions TABLE ---
CREATE TABLE IF NOT EXISTS grid_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  function_description TEXT,
  importance TEXT CHECK (importance IN ('critical', 'important', 'nice_to_have')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_functions_mapping ON grid_functions(mapping_id);
ALTER TABLE grid_functions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team can view functions" ON grid_functions;
DROP POLICY IF EXISTS "Team can view functions" ON grid_functions;
CREATE POLICY "Team can view functions" ON grid_functions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Team can manage functions" ON grid_functions;
DROP POLICY IF EXISTS "Team can manage functions" ON grid_functions;
CREATE POLICY "Team can manage functions" ON grid_functions FOR ALL TO authenticated USING (true);

--- grid_candidate_entries TABLE ---
CREATE TABLE IF NOT EXISTS grid_candidate_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('sector', 'company', 'function')),
  section_item_id UUID,
  notes TEXT,
  ranking INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_entries_mapping ON grid_candidate_entries(mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_entries_contact ON grid_candidate_entries(contact_id);
ALTER TABLE grid_candidate_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team can view entries" ON grid_candidate_entries;
DROP POLICY IF EXISTS "Team can view entries" ON grid_candidate_entries;
CREATE POLICY "Team can view entries" ON grid_candidate_entries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Team can manage entries" ON grid_candidate_entries;
DROP POLICY IF EXISTS "Team can manage entries" ON grid_candidate_entries;
CREATE POLICY "Team can manage entries" ON grid_candidate_entries FOR ALL TO authenticated USING (true);

--- grid_minimum_standards TABLE ---
CREATE TABLE IF NOT EXISTS grid_minimum_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  standard_type TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_standards_mapping ON grid_minimum_standards(mapping_id);
ALTER TABLE grid_minimum_standards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team can view standards" ON grid_minimum_standards;
DROP POLICY IF EXISTS "Team can view standards" ON grid_minimum_standards;
CREATE POLICY "Team can view standards" ON grid_minimum_standards FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Team can manage standards" ON grid_minimum_standards;
DROP POLICY IF EXISTS "Team can manage standards" ON grid_minimum_standards;
CREATE POLICY "Team can manage standards" ON grid_minimum_standards FOR ALL TO authenticated USING (true);

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'grid_mappings', 'grid_sectors', 'grid_companies',
    'grid_functions', 'grid_candidate_entries', 'grid_minimum_standards'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '[OK] GRID Market Mapping migration OK - all 6 tables present';
  ELSE
    RAISE EXCEPTION '[FAIL] GRID Market Mapping migration FAILED - missing: %', v_missing;
  END IF;
END$$;

COMMIT;
