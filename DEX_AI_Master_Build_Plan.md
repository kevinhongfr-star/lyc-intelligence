# LYC Intelligence (DEX AI) — Master Build Plan

**Version:** 1.0  
**Date:** 2026-07-17  
**Author:** NEXUS (PM)  
**Status:** Living document — updated as phases complete

---

## Overview

| Phase | Name | Status | Specs | Issues | Est. Duration |
|-------|------|--------|-------|--------|---------------|
| 1 | Foundation | ✅ DONE | 7 specs | #1–#7 | Completed |
| 2 | Intelligence + Council + Internal | 🔄 IN PROGRESS | 5 specs | #8–#12, #15 | 2–3 weeks |
| 2.5 | Diagnostic Intelligence (SHIFT) | ⚪ NOT STARTED | NEW spec needed | New issues | 2–3 weeks |
| 3 | Client & Candidate Experience | ⚪ NOT STARTED | 2 specs exist | #13–#14 | 2–3 weeks |
| 4 | Academy / LMS | 🟡 PARTIAL | LMS pages added | New issues needed | 3–4 weeks |
| 5 | Intelligence Reports & Content | ⚪ NOT STARTED | Templates exist | New issues needed | 2–3 weeks |
| 6 | Scale, Polish & Advanced | ⚪ NOT STARTED | 1 spec exists | #16 | 2–3 weeks |

---

## Phase 1: Foundation ✅ DONE

**Specs:** 02 (Supabase), 03 (UX), 08 (Commerce)  
**What's live:** 477 tables, 9 roles, Stripe (Council + Credits), persisted rate limiting, DeepSeek v4-flash, Vercel production

**Known debt:**
- `aiHandler.ts` uses old inline rate limiter (not `rateLimiter.ts`) — low priority
- Credit pack CNY prices: code ¥79/¥319 vs spec ¥99/¥399 — Kevin to decide

---

## Phase 2: Intelligence + Council + Internal Portal 🔄 IN PROGRESS

### Issue #8: Intelligence Layer — Data Pipeline & Signals
- **Spec:** `06_Intelligence_Layer_Spec.md` (15 KB)
- **Scope:** External market signal ingestion, AI enrichment, Company 360° view, signal-to-mandate matching
- **Status:** Code pushed (commit `4838cacc90`) — intelligenceHandler, ai-enrich edge function, notifications migration
- **⚠️ GAP:** Covers external signals only. Internal diagnostic data (SHIFT Composite) addressed in Phase 2.5

### Issue #9: Council Portal — Public Pages
- **Spec:** `05_The_Council_Portal_Spec.md` (29 KB)
- **Status:** Queued

### Issue #10: Council Portal — Member Dashboard & Community
- **Spec:** `05b_The_Council_Portal_Spec_v2_Addendum.md` (13 KB)
- **Should incorporate:** Monthly Briefing template structure

### Issue #11: Council Portal — Admin Management
- **Spec:** `05c_The_Council_v2_Backend_Wiring.md` (10 KB)

### Issue #12: Internal Portal (Consultant Workspace)
- **Spec:** `01_Internal_Portal_Spec.md` (10 KB)

### Issue #15: Notification System (Cross-Portal)
- **Spec:** ⚠️ NO spec exists — NEXUS to write

**Phase 2 Exit Criteria:**
- [ ] All 6 issues closed
- [ ] Intelligence Layer ingesting ≥1 real data source
- [ ] Council Portal accessible to authenticated members
- [ ] Internal Portal usable by consultants

---

## Phase 2.5: Diagnostic Intelligence (SHIFT Composite) ⚪ NOT STARTED

**Why:** LYC's core intelligence is the SHIFT Composite diagnostic system. Our current spec covers external market signals but misses LYC's actual IP.

### 2.5.1 SHIFT Composite Data Model
- 5 instruments: LEAP (Leadership Archetype), QUEST (Executive Capability + AI Readiness), COACH (Leadership Style + APAC Style IQ), DRIVE (Motivation Architecture), IMPACT (Board Effectiveness)
- APAC Translation scoring (5 sub-regions: Greater China, SEA, Japan/Korea, ANZ, India)
- Individual assessment results storage
- Cohort-level aggregation

### 2.5.2 Online Diagnostic Assessment Engine
- Assessment UI: question-by-question, 5-point Likert, progress bar, save/resume, timer
- Pre-assessment briefing, post-assessment teaser insights
- Results dashboard: composite score, dimension breakdown, benchmark comparison
- Team/group results: aggregate view, anonymized comparison

### 2.5.3 Cohort Analytics
- SHIFT Composite score distribution (mean, range, std dev)
- Instrument-by-instrument cohort analysis
- Engagement risk distribution
- Development recommendations engine

**Specs needed:**
- [ ] `09_SHIFT_Composite_Data_Model_Spec.md`
- [ ] `10_Online_Diagnostic_Assessment_Spec.md`
- [ ] `11_Cohort_Analytics_Spec.md`

**Phase 2.5 Exit Criteria:**
- [ ] SHIFT data model deployed (5 instruments + APAC Translation)
- [ ] ≥1 diagnostic assessment can be taken online end-to-end
- [ ] Results dashboard renders composite scores + dimension breakdowns
- [ ] Cohort aggregation works for 10+ assessments

---

## Phase 3: Client & Candidate Experience ⚪ NOT STARTED

### Issue #13: Client Portal (Company-Facing)
- **Spec:** `04_Client_Portal_Spec.md` (12 KB)
- **Scope:** 8 pages — Dashboard, Company Profile, Mandates, Candidates, Activity, Billing

### Issue #14: Candidate Portal v2.1
- **Spec:** `07_Candidate_Portal_Spec_v2.md` (17 KB)
- **Scope:** Candidate profiles, job matching, application tracking

**Phase 3 Exit Criteria:**
- [ ] Client portal: companies can view mandates, review candidates, see company intelligence
- [ ] Candidate portal: candidates can manage profiles, see matching mandates, track applications
- [ ] Both portals connected to Intelligence Layer data

---

## Phase 4: Academy / LMS 🟡 PARTIAL

**Already built (code):** Course Catalog, Course Detail, Lesson Player, Student Dashboard, LMS service

### Still needed:
- Admin course content management (create/edit, video library, progress tracking, certificates)
- Student Dashboard full wiring (6 sections: Welcome, Diagnostics, Courses, Development Plan, Community, Recommendations)
- Community Forum (threads, moderation, events)
- Certification & Development Plans

**Spec needed:** `12_Academy_LMS_Complete_Spec.md`

**Phase 4 Exit Criteria:**
- [ ] Admin can create/manage courses
- [ ] Students can enroll, progress, complete courses
- [ ] Student dashboard shows all 6 sections
- [ ] Community forum functional

---

## Phase 5: Intelligence Reports & Content Generation ⚪ NOT STARTED

**Source:** 3 Notion templates with full content structure

### 5.1 Cohort Intelligence Report
- Auto-generate from SHIFT data: Executive Summary → Cohort Profile → Instrument Analysis → APAC Translation → Recommendations
- Audience: B2B clients

### 5.2 APAC Executive Intelligence Report (Quarterly)
- 5 themes: Leadership Capability, AI Readiness, Cross-Cultural, APAC Market (5 sub-regions), Leadership Transitions
- Audience: Signal Council + B2B clients

### 5.3 Signal Council Monthly Intelligence Briefing
- Format: The Signal → Three Observations → The Question → SHIFT Data → Upcoming
- AI-drafted for Kevin's review → distribute to members

**Spec needed:** `13_Intelligence_Reports_Spec.md`

**Phase 5 Exit Criteria:**
- [ ] Report template engine generates PDF from data
- [ ] Cohort Report auto-populates from SHIFT data
- [ ] Monthly Briefing AI-draftable for Kevin's review
- [ ] ≥1 report type distributable through the app

---

## Phase 6: Scale, Polish & Advanced ⚪ NOT STARTED

- Issue #16: Performance, Accessibility & Polish (Lighthouse >90, WCAG 2.1 AA)
- DeepSeek alias migration (Jul 24 deadline)
- Rate limiter unification
- Multi-language (EN/ZH)
- Advanced analytics dashboard
- API versioning
- Webhook fix (James, 58+ days)
- Email integration (MS Graph API)

---

## Dependency Map

```
Phase 1 ✅
    │
    ▼
Phase 2 (Intelligence + Council)
    │
    ├──► Phase 2.5 (SHIFT Composite)
    │        │
    │        ├──► Phase 5 (Report Generation)
    │        │
    │        └──► Phase 4 (Academy — diagnostics integration)
    │
    └──► Phase 3 (Client & Candidate Portals)
             │
             └──► Phase 4 (Academy — candidate pipeline)

Phase 6 (Polish) ← after all above
```

**Critical path:** Phase 2 → Phase 2.5 → Phase 5  
**Parallel path:** Phase 2 → Phase 3 → Phase 4

---

## Spec Coverage

| Phase | Spec Exists | Files | Gap |
|-------|:-----------:|-------|-----|
| 1 | ✅ | 02, 03, 08 | None |
| 2 | ✅ | 01, 05, 05b, 05c, 06 | #15 needs spec |
| 2.5 | ❌ | — | 3 new specs needed |
| 3 | ✅ | 04, 07 | None |
| 4 | 🟡 | LMS code only | Need formal spec |
| 5 | ❌ | Notion templates | Need spec |
| 6 | ✅ | Issue #16 | None |

---

## Immediate Actions (Next 7 Days)

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Continue Issue #8 (Intelligence Layer) | Trae | 🔴 |
| 2 | Write #15 Notification spec | NEXUS | 🔴 |
| 3 | Credit pack CNY price decision | Kevin | 🟡 |
| 4 | DeepSeek alias migration check | NEXUS | 🔴 (Jul 24) |
| 5 | Draft Phase 2.5 SHIFT data model spec | NEXUS | 🟡 |
| 6 | Continue Issue #9 (Council Public Pages) | Trae | 🟡 |

---

*Document maintained by NEXUS. Last updated: 2026-07-17.*
