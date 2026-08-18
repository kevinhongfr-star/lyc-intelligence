# Terminology Audit Checklist Specification v1.0

**Status:** APPROVED (Batch 6 P0 Corrective Pass)
**Origin:** Akira canon audit of Batch 6 files — 12 P0 issues identified
**TS Implementation:** `src/constants/terminologyAuditChecklist.ts`
**Related Specs:** `terminologyReference.md`, `crossBatchConsistency.md`

---

## 1. Purpose

Defines the **audit checklist items** that every batch must pass before its terminology is considered "canonical". Covers both **automated checks** (runnable via `runTerminologyAudit()`) and **manual-review items** (require human triage).

This document is the **audit plane** — it doesn't define what the correct terminology is (that's `terminologyReference.md`), but rather **how to verify** that each surface complies.

---

## 2. How To Use This Checklist

### 2.1 Automation

```bash
# In a node/TS environment that imports the constants:
import { printTerminologyAuditSummary } from "./src/constants/terminologyAuditChecklist";
printTerminologyAuditSummary();
# Output: [Terminology Audit] PASS=N  FAIL=M  WARNING=K  TOTAL=O
# Plus a line per non-pass item explaining the issue.
```

### 2.2 Manual Review

Items flagged `requiresManualReview: true` or returning status `"warning"` need human eyes. For each:
1. Open the referenced file(s) or surface.
2. Follow the "verification steps" in the item description.
3. Record the finding (pass / fail with evidence).
4. If fail → open a P0/P1 ticket linked to the original batch.

### 2.3 Cadence

| Event | Audit Scope | Owner |
|-------|-------------|-------|
| Batch merge to `main` | Full automated run + manual review of new surfaces | Batch lead |
| Weekly canon sync | Full automated run + spot-check manual items | Terminology steward (Akira) |
| Marketing copy deploy | `validateUserFacingCopy()` on new strings | Marketing lead |
| NEXUS prompt update | `validateUserFacingCopy(..., "nexus-chat")` | NEXUS lead |

---

## 3. Checklist Items (All P0)

### 3.1 P0-1 — Internal Codenames Removed From User-Facing

#### P0-1a: SHIFT not in APPROVED_DIAGNOSTICS user-facing fields
- **Severity:** P0
- **Check:** `runSingleCheck("P0-1a")`
- **Automated:** Yes
- **Pass Condition:** The strings "SHIFT" / "CANVAS" / "TRIDENT" / "MERIDIAN" do NOT appear in any `fullName`, `shortDescriptor`, or `b2cName` field of `APPROVED_DIAGNOSTICS`. They may appear ONLY inside `identity.category` (INTERNAL-ONLY metadata).
- **Evidence if fail:** List of `code.field` pairs containing codenames.

#### P0-1b: CANVAS / TRIDENT / MERIDIAN not in user-facing surfaces
- **Severity:** P0
- **Automated:** No (manual review required)
- **Verification steps:**
  1. Grep all `*.tsx`, `*.md`, `*.html` files for the 4 codenames.
  2. For each occurrence, classify the context:
     - `identity.category` in diagnostic JSON configs → ✅ **OK (internal metadata)**
     - Internal code comment, route handler variable name → ✅ **OK (technical-internal)**
     - UI label (`<span>`, `<Chip>`, nav item, page title, SEO meta) → ❌ **FAIL (user-facing)**
     - NEXUS system prompt / chat output template → ❌ **FAIL (user-facing)**
  3. Fail if any user-facing context has a codename.

#### P0-1c: 4 codenames registered in BANNED_WORDS at Level 1
- **Severity:** P0
- **Check:** `runSingleCheck("P0-1c")`
- **Automated:** Yes
- **Pass Condition:** All 4 words (SHIFT, CANVAS, TRIDENT, MERIDIAN) appear in `BANNED_WORDS` with `level: 1`.

---

### 3.2 P0-2 — CPI Descriptor Corrected

#### P0-2a: CPI fullName === "China Leadership Pipeline Index"
- **Severity:** P0
- **Check:** `runSingleCheck("P0-2a")`
- **Automated:** Yes
- **Pass Condition:** `APPROVED_DIAGNOSTICS.find(CPI).fullName === "China Leadership Pipeline Index"`
- **Fail variants:**
  - Old wrong: "Council Performance Insight" (full grep across codebase → 0 hits — P0-2c)
  - Shorthand: "China Leadership Pipeline Diagnostic" (acceptable in legacy renderer comments ONLY; must be Index in canonical reference)

#### P0-2b: CPI shortDescriptor === "leadership pipeline index"
- **Severity:** P0
- **Check:** `runSingleCheck("P0-2b")`
- **Automated:** Yes
- **Pass Condition:** Exact lowercase string match.

#### P0-2c: No stale "Council Performance Insight" references
- **Severity:** P1 (supporting)
- **Automated:** Grep (semi-automated)
- **Pass Condition:** Global search across `src/`, `specs/`, `index.html`, SEO metadata → **0 occurrences**.

---

### 3.3 P0-3 — Mile Cost Table Locked Canon

#### P0-3a: INSTRUMENT_MILE_COST exactly matches Kevin's locked table
- **Severity:** P0
- **Check:** `runSingleCheck("P0-3a")`
- **Automated:** Yes
- **Pass Condition (deep-equality against canon):**

  ```
  LEAP: 1
  PRISM: 2, IMPACT: 2, COACH: 2, DRIVE: 2, QUEST: 2
  BRIDGE: 3, MOSAIC: 3, SPARK: 3, FORGE: 3
  CPI: 5
  ```

- **Evidence if fail:** List of `{ code, got, want }` mismatches plus any unexpected keys.

#### P0-3b: No 99/149/199 mi values in Batch 6 surfaces
- **Severity:** P0
- **Automated:** Grep
- **Scope:** These 4 new files → `miles.ts`, `terminologyReference.ts`, `terminologyAuditChecklist.ts`, `crossBatchConsistency.ts`
- **Pass Condition:** These 4 files contain **zero references** to mile cost 99, 149, or 199.
- **Note:** Legacy `catalog.ts` still uses 99/149/199 for assessment-level pricing tiers, but that's a separate `PricingTier` concept from instrument mile cost. The INSTRUMENT-level cost in catalog.ts (`CANONICAL_PRICE_MILES`) must be updated to 1/2/3/5 separately.

#### P0-3c: Exactly 11 instruments, no codename keys
- **Severity:** P0
- **Check:** `runSingleCheck("P0-3c")`
- **Automated:** Yes
- **Pass Condition:** `Object.keys(INSTRUMENT_MILE_COST).length === 11` AND no key is `SHIFT` / `CANVAS` / `TRIDENT` / `MERIDIAN` (e.g. no pseudo-key `SHIFT_LEAP`).

---

### 3.4 P0-4 — "Platform" Banned Word

#### P0-4a: "platform" entry in BANNED_WORDS with technical-context distinction
- **Severity:** P0
- **Check:** `runSingleCheck("P0-4a")`
- **Automated:** Yes
- **Pass Condition:** BANNED_WORDS contains a "platform" entry with all of:
  - `level === 1`
  - `allowTechnicalContext === true`
  - Rationale explicitly mentions: (a) it's banned as a **product descriptor**, and (b) it's allowed in **technical/architecture** contexts.

#### P0-4b: NEXUS positioning = "Executive Intelligence", not "Executive Intelligence Platform"
- **Severity:** P0
- **Check:** `runSingleCheck("P0-4b")` + manual
- **Pass Condition:**
  - `NEXUS_POSITIONING.positioningLine === "Executive Intelligence"` (2 words, no noun after)
  - The banned-word rule for "platform" correctly flags any surface containing "Executive Intelligence Platform"

#### P0-4c: Marketing copy scan (manual review)
- **Severity:** P1
- **Automated:** No
- **Verification steps:**
  1. Open `index.html`, all page `<title>` tags, SEO meta descriptions in `pageMetadata.ts`, hero headers in landing pages, NEXUS chat onboarding copy.
  2. For each instance of "platform", apply the test: can I replace "platform" with "Executive Intelligence" and the sentence still works?
  3. If yes → it's a product descriptor → **FAIL**, replace with alternative.
  4. If no (clearly about engineering architecture, technical teams, or the internal settings area) → **PASS**.

---

### 3.5 P0-5 — "Diagnostic" Default User-Facing Term

#### P0-5a: DIAGNOSTIC_VS_ASSESSMENT_RULES documented with usage guidelines
- **Severity:** P0
- **Automated:** Structural (count entries, confirm fields present)
- **Pass Condition:**
  - At least 3 entries in the rules array covering:
    1. `diagnostic` → preferred / user-facing
    2. `diagnostic assessment` → allowed / user-facing
    3. `assessment` → allowed / technical-internal with explicit `allowedContexts[]` list
  - Each entry has `guidance` + `examples[]` with bad → good transformations.

#### P0-5b: Audit checklist contains "assessment vs diagnostic" items
- **Severity:** P0
- **Check:** `runSingleCheck("P0-5b")`
- **Automated:** Yes
- **Pass Condition:** `TERMINOLOGY_AUDIT_CHECKLIST.filter(i => i.p0_ref === "P0-5").length >= 2`
- **Rationale:** Self-referential meta-check ensuring the audit itself covers the rule.

#### P0-5c: `suggestDiagnosticTermReplacement()` utility works correctly
- **Severity:** P1
- **Check:** `runSingleCheck("P0-5c")`
- **Automated:** Yes
- **Test cases:**
  - `("Take our assessment", "user-facing")` → returns non-null string (flags it)
  - `("assessmentEngine.evaluate()", "technical-internal")` → returns null (allows it)

---

### 3.6 P0-6 — Tier Names Rule (Ban in Casual Chat, Allow in Upgrade/Pricing)

#### P0-6a: Audit checklist item states the nuanced rule
- **Severity:** P0
- **Automated:** Structural
- **Pass Condition:** The P0-6a checklist item description explicitly lists both:
  - **HARD BAN contexts:** Casual coaching NEXUS chat, diagnostic narratives, insights, reflection prompts, any normal coaching immersion where tier talk would break the frame.
  - **EXPLICITLY ALLOWED contexts:** Upgrade/downgrade recommendations (NEXUS says "Pro would give you X"), pricing pages, pricing comparison tables, account/billing pages, credit gates/upgrade modals, user asks directly about tiers.

#### P0-6b: NEXUS system prompt encodes immersion rule
- **Severity:** P1
- **Automated:** No (manual review of `nexusKnowledge.ts` system prompt)
- **Verification steps:**
  1. Read the NEXUS system prompt / persona / guardrails section.
  2. Confirm it contains language like: "Do not reference the user's subscription tier during normal coaching conversations. Only mention tiers when (a) recommending an explicit upgrade, (b) explaining pricing, or (c) the user directly asks about their tier status."
  3. Confirm the upgrade-CTA trigger logic surfaces tier names **only** inside the upgrade modal/flow, not in general chat turns.

---

### 3.7 P0-7 — "Pro" = Canonical Display Name

#### P0-7a: TIER_KEYS display_name for `professional` === "Pro"
- **Severity:** P0
- **Check:** `runSingleCheck("P0-7a")`
- **Automated:** Yes
- **Pass Condition:** `TIER_KEYS.find(t => t.tier_key === "professional").display_name === "Pro"`

#### P0-7b: All 5 tier display names in correct order
- **Severity:** P0
- **Check:** `runSingleCheck("P0-7b")`
- **Automated:** Yes
- **Pass Condition:** When sorted by `order`, TIER_KEYS display names = `["Explorer", "Starter", "Pro", "Executive", "Council"]`

#### P0-7c: `validateTierDisplayName()` rejects "Professional"
- **Severity:** P1
- **Check:** `runSingleCheck("P0-7c")`
- **Automated:** Yes
- **Test cases:**
  - `("Professional", "professional")` → returns non-null error string
  - `("Pro", "professional")` → returns null (passes)

---

## 4. Mapping of Checklist → P0 Coverage

| P0 Issue | Checklist Item IDs |
|----------|-------------------|
| P0-1 Internal codenames removed | P0-1a, P0-1b, P0-1c |
| P0-2 CPI descriptor corrected | P0-2a, P0-2b, P0-2c |
| P0-3 Mile cost table locked canon | P0-3a, P0-3b, P0-3c |
| P0-4 "Platform" banned word | P0-4a, P0-4b, P0-4c |
| P0-5 Diagnostic vs Assessment | P0-5a, P0-5b, P0-5c |
| P0-6 Tier names context rule | P0-6a, P0-6b |
| P0-7 "Pro" display name canon | P0-7a, P0-7b, P0-7c |

---

## 5. Acceptance Criteria (Audit Pass)

A batch is **terminology-canonical** only when:

1. **All automated P0 items return `"pass"`** (zero `fail` status on P0-severity items).
2. **All manual-review P0 items are triaged** with a written finding in the batch PR.
3. **The terminology audit is linked** from the batch release notes.
4. **Cross-batch consistency rules are passing** (see `crossBatchConsistency.md`).
