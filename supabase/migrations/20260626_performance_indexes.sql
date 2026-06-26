-- ============================================================================
-- Performance Indexes for LYC Intelligence — 2026-06-26
-- Targeted at query patterns from dashboard, data handlers, orgScopedQueries
-- ============================================================================

-- Prerequisite: pg_trgm extension for trigram (ILIKE) indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── contacts (16K+ rows) ────────────────────────────────────────────────────
-- Dashboard: ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at DESC);
-- Dashboard filter: WHERE seniority = '...'
CREATE INDEX IF NOT EXISTS idx_contacts_seniority ON contacts(seniority);
-- Org queries: WHERE country = '...' 
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
-- Search: WHERE name ILIKE '%...%' (partial match; GIN trigram helps)
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(name gin_trgm_ops);

-- ── mandates (7K+ rows) ─────────────────────────────────────────────────────
-- Dashboard + list: ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_mandates_updated_at ON mandates(updated_at DESC);
-- Filter: WHERE status = '...'
CREATE INDEX IF NOT EXISTS idx_mandates_status ON mandates(status);
-- JOIN: mandates → companies via client_id
CREATE INDEX IF NOT EXISTS idx_mandates_client_id ON mandates(client_id);
-- Search: WHERE title ILIKE '%...%'
CREATE INDEX IF NOT EXISTS idx_mandates_title_trgm ON mandates USING gin(title gin_trgm_ops);

-- ── companies (19K+ rows) ───────────────────────────────────────────────────
-- Sort by engagement_score
CREATE INDEX IF NOT EXISTS idx_companies_engagement ON companies(engagement_score DESC);
-- Search: WHERE name ILIKE '%...%'
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- ── candidates_pipeline (291 rows, growing) ─────────────────────────────────
-- Most critical: filter by mandate_id (pipeline page)
CREATE INDEX IF NOT EXISTS idx_pipeline_mandate_id ON candidates_pipeline(mandate_id);
-- Sort by match_score
CREATE INDEX IF NOT EXISTS idx_pipeline_match_score ON candidates_pipeline(match_score DESC);
-- Filter by contact_id
CREATE INDEX IF NOT EXISTS idx_pipeline_contact_id ON candidates_pipeline(contact_id);

-- ── scoring_runs ────────────────────────────────────────────────────────────
-- Dashboard activity: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_scoring_runs_created_at ON scoring_runs(created_at DESC);
