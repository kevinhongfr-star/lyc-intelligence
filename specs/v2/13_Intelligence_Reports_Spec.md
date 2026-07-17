# 13 — Intelligence Report Generation Spec

**Version:** 1.0 | **Phase:** 5 | **Author:** NEXUS | **Status:** Ready for Implementation  
**Depends on:** Phase 2 (Intelligence Layer), Phase 2.5 (SHIFT Composite Data)

---

## 1. Overview

Automated intelligence report generation engine that produces 3 report types from platform data. Templates sourced from LYC's existing Notion deliverables.

### 3 Report Types
| Report | Frequency | Audience | Data Source |
|--------|-----------|----------|-------------|
| Cohort Intelligence Report | Per program completion | B2B clients | SHIFT Composite + cohort analytics |
| Signal Council Monthly Briefing | Monthly | Council members | External signals + SHIFT data + market analysis |
| APAC Executive Intelligence Report | Quarterly | Council + B2B clients | 5-theme analysis across all data |

---

## 2. Report Type 1: Cohort Intelligence Report

### 2.1 Template Structure (from Notion)
1. **Executive Summary** (1 page): Key findings, headline composite score, notable patterns
2. **Cohort Profile**: Demographics, N, assessment completion rate
3. **SHIFT Composite Overview**: Mean score, distribution, engagement risk breakdown
4. **Instrument-by-Instrument Analysis**:
   - LEAP: Leadership archetype distribution, engagement drivers
   - QUEST: Capability gaps, AI readiness distribution
   - COACH: Style diversity, APAC Translation highlights
   - DRIVE: Motivation patterns, alignment with org strategy
   - IMPACT: Board effectiveness patterns
5. **APAC Translation Intelligence**: 5 sub-region heatmap, cross-cultural gaps
6. **Cohort Dynamics**: Team composition, complementary strengths, potential friction
7. **Development Recommendations**: Top 3 org-level, top 3 individual-level
8. **Appendix**: Methodology, scoring explanation, benchmark comparison

### 2.2 Data Inputs
- `v2_shift_composite_scores` — individual composites
- `v2_shift_scores` — dimension-level scores
- `v2_apac_translation_scores` — cross-cultural data
- `v2_shift_cohorts` + `v2_shift_cohort_memberships` — cohort definition
- `v2_shift_benchmarks` — for percentile comparison

### 2.3 Generation Pipeline
```
Trigger (cohort complete OR admin request)
→ Aggregate cohort data (SQL queries from Spec 11)
→ AI summary generation (DeepSeek API)
  - System prompt: LYC intelligence analyst persona
  - Input: aggregated data + template structure
  - Output: narrative sections with data-backed insights
→ Template rendering (data + AI text → formatted document)
→ PDF generation
→ Store + notify stakeholders
```

---

## 3. Report Type 2: Signal Council Monthly Intelligence Briefing

### 3.1 Template Structure (from Notion)
1. **The Signal**: One headline insight for the month
2. **Three Observations**: Data-backed market observations
3. **The Question**: Strategic question for Council members to ponder
4. **From the SHIFT Composite Data**: Relevant diagnostic insights (anonymized aggregate)
5. **Upcoming**: Events, deadlines, calls to action

### 3.2 Data Inputs
- Intelligence Layer external signals (Spec 06: Crunchbase, LinkedIn, RSS, M&A)
- SHIFT aggregate data (anonymized)
- Company 360° enriched data
- Signal-to-mandate matches

### 3.3 Generation Pipeline
```
Monthly trigger (1st of month, or manual)
→ Aggregate top signals from Intelligence Layer (past 30 days)
→ AI briefing generation (DeepSeek API)
  - Kevin's editorial voice
  - Board-level tone
  - Concise (800-1200 words)
→ Kevin review queue (draft status)
→ Kevin approves/edits → published
→ Distribute: in-app notification + email digest
```

### 3.4 Review Workflow
```
AI Draft → Kevin Review (Dashboard) → Approve/Edit → Published → Distributed
```
- Dashboard: `/admin/intelligence/briefings`
- Actions: Approve, Edit inline, Reject, Schedule

---

## 4. Report Type 3: APAC Executive Intelligence Report (Quarterly)

### 4.1 Template Structure (from Notion)
1. **Leadership Capability Trends**: SHIFT aggregate changes, capability gaps
2. **AI Readiness**: QUEST data trends, adoption patterns across industries
3. **Cross-Cultural Intelligence**: APAC Translation trends, regional comparisons
4. **APAC Market Intelligence** (5 sub-regions):
   - Greater China, SEA, Japan/Korea, ANZ, India
   - M&A activity, hiring velocity, market signals per region
5. **Leadership Transitions**: C-suite movement data, succession patterns

### 4.2 Data Inputs
- All SHIFT data (quarter-over-quarter comparison)
- Intelligence Layer market signals (by sub-region)
- Company 360° data
- Mandate/candidate pipeline data (Phase 3)

### 4.3 Generation Pipeline
```
Quarterly trigger (or manual)
→ Aggregate SHIFT cohort data + market signals by region
→ AI report generation (DeepSeek API)
  - 3000-5000 words
  - Data visualizations described in markdown
→ Kevin review → approve/edit
→ PDF generation with charts
→ Distribute: in-app + email
```

---

## 5. Database Schema

### 5.1 v2_intelligence_reports
```sql
CREATE TABLE v2_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(30) NOT NULL,  -- cohort, monthly_briefing, quarterly
    title VARCHAR(300) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, in_review, approved, published, distributed
    content JSONB NOT NULL,  -- structured report content
    cohort_id UUID REFERENCES v2_shift_cohorts(id),  -- For cohort reports
    period_start DATE,
    period_end DATE,
    generated_by VARCHAR(20) DEFAULT 'ai',  -- ai, manual
    ai_model VARCHAR(50),  -- deepseek-v4-flash, etc.
    ai_prompt_tokens INTEGER,
    ai_completion_tokens INTEGER,
    created_by UUID REFERENCES v2_user_profiles(id),
    approved_by UUID REFERENCES v2_user_profiles(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 v2_report_distributions
```sql
CREATE TABLE v2_report_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES v2_intelligence_reports(id),
    recipient_user_id UUID REFERENCES v2_user_profiles(id),
    recipient_email VARCHAR(200),
    channel VARCHAR(20) NOT NULL,  -- in_app, email, both
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending'  -- pending, sent, delivered, read
);
```

---

## 6. PDF Generation

### 6.1 Template Engine
- Use `@react-pdf/renderer` or `puppeteer` for PDF generation
- Branded templates: LYC logo, color scheme, typography
- Charts: Rendered as images (Chart.js server-side or SVG → PNG)
- Page layout: A4, professional formatting

### 6.2 Report Styling
| Element | Style |
|---------|-------|
| Cover page | LYC branding, report title, date, recipient |
| Executive summary | Full-width, highlighted box |
| Charts | Clean, minimal, LYC color palette |
| Data tables | Alternating row colors, borderless |
| Recommendations | Numbered list with icons |

---

## 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reports/generate | Trigger report generation |
| GET | /api/reports | List reports (filtered by type) |
| GET | /api/reports/:id | Get report detail |
| POST | /api/reports/:id/approve | Approve draft |
| POST | /api/reports/:id/publish | Publish approved report |
| POST | /api/reports/:id/distribute | Send to recipients |
| GET | /api/reports/:id/pdf | Download PDF |

---

## 8. AI Generation Configuration

```typescript
interface ReportGenerationConfig {
    reportType: 'cohort' | 'monthly_briefing' | 'quarterly';
    model: 'deepseek-v4-flash' | 'deepseek-v4-pro';
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
    dataFormatter: (data: any) => string;  // Converts DB data to prompt context
    postProcessor: (output: string) => JSONB;  // Parses AI output to structured content
}
```

---

## 9. Exit Criteria
- [ ] Report template engine generates PDF from data
- [ ] Cohort Report auto-populates from SHIFT data
- [ ] Monthly Briefing AI-draftable for Kevin's review
- [ ] Quarterly Report covers all 5 themes
- [ ] ≥1 report type distributable through app + email
- [ ] PDF quality: branded, professional, no text overlap
