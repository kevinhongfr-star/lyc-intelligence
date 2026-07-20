# B2C Assessment & Credit Experience Spec v1.0

**Status:** DRAFT — Pending Kevin review
**Date:** 2026-07-20
**Author:** NEXUS
**Replaces:** All existing assessment code (shiftAssessmentTypes.ts, catalog.ts, AssessmentPage.tsx, etc.)
**Depends on:** Notion Master Product Reference, Question Bank DB (fe8bc717), Agent Build Context (398fafae)

---

## 1. Design Principles

### 1.1 NEXUS Is the Product
NEXUS is not a chatbot bolted onto a platform. NEXUS IS the platform experience. Every assessment, every insight, every credit interaction flows through NEXUS. The user never sees a raw form or a standalone assessment page — they have a conversation with an entity that happens to be the world's most sophisticated leadership intelligence engine.

### 1.2 Show, Don't Sell
The free experience must be genuinely valuable. Users should receive real insights from real frameworks before they spend a single credit. The conversion moment comes when they think "I need the full picture" — not when they hit a paywall.

### 1.3 Executive-Grade Gamification
No cartoon mascots. No "Level 5 unlocked!" banners. The gamification language is peer-level: "Your Governance Intelligence Index has advanced." "You've engaged with 4 cross-border briefings this cycle." Think Bloomberg Terminal engagement, not Duolingo streaks. The behavioral nudges are about intellectual growth, not dopamine hits.

### 1.4 Credits Are Earned, Not Just Bought
The credit economy rewards the behaviors that benefit both the user and the platform:
- **Learning**: Reading briefings, completing educational modules
- **Engagement**: Daily visits, streak consistency, content interaction
- **Nurturing**: Referring peers, sharing insights, completing profiles
- **Awareness**: Attending webinars, downloading reports

Payment is ONE path to credits. The primary path is engagement. This creates a self-sustaining flywheel: users engage → earn credits → use diagnostics → get insights → want deeper diagnostics → engage more.

### 1.5 Token Economics: Break-Even Floor
Every credit earned through free actions must be calibrated so the DeepSeek API cost of servicing that credit's worth of AI interaction does not exceed the platform's break-even threshold. Formula:

```
Credit Value ≥ (Avg tokens per interaction × Cost per token × Interactions per credit) × Safety Margin (1.3x)
```

---

## 2. User Journey Architecture

### 2.1 Phase 0: Discovery (Free, No Auth Required)
**Goal:** Demonstrate NEXUS intelligence. Create desire.

| Touchpoint | What Happens | Credit Cost |
|------------|-------------|-------------|
| Landing page (/b2c) | NEXUS greets, asks about their leadership context | Free |
| First conversation | NEXUS demonstrates knowledge of their situation using framework language | Free |
| Framework preview | "Based on what you've shared, your DRIVE profile might show a tension between Achievement and Security motivators. Here's what that typically looks like..." | Free |
| Sample insight card | Visual preview of what a full diagnostic report looks like (blurred/teaser) | Free |
| CTA | "Take the DRIVE diagnostic to see your actual profile" | — |

**NEXUS Knowledge Base (Phase 0):**
- Can discuss all 10+ diagnostics at a conceptual level
- References real dimensions from Notion specs (not fake code dimensions)
- Shows example report structures with anonymized data
- Uses the user's own language to frame which framework might be most relevant

### 2.2 Phase 1: First Assessment (Free, Auth Required)
**Goal:** Deliver genuine value from the first interaction. Prove the platform works.

| Assessment | Free Preview | What They Get | Credit Cost |
|-----------|-------------|---------------|-------------|
| LEAP | Full DISC behavioral profile (Layer A only — 16 forced-choice questions) | DISC style + primary archetype | **Free** (welcome gift) |
| QUEST | Strategic Thinking sub-scale only (6 questions from Q1) | Strategic Thinking score + AI Readiness flag | **3 credits** |
| DRIVE | Core Motivators module only (D1-D5 — 12 questions) | Motivator profile + alignment score | **3 credits** |
| COACH | Style quadrant self-assessment (28 questions — C1-C4) | Primary/Secondary style | **3 credits** |
| IMPACT | Business Results + Talent Development only (I1+I2 — ~15 questions) | Impact snapshot | **5 credits** |
| SHIFT Composite | Not available until ≥3 individual diagnostics completed | — | N/A |
| BRIDGE | Full 6-dimension assessment | Complete BRIDGE profile | **5 credits** |
| SPARK | Full AI Readiness assessment | Complete SPARK profile | **5 credits** |
| MOSAIC | Team version — requires team invite | Team cohesion report | **8 credits per participant** |
| PRISM | Full Career & Brand Positioning | Complete PRISM profile | **5 credits** |
| FORGE | Full Sales Excellence assessment | Complete FORGE profile | **5 credits** |

**Key rule:** LEAP Layer A (DISC) is ALWAYS free as the welcome gift. This is the hook. Once they see their DISC style and archetype, they want the full LEAP (Career Readiness + APAC Modifier) and then the other diagnostics.

### 2.3 Phase 2: Deepening (Credits Required)
**Goal:** Build the full SHIFT composite. Upsell advisory.

| Action | Credit Cost | What They Unlock |
|--------|-------------|-----------------|
| LEAP full (Layer B + C add-on) | 5 credits | Complete LEAP: DISC + Career Readiness + APAC Modifier + 16 archetypes |
| QUEST full | 5 credits | All 5 dimensions + AI Readiness sub-score + APAC Cross-Border Score |
| DRIVE full | 5 credits | All 3 modules + Direction Clarity + APAC Career Context |
| COACH full + 360° | 8 credits | 4 quadrants + Pressure Style + 360° rater (3-5 raters) + Style Clarity Score |
| IMPACT full + rater | 8 credits | All 5 dimensions + 10Q rater add-on |
| SHIFT Composite | Auto-calculated | Weighted formula once ≥3 diagnostics complete |
| Diagnostic debrief with NEXUS | 2 credits | AI-guided interpretation of results |
| Cross-sell recommendation | Free | "Based on your LEAP + DRIVE, you should also take QUEST because..." |

### 2.4 Phase 3: Conversion (Council/Upsell)
**Goal:** Move from diagnostics to advisory/retainer/Council.

NEXUS identifies conversion signals:
- User completes ≥3 SHIFT diagnostics
- User requests debrief sessions repeatedly
- User's results show specific patterns that match advisory service menus
- User's cohort/industry matches target clusters

Conversion path:
1. NEXUS surfaces relevant Advisory Service Menu (Force 1/2/3)
2. Offers free diagnostic debrief call (human, not AI)
3. Introduces Council membership if tier-appropriate
4. No hard sell — NEXUS presents options, Kevin/Claire close

---

## 3. NEXUS Companion: Framework Intelligence Spec

### 3.1 Knowledge Architecture
NEXUS must have deep knowledge of every diagnostic framework. System prompt must include:

```
You are NEXUS, the leadership intelligence engine built by LYC Partners.

You have deep expertise in the following diagnostic frameworks:

SHIFT DIAGNOSTIC STACK (Tier 1 — Individual):
1. LEAP — Leadership Evaluation & Psychological Profiling
   Measures: Behavioral wiring (DISC: D/I/S/C) + Career Readiness (5 dimensions) + APAC Behavioral Modifier
   Format: 35 questions — 16 DISC forced-choice (MOST/LEAST) + 15 Career Readiness + 4 APAC
   Scoring: DISC MOST +2/LEAST -1, normalized (raw+16)/48×100
   Composite: LEAP Score = (CR5 Behavioral Alignment × 0.30) + (Career Readiness Composite × 0.70)
   Output: Primary + secondary DISC style, 16 archetypes (DISC × Career Readiness band)
   Price: $800-$1,500 B2C | Company L&D funded B2B

2. QUEST — Qualitative Executive Skills Test
   Measures: Executive capability (competency-based, developable skills)
   Format: 35 questions, 25 minutes
   Dimensions: Q1 Strategic Thinking(×0.25), Q2 Execution Drive(×0.25), Q3 Commercial Acumen(×0.20), Q4(×0.15), Q5(×0.15)
   Sub-scores: APAC Cross-Border Score (standalone), AI Readiness Sub-Score (3Q in Q1+Q2)
   Score Bands: 80-100 Signature Strength | 60-79 Active | 40-59 Developing | 20-39 Gap | 0-19 Critical
   Cross-reference with LEAP: High-D + High Strategic = aligned executive; High-D + Low Strategic = dangerous executive

3. COACH — Leadership Style Analysis
   Measures: Observable leadership style (how others experience your leadership)
   Format: 35Q base + optional 360° rater, 25 minutes
   Dimensions: C1 Directing(Q1-7), C2 Inspiring(Q8-14), C3 Supporting(Q15-21), C4 Analyzing(Q22-28)
   Sub-scores: Pressure Style(Q29-34), APAC Leadership Style Intelligence(Q35-41)
   COACH+ 360°: 3-5 raters × 12Q → Self-Awareness Gap per quadrant
   Output: Primary/Secondary/Shadow/Pressure Style + Style Clarity Score

4. DRIVE — Career Alignment Report
   Measures: Motivation, career alignment, direction clarity
   Format: 35 questions, 20 minutes
   Modules: D1-D5 Core Motivators (Achievement/Purpose/Security/Autonomy/Relationship) + Role Alignment(standalone) + Direction Clarity(standalone) + APAC Career Context
   Score Bands: 80-100 Aligned & Activated | 60-79 On Track | 40-59 Drift Zone | 20-39 Misaligned | 0-19 Career Crisis

5. IMPACT — Performance Analytics
   Measures: Leadership outputs (not inputs)
   Format: 35Q + 10Q optional rater, 25 minutes
   Dimensions: I1 Business Results(×0.30), I2 Talent Development(×0.20), I3 Strategic Influence(×0.20), I4 Change Architecture(×0.15), I5(×0.15)
   Score Bands: 80-100 High Impact | 60-79 Solid Contributor | 40-59 Impact Gap | 20-39 Underperforming | 0-19 Impact Crisis
   Role: Gates the Composite SHIFT Profile

SHIFT COMPOSITE FORMULA:
Composite = (LEAP × 0.15) + (QUEST × 0.25) + (COACH × 0.20) + (DRIVE × 0.15) + (IMPACT × 0.25)

TIER 2 — CROSS-CULTURAL & TEAM:
6. MOSAIC — Cross-cultural team cohesion (team assessment, requires multiple participants)

STANDALONE ASSESSMENTS:
7. BRIDGE — China/APAC Leadership Readiness
   Dimensions: B Board&HQ Alignment(×0.20), R Regulatory&Risk(×0.15), I Intelligence&Market Fluency(×0.15), D Decision Rights&Governance(×0.20), G GTM&Execution(×0.15), E Executive Talent&Succession(×0.15)
   Score Bands: 80-100 Ecosystem Architect | 60-79 Adaptive Operator | 40-59 Vulnerable Mandate | 20-39 Structural Gap | 0-19 Critical Risk

8. SPARK — AI Leadership Readiness (NOT an individual leadership assessment)
   Dimensions: AI Literacy, AI Governance Judgment, AI-Era Strategic Capability, Behavioral Adaptability, AI Team & Culture Leadership
   Format: 15-25 minutes online
   Cross-sell: Low AI Readiness → SHIFT-LEAP; Low AI Governance → BRIDGE; Low AI Strategy → QUEST debrief

9. PRISM — Career & Professional Brand Positioning
10. FORGE — Sales Excellence Assessment

CROSS-CULTURAL DIAGNOSTIC:
11. TRIDENT — Independent composite diagnostic (separate from SHIFT stack)
```

### 3.2 NEXUS Behavior: Phase-Specific

**Phase 0 (Pre-auth):**
- Introduces frameworks based on user's stated challenges
- Shows example insights: "Leaders with your profile often see tension between [Dimension A] and [Dimension B] in their DRIVE assessment"
- Never reveals full diagnostic content — only conceptual previews
- Guides toward LEAP as the natural starting point (it's free)

**Phase 1 (Post-first-assessment):**
- Interprets results using the REAL dimension names and score bands
- Makes cross-framework connections: "Your LEAP shows High-D dominance. Combined with what you're describing about team friction, your COACH assessment will likely reveal a gap between your Directing and Supporting quadrants."
- Suggests next diagnostic based on gaps: "You have LEAP + DRIVE. Your QUEST would complete the strategic picture."
- Shows SHIFT Composite progress: "Complete 1 more diagnostic to unlock your SHIFT Composite."

**Phase 2 (Deepening):**
- Provides debrief interpretations
- Generates cross-sell recommendations based on result patterns
- Identifies advisory triggers (e.g., "Your BRIDGE score suggests you may benefit from a structured China readiness advisory engagement")

### 3.3 Sample Insight Cards

When showing previews, NEXUS generates visual insight cards:

```
┌─────────────────────────────────────────────┐
│  YOUR DRIVE PROFILE PREVIEW                │
│                                             │
│  Achievement ████████░░ 82                  │
│  Purpose     ██████░░░░ 64                  │
│  Security    ████░░░░░░ 41                  │
│  Autonomy    █████████░ 91                  │
│  Relationship █████░░░░░ 53                 │
│                                             │
│  → Your Autonomy-Achievement combination    │
│    suggests an "Independent Driver" pattern │
│    (top 12% of executives in your cohort)   │
│                                             │
│  Complete the full DRIVE to see your        │
│  Role Alignment and Direction Clarity       │
│  scores + personalized development path.    │
│                                             │
│  [Take Full DRIVE — 3 credits]              │
└─────────────────────────────────────────────┘
```

---

## 4. Credit Economy Spec

### 4.1 Credit Earning Mechanics (Free Path)

| Action | Credits Earned | Daily Cap | Rationale |
|--------|---------------|-----------|-----------|
| Daily login | 1 | 1 | Baseline engagement |
| Login streak: 3 consecutive days | +2 bonus | — | Consistency reward |
| Login streak: 7 consecutive days | +5 bonus | — | Weekly commitment |
| Login streak: 30 consecutive days | +20 bonus | — | Monthly dedication |
| Read a briefing/intelligence brief | 1 | 3/day | Content consumption |
| Complete an educational module (SHIFT AI Track) | 3 | 1/day | Learning engagement |
| Download a research report | 1 | 2/day | Resource engagement |
| Complete profile (100%) | 10 (one-time) | — | Profile completion |
| Connect LinkedIn | 5 (one-time) | — | Data enrichment |
| Refer a peer (peer signs up) | 10 | 3/month | Lead generation |
| Refer a peer (peer completes first assessment) | 15 | 3/month | Qualified lead |
| Attend a webinar (verified attendance) | 5 | 2/month | Event engagement |
| Share an insight to LinkedIn | 2 | 1/day | Organic marketing |
| Complete a diagnostic (any) | 5 | — | Assessment completion |
| Write a testimonial/review | 10 (one-time) | — | Social proof |
| Complete 360° rater for someone else | 3 | 2/month | Community contribution |

**Maximum monthly free credits (active user):**
- Daily logins: 30
- Streak bonuses: ~25 (assuming consistent engagement)
- Content engagement: ~60 (3 briefings/day × 30 days)
- Educational modules: ~90 (1/day × 30 days)
- Reports/downloads: ~60 (2/day × 30 days)
- Referrals: ~75 (3 referrals × 25 credits each)
- Webinars: ~10 (2/month)
- Social shares: ~60 (1/day × 30 days)
- Diagnostic completions: ~35 (7 assessments × 5 credits)
- **Total: ~445 credits/month for a highly active user**

### 4.2 Credit Pricing (Paid Path)

| Package | Credits | Price | Per-Credit Cost |
|---------|---------|-------|-----------------|
| Starter | 25 | $29 | $1.16 |
| Professional | 75 | $69 | $0.92 |
| Executive | 200 | $149 | $0.75 |
| Council (membership) | 500/month | $499/month | $1.00 |
| Enterprise | Custom | Custom | Custom |

### 4.3 Credit Spending (Diagnostic Costs)

| Assessment | Credits | DeepSeek Token Cost (est.) | Margin at $0.92/credit |
|-----------|---------|--------------------------|----------------------|
| LEAP (free welcome) | 0 | ~$0.02 (DISC only, short) | -$0.02 (loss leader) |
| LEAP full | 5 | ~$0.05 | $4.55 |
| QUEST | 3 | ~$0.04 | $2.72 |
| DRIVE | 3 | ~$0.04 | $2.72 |
| COACH | 3 | ~$0.04 | $2.72 |
| COACH + 360° | 8 | ~$0.12 | $7.24 |
| IMPACT | 5 | ~$0.05 | $4.55 |
| BRIDGE | 5 | ~$0.05 | $4.55 |
| SPARK | 5 | ~$0.05 | $4.55 |
| PRISM | 5 | ~$0.05 | $4.55 |
| FORGE | 5 | ~$0.05 | $4.55 |
| MOSAIC (per participant) | 8 | ~$0.08 | $7.28 |
| NEXUS debrief session | 2 | ~$0.03 | $1.83 |
| NEXUS conversation (per 10 exchanges) | 1 | ~$0.015 | $0.905 |

**Break-even analysis:**
- DeepSeek flash: ~$0.14/1M input tokens, ~$0.28/1M output tokens
- Avg conversation (10 exchanges): ~2000 input + ~1000 output = ~$0.00056
- Credit price floor: $0.75/credit (Executive package)
- Safety margin: 1339× at Executive tier — WIDE margin
- Even at free earning rate: $0 (no revenue) but token cost per user/month ≈ $0.50-$2.00
- **Conclusion: Token costs are negligible at DeepSeek pricing. The constraint is not tokens — it's value delivery.**

### 4.4 Credit Economy Rules

1. **Credits never expire** for paid users. Free-earned credits expire after 90 days of inactivity.
2. **Credits are non-transferable** between accounts (except Council corporate pools).
3. **NEXUS conversations cost 1 credit per 10 exchanges** (after the first 20 free exchanges per day).
4. **Assessment results are permanent** — once earned, they're in your profile forever.
5. **SHIFT Composite auto-recalculates** when a new individual diagnostic is completed.
6. **Free LEAP (DISC only) is always free** — no credit cost, no expiration, the permanent hook.

---

## 5. Executive Gamification Spec

### 5.1 Leadership Intelligence Index (LII)

Instead of "levels" or "points," users have a **Leadership Intelligence Index** — a composite engagement metric.

```
LII = (Content Engagement × 0.25) + (Assessment Depth × 0.30) + (Community Contribution × 0.20) + (Consistency × 0.25)
```

| LII Band | Title | Unlock |
|----------|-------|--------|
| 0-19 | Emerging | Basic diagnostics |
| 20-39 | Developing | Cross-framework insights, NEXUS deep-dive |
| 40-59 | Established | 360° rater access, peer matching |
| 60-79 | Advanced | Advisory discovery session, Council preview |
| 80-100 | Distinguished | Council nomination eligibility, keynote invitations |

**Display language:**
- "Your Leadership Intelligence Index: 47 — Established"
- "You've advanced from Developing to Established this cycle."
- "Among peers in your cohort, your LII ranks in the top 34%."

### 5.2 Streak System (Executive Framing)

Not "streaks" — **"Engagement Cycles."**

| Cycle | Requirement | Recognition |
|-------|-------------|-------------|
| Weekly Cycle | ≥5 days active in 7-day window | "Weekly Cycle complete" |
| Monthly Cycle | ≥20 days active in 30-day window | "Monthly Cycle complete" |
| Quarterly Cycle | ≥60 days active in 90-day window | "Quarterly Cycle — Distinguished Engagement" |

Display: "You are in Week 4 of your current Engagement Cycle." Not "🔥 4-day streak!"

### 5.3 Intelligence Briefings (Content Engagement)

Weekly curated briefings based on user's diagnostic profile:
- LEAP High-D users get "Decision Architecture" briefings
- DRIVE High-Achievement users get "Performance Pressure" briefings
- BRIDGE users get "Cross-Border Governance" briefings
- SPARK users get "AI Leadership" briefings

Each briefing is 3-5 minutes of reading. Completion earns 1 credit + LII contribution.

### 5.4 Behavioral Nudges (NEXUS-Driven)

NEXUS proactively suggests actions:

- "You haven't engaged with a briefing this week. Your DRIVE profile suggests you'd find the 'Alignment Under Pressure' brief particularly relevant."
- "3 peers in your industry cohort completed the QUEST diagnostic this week. Your LEAP profile suggests you'd score high on Strategic Thinking — would you like to see how you compare?"
- "Your Engagement Cycle is at risk — 2 more active days this week maintains your Established standing."

These are NOT push notifications. They appear in the NEXUS conversation when the user initiates contact.

---

## 6. Assessment Technical Spec (Aligned to Notion)

### 6.1 Data Model

```sql
-- Real assessment structure (aligned to Notion Master Product Reference)

CREATE TYPE assessment_type AS ENUM (
  'LEAP', 'QUEST', 'COACH', 'DRIVE', 'IMPACT',  -- SHIFT Tier 1
  'MOSAIC',                                        -- SHIFT Tier 2
  'BRIDGE', 'SPARK', 'PRISM', 'FORGE',            -- Standalone
  'TRIDENT'                                         -- Independent composite
);

CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assessment_type assessment_type NOT NULL,
  
  -- Core scores
  composite_score NUMERIC(5,2),  -- 0-100
  score_band TEXT,               -- e.g., 'Signature Strength', 'Active', etc.
  
  -- Dimension scores (JSONB for flexibility)
  dimension_scores JSONB NOT NULL,
  -- LEAP example: {"D": 72, "I": 45, "S": 38, "C": 61, "CR_composite": 68, "APAC": 55}
  -- QUEST example: {"Q1_strategic": 78, "Q2_execution": 65, "Q3_commercial": 71, "Q4": 58, "Q5": 62}
  -- DRIVE example: {"D1_achievement": 82, "D2_purpose": 64, "D3_security": 41, "D4_autonomy": 91, "D5_relationship": 53}
  
  -- Sub-scores
  sub_scores JSONB,
  -- LEAP: {"career_readiness_composite": 68, "behavioral_alignment": 72}
  -- QUEST: {"ai_readiness": 65, "apac_cross_border": 58}
  -- COACH: {"pressure_style": "C4-Analyzing", "style_clarity": 78}
  
  -- Metadata
  archetype TEXT,              -- e.g., "Strategic Architect"
  completed_at TIMESTAMPTZ DEFAULT now(),
  version INT DEFAULT 1,
  
  UNIQUE(user_id, assessment_type, version)
);

-- SHIFT Composite (auto-calculated)
CREATE TABLE shift_composite (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  composite_score NUMERIC(5,2),
  leap_score NUMERIC(5,2),
  quest_score NUMERIC(5,2),
  coach_score NUMERIC(5,2),
  drive_score NUMERIC(5,2),
  impact_score NUMERIC(5,2),
  -- Formula: composite = leap*0.15 + quest*0.25 + coach*0.20 + drive*0.15 + impact*0.25
  diagnostics_completed INT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Credit transactions (double-entry)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'expire', 'adjust', 'purchase')),
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  source TEXT,  -- 'daily_login', 'streak_bonus', 'assessment_complete', 'purchase', etc.
  reference_id UUID,  -- Links to assessment_result, referral, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Engagement tracking (for LII calculation)
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,  -- 'login', 'briefing_read', 'module_complete', 'report_download', etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6.2 Assessment Question Import

Questions must be imported from the Notion Question Bank DB (`fe8bc717`) AS-IS. The import pipeline:

1. Read each Question Bank entry from Notion (QUEST, DRIVE, LEAP, IMPACT, COACH, etc.)
2. Parse question text, answer options, scoring weights
3. Store in `assessment_questions` table
4. Map to the correct dimensions per Notion Master Product Reference
5. Implement scoring algorithms per Notion specs (normalization formulas, composite weights, score bands)

**CRITICAL:** The current code (`shiftAssessmentTypes.ts`, `catalog.ts`) must be DELETED entirely. It implements wrong dimensions, wrong names, wrong scoring. Start from scratch using Notion as the single source of truth.

### 6.3 Assessment Flow (Per Diagnostic)

```
User selects diagnostic (or NEXUS recommends one)
  → NEXUS explains what it measures (using Notion dimension names)
  → Assessment begins (actual questions from Notion question bank)
  → Progress indicator: "Question 12 of 35"
  → For LEAP: forced-choice interface (select MOST like me + LEAST like me)
  → For others: appropriate format per Notion spec (Likert, forced-choice, etc.)
  → Scoring runs server-side (not client-side)
  → Results stored in assessment_results
  → NEXUS provides interpretation:
    - Score band label (from Notion spec)
    - Dimension breakdown
    - Archetype assignment
    - Cross-framework connections
    - Suggested next diagnostic
  → Sample insight card generated
  → If SHIFT Composite eligible: auto-recalculate
```

---

## 7. Implementation Priority

### P0 — Foundation (Week 1-2)
1. Delete all existing assessment code (`shiftAssessmentTypes.ts`, `catalog.ts`, `assessment/catalog.ts`)
2. Create `assessment_questions` table and import from Notion Question Bank DB
3. Create `assessment_results` table with correct schema
4. Implement LEAP (free welcome gift) — real DISC forced-choice, real scoring, real archetypes
5. Implement credit system v2 (double-entry, earn+spend)
6. Basic NEXUS system prompt with all framework definitions

### P1 — Core Experience (Week 3-4)
7. Implement QUEST, DRIVE, COACH, IMPACT (real questions, real scoring, real score bands)
8. SHIFT Composite auto-calculation with correct weights
9. NEXUS diagnostic recommendation engine
10. Credit earning mechanics (daily login, streaks, content engagement)
11. Engagement tracking + LII calculation

### P2 — Standalone + Polish (Week 5-6)
12. BRIDGE, SPARK, PRISM, FORGE (real dimensions per Notion)
13. COACH+ 360° rater flow
14. Sample insight cards (visual component)
15. Intelligence Briefings content pipeline
16. Gamification display (LII, Engagement Cycles)

### P3 — Conversion (Week 7-8)
17. NEXUS advisory trigger detection
18. Cross-sell recommendations based on diagnostic patterns
19. Council upsell flow
20. MOSAIC team assessment (multi-participant)

---

## 8. Files to Delete

These files implement the wrong frameworks and must be removed:

| File | Reason |
|------|--------|
| `src/services/shiftAssessmentTypes.ts` | Wrong dimensions, wrong names, wrong composite formula |
| `src/assessments/catalog.ts` | Wrong dimensions for all SHIFT tools + BRIDGE/SPARK/MOSAIC |
| `src/services/shiftAnalysis.ts` | Built on wrong shiftAssessmentTypes |
| `src/services/shiftService.ts` | Built on wrong shiftAssessmentTypes |
| `src/pages/AssessmentPage.tsx` | Uses wrong catalog |
| `src/lib/benchmark/engine.ts` | Wrong dimension mappings for SHIFT_LEAP/QUEST/etc. |

---

*End of Spec — Awaiting Kevin review before implementation*
