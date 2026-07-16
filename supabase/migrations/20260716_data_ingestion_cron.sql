-- ============================================================================
-- FIXED Migration #6: Data Ingestion Scheduling — pg_cron jobs
-- Adapted to use net.http_post() from pg_net extension (2026-07-16)
-- ============================================================================

-- pg_cron extension is already enabled (v1.6.4)
-- pg_net extension is already enabled (v0.20.0)

-- 1. Function to trigger data ingestion via Edge Function
DROP FUNCTION IF EXISTS public.trigger_data_ingestion();
CREATE FUNCTION public.trigger_data_ingestion()
RETURNS void AS $$
DECLARE
  supabase_url TEXT := current_setting('app.settings.supabase_url', true);
  service_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Data ingestion skipped: Supabase URL or service key not configured in app.settings';
    RETURN;
  END IF;

  -- Use pg_net's http_post (not http_post from http extension)
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/data-ingestion',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.trigger_data_ingestion() TO postgres, authenticated;

-- 2. Schedule data ingestion every hour
SELECT cron.schedule(
  'data_ingestion_hourly',
  '0 * * * *',
  $$SELECT public.trigger_data_ingestion()$$
);

-- 3. Function to clean up stale signals (older than 90 days)
DROP FUNCTION IF EXISTS public.cleanup_stale_signals();
CREATE FUNCTION public.cleanup_stale_signals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.intelligence_signals
  WHERE discovered_at < NOW() - INTERVAL '90 days'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_stale_signals() TO postgres, authenticated;

-- 4. Schedule cleanup daily at 2:00 AM
SELECT cron.schedule(
  'cleanup_stale_signals_daily',
  '0 2 * * *',
  $$SELECT public.cleanup_stale_signals()$$
);

-- 5. Function to update source reliability scores
DROP FUNCTION IF EXISTS public.update_source_reliability();
CREATE FUNCTION public.update_source_reliability()
RETURNS void AS $$
BEGIN
  UPDATE public.intelligence_sources
  SET reliability_score = LEAST(1.0, GREATEST(0.0,
    reliability_score +
    CASE
      WHEN last_fetched_at IS NOT NULL AND last_fetched_at > NOW() - INTERVAL '2 hours' THEN 0.05
      WHEN last_fetched_at IS NOT NULL AND last_fetched_at > NOW() - INTERVAL '6 hours' THEN 0.02
      WHEN last_fetched_at IS NOT NULL AND last_fetched_at > NOW() - INTERVAL '24 hours' THEN -0.02
      ELSE -0.05
    END
  ))
  WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_source_reliability() TO postgres, authenticated;

-- 6. Schedule reliability updates every 6 hours
SELECT cron.schedule(
  'update_source_reliability',
  '0 */6 * * *',
  $$SELECT public.update_source_reliability()$$
);

-- 7. Verify cron jobs are scheduled
SELECT jobid, jobname, schedule, command FROM cron.job ORDER BY jobname;
