-- ============================================================
--  PHASE 3 — #1308: User Role Escalation Prevention
--
--  Problem: profiles RLS UPDATE policy allowed self-update of any
--  column, including `role`, `tier`, `organization_id`, `subtype`,
--  `miles_balance`. A user could escalate by setting role='admin'.
--  Additionally, the promote_candidate_to_leader() RPC was callable
--  by any authenticated user passing consent_given=true.
--
--  Fix: BEFORE INSERT/UPDATE trigger that blocks non-admins from
--  modifying privileged columns. Defense in depth — works even if
--  RLS policy is permissive or the row is touched via service role.
--
--  Privileged columns (cannot be changed by non-admins):
--    role, tier, organization_id, subtype, miles_balance,
--    stripe_customer_id, stripe_subscription_id, advisory_tier,
--    council_tier, notion_profile_id, advisory_lane
--
--  Allowed self-signup role/tier values (no elevation):
--    role  ∈ {member, leader, candidate, client, client_viewer}
--    tier  ∈ {explorer, starter, member}   (free/low tiers only)
--
--  Bypass: privileged SECURITY DEFINER functions set a local
--  session variable `app.bypass_role_escalation_check = 'true'`
--  AFTER performing their own admin check. The trigger honors it.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────
--  Trigger function: prevent privileged-column mutation by
--  non-admin callers. Works on both INSERT and UPDATE.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_role_escalation() RETURNS trigger AS $$
DECLARE
  caller_role text;
  bypass      text;
BEGIN
  -- Privileged functions (e.g. promote_candidate_to_leader) set
  -- this local variable AFTER their own admin/consent check.
  bypass := current_setting('app.bypass_role_escalation_check', true);
  IF bypass = 'true' THEN
    RETURN NEW;
  END IF;

  caller_role := public.current_user_role();

  -- Admins bypass — they may elevate/demote users.
  IF public.is_admin_role(caller_role) THEN
    RETURN NEW;
  END IF;

  -- ── UPDATE path: privileged columns cannot change value ──
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role              IS DISTINCT FROM OLD.role
       OR NEW.tier            IS DISTINCT FROM OLD.tier
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.subtype         IS DISTINCT FROM OLD.subtype
       OR NEW.miles_balance   IS DISTINCT FROM OLD.miles_balance
       OR NEW.stripe_customer_id        IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id    IS DISTINCT FROM OLD.stripe_subscription_id
       OR NEW.advisory_tier             IS DISTINCT FROM OLD.advisory_tier
       OR NEW.council_tier              IS DISTINCT FROM OLD.council_tier
       OR NEW.notion_profile_id         IS DISTINCT FROM OLD.notion_profile_id
       OR NEW.advisory_lane             IS DISTINCT FROM OLD.advisory_lane
    THEN
      RAISE EXCEPTION 'Privileged column modification denied: non-admin users cannot change role, tier, organization_id, subtype, miles_balance, or billing fields'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- ── INSERT path: self-signup cannot set elevated role/tier
  --  or pre-assign organization_id (must come via invitation).
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.role, 'member') NOT IN ('member', 'leader', 'candidate', 'client', 'client_viewer') THEN
      RAISE EXCEPTION 'Self-signup role denied: cannot assign role %', NEW.role
        USING ERRCODE = '42501';
    END IF;
    IF COALESCE(NEW.tier, 'explorer') NOT IN ('explorer', 'starter', 'member') THEN
      RAISE EXCEPTION 'Self-signup tier denied: cannot assign tier %', NEW.tier
        USING ERRCODE = '42501';
    END IF;
    -- organization_id MUST be NULL on self-signup — assignment is via
    -- admin/consultant invitation flow only.
    IF NEW.organization_id IS NOT NULL THEN
      RAISE EXCEPTION 'Self-signup organization denied: cannot self-assign organization_id'
        USING ERRCODE = '42501';
    END IF;
    -- Billing / advisory fields cannot be self-set either.
    IF NEW.stripe_customer_id IS NOT NULL
       OR NEW.stripe_subscription_id IS NOT NULL
       OR NEW.advisory_tier IS NOT NULL
       OR NEW.council_tier IS NOT NULL
       OR NEW.notion_profile_id IS NOT NULL
       OR NEW.advisory_lane IS NOT NULL
    THEN
      RAISE EXCEPTION 'Self-signup privileged field denied: cannot set billing or advisory fields'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

-- Attach trigger (drop if exists for idempotent re-run).
DROP TRIGGER IF EXISTS profiles_no_role_escalation ON public.profiles;
CREATE TRIGGER profiles_no_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ────────────────────────────────────────────────────────────
--  Audit log trigger — fires AFTER privileged-column change by
--  an admin. Writes to audit_logs for traceability.
--  (audit_logs schema: user_id, action, entity_type, entity_id,
--   extra jsonb, created_at)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_role_change() RETURNS trigger AS $$
DECLARE
  caller_id uuid := auth.uid();
  changes jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      changes := changes || jsonb_build_object('role', jsonb_build_array(OLD.role, NEW.role));
    END IF;
    IF NEW.tier IS DISTINCT FROM OLD.tier THEN
      changes := changes || jsonb_build_object('tier', jsonb_build_array(OLD.tier, NEW.tier));
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      changes := changes || jsonb_build_object('organization_id', jsonb_build_array(OLD.organization_id, NEW.organization_id));
    END IF;
    IF NEW.subtype IS DISTINCT FROM OLD.subtype THEN
      changes := changes || jsonb_build_object('subtype', jsonb_build_array(OLD.subtype, NEW.subtype));
    END IF;
    IF jsonb_typeof(changes) = 'object' AND (changes IS NOT NULL AND changes::text <> '{}') THEN
      BEGIN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, extra, created_at)
        VALUES (caller_id, 'role_change', 'profiles', NEW.id::text, changes, now());
      EXCEPTION WHEN OTHERS THEN
        -- audit failure must NOT block the operation
        NULL;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS profiles_audit_role_change ON public.profiles;
CREATE TRIGGER profiles_audit_role_change
  AFTER UPDATE OF role, tier, organization_id, subtype ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role IS DISTINCT FROM OLD.role
        OR NEW.tier IS DISTINCT FROM OLD.tier
        OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
        OR NEW.subtype IS DISTINCT FROM OLD.subtype)
  EXECUTE FUNCTION public.audit_role_change();

-- ────────────────────────────────────────────────────────────
--  Harden promote_candidate_to_leader — require admin caller
--  AND set the bypass flag locally so the trigger allows the
--  privileged update. Consent is still required.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.promote_candidate_to_leader(
  _user_id uuid,
  _new_role text DEFAULT 'leader',
  _new_org_id uuid DEFAULT NULL,
  _consent_given boolean DEFAULT false
) RETURNS jsonb AS $$
DECLARE
  res jsonb;
  caller_role text;
BEGIN
  -- ── Permission gate: only admins may invoke this RPC. ──
  caller_role := public.current_user_role();
  IF NOT public.is_admin_role(caller_role) THEN
    RAISE EXCEPTION 'Permission denied: promote_candidate_to_leader requires admin role'
      USING ERRCODE = '42501';
  END IF;

  IF NOT _consent_given THEN
    RAISE EXCEPTION 'Candidate identity migration requires explicit consent';
  END IF;

  -- Allow privileged-column update for this transaction only.
  SET LOCAL app.bypass_role_escalation_check = 'true';

  UPDATE public.profiles
  SET role = _new_role,
      organization_id = COALESCE(_new_org_id, organization_id),
      subtype = COALESCE(subtype, 'promoted_from_candidate'),
      updated_at = now()
  WHERE id = _user_id
  RETURNING jsonb_build_object('id', id, 'role', role, 'organization_id', organization_id) INTO res;

  INSERT INTO public.audit_logs(user_id, action, entity_type, entity_id, extra, created_at)
  VALUES (_user_id, 'candidate.promoted_to_leader', 'profile', _user_id::text,
          jsonb_build_object('new_role', _new_role, 'new_org_id', _new_org_id, 'consent', true),
          now());

  RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.promote_candidate_to_leader IS
'Candidate → Leader identity migration. Requires admin caller + explicit consent flag. Writes audit trail. SECURITY DEFINER so consent + admin enforcement is always enforced. Sets app.bypass_role_escalation_check locally to allow the privileged-column update.';
