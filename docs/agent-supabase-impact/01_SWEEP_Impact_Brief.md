# SWEEP — Supabase Backend Impact Brief

**Agent:** SWEEP (Sourcing & Pipeline Administration)
**Role:** Candidate sourcing, boolean search, list building, pipeline hygiene
**Version:** 1.0 | **Date:** 2026-08-05
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`

---

## 1. Executive Summary

SWEEP currently operates primarily on Notion + Feishu with minimal direct Supabase usage. The v2 backend architecture significantly expands SWEEP's data footprint and operational surface area. **Key changes:**

- ✅ **New tables available:** `sweep_outcomes` (already exists, ~100 rows), `target_companies`, `grid_candidate_entries`
- ⚠️ **Security model changes:** RLS policies on `contacts` and `vista_contacts` are being tightened — public access removed
- 🔴 **Breaking: `contacts` table schema stability** — 85+ dependent tables, any schema change affects SWEEP
- 🟡 **Views you depend on:** `v_mandate_scores`, `v_mandate_pipeline` (currently have JOIN bugs being fixed in Phase 01)

---

## 2. Tables You Currently Use vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `contacts` | Read (search, enrichment) | Still primary source, but RLS-tightened | ✅ Low — same data, authenticated access |
| `vista_contacts` | Read (BD sourcing) | New: public policies revoked | 🔴 Medium — must use service role or authenticated context |
| `mandates` | Read (search criteria) | RLS restricted by org/consultant | 🟡 Low — internal agent, service role access |
| `candidates_pipeline` | Write (add candidates) | RLS + audit trail enforced | 🟡 Low — same table, stricter writes |
| `target_companies` | Read/Write (target lists) | New: mandate-scoped access | ✅ Low — new capability |
| `sweep_outcomes` | Write (results) | Already exists (~100 rows) | ✅ None — already wired |
| `grid_candidate_entries` | Write (grid entries) | New table | ✅ Low — new capability |
| `companies` | Read (company search) | RLS tightened | ✅ Low |

---

## 3. Workflow Changes Required

### 3.1 Authentication
| Before | After | Action Required |
|--------|-------|-----------------|
| Public API access (anon key) | Authenticated service role | Update SWEEP's Supabase client to use service_role key or proper JWT |

### 3.2 Data Ingestion
| Before | After | Action Required |
|--------|-------|-----------------|
| Ad-hoc CSV / Notion imports | Write directly to `sweep_outcomes` + `candidates_pipeline` | Migrate import scripts to use Supabase INSERT with proper `created_by` audit fields |

### 3.3 Search & Boolean Building
| Before | After | Action Required |
|--------|-------|-----------------|
| Notion database queries | Supabase full-text search on `contacts` + `vista_contacts` | Rebuild boolean search queries against Supabase schema; leverage pg_trgm / full-text indexes |

### 3.4 Pipeline Hygiene
| Before | After | Action Required |
|--------|-------|-----------------|
| Manual / Notion-based dedup | `candidate_mandate_matches` AI matching + `pipeline_transitions` audit | Hook into existing matching pipeline; log all stage changes to `pipeline_transitions` |

---

## 4. Phase Dependencies

| Build Phase | What It Means for SWEEP | Go-Live Impact |
|-------------|-------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS policies fixed, public access revoked, view JOIN bugs fixed | 🟡 **Medium** — SWEEP must update auth before Phase 01 completes; broken views get fixed |
| **Phase 02: API Layer & Real-Time Data** | CRUD APIs for mandates/contacts/companies | ✅ **Low** — optional: can use REST API instead of direct SQL |
| **Phase 04: Internal Portal** | Pipeline Kanban, mandate management UI | 🟡 **Medium** — SWEEP results visible in portal; may need webhook or realtime subscription |
| **Phase 09: Advanced Features** | Pipeline automation, intelligent matching | 🔴 **High** — SWEEP's core sourcing logic gets augmented/replaced by AI matching |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Public `contacts` access revoked → SWEEP scripts break | 🔴 High | Test service_role access before Phase 01 deploys |
| `contacts` schema changes → 85 dependent tables cascade | 🔴 High | Monitor Phase 01 migration; pin to stable schema version |
| View JOIN bugs (`v_mandate_scores`, `v_mandate_pipeline`) | 🟡 Medium | Being fixed in Phase 01; do NOT build new features on these views until fix confirmed |
| RLS zero-policy tables → data appears empty | 🟡 Medium | 20+ tables have RLS enabled but no policies; verify which tables SWEEP needs and request policies |

---

## 6. Action Items (SWEEP Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Update Supabase client to use service_role or authenticated JWT | P0 | Phase 01 |
| 2 | Audit all SWEEP scripts for `contacts` / `vista_contacts` direct access | P0 | — |
| 3 | Migrate sourcing results to write to `sweep_outcomes` + `candidates_pipeline` | P1 | Phase 01 complete |
| 4 | Hook search/boolean logic into Supabase full-text search | P1 | Phase 02 API layer |
| 5 | Subscribe to `pipeline_transitions` for audit trail visibility | P2 | Phase 04 |
| 6 | Evaluate AI matching in `candidate_mandate_matches` vs. manual sourcing | P3 | Phase 09 |

---

## 7. Key Tables to Monitor

- `contacts` — primary data source (85+ dependents)
- `vista_contacts` — BD sourcing pool (24+ dependents)
- `mandates` — search criteria anchor (45+ dependents)
- `candidates_pipeline` — candidate placement
- `sweep_outcomes` — your output table
- `target_companies` — mandate target lists
- `pipeline_transitions` — audit trail for stage changes

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
