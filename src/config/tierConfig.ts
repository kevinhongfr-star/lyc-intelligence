/**
 * tierConfig.ts — Canonical tier system for assessment gating.
 *
 * #1340: ALL tier gating logic uses tier_key (canonical ID), never display
 * names. Display names come from this lookup, never hardcoded in gating code.
 *
 * 5 canonical tiers (matching `tiers` DB table):
 *   executive_introduction < professional < executive < council < enterprise
 *
 * Legacy app-layer keys (explorer/starter/pro/executive/council) map to
 * canonical keys via TIER_LEGACY_MAP. New code MUST use canonical keys.
 */

// ── Canonical tier keys ────────────────────────────────────────────

export const TIER_KEYS = [
  'executive_introduction',
  'professional',
  'executive',
  'council',
  'enterprise',
] as const;

export type TierKey = (typeof TIER_KEYS)[number];

// ── Legacy → canonical mapping ─────────────────────────────────────

export const TIER_LEGACY_MAP: Record<string, TierKey> = {
  explorer: 'executive_introduction',
  starter: 'professional',
  pro: 'executive',
  executive: 'council',
  council: 'enterprise',
};

// ── Tier metadata ──────────────────────────────────────────────────

export interface TierMeta {
  key: TierKey;
  displayName: string;
  order: number;
  isEntryTier: boolean;
  isB2B: boolean;
}

export const TIER_META: Record<TierKey, TierMeta> = {
  executive_introduction: {
    key: 'executive_introduction',
    displayName: 'Executive Introduction',
    order: 1,
    isEntryTier: true,
    isB2B: false,
  },
  professional: {
    key: 'professional',
    displayName: 'Professional',
    order: 2,
    isEntryTier: false,
    isB2B: false,
  },
  executive: {
    key: 'executive',
    displayName: 'Executive',
    order: 3,
    isEntryTier: false,
    isB2B: false,
  },
  council: {
    key: 'council',
    displayName: 'Council',
    order: 4,
    isEntryTier: false,
    isB2B: false,
  },
  enterprise: {
    key: 'enterprise',
    displayName: 'Enterprise',
    order: 5,
    isEntryTier: false,
    isB2B: true,
  },
};

// ── Tier hierarchy helpers ─────────────────────────────────────────

/**
 * Returns true if `userTier` meets or exceeds `requiredTier`.
 * Higher tiers inherit access from lower tiers.
 */
export function tierMeets(userTier: TierKey | string | null | undefined, requiredTier: TierKey): boolean {
  if (!userTier) return false;
  const canonical = TIER_LEGACY_MAP[userTier] ?? (userTier as TierKey);
  const userOrder = TIER_META[canonical]?.order ?? 0;
  const requiredOrder = TIER_META[requiredTier]?.order ?? 99;
  return userOrder >= requiredOrder;
}

/**
 * Normalize any tier key (legacy or canonical) to canonical.
 */
export function normalizeTier(raw: string | null | undefined): TierKey | null {
  if (!raw) return null;
  return TIER_LEGACY_MAP[raw] ?? (TIER_KEYS.includes(raw as TierKey) ? (raw as TierKey) : null);
}

/**
 * Get display name for a tier key.
 */
export function tierDisplayName(key: string | null | undefined): string {
  const canonical = normalizeTier(key);
  return canonical ? TIER_META[canonical].displayName : 'Executive Introduction';
}

// ── Diagnostic × Tier matrix (#1340) ───────────────────────────────

export const DIAGNOSTIC_SLUGS = ['prism', 'spark', 'forge', 'bridge', 'mosaic', 'drive'] as const;
export type DiagnosticSlug = (typeof DIAGNOSTIC_SLUGS)[number];

/**
 * Minimum tier required to access each diagnostic.
 * PRISM + SPARK: executive_introduction (complimentary, anonymous allowed)
 * FORGE, BRIDGE, MOSAIC: professional
 * DRIVE: executive (premium exclusive)
 */
export const DIAGNOSTIC_TIER_REQUIREMENT: Record<DiagnosticSlug, TierKey> = {
  prism: 'executive_introduction',
  spark: 'executive_introduction',
  forge: 'professional',
  bridge: 'professional',
  mosaic: 'professional',
  drive: 'executive',
};

/**
 * Diagnostics that can be taken anonymously (no login required).
 * Only executive_introduction tier diagnostics.
 */
export const ANONYMOUS_DIAGNOSTICS: DiagnosticSlug[] = ['prism', 'spark'];

/**
 * Check if a diagnostic can be taken anonymously.
 */
export function isAnonymousAllowed(slug: string): boolean {
  return ANONYMOUS_DIAGNOSTICS.includes(slug as DiagnosticSlug);
}

/**
 * Check if a user can access a diagnostic given their tier.
 */
export function canAccessDiagnostic(userTier: string | null | undefined, slug: string): boolean {
  const required = DIAGNOSTIC_TIER_REQUIREMENT[slug as DiagnosticSlug];
  if (!required) return false;
  if (isAnonymousAllowed(slug)) return true; // anonymous always allowed for intro diagnostics
  return tierMeets(userTier, required);
}

// ── CTA copy rules (#1340) ─────────────────────────────────────────

export interface LockedCTA {
  headline: string;
  body: string;
  button: string;
}

/**
 * Get the locked-state CTA copy for a diagnostic, based on what tier
 * the user currently has and what tier is required.
 */
export function getLockedCTA(slug: string, userTier: string | null | undefined): LockedCTA {
  const required = DIAGNOSTIC_TIER_REQUIREMENT[slug as DiagnosticSlug];
  if (!required) {
    return {
      headline: 'Unlock this assessment',
      body: 'This diagnostic is available with a subscription. Upgrade to access all 6 assessments and your full development profile.',
      button: 'View Tiers',
    };
  }

  // If user is on executive_introduction and diagnostic requires professional
  if (required === 'professional') {
    return {
      headline: 'Unlock this assessment',
      body: 'This diagnostic is available on the Professional tier. Upgrade to access all 6 assessments and your full development profile.',
      button: 'View Professional Tier',
    };
  }

  // If user is on professional and diagnostic requires executive
  if (required === 'executive') {
    const diagName = slug.toUpperCase();
    return {
      headline: 'Available on Executive tier',
      body: `${diagName} is our deepest execution framework, available exclusively on Executive tier and above.`,
      button: 'Upgrade to Executive',
    };
  }

  // Generic locked state
  const tierName = TIER_META[required]?.displayName ?? 'higher';
  return {
    headline: `Available on ${tierName} tier`,
    body: `This diagnostic requires the ${tierName} tier or above. Upgrade to unlock deeper diagnostics.`,
    button: `View ${tierName} Tier`,
  };
}

/**
 * Get the CTA copy for a complimentary (Executive Introduction) diagnostic.
 * NEVER use "free" — always "complimentary".
 */
export function getComplimentaryCTA(): { label: string } {
  return { label: 'Start Your Complimentary Assessment' };
}

// ── W3-1 / W3-4 — Pricing & marketing tier config ─────────────────
//
// Single source of truth for ALL pricing surfaces. The 5 backend tiers are
// configured here; only 3 are shown in marketing (MARKETING_TIERS). Council +
// Enterprise are hidden, sales/invite-only.
//
// Brand rules enforced in this layer:
//  - Entry tier display = "Executive Introduction" (NEVER "free").
//  - Complimentary assessments, never "free assessments".
//  - Premium voice, no SaaS/freemium framing.

export interface TierPricing {
  /** USD monthly price. Entry tier = 0. */
  usdMonthly: number;
  /** CNY monthly price (regional adjustment, ~1/3 of USD rounded). Entry = 0. */
  cnyMonthly: number;
  /** Monthly miles allowance. Entry = 0. */
  monthlyMiles: number;
  /** Whether the tier earns miles via NEXUS actions. Entry = false. */
  earnsMiles: boolean;
}

export const TIER_PRICING: Record<TierKey, TierPricing> = {
  executive_introduction: { usdMonthly: 0, cnyMonthly: 0, monthlyMiles: 0, earnsMiles: false },
  professional: { usdMonthly: 25, cnyMonthly: 59, monthlyMiles: 50, earnsMiles: true },
  executive: { usdMonthly: 99, cnyMonthly: 233, monthlyMiles: 150, earnsMiles: true },
  council: { usdMonthly: 199, cnyMonthly: 466, monthlyMiles: 300, earnsMiles: true },
  enterprise: { usdMonthly: 499, cnyMonthly: 1165, monthlyMiles: 600, earnsMiles: true },
};

export type PricingCurrency = 'USD' | 'CNY';

export type BillingCycle = 'monthly' | 'annual';

/**
 * Annual = 2 months complimentary (monthly × 10). ~17% saving.
 * Annual is the default billing cycle on the pricing page (higher value).
 */
export const ANNUAL_MONTHS_BILLED = 10;
export const ANNUAL_SAVE_PERCENT = 17;

/** The 3 tiers visible in marketing UI (in display order). */
export const MARKETING_TIERS: TierKey[] = [
  'executive_introduction',
  'professional',
  'executive',
];

/** The recommended / "Most Popular" tier. */
export const RECOMMENDED_TIER: TierKey = 'professional';

/** Tiers hidden from marketing (sales/invite-only). */
export const HIDDEN_TIERS: TierKey[] = ['council', 'enterprise'];

/**
 * Marketing benefit copy per tier (shown on pricing page cards).
 * Premium voice — no "free", no SaaS jargon.
 */
export const TIER_MARKETING_BENEFITS: Record<TierKey, string[]> = {
  executive_introduction: [
    '1 complimentary assessment baseline',
    'Basic NEXUS chat access',
    'Personal profile & results history',
    'No credit card required',
  ],
  professional: [
    'All 11 assessments (unlimited retakes)',
    'Full NEXUS intelligence access',
    'Complete results history & tracking',
    'Email support',
    '50 miles monthly allowance',
  ],
  executive: [
    'Everything in Professional',
    'Branded PDF reports',
    'Priority NEXUS responses',
    'Advanced insights & recommendations',
    'Priority support · 150 miles monthly',
  ],
  council: [
    'Everything in Executive',
    'Council community & live sessions',
    'Quarterly executive workshops',
    '300 miles monthly allowance',
  ],
  enterprise: [
    'Seat-based deployment with SSO & SCIM',
    'Custom framework training',
    'Org-level analytics & dedicated contact',
    '600 miles monthly allowance',
  ],
};

/** CTA label per marketing tier. */
export const TIER_CTA_LABEL: Record<TierKey, string> = {
  executive_introduction: 'Start Your Complimentary Baseline',
  professional: 'Go Professional',
  executive: 'Go Executive',
  council: 'Talk to Us',
  enterprise: 'Talk to Sales',
};

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
    const annualTotal = base * ANNUAL_MONTHS_BILLED;
    return { isZero: false, amount: annualTotal, perMonth: Math.round(annualTotal / 12) };
  }
  return { isZero: false, amount: base, perMonth: base };
}

export function formatPrice(amount: number, currency: PricingCurrency): string {
  if (currency === 'CNY') return `¥${amount}`;
  return `$${amount}`;
}
