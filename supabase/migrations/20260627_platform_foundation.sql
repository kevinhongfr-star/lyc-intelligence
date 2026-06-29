-- ════════════════════════════════════════════════════════════════════════
-- 20260627_platform_foundation.sql
-- DEX AI Platform Foundation — T1 Schema Migration
-- Implements: Spec 00 (DEX-BS-000) + Technical Blueprint 00 (DEX-TB-000)
-- Decisions: D-1 (orchestration IN MVP), D-2 (restricted RLS),
--            D-3 (all L2), D-5 (fully auto enrichment)
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. SIGNALS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL
                    CHECK (type IN (
                      'email','meeting','comment','assessment','status_change',
                      'feedback','upload','linkedin','outreach','grid_report',
                      'mandate_phase','enrichment_advance')),
  source          TEXT NOT NULL
                    CHECK (source IN (
                      'platform','linkedin','email','feishu','notion','agent','import')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id        UUID REFERENCES auth.users(id),
  agent_id        TEXT,  -- 'trident','canvas','grid','sweep','alessio'
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title           TEXT,
  content         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights        JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  action_status   TEXT NOT NULL DEFAULT 'none'
                    CHECK (action_status IN ('none','pending','acknowledged','resolved')),
  processed_by    TEXT,
  processed_at    TIMESTAMPTZ,
  raw_data        JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_signals_type ON public.signals (type);
CREATE INDEX IF NOT EXISTS idx_signals_contact ON public.signals (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_mandate ON public.signals (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_company ON public.signals (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_actor ON public.signals (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created ON public.signals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_action ON public.signals (action_required, action_status)
  WHERE action_required = TRUE;

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- D-2: Restricted RLS
-- All authenticated users can write (INSERT)
CREATE POLICY "Authenticated users can create signals"
  ON public.signals FOR INSERT TO authenticated
  WITH CHECK (true);

-- Read: owner + team lead + Kevin (admin)
CREATE POLICY "Signal read — owner, team lead, or admin"
  ON public.signals FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'team_lead')
  );

-- Update/DELETE: service role only (system-managed)
CREATE POLICY "Service role full access on signals"
  ON public.signals FOR ALL
  USING (auth.role() = 'service_role');

-- ── 2. AGENT ACTIONS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT NOT NULL,  -- 'trident','canvas','grid','sweep','alessio'
  action_type     TEXT NOT NULL
                    CHECK (action_type IN (
                      'score','narrate','map','research','notify','draft','enrich','parse')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  triggered_by    UUID REFERENCES auth.users(id),
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  input_data      JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence      NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  -- D-3: all L2 — draft & queue
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','executed','rejected','failed')),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  executed_at     TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_agent ON public.agent_actions (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON public.agent_actions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_contact ON public.agent_actions (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_reviewer ON public.agent_actions (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

-- RLS: same as signals (restricted)
CREATE POLICY "Authenticated users can create agent actions"
  ON public.agent_actions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agent action read — actor, team lead, or admin"
  ON public.agent_actions FOR SELECT TO authenticated
  USING (
    triggered_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'team_lead')
  );

CREATE POLICY "Authenticated users can review agent actions"
  ON public.agent_actions FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','team_lead'))
  );

CREATE POLICY "Service role full access on agent_actions"
  ON public.agent_actions FOR ALL
  USING (auth.role() = 'service_role');

-- ── 3. CONTACTS TABLE EXTENSIONS ─────────────────────────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_scores JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS canvas_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS grid_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'raw'
  CHECK (enrichment_status IN ('raw','linkedin_parsed','scored','narrated','complete'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS signal_count INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_signal_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contacts_enrichment ON public.contacts (enrichment_status);
CREATE INDEX IF NOT EXISTS idx_contacts_signal_count ON public.contacts (signal_count DESC);

-- ── 4. TRIGGER FUNCTIONS ─────────────────────────────────────────────

-- Auto-increment signal_count on contacts when signal is created
CREATE OR REPLACE FUNCTION public.fn_signal_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET signal_count = COALESCE(signal_count, 0) + 1,
        last_signal_at = NEW.created_at
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_signal_after_insert ON public.signals;
CREATE TRIGGER trg_signal_after_insert
  AFTER INSERT ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.fn_signal_after_insert();

-- Auto-advance enrichment status
CREATE OR REPLACE FUNCTION public.fn_auto_advance_enrichment(p_contact_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current TEXT;
  v_has_linkedin BOOLEAN;
  v_has_trident BOOLEAN;
  v_has_canvas BOOLEAN;
BEGIN
  SELECT enrichment_status INTO v_current FROM contacts WHERE id = p_contact_id;
  IF v_current IS NULL THEN v_current := 'raw'; END IF;

  SELECT (linkedin_url IS NOT NULL OR EXISTS (
    SELECT 1 FROM signals WHERE contact_id = p_contact_id AND type = 'linkedin'
  )) INTO v_has_linkedin;

  SELECT (
    trident_composite IS NOT NULL
    OR (trident_scores IS NOT NULL AND trident_scores != '{}'::jsonb)
  ) INTO v_has_trident FROM contacts WHERE id = p_contact_id;

  SELECT (canvas_profile IS NOT NULL AND canvas_profile != '{}'::jsonb)
  INTO v_has_canvas FROM contacts WHERE id = p_contact_id;

  -- Advance: raw → linkedin_parsed
  IF v_current = 'raw' AND v_has_linkedin THEN
    UPDATE contacts SET enrichment_status = 'linkedin_parsed' WHERE id = p_contact_id;
    INSERT INTO signals (type, source, contact_id, title, metadata)
    VALUES (
      'enrichment_advance', 'platform', p_contact_id,
      'Enrichment: raw → linkedin_parsed',
      '{"from":"raw","to":"linkedin_parsed"}'::jsonb
    );
    v_current := 'linkedin_parsed';
  END IF;

  -- Advance: linkedin_parsed → scored
  IF v_current = 'linkedin_parsed' AND v_has_trident THEN
    UPDATE contacts SET enrichment_status = 'scored' WHERE id = p_contact_id;
    INSERT INTO signals (type, source, contact_id, title, metadata)
    VALUES (
      'enrichment_advance', 'platform', p_contact_id,
      'Enrichment: linkedin_parsed → scored',
      '{"from":"linkedin_parsed","to":"scored"}'::jsonb
    );
    v_current := 'scored';
  END IF;

  -- Advance: scored → narrated
  IF v_current = 'scored' AND v_has_canvas THEN
    UPDATE contacts SET enrichment_status = 'narrated' WHERE id = p_contact_id;
    INSERT INTO signals (type, source, contact_id, title, metadata)
    VALUES (
      'enrichment_advance', 'platform', p_contact_id,
      'Enrichment: scored → narrated',
      '{"from":"scored","to":"narrated"}'::jsonb
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY['signals', 'agent_actions']) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE 'Platform Foundation migration OK — signals + agent_actions present';
  ELSE
    RAISE EXCEPTION 'Platform Foundation migration FAILED — missing: %', v_missing;
  END IF;

  -- Verify contacts columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'enrichment_status'
  ) THEN
    RAISE EXCEPTION 'contacts.enrichment_status column missing';
  END IF;

  RAISE NOTICE 'contacts table extensions verified';
END$$;
