-- Phase 1.5: Market Definition Enhancement
-- Extend target_companies with mandate linkage, AI overviews, fit scores

-- Add mandate_id to link target companies to specific mandates
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL;

-- Add AI-generated company overview (JSONB)
-- Structure:
-- {
--   "description": "string",
--   "revenue": "string (e.g., '$1B-$5B')",
--   "employee_count": "string (e.g., '5,000-10,000')",
--   "founded": number,
--   "headquarters": "string",
--   "key_products": ["string"],
--   "recent_news": "string (summary)",
--   "generated_at": "timestamp"
-- }
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS company_overview jsonb;

-- Add fit score based on success profile (0-100)
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS fit_score numeric;

-- Add ranking notes for manual adjustments
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS ranking_notes text;

-- Add sector classification for market map grouping
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS sector text;

-- Add region classification for market map grouping
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS region text;

-- Add primary contact at company
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_name text;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_title text;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_linkedin text;

-- Add generation status for tracking AI overview generation
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS overview_status text DEFAULT 'pending'
  CHECK (overview_status IN ('pending', 'generating', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_target_companies_mandate ON target_companies(mandate_id);
CREATE INDEX IF NOT EXISTS idx_target_companies_fit_score ON target_companies(fit_score) WHERE fit_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_sector ON target_companies(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_region ON target_companies(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_industry ON target_companies(industry) WHERE industry IS NOT NULL;
