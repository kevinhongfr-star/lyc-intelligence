# LYC Intelligence — Comprehensive Product & Code Audit
**Date:** 2026-05-26
**Auditors:** James/AI (NEXUS) + Claude (Code Review + Product Strategy)
**Baseline:** LYC_INTELLIGENCE_FULL_SPEC.md v2.0 (1617 lines)
**Repo:** kevinhongfr-star/lyc-intelligence
**Live:** https://lyc-intelligence.app

---

## Executive Summary

The v2.0 spec is a **complete rebuild brief**. The gap between spec and code is not incremental — it's fundamental. The code is an ATS-first scaffold with chat bolted on. The spec demands a career intelligence platform that makes a senior executive feel understood.

**Implementation vs v2.0 spec: ~20-25%.** Most critical features (lead funnel, memory, share cards, Nexus-first homepage) are either stubs or missing.

**But the bigger problem isn't missing features — it's missing product thinking.** The app was built around LYC as the subject (what LYC does, what LYC sells). The spec demands the user as the subject (what the user needs, what the user discovers about themselves). This is the distance between "not yet" and "yes."

---

## PART 0: THE UNDERLYING DIAGNOSIS

After 30 minutes with this product, does a senior executive feel understood?

Not informed. Not scored. Not assessed. **Understood** — the way you feel after a conversation with someone who has seen a hundred careers like yours and tells you something true about your specific situation.

If the answer is yes, everything else is solvable. If the answer is no, the features don't matter.

**Right now the answer is not yet yes.** Everything below is the distance between not yet and yes.

### The Product Puts LYC at the Center. It Should Put the User at the Center.

Every page, every prompt, every message puts LYC as the subject and asks the user to be interested in LYC. The product needs to be designed around the user as the subject. LYC's knowledge and methodology are the tools the user benefits from — not the thing the user is asked to care about.

The Apple comparison from the spec is precise. When you open an iPhone, you don't see "Welcome to Apple's mobile operating system. Here's how our A17 chip works." You see your apps. The product puts you at the center immediately. Apple's knowledge is in the experience, not in a description of Apple.

LYC's 47-market knowledge should be in the quality of Nexus's responses and the specificity of the assessment results — not in a bullet list in the welcome message.

---

## PART 1: THE 6 CRITICAL FIXES (Spec Section 4)

| Fix | Spec Requirement | Current Code | Status | Gap |
|-----|-----------------|--------------|--------|-----|
| **Fix 1** — Nexus email capture | Soft ask at message 3, hard gate at message 5, store to b2c_leads | EmailCapture component exists. `/api/chat` has lead capture rule in system prompt but no programmatic enforcement | ⚠️ PARTIAL | System prompt says "after 3rd response" but no frontend enforcement of hard gate at msg 5 |
| **Fix 2** — Assessment scoring is fake | "Math.random() * 4 + 6 — every result is random" | AssessmentWizard uses ASSESSMENT_ENGINE.getDimensionScores() with real answer-based scoring. NOT random. | ✅ RESOLVED | Spec describes a previous version. Current code calculates scores from answers properly |
| **Fix 3** — Homepage conflates public/internal | Remove login from /, Nexus-first entry point, move login to /login only | Landing.tsx has "Sign In" link to /platform. No Nexus chat on homepage. Hero says "AI-powered executive search. TRIDENT scoring. Pipeline management." | ❌ BROKEN | Homepage is a product catalog, not a Nexus-first experience. /platform link exposes ATS |
| **Fix 4** — B2B/B2C pages capture zero leads | LeadCaptureForm on both pages, wired to Supabase | B2BLanding.tsx imports LeadCaptureForm. B2CLanding does NOT | ⚠️ PARTIAL | B2B has the form, B2C doesn't. Neither verified end-to-end |
| **Fix 5** — Remove /platform from public app | All /platform/* routes behind VITE_ENABLE_PLATFORM=true, default false | Flag EXISTS in App.tsx (wraps /platform routes). Default behavior = disabled unless env var set | ✅ MOSTLY DONE | Flag exists but may be set to 'true' in Vercel env |
| **Fix 6** — TRIDENT weights publicly exposed | "D1: 40%, D2: 35%, D3: 25%" on B2BLanding | B2BLanding shows D1/D2/D3 dimension names and descriptions but NOT percentage weights | ✅ RESOLVED | Dimension names shown (acceptable), weights NOT shown (correct) |

**Fixes score: 2.5 / 6 resolved.**

---

## PART 2: PRIORITY STACK AUDIT (Spec Section 3)

### Priority 1 — Lead Generation Engine (2/10)

| Requirement | Code Status | Gap |
|-------------|-------------|-----|
| Nexus captures emails | EmailCapture component exists, soft gate in system prompt | No hard gate at message 5. No programmatic enforcement |
| Every tool captures emails | LeadCaptureForm on B2B only | B2C landing has no lead form. Users can browse forever without giving email |
| No user leaves without a lead record | NOT ENFORCED | Users can chat on Nexus indefinitely, visit /match without giving email |
| Lead notification to consultant | /api/email exists but RESEND_API_KEY not configured | No email notifications work |

### Priority 2 — Self-Serve Revenue Product (3/10)

| Requirement | Code Status | Gap |
|-------------|-------------|-----|
| Stranger can land, pay, get value without humans | Stripe stub exists but keys not configured | Zero payment capability |
| Assessments work | AssessmentWizard with 1 type (CPD/SHIFT) | Spec requires 10 types. Only 1 wired |
| TRIDENT matches work | /api/score server-side, ResultsTable | Works but no credit gating, no split-panel UX |
| Credit system | CreditContext, creditService, CreditBadge, CreditGate all exist | No daily reset, no credit consumption, balance not in header |
| Pricing: Pro $49/mo, Council $199/mo | Stripe has basic/pro/council at OLD prices ($9.99/$29.99/$29) | Prices don't match spec |

### Priority 3 — Qualify & Route to High-Ticket (0/10)

Completely missing. No hot lead detection, no auto-notification, no engagement tracking.

### Priority 4 — Viral Loop (1/10)

Stubs only. ShareCard component exists but OG tags, LinkedIn sharing, and referral system are missing.

### Priority 5 — Persistent Intelligence Layer (1/10)

Files exist (memoryService.ts, memoryStore.ts) but no extraction or injection logic. Memory context is never injected into Nexus conversations.

### Priority 6 — ATS / Client Portal

**The most built part is the lowest priority.** This is the core problem. The app was built ICP 3 first (consultants/ATS), when the spec says build ICP 1+2 first (professionals/companies).

---

## PART 3: PRODUCT VISION AUDIT

### 3.1 Positioning Mismatch

| Spec Says | Code Says |
|-----------|-----------|
| "Persistent career intelligence platform" | "AI-powered executive search. TRIDENT scoring. Pipeline management." |
| "Career operating system for executives" | "I'm a leader" / "I'm hiring" — split persona, not unified |
| "Available at 11pm, costs $30/month" | $9.99/$29.99 — wrong price points |
| "Defensible against ChatGPT" | Nexus prompt is generic career advice, not LYC-institutional-knowledge-grounded |
| "Not a marketing tool" | Product feels like an ATS with chat bolted on |
| "The moment users feel marketed to, trust breaks" | Homepage pushes TRIDENT, Pipeline, Assessments — feature catalog, not value-first |

### 3.2 ICP Mismatch

| Spec ICP | Code Reality |
|----------|-------------|
| **ICP 1 — The Professional** (unified leader/candidate) | B2C page treats "leaders" as assessment takers. No career OS. No memory. No persistence |
| **ICP 2 — The Company** (CHRO/CEO using TRIDENT) | B2B page exists with lead form. TRIDENT works. Best-aligned ICP |
| **ICP 3 — Consultant** (Phase 3+) | Currently the PRIMARY user (full /platform access) — inverted priority |
| **ICP 4 — Enterprise** (Phase 4+) | Not built (correct per spec) |

---

## PART 4: PRODUCT GAPS (No Amount of Coding Fixes These)

### 4.1 There's No Hook

The product has no single moment that makes a user tell someone else about it. The assessment results show scores and an archetype label. That's data, not an insight. What makes someone post on LinkedIn is a result that says something specific and true about their career that they didn't already know.

**Example of shareable insight:** "You scored 71 on Cross-Border Adaptability but only 52 on Stakeholder Influence. For an APAC move, that gap matters more than any credential on your CV."

That sentence — delivered at the right moment — is shareable. A horizontal bar chart is not.

The product needs one moment where the user thinks **"how did it know that."** Currently that moment doesn't exist.

### 4.2 No Reason To Come Back After the Assessment

Complete the assessment, see your archetype, see five score bars. Then what? There's no natural next step. "Talk to Nexus" is too vague. The product should immediately bridge result to action:

**"Your biggest gap for the APAC transition you mentioned is Stakeholder Influence at 52. Want me to build a 90-day plan for that specifically?"**

The assessment and Nexus are two separate islands with no bridge between them.

### 4.3 No Reason To Come Back on Day 2

Day 2. What brings the user back? No notification. No email. No streak prompt. No "your assessment is 90 days old." No "based on your goals, here's what I'd work on this week." The product is entirely passive — it waits for the user to return instead of creating a reason to return.

Duolingo understood that retention isn't about feature quality, it's about engineered daily habit triggers. The memory system and progress tracking are built for longitudinal value but nothing activates that value automatically.

### 4.4 The Email Gate Asks For Trust Before Earning It

Message 3 is too early when the conversation opens with four bullets about LYC's service menu. The user hasn't received a single thing of value yet. They've read a company brochure. The gate should trigger after Nexus says something that makes the user think — a specific insight, a real benchmark, a provocative observation about their profile. Trust earns the email. Currently the sequence is reversed.

### 4.5 The Pricing Page Sells Credits, Not Outcomes

"50 credits/month" means nothing to a senior executive. What does 50 credits enable you to accomplish? The pricing page should sell experiences:

- "Score 20 candidates against your next hire"
- "Get your full cross-border leadership profile plus unlimited advisory conversations for a month"
- "One quarterly call with a LYC partner who has placed executives in your target market"

Credits are a mechanic, not a value proposition. Nobody upgrades for credits. They upgrade because they can see the outcome they're buying.

### 4.6 The Council Tier Doesn't Have a Story

"Quarterly advisory call" is listed as a bullet point. It's the most differentiated thing in the product — a real human expert conversation — and it's presented with the same visual weight as "Email Support: Dedicated."

The Council needs a narrative: **"A LYC partner who has placed five executives in your target market reviews your profile and tells you exactly what's standing between you and that next role."** That one sentence is worth $199/month. The current page doesn't sell it.

### 4.7 B2B Has No Team Layer

A CHRO doesn't use tools alone. They share outputs with their hiring manager, their CEO, their board. There's no way to share a TRIDENT result with a colleague inside the product. No team workspace. No "send this shortlist to your hiring manager" button. The tool creates value in isolation and then traps it there.

### 4.8 No Social Proof Anywhere

Not one testimonial. Not one named executive. Not one case study. The product claims "500+ placements across 47 markets" — but not a single real person's name is attached. Three real quotes from real people transform credibility more than any design improvement. **This is the fastest-acting thing on this entire list.**

### 4.9 The Competitive Answer Is Still Incomplete

Why not just use ChatGPT? The honest answer has two parts:

1. **LYC's proprietary knowledge** — 500 placements, 47 markets, real data on what causes cross-border executive transitions to fail. None of that knowledge is in the product in a way users can feel.
2. **Memory and continuity** — after 90 days, Nexus knows more about your career than any generic AI ever will. But that requires the product to survive long enough for users to reach 90 days. Which requires the first part to be good enough to keep them coming back.

The answer to "why not ChatGPT" is: **because Nexus knows things ChatGPT doesn't, and it remembers you.** The product needs to demonstrate the first half in the first conversation — before it can earn the second half.

---

## PART 5: CODE-LEVEL CRITICAL ISSUES

### 5.1 Two Chat Implementations — The Wrong One Is Dangerous

**coze.ts** still exists with `VITE_DEEPSEEK_API_KEY` client-side and calls DeepSeek directly from the browser. The excellent `/api/chat` proxy handler also exists. NexusChat.tsx correctly calls `/api/chat`. But coze.ts is still in the codebase with the exposed key — and the old system prompt containing all internal methodology (SWEEP→CANVA→GRID→LENS→PLACED, PHI Framework, Proximity scoring) is sitting in the browser bundle readable by anyone in DevTools.

**Action:** Delete coze.ts entirely or strip the key and internal prompt.

### 5.2 The Nexus Welcome Message Is Still a Marketing Brochure

NexusChat.tsx hardcodes:
> "Hi! I'm Nexus, LYC Partners' AI assistant. I can help you with: Executive Search — How we find cross-border leaders / TRIDENT Matching — How our AI-powered JD↔CV matching works / Career Strategy — Guidance for senior leaders / Leadership Advisory — Our D3 Framework: Diagnose · Design · Deliver"

This is a customer service bot for LYC Partners, not a career advisor for the user. All four suggested prompts are about LYC. None of them are about the user.

**Replace with something that demonstrates market knowledge in the first sentence, directed at the user:**

> "I'm Nexus. LYC Partners has placed 500+ executives across 47 markets — I carry that knowledge into every conversation. One in three cross-border executive moves fails within 18 months. Usually for the same reasons. What are you navigating right now?"

That opening does three things: establishes authority, states a provocative specific fact, and asks about the user. The current opening does none of those.

### 5.3 The Four Suggested Prompts Are LYC-Centric, Not User-Centric

| Current (about LYC) | Should Be (about the user) |
|---------------------|---------------------------|
| "What does LYC do?" | "I'm considering a move from Europe to APAC — what do I need to know?" |
| "How does TRIDENT matching work?" | "What makes a strong cross-border CFO profile in 2026?" |
| "Tell me about the D3 Framework" | "I have an interview at a Singapore MNC next week — help me prepare" |
| "What is The Council?" | "How does my profile benchmark against regional C-suite candidates?" |

Four questions about the user's career vs four questions about LYC. The entire impression of the product changes.

### 5.4 B2B Page Is White — Brand Fracture

B2BLanding.tsx has `bg: '#FFFFFF', text: '#0A0A0A'` — a completely different visual world from every other page on the domain. A user who clicks "I'm hiring" from the dark homepage arrives somewhere that looks like a different company's website.

**Fix:** One line change: `bg: '#0A0A0A', text: '#FFFFFF', border: '#222222'`. Consistent brand, coherent experience.

### 5.5 Proprietary IP Names Should Not Appear in the UI

TRIDENT, PACE, CVFlow, D3 Framework, PHI — these are internal LYC IP names. They mean nothing to a user and they expose methodology. The only proprietary name that should appear in the product is **Nexus** (the AI's name, which is a product brand, not methodology).

**Current violations:**
- "TRIDENT Match" appears as a nav item, page heading, B2B feature card, and throughout the app
- "TRIDENT 3D Scoring Model" section on B2B page with D1/D2/D3 labels
- "METRIX" as a nav item
- "LENS Report" as a nav item and page
- "D3 Framework" in Nexus prompts and suggested actions
- "PHI" in scoring service names

**The rule:** Internal IP names should only appear as a button label to run a tool (e.g., "Run Match Analysis" is fine; "TRIDENT Match" is not). Everything in the UI should be self-explanatory to a user who has never heard of LYC.

| Current | Should Be |
|---------|-----------|
| TRIDENT Match | Match Analysis / Candidate Matching |
| TRIDENT 3D Scoring Model | 3-Dimension Scoring |
| LENS Report | Candidate Report / Shortlist Report |
| METRIX | Performance Metrics / Analytics |
| D3 Framework | (remove entirely — Kevin locked "No D3 Framework") |
| PHI Score | Priority Score / Pipeline Score |

Nexus is the single exception — it's the AI's name, a product brand, not internal methodology.

### 5.6 Homepage Has Five Competing Destinations

Two ICP cards ("I'm a leader" / "I'm hiring") plus three product cards (TRIDENT Match, Assessment, Nexus AI) plus nav links to all of those again. A first-time visitor has no idea which to start with. No hierarchy. No "this is the thing you do first."

**Fix:** Single dominant entry point. Remove the product cards. Put the Nexus chat widget as the hero — full width, prominent, immediately usable. Let the ICP cards be secondary for people who want structure. Most people will just type.

### 5.7 coze.ts Contains Internal Methodology in Browser Bundle

The old system prompt in coze.ts with all internal methodology (SWEEP→CANVA→GRID→LENS→PLACED, PHI Framework, Proximity scoring definitions) is accessible to anyone who opens DevTools. This violates every safety rule in the spec.

### 5.8 AUTHENTICATED_SYSTEM_PROMPT_TEMPLATE Never Uses User Profile Data

The template has `{memory_context}` and `{document_context}` placeholders, and the handler replaces them — but only from the memoryContext array passed in the request body, which is always empty. The user's name, title, goals, assessment scores, archetype — none of this reaches Nexus. Every conversation starts from zero context regardless of how long someone has been a user.

### 5.9 TRIDENT Results Show Raw Scores to Users

The spec intent was verdict labels only (Strong Primary, Strong Secondary, Reserve) — not raw numbers. Results show D1: 87, D2: 79, D3: 82. These numbers mean nothing to a user and expose methodology.

### 5.10 Free Assessment Gate Doesn't Exist

A user can take unlimited assessments with no account. The spec intent was 1 free per visitor then gate. Nothing tracks whether an anonymous user has already taken one.

### 5.11 Signup Uses Password, Not Magic Link

SignupPage uses `supabase.auth.signUp({ email, password })`. Magic link is implemented in `signInWithMagicLink()` but the signup flow doesn't use it. For senior executives using work email, magic link is significantly better conversion — lower friction, higher trust.

### 5.12 PostHog Is Initialized But Fires Zero Events

analytics.ts is wired in main.tsx but no events are actually tracked. You'll have zero data on user behavior at launch.

### 5.13 No Mobile Layout Anywhere

Three-column grids, 900px max-width containers, 52px horizontal padding — none of it is responsive. On a 390px iPhone screen, the assessment page and dashboard are unusable. The primary traffic source (LinkedIn on mobile) leads to a broken layout.

### 5.14 OG Tags Don't Work for Share Cards

index.html has static OG tags. Dynamic /share/:id routes can't inject per-card meta tags at render time. Without SSR or prerender, LinkedIn shows generic site title for every share card. The viral mechanic doesn't work.

### 5.15 No Loading State Between Assessment Steps

When a user clicks an answer and the wizard transitions, there's no visual feedback. On slow connections, this feels frozen.

### 5.16 Assessment Results Show Data Without Meaning

"Archetype: Strategic Architect" followed by dimension bars. No positioning statement. No 90-day priorities. The assessment generates scores and an archetype — but the interpretation, the "so what," the thing that makes someone want to share it, is absent.

---

## PART 6: SPECIFIC FEATURE GAPS

### Nexus Chat

| Spec | Code | Gap |
|------|------|-----|
| Dual system prompt (anonymous vs authenticated) | api/chat.ts has both | ✅ Done |
| Memory injection for authenticated users | memoryStore.ts exists | ❌ Not wired — always empty |
| Document context injection | documentContext state exists | ⚠️ Upload→injection flow unconfirmed |
| Hard email gate at message 5 | No enforcement | ❌ Missing |
| User-centric suggested prompts | LYC-centric prompts | ❌ Wrong approach |
| Suggested prompts after each response | data.suggested_prompts from API | ✅ Done |

### Assessment

| Spec | Code | Gap |
|------|------|-----|
| 10 assessment types | catalog.ts has 10 types defined | ⚠️ Only CPD/SHIFT wired |
| Real scoring from answers | ASSESSMENT_ENGINE calculates from answers | ✅ Done |
| Shareable result card | No share card on assessment results | ❌ Missing |
| Credit consumption (1 credit per assessment) | No credit deduction | ❌ Missing |
| Insight-driven results (not just scores) | ResultsPanel shows scores + archetype | ❌ No "so what" — no 90-day plan, no bridging insight |
| PDF export | jspdf + html2canvas in deps, onDownloadPDF exists | ⚠️ Unverified |

### TRIDENT Match

| Spec | Code | Gap |
|------|------|-----|
| Split-panel UX (Meheran reference) | Sequential form → results | ❌ Not implemented |
| Dimension charts (radar/horizontal bars) | ResultsTable only | ❌ No charts |
| Score badges with verdict labels only | Results show raw scores (D1: 87, D2: 79) | ❌ Exposes methodology |
| Credit gating (3 free, then 2 credits each) | getCreditCost() exists | ⚠️ Logic exists, not enforced in UI |

### Share Cards

| Spec | Code | Gap |
|------|------|-----|
| html2canvas generation | ShareCard + /share/:id exist | ⚠️ Unverified |
| OG meta tags on /share/:id | Static tags only | ❌ Dynamic OG doesn't work |
| LinkedIn share button | Not found | ❌ Missing |
| Referral link with credit reward | No referral system | ❌ Missing |

### Memory System

| Spec | Code | Gap |
|------|------|-----|
| Post-conversation extraction (/api/memory) | api/memory.ts exists | ⚠️ Stub |
| Memory injection into Nexus | memoryStore.ts exists | ⚠️ Stub — always empty |
| User memory dashboard | Not found | ❌ Missing |
| Memory categories (career goals, preferences, experience) | Not implemented | ❌ Missing |

---

## PART 7: PRICING MISMATCH

| Tier | Spec v2.0 | Code (Stripe) | Code (creditService) |
|------|-----------|---------------|---------------------|
| Free | $0 | $0 | 0 credits |
| Pro | **$49/mo** | $29.99 | 200 credits |
| Council | **$199/mo** | $29 | 999999 credits |
| Basic | Not in spec | $9.99 | 50 credits |

The spec killed "Basic" and raised Pro/Council prices. Code still has old tiers.

---

## PART 8: SECURITY AUDIT

| Checklist Item | Status |
|----------------|--------|
| All sensitive API keys server-side | ❌ VITE_DEEPSEEK_API_KEY is client-exposed |
| No VITE_DEEPSEEK_API_KEY client-side | ❌ Still in Vercel env vars |
| Supabase RLS enabled and tested on all 9 tables | ⚠️ Some RLS policies exist, not all verified |
| Supabase service role key NEVER in client code | ⚠️ Not found in frontend code |
| Rate limiting on /api/chat (30/min) | ❌ Not implemented |
| Rate limiting on /api/score (10/min) | ❌ Not implemented |
| Input sanitization (prompt injection) | ❌ Not implemented |
| CORS configured (whitelist lyc-intelligence.app) | ❌ Not implemented |
| No internal methodology in client code/prompts | ❌ "D3 Framework" + SWEEP/CANVA/GRID/LENS/PLACED in coze.ts |
| Vercel env vars correct | ⚠️ All vars present but VITE_DEEPSEEK_API_KEY should be removed |

---

## PART 9: PHASE PLAN COMPLIANCE

### Phase 1 — Fix + Core Launch (Weeks 1-2): 3/12 done

| Task | Done? |
|------|-------|
| Fix 1: Nexus email capture at message 3 | ⚠️ Partial (prompt only, no hard gate) |
| Fix 2: Assessment real scoring | ✅ Done |
| Fix 3: Homepage as Nexus-first | ❌ Not done (still product catalog) |
| Fix 4: B2B + B2C lead capture | ⚠️ Partial |
| Fix 5: Remove /platform from public | ⚠️ Flag exists, may still be enabled |
| Fix 6: Strip TRIDENT weights | ✅ Done |
| Set all API keys server-side | ❌ VITE_DEEPSEEK_API_KEY still exposed |
| Supabase RLS on all tables | ⚠️ Partial |
| Basic analytics (PostHog, 5 events) | ❌ Initialized but zero events fired |
| Mobile responsiveness | ⚠️ Partial |
| Split Nexus system prompt | ✅ Done |
| Lead notification email | ❌ RESEND_API_KEY not configured |

---

## PART 10: WHAT THE APP DOES RIGHT

1. **Server-side TRIDENT scoring** — weights hidden from frontend
2. **Supabase data layer** — 10K+ contacts, daily sync running reliably
3. **Assessment engine is real** — answers flow to scores, not random
4. **The /api/chat handler is genuinely well-built** — server-side keys, DeepSeek primary, Coze fallback, memory injection architecture, suggested prompts
5. **Auth + credit structure** — Zustand stores, contexts exist, magic link implemented
6. **VITE_ENABLE_PLATFORM flag** — ATS can be hidden (if set correctly)
7. **Dual Nexus prompts** — anonymous vs authenticated
8. **LeadCaptureForm** — reusable, properly validated
9. **ReactMarkdown + remark-gfm** — installed and wired, tables render
10. **Dashboard, Profile, Progress pages** — substantially built with real data fetching

The bones are strong. The problems are real but most are fixable fast.

---

## PART 11: THE FIX PRIORITY

### Before Any User Sees This (One Focused Day)

| # | Fix | Time |
|---|-----|------|
| 1 | Rewrite Nexus welcome message + suggested prompts (user-centric, not LYC-centric) | 30 min |
| 2 | Dark theme: PricingPage, MatchPage, B2BLanding | 20 min |
| 3 | Fix Landing.tsx "Sign In" → /login (not /platform) | 2 min |
| 4 | Connect memory context to NexusChat send() | 1 hour |
| 5 | Add 'council' to UserProfile tier type | 5 min |
| 6 | Delete or sanitize coze.ts (strip key + internal prompt) | 10 min |
| 7 | Add credit spend call to AssessmentWizard on completion | 30 min |
| 8 | Fix email capture position (inline after value, not top of list) | 45 min |
| 9 | Add 5 PostHog events | 30 min |
| 10 | Basic mobile CSS | 2 hours |

### Then: Nexus-First Homepage Rewrite

| # | Fix | Time |
|---|-----|------|
| 11 | Landing.tsx: Nexus chat widget as hero, remove product cards | 2 hours |
| 12 | B2C Landing: add LeadCaptureForm | 30 min |
| 13 | TRIDENT results: show verdict labels only, not raw scores | 30 min |

### Then: Revenue Enablement

| # | Fix | Time |
|---|-----|------|
| 14 | Fix pricing (remove Basic, Pro=$49, Council=$199) | 30 min |
| 15 | Remove VITE_DEEPSEEK_API_KEY, route all through /api/chat | 1 hour |
| 16 | Configure RESEND_API_KEY for lead notifications | 30 min |
| 17 | Wire credit consumption (assessments=1, matches=2) | 1 hour |
| 18 | Add rate limiting + CORS | 1 hour |

### Then: Retention Hooks (Week 2)

| # | Fix | Time |
|---|-----|------|
| 19 | Assessment→Nexus bridge ("Your gap is X. Want a 90-day plan?") | 2 hours |
| 20 | Day-2 return trigger (email, streak, "your assessment is X days old") | 3 hours |
| 21 | Pricing page: sell outcomes, not credits | 1 hour |
| 22 | Council tier narrative | 30 min |
| 23 | Social proof (3 real testimonials) | 1 hour |
| 24 | B2B team sharing ("send this shortlist") | 3 hours |

### Then: Growth (Week 3)

| # | Fix | Time |
|---|-----|------|
| 25 | Share cards with working OG tags | 4 hours |
| 26 | Referral link + credit rewards | 3 hours |
| 27 | LinkedIn share button on results | 1 hour |
| 28 | Memory extraction after Nexus conversations | 4 hours |

---

## PART 12: THE NORTH STAR TEST

Every product decision should be tested against this sentence:

**"Does this make LYC Intelligence the most useful career advisor a senior professional has ever had?"**

If yes: build it.
If no: it's a distraction.
If it markets LYC but doesn't help the user: cut it.

The product earns the right to generate consulting leads by being genuinely, independently excellent. That's the only strategy that works.

---

*End of Comprehensive Audit — James/AI + Claude for Kevin*
*Version: 2.1 — 2026-05-26*
