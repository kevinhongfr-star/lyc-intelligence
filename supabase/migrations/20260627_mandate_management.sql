-- ════════════════════════════════════════════════════════════════════════
-- 20260627_mandate_management.sql
-- DEX AI Mandate Management — T6 Schema Migration (Technical Blueprint 06)
-- Implements: Spec 06 (DEX-BS-006) + Technical Blueprint 06 (DEX-TB-006)
-- Phase lifecycle, payment milestones, analytics snapshots, handoff
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. MANDATES TABLE EXTENSIONS ───────────────────────────────────────
DO $$
BEGIN
  -- Phase lifecycle tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'phase') THEN
    ALTER TABLE public.mandates ADD COLUMN phase TEXT DEFAULT 'kickoff'
      CHECK (phase IN ('kickoff', 'sourcing', 'shortlisting', 'interview', 'offer', 'close', 'on_hold', 'cancelled', 'completed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'phase_entered_at') THEN
    ALTER TABLE public.mandates ADD COLUMN phase_entered_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'phase_history') THEN
    ALTER TABLE public.mandates ADD COLUMN phase_history JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Payment tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'fee_structure') THEN
    ALTER TABLE public.mandates ADD COLUMN fee_structure TEXT DEFAULT 'retainer_30_40_30';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'fee_amount') THEN
    ALTER TABLE public.mandates ADD COLUMN fee_amount NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'fee_currency') THEN
    ALTER TABLE public.mandates ADD COLUMN fee_currency TEXT DEFAULT 'CNY';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'payment_milestones') THEN
    ALTER TABLE public.mandates ADD COLUMN payment_milestones JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Consultant assignment
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'lead_consultant_id') THEN
    ALTER TABLE public.mandates ADD COLUMN lead_consultant_id UUID REFERENCES public.auth_users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'executive_sponsor_id') THEN
    ALTER TABLE public.mandates ADD COLUMN executive_sponsor_id UUID REFERENCES public.auth_users(id);
  END IF;

  -- Handoff
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'handoff_notes') THEN
    ALTER TABLE public.mandates ADD COLUMN handoff_notes JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'previous_consultant_id') THEN
    ALTER TABLE public.mandates ADD COLUMN previous_consultant_id UUID REFERENCES public.auth_users(id);
  END IF;

  -- GRID reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'current_grid_mapping_id') THEN
    ALTER TABLE public.mandates ADD COLUMN current_grid_mapping_id UUID REFERENCES public.grid_mappings(id);
  END IF;

  -- Actual close date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'actual_close_date') THEN
    ALTER TABLE public.mandates ADD COLUMN actual_close_date TIMESTAMPTZ;
  END IF;

  -- Target close date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'target_close_date') THEN
    ALTER TABLE public.mandates ADD COLUMN target_close_date DATE;
  END IF;

  RAISE NOTICE '✅ Mandate extensions applied';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Mandate extension error (may be already applied): %', SQLERRM;
END$$;

-- ── 2. ADD INDEXES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mandates_phase ON public.mandates(phase);
CREATE INDEX IF NOT EXISTS idx_mandates_consultant ON public.mandates(lead_consultant_id);
CREATE INDEX IF NOT EXISTS idx_mandates_status_phase ON public.mandates(status, phase);

-- ── 3. MANDATE PAYMENT MILESTONES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mandate_payment_milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id          UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  milestone_number    INTEGER NOT NULL CHECK (milestone_number IN (1, 2, 3)),
  percentage          NUMERIC NOT NULL,
  amount              NUMERIC NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'CNY',
  trigger_event       TEXT NOT NULL,
  trigger_description TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'due', 'invoiced', 'paid', 'overdue', 'waived')),
  due_date            DATE,
  expected_date       DATE,
  invoice_date        DATE,
  paid_date           DATE,
  paid_amount         NUMERIC,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mandate_id, milestone_number)
);

CREATE INDEX IF NOT EXISTS idx_payment_mandate ON public.mandate_payment_milestones(mandate_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON public.mandate_payment_milestones(status);
CREATE INDEX IF NOT EXISTS idx_payment_due_date ON public.mandate_payment_milestones(due_date);

ALTER TABLE public.mandate_payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view payment milestones"
  ON public.mandate_payment_milestones FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage payment milestones"
  ON public.mandate_payment_milestones FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

DROP TRIGGER IF EXISTS trg_payment_updated_at ON public.mandate_payment_milestones;
CREATE TRIGGER trg_payment_updated_at
  BEFORE UPDATE ON public.mandate_payment_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-set status to 'due' when trigger event occurs
CREATE OR REPLACE FUNCTION public.fn_payment_milestone_due()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    IF NEW.trigger_event = 'engagement_signed'
       AND EXISTS (SELECT 1 FROM mandates WHERE id = NEW.mandate_id AND phase != 'kickoff') THEN
      NEW.status := 'due';
      NEW.due_date := CURRENT_DATE + INTERVAL '7 days';
    ELSIF NEW.trigger_event = 'shortlist_presented'
       AND EXISTS (SELECT 1 FROM candidate_mandate_links WHERE mandate_id = NEW.mandate_id AND status IN ('shortlisted', 'presented')) THEN
      NEW.status := 'due';
      NEW.due_date := CURRENT_DATE + INTERVAL '14 days';
    ELSIF NEW.trigger_event = 'candidate_started'
       AND EXISTS (SELECT 1 FROM candidate_mandate_links WHERE mandate_id = NEW.mandate_id AND status = 'placed') THEN
      NEW.status := 'due';
      NEW.due_date := CURRENT_DATE + INTERVAL '30 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_payment_milestone_due ON public.mandate_payment_milestones;
CREATE TRIGGER trg_payment_milestone_due
  BEFORE INSERT OR UPDATE ON public.mandate_payment_milestones
  FOR EACH ROW EXECUTE FUNCTION public.fn_payment_milestone_due();

-- ── 4. MANDATE ANALYTICS SNAPSHOTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mandate_analytics_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  total_active_mandates     INTEGER,
  total_completed_mandates  INTEGER,
  total_cancelled_mandates  INTEGER,
  avg_time_to_fill          INTEGER,
  placement_rate            NUMERIC,
  avg_candidates_per_mandate NUMERIC,
  avg_pipeline_velocity     NUMERIC,
  avg_client_feedback_time  NUMERIC,
  total_fee_pipeline        NUMERIC,
  total_fee_collected       NUMERIC,
  phase_distribution        JSONB,
  consultant_workload       JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

ALTER TABLE public.mandate_analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view analytics"
  ON public.mandate_analytics_snapshots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create snapshots"
  ON public.mandate_analytics_snapshots FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 5. COMPUTE MANDATE ANALYTICS ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_compute_mandate_analytics()
RETURNS VOID AS $$
DECLARE
  v_active INTEGER;
  v_completed INTEGER;
  v_cancelled INTEGER;
  v_placement_rate NUMERIC;
  v_avg_time NUMERIC;
  v_avg_candidates NUMERIC;
  v_avg_velocity NUMERIC;
  v_avg_feedback NUMERIC;
  v_total_pipeline NUMERIC;
  v_total_collected NUMERIC;
  v_phase_dist JSONB;
BEGIN
  SELECT COUNT(*) INTO v_active FROM mandates WHERE status = 'active';
  SELECT COUNT(*) INTO v_completed FROM mandates WHERE status = 'completed';
  SELECT COUNT(*) INTO v_cancelled FROM mandates WHERE status = 'cancelled';

  v_placement_rate := CASE
    WHEN (v_completed + v_cancelled) > 0
    THEN ROUND(v_completed::NUMERIC / (v_completed + v_cancelled) * 100, 1)
    ELSE 0
  END;

  -- Average time to fill
  SELECT AVG(EXTRACT(DAY FROM actual_close_date - created_at))::INTEGER INTO v_avg_time
  FROM mandates
  WHERE status = 'completed' AND actual_close_date IS NOT NULL;

  -- Average candidates per mandate
  SELECT COALESCE(AVG(candidate_count)::NUMERIC, 0) INTO v_avg_candidates
  FROM (
    SELECT mandate_id, COUNT(*) as candidate_count
    FROM candidate_mandate_links
    GROUP BY mandate_id
  ) sub;

  -- Pipeline velocity
  SELECT COALESCE(AVG(daily_rate)::NUMERIC, 0) INTO v_avg_velocity
  FROM (
    SELECT m.id, COUNT(cml.id)::NUMERIC / NULLIF(EXTRACT(DAY FROM MAX(cml.created_at) - MIN(cml.created_at)), 0) as daily_rate
    FROM mandates m
    JOIN candidate_mandate_links cml ON cml.mandate_id = m.id
    WHERE m.status IN ('active', 'completed')
    GROUP BY m.id
    HAVING EXTRACT(DAY FROM MAX(cml.created_at) - MIN(cml.created_at)) > 0
  ) sub;

  -- Revenue
  SELECT COALESCE(SUM(amount), 0) INTO v_total_pipeline
  FROM mandate_payment_milestones
  WHERE status IN ('pending', 'due', 'invoiced');

  SELECT COALESCE(SUM(paid_amount), 0) INTO v_total_collected
  FROM mandate_payment_milestones
  WHERE status = 'paid';

  -- Phase distribution
  SELECT jsonb_object_agg(phase, cnt)
  INTO v_phase_dist
  FROM (
    SELECT phase, COUNT(*) as cnt
    FROM mandates
    WHERE status = 'active'
    GROUP BY phase
  ) sub;

  INSERT INTO mandate_analytics_snapshots (
    snapshot_date,
    total_active_mandates,
    total_completed_mandates,
    total_cancelled_mandates,
    avg_time_to_fill,
    placement_rate,
    avg_candidates_per_mandate,
    avg_pipeline_velocity,
    avg_client_feedback_time,
    total_fee_pipeline,
    total_fee_collected,
    phase_distribution
  ) VALUES (
    CURRENT_DATE,
    v_active,
    v_completed,
    v_cancelled,
    v_avg_time,
    v_placement_rate,
    v_avg_candidates,
    v_avg_velocity,
    v_avg_feedback,
    v_total_pipeline,
    v_total_collected,
    v_phase_dist
  ) ON CONFLICT (snapshot_date) DO UPDATE SET
    total_active_mandates = v_active,
    total_completed_mandates = v_completed,
    total_cancelled_mandates = v_cancelled,
    avg_time_to_fill = v_avg_time,
    placement_rate = v_placement_rate,
    avg_candidates_per_mandate = v_avg_candidates,
    avg_pipeline_velocity = v_avg_velocity,
    avg_client_feedback_time = v_avg_feedback,
    total_fee_pipeline = v_total_pipeline,
    total_fee_collected = v_total_collected,
    phase_distribution = v_phase_dist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. PHASE AUTO-ADVANCE ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_check_phase_advance(p_mandate_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_current_phase TEXT;
  v_candidate_count INTEGER;
  v_screened_count INTEGER;
  v_shortlisted_count INTEGER;
  v_presented_count INTEGER;
  v_interview_count INTEGER;
  v_offer_count INTEGER;
  v_placed_count INTEGER;
  v_grid_exists BOOLEAN;
  v_canvas_count INTEGER;
BEGIN
  SELECT phase INTO v_current_phase FROM mandates WHERE id = p_mandate_id;

  SELECT COUNT(*) INTO v_candidate_count
  FROM candidate_mandate_links WHERE mandate_id = p_mandate_id;

  SELECT COUNT(*) INTO v_screened_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('screened', 'shortlisted', 'presented', 'interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_shortlisted_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('shortlisted', 'presented', 'interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_presented_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('presented', 'interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_interview_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_offer_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('offer', 'placed');

  SELECT COUNT(*) INTO v_placed_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status = 'placed';

  SELECT EXISTS(SELECT 1 FROM grid_mappings WHERE mandate_id = p_mandate_id) INTO v_grid_exists;

  SELECT COUNT(*) INTO v_canvas_count
  FROM canvas_profiles cp
  JOIN candidate_mandate_links cml ON cml.contact_id = cp.contact_id
  WHERE cml.mandate_id = p_mandate_id;

  IF v_current_phase = 'kickoff' AND v_grid_exists AND v_candidate_count >= 5 THEN
    RETURN 'sourcing';
  ELSIF v_current_phase = 'sourcing' AND v_shortlisted_count >= 3 AND v_canvas_count >= 1 THEN
    RETURN 'shortlisting';
  ELSIF v_current_phase = 'shortlisting' AND v_presented_count >= 1 THEN
    RETURN 'interview';
  ELSIF v_current_phase = 'interview' AND v_offer_count >= 1 THEN
    RETURN 'offer';
  ELSIF v_current_phase = 'offer' AND v_placed_count >= 1 THEN
    RETURN 'close';
  END IF;

  RETURN v_current_phase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'mandate_payment_milestones',
    'mandate_analytics_snapshots'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ Mandate Management migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ Mandate Management migration FAILED — missing: %', v_missing;
  END IF;
END$$;