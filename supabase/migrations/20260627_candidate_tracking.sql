-- ════════════════════════════════════════════════════════════════════════
-- 20260627_candidate_tracking.sql
-- DEX AI Candidate Tracking — T1 Schema Migration (Technical Blueprint 01)
-- Implements: Spec 01 (DEX-BS-001) + Technical Blueprint 01 (DEX-TB-001)
-- GRID v2.0 Integration: 19-stage pipeline, motivation screening, reachability validation
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CONTACTS TABLE EXTENSIONS ──────────────────────────────────────

-- Pipeline: 19-stage recruitment pipeline (GRID v2.0)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'S1_Sourced'
  CHECK (pipeline_stage IN (
    'S1_Sourced', 'S2_Screened', 'S3_Contacted', 'S4_No_Response',
    'S5_Responded', 'S6_WeChat_Added', 'S7_Interested', 'S8_Not_Interested',
    'S9_Call_Positive', 'S10_Call_Negative', 'S11_Internal_Interview',
    'S12_Presented_to_Client', 'S13_Client_Int_Scheduled', 'S14_Client_Interviewed',
    'S15_Client_2nd_Interview', 'S16_Offer_Extended', 'S17_Offer_Accepted',
    'S18_Offer_Declined', 'S19_Closed'
  ));

-- Legacy compatibility: keep pipeline_status for backward compat, sync via trigger
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'S1_Sourced';

-- Motivation Screening (GRID v2.0 — pre-contact gate)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS motivation_overall TEXT DEFAULT 'UNKNOWN'
  CHECK (motivation_overall IN ('GREEN', 'YELLOW', 'RED', 'UNKNOWN'));

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS motivation_assessment JSONB DEFAULT '{}'::jsonb;

-- Reachability Validation (GRID v2.0 — pre-contact gate)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_unknowns INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS contact_channel TEXT
  CHECK (contact_channel IN ('LINKEDIN', 'EMAIL', 'WECHAT', 'NONE', NULL));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_details JSONB DEFAULT '{}'::jsonb;

-- Decline Tracking (GRID v2.0 — S8 specific)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS decline_reason TEXT
  CHECK (decline_reason IN (
    'COMPENSATION', 'ROLE_TOO_JUNIOR', 'LOCATION', 'TIMING',
    'OTHER_OFFER', 'NOT_INTERESTED', 'OTHER', NULL
  ));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS decline_notes TEXT;

-- Classification (flexible per-project)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('A', 'B', 'C'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS classification TEXT
  CHECK (classification IN (
    'CLIENT_SHORTLIST', 'OPERATOR', 'ANALYST_SENIOR', 'ANALYST_JUNIOR',
    'MOTIVATION_RISK', 'REVIEW', 'ELIMINATE', NULL
  ));

-- Other fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS years_of_experience NUMERIC;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS comp_current TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS comp_expected TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS candidate_notes TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS next_action_due DATE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS data_confidence NUMERIC DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS stage_changed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS stage_change_date DATE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('LinkedIn', 'Referral', 'Cold_Outreach', 'Database', 'Event', 'Other', 'import', 'platform'));

-- Indexes for pipeline and filtering
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON public.contacts(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_motivation ON public.contacts(motivation_overall);
CREATE INDEX IF NOT EXISTS idx_contacts_classification ON public.contacts(classification);
CREATE INDEX IF NOT EXISTS idx_contacts_reachability ON public.contacts(reachability_verified)
  WHERE reachability_verified = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_decline_reason ON public.contacts(decline_reason)
  WHERE decline_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_tier ON public.contacts(tier);
CREATE INDEX IF NOT EXISTS idx_contacts_data_confidence ON public.contacts(data_confidence);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON public.contacts(last_contacted DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_is_archived ON public.contacts(is_archived)
  WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_list_default ON public.contacts(is_archived, pipeline_stage, last_contacted DESC)
  WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_stage_active ON public.contacts(pipeline_stage)
  WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by);

-- ── 2. CANDIDATE OUTREACH LOG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_outreach_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interaction_type TEXT NOT NULL
                    CHECK (interaction_type IN (
                      'cold_call', 'email', 'wechat', 'linkedin', 'referral',
                      'event', 'interview', 'meeting', 'other'
                    )),
  summary         TEXT NOT NULL,
  outcome         TEXT
                    CHECK (outcome IN (
                      'interested', 'not_interested', 'follow_up', 'no_response',
                      'scheduled', 'completed', 'declined'
                    )),
  next_step       TEXT,
  next_step_date  DATE,
  notes           TEXT,
  signal_id       UUID -- links to signals table (Tech-00)
);

CREATE INDEX IF NOT EXISTS idx_outreach_contact ON public.candidate_outreach_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_outreach_created_at ON public.candidate_outreach_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_created_by ON public.candidate_outreach_log(created_by);

ALTER TABLE public.candidate_outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view outreach logs"
  ON public.candidate_outreach_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create outreach logs"
  ON public.candidate_outreach_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team can update own outreach logs"
  ON public.candidate_outreach_log FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- ── 3. CANDIDATE MANDATE LINKS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_mandate_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id      UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'identified'
                    CHECK (status IN (
                      'identified', 'sourced', 'screened', 'shortlisted', 'presented',
                      'interview', 'offer', 'placed', 'withdrawn', 'rejected'
                    )),
  priority        TEXT CHECK (priority IN ('P1', 'P2', 'P3')),
  notes           TEXT,
  -- GRID positioning
  market_position TEXT,
  sector_benchmark TEXT,
  salary_band     TEXT,
  talent_density  TEXT,
  competitor_presence TEXT,
  UNIQUE(contact_id, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_cmdl_contact ON public.candidate_mandate_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_cmdl_mandate ON public.candidate_mandate_links(mandate_id);
CREATE INDEX IF NOT EXISTS idx_cmdl_status ON public.candidate_mandate_links(status);
CREATE INDEX IF NOT EXISTS idx_cmdl_priority ON public.candidate_mandate_links(priority);

ALTER TABLE public.candidate_mandate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view mandate links"
  ON public.candidate_mandate_links FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create mandate links"
  ON public.candidate_mandate_links FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team can update mandate links"
  ON public.candidate_mandate_links FOR UPDATE TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_cmdl_updated_at ON public.candidate_mandate_links;
CREATE TRIGGER trg_cmdl_updated_at
  BEFORE UPDATE ON public.candidate_mandate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. SAVED SEARCHES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT NOT NULL,
  filters     JSONB NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage own saved searches"
  ON public.saved_searches FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- ── 5. IMPORT LOGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.import_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_name     TEXT NOT NULL,
  source_format   TEXT NOT NULL
                    CHECK (source_format IN ('csv', 'json', 'api')),
  total_rows      INTEGER NOT NULL,
  imported_count  INTEGER DEFAULT 0,
  skipped_count   INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  error_count     INTEGER DEFAULT 0,
  errors          JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'processing'
                    CHECK (status IN ('processing', 'completed', 'failed', 'partial'))
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view import logs"
  ON public.import_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create import logs"
  ON public.import_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 6. PIPELINE TRANSITIONS (GRID v2.0) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_transitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  from_stage          TEXT NOT NULL,
  to_stage            TEXT NOT NULL,
  changed_by          UUID REFERENCES auth.users(id),
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason              TEXT,
  -- Validation snapshot
  motivation_overall  TEXT,
  reachability_verified BOOLEAN,
  reachability_unknowns INTEGER,
  decline_reason      TEXT,
  decline_notes       TEXT,
  -- Metadata
  is_backward         BOOLEAN NOT NULL DEFAULT FALSE,
  notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_pt_contact ON public.pipeline_transitions(contact_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_stage ON public.pipeline_transitions(to_stage, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_backward ON public.pipeline_transitions(is_backward)
  WHERE is_backward = TRUE;
CREATE INDEX IF NOT EXISTS idx_pt_changed_by ON public.pipeline_transitions(changed_by);

ALTER TABLE public.pipeline_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view pipeline transitions"
  ON public.pipeline_transitions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create pipeline transitions"
  ON public.pipeline_transitions FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 7. S2→S3 GATE VALIDATION FUNCTION (GRID v2.0) ───────────────────────
CREATE OR REPLACE FUNCTION public.fn_validate_s2_to_s3_gate(p_contact_id UUID)
RETURNS TABLE (
  can_proceed BOOLEAN,
  block_reason TEXT,
  motivation_overall TEXT,
  reachability_unknowns INTEGER
) AS $$
DECLARE
  v_motivation TEXT;
  v_reach_unknowns INTEGER;
  v_reach_verified BOOLEAN;
  v_contact_channel TEXT;
BEGIN
  SELECT motivation_overall, reachability_unknowns, reachability_verified, contact_channel
  INTO v_motivation, v_reach_unknowns, v_reach_verified, v_contact_channel
  FROM contacts WHERE id = p_contact_id;

  -- Check motivation: must be GREEN or YELLOW (not RED, not UNKNOWN)
  IF v_motivation = 'RED' THEN
    RETURN QUERY SELECT false, 'Motivation is RED — do not contact', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  IF v_motivation = 'UNKNOWN' THEN
    RETURN QUERY SELECT false, 'Motivation not yet assessed — complete motivation screening first', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  -- Check reachability: max 1 unknown allowed
  IF v_reach_unknowns >= 2 THEN
    RETURN QUERY SELECT false,
      'Reachability: ' || v_reach_unknowns || ' unknowns (max 1 allowed)',
      v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  -- Check contact channel
  IF v_contact_channel = 'NONE' OR v_contact_channel IS NULL THEN
    RETURN QUERY SELECT false, 'No contact channel available', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, NULL, v_motivation, v_reach_unknowns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. PIPELINE STAGE TRANSITION TRIGGER ───────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_log_pipeline_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_is_backward BOOLEAN := FALSE;
  v_stage_order TEXT[] := ARRAY[
    'S1_Sourced', 'S2_Screened', 'S3_Contacted', 'S4_No_Response',
    'S5_Responded', 'S6_WeChat_Added', 'S7_Interested', 'S8_Not_Interested',
    'S9_Call_Positive', 'S10_Call_Negative', 'S11_Internal_Interview',
    'S12_Presented_to_Client', 'S13_Client_Int_Scheduled', 'S14_Client_Interviewed',
    'S15_Client_2nd_Interview', 'S16_Offer_Extended', 'S17_Offer_Accepted',
    'S18_Offer_Declined', 'S19_Closed'
  ];
  v_from_idx INTEGER;
  v_to_idx INTEGER;
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    -- Determine if backward move
    SELECT ARRAY_POSITION(v_stage_order, OLD.pipeline_stage) INTO v_from_idx;
    SELECT ARRAY_POSITION(v_stage_order, NEW.pipeline_stage) INTO v_to_idx;

    IF v_from_idx IS NOT NULL AND v_to_idx IS NOT NULL AND v_to_idx < v_from_idx THEN
      v_is_backward := TRUE;
    END IF;

    -- Insert transition record
    INSERT INTO pipeline_transitions (
      contact_id, from_stage, to_stage, changed_by, reason,
      motivation_overall, reachability_verified, reachability_unknowns,
      decline_reason, decline_notes, is_backward
    ) VALUES (
      NEW.id, OLD.pipeline_stage, NEW.pipeline_stage,
      NEW.stage_changed_by, NEW.candidate_notes,
      NEW.motivation_overall, NEW.reachability_verified, NEW.reachability_unknowns,
      NEW.decline_reason, NEW.decline_notes, v_is_backward
    );

    -- Sync legacy pipeline_status
    NEW.pipeline_status := NEW.pipeline_stage;
    NEW.stage_change_date := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pipeline_transition ON public.contacts;
CREATE TRIGGER trg_pipeline_transition
  BEFORE UPDATE OF pipeline_stage ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_pipeline_transition();

-- ── 9. OUTREACH LOG SIGNAL TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_outreach_log_signal()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert signal
  INSERT INTO signals (contact_id, type, source, title, metadata, actor_id)
  VALUES (
    NEW.contact_id,
    'outreach',
    'platform',
    NEW.summary,
    jsonb_build_object(
      'interaction_type', NEW.interaction_type,
      'outcome', NEW.outcome,
      'summary', NEW.summary
    ),
    NEW.created_by
  );

  -- Update contacts timestamps
  UPDATE contacts SET
    signal_count = COALESCE(signal_count, 0) + 1,
    last_signal_at = NOW(),
    last_contacted = NOW()
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_outreach_log_signal ON public.candidate_outreach_log;
CREATE TRIGGER trg_outreach_log_signal
  AFTER INSERT ON public.candidate_outreach_log
  FOR EACH ROW EXECUTE FUNCTION public.fn_outreach_log_signal();

-- ── 10. CMDL STATUS SIGNAL TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_cmdl_status_signal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO signals (contact_id, mandate_id, type, source, title, metadata, actor_id)
    VALUES (
      NEW.contact_id,
      NEW.mandate_id,
      'status_change',
      'system',
      'Candidate status changed: ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'table', 'candidate_mandate_links'
      ),
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cmdl_status_signal ON public.candidate_mandate_links;
CREATE TRIGGER trg_cmdl_status_signal
  AFTER UPDATE OF status ON public.candidate_mandate_links
  FOR EACH ROW EXECUTE FUNCTION public.fn_cmdl_status_signal();

-- ── 11. DATA CONFIDENCE CALCULATION ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_calculate_data_confidence()
RETURNS TRIGGER AS $$
DECLARE
  v_confidence NUMERIC;
  v_filled INTEGER := 0;
  v_total INTEGER := 10;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.current_title IS NOT NULL AND NEW.current_title != '' THEN v_filled := v_filled + 1; END IF;
  IF (NEW.city IS NOT NULL AND NEW.city != '') OR (NEW.country IS NOT NULL AND NEW.country != '') THEN v_filled := v_filled + 1; END IF;
  IF NEW.industry IS NOT NULL AND NEW.industry != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.years_of_experience IS NOT NULL THEN v_filled := v_filled + 1; END IF;
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.skills IS NOT NULL AND NEW.skills != '{}'::jsonb AND jsonb_array_length(COALESCE(NEW.skills, '[]'::jsonb)) > 0 THEN v_filled := v_filled + 1; END IF;
  IF NEW.languages IS NOT NULL AND NEW.languages != '{}'::jsonb AND jsonb_array_length(COALESCE(NEW.languages, '[]'::jsonb)) > 0 THEN v_filled := v_filled + 1; END IF;
  IF NEW.comp_current IS NOT NULL AND NEW.comp_current != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.tier IS NOT NULL THEN v_filled := v_filled + 1; END IF;

  v_confidence := ROUND((v_filled::NUMERIC / v_total) * 100);
  NEW.data_confidence := v_confidence;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_confidence ON public.contacts;
CREATE TRIGGER trg_data_confidence
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_data_confidence();

-- ── 12. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'candidate_outreach_log', 'candidate_mandate_links',
    'saved_searches', 'import_logs', 'pipeline_transitions'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ Candidate Tracking migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ Candidate Tracking migration FAILED — missing: %', v_missing;
  END IF;

  -- Verify contacts columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'pipeline_stage'
  ) THEN
    RAISE EXCEPTION 'contacts.pipeline_stage column missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'motivation_overall'
  ) THEN
    RAISE EXCEPTION 'contacts.motivation_overall column missing';
  END IF;

  RAISE NOTICE '✅ contacts table extensions verified';
END$$;