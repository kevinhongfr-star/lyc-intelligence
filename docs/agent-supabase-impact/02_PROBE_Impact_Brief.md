# PROBE — Supabase Backend Impact Brief

**Agent:** PROBE  
**Role:** Pipeline Visibility & Dashboard Intelligence  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

PROBE monitors pipeline health, generates dashboards, and surfaces signal intelligence from LENS + MARIA data. The v2 backend formalizes PROBE's data access pattern from ad-hoc queries to structured dashboard views. **Key changes:**
- New views available: `v_mandate_scores`, `v_mandate_pipeline`, `v_pipeline_rankings` (currently being fixed — JOIN bugs)
- New signal tables: `signals`, `intelligence_signals`, `intelligence_sources` (500+ rows)
- Vista tables public access revoked — `vista_signals`, `vista_alerts`, `vista_daily_log` will require auth
- Dashboard tables will be rearchitected — PROBE's HTML dashboard output should migrate to reading from views, not raw tables

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `mandates` | Read (pipeline tracking) | Still primary; RLS org-scoped | Low |
| `candidates_pipeline` | Read (pipeline stages) | Primary data source; RLS tightened | Low |
| `vista_signals` | Read (signal monitoring) | Public access -> authenticated | Medium — update auth |
| `vista_alerts` | Read/Write (alert rules) | New RLS policies | Medium |
| `signals` | Read (signal intelligence) | New structured signal table | Low — new capability |
| `intelligence_signals` | Read (structured intel) | New table with source tracking | Low — new capability |
| `agent_actions` | Read (agent activity) | Currently 0 rows; will fill as agents migrate | Medium — monitor adoption |
| `agent_daily_metrics` | Read (agent performance) | ~50 rows; dashboard data source | Low |
| `v_mandate_scores` | Read (scoring dashboard) | Broken JOINs being fixed in Phase 01 | High — wait for fix |
| `v_mandate_pipeline` | Read (pipeline dashboard) | Broken JOINs being fixed | High — wait for fix |

---

## 3. Workflow Changes Required

### 3.1 Dashboard generation from raw SQL queries

| Before | After | Action Required |
|--------|-------|-----------------|
| Dashboard generation from raw SQL queries | Use official views + Supabase REST API | Refactor dashboard queries to use `v_mandate_scores`, `v_mandate_pipeline`, `v_pipeline_rankings` |

### 3.2 Signal detection across scattered tables

| Before | After | Action Required |
|--------|-------|-----------------|
| Signal detection across scattered tables | Query `signals` + `intelligence_signals` unified | Migrate signal monitoring to structured signal tables |

### 3.3 HTML dashboard output

| Before | After | Action Required |
|--------|-------|-----------------|
| HTML dashboard output | Same output format; data source changes | Update data fetching layer; preserve HTML output |

### 3.4 Alerting based on threshold checks

| Before | After | Action Required |
|--------|-------|-----------------|
| Alerting based on threshold checks | Use `vista_alert_rules` + `vista_alerts` | Hook into existing alert infrastructure; define PROBE-specific rules |

---

## 4. Phase Dependencies

| Build Phase | What It Means for PROBE | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | View JOINs fixed, RLS tightened, public access revoked | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | Realtime subscriptions for pipeline changes | 🟡 **Medium** |
| **Phase 04: Internal Portal** | Dashboard UI in portal replaces standalone HTML | 🔴 **High** |
| **Phase 09: Advanced Features** | Automated pipeline health scoring, predictive alerts | 🟡 **Medium** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| View JOIN bugs fixed -> query structure changes | 🔴 High | Test dashboard queries against fixed views before Phase 01 deploy |
| Vista tables public access removed -> dashboards go blank | 🔴 High | Switch to service_role or authenticated access immediately |
| Dashboard migration to portal -> HTML output deprecated | 🟡 Medium | Coordinate with Phase 04 team on data contract for dashboard widgets |
| 20+ tables with RLS but zero policies -> empty reads | 🟡 Medium | Identify which tables PROBE needs and request policies |

---

## 6. Action Items (PROBE Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Update Supabase auth from anon to service_role / authenticated | P0 | Phase 01 |
| 2 | Migrate dashboard queries from raw tables to official views | P0 | Phase 01 view fix |
| 3 | Switch signal monitoring to `signals` + `intelligence_signals` | P1 | Phase 01 complete |
| 4 | Define PROBE alert rules in `vista_alert_rules` | P1 | Phase 02 |
| 5 | Add realtime subscription for pipeline changes | P2 | Phase 02 |
| 6 | Plan dashboard migration from HTML to Internal Portal components | P2 | Phase 04 |

---

## 7. Key Tables to Monitor

- `v_mandate_scores`
- `v_mandate_pipeline`
- `v_pipeline_rankings`
- `candidates_pipeline`
- `mandates`
- `signals`
- `intelligence_signals`
- `agent_daily_metrics`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
