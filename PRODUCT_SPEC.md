# LYC Intelligence Platform — Product Specification Document

**Product:** LYC Intelligence Platform  
**Domain:** `lyc-intelligence.app`  
**GitHub:** `kevinhongfr-star/lyc-intelligence` (private)  
**Company:** LYC Partners (`lyc-partners.ai`) — global leadership advisory and executive search firm  

Version: 1.0  
Audience: AI Engineer (Trae)  
Status: Development blueprint  

---

## 1. Product Vision and Positioning

LYC Intelligence is a **multi-sided platform**, not an internal tool. It serves three distinct user surfaces:

- **B2C Chat** – Top of funnel; a free AI-powered career assistant (Nexus). Beneath the surface, it's a sales engine that captures leads and qualifies them for LYC's paid services.
- **B2B Dashboard** – For corporate clients of LYC Partners (executive search, advisory). Clients view their mandates, candidate pipelines, and assessment reports.
- **Candidate Portal** – Authenticated candidates can manage their profile, view assessment history, and generate referral links.

### User Journey and Business Logic

Every interaction (chat, assessment, match) maps users to LYC service tiers:

1. **Anonymous** visitor → uses Nexus chat (free, no login).  
2. **Lead capture** → email gate (assessment results, download).  
3. **Free account** → daily credits, limited assessments / matches.  
4. **Upgrade** → Basic ($9.99/mo) or Pro ($29.99/mo).  
5. **Hot lead** → consultant outreach → becomes **The Council** member or **Advisory** client.  
6. **Word-of-mouth flywheel**: candidates refer peers; some referrals become paying clients.

---

## 2. User Types and Access Levels

| Role | Access | Description |
|------|--------|-------------|
| `b2c` (anonymous) | `/`, `/nexus`, `/assessment`, `/match` (limited) | Anonymous visitors; no login required for initial chat/free features. |
| `candidate` | `/candidate/*` (own profile, assessment history, referral link) | Authenticated via email + password or OAuth. |
| `client` | `/platform/*` (7-stage pipeline, mandates, reports) | Logged-in corporate client; sees only their own mandates. |
| `consultant` | Full platform access + 5-stage internal pipeline (SWEEP→CANVA→GRID→LENS→PLACED) | LYC staff; can manage all mandates, candidates, and leads. |
| `admin` | Everything + user management + analytics | Full CRUD on users, credits, billing, and system configuration. |

**Authentication flow:** Supabase Auth (email/password, magic link, OAuth providers). Role is stored in `app_metadata` or a `roles` table.

---

## 3. Lead Generation Funnel (Core Business Logic)

### 3.1 B2C Path

1. User lands on `lyc-intelligence.app` → sees Nexus chat widget.  
2. Chat answers questions, offers a free assessment → user provides email (**lead capture**).  
   - Email stored in `b2c_leads` table.  
3. Free assessment (1 free per visitor, no account required).  
   - Results page shows summary; download requires email again.  
4. After using the free assessment → user sees: *"You have used your free assessment. Get 3 more with a free account."* → signup.  
5. Free account = 5 credits per day (reset at midnight UTC). Credits used for assessments and matches.  
6. When credits run out → upgrade banner: **Basic $9.99/mo** or **Pro $29.99/mo**.  
7. Premium assessments + TRIDENT matches → user qualifies as **hot lead**.  
8. Consultant sees lead in pipeline → outreach → becomes client.

### 3.2 B2B Path

1. Company visits `/b2b` → sees value prop + **Schedule a Demo** form.  
2. Form fields: Name, Work Email, Company → stored in `b2b_leads` (Supabase).  
3. After submission → redirect to `/match` with 3 free TRIDENT matches.  
4. After 3 matches → upgrade prompt: Pro $29.99/mo or Enterprise (custom).  
5. Sales team notified (email + in-app) → outreach → becomes mandate.

### 3.3 Database Schema (relevant tables)

```sql
-- b2c_leads: captures every email from anonymous assessments
CREATE TABLE b2c_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT CHECK (source IN ('nexus_chat', 'assessment_gate', 'match_download')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- b2b_leads: for demonstration requests
CREATE TABLE b2b_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Credit System and Pricing

### 4.1 Credits Table

```sql
CREATE TABLE credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  tier TEXT CHECK (tier IN ('free','basic','pro','enterprise')) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Credit Transactions

```sql
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earn','spend','bonus','refund','purchase')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Consumption Rules

| Action | Cost |
|--------|------|
| 1 SHIFT assessment | 1 credit |
| 1 TRIDENT match | 1 credit |

### 4.4 Tiers and Pricing

| Tier | Monthly Price | Credits / Period | Features |
|------|---------------|------------------|----------|
| Free | $0 | 5 per day (reset daily) | Basic assessments, TRIDENT (3 free total) |
| Basic | $9.99 | 20 per month | All assessments, TRIDENT matches |
| Pro | $29.99 | 50 per month | Priority assessments, advanced reports |
| Enterprise | Custom | Unlimited | Dedicated pipeline, white-label reports, SLA |
| **The Council** | $29/mo | — | Private network access (Board Chairs, Regional Presidents) — separate from credits |

**Credit reset logic:** For Free tier, at midnight UTC cron job sets `balance = 5` if `tier = 'free'` and `balance < 5`. For paid tiers, credits reset at subscription billing cycle start.

**Upgrade banner triggers:**  
- Free user: `balance <= 0` and `tier = 'free'` → show upgrade CTA.  
- Basic user: `balance <= 2` → show "Get more credits" link.

---

## 5. Assessment Engine (Career Advisor)

### 5.1 Available Assessments

| Name | Short | Dimensions |
|------|-------|------------|
| PRISM | Career & Professional Branding | Vision, Resilience, Influence, Strategy, Mastery |
| FORGE | Sales Excellence | Drive, Relationship, Strategy, Execution, Adaptability |
| BRIDGE | China Leadership Readiness | Cultural, Strategic, Operational, Political, Network |
| MOSAIC | CQ Leadership Development | CQ Drive, Knowledge, Strategy, Action, Adaptability |
| SPARK | AI Leadership Readiness | AI Vision, Data Fluency, Change Leadership, Ethics, Innovation |
| SHIFT-LEAP | Competitive Positioning | Market, Capability, Timing, Risk, Impact |
| SHIFT-DRIVE | Execution Capability | Strategy, Operations, People, Technology, Results |
| SHIFT-COACH | Coaching Readiness | Self-Awareness, Growth, Feedback, Resilience, Impact |
| SHIFT-QUEST | Strategic Readiness | Vision, Analysis, Decision, Influence, Adaptability |
| SHIFT-IMPACT | Organizational Impact | Leadership, Innovation, Culture, Performance, Legacy |

### 5.2 Interactive Multi-Step Wizard

**Step 1 – Email Gate**  
- Show a form: "Enter your email to start your free assessment."  
- On submit → store in `b2c_leads` with `source = 'assessment_gate'`.

**Step 2 – Dimension Self-Assessment**  
- For each of 5 dimensions, display a 1-5 clickable rating scale.  
- Buttons (1..5) are large, 44px min touch target.  
- After rating all 5, user clicks "Next".

**Step 3 – Writing Style Selector**  
- 4 cards (Analytical, Visionary, Pragmatic, Empathetic).  
- User selects one style. This influences the report tone.

**Step 4 – Results Display**  
- Composite SHIFT score (0-100).  
- Archetype label (e.g., "Visionary Catalyst").  
- Dimension breakdown as a radar chart or horizontal bar chart.

**Step 5 – PDF Export**  
- Branded PDF with dark theme (#0A0A0A bg, #E5E5E5 text, #C108AB accent).  
- Uses `html2canvas` + `jspdf` (already in project).

### 5.3 Composite SHIFT Score Formula

```
SHIFT_composite = LEAP×15% + QUEST×25% + COACH×20% + DRIVE×15% + IMPACT×25%
```

**Important:** This formula is internal; never expose weights to users.

---

## 6. Nexus AI Chatbot

### 6.1 Purpose

Nexus is the **front door** of the platform. It answers questions, guides users to assessments/matches, and captures leads.

### 6.2 AI Providers

| Priority | Provider | Model / API |
|----------|----------|-------------|
| Primary | DeepSeek | v4-flash (fast, cheap) |
| Fallback 1 | DeepSeek | v4-pro (more capable) |
| Fallback 2 | Coze API | (custom bot) |

**Communication:** Direct browser call (CORS supported). No proxy required.

### 6.3 System Prompt

> "You are Nexus, the AI assistant for LYC Intelligence. Your role is to help users understand LYC's services, guide them to self-assessments and the TRIDENT matching tool, and answer questions about cross-border leadership. Never mention Notion, Supabase, or internal infrastructure. Never reveal TRIDENT weights or internal stage names."

### 6.4 Quick Action Buttons

- "What does LYC do?"
- "How does TRIDENT matching work?"
- "Tell me about the D3 Framework"
- "What is The Council?"

These buttons send predefined messages; Nexus must respond with appropriate content.

### 6.5 Critical Rendering Requirements

- **Markdown tables** must render correctly. Use `react-markdown` with `remark-gfm`.  
- Lists (ordered/unordered), code blocks, bold/italic must also render.  
- Currently broken (see section 13).

### 6.6 Safety Rules (Client-facing)

- **Never** mention Notion, Supabase, or any backend infrastructure.  
- **Never** reveal TRIDENT dimension weights.  
- **Never** use internal pipeline stage names (SWEEP, CANVA, etc.) with external users.  
- Output must be **English only**.

---

## 7. TRIDENT Match Engine

### 7.1 Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| D1 – Experience & Achievements | 40% | Relevance of past roles, company size, scope. |
| D2 – Skills / Functional Match | 35% | Required competencies, technical skills. |
| D3 – Organizational Fit | 25% | Culture, values, leadership style alignment. |

**Composite score** = `(D1×0.40 + D2×0.35 + D3×0.25) × 10` → score 0-100.

### 7.2 User-Facing Labels

| Composite Score Range | Label |
|-----------------------|-------|
| 75–100 | Strong Primary (T1) |
| 50–74 | Strong Secondary (T2) |
| 0–49 | Reserve (T3) |

**Client-facing UI** must show only these labels, **never** raw scores or weights.

### 7.3 UX Patterns (Integration)

- **Split-panel** (Meheran reference): left side = JD details, right side = candidate cards.  
- **Report format** (Manish LENS T5): dimension charts (radar/horizontal bars), score badges, verdict summary.  
- **Verdict mapping** (from pipeline stage):
  - Strong Fit → Strong Primary (T1)
  - Conditional → Strong Secondary (T2)
  - Weak or Reject → Reserve (T3)

### 7.4 Implementation Notes

- TRIDENT scoring logic lives in `src/services/tridentScoring.ts`.  
- The composite formula must be hidden from the frontend. Use a backend function (Supabase Edge Function or RPC) to compute scores.

---

## 8. Pipeline and Kanban

### 8.1 Internal Pipeline (Consultants Only)

Stages: **SWEEP → CANVA → GRID → LENS → PLACED**

### 8.2 Client-Facing Pipeline (7 Stages)

1. Created  
2. Reviewed  
3. Shortlisted  
4. Submitted  
5. Interview  
6. Offer  
7. Closed  

Auto-mapping: When a consultant moves a candidate to a verdict (Strong, Conditional, Weak, Reject), the system maps to the client-facing label as per section 7.2.

### 8.3 Kanban Board

- Use `@dnd-kit` for drag-and-drop.  
- Each card shows candidate name, role, current stage, and a small score badge.  

### 8.4 Shortlist 1-Pager

A single-page PDF summary per candidate:
- Name, current role, scope bar (experience breadth).  
- Top 3 strengths.  
- Match score (as label, not raw).  
- Button to export PDF.

---

## 9. Tech Stack and Architecture

### 9.1 Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS + TypeScript |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI Services | DeepSeek API (primary), Coze API (fallback) |
| Hosting | Vercel (static SPA – no serverless functions on free tier) |
| Source Control | GitHub (private repo) → auto-deploy to Vercel on push |

### 9.2 Data Flow

```
Notion (source of truth)
  ↓ (daily sync script – Python / Node)
Supabase (compute & cache)
  ↓ (REST / Realtime)
Frontend (thin render layer)
```

- **Note:** Notion is the data source for mandates, contacts, companies. The daily sync script runs externally (not part of the SPA).  
- Supabase instance is shared with **Carl VISTA** (same project, separate tables with `vista_` prefix).

### 9.3 Key Database Tables

| Table | Count | Description |
|-------|-------|-------------|
| `contacts` | ~10K | Candidate/contact profiles. |
| `mandates` | ~500 (needs re-sync) | Client search mandates. |
| `companies` | ~16K | Corporate entities. |
| `proposals` | ~197 | Search proposals. |
| `candidates_pipeline` | ~276 | Pipeline records (internal 5-stage). |
| `b2c_leads` | — | Email capture from B2C funnel. |
| `credits` | — | Per-user credit balance. |
| `credit_transactions` | — | Audit trail. |
| `assessments` | — | Assessment results. |
| `ai_generations` | — | AI response cache. |
| `vista_action_queue` | — | Carl's coordination table. |
| `events`, `documents`, `comments` | — | Shared infrastructure. |

---

## 10. Design System

- **Typography:** Georgia (headings), system sans-serif (body).  
- **Background:** `#0A0A0A` (almost black).  
- **Text:** `#E5E5E5` (light gray).  
- **Accent (CTA only):** `#C108AB` (fuchsia). **Never use decoratively.**  
- **Touch targets:** Minimum 44px.  
- **Theme:** Dark only.  
- **Branding:** Must match `lyc-partners.ai` exactly (logo, colors, tone).  

---

## 11. Contributors Work and Integration

| Contributor | Focus | Integration Status |
|-------------|-------|-------------------|
| **Sarvika** (UX) | Kanban pipeline, Shortlist 1-Pager, AI Quick Actions, Scheduler, Documents, Notifications UI. Her 7-stage pipeline adopted as client-facing view. | ✅ Integrated |
| **Meheran** (TRIDENT) | Desktop JD/CV matching tool with split-panel UX. | ⚠️ Panel layout reference for Match Engine; UX patterns to adopt |
| **Manish** (LENS) | Report component: `DimensionChart` + `ScoreBadge`. His T5 report format adopted. | ⚠️ Chart components to integrate into `/match` results |
| **Carl** (VISTA/Proximity) | Shared Supabase instance, proximity scoring P1-P5 / C1-C5, Stain groups. | ⚠️ Needs coordination on sync scheduling |

**Coordination Note:** The daily sync script must respect Carl's table locks and use `vista_action_queue` to avoid conflicts.

---

## 12. Priority Deployment Order

### P0 — Revenue-Critical (Do First)

1. **Fix Nexus chat markdown/table rendering**  
   - Install `react-markdown` + `remark-gfm`.  
   - Ensure tables, lists, code blocks render correctly.  

2. **Implement interactive PHI assessment flow**  
   - Multi-step wizard (email gate → dimension rating → style selector → results → PDF export).  
   - All 10 assessment types must work.  

3. **Implement email capture + lead gating** on B2B and B2C landing pages  
   - `b2c_leads` insertion from Nexus chat and assessment gates.  
   - `b2b_leads` from `/b2b` demo form.  

### P1 — Revenue Enablement

4. **Credit system frontend**  
   - Display balance in header.  
   - Credit-gated features (assessments, matches).  
   - Upgrade banners when balance is low.  

5. **Stripe checkout integration**  
   - Basic $9.99, Pro $29.99, The Council $29/mo.  
   - Webhook to update credits tier and add credits.  

6. **TRIDENT Match Engine rebuild**  
   - Meheran split-panel + Manish report format.  
   - Backend scoring via Supabase RPC (hide formula).  

### P2 — Growth

7. **Candidate portal** (profile, assessment history, referral link)  
8. **SEO landing pages**  
9. **LENS email delivery chain** ("Send to Client" button)  
10. **Notification system** (in-app + email)

---

## 13. Current Bugs and Issues

| Issue | Description | Severity |
|-------|-------------|----------|
| **Nexus chat markdown** | Tables broken, spacing weird, lists not rendered. | 🔴 High |
| **Assessment page** | Lost all interactivity: no clickable rating options, no writing style selector, no progress indicator. | 🔴 High |
| **B2B/B2C landing pages** | No email capture forms; lead generation funnel missing. | 🔴 High |
| **Funnel logic missing** | Entire lead-to-pipeline chain not implemented. | 🔴 High |
| **Credit system** | Backend tables exist but no frontend integration. | 🟡 Medium |
| **b2c_leads table** | Exists but not connected to any form. | 🔴 High |
| **Mandate data** | Carl VISTA wiped from 6,389 to 500; needs re-sync. | 🟡 Medium |
| **Proximity scores** | All defaults (NULL). Need to compute or seed. | 🟢 Low |
| **RESEND_API_KEY** | Not configured; email features blocked. | 🟡 Medium |
| **Supabase Storage** `documents` bucket | Not created. | 🟢 Low |

---

## 14. Key Files in GitHub Repository

| Path | Description |
|------|-------------|
| `src/App.tsx` | Routes: `/`, `/assessment`, `/b2b`, `/b2c`, `/nexus`, `/match`, `/platform/*` (protected) |
| `src/services/supabaseApi.ts` | Supabase client and data helpers. |
| `src/services/coze.ts` | DeepSeek/Coze API integration with system prompt. |
| `src/services/assessmentEngine.ts` | Assessment workflow logic. |
| `src/services/tridentScoring.ts` | TRIDENT composite score calculation. |
| `src/services/phiScoring.ts` | PHI (SHIFT) scoring logic. |
| `src/services/aiQuickActions.ts` | Quick action definitions for Nexus. |
| `src/services/reportGenerator.ts` | PDF report generation. |
| `src/services/serverApi.ts` | Utility for server-side calls. |
| `src/assessments/catalog.ts` | 10 assessment types with dimensions. |
| `src/types/index.ts` & `src/types/mandate.ts` | TypeScript types. |
| `src/contexts/AuthContext.tsx` | Authentication context. |
| `src/hooks/useSupabaseData.ts` | Hook for fetching Supabase data. |
| `src/pages/NexusLanding.tsx` | Public Nexus chat (B2C front door). |
| `src/pages/AssessmentPage.tsx` | Assessment wizard (needs rebuild). |
| `src/pages/B2BLanding.tsx` | B2B landing (needs lead form). |
| `src/pages/B2CLanding.tsx` | B2C landing (needs lead form). |
| `src/pages/MatchPage.tsx` | TRIDENT Match Engine (needs UX upgrade). |
| `src/pages/PipelinePage.tsx` | Kanban pipeline (working). |
| `src/components/dashboard/` | CommandCenter, ConsultantDashboard. |
| `src/components/layout/AppLayout.tsx` | Sidebar + layout wrapper. |
| `api/` | Serverless API routes (email, health, score, upload). |

---

## 15. Client Safety Rules (Never Violate)

- **Never** show TRIDENT weights/formulas in any client-facing UI.  
- **Never** use internal stage names (SWEEP, CANVA, GRID, LENS, PLACED) with external users.  
- **Never** mention Notion, Supabase, or any backend infrastructure to users.  
- **Never** show Proximity levels (P1-P5, C1-C5) to clients.  
- **Never** expose raw scoring data or run IDs to clients.  
- **Verdict mapping:**  
  - Strong Fit → Strong Primary (T1)  
  - Conditional → Strong Secondary (T2)  
  - Weak or Reject → Reserve (T3)  
- Output **English only**, no exceptions.

---

## 16. LYC Partners Information (Source of Truth – `lyc-partners.ai`)

| Attribute | Value |
|-----------|-------|
| **Tagline** | *Building Leadership That Works Across Borders* |
| **Methodology** | The **D3 Framework**: Diagnose · Design · Deliver |
| **Stats** | 47 markets, 15+ years, 92% retention (12mo), 40% cross-border exec failure rate |
| **Services** | Executive Search, Advisory, For Leaders, **The Council** |
| **Sectors** | Financial Services, Industrial Manufacturing, Consumer & Retail, Cross-Border Leadership, Board & C-Suite |
| **IP** | TRIDENT, PACE, CVFlow |
| **Podcast** | *Leaders in Motion* by Kevin Hong |
| **Locations** | Shanghai, Hong Kong |

Ensure all platform copy (taglines, service descriptions) matches the exact wording from `lyc-partners.ai`. Do not invent any marketing text.

---

*End of Product Specification Document — for Trae, AI Engineer.*
