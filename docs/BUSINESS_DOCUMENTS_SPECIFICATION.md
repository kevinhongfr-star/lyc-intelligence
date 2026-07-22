# LYC Intelligence — Business Documents Specification

> **Version:** 1.0 | **Date:** 2026-07-22
> **Audience:** Design Team (HTML/CSS template builders), Engineering, Consulting Team
> **Purpose:** Complete specification for ALL business documents generated or used across LYC Intelligence platform — covering the full executive search engagement lifecycle
> **Status:** Draft for review
> **Companion to:** REPORT_DESIGN_SPECIFICATION.md (platform-generated reports & dashboards)

---

## Document Scope

This spec covers **operational business documents** — the structured deliverables that consultants produce and send to clients, candidates, and internal stakeholders throughout the engagement lifecycle.

**NOT covered here** (see REPORT_DESIGN_SPECIFICATION.md):
- Dashboard UI components
- Assessment score visualizations (LENS, DRIVE, etc.)
- Platform-generated analytics & KPI reports
- Internal admin reporting dashboards

**Total business document types specified: 45**
**Unique HTML/PDF templates needed: ~28** (some share base templates)

---

## How to Use This Document

Documents are organized into **10 lifecycle phases (L1–L10)**, each containing document types with:
- **Purpose** — why this document exists
- **Data Model** — required fields and JSON schema
- **Layout Structure** — section-by-section hierarchy
- **Brand Application** — LYC branding rules for this type
- **Template** — base HTML/PDF template reference
- **Portal Distribution** — where this document is generated and consumed
- **Priority** — P0 (critical) → P3 (nice-to-have)

---

## Design System Foundation

> All business documents share the foundation defined in REPORT_DESIGN_SPECIFICATION.md § Design System Foundation. This section adds document-specific conventions.

### Document Paper Sizes

| Document Type | Default Format | Notes |
|---|---|---|
| Proposals, Contracts, Formal Letters | A4 Portrait | 210mm × 297mm |
| Presentations, Slide Decks | 16:9 Landscape | For screen projection |
| Email Templates | 600px fixed width | Email-safe single column |
| Quick Recaps / Memos | A4 Portrait | 1-2 pages max |
| Interview Guides | A4 Portrait | Printable, fillable |

### Document Status Watermarks

| Status | Watermark | Color |
|---|---|---|
| DRAFT | Diagonal "DRAFT" across page | Grey #9CA3AF, 20% opacity |
| CONFIDENTIAL | Top-right badge | Fuchsia #C108AB |
| FINAL | No watermark | — |
| DRAFT — FOR DISCUSSION | Header banner | Fuchsia #C108AB |

### Document Header/Footer (Standard)

```
┌─────────────────────────────────────────────┐
│  [LYC Logo]          [Document Title]  [Date]│  ← Header: Logo 30px + Title 11pt Bold
├─────────────────────────────────────────────┤
│                                             │
│  [Document Body]                            │
│                                             │
├─────────────────────────────────────────────┤
│  [Confidential]          [Page X of Y]      │  ← Footer: 8pt grey
└─────────────────────────────────────────────┘
```

### Document Sections Convention

Every formal document follows this structural pattern:

```
1. Cover / Title Area
   - Document title, subtitle, date, reference number
   - LYC logo + optional client co-branding

2. Context / Background
   - Why this document exists, scope, relevant mandate

3. Body Content
   - Core information, analysis, recommendations

4. Action Items / Next Steps (if applicable)
   - Clear, numbered action items with owners and dates

5. Appendix (if needed)
   - Supporting data, methodology notes, disclaimers
```

---

## L1: BUSINESS DEVELOPMENT DOCUMENTS

> Documents used to win new mandates and onboard clients.

---

### D01: Client Proposal / Engagement Letter

**Template:** `tpl_proposal_v1`
**Priority:** P0 — Highest frequency, highest impact
**Format:** PDF (A4 Portrait, 8-15 pages)

**Purpose:** Formal proposal sent to prospective clients outlining scope, methodology, timeline, fees, and team for a specific search mandate or retainer engagement.

**Data Model:**
```json
{
  "proposal_meta": {
    "proposal_id": "PROP-2026-0042",
    "version": "1.0",
    "date": "ISO date",
    "valid_until": "ISO date",
    "status": "draft|sent|accepted|declined|expired",
    "consultant_name": "string",
    "consultant_title": "string"
  },
  "client": {
    "company_name": "string",
    "contact_name": "string",
    "contact_title": "string",
    "contact_email": "string",
    "industry": "string",
    "relationship_stage": "new|existing|returning"
  },
  "mandate": {
    "role_title": "string",
    "department": "string",
    "reporting_to": "string",
    "location": "string",
    "scope": "national|regional|global",
    "compensation_range": "string",
    "expected_start": "ISO date"
  },
  "scope_of_work": {
    "search_type": "retained|contingent|solo",
    "methodology_summary": "string",
    "deliverables": ["string"],
    "timeline_weeks": 12,
    "guarantee_period_months": 6
  },
  "team": [
    {
      "name": "string",
      "role": "Lead Partner|Research Director|Associate",
      "bio_short": "string"
    }
  ],
  "fees": {
    "retainer_amount": "number",
    "retainer_timing": "string",
    "success_fee_amount": "number",
    "success_fee_pct": "number",
    "expense_policy": "string",
    "payment_terms": "string",
    "total_estimated": "number"
  },
  "terms_summary": "string",
  "acceptance": {
    "signature_lines": ["string"],
    "acceptance_deadline": "ISO date"
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - LYC logo (top-left, white on dark)
  - "PROPOSAL FOR [ROLE TITLE]" (24pt Libre Baskerville Bold)
  - "Prepared for [Client Company]" (11pt DM Sans)
  - Date, Proposal Reference Number
  - Subtle fuchsia accent line

Page 2: LETTER OF INTRODUCTION
  - Personal greeting from lead consultant
  - 2-3 paragraphs: understanding of need, why LYC, key differentiator
  - Consultant signature block

Page 3-4: UNDERSTANDING OF THE ROLE
  - Role context and challenges
  - Key success factors
  - Market landscape summary
  - [Optional: Market size data, talent pool heatmap mini-chart]

Page 5-6: METHODOLOGY & APPROACH
  - Phase 1: Market Mapping & Targeting (Week 1-2)
  - Phase 2: Outreach & Assessment (Week 3-6)
  - Phase 3: Shortlist & Interview (Week 7-10)
  - Phase 4: Selection & Closing (Week 11-12)
  - Timeline visual (Gantt-style, fuchsia/blue palette)

Page 7: TEAM
  - Lead Partner photo + 3-line bio
  - Supporting team members
  - Advisory network (Council members if relevant)

Page 8-9: INVESTMENT
  - Fee structure table
  - Payment schedule
  - What's included / what's not
  - [Optional: comparison with market rates]

Page 10: TERMS & CONDITIONS SUMMARY
  - Key terms in plain language
  - Full T&C reference
  - Guarantee policy
  - Confidentiality commitments

Page 11: ACCEPTANCE
  - Signature lines (client + LYC)
  - Acceptance deadline
  - Next steps upon acceptance

BACK COVER:
  - LYC contact information
  - "Confidential" notice
```

**Components Needed:**
- `ComponentTimeline` — vertical/horizontal phase timeline
- `ComponentTeamCard` — photo + name + title + bio
- `ComponentFeeTable` — structured fee breakdown
- `ComponentSignatureBlock` — dual signature with dates
- `ComponentGanttChart` — simplified project timeline

**Portal:** Generated in Internal Portal → Sent to Client Portal ( Documents section) + Email

---

### D02: Fee Schedule / Pricing Proposal

**Template:** `tpl_fee_schedule_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 2-4 pages) or standalone email attachment

**Purpose:** Detailed fee breakdown, often appended to proposal or sent separately for existing clients considering additional mandates.

**Data Model:**
```json
{
  "fee_schedule_meta": {
    "client_name": "string",
    "date": "ISO date",
    "consultant_name": "string",
    "currency": "CNY|USD|HKD"
  },
  "mandates": [
    {
      "role_title": "string",
      "search_type": "retained|contingent|solo",
      "fee_structure": {
        "retainer": "number",
        "retainer_pct_of_total": "number",
        "success_fee": "number",
        "success_fee_pct": "number",
        "total_estimated": "number"
      },
      "payment_schedule": [
        {"milestone": "Retainer", "amount": "number", "due": "string"},
        {"milestone": "Shortlist Delivery", "amount": "number", "due": "string"},
        {"milestone": "Successful Placement", "amount": "number", "due": "string"}
      ]
    }
  ],
  "volume_discount": {
    "applicable": true,
    "threshold": "number of mandates",
    "discount_pct": "number"
  },
  "expense_policy": "string",
  "payment_terms": "string",
  "notes": "string"
}
```

**Layout Structure:**
```
Page 1: FEE SCHEDULE
  - Header with client name, date
  - Mandate table: role, type, retainer, success fee, total
  - Payment schedule per mandate
  - Volume discount terms (if applicable)
  - Expense policy summary
  - Payment terms

Page 2: NOTES & CONDITIONS (if needed)
  - Currency, validity period
  - Special arrangements
  - Reference to full T&C
```

**Components Needed:**
- `ComponentFeeTable` (shared with D01)
- `ComponentPaymentSchedule` — milestone-based payment timeline

**Portal:** Internal Portal → Client Portal Documents + Email

---

### D03: Terms & Conditions / Master Service Agreement

**Template:** `tpl_terms_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 6-12 pages)

**Purpose:** Standard legal terms governing the engagement. Referenced by proposals but also standalone.

**Data Model:**
```json
{
  "terms_meta": {
    "document_id": "string",
    "version": "string",
    "effective_date": "ISO date",
    "client_name": "string",
    "engagement_type": "single_mandate|retainer|msa"
  },
  "sections": [
    {
      "number": "1",
      "title": "Definitions",
      "content": "string"
    },
    {
      "number": "2",
      "title": "Scope of Services",
      "content": "string"
    }
    // ... standard sections
  ],
  "custom_clauses": [
    {
      "section_number": "string",
      "clause_text": "string",
      "reason": "string"
    }
  ]
}
```

**Layout Structure:**
```
Standard legal document format:
  - LYC letterhead
  - Document title + version + date
  - Numbered sections with clear hierarchy
  - Signature page at end
  - Schedule/Appendix for mandate-specific terms
```

**Standard Sections:**
1. Definitions
2. Scope of Services
3. Fees and Payment Terms
4. Exclusivity / Non-Exclusivity
5. Confidentiality
6. Intellectual Property
7. Limitation of Liability
8. Indemnification
9. Guarantee / Replacement Policy
10. Termination
11. Governing Law
12. Dispute Resolution
13. General Provisions
- Schedule A: Mandate-Specific Terms
- Schedule B: Fee Schedule

**Components Needed:**
- `ComponentLegalSection` — numbered section with sub-clauses
- `ComponentSchedule` — appendix/schedule layout
- `ComponentSignaturePage` — multi-party signature block

**Portal:** Internal Portal → Client Portal Documents

---

### D04: NDA / Confidentiality Agreement

**Template:** `tpl_nda_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 3-5 pages)

**Purpose:** Mutual or one-way confidentiality agreement, often prerequisite to sharing sensitive client information or candidate details.

**Data Model:**
```json
{
  "nda_meta": {
    "document_id": "string",
    "type": "mutual|one_way_client|one_way_candidate",
    "date": "ISO date",
    "parties": [
      {"name": "string", "entity_type": "company|individual", "address": "string"}
    ],
    "purpose": "string",
    "duration_months": 24,
    "jurisdiction": "string"
  }
}
```

**Layout Structure:**
```
Standard legal NDA format:
  - LYC letterhead
  - Title: "CONFIDENTIALITY AGREEMENT"
  - Parties identification
  - Recitals (WHEREAS clauses)
  - Numbered clauses
  - Signature blocks (dual)
  - Date of execution
```

**Portal:** Internal Portal → Client Portal Documents + Email

---

### D05: Track Record / Case Study Presentation

**Template:** `tpl_track_record_v1`
**Priority:** P2
**Format:** PDF (16:9 Landscape, 10-20 slides) or Interactive HTML

**Purpose:** Showcase LYC's relevant placement history, industry expertise, and success stories to prospective clients.

**Data Model:**
```json
{
  "track_record_meta": {
    "title": "string",
    "subtitle": "string",
    "date": "ISO date",
    "client_industry": "string",
    "prepared_by": "string"
  },
  "firm_highlights": {
    "years_operating": 15,
    "total_placements": 500,
    "industries_covered": ["string"],
    "geographic_reach": ["string"],
    "success_rate_pct": 92,
    "avg_time_to_fill_weeks": 10,
    "retention_rate_12m_pct": 95
  },
  "case_studies": [
    {
      "title": "string",
      "industry": "string",
      "role_level": "C-suite|VP|Director",
      "challenge": "string",
      "approach": "string",
      "result": "string",
      "timeline_weeks": 12,
      "anonymized": true
    }
  ],
  "testimonials": [
    {
      "quote": "string",
      "author_name": "string",
      "author_title": "string",
      "company": "string"
    }
  ]
}
```

**Layout Structure:**
```
Slide 1: TITLE SLIDE
  - "LYC Partners — Track Record"
  - Industry/Function focus
  - Date

Slide 2: FIRM OVERVIEW
  - Key statistics in large-number callout cards
  - Geographic presence map

Slides 3-8: CASE STUDIES (1-2 per slide)
  - Challenge → Approach → Result format
  - Timeline bar
  - Key metric highlight

Slides 9-10: TESTIMONIALS
  - Large quote + attribution

Slide 11: TEAM CAPABILITIES
  - Consultant profiles
  - Council network strength

Slide 12: WHY LYC
  - Differentiators summary
  - Contact information
```

**Components Needed:**
- `ComponentStatCard` — large number + label + trend
- `ComponentCaseStudy` — challenge/approach/result layout
- `ComponentTestimonial` — large quote + attribution
- `ComponentTimelineBar` — horizontal timeline

**Portal:** Internal Portal → Client Portal Documents + Email

---

## L2: MANDATE KICK-OFF DOCUMENTS

> Documents produced at the start of each search engagement.

---

### D06: Mandate Kick-Off Brief

**Template:** `tpl_mandate_brief_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 4-8 pages) + Email summary version

**Purpose:** Internal and client-facing document that formalizes the search parameters, role requirements, market strategy, and success criteria for a new mandate.

**Data Model:**
```json
{
  "mandate_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "client_company": "string",
    "department": "string",
    "reporting_to": "string",
    "location": "string",
    "priority": "P0|P1|P2",
    "kick_off_date": "ISO date",
    "target_shortlist_date": "ISO date",
    "target_close_date": "ISO date",
    "lead_consultant": "string",
    "research_lead": "string"
  },
  "role_context": {
    "business_challenge": "string",
    "why_this_role_now": "string",
    "predecessor_situation": "new|promotion|departure|restructure",
    "team_size": "number",
    "budget_responsibility": "string",
    "key_stakeholders": ["string"]
  },
  "competency_model": {
    "must_have": [
      {"competency": "string", "evidence_required": "string"}
    ],
    "nice_to_have": [
      {"competency": "string", "note": "string"}
    ],
    "deal_breakers": ["string"]
  },
  "market_strategy": {
    "target_companies": ["string"],
    "target_industries": ["string"],
    "geographic_scope": "string",
    "compensation_benchmark": {
      "base_range": "string",
      "total_comp_range": "string",
      "market_percentile": "string"
    },
    "talent_pool_estimate": "number",
    "search_approach": "mapped|directed|networked"
  },
  "process_plan": {
    "interview_rounds": "number",
    "interview_format": "in-person|video|hybrid",
    "decision_makers": ["string"],
    "assessment_requirements": ["LEAP|DRIVE|SHIFT|QUEST"],
    "timeline_milestones": [
      {"phase": "string", "target_date": "ISO date"}
    ]
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - "MANDATE BRIEF: [Role Title]"
  - Client name (or "Confidential" if sensitive)
  - Date, mandate reference

Page 2: ROLE CONTEXT
  - Business challenge narrative
  - Why this role matters now
  - Predecessor context
  - Team and reporting structure

Page 3: COMPETENCY MODEL
  - Must-have competencies (table: competency | evidence)
  - Nice-to-have competencies
  - Deal-breakers (highlighted in danger color)

Page 4: MARKET STRATEGY
  - Target companies (logos if available, otherwise list)
  - Target industries
  - Compensation benchmark summary
  - Talent pool estimate

Page 5: PROCESS & TIMELINE
  - Phase timeline (visual Gantt)
  - Interview process description
  - Assessment requirements
  - Decision-making process

Page 6: SUCCESS METRICS
  - Time-to-fill target
  - Shortlist size target
  - Key milestones with dates

Appendix: Detailed target company list, org chart of client team
```

**Components Needed:**
- `ComponentCompetencyTable` — competency + evidence table
- `ComponentMilestoneTimeline` — phase-based timeline
- `ComponentTargetCompanyGrid` — company cards/logos
- `ComponentMetricBadge` — key number + label

**Portal:** Internal Portal → Client Portal (shared sections) → Council Portal

---

### D07: Job Description

**Template:** `tpl_job_description_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 2-3 pages) + Web page version (Candidate Portal)

**Purpose:** Formal job description for external distribution — job boards, candidate outreach, client approval.

**Data Model:**
```json
{
  "jd_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "client_company": "string",
    "location": "string",
    "employment_type": "full-time|part-time|contract",
    "date_published": "ISO date",
    "language": "zh-CN|en",
    "version": "string"
  },
  "about_company": {
    "description": "string",
    "industry": "string",
    "size": "string",
    "culture_highlights": ["string"],
    "website": "string"
  },
  "role_summary": "string",
  "key_responsibilities": ["string"],
  "requirements": {
    "must_have": ["string"],
    "preferred": ["string"]
  },
  "compensation": {
    "range_display": "string or hidden",
    "benefits_summary": ["string"]
  },
  "application_process": {
    "steps": ["string"],
    "contact": "string",
    "deadline": "ISO date"
  },
  "branding": {
    "show_client_name": true,
    "show_lyc_branding": true,
    "co_brand": false
  }
}
```

**Layout Structure:**
```
Page 1: JOB DESCRIPTION
  - Header: Role title (large), Location, Type
  - Company description (2-3 sentences)
  - Role summary paragraph

  - KEY RESPONSIBILITIES (bullet list, 6-10 items)
  - REQUIREMENTS
    - Must Have (bullet list)
    - Preferred (bullet list)
  - WHAT WE OFFER
    - Compensation range (if disclosed)
    - Benefits highlights

  - HOW TO APPLY
    - Application steps
    - Contact information
    - Deadline (if any)

Footer: LYC branding, confidentiality notice
```

**Components Needed:**
- `ComponentJobHeader` — title + location + type badge
- `ComponentBulletSection` — header + bullet list
- `ComponentApplyBlock` — steps + CTA

**Portal:** Internal Portal → Client Portal (approval) → Candidate Portal (public) → External job boards

---

### D08: Role Specification / Competency Model

**Template:** `tpl_role_spec_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 4-6 pages) — internal/consultant use

**Purpose:** Detailed competency framework for the role, used to guide sourcing, assessment, and evaluation decisions.

**Data Model:**
```json
{
  "role_spec_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "date": "ISO date",
    "version": "string"
  },
  "competency_framework": {
    "dimensions": [
      {
        "name": "string",
        "weight_pct": "number",
        "indicators": [
          {
            "level": "basic|proficient|advanced|expert",
            "description": "string"
          }
        ],
        "assessment_instrument": "string|null",
        "interview_focus_area": "string"
      }
    ]
  },
  "ideal_candidate_profile": {
    "experience_summary": "string",
    "industry_background": ["string"],
    "functional_expertise": ["string"],
    "leadership_style": "string",
    "cultural_fit_notes": "string",
    "potential_red_flags": ["string"]
  },
  "scoring_rubric": {
    "minimum_threshold": "number (0-100)",
    "shortlist_threshold": "number (0-100)",
    "weighting_notes": "string"
  }
}
```

**Layout Structure:**
```
Page 1: ROLE SPECIFICATION
  - Role title, mandate reference, date
  - Brief role context

Page 2-3: COMPETENCY FRAMEWORK
  - Radar chart showing dimension weights
  - Table: dimension | weight | key indicators | assessment method
  - Proficiency level definitions per dimension

Page 4: IDEAL CANDIDATE PROFILE
  - Narrative description of ideal candidate
  - Experience, background, leadership style
  - Cultural fit considerations

Page 5: EVALUATION RUBRIC
  - Scoring thresholds (minimum, shortlist, hire)
  - Weight distribution visual
  - Decision matrix template
```

**Components Needed:**
- `ComponentRadarChart` — competency dimension radar (reuse from G1)
- `ComponentProficiencyScale` — level indicators
- `ComponentScoringRubric` — threshold visualization

**Portal:** Internal Portal (consultant workspace) → Council Portal (advisors)

---

### D09: Target Company List

**Template:** `tpl_target_company_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 3-8 pages) + Interactive dashboard view

**Purpose:** Curated list of target companies for candidate sourcing, with rationale and organizational intelligence.

**Data Model:**
```json
{
  "target_list_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "date": "ISO date",
    "total_targets": "number",
    "tier_breakdown": {"tier1": "number", "tier2": "number", "tier3": "number"}
  },
  "companies": [
    {
      "name": "string",
      "tier": 1|2|3,
      "industry": "string",
      "headquarters": "string",
      "relevance_rationale": "string",
      "key_divisions": ["string"],
      "estimated_talent_pool": "number",
      "known_connections": ["string"],
      "org_chart_available": true,
      "notes": "string"
    }
  ],
  "market_coverage": {
    "geographic_coverage": "string",
    "industry_coverage": "string",
    "gaps": ["string"]
  }
}
```

**Layout Structure:**
```
Page 1: TARGET COMPANY LIST
  - Summary stats: total targets, tier breakdown
  - Market coverage summary

Page 2+: COMPANY ENTRIES
  - Tier 1 (priority): Full cards with logo, rationale, key divisions
  - Tier 2 (secondary): Compact entries
  - Tier 3 (exploratory): Simple list

Appendix: Market heatmap, geographic coverage map
```

**Components Needed:**
- `ComponentCompanyCard` — tier-coded company card
- `ComponentCoverageMap` — geographic/industry coverage visual

**Portal:** Internal Portal → Client Portal (shared)

---

### D10: Market Approach Plan

**Template:** `tpl_market_approach_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 3-5 pages)

**Purpose:** Strategic document outlining the search approach — market sizing, candidate pools, outreach strategy, and timeline.

**Data Model:**
```json
{
  "approach_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "date": "ISO date"
  },
  "market_analysis": {
    "total_addressable_talent": "number",
    "active_candidates_estimate": "number",
    "passive_candidates_estimate": "number",
    "supply_demand_ratio": "string",
    "market_competitiveness": "low|moderate|high|extreme"
  },
  "sourcing_strategy": {
    "primary_channels": ["string"],
    "outreach_approach": "string",
    "messaging_themes": ["string"],
    "differentiators_for_candidates": ["string"]
  },
  "risk_assessment": {
    "key_risks": [{"risk": "string", "mitigation": "string"}],
    "timeline_risk": "low|moderate|high",
    "compensation_risk": "low|moderate|high"
  },
  "recommended_timeline": [
    {"phase": "string", "duration_weeks": "number", "key_activities": ["string"]}
  ]
}
```

**Layout Structure:**
```
Page 1: MARKET APPROACH PLAN
  - Mandate context summary

Page 2: MARKET ANALYSIS
  - Talent pool funnel visualization
  - Supply/demand analysis
  - Market competitiveness gauge

Page 3: SOURCING STRATEGY
  - Channel strategy matrix
  - Key messaging themes
  - Candidate value proposition

Page 4: RISK & TIMELINE
  - Risk matrix (likelihood × impact)
  - Recommended timeline (Gantt)
```

**Components Needed:**
- `ComponentFunnelChart` — talent pool funnel
- `ComponentRiskMatrix` — 2×2 risk grid
- `ComponentGanttChart` (reuse from D01)

**Portal:** Internal Portal → Client Portal (shared)

---

## L3: CANDIDATE PRESENTATION DOCUMENTS

> Documents used to present candidates to clients.

---

### D11: CV / Candidate Presentation

**Template:** `tpl_cv_presentation_v3.3` (EXISTING — see LYC_CV_Format_Spec_v3.0.md)
**Priority:** P0 — Already spec'd and built
**Format:** PDF (A4 Portrait, 3-6 pages per candidate)

**Purpose:** Formal candidate presentation document in LYC consultant voice, for client distribution.

**Status:** ✅ Fully spec'd in `LYC_CV_Format_Spec_v3.0.md`, implemented in `generate_wangyu_cv_v23.py`

**Portal:** Internal Portal → Client Portal Documents → Email

---

### D12: Shortlist Presentation

**Template:** `tpl_shortlist_presentation_v1`
**Priority:** P0
**Format:** PDF (16:9 Landscape, 15-25 slides) + Email summary version

**Purpose:** Multi-candidate presentation for client review, showing the shortlisted candidates with comparative analysis and LYC's recommendation.

**Data Model:**
```json
{
  "shortlist_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "client_name": "string",
    "date": "ISO date",
    "consultant_name": "string",
    "total_candidates": "number",
    "recommendation_order": [1, 2, 3]
  },
  "market_context": {
    "total_sourced": "number",
    "total_assessed": "number",
    "total_interviewed": "number",
    "shortlist_conversion_rate": "string",
    "search_duration_weeks": "number"
  },
  "candidates": [
    {
      "rank": 1,
      "candidate_name": "string",
      "current_title": "string",
      "current_company": "string",
      "match_score": 87,
      "match_tier": "Exceptional|Strong|Good",
      "key_strengths": ["string"],
      "potential_concerns": ["string"],
      "experience_summary": "string",
      "assessment_highlights": {
        "instrument": "string",
        "key_finding": "string"
      },
      "compensation_expectation": "string",
      "availability": "string",
      "lyc_recommendation": "string",
      "interview_focus_areas": ["string"]
    }
  ],
  "comparison_summary": {
    "matrix_data": {
      "dimensions": ["string"],
      "scores": [[0-100]]
    },
    "overall_recommendation": "string",
    "suggested_interview_sequence": ["string"]
  }
}
```

**Layout Structure:**
```
Slide 1: TITLE SLIDE
  - "SHORTLIST PRESENTATION: [Role Title]"
  - Client name, date, confidentiality notice

Slide 2: SEARCH SUMMARY
  - Funnel: Sourced → Assessed → Interviewed → Shortlisted
  - Search duration, market context
  - Key findings summary

Slide 3: CANDIDATE OVERVIEW
  - Side-by-side snapshot of all shortlisted candidates
  - Match scores as bar chart
  - Quick comparison table

Slides 4-6: CANDIDATE 1 (Recommended)
  - Name, current role, photo placeholder
  - Key strengths (3-4 bullets)
  - Experience highlight (timeline)
  - Assessment highlights
  - Why recommended
  - Suggested interview focus areas

Slides 7-9: CANDIDATE 2
  - Same structure

Slides 10-12: CANDIDATE 3
  - Same structure

Slide 13: COMPARISON MATRIX
  - Heat map: candidates × competency dimensions
  - Score visualization

Slide 14: RECOMMENDATION & NEXT STEPS
  - LYC's recommendation narrative
  - Suggested interview sequence
  - Proposed timeline
  - Decision points for client

Slide 15: APPENDIX
  - Detailed assessment scores (if applicable)
  - Compensation comparison
```

**Components Needed:**
- `ComponentSearchFunnel` — sourced → shortlisted funnel
- `ComponentCandidateSlide` — single candidate deep-dive layout
- `ComponentComparisonHeatmap` — candidates × dimensions matrix
- `ComponentMatchScoreBar` — horizontal bar with score
- `ComponentRecommendationBox` — narrative recommendation

**Portal:** Internal Portal → Client Portal Documents → Email attachment

---

### D13: Candidate Comparison Matrix (Formal Document)

**Template:** `tpl_comparison_matrix_v1`
**Priority:** P1
**Format:** PDF (A4 Landscape, 2-4 pages)

**Purpose:** Detailed side-by-side comparison of 2-5 candidates across competency dimensions. Often accompanies shortlist presentation.

**Data Model:**
```json
{
  "comparison_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "date": "ISO date",
    "dimensions": ["string"]
  },
  "candidates": [
    {
      "name": "string",
      "scores": {"dimension_name": "number (0-100)"},
      "overall_score": "number",
      "key_notes": "string"
    }
  ],
  "lyc_analysis": "string",
  "recommendation": "string"
}
```

**Layout Structure:**
```
Page 1 (Landscape):
  - Header: Role title, date
  - Comparison matrix table (candidates as columns, dimensions as rows)
  - Color-coded cells (green/yellow/red zones)
  - Overall scores row

Page 2:
  - LYC analysis narrative
  - Dimension-by-dimension commentary
  - Recommendation

Appendix: Assessment data details
```

**Components Needed:**
- `ComponentComparisonTable` — matrix with color-coded cells
- `ComponentAnalysisBlock` — narrative analysis section

**Portal:** Internal Portal → Client Portal Documents

---

### D14: Skills & Assessment Gap Analysis

**Template:** `tpl_gap_analysis_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 4-8 pages) + Dashboard view

**Purpose:** Analysis of the skills and competency gaps within a candidate pool (shortlist or broader), based on assessment and diagnostic data. Identifies collective strengths and gaps relative to role requirements.

**Data Model:**
```json
{
  "gap_analysis_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "pool_name": "Shortlist|Finalists|All Candidates",
    "date": "ISO date",
    "candidates_assessed": "number"
  },
  "role_requirements": {
    "dimensions": [
      {"name": "string", "required_level": "number (0-100)", "weight": "number"}
    ]
  },
  "pool_assessment": {
    "dimensions": [
      {
        "name": "string",
        "pool_average": "number",
        "pool_range": {"min": "number", "max": "number"},
        "gap_vs_requirement": "number",
        "gap_status": "exceeds|meets|partial|gap"
      }
    ]
  },
  "candidate_breakdown": [
    {
      "name": "string",
      "dimension_scores": {"dimension": "number"},
      "overall_match_pct": "number",
      "strongest_dimensions": ["string"],
      "weakest_dimensions": ["string"]
    }
  ],
  "insights": {
    "collective_strengths": ["string"],
    "collective_gaps": ["string"],
    "recommended_actions": ["string"],
    "development_opportunities": ["string"]
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - "Skills & Assessment Gap Analysis"
  - Role title, pool description, date

Page 2: EXECUTIVE SUMMARY
  - Pool overview (candidates assessed, instruments used)
  - Key findings (3-4 bullets)
  - Overall gap status indicator (gauge)

Page 3: DIMENSION ANALYSIS
  - Radar chart: pool average vs. role requirements
  - Dimension-by-dimension gap analysis table
  - Color-coded gap status

Page 4-5: CANDIDATE BREAKDOWN
  - Heat map: candidates × dimensions
  - Per-candidate summary cards
  - Strongest/weakest dimensions per candidate

Page 6: INSIGHTS & RECOMMENDATIONS
  - Collective strengths summary
  - Collective gaps summary
  - Recommended actions (e.g., "Pool is strong on X, consider development for Y")
  - Development opportunities

Appendix: Detailed assessment scores, instrument descriptions
```

**Components Needed:**
- `ComponentGapRadarChart` — pool vs. requirements overlay
- `ComponentGapTable` — dimension gap analysis with status colors
- `ComponentCandidateHeatmap` — candidates × dimensions color matrix
- `ComponentInsightCard` — strength/gap/recommendation cards

**Portal:** Internal Portal → Client Portal → Council Portal

---

## L4: INTERVIEW PROCESS DOCUMENTS

> Documents supporting the interview stage.

---

### D15: Interview Preparation Guide — Client

**Template:** `tpl_interview_prep_client_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 6-10 pages) + Email summary

**Purpose:** Prepare client interviewers with candidate backgrounds, suggested questions, evaluation criteria, and interview logistics.

**Data Model:**
```json
{
  "prep_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "interview_round": "number",
    "date_prepared": "ISO date",
    "consultant_name": "string"
  },
  "interview_logistics": {
    "date": "ISO datetime",
    "duration_minutes": 60,
    "format": "in-person|video|phone",
    "location": "string",
    "video_link": "string|null",
    "interviewers": [
      {"name": "string", "title": "string", "focus_area": "string"}
    ],
    "candidate_name": "string",
    "candidate_current_role": "string"
  },
  "candidate_brief": {
    "professional_summary": "string",
    "key_strengths": ["string"],
    "areas_to_explore": ["string"],
    "assessment_highlights": "string",
    "potential_concerns": ["string"],
    "motivation_notes": "string"
  },
  "suggested_questions": [
    {
      "category": "Technical|Leadership|Cultural|Behavioral|Situational",
      "question": "string",
      "purpose": "string",
      "look_for": "string",
      "red_flag": "string"
    }
  ],
  "evaluation_criteria": [
    {"dimension": "string", "weight": "number", "rating_scale": "1-5"}
  ],
  "interview_tips": {
    "do": ["string"],
    "dont": ["string"],
    "lyc_methodology_notes": "string"
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - "INTERVIEW PREPARATION GUIDE"
  - Candidate name, role title, interview date
  - "Prepared by LYC Partners"

Page 2: INTERVIEW LOGISTICS
  - Date, time, duration, format, location
  - Interviewer panel with focus areas
  - Agenda/timeline for the interview

Page 3-4: CANDIDATE BRIEF
  - Professional summary (consultant's voice)
  - Key strengths
  - Areas to explore / probe
  - Assessment highlights
  - Motivation and career context

Page 5-7: SUGGESTED QUESTIONS
  - Categorized question list
  - Each question with: purpose, what to look for, red flags
  - Priority ranking

Page 8: EVALUATION CRITERIA
  - Scoring dimensions with weights
  - Rating scale definitions
  - Scorecard template (fillable)

Page 9: INTERVIEW BEST PRACTICES
  - DO's and DON'Ts
  - Legal considerations
  - LYC methodology notes

Page 10: NEXT STEPS
  - Post-interview debrief process
  - Timeline for decision
  - Consultant contact information
```

**Components Needed:**
- `ComponentInterviewLogistics` — logistics summary card
- `ComponentQuestionCard` — question + purpose + look-for + red-flag
- `ComponentEvaluationScorecard` — scoring matrix template
- `ComponentTipsBox` — DO/DON'T two-column layout

**Portal:** Internal Portal → Client Portal (restricted to interviewers)

---

### D16: Interview Preparation Guide — Candidate

**Template:** `tpl_interview_prep_candidate_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 4-6 pages) + Email

**Purpose:** Prepare candidates for upcoming client interviews — company background, interviewer profiles, suggested talking points, logistics.

**Data Model:**
```json
{
  "prep_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "role_title": "string",
    "interview_round": "number",
    "date_prepared": "ISO date"
  },
  "interview_logistics": {
    "date": "ISO datetime",
    "duration_minutes": 60,
    "format": "in-person|video|phone",
    "location": "string",
    "video_link": "string|null",
    "dress_code": "string",
    "what_to_bring": ["string"]
  },
  "company_background": {
    "company_name": "string",
    "industry": "string",
    "size": "string",
    "culture": "string",
    "recent_news": ["string"],
    "key_products_services": ["string"]
  },
  "interviewer_profiles": [
    {
      "name": "string",
      "title": "string",
      "background": "string",
      "interview_style": "string",
      "likely_focus": "string"
    }
  ],
  "preparation_advice": {
    "key_talking_points": ["string"],
    "topics_to_emphasize": ["string"],
    "topics_to_avoid": ["string"],
    "questions_to_prepare_for": ["string"],
    "questions_to_ask": ["string"]
  },
  "consultant_tips": "string"
}
```

**Layout Structure:**
```
Page 1: COVER
  - "INTERVIEW PREPARATION"
  - Candidate name, role, date
  - "Prepared by your LYC consultant"

Page 2: INTERVIEW LOGISTICS
  - Date, time, format, location
  - Dress code, what to bring
  - Contact person on the day

Page 3: ABOUT THE COMPANY
  - Company overview
  - Culture and values
  - Recent developments

Page 4: YOUR INTERVIEWERS
  - Name, title, background
  - Likely focus areas
  - Interview style notes

Page 5: PREPARATION GUIDE
  - Key talking points to emphasize
  - Likely questions and how to approach them
  - Smart questions to ask them

Page 6: TIPS FROM YOUR CONSULTANT
  - Personalized advice
  - What the client values most
  - Day-of reminders
```

**Portal:** Internal Portal → Candidate Portal → Email

---

### D17: Interview Schedule / Logistics Document

**Template:** `tpl_interview_schedule_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 1-2 pages) + Calendar invite data

**Purpose:** Concise logistics document for all interview participants — schedule, participants, logistics, contact information.

**Data Model:**
```json
{
  "schedule_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "role_title": "string",
    "interview_date": "ISO date"
  },
  "schedule": [
    {
      "time_start": "HH:MM",
      "time_end": "HH:MM",
      "session_type": "interview|break|panel|assessment",
      "interviewer": "string",
      "interviewer_title": "string",
      "focus_area": "string",
      "location": "string",
      "format": "in-person|video",
      "notes": "string"
    }
  ],
  "contacts": [
    {"name": "string", "role": "string", "phone": "string", "email": "string"}
  ],
  "logistics_notes": "string",
  "map_or_directions": "string|null"
}
```

**Layout Structure:**
```
Page 1: INTERVIEW SCHEDULE
  - Header: Candidate name, date, role
  - Timeline table: time | session | interviewer | location
  - Contact information box
  - Logistics notes (parking, building access, etc.)
  - Map (if applicable)
```

**Portal:** Internal Portal → Client Portal → Candidate Portal → Email (all parties)

---

### D18: Interview Question Framework

**Template:** `tpl_interview_framework_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 4-8 pages) — reusable template

**Purpose:** Structured interview question framework for a role, aligned with competency model. Used across multiple candidates.

**Data Model:**
```json
{
  "framework_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "date": "ISO date",
    "competency_model_ref": "string"
  },
  "question_sets": [
    {
      "competency_dimension": "string",
      "weight": "number",
      "questions": [
        {
          "question": "string",
          "type": "behavioral|situational|technical|leadership",
          "difficulty": "basic|intermediate|advanced",
          "follow_up_prompts": ["string"],
          "ideal_answer_indicators": ["string"],
          "red_flags": ["string"],
          "scoring_guide": "string"
        }
      ]
    }
  ],
  "scoring_template": {
    "scale": {"1": "string", "2": "string", "3": "string", "4": "string", "5": "string"},
    "notes_template": "string"
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - "INTERVIEW QUESTION FRAMEWORK"
  - Role title, mandate reference

Page 2: COMPETENCY MODEL SUMMARY
  - Dimensions and weights (radar chart)
  - How to use this framework

Pages 3+: QUESTION SETS (per dimension)
  - Dimension name and weight
  - Questions with:
    - Type indicator
    - Follow-up prompts
    - Ideal answer indicators
    - Red flags
  - Scoring guide

Final Page: SCORING TEMPLATE
  - Rating scale definitions
  - Scorecard layout
```

**Portal:** Internal Portal → Client Portal → Council Portal

---

### D19: Interview Debrief Guide

**Template:** `tpl_interview_debrief_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 3-5 pages) + Interactive form

**Purpose:** Structured guide for collecting and organizing interviewer feedback after each interview round.

**Data Model:**
```json
{
  "debrief_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "interview_date": "ISO date",
    "interview_round": "number",
    "candidate_name": "string",
    "facilitator": "string"
  },
  "interviewers": [
    {
      "name": "string",
      "title": "string",
      "scores": {
        "dimension": {
          "score": "number (1-5)",
          "evidence": "string",
          "concerns": "string"
        }
      },
      "overall_rating": "strong_yes|yes|maybe|no|strong_no",
      "key_strengths_observed": ["string"],
      "concerns_observed": ["string"],
      "would_hire": true,
      "comments": "string"
    }
  ],
  "discussion_points": [
    {"topic": "string", "notes": "string"}
  ],
  "consensus": {
    "overall_rating": "string",
    "decision": "advance|hold|reject",
    "conditions": ["string"],
    "next_steps": "string"
  }
}
```

**Layout Structure:**
```
Page 1: INTERVIEW DEBRIEF
  - Candidate name, interview date, round
  - Interview panel list

Page 2: FEEDBACK SUMMARY
  - Individual interviewer scores (table)
  - Overall ratings per interviewer
  - Consensus indicators

Page 3: STRENGTHS & CONCERNS
  - Strengths observed (consolidated)
  - Concerns raised (consolidated)
  - Discussion points

Page 4: DECISION & NEXT STEPS
  - Consensus decision
  - Conditions or concerns to address
  - Next steps timeline
```

**Components Needed:**
- `ComponentFeedbackTable` — interviewer scores matrix
- `ComponentConsensusBox` — decision summary
- `ComponentDebriefScorecard` — fillable scorecard

**Portal:** Internal Portal → Client Portal (restricted)

---

### D20: Interview Feedback Collection Form

**Template:** `tpl_feedback_form_v1`
**Priority:** P1
**Format:** Interactive form (web) + PDF (fillable)

**Purpose:** Standardized form for interviewers to submit feedback individually.

**Data Model:**
```json
{
  "form_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "interviewer_name": "string",
    "interview_date": "ISO date",
    "interview_round": "number"
  },
  "ratings": {
    "dimension": {
      "score": "number (1-5)",
      "notes": "string"
    }
  },
  "overall_rating": "strong_yes|yes|maybe|no|strong_no",
  "strengths": ["string"],
  "concerns": ["string"],
  "would_recommend_hiring": true,
  "additional_comments": "string"
}
```

**Layout Structure:**
```
Single-page form (web/PDF):
  - Header: Candidate name, interviewer, date
  - Rating matrix: dimensions with 1-5 scale
  - Overall recommendation (radio buttons)
  - Strengths (text area)
  - Concerns (text area)
  - Additional comments (text area)
  - Submit button
```

**Portal:** Client Portal → Internal Portal (responses flow in)

---

## L5: DECISION & OFFER DOCUMENTS

> Documents supporting the final decision and offer stage.

---

### D21: Final Candidate Recommendation Report

**Template:** `tpl_recommendation_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 4-6 pages)

**Purpose:** LYC's formal recommendation to the client on which candidate to hire, with supporting rationale.

**Data Model:**
```json
{
  "recommendation_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "client_name": "string",
    "date": "ISO date",
    "consultant_name": "string"
  },
  "search_summary": {
    "total_candidates_sourced": "number",
    "total_assessed": "number",
    "total_interviewed": "number",
    "search_duration_weeks": "number"
  },
  "finalists": [
    {
      "rank": 1,
      "name": "string",
      "overall_match_pct": "number",
      "key_strengths": ["string"],
      "key_risks": ["string"],
      "assessment_summary": "string",
      "interview_performance": "string",
      "compensation_expectation": "string",
      "availability": "string"
    }
  ],
  "recommendation": {
    "recommended_candidate": "string",
    "rationale": "string",
    "risk_assessment": "string",
    "negotiation_considerations": "string",
    "onboarding_recommendations": "string"
  },
  "market_context": {
    "candidate_availability": "string",
    "competitive_pressure": "string",
    "recommended_urgency": "immediate|this_week|flexible"
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - "FINAL RECOMMENDATION"
  - Role title, client, date

Page 2: SEARCH SUMMARY
  - Funnel metrics
  - Search overview narrative

Page 3: FINALIST PROFILES
  - Side-by-side finalist summaries
  - Comparative scores

Page 4: RECOMMENDATION
  - Recommended candidate with detailed rationale
  - Risk assessment
  - Negotiation considerations

Page 5: NEXT STEPS
  - Offer timeline
  - Onboarding recommendations
  - Market urgency notes
```

**Portal:** Internal Portal → Client Portal Documents → Email

---

### D22: Compensation Recap — Client

**Template:** `tpl_compensation_recap_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 3-5 pages) + Email summary

**Purpose:** Clear summary of the proposed compensation package for the selected candidate, including market benchmarking and negotiation analysis.

**Data Model:**
```json
{
  "comp_recap_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "role_title": "string",
    "date": "ISO date"
  },
  "proposed_package": {
    "base_salary": "number",
    "base_salary_frequency": "monthly|annual",
    "target_bonus_pct": "number",
    "target_bonus_amount": "number",
    "equity_options": "string",
    "other_compensation": "string",
    "total_target_comp": "number",
    "currency": "string"
  },
  "current_package": {
    "base_salary": "number",
    "bonus": "number",
    "equity": "string",
    "other": "string",
    "total": "number"
  },
  "market_benchmark": {
    "percentile": "string",
    "market_median": "number",
    "market_75th": "number",
    "market_90th": "number",
    "positioning": "below|at|above|significantly_above market"
  },
  "move_analysis": {
    "total_comp_increase_pct": "number",
    "base_salary_increase_pct": "number",
    "market_positioning_change": "string"
  },
  "negotiation_notes": {
    "candidate_expectations": "string",
    "client_budget": "string",
    "flex_areas": ["string"],
    "deal_breakers": ["string"],
    "recommended_approach": "string"
  }
}
```

**Layout Structure:**
```
Page 1: COMPENSATION RECAP
  - Candidate name, role, date

Page 2: PACKAGE COMPARISON
  - Table: Current vs. Proposed vs. Market
  - Waterfall chart showing comp change
  - Market positioning gauge

Page 3: MARKET CONTEXT
  - Benchmark data visualization
  - Percentile positioning
  - Industry comparison

Page 4: NEGOTIATION ANALYSIS
  - Candidate expectations
  - Flex areas
  - Recommended approach
  - Risk assessment
```

**Components Needed:**
- `ComponentCompTable` — current vs. proposed vs. market comparison
- `ComponentWaterfallChart` — compensation change breakdown
- `ComponentPositioningGauge` — market percentile gauge

**Portal:** Internal Portal → Client Portal (restricted) → Email (to decision maker)

---

### D23: Reference Check Summary

**Template:** `tpl_reference_check_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 2-4 pages)

**Purpose:** Summary of reference check findings for the selected candidate.

**Data Model:**
```json
{
  "reference_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "date": "ISO date",
    "conducted_by": "string"
  },
  "references": [
    {
      "referee_name": "string",
      "referee_title": "string",
      "referee_company": "string",
      "relationship": "string",
      "relationship_duration": "string",
      "ratings": {
        "dimension": "rating (1-5)"
      },
      "key_quotes": ["string"],
      "strengths_confirmed": ["string"],
      "concerns_raised": ["string"],
      "overall_impression": "string"
    }
  ],
  "overall_assessment": {
    "strengths_validated": ["string"],
    "concerns_identified": ["string"],
    "risk_level": "low|moderate|high",
    "recommendation": "string"
  }
}
```

**Layout Structure:**
```
Page 1: REFERENCE CHECK SUMMARY
  - Candidate name, date, conducted by
  - Overall risk indicator

Page 2: REFERENCE DETAILS
  - Per-referee summary cards
  - Key quotes (highlighted)
  - Ratings summary

Page 3: ASSESSMENT
  - Strengths validated by references
  - Concerns identified
  - Overall recommendation
```

**Portal:** Internal Portal → Client Portal (restricted)

---

### D24: Offer Letter Template

**Template:** `tpl_offer_letter_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 2-3 pages) — client's letterhead

**Purpose:** Template for client's formal offer letter to the candidate. LYC prepares draft for client customization.

**Data Model:**
```json
{
  "offer_meta": {
    "candidate_name": "string",
    "role_title": "string",
    "client_company": "string",
    "date": "ISO date"
  },
  "offer_details": {
    "start_date": "ISO date",
    "base_salary": "number",
    "bonus_structure": "string",
    "equity": "string",
    "benefits_summary": ["string"],
    "reporting_to": "string",
    "location": "string",
    "probation_period": "string",
    "acceptance_deadline": "ISO date"
  },
  "conditions": ["string"],
  "custom_sections": ["string"]
}
```

**Layout Structure:**
```
Standard formal offer letter format:
  - Client company letterhead
  - Date, candidate address
  - Opening paragraph
  - Position details
  - Compensation details
  - Benefits summary
  - Conditions
  - Acceptance instructions
  - Signature blocks
```

**Portal:** Internal Portal (draft) → Client Portal (for client to customize)

---

### D25: Counter-Offer Advisory Brief

**Template:** `tpl_counter_offer_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 2-3 pages) + Email

**Purpose:** Brief for candidate on how to handle potential counter-offers from current employer, or for client on counter-offer risks.

**Data Model:**
```json
{
  "advisory_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "date": "ISO date",
    "audience": "candidate|client"
  },
  "counter_offer_risk": {
    "risk_level": "low|moderate|high",
    "likely_counter_range": "string",
    "historical_acceptance_rate": "string"
  },
  "advisory_points": ["string"],
  "recommended_responses": ["string"],
  "decision_framework": "string"
}
```

**Layout Structure:**
```
1-2 pages:
  - Counter-offer risk assessment
  - Advisory points (bullets)
  - Recommended response strategies
  - Decision framework
```

**Portal:** Internal Portal → Candidate Portal or Client Portal

---

## L6: ENGAGEMENT MANAGEMENT DOCUMENTS

> Ongoing communication documents during active mandates.

---

### D26: Project / Mandate Status Update

**Template:** `tpl_status_update_v1`
**Priority:** P0
**Format:** Email (HTML) + PDF (A4 Portrait, 2-3 pages)

**Purpose:** Regular update to the client on mandate progress — pipeline metrics, recent activities, next steps.

**Data Model:**
```json
{
  "status_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "client_name": "string",
    "report_date": "ISO date",
    "report_period": "string",
    "consultant_name": "string",
    "overall_status": "on_track|at_risk|delayed|completed"
  },
  "pipeline_metrics": {
    "total_sourced": "number",
    "total_contacted": "number",
    "total_interested": "number",
    "total_assessed": "number",
    "total_shortlisted": "number",
    "total_interviewed": "number",
    "total_offered": "number",
    "weeks_elapsed": "number",
    "weeks_remaining": "number"
  },
  "period_highlights": {
    "activities_completed": ["string"],
    "key_achievements": ["string"],
    "challenges": ["string"]
  },
  "next_period_plan": {
    "planned_activities": ["string"],
    "milestones_due": ["string"],
    "decisions_needed": ["string"]
  },
  "risk_flags": [
    {"risk": "string", "severity": "low|medium|high", "mitigation": "string"}
  ]
}
```

**Layout Structure (Email version):**
```
Subject: [LYC] Mandate Update — [Role Title] — Week X

Header: LYC logo bar
Greeting and overall status indicator

Pipeline Summary:
  Funnel visualization (horizontal bars)
  Key numbers: sourced → contacted → shortlisted → interviewed

This Period:
  Activities completed (bullet list)
  Key achievements (bullet list)
  Challenges (bullet list)

Next Period:
  Planned activities
  Milestones due
  Decisions needed from client

Risk flags (if any)

Consultant signature + contact
Footer: Legal, unsubscribe
```

**Components Needed:**
- `ComponentStatusBadge` — on_track/at_risk/delayed badge
- `ComponentMiniFunnel` — compact pipeline funnel for email
- `ComponentActivityList` — categorized activity list

**Portal:** Internal Portal → Email (auto/scheduled) → Client Portal

---

### D27: Client Meeting Minutes / Alignment Memo

**Template:** `tpl_meeting_minutes_v1`
**Priority:** P0
**Format:** PDF (A4 Portrait, 2-4 pages) + Email summary

**Purpose:** Formal record of client meetings — decisions made, action items, next steps.

**Data Model:**
```json
{
  "meeting_meta": {
    "mandate_id": "string",
    "meeting_date": "ISO datetime",
    "meeting_type": "kick-off|alignment|review|debrief|ad-hoc",
    "location": "string",
    "duration_minutes": "number",
    "facilitator": "string"
  },
  "attendees": [
    {"name": "string", "company": "string", "role": "string"}
  ],
  "agenda_items": [
    {
      "topic": "string",
      "discussion_summary": "string",
      "decisions_made": ["string"],
      "action_items": [
        {"action": "string", "owner": "string", "due_date": "ISO date"}
      ]
    }
  ],
  "summary": {
    "key_decisions": ["string"],
    "action_items": [
      {"action": "string", "owner": "string", "due_date": "ISO date"}
    ],
    "next_meeting": "ISO datetime|null"
  }
}
```

**Layout Structure:**
```
Page 1: MEETING MINUTES
  - Meeting title, date, location
  - Attendees list
  - Meeting type badge

Page 2-3: DISCUSSION & DECISIONS
  - Agenda items with discussion summaries
  - Decisions highlighted in callout boxes
  - Action items with owners and due dates

Page 4: SUMMARY
  - Key decisions list
  - Action items table (action | owner | due date)
  - Next meeting date

Footer: "Please review and confirm accuracy within 48 hours"
```

**Components Needed:**
- `ComponentAttendeeList` — attendee cards/table
- `ComponentDecisionCallout` — highlighted decision box
- `ComponentActionTable` — action items table with owners/dates

**Portal:** Internal Portal → Client Portal → Email (all attendees)

---

### D28: Next Step Recap — Client

**Template:** `tpl_nextstep_client_v1`
**Priority:** P0
**Format:** Email (HTML) + PDF (1 page)

**Purpose:** Concise recap of agreed next steps after a client interaction — decisions, actions, deadlines.

**Data Model:**
```json
{
  "recap_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "date": "ISO date",
    "trigger": "meeting|phone|email|milestone"
  },
  "context": "string (1-2 sentence summary of what prompted this)",
  "decisions_made": ["string"],
  "action_items": [
    {"action": "string", "owner": "LYC|Client", "due_date": "ISO date"}
  ],
  "upcoming_milestones": [
    {"milestone": "string", "target_date": "ISO date"}
  ],
  "consultant_notes": "string"
}
```

**Layout Structure (Email):**
```
Subject: Next Steps — [Role Title] — [Date]

Brief context (1-2 sentences)

Decisions Made:
  • Decision 1
  • Decision 2

Action Items:
  [LYC] Action 1 — due [date]
  [Client] Action 2 — due [date]

Upcoming Milestones:
  • Milestone 1 — [date]

Brief note from consultant

Signature
```

**Portal:** Email (auto-generated) → Client Portal archive

---

### D29: Next Step Recap — Consultant (Internal)

**Template:** `tpl_nextstep_consultant_v1`
**Priority:** P1
**Format:** Internal system note + Email reminder

**Purpose:** Internal action item tracker after client/candidate interactions.

**Data Model:**
```json
{
  "recap_meta": {
    "mandate_id": "string",
    "consultant_name": "string",
    "date": "ISO date",
    "interaction_type": "client_meeting|candidate_call|interview_debrief"
  },
  "summary": "string",
  "action_items": [
    {"action": "string", "priority": "P0|P1|P2", "due_date": "ISO date", "status": "open|done"}
  ],
  "follow_up_dates": ["ISO date"],
  "notes": "string"
}
```

**Layout Structure:**
```
Compact internal format:
  - Interaction summary (2-3 sentences)
  - Action items with priority and due dates
  - Follow-up reminders
  - Notes for future reference
```

**Portal:** Internal Portal (consultant workspace)

---

### D30: Next Step Recap — Candidate

**Template:** `tpl_nextstep_candidate_v1`
**Priority:** P0
**Format:** Email (HTML) + PDF (1 page)

**Purpose:** Clear communication to candidates about next steps — interview scheduling, timeline, logistics.

**Data Model:**
```json
{
  "recap_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "role_title": "string",
    "date": "ISO date",
    "stage": "screening|first_interview|second_interview|offer|post_offer"
  },
  "status_update": "string",
  "next_steps": [
    {"step": "string", "timeline": "string", "action_required_by_candidate": true}
  ],
  "important_dates": [
    {"event": "string", "date": "ISO datetime", "location": "string"}
  ],
  "preparation_needed": ["string"],
  "contact_info": {
    "consultant_name": "string",
    "consultant_phone": "string",
    "consultant_email": "string"
  }
}
```

**Layout Structure (Email):**
```
Subject: Update on [Role Title] — Next Steps

Greeting and status update

Next Steps:
  1. [Step] — [Timeline]
  2. [Step] — [Timeline]

Important Dates:
  • [Event] — [Date/Time] — [Location]

Preparation:
  • [What to prepare]

Your Consultant:
  [Name, phone, email]
```

**Portal:** Candidate Portal → Email

---

## L7: POST-PLACEMENT DOCUMENTS

> Documents for onboarding and post-placement tracking.

---

### D31: Placement Confirmation Letter

**Template:** `tpl_placement_confirmation_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 1-2 pages) — formal letter

**Purpose:** Formal confirmation of successful placement — terms, guarantee period, billing summary.

**Data Model:**
```json
{
  "confirmation_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "role_title": "string",
    "client_company": "string",
    "start_date": "ISO date",
    "confirmation_date": "ISO date"
  },
  "placement_details": {
    "agreed_compensation": "string",
    "fee_amount": "number",
    "fee_paid": "number",
    "fee_outstanding": "number",
    "guarantee_start": "ISO date",
    "guarantee_end": "ISO date",
    "guarantee_terms": "string"
  },
  "post_placement_services": ["string"],
  "contact_information": "string"
}
```

**Layout Structure:**
```
Formal letter format:
  - LYC letterhead
  - Date, client address
  - Confirmation of placement
  - Placement details (role, start date, compensation)
  - Fee summary
  - Guarantee period details
  - Post-placement services offered
  - Contact information
  - Signature
```

**Portal:** Internal Portal → Client Portal Documents → Email

---

### D32: Onboarding Guide — Client

**Template:** `tpl_onboarding_client_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 4-6 pages)

**Purpose:** Guide for the client on integrating the new hire effectively during the first 90 days.

**Data Model:**
```json
{
  "onboarding_meta": {
    "candidate_name": "string",
    "role_title": "string",
    "start_date": "ISO date"
  },
  "pre_start": {
    "checklist": ["string"],
    "communications_to_prepare": ["string"]
  },
  "week_1_plan": {
    "day_1_agenda": ["string"],
    "key_meetings": ["string"],
    "resources_to_provide": ["string"]
  },
  "first_30_days": {
    "milestones": ["string"],
    "check_in_schedule": ["string"]
  },
  "first_90_days": {
    "success_criteria": ["string"],
    "review_schedule": ["string"]
  },
  "lyc_support": {
    "guarantee_check_ins": ["string"],
    "consultant_availability": "string"
  }
}
```

**Layout Structure:**
```
Page 1: ONBOARDING GUIDE
  - New hire name, role, start date

Page 2: PRE-START CHECKLIST
  - IT/setup checklist
  - Team communication template
  - First day agenda

Page 3: FIRST 30 DAYS
  - Week-by-week milestones
  - Check-in schedule
  - Integration tips

Page 4: FIRST 90 DAYS
  - Success criteria
  - Review milestones
  - LYC guarantee support

Page 5: TIPS FOR SUCCESS
  - Best practices from LYC experience
  - Common pitfalls to avoid
```

**Portal:** Internal Portal → Client Portal Documents

---

### D33: Onboarding Guide — Candidate

**Template:** `tpl_onboarding_candidate_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 3-4 pages)

**Purpose:** Guide for the placed candidate on preparing for their new role.

**Data Model:**
```json
{
  "onboarding_meta": {
    "candidate_name": "string",
    "role_title": "string",
    "company": "string",
    "start_date": "ISO date"
  },
  "preparation": {
    "before_start": ["string"],
    "questions_to_prepare": ["string"]
  },
  "first_week_tips": ["string"],
  "first_30_days_advice": ["string"],
  "lyc_support": {
    "consultant_contact": "string",
    "check_in_schedule": ["string"],
    "confidential_support": "string"
  }
}
```

**Layout Structure:**
```
Page 1: PREPARING FOR YOUR NEW ROLE
  - Congratulations + overview
  - Start date and logistics

Page 2: BEFORE YOU START
  - Preparation checklist
  - Questions to prepare

Page 3: FIRST 30 DAYS
  - Tips for success
  - Relationship building advice

Page 4: LYC SUPPORT
  - Your consultant is here for you
  - Check-in schedule
  - Confidential support commitment
```

**Portal:** Candidate Portal → Email

---

### D34: Guarantee Period Tracking Document

**Template:** `tpl_guarantee_tracking_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 1-2 pages) + Dashboard widget

**Purpose:** Track the guarantee period for a placement — check-in dates, feedback, and any issues.

**Data Model:**
```json
{
  "guarantee_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "role_title": "string",
    "guarantee_start": "ISO date",
    "guarantee_end": "ISO date",
    "guarantee_terms": "string"
  },
  "check_ins": [
    {
      "date": "ISO date",
      "week_number": "number",
      "candidate_feedback": "string",
      "client_feedback": "string",
      "issues_raised": ["string"],
      "actions_taken": ["string"],
      "status": "smooth|minor_concern|concern|risk"
    }
  ],
  "current_status": "string",
  "next_check_in": "ISO date"
}
```

**Layout Structure:**
```
Page 1: GUARANTEE TRACKING
  - Candidate, role, guarantee period
  - Timeline of check-ins with status indicators
  - Current status summary
  - Next check-in date
```

**Portal:** Internal Portal → Client Portal

---

### D35: Follow-Up Schedule

**Template:** `tpl_followup_schedule_v1`
**Priority:** P2
**Format:** Email (HTML) + PDF (1-2 pages)

**Purpose:** Pre-defined schedule of follow-up touchpoints after placement, shared with all parties.

**Data Model:**
```json
{
  "schedule_meta": {
    "mandate_id": "string",
    "candidate_name": "string",
    "start_date": "ISO date"
  },
  "touchpoints": [
    {
      "week": "number",
      "date": "ISO date",
      "type": "candidate_checkin|client_checkin|joint_review",
      "purpose": "string",
      "completed": false
    }
  ]
}
```

**Layout Structure:**
```
Timeline format:
  - Week 1 — Date — Candidate check-in (✓)
  - Week 2 — Date — Client check-in (✓)
  - Week 4 — Date — Joint review (upcoming)
  - Week 8 — Date — Candidate + client check-in
  - Week 12 — Date — Guarantee period review
  - Month 6 — Date — Long-term follow-up
```

**Portal:** Internal Portal → Client Portal → Candidate Portal

---

## L8: ASSESSMENT & DEVELOPMENT DOCUMENTS

> Documents generated from assessment instruments.

---

### D36: Assessment Bundle Report

**Template:** `tpl_assessment_bundle_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 15-25 pages)

**Purpose:** Comprehensive assessment report combining multiple instruments into a single integrated view.

**Data Model:**
```json
{
  "bundle_meta": {
    "candidate_name": "string",
    "role_title": "string",
    "mandate_id": "string",
    "date": "ISO date",
    "instruments_used": ["LEAP", "DRIVE", "SHIFT"]
  },
  "executive_summary": "string",
  "instrument_reports": [
    {
      "instrument": "string",
      "key_scores": {},
      "interpretation": "string",
      "implications_for_role": "string"
    }
  ],
  "integrated_analysis": {
    "overall_profile": "string",
    "strengths_synthesis": ["string"],
    "development_areas": ["string"],
    "role_fit_assessment": "string",
    "recommendations": ["string"]
  }
}
```

**Layout Structure:**
```
Page 1: COVER
  - "COMPREHENSIVE ASSESSMENT REPORT"
  - Candidate name, role, date

Page 2: EXECUTIVE SUMMARY
  - Integrated profile narrative
  - Key findings
  - Role fit assessment

Pages 3+: INDIVIDUAL INSTRUMENT REPORTS
  - One section per instrument
  - Scores, interpretation, role implications

Final Pages: INTEGRATED ANALYSIS
  - Strengths synthesis
  - Development areas
  - Recommendations
```

**Note:** Extends G1 (Assessment Reports) with multi-instrument integration.

**Portal:** Internal Portal → Client Portal Documents → Council Portal

---

### D37: Development Recommendations Report

**Template:** `tpl_development_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 4-8 pages)

**Purpose:** AI-generated personalized development plan for a candidate or placed executive.

**Data Model:**
```json
{
  "development_meta": {
    "candidate_name": "string",
    "role_title": "string",
    "date": "ISO date",
    "based_on_assessments": ["string"]
  },
  "current_profile": {
    "strengths": ["string"],
    "development_areas": ["string"],
    "assessment_summary": "string"
  },
  "development_plan": {
    "immediate_priorities": [
      {"area": "string", "recommended_action": "string", "timeline": "string"}
    ],
    "medium_term_goals": [
      {"goal": "string", "resources": ["string"], "milestones": ["string"]}
    ],
    "long_term_development": ["string"]
  },
  "recommended_resources": [
    {"type": "book|course|coaching|mentoring|experience", "detail": "string"}
  ]
}
```

**Layout Structure:**
```
Page 1: DEVELOPMENT RECOMMENDATIONS
  - Candidate name, role, date

Page 2: CURRENT PROFILE
  - Strengths summary
  - Development areas
  - Assessment context

Page 3-4: DEVELOPMENT PLAN
  - Immediate priorities (0-3 months)
  - Medium-term goals (3-12 months)
  - Long-term development (12+ months)

Page 5: RESOURCES
  - Recommended books, courses, coaching, experiences
```

**Portal:** Candidate Portal → Client Portal → Coaching Portal

---

### D38: Team Dynamics Report (BRIDGE)

**Template:** `tpl_team_dynamics_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 8-12 pages)

**Purpose:** Team composition and dynamics analysis based on BRIDGE assessment data.

**Data Model:**
```json
{
  "team_meta": {
    "team_name": "string",
    "leader_name": "string",
    "team_size": "number",
    "date": "ISO date"
  },
  "team_composition": {
    "members": [
      {
        "name": "string",
        "role": "string",
        "team_role_preference": "string",
        "communication_style": "string",
        "decision_making_style": "string"
      }
    ]
  },
  "team_analysis": {
    "role_distribution": {"role": "count"},
    "strengths": ["string"],
    "gaps": ["string"],
    "potential_frictions": ["string"],
    "communication_dynamics": "string"
  },
  "recommendations": {
    "team_optimization": ["string"],
    "communication_improvements": ["string"],
    "hiring_considerations": ["string"]
  }
}
```

**Layout Structure:**
```
Page 1: TEAM DYNAMICS REPORT
  - Team name, leader, date

Page 2: TEAM OVERVIEW
  - Team composition visual
  - Role distribution chart

Pages 3-4: INDIVIDUAL PROFILES
  - Member cards with style preferences

Page 5-6: TEAM ANALYSIS
  - Role distribution analysis
  - Strengths and gaps
  - Potential frictions

Page 7: RECOMMENDATIONS
  - Team optimization strategies
  - Communication improvements
  - Hiring considerations (what roles to add)
```

**Portal:** Internal Portal → Client Portal → Leader Portal

---

### D39: Cohort Assessment Summary

**Template:** `tpl_cohort_summary_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 6-10 pages)

**Purpose:** Aggregate assessment results for a group/cohort (e.g., all candidates for a role, or a team being assessed).

**Data Model:**
```json
{
  "cohort_meta": {
    "cohort_name": "string",
    "assessment_type": "string",
    "total_participants": "number",
    "date": "ISO date"
  },
  "aggregate_scores": {
    "dimensions": [
      {
        "name": "string",
        "mean": "number",
        "median": "number",
        "std_dev": "number",
        "min": "number",
        "max": "number",
        "distribution": "number[]"
      }
    ]
  },
  "top_performers": [
    {"name": "string", "overall_score": "number", "key_strengths": ["string"]}
  ],
  "insights": ["string"],
  "recommendations": ["string"]
}
```

**Layout Structure:**
```
Page 1: COHORT ASSESSMENT SUMMARY
  - Cohort name, assessment type, participants

Page 2: SCORE DISTRIBUTIONS
  - Distribution charts per dimension
  - Key statistics table

Page 3: TOP PERFORMERS
  - Summary cards for top candidates

Page 4: INSIGHTS
  - Patterns and observations
  - Recommendations
```

**Portal:** Internal Portal → Client Portal → Council Portal

---

### D40: Criterion Validation Report

**Template:** `tpl_validation_v1`
**Priority:** P3
**Format:** PDF (A4 Portrait, 8-12 pages)

**Purpose:** Statistical validation report showing predictive validity of assessment instruments against actual performance outcomes.

**Data Model:**
```json
{
  "validation_meta": {
    "report_title": "string",
    "assessment_instrument": "string",
    "sample_size": "number",
    "date_range": "string",
    "date_generated": "ISO date"
  },
  "methodology": "string",
  "results": {
    "correlations": [
      {"dimension": "string", "correlation": "number", "significance": "string"}
    ],
    "predictive_accuracy": "number",
    "roi_analysis": "string"
  },
  "conclusions": ["string"],
  "recommendations": ["string"]
}
```

**Layout Structure:**
```
Technical report format with statistical tables, correlation matrices, and charts.
```

**Portal:** Internal Portal → Council Portal

---

## L9: INTERNAL OPERATIONS DOCUMENTS

> Documents for internal use by LYC consultants and management.

---

### D41: Mandate Profitability Report

**Template:** `tpl_profitability_v1`
**Priority:** P1
**Format:** PDF (A4 Portrait, 3-5 pages) + Dashboard view

**Purpose:** Financial analysis of a mandate — revenue, costs, margin, time efficiency.

**Data Model:**
```json
{
  "profitability_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "client_name": "string",
    "period": "string",
    "status": "active|completed"
  },
  "revenue": {
    "fee_agreed": "number",
    "fee_received": "number",
    "fee_outstanding": "number",
    "currency": "string"
  },
  "costs": {
    "consultant_time_hours": "number",
    "consultant_time_cost": "number",
    "research_costs": "number",
    "travel_expenses": "number",
    "assessment_credits": "number",
    "other_costs": "number",
    "total_costs": "number"
  },
  "profitability": {
    "gross_margin_pct": "number",
    "effective_hourly_rate": "number",
    "time_to_fill_weeks": "number",
    "budget_variance_pct": "number"
  },
  "benchmarking": {
    "avg_margin_for_type": "number",
    "performance_vs_avg": "above|at|below"
  }
}
```

**Layout Structure:**
```
Page 1: MANDATE PROFITABILITY
  - Mandate details, status
  - Key metrics: margin, hourly rate, time-to-fill

Page 2: FINANCIAL BREAKDOWN
  - Revenue table
  - Cost breakdown (pie chart)
  - Margin analysis

Page 3: EFFICIENCY ANALYSIS
  - Time tracking
  - Budget variance
  - Benchmarking vs. average

Page 4: INSIGHTS
  - Profitability drivers
  - Recommendations for future mandates
```

**Components Needed:**
- `ComponentCostBreakdownPie` — cost category pie chart
- `ComponentMarginGauge` — margin percentage gauge
- `ComponentBenchmarkComparison` — vs. average comparison

**Portal:** Internal Portal (consultant + management)

---

### D42: Consultant Performance Report

**Template:** `tpl_consultant_performance_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 4-6 pages) + Dashboard view

**Purpose:** Individual consultant performance metrics — placements, revenue, efficiency, client satisfaction.

**Data Model:**
```json
{
  "performance_meta": {
    "consultant_name": "string",
    "period": "string",
    "date_generated": "ISO date"
  },
  "metrics": {
    "active_mandates": "number",
    "completed_mandates": "number",
    "total_revenue": "number",
    "avg_time_to_fill": "number",
    "avg_margin_pct": "number",
    "client_satisfaction_score": "number",
    "candidates_presented": "number",
    "interview_conversion_rate_pct": "number",
    "offer_acceptance_rate_pct": "number"
  },
  "trends": {
    "monthly_revenue": [{"month": "string", "revenue": "number"}],
    "monthly_placements": [{"month": "string", "count": "number"}]
  },
  "strengths": ["string"],
  "development_areas": ["string"]
}
```

**Layout Structure:**
```
Page 1: PERFORMANCE OVERVIEW
  - Consultant name, period
  - Key metrics in stat cards

Page 2: FINANCIAL PERFORMANCE
  - Revenue trend chart
  - Margin analysis

Page 3: OPERATIONAL METRICS
  - Time-to-fill trend
  - Conversion rates
  - Pipeline metrics

Page 4: QUALITATIVE
  - Strengths
  - Development areas
  - Recommendations
```

**Portal:** Internal Portal (management + consultant self-view)

---

### D43: Revenue / Financial Report

**Template:** `tpl_revenue_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 4-8 pages) + Dashboard

**Purpose:** Firm-level or team-level financial performance report.

**Data Model:**
```json
{
  "financial_meta": {
    "period": "string",
    "scope": "firm|team|individual",
    "date_generated": "ISO date"
  },
  "revenue_summary": {
    "total_revenue": "number",
    "target_revenue": "number",
    "achievement_pct": "number",
    "vs_prior_period_pct": "number"
  },
  "revenue_breakdown": {
    "by_consultant": [{"name": "string", "revenue": "number"}],
    "by_industry": [{"industry": "string", "revenue": "number"}],
    "by_type": [{"type": "retained|contingent|coaching", "revenue": "number"}]
  },
  "pipeline_value": {
    "total_pipeline_value": "number",
    "weighted_pipeline": "number",
    "expected_this_quarter": "number"
  },
  "trends": "chart data"
}
```

**Portal:** Internal Portal (management)

---

### D44: SLA Compliance Report

**Template:** `tpl_sla_compliance_v1`
**Priority:** P2
**Format:** PDF (A4 Portrait, 2-4 pages) + Dashboard

**Purpose:** Track compliance with service level agreements across active mandates.

**Data Model:**
```json
{
  "sla_meta": {
    "period": "string",
    "date_generated": "ISO date"
  },
  "mandates": [
    {
      "mandate_id": "string",
      "role_title": "string",
      "client": "string",
      "sla_items": [
        {"commitment": "string", "target": "string", "actual": "string", "status": "met|at_risk|breached"}
      ],
      "overall_status": "compliant|at_risk|breached"
    }
  ],
  "summary": {
    "total_mandates": "number",
    "compliant_count": "number",
    "at_risk_count": "number",
    "breached_count": "number",
    "compliance_rate_pct": "number"
  }
}
```

**Portal:** Internal Portal → Client Portal (shared)

---

### D45: Board Report

**Template:** `tpl_board_report_v1`
**Priority:** P2
**Format:** PDF (16:9 Landscape, 10-15 slides)

**Purpose:** Executive-level business report for board meetings — firm performance, strategic updates, key metrics.

**Data Model:**
```json
{
  "board_meta": {
    "period": "string",
    "date": "ISO date",
    "prepared_by": "string"
  },
  "executive_summary": "string",
  "financial_highlights": {
    "revenue": "number",
    "revenue_target": "number",
    "margin_pct": "number",
    "placements": "number"
  },
  "operational_highlights": {
    "active_mandates": "number",
    "avg_time_to_fill": "number",
    "client_satisfaction": "number",
    "key_wins": ["string"]
  },
  "strategic_updates": [
    {"initiative": "string", "status": "string", "progress_pct": "number"}
  ],
  "risks_and_issues": [
    {"item": "string", "severity": "string", "mitigation": "string"}
  ],
  "next_period_outlook": "string"
}
```

**Layout Structure:**
```
Slide format (16:9):
  Slide 1: Title + period
  Slide 2: Executive Summary
  Slide 3-4: Financial Highlights (charts)
  Slide 5-6: Operational Highlights
  Slide 7-8: Strategic Updates
  Slide 9: Risks & Issues
  Slide 10: Outlook + Discussion Points
```

**Portal:** Internal Portal (management)

---

## L10: COMMUNICATION TEMPLATES

> Email-based document templates for automated and manual communications.

---

### D46: Weekly Mandate Digest Email

**Template:** `tpl_email_weekly_digest_v1`
**Priority:** P0
**Format:** HTML Email (600px)

**Purpose:** Automated weekly summary of mandate activities sent to clients.

*(Already covered in REPORT_DESIGN_SPECIFICATION.md Group 9 — included here for completeness)*

**Portal:** Email (automated)

---

### D47: Pipeline Status Update Email

**Template:** `tpl_email_pipeline_update_v1`
**Priority:** P1
**Format:** HTML Email (600px)

**Purpose:** Ad-hoc pipeline update email when significant milestones are reached.

**Data Model:**
```json
{
  "email_meta": {
    "mandate_id": "string",
    "role_title": "string",
    "recipient": "string",
    "trigger": "milestone_reached|weekly|on_request"
  },
  "pipeline_snapshot": {
    "stage_counts": {"sourced": 45, "contacted": 20, "screened": 8, "interviewed": 4, "shortlisted": 3},
    "key_milestone": "string",
    "status": "string"
  },
  "highlights": ["string"],
  "next_steps": ["string"]
}
```

**Portal:** Email (semi-automated)

---

### D48: Assessment Completion Alert Email

**Template:** `tpl_email_assessment_alert_v1`
**Priority:** P2
**Format:** HTML Email (600px)

**Purpose:** Notification when a candidate completes an assessment, with quick score summary.

**Portal:** Email (automated) → Internal Portal notification

---

### D49: Market Briefing Email

**Template:** `tpl_email_market_briefing_v1`
**Priority:** P2
**Format:** HTML Email (600px)

**Purpose:** Periodic market intelligence email — talent market trends, competitor moves, compensation shifts.

**Portal:** Email (automated/scheduled) → Client Portal

---

### D50: QBR Summary Email

**Template:** `tpl_email_qbr_v1`
**Priority:** P2
**Format:** HTML Email (600px)

**Purpose:** Quarterly Business Review summary — key metrics, achievements, upcoming plans.

**Portal:** Email (scheduled) → Client Portal

---

## Template Summary & Priority Matrix

| # | Document | Template ID | Priority | Format | Portal(s) |
|---|----------|-------------|----------|--------|-----------|
| D01 | Client Proposal | tpl_proposal_v1 | **P0** | PDF | Internal → Client |
| D02 | Fee Schedule | tpl_fee_schedule_v1 | P1 | PDF | Internal → Client |
| D03 | Terms & Conditions | tpl_terms_v1 | P1 | PDF | Internal → Client |
| D04 | NDA | tpl_nda_v1 | P2 | PDF | Internal → Client |
| D05 | Track Record | tpl_track_record_v1 | P2 | PDF/HTML | Internal → Client |
| D06 | Mandate Kick-Off Brief | tpl_mandate_brief_v1 | **P0** | PDF | All Portals |
| D07 | Job Description | tpl_job_description_v1 | **P0** | PDF/Web | All Portals |
| D08 | Role Specification | tpl_role_spec_v1 | P1 | PDF | Internal → Council |
| D09 | Target Company List | tpl_target_company_v1 | P1 | PDF | Internal → Client |
| D10 | Market Approach Plan | tpl_market_approach_v1 | P2 | PDF | Internal → Client |
| D11 | CV / Candidate Presentation | tpl_cv_presentation_v3.3 | **P0** | PDF | Internal → Client |
| D12 | Shortlist Presentation | tpl_shortlist_presentation_v1 | **P0** | PDF | Internal → Client |
| D13 | Candidate Comparison Matrix | tpl_comparison_matrix_v1 | P1 | PDF | Internal → Client |
| D14 | Skills & Assessment Gap Analysis | tpl_gap_analysis_v1 | P1 | PDF | All Portals |
| D15 | Interview Prep — Client | tpl_interview_prep_client_v1 | **P0** | PDF | Internal → Client |
| D16 | Interview Prep — Candidate | tpl_interview_prep_candidate_v1 | P1 | PDF | Candidate → Email |
| D17 | Interview Schedule | tpl_interview_schedule_v1 | P1 | PDF | All Portals → Email |
| D18 | Interview Question Framework | tpl_interview_framework_v1 | P2 | PDF | Internal → Client |
| D19 | Interview Debrief Guide | tpl_interview_debrief_v1 | **P0** | PDF | Internal → Client |
| D20 | Interview Feedback Form | tpl_feedback_form_v1 | P1 | Web/PDF | Client → Internal |
| D21 | Final Recommendation Report | tpl_recommendation_v1 | **P0** | PDF | Internal → Client |
| D22 | Compensation Recap — Client | tpl_compensation_recap_v1 | **P0** | PDF | Internal → Client |
| D23 | Reference Check Summary | tpl_reference_check_v1 | P1 | PDF | Internal → Client |
| D24 | Offer Letter Template | tpl_offer_letter_v1 | P2 | PDF | Internal → Client |
| D25 | Counter-Offer Advisory | tpl_counter_offer_v1 | P2 | PDF | Internal → Client/Candidate |
| D26 | Mandate Status Update | tpl_status_update_v1 | **P0** | Email/PDF | Internal → Client |
| D27 | Client Meeting Minutes | tpl_meeting_minutes_v1 | **P0** | PDF | Internal → Client |
| D28 | Next Step Recap — Client | tpl_nextstep_client_v1 | **P0** | Email/PDF | Email → Client |
| D29 | Next Step Recap — Consultant | tpl_nextstep_consultant_v1 | P1 | Internal | Internal |
| D30 | Next Step Recap — Candidate | tpl_nextstep_candidate_v1 | **P0** | Email/PDF | Candidate → Email |
| D31 | Placement Confirmation | tpl_placement_confirmation_v1 | P1 | PDF | Internal → Client |
| D32 | Onboarding Guide — Client | tpl_onboarding_client_v1 | P2 | PDF | Internal → Client |
| D33 | Onboarding Guide — Candidate | tpl_onboarding_candidate_v1 | P2 | PDF | Candidate → Email |
| D34 | Guarantee Tracking | tpl_guarantee_tracking_v1 | P2 | PDF | Internal → Client |
| D35 | Follow-Up Schedule | tpl_followup_schedule_v1 | P2 | Email/PDF | All Portals |
| D36 | Assessment Bundle Report | tpl_assessment_bundle_v1 | P1 | PDF | Internal → Client |
| D37 | Development Recommendations | tpl_development_v1 | P1 | PDF | All Portals |
| D38 | Team Dynamics Report | tpl_team_dynamics_v1 | P2 | PDF | Internal → Client |
| D39 | Cohort Assessment Summary | tpl_cohort_summary_v1 | P2 | PDF | Internal → Client |
| D40 | Criterion Validation Report | tpl_validation_v1 | P3 | PDF | Internal → Council |
| D41 | Mandate Profitability | tpl_profitability_v1 | P1 | PDF | Internal |
| D42 | Consultant Performance | tpl_consultant_performance_v1 | P2 | PDF | Internal |
| D43 | Revenue / Financial Report | tpl_revenue_v1 | P2 | PDF | Internal |
| D44 | SLA Compliance Report | tpl_sla_compliance_v1 | P2 | PDF | Internal → Client |
| D45 | Board Report | tpl_board_report_v1 | P2 | PDF | Internal |
| D46 | Weekly Digest Email | tpl_email_weekly_digest_v1 | **P0** | HTML Email | Email |
| D47 | Pipeline Update Email | tpl_email_pipeline_update_v1 | P1 | HTML Email | Email |
| D48 | Assessment Alert Email | tpl_email_assessment_alert_v1 | P2 | HTML Email | Email |
| D49 | Market Briefing Email | tpl_email_market_briefing_v1 | P2 | HTML Email | Email |
| D50 | QBR Summary Email | tpl_email_qbr_v1 | P2 | HTML Email | Email |

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| **P0 — Critical** | 13 | Core client-facing documents produced every engagement |
| **P1 — High** | 15 | Important operational documents, produced frequently |
| **P2 — Medium** | 15 | Supporting documents, produced periodically |
| **P3 — Nice-to-have** | 2 | Specialized documents, produced rarely |
| **Already Done** | 5 | Covered in existing REPORT_DESIGN_SPECIFICATION.md |
| **TOTAL** | **50** | |

---

## Relationship to Existing Specs

| This Document | Existing Spec | Overlap |
|---|---|---|
| D11 (CV Presentation) | LYC_CV_Format_Spec_v3.0.md | **Full overlap** — use existing spec |
| D36 (Assessment Bundle) | REPORT_DESIGN_SPEC Group 1 | Partial overlap — extends with multi-instrument integration |
| D46-D50 (Email Templates) | REPORT_DESIGN_SPEC Group 9 | **Full overlap** — use existing spec |
| D14 (Gap Analysis) | REPORT_DESIGN_SPEC Group 4 (Diagnostics) | Partial overlap — different focus |
| D38 (Team Dynamics) | REPORT_DESIGN_SPEC Group 4 | Partial overlap — BRIDGE-specific |

All other documents (D01-D10, D12-D13, D15-D35, D37, D39-D45) are **new** and not covered by any existing specification.

---

## Implementation Recommendations

### Phase 1 (Weeks 1-4): P0 Documents
Build templates for all 13 P0 documents. These are used in every engagement and have the highest client impact.

### Phase 2 (Weeks 5-8): P1 Documents
Build templates for 15 P1 documents. These support the full engagement lifecycle.

### Phase 3 (Weeks 9-12): P2 Documents
Build templates for 15 P2 documents. These are supporting materials.

### Phase 4 (Weeks 13+): P3 Documents
Build remaining specialized templates.

---

*This is a living document. Update as new document types are identified or business requirements evolve.*
