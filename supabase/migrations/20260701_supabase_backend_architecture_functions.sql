-- ═══════════════════════════════════════════════════════════════════
-- 20260701_supabase_backend_architecture_functions.sql
-- LYC Intelligence — Database Functions & Triggers
-- ═══════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- 1. get_user_portal_role()
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_portal_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT portal_role FROM public.profiles WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ════════════════════════════════════════════════════════════════
-- 2. get_mandate_pipeline_stats()
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_mandate_pipeline_stats(p_mandate_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_candidates', COUNT(*),
    'by_stage', COALESCE(
      jsonb_agg(jsonb_build_object('stage', stage, 'count', cnt))
        FILTER (WHERE stage IS NOT NULL),
      '[]'::jsonb
    )
  ) INTO result
  FROM (
    SELECT stage, COUNT(*) as cnt
    FROM public.candidates_pipeline
    WHERE mandate_id = p_mandate_id
    GROUP BY stage
  ) sub;

  RETURN COALESCE(result, '{"total_candidates": 0, "by_stage": []}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 3. get_company_dashboard_kpis()
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_company_dashboard_kpis(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_mandates', (
      SELECT COUNT(*) FROM public.mandates
      WHERE company_id = p_company_id
        AND pipeline_stage NOT IN ('closed', 'on_hold')
    ),
    'total_candidates', (
      SELECT COUNT(DISTINCT cp.contact_id)
      FROM public.candidates_pipeline cp
      JOIN public.mandates m ON cp.mandate_id = m.id
      WHERE m.company_id = p_company_id
    ),
    'interviews_this_week', (
      SELECT COUNT(*) FROM public.events
      WHERE company_id = p_company_id
        AND start_time >= CURRENT_DATE
        AND start_time < CURRENT_DATE + INTERVAL '7 days'
    ),
    'pending_offers', (
      SELECT COUNT(*) FROM public.mandates
      WHERE company_id = p_company_id
        AND pipeline_stage = 'offer'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 4. record_signal() helper
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.record_signal(
  p_type TEXT,
  p_target_entity_type TEXT,
  p_target_entity_id UUID,
  p_actors JSONB DEFAULT '[]'::jsonb,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_source TEXT DEFAULT 'platform'
)
RETURNS UUID AS $$
DECLARE
  v_signal_id UUID;
BEGIN
  INSERT INTO public.signals (
    type, target_entity_type, target_entity_id,
    actors, context, source
  ) VALUES (
    p_type, p_target_entity_type, p_target_entity_id,
    p_actors, p_context, p_source
  )
  RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 5. handle_new_user() — auto-create profile on signup
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    name,
    portal_role,
    role,
    avatar_url,
    metadata
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'portal_role', 'candidate'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- 6. Increment signal count on contacts when signal is created
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fn_signal_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_entity_type = 'contact' AND NEW.target_entity_id IS NOT NULL THEN
    UPDATE public.contacts
    SET signal_count = COALESCE(signal_count, 0) + 1,
        last_signal_at = NEW.created_at
    WHERE id = NEW.target_entity_id;
  ELSIF NEW.contact_id IS NOT NULL THEN
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

-- ════════════════════════════════════════════════════════════════
-- 7. Update updated_at on profile change
-- ════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 8. get_active_portal_sessions() — admin dashboard helper
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_portal_user_counts()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'admin', COUNT(*) FILTER (WHERE portal_role = 'admin'),
    'b2b_client', COUNT(*) FILTER (WHERE portal_role = 'b2b_client'),
    'b2c_leader', COUNT(*) FILTER (WHERE portal_role = 'b2c_leader'),
    'candidate', COUNT(*) FILTER (WHERE portal_role = 'candidate'),
    'total', COUNT(*)
  ) INTO result
  FROM public.profiles;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_func_count
  FROM information_schema.routines
  WHERE specific_schema = 'public'
    AND routine_name IN (
      'get_user_portal_role',
      'get_mandate_pipeline_stats',
      'get_company_dashboard_kpis',
      'record_signal',
      'handle_new_user',
      'fn_signal_after_insert',
      'get_portal_user_counts',
      'set_updated_at',
      'is_admin',
      'get_user_company_id'
    );

  IF v_func_count >= 10 THEN
    RAISE NOTICE '✅ All core functions verified (% found)', v_func_count;
  ELSE
    RAISE EXCEPTION '❌ Missing functions — only % found', v_func_count;
  END IF;
END$$;
