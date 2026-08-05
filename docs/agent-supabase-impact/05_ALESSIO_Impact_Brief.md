# ALESSIO — Supabase Backend Impact Brief

**Agent:** ALESSIO  
**Role:** Search Operations & Project Management  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

ALESSIO currently runs entirely on Feishu + Notion with zero Supabase integration. The v2 backend brings mandate management, pipeline tracking, and consultant performance data into Supabase. **Key changes:**
- Major migration: ALESSIO's mandate tracking moves from Feishu spreadsheets to `mandates` + `candidates_pipeline`
- All data already exists: 7,452 mandates, 385 pipeline records, 68K contacts are in Supabase
- Views are broken: `v_mandate_scores`, `v_mandate_pipeline` have JOIN bugs (being fixed)
- Consultant attribution: `mandates.consultant_id` + `mandates.lead_consultant_id` already exist

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `mandates` | Read (all mandate data) | 7,452 records; primary table | High — core data source |
| `candidates_pipeline` | Read/Write (pipeline mgmt) | 385 records; stage tracking | High — primary workflow |
| `contacts` | Read (candidate/contact info) | 68,556 records; master database | Medium |
| `companies` | Read (client company info) | ~500 records | Low |
| `v_mandate_scores` | Read (scoring dashboard) | Broken JOINs; being fixed | High — wait for fix |
| `v_mandate_pipeline` | Read (pipeline dashboard) | Broken JOINs; being fixed | High — wait for fix |
| `pipeline_transitions` | Read (stage change audit) | ~100 records; audit trail | Medium |
| `mandate_timelines` | Read (SLA tracking) | ~50+ records; SLA monitoring | Medium |
| `mandate_members` | Read (team assignments) | ~50 records | Low |
| `mandate_solutions` | Read (solution profiles) | ~10 records | Low |
| `milestones` | Read/Write (milestone tracking) | milestone management | Medium |
| `client_meetings` | Read (client interactions) | ~20 records | Low |
| `interviews` | Read/Write (interview scheduling) | interview tracking | Medium |
| `offers` | Read (offer tracking) | offer stage management | Low |
| `agent_daily_metrics` | Read (team performance) | ~50+ records | Low |
| `tasks` | Read/Write (task management) | ~100+ records; assigned to agents | Medium |

---

## 3. Workflow Changes Required

### 3.1 Mandate tracking via Feishu spreadsheets

| Before | After | Action Required |
|--------|-------|-----------------|
| Mandate tracking via Feishu spreadsheets | Supabase `mandates` + `candidates_pipeline` as source of truth | Migrate all mandate tracking to Supabase; Feishu becomes notification layer |

### 3.2 Pipeline stage management

| Before | After | Action Required |
|--------|-------|-----------------|
| Pipeline stage management (manual) | Update `candidates_pipeline.stage` + log to `pipeline_transitions` | All stage changes write to both table and audit log |

### 3.3 Consultant KPI tracking

| Before | After | Action Required |
|--------|-------|-----------------|
| Consultant KPI tracking (Notion + sheets) | Query `v_mandate_scores` + `agent_daily_metrics` | Use views for performance dashboards |

### 3.4 Daily briefing

| Before | After | Action Required |
|--------|-------|-----------------|
| Daily briefing (compiled manually) | Auto-generated from Supabase queries | Daily brief script pulls from views + pipeline tables |

### 3.5 SLA monitoring

| Before | After | Action Required |
|--------|-------|-----------------|
| SLA monitoring (manual check) | `mandate_timelines` + SLA calculation views | Automate SLA tracking from timeline data |

---

## 4. Phase Dependencies

| Build Phase | What It Means for ALESSIO | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | View JOINs fixed, RLS tightened, data integrity | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | Mandate CRUD APIs, realtime pipeline updates | 🔴 **High** |
| **Phase 04: Internal Portal** | Mandate management UI, pipeline Kanban, scoring dashboards | 🔴 **High** |
| **Phase 07: Report Engine** | Automated progress reports, client updates | 🟡 **Medium** |
| **Phase 09: Advanced Features** | Pipeline automation, workflow automation | 🟡 **Medium** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data migration risk: Feishu sheets -> Supabase mandates | 🔴 High | Run parallel tracking for 2 weeks; validate data integrity before cutover |
| Broken views (`v_mandate_scores`, `v_mandate_pipeline`) | 🔴 High | Do NOT build dashboards on these views until Phase 01 fix confirmed |
| RLS policies may restrict cross-mandate visibility | 🟡 Medium | Ensure ALESSIO role has org-wide mandate visibility (not just assigned) |
| Portal (Phase 04) replaces Feishu as primary interface | 🟡 Medium | Plan training and workflow migration to portal-based ops |

---

## 6. Action Items (ALESSIO Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Set up ALESSIO service role with proper RLS scoping | P0 | Phase 01 |
| 2 | Validate fixed views before building dashboards on them | P0 | Phase 01 |
| 3 | Migrate mandate tracking from Feishu sheets to Supabase `mandates` | P1 | Phase 02 |
| 4 | Implement pipeline stage change logging to `pipeline_transitions` | P1 | Phase 02 |
| 5 | Set up daily brief auto-generation from Supabase queries | P1 | Phase 04 |
| 6 | Migrate SLA monitoring to `mandate_timelines`-based automation | P2 | Phase 04 |
| 7 | Plan full workflow migration to Internal Portal (Phase 04) | P2 | Phase 04 |

---

## 7. Key Tables to Monitor

- `mandates`
- `candidates_pipeline`
- `v_mandate_scores`
- `v_mandate_pipeline`
- `contacts`
- `pipeline_transitions`
- `mandate_timelines`
- `tasks`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
