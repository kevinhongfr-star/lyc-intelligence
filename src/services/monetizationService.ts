import { v1Client } from '@/hooks/v1/v1Client';

export interface Tier {
  key: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
}

// ── Canonical tier_key → display name mapping (#1318) ──
// Internal keys are stable IDs (never shown to users). Display labels are
// the canonical brand names per #1318 / brand master.
//   explorer  → Executive Introduction (complimentary entry)
//   starter   → Professional
//   pro       → Executive
//   executive → Council
//   council   → Enterprise (B2B / custom)
export const TIER_DISPLAY_NAMES: Record<TierKey, string> = {
  explorer: 'Executive Introduction',
  starter: 'Professional',
  pro: 'Executive',
  executive: 'Council',
  council: 'Enterprise',
};

export interface MilesBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface MilesHistoryEntry {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface MilesEarningProgress {
  event_type: string;
  total_earned: number;
  count: number;
  last_earned_at: string | null;
}

export interface SubscriptionStatus {
  status: string;
  tier: string;
  subscriptionId: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export type BillingCycle = 'monthly' | 'annual';

export const TIER_KEYS = ['explorer', 'starter', 'pro', 'executive', 'council'] as const;
export type TierKey = typeof TIER_KEYS[number];

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL PRICING — single source of truth (#1318 / Phase 15.5 / #1303)
//
// Reference: specs/NEXUS_PRODUCT_SPEC_v3_ALIGNED.md §2
// 5-tier model (canonical display names per #1318):
//   Executive Introduction / Professional / Executive / Council / Enterprise
// Internal tier_key values are stable IDs, never shown to users.
// Currency = miles. Entry tier = "Executive Introduction" (never "free").
// China pricing: 1/3 of global, displayed in CNY (USD * 7 / 3, rounded).
// Assessment pricing: 3 tiers (Standard $99 / Premium $149 / Unique $199).
// ─────────────────────────────────────────────────────────────────────────────

export type PricingCurrency = 'USD' | 'CNY';

export interface CanonicalTierPricing {
  key: TierKey;
  label: string;
  /** Display label for the Explorer tier — "Executive Introduction" (never "free"). */
  alias?: string;
  /** Global monthly price in USD. Explorer = 0. */
  usdMonthly: number;
  /** China monthly price in CNY (1/3 of global, rounded). Explorer = 0. */
  cnyMonthly: number;
  /** Monthly miles allowance. Explorer = 0 (chat only). */
  monthlyMiles: number;
  /** Whether this tier earns miles via NEXUS actions. Explorer = false. */
  earnsMiles: boolean;
  /** Whether this tier requires an invite (cannot self-serve upgrade to). Council = true. */
  isInviteOnly: boolean;
  /** Headline benefits (canonical copy, no "credits" / no "free"). */
  benefits: string[];
}

/**
 * CANONICAL_TIER_PRICING — the 5-tier subscription table.
 * This is the single source of truth for all pricing surfaces.
 */
export const CANONICAL_TIER_PRICING: Record<TierKey, CanonicalTierPricing> = {
  explorer: {
    key: 'explorer',
    label: 'Executive Introduction',
    alias: 'Executive Introduction',
    usdMonthly: 0,
    cnyMonthly: 0,
    monthlyMiles: 0,
    earnsMiles: false,
    isInviteOnly: false,
    benefits: [
      'Executive Introduction access to NEXUS chat',
      'Framework exploration and sample outputs',
      'Assessment previews (no personalised reports)',
      'Community forum',
    ],
  },
  starter: {
    key: 'starter',
    label: 'Professional',
    usdMonthly: 25,
    cnyMonthly: 59,
    monthlyMiles: 50,
    earnsMiles: true,
    isInviteOnly: false,
    benefits: [
      '50 mi monthly allowance',
      'All 6 leadership assessments unlocked',
      'Personalised assessment reports',
      'NEXUS miles earning (exploration +5, reflection +3)',
      'PDF report export',
    ],
  },
  pro: {
    key: 'pro',
    label: 'Executive',
    usdMonthly: 99,
    cnyMonthly: 233,
    monthlyMiles: 150,
    earnsMiles: true,
    isInviteOnly: false,
    benefits: [
      '150 mi monthly allowance',
      'Everything in Professional',
      'Peer benchmarking across regional C-suite',
      'Deliverable workspace (canvas, grid)',
      'Priority NEXUS responses',
    ],
  },
  executive: {
    key: 'executive',
    label: 'Council',
    usdMonthly: 199,
    cnyMonthly: 466,
    monthlyMiles: 300,
    earnsMiles: true,
    isInviteOnly: true,
    benefits: [
      '300 mi monthly allowance',
      'Everything in Executive',
      'Council community and live sessions',
      'Quarterly executive workshops',
      'Priority support',
    ],
  },
  council: {
    key: 'council',
    label: 'Enterprise',
    usdMonthly: 499,
    cnyMonthly: 1165,
    monthlyMiles: 600,
    earnsMiles: true,
    isInviteOnly: false,
    benefits: [
      '600 mi monthly allowance',
      'Everything in Council',
      'SSO, SCIM & role-based access',
      'Custom framework training',
      'Dedicated account contact',
    ],
  },
};

/** Ordered list of tiers for rendering pricing tables. */
export const CANONICAL_TIER_ORDER: TierKey[] = [
  'explorer', 'starter', 'pro', 'executive', 'council',
];

/** Recommended tier for highlighting on the pricing page. */
export const RECOMMENDED_TIER: TierKey = 'pro';

// ─────────────────────────────────────────────────────────────────────────────
// #1365 — Tier DISPLAY names (user-centric). Internal tier_key IDs are stable
// and preserved for billing/credits/database; this layer only changes what
// visitors see. Simplifies 5 internal tiers to 3 + complimentary + enterprise.
//   explorer  → Complimentary   (was "Executive Introduction" — kept as legal alias)
//   starter   → Professional     (internal low tier, not shown on main pricing grid)
//   pro       → Professional     (the featured middle tier shown on pricing)
//   executive → Council
//   council   → Enterprise       (B2B, separate funnel)
// Brand rule: never "free" — use "Complimentary".
// ─────────────────────────────────────────────────────────────────────────────
export const TIER_DISPLAY_NAME: Record<TierKey, string> = {
  explorer: 'Complimentary',
  starter: 'Professional',
  pro: 'Professional',
  executive: 'Council',
  council: 'Enterprise',
};

/** Tiers shown on the main pricing grid (3 user-centric tiers).
 *  Enterprise (council) is rendered separately as a B2B section.
 *  Starter is folded into Professional and not shown standalone. */
export const PRICING_PAGE_TIERS: TierKey[] = ['explorer', 'pro', 'executive'];

/** Benefit-focused display copy (replaces feature-list benefits on visitor
 *  pricing surfaces). Keyed by internal tier id. */
export const TIER_DISPLAY_BENEFITS: Record<TierKey, string[]> = {
  explorer: [
    'Try any assessment with a complimentary report',
    '3 NEXUS messages to get a read on your situation',
    'Preview the full assessment catalog',
  ],
  starter: [
    'All 6 leadership assessments unlocked',
    'Personalised assessment reports',
    'NEXUS coaching on your results',
  ],
  pro: [
    'All 6 leadership assessments with personalised reports',
    'See how you compare to regional C-suite peers',
    'Unlimited NEXUS coaching on your results',
    'Export PDF reports for your own use',
  ],
  executive: [
    'Everything in Professional, plus executive depth',
    'Join the Council — quarterly workshops with peers',
    'Priority NEXUS responses and dedicated support',
    'Full historical tracking across assessments',
  ],
  council: [
    'Seat-based deployment with SSO and SCIM',
    'Custom assessment training for your team',
    'Org-level analytics and a dedicated contact',
    'Council-tier seats for every desk',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT PRICING — 3 tiers (Standard / Premium / Unique)
// Miles cost mirrors USD pricing (~1 mile = $1).
// ─────────────────────────────────────────────────────────────────────────────

export type AssessmentPriceTier = 'standard' | 'premium' | 'unique';

export interface CanonicalAssessmentPricing {
  tier: AssessmentPriceTier;
  label: string;
  /** USD price (also = miles cost, since 1 mi ≈ $1). */
  usd: number;
  /** CNY price (1/3 of USD, rounded to nearest whole). */
  cny: number;
  /** Miles cost (same as USD). */
  miles: number;
  /** Instruments in this price tier. */
  instruments: string[];
}

/**
 * CANONICAL_ASSESSMENT_PRICING — assessment pricing table (Phase 9 Batch 6 ticket #1351).
 * Only real 6 B2C instruments with data files.
 * Standard ($99 USD): DRIVE, PRISM, FORGE, MOSAIC
 * Premium ($149 USD): SPARK, BRIDGE
 * Unique tier removed (CPI removed).
 */
export const CANONICAL_ASSESSMENT_PRICING: Record<
  AssessmentPriceTier,
  CanonicalAssessmentPricing
> = {
  standard: {
    tier: 'standard',
    label: 'Standard',
    usd: 99,
    cny: 33,
    miles: 99,
    instruments: ['DRIVE', 'PRISM', 'FORGE', 'MOSAIC'],
  },
  premium: {
    tier: 'premium',
    label: 'Premium',
    usd: 149,
    cny: 50,
    miles: 149,
    instruments: ['SPARK', 'BRIDGE'],
  },
  unique: {
    tier: 'unique',
    label: 'Custom',
    usd: 199,
    cny: 66,
    miles: 199,
    instruments: [], // No real unique-tier B2C instruments at this time.
  },
};

export const CANONICAL_ASSESSMENT_ORDER: AssessmentPriceTier[] = [
  'standard', 'premium', 'unique',
];

/**
 * Map instrument code → its canonical assessment price tier.
 * Built from CANONICAL_ASSESSMENT_PRICING so there is one source of truth.
 */
export const INSTRUMENT_PRICE_TIER: Record<string, AssessmentPriceTier> =
  Object.fromEntries(
    Object.values(CANONICAL_ASSESSMENT_PRICING).flatMap((p) =>
      p.instruments.map((code) => [code, p.tier] as const),
    ),
  );

/**
 * ASSESSMENT_MILES_COSTS — per-instrument miles cost.
 * Derived from CANONICAL_ASSESSMENT_PRICING (99 / 149 / 199).
 */
export const ASSESSMENT_MILES_COSTS: Record<string, number> = Object.fromEntries(
  Object.values(CANONICAL_ASSESSMENT_PRICING).flatMap((p) =>
    p.instruments.map((code) => [code, p.miles] as const),
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// CURRENCY DETECTION & FORMATTING (Phase 15.5, ticket #1303 — China pricing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect the user's preferred currency.
 * Priority order (#1354 update):
 *   1. localStorage['preferredCurrency'] (manual toggle saved across sessions, pre-auth)
 *   2. Explicit user setting (profile.currency_preference) — 'USD' | 'CNY'
 *   3. Browser timezone (Asia/Shanghai, Asia/Beijing, Asia/Urumqi, Asia/Chongqing)
 *   4. navigator.language (zh-CN, zh-Hans → CNY; zh-Hant / HK/TW/MO stay USD)
 *   5. Default: 'USD'
 *
 * Note: Hong Kong / Macau / Taiwan are NOT mainland China — we treat them as USD
 * for pricing purposes unless the user explicitly opts into CNY.
 */
export function detectUserCurrency(opts?: {
  timezone?: string | null;
  locale?: string | null;
  preference?: string | null;
}): PricingCurrency {
  // 0. localStorage manual override (pre-auth)
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('preferredCurrency')?.toUpperCase();
    if (saved === 'CNY' || saved === 'USD') return saved as PricingCurrency;
  }

  // 1. Explicit preference (profile.currency_preference)
  const pref = opts?.preference?.toUpperCase();
  if (pref === 'CNY' || pref === 'CN' || pref === 'RMB') return 'CNY';
  if (pref === 'USD' || pref === 'US' || pref === 'GLOBAL') return 'USD';

  // 2. Timezone
  const tz = opts?.timezone ?? (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null);
  if (tz && (tz === 'Asia/Shanghai' || tz === 'Asia/Beijing' || tz === 'Asia/Urumqi' || tz === 'Asia/Chongqing')) {
    return 'CNY';
  }

  // 3. Locale
  const locale = opts?.locale ?? (typeof navigator !== 'undefined' ? navigator.language : null);
  if (locale && /^zh-(CN|Hans)/i.test(locale)) {
    return 'CNY';
  }

  // 4. Default
  return 'USD';
}

/**
 * Save the user's manual currency choice to localStorage (used by manual toggle).
 * User's manual toggle always overrides auto-detect (#1354).
 */
export function savePreferredCurrency(currency: PricingCurrency): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('preferredCurrency', currency.toUpperCase());
}

/**
 * Clear manual currency override, fall back to geo/timezone/locale detection.
 */
export function clearPreferredCurrency(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('preferredCurrency');
}

/**
 * Format a tier price for display.
 * Returns objects so callers can compose rich UIs without re-parsing strings.
 *
 * Explorer tier: returns { display: 'Executive Introduction', isZero: true }
 * — never "Free" or "$0".
 */
export function formatTierPrice(
  tierKey: TierKey,
  currency: PricingCurrency = 'USD',
): {
  primary: string;
  secondary: string;
  isZero: boolean;
  currency: PricingCurrency;
} {
  const tier = CANONICAL_TIER_PRICING[tierKey];
  if (!tier) {
    return { primary: '—', secondary: '', isZero: false, currency };
  }

  if (tier.usdMonthly === 0) {
    return {
      primary: 'Executive Introduction',
      secondary: 'Complimentary access',
      isZero: true,
      currency,
    };
  }

  if (currency === 'CNY') {
    return {
      primary: `¥${tier.cnyMonthly}`,
      secondary: '/ 月',
      isZero: false,
      currency,
    };
  }

  return {
    primary: `$${tier.usdMonthly}`,
    secondary: '/ mo',
    isZero: false,
    currency,
  };
}

/**
 * Format an assessment price for display.
 * Standard / Premium / Unique tiers, USD or CNY.
 */
export function formatAssessmentPrice(
  priceTier: AssessmentPriceTier,
  currency: PricingCurrency = 'USD',
): { primary: string; miles: number } {
  const p = CANONICAL_ASSESSMENT_PRICING[priceTier];
  if (!p) return { primary: '—', miles: 0 };
  const primary = currency === 'CNY' ? `¥${p.cny}` : `$${p.usd}`;
  return { primary, miles: p.miles };
}

/**
 * Convenience: get the miles cost for a specific instrument code.
 * Falls back to 99 (Standard tier) if the code is not in the catalog.
 */
export function getInstrumentMilesCost(instrumentCode: string): number {
  return ASSESSMENT_MILES_COSTS[instrumentCode] ?? 99;
}

export async function fetchTiers(): Promise<Tier[]> {
  return v1Client.get<Tier[]>('/billing/tiers');
}

export async function fetchMilesBalance(): Promise<MilesBalance> {
  return v1Client.get<MilesBalance>('/billing/miles/balance');
}

export async function fetchMilesHistory(limit: number = 20): Promise<MilesHistoryEntry[]> {
  return v1Client.get<MilesHistoryEntry[]>('/billing/miles/history', {
    params: { limit },
  });
}

export async function fetchMilesEarningProgress(): Promise<MilesEarningProgress[]> {
  return v1Client.get<MilesEarningProgress[]>('/billing/miles/progress');
}

export async function purchaseMiles(featureKey: string): Promise<{
  transaction_id: string;
  new_balance: number;
}> {
  return v1Client.post('/billing/miles/purchase', { feature_key: featureKey });
}

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  return v1Client.get<SubscriptionStatus>('/billing/subscription/status');
}

export async function createCheckoutSession(
  tier: TierKey,
  cycle: BillingCycle = 'monthly'
): Promise<CheckoutSession> {
  // Batch 1.5 Corrective: invite-only tiers cannot be self-serve upgraded to.
  const pricing = CANONICAL_TIER_PRICING[tier];
  if (pricing?.isInviteOnly) {
    throw new Error('This tier is invite-only. Contact us to learn more.');
  }
  return v1Client.post('/billing/checkout', { tier, cycle });
}

export async function cancelSubscription(): Promise<{ canceled: boolean }> {
  return v1Client.post('/billing/subscription/cancel');
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return v1Client.get<Invoice[]>('/billing/invoices');
}

export async function upgradeSubscription(
  tier: TierKey
): Promise<{ upgraded: boolean }> {
  // Batch 1.5 Corrective: invite-only tiers cannot be self-serve upgraded to.
  const pricing = CANONICAL_TIER_PRICING[tier];
  if (pricing?.isInviteOnly) {
    throw new Error('This tier is invite-only. Contact us to learn more.');
  }
  return v1Client.post('/billing/subscription/upgrade', { tier });
}

export async function spendAssessmentMiles(
  instrumentKey: string,
  opts?: { referenceId?: string; userId?: string }
): Promise<{ success: boolean; newBalance: number; milesUsed: number }> {
  const milesUsed = getInstrumentMilesCost(instrumentKey);
  try {
    const result = (await v1Client.post('/billing/miles/spend', {
      feature_key: `assessment_${instrumentKey.toLowerCase()}`,
      amount: milesUsed,
      description: `${instrumentKey} Assessment — ${milesUsed} mi`,
      reference_id: opts?.referenceId,
      user_id: opts?.userId,
    })) as unknown as { new_balance?: number; data?: { new_balance?: number } };
    const nb = typeof result === "object" && result
      ? (typeof result.new_balance === "number" ? result.new_balance : (result.data && typeof result.data.new_balance === "number" ? result.data.new_balance : undefined))
      : undefined;
    return {
      success: true,
      newBalance: nb ?? 0,
      milesUsed,
    };
  } catch (e) {
    console.error('[Monetization] spendAssessmentMiles error:', e);
    return { success: false, newBalance: 0, milesUsed };
  }
}

export async function refundAssessmentMiles(
  instrumentKey: string,
  opts?: { referenceId?: string; reason?: string; userId?: string }
): Promise<{ success: boolean; milesRefunded: number }> {
  const milesRefunded = getInstrumentMilesCost(instrumentKey);
  try {
    await v1Client.post('/billing/miles/refund', {
      feature_key: `assessment_${instrumentKey.toLowerCase()}`,
      amount: milesRefunded,
      description: `Refund ${milesRefunded} mi — ${instrumentKey} Assessment${opts?.reason ? ` · ${opts.reason}` : ''}`,
      reference_id: opts?.referenceId,
      user_id: opts?.userId,
    });
    return { success: true, milesRefunded };
  } catch (e) {
    console.error('[Monetization] refundAssessmentMiles error:', e);
    return { success: false, milesRefunded };
  }
}
