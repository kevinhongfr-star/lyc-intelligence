-- =====================================================================
-- Technical Blueprint 10: LinkedIn Auto-Import & Enrichment (DEX-TB-010)
-- Database Migration
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- 2.1 Table: linkedin_imports
-- Tracks each LinkedIn import session (single URL or batch)
-- =====================================================================
CREATE TABLE IF NOT EXISTS linkedin_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Import type
    import_type TEXT NOT NULL CHECK (import_type IN (
        'single_url',
        'batch_urls',
        'csv_file',
        'linkedin_recruiter_export',
        'sales_navigator_export',
        'copy_paste'
    )),

    -- Input
    input_urls TEXT[],
    input_file_url TEXT,
    input_raw_text TEXT,

    -- Processing state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'parsing',
        'deduplicating',
        'importing',
        'completed',
        'failed',
        'partial'
    )),

    -- Results
    total_input INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_duplicate_count INTEGER DEFAULT 0,
    skipped_error_count INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- DeepSeek usage
    deepseek_calls INTEGER DEFAULT 0,
    deepseek_tokens_used INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for linkedin_imports
CREATE INDEX IF NOT EXISTS idx_li_import_user ON linkedin_imports(created_by);
CREATE INDEX IF NOT EXISTS idx_li_import_status ON linkedin_imports(status);
CREATE INDEX IF NOT EXISTS idx_li_import_created ON linkedin_imports(created_at DESC);

-- RLS for linkedin_imports
ALTER TABLE linkedin_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports" ON linkedin_imports
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
        )
    );

CREATE POLICY "Users can create imports" ON linkedin_imports
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "System can update imports" ON linkedin_imports
    FOR UPDATE TO authenticated
    USING (true);

-- =====================================================================
-- 2.2 Table: linkedin_import_items
-- Per-profile import results
-- =====================================================================
CREATE TABLE IF NOT EXISTS linkedin_import_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES linkedin_imports(id) ON DELETE CASCADE,

    -- Input
    source_url TEXT,
    source_index INTEGER,
    raw_profile_data TEXT,

    -- Parsed output (DeepSeek)
    parsed_data JSONB DEFAULT '{}'::jsonb,

    -- Matching results
    matched_contact_id UUID REFERENCES contacts(id),
    match_type TEXT CHECK (match_type IN (
        'new',
        'exact_linkedin',
        'exact_email',
        'exact_phone',
        'fuzzy_name_company',
        'no_match'
    )),
    match_confidence NUMERIC,

    -- Import result
    action_taken TEXT CHECK (action_taken IN (
        'created',
        'updated',
        'skipped_duplicate',
        'skipped_error',
        'pending_review'
    )),
    created_contact_id UUID REFERENCES contacts(id),

    -- DeepSeek processing
    deepseek_processed BOOLEAN DEFAULT FALSE,
    deepseek_error TEXT,

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for linkedin_import_items
CREATE INDEX IF NOT EXISTS idx_li_item_import ON linkedin_import_items(import_id);
CREATE INDEX IF NOT EXISTS idx_li_item_contact ON linkedin_import_items(matched_contact_id)
    WHERE matched_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_li_item_action ON linkedin_import_items(action_taken);
CREATE INDEX IF NOT EXISTS idx_li_item_pending ON linkedin_import_items(deepseek_processed)
    WHERE deepseek_processed = FALSE;

-- RLS for linkedin_import_items
ALTER TABLE linkedin_import_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import items" ON linkedin_import_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM linkedin_imports
            WHERE id = import_id AND (
                created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
                )
            )
        )
    );

CREATE POLICY "System can manage import items" ON linkedin_import_items
    FOR ALL TO authenticated
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM linkedin_imports
            WHERE id = import_id AND created_by = auth.uid()
        )
    );

-- =====================================================================
-- 2.3 Table: linkedin_data_cache
-- Caches raw LinkedIn profile data to avoid re-fetching
-- =====================================================================
CREATE TABLE IF NOT EXISTS linkedin_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linkedin_url TEXT NOT NULL UNIQUE,
    raw_html TEXT,
    raw_text TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    fetched_by UUID REFERENCES auth.users(id),
    parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN (
        'pending',
        'parsing',
        'parsed',
        'error'
    )),
    parsed_data JSONB,
    parsed_at TIMESTAMPTZ,
    etag TEXT,
    fetch_count INTEGER DEFAULT 1,
    last_fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for linkedin_data_cache
CREATE INDEX IF NOT EXISTS idx_li_cache_url ON linkedin_data_cache(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_li_cache_parse ON linkedin_data_cache(parse_status)
    WHERE parse_status = 'pending';

-- RLS for linkedin_data_cache
ALTER TABLE linkedin_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages cache" ON linkedin_data_cache
    FOR ALL TO authenticated
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- 2.4 contacts Table — LinkedIn Extensions
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_url') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_url TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_headline') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_headline TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_company') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_company TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_industry') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_industry TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_skills') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_skills JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_education') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_education JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_experience') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_experience JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_languages') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_languages JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_certifications') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_certifications JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_raw_import_id') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_raw_import_id UUID REFERENCES linkedin_import_items(id);
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'import_source') THEN
        ALTER TABLE contacts ADD COLUMN import_source TEXT DEFAULT 'manual' CHECK (import_source IN (
            'manual',
            'linkedin_url',
            'linkedin_csv',
            'linkedin_recruiter',
            'sales_navigator',
            'notion',
            'excel',
            'api'
        ));
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Indexes for LinkedIn fields on contacts
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_url ON contacts(linkedin_url)
    WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_import_source ON contacts(import_source);
