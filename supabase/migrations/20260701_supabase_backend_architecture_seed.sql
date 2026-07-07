-- ═══════════════════════════════════════════════════════════════════
-- 20260701_supabase_backend_architecture_seed.sql
-- LYC Intelligence — Seed Data & Storage Buckets
-- ═══════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- 1. REPORT TEMPLATES
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.report_templates (template_type, name, description, sections)
VALUES
  (
    'competitive_intel',
    'Competitive Intelligence Report',
    'Market landscape and competitive positioning analysis',
    '[
      {"title": "Executive Summary", "order": 1},
      {"title": "Market Overview", "order": 2},
      {"title": "Key Competitors", "order": 3},
      {"title": "Positioning Map", "order": 4},
      {"title": "Talent Landscape", "order": 5},
      {"title": "Recommendations", "order": 6}
    ]'::jsonb
  ),
  (
    'org_health',
    'Organizational Health Report',
    'Deep analysis of organizational structure, culture, and talent risks',
    '[
      {"title": "Health Score Overview", "order": 1},
      {"title": "Leadership Stability", "order": 2},
      {"title": "Culture Assessment", "order": 3},
      {"title": "Flight Risk Analysis", "order": 4},
      {"title": "Succession Coverage", "order": 5},
      {"title": "Recommendations", "order": 6}
    ]'::jsonb
  ),
  (
    'talent_deep_dive',
    'Talent Deep-Dive Report',
    'Individual candidate comprehensive assessment and fit analysis',
    '[
      {"title": "Candidate Overview", "order": 1},
      {"title": "Competency Assessment", "order": 2},
      {"title": "Leadership Style", "order": 3},
      {"title": "Cultural Fit Analysis", "order": 4},
      {"title": "Risk Factors", "order": 5},
      {"title": "Recommendation", "order": 6}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 2. ADMIN USER SETUP
-- NOTE: After creating the admin user in Supabase Auth dashboard,
--       run these UPDATE statements to set portal_role
-- ════════════════════════════════════════════════════════════════
-- Uncomment after creating user kevin.hong@lyc-partners.ai in Supabase Auth:
--
-- UPDATE public.profiles
-- SET portal_role = 'admin',
--     role = 'admin',
--     full_name = 'Kevin Hong',
--     name = 'Kevin Hong',
--     tier = 'enterprise',
--     onboarded_at = now()
-- WHERE email = 'kevin.hong@lyc-partners.ai';
--
-- UPDATE public.profiles
-- SET portal_role = 'admin',
--     role = 'admin',
--     full_name = 'Alessio',
--     name = 'Alessio',
--     tier = 'enterprise',
--     onboarded_at = now()
-- WHERE email = 'alessio@lyc-partners.ai';

-- ════════════════════════════════════════════════════════════════
-- 3. STORAGE BUCKETS
-- Run these in Supabase SQL Editor (requires storage schema access)
-- ════════════════════════════════════════════════════════════════
-- Uncomment to create storage buckets:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('reports', 'reports', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('assessment-files', 'assessment-files', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- -- Storage policies for avatars (public)
-- CREATE POLICY "Public read access to avatars"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
--
-- CREATE POLICY "Users can upload avatars"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'avatars'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- -- Storage policies for documents
-- CREATE POLICY "Users can read own documents"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'documents'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "Users can upload documents"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'documents'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- -- Storage policies for reports
-- CREATE POLICY "Users can read own reports"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'reports'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- -- Storage policies for assessment files
-- CREATE POLICY "Users can read own assessment files"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'assessment-files'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ════════════════════════════════════════════════════════════════
-- 4. ROLE PERMISSIONS SEED (RBAC baseline)
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.role_permissions (role, resource, action, allowed)
VALUES
  -- Admin permissions
  ('admin', 'contacts', 'read_all', true),
  ('admin', 'contacts', 'create', true),
  ('admin', 'contacts', 'update_any', true),
  ('admin', 'contacts', 'delete', true),
  ('admin', 'mandates', 'read_all', true),
  ('admin', 'mandates', 'create', true),
  ('admin', 'mandates', 'update_any', true),
  ('admin', 'mandates', 'delete', true),
  ('admin', 'signals', 'read_all', true),
  ('admin', 'signals', 'create', true),
  ('admin', 'reports', 'read_all', true),
  ('admin', 'reports', 'create', true),
  ('admin', 'import', 'create', true),
  ('admin', 'rbac_settings', 'administer', true),
  -- Team lead permissions
  ('team_lead', 'contacts', 'read_all', true),
  ('team_lead', 'contacts', 'create', true),
  ('team_lead', 'contacts', 'update_any', true),
  ('team_lead', 'mandates', 'read_all', true),
  ('team_lead', 'mandates', 'create', true),
  ('team_lead', 'signals', 'read_all', true),
  ('team_lead', 'signals', 'create', true),
  ('team_lead', 'reports', 'read_all', true),
  ('team_lead', 'reports', 'create', true),
  ('team_lead', 'import', 'create', true),
  ('team_lead', 'agent_actions', 'review', true),
  -- Consultant permissions
  ('consultant', 'contacts', 'read_all', true),
  ('consultant', 'contacts', 'create', true),
  ('consultant', 'contacts', 'update_own', true),
  ('consultant', 'mandates', 'read_own', true),
  ('consultant', 'mandates', 'create', true),
  ('consultant', 'signals', 'read_own', true),
  ('consultant', 'signals', 'create', true),
  ('consultant', 'reports', 'read_own', true),
  ('consultant', 'reports', 'create', true),
  -- Client permissions
  ('client', 'contacts', 'read_own', true),
  ('client', 'mandates', 'read_own', true),
  ('client', 'reports', 'read_own', true)
ON CONFLICT (role, resource, action) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_template_count FROM public.report_templates;
  IF v_template_count >= 3 THEN
    RAISE NOTICE '✅ Report templates seeded (% templates)', v_template_count;
  ELSE
    RAISE WARNING '⚠ Only % report templates found', v_template_count;
  END IF;
END$$;
