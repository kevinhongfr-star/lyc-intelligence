-- ============================================================
--  Phase 3 / Ticket #1307 — Add owner_id to contacts table
--
--  Per-consultant scoping: consultants can only see contacts they own.
--  This column is backfilled from candidates_pipeline → mandates joins
--  so that contacts already associated with a consultant's mandate are
--  automatically assigned to that consultant.
--
--  Run via: Supabase SQL Editor OR psql $DATABASE_URL < this file
--  Then redeploy RLS: POST /api/setup/apply-rls (with CRON_SECRET)
-- ============================================================

-- 1. Add owner_id column (nullable — unowned contacts are admin-only)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id)
  WHERE owner_id IS NOT NULL;

-- 3. Backfill: assign each contact to the lead consultant of its mandate(s).
--    If a contact appears in multiple mandates under different consultants,
--    the first one wins (by mandate created_at ascending).
UPDATE public.contacts c
SET owner_id = sub.lead_consultant_id
FROM (
  SELECT DISTINCT ON (cp.contact_id)
    cp.contact_id,
    m.lead_consultant_id
  FROM public.candidates_pipeline cp
  JOIN public.mandates m ON cp.mandate_id = m.id
  WHERE m.lead_consultant_id IS NOT NULL
  ORDER BY cp.contact_id, m.created_at ASC
) sub
WHERE c.id = sub.contact_id
  AND c.owner_id IS NULL;

-- 4. Verify backfill (informational — safe to run)
-- SELECT count(*) FILTER (WHERE owner_id IS NOT NULL) AS owned,
--        count(*) FILTER (WHERE owner_id IS NULL)     AS unowned
-- FROM public.contacts;
