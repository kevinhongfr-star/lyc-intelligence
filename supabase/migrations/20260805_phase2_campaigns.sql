-- Phase 2: Campaigns & Outreach Infrastructure
--
-- Adds the campaign system that powers MARIA's outreach automation and
-- the candidate portal's campaign tracking. Campaigns are top-level
-- containers for outreach sequences, with contacts linked through a
-- many-to-many junction table.
--
-- Tables:
--   campaigns              — top-level campaign records
--   campaign_contacts      — many-to-many link between campaigns and contacts
--   campaign_steps         — sequence step templates
--   campaign_contact_steps — per-contact step tracking (sends, opens, replies)

-- Enable pgcrypto for gen_random_uuid() if not already
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── campaigns ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'outreach' CHECK (type IN ('outreach', 'nurture', 'event', 'referral', 'other')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    target_audience TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_id UUID,
    mandate_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner_id ON public.campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- ─── campaign_contacts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID,
    candidate_id UUID,
    status TEXT NOT NULL DEFAULT 'added' CHECK (status IN ('added', 'enrolled', 'paused', 'unsubscribed', 'bounced', 'replied', 'converted')),
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    reply_received_at TIMESTAMPTZ,
    UNIQUE (campaign_id, contact_id),
    UNIQUE (campaign_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON public.campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_contact_id ON public.campaign_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_candidate_id ON public.campaign_contacts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON public.campaign_contacts(status);

-- ─── campaign_steps ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    step_number INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'linkedin', 'call', 'sms', 'other')),
    template TEXT,
    subject TEXT,
    body TEXT,
    wait_days INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON public.campaign_steps(campaign_id);

-- ─── campaign_contact_steps ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_contact_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_contact_id UUID NOT NULL REFERENCES public.campaign_contacts(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.campaign_steps(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'skipped')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_contact_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_ccs_campaign_contact_id ON public.campaign_contact_steps(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_ccs_step_id ON public.campaign_contact_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_ccs_status ON public.campaign_contact_steps(status);
CREATE INDEX IF NOT EXISTS idx_ccs_scheduled_at ON public.campaign_contact_steps(scheduled_at);

-- ─── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contact_steps ENABLE ROW LEVEL SECURITY;

-- Internal users can read/write all campaign data
CREATE POLICY "Internal users full access to campaigns"
    ON public.campaigns FOR ALL
    USING (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'))
    WITH CHECK (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'));

CREATE POLICY "Internal users full access to campaign_contacts"
    ON public.campaign_contacts FOR ALL
    USING (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'))
    WITH CHECK (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'));

CREATE POLICY "Internal users full access to campaign_steps"
    ON public.campaign_steps FOR ALL
    USING (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'))
    WITH CHECK (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'));

CREATE POLICY "Internal users full access to campaign_contact_steps"
    ON public.campaign_contact_steps FOR ALL
    USING (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'))
    WITH CHECK (auth.jwt() ->> 'user_type' = 'internal' OR (auth.jwt() ->> 'role')::text IN ('super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'));

-- Client admins can read campaigns for their clients (placeholder — extend with client_mandate_access join when ready)
CREATE POLICY "Client users read own campaigns"
    ON public.campaigns FOR SELECT
    USING (auth.jwt() ->> 'user_type' = 'client' AND auth.jwt() ->> 'role' IN ('client_admin', 'client_viewer'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER set_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_campaign_steps_updated_at ON public.campaign_steps;
CREATE TRIGGER set_campaign_steps_updated_at
    BEFORE UPDATE ON public.campaign_steps
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_campaign_contact_steps_updated_at ON public.campaign_contact_steps;
CREATE TRIGGER set_campaign_contact_steps_updated_at
    BEFORE UPDATE ON public.campaign_contact_steps
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
