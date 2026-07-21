# LYC Intelligence — Phase 7: Go-Live Readiness

**Version:** 1.0
**Date:** 2026-07-21
**Branch:** `build/cd-consolidated`
**Scope:** Close all remaining gaps between current build and production-ready diagnostic platform
**Dependencies:** Phase 0-6 complete (data model, scoring engine, assessment pages, intelligence layer)
**Trigger:** DRIVE Report Web HTML design audit revealed ~30% design drift + structural gaps across all instruments

---

## Current State Summary

| Area | Status | Gap |
|------|--------|-----|
| Data Model (instruments, archetypes, dimensions) | ✅ Done (895e9b5) | Dimensions aligned to Notion |
| Classification Engine | ✅ Done | Deterministic, pure function |
| Assessment Landing Pages (9 instruments) | ✅ Pages exist | BUT use random placeholder scores |
| SHIFT Report Renderer | ⚠️ Partial | Google Fonts CDN, Material colors, wrong design tokens |
| DRIVE Report | ❌ None in codebase | HTML mockup audited — needs renderer + design fix |
| QUEST/IMPACT/PRISM/BRIDGE/MOSAIC/FORGE/SPARK Reports | ❌ None | No renderers exist |
| Assessment → Scoring → Report Pipeline | ❌ Broken | Pages generate random scores, not from engine |
| Report Persistence (Supabase) | ❌ None | No storage of generated reports |
| Email Delivery of PDF Reports | ❌ None | EmailGate component exists but not wired |
| Design System Alignment (reports) | ❌ Drifted | Reports use Material palette; site uses Tailwind |

---

## Phase 7 Ticket Overview

| Ticket | Title | Est. Hours | Priority | Dependency |
|--------|-------|-----------|----------|------------|
| T-701 | Design System Tokens — Shared Report Theme | 4h | 🔴 P0 | — |
| T-702 | Assessment Engine Integration — Wire Real Questions & Scoring | 12h | 🔴 P0 | — |
| T-703 | DRIVE Report Renderer (Web + PDF) | 8h | 🔴 P0 | T-701, T-702 |
| T-704 | SHIFT Report Renderer — Redesign to Design System | 6h | 🟡 P1 | T-701 |
| T-705 | QUEST Report Renderer (Web + PDF) | 6h | 🟡 P1 | T-701, T-702 |
| T-706 | IMPACT Report Renderer (Web + PDF) | 6h | 🟡 P1 | T-701, T-702 |
| T-707 | PRISM Report Renderer (Web + PDF) | 6h | 🟡 P1 | T-701, T-702 |
| T-708 | BRIDGE Report Renderer (Web + PDF) | 6h | 🟡 P1 | T-701, T-702 |
| T-709 | MOSAIC Report Renderer (Web + PDF) | 5h | 🟡 P1 | T-701, T-702 |
| T-710 | FORGE Report Renderer (Web + PDF) | 5h | 🟡 P1 | T-701, T-702 |
| T-711 | SPARK Report Renderer (Web + PDF) | 5h | 🟡 P1 | T-701, T-702 |
| T-712 | Report Persistence — Supabase Integration | 8h | 🔴 P0 | T-702 |
| T-713 | Email Delivery Pipeline — PDF Attachments | 6h | 🟡 P1 | T-703, T-712 |
| T-714 | End-to-End Integration Testing | 8h | 🔴 P0 | All above |

**Total estimated effort: ~91 hours**

---

## Execution Order

```
Sprint 1 (Critical Path):  T-701 → T-702 → T-703 → T-712 → T-714
Sprint 2 (Remaining Instruments): T-704, T-705, T-706, T-707, T-708, T-709, T-710, T-711
Sprint 3 (Delivery): T-713 → Final T-714
```

---

## T-701 — Design System Tokens: Shared Report Theme

**Estimate:** 4h
**Priority:** 🔴 P0
**Status:** Not Started
**Assignee:** Unassigned

### Problem
The DRIVE Report HTML audit revealed that the existing report renderers use a completely different color system (Material Design palette) from the website (Tailwind CSS palette). This creates visual inconsistency — the report feels "heavier" and "harsher" than the website experience.

### Design Token Mapping (from Audit)

| Token | Current Report | Website Target | Action |
|-------|---------------|----------------|--------|
| `--text` | `#000000` | `#171717` | Replace |
| `--text-secondary` | `#333333` | `#525252` | Replace |
| `--muted` | `#666666` | `#A3A3A3` | Replace |
| `--border` | `#E5E5E5` | `#EBEBEB` | Replace |
| `--bg-alt` | `#F5F5F5` | `#F7F7F7` | Replace |
| `--green` | `#2E7D32` | `#16A34A` | Replace |
| `--gold` | `#D4A017` | `#CA8A04` | Replace |
| `--red` | `#C62828` | `#DC2626` | Replace |
| `--accent-hover` | `#A00790` | `#A50798` | Replace |
| `--green-light` | `#E8F5E9` | `rgba(22,163,74,0.06)` | Replace |
| `--red-light` | `#FFEBEE` | `rgba(220,38,38,0.06)` | Replace |
| `--accent-light` | `#FDF2FC` (solid) | `rgba(193,8,171,0.06)` | Replace solid→alpha |

### Scope
1. Create `src/styles/report-theme.css` — shared CSS custom properties for all report renderers
2. Import local woff2 font files (not Google Fonts CDN) — match `/fonts/` directory
3. Set body font-size to 16px (report currently uses 14px)
4. Define card shadow tokens matching website `shadow-card` / `shadow-card-hover`
5. Define score color tiers using Tailwind palette
6. Add print-specific overrides (`@media print`) for page breaks, margins, etc.

### Deliverables
- [ ] `src/styles/report-theme.css` with complete `:root` variable set
- [ ] Font `@font-face` declarations using local woff2 files from `/fonts/`
- [ ] Print media query block
- [ ] Update `src/styles/tokens.css` to export report-specific tokens
- [ ] No Google Fonts CDN references in any report file

### Acceptance Criteria
- All report CSS tokens match website Tailwind config values exactly
- Fonts load from local `/fonts/` directory (offline-capable)
- Body text is 16px with 1.6 line-height
- Cards use subtle shadows matching website pattern
- Print layout: clean page breaks, correct margins, no orphaned elements

---

## T-702 — Assessment Engine Integration: Wire Real Questions & Scoring

**Estimate:** 12h
**Priority:** 🔴 P0
**Status:** Not Started
**Assignee:** Unassigned

### Problem
All 8 diagnostic pages (QUEST, DRIVE, IMPACT, PRISM, BRIDGE, MOSAIC, FORGE, SPARK) use `DiagnosticPageLayout` which generates **random placeholder scores** (`Math.round(40 + Math.random() * 50)`). The real `classificationEngine.ts` and `assessmentEngine.ts` exist but are not connected to any user-facing flow.

### Scope
1. Build question sets for each instrument based on Notion report templates
2. Create question UI flow (scenario-based questions with 2-5 answer options per question)
3. Wire `classificationEngine.classify()` to process answers → produce `ArchetypeResult`
4. Wire `DimensionScore[]` output to feed report renderers
5. Persist scores to Supabase `assessment_runs` table
6. Route to appropriate report page on completion

### Question Set Requirements (per Notion specs)

Each instrument needs **scenario-based questions** mapped to its dimensions:

| Instrument | Dimensions | Min Questions per Dim | Total Questions |
|------------|-----------|----------------------|-----------------|
| QUEST | 5 | 3 | 15-20 |
| DRIVE | 5 | 3 | 15-20 |
| IMPACT | 5 | 3 | 15-20 |
| PRISM | 5 | 3 | 15-20 |
| BRIDGE | 5 | 3 | 15-20 |
| MOSAIC | 4 | 3 | 12-16 |
| FORGE | 4 | 3 | 12-16 |
| SPARK | 3 | 3 | 9-12 |

Score scale: 0-20 per dimension (per `instruments.ts` spec).

### Architecture

```
User answers questions
  → DimensionAnswer[] collected
  → classificationEngine.classify(instrumentId, answers) → ArchetypeResult
  → DimensionScore[] computed (raw → normalized 0-20)
  → Supabase INSERT (assessment_runs)
  → Navigate to /report/{instrument}/{runId}
  → Report renderer displays results
```

### Deliverables
- [ ] Question data files for each instrument: `src/assessments/questions/{instrument}.ts`
- [ ] Question UI component: `src/components/assessment/QuestionFlow.tsx`
- [ ] Scoring integration: update `DiagnosticPageLayout` to use real engine
- [ ] Supabase persistence: `insertAssessmentResult()` function
- [ ] Route: `/report/:instrument/:runId` → report renderer
- [ ] Progress indicator during assessment

### Acceptance Criteria
- Each instrument has ≥3 questions per dimension
- Same answers always produce same archetype (deterministic)
- Scores saved to Supabase with run_id, instrument, dimension_scores, archetype
- User sees real report (not random data) after completing assessment
- Assessment can be resumed if interrupted (load from Supabase)

---

## T-703 — DRIVE Report Renderer (Web + PDF)

**Estimate:** 8h
**Priority:** 🔴 P0
**Status:** Not Started (HTML mockup exists: `DRIVE_Report_Web.html`)
**Assignee:** Unassigned

### Problem
The DRIVE Report HTML mockup has 3 critical bugs + 10+ color drift issues identified in the design audit. No renderer exists in the codebase.

### Critical Bugs (from Audit)
1. **Unrendered template variables**: `{er_score}`, `{er_color}`, `{er_state}` visible as literal text in ER gauge
2. **Wrong cover title**: Says "SHIFT Diagnostic Suite" instead of "DRIVE"
3. **Wrong dimension names**: Shows "Extrinsic Motivation", "Values Alignment" etc. instead of Notion-aligned names (Intrinsic Motivation, Relational Investment, Mission Alignment, Growth Orientation, Sustainability)

### Scope
1. Create `src/services/driveReportRenderer.ts` — generates branded HTML report from `ArchetypeResult` + `DimensionScore[]`
2. Fix all 3 critical bugs from audit
3. Apply T-701 design tokens (replace Material palette with Tailwind)
4. Implement Engagement Risk gauge with proper calculation (not Python f-string)
5. Add PDF export via jsPDF (or html2canvas → PDF)
6. Add `/report/drive/:runId` route

### Report Structure (from Notion template)
```
Cover → Archetype Summary → Dimension Radar Chart →
5× Dimension Detail Cards (score, description, sub-dimensions) →
Engagement Risk Gauge → Development Recommendations →
Archetype Comparison Table → Footer
```

### Design System Fixes (from Audit)

```css
/* Replace entire :root block with: */
:root {
    --text: #171717;
    --text-secondary: #525252;
    --muted: #A3A3A3;
    --border: #EBEBEB;
    --bg-alt: #F7F7F7;
    --green: #16A34A;
    --green-light: rgba(22,163,74,0.06);
    --gold: #CA8A04;
    --red: #DC2626;
    --red-light: rgba(220,38,38,0.06);
    --accent: #C108AB;
    --accent-hover: #A50798;
    --accent-light: rgba(193,8,171,0.06);
}
```

### Dimension Names (MUST match Notion)
| # | ID | Name |
|---|-----|------|
| 1 | intrinsic_motivation | Intrinsic Motivation |
| 2 | relational_investment | Relational Investment |
| 3 | mission_alignment | Mission Alignment |
| 4 | growth_orientation | Growth Orientation |
| 5 | sustainability | Sustainability |

### Engagement Risk Gauge Fix
Replace Python f-string template with TypeScript calculation:
```typescript
const erScore = dimensionScores.find(d => d.dimensionId === 'engagement_risk')?.normalizedScore ?? 0;
const erColor = erScore >= 70 ? 'var(--green)' : erScore >= 40 ? 'var(--gold)' : 'var(--red)';
const erLabel = erScore >= 70 ? 'Low Risk' : erScore >= 40 ? 'Moderate Risk' : 'High Risk';
// SVG arc calculation for semicircle gauge
```

### Deliverables
- [ ] `src/services/driveReportRenderer.ts`
- [ ] PDF export function: `generateDrivePDF()`
- [ ] Route: `/report/drive/:runId`
- [ ] All 3 critical bugs fixed
- [ ] All color tokens aligned to T-701 theme
- [ ] Local font loading (no Google CDN)
- [ ] Card shadows matching website pattern

### Acceptance Criteria
- No template variables visible in rendered output
- Cover says "DRIVE" not "SHIFT"
- All 5 dimension names match Notion exactly
- Colors pass visual comparison with website
- PDF export produces clean, print-ready output
- Report renders correctly at 960px width and in print

---

## T-704 — SHIFT Report Renderer — Redesign to Design System

**Estimate:** 6h
**Priority:** 🟡 P1
**Status:** Needs Redesign
**Assignee:** Unassigned

### Problem
`shiftReportRenderer.ts` exists but uses Google Fonts CDN, Material color palette, and `color: #333` — misaligned with T-701 design tokens.

### Scope
1. Update `shiftReportRenderer.ts` to import T-701 report theme
2. Replace all hardcoded colors with CSS custom properties
3. Remove Google Fonts CDN import → use local woff2
4. Update body color from `#333` to `var(--text)`
5. Align accent/border/shadow values with theme
6. Ensure SHIFT composite scoring display matches new design

### Current Issues in `shiftReportRenderer.ts`
```
Line: @import url('https://fonts.googleapis.com/css2?...')  → REMOVE
Line: color: #333  → var(--text)
Line: border-bottom: 2px solid #C108AB  → 2px solid var(--accent)
All hardcoded hex values → CSS custom properties
```

### Deliverables
- [ ] Updated `shiftReportRenderer.ts` using T-701 tokens
- [ ] No Google Fonts CDN references
- [ ] All colors use CSS custom properties
- [ ] Visual match with DRIVE report style

---

## T-705 — QUEST Report Renderer (Web + PDF)

**Estimate:** 6h
**Priority:** 🟡 P1
**Dependency:** T-701, T-702

### Report Structure
```
Cover (Blue #2563EB hero) → Archetype Summary →
5× Dimension Bars (Cognitive Complexity, Adaptive Leadership,
  Stakeholder Intelligence, Mission Alignment, AI Readiness) →
Archetype Match Detail → Development Priorities → Footer
```

### Scope
1. Create `src/services/questReportRenderer.ts`
2. Use T-701 report theme tokens
3. QUEST brand color: `#2563EB` (Blue)
4. Radar chart for 5-dimension visualization
5. PDF export function
6. Route: `/report/quest/:runId`

### Deliverables
- [ ] `src/services/questReportRenderer.ts`
- [ ] PDF export: `generateQuestPDF()`
- [ ] Route: `/report/quest/:runId`
- [ ] All dimensions match Notion spec

---

## T-706 — IMPACT Report Renderer (Web + PDF)

**Estimate:** 6h | **Priority:** 🟡 P1 | **Dependency:** T-701, T-702

### Report Structure
```
Cover (Violet #7C3AED hero) → Archetype Summary →
5× Dimension Bars (Governance Effectiveness, Independent Judgment,
  Board Influence, Strategic Contribution, Mandate Credibility) →
Board Readiness Assessment → Development Recommendations → Footer
```

### Deliverables
- [ ] `src/services/impactReportRenderer.ts`
- [ ] PDF export + `/report/impact/:runId` route

---

## T-707 — PRISM Report Renderer (Web + PDF)

**Estimate:** 6h | **Priority:** 🟡 P1 | **Dependency:** T-701, T-702

### Report Structure
```
Cover (Amber #F59E0B hero) → Archetype Summary →
5× Dimension Bars (Brand Authenticity, Market Visibility,
  Narrative Clarity, Stakeholder Legibility, APAC Brand Translation) →
Brand Positioning Map → Visibility/Authenticity Matrix → Footer
```

### Deliverables
- [ ] `src/services/prismReportRenderer.ts`
- [ ] PDF export + `/report/prism/:runId` route

---

## T-708 — BRIDGE Report Renderer (Web + PDF)

**Estimate:** 6h | **Priority:** 🟡 P1 | **Dependency:** T-701, T-702

### Report Structure
```
Cover (Emerald #059669 hero) → Archetype Summary →
5× Dimension Bars (HQ Alignment, Local Orchestration,
  Expectation Translation, Political Navigation, Cultural Fluency) →
Bilateral Mandate Health Map → Risk Indicators → Footer
```

### Deliverables
- [ ] `src/services/bridgeReportRenderer.ts`
- [ ] PDF export + `/report/bridge/:runId` route

---

## T-709 — MOSAIC Report Renderer (Web + PDF)

**Estimate:** 5h | **Priority:** 🟡 P1 | **Dependency:** T-701, T-702

### Report Structure
```
Cover (Cyan #0891B2 hero) → Archetype Summary →
4× Dimension Bars (Institutional Trust, Relationship Velocity,
  Normative Flexibility, Conflict Resolution) →
Team Dynamics Radar → Cultural Context Analysis → Footer
```

### Deliverables
- [ ] `src/services/mosaicReportRenderer.ts`
- [ ] PDF export + `/report/mosaic/:runId` route

---

## T-710 — FORGE Report Renderer (Web + PDF)

**Estimate:** 5h | **Priority:** 🟡 P1 | **Dependency:** T-701, T-702

### Report Structure
```
Cover (Orange #EA580C hero) → Archetype Summary →
4× Dimension Bars (Adaptive Learning Orientation, Three Forces Awareness,
  Development Agency, Bilateral Context Navigation) →
Revenue Leadership Profile → Three Forces Analysis → Footer
```

### Deliverables
- [ ] `src/services/forgeReportRenderer.ts`
- [ ] PDF export + `/report/forge/:runId` route

---

## T-711 — SPARK Report Renderer (Web + PDF)

**Estimate:** 5h | **Priority:** 🟡 P1 | **Dependency:** T-701, T-702

### Report Structure
```
Cover (Purple #8B5CF6 hero) → Archetype Summary →
3× Dimension Bars (Individual AI Adoption Readiness,
  Capability Exposure Assessment, Organisational Preparedness) →
AI Readiness Heatmap → Capability Deprecation Risk → Footer
```

### Deliverables
- [ ] `src/services/sparkReportRenderer.ts`
- [ ] PDF export + `/report/spark/:runId` route

---

## T-712 — Report Persistence: Supabase Integration

**Estimate:** 8h
**Priority:** 🔴 P0
**Status:** Not Started
**Assignee:** Unassigned

### Problem
Assessment results have nowhere to persist. The `assessment_runs` table needs to store:
- Assessment run (who, when, which instrument)
- Dimension scores (0-20 per dimension)
- Classification result (archetype, confidence)
- Generated report reference (for retrieval)

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS assessment_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  instrument_id TEXT NOT NULL CHECK (instrument_id IN ('quest','drive','impact','prism','bridge','mosaic','forge','spark','shift')),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','expired')),
  answers JSONB DEFAULT '{}',
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  archetype_id TEXT,
  archetype_name TEXT,
  archetype_confidence REAL,
  secondary_archetype_id TEXT,
  is_transitional BOOLEAN DEFAULT false,
  report_url TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assessment_runs_contact ON assessment_runs(contact_id);
CREATE INDEX idx_assessment_runs_instrument ON assessment_runs(instrument_id);
CREATE INDEX idx_assessment_runs_status ON assessment_runs(status);
```

### API Endpoints

```
POST   /api/assessment/start     → Create new assessment run
PUT    /api/assessment/:id/save  → Save progress (answers + partial scores)
POST   /api/assessment/:id/complete → Finalize: run classification, store results
GET    /api/assessment/:id       → Retrieve full result + report URL
GET    /api/assessment/history/:contactId → All runs for a contact
```

### Deliverables
- [ ] Supabase migration file: `supabase/migrations/20260721_assessment_runs.sql`
- [ ] API route handlers in `api/` directory
- [ ] TypeScript client: `src/services/assessmentPersistence.ts`
- [ ] Integration with `DiagnosticPageLayout` for save/restore
- [ ] Admin view: `/admin/assessment-results` to browse all runs

### Acceptance Criteria
- Assessment in progress can be resumed after browser close
- Completed assessments retrievable by contact_id
- Admin can view all assessment runs with scores
- Report URL stored after generation

---

## T-713 — Email Delivery Pipeline: PDF Attachments

**Estimate:** 6h
**Priority:** 🟡 P1
**Dependency:** T-703 (DRIVE renderer as reference), T-712

### Problem
EmailGate component exists but is not connected to any email sending infrastructure. Reports need to be delivered as PDF attachments when users provide their email.

### Architecture
```
User submits email in EmailGate
  → Generate PDF from report renderer
  → Store PDF in Supabase Storage (reports/{runId}.pdf)
  → Send email via Resend API with PDF attachment
  → Log delivery status
```

### Email Template
```
Subject: Your {INSTRUMENT} Diagnostic Report
From: LYC Partners <reports@lyc-partners.ai>
Body:
  - Personalized greeting
  - Brief archetype summary (1 paragraph teaser)
  - "Your full report is attached"
  - CTA: "Book a debrief session" → link to calendar
  - Confidentiality notice
  - Footer: LYC Partners branding
```

### Deliverables
- [ ] `src/services/reportDelivery.ts` — PDF generation + storage
- [ ] `src/services/emailDelivery.ts` — Resend API integration
- [ ] Email template component: `src/components/email/ReportDeliveryEmail.tsx`
- [ ] Update `EmailGate.tsx` to trigger delivery pipeline
- [ ] Supabase Storage bucket: `reports/`

### Acceptance Criteria
- User receives PDF report via email within 60 seconds of email submission
- PDF matches the web report exactly
- Email includes personalized archetype teaser
- Delivery failure gracefully handled with retry

---

## T-714 — End-to-End Integration Testing

**Estimate:** 8h
**Priority:** 🔴 P0
**Dependency:** All T-701 through T-713

### Test Matrix

| Test Case | Steps | Expected |
|-----------|-------|----------|
| TC-1: Complete DRIVE assessment | Answer all questions → Submit | Correct archetype, scores match engine |
| TC-2: DRIVE report rendering | View `/report/drive/:id` | All dimensions correct, no bugs, design aligned |
| TC-3: DRIVE PDF export | Click "Download PDF" | Clean PDF, no visual artifacts |
| TC-4: Email delivery | Submit email on gate | PDF received within 60s |
| TC-5: Resume interrupted assessment | Close browser mid-assessment → Return | Progress restored from Supabase |
| TC-6: Admin view | `/admin/assessment-results` | All runs visible with scores |
| TC-7: Design consistency | Compare DRIVE report to website | Colors, fonts, shadows match |
| TC-8: SHIFT composite | Complete SHIFT → View report | Composite score calculated correctly |
| TC-9: Print layout | Print any report | Clean page breaks, no overflow |
| TC-10: Mobile responsive | View report on mobile viewport | Readable, no layout breakage |

### Regression Checklist
- [ ] All 9 instrument landing pages load without errors
- [ ] Assessment questions render correctly for each instrument
- [ ] Scoring engine produces deterministic results (same input = same output)
- [ ] All report pages render with correct instrument branding
- [ ] PDF exports work for all 9 instruments
- [ ] No console errors in production build
- [ ] Supabase queries return correct data
- [ ] Email delivery succeeds for all instrument types

---

## Appendix A: Design System Quick Reference

### Font Stack
```css
/* Headings */
font-family: 'Libre Baskerville', Georgia, serif;
/* Source: /fonts/LibreBaskerville-Regular.woff2, -Bold.woff2 */

/* Body */
font-family: 'DM Sans', system-ui, sans-serif;
/* Source: /fonts/DMSans-Regular.woff2, -Medium.woff2, -Bold.woff2 */
```

### Instrument Brand Colors
| Instrument | Color | Hex |
|------------|-------|-----|
| QUEST | Blue | `#2563EB` |
| DRIVE | Red | `#DC2626` |
| IMPACT | Violet | `#7C3AED` |
| PRISM | Amber | `#F59E0B` |
| BRIDGE | Emerald | `#059669` |
| MOSAIC | Cyan | `#0891B2` |
| FORGE | Orange | `#EA580C` |
| SPARK | Purple | `#8B5CF6` |
| SHIFT | Slate | `#475569` |

---

## Appendix B: DRIVE Report Audit — Key Findings

- **Overall alignment**: ~70%
- **Critical bugs**: 3 (template vars, wrong title, wrong dimension names)
- **Color drift**: 10+ values misaligned (Material vs Tailwind)
- **Font loading**: CDN vs local mismatch
- **Verdict**: Structural feel is right; execution details need tuning
