# LYC Intelligence — Product Specification v2.0
## NEXUS AI · Credit Economy · Human Coaching

**Status:** APPROVED — Kevin Hong, 2026-07-21
**Replaces:** v1.0 (2026-07-20, DEPRECATED)
**Source:** Notion Master Product Reference (`398fafae-51be-81dc`), Willy Te User Research Interview (2026-07-10), Code Audit Findings (8 B2C audits + Notion-vs-Code consistency audit)

---

## 1. Executive Summary

LYC Intelligence is a leadership intelligence platform built on three layers:

1. **NEXUS AI** — The intelligent front door. Framework-aware conversations that demonstrate mastery of every SHIFT diagnostic, surface insights the user hasn't considered, and create desire for deeper assessment. Gated behind a €5/month subscription.
2. **Credit Economy** — The earned middle layer. Users spend credits on assessments, reports, 360° feedback, benchmarking, and content. Credits are earned through engagement OR purchased (subscription or top-up). Designed so a busy executive earns enough to experience real value in 2-3 months, then faces a natural conversion point.
3. **Human Coaching** — The premium top layer. Coaching packages priced by coachee seniority (Foundation/Professional/Executive), with Bronze/Silver/Gold commitment tiers. Workshops, peer circles, and success-fee models deferred to post-MVP.

**Revenue model:** Four levers — recurring subscription (€5-100/mo), transactional top-up (€25-180 one-time), high-ticket coaching (€1,250-9,000/engagement), and future success-fee (post-MVP).

**Core design principle** (from Willy Te interview): NEXUS must behave like the best executive coach — not answering questions the user already has, but asking questions they haven't thought of. The platform is a deepening relationship, not a funnel.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FREE TIER (€0)                           │
│  Sample insights · Benchmark teasers · 5-question Taste ·       │
│  Framework overview pages                                        │
├─────────────────────────────────────────────────────────────────┤
│                    EXPLORER (€5/month)                           │
│  Unlimited NEXUS conversations · Framework mastery demos ·       │
│  Sample insight previews · Proactive questioning ·               │
│  Benchmark teasers · Assessment recommendations                  │
├─────────────────────────────────────────────────────────────────┤
│              DEVELOPER (€50/month = 500 credits)                │
│         EXECUTIVE (€100/month = 1,000 credits)                  │
│  Everything in Explorer + Credits + Full assessments +           │
│  Detailed reports + 360° raters + Content library +              │
│  Peer benchmarking + Historical tracking                         │
│  -- OR --                                                        │
│  TOP-UP CREDITS (€25-180 one-time, no subscription benefits)     │
├─────────────────────────────────────────────────────────────────┤
│              HUMAN COACHING (€1,250 - €9,000)                    │
│  Foundation / Professional / Executive ×                         │
│  Bronze / Silver / Gold                                          │
│  Workshops + Peer Circles (Silver+)                              │
├─────────────────────────────────────────────────────────────────┤
│              POST-MVP                                            │
│  Success-fee job search model                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pricing Architecture

### 3.1 Subscription Tiers

| Tier | Price | Credits/mo | NEXUS Access | Platform Access |
|------|-------|-----------|--------------|-----------------|
| **Free** | €0 | 0 | Static pages only | Sample insights, benchmark teasers, 5-question Taste assessment, framework overviews |
| **Explorer** | €5/mo | 0 | Unlimited conversations | Framework mastery demos, sample previews, proactive questioning, assessment recommendations |
| **Developer** | €50/mo | 500 | Unlimited + assessment-taking | Full platform: assessments, reports, 360°, content library, benchmarking, trend analysis |
| **Executive** | €100/mo | 1,000 | Unlimited + assessment-taking | Same as Developer, 2× credits. For heavy users running multiple assessments + ongoing 360° |

**Key decisions:**
- NEXUS conversations are NOT free. €5/month gate (25% of ChatGPT's €20/month) filters non-serious users while remaining a micro-commitment.
- Explorer tier gets full NEXUS conversational power but ZERO assessment/report/content access. NEXUS shows what's possible; credits unlock what's real.
- Free tier gets static content only — framework overview pages, sample insight screenshots, a 5-question "Taste" that gives a flavor without real diagnostic value.

### 3.2 Top-Up Credits (Pay-as-You-Go)

One-time credit purchases. No subscription benefits (no NEXUS access, no benchmarking, no content library). For users who know exactly what they want.

| Package | Credits | Price | €/credit | Discount vs base |
|---------|---------|-------|----------|-----------------|
| Starter | 50 | €25 | €0.50 | — |
| Growth | 100 | €45 | €0.45 | 10% |
| Accelerate | 250 | €100 | €0.40 | 20% |
| Transform | 500 | €180 | €0.36 | 28% |

**Comparison to subscription:**
- Developer €50/mo = 500 credits → €0.10/credit (5× cheaper than top-up)
- Top-up 500 credits = €180, no subscription benefits → €0.36/credit
- Subscription is the clearly better deal for engaged users. Top-up is for one-time buyers.

**Design intent:** A busy executive who discovers value after 2-3 months of earning free credits faces the choice: keep earning slowly, or pay €50-100/month for instant access. The top-up option captures users who want a single assessment without committing to a subscription.

### 3.3 Coaching Packages (by Coachee Seniority)

Pricing is determined by the COACHEE's seniority level, not the coach's. The coach network is matched to the tier automatically.

**Coachee Tiers:**

| Tier | Target Profile | Effective Hourly Range |
|------|---------------|----------------------|
| **Foundation** | VP / Director / Senior Manager → developing into C-suite | €150-250/h |
| **Professional** | C-suite / SVP / GM → sharpening executive edge | €300-500/h |
| **Executive** | Board member / Managing Partner / PE Partner → top-level complexity | €600-1,000/h |

**Package Pricing (complete, fixed price):**

| Package | Duration | Foundation | Professional | Executive |
|---------|----------|-----------|-------------|-----------|
| **Bronze** (5h) | 3 months | €1,250 | €2,500 | €5,000 |
| **Silver** (10h) | 6 months | €2,000 | €4,000 | €8,000 |
| **Gold** (15h) | 9 months | €2,250 | €4,500 | €9,000 |

**Effective hourly rates (degressive within each coachee tier):**

| Package | Foundation | Professional | Executive |
|---------|-----------|-------------|-----------|
| Bronze | €250/h | €500/h | €1,000/h |
| Silver | €200/h | €400/h | €800/h |
| Gold | €150/h | €300/h | €600/h |

**What's included per package level:**

| Feature | All Packages | Silver+ | Gold |
|---------|:----------:|:------:|:----:|
| Pre-session SHIFT assessment (credits provided) | ✅ | ✅ | ✅ |
| NEXUS ongoing access during engagement | ✅ | ✅ | ✅ |
| Post-session action tracking | ✅ | ✅ | ✅ |
| Workshops + peer circles | — | ✅ | ✅ |
| Mid-program reassessment | — | ✅ | ✅ |
| Dedicated NEXUS configuration | — | — | ✅ |
| Priority scheduling | — | — | ✅ |

### 3.4 Revenue Model Summary

| Lever | Type | Range | Target |
|-------|------|-------|--------|
| Explorer subscription | Recurring | €5/mo | Mass market, lead nurture |
| Developer/Executive subscription | Recurring | €50-100/mo | Engaged professionals |
| Top-up credits | Transactional | €25-180 one-time | One-time buyers |
| Coaching packages | High-ticket | €1,250-9,000 | Executive development |
| Success-fee | Deferred | Post-MVP | Job search scenarios |

---

## 4. Credit Economy

### 4.1 Credit Costs (What You Spend)

| Item | Credits | Notes |
|------|---------|-------|
| **Individual SHIFT Assessment** | | |
| LEAP (Leadership Effectiveness & Adaptability Profile) | 30 | DISC + Career Readiness + APAC Modifier, 35Q forced-choice |
| QUEST (Strategic Leadership Assessment) | 30 | 5 weighted dimensions, 35Q |
| COACH (Coaching Style & 360°) | 30 | 4 styles + pressure + APAC, 35Q + rater |
| DRIVE (Core Motivators) | 30 | 5 motivators, 35Q forced-choice |
| IMPACT (Leadership Impact) | 30 | 5 weighted dimensions, 35Q + 10Q rater |
| **Bundles** | | |
| Full SHIFT Battery (all 5) | 120 | 20% discount vs 5×30=150 individual |
| **Add-ons** | | |
| 360° Rater Add-on (5-10 raters) | 20 | Required for COACH and IMPACT |
| Detailed AI-Generated Report | 15 | Per assessment. Narrative + action plan |
| **Standalone Tools** | | |
| BRIDGE (Transition Assessment) | 35 | 6 weighted dimensions, 35Q |
| SPARK (AI Readiness) | 30 | AI Literacy + Governance + Strategic + Behavioral + Culture |
| **Ongoing Services** | | |
| Peer Benchmarking Deep Access | 25/mo | Compare to anonymized peer cohort |
| Historical Tracking & Trend Analysis | 15/mo | Track scores across reassessments |
| **Content** | | |
| Content Piece (deep report, podcast, course module) | 5-10 | Sourced from Notion Deliverables DB |

### 4.2 Credit Earning (What You Earn)

Designed for a busy executive who engages 1-2× per week. Not daily-login gamification. Meaningful engagement rewards.

| Action | Credits | Frequency Expectation |
|--------|---------|----------------------|
| Complete framework exploration session with NEXUS | 5 | 1-2×/week |
| Complete a reflection prompt (NEXUS presents a leadership scenario, user responds) | 3 | 1×/week |
| Engage with content piece (read report, listen to podcast) | 2 | 1×/week |
| Refer a peer who signs up (any tier) | 25 | As triggered |
| Complete an assessment (provides platform data) | 10 (refund) | When ready |
| Participate in a workshop | 10 | When available |

**Earning math for a typical busy executive:**
- 1-2 framework explorations/week: 5-10 credits/week
- 1 content engagement/week: 2 credits/week
- 1 reflection prompt/week: 3 credits/week
- **Monthly total: ~40-60 credits**

**Time to earn for free:**

| Goal | Credits Needed | Time at Regular Engagement |
|------|---------------|---------------------------|
| 1 individual assessment | 30 | 3-4 weeks |
| 360° rater add-on | 20 | 2-3 weeks |
| Full SHIFT battery | 120 | 3-4 months |
| Assessment + report + 360° | 65 | 6-8 weeks |

**The conversion point:** After 2-3 months, a power user has earned ~120-180 credits (full battery or 4-6 individual assessments). They've experienced real value. The choice becomes: keep earning slowly (months for next big purchase) vs. pay €50-100/month for instant access.

### 4.3 Credit Rules

- Credits NEVER expire. No hostile expiration.
- Earned credits and purchased credits are fungible — same pool.
- Assessment completion refund (10 credits) is a one-time bonus per assessment, not repeatable.
- Free tier users CANNOT earn credits. Credit earning requires at minimum Explorer subscription (€5/mo). This ensures the platform has a committed user base.
- Subscription credits (Developer/Executive) are granted monthly and DO NOT roll over. Top-up credits DO persist indefinitely.

---

## 5. NEXUS AI Layer Design

### 5.1 Design Philosophy (from Willy Te Interview)

Willy Te pays his coach because "the coach asks questions I haven't thought of." ChatGPT only answers questions — it doesn't probe. Company-paid coaches report to HR — he withholds sensitive career thoughts.

NEXUS must be:
1. **Proactively inquisitive** — Surface questions, tensions, and blind spots the user hasn't articulated
2. **Framework-fluent** — Demonstrate mastery of all SHIFT dimensions, explain what they mean, show what results look like
3. **Confidential** — Market this as a differentiator. The private space for career thinking.
4. **Desire-creating** — Show what's possible, not what's actual. The assessment is the product; NEXUS is the salesperson.

### 5.2 What NEXUS Does (by tier)

**Free tier (static only):**
- Framework overview pages (LEAP, QUEST, COACH, DRIVE, IMPACT, BRIDGE, SPARK definitions)
- Sample insight screenshots (anonymized, illustrative)
- Benchmark teasers ("Executives at your level typically score 62-74 on QUEST Strategic Thinking")
- 5-question "Taste" assessment (forced-choice, gives a directional flavor, NOT a real SHIFT tool)

**Explorer tier (€5/mo, unlimited NEXUS conversation):**
- Full framework-aware dialogue. NEXUS knows all SHIFT dimensions and can explain any of them.
- Sample insight previews: "Here's what a DRIVE report shows for a BD leader in optical manufacturing managing across Southeast Asia"
- Proactive questioning: "You mentioned managing a team of 30 across 4 countries. Have you considered whether your COACH style adapts effectively across those cultural contexts?"
- Benchmark teasers with context: "Your peer group — SVPs in manufacturing — typically score 58-72 on IMPACT Business Results. Where do you think you'd land?"
- Assessment recommendations: "Based on our conversation, your QUEST profile would be most valuable right now — it would clarify whether your strategic execution gap is in prioritization or resource allocation."
- Content previews: "There's a 20-minute podcast episode on DRIVE-Autonomy vs DRIVE-Purpose tension that directly relates to what you're describing. Want to hear a 2-minute excerpt?"

**NEXUS NEVER gives:**
- The actual assessment (that costs credits)
- A personalized diagnostic report (that costs credits)
- Real benchmark comparisons (that costs credits)
- 360° rater access (that costs credits)

NEXUS shows what's behind the curtain. Credits open the curtain.

### 5.3 NEXUS Conversation Patterns

**Pattern 1: Framework Exploration**
User: "What's this DRIVE thing about?"
NEXUS: "DRIVE maps your five core motivators — Achievement, Purpose, Security, Autonomy, and Relationship. Most leaders have a dominant pair. For example, someone high in Achievement + Autonomy will thrive in a turnaround role with decision-making freedom, but will feel suffocated in a matrix organization with consensus requirements. [pause] Can I ask — what's driving your interest in motivators specifically? Are you at a decision point, or is this more exploratory?"

→ If user engages deeply → earns 5 credits
→ If user wants to take the real assessment → costs 30 credits

**Pattern 2: Proactive Insight**
User returns after exploring QUEST framework.
NEXUS: "Last time we talked, you identified strongly with QUEST Dimension 2 (Execution) but expressed uncertainty about Dimension 3 (Commercial Acumen). That tension — strong executor who's unsure about commercial judgment — is one I see frequently in VP-to-SVP transitions. A question you might not have considered: is the gap real, or is it a confidence calibration issue? Your actual commercial track record might be stronger than your self-assessment suggests. The QUEST assessment would separate the two."

→ If user engages with reflection → earns 3 credits
→ If user wants to take QUEST → costs 30 credits

**Pattern 3: Sample Insight Preview**
User: "What would my report actually look like?"
NEXUS: "Here's a sample from a DRIVE report for someone in a similar profile — a BD director in a multinational manufacturing group, managing teams across APAC: [shows anonymized sample report structure]. Notice how the report doesn't just score you — it maps the tension between your top two motivators and what that means for your current role fit. It would also flag any misalignment between what motivates you and what your role actually demands. That's where the actionable insight lives."

→ Creates desire. User thinks: "I want THAT for myself."
→ Costs 30 credits (assessment) + 15 credits (detailed report) = 45 credits total

### 5.4 NEXUS Technical Design

- All NEXUS conversations routed through DeepSeek API (Coze = orchestration only)
- Framework knowledge loaded from Notion Master Product Reference at conversation start
- User conversation history persisted in PostgreSQL (not Notion)
- Token cost per conversation: ~$0.005-0.02 (DeepSeek pricing). At €5/month per Explorer user, margin is healthy even with unlimited conversations.
- NEXUS never fabricates assessment results. All "sample" insights are pre-authored from anonymized real data or clearly marked as illustrative.

---

## 6. Assessment Layer (SHIFT Stack)

### 6.1 Assessment Definitions (from Notion Master Product Reference)

All assessments use Notion-defined frameworks. Code implementations are WRONG and must be rebuilt from scratch. See Section 12 for deletion/rebuild list.

**LEAP — Leadership Effectiveness & Adaptability Profile**
- Dimensions: DISC (D/I/S/C) + Career Readiness (CR1-CR5) + APAC Modifier
- Questions: 35, forced-choice
- Weighting: Equal across DISC quartet; Career Readiness as composite
- Output: Behavioral style profile + career readiness score + regional cultural adjustment

**QUEST — Strategic Leadership Assessment**
- Dimensions: Q1 Strategic Thinking (×0.25), Q2 Execution Excellence (×0.25), Q3 Commercial Acumen (×0.20), Q4 Stakeholder Navigation (×0.15), Q5 Organizational Design (×0.15)
- Questions: 35
- Output: Strategic leadership composite score + dimensional breakdown

**COACH — Coaching Style & Leadership Behavior**
- Dimensions: C1 Directing (Q1-7), C2 Inspiring (Q8-14), C3 Supporting (Q15-21), C4 Analyzing (Q22-28), Pressure Response (Q29-34), APAC Modifier (Q35-41)
- Questions: 35 + 360° rater (separate instrument)
- Output: Dominant coaching style + pressure behavior + cultural modifier

**DRIVE — Core Motivators Assessment**
- Dimensions: D1 Achievement, D2 Purpose, D3 Security, D4 Autonomy, D5 Relationship
- Questions: 35, forced-choice (paired statements)
- Output: Motivator hierarchy + dominant pair + role-fit analysis

**IMPACT — Leadership Impact Assessment**
- Dimensions: I1 Business Results (×0.30), I2 Talent Development (×0.20), I3 Strategic Influence (×0.20), I4 Change Architecture (×0.15), I5 Innovation & Learning (×0.15)
- Questions: 35 + 10-question rater survey
- Output: Impact composite + dimensional breakdown + rater comparison

**SHIFT Composite Score:**
`LEAP×0.15 + QUEST×0.25 + COACH×0.20 + DRIVE×0.15 + IMPACT×0.25`

**BRIDGE — Career Transition Assessment**
- Dimensions: B (×0.20), R (×0.15), I (×0.15), D (×0.20), G (×0.15), E (×0.15)
- Questions: 35
- Output: Transition readiness score + dimensional guidance

**SPARK — AI Readiness Assessment**
- Dimensions: AI Literacy, AI Governance Judgment, AI-Era Strategic Capability, Behavioral Adaptability, AI Team & Culture Leadership
- Questions: TBD (framework defined, question bank in progress)
- Output: AI readiness composite + dimension scores

### 6.2 Assessment Flow

1. User decides to take assessment (triggered by NEXUS recommendation or self-initiated)
2. Credit cost deducted from user's balance
3. Assessment presented (35 questions, forced-choice or Likert depending on instrument)
4. Upon completion: 10 credit refund (incentivizes completion, provides platform data)
5. AI generates detailed report (additional 15 credits if user wants narrative report)
6. Results stored in PostgreSQL, visible in user dashboard
7. If 360° rater applicable: additional 20 credits for rater invitations
8. Results feed into benchmarking engine and historical tracking

---

## 7. Content & Benchmarking Layer

### 7.1 Content Library

Sourced from Notion Deliverables DB (`9b6980dc1f714daa83226363647fd22d`). 50+ items currently defined.

| Content Type | Credit Cost | Examples |
|-------------|------------|---------|
| Deep report / whitepaper | 10 | Industry benchmarks, leadership trends |
| Podcast episode | 5 | Full episodes + 2-minute excerpts (free for Explorer tier) |
| Course module | 10 | Leadership development modules |
| Newsletter archive | 5 | Monthly intelligence briefings |
| Case study | 5-10 | Anonymized client success stories |

Explorer tier gets podcast excerpts (2-min teasers) for free. Full content costs credits.

### 7.2 Peer Benchmarking

- Deep access: 25 credits/month. Compare scores to anonymized peer cohort (filtered by industry, seniority, region).
- Teaser: Free/Explorer tier sees aggregate ranges only ("Your peer group scores 58-72"). No individual breakdown.
- Historical tracking: 15 credits/month. Track score evolution across reassessments.

---

## 8. Engagement Cycles (Executive Gamification)

### 8.1 Design Philosophy

NOT Duolingo. No daily logins, no streaks, no XP bars. A Managing Partner doesn't log in daily — they engage deeply once a week or biweekly.

The system rewards DEPTH of engagement over TIME, not frequency.

### 8.2 Maturity Stages (Quarterly Arcs)

| Stage | Criteria | Unlocks |
|-------|----------|---------|
| **Curious** (0-30 days) | Explored 1-2 frameworks via NEXUS | Benchmark teasers, framework overview access |
| **Developing** (30-90 days) | Completed 2+ framework explorations + 1 assessment | Peer benchmarking access, deeper content previews |
| **Established** (90-180 days) | Completed 3+ assessments + regular content engagement | Detailed trend analysis, anonymized peer comparison |
| **Authority** (180+ days) | Full SHIFT battery + ongoing engagement | Priority workshop access, anonymized peer leaderboard, community contributor status |

### 8.3 Visibility

The maturity stage is visible as a "Leadership Intelligence Profile" indicator on the user's dashboard. Think Bloomberg terminal sophistication — clean, professional, data-dense. No mascots, no animations, no gamification theater.

### 8.4 What It Drives

- Curious → Developing: User has tasted the platform, taken one assessment, seen real results. Natural progression.
- Developing → Established: User is now comparing themselves to peers, tracking trends. The platform is becoming part of their development toolkit.
- Established → Authority: User is a platform veteran. Prime candidate for coaching packages, peer circles, referral program.

---

## 9. Confidentiality Architecture

### 9.1 Why It Matters (Willy Te Insight)

Willy withholds sensitive career thoughts from:
1. His company-paid coach (who reports to HR)
2. ChatGPT (he doesn't trust the data)

NEXUS must be the PRIVATE space for career thinking. This is a product differentiator, not just a compliance checkbox.

### 9.2 Implementation

- All NEXUS conversations encrypted at rest and in transit
- User data NEVER shared with their employer (unless employer explicitly pays for the engagement AND user consents)
- Data residency: EU-hosted (GDPR compliant)
- Anonymized benchmarking: user data contributes to cohort statistics ONLY with explicit consent, and ONLY in anonymized aggregate form
- Clear "Confidentiality Promise" displayed in onboarding and in every NEXUS conversation header
- Account deletion: complete data purge within 30 days of request

### 9.3 Marketing Position

"LYC Intelligence: The confidential space for leadership thinking. No one sees your assessments but you. Not your company. Not HR. Not us (beyond what's necessary to deliver the service)."

---

## 10. Willy Te Design Principles

The following product decisions are directly informed by the Willy Te user research interview (2026-07-10):

| Willy's Behavior | Product Implication |
|-----------------|-------------------|
| Decision flow: friends/family → ChatGPT → self-decides | NEXUS must be better than ChatGPT at career thinking. ChatGPT answers; NEXUS asks. |
| Pays coach because "coach asks questions I haven't thought of" | NEXUS must proactively surface questions, tensions, blind spots. Not just answer. |
| Withholds from company coach (reports to HR) and ChatGPT (data trust) | Confidentiality is a product feature, not a compliance checkbox. |
| Trusts frameworks ("the framework gives me confidence") | SHIFT framework must be visible, explorable, demonstrated by NEXUS. Not hidden behind a black box. |
| €50-100/month "it's being bought" | Pricing validated. Sweet spot for engaged professionals. |
| "If I had a workshop with other guys sharing best practices, I think it's worth it" | Peer circles / workshops = Layer 3 (human coaching). Not credit-accessible. |
| Situation-triggered usage ("coffee with HR, I need to prepare") | Platform must serve burst patterns, not require daily engagement. |
| Values benchmarking ("am I normal? am I behind?") | Benchmarking is a core feature, not an afterthought. |
| Open to success-fee model ("if incentives are aligned, I buy it") | Defer to post-MVP, but architect for it. |

---

## 11. Data Model

### 11.1 Core Tables (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    seniority_tier VARCHAR(20) CHECK (seniority_tier IN ('foundation', 'professional', 'executive')),
    subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('free', 'explorer', 'developer', 'executive')),
    subscription_status VARCHAR(20) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions (source of truth for balance)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) CHECK (type IN ('earned', 'purchased', 'spent', 'refunded', 'granted')),
    amount INTEGER NOT NULL,
    source VARCHAR(50),
    description TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription credit grants (monthly, non-rolling)
CREATE TABLE subscription_credit_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    grant_month DATE NOT NULL,
    amount INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, grant_month)
);

-- Top-up purchases
CREATE TABLE topup_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    package VARCHAR(20) CHECK (package IN ('starter', 'growth', 'accelerate', 'transform')),
    credits INTEGER NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL,
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    instrument VARCHAR(20) CHECK (instrument IN ('LEAP', 'QUEST', 'COACH', 'DRIVE', 'IMPACT', 'BRIDGE', 'SPARK')),
    status VARCHAR(20) DEFAULT 'in_progress',
    responses JSONB,
    dimension_scores JSONB,
    composite_score DECIMAL(5,2),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    credit_cost INTEGER NOT NULL,
    refund_issued BOOLEAN DEFAULT FALSE
);

-- 360° Rater Invitations
CREATE TABLE rater_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id),
    rater_email VARCHAR(255) NOT NULL,
    rater_name VARCHAR(255),
    rater_relationship VARCHAR(50),
    invitation_token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    responses JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id),
    user_id UUID REFERENCES users(id),
    report_type VARCHAR(30),
    content JSONB,
    pdf_url TEXT,
    credit_cost INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Events
CREATE TABLE engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50),
    credits_earned INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Cycles
CREATE TABLE engagement_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stage VARCHAR(20) CHECK (stage IN ('curious', 'developing', 'established', 'authority')),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    metrics JSONB
);

-- NEXUS Conversations
CREATE TABLE nexus_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    messages JSONB,
    frameworks_discussed TEXT[],
    assessments_recommended TEXT[],
    referral_made BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching Engagements (post-MVP, schema ready)
CREATE TABLE coaching_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    coach_id UUID,
    coachee_tier VARCHAR(20) CHECK (coachee_tier IN ('foundation', 'professional', 'executive')),
    package VARCHAR(20) CHECK (package IN ('bronze', 'silver', 'gold')),
    total_hours INTEGER NOT NULL,
    duration_months INTEGER NOT NULL,
    price_eur DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    pre_assessment_id UUID REFERENCES assessments(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Items (synced from Notion Deliverables DB)
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notion_id VARCHAR(100) UNIQUE,
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(30),
    credit_cost INTEGER NOT NULL,
    excerpt TEXT,
    full_content JSONB,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmark Cohorts
CREATE TABLE benchmark_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_key VARCHAR(100) UNIQUE,
    industry VARCHAR(100),
    seniority VARCHAR(50),
    region VARCHAR(50),
    sample_size INTEGER,
    dimension_averages JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmark Consent
CREATE TABLE benchmark_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    consented BOOLEAN NOT NULL DEFAULT FALSE,
    consented_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ
);
```

### 11.2 Key Indexes

```sql
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_assessments_user ON assessments(user_id, instrument);
CREATE INDEX idx_engagement_events_user ON engagement_events(user_id, created_at DESC);
CREATE INDEX idx_nexus_conversations_user ON nexus_conversations(user_id, created_at DESC);
CREATE INDEX idx_content_items_type ON content_items(content_type);
```

---

## 12. Code Deletion / Rebuild List

All current SHIFT assessment code is WRONG. Built from hallucinated dimensions, not Notion-defined frameworks. Must be deleted and rebuilt from scratch.

### 12.1 Files to Delete

| File | Reason |
|------|--------|
| `src/services/shiftAssessmentTypes.ts` | Wrong dimensions, wrong weights, wrong question counts |
| `src/assessments/catalog.ts` | Wrong assessment definitions, missing BRIDGE and SPARK |
| `src/services/shiftAnalysis.ts` | Wrong scoring algorithms, wrong composite formula |
| `src/services/shiftService.ts` | Wrong service logic, no credit integration |
| `src/pages/AssessmentPage.tsx` | Wrong UI, no tier-gating, no credit display |
| `src/lib/benchmark/engine.ts` | Wrong benchmarking logic, no cohort definitions |

### 12.2 Files to Rebuild

| Component | Source of Truth | Notes |
|-----------|----------------|-------|
| Assessment type definitions | Notion Master Product Reference | Exact dimensions, weights, question counts |
| Question bank import | Notion Question Bank DB (`fe8bc717`) | 100+ items, AS-IS from Notion |
| Scoring engine | Notion Master Product Reference | Exact formulas per instrument |
| SHIFT composite calculation | Notion | `LEAP×0.15 + QUEST×0.25 + COACH×0.20 + DRIVE×0.15 + IMPACT×0.25` |
| Assessment catalog UI | This spec | Tier-gated, credit-cost visible, maturity-aware |
| Benchmarking engine | This spec | Cohort-based, anonymized, consent-gated |
| Credit transaction system | This spec | New — no existing code |
| Engagement event tracking | This spec | New — no existing code |
| NEXUS conversation layer | This spec + DeepSeek API | New — current NEXUS is placeholder |

### 12.3 What to Keep

- Database migration infrastructure (Drizzle/PostgreSQL setup)
- Authentication system (NextAuth / Clerk)
- Stripe integration scaffold (needs env vars configured)
- Notion sync utilities
- General UI component library
- Vercel deployment pipeline

---

## 13. Implementation Priority

### Phase 1: Foundation (Weeks 1-4)
1. Delete wrong assessment code (Section 12.1)
2. Build credit transaction system (schema + API)
3. Build subscription tier enforcement (Free / Explorer / Developer / Executive)
4. Build engagement event tracking
5. Import Notion question banks AS-IS
6. Configure Stripe environment variables
7. Fix DeepSeek API alias (`deepseek-v4-flash` → `deepseek-chat` by ~July 24)

### Phase 2: NEXUS AI (Weeks 3-6)
1. Build NEXUS conversation layer with DeepSeek API
2. Load SHIFT framework knowledge from Notion
3. Implement proactive questioning patterns (Section 5.3)
4. Implement sample insight previews
5. Build conversation history persistence
6. Implement Explorer tier gate (€5/month for NEXUS access)

### Phase 3: Assessments (Weeks 5-8)
1. Rebuild assessment type definitions from Notion
2. Rebuild scoring engine from Notion formulas
3. Build assessment-taking UI (tier-gated, credit-cost visible)
4. Build report generation (AI-generated narrative reports)
5. Build 360° rater invitation flow
6. Implement assessment completion credit refund

### Phase 4: Engagement & Gamification (Weeks 7-10)
1. Build credit earning system (framework exploration, content engagement, reflection prompts)
2. Build Engagement Cycles maturity tracking
3. Build Leadership Intelligence Profile display
4. Implement referral credit system
5. Build content library (synced from Notion Deliverables DB)

### Phase 5: Benchmarking & Content (Weeks 9-12)
1. Build benchmarking engine (cohort aggregation, consent management)
2. Build peer comparison UI
3. Build historical tracking
4. Build content access layer (credit-gated)
5. Build podcast excerpt teasers (free for Explorer tier)

### Phase 6: Coaching (Post-MVP, Weeks 13+)
1. Build coaching engagement schema
2. Build coach matching system
3. Build package purchase flow
4. Build session scheduling
5. Build workshop / peer circle management
6. Architect for success-fee model (deferred)

---

## 14. Open Questions

| Question | Status | Notes |
|----------|--------|-------|
| Stripe environment variables | BLOCKED | Need `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` configured |
| Email delivery (RESEND_API_KEY) | BLOCKED | Needed for rater invitations, referral notifications |
| SPARK question bank | IN PROGRESS | Framework defined in Notion, question bank incomplete |
| Coach network tiers | POST-MVP | Need to classify existing coach network into Foundation/Professional/Executive |
| Benchmark cohort definitions | POST-MVP | Need minimum sample sizes per cohort before benchmarking goes live |
| Success-fee model | POST-MVP | Willy Te validated the concept; architect for it but don't build yet |
| Multi-language support | POST-MVP | Willy is French-Korean; platform should support EN/FR/KR minimum |
| Mobile app | POST-MVP | Web-first. Mobile if engagement warrants it. |

---

## 15. Audit Trail

### Documents Referenced
- Notion Master Product Reference: `398fafae-51be-81dc`
- Notion Question Bank DB: `fe8bc7179ec2408c92f71c8e05998019`
- Notion Deliverables DB: `9b6980dc1f714daa83226363647fd22d`
- Willy Te Interview PDF: `Willy_Te_Comprehension_du_besoin` (2026-07-10, 39 pages)
- B2C Audit Reports: `docs/audits/AUDIT_B2C_01` through `AUDIT_B2C_07`
- Notion-vs-Code Consistency Audit: `docs/audits/NOTION_VS_CODE_CONSISTENCY_AUDIT.md`

### Version History
- **v1.0** (2026-07-20): DEPRECATED. Monetized before earning, gated behind LII, invented credit expiration, charged for NEXUS conversations, Duolingo gamification.
- **v2.0** (2026-07-21): APPROVED. Three-layer architecture, concrete pricing, credit earning calibrated for busy executives, NEXUS gated at €5/mo, engagement cycles not daily streaks, coaching by coachee seniority, top-up credits with volume discount, four revenue levers.
