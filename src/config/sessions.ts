/**
 * sessions.ts — Single source of truth for human debrief sessions.
 *
 * Batch 5 / Workstream 1 + 3: Session data model, catalog, coach types,
 * tier discounts, annual stacking, complimentary allocations, and the
 * unified discount calculation engine.
 *
 * Source: Tier Feature Matrix v4.1 (locked — Stream 3 Human Debriefs)
 *         Pricing Strategy v1.1
 *
 * Rules:
 *  - ALL session prices come from this config. No hardcoded numbers in UI.
 *  - Discount stack order: tier discount FIRST, then annual +10% on top.
 *    NOT additive. Formula:
 *    final = base × (1 - tier_discount) × (1 - (annual ? 0.10 : 0))
 *  - Complimentary sessions reset on BILLING CYCLE date, not calendar month.
 *  - No rollover on complimentary sessions — use-it-or-lose-it per month.
 *  - CPI deep-dive = Council-only at launch (soft gate for lower tiers).
 *  - Miles and sessions are SEPARATE revenue streams. Don't mix them.
 *    CPI deep-dive is a session PRODUCT (includes CPI assessment bundled),
 *    NOT a mile purchase. Miles are NOT consumed for CPI deep-dive.
 */

import { type TierKey, TIER_KEYS, normalizeTier, tierDisplayName } from './tiers';

// ═══════════════════════════════════════════════════════════════════════
// §1 — Coach type definitions
// ═══════════════════════════════════════════════════════════════════════

export type CoachType =
  | 'career_coach'
  | 'executive_coach'
  | 'leadership_coach'
  | 'cpi_specialist';

export interface CoachTypeMeta {
  type: CoachType;
  /** Human-readable label (placeholder — Emily copy TBD). */
  displayName: string;
  /** Short descriptor (placeholder — Emily copy TBD). */
  descriptor: string;
}

export const COACH_TYPES: Record<CoachType, CoachTypeMeta> = {
  career_coach: {
    type: 'career_coach',
    displayName: '[Emily: Career Coach display name — placeholder]',
    descriptor: '[Emily: Career Coach descriptor — placeholder. Career transitions, next-move strategy, positioning.]',
  },
  executive_coach: {
    type: 'executive_coach',
    displayName: '[Emily: Executive Coach display name — placeholder]',
    descriptor: '[Emily: Executive Coach descriptor — placeholder. C-suite operating, stakeholder management, executive presence.]',
  },
  leadership_coach: {
    type: 'leadership_coach',
    displayName: '[Emily: Leadership Coach display name — placeholder]',
    descriptor: '[Emily: Leadership Coach descriptor — placeholder. Team leadership, organisational impact, broader leadership scope.]',
  },
  cpi_specialist: {
    type: 'cpi_specialist',
    displayName: '[Emily: CPI Specialist display name — placeholder]',
    descriptor: '[Emily: CPI Specialist descriptor — placeholder. Trained in CPI methodology, pipeline health, China leadership context.]',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// §2 — Session type catalog (4 standard + CPI deep-dive)
// ═══════════════════════════════════════════════════════════════════════

export type SessionSlug =
  | 'career-30'
  | 'executive-45'
  | 'leadership-60'
  | 'cpi-deepdive-90';

export interface SessionType {
  /** URL-safe slug. Uniquely identifies the session type. */
  slug: SessionSlug;
  /** Canonical display name (placeholder — Emily copy TBD). */
  displayName: string;
  /** Short descriptor (placeholder — Emily copy TBD). */
  shortDescriptor: string;
  /** Duration in minutes. */
  durationMinutes: number;
  /** Coach type that delivers this session. Auto-matched in booking flow. */
  coachType: CoachType;
  /** Base USD price before any discounts. */
  basePriceUsd: number;
  /** Base CNY price before any discounts. */
  basePriceCny: number;
  /** "Best for" bullets (placeholder copy — Emily TBD). */
  bestForPlaceholders: string[];
  /** What you get bullets (placeholder copy — Emily TBD). */
  whatYouGetPlaceholders: string[];
  /** Mile cost (0 for pure sessions). CPI deep-dive = 0 — it's a session product. */
  mileCost: 0;
  /** True for the CPI flagship deep-dive (includes CPI assessment). */
  isCpiFlagship: boolean;
  /** Minimum tier required to book. CPI deep-dive = Council-only. */
  requiredTier: TierKey;
  /** Whether this session type can be covered by complimentary allocation. */
  eligibleForComplimentary: boolean;
  /** Sort order in catalog listings. */
  sortOrder: number;
}

/**
 * Canonical session catalog. Source: Tier Feature Matrix v4.1 — Stream 3.
 *
 * 4 standard types + CPI deep-dive = 5 session types total.
 * Prices LOCKED per Pricing v1.1:
 *   30min Career:    $149 / ¥348
 *   45min Executive: $249 / ¥581
 *   60min Leadership: $349 / ¥815
 *   90min CPI Deep-Dive: $599 / ¥1398 (Council-only, includes CPI assessment)
 */
export const SESSION_TYPES: Record<SessionSlug, SessionType> = {
  'career-30': {
    slug: 'career-30',
    displayName: '[Emily: 30min Career Session display name — placeholder. e.g. "Career Check-In"]',
    shortDescriptor: '[Emily: 30min session short descriptor — placeholder. Career positioning, next-move clarity.]',
    durationMinutes: 30,
    coachType: 'career_coach',
    basePriceUsd: 149,
    basePriceCny: 348,
    bestForPlaceholders: [
      '[Emily: "best for" bullet 1 — placeholder. e.g. "Leaders planning their next role move"]',
      '[Emily: "best for" bullet 2 — placeholder. e.g. "Quick positioning review before interviews"]',
      '[Emily: "best for" bullet 3 — placeholder. e.g. "Post-offer decision support"]',
    ],
    whatYouGetPlaceholders: [
      '[Emily: "what you get" bullet 1 — placeholder. e.g. "30-min 1:1 video with certified career coach"]',
      '[Emily: "what you get" bullet 2 — placeholder. e.g. "Written action summary + next-step recommendations"]',
      '[Emily: "what you get" bullet 3 — placeholder. e.g. "Calendar invite + 24h cancellation policy"]',
    ],
    mileCost: 0,
    isCpiFlagship: false,
    requiredTier: 'explorer',
    eligibleForComplimentary: true,
    sortOrder: 1,
  },
  'executive-45': {
    slug: 'executive-45',
    displayName: '[Emily: 45min Executive Session display name — placeholder. e.g. "Executive Deep-Dive"]',
    shortDescriptor: '[Emily: 45min session short descriptor — placeholder. C-suite operating, stakeholder impact, executive presence.]',
    durationMinutes: 45,
    coachType: 'executive_coach',
    basePriceUsd: 249,
    basePriceCny: 581,
    bestForPlaceholders: [
      '[Emily: "best for" bullet 1 — placeholder. e.g. "Directors / SVPs preparing for C-suite roles"]',
      '[Emily: "best for" bullet 2 — placeholder. e.g. "Stakeholder management challenges at the top"]',
      '[Emily: "best for" bullet 3 — placeholder. e.g. "Executive presence and communication polish"]',
    ],
    whatYouGetPlaceholders: [
      '[Emily: "what you get" bullet 1 — placeholder. e.g. "45-min 1:1 video with executive coach"]',
      '[Emily: "what you get" bullet 2 — placeholder. e.g. "Structured debrief + development prioritisation"]',
      '[Emily: "what you get" bullet 3 — placeholder. e.g. "Written action summary within 48 hours"]',
    ],
    mileCost: 0,
    isCpiFlagship: false,
    requiredTier: 'explorer',
    eligibleForComplimentary: false,
    sortOrder: 2,
  },
  'leadership-60': {
    slug: 'leadership-60',
    displayName: '[Emily: 60min Leadership Session display name — placeholder. e.g. "Leadership Strategy Session"]',
    shortDescriptor: '[Emily: 60min session short descriptor — placeholder. Team leadership, organisational impact, broader scope.]',
    durationMinutes: 60,
    coachType: 'leadership_coach',
    basePriceUsd: 349,
    basePriceCny: 815,
    bestForPlaceholders: [
      '[Emily: "best for" bullet 1 — placeholder. e.g. "Leaders of teams or functions needing strategy work"]',
      '[Emily: "best for" bullet 2 — placeholder. e.g. "Organisational change and restructuring support"]',
      '[Emily: "best for" bullet 3 — placeholder. e.g. "Cross-functional stakeholder alignment challenges"]',
    ],
    whatYouGetPlaceholders: [
      '[Emily: "what you get" bullet 1 — placeholder. e.g. "60-min 1:1 video with leadership coach"]',
      '[Emily: "what you get" bullet 2 — placeholder. e.g. "Comprehensive leadership impact review"]',
      '[Emily: "what you get" bullet 3 — placeholder. e.g. "Prioritised 30/60/90-day development plan"]',
    ],
    mileCost: 0,
    isCpiFlagship: false,
    requiredTier: 'explorer',
    eligibleForComplimentary: true,
    sortOrder: 3,
  },
  'cpi-deepdive-90': {
    slug: 'cpi-deepdive-90',
    displayName: '[Emily: CPI Deep-Dive 90min display name — placeholder. e.g. "CPI Flagship Deep-Dive"]',
    shortDescriptor: '[Emily: CPI deep-dive short descriptor — placeholder. 90-min CPI specialist session including CPI diagnostic, pipeline health review, and China leadership context.]',
    durationMinutes: 90,
    coachType: 'cpi_specialist',
    basePriceUsd: 599,
    basePriceCny: 1398,
    bestForPlaceholders: [
      '[Emily: "best for" bullet 1 — placeholder. e.g. "Council-tier members wanting the full CPI analysis"]',
      '[Emily: "best for" bullet 2 — placeholder. e.g. "Leaders evaluating China pipeline readiness"]',
      '[Emily: "best for" bullet 3 — placeholder. e.g. "Organisations needing executive team pipeline health data"]',
    ],
    whatYouGetPlaceholders: [
      '[Emily: "what you get" bullet 1 — placeholder. e.g. "90-min 1:1 video with certified CPI specialist"]',
      '[Emily: "what you get" bullet 2 — placeholder. e.g. "Full CPI diagnostic included (Flagship, 5 miles value)"]',
      '[Emily: "what you get" bullet 3 — placeholder. e.g. "Comprehensive pipeline health report + prioritised actions"]',
      '[Emily: "what you get" bullet 4 — placeholder. e.g. "Written CPI debrief document within 72 hours"]',
    ],
    mileCost: 0,
    isCpiFlagship: true,
    requiredTier: 'council',
    eligibleForComplimentary: false,
    sortOrder: 4,
  },
};

/** Ordered array for listings. */
export const SESSION_CATALOG: SessionType[] = Object.values(SESSION_TYPES).sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

/** Slug lookup helper. */
export function getSessionType(slug: string): SessionType | null {
  return (SESSION_TYPES as Record<string, SessionType | undefined>)[slug] ?? null;
}

// ═══════════════════════════════════════════════════════════════════════
// §3 — Tier discount mapping
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-tier discount percentages for human debrief sessions.
 * Source: Tier Feature Matrix v4.1 — Stream 3.
 *
 * Explorer:     0%
 * Starter:      10%
 * Pro:          15%
 * Executive:    20%
 * Council:      25%
 */
export const TIER_SESSION_DISCOUNTS: Record<TierKey, number> = {
  explorer: 0,
  starter: 10,
  professional: 15,
  executive: 20,
  council: 25,
};

/** Annual +10% stacking bonus (sessions only — applies on TOP of tier discount). */
export const ANNUAL_SESSION_STACKING_PERCENT = 10;

// ═══════════════════════════════════════════════════════════════════════
// §4 — Complimentary session allocation (Ticket 8 + Ticket 9)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Monthly complimentary session allocation by tier.
 * Source: Tier Feature Matrix v4.1 — Stream 3.
 *
 * Executive: 1 × 30min session / month (covers career-30 type)
 * Council:   2 × 60min sessions / month (covers leadership-60 type)
 *
 * All other tiers: 0 complimentary sessions.
 *
 * Allocations reset on BILLING CYCLE date, NOT calendar month.
 * Complimentary sessions do NOT roll over.
 */
export interface ComplimentaryAllocation {
  /** Number of sessions per month. */
  count: number;
  /** Which session slug this allocation covers (matching duration). */
  coversSessionSlug: SessionSlug;
  /** Max duration (minutes) the allocation covers — for upgrade partial credit. */
  coversDurationMinutes: number;
}

export const COMPLIMENTARY_SESSION_ALLOCATION: Record<TierKey, ComplimentaryAllocation | null> = {
  explorer: null,
  starter: null,
  professional: null,
  executive: {
    count: 1,
    coversSessionSlug: 'career-30',
    coversDurationMinutes: 30,
  },
  council: {
    count: 2,
    coversSessionSlug: 'leadership-60',
    coversDurationMinutes: 60,
  },
};

/**
 * Complimentary session usage tracking structure.
 * This is what the backend would persist per user per billing cycle.
 */
export interface ComplimentarySessionUsage {
  userId: string;
  tier: TierKey;
  /** Cycle start date = user's subscription renewal date. */
  cycleStartDate: string;
  cycleEndDate: string;
  /** Allocation granted this cycle. */
  allocatedCount: number;
  /** Number of complimentary sessions USED this cycle. */
  usedCount: number;
  /** Covers slug (from allocation config). */
  coversSessionSlug: SessionSlug;
  coversDurationMinutes: number;
  /** IDs of bookings where complimentary was applied. */
  appliedBookingIds: string[];
}

/**
 * Compute remaining complimentary sessions for a cycle.
 */
export function computeComplimentaryRemaining(usage: ComplimentarySessionUsage): number {
  return Math.max(0, usage.allocatedCount - usage.usedCount);
}

/**
 * Check if a complimentary allocation covers a specific session type.
 * If the session duration matches exactly → full cover.
 * If the session duration is LONGER → partial credit available (see calculateSessionPrice).
 */
export function allocationCoversSession(
  allocation: ComplimentaryAllocation,
  session: SessionType,
): 'full' | 'partial' | 'none' {
  if (session.slug === allocation.coversSessionSlug) return 'full';
  if (session.durationMinutes > allocation.coversDurationMinutes) return 'partial';
  return 'none';
}

// ═══════════════════════════════════════════════════════════════════════
// §5 — Discount Calculation Engine (Ticket 9)
// ═══════════════════════════════════════════════════════════════════════

export type BillingCycle = 'monthly' | 'annual';
export type PricingCurrency = 'USD' | 'CNY';

/**
 * Inputs for the unified session price calculator.
 */
export interface SessionPriceInput {
  session: SessionType;
  userTier: TierKey | string | null | undefined;
  billingCycle: BillingCycle;
  currency: PricingCurrency;
  /** Optional: apply complimentary session credit. */
  applyComplimentaryCredit?: boolean;
  /** If partial credit: complimentary allocation coversDurationMinutes. */
  complimentaryCoverMinutes?: number;
  /** If partial credit: complimentary base price to deduct (USD or CNY). */
  complimentaryCreditAmount?: number;
}

export interface SessionPriceBreakdown {
  /** Original base price before any discounts. */
  basePrice: number;
  /** Tier discount amount in currency. */
  tierDiscountAmount: number;
  /** Tier discount percentage (0-25). */
  tierDiscountPercent: number;
  /** Annual stacking discount amount in currency. */
  annualDiscountAmount: number;
  /** Annual stacking percentage (0 or 10). */
  annualDiscountPercent: number;
  /** Complimentary credit amount in currency (0 if not applied). */
  complimentaryCreditAmount: number;
  /** Final price after ALL discounts. */
  finalPrice: number;
  /** Total savings in currency (base - final). */
  totalSaved: number;
  /** Total savings as percentage of base (0-100). */
  totalSavingsPercent: number;
  /** Whether the entire session is free (complimentary fully covers). */
  isFullyComplimentary: boolean;
  /** Formatted tier discount for display, e.g. "15% off". */
  tierDiscountLabel: string;
  /** Formatted annual discount for display. */
  annualDiscountLabel: string;
  /** Whether user qualifies for any discount. */
  hasAnyDiscount: boolean;
}

/**
 * UNIFIED DISCOUNT CALCULATOR for debrief sessions (Ticket 9).
 *
 * STACK ORDER (strict):
 *   1. Tier discount  (from base price)
 *   2. Annual +10%    (stacked on top of tier-discounted price)
 *   3. Complimentary  (credit deducted last)
 *
 * Formula (before complimentary):
 *   discounted = base × (1 - tier_discount/100) × (1 - (annual ? 10/100 : 0))
 *
 * Complimentary: if fully covered → final = 0.
 *                if partial credit → deduct the covered session's base price from final.
 *
 * Source: Tier Feature Matrix v4.1 — Stream 3 pricing + annual stacking.
 */
export function calculateSessionPrice(input: SessionPriceInput): SessionPriceBreakdown {
  const {
    session,
    userTier,
    billingCycle,
    currency,
    applyComplimentaryCredit = false,
    complimentaryCreditAmount = 0,
  } = input;

  // 1. Base price (USD or CNY)
  const basePrice = currency === 'USD' ? session.basePriceUsd : session.basePriceCny;

  // 2. Tier discount
  const canonicalTier = normalizeTier(userTier) ?? 'explorer';
  const tierDiscountPercent = TIER_SESSION_DISCOUNTS[canonicalTier];
  const afterTier = basePrice * (1 - tierDiscountPercent / 100);
  const tierDiscountAmount = basePrice - afterTier;

  // 3. Annual +10% stacking (on TOP of tier-discounted price)
  const annualDiscountPercent = billingCycle === 'annual' ? ANNUAL_SESSION_STACKING_PERCENT : 0;
  const afterAnnual = afterTier * (1 - annualDiscountPercent / 100);
  const annualDiscountAmount = afterTier - afterAnnual;

  // 4. Complimentary credit
  let finalComplimentaryCredit = 0;
  let isFullyComplimentary = false;

  if (applyComplimentaryCredit) {
    if (complimentaryCreditAmount >= afterAnnual) {
      // Full cover
      finalComplimentaryCredit = afterAnnual;
      isFullyComplimentary = true;
    } else {
      // Partial credit
      finalComplimentaryCredit = complimentaryCreditAmount;
    }
  }

  const finalPrice = Math.max(0, Math.round(afterAnnual - finalComplimentaryCredit));
  const totalSaved = basePrice - finalPrice;
  const totalSavingsPercent = basePrice > 0 ? Math.round((totalSaved / basePrice) * 100) : 0;

  return {
    basePrice,
    tierDiscountAmount: Math.round(tierDiscountAmount * 100) / 100,
    tierDiscountPercent,
    annualDiscountAmount: Math.round(annualDiscountAmount * 100) / 100,
    annualDiscountPercent,
    complimentaryCreditAmount: Math.round(finalComplimentaryCredit * 100) / 100,
    finalPrice,
    totalSaved,
    totalSavingsPercent,
    isFullyComplimentary,
    tierDiscountLabel: tierDiscountPercent > 0 ? `${tierDiscountPercent}% off` : '',
    annualDiscountLabel: annualDiscountPercent > 0 ? `Extra ${annualDiscountPercent}% off (annual)` : '',
    hasAnyDiscount: tierDiscountPercent > 0 || annualDiscountPercent > 0 || finalComplimentaryCredit > 0,
  };
}

/**
 * Format a session price for display.
 */
export function formatSessionPrice(amount: number, currency: PricingCurrency): string {
  if (currency === 'CNY') return `¥${amount}`;
  return `$${amount}`;
}

/**
 * Get complimentary allocation for a tier.
 * Returns null if tier has no complimentary sessions.
 */
export function getComplimentaryAllocation(
  tier: TierKey | string | null | undefined,
): ComplimentaryAllocation | null {
  const canonical = normalizeTier(tier);
  if (!canonical) return null;
  return COMPLIMENTARY_SESSION_ALLOCATION[canonical];
}

/**
 * Get the complimentary credit value (base price) for a tier's allocation.
 * Used for partial credit display when upgrading to longer sessions.
 */
export function getComplimentaryCreditValue(
  tier: TierKey | string | null | undefined,
  currency: PricingCurrency,
): number {
  const alloc = getComplimentaryAllocation(tier);
  if (!alloc) return 0;
  const coveredSession = SESSION_TYPES[alloc.coversSessionSlug];
  return currency === 'USD' ? coveredSession.basePriceUsd : coveredSession.basePriceCny;
}

// ═══════════════════════════════════════════════════════════════════════
// §6 — Booking status + Coach roster (placeholder)
// ═══════════════════════════════════════════════════════════════════════

export type BookingStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export interface CoachRosterEntry {
  id: string;
  name: string;
  type: CoachType;
  /** Placeholder bio (Emily copy TBD). */
  bioPlaceholder: string;
  /** Placeholder avatar initials or image URL. */
  avatarInitials: string;
  /** Working hours timezone (IANA tz). */
  timezone: string;
  /** Coach types this coach is qualified to deliver. */
  canDeliver: CoachType[];
}

/**
 * Placeholder coach roster — real bios TBD from Emily/operations.
 * Just enough data for the roster section and booking coach selection.
 */
export const COACH_ROSTER: CoachRosterEntry[] = [
  {
    id: 'coach_1',
    name: '[Emily: Coach 1 name — placeholder]',
    type: 'career_coach',
    bioPlaceholder: '[Emily: Coach 1 bio — placeholder. 15+ years career coaching experience, APAC executive background.]',
    avatarInitials: 'C1',
    timezone: 'Asia/Shanghai',
    canDeliver: ['career_coach'],
  },
  {
    id: 'coach_2',
    name: '[Emily: Coach 2 name — placeholder]',
    type: 'executive_coach',
    bioPlaceholder: '[Emily: Coach 2 bio — placeholder. Former Fortune 500 C-suite, now executive coach for APAC leaders.]',
    avatarInitials: 'C2',
    timezone: 'Asia/Singapore',
    canDeliver: ['executive_coach'],
  },
  {
    id: 'coach_3',
    name: '[Emily: Coach 3 name — placeholder]',
    type: 'leadership_coach',
    bioPlaceholder: '[Emily: Coach 3 bio — placeholder. Leadership development consultant, 20+ years team leadership experience.]',
    avatarInitials: 'C3',
    timezone: 'Asia/Shanghai',
    canDeliver: ['leadership_coach'],
  },
  {
    id: 'coach_4',
    name: '[Emily: Coach 4 name — placeholder]',
    type: 'cpi_specialist',
    bioPlaceholder: '[Emily: Coach 4 bio — placeholder. Certified CPI methodology specialist, China leadership pipeline expert.]',
    avatarInitials: 'C4',
    timezone: 'Asia/Shanghai',
    canDeliver: ['cpi_specialist', 'leadership_coach'],
  },
];

/**
 * Filter roster by coach type (for booking flow auto-matching).
 */
export function getCoachesForType(type: CoachType): CoachRosterEntry[] {
  return COACH_ROSTER.filter((c) => c.canDeliver.includes(type));
}

// ═══════════════════════════════════════════════════════════════════════
// §7 — Cancellation policy (data, not UI)
// ═══════════════════════════════════════════════════════════════════════

/** Cancel up to 24h before for full refund. */
export const CANCELLATION_FREE_HOURS_BEFORE = 24;

/** Late cancellation (within 24h) = 50% charge. */
export const LATE_CANCELLATION_CHARGE_PERCENT = 50;

/** No-show = 100% charge. */
export const NO_SHOW_CHARGE_PERCENT = 100;
