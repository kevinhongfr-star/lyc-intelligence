# Notion Spec vs Code Consistency Audit

**Date:** 2026-07-20
**Auditor:** NEXUS
**Sources:**
- Notion: Agent Build Context (`398fafae`), Master Product Reference, SPARK Definition, Website Specs, Question Bank DB (`fe8bc717`, 100+ entries), Deliverables DB (`9b6980dc`, 50+ entries)
- Code: `src/assessments/catalog.ts`, `src/services/shiftAssessmentTypes.ts`, `src/lib/benchmark/engine.ts`, `src/components/solution/SolutionPicker.tsx`, `src/services/supabaseApi.ts`

---

## Executive Summary

**Verdict: CATASTROPHIC INCONSISTENCY.** Every single diagnostic tool is implemented differently from the Notion specs. The code uses the same acronyms (LEAP, QUEST, DRIVE, COACH, IMPACT) but defines entirely different constructs, different dimensions, different scoring methods, and different formats. The SHIFT composite formula is wrong. The tier system has 4+ conflicting variants. Zero actual questions from the Notion question banks are implemented.

**Consistency Score: 1/10**

---

## 1. SHIFT Tier 1 Diagnostics — Every Single Tool Is Wrong

### 1.1 LEAP

| Aspect | Notion Spec | Code (`shiftAssessmentTypes.ts`) | Catalog.ts (`SHIFT_LEAP`) |
|--------|-------------|----------------------------------|---------------------------|
| **Full Name** | Leadership Evaluation & Psychological Profiling | "Learning & Execution Potential" | "Competitive Positioning" |
| **What it measures** | Behavioral wiring (DISC) + Career Readiness + APAC context | Generic self-assessment | Market/Capability/Timing/Risk/Impact |
| **Format** | 35Q forced-choice (MOST/LEAST) + 15 Career Readiness + 4 APAC | 3 self-rated 1-10 dimensions | 5 self-rated dimensions |
| **Dimensions** | D/I/S/C behavioral + CR1-CR5 + APAC Modifier | strategic_thinking, execution_speed, learning_agility | market, capability, timing, risk, impact |
| **Scoring** | MOST +2 / LEAST -1, normalization formula | Simple 1-10 average | Simple 1-10 average |
| **Match** | — | ❌ WRONG NAME, WRONG DIMENSIONS, WRONG FORMAT | ❌ WRONG EVERYTHING |

### 1.2 QUEST

| Aspect | Notion Spec | Code (`shiftAssessmentTypes.ts`) | Catalog.ts (`SHIFT_QUEST`) |
|--------|-------------|----------------------------------|---------------------------|
| **Full Name** | Qualitative Executive Skills Test | "Questioning & Inquiry Skills" | "Strategic Readiness" |
| **What it measures** | Executive capability (competency-based, developable skills) | Curiosity and questioning ability | Vision/Analysis/Decision/Influence/Adaptability |
| **Format** | 35Q | 3 self-rated 1-10 dimensions | 5 self-rated dimensions |
| **Dimensions** | Q1 Strategic Thinking(×0.25), Q2 Execution Drive(×0.25), Q3 Commercial Acumen(×0.20), Q4(×0.15), Q5(×0.15) | curiosity_level, inquiry_depth, open_ended_questioning | vision, analysis, decision, influence, adapt |
| **Special features** | AI Readiness sub-score (3Q in Q1+Q2), APAC Cross-Border Score | None | None |
| **Match** | — | ❌ COMPLETELY DIFFERENT PURPOSE | ❌ COMPLETELY DIFFERENT |

### 1.3 DRIVE

| Aspect | Notion Spec | Code (`shiftAssessmentTypes.ts`) | Catalog.ts (`SHIFT_DRIVE`) |
|--------|-------------|----------------------------------|---------------------------|
| **Full Name** | Career Alignment Report | "Driving Change & Results" | "Execution Capability" |
| **What it measures** | Motivation, career alignment, direction clarity | Change tolerance and persistence | Strategy/Operations/People/Technology/Results |
| **Format** | 35Q with modules | 3 self-rated 1-10 dimensions | 5 self-rated dimensions |
| **Dimensions** | D1-D5 Core Motivators (Achievement/Purpose/Security/Autonomy/Relationship) + Role Alignment + Direction Clarity | results_orientation, change_tolerance, persistence | strategy, operations, people, technology, results |
| **Score Bands** | 80-100 Aligned, 60-79 On Track, 40-59 Drift Zone, 20-39 Misaligned, 0-19 Career Crisis | None | None |
| **Match** | — | ❌ COMPLETELY DIFFERENT PURPOSE | ❌ COMPLETELY DIFFERENT |

### 1.4 COACH

| Aspect | Notion Spec | Code (`shiftAssessmentTypes.ts`) | Catalog.ts (`SHIFT_COACH`) |
|--------|-------------|----------------------------------|---------------------------|
| **Full Name** | Leadership Style Analysis | "Coaching & Team Development" | "Leadership Coaching Readiness" |
| **What it measures** | Observable leadership style (how others experience you) | Team development and feedback ability | Self-Awareness/Growth/Feedback/Resilience/Impact |
| **Format** | 35Q base + optional 360° rater | 3 self-rated 1-10 dimensions | 5 self-rated dimensions |
| **Dimensions** | C1 Directing, C2 Inspiring, C3 Supporting, C4 Analyzing, Pressure Modifier | team_development, feedback_quality, empathy | self_awareness, growth, feedback, resilience, impact |
| **Special features** | COACH+ 360° add-on (3-5 raters × 12Q), Style Clarity Score | None | None |
| **Match** | — | ❌ COMPLETELY DIFFERENT | ❌ COMPLETELY DIFFERENT |

### 1.5 IMPACT

| Aspect | Notion Spec | Code (`shiftAssessmentTypes.ts`) | Catalog.ts (`SHIFT_IMPACT`) |
|--------|-------------|----------------------------------|---------------------------|
| **Full Name** | Performance Analytics | "Impact Measurement & Accountability" | "Organizational Impact" |
| **What it measures** | Leadership outputs (not inputs) | Accountability and measurement rigor | Leadership/Innovation/Culture/Performance/Legacy |
| **Format** | 35Q + 10Q optional rater | 5 self-rated dimensions (2 are cross-references to other tools) | 5 self-rated dimensions |
| **Dimensions** | I1 Business Results(×0.30), I2 Talent Development(×0.20), I3 Strategic Influence(×0.20), I4 Change Architecture(×0.15), I5(×0.15) | accountability, measurement_rigor, strategic_thinking(from LEAP), team_development(from COACH), + others | leadership, innovation, culture, performance, legacy |
| **Match** | — | ❌ WRONG — includes cross-references to OTHER tools as its own dimensions | ❌ COMPLETELY DIFFERENT |

---

## 2. SHIFT Composite Formula — WRONG

**Notion:**
```
SHIFT = (LEAP × 0.15) + (QUEST × 0.25) + (COACH × 0.20) + (DRIVE × 0.15) + (IMPACT × 0.25)
```

**Code (`shiftAssessmentTypes.ts:347`):**
```typescript
export function calculateSHIFTComposite(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 10);
}
```

**Verdict:** Simple average. NO weighting at all. Completely ignores the Notion formula.

---

## 3. Standalone Assessments — Dimension Mismatches

### 3.1 BRIDGE

| Aspect | Notion Spec | Code |
|--------|-------------|------|
| **Full Name** | China/APAC Leadership Readiness | "China Leadership Readiness" ✅ name OK |
| **Dimensions** | B Board&HQ(×0.20), R Regulatory&Risk(×0.15), I Intelligence&Market(×0.15), D DecisionRights&Governance(×0.20), G GTM&Execution(×0.15), E ExecutiveTalent&Succession(×0.15) | Cultural, Strategic, Operational, Political, Network |
| **Format** | 35 scored + 2 stage indicators | 5 self-rated dimensions |
| **Match** | ❌ WRONG DIMENSIONS (5 generic vs 6 specific with weights) | |

### 3.2 SPARK

| Aspect | Notion Spec | Code |
|--------|-------------|------|
| **Full Name** | AI Leadership Readiness | "AI Leadership Readiness" ✅ name OK |
| **Dimensions** | AI Literacy, AI Governance Judgment, AI-Era Strategic Capability, Behavioral Adaptability, AI Team & Culture Leadership | AI Literacy, Data Fluency, Change Leadership, Ethics, Innovation |
| **Format** | 15-25 min online assessment | 5 self-rated dimensions |
| **Match** | ⚠️ PARTIAL — Directionally similar (AI readiness theme) but dimension names differ | |

### 3.3 MOSAIC

| Aspect | Notion Spec | Code |
|--------|-------------|------|
| **Full Name** | Cross-cultural team cohesion | "CQ Leadership Development" |
| **Dimensions** | Not fully specified in Master Reference excerpt | CQ Drive, CQ Knowledge, CQ Strategy, CQ Action, CQ Adaptability |
| **Match** | ⚠️ PARTIAL — CQ framework is related to cross-cultural but naming differs | |

### 3.4 FORGE

| Aspect | Notion Spec | Code |
|--------|-------------|------|
| **Full Name** | Sales Excellence Assessment | "Sales Excellence" ✅ name OK |
| **Dimensions** | Not detailed in available Notion pages | Drive, Relationship, Strategy, Execution, Adaptability |
| **Match** | ⚠️ UNKNOWN — Notion spec not available for detailed comparison | |

### 3.5 PRISM

| Aspect | Notion Spec | Code |
|--------|-------------|------|
| **Full Name** | Career & Professional Brand Positioning | "Career & Professional Branding" ⚠️ close |
| **Dimensions** | Not detailed in available Notion pages | Vision, Resilience, Influence, Strategy, Mastery |
| **Match** | ⚠️ UNKNOWN — Notion spec not available for detailed comparison | |

---

## 4. Tier System — 4+ Conflicting Variants

| Context | Tier Values | Source |
|---------|-------------|--------|
| `user_credits.tier` (DB) | `free`, `council`, `enterprise` | `creditService.ts:34`, `atomicCreditService.ts` |
| `profiles.tier` (default) | `free` | Multiple components fallback to `'free'` |
| Coaching Portal | `Starter`, `Growth`, `Elite` | `CoachingProfilePage.tsx` and others |
| Invalid default | `Professional` | `profile?.tier \|\| 'Professional'` in 9 coaching pages |
| Candidate scoring | `T1_STRONG`, `T2_GOOD`, `T3_POTENTIAL`, `T4_NOT_YET` | `scoringCriteria.ts:12` |
| Council tier (DB) | `T1`, `T2` | `supabaseApi.ts:54-56` |
| Advisory tier (DB) | `T1`, `T2` | `supabaseApi.ts:51-53` |
| Master Spec | Free, Starter, Growth, Elite, Corporate | Notion + Master Spec |
| Stripe pricing | Unknown (no Stripe integration working) | — |

**Verdict:** At least 7 different tier naming systems coexist. No single source of truth.

---

## 5. Question Banks — NOT IMPLEMENTED

**Notion Question Bank DB (`fe8bc717`) contains:**
- QUEST Question Bank (Full) v2
- IMPACT Question Bank (Full)
- DRIVE Question Bank (Full) + v2
- LEAP Question Bank (Full)
- Force Exposure Assessment Question Bank
- FORGE Question Bank & Report Template
- SPARK Question Bank & Report Template
- SHIFT-COACH Question Bank & Report Template
- TRIDENT Question Bank & Report Template
- PRISM Question Bank (Full)
- 10+ Report Templates
- 5+ Diagnostic Specifications
- Assessment Logic Specification — Scoring & Routing

**Code implements:** Zero actual questions. All "assessments" are self-rated 1-10 scales with generic prompts like "How would you rate your strategic thinking capability?" No forced-choice, no weighted scoring, no question text from the banks.

---

## 6. Deliverables DB — NOT IMPLEMENTED

**Notion Deliverables DB (`9b6980dc`) contains 50+ items including:**
- SHIFT AI Track Modules 1-3 (Augmented Team Design, Decision Architecture, AI & Leadership Exposure)
- Program Blueprints (AI Leadership Development, Career Resilience Workshop)
- B2C Courses (AI Leadership Readiness, Career Resilience, Cross-Border Intelligence, Governance Health Check)
- Research Reports (Cross-Border Team Performance Index, State of Cross-Border Governance 2026, etc.)
- Enterprise Case Studies 1-10
- Podcast Series (4 tracks, 42+ episodes)
- Newsletter Issues 1-4 + Template
- Email Sequences (6+ sequences)

**Code implements:** None of these deliverables are referenced, linked, or surfaced anywhere in the application.

---

## 7. Diagnostic Architecture — FUNDAMENTALLY WRONG

**Notion says:**
- SHIFT = 5 Tier 1 diagnostics + composite formula with specific weights
- Each diagnostic has specific question formats, scoring algorithms, normalization, archetypes
- SPARK is AI Readiness only (NOT individual leadership assessment)
- BRIDGE has 6 specific dimensions (BRIDGE acronym)
- Assessment formats include forced-choice, multi-rater 360°, stage indicators

**Code implements:**
- SHIFT = 5 generic self-rated tools with simple average composite
- Each "diagnostic" is 3-5 self-rated 1-10 sliders
- SPARK is correctly labeled but has different dimensions
- BRIDGE has 5 generic dimensions instead of 6 specific ones
- All formats are identical: self-rated scale, no actual questions

---

## 8. Summary Matrix

| Check | Notion Spec | Code | Consistent? |
|-------|-------------|------|-------------|
| LEAP definition | DISC + Career Readiness + APAC | "Learning & Execution" — generic | ❌ |
| QUEST definition | Executive Skills (5 weighted dims) | "Questioning & Inquiry" — generic | ❌ |
| DRIVE definition | Career Alignment (motivators) | "Driving Change" — generic | ❌ |
| COACH definition | Leadership Style (4 quadrants + 360°) | "Team Development" — generic | ❌ |
| IMPACT definition | Performance Analytics (5 weighted dims) | "Accountability" — generic + cross-refs | ❌ |
| SHIFT composite | LEAP×0.15 + QUEST×0.25 + COACH×0.20 + DRIVE×0.15 + IMPACT×0.25 | Simple average | ❌ |
| BRIDGE dimensions | B/R/I/D/G/E (6 weighted) | 5 generic (Cultural/Strategic/Operational/Political/Network) | ❌ |
| SPARK definition | AI Readiness (5 dims) | AI Readiness (5 dims) | ⚠️ Partial |
| MOSAIC definition | Cross-cultural team cohesion | CQ Leadership Development | ⚠️ Partial |
| FORGE definition | Sales Excellence | Sales Excellence | ⚠️ Name OK, dims unknown |
| PRISM definition | Career & Brand Positioning | Career & Professional Branding | ⚠️ Name close, dims unknown |
| Tier system | Master Spec: Free/Starter/Growth/Elite/Corporate | 7+ conflicting variants | ❌ |
| Question banks | 100+ actual questions with scoring | Zero — all self-rated sliders | ❌ |
| Deliverables | 50+ content items | None referenced in app | ❌ |
| Assessment format | Forced-choice, 360°, weighted scoring | Uniform 1-10 self-rate | ❌ |

---

## 9. Root Cause Analysis

The code appears to have been generated by an AI that:
1. Used the product acronyms (LEAP, QUEST, etc.) as labels but invented entirely new definitions
2. Applied a uniform "5 dimensions × self-rated 1-10" template to all tools
3. Never imported the actual question banks from Notion
4. Used simple average for composite scoring instead of the specified weighted formula
5. Created multiple incompatible tier systems in different code areas
6. Never referenced the 50+ content deliverables in the Deliverables DB

---

## 10. Fix Priority

### P0 — Must Fix (Product Integrity)
1. **Rewrite all 5 SHIFT diagnostic definitions** to match Notion spec (correct names, dimensions, weights, formats)
2. **Fix SHIFT composite formula** to use weighted formula
3. **Import question banks** from Notion DB into the assessment engine
4. **Implement forced-choice format** for LEAP (MOST/LEAST selection)
5. **Unify tier system** to single source of truth (Master Spec: Free/Starter/Growth/Elite/Corporate)

### P1 — Should Fix (Product Completeness)
6. **Fix BRIDGE dimensions** to match B/R/I/D/G/E framework
7. **Align SPARK dimensions** to match Notion's 5 AI readiness dimensions
8. **Implement COACH+ 360° rater** add-on
9. **Surface deliverables** from Notion DB in the app (courses, reports, newsletters)
10. **Implement scoring algorithms** (normalization formulas, score bands, archetypes)

### P2 — Nice to Fix (Polish)
11. **Remove duplicate catalog entries** (SHIFT_LEAP vs LEAP inconsistency in same file)
12. **Fix WorkshopCreate.tsx** SPARK description from "AI Literacy Workshop" to "AI Readiness Diagnostic"
13. **Add score band labels** per Notion spec (80-100 = Signature Strength, etc.)
14. **Implement APAC sub-scores** (present in Notion for LEAP, QUEST, COACH, DRIVE)

---

*End of Consistency Audit*
