# Cross-Batch Consistency Audit Framework

**Batch 6 / Ticket 3 — Final QA alignment process.**

> Runs after Batches 2B, 3, 4, 5 are complete. Defines consistency criteria, cross-batch dependency tracking, the brand voice QA rubric, and the Lighthouse / accessibility copy pass checklist. This is the LAST polish pass before release.

**Config source of truth:** [`src/config/crossBatchConsistency.ts`](../src/config/crossBatchConsistency.ts)

---

## 1. Consistency Criteria (7)

| # | Criterion | Severity | Rule |
|---|-----------|----------|------|
| 1 | **NEXUS Naming** | Blocker | Entity name = NEXUS everywhere. Never "the coach", "the AI", "your assistant", "the chatbot". Always ALL CAPS. |
| 2 | **Tier Display Names** | Major | Canonical display names from `tiers.ts`: Explorer, Starter, Professional, Executive, Council. Capitalization, positioning, price formatting consistent. |
| 3 | **Mile Cost Display Format** | Blocker | Consistent "X miles" pattern. Singular "1 mile", plural "X miles". Zero-cost = "Complimentary". Never "credits", "tokens", "Free", "$0". |
| 4 | **CTA Consistency** | Major | Primary CTA language consistent across all surfaces. Uses `TIER_CTA_LABEL` from `tierConfig.ts`. No "Sign Up Free", "Buy Now", "Get Started". |
| 5 | **Upgrade Path Language** | Blocker | Soft gate consistency. No tier names in NEXUS chat. Soft gates use acknowledge → specific value → best alternative → upgrade direction. |
| 6 | **Tone Consistency** | Major | Marketing vs product vs chat — different registers, same brand voice. All three: no banned words, no emoji, no exclamation points. |
| 7 | **Format Consistency** | Major | No emoji rule. No exclamation points. NEXUS ALL CAPS, diagnostic codes ALL CAPS, tier names Title Case. Sentence case for body copy. |

**Verify:** Codebase-wide grep per criterion. Blockers must be zero; majors must be zero; minors logged as follow-up.

---

## 2. Cross-Batch Dependency Tracking

The final pass depends on outputs from prior batches. This table tracks which batches feed in and whether they're complete.

| Batch | Delivers | Affects Criteria | Required? | Status |
|-------|----------|------------------|-----------|--------|
| **Batch 1.5** | 5-tier system (`tiers.ts`), tier feature matrix, mile economy foundation | tier_display, mile_cost_format, upgrade_path | ✅ Yes | Complete |
| **Batch 2A** | Mile engine, Explorer complimentary tokens, MileCostBadge, NEXUS mile integration | mile_cost_format, nexus_naming, cta | ✅ Yes | Complete |
| **Batch 2B** | Voice standard, quality enforcer, brand guardrails, NEXUS personas, QA eval framework | nexus_naming, tone, format, upgrade_path | ✅ Yes | Complete |
| **Batch 2 Corrective** | Banned word remediation, "Framework"→"Model" rename, "Prompt Architecture"→"Prompt System Design" | nexus_naming, tone, format | ✅ Yes | Complete |
| **Batch 3** | Assessment flow + depth pages, results panel, diagnostic catalog | mile_cost_format, tier_display, cta, tone | ✅ Yes | Pending |
| **Batch 4** | Email engine + templates, transactional + marketing email | nexus_naming, tone, format, cta | ✅ Yes | Pending |
| **Batch 5** | Onboarding wizard, settings/account, mile balance/packs, debrief booking | tier_display, cta, tone, mile_cost | ✅ Yes | Pending |
| **Batch 6** | Unified terminology reference, audit checklist, this consistency framework | All 7 criteria | ✅ Yes | In Progress |

**Prerequisite gate:** `arePrerequisitesMet()` returns `{ met: false, pendingBatches: [...] }` until Batches 3, 4, 5 are complete. The final pass cannot start until all required batches are marked complete.

---

## 3. Brand Voice QA Rubric (quick-score 1-5)

Score each of the 12 surfaces against 5 dimensions. Same **3.8/5.0 bar** as the quality enforcer. A surface scoring < 3.8 fails.

| Dimension | Weight | Score 5 (exemplary) | Score 1 (critical failure) |
|-----------|--------|---------------------|----------------------------|
| **NEXUS Identity** | 25 | NEXUS referenced consistently. Zero banned entity references. Feels like a seasoned advisor. | Multiple "the AI", "the coach", or chatbot self-identification. |
| **Banned Word Compliance** | 25 | Zero banned words. No "free", no SaaS jargon, no hype, no AI-bro language. | Multiple hard-banned words ("free", "framework", "credits"). |
| **Tone & Register** | 20 | Register matches context. Premium, not SaaS. No emoji, no exclamation. | Wrong register. Emoji or exclamation present. |
| **Terminology Consistency** | 20 | All terms match `terminologyReference.ts`. "miles" not "credits", "milestones" not "bookmarks", "profile" not "account". | Multiple terminology violations. |
| **Diagnostic Accuracy** | 10 | All 11 names, descriptors, taglines, mile costs match `APPROVED_DIAGNOSTICS` + `INSTRUMENT_MILE_COST`. | Wrong diagnostic name, descriptor, or mile cost. |

**Compile:** `compileBrandVoiceScore(surface, rawScores)` returns weighted overall (1-5) + `passing` boolean (>= 3.8).

---

## 4. Lighthouse / Accessibility Copy Pass Checklist

### Lighthouse (gate on score)

| Check | Acceptance |
|-------|------------|
| Performance | >= 90 on all primary routes (/, /pricing, /assessment, /nexus/chat) |
| Accessibility | >= 95 on all primary routes |
| Best Practices | >= 95 on all primary routes |
| SEO | >= 95 on all primary routes |

### Accessibility (copy-related)

| Check | Acceptance |
|-------|------------|
| Image alt text | All informative images have descriptive alt. No banned words in alt. |
| ARIA labels | All interactive elements have accessible names. Labels use canonical terms ("Milestones" not "Bookmarks"). |
| Color contrast | Text >= 4.5:1 (normal), >= 3:1 (large). UI components >= 3:1. Verify accent #C108AB. |
| Heading hierarchy | Single h1 per page. No skipped levels. Diagnostic names in headings ALL CAPS. |
| Form labels | Every input has a visible label. No placeholder-as-label. "profile" not "account". |

### Copy (a11y-adjacent)

| Check | Acceptance |
|-------|------------|
| HTML lang attribute | `<html lang="en">` in index.html + email templates |
| Page `<title>` tags | Every route has descriptive title. Canonical terms. No banned words. Format: "Page Name \| LYC Intelligence" |
| Meta descriptions | Every public route has 80-160 char description. No banned words. No emoji. |
| Focus order + visible focus | Tab order follows visual order. Visible focus indicator on all interactive elements. |

**Verify:** Lighthouse in CI per route. axe-core scan per route. Manual keyboard navigation spot-check.

---

## 5. Final QA Pass Process (6 phases)

The final pass runs sequentially through 6 phases. Each phase has exit criteria that must be met before the next begins.

### Phase 1 — Prerequisite Check
**Owner:** Build lead
- Run `arePrerequisitesMet()` from `crossBatchConsistency.ts`
- Confirm `CROSS_BATCH_DEPENDENCIES` status for each batch
- Block final pass if any required batch is pending/in_progress
- **Exit:** All `requiredForFinalPass` batches marked "complete"; zero `pendingBatches`

### Phase 2 — Terminology Audit
**Owner:** Akira (Diagnostic Content Integrity)
- Run `AUDIT_CHECKLIST` items per surface (`terminologyAuditChecklist.ts`)
- Run `CROSS_SURFACE_CHECKS` (6 cross-surface consistency checks)
- Verify `BANNED_WORD_PER_SURFACE` risk profiles
- Record `AuditResult` (pass/fail/pending) per item
- **Exit:** Zero "fail" items; zero "pending" items; `compileFullAuditReport()` returns "PASS"

### Phase 3 — Consistency Criteria
**Owner:** Akira + Build lead
- Verify all 7 `CONSISTENCY_CRITERIA` across batches
- NEXUS naming, tier display, mile cost format, CTA, upgrade path, tone, format
- **Exit:** All 7 criteria pass (zero blockers, zero majors); minors logged as follow-up

### Phase 4 — Brand Voice Scoring
**Owner:** Brand + Akira
- Score each of 12 surfaces against `BRAND_VOICE_RUBRIC` (5 dimensions)
- Compile `BrandVoiceScore` per surface via `compileBrandVoiceScore()`
- Flag any surface scoring < 3.8 as failing
- **Exit:** All 12 surfaces score >= 3.8 (`passing: true`); no dimension scored 1

### Phase 5 — Lighthouse + Accessibility
**Owner:** Build lead + a11y reviewer
- Run Lighthouse (Performance, Accessibility, Best Practices, SEO) per route
- Run axe-core accessibility scan per route
- Verify `LIGHTHOUSE_A11Y_CHECKLIST` items (15 checks)
- Spot-check screen reader navigation on key flows
- **Exit:** Lighthouse Performance >= 90, Accessibility >= 95; all checklist items pass; zero axe-core violations

### Phase 6 — Sign-Off
**Owner:** Akira + Build lead
- Akira reviews terminology audit + brand voice scores
- Build lead reviews consistency + Lighthouse/a11y results
- Record sign-off in release notes
- Archive audit reports for provenance
- **Exit:** Akira sign-off recorded; Build lead sign-off recorded; all audit reports archived

---

## Programmatic Usage

```typescript
import {
  CONSISTENCY_CRITERIA,
  CROSS_BATCH_DEPENDENCIES,
  BATCHES_REQUIRED_FOR_FINAL_PASS,
  arePrerequisitesMet,
  BRAND_VOICE_RUBRIC,
  compileBrandVoiceScore,
  LIGHTHOUSE_A11Y_CHECKLIST,
  FINAL_PASS_PROCESS,
  generateFinalPassReport,
  CROSS_BATCH_FRAMEWORK_SUMMARY,
} from '@/config/crossBatchConsistency';
```

---

## Acceptance

- [x] Final QA alignment process defined (6 phases with exit criteria)
- [x] 7 consistency criteria documented with severity + verify methods
- [x] Cross-batch dependency tracking (8 batches, prerequisite gate)
- [x] Brand voice QA rubric (5 dimensions, 1-5 score, 3.8 bar)
- [x] Lighthouse / accessibility copy pass checklist (15 checks)
- [x] Process for final QA pass with scoring rubric
