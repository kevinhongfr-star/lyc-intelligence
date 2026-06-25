-- Migration: Add missing columns referenced by API code
-- These columns were designed into the schema but never created in the DB

-- 1. Add organization_id to mandates, contacts, companies (multi-tenant support)
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2. Add first_name, last_name, phone to contacts (dataHandler references these)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone text;

-- 3. Add client_last_name to mandates (email templates reference this)
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS client_last_name text;

-- 4. Add intake_data jsonb to mandates (pipeline code checks this)
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS intake_data jsonb;

-- 5. Backfill first_name/last_name from name for existing contacts
UPDATE contacts 
SET first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE WHEN POSITION(' ' IN name) > 0 
                THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1) 
                ELSE NULL END
WHERE first_name IS NULL AND name IS NOT NULL AND name != '';

-- 6. Set organization_id for all mandates/contacts/companies based on profiles
-- For now, use the first org_id from profiles (single-tenant)
-- This is a no-op if all organization_ids in profiles are null

-- 7. Add index on organization_id for performance
CREATE INDEX IF NOT EXISTS idx_mandates_org_id ON mandates(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(organization_id);
