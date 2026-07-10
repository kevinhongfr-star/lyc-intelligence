-- ════════════════════════════════════════════════════════════════════════
-- 20260710_t1_core_schema.sql
-- T1 — Schema & Data Layer (Phase 1)
-- 10 core Supabase tables + RLS policies + activity log triggers
-- ════════════════════════════════════════════════════════════════════════

-- ── UTILITY FUNCTIONS ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. ORGANIZATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  headquarters TEXT,
  employee_count_range TEXT,
  revenue_range TEXT,
  client_since DATE,
  account_manager_id UUID REFERENCES consultants(id),
  fee_config_id UUID REFERENCES fee_configs(id),
  payment_terms TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('active','paused','prospect','churned')),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_account_manager ON public.organizations(account_manager_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view all organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
  ));

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. CONSULTANTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('consultant','senior_consultant','manager','director')),
  email TEXT NOT NULL UNIQUE,
  feishu_id TEXT,
  max_capacity NUMERIC NOT NULL DEFAULT 8,
  current_load NUMERIC DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  active_mandate_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','overloaded','on_leave','inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultants_role ON public.consultants(role);
CREATE INDEX IF NOT EXISTS idx_consultants_status ON public.consultants(status);

ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view all consultants"
  ON public.consultants FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage consultants"
  ON public.consultants FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
  ));

DROP TRIGGER IF EXISTS trg_consultants_updated_at ON public.consultants;
CREATE TRIGGER trg_consultants_updated_at
  BEFORE UPDATE ON public.consultants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. FEE_CONFIGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage','fixed','percentage_with_minimum')),
  percentage NUMERIC CHECK (percentage BETWEEN 0 AND 50),
  fixed_amount NUMERIC,
  minimum_amount NUMERIC,
  split_enabled BOOLEAN DEFAULT false,
  lyc_share NUMERIC,
  partner_share NUMERIC,
  payment_terms TEXT,
  payment_schedule JSONB,
  fee_currency TEXT DEFAULT 'RMB',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_configs_client ON public.fee_configs(client_name);
CREATE INDEX IF NOT EXISTS idx_fee_configs_type ON public.fee_configs(fee_type);

ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view fee configs"
  ON public.fee_configs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage fee configs"
  ON public.fee_configs FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
  ));

-- ── 4. MANDATES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  position_title TEXT NOT NULL CHECK (char_length(position_title) BETWEEN 3 AND 200),
  location TEXT,
  reports_to TEXT,
  salary_range_min NUMERIC CHECK (salary_range_min > 0),
  salary_range_max NUMERIC CHECK (salary_range_max > 0),
  salary_currency TEXT DEFAULT 'RMB' CHECK (salary_currency IN ('RMB','USD','HKD','EUR','MYR','SGD')),
  fee_percentage NUMERIC CHECK (fee_percentage BETWEEN 0 AND 50),
  fee_fixed_amount NUMERIC,
  fee_config TEXT,
  payment_terms_override TEXT,
  consultant_id UUID REFERENCES consultants(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started','kick_off','sourcing','screening','shortlist',
    'interview','offer','onboarded','closed_won','closed_lost','on_hold'
  )),
  priority_tier TEXT DEFAULT 'pending' CHECK (priority_tier IN ('tier1_closing','tier2_active','tier3_hold','pending')),
  jd_text TEXT,
  target_companies TEXT[],
  target_start_date DATE,
  deadline DATE,
  difficulty_score SMALLINT CHECK (difficulty_score BETWEEN 1 AND 5),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT salary_range CHECK (salary_range_min IS NULL OR salary_range_max IS NULL OR salary_range_min < salary_range_max)
);

CREATE INDEX IF NOT EXISTS idx_mandates_org_id ON public.mandates(org_id);
CREATE INDEX IF NOT EXISTS idx_mandates_consultant ON public.mandates(consultant_id);
CREATE INDEX IF NOT EXISTS idx_mandates_status ON public.mandates(status);
CREATE INDEX IF NOT EXISTS idx_mandates_priority ON public.mandates(priority_tier);
CREATE INDEX IF NOT EXISTS idx_mandates_deadline ON public.mandates(deadline);

ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view assigned mandates"
  ON public.mandates FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      consultant_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director'))
    )
  );

CREATE POLICY "Consultants can update own mandates"
  ON public.mandates FOR UPDATE TO authenticated
  USING (
    consultant_id = auth.uid()
    AND is_deleted = false
  );

CREATE POLICY "Admins can manage all mandates"
  ON public.mandates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
  ));

DROP TRIGGER IF EXISTS trg_mandates_updated_at ON public.mandates;
CREATE TRIGGER trg_mandates_updated_at
  BEFORE UPDATE ON public.mandates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. CANDIDATES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 2 AND 100),
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  wechat TEXT,
  linkedin_url TEXT,
  current_company TEXT,
  current_title TEXT,
  years_experience NUMERIC,
  education JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  salary_current NUMERIC,
  salary_expected NUMERIC,
  location_preference TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new','contacted','screening','interview_prep','interviewing',
    'offered','accepted','rejected','withdrawn','ghosted'
  )),
  source TEXT CHECK (source IN ('hunt','referral','platform','inbound','network')),
  cv_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON public.candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_source ON public.candidates(source);
CREATE INDEX IF NOT EXISTS idx_candidates_current_title ON public.candidates(current_title);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view all candidates"
  ON public.candidates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Consultants can manage candidates"
  ON public.candidates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('consultant', 'senior_consultant', 'admin', 'manager', 'director')
  ));

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON public.candidates;
CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. MANDATE_CANDIDATES (junction / pipeline) ────────────────────────
CREATE TABLE IF NOT EXISTS public.mandate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'submitted' CHECK (stage IN (
    'submitted','screening','first_interview','second_interview',
    'final_interview','offer_pending','offer_accepted','rejected','withdrawn'
  )),
  match_score NUMERIC CHECK (match_score BETWEEN 0 AND 100),
  submitted_date DATE DEFAULT CURRENT_DATE,
  last_activity_date DATE,
  days_in_stage INTEGER DEFAULT 0,
  consultant_notes TEXT,
  client_feedback TEXT,
  interview_date TIMESTAMPTZ,
  offer_amount NUMERIC,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_mandate_candidate UNIQUE (mandate_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_mandate_candidates_mandate ON public.mandate_candidates(mandate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_candidates_candidate ON public.mandate_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_candidates_stage ON public.mandate_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_mandate_candidates_submitted ON public.mandate_candidates(submitted_date);

ALTER TABLE public.mandate_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view pipeline for assigned mandates"
  ON public.mandate_candidates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mandates m
      WHERE m.id = mandate_id
        AND m.is_deleted = false
        AND (
          m.consultant_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director'))
        )
    )
  );

CREATE POLICY "Consultants can update pipeline for assigned mandates"
  ON public.mandate_candidates FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mandates m
      WHERE m.id = mandate_id
        AND m.is_deleted = false
        AND m.consultant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all pipeline"
  ON public.mandate_candidates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
  ));

DROP TRIGGER IF EXISTS trg_mandate_candidates_updated_at ON public.mandate_candidates;
CREATE TRIGGER trg_mandate_candidates_updated_at
  BEFORE UPDATE ON public.mandate_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7. ACTIVITY_LOGS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mandate','candidate','mandate_candidate','organization','consultant')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created','updated','status_change','note_added','interview_scheduled',
    'offer_extended','feedback_received','file_uploaded','email_sent',
    'call_logged','meeting_held','tier_changed','fee_updated'
  )),
  actor_id UUID REFERENCES consultants(id),
  from_value TEXT,
  to_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 8. ACTIVITY LOG TRIGGER FUNCTION ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'status_change';
    ELSE
      v_action := 'updated';
    END IF;
  END IF;

  INSERT INTO activity_logs (
    entity_type,
    entity_id,
    action,
    actor_id,
    from_value,
    to_value,
    metadata
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    CASE WHEN v_action = 'status_change' THEN OLD.status::TEXT ELSE NULL END,
    CASE WHEN v_action = 'status_change' THEN NEW.status::TEXT ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
      'changes', (SELECT jsonb_object_agg(key, jsonb_build_object('old', OLD -> key, 'new', NEW -> key))
                 FROM jsonb_each(to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at') key
                 WHERE OLD -> key <> NEW -> key)
    ) ELSE '{}'::jsonb END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. FIVE_METRICS (weekly KPI snapshot) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.five_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  new_candidates_added INTEGER DEFAULT 0,
  cv_submitted INTEGER DEFAULT 0,
  interviews_scheduled INTEGER DEFAULT 0,
  offers_extended INTEGER DEFAULT 0,
  placements INTEGER DEFAULT 0,
  revenue_recognized NUMERIC DEFAULT 0,
  active_mandates INTEGER DEFAULT 0,
  pipeline_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_week_consultant UNIQUE (week_start_date, consultant_id)
);

CREATE INDEX IF NOT EXISTS idx_five_metrics_consultant ON public.five_metrics(consultant_id);
CREATE INDEX IF NOT EXISTS idx_five_metrics_week ON public.five_metrics(week_start_date);

ALTER TABLE public.five_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view own five metrics"
  ON public.five_metrics FOR SELECT TO authenticated
  USING (
    consultant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director'))
  );

CREATE POLICY "System can create five metrics"
  ON public.five_metrics FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 10. DASHBOARD_SNAPSHOTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dashboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual','scheduled','trigger')),
  total_mandates INTEGER DEFAULT 0,
  by_tier JSONB DEFAULT '{}',
  by_status JSONB DEFAULT '{}',
  by_consultant JSONB DEFAULT '{}',
  revenue_pipeline JSONB DEFAULT '{}',
  auto_flags JSONB DEFAULT '[]',
  health_score NUMERIC,
  changes_from_previous JSONB DEFAULT '{}',
  raw_data_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_snapshot_date ON public.dashboard_snapshots(snapshot_date);

ALTER TABLE public.dashboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view dashboard snapshots"
  ON public.dashboard_snapshots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create dashboard snapshots"
  ON public.dashboard_snapshots FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 11. AUTO_FLAGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auto_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'GHOST','ZOMBIE','AT_RISK','DEADLINE_OVERDUE','STALE_PIPELINE',
    'ZERO_PIPELINE','CAPACITY_OVERFLOW','PRIORITY_DRIFT',
    'CLIENT_GHOST','DUPLICATE_EFFORT','NEW_ACTIVITY','APPROACHING_TARGET'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mandate','candidate','consultant','system')),
  entity_id UUID NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected','notified','acknowledged','resolved','escalated')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES consultants(id),
  resolved_by UUID REFERENCES consultants(id)
);

CREATE INDEX idx_flags_active ON auto_flags(status) WHERE status NOT IN ('resolved');
CREATE INDEX idx_flags_entity ON auto_flags(entity_type, entity_id);
CREATE INDEX idx_flags_severity ON auto_flags(severity);

ALTER TABLE public.auto_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view active flags"
  ON public.auto_flags FOR SELECT TO authenticated
  USING (status NOT IN ('resolved'));

CREATE POLICY "Team can acknowledge flags"
  ON public.auto_flags FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "System can create flags"
  ON public.auto_flags FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 12. FEE CONFIG SEED DATA ───────────────────────────────────────────
INSERT INTO fee_configs (name, client_name, fee_type, percentage, minimum_amount, split_enabled, lyc_share, partner_share, payment_terms, payment_schedule) VALUES
('Standard LYC', 'Default', 'percentage', 20, NULL, false, 1.0, 0, 'net_30', '[{"amount_pct":1.0,"offset_days":30}]'),
('EAS Asia', 'EAS Asia', 'percentage', 22, NULL, false, 1.0, 0, '70_30_eas', '[{"amount_pct":0.7,"offset_days":0},{"amount_pct":0.3,"offset_days":90}]'),
('Hartalega', 'Hartalega', 'percentage_with_minimum', 20, 10000, false, 1.0, 0, 'net_30', '[{"amount_pct":1.0,"offset_days":30}]'),
('CTC', 'CTC', 'fixed', NULL, 70000, false, 1.0, 0, 'net_30', '[{"amount_pct":1.0,"offset_days":30}]'),
('CP Axtra', 'CP Axtra', 'percentage', 20, NULL, false, 1.0, 0, 'cp_axtra_delayed', '[{"amount_pct":1.0,"offset_days":105}]'),
('French Home', 'French Home', 'percentage', 20, NULL, true, 0.5, 0.5, '50_50_split', '[{"amount_pct":0.5,"offset_days":30}]')
ON CONFLICT DO NOTHING;

-- ── 13. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'organizations', 'mandates', 'candidates', 'mandate_candidates',
    'consultants', 'five_metrics', 'activity_logs', 'dashboard_snapshots',
    'fee_configs', 'auto_flags'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ T1 Core Schema migration OK — all 10 tables present';
  ELSE
    RAISE EXCEPTION '❌ T1 Core Schema migration FAILED — missing: %', v_missing;
  END IF;
END$$;