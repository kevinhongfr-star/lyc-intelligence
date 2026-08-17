/**
 * tiers.ts — Single source of truth for the 5-tier system.
 *
 * Batch 1.5 / Ticket 1: Tier configuration system.
 *
 * Rules (enforced everywhere):
 *  - tier_key is ALWAYS canonical. All gating logic reads tier_key, never
 *    display names. Display names are data, looked up from this config.
 *  - 5 canonical tiers: explorer < starter < professional < executive < council
 *  - Higher tiers inherit ALL features from lower tiers (union logic).
 *  - Default tier for new users = explorer.
 *  - Soft gates, not hard walls. Explorer gets 20 NEXUS messages/day with a
 *    friendly nudge at 15, not a hard error.
 *  - Don't hardcode tier names or numbers — read from this config.
 *
 * This file supersedes the older `tierConfig.ts` (which used legacy keys like
 * `executive_introduction` / `professional`). A legacy map is provided below
 * so existing code can migrate incrementally. New code MUST import from here.
 */

// ═══════════════════════════════════════════════════════════════════════
// Canonical tier keys
// ═══════════════════════════════════════════════════════════════════════

export const TIER_KEYS = [
  'explorer',
  'starter',
  'professional',
  'executive',
  'council',
] as const;

export type TierKey = (typeof TIER_KEYS)[number];

/** Default tier assigned to new users at signup. */
export const DEFAULT_TIER: TierKey = 'explorer';

// ── Legacy key compatibility ───────────────────────────────────────────
//
// Older code may pass legacy keys from `tierConfig.ts` or
// `monetizationService.ts`. normalizeTier() coerces them to canonical.

export const TIER_LEGACY_MAP: Record<string, TierKey> = {
  // From config/tierConfig.ts
  executive_introduction: 'explorer',
  // From services/monetizationService.ts (uses 'pro' for professional)
  pro: 'professional',
  // enterprise → council (5-tier system collapses enterprise into council)
  enterprise: 'council',
};

// ═══════════════════════════════════════════════════════════════════════
// Feature flags + numeric limits
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-tier feature set. Booleans are flags; numbers are limits.
 * Higher tiers inherit lower tiers' features via `resolveTierFeatures()`.
 */
export interface TierFeatures {
  // ── NEXUS chat ──
  /** Daily NEXUS message cap. null = unlimited. */
  nexusDailyMessages: number | null;
  /** NEXUS message at which a soft nudge appears (must be < daily cap). */
  nexusNudgeAt: number | null;
  /** Priority NEXUS response queue. */
  nexusPriority: boolean;

  // ── Assessments ──
  /** Number of complimentary assessment baselines. */
  assessmentBaselines: number;
  /** Unlimited assessment retakes. */
  assessmentUnlimitedRetakes: boolean;
  /** Branded PDF report export. */
  brandedPdfReports: boolean;
  /** Advanced insights & recommendations on results. */
  advancedInsights: boolean;
  /** Cross-diagnostic benchmarking. */
  peerBenchmarking: boolean;

  // ── Miles ──
  /** Monthly miles allowance. 0 = no allowance. */
  monthlyMiles: number;
  /** Whether the tier earns miles via NEXUS actions. */
  earnsMiles: boolean;

  // ── Community / Council ──
  /** Access to Council community + live sessions. */
  councilCommunity: boolean;
  /** Quarterly executive workshops. */
  executiveWorkshops: boolean;

  // ── Support ──
  /** Priority support channel. */
  prioritySupport: boolean;
  /** Dedicated account contact. */
  dedicatedContact: boolean;
}

/**
 * Base feature set per tier. ONLY the delta from the tier below is specified
 * here — `resolveTierFeatures()` unions them so higher tiers inherit.
 */
const TIER_FEATURES_BASE: Record<TierKey, Partial<TierFeatures>> = {
  explorer: {
    nexusDailyMessages: 20,
    nexusNudgeAt: 15,
    nexusPriority: false,
    assessmentBaselines: 1,
    assessmentUnlimitedRetakes: false,
    brandedPdfReports: false,
    advancedInsights: false,
    peerBenchmarking: false,
    monthlyMiles: 0,
    earnsMiles: false,
    councilCommunity: false,
    executiveWorkshops: false,
    prioritySupport: false,
    dedicatedContact: false,
  },
  starter: {
    nexusDailyMessages: 50,
    nexusPriority: false,
    assessmentBaselines: 3,
    assessmentUnlimitedRetakes: false,
    brandedPdfReports: false,
    advancedInsights: false,
    peerBenchmarking: false,
    monthlyMiles: 2,
    earnsMiles: true,
    prioritySupport: false,
  },
  professional: {
    nexusDailyMessages: null, // unlimited
    nexusNudgeAt: null,
    nexusPriority: false,
    assessmentBaselines: 11, // full catalog
    assessmentUnlimitedRetakes: true,
    brandedPdfReports: true,
    advancedInsights: true,
    peerBenchmarking: true,
    monthlyMiles: 5,
    prioritySupport: true,
  },
  executive: {
    nexusPriority: true,
    monthlyMiles: 10,
    executiveWorkshops: true,
  },
  council: {
    councilCommunity: true,
    monthlyMiles: 20,
    dedicatedContact: true,
  },
};

/**
 * Resolve the full feature set for a tier, inheriting from all lower tiers.
 * Higher tiers union with lower tiers (lower-tier values are the default,
 * higher-tier values override where specified).
 */
export function resolveTierFeatures(tier: TierKey): TierFeatures {
  const order = TIER_KEYS.indexOf(tier);
  if (order < 0) return resolveTierFeatures(DEFAULT_TIER);

  // Start with explorer defaults as the floor, then union each tier up to `tier`.
  const merged: TierFeatures = { ...TIER_FEATURES_BASE.explorer } as TierFeatures;
  for (let i = 1; i <= order; i++) {
    const delta = TIER_FEATURES_BASE[TIER_KEYS[i]];
    Object.assign(merged, delta);
  }
  return merged;
}

// ═══════════════════════════════════════════════════════════════════════
// Tier metadata
// ═══════════════════════════════════════════════════════════════════════

export interface TierMeta {
  key: TierKey;
  /** Display name — data, not logic. Emily can rename later. */
  displayName: string;
  /** Short tagline for pricing cards — placeholder copy. */
  tagline: string;
  /** Sort order (1 = lowest tier). */
  order: number;
  /** Whether this is the free entry tier. */
  isEntryTier: boolean;
  /** Whether this tier is B2B / sales-only (hidden from self-serve pricing). */
  isB2B: boolean;
  /** Whether this tier requires an invite (cannot self-serve upgrade to). Council = true. */
  isInviteOnly: boolean;
  /** Full resolved feature set. */
  features: TierFeatures;
}

/**
 * Complete tier metadata. `features` is pre-resolved with inheritance.
 * This is the single lookup table — all UI + gating reads from here.
 */
export const TIERS: Record<TierKey, TierMeta> = (() => {
  const result = {} as Record<TierKey, TierMeta>;
  TIER_KEYS.forEach((key, i) => {
    result[key] = {
      key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      tagline: `[${key} tier tagline — placeholder]`,
      order: i + 1,
      isEntryTier: key === 'explorer',
      isB2B: false,
      isInviteOnly: key === 'council',
      features: resolveTierFeatures(key),
    };
  });
  return result;
})();

/** Ordered list of all tier keys (lowest → highest). */
export const TIER_ORDER: TierKey[] = [...TIER_KEYS];

/** The recommended / "Most Popular" tier for pricing page badge. */
export const RECOMMENDED_TIER: TierKey = 'professional';

// ═══════════════════════════════════════════════════════════════════════
// Pricing
// ═══════════════════════════════════════════════════════════════════════

export type PricingCurrency = 'USD' | 'CNY';
export type BillingCycle = 'monthly' | 'annual';

export interface TierPricing {
  /** USD monthly price. Entry tier = 0. */
  usdMonthly: number;
  /** CNY monthly price. Entry = 0. */
  cnyMonthly: number;
}

export const TIER_PRICING: Record<TierKey, TierPricing> = {
  explorer:      { usdMonthly: 0,   cnyMonthly: 0 },
  starter:       { usdMonthly: 25,  cnyMonthly: 59 },
  professional:  { usdMonthly: 99,  cnyMonthly: 233 },
  executive:     { usdMonthly: 199, cnyMonthly: 466 },
  council:       { usdMonthly: 499, cnyMonthly: 1165 },
};

/** Annual billing discount: 15% off monthly (per Batch 1.5 spec). */
export const ANNUAL_DISCOUNT_PERCENT = 15;

/**
 * Compute the display price for a tier given currency + billing cycle.
 * Entry tier returns { isZero: true } so the card renders "Complimentary".
 */
export function computeTierPrice(
  tier: TierKey,
  currency: PricingCurrency,
  cycle: BillingCycle,
): { isZero: boolean; amount: number; perMonth: number } {
  const base = currency === 'USD'
    ? TIER_PRICING[tier].usdMonthly
    : TIER_PRICING[tier].cnyMonthly;
  if (base === 0) return { isZero: true, amount: 0, perMonth: 0 };
  if (cycle === 'annual') {
    const annualTotal = Math.round(base * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
    return { isZero: false, amount: annualTotal, perMonth: Math.round(annualTotal / 12) };
  }
  return { isZero: false, amount: base, perMonth: base };
}

export function formatPrice(amount: number, currency: PricingCurrency): string {
  if (currency === 'CNY') return `¥${amount}`;
  return `$${amount}`;
}

// ═══════════════════════════════════════════════════════════════════════
// Hierarchy helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Normalize any tier key (legacy or canonical) to canonical.
 * Returns null for unrecognized values.
 */
export function normalizeTier(raw: string | null | undefined): TierKey | null {
  if (!raw) return null;
  if (TIER_KEYS.includes(raw as TierKey)) return raw as TierKey;
  return TIER_LEGACY_MAP[raw] ?? null;
}

/**
 * Returns true if `userTier` meets or exceeds `requiredTier`.
 * Higher tiers inherit access from lower tiers.
 */
export function tierMeets(
  userTier: TierKey | string | null | undefined,
  requiredTier: TierKey,
): boolean {
  const canonical = normalizeTier(userTier);
  if (!canonical) return false;
  const userOrder = TIERS[canonical]?.order ?? 0;
  const requiredOrder = TIERS[requiredTier]?.order ?? 99;
  return userOrder >= requiredOrder;
}

/**
 * Get the display name for a tier key.
 */
export function tierDisplayName(key: string | null | undefined): string {
  const canonical = normalizeTier(key);
  return canonical ? TIERS[canonical].displayName : 'Explorer';
}

/**
 * Get resolved features for a tier (with inheritance applied).
 */
export function tierFeatures(key: string | null | undefined): TierFeatures {
  const canonical = normalizeTier(key) ?? DEFAULT_TIER;
  return TIERS[canonical].features;
}

/**
 * Check if a tier is invite-only (cannot self-serve upgrade to).
 * Reads from tier config — never hardcode "Council".
 */
export function isInviteOnly(key: string | null | undefined): boolean {
  const canonical = normalizeTier(key);
  if (!canonical) return false;
  return TIERS[canonical].isInviteOnly;
}

// ── Upgrade / downgrade utilities ──────────────────────────────────────

/**
 * Returns the tier key one step above the given tier, or null if already
 * at the highest tier.
 */
export function nextTierUp(tier: TierKey | string | null | undefined): TierKey | null {
  const canonical = normalizeTier(tier) ?? DEFAULT_TIER;
  const idx = TIER_KEYS.indexOf(canonical);
  if (idx < 0 || idx >= TIER_KEYS.length - 1) return null;
  return TIER_KEYS[idx + 1];
}

/**
 * Returns the tier key one step below the given tier, or null if already
 * at the lowest tier.
 */
export function nextTierDown(tier: TierKey | string | null | undefined): TierKey | null {
  const canonical = normalizeTier(tier) ?? DEFAULT_TIER;
  const idx = TIER_KEYS.indexOf(canonical);
  if (idx <= 0) return null;
  return TIER_KEYS[idx - 1];
}

/**
 * Returns all tiers that are strictly above the given tier (upgrade options).
 */
export function upgradeOptions(tier: TierKey | string | null | undefined): TierKey[] {
  const canonical = normalizeTier(tier) ?? DEFAULT_TIER;
  const idx = TIER_KEYS.indexOf(canonical);
  if (idx < 0) return [];
  return TIER_KEYS.slice(idx + 1);
}

/**
 * Returns all tiers that are strictly below the given tier (downgrade options).
 */
export function downgradeOptions(tier: TierKey | string | null | undefined): TierKey[] {
  const canonical = normalizeTier(tier) ?? DEFAULT_TIER;
  const idx = TIER_KEYS.indexOf(canonical);
  if (idx < 0) return [];
  return TIER_KEYS.slice(0, idx);
}

/**
 * Check if upgrading from `from` to `to` is a valid upgrade (to > from).
 */
export function isUpgrade(from: TierKey | string | null | undefined, to: TierKey): boolean {
  const fromCanonical = normalizeTier(from) ?? DEFAULT_TIER;
  return TIERS[to].order > TIERS[fromCanonical].order;
}

/**
 * Check if a self-serve upgrade to `to` is allowed.
 * Invite-only tiers (e.g. Council) cannot be self-serve upgraded to —
 * they require a sales/invite flow. Reads from `isInviteOnly` config,
 * never hardcodes tier names.
 */
export function isSelfServeUpgradeAllowed(to: TierKey): boolean {
  return !TIERS[to].isInviteOnly;
}

/**
 * Check if changing from `from` to `to` is a downgrade (to < from).
 */
export function isDowngrade(from: TierKey | string | null | undefined, to: TierKey): boolean {
  const fromCanonical = normalizeTier(from) ?? DEFAULT_TIER;
  return TIERS[to].order < TIERS[fromCanonical].order;
}

// ═══════════════════════════════════════════════════════════════════════
// Feature gating helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if a user's tier grants a specific boolean feature flag.
 */
export function hasFeature(
  userTier: string | null | undefined,
  feature: keyof TierFeatures,
): boolean {
  const features = tierFeatures(userTier);
  return Boolean(features[feature]);
}

/**
 * Get a numeric limit for a user's tier (e.g., nexusDailyMessages).
 * Returns null for unlimited.
 */
export function tierLimit(
  userTier: string | null | undefined,
  limit: keyof TierFeatures,
): number | null {
  const features = tierFeatures(userTier);
  const val = features[limit];
  return typeof val === 'number' ? val : null;
}
