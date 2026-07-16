-- ============================================================================
-- Intelligence Signal Notifications & Enrichment Support
-- Issue #8: Alert/notification on high-priority signals
-- ============================================================================

-- 1. Add AI enrichment columns to companies (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies'
    AND column_name = 'ai_enriched_at') THEN
    ALTER TABLE public.companies ADD COLUMN ai_enriched_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies'
    AND column_name = 'ai_enrichment_summary') THEN
    ALTER TABLE public.companies ADD COLUMN ai_enrichment_summary JSONB;
  END IF;
END $$;

-- 2. Add AI enrichment columns to contacts (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts'
    AND column_name = 'ai_enriched_at') THEN
    ALTER TABLE public.contacts ADD COLUMN ai_enriched_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Create intelligence_suggestions table (for signal-to-mandate matching)
CREATE TABLE IF NOT EXISTS public.intelligence_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.intelligence_signals(id) ON DELETE CASCADE,
  mandate_id UUID REFERENCES public.mandates(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  match_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_suggestions_signal
  ON public.intelligence_suggestions(signal_id);
CREATE INDEX IF NOT EXISTS idx_intel_suggestions_mandate
  ON public.intelligence_suggestions(mandate_id);
CREATE INDEX IF NOT EXISTS idx_intel_suggestions_status
  ON public.intelligence_suggestions(status);

ALTER TABLE public.intelligence_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and consultants can view suggestions"
  ON public.intelligence_suggestions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Service role full access to suggestions"
  ON public.intelligence_suggestions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 4. DB trigger: Auto-notify on high-priority intelligence signals
CREATE OR REPLACE FUNCTION public.notify_high_priority_signal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on high/critical impact signals
  IF NEW.impact_level IN ('high', 'critical') THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      priority,
      channels,
      metadata,
      link
    )
    SELECT
      p.id,
      'intelligence',
      'High-Priority Signal: ' || NEW.title,
      COALESCE(NEW.summary, 'New intelligence signal detected') ||
      ' (Impact: ' || NEW.impact_level || ')',
      CASE WHEN NEW.impact_level = 'critical' THEN 'urgent' ELSE 'high' END,
      ARRAY['in_app']::TEXT[],
      jsonb_build_object(
        'signal_id', NEW.id,
        'signal_type', NEW.signal_type,
        'impact_level', NEW.impact_level
      ),
      '/intelligence?signal=' || NEW.id
    FROM public.profiles p
    WHERE p.role IN ('super_admin', 'org_admin', 'practice_lead', 'recruiter')
    AND p.deleted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_notify_high_priority_signal ON public.intelligence_signals;
CREATE TRIGGER trg_notify_high_priority_signal
  AFTER INSERT ON public.intelligence_signals
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_priority_signal();

-- 5. Function to batch enrich unenriched signals (called by cron)
CREATE OR REPLACE FUNCTION public.trigger_signal_enrichment()
RETURNS void AS $$
DECLARE
  supabase_url TEXT := current_setting('app.settings.supabase_url', true);
  service_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Signal enrichment skipped: Supabase URL or service key not configured';
    RETURN;
  END IF;

  -- Trigger ai-enrich edge function for batch enrichment
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/ai-enrich',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.trigger_signal_enrichment() TO postgres, authenticated;

-- 6. Schedule signal enrichment every 2 hours
SELECT cron.schedule(
  'signal_enrichment_2h',
  '0 */2 * * *',
  $$SELECT public.trigger_signal_enrichment()$$
);

-- 7. Verify
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname LIKE '%signal%' OR jobname LIKE '%enrichment%' ORDER BY jobname;
