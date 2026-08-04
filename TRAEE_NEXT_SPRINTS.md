# TRAE_NEXT_SPRINTS.md — Post-Rebase Work Plan
**Repository:** [kevinhongfr-star/lyc-intelligence](https://github.com/kevinhongfr-star/lyc-intelligence)
**Live:** [www.lyc-intelligence.app](https://www.lyc-intelligence.app)
**Supabase:** `rnnlteyqmtxkzllbohuu.supabase.co`
**Date:** 2026-08-04
**Author:** Marcus (AI PM) for Trae (Engineer)

---

## Database Context (Already Deployed)

The following database objects are **LIVE** on Supabase and ready for frontend integration:

| Object | Type | Purpose |
|--------|------|---------|
| `scoring_config` | Table | Stage weights + tier thresholds |
| `v_mandate_scores` | View | Calculates weighted score per mandate |
| `v_pipeline_rankings` | View | Ranks all mandates, assigns Gold/Silver/Bronze tier |
| `candidates_pipeline` | Table | 385 rows, 9 pipeline stages |
| `contacts` | Table | 68,522+ candidates |
| `client_accounts` | Table | 8 active client accounts |
| `consultants` | Table | 4 consultants (Kevin, Joyce, Jaelyn, Claire) |
| `mandates` | Table | 7,449 total mandates |

### Pipeline Stages (Enum)
`New → Sourcing → Screening → Shortlisted → Presented → Interview → Offer → Hired | Rejected`

### Scoring System (Olympic Medal)
| Stage | Weight |
|-------|--------|
| Hired | 100 |
| Offer | 80 |
| Interview | 50 |
| Presented | 30 |
| Shortlisted | 20 |
| Screening | 10 |
| Sourcing | 5 |
| New | 2 |
| Rejected | 0 |

**Tier Thresholds:** Gold ≥ 200 | Silver ≥ 100 | Bronze ≥ 50 | Unranked < 50

### Supabase Connection
- REST URL: `https://rnnlteyqmtxkzllbohuu.supabase.co/rest/v1/`
- Anon Key: Set via `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var (see `.env.local`)
- All secrets managed via Vercel environment variables
- Auth: Supabase Auth (email + password)
- RLS: Enabled on all tables

---

# SPRINT 1: Candidate Portal (EO_4) — Wire to Supabase
**Branch:** `feature/eo4-candidate-portal-v2`
**Spec:** `specs/v2/07_Candidate_Portal_Spec_v2.md`
**Existing Tickets:** #14
**Estimate:** 80-100h
**Priority:** 🔴 P0 — First to deploy

## Objective
Connect the existing Candidate Portal frontend to the live Supabase scoring views. Show candidates their real-time pipeline status, mandate ranking (Gold/Silver/Bronze), and application progress.

## Sub-Tickets

### S1-T01: Supabase Client Integration
- Install `@supabase/supabase-js`
- Create `lib/supabase.ts` with anon key + URL from env vars
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- Create auth helper: `lib/auth.ts` (signUp, signIn, signOut, getSession, getUser)
- Add middleware for route protection on `/candidates/*` (except public pages)

### S1-T02: Candidate Authentication Flow
- Login page: `/candidates/login` (email + password)
- Registration page: `/candidates/register`
- Password reset flow via Supabase Auth
- Redirect to dashboard on successful auth
- Session persistence with cookies
- **Acceptance:** Candidate can register, login, see dashboard, logout

### S1-T03: Candidate Dashboard (`/candidates/dashboard`)
- Query `v_pipeline_rankings` filtered by candidate's `contact_id`
- Display:
  - Current pipeline stage (with progress indicator: New → Sourcing → Screening → ... → Hired)
  - Tier badge: Gold 🥇 / Silver 🥈 / Bronze 🥉 / Unranked
  - Weighted score (from `v_mandate_scores`)
  - Mandate details: company name, position, consultant
  - Application history timeline
- **Data binding:**
  ```sql
  SELECT * FROM v_pipeline_rankings
  WHERE candidate_id = auth.uid()
  ORDER BY rank ASC;
  ```
- **Acceptance:** Candidate sees their real-time ranking, stage, and tier badge

### S1-T04: Application Tracker (`/candidates/applications`)
- List all mandates the candidate has applied to
- Show stage progression for each application
- Filter by status (active, completed, rejected)
- Sort by most recent activity
- **Acceptance:** Candidate can see all applications with current status

### S1-T05: Mandate Browser (`/candidates/mandates`)
- Public page (no auth required)
- Fetch from `mandates` + `client_accounts` join
- Display: company, position title, location, status, consultant
- Search + filter by industry, location, level
- "Apply Now" CTA → `/candidates/apply/:id`
- **Acceptance:** Visitor can browse all open mandates

### S1-T06: Tier Badge Component
- Reusable React component: `<TierBadge tier="gold|silver|bronze|unranked" />`
- Visual design:
  - Gold: gradient #FFD700 → #FFA500, bold text
  - Silver: gradient #C0C0C0 → #808080
  - Bronze: gradient #CD7F32 → #8B4513
  - Unranked: muted gray
- Use in dashboard, application tracker, and admin views
- **Acceptance:** Badge renders correctly in all portals

### S1-T07: Real-Time Data Refresh
- Use Supabase Realtime subscriptions for live updates
- Subscribe to changes on `candidates_pipeline` where `candidate_id = auth.uid()`
- Auto-refresh dashboard when stage changes
- Optimistic UI updates with loading states
- **Acceptance:** Dashboard updates within 5s of a stage change in the database

### S1-T08: Candidate Landing Page Polish (`/candidates`)
- Hero section: "Land your next role with LYC Intelligence"
- "How it works" 8-step process
- Featured positions carousel (top 6 ranked mandates)
- Stats counter (positions filled, avg time-to-offer)
- Brand colors: fuchsia `#C108AB`, dark `#1A1A2E`
- **Acceptance:** Landing page matches spec design, mobile-responsive

### S1-T09: Profile & Resume Page (`/candidates/profile`)
- Display candidate profile from `contacts` table
- Edit basic info (name, email, phone, location)
- Resume upload to Supabase Storage
- Profile completeness indicator
- **Acceptance:** Candidate can view/edit profile, upload resume

### S1-T10: Deploy to Vercel Preview
- Push branch to remote
- Vercel auto-deploys preview URL
- Test all flows end-to-end on preview
- Fix any build errors
- **Acceptance:** Working preview deployment accessible via Vercel URL

---

# SPRINT 2: B2C Coaching Portal (EO_5)
**Branch:** `feature/eo5-b2c-coaching-v2`
**Spec:** `specs/v2/05_The_Council_Portal_Spec.md` + Council v2 Addendum
**Existing Tickets:** #9, #10, #11
**Estimate:** 60-80h
**Priority:** 🟡 P1 — After EO_4

## Objective
DEX AI B2C portal where users can interact with the AI coaching assistant, view their assessment results, and access development resources.

## Sub-Tickets

### S2-T01: DEX AI Landing Page (`/dex`)
- Public landing page for DEX AI B2C
- Value proposition: "AI-powered executive advisory"
- "Executive Introduction" CTA (5 complimentary messages)
- Feature highlights: career advisory, market intelligence, self-assessment
- Pricing preview (credit packs, monthly plans)
- **Brand rule:** NEVER use the word "free" — use "Executive Introduction" or "complimentary"
- **Acceptance:** Landing page renders, CTAs link to auth flow

### S2-T02: DEX AI Chat Interface (`/dex/chat`)
- Chat UI with streaming response display
- Message input (text, file upload for CVs)
- Conversation thread with scrollback
- Mobile-responsive
- Connected to Supabase Edge Function for DeepSeek routing
- **DeepSeek integration:**
  - Flash model: classification, simple queries (< 500ms)
  - Pro model: career advisory, complex analysis
  - Token counting + cost tracking
- **Acceptance:** User can send messages and receive AI responses in real-time

### S2-T03: User Context & Tier Gating
- After auth, load user profile + credit balance
- Tier system:
  - Executive Introduction: 5 complimentary messages (no credits)
  - Credit Pack: 1 credit per message
  - Monthly Member: 30 credits/month
  - Monthly Pro: 100 credits/month
- Credit deduction on each message
- Graceful "out of credits" state with upgrade CTA
- **Acceptance:** Credit balance decrements correctly, upgrade prompt shown when depleted

### S2-T04: Assessment Entry Point (`/dex/assess`)
- "Complimentary assessment" landing (NOT "free assessment")
- Assessment questionnaire UI
- Score calculation and results display
- Results feed into Nexus memory for personalized responses
- **Acceptance:** User can complete assessment, see results, results affect AI responses

### S2-T05: Development Plan Display (`/dex/plan`)
- Display personalized development plan based on assessment
- AI-generated recommendations
- Progress tracking (goals, milestones)
- Link to Academy courses (when available)
- **Acceptance:** User sees their plan, can track progress

### S2-T06: Coaching Session Booking (`/dex/book`)
- Calendar view for booking 1:1 coaching sessions
- Integration with consultant availability (from `consultants` table)
- Credit-based booking (1 credit per session)
- Confirmation email via Supabase Edge Function
- **Acceptance:** User can book a session, receive confirmation

### S2-T07: Deploy to Vercel Preview
- Same process as S1-T10
- **Acceptance:** Working preview with chat, assessment, and booking flows

---

# SPRINT 3: B2B Client Portal (EO_1)
**Branch:** `feature/eo1-b2b-portal-v2`
**Spec:** `specs/v2/04_Client_Portal_Spec.md` + `specs/remediation/REM_02_CLIENT_PORTAL.md`
**Existing Tickets:** #13
**Estimate:** 60-80h
**Priority:** 🟡 P1 — Parallel with EO_5

## Objective
Client-facing portal where companies can view their active mandates, candidate shortlists, pipeline status, and scoring rankings.

## Sub-Tickets

### S3-T01: Client Dashboard (`/client/dashboard`)
- Auth-gated (role: `client_user`)
- Display active mandates for the client's company
- For each mandate: pipeline summary, candidate count, stage distribution
- Query pattern:
  ```sql
  SELECT m.*, ca.company_name
  FROM mandates m
  JOIN client_accounts ca ON m.company_id = ca.id
  WHERE ca.role = 'client_user' AND ca.user_id = auth.uid();
  ```
- **Acceptance:** Client sees their mandates with pipeline summaries

### S3-T02: Candidate Shortlist View (`/client/mandate/:id/shortlist`)
- Display candidates presented for a specific mandate
- Show tier badges (Gold/Silver/Bronze) from `v_pipeline_rankings`
- Show score from `v_mandate_scores`
- Sort by score (descending)
- Filter by stage, tier
- Candidate card: name, current company, score, tier, stage
- **Acceptance:** Client can view ranked shortlist for any mandate

### S3-T03: Pipeline Kanban (`/client/mandate/:id/pipeline`)
- Kanban board view: columns = pipeline stages
- Drag-and-drop is NOT required (read-only for clients)
- Each card: candidate name, score, tier badge, consultant name
- Stage counts in column headers
- **Acceptance:** Client can see all candidates organized by pipeline stage

### S3-T04: Consultant Assignment Display
- Show which consultant manages each mandate
- Consultant profile card: name, email, photo placeholder
- Contact CTA (email link)
- **Acceptance:** Client can see and contact their assigned consultant

### S3-T05: Document Sharing (`/client/documents`)
- View shared documents (CVs, reports, briefs)
- Supabase Storage integration for file access
- Document metadata: type, date, consultant
- **Acceptance:** Client can view and download shared documents

### S3-T06: Client Authentication & RLS
- Client login: `/client/login`
- RLS policies ensure clients only see their own company data
- Role-based access: `client_user` can view, `client_admin` can manage
- **Acceptance:** Client can only access data for their own company

### S3-T07: Deploy to Vercel Preview
- **Acceptance:** Working preview with dashboard, shortlist, and pipeline views

---

# SPRINT 4: Go-Live Infrastructure
**Branch:** `main` (or dedicated `infra/go-live` branch)
**Spec:** `specs/v2/14_Legal_Pages_Compliance_Spec.md`
**Existing Tickets:** #26, #27, #28, #29, #30, #31, #32
**Estimate:** 40-60h
**Priority:** 🟡 P2 — After portals functional

## Objective
All mandatory infrastructure for production launch: CI/CD, error monitoring, legal compliance, performance validation, backup strategy, onboarding.

## Sub-Tickets

### S4-T01: CI/CD Pipeline (#26)
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Triggers: push to `main`, pull requests
- Steps:
  1. `npm ci` (clean install)
  2. `npm run lint` (ESLint gate — fail on errors)
  3. `npm run build` (Next.js production build)
  4. `npm run test` (unit tests, if any)
  5. Deploy to Vercel preview (PR) or production (main)
- Branch protection: require CI pass before merge
- **Acceptance:** PRs blocked if build/lint fails. Main auto-deploys.

### S4-T02: Error Monitoring — Sentry (#28)
- Install `@sentry/nextjs`
- Configure DSN in `.env`
- Capture: unhandled exceptions, API errors, client-side errors
- Source maps upload in CI
- Alert rules: critical errors → Slack/Feishu notification
- **Acceptance:** Errors captured in Sentry dashboard, source maps readable

### S4-T03: Legal Pages (#30)
- `/terms` — Terms of Service
  - Service description, user accounts, payment/credits, AI disclaimer, IP, liability cap, governing law (PRC + Shanghai arbitration)
- `/privacy` — Privacy Policy
  - Data controller (LYC Partners Shanghai), data collected, processing purpose, retention periods, third parties (DeepSeek, Supabase, Stripe), cross-border transfers, user rights (GDPR + PIPL)
- `/cookies` — Cookie Policy
  - Essential + analytics cookies, consent mechanism
- Cookie consent banner (bottom of page)
  - "Essential Only" / "Accept All" / "Customize"
  - Persist consent in localStorage
- GDPR data export endpoint: `GET /api/user/data-export`
- Account deletion flow (soft delete → 30-day hard delete)
- **Acceptance:** All 3 pages live, consent banner functional, data export works

### S4-T04: Custom Domain (#27)
- Configure `www.lyc-intelligence.app` in Vercel
- DNS: CNAME → `cname.vercel-dns.com`
- SSL: auto-provisioned by Vercel
- Redirect `lyc-intelligence.app` → `www.lyc-intelligence.app`
- **Acceptance:** Site accessible via custom domain with HTTPS

### S4-T05: Load Testing (#29)
- Tool: k6 or Artillery
- Test scenarios:
  - Homepage: 100 concurrent users, 30s
  - Login flow: 50 concurrent, 30s
  - Dashboard load: 50 concurrent, 30s
  - API endpoints: 100 req/s for 60s
- Target: p95 < 2s, p99 < 5s, error rate < 1%
- Run from Vercel's edge or external runner
- **Acceptance:** Load test report with metrics, all targets met

### S4-T06: Backup & Recovery (#31)
- Supabase automatic daily backups (enabled by default)
- Point-in-time recovery via Supabase dashboard
- Manual export script: dump critical tables to Supabase Storage weekly
- Recovery runbook: step-by-step restoration guide
- **Acceptance:** Backup runbook documented, restore tested in staging

### S4-T07: First-Time User Onboarding (#32)
- Onboarding wizard after first login
- Steps:
  1. Welcome + role selection (Candidate / Client / Council Member)
  2. Profile completion (name, company, title)
  3. Guided tour of key features (3-4 tooltips)
  4. CTA to primary action (browse mandates / view dashboard / start assessment)
- Skip option for returning users
- Track completion in `user_onboarding` table
- **Acceptance:** New users guided through onboarding, returning users skip

---

# SPRINT 5: Scoring System Frontend
**Branch:** `feature/eo2-supabase-backend` or portal-specific branches
**Existing Tickets:** None yet (new)
**Estimate:** 30-40h
**Priority:** 🟡 P2 — Integrate into portals after SPRINT 1

## Objective
Display the scoring/ranking system in the Admin dashboard and portal frontends. Gold/Silver/Bronze badges, ranking tables, score breakdowns.

## Sub-Tickets

### S5-T01: Admin Ranking Dashboard (`/admin/rankings`)
- Table view of all mandates from `v_pipeline_rankings`
- Columns: Rank, Candidate, Mandate/Company, Score, Tier, Stage, Consultant
- Tier badge component (reuse from S1-T06)
- Sort by: score, tier, stage, consultant
- Filter by: tier, stage, consultant, company
- Export to CSV
- **Acceptance:** Admin can view, sort, filter all ranked mandates

### S5-T02: Score Breakdown Modal
- Click on a mandate row → modal with score details
- Show each stage contribution: "Hired × 100 = 100", "Interview × 50 = 50", etc.
- Total weighted score
- Tier assignment explanation
- Visual bar chart of score composition
- **Acceptance:** Admin can see how each score was calculated

### S5-T03: Pipeline Stage Distribution Chart
- Stacked bar chart: stage distribution across all mandates
- Data from `candidates_pipeline` grouped by `stage`
- Update in real-time (Supabase Realtime)
- **Acceptance:** Admin sees live pipeline distribution

### S5-T04: Consultant Performance View (`/admin/consultants`)
- Per-consultant view: mandates managed, avg score, tier distribution
- Query pattern:
  ```sql
  SELECT c.name, COUNT(m.id) as mandates,
         AVG(v.score) as avg_score,
         COUNT(CASE WHEN v.tier = 'Gold' THEN 1 END) as gold_count
  FROM consultants c
  LEFT JOIN mandates m ON m.consultant_id = c.id
  LEFT JOIN v_pipeline_rankings v ON v.mandate_id = m.id
  GROUP BY c.id;
  ```
- **Acceptance:** Admin can compare consultant performance by scoring metrics

### S5-T05: Tier Configuration UI (`/admin/scoring`)
- Display current `scoring_config` values
- Allow admin to adjust stage weights (with confirmation)
- Show preview of how weight changes affect rankings
- Save to `scoring_config` table
- **Acceptance:** Admin can view and update scoring weights

### S5-T06: Portal Integration — Tier Badges Everywhere
- Add `<TierBadge>` component to:
  - Candidate Portal: dashboard, application tracker
  - Client Portal: shortlist view, pipeline kanban
  - Admin Portal: mandate list, consultant view
- Consistent visual language across all portals
- **Acceptance:** Tier badges visible in all portal views

---

# SPRINT 6: Stripe / Commerce Wiring
**Branch:** `feature/eo2-supabase-backend`
**Spec:** `specs/v2/08_Commerce_Layer_Spec.md`
**Existing Tickets:** #6, #7
**Estimate:** 60-80h
**Priority:** 🟡 P2 — After portals functional

## Objective
Wire up Stripe for payments, implement the dual credit system (DEX Credits + Council Credits), and connect to the subscription management layer.

## Sub-Tickets

### S6-T01: Stripe Integration — Checkout (#6)
- Install `stripe` + `@stripe/stripe-js`
- Create Stripe products for all revenue streams (see spec §1.2)
- Checkout flow:
  1. User selects product (credit pack / subscription)
  2. Create Stripe Checkout Session via Edge Function
  3. Redirect to Stripe hosted checkout
  4. Webhook handler: update credits/subscriptions on payment success
- Stripe webhook endpoint: `/api/webhooks/stripe`
- **Acceptance:** User can purchase a credit pack, credits appear in account

### S6-T02: Credit System — Dual Ledger (#7)
- Two separate credit tables:
  - `dex_credits` (DEX AI credits)
  - `council_credits` (Council membership credits)
- Credit operations:
  - Purchase (Stripe webhook → add credits)
  - Consume (API call → deduct 1 credit per action)
  - Expire (cron job → zero out credits older than 12 months)
- Balance check API: `GET /api/credits/balance`
- **Non-transferable:** DEX Credits ≠ Council Credits, separate ledgers
- **Acceptance:** Credits purchased, consumed, and expired correctly

### S6-T03: Subscription Management
- Council membership tiers: Founding (¥2,800), Individual (¥3,800), Corporate (¥12,000), PE Partner (¥25,000)
- Stripe Subscription integration
- Billing portal (customer self-service: upgrade, downgrade, cancel)
- Webhook: subscription status changes → update user role
- **Acceptance:** User can subscribe, upgrade, cancel; role updates automatically

### S6-T04: Pricing Page (`/pricing`)
- Public page showing all products and pricing
- Credit pack selector with quantity
- Subscription comparison table
- "Executive Introduction" (complimentary) prominently featured
- **Brand rule:** NEVER use "free" — use "Executive Introduction"
- CTA buttons link to Stripe Checkout
- **Acceptance:** Pricing page matches spec, CTAs work

### S6-T05: Billing Dashboard (`/account/billing`)
- Auth-gated
- Display: current balance (DEX + Council), subscription status, transaction history
- "Buy More Credits" CTA
- "Manage Subscription" → Stripe billing portal link
- Invoice download
- **Acceptance:** User can view billing info, purchase credits, manage subscription

### S6-T06: Revenue Analytics (`/admin/revenue`)
- Admin-only view
- MRR, ARR, credit utilization rate
- Revenue by product, by tier
- Churn rate (subscription cancellations)
- Stripe Dashboard embed or custom charts
- **Acceptance:** Admin can view revenue metrics

---

# SPRINT 7: Nexus Chatbot Integration
**Branch:** `feature/eo2-supabase-backend`
**Spec:** `docs/DEX_AI_NEXUS_PHASE1_TICKETS.md`
**Existing Tickets:** #39-#46
**Estimate:** 160-200h (Phase 1 — 7 tickets)
**Priority:** 🟠 P3 — After core portals + commerce

## Objective
Build the Nexus AI Companion — the conversational intelligence layer that powers DEX AI B2C coaching, candidate advisory, and client interactions.

## Sub-Tickets

### S7-T01: N1 — Conversation Engine + Intent Router (#39)
**Estimate:** 28-35h | **Dependencies:** None
- Chat UI: message input, streaming response, conversation thread
- Intent classifier (11 intents): career_advisory, self_understanding, market_intel, compensation, opportunity, coaching, peer_connection, event, skill_building, system_nav, out_of_scope
- DeepSeek integration: Flash (classification, < 500ms) + Pro (complex analysis)
- Conversation persistence in `nexus_conversations` table
- System prompt assembly (5 layers: personality, user context, intent instructions, tier modifiers, safety guardrails)
- Token counting + cost tracking, daily budget cap (¥50/day)
- **Acceptance:** User can chat, intents route correctly, conversations persist

### S7-T02: N2 — Memory System (#40)
**Estimate:** 24-30h | **Dependencies:** N1
- Working memory: last 20 messages in context window
- Episodic memory: conversation summaries stored in `nexus_memory` table
- Semantic memory: user profile insights, preferences, career data
- Memory retrieval: RAG-style search over past conversations
- Memory decay: older memories weighted lower
- **Acceptance:** Nexus remembers user across sessions, references past conversations

### S7-T03: N3 — User Context Assembly + Tier Gating (#41)
**Estimate:** 16-20h | **Dependencies:** N1, N2
- Assemble user context before each response:
  - Profile data (role, industry, seniority)
  - Active mandates / applications
  - Credit balance + tier
  - Past conversation summaries
- Tier gating:
  - Executive Introduction: basic responses, no deep analysis
  - Credit user: full responses, market intelligence
  - Council member: premium responses, peer matching, event access
- **Acceptance:** Responses adapt to user tier, context is relevant

### S7-T04: N4 — RAG Content Library Integration (#42)
**Estimate:** 20-25h | **Dependencies:** N2
- Index content library into vector embeddings:
  - Career guides, industry reports, market intelligence
  - LYC assessment frameworks
  - Public market data (APAC exec market)
- Embedding model: text-embedding-3-small (or compatible)
- Retrieval: top-k relevant chunks injected into system prompt
- Content management: admin can add/update/remove documents
- **Acceptance:** Nexus responses reference indexed content, citations shown

### S7-T05: N5 — Proactive Suggestions (#43)
**Estimate:** 18-22h | **Dependencies:** N1, N2, N3
- Context-aware suggestions:
  - "You applied to X — here's what to expect next"
  - "Based on your profile, Y role might interest you"
  - "Your assessment shows strength in Z — consider this path"
- Triggered by: stage change, new matching mandate, assessment completion
- Delivered via: in-app notification, email (optional)
- **Acceptance:** Users receive relevant proactive suggestions

### S7-T06: N6 — Journey Dashboard (#44)
**Estimate:** 14-18h | **Dependencies:** N1-N5
- Visual timeline of user's journey with Nexus
- Conversation history, key insights extracted
- Assessment results + development plan progress
- Milestone tracking (applications, interviews, offers)
- **Acceptance:** User can view their complete journey timeline

### S7-T07: N7 — Stripe Subscription for Nexus (#45)
**Estimate:** 12-15h | **Dependencies:** S6-T01, N1
- Connect Nexus tier gating to Stripe subscriptions
- Credit deduction per Nexus message
- Upgrade prompts when credits depleted
- Nexus-specific billing in `/account/billing`
- **Acceptance:** Nexus usage tied to subscription tier and credits

---

# Dependencies & Execution Order

```
SPRINT 1 (EO_4 Candidate Portal)
    ↓
SPRINT 2 (EO_5 B2C) ←→ SPRINT 3 (EO_1 B2B)  [parallel]
    ↓
SPRINT 4 (Go-Live Infra)
    ↓
SPRINT 5 (Scoring Frontend) — integrates into SPRINT 1-3 portals
    ↓
SPRINT 6 (Stripe/Commerce)
    ↓
SPRINT 7 (Nexus Chatbot) — largest sprint, starts after portals stable
```

## Critical Path
1. **S1-T01** (Supabase client) → unblocks all frontend work
2. **S1-T03** (Dashboard + scoring views) → proves database integration works
3. **S4-T01** (CI/CD) → enables safe merges for all subsequent work
4. **S4-T03** (Legal pages) → mandatory before any user data collection

## Brand Rules (APPLY TO ALL SPRINTS)
| ❌ NEVER | ✅ INSTEAD |
|---------|-----------|
| "Free assessment" | "Complimentary assessment" |
| "Free tier" | "Executive Introduction" |
| "Sign up free" | "Create your profile" |
| "Free trial" | "Founding member rate" |

## Color Palette
- Primary: Fuchsia `#C108AB`
- Dark: `#1A1A2E`
- Gold: `#FFD700` → `#FFA500` (gradient)
- Silver: `#C0C0C0` → `#808080` (gradient)
- Bronze: `#CD7F32` → `#8B4513` (gradient)

---

**Total estimated effort:** ~500-600h across all 7 sprints
**Recommended Trae focus:** SPRINT 1 → SPRINT 2/3 (parallel) → SPRINT 4 → SPRINT 5 → SPRINT 6 → SPRINT 7
