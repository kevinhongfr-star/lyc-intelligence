# LENS — Supabase Backend Impact Brief

**Agent:** LENS  
**Role:** Research & Intelligence Analysis  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

LENS generates validation reports, market intelligence, and candidate deep-dives. The v2 backend centralizes intelligence data that was previously scattered across Notion and local files. **Key changes:**
- Unified intelligence layer: `intelligence_signals`, `intelligence_sources`, `intelligence_queries`, `ai_insights`, `ai_briefs`
- Candidate data unified: `contacts` (68K) + `candidates_pipeline` (385) as primary sources
- Direct table access tightened: RLS on `contacts`, `mandates`, `candidates_pipeline`
- Report storage: `grid_deliverables`, `client_intelligence_reports` for output persistence

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `contacts` | Read (candidate research) | 68K master records; RLS tightened | Low |
| `companies` | Read (company research) | ~500 records; RLS tightened | Low |
| `mandates` | Read (mandate context) | 7,452 records; RLS org-scoped | Low |
| `candidates_pipeline` | Read (pipeline context) | 385 records; RLS tightened | Low |
| `intelligence_signals` | Read/Write (signal analysis) | ~200 rows; new structured table | Low — new capability |
| `intelligence_sources` | Read (source catalog) | ~50 sources; new table | Low |
| `intelligence_queries` | Write (query log) | ~50 rows; track research requests | Low |
| `ai_insights` | Write (generated insights) | ~50+ rows; output destination | Low |
| `ai_briefs` | Write (brief output) | ~20 rows; brief storage | Low |
| `signals` | Read (business signals) | ~500 signals | Low |
| `grid_mappings` | Read (grid context) | ~50 mappings | Low |
| `client_intelligence_reports` | Write (deliverables) | ~10 reports; client-facing | Medium — client data isolation |

---

## 3. Workflow Changes Required

### 3.1 Research from Notion + web sources

| Before | After | Action Required |
|--------|-------|-----------------|
| Research from Notion + web sources | Same sources + Supabase as structured data layer | Use Supabase for candidate/company/mandate lookups; web sources unchanged |

### 3.2 Signal analysis from PROBE inputs

| Before | After | Action Required |
|--------|-------|-----------------|
| Signal analysis from PROBE inputs | Read `signals` + `intelligence_signals` directly | Consume structured signals instead of parsing PROBE reports |

### 3.3 Report generation to files/Notion

| Before | After | Action Required |
|--------|-------|-----------------|
| Report generation to files/Notion | Also write to `ai_briefs` + `client_intelligence_reports` | Add Supabase write step for persistent storage and portal display |

### 3.4 Candidate validation

| Before | After | Action Required |
|--------|-------|-----------------|
| Candidate validation | Query `contacts` + `candidates_pipeline` for existing data | Leverage unified contact database for dedup and enrichment |

---

## 4. Phase Dependencies

| Build Phase | What It Means for LENS | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS tightened, views fixed, data integrity improved | 🟡 **Medium** |
| **Phase 02: API Layer & Real-Time Data** | Portal APIs for intelligence features | ✅ **Low** |
| **Phase 04: Internal Portal** | Intelligence dashboard + research workspace | 🟡 **Medium** |
| **Phase 07: Report Engine** | Template-based report generation pipeline | 🔴 **High** |
| **Phase 08: NEXUS AI** | RAG-based research, AI briefing | 🔴 **High** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Client intelligence reports must respect client data isolation | 🔴 High | Use RLS policies for `client_intelligence_reports`; never cross client streams |
| RLS on `contacts` may restrict which candidates LENS can see | 🟡 Medium | Ensure LENS service role has appropriate scoping; not full access unnecessarily |
| Report engine (Phase 07) may replace LENS manual report generation | 🟡 Medium | Plan for LENS to become research input rather than report producer |

---

## 6. Action Items (LENS Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Update Supabase auth for LENS agent identity | P0 | Phase 01 |
| 2 | Map all LENS research outputs to `ai_briefs` + `intelligence_signals` | P1 | Phase 01 complete |
| 3 | Migrate candidate lookup queries to `contacts` master table | P1 | Phase 02 |
| 4 | Define output format for `client_intelligence_reports` | P2 | Phase 04 |
| 5 | Integrate with Report Engine (Phase 07) for automated brief generation | P3 | Phase 07 |

---

## 7. Key Tables to Monitor

- `contacts`
- `companies`
- `mandates`
- `intelligence_signals`
- `intelligence_sources`
- `ai_briefs`
- `ai_insights`
- `candidates_pipeline`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
