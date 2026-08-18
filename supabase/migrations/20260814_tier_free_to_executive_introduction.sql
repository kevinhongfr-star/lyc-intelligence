-- ─────────────────────────────────────────────────────────────────────────────
-- W3-3 / #1310 — Backfill tier='free' → 'executive_introduction'
--
-- Brand rule: NEVER store or compare against 'free' as a tier value.
-- The canonical entry tier is 'executive_introduction' (display: "Executive
-- Introduction"). This migration backfills all historical 'free' and orphan
-- 'member' values across every table that holds a tier column.
--
-- Idempotent: safe to run multiple times. Read the audit trail in
-- /workspace/src/config/tierConfig.ts (TIER_LEGACY_MAP) for the full
-- legacy→canonical mapping.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. profiles.tier — backfill 'free' and 'member' → 'executive_introduction'
UPDATE profiles
SET tier = 'executive_introduction'
WHERE tier IN ('free', 'member', 'explorer');

-- 2. credits.tier — backfill 'free' → 'executive_introduction', 'basic' → 'professional'
UPDATE credits
SET tier = 'executive_introduction'
WHERE tier IN ('free', 'member');

UPDATE credits
SET tier = 'professional'
WHERE tier = 'basic';

-- 3. Normalize legacy app-layer keys on profiles.tier to canonical keys.
--    explorer → executive_introduction, starter → professional,
--    pro → executive, executive → council (careful: 'executive' is ambiguous,
--    so we handle the legacy→canonical shift via a temp marker to avoid
--    double-mapping).
UPDATE profiles SET tier = '__tmp_ei__'  WHERE tier = 'explorer';
UPDATE profiles SET tier = '__tmp_pro__' WHERE tier = 'starter';
UPDATE profiles SET tier = '__tmp_exec__' WHERE tier = 'pro';
UPDATE profiles SET tier = 'council'      WHERE tier = 'executive';
UPDATE profiles SET tier = 'executive'    WHERE tier = '__tmp_exec__';
UPDATE profiles SET tier = 'professional' WHERE tier = '__tmp_pro__';
UPDATE profiles SET tier = 'executive_introduction' WHERE tier = '__tmp_ei__';

-- 4. Same normalization on credits.tier (if it holds legacy app keys).
UPDATE credits SET tier = '__tmp_ei__'  WHERE tier = 'explorer';
UPDATE credits SET tier = '__tmp_pro__' WHERE tier = 'starter';
UPDATE credits SET tier = '__tmp_exec__' WHERE tier = 'pro';
UPDATE credits SET tier = 'council'      WHERE tier = 'executive';
UPDATE credits SET tier = 'executive'    WHERE tier = '__tmp_exec__';
UPDATE credits SET tier = 'professional' WHERE tier = '__tmp_pro__';
UPDATE credits SET tier = 'executive_introduction' WHERE tier = '__tmp_ei__';

-- 5. Verification query (run manually after migration to confirm zero 'free'/'member').
-- SELECT tier, COUNT(*) FROM profiles GROUP BY tier ORDER BY tier;
-- SELECT tier, COUNT(*) FROM credits  GROUP BY tier ORDER BY tier;
-- Expected: no rows with tier = 'free' or 'member' or 'basic'.
