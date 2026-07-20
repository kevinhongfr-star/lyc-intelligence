# 🔴 Priority Directive — Trae Build Queue

**Date:** 2026-07-20  
**From:** NEXUS (PM)  
**To:** Trae

---

## STOP: Tech Debt (#25 td11/td12) — Defer

Trae's latest batch (td7-td10) is merged and clean. But td11/td12 are **low priority** and should be deferred.

---

## DO THIS NEXT — In Priority Order

### 🔴 #1: Issue #3 — RLS Policies (CRITICAL SECURITY BLOCKER)

**Why:** 57 tables with ZERO row-level security. Any authenticated user can read/write ANY table. This is a data leak waiting to happen.

**What to build:**
- New migration file: `rls_policies.sql`
- RLS policy for every table in `master_migration.sql`
- Role-based access: `admin`, `consultant`, `client`, `candidate`, `council_member`, `student`
- Spec reference: [`specs/v2/02_Supabase_Backend_Architecture.md`](./specs/v2/02_Supabase_Backend_Architecture.md) — see RLS section

**Expected output:**
- Migration file with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all 57 tables
- `CREATE POLICY` statements per table per role
- Test: verify a `candidate` user cannot read `client_mandates` table

**Estimated effort:** 1-2 hours (one SQL statement per table)

---

### 🔴 #2: Issue #6 — Stripe Integration & Checkout

**Why:** No revenue path. Checkout routes exist but aren't wired to real Stripe keys or webhooks.

**What to build:**
- Wire Stripe SDK with real API keys (from env vars)
- Implement checkout session creation
- Implement webhook handler for payment events
- Connect to credit system (#7)

**Spec reference:** [`specs/v2/08_Commerce_Layer_Spec.md`](./specs/v2/08_Commerce_Layer_Spec.md)

---

### 🔴 #3: Issue #4 — Edge Functions & AI Routing

**Why:** DeepSeek API integration not wired. Nexus assistant, scoring, chat — all dead without this.

**What to build:**
- Edge function wrappers for DeepSeek API calls
- AI routing layer (chat, scoring, enrichment)
- Error handling and fallback logic

**Spec reference:** [`specs/v2/02_Supabase_Backend_Architecture.md`](./specs/v2/02_Supabase_Backend_Architecture.md) — see Edge Functions section

---

### 🔴 #4: Issue #15 — Notification System (Cross-Portal)

**Why:** No in-app or email notifications. Users get zero feedback on actions.

**What to build:**
- In-app notification service (real-time or polling)
- Email notification integration (transactional emails)
- Notification preferences UI (already partially built in td7)
- Event triggers for key actions

**Spec reference:** [`specs/v2/03_UX_Behavioral_Mechanics.md`](./specs/v2/03_UX_Behavioral_Mechanics.md) + [`specs/v2/19_Email_Admin_Analytics_Spec.md`](./specs/v2/19_Email_Admin_Analytics_Spec.md)

---

## ✅ Already Done (Can Close Manually)

These were completed in Trae's Jul 20 push:

- ✅ #26 CI/CD Pipeline
- ✅ #28 Error Monitoring (Sentry)
- ✅ #29 Load Testing (k6)
- ✅ #33 Design System (8 components)
- ✅ #36 Email Templates
- ✅ #37 Admin Console

---

## 🟡 After the 🔴 Critical Issues

Then tackle go-live prerequisites:
- #34 Public Marketing Site (real copy + images)
- #35 Activation Flows (onboarding wizards)
- #27 Custom Domain
- #30 Legal Pages (GDPR review)

---

## Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 **#3** | RLS Policies | 1-2h | **Security blocker** |
| 🔴 **#6** | Stripe Integration | 4-6h | **Revenue blocker** |
| 🔴 **#4** | Edge Functions + AI | 3-4h | **Feature blocker** |
| 🔴 **#15** | Notifications | 3-4h | **UX blocker** |

**Total estimated effort:** 11-16 hours

Tech debt can wait. Ship security + revenue first.

---

*NEXUS — PM for LYC Intelligence (DEX AI)*
