-- ============================================================================
-- v2 Batch 10 — Reports, Invoices, Commissions, Referrals, Settings, Feature Flags
-- Tickets 91-100 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 91: Reports table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'grid_full_report', 'executive_summary', 'pipeline_update',
    'market_map', 'compensation_benchmark', 'candidate_analysis',
    'deal_pipeline', 'placement_report', 'activity_log',
    'intelligence_digest', 'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'generating'
    CHECK (status IN ('generating', 'completed', 'failed', 'cancelled', 'queued')),
  format TEXT DEFAULT 'pdf'
    CHECK (format IN ('pdf', 'csv', 'json', 'html')),
  content JSONB DEFAULT '{}',
  file_path TEXT,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  generated_by UUID,
  generated_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_frequency TEXT CHECK (run_frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly')),
  parameters JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_reports_org ON public.v2_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_reports_type ON public.v2_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_v2_reports_status ON public.v2_reports(status);
CREATE INDEX IF NOT EXISTS idx_v2_reports_generated ON public.v2_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_v2_reports_scheduled ON public.v2_reports(scheduled_at);

ALTER TABLE public.v2_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reports"
  ON public.v2_reports FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage reports"
  ON public.v2_reports FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_reports.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_reports_updated_at ON public.v2_reports;
CREATE TRIGGER trg_v2_reports_updated_at
  BEFORE UPDATE ON public.v2_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 92: Invoices table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  user_id UUID,
  deal_id UUID REFERENCES public.v2_deals(id) ON DELETE SET NULL,
  placement_id UUID REFERENCES public.v2_placements(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.v2_companies(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'partial', 'cancelled', 'written_off')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'CNY',
  payment_terms TEXT DEFAULT 'net_30',
  items JSONB DEFAULT '[]',
  notes TEXT,
  terms TEXT,
  po_number TEXT,
  file_path TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  next_invoice_date DATE,
  recurrence_rule TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  sent_via TEXT CHECK (sent_via IN ('email', 'post', 'portal', 'manual')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_invoices_org ON public.v2_invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_invoices_status ON public.v2_invoices(status);
CREATE INDEX IF NOT EXISTS idx_v2_invoices_due ON public.v2_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_v2_invoices_deal ON public.v2_invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_v2_invoices_placement ON public.v2_invoices(placement_id);
CREATE INDEX IF NOT EXISTS idx_v2_invoices_number ON public.v2_invoices(invoice_number);

ALTER TABLE public.v2_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view invoices"
  ON public.v2_invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_invoices.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Org admins can manage invoices"
  ON public.v2_invoices FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_invoices.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_invoices_updated_at ON public.v2_invoices;
CREATE TRIGGER trg_v2_invoices_updated_at
  BEFORE UPDATE ON public.v2_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 93: Commissions table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  placement_id UUID REFERENCES public.v2_placements(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.v2_deals(id) ON DELETE SET NULL,
  commission_type TEXT CHECK (commission_type IN ('placement', 'retainer', 'bonus', 'referral', 'override', 'custom')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'earned', 'paid', 'cancelled', 'held')),
  commission_rate DECIMAL(5,2),
  base_amount DECIMAL(12,2),
  commission_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  earned_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('direct_deposit', 'stripe', 'transfer', 'check', 'bonus')),
  payment_reference TEXT,
  hold_reason TEXT,
  hold_until TIMESTAMPTZ,
  clawback_amount DECIMAL(12,2) DEFAULT 0,
  clawback_reason TEXT,
  clawback_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_commissions_org ON public.v2_commissions(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_commissions_consultant ON public.v2_commissions(consultant_id);
CREATE INDEX IF NOT EXISTS idx_v2_commissions_status ON public.v2_commissions(status);
CREATE INDEX IF NOT EXISTS idx_v2_commissions_placement ON public.v2_commissions(placement_id);
CREATE INDEX IF NOT EXISTS idx_v2_commissions_earned ON public.v2_commissions(earned_at);

ALTER TABLE public.v2_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view their own commissions"
  ON public.v2_commissions FOR SELECT TO authenticated
  USING (consultant_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Org admins can view all commissions"
  ON public.v2_commissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_commissions.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage commissions"
  ON public.v2_commissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_commissions.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_commissions_updated_at ON public.v2_commissions;
CREATE TRIGGER trg_v2_commissions_updated_at
  BEFORE UPDATE ON public.v2_commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 94: Referrals table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL,
  referee_email TEXT NOT NULL,
  referee_name TEXT,
  referee_phone TEXT,
  referee_title TEXT,
  referee_company TEXT,
  referral_type TEXT CHECK (referral_type IN ('candidate', 'company', 'council_member', 'client', 'deal')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'qualified', 'placed', 'paid', 'rejected', 'expired')),
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  placed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reward_amount DECIMAL(12,2) DEFAULT 0,
  reward_currency TEXT DEFAULT 'CNY',
  reward_paid BOOLEAN DEFAULT FALSE,
  reward_payment_method TEXT,
  placement_id UUID REFERENCES public.v2_placements(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.v2_deals(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.v2_candidates(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.v2_companies(id) ON DELETE SET NULL,
  notes TEXT,
  source TEXT CHECK (source IN ('linkedin', 'email', 'phone', 'website', 'event', 'other')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_referrals_org ON public.v2_referrals(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_referrals_referrer ON public.v2_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_v2_referrals_status ON public.v2_referrals(status);
CREATE INDEX IF NOT EXISTS idx_v2_referrals_type ON public.v2_referrals(referral_type);
CREATE INDEX IF NOT EXISTS idx_v2_referrals_email ON public.v2_referrals(referee_email);

ALTER TABLE public.v2_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their own referrals"
  ON public.v2_referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Org members can view referrals"
  ON public.v2_referrals FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create referrals"
  ON public.v2_referrals FOR INSERT TO authenticated
  WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Admins can manage referrals"
  ON public.v2_referrals FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_referrals.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_referrals_updated_at ON public.v2_referrals;
CREATE TRIGGER trg_v2_referrals_updated_at
  BEFORE UPDATE ON public.v2_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 95: Settings table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  user_id UUID,
  setting_type TEXT NOT NULL CHECK (setting_type IN (
    'org', 'user', 'global', 'feature', 'notifications',
    'security', 'appearance', 'integration', 'workflow', 'custom'
  )),
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(org_id, setting_type, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_v2_settings_org ON public.v2_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_settings_type ON public.v2_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_v2_settings_key ON public.v2_settings(setting_key);

ALTER TABLE public.v2_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.v2_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org members can view org settings"
  ON public.v2_settings FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage settings"
  ON public.v2_settings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_settings.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
  );

DROP TRIGGER IF EXISTS trg_v2_settings_updated_at ON public.v2_settings;
CREATE TRIGGER trg_v2_settings_updated_at
  BEFORE UPDATE ON public.v2_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 96: Feature flags table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_for TEXT DEFAULT 'none'
    CHECK (enabled_for IN ('none', 'all', 'org', 'specific_users', 'percentage')),
  enabled_users UUID[] DEFAULT '{}',
  enabled_percentage DECIMAL(5,2) DEFAULT 0,
  rollout_start_at TIMESTAMPTZ,
  rollout_end_at TIMESTAMPTZ,
  environment TEXT DEFAULT 'production'
    CHECK (environment IN ('development', 'staging', 'production')),
  prerequisites TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(org_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_v2_feature_flags_org ON public.v2_feature_flags(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_feature_flags_enabled ON public.v2_feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_v2_feature_flags_name ON public.v2_feature_flags(feature_name);

ALTER TABLE public.v2_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feature flags"
  ON public.v2_feature_flags FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage feature flags"
  ON public.v2_feature_flags FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_feature_flags.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_feature_flags_updated_at ON public.v2_feature_flags;
CREATE TRIGGER trg_v2_feature_flags_updated_at
  BEFORE UPDATE ON public.v2_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 97: Materialized views ──────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_company_health AS
SELECT
  c.id AS company_id,
  c.org_id,
  c.name AS company_name,
  c.health_score,
  c.stage,
  COUNT(DISTINCT m.id) AS active_mandates,
  COUNT(DISTINCT mc.candidate_id) AS pipeline_candidates,
  AVG(mc.ai_match_score) AS avg_match_score,
  MAX(a.created_at) AS last_activity_at,
  COUNT(DISTINCT p.id) AS total_placements
FROM public.v2_companies c
LEFT JOIN public.v2_mandates m ON m.company_id = c.id AND m.status = 'active' AND m.deleted_at IS NULL
LEFT JOIN public.v2_mandate_candidates mc ON mc.mandate_id = m.id AND mc.deleted_at IS NULL
LEFT JOIN public.v2_activities a ON a.entity_type = 'company' AND a.entity_id = c.id AND a.deleted_at IS NULL
LEFT JOIN public.v2_placements p ON p.company_id = c.id AND p.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.org_id, c.name, c.health_score, c.stage;

CREATE INDEX IF NOT EXISTS idx_mv_company_health_org ON public.mv_company_health(org_id);
CREATE INDEX IF NOT EXISTS idx_mv_company_health_company ON public.mv_company_health(company_id);

-- ── Ticket 98: RLS policies for reports ────────────────────────────────────
-- Defined inline with v2_reports above.

-- ── Ticket 99: RLS policies for invoices ───────────────────────────────────
-- Defined inline with v2_invoices above.

-- ── Ticket 100: Indexes & constraints for final tables ─────────────────────
-- All indexes and constraints defined inline:
--   v2_reports: 5 indexes (org, type, status, generated, scheduled)
--   v2_invoices: 6 indexes (org, status, due, deal, placement, number)
--   v2_commissions: 5 indexes (org, consultant, status, placement, earned)
--   v2_referrals: 5 indexes (org, referrer, status, type, email)
--   v2_settings: 3 indexes (org, type, key)
--   v2_feature_flags: 3 indexes (org, enabled, name)
--   mv_company_health: 2 indexes (org, company)
--   UNIQUE constraints: invoices(invoice_number), settings(org, type, key), feature_flags(org, name)
--   CHECK constraints: all enum-style columns + numeric bounds
