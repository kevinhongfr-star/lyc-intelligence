-- Phase 2: Realtime & Pub/Sub Subscriptions
--
-- Enables Supabase Realtime on core tables so the portal frontend
-- can subscribe to live changes instead of polling. This covers the
-- most frequently-updated tables that drive dashboard UIs.
--
-- Also adds a generic notification_events table for cross-agent event
-- publishing (e.g. PROBE → LENS → MARIA pipeline events, status
-- updates, completion signals).

-- ─── Enable realtime on key tables ────────────────────────────────
-- These tables get broadcast through Supabase Realtime so the portal
-- can subscribe to insert/update/delete events.

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.mandates;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.candidates_pipeline;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.campaign_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.permission_audit_log;

-- ─── notification_events ──────────────────────────────────────────
-- Generic pub/sub table for inter-agent and agent→frontend events.
-- Use the realtime channel 'notifications' to subscribe.

CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL DEFAULT 'general',
    event_type TEXT NOT NULL,
    source TEXT,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_channel ON public.notification_events(channel);
CREATE INDEX IF NOT EXISTS idx_notification_events_target_user ON public.notification_events(target_user_id, read);
CREATE INDEX IF NOT EXISTS idx_notification_events_created_at ON public.notification_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_event_type ON public.notification_events(event_type);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Internal users can read/create all notifications
CREATE POLICY "Internal users full access to notifications"
    ON public.notification_events FOR ALL
    USING (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'))
    WITH CHECK (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'));

-- Users can read their own notifications
CREATE POLICY "Users read own notifications"
    ON public.notification_events FOR SELECT
    USING (auth.uid() = target_user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users update own notifications read status"
    ON public.notification_events FOR UPDATE
    USING (auth.uid() = target_user_id)
    WITH CHECK (auth.uid() = target_user_id AND read = TRUE);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notification_events;

-- ─── Helper function ──────────────────────────────────────────────
-- Emit a notification event from SQL (useful in triggers and edge functions).

CREATE OR REPLACE FUNCTION public.emit_notification(
    p_channel TEXT,
    p_event_type TEXT,
    p_source TEXT,
    p_target_user_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.notification_events (channel, event_type, source, target_user_id, payload)
    VALUES (p_channel, p_event_type, p_source, p_target_user_id, p_payload)
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;
