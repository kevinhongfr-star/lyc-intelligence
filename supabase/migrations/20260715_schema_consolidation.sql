-- =====================================================
-- Phase 1: DB Schema Consolidation
-- Creates unified views over legacy + v2 tables
-- =====================================================

-- =====================================================
-- UNIFIED USERS VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.users AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.role::TEXT,
  p.tier::TEXT,
  p.organization_id,
  p.avatar_url,
  p.timezone,
  p.locale,
  p.created_at,
  p.updated_at
FROM public.v2_user_profiles p
UNION ALL
SELECT 
  u.id,
  COALESCE(lp.email, u.email),
  COALESCE(lp.name, lp.full_name, u.raw_user_meta_data ->> 'name'),
  COALESCE(lp.role::TEXT, 'member'),
  COALESCE(lp.tier::TEXT, 'free'),
  lp.organization_id,
  lp.avatar_url,
  COALESCE(lp.timezone, 'Asia/Shanghai'),
  COALESCE(lp.locale, 'en'),
  COALESCE(lp.created_at, u.created_at),
  COALESCE(lp.updated_at, u.updated_at)
FROM auth.users u
LEFT JOIN public.profiles lp ON lp.id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_user_profiles vp WHERE vp.id = u.id
);

-- =====================================================
-- UNIFIED ORGANIZATIONS VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.organizations AS
SELECT 
  id,
  name,
  slug,
  tier,
  stripe_customer_id,
  subscription_status,
  subscription_tier,
  trial_ends_at,
  created_at,
  updated_at
FROM public.v2_organizations
UNION ALL
SELECT 
  o.id,
  o.name,
  o.slug,
  COALESCE(o.tier, 'free'),
  o.stripe_customer_id,
  o.subscription_status,
  o.subscription_tier,
  o.trial_ends_at,
  o.created_at,
  o.updated_at
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_organizations v WHERE v.id = o.id
);

-- =====================================================
-- UNIFIED COMPANIES VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.companies AS
SELECT 
  c.id,
  c.name,
  c.domain,
  c.industry,
  c.size,
  c.location,
  c.organization_id,
  c.metadata,
  c.created_at,
  c.updated_at
FROM public.v2_companies c
UNION ALL
SELECT 
  c.id,
  c.name,
  c.website as domain,
  c.industry,
  c.size,
  c.headquarters as location,
  c.organization_id,
  c.metadata,
  c.created_at,
  c.updated_at
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_companies v WHERE v.id = c.id
);

-- =====================================================
-- UNIFIED CREDITS VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.user_credits AS
WITH latest_transactions AS (
  SELECT DISTINCT ON (user_id, credit_type)
    user_id,
    credit_type,
    balance_after as balance,
    created_at
  FROM public.v2_credit_transactions
  ORDER BY user_id, credit_type, created_at DESC
)
SELECT 
  lt.user_id,
  SUM(CASE WHEN lt.credit_type = 'dex_credits' THEN lt.balance ELSE 0 END) as dex_credits,
  SUM(CASE WHEN lt.credit_type = 'council_credits' THEN lt.balance ELSE 0 END) as council_credits,
  COALESCE(p.tier, 'free') as tier,
  MAX(lt.created_at) as updated_at
FROM latest_transactions lt
LEFT JOIN public.v2_user_profiles p ON p.id = lt.user_id
GROUP BY lt.user_id, p.tier
UNION ALL
SELECT 
  c.user_id,
  c.balance as dex_credits,
  c.balance as council_credits,
  c.tier,
  c.updated_at
FROM public.credits c
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_credit_transactions t WHERE t.user_id = c.user_id
);

-- =====================================================
-- MIGRATION HELPER FUNCTIONS
-- =====================================================

-- Migrate single user from legacy to v2
CREATE OR REPLACE FUNCTION public.migrate_user_to_v2(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Migrate profile
  INSERT INTO public.v2_user_profiles (id, email, name, role, tier, organization_id, avatar_url, timezone, locale)
  SELECT 
    p.id,
    p.email,
    COALESCE(p.name, p.full_name),
    COALESCE(p.role, 'member'),
    COALESCE(p.tier, 'free'),
    p.organization_id,
    p.avatar_url,
    p.timezone,
    p.locale
  FROM public.profiles p
  WHERE p.id = p_user_id
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  
  -- Migrate credits
  INSERT INTO public.v2_credit_transactions (user_id, credit_type, transaction_type, amount, balance_after)
  SELECT 
    c.user_id,
    'dex_credits',
    'adjustment',
    c.balance,
    c.balance
  FROM public.credits c
  WHERE c.user_id = p_user_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate organization to v2
CREATE OR REPLACE FUNCTION public.migrate_organization_to_v2(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Migrate org
  INSERT INTO public.v2_organizations (id, name, slug, tier, stripe_customer_id, subscription_status, subscription_tier)
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.tier,
    o.stripe_customer_id,
    o.subscription_status,
    o.subscription_tier
  FROM public.organizations o
  WHERE o.id = p_org_id
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
  
  -- Migrate members
  INSERT INTO public.v2_org_memberships (user_id, organization_id, role)
  SELECT 
    om.user_id,
    om.organization_id,
    COALESCE(om.role, 'member')
  FROM public.org_memberships om
  WHERE om.organization_id = p_org_id
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch migrate all users
CREATE OR REPLACE FUNCTION public.migrate_all_users_to_v2()
RETURNS JSONB AS $$
DECLARE
  migrated INTEGER := 0;
  failed INTEGER := 0;
BEGIN
  -- Migrate users without v2 profiles
  INSERT INTO public.v2_user_profiles (id, email, name, role, tier, organization_id, avatar_url)
  SELECT 
    p.id,
    p.email,
    COALESCE(p.name, p.full_name),
    COALESCE(p.role, 'member'),
    COALESCE(p.tier, 'free'),
    p.organization_id,
    p.avatar_url
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.v2_user_profiles vp WHERE vp.id = p.id
  )
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS migrated = ROW_COUNT;
  
  RETURN jsonb_build_object('migrated', migrated, 'failed', failed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SYNC TRIGGERS (bidirectional sync)
-- =====================================================

-- Sync from v2 to legacy
CREATE OR REPLACE FUNCTION public.sync_v2_to_legacy_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, tier, organization_id, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.name,
    NEW.role,
    NEW.tier,
    NEW.organization_id,
    NEW.avatar_url,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    tier = EXCLUDED.tier,
    organization_id = EXCLUDED.organization_id,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_v2_profile_trigger ON public.v2_user_profiles;
CREATE TRIGGER sync_v2_profile_trigger
  AFTER INSERT OR UPDATE ON public.v2_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_v2_to_legacy_profile();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.user_credits TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;