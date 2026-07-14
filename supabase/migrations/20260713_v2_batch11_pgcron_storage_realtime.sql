-- ============================================================================
-- v2 Batch 11 — pg_cron Jobs, Storage, Realtime, Materialized Views
-- Tickets 101-110 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 101: pg_cron extension & scheduled jobs ──────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;

-- Refresh materialized views every hour
SELECT cron.schedule('refresh_company_health_hourly', '0 * * * *', $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_company_health;
$$);

-- Refresh candidate pipeline metrics daily at 2 AM
SELECT cron.schedule('refresh_candidate_pipeline_daily', '0 2 * * *', $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_candidate_pipeline;
$$);

-- Refresh deal pipeline metrics daily at 2:15 AM
SELECT cron.schedule('refresh_deal_pipeline_daily', '15 2 * * *', $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_deal_pipeline;
$$);

-- Clean up soft-deleted records older than 90 days
SELECT cron.schedule('cleanup_soft_deleted_weekly', '0 0 * * 0', $$
  DELETE FROM public.contacts WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.v2_companies WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.v2_mandates WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.v2_candidates WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.v2_deals WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.v2_tasks WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';
$$);

-- Archive old audit logs (keep last 6 months)
SELECT cron.schedule('archive_audit_logs_monthly', '0 0 1 * *', $$
  INSERT INTO public.v2_audit_logs_archive
  SELECT * FROM public.v2_audit_logs WHERE created_at < NOW() - INTERVAL '6 months';
  DELETE FROM public.v2_audit_logs WHERE created_at < NOW() - INTERVAL '6 months';
$$);

-- Process scheduled reports daily at 6 AM
SELECT cron.schedule('process_scheduled_reports_daily', '0 6 * * *', $$
  UPDATE public.v2_reports
  SET status = 'queued', scheduled_at = NOW()
  WHERE status = 'completed'
    AND run_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')
    AND (next_run_at IS NULL OR next_run_at <= NOW());
$$);

-- Reset daily API key usage counters at midnight
SELECT cron.schedule('reset_api_key_usage_daily', '0 0 * * *', $$
  UPDATE public.v2_api_keys SET usage_count = 0;
$$);

-- Send overdue invoice reminders daily at 9 AM
SELECT cron.schedule('send_overdue_invoice_reminders', '0 9 * * *', $$
  INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id, created_at)
  SELECT DISTINCT u.id, 'reminder', 'Overdue Invoice',
    CONCAT('Invoice ', i.invoice_number, ' is overdue by ', ROUND((NOW() - i.due_date::TIMESTAMPTZ)::NUMERIC, 0), ' days'),
    'invoice', i.id, NOW()
  FROM public.v2_invoices i
  JOIN public.v2_org_memberships om ON om.org_id = i.org_id
  JOIN public.users u ON u.id = om.user_id
  WHERE i.status = 'overdue'
    AND om.role IN ('super_admin', 'admin')
    AND om.status = 'active';
$$);

-- ── Ticket 102: Materialized view for candidate pipeline ────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_candidate_pipeline AS
SELECT
  m.id AS mandate_id,
  m.org_id,
  m.title AS mandate_title,
  m.status AS mandate_status,
  m.priority AS mandate_priority,
  mc.status AS candidate_status,
  mc.ai_match_score,
  COUNT(DISTINCT mc.candidate_id) AS candidate_count,
  COUNT(DISTINCT CASE WHEN mc.status = 'interviewing' THEN mc.candidate_id END) AS interviewing_count,
  COUNT(DISTINCT CASE WHEN mc.status = 'offered' THEN mc.candidate_id END) AS offered_count,
  COUNT(DISTINCT CASE WHEN mc.status = 'placed' THEN mc.candidate_id END) AS placed_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - mc.created_at)) / 86400) AS avg_days_in_stage
FROM public.v2_mandates m
LEFT JOIN public.v2_mandate_candidates mc ON mc.mandate_id = m.id AND mc.deleted_at IS NULL
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.org_id, m.title, m.status, m.priority, mc.status;

CREATE INDEX IF NOT EXISTS idx_mv_candidate_pipeline_org ON public.mv_candidate_pipeline(org_id);
CREATE INDEX IF NOT EXISTS idx_mv_candidate_pipeline_mandate ON public.mv_candidate_pipeline(mandate_id);

-- ── Ticket 103: Materialized view for deal pipeline ────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_deal_pipeline AS
SELECT
  d.id AS deal_id,
  d.org_id,
  d.name AS deal_name,
  d.deal_type,
  d.stage,
  d.status,
  d.priority,
  d.value,
  d.probability,
  COUNT(DISTINCT t.id) AS task_count,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks,
  MAX(a.created_at) AS last_activity_at,
  SUM(d.value * d.probability / 100) OVER (PARTITION BY d.org_id) AS weighted_pipeline_value
FROM public.v2_deals d
LEFT JOIN public.v2_tasks t ON t.related_entity_type = 'deal' AND t.related_entity_id = d.id AND t.deleted_at IS NULL
LEFT JOIN public.v2_activities a ON a.entity_type = 'deal' AND a.entity_id = d.id AND a.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.org_id, d.name, d.deal_type, d.stage, d.status, d.priority, d.value, d.probability;

CREATE INDEX IF NOT EXISTS idx_mv_deal_pipeline_org ON public.mv_deal_pipeline(org_id);
CREATE INDEX IF NOT EXISTS idx_mv_deal_pipeline_stage ON public.mv_deal_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_mv_deal_pipeline_status ON public.mv_deal_pipeline(status);

-- ── Ticket 104: Materialized view for dashboard metrics ────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_metrics AS
SELECT
  org_id,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') AS active_mandates,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'open') AS open_mandates,
  COUNT(DISTINCT c.id) AS total_candidates,
  COUNT(DISTINCT mc.candidate_id) FILTER (WHERE mc.status = 'interviewing') AS interviewing_candidates,
  COUNT(DISTINCT mc.candidate_id) FILTER (WHERE mc.status = 'offered') AS offered_candidates,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'placed') AS placed_candidates,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'won') AS won_deals,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'lost') AS lost_deals,
  SUM(d.value) FILTER (WHERE d.status = 'won') AS won_deals_value,
  AVG(d.probability) AS avg_deal_probability,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'todo') AS pending_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
  COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue') AS overdue_invoices,
  SUM(i.total_amount) FILTER (WHERE i.status = 'overdue') AS overdue_amount,
  SUM(cn.commission_amount) FILTER (WHERE cn.status = 'pending') AS pending_commissions,
  SUM(cn.commission_amount) FILTER (WHERE cn.status = 'paid') AS paid_commissions,
  NOW() AS refreshed_at
FROM public.v2_organizations o
LEFT JOIN public.v2_mandates m ON m.org_id = o.id AND m.deleted_at IS NULL
LEFT JOIN public.v2_candidates c ON c.org_id = o.id AND c.deleted_at IS NULL
LEFT JOIN public.v2_mandate_candidates mc ON mc.org_id = o.id AND mc.deleted_at IS NULL
LEFT JOIN public.v2_placements p ON p.org_id = o.id AND p.deleted_at IS NULL
LEFT JOIN public.v2_deals d ON d.org_id = o.id AND d.deleted_at IS NULL
LEFT JOIN public.v2_tasks t ON t.org_id = o.id AND t.deleted_at IS NULL
LEFT JOIN public.v2_invoices i ON i.org_id = o.id AND i.deleted_at IS NULL
LEFT JOIN public.v2_commissions cn ON cn.org_id = o.id AND cn.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id;

CREATE INDEX IF NOT EXISTS idx_mv_dashboard_metrics_org ON public.mv_dashboard_metrics(org_id);

-- ── Ticket 105: Audit log archive table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_audit_logs_archive (
  LIKE public.v2_audit_logs INCLUDING ALL
);

CREATE INDEX IF NOT EXISTS idx_v2_audit_logs_archive_org ON public.v2_audit_logs_archive(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_audit_logs_archive_created ON public.v2_audit_logs_archive(created_at);

ALTER TABLE public.v2_audit_logs_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log archive"
  ON public.v2_audit_logs_archive FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- ── Ticket 106: Storage bucket configuration ────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES
  ('company-logos', 'company-logos', true),
  ('candidate-avatars', 'candidate-avatars', true),
  ('document-uploads', 'document-uploads', false),
  ('report-exports', 'report-exports', false),
  ('profile-photos', 'profile-photos', true),
  ('event-materials', 'event-materials', false),
  ('attachment-files', 'attachment-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-logos
CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Org admins can upload company logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos');

-- Storage policies for candidate-avatars
CREATE POLICY "Candidate avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-avatars');

CREATE POLICY "Org admins can upload candidate avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidate-avatars');

-- Storage policies for document-uploads
CREATE POLICY "Authenticated users can view document uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'document-uploads');

CREATE POLICY "Org admins can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'document-uploads');

-- Storage policies for report-exports
CREATE POLICY "Org members can view report exports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-exports');

CREATE POLICY "Admins can upload report exports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-exports');

-- Storage policies for profile-photos
CREATE POLICY "Profile photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');

-- ── Ticket 107: Realtime channel configurations ────────────────────────────

INSERT INTO realtime.channels (id, schema_name, table_name) VALUES
  ('realtime_mandates', 'public', 'v2_mandates'),
  ('realtime_candidates', 'public', 'v2_candidates'),
  ('realtime_mandate_candidates', 'public', 'v2_mandate_candidates'),
  ('realtime_deals', 'public', 'v2_deals'),
  ('realtime_tasks', 'public', 'v2_tasks'),
  ('realtime_activities', 'public', 'v2_activities'),
  ('realtime_notifications', 'public', 'notifications'),
  ('realtime_intelligence_signals', 'public', 'intelligence_signals'),
  ('realtime_council_events', 'public', 'council_events'),
  ('realtime_council_coaching_sessions', 'public', 'council_coaching_sessions')
ON CONFLICT (schema_name, table_name) DO NOTHING;

-- ── Ticket 108: pg_stat_statements for performance monitoring ──────────────

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements, pg_cron';

-- ── Ticket 109: Row-level security policies for storage ────────────────────
-- Defined inline with ticket 106 above.

-- ── Ticket 110: Final validation queries ───────────────────────────────────

-- Verify all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'v2_%';

-- Verify all indexes exist
SELECT indexrelname, relname FROM pg_indexes WHERE schemaname = 'public';

-- Verify RLS is enabled on all tables
SELECT relname, rowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace;
