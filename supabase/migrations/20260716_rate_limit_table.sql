-- ============================================================================
-- v2 Rate Limiting Table — Persisted rate limiting for API endpoints
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.v2_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_type TEXT NOT NULL CHECK (key_type IN ('ip', 'user_id', 'api_key')),
  key_value TEXT NOT NULL,
  endpoint TEXT DEFAULT 'default',
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_v2_rate_limits_key_endpoint
  ON public.v2_rate_limits(key_type, key_value, endpoint);

CREATE INDEX IF NOT EXISTS idx_v2_rate_limits_reset_at
  ON public.v2_rate_limits(reset_at);

CREATE INDEX IF NOT EXISTS idx_v2_rate_limits_key
  ON public.v2_rate_limits(key_type, key_value);

ALTER TABLE public.v2_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role access to rate limits"
  ON public.v2_rate_limits FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, TEXT, TEXT, INTEGER);
CREATE FUNCTION public.check_rate_limit(
  p_key_type TEXT,
  p_key_value TEXT,
  p_endpoint TEXT,
  p_limit INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT count, reset_at INTO v_current_count, v_reset_at
  FROM public.v2_rate_limits
  WHERE key_type = p_key_type
    AND key_value = p_key_value
    AND endpoint = p_endpoint;

  IF NOT FOUND THEN
    INSERT INTO public.v2_rate_limits (key_type, key_value, endpoint, count, reset_at)
    VALUES (p_key_type, p_key_value, p_endpoint, 1, NOW() + INTERVAL '1 minute');
    RETURN FALSE;
  END IF;

  IF NOW() > v_reset_at THEN
    UPDATE public.v2_rate_limits
    SET count = 1, reset_at = NOW() + INTERVAL '1 minute', updated_at = NOW()
    WHERE key_type = p_key_type
      AND key_value = p_key_value
      AND endpoint = p_endpoint;
    RETURN FALSE;
  END IF;

  IF v_current_count >= p_limit THEN
    RETURN TRUE;
  END IF;

  UPDATE public.v2_rate_limits
  SET count = v_current_count + 1, updated_at = NOW()
  WHERE key_type = p_key_type
    AND key_value = p_key_value
    AND endpoint = p_endpoint;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.reset_rate_limit(TEXT, TEXT, TEXT);
CREATE FUNCTION public.reset_rate_limit(
  p_key_type TEXT,
  p_key_value TEXT,
  p_endpoint TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.v2_rate_limits
  SET count = 0, reset_at = NOW() + INTERVAL '1 minute', updated_at = NOW()
  WHERE key_type = p_key_type
    AND key_value = p_key_value
    AND endpoint = p_endpoint;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.cleanup_expired_rate_limits();
CREATE FUNCTION public.cleanup_expired_rate_limits() RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.v2_rate_limits
  WHERE reset_at < NOW() - INTERVAL '5 minutes';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_v2_rate_limits_updated_at ON public.v2_rate_limits;
CREATE TRIGGER trg_v2_rate_limits_updated_at
  BEFORE UPDATE ON public.v2_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
