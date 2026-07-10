-- ════════════════════════════════════════════════════════════════════════
-- 20260710_t1_activity_triggers.sql
-- T1 — Activity Log Auto-Creation Triggers
-- ════════════════════════════════════════════════════════════════════════

-- ── UTILITY: Set updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── ACTIVITY LOG TRIGGER FUNCTION ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'status_change';
    ELSE
      v_action := 'updated';
    END IF;
  END IF;

  INSERT INTO activity_logs (
    entity_type,
    entity_id,
    action,
    actor_id,
    from_value,
    to_value,
    metadata
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    CASE WHEN v_action = 'status_change' THEN OLD.status::TEXT ELSE NULL END,
    CASE WHEN v_action = 'status_change' THEN NEW.status::TEXT ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
      'changes', (SELECT jsonb_object_agg(key, jsonb_build_object('old', OLD -> key, 'new', NEW -> key))
                 FROM jsonb_each(to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at') key
                 WHERE OLD -> key <> NEW -> key)
    ) ELSE '{}'::jsonb END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── ORGANIZATIONS TRIGGERS ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_organizations_activity ON public.organizations;
CREATE TRIGGER trg_organizations_activity
  AFTER INSERT OR UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

-- ── MANDATES TRIGGERS ──────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_mandates_activity ON public.mandates;
CREATE TRIGGER trg_mandates_activity
  AFTER INSERT OR UPDATE ON public.mandates
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

-- ── CANDIDATES TRIGGERS ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_candidates_activity ON public.candidates;
CREATE TRIGGER trg_candidates_activity
  AFTER INSERT OR UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

-- ── MANDATE_CANDIDATES TRIGGERS ────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_mandate_candidates_activity ON public.mandate_candidates;
CREATE TRIGGER trg_mandate_candidates_activity
  AFTER INSERT OR UPDATE ON public.mandate_candidates
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

-- ── CONSULTANTS TRIGGERS ───────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_consultants_activity ON public.consultants;
CREATE TRIGGER trg_consultants_activity
  AFTER INSERT OR UPDATE ON public.consultants
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_activity();

-- ── SMOKE TEST ─────────────────────────────────────────────────────────
DO $$
DECLARE
  v_triggers TEXT[];
BEGIN
  SELECT array_agg(tgname) INTO v_triggers
  FROM pg_trigger
  WHERE tgrelid IN (
    'organizations'::regclass,
    'mandates'::regclass,
    'candidates'::regclass,
    'mandate_candidates'::regclass,
    'consultants'::regclass
  ) AND tgname LIKE '%activity';

  IF array_length(v_triggers, 1) = 5 THEN
    RAISE NOTICE '✅ T1 Activity Triggers OK — all 5 tables have activity triggers';
  ELSE
    RAISE EXCEPTION '❌ T1 Activity Triggers FAILED — expected 5 triggers, got %', array_length(v_triggers, 1);
  END IF;
END$$;