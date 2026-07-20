# Diagnostic Suite — Comprehensive Gap Analysis

**Audit Date:** 2026-07-20  
**Auditor:** NEXUS  
**Scope:** All 13 diagnostic instruments — Notion specs vs code implementation  
**Status:** DECISIONS LOCKED — See §5 Resolutions  
**Related:** `ASSESSMENT_UNIFIED_SPEC_v1.md`, `AUDIT_B2C_01_LANDING.md`, `AUDIT_B2C_02_ASSESSMENT.md`

---

## Executive Summary

The platform has **13 diagnostic instruments** defined in Notion, but the codebase implements them in a fragmented, inconsistent, and largely disconnected way. There are **three separate assessment systems** running in parallel with no unified architecture:

1. **CPD Assessment** (`AssessmentWizard.tsx` + `assessmentEngine.ts`) — 25 questions, 5 dimensions, 6 archetypes — **does not match any spec**
2. **SHIFT Composite** (`SHIFTAssessmentWizard.tsx` — 1,320 lines) — 5 sub-assessments (LEAP/QUEST/DRIVE/COACH/IMPACT) — partially implemented
3. **TRIDENT** (`tridentScoring.ts`) — candidate scoring for search — B2B tool, different purpose entirely

Meanwhile, **FEA (Force Exposure Assessment)** — the intended entry-point diagnostic per Notion C1.22 — **has zero code implementation**.

### Critical Finding: The diagnostic suite has no unified engine. Each instrument was built (or not built) independently, with different data models, scoring logic, UX patterns, and no shared infrastructure.

---

## 1. Full Diagnostic Inventory

### 1.1 Notion Specs (13+ Instruments)

| # | Diagnostic | Notion Assets | Category | Target |
|---|---|---|---|---|
| 1 | **FEA** (Force Exposure Assessment) | Spec + Question Bank + Report Template + Client Intro Pack | Entry diagnostic | B2C → B2B pipeline |
| 2 | **SHIFT Composite** | Client Briefing Deck | Composite (all forces) | B2C advanced |
| 3 | **SHIFT-COACH** | Question Bank + Report Template + Diagnostic Spec | Coaching readiness | B2C coaching |
| 4 | **BRIDGE** | Delivery Protocol + Report Template + Client Briefing Deck | Cross-border / China | B2B + B2C |
| 5 | **MOSAIC** | Client Briefing Deck | Team/cultural intelligence | B2B |
| 6 | **QUEST** | Question Bank + Report Template | Self-awareness | B2C |
| 7 | **PRISM** | Question Bank + Report Template | Brand identity | B2C |
| 8 | **DRIVE** | Question Bank + Report Template (2 versions!) | Motivation/direction | B2C |
| 9 | **LEAP** | Question Bank only | Growth/development | B2C |
| 10 | **FORGE** | Question Bank + Report Template + Diagnostic Spec | Revenue/sales | B2B |
| 11 | **SPARK** | Question Bank + Report Template + Diagnostic Spec | AI readiness | B2C |
| 12 | **TRIDENT** | Delivery Protocol + Question Bank + Report Template + Diagnostic Spec | Candidate scoring | B2B Search |
| 13 | **IMPACT** | Question Bank + Report Template (2 versions!) | Board effectiveness | B2B |

### 1.2 Code Implementation Status

| Diagnostic | In `catalog.ts`? | Dedicated Engine? | UI Component? | Functional? |
|---|---|---|---|---|
| **FEA** | ❌ NO | ❌ NO | ❌ NO | ❌ Not built |
| **SHIFT Composite** | ❌ (sub-types only) | ✅ `SHIFTAssessmentWizard.tsx` (1,320 lines) | ✅ Via SHIFT wizard | ⚠️ Partial |
| **SHIFT-COACH** | ✅ as `SHIFT_COACH` | Shared SHIFT wizard | ✅ In SHIFT wizard | ⚠️ Shared engine |
| **BRIDGE** | ✅ | ❌ Uses generic wizard | Via catalog only | ❌ No dedicated flow |
| **MOSAIC** | ✅ | ❌ Uses generic wizard | Via catalog only | ❌ No dedicated flow |
| **QUEST** | ❌ (only SHIFT_QUEST) | ❌ No standalone | ❌ No standalone UI | ❌ Not built standalone |
| **PRISM** | ✅ | ❌ Uses generic wizard | Via catalog only | ❌ No dedicated flow |
| **DRIVE** | ❌ (only SHIFT_DRIVE) | ❌ No standalone | ❌ No standalone UI | ❌ Not built standalone |
| **LEAP** | ❌ (only SHIFT_LEAP) | ❌ No standalone | ❌ No standalone UI | ❌ Not built standalone |
| **FORGE** | ✅ | ❌ Uses generic wizard | Via catalog only | ❌ No dedicated flow |
| **SPARK** | ✅ | ❌ Uses generic wizard | Via catalog only | ❌ No dedicated flow |
| **TRIDENT** | ❌ NOT in catalog | ✅ `tridentScoring.ts` (108 lines) | ✅ Trident components | ✅ Works (B2B only) |
| **CPD** (unspecified) | ❌ Not in catalog | ✅ `assessmentEngine.ts` (416 lines) | ✅ `AssessmentWizard.tsx` | ✅ Works but wrong spec |

### 1.3 Summary: What Exists vs What's Missing

```
NOTION SPECS:     13+ diagnostic instruments defined
CODE CATALOG:     10 entries (5 SHIFT variants + PRISM + FORGE + BRIDGE + MOSAIC + SPARK)
DEDICATED ENGINES: 3 (CPD, SHIFT Composite, TRIDENT)
WORKING END-TO-END: 2 (CPD wizard, TRIDENT scoring)
MATCHING SPEC:     0 (CPD matches no spec; SHIFT partially matches; FEA has zero code)
```

---

## 2. Gap Analysis by Diagnostic

### 2.1 FEA — Force Exposure Assessment 🔴 CRITICAL GAP

**Spec:** Notion C1.22 — 36 questions, 3 forces, exposure measurement, diagnostic routing  
**Code:** **ZERO implementation**

This is the **entry-point diagnostic** for the entire B2C funnel. Without it:
- No landing page assessment works correctly
- No force exposure profiling exists
- No diagnostic routing to SHIFT/MOSAIC/BRIDGE can happen
- The Nexus conversational flow has no data to draw from

**Gap:** Complete. Must be built from scratch per the unified spec.

---

### 2.2 SHIFT Composite + 5 Sub-Assessments 🟡 PARTIAL

**Spec:** Monthly content calendar assigns one SHIFT variant per month  
**Code:** `SHIFTAssessmentWizard.tsx` (1,320 lines) + `shiftAssessmentTypes.ts` (351 lines)

**What works:**
- SHIFT wizard has 5 sub-assessment types: LEAP, QUEST, DRIVE, COACH, IMPACT
- Each has defined dimensions, scales, and evidence prompts
- Intake form captures gate data + context + cross-border info
- `shiftAnalysis.ts` produces dimension scores, strengths, development areas

**Gaps:**
- No conversational UI (still wizard-style)
- No FEA integration (SHIFT should be recommended based on FEA results)
- No credit system
- Dimensions duplicated with conflicting definitions between catalog.ts and shiftAssessmentTypes.ts
- No benchmarking
- Framework names visible (shows "LEAP", "QUEST" etc. directly)
- Sub-assessments not available as standalone products (Kevin decision: they must be)

---

### 2.3 BRIDGE / MOSAIC / PRISM / FORGE / SPARK 🟡 CATALOG ONLY

All five are defined in `catalog.ts` with dimensions, styles, and archetypes, but:
- No question banks implemented in code
- No dedicated scoring engines
- Use generic `AssessmentTake.tsx` which pulls from 5 mock questions
- No report generation
- No connection to FEA routing or monthly content themes

---

### 2.4 QUEST / DRIVE / LEAP / IMPACT 🔴 NOT BUILT STANDALONE

Exist only as SHIFT sub-assessments with different dimension definitions than Notion specs. Cannot be sold independently as Master Spec requires ($500–2,000 per diagnostic).

**Kevin Decision (2026-07-20):** These MUST be both standalone products AND SHIFT sub-components. Dual-mode.

---

### 2.5 TRIDENT ✅ WORKING (B2B Only)

Properly implemented as B2B search scoring tool. Not in catalog.ts (correct — different purpose). Scores candidates on experience/skills/fit. Has review queue.

**Kevin Decision (2026-07-20):** TRIDENT stays independent. Not part of unified B2C engine.

---

## 3. Systemic Architecture Gaps

### 3.1 No Unified Assessment Engine
Three parallel systems with different data models, scoring logic, and UX patterns. Need single unified engine for all B2C diagnostics.

**Kevin Decision (2026-07-20):** All B2C diagnostics share ONE unified engine. TRIDENT stays independent.

### 3.2 Question Bank Not Implemented
`AssessmentTake.tsx` uses 5 generic mock questions for ALL assessments. Notion has full question banks but none imported into codebase.

**Kevin Decision (2026-07-20):** Import Notion banks AS-IS + add conversational wrapper layer. Do not rewrite content.

### 3.3 No Diagnostic Routing
Content Integration spec requires Nexus to recommend diagnostics based on conversation. No routing logic exists in code.

### 3.4 No Credit System for Assessments
Credit service exists but not connected to any assessment flow.

**Kevin Decision (2026-07-20):** Nexus should orient users toward taking assessments using credits. Credit-gated.

### 3.5 No Report Generation Pipeline
Only SHIFT has a report renderer. No PDF generation for other diagnostics.

### 3.6 Versioning Conflicts
DRIVE and IMPACT each have 2 question bank versions in Notion. PRISM has 2 entries.

**Kevin Decision (2026-07-20):** Use the LATEST version.
- DRIVE → `8d64b8a3` (v2)
- IMPACT → `40e0ae46` (v2)
- PRISM → `d142f44a` (v2)

---

## 4. Priority Matrix

### P0 — Must Build Before Go-Live

1. **Unified assessment engine** — session mgmt, question delivery, scoring pipeline, credit integration
2. **FEA** — import question bank, build conversational wrapper, micro quiz + full assessment
3. **SHIFT Composite refactor** — migrate existing wizard into unified engine, enable standalone mode for sub-diagnostics
4. **Diagnostic routing** — Nexus recommends based on FEA results + conversation context

### P1 — Needed for Monthly Content Calendar

5. **BRIDGE** diagnostic (Aug 2026)
6. **MOSAIC** diagnostic (Sep 2026)
7. **SPARK** diagnostic (Oct 2026)
8. **FORGE** diagnostic (Nov 2026)
9. **IMPACT** diagnostic (Dec 2026)

### P2 — Enhancement

10. Report generation pipeline (narrative + radar chart)
11. Benchmark database
12. Standalone diagnostic pages with pricing
13. QUEST / DRIVE / LEAP / PRISM as standalone products

---

## 5. Decision Resolutions (Kevin 2026-07-20)

| # | Question | Decision | Implication |
|---|---|---|---|
| 1 | Unified engine for all B2C diagnostics? | **YES.** TRIDENT stays independent (B2B). | Single codebase for FEA, SHIFT, BRIDGE, MOSAIC, PRISM, FORGE, SPARK, QUEST, DRIVE, LEAP, IMPACT. Shared session/scoring/credit/report infrastructure. |
| 2 | Question bank strategy? | **Import Notion as-is** + add conversational wrapper layer. | No content rewriting. Wrap each question in Nexus dialogue context. Banks are canonical; wrapper is delivery. |
| 3 | QUEST/DRIVE/LEAP/IMPACT: standalone or SHIFT-only? | **Both.** Sellable standalone ($500–2K) AND SHIFT sub-components. | Dual-mode: each needs standalone question set + scoring + report, plus SHIFT-compatible interface. Separate credit allocation per mode. |
| 4 | Version conflicts (DRIVE/IMPACT/PRISM)? | **Latest version wins.** | DRIVE→v2 `8d64b8a3`, IMPACT→v2 `40e0ae46`, PRISM→v2 `d142f44a`. |
| 5 | Credit model | **Credit-gated.** Nexus orients users toward taking assessments using credits. | Credit check before start, deduction on start (not completion), no refund on abandonment. |

---

## 6. Blockers

| # | Blocker | Owner | Impact |
|---|---|---|---|
| 1 | **Notion API returns 0 blocks** for all diagnostic pages | Kevin (share pages with N8N integration) | Cannot import question banks until resolved |
| 2 | **Stripe env vars missing** | Kevin (provide from Stripe Dashboard) | Cannot implement credit pricing |
| 3 | **DeepSeek API model alias** deprecation July 24 | NEXUS (verify & update) | Must confirm `deepseek-v4-flash` still works |

---

## 7. Next Steps

1. ✅ Decisions locked → `ASSESSMENT_UNIFIED_SPEC_v1.md` created
2. 🔲 Unblock Notion API access (Kevin action)
3. 🔲 Create GitHub issues for unified engine build (Trae action)
4. 🔲 Continue B2C portal page audit (Page 3: `/nexus` NexusPage)

---

*Audit complete. All decisions resolved. Awaiting Notion access to proceed with question bank import.*
