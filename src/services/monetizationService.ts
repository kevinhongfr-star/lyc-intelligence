import { v1Client } from '@/hooks/v1/v1Client';

export interface Tier {
  key: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
}

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
// CANONICAL PRICING — single source of truth (Phase 15.5, ticket #1303)
//
// Reference: specs/NEXUS_PRODUCT_SPEC_v3_ALIGNED.md §2
// 5-tier model: Explorer / Starter / Pro / Executive / Council
// Currency = miles. Explorer tier = "Executive Introduction" (never "free").
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
    label: 'Explorer',
    alias: 'Executive Introduction',
    usdMonthly: 0,
    cnyMonthly: 0,
    monthlyMiles: 0,
    earnsMiles: false,
    benefits: [
      'Executive Introduction access to NEXUS chat',
      'Framework exploration and sample outputs',
      'Diagnostic previews (no personalised reports)',
      'Community forum',
    ],
  },
  starter: {
    key: 'starter',
    label: 'Starter',
    usdMonthly: 25,
    cnyMonthly: 59,
    monthlyMiles: 50,
    earnsMiles: true,
    benefits: [
      '50 mi monthly diagnostic allowance',
      'All 11 diagnostics unlocked',
      'Personalised diagnostic reports',
      'NEXUS miles earning (exploration +5, reflection +3)',
      'PDF report export',
    ],
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    usdMonthly: 99,
    cnyMonthly: 233,
    monthlyMiles: 150,
    earnsMiles: true,
    benefits: [
      '150 mi monthly allowance',
      'Everything in Starter',
      'Peer benchmarking across regional C-suite',
      'Deliverable workspace (canvas, grid)',
      'Priority NEXUS responses',
    ],
  },
  executive: {
    key: 'executive',
    label: 'Executive',
    usdMonthly: 199,
    cnyMonthly: 466,
    monthlyMiles: 300,
    earnsMiles: true,
    benefits: [
      '300 mi monthly allowance',
      'Everything in Pro',
      'Executive consultant debriefs',
      'Live event access',
      'Priority support',
    ],
  },
  council: {
    key: 'council',
    label: 'Council',
    usdMonthly: 499,
    cnyMonthly: 1165,
    monthlyMiles: 600,
    earnsMiles: true,
    benefits: [
      '600 mi monthly allowance',
      'Everything in Executive',
      'Council community and live sessions',
      'Quarterly executive workshops',
      'Unlimited NEXUS conversations',
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
// DIAGNOSTIC PRICING — 3 service levels (Executive Introduction / Professional Deep-Dive / Executive Advisory)
// Diagnostic mile costs locked to 1/2/3/5 canon (per-instrument, not tied to USD).
// Assessment* names retained below as deprecated re-exports for backwards compatibility.
// ─────────────────────────────────────────────────────────────────────────────

/** Kept as a stable alias — service levels still enumerate the same 3 tiers. */
export type AssessmentPriceTier = 'standard' | 'premium' | 'unique';

export interface CanonicalDiagnosticPricing {
  tier: AssessmentPriceTier;
  label: string;
  /** User-facing diagnostic cohort label (replaces internal assessment_label). */
  diagnostic_label: string;
  /** USD price for the debrief / service level (kept at locked service levels). */
  usd: number;
  /** CNY price for the debrief / service level (1/3 of USD, rounded). */
  cny: number;
  /** Diagnostic mile cohort (1/2/3/5 canon range, NOT equal to USD). */
  miles: number;
  /** Instruments in this diagnostic cohort (maps to 1/2/3/5 mile costs individually). */
  instruments: string[];
}

/**
 * CANONICAL_DIAGNOSTIC_PRICING — 3-tier diagnostic service level table.
 * Service-level USD pricing locked: Executive Introduction $99, Professional Deep-Dive $149, Executive Advisory $249.
 * Per-instrument mile costs live in DIAGNOSTIC_MILES_COSTS (canon 1/2/3/5 — see constants/miles.ts).
 */
export const CANONICAL_DIAGNOSTIC_PRICING: Record<
  AssessmentPriceTier,
  CanonicalDiagnosticPricing
> = {
  standard: {
    tier: 'standard',
    label: 'Executive Introduction',
    diagnostic_label: '1mi – 2mi Career Core cohort',
    usd: 99,
    cny: 33,
    miles: 2,
    instruments: ['LEAP', 'IMPACT', 'COACH', 'DRIVE', 'QUEST'],
  },
  premium: {
    tier: 'premium',
    label: 'Professional Deep-Dive',
    diagnostic_label: '2mi – 3mi Standard / Advisory cohort',
    usd: 149,
    cny: 50,
    miles: 3,
    instruments: ['PRISM', 'BRIDGE', 'MOSAIC', 'SPARK', 'FORGE'],
  },
  unique: {
    tier: 'unique',
    label: 'Executive Advisory',
    diagnostic_label: '5mi Flagship / Signature cohort',
    usd: 249,
    cny: 66,
    miles: 5,
    instruments: ['CPI'],
  },
};

export const CANONICAL_DIAGNOSTIC_ORDER: AssessmentPriceTier[] = [
  'standard', 'premium', 'unique',
];

/**
 * DIAGNOSTIC_MILES_COSTS — per-instrument mile costs.
 * LOCKED CANON 1/2/3/5 (Kevin, Batch 6 audit). Overwrites old 99/149/199 values.
 * Authoritative source: src/constants/miles.ts INSTRUMENT_MILE_COST.
 */
export const DIAGNOSTIC_MILES_COSTS: Record<string, number> = {
  LEAP: 1,
  PRISM: 2,
  IMPACT: 2,
  COACH: 2,
  BRIDGE: 3,
  MOSAIC: 3,
  SPARK: 3,
  DRIVE: 2,
  FORGE: 3,
  QUEST: 2,
  CPI: 5,
};

/**
 * Map instrument code → its canonical diagnostic price tier.
 * Built from CANONICAL_DIAGNOSTIC_PRICING so there is one source of truth.
 */
export const INSTRUMENT_PRICE_TIER: Record<string, AssessmentPriceTier> =
  Object.fromEntries(
    Object.values(CANONICAL_DIAGNOSTIC_PRICING).flatMap((p) =>
      p.instruments.map((code) => [code, p.tier] as const),
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// DEPRECATED RE-EXPORTS — assessment-era names retained for backwards compat.
// Prefer the CanonicalDiagnosticPricing / DIAGNOSTIC_* variants above.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use CanonicalDiagnosticPricing instead. */
export type CanonicalAssessmentPricing = CanonicalDiagnosticPricing;

/** @deprecated Use CANONICAL_DIAGNOSTIC_PRICING instead. */
export const CANONICAL_ASSESSMENT_PRICING: Record<
  AssessmentPriceTier,
  CanonicalAssessmentPricing
> = CANONICAL_DIAGNOSTIC_PRICING;

/** @deprecated Use CANONICAL_DIAGNOSTIC_ORDER instead. */
export const CANONICAL_ASSESSMENT_ORDER: AssessmentPriceTier[] = CANONICAL_DIAGNOSTIC_ORDER;

/** @deprecated Use DIAGNOSTIC_MILES_COSTS instead. */
export const ASSESSMENT_MILES_COSTS: Record<string, number> = DIAGNOSTIC_MILES_COSTS;

// ─────────────────────────────────────────────────────────────────────────────
// CURRENCY DETECTION & FORMATTING (Phase 15.5, ticket #1303 — China pricing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect the user's preferred currency.
 * Priority order:
 *   1. Explicit user setting (profile.currency_preference) — 'USD' | 'CNY'
 *   2. Browser timezone (Asia/Shanghai, Asia/Beijing, Asia/Hong_Kong*, etc.)
 *   3. navigator.language (zh-CN, zh-Hans, zh-*)
 *   4. Default: 'USD'
 *
 * *Hong Kong / Macau / Taiwan are NOT mainland China — we treat them as USD
 * for pricing purposes unless the user explicitly opts into CNY.
 */
export function detectUserCurrency(opts?: {
  timezone?: string | null;
  locale?: string | null;
  preference?: string | null;
}): PricingCurrency {
  // 1. Explicit preference
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
 * Format a diagnostic service-level price for display.
 * Executive Introduction / Professional Deep-Dive / Executive Advisory tiers, USD or CNY.
 * @deprecated Prefer formatDiagnosticPrice (same signature, updated naming).
 */
export function formatAssessmentPrice(
  priceTier: AssessmentPriceTier,
  currency: PricingCurrency = 'USD',
): { primary: string; miles: number } {
  return formatDiagnosticPrice(priceTier, currency);
}

/**
 * Format a diagnostic service-level price for display.
 * Executive Introduction / Professional Deep-Dive / Executive Advisory tiers, USD or CNY.
 */
export function formatDiagnosticPrice(
  priceTier: AssessmentPriceTier,
  currency: PricingCurrency = 'USD',
): { primary: string; miles: number } {
  const p = CANONICAL_DIAGNOSTIC_PRICING[priceTier];
  if (!p) return { primary: '—', miles: 0 };
  const primary = currency === 'CNY' ? `¥${p.cny}` : `$${p.usd}`;
  return { primary, miles: p.miles };
}

/**
 * Convenience: get the miles cost for a specific instrument code.
 * Locks to the 1/2/3/5 diagnostic canon. Falls back to 2 (Standard) if unknown.
 */
export function getInstrumentMilesCost(instrumentCode: string): number {
  return DIAGNOSTIC_MILES_COSTS[instrumentCode] ?? 2;
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
