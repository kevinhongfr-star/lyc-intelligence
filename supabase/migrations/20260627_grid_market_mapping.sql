-- ════════════════════════════════════════════════════════════════════════
-- 20260627_grid_market_mapping.sql
-- DEX AI GRID Market Mapping — T2 Schema Migration (Technical Blueprint 02)
-- Implements: Spec 02 (DEX-BS-002) + Technical Blueprint 02 (DEX-TB-002)
-- GRID v2.0 Integration: 5-section mapping, M1-M7 standards, 16 intelligence data points
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. GRID MAPPINGS (Master record) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grid_mappings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id          UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version             INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'in_progress', 'complete', 'archived')),
  mapping_type        TEXT NOT NULL DEFAULT 'grid'
                       CHECK (mapping_type IN ('sweep', 'grid')),
  config              JSONB NOT NULL DEFAULT '{}'::jsonb,
  standards_summary   JSONB NOT NULL DEFAULT '{}'::jsonb,
  intelligence_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
  intelligence_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_pdf_path     TEXT,
  export_csv_path     TEXT,
  last_generated_at   TIMESTAMPTZ,
  last_daily_grid_sent TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_grid_mappings_mandate ON public.grid_mappings(mandate_id);
CREATE INDEX IF NOT EXISTS idx_grid_mappings_status ON public.grid_mappings(status);
CREATE INDEX IF NOT EXISTS idx_grid_mappings_type ON public.grid_mappings(mapping_type);

ALTER TABLE public.grid_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid mappings"
  ON public.grid_mappings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create grid mappings"
  ON public.grid_mappings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team can update grid mappings"
  ON public.grid_mappings FOR UPDATE TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_grid_mappings_updated_at ON public.grid_mappings;
CREATE TRIGGER trg_grid_mappings_updated_at
  BEFORE UPDATE ON public.grid_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. GRID SECTORS (Section 1: Sector & Segment Definition) ────────────
CREATE TABLE IF NOT EXISTS public.grid_sectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  sector_name     TEXT NOT NULL,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  segments        JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_grid_sectors_mapping ON public.grid_sectors(grid_mapping_id);

ALTER TABLE public.grid_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid sectors"
  ON public.grid_sectors FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid sectors"
  ON public.grid_sectors FOR ALL TO authenticated
  USING (true);

-- ── 3. GRID COMPANIES (Section 2: Target Company List) ─────────────────
CREATE TABLE IF NOT EXISTS public.grid_companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  grid_sector_id  UUID REFERENCES public.grid_sectors(id) ON DELETE SET NULL,
  target_company_id UUID REFERENCES public.target_companies(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  segment         TEXT,
  est_employees   INTEGER,
  relevance       TEXT NOT NULL DEFAULT 'medium'
                   CHECK (relevance IN ('high', 'medium', 'low')),
  rationale       TEXT NOT NULL,
  target_candidates INTEGER NOT NULL DEFAULT 1 CHECK (target_candidates >= 1),
  actual_candidates INTEGER NOT NULL DEFAULT 0,
  gap             INTEGER NOT NULL DEFAULT 0,
  gap_reason      TEXT
                   CHECK (gap_reason IN ('not_interested', 'not_found', 'not_reachable', 'wrong_seniority', 'wrong_function', NULL)),
  gap_action_plan TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grid_companies_mapping ON public.grid_companies(grid_mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_companies_sector ON public.grid_companies(grid_sector_id);
CREATE INDEX IF NOT EXISTS idx_grid_companies_relevance ON public.grid_companies(relevance);

ALTER TABLE public.grid_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid companies"
  ON public.grid_companies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid companies"
  ON public.grid_companies FOR ALL TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_grid_companies_updated_at ON public.grid_companies;
CREATE TRIGGER trg_grid_companies_updated_at
  BEFORE UPDATE ON public.grid_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-compute gap
CREATE OR REPLACE FUNCTION public.fn_grid_company_gap()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gap := NEW.target_candidates - NEW.actual_candidates;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grid_company_gap ON public.grid_companies;
CREATE TRIGGER trg_grid_company_gap
  BEFORE INSERT OR UPDATE OF target_candidates, actual_candidates ON public.grid_companies
  FOR EACH ROW EXECUTE FUNCTION public.fn_grid_company_gap();

-- ── 4. GRID FUNCTIONS (Section 3: Business Function Relevance) ──────────
CREATE TABLE IF NOT EXISTS public.grid_functions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  function_name   TEXT NOT NULL,
  relevant_titles JSONB NOT NULL DEFAULT '[]'::jsonb,
  seniority_from  TEXT,
  seniority_to    TEXT,
  relevance       TEXT NOT NULL DEFAULT 'medium'
                   CHECK (relevance IN ('high', 'medium', 'low')),
  notes           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_grid_functions_mapping ON public.grid_functions(grid_mapping_id);

ALTER TABLE public.grid_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid functions"
  ON public.grid_functions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid functions"
  ON public.grid_functions FOR ALL TO authenticated
  USING (true);

-- ── 5. GRID CANDIDATE ENTRIES (Section 4: Candidate Map) ────────────────
CREATE TABLE IF NOT EXISTS public.grid_candidate_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id     UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  grid_company_id     UUID REFERENCES public.grid_companies(id) ON DELETE SET NULL,
  grid_function_id    UUID REFERENCES public.grid_functions(id) ON DELETE SET NULL,
  -- Positioning fields
  market_position     TEXT
                      CHECK (market_position IN ('above_market', 'at_market', 'below_market', 'emerging')),
  sector_benchmark    TEXT
                      CHECK (sector_benchmark IN ('top', 'second', 'third', 'bottom')),
  salary_band         TEXT
                      CHECK (salary_band IN ('executive_premium', 'market_rate', 'below_market', 'unknown')),
  talent_density      TEXT
                      CHECK (talent_density IN ('high', 'medium', 'low', 'scarce')),
  competitor_presence TEXT,
  -- Priority
  priority            TEXT NOT NULL DEFAULT 'P3'
                      CHECK (priority IN ('P1', 'P2', 'P3')),
  priority_override   BOOLEAN NOT NULL DEFAULT FALSE,
  priority_override_reason TEXT,
  -- Status
  status              TEXT NOT NULL DEFAULT 'uncontacted'
                      CHECK (status IN ('uncontacted', 'contacted_interested', 'contacted_not_interested', 'interview', 'offer', 'declined_offer', 'not_viable')),
  notes               TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grid_mapping_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_grid_entries_mapping ON public.grid_candidate_entries(grid_mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_entries_contact ON public.grid_candidate_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_grid_entries_priority ON public.grid_candidate_entries(priority);
CREATE INDEX IF NOT EXISTS idx_grid_entries_status ON public.grid_candidate_entries(status);

ALTER TABLE public.grid_candidate_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid candidate entries"
  ON public.grid_candidate_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid candidate entries"
  ON public.grid_candidate_entries FOR ALL TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_grid_entries_updated_at ON public.grid_candidate_entries;
CREATE TRIGGER trg_grid_entries_updated_at
  BEFORE UPDATE ON public.grid_candidate_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-assign priority
CREATE OR REPLACE FUNCTION public.fn_grid_auto_priority()
RETURNS TRIGGER AS $$
DECLARE
  v_company_relevance TEXT;
  v_function_relevance TEXT;
BEGIN
  IF NEW.priority_override = TRUE THEN
    RETURN NEW;
  END IF;

  SELECT relevance INTO v_company_relevance
  FROM grid_companies WHERE id = NEW.grid_company_id;

  SELECT relevance INTO v_function_relevance
  FROM grid_functions WHERE id = NEW.grid_function_id;

  IF v_company_relevance = 'high' AND v_function_relevance = 'high' THEN
    NEW.priority := 'P1';
  ELSIF (v_company_relevance = 'high' AND v_function_relevance = 'medium')
      OR (v_company_relevance = 'medium' AND v_function_relevance = 'high') THEN
    NEW.priority := 'P2';
  ELSE
    NEW.priority := 'P3';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grid_auto_priority ON public.grid_candidate_entries;
CREATE TRIGGER trg_grid_auto_priority
  BEFORE INSERT OR UPDATE OF grid_company_id, grid_function_id ON public.grid_candidate_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_grid_auto_priority();

-- ── 6. GRID MINIMUM STANDARDS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grid_minimum_standards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id     UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  checked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- M1: Target companies >= 15
  m1_company_count    INTEGER NOT NULL DEFAULT 0,
  m1_status           TEXT NOT NULL DEFAULT 'red',
  -- M2: Sectors >= 3
  m2_sector_count     INTEGER NOT NULL DEFAULT 0,
  m2_status           TEXT NOT NULL DEFAULT 'red',
  -- M3: Candidates >= 30
  m3_candidate_count  INTEGER NOT NULL DEFAULT 0,
  m3_status           TEXT NOT NULL DEFAULT 'red',
  -- M4: Candidates contacted >= 50%
  m4_contacted_pct    NUMERIC NOT NULL DEFAULT 0,
  m4_status           TEXT NOT NULL DEFAULT 'red',
  -- M5: Gap table filled 100%
  m5_gap_filled_pct   NUMERIC NOT NULL DEFAULT 0,
  m5_status           TEXT NOT NULL DEFAULT 'red',
  -- M6: P1 contacted within 1 week = 100%
  m6_p1_contacted_pct NUMERIC NOT NULL DEFAULT 0,
  m6_status           TEXT NOT NULL DEFAULT 'red',
  -- M7: Status updated within 7 days
  m7_last_update      TIMESTAMPTZ,
  m7_status           TEXT NOT NULL DEFAULT 'red',
  -- Overall
  overall_score       INTEGER NOT NULL DEFAULT 0,
  overall_status      TEXT NOT NULL DEFAULT 'red',
  UNIQUE(grid_mapping_id)
);

CREATE INDEX IF NOT EXISTS idx_grid_standards_mapping ON public.grid_minimum_standards(grid_mapping_id);

ALTER TABLE public.grid_minimum_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid standards"
  ON public.grid_minimum_standards FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can update grid standards"
  ON public.grid_minimum_standards FOR ALL TO authenticated
  USING (true);

-- ── 7. COMPUTE GRID STANDARDS FUNCTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_compute_grid_standards(p_mapping_id UUID)
RETURNS VOID AS $$
DECLARE
  v_company_count INTEGER;
  v_sector_count INTEGER;
  v_candidate_count INTEGER;
  v_contacted_count INTEGER;
  v_contacted_pct NUMERIC;
  v_gap_filled_count INTEGER;
  v_gap_total INTEGER;
  v_gap_filled_pct NUMERIC;
  v_p1_count INTEGER;
  v_p1_contacted INTEGER;
  v_p1_pct NUMERIC;
  v_last_update TIMESTAMPTZ;
  v_overall_score INTEGER;
  v_overall_status TEXT;
BEGIN
  -- M1: Count companies
  SELECT COUNT(*) INTO v_company_count FROM grid_companies WHERE grid_mapping_id = p_mapping_id;

  -- M2: Count sectors
  SELECT COUNT(*) INTO v_sector_count FROM grid_sectors WHERE grid_mapping_id = p_mapping_id;

  -- M3: Count candidates
  SELECT COUNT(*) INTO v_candidate_count FROM grid_candidate_entries WHERE grid_mapping_id = p_mapping_id;

  -- M4: Contacted percentage
  SELECT COUNT(*) INTO v_contacted_count
  FROM grid_candidate_entries
  WHERE grid_mapping_id = p_mapping_id AND status NOT IN ('uncontacted');
  v_contacted_pct := CASE WHEN v_candidate_count > 0 THEN ROUND((v_contacted_count::NUMERIC / v_candidate_count) * 100) ELSE 0 END;

  -- M5: Gap table filled
  SELECT COUNT(*) INTO v_gap_total FROM grid_companies WHERE grid_mapping_id = p_mapping_id;
  SELECT COUNT(*) INTO v_gap_filled_count
  FROM grid_companies WHERE grid_mapping_id = p_mapping_id AND gap_reason IS NOT NULL;
  v_gap_filled_pct := CASE WHEN v_gap_total > 0 THEN ROUND((v_gap_filled_count::NUMERIC / v_gap_total) * 100) ELSE 0 END;

  -- M6: P1 contacted
  SELECT COUNT(*) INTO v_p1_count
  FROM grid_candidate_entries WHERE grid_mapping_id = p_mapping_id AND priority = 'P1';
  SELECT COUNT(*) INTO v_p1_contacted
  FROM grid_candidate_entries
  WHERE grid_mapping_id = p_mapping_id AND priority = 'P1' AND status NOT IN ('uncontacted');
  v_p1_pct := CASE WHEN v_p1_count > 0 THEN ROUND((v_p1_contacted::NUMERIC / v_p1_count) * 100) ELSE 0 END;

  -- M7: Last update
  SELECT MAX(updated_at) INTO v_last_update
  FROM grid_candidate_entries WHERE grid_mapping_id = p_mapping_id;

  -- Calculate overall score (0-7)
  v_overall_score := 0;
  IF v_company_count >= 15 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_sector_count >= 3 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_candidate_count >= 30 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_contacted_pct >= 50 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_gap_filled_pct = 100 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_p1_pct = 100 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_last_update >= NOW() - INTERVAL '7 days' THEN v_overall_score := v_overall_score + 1; END IF;

  v_overall_status := CASE
    WHEN v_overall_score >= 6 THEN 'green'
    WHEN v_overall_score >= 4 THEN 'yellow'
    ELSE 'red'
  END;

  -- Upsert standards record
  INSERT INTO grid_minimum_standards (
    grid_mapping_id, checked_at,
    m1_company_count, m1_status,
    m2_sector_count, m2_status,
    m3_candidate_count, m3_status,
    m4_contacted_pct, m4_status,
    m5_gap_filled_pct, m5_status,
    m6_p1_contacted_pct, m6_status,
    m7_last_update, m7_status,
    overall_score, overall_status
  ) VALUES (
    p_mapping_id, NOW(),
    v_company_count, CASE WHEN v_company_count >= 15 THEN 'green' WHEN v_company_count >= 10 THEN 'yellow' ELSE 'red' END,
    v_sector_count, CASE WHEN v_sector_count >= 3 THEN 'green' WHEN v_sector_count >= 2 THEN 'yellow' ELSE 'red' END,
    v_candidate_count, CASE WHEN v_candidate_count >= 30 THEN 'green' WHEN v_candidate_count >= 15 THEN 'yellow' ELSE 'red' END,
    v_contacted_pct, CASE WHEN v_contacted_pct >= 50 THEN 'green' WHEN v_contacted_pct >= 25 THEN 'yellow' ELSE 'red' END,
    v_gap_filled_pct, CASE WHEN v_gap_filled_pct = 100 THEN 'green' WHEN v_gap_filled_pct >= 50 THEN 'yellow' ELSE 'red' END,
    v_p1_pct, CASE WHEN v_p1_pct = 100 THEN 'green' WHEN v_p1_pct >= 50 THEN 'yellow' ELSE 'red' END,
    v_last_update, CASE WHEN v_last_update >= NOW() - INTERVAL '7 days' THEN 'green' WHEN v_last_update >= NOW() - INTERVAL '14 days' THEN 'yellow' ELSE 'red' END,
    v_overall_score, v_overall_status
  ) ON CONFLICT (grid_mapping_id) DO UPDATE SET
    checked_at = NOW(),
    m1_company_count = v_company_count,
    m1_status = CASE WHEN v_company_count >= 15 THEN 'green' WHEN v_company_count >= 10 THEN 'yellow' ELSE 'red' END,
    m2_sector_count = v_sector_count,
    m2_status = CASE WHEN v_sector_count >= 3 THEN 'green' WHEN v_sector_count >= 2 THEN 'yellow' ELSE 'red' END,
    m3_candidate_count = v_candidate_count,
    m3_status = CASE WHEN v_candidate_count >= 30 THEN 'green' WHEN v_candidate_count >= 15 THEN 'yellow' ELSE 'red' END,
    m4_contacted_pct = v_contacted_pct,
    m4_status = CASE WHEN v_contacted_pct >= 50 THEN 'green' WHEN v_contacted_pct >= 25 THEN 'yellow' ELSE 'red' END,
    m5_gap_filled_pct = v_gap_filled_pct,
    m5_status = CASE WHEN v_gap_filled_pct = 100 THEN 'green' WHEN v_gap_filled_pct >= 50 THEN 'yellow' ELSE 'red' END,
    m6_p1_contacted_pct = v_p1_pct,
    m6_status = CASE WHEN v_p1_pct = 100 THEN 'green' WHEN v_p1_pct >= 50 THEN 'yellow' ELSE 'red' END,
    m7_last_update = v_last_update,
    m7_status = CASE WHEN v_last_update >= NOW() - INTERVAL '7 days' THEN 'green' WHEN v_last_update >= NOW() - INTERVAL '14 days' THEN 'yellow' ELSE 'red' END,
    overall_score = v_overall_score,
    overall_status = v_overall_status;

  -- Update grid_mappings.standards_summary
  UPDATE grid_mappings SET
    standards_summary = jsonb_build_object(
      'm1_companies', jsonb_build_object('count', v_company_count, 'min', 15, 'status', CASE WHEN v_company_count >= 15 THEN 'green' WHEN v_company_count >= 10 THEN 'yellow' ELSE 'red' END),
      'm2_sectors', jsonb_build_object('count', v_sector_count, 'min', 3, 'status', CASE WHEN v_sector_count >= 3 THEN 'green' WHEN v_sector_count >= 2 THEN 'yellow' ELSE 'red' END),
      'm3_candidates', jsonb_build_object('count', v_candidate_count, 'min', 30, 'status', CASE WHEN v_candidate_count >= 30 THEN 'green' WHEN v_candidate_count >= 15 THEN 'yellow' ELSE 'red' END),
      'm4_contacted', jsonb_build_object('pct', v_contacted_pct, 'target', 50, 'status', CASE WHEN v_contacted_pct >= 50 THEN 'green' WHEN v_contacted_pct >= 25 THEN 'yellow' ELSE 'red' END),
      'm5_gap_filled', jsonb_build_object('pct', v_gap_filled_pct, 'target', 100, 'status', CASE WHEN v_gap_filled_pct = 100 THEN 'green' WHEN v_gap_filled_pct >= 50 THEN 'yellow' ELSE 'red' END),
      'm6_p1_contacted', jsonb_build_object('pct', v_p1_pct, 'target', 100, 'status', CASE WHEN v_p1_pct = 100 THEN 'green' WHEN v_p1_pct >= 50 THEN 'yellow' ELSE 'red' END),
      'm7_last_update', jsonb_build_object('date', v_last_update, 'status', CASE WHEN v_last_update >= NOW() - INTERVAL '7 days' THEN 'green' WHEN v_last_update >= NOW() - INTERVAL '14 days' THEN 'yellow' ELSE 'red' END)
    ),
    updated_at = NOW()
  WHERE id = p_mapping_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. SMOKE TEST ─────────────────────────────────────────────────────
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
    RAISE NOTICE '✅ GRID Market Mapping migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ GRID Market Mapping migration FAILED — missing: %', v_missing;
  END IF;
END$$;