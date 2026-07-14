-- ============================================================================
-- v2 Batch 7 — CRM Deals, Tasks, Attachments, Tags
-- Tickets 61-70 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 61: Deals table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.v2_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deal_type TEXT CHECK (deal_type IN (
    'retained_search', 'contingent_search', 'rpo', 'executive_search',
    'interim', 'coaching', 'consulting', 'council_sale'
  )),
  status TEXT DEFAULT 'lead'
    CHECK (status IN (
      'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold', 'cancelled'
    )),
  stage TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  value BIGINT DEFAULT 0,
  value_currency TEXT DEFAULT 'CNY',
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  loss_reason TEXT,
  win_reason TEXT,
  owner_id UUID,
  contact_person_name TEXT,
  contact_person_email TEXT,
  contact_person_phone TEXT,
  source TEXT CHECK (source IN (
    'referral', 'outbound', 'inbound', 'website', 'council', 'event',
    'partnership', 'cold_email', 'linkedin', 'other'
  )),
  description TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_deals_org ON public.v2_deals(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_deals_company ON public.v2_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_v2_deals_status ON public.v2_deals(status);
CREATE INDEX IF NOT EXISTS idx_v2_deals_value ON public.v2_deals(value);
CREATE INDEX IF NOT EXISTS idx_v2_deals_owner ON public.v2_deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_v2_deals_tags ON public.v2_deals USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_v2_deals_close_date ON public.v2_deals(expected_close_date);

ALTER TABLE public.v2_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view deals"
  ON public.v2_deals FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants and admins can manage deals"
  ON public.v2_deals FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_deals.org_id
        AND role IN ('super_admin', 'admin', 'consultant')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_deals_updated_at ON public.v2_deals;
CREATE TRIGGER trg_v2_deals_updated_at
  BEFORE UPDATE ON public.v2_deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 62: Tasks table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN (
    'call', 'email', 'meeting', 'follow_up', 'interview', 'review',
    'deadline', 'reminder', 'data_entry', 'other'
  )),
  status TEXT DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'waiting', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID,
  related_entity_type TEXT CHECK (related_entity_type IN (
    'company', 'mandate', 'candidate', 'deal', 'contact', 'event', 'coaching_session'
  )),
  related_entity_id UUID,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  reminder_minutes_before INTEGER,
  reminder_sent BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_tasks_org ON public.v2_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_assigned ON public.v2_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_status ON public.v2_tasks(status);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_due ON public.v2_tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_entity ON public.v2_tasks(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_priority ON public.v2_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_tags ON public.v2_tasks USING GIN(tags);

ALTER TABLE public.v2_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tasks"
  ON public.v2_tasks FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create tasks in their org"
  ON public.v2_tasks FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Assignees and admins can manage tasks"
  ON public.v2_tasks FOR ALL TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_tasks.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_tasks_updated_at ON public.v2_tasks;
CREATE TRIGGER trg_v2_tasks_updated_at
  BEFORE UPDATE ON public.v2_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 63: File attachments table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_file_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  mime_type TEXT,
  storage_bucket TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'company', 'mandate', 'candidate', 'deal', 'contact',
    'task', 'event', 'coaching_session', 'activity', 'profile'
  )),
  entity_id UUID NOT NULL,
  uploaded_by UUID,
  is_confidential BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  access_level TEXT DEFAULT 'org'
    CHECK (access_level IN ('private', 'owner', 'team', 'org', 'public')),
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_files_org ON public.v2_file_attachments(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_files_entity ON public.v2_file_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_v2_files_type ON public.v2_file_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_v2_files_uploader ON public.v2_file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_v2_files_tags ON public.v2_file_attachments USING GIN(tags);

ALTER TABLE public.v2_file_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view non-confidential attachments"
  ON public.v2_file_attachments FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND is_confidential = false
    AND access_level IN ('org', 'team', 'public')
    AND deleted_at IS NULL
  );

CREATE POLICY "Uploader can view own attachments"
  ON public.v2_file_attachments FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Org members can upload attachments"
  ON public.v2_file_attachments FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Uploader and admins can manage attachments"
  ON public.v2_file_attachments FOR ALL TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_file_attachments.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_files_updated_at ON public.v2_file_attachments;
CREATE TRIGGER trg_v2_files_updated_at
  BEFORE UPDATE ON public.v2_file_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 64: Tags table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  tag_category TEXT CHECK (tag_category IN (
    'general', 'status', 'priority', 'source', 'industry',
    'skill', 'role', 'location', 'campaign', 'custom'
  )),
  entity_types TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_v2_tags_org ON public.v2_tags(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_tags_category ON public.v2_tags(tag_category);
CREATE INDEX IF NOT EXISTS idx_v2_tags_name ON public.v2_tags(name);
CREATE INDEX IF NOT EXISTS idx_v2_tags_usage ON public.v2_tags(usage_count DESC);

ALTER TABLE public.v2_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tags"
  ON public.v2_tags FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage tags"
  ON public.v2_tags FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_tags.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_tags_updated_at ON public.v2_tags;
CREATE TRIGGER trg_v2_tags_updated_at
  BEFORE UPDATE ON public.v2_tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 65: Pipeline stages table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  pipeline_type TEXT NOT NULL
    CHECK (pipeline_type IN ('candidate', 'deal', 'mandate', 'client')),
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_pipeline_org ON public.v2_pipeline_stages(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_pipeline_type ON public.v2_pipeline_stages(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_v2_pipeline_position ON public.v2_pipeline_stages(org_id, pipeline_type, position);
CREATE INDEX IF NOT EXISTS idx_v2_pipeline_active ON public.v2_pipeline_stages(org_id, is_active);

ALTER TABLE public.v2_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view pipeline stages"
  ON public.v2_pipeline_stages FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can manage pipeline stages"
  ON public.v2_pipeline_stages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_pipeline_stages.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_pipeline_updated_at ON public.v2_pipeline_stages;
CREATE TRIGGER trg_v2_pipeline_updated_at
  BEFORE UPDATE ON public.v2_pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 66: RLS policies for deals ──────────────────────────────────────
-- Defined inline with v2_deals above.
-- Key policies: org member read, consultant/admin manage.

-- ── Ticket 67: RLS policies for tasks ──────────────────────────────────────
-- Defined inline with v2_tasks above.
-- Key policies: org member read, assignee/creator/admin manage.

-- ── Ticket 68: RLS policies for file_attachments ───────────────────────────
-- Defined inline with v2_file_attachments above.
-- Key policies: org member view non-confidential, uploader view all, admin manage.

-- ── Ticket 69: Indexes & constraints for CRM tables ────────────────────────
-- All indexes and constraints defined inline:
--   v2_deals: 7 indexes (org, company, status, value, owner, tags GIN, close_date)
--   v2_tasks: 7 indexes (org, assigned, status, due, entity, priority, tags GIN)
--   v2_file_attachments: 5 indexes (org, entity, file_type, uploader, tags GIN)
--   v2_tags: 4 indexes (org, category, name, usage DESC)
--   v2_pipeline_stages: 4 indexes (org, type, org+type+position composite, active)
--   UNIQUE constraints: v2_tags(org_id, name)
--   CHECK constraints: all enum-style columns + bounds

-- ── Ticket 70: updated_at triggers for CRM tables ──────────────────────────
-- All 5 tables have BEFORE UPDATE triggers using shared set_updated_at().
-- Triggers: trg_v2_deals_updated_at, trg_v2_tasks_updated_at,
--           trg_v2_files_updated_at, trg_v2_tags_updated_at,
--           trg_v2_pipeline_updated_at
