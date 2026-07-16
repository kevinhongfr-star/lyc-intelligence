-- ============================================================================
-- NOTION-001/002/003: Notion Integration Schema
-- assets table, build_tracker table, notion_sync_log table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- NOTION-001: Assets table (create + Notion columns)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'review', 'approved', 'archived')),
  category TEXT,
  format TEXT,
  url TEXT,
  file_path TEXT,
  tags TEXT[] DEFAULT '{}',
  version TEXT DEFAULT '1.0',
  author_id UUID REFERENCES v2_user_profiles(id),
  organization_id UUID REFERENCES v2_organizations(id),
  metadata JSONB DEFAULT '{}',
  assigned_to TEXT,
  notion_phase TEXT,
  asset_priority TEXT,
  dependencies TEXT[] DEFAULT '{}',
  product_layer TEXT,
  notion_asset_id TEXT UNIQUE,
  asset_category TEXT,
  asset_format TEXT,
  notion_page_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_notion_phase ON public.assets(notion_phase);
CREATE INDEX IF NOT EXISTS idx_assets_asset_priority ON public.assets(asset_priority);
CREATE INDEX IF NOT EXISTS idx_assets_notion_asset_id ON public.assets(notion_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization ON public.assets(organization_id);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to assets"
  ON public.assets FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage assets"
  ON public.assets FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_assets_updated_at ON public.assets;
CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- NOTION-002: Build Tracker table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.build_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_number INTEGER UNIQUE,
  deliverable_name TEXT NOT NULL,
  build_phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Building' CHECK (status IN ('Building', 'Complete', 'Blocked', 'Deferred')),
  assigned_to TEXT,
  category TEXT,
  product TEXT,
  completed_at TIMESTAMPTZ,
  notion_page_id TEXT UNIQUE,
  notion_page_url TEXT,
  organization_id UUID REFERENCES v2_organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_build_tracker_phase ON public.build_tracker(build_phase);
CREATE INDEX IF NOT EXISTS idx_build_tracker_status ON public.build_tracker(status);
CREATE INDEX IF NOT EXISTS idx_build_tracker_notion_page_id ON public.build_tracker(notion_page_id);

ALTER TABLE public.build_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view build tracker"
  ON public.build_tracker FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to build tracker"
  ON public.build_tracker FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage build tracker"
  ON public.build_tracker FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_build_tracker_updated_at ON public.build_tracker;
CREATE TRIGGER trg_build_tracker_updated_at
  BEFORE UPDATE ON public.build_tracker
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- NOTION-003: Notion Sync Log table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notion_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_db TEXT NOT NULL CHECK (source_db IN ('launch_assets', 'build_tracker')),
  sync_type TEXT NOT NULL DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental')),
  records_fetched INTEGER DEFAULT 0,
  records_upserted INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  records_excluded INTEGER DEFAULT 0,
  error_details TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notion_sync_log_source ON public.notion_sync_log(source_db);
CREATE INDEX IF NOT EXISTS idx_notion_sync_log_started ON public.notion_sync_log(started_at);

ALTER TABLE public.notion_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to notion sync log"
  ON public.notion_sync_log FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can view sync log"
  ON public.notion_sync_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- Helper function: get latest sync status per source
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_notion_sync_status();
CREATE OR REPLACE FUNCTION public.get_notion_sync_status()
RETURNS TABLE (
  source_db TEXT,
  last_sync_at TIMESTAMPTZ,
  last_records_upserted INTEGER,
  last_sync_status TEXT,
  total_records INTEGER
) AS $$
DECLARE
  v_assets_count INTEGER;
  v_build_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_assets_count FROM public.assets WHERE notion_asset_id IS NOT NULL;
  SELECT COUNT(*) INTO v_build_count FROM public.build_tracker WHERE notion_page_id IS NOT NULL;

  RETURN QUERY
  WITH latest_syncs AS (
    SELECT DISTINCT ON (sl.source_db)
      sl.source_db,
      sl.completed_at AS last_sync_at,
      sl.records_upserted AS last_records_upserted,
      CASE
        WHEN sl.error_details IS NOT NULL THEN 'failed'
        WHEN sl.completed_at IS NULL THEN 'running'
        ELSE 'success'
      END AS last_sync_status
    FROM public.notion_sync_log sl
    ORDER BY sl.source_db, sl.started_at DESC
  )
  SELECT
    ls.source_db,
    ls.last_sync_at,
    ls.last_records_upserted,
    ls.last_sync_status,
    CASE
      WHEN ls.source_db = 'launch_assets' THEN v_assets_count
      WHEN ls.source_db = 'build_tracker' THEN v_build_count
      ELSE 0
    END AS total_records
  FROM latest_syncs ls;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
