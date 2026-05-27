# LYC Intelligence — Engineering Fix Spec for Trae
**Date:** 2026-05-27
**Source:** AUDIT.md v2.1 (James/AI + Claude) + ENGINEERING_TICKETS.md + NEXUS code fixes
**Repo:** kevinhongfr-star/lyc-intelligence
**Branch:** always `feat/` from main, never push to main
**Design System:** #0A0A0A bg, #E5E5E5 text, #C108AB CTA accent, Georgia serif headings, 44px min touch targets, dark theme only

---

## ✅ ALREADY DONE (don't touch these)

| What | Commit |
|------|--------|
| IP name fix — NexusPage.tsx (4 replacements) | cb3e5d5 |
| IP name fix — B2BLanding.tsx (6 replacements) | 70208c5 |
| IP name fix — MatchPage.tsx (7 replacements) | d835c2d |
| IP name fix — 8 other files (NexusChat, ShareCard, BatchScoring, Landing, LensExport, MandateDetail, Pipeline, ScoringRuns) | d6d1c73 |
| Markdown rendering — react-markdown + remark-gfm already installed and wired | — |
| @tailwindcss/typography plugin in tailwind.config.js | — |
| Assessment engine uses real scoring (not random) | — |
| VITE_ENABLE_PLATFORM flag exists | — |
| LeadCaptureForm component exists (b2b/b2c modes) | — |
| Server-side /api/chat handler works with DeepSeek | — |
| Dual Nexus prompts (anonymous vs authenticated) | — |
| Magic link auth function exists (signInWithMagicLink) | — |
| Credit system scaffolding exists (CreditContext, creditService, CreditBadge, CreditGate) | — |

---

## 🔴 P0 — MUST FIX BEFORE ANY USER SEES THIS

### P0-1: Delete coze.ts (Security Critical)
**File:** `src/services/coze.ts`
**Problem:** Contains `VITE_DEEPSEEK_API_KEY` client-side + full internal methodology prompt (SWEEP→CANVA→GRID→LENS→PLACED, PHI Framework, Proximity scoring) readable in browser DevTools.
**Action:** Delete the entire file. NexusChat.tsx already uses `/api/chat` proxy — coze.ts is dead code with a security hole.
**Also:** Remove `VITE_DEEPSEEK_API_KEY` from Vercel environment variables.

### P0-2: Rewrite Nexus Welcome Message + Suggested Prompts
**File:** `src/components/nexus/NexusChat.tsx`
**Problem:** Welcome message is a LYC marketing brochure. All 4 suggested prompts are about LYC, not the user.
**Current:**
> "Hi! I'm Nexus, LYC Partners' AI assistant. I can help you with: Executive Search / TRIDENT Matching / Career Strategy / Leadership Advisory — D3 Framework: Diagnose·Design·Deliver"

**Replace with:**
> "I'm Nexus. LYC Partners has placed 500+ executives across 47 markets — I carry that knowledge into every conversation. One in three cross-border executive moves fails within 18 months. Usually for the same reasons. What are you navigating right now?"

**Replace suggested prompts** (all 4) with user-centric ones:
1. "I'm considering a move to APAC — what should I watch out for?"
2. "How do I know if I'm ready for a board role?"
3. "What makes cross-border executive transitions fail?"
4. "Help me think through a career pivot at the C-suite level"

**Rules:** No "D3 Framework", no "TRIDENT", no "LENS", no internal methodology names in UI.

### P0-3: Homepage → Nexus-First
**File:** `src/pages/Landing.tsx`
**Problem:** Homepage is a product catalog (TRIDENT Match, Assessment, Nexus AI cards). No Nexus chat on homepage. "Sign In" links to /platform (exposes ATS).
**Action:**
1. Replace hero section with embedded Nexus chat widget (full-width, prominent, immediately usable)
2. Remove the product feature cards
3. ICP cards ("I'm a leader" / "I'm hiring") become secondary for people who want structure
4. Fix "Sign In" → link to `/login` not `/platform`
5. No "TRIDENT", "D3 Framework", or internal names anywhere

### P0-4: B2C Landing Missing Lead Capture
**File:** `src/pages/B2CLanding.tsx`
**Problem:** B2B landing has LeadCaptureForm, B2C doesn't. Users can browse forever without giving email.
**Action:** Import and render `<LeadCaptureForm flow="b2c" />` in the CTA section. Already built — just needs to be added.

### P0-5: Hard Email Gate in Nexus Chat
**File:** `src/components/nexus/NexusChat.tsx`
**Problem:** System prompt says "ask for email after 3rd response" but there's no programmatic hard gate at message 5. Users can chat indefinitely.
**Action:** After 5 messages without email, show a modal/blocking overlay: "To continue this conversation, please share your email." Input field + submit. Store to Supabase `b2c_leads`. After submit, conversation resumes.

### P0-6: Mobile Responsiveness
**Files:** All page components
**Problem:** Three-column grids, 900px containers, 52px padding — broken on 390px screens. LinkedIn traffic is primarily mobile.
**Action:**
- Add responsive breakpoints (md:768px, lg:1024px)
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Container padding: `px-4 md:px-8 lg:px-12`
- Font sizes: scale down on mobile
- Test at 390px viewport

---

## 🟡 P1 — REVENUE ENABLEMENT (Week 1-2)

### P1-1: Fix Pricing Tiers
**File:** `src/pages/PricingPage.tsx` + Stripe config
**Problem:** Code has old tiers (Basic $9.99, Pro $29.99, Council $29). Spec says: Free, Pro $49/mo, Council $199/mo. No "Basic" tier.
**Action:**
- Remove Basic tier
- Pro: $49/mo, 200 credits
- Council: $199/mo, 999 credits + quarterly advisory call
- Sell outcomes not credits: "Score 20 candidates" not "200 credits"

### P1-2: Credit Consumption Not Wired
**Files:** `src/pages/MatchPage.tsx`, `src/pages/AssessmentPage.tsx`
**Problem:** getCreditCost() and CreditContext exist but credits are never actually consumed. Users can do unlimited matches and assessments.
**Action:**
- Match: 2 credits per candidate scored (deduct after scoring completes)
- Assessment: 1 credit per assessment (deduct after results shown)
- Show credit balance in header via CreditBadge
- Daily free reset NOT needed — just gate on balance > 0

### P1-3: TRIDENT Results Show Raw Scores (Expose Methodology)
**File:** `src/components/trident/ResultsTable.tsx`
**Problem:** Shows D1: 87, D2: 79, D3: 82 — raw numbers mean nothing to users and expose methodology.
**Action:** Show verdict labels only:
- 80-100 → Strong Primary
- 60-79 → Strong Secondary
- 40-59 → Conditional
- <40 → Reserve
- Remove raw score numbers from UI

### P1-4: Connect Memory Context to Nexus
**File:** `src/components/nexus/NexusChat.tsx` + `api/chat.ts`
**Problem:** `{memory_context}` placeholder in system prompt template is always empty. User's name, goals, assessment scores, archetype never reach Nexus. Every conversation starts from zero.
**Action:**
1. On page load, fetch user's memory from `memoryStore.ts` / Supabase
2. Pass memory context in the `/api/chat` request body under `memoryContext` array
3. Server template already replaces `{memory_context}` — it just needs non-empty input

### P1-5: Add PostHog Events
**File:** `src/services/analytics.ts` + relevant components
**Problem:** PostHog initialized but zero events fired. No user behavior data.
**Action:** Add these 5 events:
1. `assessment_started` — when user begins assessment
2. `assessment_completed` — when results shown
3. `match_run` — when TRIDENT scoring completes
4. `nexus_message_sent` — when user sends chat message
5. `lead_captured` — when email submitted (B2B or B2C)

### P1-6: Add Rate Limiting + CORS
**File:** `api/chat.ts`, `api/score.ts` (Vercel serverless)
**Problem:** No rate limiting. No CORS. Open to abuse.
**Action:**
- Rate limit: /api/chat 30/min, /api/score 10/min (use Vercel KV or simple in-memory)
- CORS: whitelist `lyc-intelligence.app` + `localhost:5173`

### P1-7: Lead Notification Email
**File:** `api/lead-capture.ts` or similar
**Problem:** RESEND_API_KEY not configured. When a lead is captured, nobody at LYC gets notified.
**Action:** After inserting lead to Supabase, send email via Resend to `kevin.hong@lyc-partners.ai` with lead details.

---

## 🟠 P2 — RETENTION & GROWTH (Week 2-3)

### P2-1: Assessment → Nexus Bridge
**File:** `src/pages/AssessmentPage.tsx`
**Problem:** After assessment, user sees scores + archetype label. No next step. Assessment and Nexus are separate islands.
**Action:** After showing results, add CTA:
> "Your biggest gap is [lowest dimension name] at [score]. Want me to build a 90-day plan for that specifically?"
Clicking opens Nexus with pre-filled context about the assessment results.

### P2-2: Shareable Assessment Results
**Files:** `src/pages/AssessmentPage.tsx`, new route `/share/:id`
**Problem:** No share card on assessment results. Assessment ends at archetype display — no viral mechanic.
**Action:**
- Generate shareable card (html2canvas)
- Store to Supabase, create /share/:id route
- Add LinkedIn share button
- Fix OG tags (needs SSR or prerender for dynamic meta)

### P2-3: Day-2 Return Trigger
**Files:** New `api/cron/daily-digest.ts` or Vercel cron
**Problem:** No reason to come back on Day 2. No notifications, no streaks, no "your assessment is X days old."
**Action:**
- Daily cron: check users with assessments >7 days old, send email "Your career landscape may have shifted. Here's what Nexus noticed this week."
- Streak counter on dashboard
- "Based on your goals, here's what to work on this week" in Nexus

### P2-4: Pricing Page — Sell Outcomes Not Credits
**File:** `src/pages/PricingPage.tsx`
**Problem:** "50 credits/month" means nothing. Nobody upgrades for credits.
**Action:**
- Pro: "Score 20 candidates against your next hire + unlimited career conversations"
- Council: "A LYC partner who has placed 5 executives in your target market reviews your profile quarterly"
- Credits as secondary detail, not primary sell

### P2-5: B2B Team Sharing
**File:** `src/pages/MatchPage.tsx`
**Problem:** A CHRO can't share TRIDENT results with hiring manager/CEO inside the product.
**Action:** Add "Share this shortlist" button → generates link or sends email to colleague with results summary.

### P2-6: Memory Extraction After Conversations
**Files:** `api/memory.ts`, `src/services/memoryService.ts`
**Problem:** api/memory.ts is a stub. After Nexus conversations, no extraction of user preferences, goals, or context.
**Action:** After each conversation ends (or periodically), extract key facts into structured memory: career goals, preferences, experience, concerns. Inject into future Nexus conversations via memory context.

---

## 📋 CODE CLEANUP (Quick Hits)

| # | Item | File | Time |
|---|------|------|------|
| C1 | Remove "D3 Framework" from all UI | NexusChat, Landing, B2BLanding | 10 min |
| C2 | Fix Landing.tsx "Sign In" → /login | Landing.tsx | 2 min |
| C3 | Add 'council' to UserProfile tier type | authStore or types | 5 min |
| C4 | Signup: use magic link instead of password | SignupPage.tsx | 30 min |
| C5 | Add loading states between assessment steps | AssessmentWizard.tsx | 30 min |
| C6 | Ensure VITE_ENABLE_PLATFORM=false in Vercel prod | Vercel env | 1 min |

---

## 🔒 IP NAMING RULES (LOCKED — apply to ALL new code)

| Internal | User-Facing | Scope |
|----------|-------------|-------|
| TRIDENT | Match Analysis | UI text only |
| PHI | Priority Score | UI text only |
| LENS | Candidate Report | UI text only |
| Proximity | Career Stage Analysis | UI text only |
| METRIX | Performance Metrics | UI text only |
| SWEEP/CANVA/GRID/PLACED | Never appear in UI | — |
| Nexus | Nexus (it's the AI's name) | — |
| D3 Framework | Remove entirely | — |

**Variable names, function names, imports, CSS classes, API endpoints = keep internal names. UI text only = use user-friendly names.**

---

## 🏗️ ARCHITECTURE CONTEXT

- **Tech:** React 18 + Vite + Tailwind CSS + Supabase + DeepSeek API
- **Auth:** Supabase Auth (magic link + password)
- **AI:** `/api/chat` server-side proxy → DeepSeek (primary) + Coze (fallback)
- **Scoring:** `/api/score` server-side → weights hidden from frontend
- **Payments:** Stripe (keys need configuration)
- **Analytics:** PostHog (initialized, zero events)
- **Email:** Resend (key not configured)
- **Deploy:** Vercel — auto-deploys from main branch
- **Supabase:** 10K+ contacts, daily Notion→Supabase sync running

---

*Compiled by NEXUS for Kevin — 2026-05-27*
