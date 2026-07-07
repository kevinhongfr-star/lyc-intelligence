-- ═══════════════════════════════════════════════════════════════════
-- 20260701_supabase_backend_architecture_rls.sql
-- LYC Intelligence — Row Level Security Policies
-- 4-portal model: admin | b2b_client | b2c_leader | candidate
-- ═══════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- HELPER: is_admin()
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND portal_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- HELPER: get_user_company_id()
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = p_user_id;
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to redefine cleanly
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company members read same company" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;

-- Service role: full access
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- B2B clients can read profiles in their company
CREATE POLICY "Company members read same company"
  ON public.profiles FOR SELECT
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_user_company_id()
  );

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ════════════════════════════════════════════════════════════════
-- 2. MANDATES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full mandate access" ON public.mandates;
DROP POLICY IF EXISTS "B2B clients read own mandates" ON public.mandates;
DROP POLICY IF EXISTS "B2B clients create mandates" ON public.mandates;
DROP POLICY IF EXISTS "Service role full access on mandates" ON public.mandates;

-- Service role: full access
CREATE POLICY "Service role full access on mandates"
  ON public.mandates FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full mandate access"
  ON public.mandates FOR ALL
  USING (public.is_admin());

-- B2B clients: read own company's mandates (by client_id or company_id)
CREATE POLICY "B2B clients read own mandates"
  ON public.mandates FOR SELECT
  USING (
    client_id = auth.uid()
    OR company_id = public.get_user_company_id()
  );

-- B2B clients: create mandates for their company
CREATE POLICY "B2B clients create mandates"
  ON public.mandates FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- 3. CONTACTS RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full contact access" ON public.contacts;
DROP POLICY IF EXISTS "B2B clients read pipeline contacts" ON public.contacts;
DROP POLICY IF EXISTS "Candidates read own contact" ON public.contacts;
DROP POLICY IF EXISTS "Service role full access on contacts" ON public.contacts;

-- Service role: full access
CREATE POLICY "Service role full access on contacts"
  ON public.contacts FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full contact access"
  ON public.contacts FOR ALL
  USING (public.is_admin());

-- B2B clients: read contacts in their pipeline
CREATE POLICY "B2B clients read pipeline contacts"
  ON public.contacts FOR SELECT
  USING (
    id IN (
      SELECT cp.contact_id
      FROM public.candidates_pipeline cp
      JOIN public.mandates m ON cp.mandate_id = m.id
      WHERE m.client_id = auth.uid()
         OR m.company_id = public.get_user_company_id()
    )
  );

-- Candidates: read own profile via email match
CREATE POLICY "Candidates read own contact"
  ON public.contacts FOR SELECT
  USING (
    email IN (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 4. CANDIDATES_PIPELINE RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.candidates_pipeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on candidates_pipeline" ON public.candidates_pipeline;
DROP POLICY IF EXISTS "Users read candidates pipeline" ON public.candidates_pipeline;
DROP POLICY IF EXISTS "Users write candidates pipeline" ON public.candidates_pipeline;

-- Service role: full access
CREATE POLICY "Service role full access on candidates_pipeline"
  ON public.candidates_pipeline FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full pipeline access"
  ON public.candidates_pipeline FOR ALL
  USING (public.is_admin());

-- B2B clients: read pipeline for own mandates
CREATE POLICY "B2B clients read own pipeline"
  ON public.candidates_pipeline FOR SELECT
  USING (
    mandate_id IN (
      SELECT id FROM public.mandates
      WHERE client_id = auth.uid()
         OR company_id = public.get_user_company_id()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 5. SIGNALS RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full signal access" ON public.signals;
DROP POLICY IF EXISTS "Users read relevant signals" ON public.signals;
DROP POLICY IF EXISTS "Service role full access on signals" ON public.signals;

-- Service role: full access
CREATE POLICY "Service role full access on signals"
  ON public.signals FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full signal access"
  ON public.signals FOR ALL
  USING (public.is_admin());

-- Users: read signals for entities they have access to
CREATE POLICY "Users read relevant signals"
  ON public.signals FOR SELECT
  USING (
    -- Signals on mandates they can access
    (target_entity_type = 'mandate' AND target_entity_id IN (
      SELECT id::uuid FROM public.mandates
      WHERE client_id = auth.uid()
         OR company_id = public.get_user_company_id()
    ))
    -- Signals on their own profile
    OR (target_entity_type = 'candidate' AND target_entity_id = auth.uid())
    -- Signals on contacts they can view
    OR (target_entity_type = 'contact' AND target_entity_id IN (
      SELECT id FROM public.contacts
      WHERE email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    ))
    -- Actor-based: signals they created
    OR actor_id = auth.uid()
  );

-- Authenticated users can create signals
CREATE POLICY "Authenticated users create signals"
  ON public.signals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════════
-- 6. AGENT_ACTIONS RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on agent_actions" ON public.agent_actions;

-- Service role: full access
CREATE POLICY "Service role full access on agent_actions"
  ON public.agent_actions FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full agent_actions access"
  ON public.agent_actions FOR ALL
  USING (public.is_admin());

-- Users: read agent actions for entities they can access
CREATE POLICY "Users read relevant agent_actions"
  ON public.agent_actions FOR SELECT
  USING (
    (target_entity_type = 'mandate' AND target_entity_id IN (
      SELECT id::uuid FROM public.mandates
      WHERE client_id = auth.uid()
         OR company_id = public.get_user_company_id()
    ))
    OR triggered_by = auth.uid()
  );

-- ════════════════════════════════════════════════════════════════
-- 7. CHAT_CONVERSATIONS & CHAT_MESSAGES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users read own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role full access on chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Service role full access on chat_messages" ON public.chat_messages;

-- Service role: full access
CREATE POLICY "Service role full access on chat_conversations"
  ON public.chat_conversations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on chat_messages"
  ON public.chat_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Users read/write own conversations
CREATE POLICY "Users own conversations"
  ON public.chat_conversations FOR ALL
  USING (user_id = auth.uid());

-- Users read messages in own conversations
CREATE POLICY "Users read own messages"
  ON public.chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages in own conversations
CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 8. REPORTS RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full report access" ON public.reports;
DROP POLICY IF EXISTS "Users read own reports" ON public.reports;
DROP POLICY IF EXISTS "Service role full access on reports" ON public.reports;

-- Service role: full access
CREATE POLICY "Service role full access on reports"
  ON public.reports FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full report access"
  ON public.reports FOR ALL
  USING (public.is_admin());

-- Users: read reports they generated or that relate to their company
CREATE POLICY "Users read own reports"
  ON public.reports FOR SELECT
  USING (
    generated_by = auth.uid()
    OR mandate_id IN (
      SELECT id FROM public.mandates
      WHERE client_id = auth.uid()
         OR company_id = public.get_user_company_id()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 9. COMPANIES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on companies" ON public.companies;
DROP POLICY IF EXISTS "Admins read companies" ON public.companies;
DROP POLICY IF EXISTS "Admins write companies" ON public.companies;

-- Service role: full access
CREATE POLICY "Service role full access on companies"
  ON public.companies FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full companies access"
  ON public.companies FOR ALL
  USING (public.is_admin());

-- B2B clients: read their own company
CREATE POLICY "B2B clients read own company"
  ON public.companies FOR SELECT
  USING (id = public.get_user_company_id());

-- Authenticated users: read companies (for search/listing)
CREATE POLICY "Authenticated users read companies"
  ON public.companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════════
-- 10. CREDITS & CREDIT_TRANSACTIONS RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on credits" ON public.credits;
DROP POLICY IF EXISTS "Users read own credits" ON public.credits;
DROP POLICY IF EXISTS "Users update own credits" ON public.credits;
DROP POLICY IF EXISTS "Service role full access on credit_transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users read own credit transactions" ON public.credit_transactions;

-- Service role: full access
CREATE POLICY "Service role full access on credits"
  ON public.credits FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on credit_transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Users read own credits
CREATE POLICY "Users read own credits"
  ON public.credits FOR SELECT
  USING (user_id = auth.uid());

-- Users read own credit transactions
CREATE POLICY "Users read own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- 11. ORG INTEL TABLES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.org_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_key_people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on org_companies" ON public.org_companies;
DROP POLICY IF EXISTS "Service role full access on org_scoring" ON public.org_scoring;
DROP POLICY IF EXISTS "Service role full access on org_key_people" ON public.org_key_people;

-- Service role: full access
CREATE POLICY "Service role full access on org_companies"
  ON public.org_companies FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on org_scoring"
  ON public.org_scoring FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on org_key_people"
  ON public.org_key_people FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full org_companies access"
  ON public.org_companies FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins full org_scoring access"
  ON public.org_scoring FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins full org_key_people access"
  ON public.org_key_people FOR ALL
  USING (public.is_admin());

-- Authenticated users: read org intel data
CREATE POLICY "Authenticated users read org_companies"
  ON public.org_companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users read org_scoring"
  ON public.org_scoring FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users read org_key_people"
  ON public.org_key_people FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════════
-- 12. REPORT_TEMPLATES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on report_templates" ON public.report_templates;

CREATE POLICY "Service role full access on report_templates"
  ON public.report_templates FOR ALL
  USING (auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "Admins full report_templates access"
  ON public.report_templates FOR ALL
  USING (public.is_admin());

-- All authenticated users: read templates
CREATE POLICY "Authenticated users read report_templates"
  ON public.report_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════════
-- 13. SUCCESS_PROFILES RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.success_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on success_profiles" ON public.success_profiles;

CREATE POLICY "Service role full access on success_profiles"
  ON public.success_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins full success_profiles access"
  ON public.success_profiles FOR ALL
  USING (public.is_admin());

CREATE POLICY "B2B clients read own success_profiles"
  ON public.success_profiles FOR SELECT
  USING (
    mandate_id IN (
      SELECT id FROM public.mandates
      WHERE client_id = auth.uid()
         OR company_id = public.get_user_company_id()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'profiles', 'mandates', 'contacts', 'candidates_pipeline',
    'signals', 'agent_actions', 'chat_conversations', 'chat_messages',
    'reports', 'companies', 'credits', 'credit_transactions',
    'org_companies', 'org_scoring', 'org_key_people',
    'report_templates', 'success_profiles'
  ];
  v_no_rls TEXT[] := ARRAY[]::TEXT[];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
        AND row_security = 'on'
    ) THEN
      v_no_rls := array_append(v_no_rls, t);
    END IF;
  END LOOP;

  IF array_length(v_no_rls, 1) IS NULL THEN
    RAISE NOTICE '✅ RLS enabled on all tables';
  ELSE
    RAISE EXCEPTION '❌ RLS not enabled on: %', array_to_string(v_no_rls, ', ');
  END IF;
END$$;
