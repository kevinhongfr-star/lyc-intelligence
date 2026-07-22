# LYC Intelligence — HTML Template → Portal Integration Map

> **Version:** 1.0 | **Date:** 2026-07-23
> **Source:** Feishu Drive folder `B3WJfzpmgl79hadpmpYcjGD1ntg` (Akira)
> **Purpose:** Map all 51 HTML templates to app portals, define in-app display strategy, and establish the rendering pipeline

---

## 1. Template Inventory Summary

| Category | Count | Format |
|----------|-------|--------|
| Business Documents (D01-D50) | 50 HTML | A4 print + Email formats |
| Logo Test | 1 HTML | Brand validation |
| Generator Scripts | 8 Python | Per lifecycle layer |
| Master Spec | 1 MD | BUSINESS_DOCUMENTS_SPECIFICATION.md |
| **Total** | **62 files** | |

---

## 2. Portal Architecture (6 Portals)

| Portal | Primary Users | Purpose |
|--------|--------------|---------|
| **CLIENT** | Client HR / Hiring Managers | View search progress, candidates, reports, interview materials |
| **CANDIDATE** | Active candidates | View status, interview prep, offers, next steps |
| **CONSULTANT** | LYC consultants | Daily working environment — all documents, all actions |
| **ADMIN** | Partners / Operations | Financials, SLA, performance, board reporting |
| **ASSESSMENT** | Consultants + Clients | Diagnostics, assessments, gap analysis, validation |
| **COMMS** | All portals (cross-cutting) | Email templates, digests, alerts, notifications |

---

## 3. Complete Template → Portal Mapping

### L1: BUSINESS DEVELOPMENT (Client Portal + Consultant Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D01 | Client_Proposal | CLIENT | CONSULTANT | Deal room → Proposals tab | PDF |
| D02 | Fee_Schedule | CLIENT | CONSULTANT, ADMIN | Deal room → Financials tab | PDF |
| D03 | Terms_Conditions | CLIENT | CONSULTANT | Deal room → Legal tab | PDF |
| D04 | NDA | CLIENT | CONSULTANT | Deal room → Legal tab | PDF |
| D05 | Track_Record | CLIENT | CONSULTANT | Deal room → About LYC section | PDF |

### L2: PROJECT INITIATION (Client Portal + Consultant Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D06 | Mandate_Brief | CLIENT | CONSULTANT | Search overview → Brief tab | PDF |
| D07 | Job_Description | CLIENT | CONSULTANT, CANDIDATE | Search overview → Role details | PDF + Web |
| D08 | Role_Specification | CONSULTANT | CLIENT | Search overview → Spec tab | PDF |
| D09 | Target_Companies | CONSULTANT | CLIENT | Search overview → Market map | Web + PDF |
| D10 | Market_Approach | CONSULTANT | CLIENT | Search overview → Strategy tab | Web + PDF |

### L3: CANDIDATE PRESENTATION (Client Portal + Consultant Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D11 | CV_Presentation | CLIENT | CONSULTANT, CANDIDATE | Candidate profile → CV view | PDF |
| D12 | Shortlist_Presentation | CLIENT | CONSULTANT | Search overview → Shortlist tab | PDF + Email |
| D13 | Comparison_Matrix | CLIENT | CONSULTANT, ASSESSMENT | Candidate pool → Compare view | Web + PDF |
| D14 | Gap_Analysis | CONSULTANT | CLIENT, ASSESSMENT | Candidate pool → Gap analysis | Web + PDF |

### L4: INTERVIEW PROCESS (All Portals)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D15 | Interview_Prep_Client | CLIENT | CONSULTANT | Interviews → Prep materials | PDF |
| D16 | Interview_Prep_Candidate | CANDIDATE | CONSULTANT | My interviews → Prep guide | PDF + Email |
| D17 | Interview_Schedule | CLIENT | CONSULTANT, CANDIDATE | Interviews → Schedule view | Web + PDF |
| D18 | Interview_Framework | CONSULTANT | CLIENT | Interviews → Framework tab | PDF |
| D19 | Interview_Debrief | CONSULTANT | CLIENT | Interviews → Debrief form | Web + PDF |
| D20 | Feedback_Form | CLIENT | CONSULTANT | Interviews → Feedback form | Web |

### L5: DECISION & OFFER (Client Portal + Consultant Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D21 | Final_Recommendation | CLIENT | CONSULTANT | Decision → Recommendation | PDF |
| D22 | Compensation_Recap | CLIENT | CONSULTANT, ADMIN | Decision → Comp analysis | PDF |
| D23 | Reference_Check | CONSULTANT | CLIENT | Decision → References tab | Web + PDF |
| D24 | Offer_Letter | CLIENT | CONSULTANT, CANDIDATE | Decision → Offer details | PDF |
| D25 | Counter_Offer_Advisory | CONSULTANT | CLIENT | Decision → Counter-offer strategy | PDF |

### L6: MANDATE MANAGEMENT (Consultant Portal + Client Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D26 | Status_Update | CLIENT | CONSULTANT | Search overview → Status dashboard | Web + Email |
| D27 | Meeting_Minutes | CLIENT | CONSULTANT | Activity → Meeting notes | Web + PDF |
| D28 | NextStep_Client | CLIENT | CONSULTANT | Activity → Action items | Web + Email |
| D29 | NextStep_Consultant | CONSULTANT | — | My tasks → Next steps | Web |
| D30 | NextStep_Candidate | CANDIDATE | CONSULTANT | My status → Next steps | Email |

### L7: POST-PLACEMENT (Client Portal + Candidate Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D31 | Placement_Confirmation | CLIENT | CONSULTANT, ADMIN | Placements → Confirmed | PDF |
| D32 | Onboarding_Client | CLIENT | CONSULTANT | Placements → Onboarding guide | PDF |
| D33 | Onboarding_Candidate | CANDIDATE | CONSULTANT | My onboarding → Guide | PDF + Email |
| D34 | Guarantee_Tracking | CLIENT | CONSULTANT, ADMIN | Placements → Guarantee status | Web |
| D35 | Gap_Skills | CANDIDATE | CONSULTANT | My development → Gap report | PDF |

### L8: ASSESSMENT & DEVELOPMENT (Assessment Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D36 | Assessment_Bundle | ASSESSMENT | CONSULTANT, CLIENT | Assessments → Bundle view | PDF |
| D37 | Development_Recommendations | CANDIDATE | CONSULTANT | My development → Recommendations | Web + PDF |
| D38 | Team_Dynamics | ASSESSMENT | CONSULTANT, CLIENT | Team → Dynamics view | Web + PDF |
| D39 | Cohort_Summary | ASSESSMENT | ADMIN | Assessments → Cohort analysis | Web + PDF |
| D40 | Criterion_Validation | ASSESSMENT | CONSULTANT | Assessments → Validation report | PDF |

### L9: INTERNAL OPERATIONS (Admin Portal)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D41 | Mandate_Profitability | ADMIN | CONSULTANT | Financials → Mandate P&L | Web |
| D42 | Consultant_Performance | ADMIN | CONSULTANT | Performance → Individual | Web |
| D43 | Revenue_Report | ADMIN | — | Financials → Revenue | Web |
| D44 | SLA_Compliance | ADMIN | CONSULTANT | Operations → SLA dashboard | Web |
| D45 | Board_Report | ADMIN | — | Reports → Board pack | PDF |

### L10: COMMUNICATION TEMPLATES (Comms — Cross-cutting)

| Doc ID | Template | Primary Portal | Secondary Portal | In-App Display | Export |
|--------|----------|---------------|------------------|----------------|--------|
| D46 | Weekly_Digest | COMMS | ALL | Notifications → Digests | Email |
| D47 | Pipeline_Update | COMMS | CLIENT, CONSULTANT | Notifications → Updates | Email |
| D48 | Assessment_Alert | COMMS | ASSESSMENT | Notifications → Alerts | Email |
| D49 | Market_Briefing | COMMS | CLIENT, CONSULTANT | Notifications → Briefings | Email |
| D50 | QBR_Summary | COMMS | ADMIN | Notifications → Quarterly | Email |

---

## 4. Template Architecture Analysis

### Two Format Families Identified

Based on examining the actual HTML files, templates fall into **two distinct format families**:

#### Family A: A4 Print-Ready Documents (26 templates)
- **Files:** D01-D14, D15, D18-D25, D31-D35, D36-D40, D45
- **Structure:** `@page { size: A4 }`, `.page` containers with `page-break-after`, print-optimized CSS
- **Use:** Direct in-app display via `<iframe>` or PDF rendering, OR print-to-PDF for external delivery
- **Brand system:** Libre Baskerville headlines, DM Sans body, #0F1115/#C108AB/#FFFFFF palette, embedded base64 logo

#### Family B: Email/Notification Templates (5 templates)
- **Files:** D46-D50
- **Structure:** `.email-wrapper` max-width 600px, email-safe inline CSS, no print styles
- **Use:** Email rendering engine, in-app notification center
- **Brand system:** Same palette, same fonts, but adapted for 600px viewport

#### Family C: In-App Interactive Views (19 templates)
- **Files:** D16, D17, D20, D26-D30, D37-D38, D41-D44
- **Structure:** Mix of print and responsive elements, forms, tables with action buttons
- **Use:** Rendered directly in-app as interactive components
- **Note:** These need responsive CSS adaptations for web viewport (not just A4/email)

---

## 5. Integration Strategy

### 5.1 Rendering Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    HTML Template Engine                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Source: Feishu Drive HTML templates                     │
│       ↓                                                  │
│  Template Registry (JSON index)                          │
│       ↓                                                  │
│  Data Injection (JSON → HTML)                            │
│       ↓                                                  │
│  ┌──────────┬───────────┬──────────────┐                │
│  │ In-App   │ PDF       │ Email        │                │
│  │ Display  │ Export    │ Delivery     │                │
│  │ (iframe/ │ (Puppeteer│ (RESEND/     │                │
│  │  React)  │  /wkhtml) │  Graph API)  │                │
│  └──────────┴───────────┴──────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 In-App Display Rules

| Context | Rendering Method | Notes |
|---------|-----------------|-------|
| **Document preview (read-only)** | `<iframe srcdoc>` with sandbox | Fastest, no build step needed |
| **Interactive forms (D17, D20, D27)** | React component extraction | Extract HTML structure into React, add event handlers |
| **PDF export** | Server-side Puppeteer render | A4 templates → PDF. Email templates → not PDF-exportable |
| **Email delivery** | MJML/email-safe renderer | Family B templates → inline CSS, strip external resources |
| **Mobile view** | Responsive wrapper | All templates need mobile viewport adaptation |

### 5.3 Template Registry Structure

Each template needs a registry entry:

```json
{
  "doc_id": "D06",
  "name": "Mandate_Brief",
  "family": "A4_PRINT",
  "lifecycle": "L2",
  "primary_portal": "CLIENT",
  "secondary_portals": ["CONSULTANT"],
  "file": "D06_Mandate_Brief.html",
  "data_model_ref": "BUSINESS_DOCUMENTS_SPECIFICATION.md §D06",
  "supports_pdf": true,
  "supports_email": false,
  "supports_interactive": false,
  "mobile_adaptation": "needed",
  "priority": "P0"
}
```

### 5.4 Python Generator Scripts → Template Engine

The 8 Python scripts in the Drive folder map to template generation layers:

| Script | Lifecycle | Templates Generated |
|--------|-----------|-------------------|
| `biz_L1_L2.py` | L1-L2 | D01-D10 (Business Dev + Initiation) |
| `biz_L2.py` | L2 | D06-D10 (Project Initiation detail) |
| `biz_L4_L5.py` | L4-L5 | D15-D25 (Interview + Decision) |
| `biz_L6_L7.py` | L6-L7 | D26-D35 (Management + Placement) |
| `biz_L8_L9.py` | L8-L9 | D36-D45 (Assessment + Internal) |
| `biz_L10.py` | L10 | D46-D50 (Communication) |
| `biz_missing_1.py` | Various | Gap fillers |
| `biz_missing_2.py` | Various | Gap fillers |
| `biz_missing_3.py` | Various | Gap fillers |
| `lyc_business_components.py` | All | Shared component library |

---

## 6. Portal-Specific Views

### 6.1 Client Portal — Document Access Matrix

| Tab | Documents Available | Display Mode |
|-----|-------------------|--------------|
| **Deal Room** | D01, D02, D03, D04, D05 | Card grid → click to preview PDF |
| **Search Overview** | D06, D07, D09, D10, D12, D26 | Tab-based navigation, inline preview |
| **Candidate Pool** | D11, D13, D14, D21, D22 | List view → click candidate → CV popup |
| **Interviews** | D15, D17, D18, D19, D20 | Timeline view → click session → detail panel |
| **Decision** | D21, D22, D23, D24, D25 | Decision dashboard with document attachments |
| **Placements** | D31, D32, D34 | Placement tracker with document links |
| **Activity** | D27, D28 | Activity feed with inline meeting notes |
| **Notifications** | D46, D47, D49 | Notification center with email-style cards |

### 6.2 Consultant Portal — Full Access

All 50 documents accessible. Primary workflows:

| Workflow | Documents Used | Sequence |
|----------|---------------|----------|
| **New Mandate** | D01→D03→D04→D06→D07→D08→D09→D10 | Left-to-right progression |
| **Candidate Submission** | D11→D12→D13→D14 | Pipeline: create CV → add to shortlist → compare → analyze gaps |
| **Interview Cycle** | D15→D16→D17→D18→D19→D20 | Prep → Schedule → Framework → Conduct → Debrief → Collect feedback |
| **Offer Stage** | D21→D22→D23→D24→D25 | Recommend → Comp analysis → References → Offer → Counter-offer |
| **Weekly Update** | D26→D27→D28→D29 | Status update → Meeting minutes → Client next steps → Internal next steps |
| **Placement** | D31→D32→D33→D34 | Confirm → Onboard client → Onboard candidate → Track guarantee |
| **Assessment** | D36→D37→D38→D39→D40 | Bundle → Dev plan → Team dynamics → Cohort → Validate |
| **Financial Review** | D41→D42→D43→D44→D45 | P&L → Performance → Revenue → SLA → Board pack |

### 6.3 Candidate Portal — Limited View

| Tab | Documents Available | Display Mode |
|-----|-------------------|--------------|
| **My Status** | D30 (NextStep) | Card with timeline |
| **My Interviews** | D16 (Prep Guide), D17 (Schedule) | Inline display |
| **My Onboarding** | D33, D35 | Step-by-step guide |
| **My Development** | D37 (Recommendations) | Interactive list |

### 6.4 Admin Portal — Reporting Only

| Tab | Documents Available | Display Mode |
|-----|-------------------|--------------|
| **Financials** | D41, D42, D43 | Dashboard with drill-down |
| **Operations** | D44 (SLA) | Dashboard |
| **Board Pack** | D45 | Full PDF preview |
| **Assessments** | D39 (Cohort) | Analytics view |

---

## 7. Implementation Priority

### Phase 1: Core Templates (Week 1-2) — P0
- D06 Mandate Brief, D07 Job Description, D11 CV Presentation
- D12 Shortlist Presentation, D26 Status Update
- D15 Interview Prep Client, D16 Interview Prep Candidate
- D19 Interview Debrief
- D21 Final Recommendation, D22 Compensation Recap
- D27 Meeting Minutes, D28 Next Step Client
- **Total: 13 templates**

### Phase 2: Full Business Docs (Week 3-4) — P1
- D01-D05 (Business Development)
- D08-D10 (Initiation extras)
- D13-D14 (Comparison + Gap)
- D17-D18, D20 (Interview supporting)
- D23-D25 (Offer supporting)
- D29-D30 (Next steps)
- **Total: 15 templates**

### Phase 3: Assessment + Post-Placement (Week 5-6) — P2
- D31-D35 (Post-placement)
- D36-D40 (Assessment)
- **Total: 10 templates**

### Phase 4: Internal + Comms (Week 7-8) — P3
- D41-D45 (Internal operations)
- D46-D50 (Email templates)
- **Total: 10 templates**

---

## 8. Technical Requirements

### 8.1 Font Loading
All templates reference:
- `Libre Baskerville` (headlines) — Google Fonts
- `DM Sans` (body) — Google Fonts
- Fallbacks: Noto Serif, Noto Sans

**App integration:** Pre-load fonts in app shell, inject into iframe/document context.

### 8.2 Logo Embedding
Templates use base64-embedded logo (white on dark background).
**App integration:** Replace base64 with app asset URL, or keep embedded for offline/PDF use.

### 8.3 Print vs Screen CSS
A4 templates have `@page` rules and `page-break-after`.
**App integration:** Wrap in responsive container for screen display, keep `@page` rules for print/PDF only.

### 8.4 Data Binding
Templates currently have hardcoded sample data.
**App integration:** Replace hardcoded values with template variables (`{{candidate.name}}`, `{{mandate.title}}`, etc.) compatible with the Python generators.

---

## 9. GitHub Integration

All templates should be committed to:
```
lyc-intelligence/
├── templates/
│   ├── business/
│   │   ├── L1_L2/       (D01-D10)
│   │   ├── L3/          (D11-D14)
│   │   ├── L4/          (D15-D20)
│   │   ├── L5/          (D21-D25)
│   │   ├── L6/          (D26-D30)
│   │   ├── L7/          (D31-D35)
│   │   ├── L8/          (D36-D40)
│   │   ├── L9/          (D41-D45)
│   │   └── L10/         (D46-D50)
│   ├── generators/      (Python scripts)
│   └── components/      (Shared HTML components)
```

---

## 10. Action Items

1. **Download all 62 files** from Feishu Drive to local workspace
2. **Create template registry** (JSON) mapping each template to portal/data/priority
3. **Commit templates to GitHub** in structured directory
4. **Build template rendering service** — iframe for in-app, Puppeteer for PDF, RESEND for email
5. **Replace hardcoded data** with template variables in all 50 HTML files
6. **Create React wrappers** for interactive templates (D17, D20, D27)
7. **Implement mobile-responsive** CSS adaptations for all templates
8. **Wire Python generators** to template variables for automated document generation
