# Phase 10 Specification — Security Hardening & Go-Live

| Field | Value |
|---|---|
| **Phase ID** | Phase 10 |
| **Phase Name** | Hardening & Go-Live |
| **Status** | Draft |
| **Est. Duration** | 4–5 weeks |
| **Est. Effort** | ~40–45 tickets (detailed breakdown: 42 tickets — see note) |
| **Depends On** | Phase 9 (feature freeze, all core functionality complete) |
| **Blocks** | Production launch, public availability |
| **Primary Outcome** | Production-ready system with security audit sign-off, performance baselines, monitoring, data migration complete, and go-live executed |
| **Owner** | Engineering Lead |
| **Gatekeeper** | Kevin (final go/no-go) |

---

## Why This Phase Exists

All previous phases have been focused on *building* features. Phase 10 is the bridge between "it works on my machine / in staging" and "it runs reliably for real users in production, with security, compliance, and operational guardrails in place."

This phase exists to answer six questions before we flip the switch:

1. **Is it secure?** — Can a bad actor break in, exfiltrate data, or escalate privileges?
2. **Is it fast?** — Does it hold up under real user load without degrading?
3. **Is it observable?** — Will we know when something breaks, before users tell us?
4. **Is the data safe?** — Can we migrate from Feishu Sheets to Supabase without data loss, and roll back if we need to?
5. **Is the infrastructure production-grade?** — Domain, SSL, backups, CI/CD, staging/prod isolation, production-tier database, transactional email.
6. **Can we accept money?** — Payment methods (Stripe, Alipay, WeChat Pay, PayPal), Stripe production go-live, tax and business registration.
7. **Are we legally compliant?** — Terms, privacy, refund, cookie policies; GDPR/PIPL consent; ICP considerations for China.
8. **Are we ready to support real users?** — Onboarding docs, support process, launch checklist, post-launch monitoring.

**If we skip this phase**, we ship a feature-complete product that is insecure, slow under load, invisible when it breaks, and unsupported. That is worse than not launching at all.

---

## Readiness & Gating Metrics

These metrics define when Phase 10 is *done* and the system is cleared for go-live.

| Metric | Target | Measurement Method | Gate? |
|---|---|---|---|
| RLS coverage | 100% of tables have RLS enabled with explicit policies | Supabase audit query | 🔴 Blocker |
| OWASP Top 10 penetration test | 0 Critical / 0 High findings | External or internal pentest report | 🔴 Blocker |
| Auth hardening | Password reset, email verification, session revocation all working | Manual + automated test | 🔴 Blocker |
| Rate limiting in place | All public endpoints rate-limited (login, API, search) | Load test + config review | 🟡 Must-have |
| Lighthouse performance score | ≥ 90 on mobile & desktop | Lighthouse CI | 🟡 Must-have |
| API p95 latency | < 300ms for core endpoints | Load test (k6 / artillery) | 🟡 Must-have |
| Sentry error rate | < 0.5% of transactions produce errors | Sentry dashboard | 🟡 Must-have |
| Uptime monitoring | All critical endpoints monitored with < 5 min alerting | UptimeRobot / BetterStack | 🟡 Must-have |
| Data migration fidelity | 100% row count match, 0 schema validation errors | Migration validation script | 🔴 Blocker |
| Backup & restore verified | Full DB backup + restore drill completed successfully | Manual restore test | 🔴 Blocker |
| Staging / prod isolation verified | No cross-environment data leakage | Infra audit | 🟡 Must-have |
| CI/CD pipeline green | All checks pass on main, deploy to prod is one-click | Vercel / GitHub Actions | 🟡 Must-have |
| Legal/compliance docs live | Privacy policy, terms, refund policy, cookie policy all deployed & linked | Content audit | 🔴 Blocker |
| Cookie consent system | GDPR + PIPL compliant, geo-detection, consent storage | Manual test + audit | 🟡 Must-have |
| Transactional email deliverability | DKIM + SPF + DMARC configured, inbox rate > 95% | Mail-tester / GlockApps | 🟡 Must-have |
| Stripe production verified | Account verified, live keys active, webhooks confirmed | Stripe dashboard + live mode test | 🔴 Blocker |
| Multi-payment working | Cards, Apple Pay, Google Pay, Alipay, WeChat Pay, PayPal all functional | End-to-end payment test per method | 🟡 Must-have |
| Production domain verified | lyc-intelligence.app subpath, SSL, HSTS, DNS propagation | Manual + SSL Labs test | 🔴 Blocker |
| Go/no-go checklist complete | All items signed off | Checklist review with gatekeeper | 🔴 Blocker |

---

## Milestones & Ticket Breakdown

### M1 — Security Audit & Hardening (Week 1)

Goal: Close every known security gap before performance or migration work begins. Security debt compounds.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1001 | RLS Policy Audit & Fix | Audit every Supabase table for RLS enablement and policy correctness. Fix P0 RLS exposure (currently known: some tables accessible to anon role). Write SQL test suite that verifies RLS for each role (anon, authenticated, admin). | 12 | P0 |
| T-1002 | Input Validation & Sanitization | Audit all API routes and form inputs. Add Zod/valibot schemas to every endpoint. Reject invalid input early with 400. Ensure no SQL injection, XSS, or command injection vectors. | 10 | P0 |
| T-1003 | Rate Limiting Implementation | Add rate limiting to all public endpoints: auth (login/signup/password-reset), search/recommendation APIs, file uploads. Use Upstash Redis or Vercel KV. Limits: 10 req/min on auth, 60 req/min on API per user. | 8 | P1 |
| T-1004 | Auth Hardening | Enforce password strength rules. Add email verification on signup. Add session revocation on password change. Add brute-force protection (account lockout after 10 failed attempts). Add 2FA scaffolding (TOTP, admin-only first). | 14 | P0 |
| T-1005 | Penetration Testing | Run structured pentest against staging: OWASP Top 10 checklist, auth bypass attempts, IDOR testing, RLS bypass via direct API calls, CSRF checks. Document all findings in a report with severity ratings. | 10 | P1 |
| T-1006 | Pentest Remediation | Fix all Critical and High findings from T-1005. Re-test. Medium findings go to backlog unless exploitable in prod context. | 8 | P1 |

**M1 Subtotal:** 6 tickets, ~62 hours

---

### M2 — Performance Optimization (Week 1–2)

Goal: The product must feel fast under real-world load, not just with a single user in dev.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1007 | Database Indexing Audit | Run `pg_stat_statements` against staging with realistic data volume. Identify slow queries. Add missing indexes on frequently filtered/joined columns. Verify index usage with `EXPLAIN ANALYZE`. | 8 | P1 |
| T-1008 | Query Optimization (incl. v_mandate_scores JOIN Bug) | Rewrite N+1 patterns. Fix the known **v_mandate_scores / v_mandate_pipeline JOIN bug** — currently produces incorrect row multiplication. Materialize expensive views or replace with properly joined queries. Validate correctness before/after. | 12 | P0 |
| T-1009 | Caching Strategy | Implement Redis/Vercel KV caching for expensive read paths: search results, recommendation computations, public profile pages. Stale-while-revalidate for non-critical data. Cache invalidation on write. | 10 | P1 |
| T-1010 | CDN & Asset Optimization | Move all static assets to CDN. Optimize images (WebP/AVIF, responsive sizes). Lazy-load below-fold content. Audit bundle size with `@next/bundle-analyzer`, split large chunks, tree-shake unused deps. Target: < 200KB JS initial load. | 8 | P1 |
| T-1011 | Load Testing | Write k6/artillery load test scripts simulating 50, 100, 200 concurrent users across key flows (login, search, view profile, save candidate). Run against staging. Document p50/p95/p99 latency and error rates. | 8 | P1 |
| T-1012 | Load Test Remediation | Fix bottlenecks identified in T-1011 until p95 API latency < 300ms and error rate < 0.5% at target load. Re-run load test to confirm. | 8 | P1 |

**M2 Subtotal:** 6 tickets, ~54 hours

---

### M3 — Monitoring & Observability (Week 2)

Goal: When something breaks in production, we find out first — not from a user email.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1013 | Sentry Error Tracking | Integrate Sentry across frontend and API routes. Configure source maps. Set up environment filtering (staging vs prod). Tag errors with user ID, phase, route. Configure Slack alerts for new Critical/High errors. | 6 | P1 |
| T-1014 | Structured Logging | Replace `console.log` with structured logging (Pino or similar). All logs include: timestamp, level, request ID, user ID, route, duration. Logs shipped to log aggregator (Better Stack / Datadog / Logtail). | 6 | P2 |
| T-1015 | Metrics & Dashboards | Define core business + performance metrics: DAU, signups, search volume, API latency percentiles, error rate, DB query time. Build dashboard (Grafana or Supabase + custom). Weekly reporting cadence. | 8 | P2 |
| T-1016 | Uptime Monitoring | Set up uptime monitoring for all critical endpoints: homepage, login, API health check, Supabase connection. 1-minute check interval. Alert to Slack + email on 2 consecutive failures. | 3 | P1 |
| T-1017 | Alerting & On-Call | Define alert severity matrix (P0/P1/P2). Set up on-call rotation. Configure escalation paths. Document runbook for common alerts (DB down, API 5xx spike, disk full). | 5 | P2 |

**M3 Subtotal:** 5 tickets, ~28 hours

---

### M4 — Data Migration & Cutover (Week 2–3)

Goal: Move source-of-truth data from Feishu Sheets to Supabase with zero data loss, validated cutover, and a rollback path.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1018 | Migration Scripts (Feishu → Supabase) | Write migration scripts that pull all candidate data, mandate data, and configuration from Feishu Sheets/Base and insert into Supabase according to the production data model. Idempotent — can be re-run. | 12 | P0 |
| T-1019 | Data Validation & Reconciliation | Write validation suite: row count checks, schema validation, spot-checks (random 100 records compared manually), referential integrity checks, duplicate detection. Produce a diff report between source and target. | 8 | P0 |
| T-1020 | Cutover Plan | Document step-by-step cutover procedure: freeze writes on Feishu, run final migration, run validation, switch app to read from Supabase, smoke test, announce go. Estimate downtime window (target: < 30 min). | 4 | P1 |
| T-1021 | Rollback Plan | Document rollback procedure: if validation fails post-cutover, how to revert app to Feishu data source, communicate to users, re-sync after fix. Test rollback on staging before production cutover. | 4 | P1 |

**M4 Subtotal:** 4 tickets, ~28 hours

---

### M5 — Production Infrastructure (Week 3)

Goal: Infrastructure that can support real users, with proper environments, backups, and CI/CD.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1022 | Domain & SSL Setup | Configure production domain (e.g., app.dex-ai.com or equivalent). Set up DNS, SSL/TLS via Vercel managed certs. Verify HSTS, HTTPS redirect, mixed-content checks. | 3 | P1 |
| T-1023 | Backup & Disaster Recovery | Configure Supabase point-in-time recovery (PITR). Set up daily full backups + automated retention (30 days). Document restore procedure. Execute one full restore drill to staging and verify data integrity. | 6 | P0 |
| T-1024 | Staging / Production Split | Ensure clean separation of staging and prod environments: separate Supabase projects, separate Vercel projects, separate env vars, no shared data. Verify staging is an exact replica of prod infra. Add deployment badge to README. | 6 | P1 |
| T-1025 | CI/CD Pipeline | Set up GitHub Actions / Vercel pipeline: lint, type-check, unit tests, build, deploy to staging on PR merge, deploy to prod on tagged release. Require green CI before merge. Add preview deployments per PR. | 8 | P1 |
| T-1026 | Email Infrastructure & Deliverability | Set up transactional email provider (Resend / Postmark / SendGrid). Configure DKIM, SPF, DMARC records. Verify deliverability (mail-tester.com score ≥ 9/10). Implement email templates: welcome, password reset, verification, invite. Set up bounce/complaint handling. | 8 | P1 |
| T-1027 | Legal & Compliance | Create and deploy privacy policy, terms of service, cookie consent banner. Ensure consent banner is functional (stores preference, blocks non-essential cookies until accepted). Link in footer. Review with legal counsel if available. | 6 | P0 |

**M5 Subtotal:** 6 tickets, ~37 hours

---

### M6 — Go-Live Readiness & Launch (Week 3–4)

Goal: Cross the finish line with a plan, not a panic. Everyone knows what to do, and what "done" looks like.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1028 | Onboarding & User Documentation | Write user-facing onboarding docs: how to sign up, how to run first search, how to interpret results, FAQ. Host in-app (help center) or as Notion/wiki links from the app. Include video walkthrough if possible. | 8 | P1 |
| T-1029 | Support Process Setup | Define support channels (email / Slack / Intercom). Create support inbox. Write internal support runbook: common issues, escalation paths, SLA targets. Assign on-call support owner for launch week. | 4 | P2 |
| T-1030 | Launch Checklist | Final go-live checklist document: every task, who owns it, status, pre-launch / launch-day / post-launch sections. Reviewed and signed off by all stakeholders. | 2 | P1 |
| T-1031 | Post-Launch Monitoring Plan | Define first 72 hours post-launch monitoring protocol: who watches dashboards, how often we check Sentry, what triggers an all-hands, daily status email cadence. Pre-write status update templates. | 3 | P1 |
| T-1032 | Go / No-Go Meeting | Hold formal go/no-go review with all stakeholders. Walk through gating metrics. Document decision. If no-go, define blockers and reschedule. If go, confirm launch time and communication plan. | 2 | P0 |

**M6 Subtotal:** 5 tickets, ~19 hours

---

### M7 — Production Infrastructure & Domain (Week 3–4)

Goal: Production-grade infrastructure at the domain, database, email, and CDN level — not just "works in prod" but "scales, is resilient, and has proper isolation." This milestone expands M5's baseline infra with production-tier upgrades and domain strategy.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1033 | Production Domain Setup | Configure Nexus to live at `lyc-intelligence.app` subpath (not a subdomain). Set up Vercel custom domain with path-based routing if needed. Configure DNS records, verify SSL/TLS, enable HSTS. Split environment variables cleanly across dev/staging/prod with documented ownership and rotation policy. | 6 | P0 |
| T-1034 | Supabase Production Tier Upgrade | Migrate Supabase project to production plan. Configure custom domain for Supabase Auth (`auth.lyc-intelligence.app`). Increase limits (DB size, API rate, auth MAUs, storage). Evaluate and set up read replica option for scaling read-heavy workloads. Validate all endpoints work post-upgrade. | 8 | P0 |
| T-1035 | Transactional Email Infrastructure | Set up Resend as transactional email provider. Configure domain authentication (SPF, DKIM, DMARC) for `@lyc-intelligence.app` with 100% alignment. Build email template system (React/HTML with MJML or similar). Migrate all transactional email touchpoints (welcome, password reset, verification, invites, receipts) from current solution. Set up bounce/complaint handling and suppressions. | 12 | P0 |
| T-1036 | Production Deployment Pipeline | Configure Vercel production branch and environment. Set up preview deployments per PR with automatic cleanup. Define and document rollback strategy (instant rollback via Vercel, database migration rollback plan). Establish environment variable management process (who can change, change log, audit trail). Create pre-deployment and post-deployment checklist. | 8 | P0 |
| T-1037 | CDN & Edge Optimization | Configure Vercel Edge Network for global delivery. Set up image optimization (Vercel Image Optimization, WebP/AVIF auto-conversion). Configure static asset caching with proper cache headers and invalidation strategy. Verify global edge latency across key regions (US, EU, APAC) and document baselines. | 6 | P1 |

**M7 Subtotal:** 5 tickets, ~40 hours

---

### M8 — Payment Expansion & Legal Compliance (Week 4–5)

Goal: Expand payment methods beyond Stripe cards, complete Stripe production go-live, and ship all legal/compliance infrastructure required for a real paid product in multiple jurisdictions.

| Ticket ID | Name | Description | Effort (hrs) | Priority |
|---|---|---|---|---|
| T-1038 | Multi-Payment Method Integration | Integrate Alipay and WeChat Pay via Stripe native support (both cross-border). Add PayPal as a separate payment provider. Build unified payment method selector UI with per-method failure handling and retry flows. Ensure Stripe-hosted Apple Pay and Google Pay continue working (already covered via Stripe standard integration). Implement payment method-specific error messages and recovery paths. | 16 | P1 |
| T-1039 | Stripe Production Go-Live | Complete Stripe account verification (business info, bank account, tax ID). Migrate from test keys to production keys with proper env-var isolation. Verify all webhook endpoints in live mode. Run end-to-end live mode testing: real charges, refunds, proration, disputes, failed payments. Configure tax ID and business registration details on all receipts and invoices. | 10 | P0 |
| T-1040 | Legal Pages Infrastructure | Build page components and routes for Terms of Service, Privacy Policy, Refund Policy, and Cookie Policy. Use markdown-based content system so the content/strategy team can update copy without engineering involvement. Content is placeholder at launch — board strategy team will provide final copy. Ensure pages are linked from footer, auth pages, and checkout flow. | 8 | P0 |
| T-1041 | Compliance & Consent System | Implement cookie consent banner that is both GDPR and PIPL compliant. Add geo-detection for regional compliance (EU vs China vs rest-of-world). Build consent preference storage (user-level + anonymous). Implement data subject request endpoints: "delete my data" and "export my data" with proper authentication and audit logging. | 12 | P1 |
| T-1042 | China-Specific Compliance | Create ICP filing placeholder structure (pages, routing, fallback) so that when ICP is approved, activation is configuration-only. Build content compliance review checklist for all user-facing copy. Document China CDN fallback considerations and acceleration strategy. Add regulatory notes for WeChat Pay and Alipay cross-border payment flows (disclosure requirements, refund windows). | 8 | P1 |

**M8 Subtotal:** 5 tickets, ~54 hours

---

### Total Phase 10 Summary

| Milestone | Tickets | Effort (hrs) |
|---|---|---|
| M1 — Security Audit & Hardening | 6 | 62 |
| M2 — Performance Optimization | 6 | 54 |
| M3 — Monitoring & Observability | 5 | 28 |
| M4 — Data Migration & Cutover | 4 | 28 |
| M5 — Production Infrastructure | 6 | 37 |
| M6 — Go-Live Readiness & Launch | 5 | 19 |
| M7 — Production Infrastructure & Domain | 5 | 40 |
| M8 — Payment Expansion & Legal Compliance | 5 | 54 |
| **Total** | **42** | **322** |

> Note: The detailed breakdown surfaces 42 tickets, higher than the initial 20–25 estimate. This is because several tasks that were bundled in the original estimate (e.g., pentest + remediation, load test + remediation, cutover + rollback) were split for clearer ownership and tracking, and because the scope has expanded to include payment infrastructure, production-tier upgrades, and expanded legal/compliance work. The original 6 milestones and 32 tickets remain intact; milestones M7 and M8 add 10 tickets covering production infra deepening, multi-payment support, and full legal compliance. The 4–5 week timeline accounts for this expanded scope while maintaining a sustainable engineering pace.

---

## Data Model & Infrastructure

### Production Data Model Additions / Changes

This phase does not introduce new *business* entities, but adds the operational schemas needed for production:

```sql
-- Audit logging (for security-relevant actions)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,          -- e.g. 'login', 'password_reset', 'data_export'
  entity_type text,              -- e.g. 'candidate', 'mandate'
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_log_user_id on public.audit_log(user_id);
create index if not exists idx_audit_log_action on public.audit_log(action);
create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);

-- Rate limiting state (can also live in Redis/KV; table as fallback/audit)
create table if not exists public.rate_limit_events (
  id bigserial primary key,
  identifier text not null,      -- ip or user_id
  endpoint text not null,
  created_at timestamptz default now()
);

create index if not exists idx_rate_limit_identifier on public.rate_limit_events(identifier, endpoint, created_at desc);

-- Known tech debt: v_mandate_scores / v_mandate_pipeline JOIN bug
-- The current view joins one-to-many incorrectly, multiplying scores by pipeline rows.
-- Fix strategy: aggregate pipeline data before joining, or split into separate views.
-- Ticket T-1008 owns this fix.
```

### Known Tech Debt to Resolve in This Phase

| Debt Item | Severity | Owning Ticket |
|---|---|---|
| `v_mandate_scores` / `v_mandate_pipeline` JOIN produces incorrect row multiplication | P0 | T-1008 |
| P0 RLS exposure — some tables accessible to anon role | P0 | T-1001 |
| Missing input validation on API routes (no Zod/schema gating) | P1 | T-1002 |
| No rate limiting on public endpoints | P1 | T-1003 |
| No structured error tracking (no Sentry) | P1 | T-1013 |
| Ad-hoc `console.log` instead of structured logging | P2 | T-1014 |

### Infrastructure Topology (Production)

```
                    ┌─────────────────────┐
                    │     DNS / CDN       │
                    │  (Vercel Edge +     │
                    │   Cloudflare/Bunny) │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Vercel Frontend   │
                    │  (Production +      │
                    │   Staging separate) │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼─────────┐ ┌────────▼─────────┐
│  Supabase (Prod)  │ │  Transactional │ │  Monitoring &     │ │  Payment & Legal  │
│  - PITR enabled   │ │  Email (Resend) │ │  Observability    │ │  - Stripe (cards +│
│  - Daily backups  │ │  - DKIM/SPF/DMARC │  (Sentry +       │ │    Apple/Google Pay)│
│  - RLS on all tbls│ │  - Bounce handlg│ │   UptimeRobot +   │ │  - Alipay/WeChat  │
│  - Audit logging  │ │  - Template sys │ │   Log aggregator) │ │  - PayPal         │
│  - Read replica   │ └────────────────┘ └───────────────────┘ │  - Legal pages    │
└───────────────────┘                                       │  - Consent system │
                                                            └───────────────────┘
```

### Environment Separation

| Layer | Staging | Production |
|---|---|---|
| Vercel Project | `dex-ai-staging` | `dex-ai-prod` |
| Domain | `staging.dex-ai.com` | `app.dex-ai.com` |
| Supabase Project | Separate project, seeded with anonymized test data | Separate project, production data only |
| Email Provider | Test mode (no real emails sent) | Production mode, real deliverability |
| Sentry | `staging` environment | `production` environment, with Slack alerts |
| CI/CD Trigger | Every PR → preview deploy; merge to `main` → staging | Tag `vX.Y.Z` → production |

---

## Component / Module Inventory

| Component | Module / Path | Phase 10 Work | Owner |
|---|---|---|---|
| Auth System | `app/(auth)/`, `supabase/rls/` | RLS audit, rate limiting, password policy, 2FA scaffolding, session revocation | Backend |
| API Routes | `app/api/`, `pages/api/` | Input validation (Zod), error boundaries, Sentry integration, rate limiting | Full-stack |
| Database | `supabase/migrations/` | Indexing audit, v_mandate_scores JOIN fix, audit log table, RLS policies | Backend |
| Frontend App | `app/` | Bundle size optimization, lazy loading, image optimization, error boundaries, Sentry FE integration | Frontend |
| Caching Layer | `lib/cache/` (new) | Redis/KV caching for expensive reads, cache invalidation strategy | Backend |
| Email Service | `lib/email/` (new) | Transactional email provider setup (Resend), template system, deliverability config, domain auth | Backend |
| Payment System | `app/(billing)/`, `lib/payments/` (new) | Multi-payment method integration (Stripe cards + Apple/Google Pay + Alipay + WeChat + PayPal), Stripe production go-live, webhook handling | Backend |
| Monitoring Stack | — | Sentry, structured logging, uptime monitoring, metrics dashboard, alerting | DevOps |
| Data Migration | `scripts/migrate-feishu/` (new) | Feishu → Supabase migration scripts, validation suite, cutover/rollback | Backend |
| CI/CD Pipeline | `.github/workflows/` | Lint, test, build, deploy pipeline with staging/prod split, preview deploys, rollback | DevOps |
| Legal / Compliance | `app/(legal)/` | Privacy policy, terms of service, refund policy, cookie policy (markdown-driven), cookie consent banner, data subject requests | Full-stack + Content |
| China Compliance | `app/(legal)/china/` (new) | ICP filing placeholder structure, content compliance checklist, China CDN considerations | Full-stack + Content |
| Domain & CDN | Vercel config, DNS | Production domain (lyc-intelligence.app subpath), Supabase custom auth domain, edge optimization | DevOps |
| Support / Docs | In-app help center + Notion | Onboarding docs, FAQ, support runbook, internal docs | Content + Product |

---

## Acceptance Criteria

The phase is complete when ALL of the following are true:

### Security
- [ ] RLS is enabled on 100% of public tables, with a test suite that validates each policy per role
- [ ] 0 Critical, 0 High findings remain from penetration test
- [ ] All public endpoints have rate limiting configured and tested
- [ ] Auth hardening complete: password policy, email verification, session revocation, brute-force protection
- [ ] P0 RLS exposure is fully remediated and regression-tested
- [ ] `v_mandate_scores` / `v_mandate_pipeline` JOIN bug is fixed and validated

### Performance
- [ ] Lighthouse score ≥ 90 on both mobile and desktop
- [ ] API p95 latency < 300ms for core endpoints at 200 concurrent users
- [ ] Error rate < 0.5% under load test
- [ ] Initial JS bundle < 200KB gzipped
- [ ] All images served as WebP/AVIF with responsive sizes

### Observability
- [ ] Sentry integrated on frontend and backend, with source maps and Slack alerts
- [ ] Structured logging in place across all API routes
- [ ] Uptime monitoring on all critical endpoints with < 5 min alerting
- [ ] Core metrics dashboard built and data flowing
- [ ] Alert severity matrix + on-call runbook documented

### Data Migration
- [ ] Migration script runs idempotently and passes 100% validation on staging
- [ ] Row count match between Feishu source and Supabase target
- [ ] Cutover plan documented with < 30 min downtime target
- [ ] Rollback plan documented and tested on staging

### Infrastructure
- [ ] Production domain live with valid SSL, HSTS enabled
- [ ] Supabase production tier upgraded, custom auth domain configured
- [ ] Staging and production are fully isolated (separate Supabase + Vercel projects)
- [ ] CI/CD pipeline green, prod deploy requires tag and green CI
- [ ] Preview deployments configured for every PR
- [ ] Rollback strategy documented and tested
- [ ] Transactional email configured with DKIM + SPF + DMARC, inbox rate > 95%
- [ ] CDN & edge optimization verified — global latency < 200ms across key regions
- [ ] Privacy policy, terms of service, refund policy, cookie policy live and linked

### Payment
- [ ] Stripe production account verified, live keys active, webhooks verified
- [ ] Credit/debit card payments working end-to-end in live mode
- [ ] Apple Pay and Google Pay working via Stripe
- [ ] Alipay and WeChat Pay integrated via Stripe cross-border
- [ ] PayPal integrated as separate payment provider
- [ ] Unified payment method selector UI working with per-method error handling
- [ ] Live mode testing complete: charges, refunds, proration, disputes
- [ ] Tax ID and business registration on all receipts/invoices

### Compliance
- [ ] All four legal pages (Terms, Privacy, Refund, Cookie) live and linked
- [ ] Cookie consent banner GDPR + PIPL compliant, geo-detection working
- [ ] Consent preferences stored and respected
- [ ] Data subject request endpoints (delete my data, export my data) implemented
- [ ] ICP filing placeholder structure in place
- [ ] Content compliance review checklist complete

### Go-Live Readiness
- [ ] Onboarding docs and FAQ published
- [ ] Support process and on-call rotation defined
- [ ] Launch checklist complete and all items checked off
- [ ] Post-launch 72-hour monitoring plan defined
- [ ] Go/no-go meeting held and decision documented as "Go"

---

## Dependencies

### Prerequisites (Must be done before Phase 10 starts)
- Phase 9 feature freeze — all core functionality complete and QA'd
- Staging environment exists with realistic data volume (for load testing and pentest)
- Supabase prod project provisioned (ready for migration and production tier upgrade)
- Vercel prod project provisioned
- Domain name `lyc-intelligence.app` purchased and DNS control available
- Resend account created for transactional email
- Stripe account created (ready for production verification)
- PayPal business account created (or planned)
- Sentry account created
- Legal counsel available for privacy policy / terms review (or template approved)
- Board strategy team identified for legal page final copy

### Internal Dependencies Between Milestones
- **M2 depends on M1 start** — performance work can run in parallel with security, but critical security fixes (RLS, auth) must land before any load test results are meaningful
- **M3 can start after M1/M2 basic structure** — monitoring integration doesn't block security or performance work
- **M4 depends on M5 (Supabase prod)** — migration needs a production target
- **M7 depends on M5 baseline** — production domain, email, and CDN work builds on M5's baseline infra; can overlap substantially
- **M8 (Payment) partially depends on M7** — Stripe production go-live needs production domain and email infrastructure; payment method integrations can start earlier in parallel
- **M6 depends on all others** — go-live readiness is the final gate

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Pentest uncovers Critical finding that takes > 1 week to fix | Medium | High — delays launch by 1–2 weeks | Run internal pentest early in M1; budget 1 week of remediation time; triage findings — not everything must be fixed pre-launch (only Critical/High) |
| R2 | Data migration discovers data quality issues in Feishu source | High | Medium — may need data cleanup pass | Run migration against staging 2–3 times pre-cutover; surface data issues early; build data-cleaning scripts as part of migration |
| R3 | v_mandate_scores JOIN bug is deeper than expected, requires schema change | Medium | High — could break dependent features | Investigate in first week of M2; if schema change needed, coordinate with all downstream consumers; add backward-compatible view first |
| R4 | Email deliverability issues (landing in spam) | Medium | Medium — poor user experience, lost password resets | Use reputable provider (Resend/Postmark); configure DKIM+SPF+DMARC early; test with mail-tester and GlockApps before launch |
| R5 | Load test reveals performance bottleneck requiring architectural change | Low | High — could add 2+ weeks | Run early load test at 50% target load in Week 1 to catch surprises; have caching strategy ready as first line of defense |
| R6 | Legal/compliance review takes longer than expected | Medium | Medium — blocks launch if legal is external | Start legal review early (Week 1); use a vetted template as starting point; pre-identify who signs off |
| R7 | Cutover downtime exceeds target window | Low | High — user impact, reputation | Practice cutover on staging 2+ times; have rollback plan ready and tested; schedule cutover during low-traffic window |
| R8 | Scope creep — "while we're at it" feature requests | High | Medium — delays launch | Strict feature freeze for Phase 10; all new feature requests go to backlog for Phase 11+; go/no-go meeting enforces scope |
| R9 | Stripe production account verification takes longer than expected | Medium | High — blocks all paid functionality | Start Stripe verification early (Week 1 of M8); have all business docs (registration, tax ID, bank info) ready; use test mode for integration while verification is pending |
| R10 | Alipay / WeChat Pay cross-border approval delayed | Medium | Medium — limits payment options at launch | Apply early for cross-border activation via Stripe; have fallback plan (launch with cards + PayPal only, add Alipay/WeChat post-launch) |
| R11 | DMARC/email deliverability issues — emails land in spam | Medium | Medium — poor user experience, lost password resets, payment receipts | Configure DKIM+SPF+DMARC early in M7; use Resend (strong deliverability reputation); test with mail-tester and GlockApps; warm up domain gradually |
| R12 | Legal page final copy delayed by board strategy team | Medium | Medium — blocks go-live if pages must have final copy | Use approved placeholder copy at launch; clearly mark as "draft" internally; set hard deadline for final copy 1 week before go-live; content team owns markdown updates without engineering |
| R13 | ICP filing not ready in time for China launch | Medium | Low — China users can still use global site; full China optimization deferred | Build ICP placeholder structure now so activation is config-only; launch globally first; China-specific optimization is a post-launch phase item |

---

## Go / No-Go Checklist

This checklist is reviewed in the formal go/no-go meeting (T-1032). Every item must be checked "Done" or explicitly waived with a documented risk acceptance.

### Security
- [ ] RLS audit complete — 100% tables covered, P0 exposure fixed
- [ ] Penetration test complete — 0 Critical / 0 High open findings
- [ ] Auth hardening complete — password policy, email verification, session revocation
- [ ] Rate limiting deployed on all public endpoints
- [ ] Security sign-off from engineer who did the audit

### Performance
- [ ] Load test passed — p95 < 300ms, error rate < 0.5% at target load
- [ ] Lighthouse ≥ 90 mobile + desktop
- [ ] No N+1 queries on critical paths (verified via query log analysis)
- [ ] Bundle size < 200KB gzipped

### Observability
- [ ] Sentry live and receiving errors from prod
- [ ] Uptime monitoring configured and tested (simulated failure)
- [ ] Alerting rules set up — Slack/email notifications working
- [ ] On-call runbook documented and shared

### Data
- [ ] Migration validated — row count match, spot checks pass
- [ ] Cutover plan written and reviewed
- [ ] Rollback plan written and tested on staging
- [ ] Supabase PITR enabled, backup + restore drill completed

### Infrastructure
- [ ] Production domain live, SSL valid, HSTS enabled
- [ ] Staging / prod isolation verified — no cross-contamination
- [ ] CI/CD pipeline green, prod deploy is one-click (tag-based)
- [ ] Transactional email configured, deliverability score ≥ 9/10

### Legal & Compliance
- [ ] Privacy policy live and linked in footer
- [ ] Terms of service live and linked in footer
- [ ] Refund policy live and linked in footer and checkout
- [ ] Cookie policy live and linked in cookie banner
- [ ] Cookie consent banner functional and compliant (GDPR + PIPL)
- [ ] Data subject request endpoints (delete/export) implemented and tested
- [ ] Legal sign-off obtained (or risk accepted by gatekeeper)

### Payment
- [ ] Stripe production account verified, live keys active
- [ ] All webhook endpoints verified in live mode
- [ ] Card payments tested end-to-end (charge, refund, dispute, proration)
- [ ] Apple Pay / Google Pay working via Stripe
- [ ] Alipay and WeChat Pay active (or post-launch plan documented and accepted)
- [ ] PayPal integration active (or post-launch plan documented and accepted)
- [ ] Payment method selector UI working with proper error handling
- [ ] Tax ID and business registration on all receipts

### Readiness
- [ ] Onboarding docs published
- [ ] Support process defined, on-call assigned for launch week
- [ ] Launch checklist complete
- [ ] Post-launch monitoring plan defined (first 72 hours)
- [ ] All stakeholders briefed on launch day timeline

### Final Decision
- **Go / No-Go:** _________________
- **Date:** _________________
- **Gatekeeper Signature:** _________________
- **Launch Date/Time:** _________________
- **Waivers / Accepted Risks:** _________________

---

*End of Phase 10 Specification*
