# Phase 2: API Layer & Data Infrastructure

**Goal:** Build the middleware API layer between Supabase and frontend portals. Establish RESTful endpoints, real-time subscriptions, caching, and the data contract layer that all portals will consume.

**Pre-requisites:** Phase 1 complete (auth + RLS + clean views).

**Gap Context:** No API middleware exists. Frontend currently connects to Supabase directly with anon key. No rate limiting, no request validation, no caching, no real-time subscriptions.

---

## Sprint 2.1 — Core API Framework

| # | Ticket |
|---|--------|
| 2.1.01 | Set up Next.js API routes structure (/api/v1/) with versioning |
| 2.1.02 | Create API authentication middleware — JWT validation from Supabase auth |
| 2.1.03 | Create API role-check middleware — extract user_type, enforce access |
| 2.1.04 | Create API error handling framework — standardized error responses |
| 2.1.05 | Create API request validation middleware — Zod schema validation |
| 2.1.06 | Create API rate limiting middleware — per-user, per-endpoint limits |
| 2.1.07 | Create API response caching layer — in-memory cache with TTL |
| 2.1.08 | Create API logging middleware — request/response with timing |
| 2.1.09 | Create API health check endpoint (/api/v1/health) |
| 2.1.10 | Create Supabase server client — service_role for admin operations |
| 2.1.11 | Create Supabase auth client — user-scoped operations |
| 2.1.12 | Create api/_lib/auth.ts — token extraction, user resolution |
| 2.1.13 | Create api/_lib/validators.ts — shared Zod schemas |
| 2.1.14 | Create api/_lib/response.ts — standardized response builder |
| 2.1.15 | Create api/_lib/cache.ts — Upstash cache wrapper |
| 2.1.16 | Create api/_lib/rate-limit.ts — sliding window rate limiter |
| 2.1.17 | Create api/_lib/audit.ts — audit log writer for mutations |
| 2.1.18 | Set up API documentation — auto-generated OpenAPI spec |
| 2.1.19 | Create API test framework — supertest + jest setup |
| 2.1.20 | Create API CI pipeline — lint, type-check, test on PR |
| 2.1.21 | Create environment variable management — dev/staging/prod separation |
| 2.1.22 | Create API CORS configuration — portal-specific allowed origins |
| 2.1.23 | Create API versioning strategy — v1/v2 coexistence plan |
| 2.1.24 | Create API error monitoring — Sentry integration for API errors |
| 2.1.25 | API framework integration test — health, auth, rate-limit, cache verified |

## Sprint 2.2 — Contact & Mandate APIs

| # | Ticket |
|---|--------|
| 2.2.01 | GET /api/v1/contacts — paginated contact list with search/filter |
| 2.2.02 | GET /api/v1/contacts/:id — single contact with full details |
| 2.2.03 | POST /api/v1/contacts — create contact with validation |
| 2.2.04 | PATCH /api/v1/contacts/:id — update contact with audit trail |
| 2.2.05 | DELETE /api/v1/contacts/:id — soft delete, admin only |
| 2.2.06 | GET /api/v1/contacts/:id/pipeline — candidate pipeline entries |
| 2.2.07 | GET /api/v1/contacts/:id/assessments — assessment history |
| 2.2.08 | GET /api/v1/contacts/:id/outreach — outreach history |
| 2.2.09 | GET /api/v1/contacts/search — full-text search across attributes |
| 2.2.10 | GET /api/v1/mandates — paginated mandate list with filters |
| 2.2.11 | GET /api/v1/mandates/:id — mandate with candidates, client, consultant |
| 2.2.12 | POST /api/v1/mandates — create mandate |
| 2.2.13 | PATCH /api/v1/mandates/:id — update mandate status/priority |
| 2.2.14 | GET /api/v1/mandates/:id/candidates — pipeline candidates with scores |
| 2.2.15 | GET /api/v1/mandates/:id/timeline — SLA timeline and milestones |
| 2.2.16 | GET /api/v1/mandates/:id/feedback — client feedback |
| 2.2.17 | GET /api/v1/mandates/:id/proposals — linked proposals |
| 2.2.18 | GET /api/v1/pipeline — unified pipeline view |
| 2.2.19 | POST /api/v1/pipeline/link — link candidate to mandate |
| 2.2.20 | PATCH /api/v1/pipeline/:id/stage — advance candidate stage |
| 2.2.21 | GET /api/v1/pipeline/stats — funnel metrics |
| 2.2.22 | GET /api/v1/consultants — list with workload and performance |
| 2.2.23 | GET /api/v1/consultants/:id/mandates — consultant's mandates |
| 2.2.24 | GET /api/v1/consultants/:id/performance — KPIs |
| 2.2.25 | Contact & Mandate API integration tests |

## Sprint 2.3 — Vista BD & Campaign APIs

| # | Ticket |
|---|--------|
| 2.3.01 | GET /api/v1/vista/contacts — paginated vista contacts with BD filters |
| 2.3.02 | GET /api/v1/vista/contacts/:id — contact with engagement scores |
| 2.3.03 | POST /api/v1/vista/contacts — create vista contact |
| 2.3.04 | PATCH /api/v1/vista/contacts/:id — update engagement tier/scores |
| 2.3.05 | GET /api/v1/vista/contacts/:id/signals — intelligence signals |
| 2.3.06 | GET /api/v1/vista/contacts/:id/brief — AI-generated brief |
| 2.3.07 | GET /api/v1/vista/contacts/:id/services — engaged services |
| 2.3.08 | GET /api/v1/vista/encirclement — company-level aggregation |
| 2.3.09 | GET /api/v1/vista/pipeline — BD pipeline summary |
| 2.3.10 | GET /api/v1/vista/top-contacts — top ranked by composite score |
| 2.3.11 | GET /api/v1/campaigns — list campaigns with enrollment counts |
| 2.3.12 | GET /api/v1/campaigns/:id — campaign with contacts and activities |
| 2.3.13 | POST /api/v1/campaigns — create campaign |
| 2.3.14 | PATCH /api/v1/campaigns/:id — update campaign status |
| 2.3.15 | GET /api/v1/campaigns/:id/contacts — enrolled contacts |
| 2.3.16 | POST /api/v1/campaigns/:id/enroll — bulk enroll contacts |
| 2.3.17 | PATCH /api/v1/campaign-contacts/:id/status — update status |
| 2.3.18 | GET /api/v1/outreach/activity — outreach activity log |
| 2.3.19 | POST /api/v1/outreach/attempts — log outreach attempt |
| 2.3.20 | GET /api/v1/signals — intelligence signals feed |
| 2.3.21 | GET /api/v1/signals/:id — signal detail with contacts |
| 2.3.22 | GET /api/v1/stains — stain data for contacts/companies |
| 2.3.23 | GET /api/v1/vista/dashboard — aggregated BD metrics |
| 2.3.24 | GET /api/v1/campaigns/dashboard — campaign analytics |
| 2.3.25 | Vista & Campaign API integration tests |

## Sprint 2.4 — Portal-Specific APIs (Client, Candidate, B2C, Council)

| # | Ticket |
|---|--------|
| 2.4.01 | GET /api/v1/client/dashboard — client portal home data |
| 2.4.02 | GET /api/v1/client/mandates — mandates accessible to client |
| 2.4.03 | GET /api/v1/client/mandates/:id — mandate detail with presented candidates |
| 2.4.04 | GET /api/v1/client/candidates/:id — candidate profile (presented only) |
| 2.4.05 | POST /api/v1/client/feedback — submit feedback on mandate/candidate |
| 2.4.06 | GET /api/v1/client/meetings — upcoming and past meetings |
| 2.4.07 | POST /api/v1/client/meetings/book — book a meeting slot |
| 2.4.08 | GET /api/v1/client/proposals — proposals for client's mandates |
| 2.4.09 | GET /api/v1/client/reports — intelligence reports for client |
| 2.4.10 | GET /api/v1/candidate/dashboard — candidate home (matched mandates, scores) |
| 2.4.11 | GET /api/v1/candidate/mandates — mandates linked to candidate |
| 2.4.12 | GET /api/v1/candidate/mandates/:id — mandate detail (no client info) |
| 2.4.13 | GET /api/v1/candidate/assessments — assessment results and history |
| 2.4.14 | POST /api/v1/candidate/assessments/start — begin assessment |
| 2.4.15 | POST /api/v1/candidate/assessments/:id/submit — submit assessment |
| 2.4.16 | GET /api/v1/candidate/prep — interview prep progress |
| 2.4.17 | GET /api/v1/candidate/profile — own profile for editing |
| 2.4.18 | PATCH /api/v1/candidate/profile — update profile fields |
| 2.4.19 | GET /api/v1/b2c/dashboard — B2C user home (tier, credits, plan) |
| 2.4.20 | POST /api/v1/b2c/assessments/start — begin B2C assessment |
| 2.4.21 | POST /api/v1/b2c/assessments/:id/submit — submit B2C assessment |
| 2.4.22 | GET /api/v1/b2c/credits — credit balance and history |
| 2.4.23 | POST /api/v1/b2c/credits/purchase — initiate credit purchase |
| 2.4.24 | GET /api/v1/council/dashboard — council member home |
| 2.4.25 | Portal API integration tests — verify data isolation per user type |

## Sprint 2.5 — Real-Time Subscriptions & Data Sync

| # | Ticket |
|---|--------|
| 2.5.01 | Set up Supabase Realtime channels — per portal (internal, client, candidate, b2c) |
| 2.5.02 | Real-time subscription for candidates_pipeline — notify on stage changes |
| 2.5.03 | Real-time subscription for mandates — notify on status/priority changes |
| 2.5.04 | Real-time subscription for tasks — notify on assignment/update |
| 2.5.05 | Real-time subscription for notifications — live push to portal |
| 2.5.06 | Real-time subscription for client_feedback — notify consultants |
| 2.5.07 | Real-time subscription for candidate_mandate_links — notify candidate |
| 2.5.08 | Real-time subscription for vista_signals — live signal feed |
| 2.5.09 | Real-time subscription for campaign_contacts — enrollment status |
| 2.5.10 | Build WebSocket connection manager — connect, disconnect, reconnect, heartbeat |
| 2.5.11 | Build event broadcaster — server-side push to subscribed clients |
| 2.5.12 | Build optimistic update handler — instant UI feedback pattern |
| 2.5.13 | Build conflict resolution handler — server wins with client notification |
| 2.5.14 | Create fn_broadcast_mandate_update(mandate_id) |
| 2.5.15 | Create fn_broadcast_pipeline_change(contact_id, mandate_id) |
| 2.5.16 | Create fn_broadcast_notification(user_id, notification) |
| 2.5.17 | Create real-time connection health monitor |
| 2.5.18 | Create reconnection strategy — exponential backoff with state re-sync |
| 2.5.19 | Create offline queue — buffer mutations during disconnect |
| 2.5.20 | Create real-time analytics dashboard data — live-updating charts |
| 2.5.21 | Load test real-time subscriptions — 100 concurrent users |
| 2.5.22 | Create real-time subscription management UI — admin view |
| 2.5.23 | Create real-time event log — persistent log for debugging |
| 2.5.24 | Real-time E2E test — DB change → portal UI update |
| 2.5.25 | Phase 2 completion verification — all APIs tested, real-time working |
