# LYC Intelligence — Report Design Specification

> **Version:** 1.0 | **Date:** 2026-07-22
> **Audience:** Design Team (HTML/CSS template builders)
> **Purpose:** Complete visual and structural specification for all reports generated or displayed by the LYC Intelligence platform
> **Status:** Ready for design

---

## How to Use This Document

This spec is organized into **10 report families**, each containing:
- **Instance inventory** — every report of this type in the system
- **Data model** — what data fields populate the report
- **Layout structure** — section-by-section hierarchy with dimensions
- **Chart specifications** — chart types, colors, labels, axes
- **Brand application** — how LYC branding is applied
- **Interaction patterns** — responsive behavior, print, export

Design team should build **one HTML template per report family** (parameterized by data), not one per instance.

---

## Design System Foundation

> All reports share this foundation. Individual specs reference this section.

### Color Palette (v6)

| Token | Hex | Usage |
|-------|-----|-------|
| `--dark` | `#0F1115` | Primary text, headers, dark backgrounds |
| `--fuchsia` | `#C108AB` | Accent, highlights, primary data series, callout borders |
| `--white` | `#FFFFFF` | Backgrounds, text on dark |
| `--grey-100` | `#F7F7F8` | Section backgrounds, table stripes |
| `--grey-300` | `#E5E5E7` | Borders, dividers |
| `--grey-500` | `#9CA3AF` | Secondary text, labels |
| `--grey-700` | `#4B5563` | Body text |
| `--success` | `#10B981` | Positive indicators, above-benchmark |
| `--warning` | `#F59E0B` | Caution indicators |
| `--danger` | `#EF4444` | Risk indicators, below-benchmark |
| `--blue` | `#3B82F6` | Secondary data series, links |
| `--green` | `#059669` | Tertiary data series |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Report Title | Libre Baskerville | 24pt | Bold |
| Section Header | Libre Baskerville | 14pt | Bold |
| Subsection Header | DM Sans | 11pt | Bold |
| Body Text | DM Sans | 10pt | Regular |
| Caption / Label | DM Sans | 8pt | Regular |
| Data Value (large) | DM Sans | 18pt | Bold |
| Data Value (inline) | DM Sans | 10pt | SemiBold |
| Footer | DM Sans | 7pt | Regular |

**Fallback fonts:** Noto Serif (headlines), Noto Sans (body)

### Logo & Branding

- **Primary logo:** LYC logo — white text on dark background (for PDF headers on dark)
- **Alternative:** LYC logo — black text on white (for email, light backgrounds)
- **Logo placement:** Top-left of header area, 40px height, clear space = logo height
- **Co-branded mode:** Client logo appears top-right, LYC logo top-left
- **Footer:** LYC logo (small, 20px) left + "Confidential" center + page number right

### Callout Style (v6)

- **Top rule:** 3px solid fuchsia (`#C108AB`) above callout box
- **Fuchsia dot:** ● marker before key insight text
- **Background:** White with subtle left-border accent (no left-border rectangles — use top rule)
- **DO NOT:** Use colored rectangles, left-border boxes, or gradient backgrounds

### Chart Conventions

- **Data series 1:** Fuchsia (`#C108AB`)
- **Data series 2:** Blue (`#3B82F6`)
- **Data series 3:** Green (`#059669`)
- **Data series 4+:** Grey palette (`#4B5563`, `#9CA3AF`, `#D1D5DB`)
- **Gridlines:** Light grey (`#E5E5E7`), dashed
- **Axis labels:** DM Sans 8pt, `--grey-500`
- **Data labels:** DM Sans 8pt, `--dark`
- **No 3D effects. No gradients on bars. Clean, flat design.**

### Page Layout (PDF Reports)

```
┌─────────────────────────────────────────────┐
│  [LOGO]                    [Client Logo]     │  ← Header (40px logo + 20px padding)
├─────────────────────────────────────────────┤
│                                             │
│  [REPORT TITLE]                             │  ← 24pt Libre Baskerville
│  [Subtitle / Date / Reference]              │  ← 10pt DM Sans grey
│                                             │
│  ─── Section ─────────────────────────────  │  ← 14pt section header
│                                             │
│  [Content blocks, charts, tables]           │
│                                             │
├─────────────────────────────────────────────┤
│  [logo]    Confidential    Page X of Y      │  ← Footer (8pt, grey)
└─────────────────────────────────────────────┘
```

- **Page size:** A4 (210mm × 297mm)
- **Margins:** 20mm all sides
- **Content width:** 170mm
- **Section spacing:** 12pt before, 6pt after
- **Paragraph spacing:** 6pt after

### Email Template Layout

```
┌─────────────────────────────────────────────┐
│  [LYC Logo — white on dark header bar]      │
├─────────────────────────────────────────────┤
│                                             │
│  [Greeting / Context]                       │
│                                             │
│  [Report Content — simplified for email]    │
│  [Key metrics as inline cards]              │
│  [Mini charts or sparklines]                │
│                                             │
│  [CTA Button — fuchsia background]          │
│  "View Full Report →"                       │
│                                             │
├─────────────────────────────────────────────┤
│  [Footer: Legal, unsubscribe, LYC address]  │
└─────────────────────────────────────────────┘
```

- **Width:** 600px max (email-safe)
- **Font:** DM Sans only (no serif in emails)
- **Tables:** Used for layout (email client compatibility)
- **Images:** Inline base64 or hosted; no external CSS

### Responsive Behavior

| Context | Behavior |
|---------|----------|
| Dashboard (desktop) | Full layout, multi-column grids |
| Dashboard (tablet) | 2-column → 1-column collapse |
| PDF (A4 print) | Fixed layout, page breaks at section boundaries |
| Email (all clients) | 600px fixed, single column |
| Mobile (candidate portal) | Stack vertically, charts full-width |

---

## GROUP 1: Assessment Reports

> **9 instruments | 22+ instances across portals | Format: Branded PDF + Dashboard view**
> **Generator:** All 5 Python generators can produce assessment PDFs

### 1.1 Instance Inventory

| Instrument | Code | Dimensions Measured | Portals |
|------------|------|-------------------|---------|
| LENS | AE-001 | Adaptive (dynamic question selection) | Client, Candidate |
| DRIVE | AE-002 | 5-dimension motivation profile | Client, Candidate |
| SHIFT | AE-003 | Composite talent score (unified) | Client, Candidate |
| LEAP | AE-004 | DISC behavioral + Career Readiness | Client, Candidate, Council, Coaching |
| QUEST | AE-005 | Strategic/executive evaluation | Client, Candidate |
| COACH | AE-006 | Leadership style + 360° feedback | Client, Candidate, Coaching, Leader |
| IMPACT | AE-007 | Performance impact scoring | Client, Candidate, Coaching |
| BRIDGE | AE-008 | Team dynamics fit | Client, Candidate |
| SPARK | AE-009 | AI readiness standalone | Client, Candidate |

**Variants:**
- Standard Report (PDF)
- Strengths-Based Report (AE-036) — positive framing
- White-Label Report (AE-042) — client-branded, no LYC logo
- Assessment Bundle (AE-032) — multiple instruments in one PDF
- Development Recommendations (AE-037) — AI-generated growth plan appended

### 1.2 Data Model

```json
{
  "report_meta": {
    "instrument": "LEAP",
    "candidate_name": "string",
    "candidate_title": "string",
    "client_name": "string",
    "mandate": "string",
    "date_completed": "ISO date",
    "consultant_name": "string",
    "report_id": "string",
    "white_label": false,
    "variant": "standard|strengths|bundle"
  },
  "overall_score": {
    "composite": 72,
    "percentile": 84,
    "confidence_interval": [68, 76],
    "tier": "Strong Match",
    "benchmark_role": "VP Engineering",
    "benchmark_score": 65
  },
  "dimensions": [
    {
      "name": "Dominance",
      "code": "D",
      "score": 78,
      "percentile": 82,
      "description": "Direct, results-oriented...",
      "strengths": ["Decisive", "Challenges status quo"],
      "risks": ["May override others", "Impatient with process"],
      "coaching_tips": ["Practice active listening", "..."]
    }
  ],
  "charts": {
    "radar": { "dimensions": [...], "values": [...] },
    "bar_comparison": { "candidate": [...], "benchmark": [...] },
    "gauge_row": { "dimensions": [...], "positions": [...] }
  },
  "ai_interpretation": {
    "executive_summary": "2-3 paragraph narrative...",
    "key_insights": ["insight 1", "insight 2", "insight 3"],
    "development_recommendations": ["rec 1", "rec 2"],
    "interview_questions": ["question 1", "question 2"]
  },
  "comparison_data": {
    "peer_group": [{ "name": "Avg", "scores": {...} }],
    "role_benchmark": { "scores": {...} },
    "team_overlay": [{ "name": "Teammate", "scores": {...} }]
  }
}
```

### 1.3 Layout Structure (Standard Assessment PDF)

```
PAGE 1: COVER
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│           [LYC LOGO — centered]             │
│                                             │
│         {Instrument} Profile                │
│         {Candidate Name}                    │
│         {Mandate / Role}                    │
│         {Date}                              │
│                                             │
│         Prepared by: {Consultant}           │
│         Prepared for: {Client}              │
│                                             │
│         CONFIDENTIAL                        │
│                                             │
└─────────────────────────────────────────────┘

PAGE 2: EXECUTIVE SUMMARY
┌─────────────────────────────────────────────┐
│ EXECUTIVE SUMMARY                           │
├─────────────────────────────────────────────┤
│                                             │
│ [Score Card — large]                        │
│ ┌──────────┐                               │
│ │  72/100  │  Tier: Strong Match           │
│ │  84th %ile│  Confidence: ±4              │
│ └──────────┘                               │
│                                             │
│ [AI Executive Summary — 2-3 paragraphs]     │
│                                             │
│ ● Key Insight 1 (fuchsia dot callout)       │
│ ● Key Insight 2                             │
│ ● Key Insight 3                             │
│                                             │
└─────────────────────────────────────────────┘

PAGE 3: DIMENSION OVERVIEW
┌─────────────────────────────────────────────┐
│ DIMENSION PROFILE                           │
├─────────────────────────────────────────────┤
│                                             │
│ [Radar Chart — dimensions on axes]          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  Dimension Score Cards (row of 4-6)     │ │
│ │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │ │
│ │  │  D  │ │  I  │ │  S  │ │  C  │     │ │
│ │  │ 78  │ │ 65  │ │ 82  │ │ 45  │     │ │
│ │  └─────┘ └─────┘ └─────┘ └─────┘     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Gauge Row — semicircle gauges per dim]     │
│ (v6 chart type — see chart spec below)      │
│                                             │
└─────────────────────────────────────────────┘

PAGE 4+: DIMENSION DETAIL PAGES (1 per dimension)
┌─────────────────────────────────────────────┐
│ {Dimension Name}                            │
├─────────────────────────────────────────────┤
│                                             │
│ Score: 78/100 (82nd percentile)             │
│ ┌──────────────────────────────────────┐    │
│ │ [Deviation from Mean chart]          │    │
│ │ Candidate vs Role Benchmark          │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ ┌─ Callout (top fuchsia rule) ──────────┐  │
│ │ ● Description paragraph                │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ STRENGTHS              │  RISKS             │
│ • Strength 1           │  • Risk 1          │
│ • Strength 2           │  • Risk 2          │
│ • Strength 3           │  • Risk 3          │
│                                             │
│ COACHING RECOMMENDATIONS                    │
│ • Recommendation 1                          │
│ • Recommendation 2                          │
│                                             │
│ SUGGESTED INTERVIEW QUESTIONS               │
│ • Question 1                                │
│ • Question 2                                │
│                                             │
└─────────────────────────────────────────────┘

LAST PAGE: DEVELOPMENT PLAN
┌─────────────────────────────────────────────┐
│ DEVELOPMENT RECOMMENDATIONS                 │
├─────────────────────────────────────────────┤
│                                             │
│ [AI-generated growth plan — structured]     │
│                                             │
│ 30-DAY ACTIONS                              │
│ • Action 1                                  │
│ • Action 2                                  │
│                                             │
│ 90-DAY ACTIONS                              │
│ • Action 1                                  │
│ • Action 2                                  │
│                                             │
│ LONG-TERM DEVELOPMENT                       │
│ • Goal 1                                    │
│ • Goal 2                                    │
│                                             │
└─────────────────────────────────────────────┘
```

### 1.4 Chart Specifications

**Radar Chart (Dimension Overview)**
- Shape: Regular polygon, one axis per dimension (4-8 axes)
- Fill: Fuchsia at 20% opacity
- Stroke: Fuchsia solid, 2px
- Benchmark overlay: Grey dashed line
- Labels: Dimension names at each vertex, DM Sans 8pt
- Scale: 0-100, concentric pentagons at 20/40/60/80/100

**Gauge Row (v6 — LEAP Executive Summary)**
- Row of semicircle gauges, one per dimension
- Each gauge: 180° arc, 0-100 scale
- Needle position: Score value
- Colors: Below 40 = grey, 40-60 = blue, 60-80 = fuchsia, 80+ = dark
- Label below: Dimension code + score
- Spacing: Equal width, max 6 per row

**Deviation from Mean (v6 — Structural Analysis)**
- Horizontal bar chart
- Center line = benchmark mean (0)
- Positive deviation right (fuchsia bars)
- Negative deviation left (blue bars)
- Labels: Dimension names on y-axis, deviation value on x-axis
- Data labels: +/- value at bar end

**Score Cards (Dimension Detail)**
- Card: Rounded rectangle, light grey background
- Score: Large number (18pt bold, centered)
- Percentile: Smaller text below (10pt)
- Tier badge: Color-coded label (Strong/Adequate/Development)
- Grid: 3-4 cards per row

### 1.5 Variant Specs

**Strengths-Based Report (AE-036)**
- Same layout, but framing is inverted: leads with strengths, risks positioned as "growth opportunities"
- Color: Uses success green as accent instead of fuchsia for top strengths
- Cover: Adds "Strengths-Based Analysis" subtitle

**White-Label Report (AE-042)**
- No LYC logo anywhere
- Client logo on cover + header
- Footer: "Confidential — {Client Name}" only
- Color palette: Client primary color replaces fuchsia (configurable)

**Assessment Bundle (AE-032)**
- Cover lists all instruments included
- Each instrument gets its own section (3-5 pages each)
- Comparative summary page at end: radar overlay of all instruments
- Total page count: 2 (cover+summary) + 3-5 per instrument + 1 (comparison) + 1 (development plan)

---

## GROUP 2: Executive Briefings & Presentations

> **4 instances | Board-ready decks | Format: PDF + Presentation slides**
> **Generator:** `leap2_report`

### 2.1 Instance Inventory

| Report | Portal | Usage | Pages |
|--------|--------|-------|-------|
| Executive Briefing | Leader, Client | Board-ready summary for leadership | 5-8 |
| AI Executive Briefing Auto-Gen | Client | Auto-generated board brief per mandate | 5-8 |
| Board Report | Internal | Full board presentation with data | 10-15 |
| QBR Summary | Client | Quarterly business review presentation | 8-12 |

### 2.2 Data Model

```json
{
  "briefing_meta": {
    "title": "Q3 2026 Executive Briefing",
    "client": "string",
    "period": "Q3 2026",
    "prepared_by": "string",
    "date": "ISO date",
    "classification": "Confidential"
  },
  "key_metrics": {
    "revenue": { "value": 450000, "target": 500000, "delta_pct": -10 },
    "placements": { "value": 12, "target": 15 },
    "time_to_fill": { "value": 34, "unit": "days", "benchmark": 42 },
    "quality_of_hire": { "score": 82, "benchmark": 75 },
    "retention_12m": { "pct": 91, "benchmark": 85 }
  },
  "mandate_summary": [
    {
      "mandate": "VP Engineering",
      "status": "Active",
      "stage": "Shortlist",
      "candidates_shortlisted": 5,
      "interviews_scheduled": 3,
      "days_in_pipeline": 28,
      "health": "On Track"
    }
  ],
  "market_intelligence": {
    "talent_availability": "Tight",
    "compensation_trend": "+8% YoY",
    "key_competitors_hiring": ["Company A", "Company B"],
    "market_insight": "string"
  },
  "recommendations": ["rec 1", "rec 2", "rec 3"],
  "next_steps": ["step 1", "step 2"]
}
```

### 2.3 Layout Structure

**Slide 1: Title Slide**
```
┌─────────────────────────────────────────────┐
│                                             │
│           [LYC LOGO — large, centered]      │
│                                             │
│         Executive Briefing                  │
│         {Client Name}                       │
│         {Period}                            │
│                                             │
│         {Date}                              │
│         CONFIDENTIAL                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Slide 2: Key Metrics Dashboard**
```
┌─────────────────────────────────────────────┐
│ KEY METRICS                                 │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ Revenue  │ │Placements│ │Time/Fill │       │
│ │ $450K   │ │   12    │ │  34d    │       │
│ │ ▼ -10%  │ │ ▼ -20%  │ │ ▲ -19%  │       │
│ └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │Quality   │ │Retention│ │  NPS    │       │
│ │  82/100 │ │   91%   │ │   72    │       │
│ │ ▲ +9%   │ │ ▲ +6%   │ │ ▲ +12   │       │
│ └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│ [Gauge Row — top 5 KPIs as semicircles]     │
│                                             │
└─────────────────────────────────────────────┘
```

**Slide 3: Mandate Status Overview**
```
┌─────────────────────────────────────────────┐
│ MANDATE STATUS                              │
├─────────────────────────────────────────────┤
│                                             │
│ [Staircase chart — pipeline stages]         │
│ Screened → Shortlisted → Interviewed →      │
│ Offer → Accepted                            │
│                                             │
│ [Table: Mandate list with status badges]    │
│ | Mandate | Status | Stage | Days | Health | │
│ | VP Eng  | Active | SL    |  28  |  ●    │ │
│ | CMO     | Active | INT  |  42  |  ●    │ │
│                                             │
└─────────────────────────────────────────────┘
```

**Slide 4: Market Intelligence**
```
┌─────────────────────────────────────────────┐
│ MARKET INTELLIGENCE                         │
├─────────────────────────────────────────────┤
│                                             │
│ [Talent Heatmap or Market Map visual]       │
│                                             │
│ ┌─ Callout (top fuchsia rule) ──────────┐  │
│ │ ● Key market insight paragraph         │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ Talent Availability: Tight                  │
│ Compensation Trend: +8% YoY                 │
│ Competitors Hiring: [list]                  │
│                                             │
└─────────────────────────────────────────────┘
```

**Slide 5+: Recommendations & Next Steps**
```
┌─────────────────────────────────────────────┐
│ RECOMMENDATIONS                             │
├─────────────────────────────────────────────┤
│                                             │
│ ● Recommendation 1                          │
│   Supporting detail                         │
│                                             │
│ ● Recommendation 2                          │
│   Supporting detail                         │
│                                             │
│ NEXT STEPS                                  │
│ ┌──────────────────────────────────────┐    │
│ │ 1. [Action] — Owner — Deadline      │    │
│ │ 2. [Action] — Owner — Deadline      │    │
│ └──────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.4 Chart Specifications

**Staircase Chart (Pipeline Funnel)**
- Horizontal stepped bar chart (like a staircase going right-to-left, descending)
- Each step = pipeline stage
- Bar width: proportional to candidate count
- Color: Fuchsia gradient from dark (first stage) to light (last stage)
- Labels: Stage name + count at each step
- Annotation: Conversion rate between stages

**KPI Metric Cards**
- Card: Dark background (`#0F1115`), white text
- Value: 24pt bold, centered
- Delta: Green ▲ or red ▼ with percentage
- Label: 8pt above value
- Target indicator: thin progress bar beneath

### 2.5 Interaction Patterns

| Context | Behavior |
|---------|----------|
| PDF export | Each slide = 1 page, landscape A4 |
| Presentation mode | Click-through slides, 16:9 aspect ratio |
| Inline dashboard | Responsive grid, cards stack on mobile |
| Print | Landscape, optimized for projector (high contrast) |

---

## GROUP 3: Scorecards & Comparison Views

> **8 instances | Inline dashboard + PDF | Format: Dashboard widgets + Score cards**

### 3.1 Instance Inventory

| Report | Portal | Usage | Data Source |
|--------|--------|-------|-------------|
| Candidate Match Scorecard | Client | Per-candidate match % vs mandate | AI-003 |
| Pipeline Health Score | Client | Overall mandate health indicator | PW-053 |
| Score Confidence Interval | Client | Measurement precision display | AE-029 |
| Work Sample Evaluation | Client | AI-evaluated work sample | AE-048 |
| Candidate Comparison Matrix | Client | Side-by-side multi-candidate | AI-008 |
| Role-Specific Benchmark | Client | Candidate vs role norms | AE-019 |
| Assessment Comparison View | Client, Consultant | Multi-candidate assessment overlay | AE-018 |
| Consultant Performance Scorecard | Internal | Individual consultant metrics | AR-006 |

### 3.2 Data Model

```json
{
  "scorecard_type": "candidate_match|pipeline_health|comparison|consultant",
  "subject": {
    "name": "Candidate Name",
    "role": "Mandate / Role",
    "id": "string"
  },
  "scores": [
    {
      "dimension": "Technical Fit",
      "score": 85,
      "max": 100,
      "percentile": 88,
      "benchmark": 72,
      "delta": "+13"
    }
  ],
  "composite": {
    "score": 82,
    "tier": "Strong Match",
    "confidence": [78, 86]
  },
  "comparison_subjects": [
    { "name": "Candidate A", "scores": {...} },
    { "name": "Candidate B", "scores": {...} }
  ],
  "flags": {
    "top_match": true,
    "risk_flag": false,
    "missing_data": false
  }
}
```

### 3.3 Layout Structure

**Single Scorecard (Candidate Match)**
```
┌─────────────────────────────────────────────┐
│ {Candidate Name} — {Mandate}               │
├─────────────────────────────────────────────┤
│                                             │
│ ┌──────────────────────────────────────┐    │
│ │         COMPOSITE SCORE              │    │
│ │         ┌────────┐                   │    │
│ │         │   82   │  Tier: Strong     │    │
│ │         │  /100  │  Confidence: ±4   │    │
│ │         └────────┘                   │    │
│ │         88th percentile              │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ DIMENSION BREAKDOWN                         │
│ ┌──────────────────────────────────────────┐│
│ │ Technical Fit    ████████░░  85   ▲+13  ││
│ │ Leadership       ██████░░░░  68   ▲+5   ││
│ │ Culture Match    ███████░░░  78   ▼-2   ││
│ │ Experience       █████████░  92   ▲+20  ││
│ │ Communication    █████░░░░░  55   ▼-8   ││
│ └──────────────────────────────────────────┘│
│                                             │
│ ● AI Insight: "Strong technical fit with    │
│   notable leadership upside. Culture        │
│   alignment slightly below team norm."      │
│                                             │
└─────────────────────────────────────────────┘
```

**Comparison Matrix (Multi-Candidate)**
```
┌─────────────────────────────────────────────┐
│ CANDIDATE COMPARISON — {Mandate}           │
├─────────────────────────────────────────────┤
│                                             │
│ | Dimension   | Cand A | Cand B | Cand C | │
│ |─────────────|────────|────────|────────| │
│ | Technical   |   85   |   72   |   90   | │
│ | Leadership  |   68   |   85   |   60   | │
│ | Culture     |   78   |   82   |   70   | │
│ | Experience  |   92   |   65   |   88   | │
│ |─────────────|────────|────────|────────| │
│ | COMPOSITE   |   82   |   76   |   79   | │
│ | Tier        | Strong | Adeq.  | Strong | │
│                                             │
│ [Radar overlay — all candidates]            │
│                                             │
│ ● Top match for technical depth: Cand A     │
│ ● Strongest leadership: Cand B              │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.4 Chart Specifications

**Horizontal Progress Bar**
- Bar: Rounded rectangle, fuchsia fill to score %
- Track: Light grey background
- Value: Right-aligned, bold
- Delta: Colored ▲/▼ with value
- Height: 12px bar, 20px row height

**Tier Badge**
- Label: Rounded pill, white text on colored background
- Strong Match: Fuchsia background
- Adequate: Blue background
- Development Needed: Grey background
- Risk: Red background
- Size: Auto-width, 20px height, 8pt text

**Radar Overlay (Comparison)**
- Same radar as Group 1, but with multiple colored fills
- Candidate 1: Fuchsia 20% fill
- Candidate 2: Blue 20% fill
- Candidate 3: Green 20% fill
- Legend: Top-right, colored dots + names

---

## GROUP 4: Diagnostic Reports

> **9 instances | Dashboard + PDF | Format: Behavioral/team analysis**

### 4.1 Instance Inventory

| Report | Portal | Usage | Chart Focus |
|--------|--------|-------|-------------|
| Member Diagnostics | Council | Assessment-linked insights | Gauge Row |
| LEAP Exec Summary (Gauge Row) | Council | v6 gauge row visualization | Gauge Row |
| LEAP Structural (Deviation) | Council | Deviation from mean chart | Deviation from Mean |
| Team Composition Report | Leader | Team dynamics analysis | Radar + Heatmap |
| Aggregate Assessment Insights | Internal | Cohort-level patterns | Distribution charts |
| Criterion Validation Report | Internal | Predictive validity | Scatter plot |
| Team-Level Aggregate Report | Leader | Aggregate team metrics | Bar charts |
| Consultant Debrief (Diagnostic) | Council | Mandate debrief with diagnostics | Staircase + Tables |
| Shift Report (Diagnostic) | Coaching | Mandate diagnostic | Staircase + Tables |

### 4.2 Data Model

```json
{
  "diagnostic_type": "member|team|cohort|validation",
  "subject": {
    "name": "Team/Member/Cohort Name",
    "size": 12,
    "context": "string"
  },
  "diagnostic_scores": [
    {
      "dimension": "string",
      "mean": 68.5,
      "median": 70,
      "std_dev": 12.3,
      "min": 42,
      "max": 95,
      "distribution": [2, 5, 8, 15, 22, 25, 18, 5]
    }
  ],
  "deviations": [
    {
      "dimension": "string",
      "team_mean": 68,
      "benchmark_mean": 55,
      "deviation": +13,
      "significant": true
    }
  ],
  "patterns": {
    "strength_cluster": ["Dimension A", "Dimension B"],
    "risk_cluster": ["Dimension C"],
    "outlier_count": 2,
    "coherence_score": 0.78
  }
}
```

### 4.3 Layout Structure

**Diagnostic Report (Council/Leader)**
```
┌─────────────────────────────────────────────┐
│ {Team/Member} Diagnostic                    │
├─────────────────────────────────────────────┤
│                                             │
│ [Gauge Row — v6 semicircle gauges]          │
│ (One per dimension, team mean values)       │
│                                             │
│ [Deviation from Mean chart — v6]            │
│ Team vs Benchmark comparison                │
│                                             │
│ ┌─ Callout (top fuchsia rule) ──────────┐  │
│ │ ● Pattern insight: "Team shows          │  │
│ │   significantly elevated Dominance      │  │
│ │   (+13 vs benchmark), suggesting a      │  │
│ │   high-agency culture."                 │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ STRENGTH PATTERNS        │ RISK PATTERNS    │
│ • Pattern 1              │ • Pattern 1      │
│ • Pattern 2              │ • Pattern 2      │
│                                             │
│ OUTLIER ANALYSIS                            │
│ • Member X: Elevated Steadiness             │
│ • Member Y: Low Conscientiousness           │
│                                             │
│ RECOMMENDATIONS                             │
│ • Team-level recommendation 1               │
│ • Team-level recommendation 2               │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.4 Chart Specifications

**Distribution Histogram (Cohort)**
- Bars: Fuchsia, 2px gap
- X-axis: Score bins (0-10, 11-20, ..., 91-100)
- Y-axis: Count
- Mean line: Vertical dashed line, dark color
- Benchmark overlay: Grey dashed histogram outline

**Scatter Plot (Validation)**
- X-axis: Assessment score
- Y-axis: Performance outcome
- Points: Fuchsia dots, 6px diameter
- Regression line: Dark solid line
- R² label: Top-right corner
- Confidence band: Light fuchsia fill around line

---

## GROUP 5: Talent Maps & Market Visualizations

> **7 instances | Interactive + PDF | Format: Visual market landscape**

### 5.1 Instance Inventory

| Report | Portal | Usage | Visualization |
|--------|--------|-------|---------------|
| AI Talent Map | Client | Visual market landscape per mandate | Bubble chart / Network |
| Talent Market Heatmap | Client | Geographic/functional heatmaps | Heatmap grid |
| Talent Supply/Demand Heatmap | Client | Strategic workforce planning | Heatmap grid |
| Competitor Org Chart | Client, Council | Sanitized competitor org structure | Tree diagram |
| Market Briefing | Client, Coaching | Weekly talent market report | Text + charts |
| Competitive Intelligence Report | Client | Competitor hiring signals | Table + charts |
| Compensation Benchmark | Client | Market rate benchmarks | Bar chart |

### 5.2 Data Model

```json
{
  "map_type": "talent_map|heatmap|org_chart|benchmark",
  "mandate": "VP Engineering",
  "market": {
    "geography": ["Shanghai", "Beijing", "Shenzhen"],
    "functions": ["Engineering", "Product", "Data"],
    "industries": ["Tech", "Finance", "Consulting"]
  },
  "talent_pool": [
    {
      "name": "string",
      "current_company": "string",
      "title": "string",
      "location": "Shanghai",
      "function": "Engineering",
      "seniority": "VP",
      "estimated_comp": { "base": 150, "total": 220, "currency": "万" },
      "match_score": 85,
      "availability": "Active|Passive|Unavailable",
      "company_tier": "Tier 1"
    }
  ],
  "supply_demand": {
    "dimensions": ["function", "location", "seniority"],
    "data": [
      { "key": "Engineering+Shanghai", "supply": 340, "demand": 520, "ratio": 0.65 }
    ]
  },
  "org_structure": {
    "company": "Competitor Corp",
    "nodes": [
      { "name": "CTO", "reports_to": null, "headcount": 1 },
      { "name": "VP Eng", "reports_to": "CTO", "headcount": 45 }
    ]
  }
}
```

### 5.3 Layout Structure

**Talent Map (Interactive + PDF)**
```
┌─────────────────────────────────────────────┐
│ Talent Map — {Mandate}                      │
├─────────────────────────────────────────────┤
│                                             │
│ [Bubble Chart or Network Visualization]     │
│                                             │
│ Each bubble = candidate                     │
│ X: Function / Seniority                     │
│ Y: Company tier                             │
│ Size: Match score                           │
│ Color: Availability (Green=Active,          │
│        Blue=Passive, Grey=Unavailable)      │
│                                             │
│ [Filter bar: Geography | Function | Tier]   │
│                                             │
│ [Legend]                                    │
│                                             │
│ Pool Statistics:                            │
│ Total: 45 | Active: 12 | Tier 1: 18       │
│                                             │
│ TOP CANDIDATES                              │
│ | Name | Company | Title | Match | Status | │
│ | A    | TechCo  | VP    | 92    | Active  │ │
│ | B    | FinCo   | Dir   | 87    | Passive │ │
│                                             │
└─────────────────────────────────────────────┘
```

**Heatmap**
```
┌─────────────────────────────────────────────┐
│ Talent Supply / Demand — {Market}          │
├─────────────────────────────────────────────┤
│                                             │
│        Eng    Product   Data    Finance     │
│ SH   [████]  [██░░]   [███░]  [█░░░]      │
│ BJ   [███░]  [████]   [██░░]  [██░░]      │
│ SZ   [██░░]  [█░░░]   [████]  [███░]      │
│                                             │
│ Color scale: Supply/Demand ratio            │
│ ■ 0-0.3 (Scarce)  ■ 0.3-0.7 (Tight)       │
│ ■ 0.7-1.0 (Balanced) ■ 1.0+ (Surplus)     │
│                                             │
│ Tooltip on hover: Exact supply, demand,     │
│ ratio, trend                               │
│                                             │
└─────────────────────────────────────────────┘
```

**Org Chart**
```
┌─────────────────────────────────────────────┐
│ Competitive Org Chart — {Company}          │
├─────────────────────────────────────────────┤
│                                             │
│              [CEO]                          │
│                │                            │
│        ┌───────┼───────┐                    │
│      [CTO]   [CFO]   [COO]                  │
│        │                                    │
│    ┌───┼───┐                                │
│  [VP E] [VP P] [Dir D]                     │
│    │                                        │
│  [45 eng]                                   │
│                                             │
│ Nodes: Colored by data confidence           │
│ ● Verified  ● Estimated  ● Unknown          │
│ Names sanitized (role titles only)          │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.4 Chart Specifications

**Bubble Chart (Talent Map)**
- X-axis: Function (categorical, evenly spaced)
- Y-axis: Company tier (categorical, Tier 1 top)
- Bubble size: Match score (radius 8-24px)
- Color: Availability status
- Hover: Tooltip with name, company, title, score
- Click: Opens candidate profile slide-over

**Heatmap Grid**
- Rows: Geography
- Columns: Function
- Cell color: Supply/demand ratio on diverging color scale
- Scale: Red (scarce) → Yellow (balanced) → Green (surplus)
- Cell label: Ratio value (2 decimal)
- Hover: Supply, demand, ratio, YoY trend

**Tree Diagram (Org Chart)**
- Layout: Top-down hierarchical tree
- Node: Rounded rectangle, name/title inside
- Connector: 1px grey line
- Color: Confidence level (dark=verified, fuchsia=estimated, grey=unknown)
- Interaction: Click to expand/collapse subtrees
- Note: All personal names sanitized; only role titles shown

---

## GROUP 6: Pipeline & Status Reports

> **8+ instances | Dashboard + PDF | Format: Funnel analytics, status tracking**

### 6.1 Instance Inventory

| Report | Portal | Usage | Primary Chart |
|--------|--------|-------|---------------|
| Mandate Status Report | Client | Auto-written mandate updates | Table + Timeline |
| Pipeline Analytics | Client, Internal | Funnel conversion by stage | Funnel chart |
| Pipeline Velocity Metrics | Client | Stage-to-stage conversion rates | Bar chart |
| Pipeline Forecasting | Client | Projected fills by date | Line chart |
| Time-to-Fill Report | Client | Mandate velocity metrics | Bar chart |
| SLA Compliance Dashboard | Client, Internal | SLA adherence tracking | Gauge + Table |
| Milestone Timeline | Client | Visual project progress | Gantt/Timeline |
| Mandate Profitability Report | Internal | Cost vs revenue per mandate | Waterfall |

### 6.2 Data Model

```json
{
  "report_type": "mandate_status|pipeline_analytics|forecasting|sla",
  "mandate": {
    "name": "VP Engineering",
    "client": "TechCorp",
    "status": "Active",
    "opened": "2026-06-01",
    "target_fill": "2026-09-01"
  },
  "pipeline": {
    "stages": [
      { "name": "Sourced", "count": 120, "conversion": null },
      { "name": "Screened", "count": 45, "conversion": "37.5%" },
      { "name": "Shortlisted", "count": 12, "conversion": "26.7%" },
      { "name": "Interviewed", "count": 6, "conversion": "50.0%" },
      { "name": "Offer", "count": 2, "conversion": "33.3%" },
      { "name": "Accepted", "count": 1, "conversion": "50.0%" }
    ],
    "overall_conversion": "0.83%",
    "avg_time_per_stage": { "Sourced": 2, "Screened": 5, "Shortlisted": 7 }
  },
  "forecast": {
    "projected_fill_date": "2026-08-15",
    "confidence": "Medium",
    "risk_factors": ["Tight market", "Below-market comp"]
  },
  "sla": {
    "items": [
      { "milestone": "Shortlist delivered", "target": "2026-06-15", "actual": "2026-06-14", "status": "Met" },
      { "milestone": "First interviews", "target": "2026-07-01", "actual": null, "status": "On Track" }
    ],
    "compliance_rate": 92
  }
}
```

### 6.3 Layout Structure

**Pipeline Analytics Dashboard**
```
┌─────────────────────────────────────────────┐
│ Pipeline — {Mandate / All Mandates}        │
├─────────────────────────────────────────────┤
│                                             │
│ [Funnel Chart — pipeline stages]            │
│                                             │
│ ┌─────────────────────────────────┐        │
│ │         Sourced: 120            │        │
│ │        Screened: 45             │        │
│ │       Shortlisted: 12           │        │
│ │      Interviewed: 6             │        │
│ │          Offer: 2               │        │
│ │        Accepted: 1              │        │
│ └─────────────────────────────────┘        │
│                                             │
│ VELOCITY                                    │
│ | Stage        | Avg Days | vs Benchmark | │
│ | Sourced→Scr  |    2     │    ▲ -1      | │
│ | Scr→SL       |    5     │    ▼ +2      | │
│ | SL→Int       |    7     │    ─ 0       | │
│                                             │
│ FORECAST                                    │
│ Projected fill: Aug 15, 2026 (Medium conf.) │
│ [Line chart: historical + projected]        │
│                                             │
└─────────────────────────────────────────────┘
```

### 6.4 Chart Specifications

**Funnel Chart**
- Trapezoidal sections, widest at top
- Color: Gradient from fuchsia (top) to light pink (bottom)
- Labels: Stage name + count inside each section
- Conversion rate: Between sections, right-aligned
- Width: Full content width

**Timeline / Gantt**
- Horizontal bars on time axis
- Each bar = mandate phase or milestone
- Color: Status (fuchsia=active, green=complete, grey=upcoming, red=delayed)
- Today marker: Vertical dashed line
- Labels: Milestone name left, date right

**Waterfall Chart (Profitability)**
- Bars: Starting value, + additions (green), - deductions (red), ending value
- Connector: Thin lines between bars
- Labels: Value at each bar top

---

## GROUP 7: Shortlists & Candidate Profiles

> **3 instances | PDF + Dashboard | Format: Ranked lists, candidate cards**

### 7.1 Instance Inventory

| Report | Portal | Usage | Content |
|--------|--------|-------|---------|
| Ranked Shortlist | Client | Auto-ranked candidates per mandate | Table + scorecards |
| Candidate Persona | Client | Rich candidate profile | Profile card + narrative |
| Multi-Mandate Candidate View | Client | All roles a candidate appears in | Cross-reference table |

### 7.2 Data Model

```json
{
  "shortlist": {
    "mandate": "VP Engineering",
    "total_candidates": 5,
    "candidates": [
      {
        "rank": 1,
        "name": "Candidate A",
        "title": "Current Title",
        "company": "Current Company",
        "location": "Shanghai",
        "match_score": 92,
        "tier": "Strong Match",
        "key_strengths": ["15yr experience", "Scaled team 10→100"],
        "key_risks": ["Limited international exposure"],
        "compensation": { "current": 150, "expected": 200, "currency": "万" },
        "availability": "2 weeks notice",
        "ai_summary": "2-3 sentence summary..."
      }
    ]
  },
  "candidate_persona": {
    "name": "string",
    "photo_url": "string|null",
    "current_role": "string",
    "experience_years": 15,
    "education": ["Tsinghua CS", "Stanford MBA"],
    "career_trajectory": "narrative...",
    "assessment_highlights": { "LEAP": {...}, "DRIVE": {...} },
    "interview_feedback": [{ "interviewer": "string", "rating": 4, "notes": "string" }],
    "compensation_benchmark": { "market_p50": 180, "market_p75": 220 }
  }
}
```

### 7.3 Layout Structure

**Ranked Shortlist**
```
┌─────────────────────────────────────────────┐
│ Shortlist — {Mandate}                       │
│ Generated: {Date} | Candidates: {N}        │
├─────────────────────────────────────────────┤
│                                             │
│ | # | Name | Title | Company | Score | Tier│
│ | 1 | A    | VP   | TechCo   |  92   | ●  │
│ | 2 | B    | Dir  | FinCo    |  87   | ●  │
│ | 3 | C    | SrM  | ConsultCo|  82   | ●  │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│ #1 — {Candidate A}                         │
│                                             │
│ ┌─ Score Card ─┐  ┌─ AI Summary ─────────┐ │
│ │  92/100      │  │ "15yr experience in   │ │
│ │  Strong Match│  │  scaling engineering   │ │
│ │  88th %ile   │  │  teams..."            │ │
│ └──────────────┘  └───────────────────────┘ │
│                                             │
│ Strengths:               Risks:             │
│ • Scaled team 10→100     • Limited intl.    │
│ • Deep technical bg      • High comp expect  │
│                                             │
│ Compensation: ¥150万 → ¥200万 expected      │
│ Availability: 2 weeks notice                │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ (repeat for each candidate)                 │
│                                             │
└─────────────────────────────────────────────┘
```

### 7.4 Chart Specifications

**Tier Dot (in tables)**
- Small colored circle (8px) next to tier label
- Strong: Fuchsia
- Adequate: Blue
- Development: Grey
- Risk: Red

**Candidate Card (expanded view)**
- Left: Score card (Group 3 spec)
- Right: AI summary text + strengths/risks
- Bottom: Compensation bar + availability
- Divider: 1px grey line between candidates

---

## GROUP 8: Consultation Guides

> **10 instances | PDF | Format: Structured consultation templates**
> **Generator:** `generate_consultation_guides`

### 8.1 Instance Inventory

| Guide | Focus | Pages |
|-------|-------|-------|
| Consultation Guide 1 | Initial client discovery | 5-8 |
| Consultation Guide 2 | Mandate kick-off | 5-8 |
| Consultation Guide 3 | Market mapping briefing | 5-8 |
| Consultation Guide 4 | Shortlist review | 5-8 |
| Consultation Guide 5 | Interview preparation | 5-8 |
| Consultation Guide 6 | Offer negotiation | 5-8 |
| Consultation Guide 7 | Onboarding planning | 5-8 |
| Consultation Guide 8 | 90-day check-in | 5-8 |
| Consultation Guide 9 | Performance review prep | 5-8 |
| Consultation Guide 10 | Leadership development plan | 8-12 |

### 8.2 Data Model

```json
{
  "guide_meta": {
    "guide_number": 4,
    "title": "Shortlist Review Consultation",
    "client": "TechCorp",
    "mandate": "VP Engineering",
    "consultant": "string",
    "date": "ISO date"
  },
  "sections": [
    {
      "title": "Candidate Overview",
      "type": "table|narrative|questions|checklist",
      "content": "..."
    }
  ],
  "candidate_data": [{ "name": "...", "scores": {...}, "notes": "..." }],
  "discussion_points": ["point 1", "point 2"],
  "action_items": ["action 1", "action 2"],
  "next_steps": ["step 1", "step 2"]
}
```

### 8.3 Layout Structure

```
┌─────────────────────────────────────────────┐
│ LYC Partners                                │
│ Consultation Guide #{N}                     │
│ {Guide Title}                               │
├─────────────────────────────────────────────┤
│                                             │
│ Client: {Client} | Mandate: {Mandate}      │
│ Date: {Date} | Consultant: {Name}          │
│                                             │
│ ─── Section 1 ────────────────────────────  │
│                                             │
│ [Content block — type varies]               │
│                                             │
│ ─── Section 2 ────────────────────────────  │
│                                             │
│ ┌─ Discussion Points ───────────────────┐  │
│ │ 1. Point with context                 │  │
│ │ 2. Point with context                 │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ ┌─ Action Items ────────────────────────┐  │
│ │ ☐ Action item 1 — Owner — Deadline   │  │
│ │ ☐ Action item 2 — Owner — Deadline   │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ ─── Next Steps ──────────────────────────   │
│ • Step 1                                    │
│ • Step 2                                    │
│                                             │
└─────────────────────────────────────────────┘
```

### 8.4 Design Notes

- Content blocks alternate between: tables, narrative text, checklists, discussion prompts
- Use fuchsia dot callouts for key talking points
- Discussion points use numbered list with context text
- Action items use checkbox style (visual only — these are printed guides)
- Each guide follows the same structural template for consistency
- Header/footer per standard PDF spec (Group 0)

---

## GROUP 9: Email Report Templates

> **10 instances | HTML email | Format: Email-compatible HTML**
> **Generator:** `generate_email_reports`

### 9.1 Instance Inventory

| Email Report | Trigger | Recipients | Key Content |
|-------------|---------|------------|-------------|
| Weekly Mandate Digest | Weekly (auto) | Client stakeholders | Pipeline summary, key metrics |
| Pipeline Status Update | Milestone change | Client + consultants | Stage changes, alerts |
| Assessment Completion Alert | Assessment finished | Consultant + client | Score summary, next steps |
| Candidate Shortlist Notification | Shortlist generated | Client decision-makers | Ranked list + top picks |
| Interview Feedback Summary | All feedback collected | Consultant + client | Aggregate ratings, themes |
| Market Briefing Email | Weekly (auto) | Client leadership | Market trends, talent signals |
| Consultant Performance Digest | Monthly | Internal management | Team metrics, rankings |
| Client Activity Digest | Weekly (auto) | Client stakeholders | Engagement metrics, logins |
| SLA Alert Report | Threshold breach | Internal + client | Time-in-stage, overdue items |
| QBR Summary Email | Quarterly | Client leadership | Quarterly metrics, trends |

### 9.2 Data Model

```json
{
  "email_type": "weekly_digest|status_update|alert|notification|briefing",
  "recipient_context": {
    "name": "string",
    "role": "string",
    "client": "string"
  },
  "subject_line": "Weekly Mandate Digest — TechCorp — W30",
  "preheader": "3 mandates on track, 1 at risk",
  "sections": [
    {
      "title": "Pipeline Summary",
      "type": "metric_row|table|chart_image|text",
      "content": "..."
    }
  ],
  "metrics": [
    { "label": "Active Mandates", "value": "5", "delta": "+1" },
    { "label": "Candidates in Pipeline", "value": "42", "delta": "+8" }
  ],
  "cta": {
    "text": "View Full Dashboard",
    "url": "https://app.lyc-intelligence.app/dashboard"
  }
}
```

### 9.3 Layout Structure

```
┌─────────────────────────────────────────────┐
│ ┌───────────────────────────────────────┐  │
│ │ [LYC Logo — white on dark bar]        │  │  ← Dark header (#0F1115)
│ └───────────────────────────────────────┘  │
│                                             │
│ Hi {Name},                                  │
│                                             │
│ Here's your weekly update for {Client}.     │
│                                             │
│ ┌─ Key Metrics ─────────────────────────┐  │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │  │
│ │ │  5  │ │ 42  │ │ 34d │ │ 82% │     │  │
│ │ │Mand.│ │Cand.│ │ T/F │ │ SLA │     │  │
│ │ │ +1  │ │ +8  │ │ -3d │ │ +5% │     │  │
│ │ └─────┘ └─────┘ └─────┘ └─────┘     │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ ┌─ Mandate Status ──────────────────────┐  │
│ │ VP Engineering  ████████░░ On Track  │  │
│ │ CMO             █████░░░░░ At Risk   │  │
│ │ Head of Product ██████████ Filled    │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ [Mini chart image — pipeline funnel]        │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │    [View Full Dashboard →]            │  │  ← Fuchsia CTA button
│ └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│ LYC Partners | Shanghai                     │
│ Unsubscribe | Privacy Policy               │
└─────────────────────────────────────────────┘
```

### 9.4 Design Constraints

| Constraint | Rule |
|-----------|------|
| Max width | 600px |
| Font | DM Sans only (no serif in emails) |
| Images | Inline base64 or hosted CDN |
| CSS | Inline styles only (email client compatibility) |
| Layout | HTML tables for structure |
| Charts | Rendered as PNG images (not interactive) |
| Dark mode | Test on Gmail, Apple Mail, Outlook |
| Accessibility | Alt text on all images, semantic HTML |
| CTA button | Fuchsia background, white text, 44px height |
| Footer | Legal text, unsubscribe link, LYC address |

### 9.5 Email-Specific Components

**Metric Row (inline cards)**
- 4 cards in a row (HTML table with 4 cells)
- Each card: Light grey background, large value, label below, delta with color
- Responsive: 2×2 grid on narrow screens (media query)

**Progress Bar (inline)**
- Table cell with background color fill to simulate progress bar
- Fuchsia fill, grey track
- Label above, value below

**Status Badge (inline)**
- Small colored text: "On Track" (green), "At Risk" (red), "Filled" (blue)
- No background — just colored bold text

---

## GROUP 10: Branded PDF Deliverables

> **5 instances | PDF | Format: LYC-branded document wrappers**
> **Applies to:** All reports exported as PDF from any portal

### 10.1 Instance Inventory

| Deliverable | Portal | Usage |
|------------|--------|-------|
| Branded PDF Deliverables | Client | All LYC-branded reports |
| Co-Branded Reports | Client | LYC + Client logo deliverables |
| Executive Summary Auto-Gen | Client | Board-ready client briefs |
| Data Room Documents | Client | Secure document sharing per mandate |
| Report Library | Client | Collection view, shared reports |

### 10.2 Design Specification

**Standard Branded PDF (LYC only)**
- Header: LYC logo (dark background bar, white text)
- Footer: LYC logo (small) + "Confidential" + page number
- Accent: Fuchsia line under header
- Background: White

**Co-Branded PDF**
- Header: LYC logo (left) + Client logo (right), separated by thin grey line
- Footer: "Confidential" + page number (no logos in footer)
- Accent: Fuchsia line under header (same as standard)

**Report Library (collection page)**
- Dashboard view showing all available reports as cards
- Each card: Report type icon + title + date + status badge
- Click to open/download
- Filter: By type, date, mandate
- Sort: By date (newest first)

### 10.3 Export Options

| Format | When | Notes |
|--------|------|-------|
| PDF | Default for all reports | A4, print-ready |
| XLSX | Data-heavy reports (pipeline, analytics) | Raw data + formatted sheets |
| CSV | Single-table exports | No formatting |
| HTML | Email reports | 600px width, inline CSS |

---

## Cross-Reference: Report Type → Design Group

| Report Type | Design Group | Template Count |
|-------------|-------------|---------------|
| Assessment Reports (9 instruments) | Group 1 | 1 base + 4 variants |
| Executive Briefings | Group 2 | 1 slide deck template |
| Scorecards | Group 3 | 2 (single + comparison) |
| Diagnostic Reports | Group 4 | 1 base template |
| Talent Maps | Group 5 | 3 (bubble + heatmap + org chart) |
| Pipeline Reports | Group 6 | 1 dashboard template |
| Shortlists | Group 7 | 2 (list + profile card) |
| Consultation Guides | Group 8 | 1 guide template |
| Email Reports | Group 9 | 3 (digest + alert + briefing) |
| Branded PDFs | Group 10 | 2 (LYC only + co-branded) |

**Total unique HTML templates to build: ~18**

---

## Priority & Sequencing

| Priority | Group | Rationale |
|----------|-------|-----------|
| P0 — Build first | Group 1 (Assessments) | Most complex, highest volume, core product |
| P0 — Build first | Group 9 (Email Reports) | Automated delivery, customer-facing |
| P1 — Build second | Group 2 (Executive Briefings) | Board-ready, high visibility |
| P1 — Build second | Group 7 (Shortlists) | Client decision-making |
| P2 — Build third | Group 3 (Scorecards) | Dashboard components |
| P2 — Build third | Group 6 (Pipeline) | Dashboard components |
| P3 — Build fourth | Group 4 (Diagnostics) | Council/Coaching portals |
| P3 — Build fourth | Group 5 (Talent Maps) | Interactive visualizations |
| P4 — Build last | Group 8 (Consultation Guides) | Template-driven, lower complexity |
| P4 — Build last | Group 10 (Branded PDFs) | Wrapper layer over existing templates |

---

## Shared Components Library

> Design team should build these as reusable HTML/CSS components first:

| Component | Used In | Description |
|-----------|---------|-------------|
| `ScoreCard` | Groups 1, 3, 7 | Large number + tier badge + percentile |
| `RadarChart` | Groups 1, 3, 4 | Polygon chart with multi-series overlay |
| `GaugeRow` | Groups 1, 2, 4 | Row of semicircle gauges (v6) |
| `DeviationChart` | Groups 1, 4 | Horizontal bidirectional bar chart (v6) |
| `FunnelChart` | Groups 2, 6 | Stepped funnel visualization |
| `HeatmapGrid` | Group 5 | Color-coded grid cells |
| `ProgressBar` | Groups 3, 6, 9 | Horizontal filled bar |
| `TierBadge` | Groups 1, 3, 7 | Colored pill with tier label |
| `Callout` | Groups 1, 2, 4, 8 | Top-rule box with fuchsia dot |
| `MetricCard` | Groups 2, 6, 9 | Value + label + delta |
| `StatusBadge` | Groups 6, 9 | Colored text status indicator |
| `CTAButton` | Group 9 | Fuchsia button with link |
| `DataTableView` | Groups 3, 5, 6, 7 | Sortable, filterable table |
| `ReportHeader` | All groups | Logo + title + metadata |
| `ReportFooter` | All groups | Logo + confidential + page |

---

*Document prepared by NEXUS for LYC Intelligence design team.*
*Based on: FEATURE_MASTER_LIST_500.md, COMPLETE_REPORT_INVENTORY.md, v6 Report Engine specs.*
*Contact: Kevin Hong for clarification on any section.*
