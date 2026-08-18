// ═══════════════════════════════════════════════════════════
// Cross-Batch Consistency Rules v1.0
// Batch 6 P0 Corrective Pass (Akira canon audit)
//
// Encodes cross-cutting terminology & UX rules that must hold
// across ALL batches (Batch 2 → 6 → future).
//
// P0 fixes encoded:
//   P0-1: No internal codenames in cross-batch checks referencing user-facing
//   P0-3: Cross-batch mile cost verifier uses locked 1/2/3/5 canon
//   P0-4: Positioning verification enforces no "Platform" product descriptor
//   P0-6: Tier name context rule clarified (casual ban vs upgrade allow)
//   P0-7: Tier display name cross-batch validator enforces "Pro" canon
// ═══════════════════════════════════════════════════════════

import {
  APPROVED_DIAGNOSTICS,
  APPROVED_DIAGNOSTIC_CODES,
  TIER_KEYS,
  tierDisplayName,
  checkBannedWord,
  NEXUS_POSITIONING,
  getUserFacingCategoryLabel,
  getApprovedDiagnostic,
} from "./terminologyReference";
import { INSTRUMENT_MILE_COST, TOTAL_INSTRUMENTS } from "./miles";

// ─── Rule Types ─────────────────────────────────────────────────────

export type RuleScope =
  | "nexus-chat"          // NEXUS AI chat output, system prompts
  | "marketing-copy"      // Landing pages, SEO, titles, descriptions
  | "product-ui"          // In-app UI labels, badges, navigation
  | "pricing-billing"     // Pricing pages, upgrade modals, billing surfaces
  | "api-internal"        // API routes, database columns, code identifiers
  | "all-surfaces";       // Everything

export type RuleSeverity = "hard" | "soft" | "context-dependent";

export interface CrossBatchConsistencyRule {
  /** Stable rule ID, e.g. "CBC-TIER-001" */
  id: string;
  /** Which P0 issue(s) this rule enforces */
  p0_refs: readonly string[];
  /** Short title */
  title: string;
  /** Rule severity. hard = always block; soft = warn; context-dependent = see handler */
  severity: RuleSeverity;
  /** Which surfaces/contexts the rule applies to */
  scope: RuleScope | readonly RuleScope[];
  /** Detailed explanation of what's allowed and what's not */
  description: string;
  /** If severity is context-dependent, the detailed breakdown of allowed vs banned contexts */
  contextMatrix?: {
    allowed: readonly string[];
    banned: readonly string[];
  };
  /** Optional automated validator function (input string + context → null=pass or error message) */
  validate?: (input: string, context: RuleScope) => string | null;
}

// ─── RULES TABLE ────────────────────────────────────────────────────

export const CROSS_BATCH_CONSISTENCY_RULES: readonly CrossBatchConsistencyRule[] = [
  // ─── CBC-CODENAME-001 ─ P0-1 ─────────────────────────────────
  {
    id: "CBC-CODENAME-001",
    p0_refs: ["P0-1"],
    title: "Internal codenames NEVER appear in user-facing surfaces",
    severity: "hard",
    scope: ["nexus-chat", "marketing-copy", "product-ui", "pricing-billing"],
    description:
      "SHIFT, CANVAS, TRIDENT, MERIDIAN are internal project codenames. They must never appear in chat output, marketing copy, UI labels, navigation, category chips, or pricing grids. The only permitted location is internal identity.category metadata in backend/diagnostic JSON configs.",
    validate: (input, context) => {
      if (context === "api-internal") return null;
      const matches = input.match(/\b(SHIFT|CANVAS|TRIDENT|MERIDIAN)\b/g);
      if (matches && matches.length > 0) {
        return `Internal codename(s) found in user-facing context: ${[...new Set(matches)].join(", ")}. Use plain-language category labels instead (see getUserFacingCategoryLabel).`;
      }
      return null;
    },
  },

  // ─── CBC-CODENAME-002 ─ P0-1 ─────────────────────────────────
  {
    id: "CBC-CODENAME-002",
    p0_refs: ["P0-1"],
    title: "Cross-batch diagnostic category labels use plain-language (NOT codenames)",
    severity: "hard",
    scope: ["product-ui", "marketing-copy", "nexus-chat"],
    description:
      "When grouping diagnostics into categories across batches, use the 3 plain-language labels: 'Flagship Diagnostic', 'Career Core Diagnostics', 'Advisory Diagnostics'. Never 'SHIFT Suite', 'CANVAS Products', 'TRIDENT Tier', etc.",
    validate: (_input, _context) => {
      // Structural check: verify the canonical labels are defined and cover all 3 categories
      const categories = ["flagship", "career_core", "advisory"] as const;
      const uncovered = categories.filter((c) => {
        const label = getUserFacingCategoryLabel(c === "flagship" ? "CPI" : c === "career_core" ? "LEAP" : "PRISM");
        return !label || /\b(SHIFT|CANVAS|TRIDENT|MERIDIAN)\b/.test(label);
      });
      if (uncovered.length > 0) {
        return `Category label lookup returns codename for: ${uncovered.join(", ")}`;
      }
      return null;
    },
  },

  // ─── CBC-MILES-001 ─ P0-3 ───────────────────────────────────
  {
    id: "CBC-MILES-001",
    p0_refs: ["P0-3"],
    title: "Single source of truth: INSTRUMENT_MILE_COST in miles.ts",
    severity: "hard",
    scope: "all-surfaces",
    description:
      "All per-instrument mile cost references — in catalog.ts, pricing pages, NEXUS prompts, SEO meta, cross-batch checks — must derive from INSTRUMENT_MILE_COST (miles.ts). No batch may define its own copy or override. The locked canon is 1/2/3/5 mi, NOT old 99/149/199.",
    validate: (_input, _context) => {
      const keys = Object.keys(INSTRUMENT_MILE_COST).sort();
      const expected = [...APPROVED_DIAGNOSTIC_CODES].sort();
      if (JSON.stringify(keys) !== JSON.stringify(expected)) {
        return `INSTRUMENT_MILE_COST keys (${keys.join(",")}) do not match APPROVED_DIAGNOSTIC_CODES (${expected.join(",")}).`;
      }
      if (keys.length !== TOTAL_INSTRUMENTS) {
        return `Instrument count mismatch: ${keys.length} vs expected ${TOTAL_INSTRUMENTS}.`;
      }
      return null;
    },
  },

  // ─── CBC-MILES-002 ─ P0-3 ───────────────────────────────────
  {
    id: "CBC-MILES-002",
    p0_refs: ["P0-3"],
    title: "APPROVED_DIAGNOSTICS milesCost must agree with INSTRUMENT_MILE_COST",
    severity: "hard",
    scope: "all-surfaces",
    description:
      "Structural consistency: every entry in APPROVED_DIAGNOSTICS must have milesCost === INSTRUMENT_MILE_COST[code]. If they diverge, one batch is using stale values.",
    validate: (_input, _context) => {
      const mismatches: string[] = [];
      for (const d of APPROVED_DIAGNOSTICS) {
        const canon = INSTRUMENT_MILE_COST[d.code];
        if (canon === undefined) {
          mismatches.push(`${d.code}: missing from INSTRUMENT_MILE_COST`);
        } else if (d.milesCost !== canon) {
          mismatches.push(`${d.code}: APPROVED_DIAGNOSTICS.milesCost=${d.milesCost} vs INSTRUMENT_MILE_COST=${canon}`);
        }
      }
      return mismatches.length ? `Mile cost divergences: ${mismatches.join("; ")}` : null;
    },
  },

  // ─── CBC-POS-001 ─ P0-4 ─────────────────────────────────────
  {
    id: "CBC-POS-001",
    p0_refs: ["P0-4"],
    title: "Positioning: 'Executive Intelligence' (not 'Executive Intelligence Platform')",
    severity: "hard",
    scope: ["marketing-copy", "product-ui", "nexus-chat"],
    description:
      "NEXUS / LYC positioning line must use the interim 'Executive Intelligence' (two words) until Emily delivers final v2 positioning. Any use of 'Executive Intelligence Platform' is a Hard Ban (Level 1 banned word 'platform' used as product descriptor).",
    validate: (input, context) => {
      if (input.includes("Executive Intelligence Platform")) {
        return "Positioning line 'Executive Intelligence Platform' uses banned product descriptor 'Platform'. Replace with 'Executive Intelligence'.";
      }
      const ban = checkBannedWord("platform", context === "api-internal" ? "technical" : "user-facing");
      if (ban && /\bplatform\b/i.test(input)) {
        // Only flag if it's clearly used as a product noun (heuristic: preceded by "our" / "the" / "this" + 1-2 words + "platform")
        if (/(our|the|this)\s+(\w+\s+)?platform/i.test(input)) {
          return `Possible banned-word usage: "platform" as product descriptor. Rationale: ${ban.rationale}. Alternatives: ${ban.alternatives.join(", ")}.`;
        }
      }
      return null;
    },
  },

  // ─── CBC-TIER-001 ─ P0-6 ────────────────────────────────────
  {
    id: "CBC-TIER-001",
    p0_refs: ["P0-6"],
    title: "Tier names: HARD BAN in casual coaching chat; ALLOWED in upgrade/pricing context",
    severity: "context-dependent",
    scope: ["nexus-chat", "product-ui", "marketing-copy"],
    description:
      "The rule is about preserving coaching immersion — not about never mentioning tiers. Tier names break the executive-thinking-partner frame when dropped casually. But NEXUS MUST be able to say 'If you upgrade to Pro, you get X' when recommending an upgrade, and pricing pages obviously list tiers explicitly.",
    contextMatrix: {
      banned: [
        "Casual NEXUS coaching flow mid-conversation (e.g., 'As a Starter user, I should tell you…')",
        "Diagnostic report narrative, insights, dimension interpretations",
        "Reflection prompts, development activity suggestions",
        "Random chat tangents about the user's tier status",
      ],
      allowed: [
        "Explicit upgrade / downgrade recommendations (NEXUS recommends Pro because X)",
        "Pricing pages and pricing comparison tables",
        "Account / billing / subscription management pages",
        "Credit gates and upgrade modals ('This diagnostic costs 2 miles. Starter users get 50/mo — upgrade to Pro for 150/mo')",
        "User asks directly 'what tier am I on' or 'what does Council include'",
      ],
    },
    validate: (chatTurn, context) => {
      // Heuristic detection of casual tier mention vs upgrade/pricing context
      const mentionsTier = /\b(Explorer|Starter|Pro|Professional|Executive|Council)\b/i.test(chatTurn);
      if (!mentionsTier) return null;
      if (context === "pricing-billing") return null; // Explicitly allowed

      const upgradeContextKeywords =
        /\b(upgrade|downgrade|price|pricing|cost|subscribe|subscription|billing|plan|tier|credit gate|miles per month|monthly|includes|what tier|which tier|council includes)\b/i;
      const isPricingContext = upgradeContextKeywords.test(chatTurn);

      if (context === "nexus-chat" && !isPricingContext) {
        return (
          "Tier name(s) referenced in NEXUS chat without clear upgrade/pricing context. " +
          "Per CBC-TIER-001: HARD BAN during casual coaching. " +
          "Allowed only when: explicit upgrade recommendation, pricing surfaces, billing pages, or user directly asks about tiers."
        );
      }
      return null;
    },
  },

  // ─── CBC-TIER-002 ─ P0-7 ────────────────────────────────────
  {
    id: "CBC-TIER-002",
    p0_refs: ["P0-7"],
    title: "Display name canon: 'Pro' (not 'Professional') for tier_key=professional",
    severity: "hard",
    scope: ["marketing-copy", "product-ui", "pricing-billing", "nexus-chat"],
    description:
      "'Pro' is the canonical user-facing display name for the middle subscription tier. 'Professional' exists ONLY as the backend tier_key (tier_key = 'professional'). Any UI string, pricing table, or chat response using 'Professional' as a tier name is non-canonical and must be changed.",
    validate: (input, context) => {
      if (context === "api-internal") return null; // tier_key usage OK internally
      // Check for standalone "Professional" used as a tier name — but allow when it appears
      // inside strings clearly about pricing-tier NAME (e.g. "Professional Deep-Dive" product name
      // within assessment pricing is a different usage — not the subscription tier display name).
      const badMatches = input.match(
        /\bProfessional\s+(Tier|Plan|Subscription|Users|member|Access|Edition)\b/gi,
      );
      if (badMatches) {
        return `Non-canonical tier display name found: ${badMatches.join(", ")}. Replace "Professional" → "Pro" for the subscription tier. (Assessment/feature level names like "Professional Deep-Dive" are separate.)`;
      }
      // Also verify structural TIER_KEYS state
      const pro = TIER_KEYS.find((t) => t.tier_key === "professional");
      if (pro && pro.display_name !== "Pro") {
        return `Structural: TIER_KEYS.professional.display_name = "${pro.display_name}", must be "Pro".`;
      }
      return null;
    },
  },

  // ─── CBC-TIER-003 ─ P0-7 ────────────────────────────────────
  {
    id: "CBC-TIER-003",
    p0_refs: ["P0-7"],
    title: "All 5 tier display names match canon across all batches",
    severity: "hard",
    scope: "all-surfaces",
    description:
      "No batch may override or rename the 5 canonical tier display names. Explorer → Starter → Pro → Executive → Council. This is a structural check against TIER_KEYS.",
    validate: (_input, _context) => {
      const sorted = [...TIER_KEYS].sort((a, b) => a.order - b.order);
      const issues: string[] = [];
      if (sorted.length !== 5) issues.push(`Expected 5 tiers, got ${sorted.length}`);
      sorted.forEach((t) => {
        const expectedDisplay = tierDisplayName(t.tier_key);
        if (t.display_name !== expectedDisplay) {
          issues.push(`${t.tier_key}: display_name="${t.display_name}" ≠ canon="${expectedDisplay}"`);
        }
      });
      return issues.length ? issues.join("; ") : null;
    },
  },
];

// ─── CONSISTENCY VALIDATION RUNNER ──────────────────────────────────

export interface ConsistencyCheckResult {
  ruleId: string;
  p0_refs: readonly string[];
  status: "pass" | "fail" | "warning";
  message: string;
}

/**
 * Run all structural cross-batch rules (those that don't need external input).
 * Returns array of results for every rule.
 */
export function runCrossBatchStructuralChecks(): readonly ConsistencyCheckResult[] {
  const results: ConsistencyCheckResult[] = [];
  for (const rule of CROSS_BATCH_CONSISTENCY_RULES) {
    try {
      // Rules without validate() → warning for manual check
      if (!rule.validate) {
        results.push({
          ruleId: rule.id,
          p0_refs: rule.p0_refs,
          status: "warning",
          message: `${rule.id} ${rule.title} — no automated structural check; requires manual review of ${Array.isArray(rule.scope) ? rule.scope.join(", ") : rule.scope} surfaces.`,
        });
        continue;
      }
      // For structural rules, pass empty string; they use internal imports
      const err = rule.validate("", "all-surfaces");
      results.push({
        ruleId: rule.id,
        p0_refs: rule.p0_refs,
        status: err ? "fail" : "pass",
        message: err || `${rule.id}: structural check passed.`,
      });
    } catch (e) {
      results.push({
        ruleId: rule.id,
        p0_refs: rule.p0_refs,
        status: "fail",
        message: `${rule.id}: exception during validation — ${String(e)}`,
      });
    }
  }
  return results;
}

/**
 * Validate a piece of user-facing copy / chat output against all applicable
 * rules for a given context. Useful for runtime chat output auditing and
 * CI-time copy linting.
 */
export function validateUserFacingCopy(
  copy: string,
  context: RuleScope,
): readonly ConsistencyCheckResult[] {
  const results: ConsistencyCheckResult[] = [];
  for (const rule of CROSS_BATCH_CONSISTENCY_RULES) {
    const applies =
      rule.scope === "all-surfaces" ||
      rule.scope === context ||
      (Array.isArray(rule.scope) && rule.scope.includes(context));
    if (!applies) continue;
    if (!rule.validate) continue;
    try {
      const err = rule.validate(copy, context);
      if (err) {
        results.push({
          ruleId: rule.id,
          p0_refs: rule.p0_refs,
          status: rule.severity === "hard" ? "fail" : "warning",
          message: err,
        });
      } else {
        results.push({
          ruleId: rule.id,
          p0_refs: rule.p0_refs,
          status: "pass",
          message: `${rule.id}: passed for "${context}".`,
        });
      }
    } catch (e) {
      results.push({
        ruleId: rule.id,
        p0_refs: rule.p0_refs,
        status: "fail",
        message: `${rule.id}: exception — ${String(e)}`,
      });
    }
  }
  return results;
}

/**
 * Convenience: look up a rule by ID.
 */
export function getConsistencyRule(id: string): CrossBatchConsistencyRule | undefined {
  return CROSS_BATCH_CONSISTENCY_RULES.find((r) => r.id === id);
}

/**
 * Convenience: look up all rules that cover a given P0 ref.
 */
export function getRulesForP0(p0Ref: string): readonly CrossBatchConsistencyRule[] {
  return CROSS_BATCH_CONSISTENCY_RULES.filter((r) => r.p0_refs.includes(p0Ref));
}

// ─── Sanity-check structural rules on import (dev only) ─────────────

if (import.meta.env?.DEV) {
  const struct = runCrossBatchStructuralChecks();
  const failures = struct.filter((r) => r.status === "fail");
  if (failures.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[crossBatchConsistency] ${failures.length} structural FAIL on import:`);
    for (const f of failures) {
      // eslint-disable-next-line no-console
      console.warn(`  ${f.ruleId}: ${f.message}`);
    }
  }
}
