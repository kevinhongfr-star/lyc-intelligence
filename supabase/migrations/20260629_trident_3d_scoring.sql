-- ════════════════════════════════════════════════════════════════════════
-- 20260629_trident_3d_scoring.sql
-- DEX AI TRIDENT 3D Scoring Engine — T3 Schema Migration (Technical Blueprint 03)
-- Implements: Spec 03 (DEX-BS-003) + Technical Blueprint 03 (DEX-TB-003)
-- 3D scoring (D1/D2/D3), pre-flight checks, SWEEP mode, Kevin review gate
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. TRIDENT SCORECARDS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trident_scorecards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id          UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  scored_by           UUID NOT NULL REFERENCES auth.users(id),
  d1_score            NUMERIC(3,1) NOT NULL CHECK (d1_score >= 1.0 AND d1_score <= 10.0),
  d2_score            NUMERIC(3,1) NOT NULL CHECK (d2_score >= 1.0 AND d2_score <= 10.0),
  d3_score            NUMERIC(3,1) NOT NULL CHECK (d3_score >= 1.0 AND d3_score <= 10.0),
  d1_sub              JSONB NOT NULL DEFAULT '{}'::jsonb,
  d2_sub              JSONB NOT NULL DEFAULT '{}'::jsonb,
  d3_sub              JSONB NOT NULL DEFAULT '{}'::jsonb,
  d1_evidence         TEXT NOT NULL,
  d2_evidence         TEXT NOT NULL,
  d3_evidence         TEXT NOT NULL,
  d1_confidence       TEXT NOT NULL DEFAULT 'Medium' CHECK (d1_confidence IN ('High', 'Medium', 'Low')),
  d2_confidence       TEXT NOT NULL DEFAULT 'Medium' CHECK (d2_confidence IN ('High', 'Medium', 'Low')),
  d3_confidence       TEXT NOT NULL DEFAULT 'Medium' CHECK (d3_confidence IN ('High', 'Medium', 'Low')),
  composite_score     NUMERIC(3,1) NOT NULL,
  verdict             TEXT NOT NULL CHECK (verdict IN ('Exceptional Primary', 'Strong', 'Solid', 'Conditional', 'Not Recommended')),
  segment             TEXT NOT NULL CHECK (segment IN ('A', 'B', 'C')),
  recommendation      TEXT,
  preflight           JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_status       TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'adjusted', 'info_requested')),
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  review_notes        TEXT,
  original_d1         NUMERIC(3,1),
  original_d2         NUMERIC(3,1),
  original_d3         NUMERIC(3,1),
  original_composite  NUMERIC(3,1),
  credits_consumed    INTEGER NOT NULL DEFAULT 10,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  stale_flag          BOOLEAN NOT NULL DEFAULT FALSE,
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trident_contact ON public.trident_scorecards (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trident_mandate ON public.trident_scorecards (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trident_verdict ON public.trident_scorecards (verdict);
CREATE INDEX IF NOT EXISTS idx_trident_segment ON public.trident_scorecards (segment);
CREATE INDEX IF NOT EXISTS idx_trident_review ON public.trident_scorecards (review_status) WHERE review_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_trident_composite ON public.trident_scorecards (composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_trident_scored_by ON public.trident_scorecards (scored_by);
CREATE INDEX IF NOT EXISTS idx_trident_stale ON public.trident_scorecards (stale_flag) WHERE stale_flag = TRUE;

ALTER TABLE public.trident_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trident scorecard read — scorer, mandate owner, or admin"
  ON public.trident_scorecards FOR SELECT TO authenticated
  USING (
    scored_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR mandate_id IN (SELECT id FROM mandates WHERE lead_consultant_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create scorecards"
  ON public.trident_scorecards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = scored_by);

CREATE POLICY "Trident scorecard update — scorer or admin"
  ON public.trident_scorecards FOR UPDATE TO authenticated
  USING (
    scored_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_trident_updated_at ON public.trident_scorecards;
CREATE TRIGGER trg_trident_updated_at
  BEFORE UPDATE ON public.trident_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. CONTACTS TABLE EXTENSION (quick reference) ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_composite') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_composite NUMERIC(3,1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_verdict') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_verdict TEXT CHECK (trident_verdict IN ('Exceptional Primary', 'Strong', 'Solid', 'Conditional', 'Not Recommended', NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_segment') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_segment TEXT CHECK (trident_segment IN ('A', 'B', 'C', NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_scored_at') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_scored_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'data_confidence') THEN
    ALTER TABLE public.contacts ADD COLUMN data_confidence NUMERIC(3,2) DEFAULT 0.5;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Contact extension error: %', SQLERRM;
END$$;

-- ── 3. HELPER FUNCTION: COMPOSITE & VERDICT ──────────────────────────
CREATE OR REPLACE FUNCTION public.compute_trident_composite(
  p_d1 NUMERIC,
  p_d2 NUMERIC,
  p_d3 NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_composite NUMERIC(3,1);
  v_verdict TEXT;
  v_segment TEXT;
BEGIN
  v_composite := ROUND((p_d1 * 0.30 + p_d2 * 0.40 + p_d3 * 0.30)::numeric, 1);

  v_verdict := CASE
    WHEN v_composite >= 9.0 THEN 'Exceptional Primary'
    WHEN v_composite >= 8.0 THEN 'Strong'
    WHEN v_composite >= 7.0 THEN 'Solid'
    WHEN v_composite >= 6.0 THEN 'Conditional'
    ELSE 'Not Recommended'
  END;

  v_segment := CASE
    WHEN v_composite >= 8.0 THEN 'A'
    WHEN v_composite >= 6.5 THEN 'B'
    ELSE 'C'
  END;

  RETURN jsonb_build_object(
    'composite_score', v_composite,
    'verdict', v_verdict,
    'segment', v_segment
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 4. HELPER FUNCTION: PRE-FLIGHT CHECKS ─────────────────────────────
CREATE OR REPLACE FUNCTION public.trident_preflight(
  p_contact_id UUID,
  p_mandate_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_contact RECORD;
  v_check_identity TEXT := 'PASS';
  v_check_jd TEXT := 'PASS';
  v_check_signal TEXT := 'PASS';
  v_check_readiness TEXT := 'PASS';
  v_check_compliance TEXT := 'PASS';
  v_data_confidence NUMERIC;
  v_flags TEXT[] := '{}';
  v_overall TEXT;
BEGIN
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;

  IF v_contact IS NULL THEN
    RETURN jsonb_build_object('overall', 'HALT', 'reason', 'Contact not found');
  END IF;

  -- Check 1: Identity Verification
  IF v_contact.full_name IS NULL OR v_contact.company_name IS NULL THEN
    v_check_identity := 'HALT';
    v_flags := v_flags || 'Missing name or company';
  ELSIF v_contact.linkedin_url IS NULL THEN
    v_check_identity := 'WARN';
    v_flags := v_flags || 'No LinkedIn URL for verification';
  END IF;

  -- Check 2: JD Alignment
  IF p_mandate_id IS NOT NULL THEN
    DECLARE v_mandate RECORD;
    BEGIN
      SELECT * INTO v_mandate FROM mandates WHERE id = p_mandate_id;
      IF v_mandate IS NULL THEN
        v_check_jd := 'HALT';
        v_flags := v_flags || 'Mandate not found';
      ELSIF v_mandate.job_description IS NULL OR v_mandate.job_description = '' THEN
        v_check_jd := 'HALT';
        v_flags := v_flags || 'No job description defined for mandate';
      ELSIF v_mandate.role_title IS NULL THEN
        v_check_jd := 'WARN';
        v_flags := v_flags || 'JD missing role title / seniority level';
      END IF;
    END;
  ELSE
    v_check_jd := 'WARN';
    v_flags := v_flags || 'No mandate linked — JD alignment not checked';
  END IF;

  -- Check 3: Signal Integrity (data confidence)
  v_data_confidence := COALESCE(v_contact.data_confidence, 0.5);
  IF v_data_confidence < 0.3 THEN
    v_check_signal := 'HALT';
    v_flags := v_flags || 'Data confidence < 30% — too little data to score';
  ELSIF v_data_confidence < 0.6 THEN
    v_check_signal := 'WARN';
    v_flags := v_flags || 'Data confidence 30-59% — scoring may be unreliable';
  END IF;

  -- Check 4: TRIDENT Readiness (pipeline stage)
  IF v_contact.pipeline_stage IN ('S1_Sourced') THEN
    v_check_readiness := 'HALT';
    v_flags := v_flags || 'Candidate not yet screened — must be S2 or later';
  ELSIF v_contact.pipeline_stage IN ('S2_Screened') THEN
    v_check_readiness := 'WARN';
    v_flags := v_flags || 'Preliminary scoring only — candidate still at screening stage';
  END IF;

  -- Check 5: Compliance / Conflict
  IF v_contact.metadata IS NOT NULL AND v_contact.metadata ? 'conflict_flag' THEN
    IF (v_contact.metadata->>'conflict_flag')::boolean = TRUE THEN
      v_check_compliance := 'HALT';
      v_flags := v_flags || 'Active conflict of interest detected';
    END IF;
  END IF;

  -- Overall
  IF v_check_identity = 'HALT' OR v_check_jd = 'HALT' OR v_check_signal = 'HALT'
     OR v_check_readiness = 'HALT' OR v_check_compliance = 'HALT' THEN
    v_overall := 'HALT';
  ELSIF v_check_identity = 'WARN' OR v_check_jd = 'WARN' OR v_check_signal = 'WARN'
        OR v_check_readiness = 'WARN' OR v_check_compliance = 'WARN' THEN
    v_overall := 'PROCEED_WITH_FLAGS';
  ELSE
    v_overall := 'PROCEED';
  END IF;

  RETURN jsonb_build_object(
    'identity_verification', v_check_identity,
    'jd_alignment', v_check_jd,
    'signal_integrity', v_check_signal,
    'trident_readiness', v_check_readiness,
    'compliance_conflict', v_check_compliance,
    'overall', v_overall,
    'flags', v_flags
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. AUTO-UPDATE CONTACTS ON SCORECARD SAVE ──────────────────────────
CREATE OR REPLACE FUNCTION public.fn_update_contact_trident()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contacts
  SET
    trident_composite = NEW.composite_score,
    trident_verdict = NEW.verdict,
    trident_segment = NEW.segment,
    trident_scored_at = NEW.scored_at
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trident_contact_sync ON public.trident_scorecards;
CREATE TRIGGER trg_trident_contact_sync
  AFTER INSERT OR UPDATE OF composite_score, verdict, segment ON public.trident_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_contact_trident();

-- ── 6. STALENESS FLAG (called by cron) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_flag_stale_trident()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.trident_scorecards
  SET stale_flag = TRUE
  WHERE stale_flag = FALSE AND scored_at < NOW() - INTERVAL '6 months';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ── 7. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY['trident_scorecards']) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ TRIDENT 3D scoring migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ TRIDENT migration FAILED — missing: %', v_missing;
  END IF;
END$$;