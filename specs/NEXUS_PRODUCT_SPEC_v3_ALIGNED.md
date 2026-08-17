# NEXUS Product Specification v3.1 (ALIGNED + Batch 6 P0 Corrective)

**Status:** DRAFT — for Kevin review
**Based on:** v2.0 spec (APPROVED Jul 21) + Canonical Pricing v1.0 (Aug 10) + codebase reality + **Batch 6 P0 Canon Audit (Akira, Aug 17)**
**Key alignment:** "credits" → "miles", 4 tiers → 5 tiers, € pricing → USD + CN 1/3
**Batch 6 P0 fixes applied (this version):**
- P0-1: SHIFT/CANVAS/TRIDENT/MERIDIAN codenames removed from user-facing surfaces
- P0-2: CPI = "China Leadership Pipeline Index" (not "Council Performance Insight" / not "Diagnostic")
- P0-3: Mile cost table LOCKED → 1/2/3/5mi canon (not old 99/149/199)
- P0-4: "Platform" banned as product descriptor → positioning = "Executive Intelligence"
- P0-5: "Diagnostic" default user-facing term; "Assessment" = technical/internal only
- P0-6: Tier names rule clarified (ban in casual chat, allowed in upgrade/pricing)
- P0-7: "Pro" = canonical display name; "Professional" = backend tier_key only

---

## 1. Executive Summary

LYC Intelligence is Executive Intelligence — built on three layers:

1. **NEXUS AI** — The intelligent front door. Framework-aware conversations that demonstrate mastery of every diagnostic, surface insights the user hasn't considered, and create desire for deeper diagnostic engagement.
2. **Miles Economy** — The earned middle layer. Users spend miles on diagnostics, reports, 360° feedback, benchmarking, and content. Miles are earned through engagement OR included in subscription.
3. **Human Coaching** — The premium top layer.

**Core design principle:** NEXUS must behave like the best executive coach — not answering questions the user already has, but asking questions they haven't thought of.

**NEXUS is not a chatbot.** It's the intelligent front door of the entire product.

---

## 2. Canonical Pricing Model (from NEXUS_Pricing_Canonical_v1.0)

### 2.1 Subscription Tiers (5 Tiers)

| Tier (display_name) | tier_key (backend) | Global (USD/mo) | China (CNY/mo, 1/3) | Miles per month |
|---------------------|--------------------|-----------------|---------------------|-----------------|
| **Explorer** | explorer | Free | Free | 0 (chat only) |
| **Starter** | starter | $25 | ¥59 | 50 |
| **Pro** | professional | $99 | ¥233 | 150 |
| **Executive** | executive | $199 | ¥466 | 300 |
| **Council** | council | $499 | ¥1,165 | 600 |

**P0-7 Tier naming rule:**
- "Pro" is the **user-facing display name** for the tier with backend key `professional`.
- "Professional" exists ONLY as the backend `tier_key`. Never say "Professional Plan" or "Professional Tier" in user-facing copy — always "Pro".
- Full display order: **Explorer, Starter, Pro, Executive, Council**.

**Brand naming:**
- Explorer tier copy: "Executive Introduction" (no "free" word — Level 1 ban)
- China pricing: exactly 1/3 of international, rounded to nearest whole CNY
- ~$1 = 1 mile approximate parity maintained for subscription value sense, **but instrument mile costs follow the locked 1/2/3/5mi canon (see §6), NOT ~$1/mi**

### 2.2 What Each Tier Gets

| Capability | Explorer | Starter | Pro | Executive | Council |
|-----------|:--------:|:-------:|:---:|:---------:|:-------:|
| NEXUS chat access | ✅ limited | ✅ unlimited | ✅ | ✅ | ✅ |
| Miles per month | 0 | 50 | 150 | 300 | 600 |
| Miles earning | ❌ | ✅ | ✅ | ✅ | ✅ |
| Framework awareness | basic | full | full | full | full |
| Diagnostic recommendations | basic | full | full | full | full |
| Sample insight previews | ✅ | ✅ | ✅ | ✅ | ✅ |
| Benchmark teasers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Full diagnostics (pay-per-use) | ❌ | ✅ | ✅ | ✅ | ✅ |
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

**P0-6 Tier names in NEXUS chat:**
- **HARD BAN:** Mentioning the user's tier or other tiers during casual coaching / diagnostic conversations. NEXUS must not break immersion with tier talk.
- **EXPLICITLY ALLOWED:** Explicit upgrade/recommendation context ("If you upgrade to Pro, you'd get 360° rater access"), pricing surfaces, account/billing pages, comparison tables, credit gates, or when the user directly asks about tiers.

### 2.3 Diagnostic Pricing (3 Service Levels, per-diagnostic add-ons)

| Service Level | Global (USD) | China (CNY, 1/3) | Includes |
|------|-------------|------------------|----------|
| Executive Introduction | $99 | ¥33 | Full diagnostic + PDF report + scorecard + archetype + band interpretation |
| Professional Deep-Dive | $149 | ¥50 | Everything above + development roadmap + benchmark percentiles + gap analysis + 30-min NEXUS coaching |
| Executive Advisory | $249 | ¥66 | Everything above + consultant 1:1 debrief + custom plan + board calibration + APAC context |

**P0-3 NOTE on instrument mile costs:** The 11-diagnostic instrument cost table has been **locked by Kevin** and is NO LONGER ~$1/mi (99/149/199). It is now: **1mi Light / 2mi Standard / 3mi Signature / 5mi Flagship**. See §6 for the per-instrument canon. The three service-level add-on pricing tiers above remain separate from instrument mile cost.

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
| Complete diagnostic (refund) | 10 (one-time) | When ready |
| Participate in workshop | 10 | When available |

**Earning math for typical executive:**
- Framework explorations: 5-10 miles/week
- Content engagement: 2 miles/week
- Reflection: 3 miles/week
- **Monthly total: ~40-60 miles** (nearly uses up Starter — natural upgrade trigger)

### 3.2 Miles Rules

- Subscription miles: do NOT roll over (monthly reset)
- Earned miles: persist indefinitely
- One-time diagnostic completion refund per instrument
- Explorer tier: 0 miles, no earning — chat is the product teaser

---

## 4. NEXUS AI Layer Design

### 4.1 Design Philosophy

1. **Proactively inquisitive** — Surface blind spots the user hasn't articulated
2. **Framework-fluent** — Mastery of all 11 diagnostics
3. **Confidential** — The private space for career thinking
4. **Desire-creating** — Show what's possible; miles unlock what's real

**P0-4 Positioning ban:** NEXUS must never describe itself or LYC as a "platform" in user-facing copy. Interim positioning line: **"Executive Intelligence"** (just the two words — no noun). The term "platform" remains acceptable for internal/technical contexts (e.g., engineering discussions about platform architecture), but NEVER as a product descriptor.

### 4.2 NEXUS Conversation Patterns

**Pattern 1: Framework Exploration**
User asks about a framework → NEXUS explains + vivid example → probing question → reveals underlying need.

**Pattern 2: Proactive Insight**
NEXUS references earlier conversation → raises related blind spot → ties to specific diagnostic.

**Pattern 3: Sample Insight Preview**
User asks "what would my report look like?" → anonymized sample from similar profile → creates desire.

**Pattern 4: Diagnostic Recommendation**
Based on conversation → recommends specific diagnostic with "why now" rationale → direct link.

**Pattern 5: Content Preview**
Teases relevant content (podcast excerpt, deep report snippet).

### 4.3 What NEXUS NEVER Gives

- The actual full diagnostic (costs miles)
- Personalized diagnostic report (costs miles)
- Real peer benchmark comparisons (costs miles)
- 360° rater access (costs miles)

NEXUS shows what's behind the curtain. Miles open the curtain.

### 4.4 Framework Coverage (11 Diagnostics) — P0-3 Locked Mile Cost Canon

**P0-1 NOTE on codenames:** SHIFT, CANVAS, TRIDENT, MERIDIAN are **internal project codenames**. NEVER use them as user-facing product names. Internal metadata fields (e.g., `identity.category = "SHIFT"`) may persist for system routing, but they must never surface to the user. User-facing category labels are below.

#### P0-3 LOCKED INSTRUMENT MILE COST TABLE (Kevin-approved, do not change)

| Mile Cost | Tier Name | Instruments (11 total) |
|-----------|-----------|------------------------|
| 1 mile | Light | LEAP |
| 2 miles | Standard | PRISM, IMPACT, COACH, DRIVE, QUEST |
| 3 miles | Signature | BRIDGE, MOSAIC, SPARK, FORGE |
| 5 miles | Flagship | CPI |

#### User-facing category grouping (P0-1, no codenames visible)

| Grouping | User-facing label | Instruments |
|----------|-------------------|-------------|
| Flagship | **Flagship Diagnostic** | CPI — China Leadership Pipeline Index |
| Career Core | **Career Core Diagnostics** | LEAP, IMPACT, COACH, DRIVE, QUEST (5) |
| Advisory | **Advisory Diagnostics** | PRISM, BRIDGE, MOSAIC, SPARK, FORGE (5) |

**P0-2 CPI name rule:** Full name = **"China Leadership Pipeline Index"**. Short form = "CPI". Former incorrect names must never appear:
- ❌ "Council Performance Insight" (old wrong)
- ❌ "China Leadership Pipeline Diagnostic" (old short wrong; "Index", not "Diagnostic")

**P0-5 "Diagnostic" vs "Assessment" term rule:**
- **DEFAULT user-facing:** "diagnostic" (noun), "diagnostic assessment" (when both words needed for clarity)
- **ALLOWED technical/internal only:** "assessment" (e.g., "assessment engine", "assessment completion", backend route names like `/assessments/cpi`)
- Audit: If a user sees or reads the text, prefer "diagnostic". If it's a backend variable, route, or internal team conversation, "assessment" is fine.

For each diagnostic, NEXUS system prompt includes: core definition, key dimensions, use case, price tier.

### 4.5 System Prompt Architecture

```
You are NEXUS — the intelligent front door of LYC Intelligence.
You are NOT a chatbot. You are an executive thinking partner.

[Core identity + brand voice]
[Framework knowledge — all 11 diagnostics (P0-3 locked mile costs, P0-2 CPI name)]
[5 conversation patterns]
[Miles economy awareness — what's free, what costs miles]
[Diagnostic recommendation logic — trigger conditions, mapping]
[Upgrade CTA guidelines — when and how (P0-6: tier names allowed here)]
[Confidentiality promise]
[Brand rules — no "free" word, "Executive Introduction"; no "platform" (P0-4); P0-1 codenames banned as user-facing; P0-5 diagnostic term preference]
```

---

## 5. Maturity Stages

No gamification theater. Professional, data-driven progression.

| Stage | Criteria | Unlocks |
|-------|----------|---------|
| **Curious** (0-30 days) | 1-2 framework explorations | Benchmark teasers, framework overview |
| **Developing** (30-90 days) | 2+ explorations + 1 diagnostic | Deeper benchmark teasers, content previews |
| **Established** (90-180 days) | 3+ diagnostics + content engagement | Trend analysis, deeper peer comparison |
| **Authority** (180+ days) | Full Career Core battery + ongoing | Priority workshops, council invitation |

Visible as "Leadership Intelligence Profile" indicator. Bloomberg-terminal sophistication.

---

## 6. Diagnostic Layer (11 Products, 3 Categories)

### 6.1 P0-3 Locked Mile Cost Canon — per instrument

| # | Code | Full Name | Mile Cost | User-facing Category |
|---|------|-----------|-----------|----------------------|
| 1 | LEAP | Leadership Executive Agility Profile | 1 (Light) | Career Core |
| 2 | PRISM | Performance Readiness Insight & Success Matrix | 2 (Standard) | Advisory |
| 3 | IMPACT | Influence, Mentoring, Persuasion, Advocacy, Culture Transform | 2 (Standard) | Career Core |
| 4 | COACH | Career Opportunity & Advisory Coaching | 2 (Standard) | Career Core |
| 5 | BRIDGE | Business Readiness & Integrative Directional Guidance Exercise | 3 (Signature) | Advisory |
| 6 | MOSAIC | Multi-Organizational Strategy & Integrative Competencies | 3 (Signature) | Advisory |
| 7 | SPARK | Strategic Perspective, Agility, Resilience, Knowledge | 3 (Signature) | Advisory |
| 8 | DRIVE | Direction, Resilience, Initiative, Vision, Execution | 2 (Standard) | Career Core |
| 9 | FORGE | Focused Outcomes & Readiness for Governance Execution | 3 (Signature) | Advisory |
| 10 | QUEST | Quality of Executive Success & Transition | 2 (Standard) | Career Core |
| 11 | **CPI** | **China Leadership Pipeline Index** | **5 (Flagship)** | **Flagship** |

**P0-1 Codenames:** SHIFT/CANVAS/TRIDENT/MERIDIAN must NOT appear in user-facing labels above. "SHIFT" internal metadata can remain in the identity.category JSON field as long as it never surfaces.

### 6.2 Diagnostic Flow

1. User decides to take diagnostic (NEXUS recommendation or self-initiated)
2. Miles deducted from balance per locked canon (§6.1)
3. Diagnostic presented (25-36 questions per canon deliveryMinutes)
4. Completion: 10 mile refund (one-time per diagnostic)
5. AI generates detailed report (included)
6. Results stored in dashboard
7. Feeds into benchmarking engine

---

## 7. Open Questions (Product Team to confirm)

1. **Miles allocation per tier** — 50/150/300/600 assumed, needs sign-off
2. **Miles expiry** — Subscription: no rollover (assumed). Earned: persist (assumed).
3. **Miles purchase** — Can users buy additional miles? At what price?
4. **Explorer chat limits** — Unlimited with 0 miles (assumed) or message limits?
5. **Diagnostic payment** — Miles only, or direct purchase also? Both?
6. **P0-4 final positioning** — Awaiting Emily's approved positioning line to replace interim "Executive Intelligence"

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
