-- ════════════════════════════════════════════════════════════════════════
-- 20260629_canvas_profiles.sql
-- DEX AI CANVAS Executive Narrative Engine — T4 Schema Migration
-- Implements: Spec 04 (DEX-BS-004) + Technical Blueprint 04 (DEX-TB-004)
-- 6-dimensional behavioral scoring, AI-generated narratives, PDF export
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CANVAS PROFILES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.canvas_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id              UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id              UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  scorecard_id            UUID REFERENCES public.trident_scorecards(id) ON DELETE SET NULL,
  generated_by            UUID NOT NULL REFERENCES auth.users(id),
  trident_d1              NUMERIC(3,1),
  trident_d2              NUMERIC(3,1),
  trident_d3              NUMERIC(3,1),
  trident_composite       NUMERIC(3,1),
  trident_verdict         TEXT,
  c_strategic_thinking    NUMERIC(3,1) CHECK (c_strategic_thinking >= 1.0 AND c_strategic_thinking <= 10.0),
  c_communication         NUMERIC(3,1) CHECK (c_communication >= 1.0 AND c_communication <= 10.0),
  c_adaptability          NUMERIC(3,1) CHECK (c_adaptability >= 1.0 AND c_adaptability <= 10.0),
  c_team_leadership       NUMERIC(3,1) CHECK (c_team_leadership >= 1.0 AND c_team_leadership <= 10.0),
  c_decision_making       NUMERIC(3,1) CHECK (c_decision_making >= 1.0 AND c_decision_making <= 10.0),
  c_emotional_intelligence NUMERIC(3,1) CHECK (c_emotional_intelligence >= 1.0 AND c_emotional_intelligence <= 10.0),
  canvas_notes            JSONB NOT NULL DEFAULT '{}'::jsonb,
  canvas_composite        NUMERIC(3,1),
  canvas_grade            TEXT CHECK (canvas_grade IN ('A+', 'A', 'B', 'C', 'F')),
  leadership_style        TEXT,
  key_strengths           JSONB,
  blind_spots             JSONB,
  derailment_risks        JSONB,
  impact_potential        TEXT,
  stakeholder_style       TEXT,
  development_journey     TEXT,
  priority_focus_areas    JSONB,
  executive_summary       TEXT,
  pdf_url                 TEXT,
  pdf_generated_at        TIMESTAMPTZ,
  pdf_version             INTEGER DEFAULT 1,
  review_status           TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'edits_requested', 'edited')),
  reviewed_by             UUID REFERENCES auth.users(id),
  reviewed_at             TIMESTAMPTZ,
  review_notes            TEXT,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  credits_consumed        INTEGER NOT NULL DEFAULT 15
);

-- ── 2. INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_canvas_contact ON public.canvas_profiles (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_mandate ON public.canvas_profiles (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_grade ON public.canvas_profiles (canvas_grade);
CREATE INDEX IF NOT EXISTS idx_canvas_review ON public.canvas_profiles (review_status) WHERE review_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_canvas_generated ON public.canvas_profiles (generated_by);
CREATE INDEX IF NOT EXISTS idx_canvas_scorecard ON public.canvas_profiles (scorecard_id);

-- ── 3. RLS POLICIES ────────────────────────────────────────────────────
ALTER TABLE public.canvas_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Canvas profile read — generator, mandate lead, or admin" ON public.canvas_profiles
  FOR SELECT TO authenticated
  USING (
    generated_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR mandate_id IN (SELECT id FROM public.mandates WHERE lead_consultant_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create canvas profiles" ON public.canvas_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "Canvas profile update — generator or admin" ON public.canvas_profiles
  FOR UPDATE TO authenticated
  USING (
    generated_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. CONTACTS TABLE EXTENSION ────────────────────────────────────────
ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS canvas_grade TEXT CHECK (canvas_grade IN ('A+', 'A', 'B', 'C', 'F', NULL));

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS canvas_generated_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS canvas_pdf_url TEXT;

-- ── 5. HELPER FUNCTION: COMPUTE CANVAS COMPOSITE ───────────────────────
CREATE OR REPLACE FUNCTION compute_canvas_composite(
  p_strategic NUMERIC,
  p_communication NUMERIC,
  p_adaptability NUMERIC,
  p_leadership NUMERIC,
  p_decision NUMERIC,
  p_eq NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_composite NUMERIC(3,1);
  v_grade TEXT;
BEGIN
  v_composite := ROUND(((p_strategic + p_communication + p_adaptability + p_leadership + p_decision + p_eq) / 6.0)::numeric, 1);
  
  v_grade := CASE
    WHEN v_composite >= 9.0 THEN 'A+'
    WHEN v_composite >= 8.0 THEN 'A'
    WHEN v_composite >= 7.0 THEN 'B'
    WHEN v_composite >= 6.0 THEN 'C'
    ELSE 'F'
  END;
  
  RETURN jsonb_build_object(
    'canvas_composite', v_composite,
    'canvas_grade', v_grade
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 6. HELPER FUNCTION: TRIDENT → CANVAS MAPPING ───────────────────────
CREATE OR REPLACE FUNCTION trident_to_canvas_suggest(p_scorecard_id UUID) RETURNS JSONB AS $$
DECLARE
  v_scorecard RECORD;
BEGIN
  SELECT * INTO v_scorecard FROM trident_scorecards WHERE id = p_scorecard_id;
  
  IF v_scorecard IS NULL THEN
    RETURN jsonb_build_object('error', 'Scorecard not found');
  END IF;
  
  RETURN jsonb_build_object(
    'strategic_thinking', v_scorecard.d1_score,
    'communication', v_scorecard.d2_score,
    'adaptability', v_scorecard.d3_score,
    'team_leadership', v_scorecard.d2_score,
    'decision_making', ROUND(((v_scorecard.d1_score + v_scorecard.d3_score) / 2.0)::numeric, 1),
    'emotional_intelligence', v_scorecard.d3_score,
    'mapping_notes', 'Pre-populated from TRIDENT. Consultant should adjust based on behavioral observations.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. TRIGGER FUNCTION: UPDATE CONTACTS QUICK REFERENCE ───────────────
CREATE OR REPLACE FUNCTION fn_update_contact_canvas() RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET canvas_grade = NEW.canvas_grade,
      canvas_generated_at = NEW.created_at,
      canvas_pdf_url = NEW.pdf_url
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_contact_canvas
AFTER INSERT OR UPDATE ON public.canvas_profiles
FOR EACH ROW EXECUTE FUNCTION fn_update_contact_canvas();
