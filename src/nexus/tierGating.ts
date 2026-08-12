/**
 * tierGating.ts — NEXUS Tier Gating Enforcement Layer (#41 spec)
 *
 * TierGate encapsulates all tier-based access enforcement: capability checks,
 * context size limits, miles cost gating, Pro routing, diagnostic access matrix,
 * and rate limits. All enforcement centralised so callers do not re-implement
 * rules inconsistently.
 */

import {
  TierKey,
  DIAGNOSTIC_SLUGS,
  DiagnosticSlug,
  canAccessDiagnostic,
  tierDisplayName,
  tierMeets,
} from '@/config/tierConfig';
import {
  UserContextAssembled,
  NexCapability,
  userHasCapability,
  getCapabilitiesForTier,
} from '@/nexus/contextAssembler';

// ─────────────────────────────────────────────────────────────────────────────
// ERROR TYPES
// ─────────────────────────────────────────────────────────────────────────────

export class TierGateError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'TierGateError';
    this.code = code;
    this.details = details;
  }
}

export class CapabilityMissingError extends TierGateError {
  public readonly missingCapability: NexCapability;

  constructor(capability: NexCapability, tier: TierKey) {
    super(
      'CAPABILITY_MISSING',
      `Tier "${tierDisplayName(tier)}" does not include capability: ${capability}`,
      { capability, tier }
    );
    this.missingCapability = capability;
  }
}

export class ContextSizeExceededError extends TierGateError {
  public readonly model: 'flash' | 'pro';
  public readonly actual: number;
  public readonly limit: number;

  constructor(model: 'flash' | 'pro', actual: number, limit: number) {
    super(
      'CONTEXT_SIZE_EXCEEDED',
      `${model.toUpperCase()} model context limit is ${limit.toLocaleString()} chars, got ${actual.toLocaleString()}`,
      { model, actual, limit }
    );
    this.model = model;
    this.actual = actual;
    this.limit = limit;
  }
}

export class InsufficientMilesError extends TierGateError {
  public readonly cost: number;
  public readonly balance: number;

  constructor(cost: number, balance: number) {
    super(
      'INSUFFICIENT_MILES',
      `Insufficient miles: need ${cost} mi, balance is ${balance} mi`,
      { cost, balance }
    );
    this.cost = cost;
    this.balance = balance;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (#41 spec)
// ─────────────────────────────────────────────────────────────────────────────

export const CONTEXT_CHAR_LIMITS = {
  flash: 12_000,
  pro: 32_000,
} as const;

export type ContextModel = keyof typeof CONTEXT_CHAR_LIMITS;

export interface RateLimits {
  daily_recommendation_limit: number;
  daily_content_lookup_limit: number;
}

const DEFAULT_CONTENT_LOOKUP_LIMIT = 50;

const RECOMMENDATION_CAPABILITY_TO_LIMIT: Partial<Record<NexCapability, number>> = {
  '3_recommendations_daily': 3,
  '7_recommendations_daily': 7,
  '15_recommendations_daily': 15,
};

// ─────────────────────────────────────────────────────────────────────────────
// TierGate CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class TierGate {
  public readonly tierKey: TierKey;
  public readonly context: UserContextAssembled;

  constructor(tierKey: TierKey, context: UserContextAssembled) {
    this.tierKey = tierKey;
    this.context = context;
  }

  // ── 1. Capability assertion ────────────────────────────────────────────

  /**
   * Assert the user's tier has the given capability.
   * Returns true if present, throws CapabilityMissingError otherwise.
   * Also returns a boolean check side-effect-free via the same call.
   */
  assertCapability(capability: NexCapability): boolean {
    const has = userHasCapability(this.tierKey, capability);
    if (!has) {
      throw new CapabilityMissingError(capability, this.tierKey);
    }
    return true;
  }

  /**
   * Non-throwing capability check. Returns boolean only.
   */
  hasCapability(capability: NexCapability): boolean {
    return userHasCapability(this.tierKey, capability);
  }

  // ── 2. Context size enforcement ────────────────────────────────────────

  /**
   * Enforce per-model context character limits.
   * Flash: 12,000 chars max; Pro: 32,000 chars max.
   * Throws ContextSizeExceededError if over limit, otherwise returns true.
   */
  enforceContextSize(context: string, model: ContextModel): boolean {
    const actual = (context ?? '').length;
    const limit = CONTEXT_CHAR_LIMITS[model];
    if (actual > limit) {
      throw new ContextSizeExceededError(model, actual, limit);
    }
    return true;
  }

  /**
   * Non-throwing context size check. Returns actual/limit/ok tuple.
   */
  checkContextSize(context: string, model: ContextModel): {
    actual: number;
    limit: number;
    ok: boolean;
  } {
    const actual = (context ?? '').length;
    const limit = CONTEXT_CHAR_LIMITS[model];
    return {
      actual,
      limit,
      ok: actual <= limit,
    };
  }

  // ── 3. Miles cost enforcement ──────────────────────────────────────────

  /**
   * Enforce a miles cost against a current balance.
   * Throws InsufficientMilesError if balance < cost, otherwise returns true.
   */
  enforceMilesCost(costMiles: number, currentBalance: number): boolean {
    if (costMiles <= 0) return true;
    if (currentBalance < costMiles) {
      throw new InsufficientMilesError(costMiles, currentBalance);
    }
    return true;
  }

  /**
   * Non-throwing miles check. Returns boolean.
   */
  canAffordMiles(costMiles: number, currentBalance: number): boolean {
    if (costMiles <= 0) return true;
    return currentBalance >= costMiles;
  }

  /**
   * Enforce using the assembled context's miles_balance.balance.
   */
  enforceMilesCostFromContext(costMiles: number): boolean {
    return this.enforceMilesCost(costMiles, this.context.miles_balance.balance);
  }

  // ── 4. Pro routing check ───────────────────────────────────────────────

  /**
   * Whether the user's tier allows routing to Nexus Pro model.
   * TRUE if tier includes `nexus_pro_included` directly,
   * OR tier both has flash access AND `pro_upgrades_available`.
   */
  canRouteToPro(): boolean {
    if (this.hasCapability('nexus_pro_included')) {
      return true;
    }
    const hasFlash = this.hasCapability('nexus_flash_chat') || this.hasCapability('unlimited_flash');
    const hasUpgradePath = this.hasCapability('pro_upgrades_available');
    return hasFlash && hasUpgradePath;
  }

  // ── 5. Diagnostic access matrix ────────────────────────────────────────

  /**
   * Per-diagnostic access matrix built from tierConfig.canAccessDiagnostic.
   * Returns an object keyed by diagnostic slug with { accessible, requires_tier }.
   */
  diagnosticAccessMatrix(): Record<
    string,
    {
      accessible: boolean;
      requires_tier: TierKey;
      display_name: string;
    }
  > {
    const DIAGNOSTIC_TIER_REQUIREMENT: Record<string, TierKey> = {
      prism: 'executive_introduction',
      spark: 'executive_introduction',
      forge: 'professional',
      bridge: 'professional',
      mosaic: 'professional',
      drive: 'executive',
    };

    const out: Record<
      string,
      {
        accessible: boolean;
        requires_tier: TierKey;
        display_name: string;
      }
    > = {};

    for (const slug of DIAGNOSTIC_SLUGS) {
      const slugLower = slug.toLowerCase() as DiagnosticSlug;
      const requiresTier = DIAGNOSTIC_TIER_REQUIREMENT[slugLower] ?? 'professional';
      out[slugLower] = {
        accessible: canAccessDiagnostic(this.tierKey, slugLower),
        requires_tier: requiresTier,
        display_name: tierDisplayName(requiresTier),
      };
    }

    return out;
  }

  // ── 6. Rate limits ─────────────────────────────────────────────────────

  /**
   * Derive rate limits from the tier's capability set (#41 rate limits table).
   *   - daily_recommendation_limit: matched from X_recommendations_daily caps
   *     (3 for Professional, 7 for Executive, 15 for Council/Enterprise;
   *      Executive Introduction defaults to 1)
   *   - daily_content_lookup_limit: currently a flat generous default;
   *     Enterprise tiers lift to unlimited (Infinity).
   */
  getRateLimits(): RateLimits {
    const caps = getCapabilitiesForTier(this.tierKey);

    let recommendationLimit = 1;
    for (const cap of caps) {
      if (cap in RECOMMENDATION_CAPABILITY_TO_LIMIT) {
        recommendationLimit = RECOMMENDATION_CAPABILITY_TO_LIMIT[cap] as number;
      }
    }

    let contentLookupLimit = DEFAULT_CONTENT_LOOKUP_LIMIT;
    if (tierMeets(this.tierKey, 'enterprise')) {
      contentLookupLimit = Number.POSITIVE_INFINITY;
    } else if (tierMeets(this.tierKey, 'council')) {
      contentLookupLimit = 500;
    } else if (tierMeets(this.tierKey, 'executive')) {
      contentLookupLimit = 200;
    } else if (tierMeets(this.tierKey, 'professional')) {
      contentLookupLimit = 100;
    }

    return {
      daily_recommendation_limit: recommendationLimit,
      daily_content_lookup_limit: contentLookupLimit,
    };
  }

  // ── Convenience helpers ────────────────────────────────────────────────

  /**
   * Get a human-readable summary of what this tier can do.
   * Useful for debug UIs and audit logging.
   */
  tierSummary(): {
    tier: TierKey;
    display_name: string;
    capability_count: number;
    route_to_pro: boolean;
    rate_limits: RateLimits;
    diagnostics_accessible: number;
    diagnostics_total: number;
  } {
    const matrix = this.diagnosticAccessMatrix();
    const matrixEntries = Object.values(matrix);

    return {
      tier: this.tierKey,
      display_name: tierDisplayName(this.tierKey),
      capability_count: getCapabilitiesForTier(this.tierKey).length,
      route_to_pro: this.canRouteToPro(),
      rate_limits: this.getRateLimits(),
      diagnostics_accessible: matrixEntries.filter(m => m.accessible).length,
      diagnostics_total: matrixEntries.length,
    };
  }
}
