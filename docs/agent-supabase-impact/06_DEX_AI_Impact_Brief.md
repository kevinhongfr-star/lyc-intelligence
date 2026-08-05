# DEX_AI — Supabase Backend Impact Brief

**Agent:** DEX_AI  
**Role:** Document Processing & Assessment Platform  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

DEX AI is the commercial assessment platform — the most deeply integrated agent with Supabase. It owns the assessment pipeline, candidate scoring, and B2C user journey. **Key changes:**
- Core platform: DEX AI's data layer IS the Supabase backend — 100+ tables under its domain
- Assessment pipeline: `candidate_assessments`, `dex_chat_sessions`, `dex_chat_context`, `credit_consumption`
- B2C self-service: `vista_b2c_leads`, `vista_b2c_events`, `vista_b2c_conversions` (all currently empty — greenfield)
- Credit system: `credits`, `credit_ledger`, `credit_transactions`, `user_credits`, `candidate_credits`
- Public policies on core tables (contacts, mandates, candidates_pipeline) are being revoked — DEX AI must use authenticated edge functions

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `contacts` | Read/Write (candidate data) | 68K master records; RLS tightened | High — core data |
| `candidates_pipeline` | Read/Write (pipeline) | 385 records; scoring pipeline | High — core workflow |
| `candidate_assessments` | Read/Write (assessments) | 0 rows; greenfield build | High — core product |
| `candidates` | Read/Write (candidate records) | 44 records | Medium |
| `dex_user_profiles` | Read/Write (user profiles) | 0 rows; B2C user base | High — core product |
| `dex_chat_sessions` | Read/Write (chat sessions) | ~0 rows; chat history | High — core product |
| `dex_chat_context` | Read/Write (chat context) | ~0 rows; context window | Medium |
| `dex_credit_consumption` | Read/Write (credit usage) | ~0 rows; metering | High — billing |
| `vista_b2c_leads` | Read/Write (B2C leads) | 0 rows; B2C funnel top | Medium — new segment |
| `vista_b2c_events` | Write (activity events) | 0 rows; event tracking | Low |
| `vista_b2c_conversions` | Read/Write (B2B conversions) | 0 rows; conversion tracking | Medium |
| `vista_dex_subscriptions` | Read/Write (subscriptions) | 0 rows; subscription mgmt | High — revenue |
| `credits` | Read (credit defs) | ~10 records | Low |
| `credit_ledger` | Read/Write (transactions) | ~10+ records | High — billing |
| `credit_transactions` | Read/Write (tx log) | ~10 records | Medium |
| `credit_packages` | Read (package defs) | 0 rows; product packaging | Medium |
| `user_credits` | Read/Write (user balances) | ~10 users | High |
| `candidate_credits` | Read/Write (candidate credits) | ~0 records | Medium |
| `scoring_config` | Read (scoring weights) | 9 records; scoring rules | High — affects all scoring |
| `ai_generations` | Write (generation log) | 16 records; audit trail | Low |

---

## 3. Workflow Changes Required

### 3.1 CV/document processing

| Before | After | Action Required |
|--------|-------|-----------------|
| CV/document processing | Same flow; data persists to `candidate_assessments` + `contacts` | Ensure all assessment outputs write to Supabase, not just Notion/files |

### 3.2 B2C user registration & auth

| Before | After | Action Required |
|--------|-------|-----------------|
| B2C user registration & auth | New: `dex_user_profiles` + Supabase Auth + RLS | Build registration flow with Supabase Auth; link to `vista_b2c_leads` |

### 3.3 Credit system & metering

| Before | After | Action Required |
|--------|-------|-----------------|
| Credit system & metering | New: `credit_ledger` + `dex_credit_consumption` + `user_credits` | Implement credit consumption tracking via Edge Functions, not client-side |

### 3.4 Assessment delivery

| Before | After | Action Required |
|--------|-------|-----------------|
| Assessment delivery | From email/file delivery to portal-based + `candidate_assessments` | Migrate assessment output to structured table; portal consumes from there |

### 3.5 TRIDENT/Dex scoring

| Before | After | Action Required |
|--------|-------|-----------------|
| TRIDENT/Dex scoring | `scoring_config` as single source of truth for weights | All scoring agents read from `scoring_config`, not hardcoded values |

### 3.6 Stripe / subscription billing

| Before | After | Action Required |
|--------|-------|-----------------|
| Stripe / subscription billing | `vista_dex_subscriptions` + `credit_packages` + `credit_ledger` | Stripe webhook writes subscription state to Supabase; credit ledger updates |

---

## 4. Phase Dependencies

| Build Phase | What It Means for DEX_AI | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS tightened, public access revoked, view fixes | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | API endpoints for assessments, chat, credits | 🔴 **High** |
| **Phase 06: B2C Portal & Commerce** | B2C landing, assessment flow, Stripe, subscriptions | 🔴 **High** |
| **Phase 07: Report Engine** | Automated assessment report generation | 🔴 **High** |
| **Phase 08: NEXUS AI** | RAG, chat interface, proactive AI | 🟡 **Medium** |
| **Phase 09: Advanced Features** | Intelligent matching, pipeline automation | 🟡 **Medium** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Public table access revoked -> existing DEX AI integrations break | 🔴 High | Audit all DEX AI Supabase connections; switch to authenticated edge functions |
| RLS policies must prevent cross-candidate data leakage | 🔴 Critical | Strict RLS on `candidate_assessments`, `dex_chat_sessions` — users only see own data |
| Credit system integrity: no client-side credit manipulation | 🔴 Critical | All credit consumption must go through Edge Functions with server-side validation |
| scoring_config changes cascade to all assessments | 🔴 High | Version scoring config; never mutate in-place — always new version + audit log |
| B2C portal (Phase 06) requires full auth + RLS before go-live | 🔴 High | P0 security: no B2C go-live without comprehensive RLS + penetration test |

---

## 6. Action Items (DEX_AI Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Audit all DEX AI Supabase connections for anon key usage | P0 | Phase 01 |
| 2 | Migrate all client-side writes to Edge Functions | P0 | Phase 01 |
| 3 | Implement RLS policies for `dex_user_profiles`, `dex_chat_sessions`, `candidate_assessments` | P0 | Phase 01 |
| 4 | Build credit system: `credit_ledger` + consumption tracking via Edge Function | P1 | Phase 02 |
| 5 | Migrate scoring weights to `scoring_config` as single source of truth | P1 | Phase 02 |
| 6 | Set up Stripe webhook -> `vista_dex_subscriptions` + credit top-up | P1 | Phase 06 |
| 7 | Integrate assessment output with Report Engine (Phase 07) | P2 | Phase 07 |
| 8 | Plan B2C portal go-live security audit | P2 | Phase 06 |

---

## 7. Key Tables to Monitor

- `contacts`
- `candidates_pipeline`
- `candidate_assessments`
- `dex_user_profiles`
- `dex_chat_sessions`
- `credit_ledger`
- `vista_dex_subscriptions`
- `scoring_config`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
