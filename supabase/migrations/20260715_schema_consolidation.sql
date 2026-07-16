-- FIXED Migration #4 v2: Schema Consolidation

-- 1. Unified users view
CREATE OR REPLACE VIEW public.v_unified_users AS
SELECT
  p.id, p.email,
  COALESCE(p.name, p.full_name) AS display_name,
  p.role::TEXT, p.tier::TEXT, p.organization_id,
  p.avatar_url, p.timezone, p.locale,
  p.created_at, p.updated_at, 'v2' AS source
FROM public.v2_user_profiles p
UNION ALL
SELECT
  lp.id, lp.email,
  COALESCE(lp.full_name, lp.name) AS display_name,
  COALESCE(lp.role, 'member') AS role,
  COALESCE(lp.tier, 'free') AS tier,
  lp.organization_id, lp.avatar_url,
  'Asia/Shanghai' AS timezone, 'en' AS locale,
  lp.created_at, lp.updated_at, 'legacy' AS source
FROM public.profiles lp
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_user_profiles vp WHERE vp.id = lp.id
);

-- 2. Unified organizations view
CREATE OR REPLACE VIEW public.v_unified_organizations AS
SELECT
  v.id, v.name, v.slug,
  COALESCE(v.subscription_tier, v.tier, 'free') AS tier,
  v.stripe_customer_id, v.subscription_status, v.subscription_tier,
  v.trial_ends_at, v.industry, v.size_category, v.website,
  v.created_at, v.updated_at, 'v2' AS source
FROM public.v2_organizations v
UNION ALL
SELECT
  o.id, o.name, o.slug,
  COALESCE(o.plan, 'free') AS tier,
  o.stripe_customer_id, o.subscription_status, o.subscription_tier,
  o.trial_ends_at, o.industry, o.size_category, o.website,
  o.created_at, o.updated_at, 'legacy' AS source
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_organizations v WHERE v.id = o.id
);

-- 3. Unified companies view (correct column names)
CREATE OR REPLACE VIEW public.v_unified_companies AS
SELECT
  c.id, c.name, c.website AS domain, c.industry,
  c.size_category AS size, c.headquarters_city AS location,
  c.org_id AS organization_id, c.metadata,
  c.created_at, c.updated_at, 'v2' AS source
FROM public.v2_companies c
UNION ALL
SELECT
  c.id, c.name, c.website AS domain, c.industry,
  c.size_category AS size, c.headquarters_city AS location,
  c.org_id AS organization_id, c.metadata,
  c.created_at, c.updated_at, 'legacy' AS source
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.v2_companies v WHERE v.id = c.id
);

-- 4. Unified credits view
CREATE OR REPLACE VIEW public.v_unified_credits AS
WITH latest_txns AS (
  SELECT DISTINCT ON (user_id, credit_type)
    user_id, credit_type, balance_after, created_at
  FROM public.v2_credit_transactions
  ORDER BY user_id, credit_type, created_at DESC
)
SELECT
  lt.user_id,
  SUM(CASE WHEN lt.credit_type = 'dex_credits' THEN lt.balance_after ELSE 0 END) AS dex_credits,
  SUM(CASE WHEN lt.credit_type = 'council_credits' THEN lt.balance_after ELSE 0 END) AS council_credits,
  COALESCE(p.tier::TEXT, 'free') AS tier,
  MAX(lt.created_at) AS updated_at
FROM latest_txns lt
LEFT JOIN public.v2_user_profiles p ON p.id = lt.user_id
GROUP BY lt.user_id, p.tier;

-- 5. Migration helper functions
CREATE OR REPLACE FUNCTION public.migrate_user_to_v2(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.v2_user_profiles v
  SET
    email = COALESCE(p.email, v.email),
    name = COALESCE(p.full_name, p.name, v.name),
    role = COALESCE(p.role::public.user_role, v.role),
    tier = COALESCE(p.tier::public.credit_tier, v.tier),
    organization_id = COALESCE(p.organization_id, v.organization_id),
    avatar_url = COALESCE(p.avatar_url, v.avatar_url),
    updated_at = NOW()
  FROM public.profiles p
  WHERE v.id = p_user_id AND p.id = p_user_id;

  INSERT INTO public.v2_user_profiles (id, user_id, email, name, full_name, role, tier, organization_id, avatar_url)
  SELECT p.id, p.id, p.email, p.full_name, p.full_name,
    COALESCE(p.role::public.user_role, 'member'),
    COALESCE(p.tier::public.credit_tier, 'free'),
    p.organization_id, p.avatar_url
  FROM public.profiles p
  WHERE p.id = p_user_id
    AND NOT EXISTS (SELECT 1 FROM public.v2_user_profiles v WHERE v.id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.migrate_organization_to_v2(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.v2_org_memberships (org_id, user_id, role, status)
  SELECT om.org_id, om.user_id,
    COALESCE(om.role, 'member'),
    COALESCE(om.status, 'active')
  FROM public.org_memberships om
  WHERE om.org_id = p_org_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.migrate_all_users_to_v2()
RETURNS JSONB AS $$
DECLARE
  migrated INTEGER;
BEGIN
  UPDATE public.v2_user_profiles v
  SET
    email = COALESCE(v.email, p.email),
    name = COALESCE(v.name, p.full_name),
    role = COALESCE(v.role, p.role::public.user_role),
    tier = COALESCE(v.tier, p.tier::public.credit_tier),
    organization_id = COALESCE(v.organization_id, p.organization_id),
    updated_at = NOW()
  FROM public.profiles p
  WHERE v.id = p.id;

  INSERT INTO public.v2_user_profiles (id, user_id, email, name, full_name, role, tier, organization_id, avatar_url)
  SELECT p.id, p.id, p.email, p.full_name, p.full_name,
    COALESCE(p.role::public.user_role, 'member'),
    COALESCE(p.tier::public.credit_tier, 'free'),
    p.organization_id, p.avatar_url
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM public.v2_user_profiles v WHERE v.id = p.id);

  GET DIAGNOSTICS migrated = ROW_COUNT;
  RETURN jsonb_build_object('migrated', migrated, 'failed', 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grants
GRANT SELECT ON public.v_unified_users TO authenticated;
GRANT SELECT ON public.v_unified_organizations TO authenticated;
GRANT SELECT ON public.v_unified_companies TO authenticated;
GRANT SELECT ON public.v_unified_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_user_to_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_organization_to_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_all_users_to_v2() TO authenticated;
