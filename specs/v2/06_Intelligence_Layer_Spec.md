# 06 — Intelligence Layer Spec
## LYC Intelligence Platform — Data Backbone

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Intelligence signals, AI enrichment, market data, company insights  
**Dependencies:** 02 (Supabase), 04 (Client Portal)

---

## 1. Intelligence Layer Overview

### 1.1 Purpose

The Intelligence Layer is the data backbone of LYC Intelligence. It:
- Ingests market signals from multiple sources (RSS, APIs, web scraping, manual)
- Enriches company and candidate profiles with AI
- Generates actionable insights for consultants and clients
- Feeds the candidate-job matching engine
- Powers the Company 360° View

### 1.2 Architecture

```
┌─────────────────────────────────────────────────┐
│              INTELLIGENCE LAYER                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Sources   │  │ Signals  │  │ Enrichment   │ │
│  │ (Ingest)  │→ │ (Process)│→ │ (AI/ML)      │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│       │              │                │          │
│       ▼              ▼                ▼          │
│  ┌──────────────────────────────────────────┐   │
│  │         Company Intelligence View        │   │
│  │  (360° company profile with live data)   │   │
│  └──────────────────────────────────────────┘   │
│       │                                          │
│       ▼                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Mandate  │  │Candidate │  │ Notifications│ │
│  │ Matching │  │Scoring   │  │ & Alerts     │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────┘
```

### 1.3 Signal Types

| Signal | Source | Frequency | Impact |
|--------|--------|-----------|--------|
| Funding rounds | Crunchbase, PitchBook API | Daily | High |
| Hiring velocity | LinkedIn, job boards | Hourly | Medium |
| Executive departures | News RSS, LinkedIn | Daily | High |
| Office openings/closures | News, company blogs | Weekly | Medium |
| M&A activity | News, regulatory filings | Daily | Critical |
| Compensation trends | Glassdoor, Levels.fyi | Weekly | Medium |
| Industry reports | Research feeds | Monthly | Low |
| Regulatory changes | Government feeds | Daily | High |
| Talent movement | LinkedIn, referrals | Real-time | Medium |
| Market shifts | Macro data feeds | Weekly | Medium |

---

## 2. Source Management (Admin)

### 2.1 Page: Intelligence Sources

**Route:** `/admin/intelligence/sources`  
**Access:** Super admin only

**Features:**
- List all configured intelligence sources
- Add/edit/delete sources
- Configure refresh intervals
- Monitor source health (last fetch, error rate)
- Test source connectivity

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Intelligence Sources                            │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Source           │ Type   │ Status │ Last  │  │
│  │──────────────────┼────────┼────────┼───────│  │
│  │ Crunchbase API   │ API    │ 🟢 OK  │ 2h ago│  │
│  │ LinkedIn Jobs    │ Scrape │ 🟡 Slow│ 1h ago│  │
│  │ TechCrunch RSS   │ RSS    │ 🟢 OK  │ 15m   │  │
│  │ Glassdoor        │ Scrape │ 🔴 Err │ 6h ago│  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [+ Add Source]  [Test All]  [Refresh All]      │
└─────────────────────────────────────────────────┘
```

**Tickets:**
- `INT-SRC-001`: Source list page with status indicators
- `INT-SRC-002`: Add source form (type, URL, interval, auth)
- `INT-SRC-003`: Edit source configuration
- `INT-SRC-004`: Delete source (soft delete)
- `INT-SRC-005`: Test source connectivity
- `INT-SRC-006`: Source health monitoring dashboard
- `INT-SRC-007`: Manual refresh trigger

---

## 3. Signal Processing

### 3.1 Page: Intelligence Dashboard

**Route:** `/intelligence`  
**Access:** All authenticated users (filtered by org)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Intelligence Dashboard              [Filters ▾] │
│                                                  │
│  🔥 Top Signals (Last 7 Days)                   │
│  ┌───────────────────────────────────────────┐  │
│  │ 🔴 Series D: ByteDance ($2B)    2h ago   │  │
│  │ 🟡 CTO departure: Alibaba Cloud 5h ago   │  │
│  │ 🟢 Expansion: Tesla Shanghai #2   8h ago │  │
│  │ 🔴 Acquisition: Pinduoduo/TEMU   12h ago │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  📊 By Type        📊 By Industry    📊 By Geo  │
│  ┌────────┐       ┌────────┐       ┌────────┐ │
│  │Funding 12│      │Tech   24│      │SH    18│ │
│  │Hiring  34│      │Finance 8│      │BJ    12│ │
│  │M&A      5│      │Health  6│      │SZ     8│ │
│  └────────┘       └────────┘       └────────┘ │
│                                                  │
│  📋 All Signals (paginated)                     │
│  ┌───────────────────────────────────────────┐  │
│  │ Type     │ Company   │ Detail    │ Score  │  │
│  │ Funding  │ ByteDance │ Series D  │ 0.95   │  │
│  │ Hiring   │ Tencent   │ +200 eng  │ 0.72   │  │
│  │ ...                                         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Tickets:**
- `INT-DASH-001`: Intelligence dashboard layout
- `INT-DASH-002`: Signal feed with infinite scroll
- `INT-DASH-003`: Signal filtering (type, industry, geography, date)
- `INT-DASH-004`: Signal detail view (expandable)
- `INT-DASH-005`: Signal relevance scoring display
- `INT-DASH-006`: Related companies/mandates linking
- `INT-DASH-007`: Signal bookmarking/saving
- `INT-DASH-008`: Real-time signal notifications

---

## 4. Company Intelligence (360° View)

### 4.1 Page: Company Intelligence Panel

**Route:** `/companies/{id}/intelligence`  
**Access:** Consultants + client users

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Company 360° — Acme Corp                        │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ HEALTH SCORE: 78/100 ████████░░            │  │
│  │ Trend: ↑ +5 (last 30 days)                │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  📊 Headcount Trend     💰 Funding Status       │
│  ┌────────────┐        ┌────────────────┐      │
│  │ [Chart]    │        │ Series B (2024)│      │
│  │ 250→320    │        │ $50M raised    │      │
│  │ +28% YoY   │        │ Next: est. Q3  │      │
│  └────────────┘        └────────────────┘      │
│                                                  │
│  🏢 Hiring Velocity     📰 Recent Signals       │
│  ┌────────────┐        ┌────────────────┐      │
│  │ 45 open    │        │ 3 signals (7d) │      │
│  │ 12 urgent  │        │ → View all     │      │
│  └────────────┘        └────────────────┘      │
│                                                  │
│  💼 Active Mandates     🧑 Talent Pipeline      │
│  ┌────────────┐        ┌────────────────┐      │
│  │ 3 mandates │        │ 12 candidates  │      │
│  │ 2 urgent   │        │ 4 submitted    │      │
│  └────────────┘        └────────────────┘      │
└─────────────────────────────────────────────────┘
```

**Tickets:**
- `INT-COMP-001`: Company 360° dashboard
- `INT-COMP-002`: Health score calculation & display
- `INT-COMP-003`: Headcount trend chart (sparkline)
- `INT-COMP-004`: Funding status panel
- `INT-COMP-005`: Hiring velocity widget
- `INT-COMP-006`: Recent signals list (company-specific)
- `INT-COMP-007`: Active mandates summary
- `INT-COMP-008`: Talent pipeline summary
- `INT-COMP-009`: AI-generated company brief
- `INT-COMP-010`: Export company intelligence report (PDF)

---

## 5. AI Enrichment Engine

### 5.1 Edge Function: ai-enrich

**Purpose:** Enrich company/candidate data using AI

**Trigger:** Manual (button click) or automatic (new record creation)

**Enrichment Types:**

| Target | Enrichment | Model | Cost |
|--------|-----------|-------|------|
| Company | Industry classification | DeepSeek flash | ~¥0.02 |
| Company | Size estimation | DeepSeek flash | ~¥0.02 |
| Company | Tech stack inference | DeepSeek pro | ~¥0.10 |
| Company | Competitive landscape | DeepSeek pro | ~¥0.10 |
| Company | Hiring needs prediction | DeepSeek pro | ~¥0.10 |
| Candidate | Skills extraction from CV | DeepSeek flash | ~¥0.02 |
| Candidate | Career trajectory analysis | DeepSeek pro | ~¥0.10 |
| Candidate | Role fit scoring | DeepSeek pro | ~¥0.10 |

**Tickets:**
- `INT-AI-001`: AI enrichment edge function setup
- `INT-AI-002`: Company enrichment pipeline
- `INT-AI-003`: Candidate enrichment pipeline
- `INT-AI-004`: Enrichment queue management
- `INT-AI-005`: Enrichment results storage
- `INT-AI-006`: Manual enrichment trigger (UI button)
- `INT-AI-007`: Auto-enrich on record creation
- `INT-AI-008`: Enrichment history & audit trail
- `INT-AI-009`: Enrichment cost tracking

---

## 6. Signal-to-Mandate Matching

### 6.1 Purpose

When an intelligence signal indicates a company is hiring (funding, expansion, departure), the system should:
1. Identify related active mandates
2. Suggest the signal to mandate consultants
3. Auto-generate outreach suggestions

### 6.2 Matching Logic

```typescript
// Pseudo-code for signal-to-mandate matching
async function matchSignalToMandates(signal: IntelligenceSignal) {
  // 1. Find mandates at related companies
  const mandates = await db.from('mandates')
    .select()
    .in('company_id', signal.companies_related)
    .eq('status', 'active');

  // 2. Score relevance
  for (const mandate of mandates) {
    const score = calculateRelevance(signal, mandate);
    if (score > 0.7) {
      await createSuggestion(signal, mandate, score);
    }
  }

  // 3. Notify consultants
  await notifyConsultants(mandates, signal);
}
```

**Tickets:**
- `INT-MATCH-001`: Signal-to-mandate matching algorithm
- `INT-MATCH-002`: Suggestion creation & storage
- `INT-MATCH-003`: Consultant notification on match
- `INT-MATCH-004`: Match confidence display
- `INT-MATCH-005`: Outreach template generation

---

## 7. Intelligence API

### 7.1 Internal API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/intelligence/signals` | GET | List signals (paginated) |
| `/api/intelligence/signals/:id` | GET | Signal detail |
| `/api/intelligence/signals` | POST | Create signal (admin) |
| `/api/intelligence/sources` | GET | List sources |
| `/api/intelligence/sources` | POST | Create source |
| `/api/intelligence/company/:id` | GET | Company intelligence view |
| `/api/intelligence/enrich` | POST | Trigger enrichment |
| `/api/intelligence/match` | POST | Signal-to-mandate match |
| `/api/intelligence/export` | GET | Export signals (CSV/PDF) |

**Tickets:**
- `INT-API-001`: Signals CRUD API
- `INT-API-002`: Sources CRUD API
- `INT-API-003`: Company intelligence aggregation API
- `INT-API-004`: Enrichment trigger API
- `INT-API-005`: Export API

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| INT-SRC: Source Management | 7 | `INT-SRC-001` to `INT-SRC-007` |
| INT-DASH: Intelligence Dashboard | 8 | `INT-DASH-001` to `INT-DASH-008` |
| INT-COMP: Company Intelligence | 10 | `INT-COMP-001` to `INT-COMP-010` |
| INT-AI: AI Enrichment | 9 | `INT-AI-001` to `INT-AI-009` |
| INT-MATCH: Signal Matching | 5 | `INT-MATCH-001` to `INT-MATCH-005` |
| INT-API: API Endpoints | 5 | `INT-API-001` to `INT-API-005` |
| **TOTAL** | **~44** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
