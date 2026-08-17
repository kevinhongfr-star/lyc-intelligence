/**
 * miles.ts — Single source of truth for ALL mile numbers and rules.
 *
 * Batch 2 / Ticket 1 + 4: Mile economy configuration.
 *
 * All numbers are LOCKED per spec. No hardcoded costs anywhere else.
 * Miles are the product's internal unit. The UI says "miles" plainly.
 *
 * Consumption order: allocated miles → purchased miles.
 * Explorer complimentary tokens are independent (not miles).
 */

// ═══════════════════════════════════════════════════════════════════════
// Monthly allocation by tier
// ═══════════════════════════════════════════════════════════════════════

import { type TierKey, normalizeTier } from './tiers';

/**
 * Monthly mile allocation per tier.
 * Explorer gets 0 monthly (they get one-time complimentary tokens instead — Ticket 2).
 */
export const MONTHLY_ALLOCATION: Record<TierKey, number> = {
  explorer: 0,
  starter: 2,
  professional: 5,
  executive: 10,
  council: 20,
};

// ═══════════════════════════════════════════════════════════════════════
// Rollover rules
// ═══════════════════════════════════════════════════════════════════════

/** 50% of unused monthly miles roll over to next month. */
export const ROLLOVER_PERCENT = 50;

/** Max accumulation: 3 months of rollover. Anything beyond expires. */
export const ROLLOVER_MAX_MONTHS = 3;

// ═══════════════════════════════════════════════════════════════════════
// Mile pack purchasing
// ═══════════════════════════════════════════════════════════════════════

export interface MilePack {
  id: string;
  miles: number;
  priceUsd: number;
  priceCny: number;
  label: string;
}

export const MILE_PACKS: MilePack[] = [
  { id: 'pack_1',  miles: 1,  priceUsd: 49,  priceCny: 115, label: '1 mile' },
  { id: 'pack_5',  miles: 5,  priceUsd: 199, priceCny: 465, label: '5 miles' },
  { id: 'pack_15', miles: 15, priceUsd: 499, priceCny: 1165, label: '15 miles' },
];

/** Purchased miles expire 12 months from purchase date. */
export const PURCHASED_MILES_EXPIRY_MONTHS = 12;

/** Expiry reminder sent N days before expiry. */
export const EXPIRY_REMINDER_DAYS = 30;

// ═══════════════════════════════════════════════════════════════════════
// Per-instrument mile cost
// ═══════════════════════════════════════════════════════════════════════

export type MileCostTier = 'light' | 'standard' | 'signature' | 'flagship';

/**
 * INTERNAL-ONLY tier category metadata. Used for analytics / grouping only.
 * NEVER surfaces to users — user-facing labels show mile counts (see getMileLabel).
 * (P0-4: category names must not leak to UI; primary label = "X miles")
 */
export const MILE_COST_TIERS: Record<MileCostTier, { miles: number; label: string }> = {
  light:     { miles: 1, label: 'Light' },
  standard:  { miles: 2, label: 'Standard' },
  signature: { miles: 3, label: 'Signature' },
  flagship:  { miles: 5, label: 'Flagship' },
};

/**
 * Per-instrument mile cost. The canonical mapping — single source of truth.
 * Spec: All numbers locked. (P0-5)
 *
 * ┌────────────┬──────────────────────────────────────────────┐
 * │ Mile Cost  │ Instruments                                  │
 * ├────────────┼──────────────────────────────────────────────┤
 * │ 1 mile     │ SPARK, COACH                                 │
 * │ 2 miles    │ PRISM, IMPACT, BRIDGE, DRIVE, MOSAIC         │
 * │ 3 miles    │ FORGE, LEAP, QUEST                           │
 * │ 5 miles    │ CPI                                          │
 * └────────────┴──────────────────────────────────────────────┘
 *
 * All cost displays, gating logic, and NEXUS chat recommendations read from
 * this table. No hardcoded costs anywhere.
 */
export const INSTRUMENT_MILE_COST: Record<string, number> = {
  SPARK:   1,
  COACH:   1,
  PRISM:   2,
  IMPACT:  2,
  BRIDGE:  2,
  DRIVE:   2,
  MOSAIC:  2,
  FORGE:   3,
  LEAP:    3,
  QUEST:   3,
  CPI:     5,
};

/**
 * Reverse lookup: which tier does an instrument's cost belong to?
 */
export function getInstrumentCostTier(instrumentCode: string): MileCostTier {
  const cost = INSTRUMENT_MILE_COST[instrumentCode];
  if (cost === undefined) return 'standard';
  if (cost <= 1) return 'light';
  if (cost <= 2) return 'standard';
  if (cost <= 3) return 'signature';
  return 'flagship';
}

/**
 * Get the mile cost for an instrument. Returns 0 for unknown instruments
 * (they should not be charged).
 */
export function getInstrumentMileCost(instrumentCode: string): number {
  return INSTRUMENT_MILE_COST[instrumentCode] ?? 0;
}

/**
 * Get the USER-FACING mile label for an instrument (P0-4).
 * Returns "X miles" (or "1 mile" singular). Never returns category names
 * (light/standard/signature/flagship) — those are internal-only.
 */
export function getMileLabel(instrumentCode: string): string {
  const cost = getInstrumentMileCost(instrumentCode);
  return `${cost} ${cost === 1 ? 'mile' : 'miles'}`;
}

// ═══════════════════════════════════════════════════════════════════════
// Explorer complimentary assessments
// ═══════════════════════════════════════════════════════════════════════

/**
 * Explorer tier gets LEAP + PRISM complimentary as one-time onboarding tokens.
 * These are NOT miles — they're complimentary assessment tokens.
 * No rollover, no expiry (one-time signup bonus).
 */
export const EXPLORER_FREE_ASSESSMENTS: string[] = ['LEAP', 'PRISM'];

// ═══════════════════════════════════════════════════════════════════════
// CPI gating
// ═══════════════════════════════════════════════════════════════════════

/** CPI is Council-only. Lower tiers see an upgrade prompt. */
export const CPI_REQUIRED_TIER: TierKey = 'council';

// ═══════════════════════════════════════════════════════════════════════
// Refund policy
// ═══════════════════════════════════════════════════════════════════════

/** If user abandons within first N questions, miles are refunded. */
export const ABANDON_REFUND_QUESTION_THRESHOLD = 2;

// ═══════════════════════════════════════════════════════════════════════
// Transaction types (for ledger)
// ═══════════════════════════════════════════════════════════════════════

export type MileTransactionType =
  | 'allocation'    // Monthly tier allocation
  | 'rollover'      // Rollover from previous month
  | 'rollover_expiry' // Expired rollover miles
  | 'purchase'      // Pack purchase
  | 'purchase_expiry' // Expired purchased miles
  | 'spend'         // Assessment completion deduction
  | 'refund'        // Assessment abandon refund
  | 'admin_adjust'  // Manual admin adjustment
  | 'earn';         // NEXUS earning

export type MileBalanceType = 'allocated' | 'rollover' | 'purchased';

export interface MileTransaction {
  id?: string;
  user_id: string;
  amount: number;          // Positive = credit, negative = debit
  type: MileTransactionType;
  balance_type: MileBalanceType | 'free';
  description: string;
  instrument_code?: string | null;
  assessment_id?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Balance interface
// ═══════════════════════════════════════════════════════════════════════

export interface MileBalance {
  user_id: string;
  allocated_miles: number;
  rollover_miles: number;
  purchased_miles: number;
  /** Total spendable = allocated + rollover + purchased. */
  total: number;
  /** Expiry date for purchased miles (oldest unexpired batch). */
  purchased_miles_expiry: string | null;
  /** Date of last monthly allocation reset. */
  last_allocation_date: string | null;
  tier: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Pure calculation functions (testable without DB)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compute rollover amount from unused allocated miles.
 * 50% of unused miles roll over, capped at 3 months of allocation.
 */
export function computeRollover(
  unusedAllocated: number,
  currentRollover: number,
  tierAllocation: number,
): { rolloverAdd: number; newRollover: number; expired: number } {
  const rolloverAdd = Math.floor(unusedAllocated * (ROLLOVER_PERCENT / 100));
  const rolloverCap = tierAllocation * ROLLOVER_MAX_MONTHS;
  const newRollover = Math.min(currentRollover + rolloverAdd, rolloverCap);
  const expired = Math.max(currentRollover + rolloverAdd - rolloverCap, 0);
  return { rolloverAdd, newRollover, expired };
}

/**
 * Compute total balance from components.
 */
export function computeTotalBalance(
  allocated: number,
  rollover: number,
  purchased: number,
): number {
  return allocated + rollover + purchased;
}

/**
 * Check if user can afford an instrument's mile cost.
 */
export function canAfford(balance: number, instrumentCode: string): boolean {
  const cost = getInstrumentMileCost(instrumentCode);
  return balance >= cost;
}

/**
 * Get monthly allocation for a tier.
 */
export function getMonthlyAllocation(tier: string | null | undefined): number {
  const canonical = normalizeTier(tier) ?? 'explorer';
  return MONTHLY_ALLOCATION[canonical] ?? 0;
}
