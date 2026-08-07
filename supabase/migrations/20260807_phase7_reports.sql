-- Phase 7: Reports & Documents
-- Tables for report persistence and scheduled report definitions.

CREATE TABLE IF NOT EXISTS public.reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     TEXT NOT NULL,
  template_name   TEXT NOT NULL,
  format          TEXT NOT NULL DEFAULT 'PDF'
                  CHECK (format IN ('PDF','DOCX','PNG')),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','generating','completed','failed','scheduled')),
  title           TEXT NOT NULL,
  sections        JSONB NOT NULL DEFAULT '[]'::jsonb,
  tables          JSONB NOT NULL DEFAULT '[]'::jsonb,
  charts          JSONB NOT NULL DEFAULT '[]'::jsonb,
  header          JSONB NOT NULL DEFAULT '{}'::jsonb,
  footer          JSONB NOT NULL DEFAULT '{}'::jsonb,
  download_url    TEXT,
  share_url       TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.reports (created_by);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_created    ON public.reports (created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on reports"
  ON public.reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users read own reports"
  ON public.reports FOR SELECT USING (
    created_by = auth.uid()
  );
CREATE POLICY "Users insert own reports"
  ON public.reports FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );
CREATE POLICY "Users update own reports"
  ON public.reports FOR UPDATE USING (
    created_by = auth.uid()
  );
CREATE POLICY "Users delete own reports"
  ON public.reports FOR DELETE USING (
    created_by = auth.uid()
  );

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Scheduled reports ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.report_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     TEXT NOT NULL,
  template_name   TEXT NOT NULL,
  format          TEXT NOT NULL DEFAULT 'PDF'
                  CHECK (format IN ('PDF','DOCX','PNG')),
  frequency       TEXT NOT NULL DEFAULT 'weekly'
                  CHECK (frequency IN ('daily','weekly','monthly')),
  next_run_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_run_at     TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('draft','generating','completed','failed','scheduled')),
  context         JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_options  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_created_by ON public.report_schedules (created_by);
CREATE INDEX IF NOT EXISTS idx_report_schedules_status     ON public.report_schedules (status);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run   ON public.report_schedules (next_run_at);

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on report_schedules"
  ON public.report_schedules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users read own report schedules"
  ON public.report_schedules FOR SELECT USING (
    created_by = auth.uid()
  );
CREATE POLICY "Users insert own report schedules"
  ON public.report_schedules FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );
CREATE POLICY "Users delete own report schedules"
  ON public.report_schedules FOR DELETE USING (
    created_by = auth.uid()
  );

DROP TRIGGER IF EXISTS trg_report_schedules_updated_at ON public.report_schedules;
CREATE TRIGGER trg_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
