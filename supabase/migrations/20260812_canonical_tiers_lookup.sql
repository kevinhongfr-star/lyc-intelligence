-- #1318 — Canonical tiers lookup table (source of truth)
--
-- Architecture rule: Tier references use tier_key (canonical ID), never
-- display name. This table is the single source of truth for tier metadata.
--
-- 5 canonical tiers per brand master:
--   executive_introduction — complimentary entry
--   professional           — $25/mo
--   executive              — $99/mo
--   council                — $199/mo
--   enterprise             — $499/mo (B2B / custom)
--
-- NOTE: The application layer (monetizationService.ts) still uses the
-- legacy internal keys (explorer/starter/pro/executive/council) for
-- backwards compatibility. The tier_key column here maps to the NEW
-- canonical keys. A future migration can rename the legacy keys.

CREATE TABLE IF NOT EXISTS tiers (
  tier_key          TEXT PRIMARY KEY,
  display_name      TEXT NOT NULL,
  tier_order        INTEGER NOT NULL UNIQUE,
  usd_monthly       NUMERIC(10,2) NOT NULL DEFAULT 0,
  cny_monthly       NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_miles     INTEGER NOT NULL DEFAULT 0,
  earns_miles       BOOLEAN NOT NULL DEFAULT false,
  is_b2b            BOOLEAN NOT NULL DEFAULT false,
  is_entry_tier     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed canonical tiers (idempotent — ON CONFLICT do nothing).
INSERT INTO tiers (tier_key, display_name, tier_order, usd_monthly, cny_monthly, monthly_miles, earns_miles, is_b2b, is_entry_tier)
VALUES
  ('executive_introduction', 'Executive Introduction', 1, 0,    0,     0,   false, false, true),
  ('professional',           'Professional',           2, 25,   59,    50,  true,  false, false),
  ('executive',              'Executive',              3, 99,   233,   150, true,  false, false),
  ('council',                'Council',                4, 199,  466,   300, true,  false, false),
  ('enterprise',             'Enterprise',             5, 499,  1165,  600, true,  true,  false)
ON CONFLICT (tier_key) DO NOTHING;

-- Legacy key mapping view (for backwards compat during migration).
-- Maps old internal keys to new canonical tier_keys.
CREATE OR REPLACE VIEW tier_key_mapping AS
SELECT
  CASE tier_key
    WHEN 'executive_introduction' THEN 'explorer'
    WHEN 'professional'           THEN 'starter'
    WHEN 'executive'              THEN 'pro'
    WHEN 'council'                THEN 'executive'
    WHEN 'enterprise'             THEN 'council'
  END AS legacy_key,
  tier_key AS canonical_key,
  display_name
FROM tiers;
