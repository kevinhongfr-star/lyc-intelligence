/**
 * pricingData.ts — Consolidated pricing page data model (Batch 3 / Ticket 1).
 *
 * Single source of truth for the /pricing page. Extends the canonical tier
 * system (tiers.ts) and mile economy (miles.ts) with the v4.1 fields that
 * the pricing page needs but the core configs don't carry: human debrief
 * pricing, session discounts, free session allowances, annual session
 * stacking bonus, doc upload limits, memory windows, and persona access.
 *
 * Rules:
 *  - All numbers live here or in tiers.ts/miles.ts. Components never hardcode.
 *  - Council = invite-only. Never a "Sign up" CTA. Always "Apply" / "Request invite".
 *  - Annual discount = 15% off subscription (ANNUAL_DISCOUNT_PERCENT in tiers.ts).
 *  - Annual +10% session stacking applies to debrief sessions ONLY, not mile packs.
 *  - Explorer = complimentary, no credit card. LEAP + PRISM as one-time tokens.
 *  - Miles = product UI language. Marketing framing = "included diagnostics".
 *  - Copy placeholders marked [Emily: ...] map to positioning doc sections.
 *
 * Source: Tier Feature Matrix v4.1 (locked) + Pricing Strategy v1.1.
 */

import {
  TIER_ORDER,
  TIERS,
  TIER_PRICING,
  ANNUAL_DISCOUNT_PERCENT,
  RECOMMENDED_TIER,
  computeTierPrice,
  formatPrice,
  type TierKey,
  type BillingCycle,
  type PricingCurrency,
} from './tiers';
import {
  MONTHLY_ALLOCATION,
  ROLLOVER_PERCENT,
  ROLLOVER_MAX_MONTHS,
  MILE_PACKS,
  PURCHASED_MILES_EXPIRY_MONTHS,
  INSTRUMENT_MILE_COST,
  EXPLORER_FREE_ASSESSMENTS,
  CPI_REQUIRED_TIER,
  MILE_COST_TIERS,
  type MilePack,
  type MileCostTier,
} from './miles';
import { DEFAULT_PERSONAS, getAvailablePersonas, type PersonaKey } from './nexusPersonas';

// Re-export the canonical primitives the pricing page needs in one place.
export {
  TIER_ORDER,
  TIERS,
  TIER_PRICING,
  ANNUAL_DISCOUNT_PERCENT,
  RECOMMENDED_TIER,
  computeTierPrice,
  formatPrice,
  MONTHLY_ALLOCATION,
  ROLLOVER_PERCENT,
  ROLLOVER_MAX_MONTHS,
  MILE_PACKS,
  PURCHASED_MILES_EXPIRY_MONTHS,
  INSTRUMENT_MILE_COST,
  EXPLORER_FREE_ASSESSMENTS,
  CPI_REQUIRED_TIER,
  MILE_COST_TIERS,
};
export type { TierKey, BillingCycle, PricingCurrency, MilePack, MileCostTier };

// ═══════════════════════════════════════════════════════════════════════
// §1 — Human debrief sessions (Ticket 8 source data)
// ═══════════════════════════════════════════════════════════════════════

export type DebriefSessionId = 'debrief_30' | 'debrief_45' | 'debrief_60' | 'debrief_90_cpi';

export interface DebriefSessionType {
  id: DebriefSessionId;
  /** Duration in minutes. */
  durationMinutes: 30 | 45 | 60 | 90;
  /** Short label for cards / modals. */
  label: string;
  /** Coach type descriptor — copy placeholder. */
  coachTypePlaceholder: string;
  /** What-to-expect description — copy placeholder mapped to positioning doc. */
  descriptionPlaceholder: string;
  /** USD price per session. */
  priceUsd: number;
  /** CNY price per session. */
  priceCny: number;
  /** Whether this is the CPI-specific 90-minute debrief. */
  isCpi: boolean;
}

/**
 * The 4 debrief session types. Prices locked per Tier Feature Matrix v4.1.
 * Copy slots = [Emily: positioning doc §debriefs].
 */
export const DEBRIEF_SESSIONS: DebriefSessionType[] = [
  {
    id: 'debrief_30',
    durationMinutes: 30,
    label: '30-minute debrief',
    coachTypePlaceholder: '[Emily: 30-min coach type]',
    descriptionPlaceholder: '[Emily: 30-minute debrief — what to expect]',
    priceUsd: 149,
    priceCny: 349,
    isCpi: false,
  },
  {
    id: 'debrief_45',
    durationMinutes: 45,
    label: '45-minute debrief',
    coachTypePlaceholder: '[Emily: 45-min coach type]',
    descriptionPlaceholder: '[Emily: 45-minute debrief — what to expect]',
    priceUsd: 249,
    priceCny: 583,
    isCpi: false,
  },
  {
    id: 'debrief_60',
    durationMinutes: 60,
    label: '60-minute debrief',
    coachTypePlaceholder: '[Emily: 60-min coach type]',
    descriptionPlaceholder: '[Emily: 60-minute debrief — what to expect]',
    priceUsd: 349,
    priceCny: 816,
    isCpi: false,
  },
  {
    id: 'debrief_90_cpi',
    durationMinutes: 90,
    label: '90-minute CPI debrief',
    coachTypePlaceholder: '[Emily: CPI debrief coach type]',
    descriptionPlaceholder: '[Emily: 90-minute CPI debrief — what to expect]',
    priceUsd: 599,
    priceCny: 1401,
    isCpi: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §2 — Tier-specific debrief allowances + discounts
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-tier discount on debrief sessions (% off list price).
 * Explorer = 0 (no discount, pays list). Paid tiers scale 10 → 25%.
 * Source: Tier Feature Matrix v4.1.
 */
export const TIER_SESSION_DISCOUNT_PCT: Record<TierKey, number> = {
  explorer: 0,
  starter: 10,
  professional: 15,
  executive: 20,
  council: 25,
};

export interface FreeSessionAllowance {
  /** Number of complimentary sessions per month. */
  count: number;
  /** Duration of each complimentary session. */
  durationMinutes: 30 | 60;
  /** Which debrief session type this maps to. */
  debriefId: DebriefSessionId;
}

/**
 * Complimentary monthly debrief sessions by tier.
 * Executive = 1 × 30-min/mo. Council = 2 × 60-min/mo. Others = none.
 * Source: Tier Feature Matrix v4.1.
 */
export const TIER_FREE_SESSIONS: Record<TierKey, FreeSessionAllowance | null> = {
  explorer: null,
  starter: null,
  professional: null,
  executive: { count: 1, durationMinutes: 30, debriefId: 'debrief_30' },
  council: { count: 2, durationMinutes: 60, debriefId: 'debrief_60' },
};

/**
 * Annual billing bonus: +10% value applied to debrief sessions ONLY.
 * Does NOT apply to mile packs. Members on annual billing get 10% more
 * session value (effectively a deeper discount on debriefs).
 * Source: Tier Feature Matrix v4.1.
 */
export const ANNUAL_SESSION_STACKING_BONUS_PCT = 10;

// ═══════════════════════════════════════════════════════════════════════
// §3 — Document upload + memory windows (v4.1 additions)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-tier document upload limit (MB). 0 = no upload.
 * Explorer = none (chat-only). Scales with tier.
 * Source: Tier Feature Matrix v4.1.
 */
export const TIER_DOC_UPLOAD_LIMIT_MB: Record<TierKey, number> = {
  explorer: 0,
  starter: 10,
  professional: 50,
  executive: 200,
  council: 1000,
};

/**
 * NEXUS conversation memory window (days). How long NEXUS remembers
 * prior conversations in the rolling context window.
 * Source: Tier Feature Matrix v4.1.
 */
export const TIER_MEMORY_DAYS: Record<TierKey, number> = {
  explorer: 7,
  starter: 30,
  professional: 90,
  executive: 180,
  council: 365,
};

// ═══════════════════════════════════════════════════════════════════════
// §4 — Persona access by tier
// ═══════════════════════════════════════════════════════════════════════

/**
 * Which personas each tier unlocks. Derived from nexusPersonas.ts minTier.
 * Explorer = Guide only. Starter+ = +Analyst. Pro+ = +Strategist. Exec+ = +Steward.
 */
export const TIER_PERSONA_ACCESS: Record<TierKey, PersonaKey[]> = {
  explorer: getAvailablePersonas('explorer').map((p) => p.key),
  starter: getAvailablePersonas('starter').map((p) => p.key),
  professional: getAvailablePersonas('professional').map((p) => p.key),
  executive: getAvailablePersonas('executive').map((p) => p.key),
  council: getAvailablePersonas('council').map((p) => p.key),
};

// ═══════════════════════════════════════════════════════════════════════
// §5 — Consolidated pricing tier model
// ═══════════════════════════════════════════════════════════════════════

/**
 * The complete pricing-page tier record. Merges canonical tier metadata,
 * pricing, mile economy, and the v4.1 additions above into one shape that
 * the pricing page components read from. No other file should assemble
 * these fields — import PRICING_TIERS / getPricingTier() instead.
 */
export interface PricingTier {
  // ── Identity ──
  key: TierKey;
  displayName: string;
  order: number;
  isEntryTier: boolean;
  isInviteOnly: boolean;
  /** Marketing one-liner — copy placeholder mapped to positioning doc. */
  positioningOneLiner: string;
  /** Short tagline — copy placeholder. */
  tagline: string;

  // ── Pricing ──
  usdMonthly: number;
  cnyMonthly: number;
  annualDiscountPct: number;

  // ── Mile economy ──
  monthlyMiles: number;
  rolloverRatePct: number;
  rolloverMaxMonths: number;
  /** Complimentary Explorer tokens (LEAP + PRISM). Empty for paid tiers. */
  complimentaryTokens: string[];

  // ── Debriefs ──
  sessionDiscountPct: number;
  freeSessions: FreeSessionAllowance | null;
  annualSessionStackingBonusPct: number;

  // ── NEXUS ──
  /** Daily message cap. null = unlimited. */
  messagesPerDay: number | null;
  /** Soft nudge threshold. */
  nudgeAt: number | null;
  memoryDays: number;
  personaAccess: PersonaKey[];
  nexusPriority: boolean;

  // ── Documents ──
  docUploadLimitMb: number;

  // ── Diagnostic features ──
  assessmentBaselines: number;
  assessmentUnlimitedRetakes: boolean;
  brandedPdfReports: boolean;
  advancedInsights: boolean;
  peerBenchmarking: boolean;

  // ── Community / support ──
  councilCommunity: boolean;
  executiveWorkshops: boolean;
  prioritySupport: boolean;
  dedicatedContact: boolean;

  // ── Card metadata ──
  isRecommended: boolean;
  /** CTA copy placeholder — mapped to positioning doc. */
  ctaLabel: string;
  /** 3–5 highlight bullets for the tier card — copy placeholders. */
  highlightPlaceholders: string[];
}

/**
 * All 5 tiers, fully resolved, in display order. The single array the
 * pricing page maps over for tier cards, comparison table, and value props.
 */
export const PRICING_TIERS: PricingTier[] = TIER_ORDER.map((key) => {
  const meta = TIERS[key];
  const features = meta.features;
  const pricing = TIER_PRICING[key];
  return {
    key,
    displayName: meta.displayName,
    order: meta.order,
    isEntryTier: meta.isEntryTier,
    isInviteOnly: meta.isInviteOnly,
    positioningOneLiner: `[Emily: ${key} positioning one-liner]`,
    tagline: `[Emily: ${key} tagline]`,
    usdMonthly: pricing.usdMonthly,
    cnyMonthly: pricing.cnyMonthly,
    annualDiscountPct: ANNUAL_DISCOUNT_PERCENT,
    monthlyMiles: MONTHLY_ALLOCATION[key],
    rolloverRatePct: ROLLOVER_PERCENT,
    rolloverMaxMonths: ROLLOVER_MAX_MONTHS,
    complimentaryTokens: key === 'explorer' ? [...EXPLORER_FREE_ASSESSMENTS] : [],
    sessionDiscountPct: TIER_SESSION_DISCOUNT_PCT[key],
    freeSessions: TIER_FREE_SESSIONS[key],
    annualSessionStackingBonusPct: ANNUAL_SESSION_STACKING_BONUS_PCT,
    messagesPerDay: features.nexusDailyMessages,
    nudgeAt: features.nexusNudgeAt,
    memoryDays: TIER_MEMORY_DAYS[key],
    personaAccess: TIER_PERSONA_ACCESS[key],
    nexusPriority: features.nexusPriority,
    docUploadLimitMb: TIER_DOC_UPLOAD_LIMIT_MB[key],
    assessmentBaselines: features.assessmentBaselines,
    assessmentUnlimitedRetakes: features.assessmentUnlimitedRetakes,
    brandedPdfReports: features.brandedPdfReports,
    advancedInsights: features.advancedInsights,
    peerBenchmarking: features.peerBenchmarking,
    councilCommunity: features.councilCommunity,
    executiveWorkshops: features.executiveWorkshops,
    prioritySupport: features.prioritySupport,
    dedicatedContact: features.dedicatedContact,
    isRecommended: key === RECOMMENDED_TIER,
    ctaLabel: key === 'explorer'
      ? 'Start complimentary'
      : key === 'council'
        ? 'Request invite'
        : `Choose ${meta.displayName}`,
    highlightPlaceholders: [
      `[Emily: ${key} highlight 1]`,
      `[Emily: ${key} highlight 2]`,
      `[Emily: ${key} highlight 3]`,
    ],
  };
});

/** Lookup a single pricing tier by key. */
export function getPricingTier(key: TierKey): PricingTier {
  return PRICING_TIERS.find((t) => t.key === key) ?? PRICING_TIERS[0];
}

// ═══════════════════════════════════════════════════════════════════════
// §6 — Debrief price calculator (with tier discount + annual stacking)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compute the effective per-session price for a debrief, given the member's
 * tier and billing cycle. Applies:
 *  1. Tier session discount (TIER_SESSION_DISCOUNT_PCT)
 *  2. Annual stacking bonus (+10% value on annual billing — sessions only)
 *
 * Returns the price in the requested currency, rounded to the nearest dollar.
 */
export function computeDebriefPrice(
  session: DebriefSessionType,
  tier: TierKey,
  cycle: BillingCycle,
  currency: PricingCurrency,
): { listPrice: number; effectivePrice: number; discountPct: number } {
  const listPrice = currency === 'USD' ? session.priceUsd : session.priceCny;
  const tierDiscount = TIER_SESSION_DISCOUNT_PCT[tier];

  // Annual stacking = additional 10% off (sessions only, not mile packs).
  const annualBonus = cycle === 'annual' ? ANNUAL_SESSION_STACKING_BONUS_PCT : 0;
  const totalDiscountPct = tierDiscount + annualBonus;

  const effectivePrice = Math.round(listPrice * (1 - totalDiscountPct / 100));
  return { listPrice, effectivePrice, discountPct: totalDiscountPct };
}

// ═══════════════════════════════════════════════════════════════════════
// §7 — Mile pack savings calculator
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compute savings % for a mile pack vs buying the same miles as 1-mile packs.
 * Returns the savings percentage (e.g. 18 for 5-pack, 33 for 15-pack).
 * Annual stacking bonus does NOT apply to mile packs.
 */
export function computeMilePackSavings(pack: MilePack): number {
  const unitPrice = MILE_PACKS.find((p) => p.miles === 1)?.priceUsd ?? 49;
  const listTotal = unitPrice * pack.miles;
  if (listTotal === 0) return 0;
  return Math.round((1 - pack.priceUsd / listTotal) * 100);
}

// ═══════════════════════════════════════════════════════════════════════
// §8 — Feature comparison table rows (Ticket 3 source data)
// ═══════════════════════════════════════════════════════════════════════

export type FeatureCellValue = boolean | number | string | null;
export type FeatureCellRender = 'check' | 'dash' | 'number' | 'text' | 'unlimited';

export interface FeatureRow {
  /** Category grouping (NEXUS Chat, Assessments, Debriefs, etc.). */
  category: string;
  /** Feature label — copy placeholder mapped to tier matrix. */
  label: string;
  /** Per-tier values, keyed by TierKey. */
  values: Record<TierKey, FeatureCellValue>;
  /** How to render the cell. */
  render: FeatureCellRender;
  /** Optional suffix for numeric values (e.g. " miles", " MB"). */
  suffix?: string;
}

/**
 * The full feature comparison matrix. Every value comes from PRICING_TIERS
 * or the underlying configs — no hardcoded numbers here.
 * Category labels + feature labels are copy placeholders for Emily.
 */
export const FEATURE_ROWS: FeatureRow[] = [
  // ── NEXUS Chat ──
  {
    category: 'NEXUS Chat',
    label: 'Daily messages',
    render: 'unlimited',
    values: {
      explorer: PRICING_TIERS[0].messagesPerDay,
      starter: PRICING_TIERS[1].messagesPerDay,
      professional: PRICING_TIERS[2].messagesPerDay,
      executive: PRICING_TIERS[3].messagesPerDay,
      council: PRICING_TIERS[4].messagesPerDay,
    },
  },
  {
    category: 'NEXUS Chat',
    label: 'Conversation memory',
    render: 'number',
    suffix: ' days',
    values: {
      explorer: PRICING_TIERS[0].memoryDays,
      starter: PRICING_TIERS[1].memoryDays,
      professional: PRICING_TIERS[2].memoryDays,
      executive: PRICING_TIERS[3].memoryDays,
      council: PRICING_TIERS[4].memoryDays,
    },
  },
  {
    category: 'NEXUS Chat',
    label: 'Personas',
    render: 'number',
    values: {
      explorer: PRICING_TIERS[0].personaAccess.length,
      starter: PRICING_TIERS[1].personaAccess.length,
      professional: PRICING_TIERS[2].personaAccess.length,
      executive: PRICING_TIERS[3].personaAccess.length,
      council: PRICING_TIERS[4].personaAccess.length,
    },
  },
  {
    category: 'NEXUS Chat',
    label: 'Priority responses',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].nexusPriority,
      starter: PRICING_TIERS[1].nexusPriority,
      professional: PRICING_TIERS[2].nexusPriority,
      executive: PRICING_TIERS[3].nexusPriority,
      council: PRICING_TIERS[4].nexusPriority,
    },
  },
  // ── Diagnostic Miles ──
  {
    category: 'Diagnostic Miles',
    label: 'Monthly miles',
    render: 'number',
    suffix: ' miles',
    values: {
      explorer: PRICING_TIERS[0].monthlyMiles,
      starter: PRICING_TIERS[1].monthlyMiles,
      professional: PRICING_TIERS[2].monthlyMiles,
      executive: PRICING_TIERS[3].monthlyMiles,
      council: PRICING_TIERS[4].monthlyMiles,
    },
  },
  {
    category: 'Diagnostic Miles',
    label: 'Rollover rate',
    render: 'number',
    suffix: '%',
    values: {
      explorer: PRICING_TIERS[0].rolloverRatePct,
      starter: PRICING_TIERS[1].rolloverRatePct,
      professional: PRICING_TIERS[2].rolloverRatePct,
      executive: PRICING_TIERS[3].rolloverRatePct,
      council: PRICING_TIERS[4].rolloverRatePct,
    },
  },
  {
    category: 'Diagnostic Miles',
    label: 'Complimentary tokens',
    render: 'text',
    values: {
      explorer: 'LEAP + PRISM',
      starter: '—',
      professional: '—',
      executive: '—',
      council: '—',
    },
  },
  {
    category: 'Diagnostic Miles',
    label: 'Diagnostic baselines',
    render: 'number',
    values: {
      explorer: PRICING_TIERS[0].assessmentBaselines,
      starter: PRICING_TIERS[1].assessmentBaselines,
      professional: PRICING_TIERS[2].assessmentBaselines,
      executive: PRICING_TIERS[3].assessmentBaselines,
      council: PRICING_TIERS[4].assessmentBaselines,
    },
  },
  // ── Human Debriefs ──
  {
    category: 'Human Debriefs',
    label: 'Session discount',
    render: 'number',
    suffix: '%',
    values: {
      explorer: PRICING_TIERS[0].sessionDiscountPct,
      starter: PRICING_TIERS[1].sessionDiscountPct,
      professional: PRICING_TIERS[2].sessionDiscountPct,
      executive: PRICING_TIERS[3].sessionDiscountPct,
      council: PRICING_TIERS[4].sessionDiscountPct,
    },
  },
  {
    category: 'Human Debriefs',
    label: 'Free sessions / month',
    render: 'text',
    values: {
      explorer: '—',
      starter: '—',
      professional: '—',
      executive: '1 × 30 min',
      council: '2 × 60 min',
    },
  },
  {
    category: 'Human Debriefs',
    label: 'Annual stacking bonus',
    render: 'number',
    suffix: '%',
    values: {
      explorer: PRICING_TIERS[0].annualSessionStackingBonusPct,
      starter: PRICING_TIERS[1].annualSessionStackingBonusPct,
      professional: PRICING_TIERS[2].annualSessionStackingBonusPct,
      executive: PRICING_TIERS[3].annualSessionStackingBonusPct,
      council: PRICING_TIERS[4].annualSessionStackingBonusPct,
    },
  },
  // ── Document Upload ──
  {
    category: 'Document Upload',
    label: 'Upload limit',
    render: 'number',
    suffix: ' MB',
    values: {
      explorer: PRICING_TIERS[0].docUploadLimitMb,
      starter: PRICING_TIERS[1].docUploadLimitMb,
      professional: PRICING_TIERS[2].docUploadLimitMb,
      executive: PRICING_TIERS[3].docUploadLimitMb,
      council: PRICING_TIERS[4].docUploadLimitMb,
    },
  },
  // ── Reports ──
  {
    category: 'Reports',
    label: 'Branded PDF reports',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].brandedPdfReports,
      starter: PRICING_TIERS[1].brandedPdfReports,
      professional: PRICING_TIERS[2].brandedPdfReports,
      executive: PRICING_TIERS[3].brandedPdfReports,
      council: PRICING_TIERS[4].brandedPdfReports,
    },
  },
  {
    category: 'Reports',
    label: 'Advanced insights',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].advancedInsights,
      starter: PRICING_TIERS[1].advancedInsights,
      professional: PRICING_TIERS[2].advancedInsights,
      executive: PRICING_TIERS[3].advancedInsights,
      council: PRICING_TIERS[4].advancedInsights,
    },
  },
  {
    category: 'Reports',
    label: 'Peer benchmarking',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].peerBenchmarking,
      starter: PRICING_TIERS[1].peerBenchmarking,
      professional: PRICING_TIERS[2].peerBenchmarking,
      executive: PRICING_TIERS[3].peerBenchmarking,
      council: PRICING_TIERS[4].peerBenchmarking,
    },
  },
  {
    category: 'Reports',
    label: 'Unlimited retakes',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].assessmentUnlimitedRetakes,
      starter: PRICING_TIERS[1].assessmentUnlimitedRetakes,
      professional: PRICING_TIERS[2].assessmentUnlimitedRetakes,
      executive: PRICING_TIERS[3].assessmentUnlimitedRetakes,
      council: PRICING_TIERS[4].assessmentUnlimitedRetakes,
    },
  },
  // ── Ensemble / Advanced ──
  {
    category: 'Ensemble / Advanced',
    label: 'Executive workshops',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].executiveWorkshops,
      starter: PRICING_TIERS[1].executiveWorkshops,
      professional: PRICING_TIERS[2].executiveWorkshops,
      executive: PRICING_TIERS[3].executiveWorkshops,
      council: PRICING_TIERS[4].executiveWorkshops,
    },
  },
  {
    category: 'Ensemble / Advanced',
    label: 'Council community',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].councilCommunity,
      starter: PRICING_TIERS[1].councilCommunity,
      professional: PRICING_TIERS[2].councilCommunity,
      executive: PRICING_TIERS[3].councilCommunity,
      council: PRICING_TIERS[4].councilCommunity,
    },
  },
  // ── Support ──
  {
    category: 'Support',
    label: 'Priority support',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].prioritySupport,
      starter: PRICING_TIERS[1].prioritySupport,
      professional: PRICING_TIERS[2].prioritySupport,
      executive: PRICING_TIERS[3].prioritySupport,
      council: PRICING_TIERS[4].prioritySupport,
    },
  },
  {
    category: 'Support',
    label: 'Dedicated contact',
    render: 'check',
    values: {
      explorer: PRICING_TIERS[0].dedicatedContact,
      starter: PRICING_TIERS[1].dedicatedContact,
      professional: PRICING_TIERS[2].dedicatedContact,
      executive: PRICING_TIERS[3].dedicatedContact,
      council: PRICING_TIERS[4].dedicatedContact,
    },
  },
];

/** Ordered list of feature categories (for table section headers). */
export const FEATURE_CATEGORIES: string[] = (() => {
  const seen: string[] = [];
  for (const row of FEATURE_ROWS) {
    if (!seen.includes(row.category)) seen.push(row.category);
  }
  return seen;
})();
