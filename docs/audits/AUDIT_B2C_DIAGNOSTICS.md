# Diagnostic Suite — Comprehensive Gap Analysis

**Audit Date:** 2026-07-20  
**Auditor:** NEXUS  
**Scope:** All 13 diagnostic instruments — Notion specs vs code implementation  
**Related:** `AUDIT_B2C_01_LANDING.md`, `AUDIT_B2C_02_ASSESSMENT.md`, `ASSESSMENT_UNIFIED_SPEC_v1.md`

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
| **IMPACT** | ❌ (only SHIFT_IMPACT) | ❌ No standalone | ❌ No standalone UI | ❌ Not built standalone |
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

Exist only as SHIFT sub-assessments with different dimension definitions than Notion specs. Cannot be sold independently as Master Spec requires ($500-2,000 per diagnostic).

---

### 2.5 TRIDENT ✅ WORKING (B2B Only)

Properly implemented as B2B search scoring tool. Not in catalog.ts (correct — different purpose). Scores candidates on experience/skills/fit. Has review queue.

---

## 3. Systemic Architecture Gaps

### 3.1 No Unified Assessment Engine

Three parallel systems with different data models, scoring logic, and UX patterns. Need single unified engine for all B2C diagnostics.

### 3.2 Question Bank Not Implemented

`AssessmentTake.tsx` uses 5 generic mock questions for ALL assessments. Notion has full question banks but none imported into codebase.

### 3.3 No Diagnostic Routing

Content Integration spec requires Nexus to recommend diagnostics based on conversation. No routing logic exists in code.

### 3.4 No Credit System for Assessments

Credit service exists but not connected to any assessment flow.

### 3.5 No Report Generation Pipeline

Only SHIFT has a report renderer. No PDF generation for other diagnostics.

### 3.6 Versioning Conflicts

DRIVE and IMPACT each have 2 question bank versions in Notion. PRISM has 2 entries. QUEST has 2 report templates. Unresolved.

---

## 4. Priority Matrix

### P0 — Must Build Before Go-Live

1. Build FEA engine (entry-point diagnostic)
2. Unify assessment engine (shared scoring/session/report service)
3. Import Notion question banks
4. Build conversational assessment UI

### P1 — Needed for Monthly Content Calendar

5. BRIDGE diagnostic (Aug 2026)
6. MOSAIC diagnostic (Sep 2026)
7. SPARK diagnostic (Oct 2026)
8. FORGE diagnostic (Nov 2026)
9. IMPACT diagnostic (Dec 2026)
10. Diagnostic routing in Nexus

### P2 — Enhancement

11. Credit system integration
12. Report generation pipeline
13. Benchmark database
14. Resolve version conflicts
15. Standalone diagnostic pages

---

## 5. Decisions Required from Kevin

1. **Architecture:** All B2C diagnostics share unified engine? TRIDENT stays independent?
2. **Question banks:** Import Notion banks as-is + add conversational wrappers?
3. **Standalone vs SHIFT-only:** QUEST/DRIVE/LEAP/IMPACT as both standalone ($500-2K) and SHIFT sub-components?
4. **Version conflicts:** Which version of DRIVE/IMPACT/PRISM question banks is authoritative?

---

*Next: Continue B2C portal page audit after Kevin's decisions on diagnostic architecture.*
