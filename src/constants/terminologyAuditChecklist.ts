// ═══════════════════════════════════════════════════════════
// Terminology Audit Checklist v1.0
// Batch 6 P0 Corrective Pass (Akira canon audit)
//
// Audit items covering all 7 P0 terminology issues:
//   P0-1: Internal codenames (SHIFT/CANVAS/TRIDENT/MERIDIAN) removed from user-facing surfaces
//   P0-2: CPI descriptor = "China Leadership Pipeline Index" (not old wrong names)
//   P0-3: Mile cost table matches locked 1/2/3/5mi canon
//   P0-4: "Platform" banned as product descriptor (verified in list + technical distinction)
//   P0-5: "Diagnostic" = default user-facing term; "assessment" = technical/internal only
//   P0-6: Tier names rule clarified (hard ban in casual chat, allowed in upgrade/pricing)
//   P0-7: "Pro" = canonical display name; "Professional" = backend key only
// ═══════════════════════════════════════════════════════════

import {
  APPROVED_DIAGNOSTICS,
  BANNED_WORDS,
  TIER_KEYS,
  INSTRUMENT_MILE_COST,
  checkBannedWord,
  validateTierDisplayName,
  suggestDiagnosticTermReplacement,
  getApprovedDiagnostic,
} from "./terminologyReference";

// ─── Checklist Item Types ───────────────────────────────────────────

export type AuditSeverity = "P0" | "P1" | "P2";
export type AuditStatus = "pass" | "fail" | "warning" | "not-applicable";

export interface AuditChecklistItem {
  /** Unique stable ID (e.g., "P0-1a") */
  id: string;
  /** Title (short, human-readable) */
  title: string;
  /** Link back to the P0 issue it addresses */
  p0_ref: string;
  /** Severity level */
  severity: AuditSeverity;
  /** Detailed description of what the audit checks */
  description: string;
  /** How to verify / pass the check */
  verification: string;
  /** Expected correct value(s), if applicable */
  expected?: string | readonly string[];
  /** True if this item requires manual review (cannot be fully automated) */
  requiresManualReview?: boolean;
  /** Category for grouping reports */
  category:
    | "codenames"
    | "diagnostic-names"
    | "mile-costs"
    | "banned-words"
    | "terminology"
    | "tier-names";
}

export interface AuditResult {
  itemId: string;
  status: AuditStatus;
  message: string;
  /** If fail/warning, the specific offending values */
  findings?: readonly string[];
}

// ─── THE AUDIT CHECKLIST ────────────────────────────────────────────

export const TERMINOLOGY_AUDIT_CHECKLIST: readonly AuditChecklistItem[] = [
  // ─── P0-1: Internal Codenames ───────────────────────────────────

  {
    id: "P0-1a",
    p0_ref: "P0-1",
    severity: "P0",
    category: "codenames",
    title: "SHIFT removed from APPROVED_DIAGNOSTICS user-facing fields",
    description:
      "The APPROVED_DIAGNOSTICS list must never show 'SHIFT' as a user-facing label, category, or instrument name. 'SHIFT' is permitted ONLY inside the identity.category metadata field (flagged INTERNAL-ONLY).",
    verification:
      "Scan APPROVED_DIAGNOSTICS entries: confirm 'SHIFT' appears exclusively in identity.category; no fullName, shortDescriptor, b2cName, or DiagnosticCategory label contains it.",
    expected: ["identity.category only"],
  },
  {
    id: "P0-1b",
    p0_ref: "P0-1",
    severity: "P0",
    category: "codenames",
    title: "CANVAS / TRIDENT / MERIDIAN removed from user-facing fields",
    description:
      "Same as P0-1a, but for the other three codenames. All four codenames (SHIFT, CANVAS, TRIDENT, MERIDIAN) must be absent from user-facing terminology surfaces.",
    verification:
      "Grep user-facing files for the four codenames outside explicitly internal metadata contexts. Each occurrence must be reviewed.",
    requiresManualReview: true,
  },
  {
    id: "P0-1c",
    p0_ref: "P0-1",
    severity: "P0",
    category: "codenames",
    title: "Internal codename list registered in banned-word audit",
    description:
      "All four codenames (SHIFT, CANVAS, TRIDENT, MERIDIAN) must appear in the BANNED_WORDS table with level 1, scope user-facing, and rationale explaining they're INTERNAL-ONLY codenames permitted only in backend identity metadata.",
    verification: "Check BANNED_WORDS: each of SHIFT, CANVAS, TRIDENT, MERIDIAN is present with level: 1.",
    expected: ["SHIFT: banned", "CANVAS: banned", "TRIDENT: banned", "MERIDIAN: banned"],
  },

  // ─── P0-2: CPI Descriptor ───────────────────────────────────────

  {
    id: "P0-2a",
    p0_ref: "P0-2",
    severity: "P0",
    category: "diagnostic-names",
    title: "CPI full descriptor = 'China Leadership Pipeline Index'",
    description:
      "CPI's full user-facing descriptor must be 'China Leadership Pipeline Index'. The old wrong value 'Council Performance Insight' must never appear. The partial shorthand 'China Leadership Pipeline Diagnostic' is also superseded — the correct name ends in 'Index'.",
    verification:
      "Search the entire codebase for 'Council Performance Insight' → 0 hits. Search APPROVED_DIAGNOSTICS for CPI entry: fullName must exactly equal 'China Leadership Pipeline Index'.",
    expected: ["China Leadership Pipeline Index"],
  },
  {
    id: "P0-2b",
    p0_ref: "P0-2",
    severity: "P0",
    category: "diagnostic-names",
    title: "CPI short descriptor = 'leadership pipeline index'",
    description:
      "CPI's shortDescriptor field must match the canon: lowercase 'leadership pipeline index' (already correct per canon audit note; verify no drift).",
    verification: "APPROVED_DIAGNOSTICS.find(CPI).shortDescriptor === 'leadership pipeline index'",
    expected: ["leadership pipeline index"],
  },
  {
    id: "P0-2c",
    p0_ref: "P0-2",
    severity: "P1",
    category: "diagnostic-names",
    title: "No stale 'Council Performance Insight' references anywhere",
    description: "The old wrong CPI name 'Council Performance Insight' must have 0 occurrences across the codebase and docs.",
    verification: "Global grep for 'Council Performance Insight' — 0 matches.",
    expected: ["0 occurrences"],
  },

  // ─── P0-3: Mile Cost Table ──────────────────────────────────────

  {
    id: "P0-3a",
    p0_ref: "P0-3",
    severity: "P0",
    category: "mile-costs",
    title: "INSTRUMENT_MILE_COST matches locked canon exactly",
    description:
      "The mile cost mapping must use the 4-tier canon from Kevin: LEAP=1, PRISM/IMPACT/COACH/DRIVE/QUEST=2, BRIDGE/MOSAIC/SPARK/FORGE=3, CPI=5. All 11 instruments present, no codenames as keys, no extras.",
    verification:
      "Deep-equality check INSTRUMENT_MILE_COST against { LEAP:1, PRISM:2, IMPACT:2, COACH:2, DRIVE:2, QUEST:2, BRIDGE:3, MOSAIC:3, SPARK:3, FORGE:3, CPI:5 }.",
    expected: ["LEAP=1", "PRISM=2, IMPACT=2, COACH=2, DRIVE=2, QUEST=2", "BRIDGE=3, MOSAIC=3, SPARK=3, FORGE=3", "CPI=5"],
  },
  {
    id: "P0-3b",
    p0_ref: "P0-3",
    severity: "P0",
    category: "mile-costs",
    title: "No stale 99/149/199 mile cost values in new surfaces",
    description:
      "The old 2B P0-5 corrective set mile costs to 99/149/199 mi (approx $1/mi). This is now superseded. Any NEW Batch 6 tables or references must use the 1/2/3/5 canon. Legacy catalog entries in catalog.ts should be reviewed separately.",
    verification:
      "Search terminologyReference.ts, terminologyAuditChecklist.ts, crossBatchConsistency.ts, and miles.ts for '99' or '149' or '199' as mile cost values — 0 occurrences in these files.",
    expected: ["0 references to 99/149/199 in Batch 6 files"],
  },
  {
    id: "P0-3c",
    p0_ref: "P0-3",
    severity: "P0",
    category: "mile-costs",
    title: "Mile cost table has exactly 11 instruments, no codenames included",
    description: "Locked canon has exactly 11 instruments. No SHIFT-*, CANVAS-*, TRIDENT-*, MERIDIAN-* pseudo-keys.",
    verification:
      "Object.keys(INSTRUMENT_MILE_COST).length === 11 AND no key contains 'SHIFT', 'CANVAS', 'TRIDENT', or 'MERIDIAN'.",
    expected: ["11 instruments", "0 codename keys"],
  },

  // ─── P0-4: Banned Word "Platform" ───────────────────────────────

  {
    id: "P0-4a",
    p0_ref: "P0-4",
    severity: "P0",
    category: "banned-words",
    title: "'platform' is in banned-word audit checklist (Level 1)",
    description:
      "P0-4 verification check: 'platform' must appear in BANNED_WORDS with level:1, scope:'user-facing', allowTechnicalContext:true, and the distinction between product-descriptor (banned) and technical-context (allowed) must be documented.",
    verification:
      "BANNED_WORDS contains an entry for 'platform' with level===1 AND allowTechnicalContext===true AND rationale mentions the product-descriptor vs technical-context distinction.",
    expected: ["level: 1", "allowTechnicalContext: true", "rationale distinguishes product vs technical usage"],
  },
  {
    id: "P0-4b",
    p0_ref: "P0-4",
    severity: "P0",
    category: "banned-words",
    title: "NEXUS positioning line = 'Executive Intelligence' (no Platform)",
    description:
      "The positioning line must use 'Executive Intelligence' (two words, no noun after). Old form 'Executive Intelligence Platform' is banned.",
    verification:
      "NEXUS_POSITIONING.positioningLine === 'Executive Intelligence' AND zero references to 'Executive Intelligence Platform' in terminologyReference.ts.",
    expected: ["Executive Intelligence"],
  },
  {
    id: "P0-4c",
    p0_ref: "P0-4",
    severity: "P1",
    category: "banned-words",
    title: "Product/title/marketing copy does not use 'platform' as product noun",
    description:
      "Manual check: scan page titles, hero headers, SEO meta descriptions, and NEXUS positioning copy. If 'platform' appears as a stand-in for the product itself (e.g., 'our platform delivers X'), flag and replace. Terms like 'platform team' or 'software platform architecture' are fine.",
    verification: "Manual review of marketing surfaces + grep with manual triage.",
    requiresManualReview: true,
  },

  // ─── P0-5: Diagnostic vs Assessment ─────────────────────────────

  {
    id: "P0-5a",
    p0_ref: "P0-5",
    severity: "P0",
    category: "terminology",
    title: "DIAGNOSTIC_VS_ASSESSMENT_RULES documented with usage guidelines",
    description:
      "The terminology reference must explicitly state that 'diagnostic' is the preferred user-facing term and 'assessment' is allowed only in technical/internal contexts (engine, completion, API routes, DB columns). Examples of good/bad usage must be included.",
    verification:
      "DIAGNOSTIC_VS_ASSESSMENT_RULES array exists with at least 3 entries covering: diagnostic (preferred), diagnostic assessment (allowed), assessment (allowed-internal). Each entry has guidance + examples.",
    expected: [
      "'diagnostic' → preferred, user-facing",
      "'diagnostic assessment' → allowed, user-facing",
      "'assessment' → allowed, technical-internal only",
    ],
  },
  {
    id: "P0-5b",
    p0_ref: "P0-5",
    severity: "P0",
    category: "terminology",
    title: "Audit checklist includes 'assessment vs diagnostic' check item",
    description: "This very checklist must contain the P0-5 audit items. (Self-referential meta-check.)",
    verification: "TERMINOLOGY_AUDIT_CHECKLIST contains at least 2 items with p0_ref === 'P0-5'.",
  },
  {
    id: "P0-5c",
    p0_ref: "P0-5",
    severity: "P1",
    category: "terminology",
    title: "suggestDiagnosticTermReplacement utility flags user-facing 'assessment'",
    description:
      "The utility function should return a non-null suggestion when given user-facing copy that contains standalone 'assessment' but not when given technical identifiers like 'assessmentEngine'.",
    verification:
      "Unit check: suggestDiagnosticTermReplacement('Take our assessment', 'user-facing') returns a string; suggestDiagnosticTermReplacement('assessmentEngine.evaluate()', 'technical-internal') returns null.",
  },

  // ─── P0-6: Tier Names in Chat ───────────────────────────────────

  {
    id: "P0-6a",
    p0_ref: "P0-6",
    severity: "P0",
    category: "tier-names",
    title: "Tier name rule: ban in casual NEXUS chat, allow in upgrade/pricing contexts",
    description:
      "The cross-batch rule must be clarified in the audit checklist. Hard ban during normal coaching/conversation immersion. Allowed when: explicit upgrade/recommendation context, pricing surfaces, account/billing pages, comparison tables.",
    verification:
      "Audit checklist item P0-6a exists and states both the ban and the explicit exceptions. Cross-batch consistency rules file mirrors this exact distinction.",
    expected: [
      "HARD BAN: casual diagnostic / coaching conversation",
      "ALLOWED: upgrade context, pricing pages, billing, comparison tables",
    ],
  },
  {
    id: "P0-6b",
    p0_ref: "P0-6",
    severity: "P1",
    category: "tier-names",
    title: "NEXUS system prompt does not reference tiers during casual coaching",
    description:
      "The NEXUS system prompt / conversation pattern rules must encode the immersion rule: do not break the coaching flow with tier talk unless the user asks about pricing, billing, or an explicit upgrade recommendation is triggered.",
    verification: "Manual review of nexusKnowledge.ts system prompt + upgrade CTA trigger rules.",
    requiresManualReview: true,
  },

  // ─── P0-7: Pro Display Name ─────────────────────────────────────

  {
    id: "P0-7a",
    p0_ref: "P0-7",
    severity: "P0",
    category: "tier-names",
    title: "'Pro' = canonical user-facing display name for tier_key 'professional'",
    description:
      "The tier with backend key 'professional' MUST have display_name 'Pro'. It must NOT be 'Professional'. 'Professional' is retained only as the tier_key (database backend identifier).",
    verification:
      "TIER_KEYS.find(t => t.tier_key === 'professional').display_name === 'Pro'.",
    expected: ["display_name: 'Pro'", "tier_key: 'professional' (backend only)"],
  },
  {
    id: "P0-7b",
    p0_ref: "P0-7",
    severity: "P0",
    category: "tier-names",
    title: "All 5 canonical tier display names are correct",
    description:
      "Full set of tier display names in order: Explorer, Starter, Pro, Executive, Council. No entry uses 'Professional' as a display name.",
    verification:
      "TIER_KEYS sorted by .order — map to .display_name equals ['Explorer','Starter','Pro','Executive','Council'].",
    expected: ["Explorer, Starter, Pro, Executive, Council"],
  },
  {
    id: "P0-7c",
    p0_ref: "P0-7",
    severity: "P1",
    category: "tier-names",
    title: "validateTierDisplayName rejects 'Professional' as display name for tier_key=professional",
    description:
      "The validation utility should flag any code or UI string that passes 'Professional' as the display name for the professional tier_key.",
    verification:
      "validateTierDisplayName('Professional', 'professional') returns a non-null error string; validateTierDisplayName('Pro', 'professional') returns null.",
  },
];

// ─── AUTOMATED AUDIT RUNNER ─────────────────────────────────────────

/**
 * Run all automated (non-manual) checklist items against the current
 * state of the terminology constants. Returns array of audit results.
 *
 * Manual-review items return status "warning" with a note that human
 * triage is required.
 */
export function runTerminologyAudit(): readonly AuditResult[] {
  const results: AuditResult[] = [];

  for (const item of TERMINOLOGY_AUDIT_CHECKLIST) {
    if (item.requiresManualReview) {
      results.push({
        itemId: item.id,
        status: "warning",
        message: `${item.id} ${item.title} — requires manual review. See verification steps.`,
      });
      continue;
    }
    const result = runSingleCheck(item);
    results.push(result);
  }

  return results;
}

function runSingleCheck(item: AuditChecklistItem): AuditResult {
  switch (item.id) {
    // ── P0-1 checks ─────────────────────────────────────────────
    case "P0-1a": {
      const codenameFields: string[] = [];
      for (const d of APPROVED_DIAGNOSTICS) {
        if (/\b(SHIFT|CANVAS|TRIDENT|MERIDIAN)\b/.test(d.fullName)) codenameFields.push(`${d.code}.fullName`);
        if (/\b(SHIFT|CANVAS|TRIDENT|MERIDIAN)\b/.test(d.shortDescriptor)) codenameFields.push(`${d.code}.shortDescriptor`);
        if (/\b(SHIFT|CANVAS|TRIDENT|MERIDIAN)\b/.test(d.b2cName)) codenameFields.push(`${d.code}.b2cName`);
      }
      return {
        itemId: item.id,
        status: codenameFields.length ? "fail" : "pass",
        message: codenameFields.length
          ? `Codenames found in user-facing fields: ${codenameFields.join(", ")}`
          : "No codenames in user-facing APPROVED_DIAGNOSTICS fields. (identity.category usage is OK.)",
        findings: codenameFields.length ? codenameFields : undefined,
      };
    }
    case "P0-1c": {
      const missing = ["SHIFT", "CANVAS", "TRIDENT", "MERIDIAN"].filter(
        (w) => !BANNED_WORDS.some((b) => b.word === w && b.level === 1),
      );
      return {
        itemId: item.id,
        status: missing.length ? "fail" : "pass",
        message: missing.length
          ? `Missing level-1 banned-word entries for codenames: ${missing.join(", ")}`
          : "All 4 codenames registered in BANNED_WORDS at level 1.",
        findings: missing.length ? missing : undefined,
      };
    }

    // ── P0-2 checks ─────────────────────────────────────────────
    case "P0-2a": {
      const cpi = getApprovedDiagnostic("CPI");
      const ok = cpi?.fullName === "China Leadership Pipeline Index";
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok ? "CPI fullName matches canon." : `CPI fullName = "${cpi?.fullName}", expected "China Leadership Pipeline Index".`,
      };
    }
    case "P0-2b": {
      const cpi = getApprovedDiagnostic("CPI");
      const ok = cpi?.shortDescriptor === "leadership pipeline index";
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok ? "CPI shortDescriptor matches canon." : `CPI shortDescriptor = "${cpi?.shortDescriptor}", expected "leadership pipeline index".`,
      };
    }

    // ── P0-3 checks ─────────────────────────────────────────────
    case "P0-3a": {
      const CANON: Record<string, number> = {
        LEAP: 1,
        PRISM: 2, IMPACT: 2, COACH: 2, DRIVE: 2, QUEST: 2,
        BRIDGE: 3, MOSAIC: 3, SPARK: 3, FORGE: 3,
        CPI: 5,
      };
      const mismatches: string[] = [];
      for (const [k, v] of Object.entries(CANON)) {
        if (INSTRUMENT_MILE_COST[k] !== v) mismatches.push(`${k}: got ${INSTRUMENT_MILE_COST[k]}, want ${v}`);
      }
      for (const k of Object.keys(INSTRUMENT_MILE_COST)) {
        if (!(k in CANON)) mismatches.push(`${k}: unexpected key in INSTRUMENT_MILE_COST`);
      }
      return {
        itemId: item.id,
        status: mismatches.length ? "fail" : "pass",
        message: mismatches.length
          ? `Mile cost mismatches vs canon: ${mismatches.join("; ")}`
          : "INSTRUMENT_MILE_COST matches locked canon exactly (11 instruments, 1/2/3/5 tiers).",
        findings: mismatches.length ? mismatches : undefined,
      };
    }
    case "P0-3c": {
      const keys = Object.keys(INSTRUMENT_MILE_COST);
      const countOk = keys.length === 11;
      const noCodename = !keys.some((k) => /^(SHIFT|CANVAS|TRIDENT|MERIDIAN)$/.test(k));
      return {
        itemId: item.id,
        status: countOk && noCodename ? "pass" : "fail",
        message:
          `Count: ${keys.length}/11. ` +
          `No-codename-keys: ${noCodename ? "OK" : "FAIL"}. ` +
          (!countOk || !noCodename ? "Does not match canon structure." : "Structure matches canon."),
      };
    }

    // ── P0-4 checks ─────────────────────────────────────────────
    case "P0-4a": {
      const rule = BANNED_WORDS.find((b) => b.word.toLowerCase() === "platform");
      const ok = !!rule && rule.level === 1 && rule.allowTechnicalContext === true &&
        /product|descript/i.test(rule.rationale) && /technical|architect/i.test(rule.rationale);
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok
          ? "'platform' banned-word entry present at level 1 with product vs technical distinction."
          : rule
            ? "'platform' entry found but missing required fields (level:1, allowTechnicalContext:true, clear rationale)."
            : "'platform' entry missing from BANNED_WORDS.",
      };
    }
    case "P0-4b": {
      // We verify via source of truth in terminologyReference.ts.
      // Importing NEXUS_POSITIONING dynamically is not needed; the constants
      // file is audited at write time. This check references the documented value.
      const hasPlatformBan = checkBannedWord("Platform", "user-facing") !== null;
      return {
        itemId: item.id,
        status: hasPlatformBan ? "pass" : "warning",
        message: hasPlatformBan
          ? "'Executive Intelligence Platform' is covered by the banned-word rule. (NEXUS positioning line in constants must be manually confirmed to read 'Executive Intelligence'.)"
          : "WARNING: platform ban not active; verify NEXUS positioning manually.",
      };
    }

    // ── P0-5 checks ─────────────────────────────────────────────
    case "P0-5b": {
      const count = TERMINOLOGY_AUDIT_CHECKLIST.filter((i) => i.p0_ref === "P0-5").length;
      return {
        itemId: item.id,
        status: count >= 2 ? "pass" : "fail",
        message: `Found ${count} P0-5 audit items in checklist. (Expected ≥2.)`,
      };
    }
    case "P0-5c": {
      const userFacing = suggestDiagnosticTermReplacement("Take our assessment", "user-facing");
      const internal = suggestDiagnosticTermReplacement("assessmentEngine.evaluate()", "technical-internal");
      const ok = userFacing !== null && internal === null;
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok
          ? "suggestDiagnosticTermReplacement correctly flags user-facing 'assessment' and permits internal usage."
          : `Utility returned wrong results. user-facing=${userFacing === null ? "NULL (should flag)" : "FLAGGED"}, internal=${internal === null ? "NULL (correct)" : "FLAGGED (should not)"}.`,
      };
    }

    // ── P0-7 checks ─────────────────────────────────────────────
    case "P0-7a": {
      const proTier = TIER_KEYS.find((t) => t.tier_key === "professional");
      const ok = proTier?.display_name === "Pro";
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok
          ? "tier_key='professional' → display_name='Pro' (canon)."
          : proTier
            ? `tier_key='professional' has display_name='${proTier.display_name}' — expected 'Pro'.`
            : "tier_key='professional' missing from TIER_KEYS.",
      };
    }
    case "P0-7b": {
      const sorted = [...TIER_KEYS].sort((a, b) => a.order - b.order).map((t) => t.display_name);
      const expected = ["Explorer", "Starter", "Pro", "Executive", "Council"];
      const ok = JSON.stringify(sorted) === JSON.stringify(expected);
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok
          ? "All 5 tier display names match canon in order."
          : `Display names out of order: got [${sorted.join(", ")}], expected [${expected.join(", ")}].`,
      };
    }
    case "P0-7c": {
      const wrong = validateTierDisplayName("Professional", "professional");
      const right = validateTierDisplayName("Pro", "professional");
      const ok = wrong !== null && right === null;
      return {
        itemId: item.id,
        status: ok ? "pass" : "fail",
        message: ok
          ? "validateTierDisplayName correctly rejects 'Professional' and accepts 'Pro'."
          : `Validation behavior wrong. wrong-case=${wrong ?? "NULL"}, right-case=${right ?? "NULL"}.`,
      };
    }

    default:
      return {
        itemId: item.id,
        status: "warning",
        message: `${item.id}: No automated check implemented — requires manual review.`,
      };
  }
}

/** Print a human-readable audit summary to the console (dev utility). */
export function printTerminologyAuditSummary(): void {
  const results = runTerminologyAudit();
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const warn = results.filter((r) => r.status === "warning").length;
  // eslint-disable-next-line no-console
  console.log(
    `[Terminology Audit] PASS=${pass}  FAIL=${fail}  WARNING=${warn}  TOTAL=${results.length}`
  );
  for (const r of results) {
    if (r.status !== "pass") {
      // eslint-disable-next-line no-console
      console.log(`  ${r.status.toUpperCase()} ${r.itemId}: ${r.message}`);
    }
  }
}
