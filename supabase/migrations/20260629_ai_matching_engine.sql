-- ════════════════════════════════════════════════════════════════════════
-- 20260629_ai_matching_engine.sql
-- DEX AI Matching Engine — T8 Schema Migration
-- Implements: Technical Blueprint 08 (DEX-TB-008)
-- Candidate-mandate matching with TRIDENT, pipeline, and heuristic scoring
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CANDIDATE_MANDATE_MATCHES TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_mandate_matches (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                  UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id                  UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  match_score                 NUMERIC(5,2) NOT NULL DEFAULT 0
                              CHECK (match_score >= 0 AND match_score <= 100),
  match_grade                 TEXT NOT NULL DEFAULT 'MISMATCH'
                              CHECK (match_grade IN (
                                'EXCEPTIONAL', 'STRONG', 'MODERATE', 'WEAK', 'MISMATCH'
                              )),
  -- Component scores
  trident_component           NUMERIC(5,2) DEFAULT 0,
  pipeline_component          NUMERIC(5,2) DEFAULT 0,
  heuristic_component         NUMERIC(5,2) DEFAULT 0,
  -- TRIDENT data (cached at match time)
  trident_composite           NUMERIC(3,1),
  trident_verdict             TEXT,
  dimension_scores            JSONB DEFAULT '{}'::jsonb,
  -- Pipeline compatibility
  pipeline_compatibility      JSONB DEFAULT '{}'::jsonb,
  -- AI analysis (from DeepSeek)
  ai_analysis                 JSONB DEFAULT '{}'::jsonb,
  -- Metadata
  match_source                TEXT NOT NULL DEFAULT 'manual'
                              CHECK (match_source IN (
                                'manual', 'ai_sweep', 'ai_suggest', 'auto_refresh'
                              )),
  generated_at                TIMESTAMPTZ DEFAULT now(),
  generated_by                UUID REFERENCES auth.users(id),
  reviewed_by                 UUID REFERENCES auth.users(id),
  reviewed_at                 TIMESTAMPTZ,
  -- Staleness
  is_stale                    BOOLEAN DEFAULT FALSE,
  stale_reason                TEXT,
  -- Manual override
  override_score              NUMERIC(5,2),
  override_grade              TEXT CHECK (override_grade IN (
                                'EXCEPTIONAL', 'STRONG', 'MODERATE', 'WEAK', 'MISMATCH'
                              )),
  override_reason             TEXT,
  override_by                 UUID REFERENCES auth.users(id),
  UNIQUE(contact_id, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_cmm_mandate ON public.candidate_mandate_matches(mandate_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_cmm_contact ON public.candidate_mandate_matches(contact_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_cmm_grade ON public.candidate_mandate_matches(match_grade);
CREATE INDEX IF NOT EXISTS idx_cmm_stale ON public.candidate_mandate_matches(is_stale) WHERE is_stale = TRUE;
CREATE INDEX IF NOT EXISTS idx_cmm_mandate_grade ON public.candidate_mandate_matches(mandate_id, match_grade)
  WHERE match_grade IN ('EXCEPTIONAL', 'STRONG');

ALTER TABLE public.candidate_mandate_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view matches" ON public.candidate_mandate_matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can create matches" ON public.candidate_mandate_matches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team can update matches" ON public.candidate_mandate_matches
  FOR UPDATE TO authenticated USING (true);

-- ── 2. MATCH_RUNS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_runs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id                  UUID REFERENCES public.mandates(id) ON DELETE CASCADE,
  contact_id                  UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  run_type                    TEXT NOT NULL
                              CHECK (run_type IN (
                                'mandate_match', 'candidate_match', 'sweep', 'auto_refresh'
                              )),
  triggered_by                UUID REFERENCES auth.users(id),
  started_at                  TIMESTAMPTZ DEFAULT now(),
  completed_at                TIMESTAMPTZ,
  candidates_evaluated        INTEGER DEFAULT 0,
  matches_found               INTEGER DEFAULT 0,
  exceptional_count           INTEGER DEFAULT 0,
  strong_count                INTEGER DEFAULT 0,
  status                      TEXT NOT NULL DEFAULT 'running'
                              CHECK (status IN (
                                'running', 'completed', 'failed', 'partial', 'cancelled'
                              )),
  error_message               TEXT,
  parameters                  JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mr_mandate ON public.match_runs(mandate_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_contact ON public.match_runs(contact_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_status ON public.match_runs(status);

ALTER TABLE public.match_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view match runs" ON public.match_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can create match runs" ON public.match_runs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team can update match runs" ON public.match_runs
  FOR UPDATE TO authenticated USING (true);

-- ── 3. COMPUTE_MATCH_SCORE() FUNCTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_match_score(
  p_contact_id UUID,
  p_mandate_id UUID
) RETURNS TABLE (
  match_score NUMERIC,
  match_grade TEXT,
  trident_component NUMERIC,
  pipeline_component NUMERIC,
  heuristic_component NUMERIC,
  dimension_scores JSONB,
  pipeline_compatibility JSONB
) AS $$
DECLARE
  v_trident_composite   NUMERIC;
  v_trident_verdict     TEXT;
  v_d1                  NUMERIC;
  v_d2                  NUMERIC;
  v_d3                  NUMERIC;
  v_pipeline_stage      TEXT;
  v_motivation          TEXT;
  v_reach_verified      BOOLEAN;
  v_reach_unknowns      INTEGER;
  v_industry            TEXT;
  v_location            TEXT;
  v_title               TEXT;
  v_years               NUMERIC;
  v_tier                TEXT;
  v_data_confidence     NUMERIC;
  v_mandate_industry    TEXT;
  v_mandate_location    TEXT;
  v_mandate_title       TEXT;
  -- Component scores
  v_trident_score       NUMERIC := 0;
  v_pipeline_score      NUMERIC := 50;
  v_heuristic_score     NUMERIC := 50;
  v_final_score         NUMERIC;
  v_grade               TEXT;
  v_dim_scores          JSONB := '{}'::jsonb;
  v_pipeline_compat     JSONB := '{}'::jsonb;
BEGIN
  -- Get TRIDENT data (most recent scorecard for this contact+mandate)
  SELECT tc.composite_score, tc.verdict, tc.d1_score, tc.d2_score, tc.d3_score
  INTO v_trident_composite, v_trident_verdict, v_d1, v_d2, v_d3
  FROM public.trident_scorecards tc
  WHERE tc.contact_id = p_contact_id
    AND tc.mandate_id = p_mandate_id
  ORDER BY tc.created_at DESC
  LIMIT 1;

  -- Get contact data
  SELECT pipeline_stage, motivation_overall, reachability_verified,
         reachability_unknowns, industry, city, current_title,
         years_of_experience, tier, data_confidence
  INTO v_pipeline_stage, v_motivation, v_reach_verified,
       v_reach_unknowns, v_industry, v_location, v_title,
       v_years, v_tier, v_data_confidence
  FROM public.contacts
  WHERE id = p_contact_id;

  -- Get mandate data
  SELECT industry, location, title
  INTO v_mandate_industry, v_mandate_location, v_mandate_title
  FROM public.mandates
  WHERE id = p_mandate_id;

  -- ═══════════════════════════════════════════════════
  -- COMPONENT 1: TRIDENT (60% weight)
  -- ═══════════════════════════════════════════════════
  IF v_trident_composite IS NOT NULL THEN
    v_trident_score := v_trident_composite * 10;
    v_dim_scores := jsonb_build_object(
      'd1', jsonb_build_object(
        'score', v_d1,
        'fit_notes', CASE
          WHEN v_d1 >= 7 THEN 'Strong capability fit'
          WHEN v_d1 >= 5 THEN 'Moderate capability fit'
          ELSE 'Weak capability fit'
        END
      ),
      'd2', jsonb_build_object(
        'score', v_d2,
        'fit_notes', CASE
          WHEN v_d2 >= 7 THEN 'Strong behavioral fit'
          WHEN v_d2 >= 5 THEN 'Moderate behavioral fit'
          ELSE 'Weak behavioral fit'
        END
      ),
      'd3', jsonb_build_object(
        'score', v_d3,
        'fit_notes', CASE
          WHEN v_d3 >= 7 THEN 'Strong cultural fit'
          WHEN v_d3 >= 5 THEN 'Moderate cultural fit'
          ELSE 'Weak cultural fit'
        END
      )
    );
  ELSE
    -- No TRIDENT score — use heuristic proxy
    v_trident_score := COALESCE(v_data_confidence, 0) * 0.5
      + CASE v_tier
          WHEN 'A' THEN 30
          WHEN 'B' THEN 20
          WHEN 'C' THEN 10
          ELSE 0
        END;
    v_trident_score := LEAST(v_trident_score, 70);
    v_dim_scores := jsonb_build_object(
      'd1', jsonb_build_object('score', null, 'fit_notes', 'No TRIDENT score — heuristic proxy used'),
      'd2', jsonb_build_object('score', null, 'fit_notes', 'No TRIDENT score — heuristic proxy used'),
      'd3', jsonb_build_object('score', null, 'fit_notes', 'No TRIDENT score — heuristic proxy used')
    );
  END IF;

  -- ═══════════════════════════════════════════════════
  -- COMPONENT 2: PIPELINE COMPATIBILITY (20% weight)
  -- ═══════════════════════════════════════════════════
  -- Stage compatibility
  IF v_pipeline_stage IN (
    'S2_Screened', 'S5_Responded', 'S6_WeChat_Added',
    'S7_Interested', 'S9_Call_Positive', 'S11_Internal_Interview'
  ) THEN
    v_pipeline_score := v_pipeline_score + 30;
  ELSIF v_pipeline_stage = 'S1_Sourced' THEN
    v_pipeline_score := v_pipeline_score + 10;
  ELSIF v_pipeline_stage IN (
    'S4_No_Response', 'S8_Not_Interested', 'S10_Call_Negative'
  ) THEN
    v_pipeline_score := v_pipeline_score - 30;
  ELSIF v_pipeline_stage IN (
    'S12_Presented_to_Client', 'S13_Client_Int_Scheduled',
    'S14_Client_Interviewed', 'S15_Client_2nd_Interview',
    'S16_Offer_Extended', 'S17_Offer_Accepted'
  ) THEN
    v_pipeline_score := v_pipeline_score + 20;
  END IF;

  -- Motivation
  IF v_motivation = 'GREEN' THEN
    v_pipeline_score := v_pipeline_score + 15;
  ELSIF v_motivation = 'YELLOW' THEN
    v_pipeline_score := v_pipeline_score + 5;
  ELSIF v_motivation = 'RED' THEN
    v_pipeline_score := v_pipeline_score - 20;
  END IF;

  -- Reachability
  IF v_reach_verified THEN
    v_pipeline_score := v_pipeline_score + 5;
  ELSIF COALESCE(v_reach_unknowns, 5) >= 2 THEN
    v_pipeline_score := v_pipeline_score - 10;
  END IF;

  v_pipeline_score := GREATEST(0, LEAST(100, v_pipeline_score));

  v_pipeline_compat := jsonb_build_object(
    'stage_compatible', v_pipeline_stage NOT IN (
      'S4_No_Response', 'S8_Not_Interested', 'S10_Call_Negative'
    ),
    'stage', v_pipeline_stage,
    'motivation_fit', v_motivation,
    'reachability_ok', v_reach_verified OR COALESCE(v_reach_unknowns, 5) <= 1,
    'available', v_pipeline_stage NOT IN (
      'S16_Offer_Extended', 'S17_Offer_Accepted', 'S19_Closed'
    ),
    'notes', CASE
      WHEN v_pipeline_stage IN ('S7_Interested', 'S9_Call_Positive')
        THEN 'Candidate is engaged and responsive'
      WHEN v_pipeline_stage = 'S1_Sourced'
        THEN 'Not yet contacted — needs initial screening'
      WHEN v_motivation = 'RED'
        THEN 'Motivation concern — DO NOT CONTACT'
      ELSE 'Standard availability'
    END
  );

  -- ═══════════════════════════════════════════════════
  -- COMPONENT 3: HEURISTIC FIT (20% weight)
  -- ═══════════════════════════════════════════════════
  -- Industry match
  IF v_industry IS NOT NULL AND v_mandate_industry IS NOT NULL
     AND LOWER(v_industry) = LOWER(v_mandate_industry) THEN
    v_heuristic_score := v_heuristic_score + 25;
  END IF;

  -- Location match
  IF v_location IS NOT NULL AND v_mandate_location IS NOT NULL THEN
    IF LOWER(v_location) = LOWER(v_mandate_location) THEN
      v_heuristic_score := v_heuristic_score + 20;
    ELSIF LOWER(v_location) LIKE '%' || LOWER(SPLIT_PART(v_mandate_location, ' ', 1)) || '%' THEN
      v_heuristic_score := v_heuristic_score + 10;
    END IF;
  END IF;

  -- Title/seniority match (simple keyword overlap)
  IF v_title IS NOT NULL AND v_mandate_title IS NOT NULL THEN
    IF LOWER(v_title) ILIKE '%' || LOWER(SPLIT_PART(v_mandate_title, ' ', 1)) || '%' THEN
      v_heuristic_score := v_heuristic_score + 15;
    END IF;
  END IF;

  -- Experience level
  IF v_years IS NOT NULL AND v_years >= 10 THEN
    v_heuristic_score := v_heuristic_score + 10;
  ELSIF v_years IS NOT NULL AND v_years < 5 THEN
    v_heuristic_score := v_heuristic_score - 10;
  END IF;

  v_heuristic_score := GREATEST(0, LEAST(100, v_heuristic_score));

  -- ═══════════════════════════════════════════════════
  -- FINAL WEIGHTED SCORE
  -- ═══════════════════════════════════════════════════
  v_final_score := ROUND(
    v_trident_score * 0.60
    + v_pipeline_score * 0.20
    + v_heuristic_score * 0.20,
    2
  );

  -- Determine grade
  v_grade := CASE
    WHEN v_final_score >= 85 THEN 'EXCEPTIONAL'
    WHEN v_final_score >= 70 THEN 'STRONG'
    WHEN v_final_score >= 50 THEN 'MODERATE'
    WHEN v_final_score >= 30 THEN 'WEAK'
    ELSE 'MISMATCH'
  END;

  RETURN QUERY SELECT
    v_final_score,
    v_grade,
    v_trident_score,
    v_pipeline_score,
    v_heuristic_score,
    v_dim_scores,
    v_pipeline_compat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. STALENESS TRIGGERS ──────────────────────────────────────────────

-- Contact update trigger
CREATE OR REPLACE FUNCTION public.fn_mark_matches_stale_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage
     OR OLD.motivation_overall IS DISTINCT FROM NEW.motivation_overall
     OR OLD.reachability_verified IS DISTINCT FROM NEW.reachability_verified
     OR OLD.classification IS DISTINCT FROM NEW.classification THEN
    UPDATE public.candidate_mandate_matches
    SET is_stale = TRUE,
        stale_reason = 'Contact data changed: ' || CASE
          WHEN OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage
            THEN 'stage ' || OLD.pipeline_stage || '→' || NEW.pipeline_stage
          WHEN OLD.motivation_overall IS DISTINCT FROM NEW.motivation_overall
            THEN 'motivation ' || OLD.motivation_overall || '→' || NEW.motivation_overall
          ELSE 'profile updated'
        END
    WHERE contact_id = NEW.id
      AND is_stale = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_mark_matches_stale_contact ON public.contacts;
CREATE TRIGGER trg_mark_matches_stale_contact
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_mark_matches_stale_on_contact_update();

-- Scorecard update trigger
CREATE OR REPLACE FUNCTION public.fn_mark_matches_stale_on_scorecard()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.candidate_mandate_matches
  SET is_stale = TRUE,
      stale_reason = 'TRIDENT scorecard updated'
  WHERE contact_id = NEW.contact_id
    AND mandate_id = NEW.mandate_id
    AND is_stale = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_mark_matches_stale_scorecard ON public.trident_scorecards;
CREATE TRIGGER trg_mark_matches_stale_scorecard
  AFTER INSERT OR UPDATE ON public.trident_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_mark_matches_stale_on_scorecard();
