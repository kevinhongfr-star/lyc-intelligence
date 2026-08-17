// ═══════════════════════════════════════════════════════════
// Terminology Reference — Canonical Approved Terminology v1.0
// Batch 6 P0 Corrective Pass (Akira canon audit, 12 P0 issues)
//
// P0 fixes applied:
//   P0-1: SHIFT/CANVAS/TRIDENT/MERIDIAN removed from user-facing lists
//   P0-2: CPI descriptor = "China Leadership Pipeline Index"
//   P0-3: Mile cost table locked to 1/2/3/5mi canon (11 instruments, no codenames)
//   P0-4: "Platform" banned from product descriptors; NEXUS = "Executive Intelligence"
//   P0-5: Default user-facing term = "diagnostic" (not "assessment")
//   P0-7: "Pro" = canonical tier display name (not "Professional")
// ═══════════════════════════════════════════════════════════

import { INSTRUMENT_MILE_COST } from "./miles";

// ─── Diagnostic Entry Types ─────────────────────────────────────────

export type DiagnosticCategory =
  | "flagship"       // CPI
  | "career_core"    // Former "SHIFT Suite" — internal category key only
  | "advisory";      // Advisory products

export interface ApprovedDiagnostic {
  /** Short instrument code (always uppercase) */
  code: string;
  /** Full canonical user-facing name. Use in headings, product pages. */
  fullName: string;
  /** Short descriptor / tagline (1-8 words, user-facing) */
  shortDescriptor: string;
  /** Which category grouping this diagnostic belongs to */
  category: DiagnosticCategory;
  /**
   * INTERNAL-ONLY category key from canon diagnostic JSONs.
   * May contain "SHIFT", "CANVAS", "TRIDENT", "MERIDIAN" — these are
   * permitted ONLY in internal metadata fields, NEVER in user-facing copy.
   */
  identity: {
    /** @internal — internal project codename, NOT user-facing */
    category: string;
    /** @internal — backend instrument key */
    tier_key?: string;
  };
  /** Mile cost (from locked canon, imported from miles.ts) */
  milesCost: number;
  /** B2C-facing marketing name (may differ from fullName for some instruments) */
  b2cName: string;
  /** Typical delivery duration in minutes */
  deliveryMinutes: number;
}

// ─── APPROVED_DIAGNOSTICS ─ Canonical 11 Diagnostics ────────────────
//
// IMPORTANT (P0-1): The internal identity.category field may contain
// "SHIFT" / "CANVAS" — this is canon metadata. Do NOT surface these
// codenames to users. Use `category` (flagship / career_core / advisory)
// or plain-language grouping labels instead.
//
// IMPORTANT (P0-2): CPI's full descriptor is "China Leadership Pipeline
// Index" — NOT "Council Performance Insight" (old wrong) and NOT merely
// "China Leadership Pipeline Diagnostic" (old shorthand was incomplete).
//
// IMPORTANT (P0-3): milesCost values are locked via INSTRUMENT_MILE_COST.
// Do NOT override here — import from miles.ts to keep single source of truth.

export const APPROVED_DIAGNOSTICS: readonly ApprovedDiagnostic[] = [
  // ── Flagship (5 miles) ──────────────────────────────────────────
  {
    code: "CPI",
    fullName: "China Leadership Pipeline Index",
    shortDescriptor: "leadership pipeline index",
    category: "flagship",
    identity: { category: "SHIFT" }, // INTERNAL-ONLY codename — do NOT surface
    milesCost: INSTRUMENT_MILE_COST.CPI,
    b2cName: "CPI",
    deliveryMinutes: 25,
  },

  // ── Career Core (1-2 miles — formerly "SHIFT Suite", internal label only) ─
  {
    code: "LEAP",
    fullName: "LEAP Career Positioning Diagnostic",
    shortDescriptor: "career transition readiness",
    category: "career_core",
    identity: { category: "SHIFT" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.LEAP,
    b2cName: "LEAP",
    deliveryMinutes: 15,
  },
  {
    code: "QUEST",
    fullName: "QUEST Executive Leadership Diagnostic",
    shortDescriptor: "executive leadership profile",
    category: "career_core",
    identity: { category: "SHIFT" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.QUEST,
    b2cName: "QUEST",
    deliveryMinutes: 20,
  },
  {
    code: "IMPACT",
    fullName: "IMPACT Board Effectiveness Diagnostic",
    shortDescriptor: "board readiness & effectiveness",
    category: "career_core",
    identity: { category: "SHIFT" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.IMPACT,
    b2cName: "IMPACT",
    deliveryMinutes: 20,
  },
  {
    code: "DRIVE",
    fullName: "DRIVE Motivation & Engagement Diagnostic",
    shortDescriptor: "motivation & engagement drivers",
    category: "career_core",
    identity: { category: "SHIFT" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.DRIVE,
    b2cName: "DRIVE",
    deliveryMinutes: 15,
  },
  {
    code: "COACH",
    fullName: "COACH Developmental Leadership Diagnostic",
    shortDescriptor: "coaching & developmental leadership",
    category: "career_core",
    identity: { category: "SHIFT" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.COACH,
    b2cName: "COACH",
    deliveryMinutes: 18,
  },

  // ── Advisory Products (2-3 miles) ────────────────────────────────
  {
    code: "PRISM",
    fullName: "PRISM Personal Brand Diagnostic",
    shortDescriptor: "personal brand & market positioning",
    category: "advisory",
    identity: { category: "CANVAS" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.PRISM,
    b2cName: "PRISM",
    deliveryMinutes: 18,
  },
  {
    code: "BRIDGE",
    fullName: "BRIDGE APAC Mandate Readiness Diagnostic",
    shortDescriptor: "APAC mandate readiness",
    category: "advisory",
    identity: { category: "TRIDENT" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.BRIDGE,
    b2cName: "BRIDGE",
    deliveryMinutes: 22,
  },
  {
    code: "MOSAIC",
    fullName: "MOSAIC Cross-Border Partnership Diagnostic",
    shortDescriptor: "cross-border partnership navigation",
    category: "advisory",
    identity: { category: "CANVAS" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.MOSAIC,
    b2cName: "MOSAIC",
    deliveryMinutes: 20,
  },
  {
    code: "SPARK",
    fullName: "SPARK AI Readiness Diagnostic",
    shortDescriptor: "executive AI adoption readiness",
    category: "advisory",
    identity: { category: "CANVAS" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.SPARK,
    b2cName: "SPARK",
    deliveryMinutes: 18,
  },
  {
    code: "FORGE",
    fullName: "FORGE Bilateral Operating Context Diagnostic",
    shortDescriptor: "bilateral operating context readiness",
    category: "advisory",
    identity: { category: "MERIDIAN" }, // INTERNAL-ONLY
    milesCost: INSTRUMENT_MILE_COST.FORGE,
    b2cName: "FORGE",
    deliveryMinutes: 20,
  },
];

/** Quick lookup: ApprovedDiagnostic by instrument code (case-insensitive) */
export function getApprovedDiagnostic(code: string): ApprovedDiagnostic | undefined {
  const key = (code || "").toUpperCase();
  return APPROVED_DIAGNOSTICS.find((d) => d.code === key);
}

/** All approved instrument codes (uppercase, ordered by canon). */
export const APPROVED_DIAGNOSTIC_CODES: readonly string[] = APPROVED_DIAGNOSTICS.map((d) => d.code);

// ─── Tier Keys & Display Names ──────────────────────────────────────
//
// P0-7 CRITICAL: "Pro" IS the canonical user-facing display name.
// "Professional" is the BACKEND KEY ONLY (tier_key = "professional").
// Do NOT use "Professional" as user-facing copy.
//
// Canonical 5 tiers (user-facing order):
//   Explorer → Starter → Pro → Executive → Council

export interface TierDefinition {
  /** Backend database key (internal, snake_case) */
  tier_key: string;
  /** Canonical user-facing display name — NEVER override this */
  display_name: string;
  /** Monthly miles allocation */
  monthly_miles: number;
  /** Suggested internal sort order (0 = Explorer, 4 = Council) */
  order: number;
}

export const TIER_KEYS: readonly TierDefinition[] = [
  { tier_key: "explorer",    display_name: "Explorer",  monthly_miles: 0,   order: 0 },
  { tier_key: "starter",     display_name: "Starter",   monthly_miles: 50,  order: 1 },
  { tier_key: "professional",display_name: "Pro",       monthly_miles: 150, order: 2 }, // P0-7: display = "Pro"
  { tier_key: "executive",   display_name: "Executive", monthly_miles: 300, order: 3 },
  { tier_key: "council",     display_name: "Council",   monthly_miles: 600, order: 4 },
];

/** Map a backend tier_key to the user-facing display name. */
export function tierDisplayName(tierKey: string): string {
  const t = TIER_KEYS.find((x) => x.tier_key === tierKey?.toLowerCase());
  return t?.display_name ?? tierKey ?? "";
}

/** Validate that a tier display name is canonical (returns null if valid, error string if not). */
export function validateTierDisplayName(displayName: string, tierKey: string): string | null {
  const t = TIER_KEYS.find((x) => x.tier_key === tierKey?.toLowerCase());
  if (!t) return `Unknown tier_key: ${tierKey}`;
  if (displayName !== t.display_name) {
    return `Tier display name "${displayName}" does not match canon "${t.display_name}" for tier_key "${tierKey}"`;
  }
  return null;
}

// ─── Banned Words ───────────────────────────────────────────────────
//
// P0-4: "platform" is Level-1 hard-banned as a PRODUCT DESCRIPTOR.
// It is allowed in technical contexts (software platform, platform team,
// platform engineering) where it refers to the technical architecture,
// not the product itself.
//
// NEXUS positioning line = "Executive Intelligence" (no noun after).
// Old: "Executive Intelligence Platform" → ALWAYS replace.

export interface BannedWordRule {
  word: string;
  level: 1 | 2 | 3;
  /** User-facing copy ONLY, or all surfaces? */
  scope: "user-facing" | "all";
  /** If true, allowed in clearly technical/engineering contexts. */
  allowTechnicalContext: boolean;
  /** Explanation of why banned and acceptable alternatives */
  rationale: string;
  /** Acceptable alternatives (ordered by preference) */
  alternatives: string[];
  /** Example of bad → good replacement */
  example?: { bad: string; good: string };
}

export const BANNED_WORDS: readonly BannedWordRule[] = [
  {
    word: "platform",
    level: 1,
    scope: "user-facing",
    allowTechnicalContext: true, // P0-4 add: technical contexts OK
    rationale:
      "Brand Master v1.2 Level-1 ban for product descriptors. 'Platform' dilutes the premium positioning and overpromises breadth. As a technical architecture term it is fine.",
    alternatives: [
      "Executive Intelligence",  // for NEXUS positioning (P0-4 interim)
      "solution",
      "service",
      "product suite",
      "offering",
    ],
    example: {
      bad:  "LYC Intelligence — Executive Intelligence Platform",
      good: "LYC Intelligence — Executive Intelligence",
    },
  },
  {
    word: "free",
    level: 1,
    scope: "user-facing",
    allowTechnicalContext: false,
    rationale:
      "Cheapens premium positioning. Always use 'Executive Introduction' or 'complimentary introduction' instead.",
    alternatives: ["Executive Introduction", "complimentary introduction", "no-cost access"],
    example: {
      bad:  "Start for free",
      good: "Begin with an Executive Introduction",
    },
  },
  {
    word: "chatbot",
    level: 2,
    scope: "user-facing",
    allowTechnicalContext: false,
    rationale: "NEXUS is explicitly NOT a chatbot — it's an executive thinking partner and intelligent front door.",
    alternatives: ["NEXUS AI", "executive intelligence coach", "intelligent front door", "AI thinking partner"],
    example: {
      bad:  "Use our chatbot for career advice",
      good: "Ask NEXUS — your executive intelligence coach",
    },
  },
  // ── Internal codenames (P0-1) — NEVER user-facing ──────────────
  {
    word: "SHIFT",
    level: 1,
    scope: "user-facing",
    allowTechnicalContext: false,
    rationale:
      "Internal project codename only. Permitted in backend identity.category metadata fields (flagged INTERNAL-ONLY), but never in user-facing copy, labels, navigation, or category surfaces.",
    alternatives: ["career core diagnostics", "career portfolio"],
    example: {
      bad:  "SHIFT Suite of assessments",
      good: "Career Core diagnostics",
    },
  },
  {
    word: "CANVAS",
    level: 1,
    scope: "user-facing",
    allowTechnicalContext: false,
    rationale: "Internal project codename. Never user-facing.",
    alternatives: ["personal brand diagnostics", "portfolio diagnostics"],
    example: {
      bad:  "CANVAS Analytics",
      good: "Profile & Brand Analytics",
    },
  },
  {
    word: "TRIDENT",
    level: 1,
    scope: "user-facing",
    allowTechnicalContext: false,
    rationale: "Internal project codename. Never user-facing.",
    alternatives: ["scoring & ranking", "candidate evaluation"],
    example: {
      bad:  "TRIDENT scoring",
      good: "Candidate scoring & ranking",
    },
  },
  {
    word: "MERIDIAN",
    level: 1,
    scope: "user-facing",
    allowTechnicalContext: false,
    rationale: "Internal project codename. Never user-facing.",
    alternatives: ["operating context diagnostics", "bilateral readiness"],
    example: {
      bad:  "MERIDIAN suite",
      good: "Operating Context diagnostics",
    },
  },
];

/** Check if a word is banned in given context. Returns the rule if banned, null if allowed. */
export function checkBannedWord(
  word: string,
  context: "user-facing" | "technical" | "internal",
): BannedWordRule | null {
  const normalized = word.trim();
  for (const rule of BANNED_WORDS) {
    // Case-insensitive check for non-codename words; case-SENSITIVE for 4-letter all-caps codenames
    const matches = ["SHIFT", "CANVAS", "TRIDENT", "MERIDIAN"].includes(rule.word)
      ? normalized === rule.word
      : normalized.toLowerCase() === rule.word.toLowerCase();

    if (!matches) continue;
    if (rule.scope === "user-facing" && context === "internal") continue;
    if (rule.allowTechnicalContext && context === "technical") continue;
    return rule;
  }
  return null;
}

// ─── NEXUS Positioning ──────────────────────────────────────────────
//
// P0-4: Interim positioning until Emily's final copy lands.
// OLD (banned): "Executive Intelligence Platform"
// NEW:          "Executive Intelligence"  (two words only, no noun)

export const NEXUS_POSITIONING = {
  /** Short positioning line — use in titles, hero headers, meta descriptions */
  positioningLine: "Executive Intelligence",
  /** 1-sentence product descriptor */
  oneLiner:
    "NEXUS is the intelligent front door of LYC Intelligence — your private AI executive thinking partner.",
  /** What NEXUS is NOT (for prompt/system docs) */
  whatNexusIsNot: [
    "Not a chatbot.",
    "Not a generic Q&A engine.",
    "Not a replacement for human consultants or coaches.",
  ],
};

// ─── Diagnostic vs Assessment Terminology (P0-5) ────────────────────
//
// P0-5 RULE:
//   DEFAULT USER-FACING TERM = "diagnostic" (noun) or "diagnostic assessment"
//   "assessment" = acceptable in TECHNICAL / INTERNAL contexts only:
//     ✓ assessment engine, assessment completion, assessmentEngine.ts, /api/assessments/
//     ✗ "Take our assessment", "assessment pages", "assessment catalog" (user-facing)
//
// Use "diagnostic assessment" when grammatical clarity requires both words.

export interface TerminologyUsageRule {
  /** The term or phrase in question */
  term: string;
  /** "preferred" = use this by default; "allowed" = OK only in listed contexts; "avoid" = don't use */
  status: "preferred" | "allowed" | "avoid";
  /** Where this rule applies */
  appliesTo: "user-facing" | "technical-internal" | "all";
  /** Specific contexts where an "allowed" term is OK */
  allowedContexts?: string[];
  /** Why this rule exists / guidance */
  guidance: string;
  /** Bad → Good examples */
  examples: Array<{ bad: string; good: string }>;
}

export const DIAGNOSTIC_VS_ASSESSMENT_RULES: readonly TerminologyUsageRule[] = [
  {
    term: "diagnostic",
    status: "preferred",
    appliesTo: "user-facing",
    guidance:
      "The canonical user-facing noun for all 11 instruments. Use by default in marketing, product copy, CTAs, navigation, and user-visible labels.",
    examples: [
      { bad: "Take the CPI assessment",       good: "Take the CPI diagnostic" },
      { bad: "Browse our assessment catalog", good: "Browse our diagnostic portfolio" },
      { bad: "Assessment pages",              good: "Diagnostic pages" },
    ],
  },
  {
    term: "diagnostic assessment",
    status: "allowed",
    appliesTo: "user-facing",
    guidance:
      "Use when grammatical clarity requires both words (e.g., 'complete a diagnostic assessment' vs awkward 'complete a diagnostic'). Prefer the shorter form when it reads naturally.",
    examples: [
      { bad:  "Complete an assessment",
        good: "Complete a diagnostic assessment" },
    ],
  },
  {
    term: "assessment",
    status: "allowed",
    appliesTo: "technical-internal",
    allowedContexts: [
      "assessment engine (scoring backend)",
      "assessment completion (internal status field)",
      "assessmentEngine.ts (file names / code identifiers)",
      "/api/assessments/* (API routes — legacy compatibility)",
      "assessment_type (database column name)",
    ],
    guidance:
      "OK in technical and internal contexts where it refers to the backend system or process. Never in user-facing marketing copy, product labels, navigation, pricing copy, or NEXUS chat responses.",
    examples: [
      { bad:  "Assessment: 500 candidates scored",         good: "Diagnostic scoring: 500 candidates processed" }, // user-facing
      { bad:  "assessmentEngine.evaluate()",                good: "assessmentEngine.evaluate() — OK in code" },    // internal code: allowed
    ],
  },
];

/**
 * Quick check: given a string and its context, return a suggested fix
 * if it uses "assessment" in a user-facing context where "diagnostic"
 * should be the default. Returns null if no change needed.
 */
export function suggestDiagnosticTermReplacement(
  userFacingCopy: string,
  context: "user-facing" | "technical-internal",
): string | null {
  if (context !== "user-facing") return null;

  // We flag standalone "assessment" / "assessments" but allow compound terms
  // that are technical jargon even if they appear in code comments.
  const hasUserFacingAssessment =
    /\b(assessment|assessments)\b/i.test(userFacingCopy) &&
    !/\b(assessment engine|assessment completion|assessment_type|assessmentEngine)\b/i.test(userFacingCopy);

  if (hasUserFacingAssessment) {
    return (
      'Use "diagnostic" (or "diagnostic assessment") as the default user-facing term. ' +
      '"assessment" is reserved for technical/internal contexts (engine, completion, API routes, DB columns).'
    );
  }
  return null;
}

// ─── Category Labels (User-Facing) ──────────────────────────────────
//
// P0-1: NEVER surface "SHIFT", "CANVAS", "TRIDENT", "MERIDIAN" as labels.
// Use these plain-language user-facing category labels instead.

export const DIAGNOSTIC_CATEGORY_LABELS: Readonly<Record<DiagnosticCategory, string>> = {
  flagship: "Flagship Diagnostic",
  career_core: "Career Core Diagnostics", // NOT "SHIFT Suite"
  advisory: "Advisory Diagnostics",       // NOT "CANVAS Products" / etc.
};

/**
 * Get a user-facing category label for a diagnostic code.
 * Guaranteed to never return an internal codename.
 */
export function getUserFacingCategoryLabel(instrumentCode: string): string {
  const d = getApprovedDiagnostic(instrumentCode);
  if (!d) return "Diagnostic";
  return DIAGNOSTIC_CATEGORY_LABELS[d.category];
}
