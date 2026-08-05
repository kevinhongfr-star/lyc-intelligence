# VALENTINA — Supabase Backend Impact Brief

**Agent:** VALENTINA  
**Role:** Business Intelligence & Training Analytics  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

Valentina owns BI, analytics, training programs, and performance measurement. The v2 backend provides a rich data warehouse-like layer with 21 views and 400+ tables. **Key changes:**
- 21 database views provide pre-computed analytics (though some have JOIN bugs being fixed)
- Full access to all reporting tables: `agent_daily_metrics`, `v_mandate_scores`, `v_pipeline_rankings`, `v_stain_summary`
- `vista_content_attribution` + `vista_content_contact_interactions` for content analytics
- `sla_performance_history`, `sla_escalations` for operational KPI tracking
- `ml_models` + AI generation tracking for model performance monitoring

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `v_mandate_scores` | Read (scoring analytics) | Broken JOINs being fixed | High — core analytics |
| `v_mandate_pipeline` | Read (pipeline analytics) | Broken JOINs being fixed | High — core analytics |
| `v_pipeline_rankings` | Read (ranking data) | Depends on v_mandate_scores | High |
| `v_stain_summary` | Read (stain analytics) | Vista stain summary view | Medium |
| `v_encirclement` | Read (encirclement data) | Vista encirclement view | Medium |
| `agent_daily_metrics` | Read (agent performance) | ~50+ records; agent KPIs | High — core function |
| `agent_registry` | Read (agent catalog) | 4 registered agents | Low |
| `agent_actions` | Read (agent activity) | 0 rows; will grow with Phase 01-02 | Medium — monitor |
| `agent_logs` | Read (execution logs) | ~200 records; debugging | Low |
| `mandates` | Read (mandate data) | 7,452 records; analysis base | High |
| `candidates_pipeline` | Read (pipeline data) | 385 records; funnel analysis | High |
| `pipeline_transitions` | Read (stage changes) | ~100 records; cycle time analysis | Medium |
| `mandate_timelines` | Read (SLA data) | ~50 records; SLA analysis | Medium |
| `vista_daily_log` | Read (activity data) | ~100 records; daily KPIs | Medium |
| `vista_content_attribution` | Read (content analytics) | ~100 records; content ROI | Medium |
| `vista_content_contact_interactions` | Read (interaction data) | ~200 records; engagement | Medium |
| `ai_generations` | Read (AI usage tracking) | 16 records; AI cost/volume | Medium |
| `ml_models` | Read (model inventory) | — ; model tracking | Low |
| `campaign_activities` | Read (campaign analytics) | ~500 records; campaign ROI | Medium |
| `vista_achievements` | Read (achievement tracking) | ~10 records; gamification | Low |
| `vista_goals` | Read (goal tracking) | ~10 records; KPI targets | Medium |
| `credit_ledger` | Read (credit analytics) | ~10 records; usage economics | Medium |

---

## 3. Workflow Changes Required

### 3.1 KPI reporting

| Before | After | Action Required |
|--------|-------|-----------------|
| KPI reporting (manual / spreadsheets) | Automated from Supabase views + tables | Build KPI dashboards on top of `v_mandate_scores`, `v_mandate_pipeline`, `agent_daily_metrics` |

### 3.2 Agent performance audits

| Before | After | Action Required |
|--------|-------|-----------------|
| Agent performance audits (weekly manual) | Query `agent_daily_metrics` + `agent_actions` | Automate audit report generation from structured metrics tables |

### 3.3 Training effectiveness measurement

| Before | After | Action Required |
|--------|-------|-----------------|
| Training effectiveness measurement | `workshop_scores` + `candidate_prep_progress` + `member_growth_state` | Track training ROI via before/after scoring and progression data |

### 3.4 Content analytics

| Before | After | Action Required |
|--------|-------|-----------------|
| Content analytics (scattered tools) | `vista_content_attribution` + `vista_content_contact_interactions` | Centralize content performance tracking in Vista analytics tables |

### 3.5 SLA / operational reporting

| Before | After | Action Required |
|--------|-------|-----------------|
| SLA / operational reporting | `mandate_timelines` + `sla_performance_history` + `pipeline_transitions` | Automate SLA reporting from timeline + transition data |

### 3.6 Forecasting & predictive analytics

| Before | After | Action Required |
|--------|-------|-----------------|
| Forecasting & predictive analytics | All pipeline + revenue tables as data source | Build forecasting models on top of structured Supabase data |

---

## 4. Phase Dependencies

| Build Phase | What It Means for VALENTINA | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | View fixes, data integrity, RLS policies | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | Analytics APIs, realtime metrics | 🟡 **Medium** |
| **Phase 04: Internal Portal** | BI dashboards, KPI tracking, analytics workspace | 🔴 **High** |
| **Phase 07: Report Engine** | Automated report generation, scheduled reports | 🔴 **High** |
| **Phase 08: NEXUS AI** | AI-driven insights, anomaly detection, predictive analytics | 🟡 **Medium** |
| **Phase 09: Advanced Features** | Advanced analytics, ML models, cohort analysis | 🟡 **Medium** |
| **Phase 10: Launch Readiness** | Performance optimization, data quality dashboards | 🟡 **Medium** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Broken views (`v_mandate_scores`, `v_mandate_pipeline`) -> wrong KPIs | 🔴 High | Do NOT publish any reports based on these views until Phase 01 fix confirmed |
| RLS on tables may restrict cross-mandate / cross-org analytics | 🟡 Medium | Ensure Valentina's service role has read-only cross-org access for BI purposes |
| Data quality issues (enrichment NULLs, missing data) | 🟡 Medium | Build `v_data_health` view (referenced in Architecture Map) to monitor quality before building dashboards |
| agent_actions = 0 rows -> limited agent activity analytics | ✅ Low | Monitor adoption; agent_actions will populate as agents migrate to Supabase |

---

## 6. Action Items (VALENTINA Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Validate all 21 views for correctness after Phase 01 fixes | P0 | Phase 01 |
| 2 | Set up read-only BI service role with appropriate data scope | P0 | Phase 01 |
| 3 | Build core KPI dashboard on top of fixed views + `agent_daily_metrics` | P1 | Phase 04 |
| 4 | Define data quality monitoring: `v_data_health` view | P1 | Phase 01 |
| 5 | Automate weekly agent performance audit reports | P1 | Phase 07 |
| 6 | Integrate content analytics from `vista_content_attribution` | P2 | Phase 04 |
| 7 | Build SLA / operational performance dashboards | P2 | Phase 04 |
| 8 | Explore predictive analytics on pipeline data | P3 | Phase 09 |

---

## 7. Key Tables to Monitor

- `v_mandate_scores`
- `v_mandate_pipeline`
- `v_pipeline_rankings`
- `agent_daily_metrics`
- `mandates`
- `candidates_pipeline`
- `pipeline_transitions`
- `vista_content_attribution`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
