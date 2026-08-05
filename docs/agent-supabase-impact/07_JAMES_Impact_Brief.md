# JAMES — Supabase Backend Impact Brief

**Agent:** JAMES  
**Role:** Frontend Development & Portal Engineering  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

James builds and maintains the frontend portals (Internal, Client, B2C, Candidate). The v2 backend defines the data contract that all frontend code must consume. **Key changes:**
- Data source of truth moves from ad-hoc API endpoints to structured Supabase tables + views
- Authentication: Supabase Auth replaces custom auth; RLS handles data isolation
- Real-time: Supabase Realtime replaces polling for live updates
- 20+ tables have RLS enabled but zero policies — frontend will see empty data until policies are added
- Views (`v_mandate_scores`, `v_mandate_pipeline`) have JOIN bugs that must be fixed before consuming

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `All portal-relevant tables` | Read (via REST/Realtime) | RLS-gated per user role | High — everything changes |
| `v_mandate_scores` | Read (dashboard) | Broken JOINs being fixed | High — wait for fix |
| `v_mandate_pipeline` | Read (pipeline view) | Broken JOINs being fixed | High — wait for fix |
| `v_pipeline_rankings` | Read (rankings) | Depends on v_mandate_scores | High |
| `profiles` | Read (user profile) | 3 records; tied to auth.users | High — auth integration |
| `client_accounts` | Read (client data) | 8 records; client portal data | High |
| `client_mandate_access` | Read (access gating) | 0 rows; currently empty | High — blocks client portal |
| `candidate_mandate_links` | Read (candidate links) | 0 rows; currently empty | High — blocks candidate portal |
| `vista_b2c_leads` | Read/Write (B2C signup) | 0 rows; B2C portal | High |
| `workshops` | Read (workshop data) | 0 rows; workshop portal | Medium |
| `workshop_participants` | Read (participants) | 0 rows; workshop portal | Medium |

---

## 3. Workflow Changes Required

### 3.1 Frontend data fetching

| Before | After | Action Required |
|--------|-------|-----------------|
| Frontend data fetching (current ad-hoc) | Supabase REST API + RLS + views | Refactor data layer to use Supabase client with auto-RLS; use views for complex queries |

### 3.2 Auth

| Before | After | Action Required |
|--------|-------|-----------------|
| Auth (custom or none) | Supabase Auth + JWT + RLS row-level gating | Implement Supabase Auth; all data access automatically scoped by RLS |

### 3.3 Real-time updates

| Before | After | Action Required |
|--------|-------|-----------------|
| Real-time updates (polling or none) | Supabase Realtime subscriptions | Replace polling with realtime channels for pipeline, dashboards, chat |

### 3.4 File uploads

| Before | After | Action Required |
|--------|-------|-----------------|
| File uploads (S3 or similar) | Supabase Storage (avatars, documents) | Migrate file storage to Supabase Storage with RLS policy-gated access |

### 3.5 Dashboard components

| Before | After | Action Required |
|--------|-------|-----------------|
| Dashboard components | Consume from official views, not raw tables | Build dashboard widgets on top of `v_mandate_scores`, `v_mandate_pipeline` etc. |

### 3.6 Portal deployment

| Before | After | Action Required |
|--------|-------|-----------------|
| Portal deployment (Vercel) | Same deployment pattern | Add Supabase env vars; edge runtime compatible |

---

## 4. Phase Dependencies

| Build Phase | What It Means for JAMES | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS policies, view fixes, auth infrastructure | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | REST endpoints, Realtime channels | 🔴 **High** |
| **Phase 03: Design System & Frontend** | Design tokens, component library, charting | 🔴 **High** |
| **Phase 04: Internal Portal** | Mandate mgmt, pipeline Kanban, dashboards | 🔴 **High** |
| **Phase 05: Client & Consultant Portals** | Client portal, consultant views | 🔴 **High** |
| **Phase 06: B2C Portal & Commerce** | B2C landing, assessment flow, Stripe | 🔴 **High** |
| **Phase 10: Launch Readiness** | Performance optimization, security hardening | 🟡 **Medium** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| 20+ tables have RLS but zero policies -> frontend shows empty state | 🔴 High | Coordinate with Phase 01 to prioritize RLS policies for portal-critical tables |
| Broken views (`v_mandate_scores`, `v_mandate_pipeline`) -> dashboards wrong | 🔴 High | Do NOT build dashboard components on these views until fix is confirmed |
| client_mandate_access = 0 rows -> client portal shows nothing | 🔴 High | Client portal requires data population + RLS policies before it can ship |
| RLS policy bugs -> data leakage across clients/candidates | 🔴 Critical | All RLS policies must be security-audited before any external-facing portal goes live |
| Realtime performance at scale | 🟡 Medium | Test realtime channel limits; use database changes + RPC for complex operations |

---

## 6. Action Items (JAMES Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Set up Supabase Auth integration in frontend | P0 | Phase 01 |
| 2 | Define portal-critical tables list; push for RLS policy priority | P0 | Phase 01 |
| 3 | Build data access layer on Supabase REST/Realtime + RLS | P1 | Phase 02 |
| 4 | Build design system (Phase 03) — components, tokens, charts | P1 | Phase 03 |
| 5 | Build Internal Portal (Phase 04) — mandate mgmt, pipeline, dashboards | P1 | Phase 04 |
| 6 | Validate fixed views before building dashboard components | P1 | Phase 01 |
| 7 | Build Client & Consultant Portals (Phase 05) | P2 | Phase 05 |
| 8 | Build B2C Portal (Phase 06) — Stripe + assessment flow | P2 | Phase 06 |
| 9 | Security audit of all RLS policies before portal launches | P2 | Phase 04/05/06 |

---

## 7. Key Tables to Monitor

- `v_mandate_scores`
- `v_mandate_pipeline`
- `v_pipeline_rankings`
- `profiles`
- `client_mandate_access`
- `candidate_mandate_links`
- `vista_b2c_leads`
- `auth.users (via Supabase Auth)`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
