
-- Persisted Rate Limiting Tables
-- Replaces in-memory Map-based rate limiting with database-backed solution
-- for multi-instance deployments (Vercel serverless functions)

-- ── rate_limits table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key_window
  ON public.rate_limits(key, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at
  ON public.rate_limits(created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed — this table is only accessed via service role
-- from server-side API handlers. Never exposed to client directly.

-- ── rate_limit_bans table (for repeated violations) ────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limit_bans (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  ban_reason TEXT,
  banned_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_bans_banned_until
  ON public.rate_limit_bans(banned_until);

ALTER TABLE public.rate_limit_bans ENABLE ROW LEVEL SECURITY;

-- ── Helper function: check and increment rate limit ────────────────────────
-- Returns: true = allowed, false = rate limited
-- Usage: SELECT check_rate_limit('ip:1.2.3.4:login', 5, '1 minute'::interval);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window INTERVAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Check if key is currently banned
  IF EXISTS (
    SELECT 1 FROM rate_limit_bans
    WHERE key = p_key AND banned_until > NOW()
  ) THEN
    RETURN FALSE;
  END IF;

  -- Calculate window start
  v_window_start := DATE_TRUNC('minute', NOW());
  IF p_window >= INTERVAL '1 hour' THEN
    v_window_start := DATE_TRUNC('hour', NOW());
  ELSIF p_window >= INTERVAL '1 day' THEN
    v_window_start := DATE_TRUNC('day', NOW());
  END IF;

  -- Upsert: increment counter for current window
  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Return true (allowed) if count is <= max
  RETURN v_count <= p_max;
END;
$$;

-- ── Helper function: check rate limit without incrementing (read-only) ────

CREATE OR REPLACE FUNCTION public.check_rate_limit_readonly(
  p_key TEXT,
  p_max INTEGER,
  p_window INTERVAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM rate_limit_bans
    WHERE key = p_key AND banned_until > NOW()
  ) THEN
    RETURN FALSE;
  END IF;

  v_window_start := DATE_TRUNC('minute', NOW());
  IF p_window >= INTERVAL '1 hour' THEN
    v_window_start := DATE_TRUNC('hour', NOW());
  ELSIF p_window >= INTERVAL '1 day' THEN
    v_window_start := DATE_TRUNC('day', NOW());
  END IF;

  SELECT COALESCE(count, 0) INTO v_count
  FROM rate_limits
  WHERE key = p_key AND window_start = v_window_start;

  RETURN v_count < p_max;
END;
$$;

-- ── Helper function: ban a key for repeated violations ─────────────────────

CREATE OR REPLACE FUNCTION public.ban_rate_limit_key(
  p_key TEXT,
  p_duration INTERVAL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO rate_limit_bans (key, ban_reason, banned_until)
  VALUES (p_key, p_reason, NOW() + p_duration)
  ON CONFLICT (key)
  DO UPDATE SET
    banned_until = NOW() + p_duration,
    ban_reason = p_reason,
    updated_at = NOW();
END;
$$;

-- ── Cleanup function: old rate limit windows + expired bans ────────────────
-- Run via pg_cron daily (if available) or on a schedule

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- Delete rate limit windows older than 7 days
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Delete expired bans older than 30 days
  DELETE FROM rate_limit_bans
  WHERE banned_until < NOW() - INTERVAL '30 days';

  RETURN v_deleted;
END;
$$;
