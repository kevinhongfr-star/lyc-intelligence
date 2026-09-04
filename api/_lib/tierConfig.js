/**
 * api/_lib/tierConfig.js — Tier + miles constants for serverless functions.
 *
 * Mirrors the relevant subset of src/config/tiers.ts and src/config/miles.ts
 * so api/ functions don't need to cross the api/src bundler boundary
 * (which causes Vercel 500 FUNCTION_INVOCATION_FAILED on Hobby plan).
 *
 * KEEP IN SYNC with src/config/tiers.ts + src/config/miles.ts when tiers
 * or assessment costs/tier-gates change.
 */

// ── Tier keys ──────────────────────────────────────────────────────────

export const TIER_KEYS = [
  'explorer',
  'starter',
  'professional',
  'executive',
  'council',
];

/** Default tier assigned to new users at signup. */
export const DEFAULT_TIER = 'explorer';

// ── Legacy key compatibility ───────────────────────────────────────────
//
// Older code may pass legacy keys from tierConfig.ts or
// monetizationService.ts. normalizeTier() coerces them to canonical.

export const TIER_LEGACY_MAP = {
  // From config/tierConfig.ts
  executive_introduction: 'explorer',
  // From services/monetizationService.ts (uses 'pro' for professional)
  pro: 'professional',
  // enterprise → council (5-tier system collapses enterprise into council)
  enterprise: 'council',
};

// ── TIERS metadata object (order is the only field used by tierMeets) ──

// Display name overrides — keep in sync with src/config/tiers.ts
const TIER_DISPLAY_NAME_OVERRIDES = {
  // If any tier needs a non-capitalized display name, add here
};

const TIERS = (() => {
  const result = {};
  TIER_KEYS.forEach((key, i) => {
    const override = TIER_DISPLAY_NAME_OVERRIDES[key];
    result[key] = {
      key,
      displayName: override ?? (key.charAt(0).toUpperCase() + key.slice(1)),
      order: i + 1,
    };
  });
  return result;
})();

// ── Hierarchy helpers ──────────────────────────────────────────────────

/**
 * Normalize any tier key (legacy or canonical) to canonical.
 * Returns null for unrecognized values.
 */
export function normalizeTier(raw) {
  if (!raw) return null;
  if (TIER_KEYS.includes(raw)) return raw;
  return TIER_LEGACY_MAP[raw] ?? null;
}

/**
 * Returns true if `userTier` meets or exceeds `requiredTier`.
 * Higher tiers inherit access from lower tiers.
 */
export function tierMeets(userTier, requiredTier) {
  const canonical = normalizeTier(userTier);
  if (!canonical) return false;
  const userOrder = TIERS[canonical]?.order ?? 0;
  const requiredOrder = TIERS[requiredTier]?.order ?? 99;
  return userOrder >= requiredOrder;
}

// ── Assessment tier gates (mirrors src/config/miles.ts) ────────────────

export const ASSESSMENT_REQUIRED_TIER = {
  CPI:    'council',
  LEAP:   'explorer',
  PRISM:  'explorer',
  SPARK:  'explorer',
  FORGE:  'professional',
  BRIDGE: 'professional',
  MOSAIC: 'professional',
  QUEST:  'professional',
  COACH:  'professional',
  IMPACT: 'professional',
  DRIVE:  'executive',
};

/**
 * Get the required tier for an assessment code. Defaults to 'professional'
 * for unknown codes (conservative: must be a paid tier).
 */
export function getAssessmentRequiredTier(code) {
  return ASSESSMENT_REQUIRED_TIER[String(code).toUpperCase()] ?? 'professional';
}

// ── Instrument mile costs (mirrors src/config/miles.ts) ────────────────

export const INSTRUMENT_MILE_COST = {
  LEAP:    1,
  PRISM:   2,
  IMPACT:  2,
  COACH:   2,
  DRIVE:   2,
  QUEST:   2,
  BRIDGE:  3,
  MOSAIC:  3,
  SPARK:   3,
  FORGE:   3,
  CPI:     5,
};
