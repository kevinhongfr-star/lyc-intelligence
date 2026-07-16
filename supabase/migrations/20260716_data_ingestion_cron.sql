-- ============================================================================
-- v2 Data Ingestion Scheduling — pg_cron job for scheduled signal fetching
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Create a function to trigger the data ingestion edge function
DROP FUNCTION IF EXISTS public.trigger_data_ingestion();
CREATE FUNCTION public.trigger_data_ingestion()
RETURNS void AS $$
DECLARE
  supabase_url TEXT := current_setting('app.settings.supabase_url', true);
  service_key TEXT := current_setting('app.settings.service_role_key', true);
  response TEXT;
BEGIN
  IF supabase_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Data ingestion skipped: Supabase URL or service key not configured';
    RETURN;
  END IF;

  PERFORM http_post(
    supabase_url || '/functions/v1/data-ingestion',
    '{}',
    ARRAY[
      ('Content-Type', 'application/json'),
      ('Authorization', 'Bearer ' || service_key)
    ]::http_header[]
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Grant execute on the function to the cron job runner
GRANT EXECUTE ON FUNCTION public.trigger_data_ingestion() TO postgres;

-- Schedule the data ingestion to run every hour (at minute 0)
SELECT cron.schedule(
  'data_ingestion_hourly',
  '0 * * * *',
  'SELECT public.trigger_data_ingestion();'
);

-- Schedule the data ingestion to run every 15 minutes for more frequent updates
SELECT cron.schedule(
  'data_ingestion_quarterly',
  '*/15 * * * *',
  'SELECT public.trigger_data_ingestion();'
);

-- Create a function to clean up stale signals (older than 90 days)
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

GRANT EXECUTE ON FUNCTION public.cleanup_stale_signals() TO postgres;

-- Schedule cleanup to run daily at 2:00 AM
SELECT cron.schedule(
  'cleanup_stale_signals_daily',
  '0 2 * * *',
  'SELECT public.cleanup_stale_signals();'
);

-- Create a function to update source reliability scores based on fetch success rate
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

GRANT EXECUTE ON FUNCTION public.update_source_reliability() TO postgres;

-- Schedule reliability updates to run every 6 hours
SELECT cron.schedule(
  'update_source_reliability',
  '0 */6 * * *',
  'SELECT public.update_source_reliability();'
);
