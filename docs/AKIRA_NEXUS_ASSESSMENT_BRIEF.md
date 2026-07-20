# NEXUS AI & Assessment Center — Technical Brief for Akira

**Date:** 2026-07-21  
**Author:** NEXUS (product spec) → Akira (engineer)  
**Reference Spec:** `docs/specs/ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v2.md` (APPROVED by Kevin)  
**Repo:** `kevinhongfr-star/lyc-intelligence`, branch `main`

---

## 1. Two Integration Surfaces, One Engine

You're building 5 layers. They serve two surfaces:

| Surface | Route | Purpose |
|---------|-------|---------|
| **NEXUS AI Chatbot** | `/nexus` (B2C) + `/candidate/coach` (Candidate) | Conversational AI that knows SHIFT frameworks, creates desire for assessments |
| **Assessment & Diagnostics Center** | `/candidate/assessments` (Candidate Portal) | Structured assessment-taking, scoring, reporting |

Both surfaces call the **same engine** (your Layers 1-3). The difference is just the UI shell and access context.

---

## 2. Your 5-Layer Architecture → Integration Map

```
Your Layer 1: Scoring Engine (Python, deterministic)
  → Called by: Assessment Center (on submission)
  → Input: JSON {instrument, responses}
  → Output: scored profile JSON

Your Layer 2: Narrative Generator (DeepSeek API)
  → Called by: Assessment Center (report generation) + NEXUS (sample previews)
  → Assessment Center: full narrative report
  → NEXUS: abbreviated "teaser" previews only

Your Layer 3: Report Generator (PDF/HTML)
  → Called by: Assessment Center only
  → Branded PDF with radar charts, archetype visuals

Your Layer 4: Chatbot (NEXUS conversational AI)
  → This IS the NEXUS chatbot surface
  → Streaming SSE via DeepSeek
  → Framework-fluent, proactive, desire-creating

Your Layer 5: SHIFT Composite
  → Called by: Assessment Center (after multiple assessments completed)
  → Formula: LEAP×0.15 + QUEST×0.25 + COACH×0.20 + DRIVE×0.15 + IMPACT×0.25
```

---

## 3. NEXUS AI Chatbot — What to Build

### 3.1 Design Philosophy (from Willy Te user research)

NEXUS must behave like the best executive coach:
- **Proactively inquisitive** — surface questions/tensions user hasn't articulated
- **Framework-fluent but invisible** — knows all SHIFT dimensions but NEVER names them to users
- **Confidential** — positioned as the private space for career thinking
- **Desire-creating** — shows what's possible, never gives the real assessment

### 3.2 Current Codebase State

**Two competing implementations exist:**

| File | Status | Issues |
|------|--------|--------|
| `src/pages/NexusPage.tsx` (212L) | Active (routed to `/nexus`) | Dark theme, NO auth, NO credits, calls wrong API (`/api/chat`), no persistence, leaks diagnostic tags |
| `src/components/nexus/NexusChat.tsx` (810L) | Dead code (never routed) | Better: has auth, credits, sidebar, session management. But: DiagnosticProgressBar shows framework names (violates spec) |
| `src/pages/candidate/CandidateNexusCoachPage.tsx` (339L) | Active | Uses mock AI (hardcoded responses), calls generic `coze.ts` not real NEXUS API |
| `api/_lib/nexusChatHandler.ts` | Backend | Streaming DeepSeek, seniority detection, rate limiting — GOOD, keep this |
| `api/_lib/nexusPersona.ts` | System prompt | Has seniority calibration, coaching-first principles — needs SHIFT knowledge added |

**Other issues:**
- `NexusLanding.tsx` is dead code (duplicate import in App.tsx)
- DeepSeek alias `deepseek-v4-flash` expiring ~July 24 → must change to `deepseek-chat`

### 3.3 What to Build

**Single NEXUS chat component** that works in both B2C (`/nexus`) and Candidate (`/candidate/coach`) portals. The only difference is context (user profile, available assessments).

**Key requirements:**

1. **Route to NexusChat.tsx** — delete NexusPage.tsx or make it a thin wrapper around NexusChat
2. **Auth gate** — Free users get static pages only; Explorer (€5/mo) gets unlimited NEXUS
3. **Fix API endpoint** — switch from `/api/chat` to `/api/nexus/chat` (streaming SSE)
4. **Fix DeepSeek model** — `deepseek-v4-flash` → `deepseek-chat` in all handlers
5. **Strip diagnostic tags** — apply `stripTagsForDisplay()` to all responses before rendering
6. **Remove DiagnosticProgressBar from user view** — or make it fully invisible to users
7. **Session persistence** — use `nexus_conversations` table (schema in spec §11.1)
8. **Credit earning triggers** — after framework exploration → emit engagement event (+5 credits)
9. **Assessment recommendation** — NEXUS suggests which instrument to take, shows credit cost, routes to Assessment Center

**System prompt additions needed in `nexusPersona.ts`:**
- Full SHIFT framework knowledge (5 instruments + BRIDGE + SPARK)
- Sample insight library (anonymized examples for preview)
- Assessment routing logic (which conversation signals → which instrument recommendation)
- Confidentiality messaging
- Credit awareness (knows costs but doesn't hard-sell)

**What NEXUS must NEVER do:**
- Show framework names (LEAP, QUEST, COACH, DRIVE, IMPACT)
- Show dimension names or raw scores
- Give actual assessment results
- Show prices or sell directly
- Answer questions user already has → ask questions they haven't thought of

---

## 4. Assessment & Diagnostics Center — What to Build

### 4.1 Current Codebase State

**Files to DELETE (all wrong):**
- `src/services/shiftAssessmentTypes.ts` — wrong dimensions, wrong weights
- `src/services/shiftAnalysis.ts` — wrong scoring algorithms
- `src/services/shiftService.ts` — wrong service logic
- `src/assessments/catalog.ts` — wrong definitions
- `src/services/assessmentEngine.ts` — CPD engine, not SHIFT
- `src/pages/candidate/CandidateAssessmentsPage.tsx` — wrong categories
- `src/pages/candidate/CandidateAdvancedAssessmentsPage.tsx` — wrong categories
- `src/pages/candidate/CandidatePortalV2Page.tsx` — duplicate dashboard, hardcoded
- `src/pages/candidate/CandidateLifecyclePage.tsx` — admin page misplaced in candidate portal

**What exists that's useful:**
- `src/services/shiftReportRenderer.ts` — partial SHIFT report renderer (salvageable)
- Database migration infra (Drizzle/PostgreSQL)
- Auth system
- Stripe scaffold (needs env vars)
- General UI components

### 4.2 Instruments to Build

**Phase 1 (MVP — 6 instruments):**

| Instrument | Credits | Questions | Scoring |
|------------|---------|-----------|---------|
| **LEAP** | 30 | 35 forced-choice | DISC (D/I/S/C) + Career Readiness (CR1-CR5) + APAC Modifier |
| **QUEST** | 30 | 35 | Q1 Strategic(×0.25), Q2 Execution(×0.25), Q3 Commercial(×0.20), Q4 Stakeholder(×0.15), Q5 OrgDesign(×0.15) |
| **COACH** | 30 | 35 + 360° rater | C1 Directing(Q1-7), C2 Inspiring(Q8-14), C3 Supporting(Q15-21), C4 Analyzing(Q22-28), Pressure(Q29-34), APAC(Q35-41) |
| **DRIVE** | 30 | 35 forced-choice | D1 Achievement, D2 Purpose, D3 Security, D4 Autonomy, D5 Relationship |
| **IMPACT** | 30 | 35 + 10Q rater | I1 Results(×0.30), I2 Talent(×0.20), I3 Influence(×0.20), I4 Change(×0.15), I5 Innovation(×0.15) |
| **Full SHIFT Battery** | 120 | 175 | All 5 bundled, 20% discount vs 5×30 |

**Phase 2:**
- BRIDGE (35 credits, 35Q) — career transition
- SPARK (30 credits, TBD questions) — AI readiness

**Add-ons:**
- 360° Rater: 20 credits (5-10 raters)
- Detailed AI Report: 15 credits per assessment
- Peer Benchmarking: 25 credits/month
- Historical Tracking: 15 credits/month

### 4.3 Assessment Flow

```
1. User selects assessment (self-initiated or NEXUS recommendation)
2. Credit check: balance >= cost?
   - No → show upgrade/top-up prompt
   - Yes → deduct credits, begin assessment
3. Assessment UI presents questions (conversational wrapper, NOT wizard-style)
4. On completion: 10 credit refund (incentivize + collect data)
5. Layer 1 scoring engine runs → scored profile JSON
6. User offered detailed AI report (15 credits)
   - Layer 2: Narrative via DeepSeek
   - Layer 3: PDF with radar charts + branded layout
7. Results stored in `assessments` table
8. If 360° applicable → invite raters (20 credits)
9. If multiple instruments → Layer 5 computes SHIFT Composite
10. Results feed benchmarking + historical tracking
```

### 4.4 Scoring Engine Spec (Layer 1)

**Pure math. No AI. Deterministic. One engine, all instruments.**

For each instrument:
```
Input: JSON {INSTRUMENT_Q01: response_value, INSTRUMENT_Q02: response_value, ...}

1. Reverse-code flagged items (per instrument rules)
2. Normalize each dimension: raw_score / max_possible × 100
3. Calculate weighted composite (per instrument weights above)
4. Assign composite band: High (80-100) / Active (60-79) / Moderate (40-59) / Low (20-39) / Disengaged (0-19)
5. Calculate sub-scores (engagement risk for DRIVE, corroboration for IMPACT, etc.)
6. Classify primary type (3-step classification per instrument)
7. Assign archetype

Output: {
  instrument: "DRIVE",
  dimension_scores: {D1: 72, D2: 85, D3: 45, D4: 68, D5: 58},
  composite_score: 71.2,
  composite_band: "Active",
  primary_type: "Purpose-Achievement",
  archetype: "The Builder",
  risk_flags: {...},
  strengths: [...],
  development_areas: [...]
}
```

### 4.5 Report Generator Spec (Layer 3)

**Brand rules (mandatory):**
- Zero border-radius everywhere
- Fonts: Libre Baskerville (headlines), DM Sans (body)
- Accent: fuchsia `#C108AB`
- Logo: `Brand_Assets/lyc-logo-kevin-selected.png`
- No emoji anywhere
- Footer: "CP·Confidential" + page number (grey)
- "McKinsey meets Soho House" aesthetic

---

## 5. Candidate Portal — Integration Changes

The Candidate Portal pages that need updating:

| Page | Action |
|------|--------|
| `CandidateAssessmentsPage.tsx` | **Replace** → Assessment Center catalog (SHIFT instruments, credit costs) |
| `CandidateAdvancedAssessmentsPage.tsx` | **Delete** → merge into unified Assessment Center |
| `CandidateNexusCoachPage.tsx` | **Replace** → use the shared NEXUS chatbot component (wired to real DeepSeek API) |
| `CandidateDashboardPage.tsx` | Add: credit balance, Engagement Cycle stage, recent results |
| `CandidateCareerDevPage.tsx` | Add: SHIFT profile integration, dev recommendations |
| `CandidatePortalV2Page.tsx` | **Delete** (duplicate, hardcoded) |
| `CandidateLifecyclePage.tsx` | **Move** to `/admin/` or `/internal/` |

---

## 6. Shared Database Schema

From spec v2.0 §11. Key tables your engine writes to:

```sql
-- Your scoring engine writes here
assessments (id, user_id, instrument, responses JSONB, dimension_scores JSONB, 
             composite_score, status, credit_cost, refund_issued)

-- Credit integration
credit_transactions (id, user_id, type, amount, source, balance_after)

-- Engagement tracking
engagement_events (id, user_id, event_type, credits_earned, metadata JSONB)

-- NEXUS conversations
nexus_conversations (id, user_id, messages JSONB, frameworks_discussed TEXT[], 
                     assessments_recommended TEXT[])

-- Reports (Layer 3 output)
reports (id, assessment_id, user_id, report_type, content JSONB, pdf_url, credit_cost)
```

**Credit tier mapping (spec v2.0, NOT the current broken code):**
- free → 0 credits
- explorer → 0 credits (NEXUS access only)
- developer → 500 credits/month
- executive → 1000 credits/month

**Current code uses WRONG tiers** (`free/basic/pro/council`) — must be replaced with `free/explorer/developer/executive`.

---

## 7. Credit Earning System

Track these engagement events and award credits:

| Action | Credits | How to detect |
|--------|---------|---------------|
| Framework exploration with NEXUS | 5 | Conversation completes a "framework exploration" pattern |
| Reflection prompt response | 3 | User responds to a NEXUS reflection question |
| Content engagement | 2 | User reads/listens to a content piece |
| Referral signup | 25 | New user signs up via referral link |
| Assessment completion | 10 (refund) | Assessment status → completed |
| Workshop participation | 10 | Post-MVP |

**Monthly earning rate for typical user: ~40-60 credits/month**

---

## 8. Engagement Cycles (Gamification)

NOT Duolingo. No streaks, no daily logins. Quarterly arcs based on depth:

| Stage | Criteria | Unlocks |
|-------|----------|---------|
| Curious (0-30 days) | 1-2 framework explorations | Benchmark teasers |
| Developing (30-90 days) | 2+ explorations + 1 assessment | Peer benchmarking |
| Established (90-180 days) | 3+ assessments + content engagement | Trend analysis, peer comparison |
| Authority (180+ days) | Full SHIFT battery + ongoing | Workshop access, leaderboard |

Display as "Leadership Intelligence Profile" maturity indicator on dashboard. Clean, professional, Bloomberg-terminal style.

---

## 9. Build Priority

### P0 — This Week
1. **DRIVE v2 Scoring Engine** — your Layer 1 prototype. Build with synthetic test data, show scored output.
2. **Fix DeepSeek model alias** — `deepseek-v4-flash` → `deepseek-chat` in:
   - `api/_lib/nexusChatHandler.ts`
   - `api/_lib/nexusPersona.ts`
   - `api/chat.ts`
3. **Route `/nexus` to NexusChat** — or merge the two implementations

### P1 — Week 2-3
4. Import Notion question banks for DRIVE (first instrument)
5. Build assessment-taking UI for DRIVE (conversational wrapper)
6. Wire credit deduction into assessment start flow
7. Update `nexusPersona.ts` with DRIVE knowledge + assessment recommendation logic

### P2 — Week 4-6
8. Remaining 4 SHIFT instruments (LEAP, QUEST, COACH, IMPACT)
9. Narrative Generator (Layer 2)
10. Report Generator (Layer 3) — PDF with radar charts
11. SHIFT Composite (Layer 5)
12. BRIDGE + SPARK

### P3 — Week 7+
13. 360° rater flow
14. Benchmarking engine
15. Engagement Cycles maturity tracking
16. Credit earning system

---

## 10. Blockers (Need Kevin)

| Blocker | Details |
|---------|---------|
| Stripe env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` not configured |
| `RESEND_API_KEY` | Not configured — needed for rater invitations, referral notifications |
| Notion API permissions | Some pages return 0 blocks — Kevin needs to verify share permissions for question bank import |

---

## 11. Key References

| Resource | Location |
|----------|----------|
| Product Spec v2.0 (APPROVED) | `docs/specs/ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v2.md` |
| SHIFT framework definitions | Notion Master Product Reference `398fafae-51be-81dc` |
| Question Bank DB | Notion `fe8bc7179ec2408c92f71c8e05998019` |
| Deliverables DB | Notion `9b6980dc1f714daa83226363647fd22d` |
| Diagnostics Gap Analysis | `docs/audits/AUDIT_B2C_DIAGNOSTICS.md` |
| NEXUS Chat Audit | `docs/audits/AUDIT_B2C_03_NEXUS.md` |
| Candidate Portal Audit | `docs/audits/AUDIT_B2C_08_CANDIDATE_PORTAL.md` |
| Master Audit Summary | `docs/audits/MASTER_AUDIT_SUMMARY.md` |
