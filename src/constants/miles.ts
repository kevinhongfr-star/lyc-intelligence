// ═══════════════════════════════════════════════════════════
// Miles Economy Constants — Locked Canonical v1.0
// Batch 6 P0-3 Corrective Pass: Replaces old 99/149/199 mi table
// Authoritative source: Kevin's locked mile cost table (canon)
// ═══════════════════════════════════════════════════════════

/**
 * Mile cost tiers (human-readable labels).
 * These are user-facing — use in pricing copy, UI badges, etc.
 */
export const MILE_COST_TIERS = {
  LIGHT: { miles: 1, label: "Light", tier: 1 },
  STANDARD: { miles: 2, label: "Standard", tier: 2 },
  SIGNATURE: { miles: 3, label: "Signature", tier: 3 },
  FLAGSHIP: { miles: 5, label: "Flagship", tier: 5 },
} as const;

export type MileCostTier = (typeof MILE_COST_TIERS)[keyof typeof MILE_COST_TIERS];

/**
 * INSTRUMENT_MILE_COST — The single source of truth for per-instrument mile costs.
 *
 * LOCKED CANON (Kevin, Batch 6 audit):
 *   1 mile (Light)     → LEAP
 *   2 miles (Standard) → PRISM, IMPACT, COACH, DRIVE, QUEST
 *   3 miles (Signature)→ BRIDGE, MOSAIC, SPARK, FORGE
 *   5 miles (Flagship) → CPI
 *
 * NOTE: This mapping OVERWRITES the old 99/149/199 values that were set
 * during the 2B P0-5 corrective. The canon is now 1/2/3/5 mi — NOT ~$1/mi.
 *
 * DO NOT MODIFY without explicit Kevin sign-off.
 */
export const INSTRUMENT_MILE_COST: Readonly<Record<string, number>> = {
  // 1 mile — Light
  LEAP: 1,

  // 2 miles — Standard
  PRISM: 2,
  IMPACT: 2,
  COACH: 2,
  DRIVE: 2,
  QUEST: 2,

  // 3 miles — Signature
  BRIDGE: 3,
  MOSAIC: 3,
  SPARK: 3,
  FORGE: 3,

  // 5 miles — Flagship
  CPI: 5,
};

/** Reverse lookup: which instruments belong to each mile cost tier. */
export const INSTRUMENTS_BY_MILE_COST: Readonly<Record<number, readonly string[]>> = {
  1: ["LEAP"],
  2: ["PRISM", "IMPACT", "COACH", "DRIVE", "QUEST"],
  3: ["BRIDGE", "MOSAIC", "SPARK", "FORGE"],
  5: ["CPI"],
};

/** Get the mile cost tier metadata for a given instrument code. */
export function getMileCostTier(instrumentCode: string): MileCostTier | null {
  const cost = INSTRUMENT_MILE_COST[instrumentCode];
  if (cost === undefined) return null;
  switch (cost) {
    case 1: return MILE_COST_TIERS.LIGHT;
    case 2: return MILE_COST_TIERS.STANDARD;
    case 3: return MILE_COST_TIERS.SIGNATURE;
    case 5: return MILE_COST_TIERS.FLAGSHIP;
    default: return null;
  }
}

/**
 * Monthly miles allocation per subscription tier.
 * From NEXUS Pricing Canonical v1.0 (5 tiers: Explorer → Council).
 */
export const MONTHLY_MILES_BY_TIER: Readonly<Record<string, number>> = {
  explorer: 0,
  starter: 50,
  pro: 150,
  executive: 300,
  council: 600,
};

/**
 * Miles earned per engagement action.
 * Designed for a busy executive engaging 1-2×/week. No daily gamification.
 */
export const MILES_EARNED_PER_ACTION: Readonly<Record<string, number>> = {
  framework_exploration: 5,
  complete_reflection: 3,
  engage_content: 2,
  refer_peer_signup: 25,
  assessment_completion_refund: 10,
  participate_workshop: 10,
};

/**
 * Miles lifecycle rules.
 */
export const MILES_RULES = {
  SUBSCRIPTION_MILES_ROLLOVER: false,
  EARNED_MILES_PERSIST: true,
  ONE_TIME_REFUND_PER_INSTRUMENT: true,
  EXPLORER_EARNING_ALLOWED: false,
} as const;

/** Total valid instruments in the canonical portfolio. */
export const TOTAL_INSTRUMENTS = 11;

/**
 * Validate that the mile cost table is internally consistent.
 * Runs at module import time in dev environments only.
 */
if (import.meta.env?.DEV) {
  const total = Object.values(INSTRUMENTS_BY_MILE_COST).reduce((acc, arr) => acc + arr.length, 0);
  if (total !== TOTAL_INSTRUMENTS) {
    // eslint-disable-next-line no-console
    console.warn(
      `[miles.ts] INSTRUMENTS_BY_MILE_COST lists ${total} instruments, expected ${TOTAL_INSTRUMENTS}.`
    );
  }
  const unmapped = Object.values(INSTRUMENTS_BY_MILE_COST)
    .flat()
    .filter((code) => INSTRUMENT_MILE_COST[code] === undefined);
  if (unmapped.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[miles.ts] Instruments in INSTRUMENTS_BY_MILE_COST missing from INSTRUMENT_MILE_COST: ${unmapped.join(", ")}`);
  }
}
