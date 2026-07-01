-- =====================================================================
-- Technical Blueprint 11: Dashboard & Analytics (DEX-TB-011)
-- Database Migration
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 2.1 Table: analytics_snapshots
-- Pre-computed metrics stored as point-in-time snapshots
-- =====================================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    snapshot_hour INTEGER,

    -- Scope
    scope_type TEXT NOT NULL CHECK (scope_type IN (
        'platform',
        'team',
        'individual',
        'mandate'
    )),
    scope_id UUID,

    -- Pipeline metrics
    pipeline_total INTEGER,
    pipeline_by_stage JSONB,
    new_candidates INTEGER,
    stage_advances INTEGER,
    stage_regressions INTEGER,

    -- Conversion metrics
    conversion_rates JSONB,

    -- Velocity metrics
    avg_days_per_stage JSONB,
    avg_pipeline_days NUMERIC,

    -- Activity metrics
    outreach_count INTEGER,
    emails_sent INTEGER,
    emails_received INTEGER,
    wechat_interactions INTEGER,
    calls_count INTEGER,

    -- Quality metrics
    avg_trident_score NUMERIC,
    trident_distribution JSONB,

    -- Mandate metrics (for mandate scope)
    mandate_candidates INTEGER,
    mandate_presented INTEGER,
    mandate_interviews INTEGER,
    mandate_offers INTEGER,
    mandate_days_in_phase INTEGER,

    -- Metadata
    computed_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(snapshot_date, snapshot_hour, scope_type, scope_id)
);

-- Indexes for analytics_snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_scope ON analytics_snapshots(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics_snapshots(snapshot_date DESC)
    WHERE scope_type = 'platform';

-- RLS for analytics_snapshots
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sees all snapshots" ON analytics_snapshots
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
        )
        OR scope_id = auth.uid()
    );

-- =====================================================================
-- 2.2 Table: dashboard_widgets_config
-- User-specific dashboard layout preferences
-- =====================================================================
CREATE TABLE IF NOT EXISTS dashboard_widgets_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dashboard_type TEXT NOT NULL CHECK (dashboard_type IN (
        'executive',
        'team_lead',
        'consultant'
    )),
    widget_key TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, widget_key)
);

-- Indexes for dashboard_widgets_config
CREATE INDEX IF NOT EXISTS idx_dash_user ON dashboard_widgets_config(user_id);

-- RLS for dashboard_widgets_config
ALTER TABLE dashboard_widgets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own widgets" ON dashboard_widgets_config
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- =====================================================================
-- 2.3 Table: kpis
-- Target/goal tracking for the team
-- =====================================================================
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'pipeline',
        'conversion',
        'velocity',
        'activity',
        'revenue',
        'quality'
    )),

    -- Target
    target_value NUMERIC NOT NULL,
    target_period TEXT DEFAULT 'monthly' CHECK (target_period IN (
        'daily',
        'weekly',
        'monthly',
        'quarterly'
    )),

    -- Scope
    applies_to TEXT DEFAULT 'platform' CHECK (applies_to IN (
        'platform',
        'team',
        'individual'
    )),
    scope_id UUID,

    -- Current tracking
    current_value NUMERIC DEFAULT 0,
    last_computed_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for kpis
CREATE INDEX IF NOT EXISTS idx_kpi_category ON kpis(category);
CREATE INDEX IF NOT EXISTS idx_kpi_active ON kpis(is_active) WHERE is_active = TRUE;

-- RLS for kpis
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages KPIs" ON kpis
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Team can view KPIs" ON kpis
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

-- =====================================================================
-- Seed: Default KPIs
-- =====================================================================
INSERT INTO kpis (name, description, category, target_value, target_period, applies_to, is_active)
VALUES
    ('Engagement Rate', 'Percentage of candidates that are actively engaged (S5+)', 'pipeline', 40, 'monthly', 'platform', TRUE),
    ('Advancement Rate', 'Percentage of candidates that reach interview stage (S11+)', 'conversion', 20, 'monthly', 'platform', TRUE),
    ('Placement Rate', 'Percentage of candidates that get placed (S19)', 'conversion', 5, 'quarterly', 'platform', TRUE),
    ('Daily Outreach', 'Average outreach actions per consultant per day', 'activity', 10, 'daily', 'individual', TRUE),
    ('Response Rate', 'Percentage of contacted candidates that respond (S5/S3)', 'conversion', 30, 'monthly', 'platform', TRUE),
    ('Source to Contact', 'Average days from S1 to S3', 'velocity', 3, 'monthly', 'platform', TRUE),
    ('Contact to Engaged', 'Average days from S3 to S7', 'velocity', 7, 'monthly', 'platform', TRUE),
    ('Offer to Close', 'Average days from S16 to S19', 'velocity', 14, 'quarterly', 'platform', TRUE),
    ('Revenue per Consultant', 'Average placement revenue per consultant', 'revenue', 100000, 'quarterly', 'individual', TRUE),
    ('Overdue Payment Rate', 'Percentage of payments that are overdue', 'revenue', 10, 'monthly', 'platform', TRUE)
ON CONFLICT DO NOTHING;
