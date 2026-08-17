# Cross-Batch Consistency Rules Specification v1.0

**Status:** APPROVED (Batch 6 P0 Corrective Pass)
**TS Implementation:** `src/constants/crossBatchConsistency.ts`
**Related Specs:** `terminologyReference.md`, `terminologyAuditChecklist.md`

---

## 1. Purpose

Defines the **cross-cutting consistency rules** that must hold across ALL batches in the LYC Intelligence product — from Batch 2 (foundational) through Batch 6 (this corrective) and any future batches. Rules here are not batch-specific; they encode the invariant guarantees that allow terminology, pricing, and UX to stay coherent as the product evolves.

Each rule links back to the P0 issue that triggered it and includes an automated validator where possible.

---

## 2. Rule Format

Every rule in this spec has:

| Field | Meaning |
|-------|---------|
| **ID** | Stable identifier (CBC-`<domain>`-`<NNN>`). Never reuse. |
| **P0 Refs** | Which Batch 6 P0 issues the rule enforces. |
| **Severity** | `hard` = blocks release on fail; `soft` = warn in CI; `context-dependent` = see context matrix. |
| **Scope** | Surfaces the rule applies to: nexus-chat, marketing-copy, product-ui, pricing-billing, api-internal, or all-surfaces. |
| **Description** | Plain-language statement of what the rule requires. |
| **Context Matrix** | For context-dependent rules: what's explicitly allowed vs explicitly banned. |
| **Validate** | TypeScript validator `(input, context) => string | null` — null = pass, string = error message. |

---

## 3. Rules Table

### 3.1 Codename Rules (P0-1)

#### CBC-CODENAME-001: Internal codenames NEVER appear in user-facing surfaces

| Field | Value |
|-------|-------|
| **ID** | CBC-CODENAME-001 |
| **P0 Refs** | P0-1 |
| **Severity** | hard |
| **Scope** | nexus-chat, marketing-copy, product-ui, pricing-billing |
| **Automated** | Yes (regex-based) |

**Rule:**

The four internal project codenames — **SHIFT, CANVAS, TRIDENT, MERIDIAN** — must never appear in:
- NEXUS chat output (any turn)
- Landing page copy, hero titles, SEO descriptions
- UI labels, badges, chips, navigation items, category headings
- Pricing grids, feature matrices, billing pages

They are **permitted only** in:
- `identity.category` field inside backend diagnostic JSON configs
- Internal code comments that explain the codename history
- Database tables if the column is explicitly tagged `internal_only`

**Automated check:** Scans input string for the 4 whole-word matches (case-sensitive because they're all-caps identifiers). Returns error listing the offending codenames.

---

#### CBC-CODENAME-002: Cross-batch category labels are plain-language

| Field | Value |
|-------|-------|
| **ID** | CBC-CODENAME-002 |
| **P0 Refs** | P0-1 |
| **Severity** | hard |
| **Scope** | product-ui, marketing-copy, nexus-chat |
| **Automated** | Yes (structural) |

**Rule:**

When grouping the 11 diagnostics for display across any batch, use **exactly these 3 labels**:

| Grouping Key | User-Facing Label |
|-------------|-------------------|
| `flagship` (CPI) | Flagship Diagnostic |
| `career_core` (LEAP, QUEST, IMPACT, DRIVE, COACH) | Career Core Diagnostics |
| `advisory` (PRISM, BRIDGE, MOSAIC, SPARK, FORGE) | Advisory Diagnostics |

**Banned replacements (never use):**
- ❌ "SHIFT Suite", "SHIFT 5-pack", "SHIFT Battery"
- ❌ "CANVAS Products", "CANVAS Suite"
- ❌ "TRIDENT Tier", "TRIDENT Scoring"
- ❌ "MERIDIAN Pack", "MERIDIAN Diagnostics"

**Structural check:** Verifies that `getUserFacingCategoryLabel()` returns labels free of the 4 codenames for a sample of all 3 category types.

---

### 3.2 Mile Cost Rules (P0-3)

#### CBC-MILES-001: INSTRUMENT_MILE_COST is the single source of truth

| Field | Value |
|-------|-------|
| **ID** | CBC-MILES-001 |
| **P0 Refs** | P0-3 |
| **Severity** | hard |
| **Scope** | all-surfaces |
| **Automated** | Yes (structural) |

**Rule:**

Every batch that references per-instrument mile costs **MUST** derive the value from `INSTRUMENT_MILE_COST` in `src/constants/miles.ts`. No exceptions:

- ✅ `const cost = INSTRUMENT_MILE_COST[instrumentCode];`
- ❌ `const cost = { LEAP: 99, PRISM: 149, ... }[code];` (local copy)
- ❌ `const cost = 99;` (hardcoded inline)
- ❌ Catalog file has `CANONICAL_PRICE_MILES = { ... }` that duplicates the table without importing

**Structural check:** Verifies `Object.keys(INSTRUMENT_MILE_COST)` matches `APPROVED_DIAGNOSTIC_CODES` exactly (same 11 codes, same count, no extras).

---

#### CBC-MILES-002: APPROVED_DIAGNOSTICS milesCost agrees with INSTRUMENT_MILE_COST

| Field | Value |
|-------|-------|
| **ID** | CBC-MILES-002 |
| **P0 Refs** | P0-3 |
| **Severity** | hard |
| **Scope** | all-surfaces |
| **Automated** | Yes (structural) |

**Rule:**

For every entry in `APPROVED_DIAGNOSTICS`, the field `milesCost` must be **structurally equal** to `INSTRUMENT_MILE_COST[entry.code]`.

This is a belt-and-braces check — if batch N edits `miles.ts` and batch N+1 edits `terminologyReference.ts` independently, they'd silently diverge. This rule catches that.

**Structural check:** Iterates all 11 diagnostics. Returns a list of mismatches (`code: got X vs want Y`) plus any entries missing from `INSTRUMENT_MILE_COST`.

---

### 3.3 Positioning Rules (P0-4)

#### CBC-POS-001: "Executive Intelligence", not "Executive Intelligence Platform"

| Field | Value |
|-------|-------|
| **ID** | CBC-POS-001 |
| **P0 Refs** | P0-4 |
| **Severity** | hard |
| **Scope** | marketing-copy, product-ui, nexus-chat |
| **Automated** | Yes (string + banned-word integration) |

**Rule:**

1. The exact string `"Executive Intelligence Platform"` is **HARD BANNED** in every scope — no exceptions. Always replace with the 2-word interim positioning: **"Executive Intelligence"**.

2. Any other use of "platform" as a **product descriptor noun** (preceded by "our", "the", "this" and 0-1 modifiers) is flagged:
   - ❌ "Our platform delivers 11 diagnostics"
   - ❌ "Upgrade to the platform today"
   - ✅ "Our platform engineering team uses Kubernetes" (technical context → allowed)

Heuristic for (2): If you can replace "platform" with "Executive Intelligence" and the sentence still makes semantic sense, it's being used as a product descriptor → flag it.

---

### 3.4 Tier Name Rules (P0-6, P0-7)

#### CBC-TIER-001: Tier names — ban in casual chat, allow in upgrade/pricing

| Field | Value |
|-------|-------|
| **ID** | CBC-TIER-001 |
| **P0 Refs** | P0-6 |
| **Severity** | context-dependent |
| **Scope** | nexus-chat, product-ui, marketing-copy |
| **Automated** | Heuristic (keyword-based context detection) |

**This is the most nuanced rule in the cross-batch set. It is NOT a blanket ban.**

##### Context Matrix

| **EXPLICITLY BANNED (hard)** | **EXPLICITLY ALLOWED** |
|-------------------------------|------------------------|
| Casual NEXUS coaching flow — mid-conversation, tier names dropped without context. E.g. NEXUS says "As a Starter user I should point out…" during a coaching reflection. | **Upgrade/recommendation context.** NEXUS explicitly recommends a tier because it unlocks a feature: "If you upgrade to Pro, you'd receive 360° rater access plus 150 miles/month." |
| Diagnostic report narrative, dimension interpretations, key insights sections. | **Pricing pages, pricing grids, pricing comparison tables, pricing FAQs.** Any surface whose primary job is to explain or compare tiers. |
| Development activity suggestions, reflection prompts, learning path copy. | **Account / billing / subscription management pages.** Tiers are literally the subject matter of the page. |
| Any NEXUS chat turn where the user is discussing their career strategy, diagnostic results, or development — not pricing or subscription. | **Credit gates / upgrade modals.** "This diagnostic costs 2 miles. Starter includes 50/mo — upgrade to Pro for 150/mo." Perfect use case. |
|  | **Direct user question.** "What tier am I on?" or "What does Council include?" → obviously NEXUS must answer with tier names. |

**Immersion framing (the WHY):**

The purpose of the rule is **not** to make NEXUS pretend tiers don't exist. The purpose is to keep NEXUS in character as an executive thinking partner during normal coaching. If NEXUS is mid-sentence analyzing your CPI leadership presence dimension and suddenly blurts out "Starter users can't see the full benchmark," it yanks you out of the thinking-partner frame and reminds you you're on a freemium app. That's the immersion we protect.

**Automated heuristic:** For any user-facing copy mentioning a tier display name:
- If scope is literally `pricing-billing`, allow.
- If scope is `nexus-chat` and the copy contains keywords like `upgrade|downgrade|price|pricing|cost|subscribe|subscription|billing|plan|tier|credit gate|miles per month|monthly|includes|what tier|which tier|council includes` → allow.
- Otherwise → flag as potential ban.

---

#### CBC-TIER-002: "Pro" (not "Professional") as display name

| Field | Value |
|-------|-------|
| **ID** | CBC-TIER-002 |
| **P0 Refs** | P0-7 |
| **Severity** | hard |
| **Scope** | marketing-copy, product-ui, pricing-billing, nexus-chat |
| **Automated** | Yes (regex + structural) |

**Rule:**

The user-facing **display name** for the subscription tier with backend key `professional` is **Pro**.

- ❌ "Professional Plan" — user-facing. Replace with "Pro Plan".
- ❌ "Upgrade to Professional" — user-facing. Replace with "Upgrade to Pro".
- ❌ Pricing table header "Professional" — user-facing. Replace with "Pro".
- ✅ `tier_key = "professional"` — backend DB column / code. Fine.
- ✅ "Professional Deep-Dive" — the name of an assessment add-on tier (a different concept, not the subscription tier). Fine.
- ✅ `SHARED_PRICING_TIERS[1].tier = "professional"` — internal key for the assessment pricing tier (not the subscription tier display name). Fine.

**Automated check:** Regex matches "Professional Tier", "Professional Plan", "Professional Subscription", "Professional Users", "Professional Access", "Professional Edition" — all banned in user-facing scopes. Additionally structural-checks `TIER_KEYS.find(professional).display_name === "Pro"`.

---

#### CBC-TIER-003: All 5 tier display names match canon

| Field | Value |
|-------|-------|
| **ID** | CBC-TIER-003 |
| **P0 Refs** | P0-7 |
| **Severity** | hard |
| **Scope** | all-surfaces |
| **Automated** | Yes (structural) |

**Rule:**

No batch may invent a new subscription tier name. The canon is immutable:

```
Explorer → Starter → Pro → Executive → Council
```

If a product requirement calls for a new tier name (e.g. "VIP"), it requires:
1. Brand team sign-off (Emily or Akira)
2. A P0 corrective to this spec
3. Update to `TIER_KEYS` in `terminologyReference.ts`
4. Re-run of cross-batch structural checks

**Structural check:** Sorts `TIER_KEYS` by `order`, verifies length 5, and compares each `display_name` against `tierDisplayName(tier_key)` (the canonical lookup). Reports any mismatches.

---

## 4. Validation Utilities

### 4.1 `runCrossBatchStructuralChecks()`

Runs all structural (input-independent) checks against the current state of the constants. Returns an array of `{ ruleId, p0_refs, status, message }` for every rule.

- Rules with no automated validator return `"warning"` (manual review needed).
- Rules with validate() run it against an empty input in the `"all-surfaces"` scope.
- Any exception during validation → `"fail"` with exception message.

### 4.2 `validateUserFacingCopy(copy: string, context: RuleScope)`

For runtime / CI-time linting of actual strings. Runs every applicable rule (based on scope) against the copy.

Typical usage:
```ts
const results = validateUserFacingCopy(pricingTableHtml, "pricing-billing");
const fails = results.filter(r => r.status === "fail");
if (fails.length > 0) blockDeploy(fails);
```

### 4.3 Dev-time Import Side Effect

Both `miles.ts` and `crossBatchConsistency.ts` run structural self-checks on import in dev environments (`import.meta.env.DEV === true`). If structural checks fail, a warning is emitted to the browser/node console so the developer sees the problem immediately rather than in CI.

---

## 5. Rule ↔ P0 Coverage Matrix

| Rule ID | Enforces P0 |
|---------|-------------|
| CBC-CODENAME-001 | P0-1 (codename surfaces) |
| CBC-CODENAME-002 | P0-1 (category labels) |
| CBC-MILES-001 | P0-3 (SSOT) |
| CBC-MILES-002 | P0-3 (milesCost agreement) |
| CBC-POS-001 | P0-4 (positioning + platform ban) |
| CBC-TIER-001 | P0-6 (tier name context rule) |
| CBC-TIER-002 | P0-7 (Pro vs Professional) |
| CBC-TIER-003 | P0-7 (5-tier canon) |

---

## 6. Acceptance Criteria

The cross-batch consistency layer is **passing** iff:

1. `runCrossBatchStructuralChecks()` returns **zero `fail` results** (warnings for manual review are OK).
2. All new marketing copy is linted with `validateUserFacingCopy(..., "marketing-copy")` before deploy.
3. All NEXUS prompt updates are linted with `validateUserFacingCopy(..., "nexus-chat")` before merge.
4. No batch PR is merged that contains a P0 fail from `runCrossBatchStructuralChecks()`.
5. Tier CBC-TIER-001 is manually verified at NEXUS prompt-change time (heuristic covers 80% but nuanced immersion calls need human review).
