-- ============================================================================
-- v2 Batch 13 — Auth Configuration, API Wiring, Validation, Seed Data
-- Tickets 121-130 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 121: Auth email templates ────────────────────────────────────────

UPDATE auth.email_templates
SET html = '<!DOCTYPE html>
<html>
<head><title>Welcome to LYC Intelligence</title></head>
<body>
<h1>Welcome to LYC Intelligence!</h1>
<p>Dear {{.Data.User.Email}},</p>
<p>Click the link below to confirm your email:</p>
<p><a href="{{.Data.ConfirmationURL}}">Confirm Email</a></p>
</body>
</html>',
subject = 'Welcome to LYC Intelligence — Confirm your email'
WHERE template_name = 'confirmation';

UPDATE auth.email_templates
SET html = '<!DOCTYPE html>
<html>
<head><title>Reset Password</title></head>
<body>
<h1>Reset your password</h1>
<p>Click the link below to reset your password:</p>
<p><a href="{{.Data.PasswordResetURL}}">Reset Password</a></p>
</body>
</html>',
subject = 'Reset your LYC Intelligence password'
WHERE template_name = 'recovery';

UPDATE auth.email_templates
SET html = '<!DOCTYPE html>
<html>
<head><title>Magic Link Login</title></head>
<body>
<h1>Login to LYC Intelligence</h1>
<p>Click the link below to log in:</p>
<p><a href="{{.Data.MagicLinkURL}}">Login Now</a></p>
</body>
</html>',
subject = 'Your LYC Intelligence login link'
WHERE template_name = 'magic_link';

UPDATE auth.email_templates
SET html = '<!DOCTYPE html>
<html>
<head><title>Email Changed</title></head>
<body>
<h1>Your email has been changed</h1>
<p>Your email has been updated to {{.Data.NewEmail}}. If this was not you, please contact support.</p>
</body>
</html>',
subject = 'Your LYC Intelligence email has been changed'
WHERE template_name = 'email_change';

-- ── Ticket 122: Auth phone templates ────────────────────────────────────────

UPDATE auth.sms_templates
SET message = 'Your LYC Intelligence verification code is: {{.Token}}'
WHERE template_name = 'otp';

UPDATE auth.sms_templates
SET message = 'Your LYC Intelligence login link: {{.Data.MagicLinkURL}}'
WHERE template_name = 'magic_link';

-- ── Ticket 123: Auth providers configuration ────────────────────────────────

INSERT INTO auth.providers (provider, enabled, options) VALUES
  ('email', true, '{"enabled": true}'),
  ('phone', true, '{"enabled": true}'),
  ('google', true, '{"enabled": true, "client_id": "", "secret": ""}'),
  ('github', true, '{"enabled": true, "client_id": "", "secret": ""}')
ON CONFLICT (provider) DO UPDATE SET enabled = EXCLUDED.enabled, options = EXCLUDED.options;

-- ── Ticket 124: Auth policies ──────────────────────────────────────────────

-- Allow users to update their own metadata
CREATE POLICY "Users can update their own metadata"
  ON auth.users FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Allow users to view their own user record
CREATE POLICY "Users can view their own user record"
  ON auth.users FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ── Ticket 125: Seed data — industries ──────────────────────────────────────

INSERT INTO public.industries (name, sector, sub_sectors, market_size_usd, growth_rate) VALUES
  ('Technology', 'Technology', '{"Software", "Hardware", "AI/ML", "Cybersecurity", "Cloud"}', 5000000000000, 0.12),
  ('Finance', 'Finance', '{"Banking", "Fintech", "Investment", "Insurance", "Wealth Management"}', 20000000000000, 0.06),
  ('Healthcare', 'Healthcare', '{"Biotech", "Pharmaceuticals", "MedTech", "Healthcare Services", "Digital Health"}', 8000000000000, 0.08),
  ('Real Estate', 'Real Estate', '{"Residential", "Commercial", "Industrial", "PropTech", "Development"}', 3500000000000, 0.04),
  ('Consumer', 'Consumer', '{"E-commerce", "Retail", "Food & Beverage", "Fashion", "Consumer Tech"}', 15000000000000, 0.03),
  ('Energy', 'Energy', '{"Renewable", "Oil & Gas", "Utilities", "Energy Tech", "Storage"}', 6000000000000, 0.15),
  ('Manufacturing', 'Manufacturing', '{"Advanced Manufacturing", "Automotive", "Aerospace", "Electronics", "Industrial"}', 12000000000000, 0.02),
  ('Media & Entertainment', 'Media', '{"Streaming", "Social Media", "Publishing", "Gaming", "Advertising"}', 2500000000000, 0.07),
  ('Education', 'Education', '{"EdTech", "Higher Education", "Vocational", "Corporate Training", "K-12"}', 2000000000000, 0.09),
  ('Professional Services', 'Services', '{"Consulting", "Legal", "Accounting", "Marketing", "HR"}', 4000000000000, 0.05)
ON CONFLICT (name) DO NOTHING;

-- ── Ticket 126: Seed data — default pipeline stages ────────────────────────

INSERT INTO public.v2_pipeline_stages (org_id, pipeline_type, name, position, color, probability) VALUES
  (NULL, 'candidate', 'New', 0, '#94a3b8', 0),
  (NULL, 'candidate', 'Screened', 1, '#3b82f6', 20),
  (NULL, 'candidate', 'Interviewing', 2, '#f59e0b', 40),
  (NULL, 'candidate', 'Offered', 3, '#10b981', 70),
  (NULL, 'candidate', 'Placed', 4, '#8b5cf6', 100),
  (NULL, 'candidate', 'Rejected', 5, '#ef4444', 0),
  (NULL, 'deal', 'Lead', 0, '#94a3b8', 10),
  (NULL, 'deal', 'Qualified', 1, '#3b82f6', 25),
  (NULL, 'deal', 'Proposal', 2, '#f59e0b', 50),
  (NULL, 'deal', 'Negotiation', 3, '#10b981', 75),
  (NULL, 'deal', 'Won', 4, '#8b5cf6', 100),
  (NULL, 'deal', 'Lost', 5, '#ef4444', 0),
  (NULL, 'mandate', 'Incoming', 0, '#94a3b8', 20),
  (NULL, 'mandate', 'Discovery', 1, '#3b82f6', 40),
  (NULL, 'mandate', 'Proposal', 2, '#f59e0b', 60),
  (NULL, 'mandate', 'Active', 3, '#10b981', 80),
  (NULL, 'mandate', 'Completed', 4, '#8b5cf6', 100),
  (NULL, 'mandate', 'Cancelled', 5, '#ef4444', 0)
ON CONFLICT (org_id, pipeline_type, name) DO NOTHING;

-- ── Ticket 127: Seed data — default tags ───────────────────────────────────

INSERT INTO public.v2_tags (org_id, name, color, tag_category) VALUES
  (NULL, 'Priority', '#ef4444', 'priority'),
  (NULL, 'High Priority', '#f97316', 'priority'),
  (NULL, 'Medium', '#f59e0b', 'priority'),
  (NULL, 'Low', '#84cc16', 'priority'),
  (NULL, 'Hot', '#ef4444', 'status'),
  (NULL, 'Warm', '#f59e0b', 'status'),
  (NULL, 'Cold', '#64748b', 'status'),
  (NULL, 'Tech', '#3b82f6', 'industry'),
  (NULL, 'Finance', '#8b5cf6', 'industry'),
  (NULL, 'Healthcare', '#10b981', 'industry'),
  (NULL, 'Referral', '#06b6d4', 'source'),
  (NULL, 'Outbound', '#a855f7', 'source'),
  (NULL, 'Inbound', '#14b8a6', 'source'),
  (NULL, 'LinkedIn', '#0ea5e9', 'source'),
  (NULL, 'Event', '#f43f5e', 'source')
ON CONFLICT (org_id, name) DO NOTHING;

-- ── Ticket 128: Seed data — default feature flags ──────────────────────────

INSERT INTO public.v2_feature_flags (org_id, feature_name, description, is_enabled, enabled_for) VALUES
  (NULL, 'ai_enrichment', 'AI-powered profile enrichment', true, 'all'),
  (NULL, 'market_intelligence', 'Market intelligence signals', true, 'all'),
  (NULL, 'pipeline_analytics', 'Advanced pipeline analytics', true, 'all'),
  (NULL, 'deal_tracking', 'Deal tracking and forecasting', true, 'all'),
  (NULL, 'council_access', 'Council portal access', false, 'specific_users'),
  (NULL, 'dex_ai', 'DEX AI chat access', true, 'all'),
  (NULL, 'email_marketing', 'Email marketing features', true, 'all'),
  (NULL, 'custom_dashboards', 'Custom dashboard builder', false, 'percentage'),
  (NULL, 'advanced_search', 'Advanced search capabilities', true, 'all'),
  (NULL, 'mobile_app', 'Mobile app access', false, 'none')
ON CONFLICT (org_id, feature_name) DO NOTHING;

-- ── Ticket 129: Database validation queries ────────────────────────────────

-- Verify all tables have RLS enabled
SELECT 
  relname AS table_name, 
  rowsecurity AS rls_enabled,
  relrowsecurity AS rls_forced
FROM pg_class 
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
ORDER BY relname;

-- Verify all materialized views exist
SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

-- Verify pg_cron extension is enabled
SELECT extname FROM pg_extension WHERE extname = 'pg_cron';

-- Verify storage buckets
SELECT id, name, public FROM storage.buckets;

-- Verify realtime channels
SELECT id, schema_name, table_name FROM realtime.channels;

-- Verify function permissions
SELECT proname, provolatile FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;

-- ── Ticket 130: Performance optimization ────────────────────────────────────

-- Analyze all tables for query planner
ANALYZE;

-- Vacuum all tables
VACUUM ANALYZE;

-- Set connection pool limits
ALTER SYSTEM SET max_connections = 500;
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET work_mem = '64MB';

-- Enable pg_stat_statements tracking
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Enable log_min_duration_statement for slow query logging
ALTER SYSTEM SET log_min_duration_statement = '500ms';
