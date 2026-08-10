# NEXUS Product Specification v3.0 (ALIGNED)

**Status:** DRAFT — for Kevin review
**Based on:** v2.0 spec (APPROVED Jul 21) + Canonical Pricing v1.0 (Aug 10) + codebase reality
**Key alignment:** "credits" → "miles", 4 tiers → 5 tiers, € pricing → USD + CN 1/3

---

## 1. Executive Summary

LYC Intelligence is a leadership intelligence platform built on three layers:

1. **NEXUS AI** — The intelligent front door. Framework-aware conversations that demonstrate mastery of every diagnostic, surface insights the user hasn't considered, and create desire for deeper assessment.
2. **Miles Economy** — The earned middle layer. Users spend miles on assessments, reports, 360° feedback, benchmarking, and content. Miles are earned through engagement OR included in subscription.
3. **Human Coaching** — The premium top layer.

**Core design principle:** NEXUS must behave like the best executive coach — not answering questions the user already has, but asking questions they haven't thought of.

**NEXUS is not a chatbot.** It's the intelligent front door of the entire product.

---

## 2. Canonical Pricing Model (from NEXUS_Pricing_Canonical_v1.0)

### 2.1 Subscription Tiers (5 Tiers)

| Tier | Global (USD/mo) | China (CNY/mo, 1/3) | Miles per month |
|------|-----------------|---------------------|-----------------|
| **Explorer** | Free | Free | 0 (chat only) |
| **Starter** | $25 | ¥59 | 50 |
| **Pro** | $99 | ¥233 | 150 |
| **Executive** | $199 | ¥466 | 300 |
| **Council** | $499 | ¥1,165 | 600 |

**Brand naming:**
- Explorer tier copy: "Executive Introduction" (no "free" word)
- China pricing: exactly 1/3 of international, rounded to nearest whole CNY
- Miles parity: ~$1 = 1 mile

### 2.2 What Each Tier Gets

| Capability | Explorer | Starter | Pro | Executive | Council |
|-----------|:--------:|:-------:|:---:|:---------:|:-------:|
| NEXUS chat access | ✅ limited | ✅ unlimited | ✅ | ✅ | ✅ |
| Miles per month | 0 | 50 | 150 | 300 | 600 |
| Miles earning | ❌ | ✅ | ✅ | ✅ | ✅ |
| Framework awareness | basic | full | full | full | full |
| Assessment recommendations | basic | full | full | full | full |
| Sample insight previews | ✅ | ✅ | ✅ | ✅ | ✅ |
| Benchmark teasers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Full assessments (pay-per-use) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Detailed AI reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| 360° rater access | ❌ | ❌ | ✅ | ✅ | ✅ |
| Peer benchmarking deep | ❌ | ❌ | ✅ | ✅ | ✅ |
| Historical tracking | ❌ | ❌ | ✅ | ✅ | ✅ |
| Content library | ❌ | ❌ | ✅ | ✅ | ✅ |
| Executive reviews | ❌ | ❌ | ❌ | ✅ | ✅ |
| Events access | ❌ | ❌ | ❌ | ✅ | ✅ |
| Council community | ❌ | ❌ | ❌ | ❌ | ✅ |
| Live sessions / workshops | ❌ | ❌ | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ❌ | ✅ | ✅ |

### 2.3 Assessment Pricing (3 Tiers)

| Tier | Global (USD) | China (CNY, 1/3) | Products |
|------|-------------|------------------|----------|
| Standard | $99 | ¥33 | GRID, CANVAS, baseline |
| Premium | $149 | ¥50 | BRIDGE, leadership pipeline |
| Unique / High-Value | $199 | ¥66 | CPI, TRIDENT-caliber |

Miles cost: ~99 / 149 / 199 miles respectively (1 mile ≈ $1).

---

## 3. Miles Economy

### 3.1 Earning Actions

Designed for a busy executive who engages 1-2× per week. No daily-login gamification.

| Action | Miles | Frequency |
|--------|-------|-----------|
| Framework exploration session with NEXUS | 5 | 1-2×/week |
| Complete reflection prompt | 3 | 1×/week |
| Engage with content piece | 2 | 1×/week |
| Refer peer who signs up | 25 | As triggered |
| Complete assessment (refund) | 10 (one-time) | When ready |
| Participate in workshop | 10 | When available |

**Earning math for typical executive:**
- Framework explorations: 5-10 miles/week
- Content engagement: 2 miles/week
- Reflection: 3 miles/week
- **Monthly total: ~40-60 miles** (nearly uses up Starter — natural upgrade trigger)

### 3.2 Miles Rules

- Subscription miles: do NOT roll over (monthly reset)
- Earned miles: persist indefinitely
- One-time assessment completion refund per instrument
- Explorer tier: 0 miles, no earning — chat is the product teaser

---

## 4. NEXUS AI Layer Design

### 4.1 Design Philosophy

1. **Proactively inquisitive** — Surface blind spots the user hasn't articulated
2. **Framework-fluent** — Mastery of all 11 assessments
3. **Confidential** — The private space for career thinking
4. **Desire-creating** — Show what's possible; miles unlock what's real

### 4.2 NEXUS Conversation Patterns

**Pattern 1: Framework Exploration**
User asks about a framework → NEXUS explains + vivid example → probing question → reveals underlying need.

**Pattern 2: Proactive Insight**
NEXUS references earlier conversation → raises related blind spot → ties to specific assessment.

**Pattern 3: Sample Insight Preview**
User asks "what would my report look like?" → anonymized sample from similar profile → creates desire.

**Pattern 4: Assessment Recommendation**
Based on conversation → recommends specific assessment with "why now" rationale → direct link.

**Pattern 5: Content Preview**
Teases relevant content (podcast excerpt, deep report snippet).

### 4.3 What NEXUS NEVER Gives

- The actual full assessment (costs miles)
- Personalized diagnostic report (costs miles)
- Real peer benchmark comparisons (costs miles)
- 360° rater access (costs miles)

NEXUS shows what's behind the curtain. Miles open the curtain.

### 4.4 Framework Coverage (11 Assessments)

**Flagship:** CPI — China Leadership Pipeline Diagnostic

**SHIFT Suite (5):** LEAP, QUEST, COACH, DRIVE, IMPACT

**Advisory Products (5):** PRISM, BRIDGE, MOSAIC, SPARK, FORGE

For each, NEXUS system prompt includes: core definition, key dimensions, use case, price tier.

### 4.5 System Prompt Architecture

```
You are NEXUS — the intelligent front door of LYC Intelligence.
You are NOT a chatbot. You are an executive thinking partner.

[Core identity + brand voice]
[Framework knowledge — all 11 assessments]
[5 conversation patterns]
[Miles economy awareness — what's free, what costs miles]
[Assessment recommendation logic — trigger conditions, mapping]
[Upgrade CTA guidelines — when and how]
[Confidentiality promise]
[Brand rules — no "free" word, "Executive Introduction"]
```

---

## 5. Maturity Stages

No gamification theater. Professional, data-driven progression.

| Stage | Criteria | Unlocks |
|-------|----------|---------|
| **Curious** (0-30 days) | 1-2 framework explorations | Benchmark teasers, framework overview |
| **Developing** (30-90 days) | 2+ explorations + 1 assessment | Deeper benchmark teasers, content previews |
| **Established** (90-180 days) | 3+ assessments + content engagement | Trend analysis, deeper peer comparison |
| **Authority** (180+ days) | Full SHIFT battery + ongoing | Priority workshops, council invitation |

Visible as "Leadership Intelligence Profile" indicator. Bloomberg-terminal sophistication.

---

## 6. Assessment Layer (11 Products, 3 Categories)

**Flagship (1):** CPI (Unique tier: $199)

**SHIFT Suite (5):**
- Standard ($99): LEAP, DRIVE
- Premium ($149): QUEST, COACH, IMPACT

**Advisory Products (5):**
- Standard ($99): PRISM, MOSAIC, FORGE
- Premium ($149): BRIDGE, SPARK

### Assessment Flow

1. User decides to take assessment (NEXUS recommendation or self-initiated)
2. Miles deducted from balance
3. Assessment presented (25-36 questions)
4. Completion: 10 mile refund (one-time per assessment)
5. AI generates detailed report (included)
6. Results stored in dashboard
7. Feeds into benchmarking engine

---

## 7. Open Questions (Product Team to confirm)

1. **Miles allocation per tier** — 50/150/300/600 assumed, needs sign-off
2. **Miles expiry** — Subscription: no rollover (assumed). Earned: persist (assumed).
3. **Miles purchase** — Can users buy additional miles? At what price?
4. **Explorer chat limits** — Unlimited with 0 miles (assumed) or message limits?
5. **Assessment payment** — Miles only, or direct purchase also? Both?

---

## 8. Implementation Roadmap

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 14** | 11-assessment rebuild from Akira sources | Large |
| **Phase 15.1** | IA & Chat-Flow Triage | Small ✅ DONE |
| **Phase 15.2** | Landing Consolidation | Medium |
| **Phase 15.3** | App Shell Streamlining | Medium |
| **Phase 15.4** | NEXUS Product Brain MVP (Option A) | Medium |
| **Phase 15.5** | Miles & Pricing Alignment (5-tier model) | Medium |
| **Phase 16** | Full Portal Separation | Large |
| **Phase 17** | Go-Live Prep | Medium |

### Phase 15.4 — NEXUS Product Brain MVP (Option A)

Deliverables:
1. Framework-aware system prompt (all 11 assessments)
2. Rule-based assessment recommendation engine
3. Miles earning for 3 actions (framework exploration, reflection, content)
4. Direct CTA to assessment pages from chat
5. NEXUS identity + brand voice enforcement
6. Conversation patterns 1-3 implemented

Not in MVP (Option B/C):
- Full proactive questioning engine
- In-chat 5-question "Taste" mini-diagnostic
- Sample insight library
- Benchmark teasers with context
- Maturity stage tracking
- Conversion funnel analytics
- Post-assessment re-engagement
- Content library integration

---

## 9. Deprecated Models (Do Not Use)

- 2-tier model (Executive Intro / Executive Access)
- 4-tier model from earlier GTM draft
- "credits" as currency name
- 50% China pricing ratio
- € Euro pricing (replaced by USD global + CNY China)
