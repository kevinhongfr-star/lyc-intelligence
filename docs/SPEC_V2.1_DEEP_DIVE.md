# DEX AI Spec v2.1 — Deep Dive (Aligned)
## Council Experience · Journey Intelligence · AI Architecture

**Version:** 2.0 | **Date:** 2026-07-20 | **Author:** NEXUS
**Companion to:** `CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md` v2.1
**Aligned to:** Notion content assets E1.1, E1.2, E1.4, E1.5, E1.6, C3.1, C3.2, A5.1, G2.2, D1–D8
**Purpose:** Implementation-ready specifications, reconciled with existing Notion deliverables.

---

## Alignment Summary — What Changed from v1.0 Deep Dive

| Area | v1.0 Deep Dive | v2.0 Aligned | Notion Source |
|---|---|---|---|
| Council structure | 4-tier subscription, unlimited members | Two layers: Invitation Council (20-cap, invitation-only) + Digital Council Portal (tiered feeder) | E1.1 Charter |
| Gamification | XP, badges, streaks, leaderboards | "Journey Intelligence" — private progress tracking, anonymous peer comparison, milestone recognition | Brand tone (A5.1, G2.2) |
| Assessment visibility | Dashboard shows SHIFT/DRIVE/MOSAIC scores | Diagnostics invisible — user sees insights, never framework names | v2.1 core principle |
| AI report generation | AI generates reports | v1: human-prepared. v2: AI-assisted narrative scaffolding | C3.1 Tech Spec §6 |
| ICP scope | C-suite focused | Mid-to-senior professionals navigating career complexity | A5.1 ICP |
| Content engine | Not specified | Aligned to 5 content pillars from G2.2 | G2.2 LinkedIn Calendar |

---

## Part 1: The Council — Two Layers, One Ecosystem

### 1.1 The Structural Distinction

There are **two distinct layers** that share the "Council" name but serve different functions:

```
┌──────────────────────────────────────────────────────────────────────┐
│  INVITATION COUNCIL (Notion E1.1)                                    │
│  20 active members • Invitation-only • In-person + private digital   │
│  Chatham House rules • 3 formal sessions/year • Peer examination     │
│  Governed by LYC Partners • Charter-bound • Confidentiality-first    │
│                                                                      │
│  This is the innermost circle. It is NOT a product. It is a          │
│  structured peer environment for executives with documented          │
│  force navigation experience.                                        │
│                                                                      │
│  ↑ Promotion from Digital Council Portal (exceptional members)       │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  DIGITAL COUNCIL PORTAL (Product)                                    │
│  Tiered subscription • Broader audience • AI-first • Always-on       │
│  Nexus conversation • Coaching booking • Event access • Peer network │
│  Credit economy • Journey Intelligence • Self-serve                  │
│                                                                      │
│  This IS a product. It is the paid membership layer of DEX AI.       │
│  It feeds the Invitation Council and monetizes the ecosystem.        │
│                                                                      │
│  ↑ Promotion from free Forum users (active engagement + diagnostics) │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  FORUM (Free — Layer 1)                                              │
│  Open access • Content library • Webinars • Workshops                │
│  No AI advisory • No coaching • No peer network                      │
│  Purpose: demonstrate value, build engagement, qualify for upgrade   │
└──────────────────────────────────────────────────────────────────────┘
```

**Key insight:** The Notion Charter (E1.1) describes the **Invitation Council** — a 20-person, invitation-only peer examination group. The code (`CouncilLandingPage.tsx`) describes the **Digital Council Portal** — a tiered subscription product. These are NOT the same thing. The Deep Dive v1.0 conflated them. This version separates and connects them.

### 1.2 The Invitation Council (Notion E1.1 — Authoritative)

**This section does not invent new rules. It restates E1.1 for engineering context.**

| Attribute | Specification |
|---|---|
| **Size** | Capped at 20 active members |
| **Selection** | Invitation-only, by LYC senior partner |
| **Criteria** | (1) 12+ months active Forum engagement, 6+ sessions attended; (2) Completed at least one deep diagnostic (SHIFT, MOSAIC, or BRIDGE) with structured debrief; (3) Documented at least one specific force navigation experience with sufficient precision |
| **Governance** | LYC Partners is the governing party. No elected committee, no chairperson |
| **Sessions** | 3 formal sessions/year (Q1, Q2, Q4). Q2 = primary working session |
| **Rules** | Modified Chatham House rules: observations and case details stay in Council |
| **Advisory access** | 60 minutes/quarter direct access to LYC senior partner |
| **Diagnostic access** | Reduced rate (communicated at invitation) |
| **Search access** | Priority engagement — senior partner personally leads |
| **Confidentiality** | All case material, diagnostic results, individual disclosures are confidential. Survives membership termination |
| **Exit** | Voluntary (written notice), inactive status (12 months max), or removal (material breach) |
| **Fee** | Not specified in charter — currently communicated verbally at invitation |

**What the Invitation Council is NOT:**
- Not a marketing vehicle, alumni network, or brand ambassador programme
- Not a status designation, award, or tier
- Not applied for — extended by invitation only
- Not governed by its members — LYC Partners governs

### 1.3 The Digital Council Portal (Product Specification)

**This is the DEX AI product. It's the paid, digital membership layer that serves a broader audience and feeds the Invitation Council.**

#### 1.3.1 Tier Structure — Aligned to ICP (A5.1)

Notion A5.1 defines ICP as "mid-to-senior professionals navigating career complexity." Tiers must serve this full range, not just C-suite.

| Tier | Target ICP | Price | Credits/Month | Sessions/Month | Nexus Access Level |
|---|---|---|---|---|---|
| **Starter** | Senior managers exploring next step | ¥199/mo (¥1,999/yr) | 8 | 1 | Standard — full Nexus with user context |
| **Growth** | Directors/VPs navigating complexity | ¥499/mo (¥4,999/yr) | 20 | 2 | Enhanced — adds peer benchmarks, opportunity matching |
| **Elite** | C-suite / GM / Founders | ¥999/mo (¥9,999/yr) | 50 | Unlimited | Premium — adds scenario modeling, company intel, proactive alerts |
| **Corporate** | Teams of 5+ from same org | ¥4,999/mo | 200 | 10/team | Organization-wide with team analytics |

**Credits are the same currency across all tiers.** Earning and spending rules are identical. Tier only affects monthly allocation and Nexus access depth.

#### 1.3.2 Nexus Access Depth by Tier

| Capability | Free | Starter | Growth | Elite | Corporate | Invitation Council |
|---|---|---|---|---|---|---|
| General career conversation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User conversation history | Last 5 | Full | Full | Full | Full | Full |
| Assessment-derived insights | Basic | Detailed | Detailed | Detailed | Team view | Full + debrief |
| Peer benchmarking | None | Industry avg | Peer-group | Peer-group + compensation | Org benchmarks | Proprietary data |
| Opportunity matching | None | Basic | Ranked + fit score | + company intel + board dynamics | + team fit | + mandate priority |
| Proactive alerts | None | None | Market trends | Company-specific + peer moves | Org-wide signals | Personal + peer |
| Scenario modeling | None | None | None | ✅ | ✅ | ✅ + historical outcomes |
| Pre-session event briefs | None | None | Basic | Detailed | Detailed | Custom per session |

**The Invitation Council tier** is not a Digital Portal tier — it's a separate membership. Invitation Council members get Digital Portal Elite access by default, plus the Charter-specified benefits (60min/quarter advisory, reduced diagnostics, priority search).

#### 1.3.3 Credit Economy — Detailed Specification

**Earning credits (monthly cap: 50 for non-Council):**

| Action | Credits | Frequency Cap | Alignment Note |
|---|---|---|---|
| Complete Nexus conversation (10+ turns) | 0.5 | 5/week | Not "complete assessment" — assessment is invisible |
| Attend live event | 1-3 (by type) | Per event | Webinars free (loss leader) |
| Complete post-event action plan | 0.5 | Per event | Nexus tracks completion |
| Coaching session attended | 1 | Per session | No-show = no credit returned |
| Provide peer feedback (anonymous) | 0.5 | 2/week | Quality-gated by Nexus |
| Share industry insight with Nexus | 0.5 | 3/week | Nexus evaluates specificity |
| Refer qualified professional | 5 | 2/month | Referral must engage (not just sign up) |
| 30-day consecutive engagement | 3 | 1/month | Automatic |

**Spending credits:**

| Action | Credits | Notes |
|---|---|---|
| Coaching session (30 min) | 1 | |
| Coaching session (60 min) | 2 | |
| Coaching session (90 min intensive) | 3 | |
| Roundtable attendance | 2 | AI-curated attendee list |
| Workshop attendance | 1-2 | By duration |
| Networking dinner | 2 | AI seating algorithm |
| Annual summit | 5 | |
| Request peer introduction | 1 | Mutual benefit verified by Nexus |
| Access event recording + AI summary | 0.5 | |
| Request custom research brief | 3 | Nexus generates using DeepSeek |

**Unspent credits expire at month-end** (no accumulation). This drives monthly engagement.

#### 1.3.4 The Four Pillars — Aligned to Notion

**Pillar 1: AI Executive Advisory (Nexus)**

All users interact with Nexus. The difference is context depth, not personality.

**Alignment with Notion C3.1 (Assessment Platform Tech Spec):**
- Nexus draws from assessment data (SHIFT, MOSAIC, BRIDGE, Force Exposure) stored in the platform database
- Nexus NEVER exposes framework names or raw scores to users
- Nexus translates diagnostic data into natural language insights
- Assessment delivery flow (C3.1 §4): invitation → account → instrument → scoring → report. Nexus sits alongside this flow, using the data after scoring completes.
- Report narrative (C3.1 §6): v1.0 = human-prepared. v2.0 = AI-assisted first-draft scaffolding. Nexus references these human-prepared reports but does NOT generate them in v1.0.

**Council-grade Nexus example (aligned):**

```
User: "I'm getting approached about a CFO role at a 
Series D fintech in Shanghai. Should I take it?"

Nexus (Elite tier):
1. Draws on your development trajectory over 14 months 
   [NOT: "Your DRIVE score shows..."]
2. Checks compensation data for comparable roles in Shanghai fintech
3. Analyzes company context: funding stage, leadership team, recent changes
4. Compares to your current trajectory using career models
5. References your coaching themes: "You mentioned wanting more 
   autonomy and faster decision cycles"
6. Multi-scenario analysis:
   - Take the role: projected outcomes, risk factors
   - Stay: projected outcomes, growth ceiling analysis
   - Counter: probability and likely terms
7. Risk signal: "Average CFO tenure at this stage is 18 months"
8. Next step: "Want me to prep you for the conversation, 
   or connect you with your coach to discuss?"
```

**Pillar 2: 1-on-1 Coaching (AI-Orchestrated)**

**Alignment with Notion Charter (E1.1 §4.4):**
- Charter specifies "60 minutes per quarter" advisory access to senior partner for Invitation Council members
- Digital Portal coaching is different — it's with the broader coach network, not the senior partner
- The coaching matching algorithm should consider diagnostic data (C3.1 scoring results) as input

**Matching algorithm:**

```python
def match_coach(member_profile, available_coaches):
    """
    Input:
      member_profile: {
        development_themes: [from Nexus conversation analysis],
        assessment_insights: [translated from diagnostic data, NOT raw scores],
        stated_goals: [from Nexus goal-setting conversations],
        industry: str,
        seniority_level: str,
        coaching_feedback_history: [from past sessions],
        preferred_style: [directive | exploratory | hybrid — inferred]
      }
    available_coaches: [{
      specializations: [str],
      industry_experience: [str],
      coaching_style: str,
      availability: [datetime],
      success_data: [{member_profile_similarity, outcome_rating}],
      languages: [str]
    }]
    
    Output: ranked list with reasoning
    """
    
    scored_coaches = []
    for coach in available_coaches:
        score = 0
        reasoning = []
        
        # Theme alignment (40%)
        theme_overlap = calculate_overlap(
            member_profile['development_themes'],
            coach['specializations']
        )
        score += theme_overlap * 0.4
        if theme_overlap > 0.7:
            reasoning.append(f"Strong alignment on your key development areas")
        
        # Industry context (25%)
        industry_match = member_profile['industry'] in coach['industry_experience']
        score += (0.25 if industry_match else 0.05)
        if industry_match:
            reasoning.append(f"Direct experience in {member_profile['industry']}")
        
        # Historical success with similar profiles (20%)
        similar_members = [
            s for s in coach['success_data']
            if profile_similarity(s['member_profile_similarity'], member_profile) > 0.7
        ]
        avg_outcome = mean([s['outcome_rating'] for s in similar_members]) if similar_members else 0.5
        score += avg_outcome * 0.2
        if similar_members:
            reasoning.append(f"Track record with similar profiles ({len(similar_members)} past matches)")
        
        # Style fit (15%)
        style_match = coach['coaching_style'] == member_profile['preferred_style']
        score += (0.15 if style_match else 0.05)
        
        scored_coaches.append({
            'coach': coach,
            'score': score,
            'reasoning': reasoning
        })
    
    return sorted(scored_coaches, key=lambda x: x['score'], reverse=True)
```

**Pre/post-session orchestration:**
1. **48h before:** AI generates 2-3 page pre-brief for coach (development themes, recent Nexus conversations, relevant assessment insights). Coach reviews.
2. **24h before:** AI sends member reflection questions based on stated goals and recent themes.
3. **Post-session (same day):** AI extracts key decisions, action items, emotional themes from session notes (if coach logs them). Updates Nexus memory. Sets follow-up reminders.
4. **7-day follow-up:** AI checks in: "How's the [action item] going? Want to adjust?"

**Pillar 3: Events (AI-Enhanced)**

**Alignment with Notion Charter (E1.1 §4.2-4.3):**
- Charter specifies "3 formal sessions/year" for the Invitation Council, conducted under Chatham House rules
- Digital Portal events are SEPARATE from Invitation Council sessions
- Digital Portal events include roundtables, workshops, dinners, webinars
- Invitation Council sessions follow the Charter format (modified Chatham House, structured force examination)

**Event types for Digital Portal:**

| Event Type | Frequency | Capacity | AI Before | AI During | AI After |
|---|---|---|---|---|---|
| **Roundtable** | Monthly | 8-12 | AI curates attendee list. Generates per-attendee brief. | Human-facilitated. AI captures insights. | Personalized summary + action items. Nexus tracks. |
| **Workshop** | Bi-monthly | 20-40 | AI assesses skill levels, customizes depth. | AI facilitates breakout groups. | AI generates action plan per attendee. |
| **Networking Dinner** | Monthly | 12-20 | AI creates seating plan (complementary strengths, industry mix). | Human-hosted. | AI sends intro follow-ups. |
| **Webinar** | Weekly | 50-200 | AI identifies trending topics from member data. | Live Q&A, AI-curated questions. | Personalized highlights for non-attendees. |
| **Annual Summit** | Annual | 100+ | AI drafts agenda from member intelligence data. | AI facilitates some sessions. | Year-in-review per member. |

**Alignment with Notion G2.2 (Content Calendar):**
- Content pillars from G2.2 should inform event themes: Three Forces Analysis, Diagnostic Insights, Leaders in Motion, Forum & Events, Point of View
- Event topics should mirror the content calendar to create a unified brand voice

**AI seating algorithm:**

```python
def generate_seating_plan(attendees, table_size=8):
    """
    Constraints:
    - No same-company at same table
    - Max 2 from same industry per table
    - At least 2 seniority levels per table
    - Optimize for complementary strengths (from assessment insights)
    - Prioritize new connections (minimize repeat pairings)
    """
    tables = []
    remaining = attendees.copy()
    
    while remaining:
        table = [remaining.pop(0)]  # Seed with first unseated
        
        for seat in range(1, table_size):
            if not remaining:
                break
            
            candidates = []
            for person in remaining:
                # Hard constraints
                if same_company(person, table):
                    continue
                if same_industry_count(person, table) >= 2:
                    continue
                if not new_seniority_level(person, table) and has_seniority_diversity(table):
                    continue
                
                # Soft scoring
                score = 0
                score += complementary_strength(person, table) * 0.4
                score += new_connection_potential(person, table) * 0.3
                score += force_navigation_relevance(person, table) * 0.3
                
                candidates.append((person, score))
            
            if candidates:
                best = max(candidates, key=lambda x: x[1])
                table.append(best[0])
                remaining.remove(best[0])
        
        tables.append(table)
    
    return tables
```

**Pillar 4: Peer Network (AI-Facilitated, Not Open)**

**Alignment with Notion Charter (E1.1 §2-3):**
- Charter members are selected for "documented force navigation experience" — not just seniority
- Digital Portal peer network should apply similar logic: Nexus facilitates introductions based on SUBSTANCE, not just title
- "NOT LinkedIn" — curated, not open. Quality over quantity.

**Weekly "People You Should Know" digest:**

```
This week's connections worth exploring:

1. James Liu — VP Operations, Automotive, Shenzhen
   Why you should connect: You're both navigating supply chain 
   restructuring in bilateral contexts. James solved a similar 
   problem at BYD in 2024 — his approach might inform your 
   current situation.
   Mutual value: Your APAC expansion experience addresses 
   a gap in his trajectory.
   [Request Introduction — 1 credit]

2. Maria Santos — CHRO, FMCG, Singapore
   Why you should connect: She's building a leadership development 
   program for her APAC expansion. Your experience with cross-cultural 
   team architecture is directly relevant.
   Mutual value: Her APAC HR network could inform your 
   market intelligence needs.
   [Request Introduction — 1 credit]
```

**Introduction protocol:**
1. Member requests introduction (1 credit)
2. Nexus evaluates mutual benefit (not auto-approved — quality gate)
3. If approved: warm prompt to target member with mutual value framing
4. Both accept → Nexus generates conversation starter + context brief
5. Post-meeting: both members receive follow-up prompt ("Was this valuable?")

**Privacy controls:**
- Visibility: Full profile / Name + company only / Anonymous insights only
- Contactability: Open to introductions / Via Nexus only / Not contactable
- Corporate tier: team members visible only to each other + Nexus
- All peer data subject to confidentiality obligations

### 1.5 The Member Lifecycle — Aligned

```
PROSPECT
  Sources: Forum engagement, diagnostic completion, referral, outbound
  Nexus identifies "Council-ready" signals: 
    - 10+ conversations over 30 days
    - Completed diagnostic (invisible to user: "Nexus learned about your 
      leadership approach through our conversation")
    - Expressed interest in coaching/events
  ▼
ONBOARDING (14 Days) — Digital Portal
  Day 1: Welcome + Nexus orientation ("Tell me about your current challenge")
  Day 2: Nexus deepens understanding (goals, constraints, aspirations)
  Day 3: If no diagnostic yet — Nexus offers "a brief exploration conversation" 
         (this IS the assessment, but framed as conversation, not test)
  Day 5: First "People You Should Know" digest
  Day 7: Invitation to next upcoming event
  Day 10: Complimentary coaching session ("experience what coaching feels like")
  Day 14: Nexus check-in + personalized engagement plan
  ▼
ACTIVE MEMBER (Months 2-12)
  Daily Nexus interactions → Coaching sessions → Events → Peer connections
  Quarterly: Nexus generates engagement review + development trajectory
  ▼
RENEWAL (Month 11)
  Nexus generates renewal brief: value delivered, key insights gained, 
  development progress, peer connections made, recommended focus for next year
  ▼
ALUMNI / UPGRADE
  Alumni: Reduced access, retained data, annual re-engagement attempt
  Upgrade: Starter → Growth → Elite (driven by engagement + career progression)
  ▼
INVITATION COUNCIL (Exceptional members only)
  Quarterly review by LYC senior team
  Criteria: per E1.1 (12+ months, diagnostic depth, documented force navigation)
  Invitation extended personally by senior partner (phone or in-person)
  Acceptance → signs Charter → profile shared with existing Council members
```

### 1.6 Revenue Model — Honest Unit Economics

**Digital Council Portal economics (per member, annual):**

| Tier | Revenue | Coaching Cost | Event Cost | AI/Platform | Net Margin |
|---|---|---|---|---|---|
| Starter | ¥1,999 | ¥960 (12 × ¥80) | ¥200 | ¥300 | **+¥539 (27%)** |
| Growth | ¥4,999 | ¥2,880 (24 × ¥120) | ¥600 | ¥300 | **+¥1,219 (24%)** |
| Elite | ¥9,999 | ¥7,200 (60 × ¥120) | ¥1,200 | ¥500 | **+¥1,099 (11%)** |
| Corporate | ¥59,988 | ¥14,400 (120 × ¥120) | ¥4,800 | ¥2,000 | **+¥38,788 (65%)** |

**Invitation Council economics:** Membership fees (if charged) do NOT cover delivery cost. The Council is a **loss leader** by design. Real ROI:
- Advisory conversion: 15% of Council members → retainer engagements (¥200K-500K each)
- Search placement: 5% of Council members → search mandates (¥500K-1M each)
- Net contribution from 20 Council members: ¥2,750,000+ (conservative)

**Blended model:** Digital Portal members are profitable at the product level. Invitation Council members are profitable at the ecosystem level. Both are necessary.

---

## Part 2: Journey Intelligence (Replaces "Gamification")

### 2.1 Why Not Gamification

**The problem:** XP, badges, streaks, and leaderboards are consumer-app mechanics. They work for Duolingo and fitness apps. They DO NOT work for senior executives navigating career complexity.

**What executives actually value:**
- Private, honest assessment of their development
- Anonymous comparison to peers (not public competition)
- Recognition of genuine progress (not arbitrary achievements)
- A system that gets smarter about them over time

**The reframe:** "Journey Intelligence" — Nexus privately tracks your development trajectory and surfaces insights that help you grow. No badges. No leaderboards. No streaks. Just intelligence about your journey.

### 2.2 What Nexus Tracks (Privately)

**Development dimensions** (derived from conversations, diagnostic data, coaching notes — NOT visible to user):
- Strategic thinking depth
- Cross-border adaptability signals
- Stakeholder management complexity
- Decision-making patterns
- Leadership communication effectiveness
- Career trajectory momentum

**Engagement signals** (used to improve Nexus recommendations, NOT displayed as scores):
- Conversation frequency and depth
- Event attendance and follow-through
- Coaching session engagement (pre-work completion, action item follow-through)
- Peer connection initiation and follow-through
- Content consumption patterns

### 2.3 What the User Sees

**Private Development Dashboard (Nexus-generated, updated quarterly):**

```
Your Development Journey — Q3 2026

Based on our conversations, your coaching sessions, and your 
engagement over the past 3 months, here's what I'm seeing:

STRENGTH MOMENTUM (areas where you're growing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Strategic scenario thinking — You've moved from reactive problem-solving 
  to proactive scenario analysis. Your last 3 conversations show you're 
  considering 2-3 steps ahead more consistently.

• Cross-cultural communication — Since your coaching work with [Coach], 
  you've been applying more nuanced approaches to bilateral team dynamics. 
  Your team engagement score suggests it's working.

WATCH AREAS (where focused effort could accelerate growth)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Delegation patterns — You still default to "let me check" rather than 
  empowering your direct reports. Your coach flagged this twice.

• Network activation — You have 47 meaningful connections in the Council 
  network but initiated only 2 introductions this quarter. Your peers 
  are 3x more active.

PEER CONTEXT (anonymous, opt-in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Compared to peers at your level and stage:
• Conversation depth: Above average (you go deeper than most)
• Event engagement: Average (you attend but don't follow up as much)
• Action follow-through: Below average (this is the gap to close)

[View detailed insights] [Adjust what I track] [Talk to Nexus about this]
```

**Key design principles:**
1. **No scores, no numbers** — qualitative insights backed by pattern recognition
2. **No comparison by name** — anonymous, aggregated peer context
3. **Opt-in** — peer comparison is optional. Default: off.
4. **Actionable** — every insight includes a specific next step
5. **Nexus-delivered** — not a standalone dashboard. Nexus surfaces this in conversation.

### 2.4 Milestone Recognition (Not Achievements)

Instead of "badges," Nexus recognizes genuine milestones. These are NOT displayed publicly. They appear as Nexus conversation acknowledgments.

| Milestone | Trigger | Nexus Acknowledgment |
|---|---|---|
| **Foundation Complete** | First diagnostic conversation completed | "I now have a solid understanding of your leadership approach. This will make our future conversations more targeted." |
| **First Connection** | First peer introduction completed | "You've made your first meaningful connection. [Name] seemed to find the conversation valuable too." |
| **Coaching Rhythm** | 3 consecutive coaching sessions attended | "You're building a good coaching rhythm. The consistency is showing in your development trajectory." |
| **Action Follow-Through** | 5+ action items from coaching completed | "I notice you've been following through on coaching action items consistently. That's rare and it's working." |
| **Community Contributor** | 10+ peer feedback instances | "Other members are benefiting from your perspective. Your feedback has been rated helpful 8 times." |
| **One Year** | 12 months active membership | "We've been working together for a year. Let me show you how far you've come." |
| **Council Invitation** | Selected for Invitation Council | Personal invitation from Kevin Hong (not automated) |

### 2.5 The Companion Loop (Retention Mechanic)

**This is the real retention engine — not badges.**

```
Nexus learns from every interaction
  ↓
Nexus provides more targeted insights
  ↓
User gets more value from Nexus than from any alternative
  ↓
User deepens engagement (coaching, events, peer connections)
  ↓
Nexus has more data to learn from
  ↓
Switching cost = losing an AI that truly knows your career, 
your challenges, your growth trajectory, your peer network
  ↓
User renews / upgrades
```

**Quantified retention targets:**
- Month 1-3: 80% retention (hook phase — Nexus proves value)
- Month 3-6: 70% retention (habit phase — coaching + events become routine)
- Month 6-12: 65% retention (embedded phase — peer network + development trajectory)
- Year 2+: 85% retention (lock-in — switching cost too high)

### 2.6 Notification Strategy — Executive-Grade

| Trigger | Channel | Timing | Frequency Cap |
|---|---|---|---|
| Coaching session reminder | Push + Email | 24h before + 1h before | Per session |
| Event invitation | Push + Email | 1 week before + 2 days before | Per event |
| Peer connection request | Push | Immediate | As received |
| Nexus insight available | Push | Business hours only | 2/week max |
| Quarterly development review | Email | Scheduled | 4/year |
| Weekly digest (People You Should Know) | Email | Sunday 8 PM | 1/week |
| Coaching pre-work | Email + Push | 24h before session | Per session |
| Action item follow-up | Push | 7 days post-session | Per action item |
| Renewal reminder | Email | 30 days before expiry | 1 |
| Invitation Council nomination | Email + Phone | As triggered | As triggered |

**Anti-spam rules:**
- Maximum 3 push notifications per day
- Maximum 5 emails per week (excluding transactional)
- Business hours only for push notifications (8 AM - 8 PM local)
- User can adjust frequency (reduce / critical only / mute)
- 48-hour cool-down after any "stop" response

---

## Part 3: AI Architecture — Deep Design

### 3.1 System Overview

```
                    ┌─────────────────────────────────────┐
                    │           USER INTERFACE            │
                    │     (Chat, Dashboard, Email)        │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │          NEXUS ORCHESTRATOR         │
                    │                                     │
                    │  ┌─────────────┐  ┌──────────────┐ │
                    │  │   Intent    │  │   Context    │ │
                    │  │ Classifier  │→ │  Assembler   │ │
                    │  └──────┬──────┘  └──────┬───────┘ │
                    │         │                │         │
                    │  ┌──────▼────────────────▼───────┐ │
                    │  │     Response Generator        │ │
                    │  │     (DeepSeek API)            │ │
                    │  └──────────────┬────────────────┘ │
                    │                 │                   │
                    │  ┌──────────────▼────────────────┐ │
                    │  │      Memory Manager           │ │
                    │  │  (Working / Episodic / Semantic│ │
                    │  └──────────────┬────────────────┘ │
                    └─────────────────┼───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
    │  Capability Router │  │ Proactive Engine  │  │  Knowledge Base   │
    │                    │  │                   │  │                   │
    │  • Assessment API  │  │  • Trigger engine │  │  • Content assets │
    │  • Coaching API    │  │  • Priority algo  │  │  • Market data    │
    │  • Event API       │  │  • Delivery queue │  │  • Compensation   │
    │  • Peer Network    │  │  • A/B testing    │  │  • Company intel  │
    │  • Search API      │  │                   │  │  • Framework data │
    └────────────────────┘  └───────────────────┘  └───────────────────┘
```

### 3.2 Intent Classification (Refined)

| Intent Category | Example User Input | Router Action | Model |
|---|---|---|---|
| **Career Advisory** | "Where should I go next in my career?" | Standard Nexus response with full context | DeepSeek Pro |
| **Self-Understanding** | "Help me understand my leadership style" | Trigger diagnostic conversation → translate results to insights | DeepSeek Pro |
| **Market Intelligence** | "What's happening in my industry?" | RAG query → market data + content assets | DeepSeek Flash |
| **Compensation** | "Am I being paid fairly?" | RAG query → compensation database | DeepSeek Flash |
| **Opportunity** | "Show me relevant roles" | RAG query → opportunity database + fit scoring | DeepSeek Pro |
| **Coaching** | "I need to talk to someone" | Coaching booking flow + pre-session prep | DeepSeek Flash |
| **Peer Connection** | "Who should I know?" | Peer matching algorithm + introduction protocol | DeepSeek Flash |
| **Event** | "What events are coming up?" | Event calendar + personalized recommendations | DeepSeek Flash |
| **Skill Building** | "How do I improve my negotiation skills?" | RAG query → content library + learning paths | DeepSeek Flash |
| **System Navigation** | "How do I change my password?" | FAQ lookup + system action | DeepSeek Flash |
| **Out of Scope** | "What's the weather in Shanghai?" | Polite redirect to scope | DeepSeek Flash |

**Multi-intent handling:**

```
User: "I'm thinking about leaving my company. 
       Am I being paid fairly? 
       And I want to talk to someone about this."

Nexus:
1. Classifies: [Compensation] + [Career Advisory] + [Coaching]
2. Resolves priority: Career Advisory (overarching) → Compensation (data) → Coaching (action)
3. Responds:
   "Let me help you think through this step by step.
   
   First, let's look at your compensation situation. 
   [Pulls compensation data, presents analysis]
   
   Based on that, and what you've shared about your role, 
   here's what I'm seeing in terms of your career options:
   [Provides career advisory response]
   
   This is also the kind of situation where coaching can help — 
   a neutral space to think through the decision. 
   Want me to book a session? I have [Coach] available Thursday."
```

### 3.3 Context Assembly Pipeline (Refined)

**Alignment with Notion C3.1 (Assessment Platform Tech Spec):**
- Assessment data enters the context pipeline AFTER scoring is complete (C3.1 §5)
- Diagnostic data is stored in the platform database, accessible to Nexus via API
- Framework names are NEVER included in context assembly — only translated insights
- Benchmark comparisons (C3.1 §5) are available only when cohort size ≥ 20

```python
def assemble_context(user_message, user_id, session_type="standard"):
    """
    session_type: "standard" | "council" | "invitation_council"
    
    Alignment notes:
    - Assessment data sourced from C3.1 scoring_results table
    - Framework names translated to natural language before injection
    - Benchmark data only included if cohort ≥ 20 (C3.1 §5)
    - Report references point to human-prepared reports (C3.1 §6, v1.0)
    """
    
    context = {}
    
    # Layer 1: Always available
    context['user'] = db.users.get(user_id)
    context['conversation_history'] = db.conversations.get_recent(
        user_id, limit=20, include_summaries=True
    )
    context['current_goals'] = db.user_goals.get_active(user_id)
    
    # Layer 2: Diagnostic insights (translated, NOT raw)
    # Sources: C3.1 scoring_results + assessment_sessions
    diagnostic_data = db.scoring_results.get_latest(user_id)
    if diagnostic_data:
        context['assessment_insights'] = translate_to_insights(
            diagnostic_data,
            # This function converts raw scores to natural language
            # WITHOUT revealing framework names
            output_format='natural_language'
        )
        # Benchmark comparison (C3.1 §5: only if cohort ≥ 20)
        benchmark = db.benchmarks.get_percentile(diagnostic_data)
        if benchmark and benchmark['cohort_size'] >= 20:
            context['peer_comparison'] = benchmark
    
    # Layer 3: Coaching context
    coaching_sessions = db.coaching_sessions.get_completed(user_id, limit=10)
    if coaching_sessions:
        context['coaching_themes'] = extract_recurring_themes(coaching_sessions)
        context['action_items'] = db.action_items.get_pending(user_id)
        context['coach_feedback'] = extract_coach_insights(coaching_sessions)
    
    # Layer 4: Engagement context
    context['event_history'] = db.event_registrations.get_attended(user_id, limit=10)
    context['peer_connections'] = db.peer_connections.get_active(user_id)
    
    # Layer 5: Tier-gated context
    tier = db.users.get_tier(user_id)
    
    if tier in ['starter', 'growth', 'elite', 'corporate', 'invitation_council']:
        context['peer_benchmarks'] = db.benchmarks.get_peer_group(user_id)
    
    if tier in ['growth', 'elite', 'corporate', 'invitation_council']:
        context['opportunity_matches'] = db.opportunities.get_ranked(user_id, limit=5)
        context['market_intelligence'] = db.market_data.get_relevant(user_id)
    
    if tier in ['elite', 'corporate', 'invitation_council']:
        context['company_intelligence'] = db.company_data.get_relevant(user_id)
        context['proactive_alerts'] = db.alerts.get_for_user(user_id)
    
    if tier in ['invitation_council']:
        # Invitation Council gets proprietary data
        context['proprietary_benchmarks'] = db.lyc_benchmarks.get_for_user(user_id)
        context['historical_outcomes'] = db.outcome_data.get_relevant(user_id)
        context['council_peer_insights'] = db.council_members.get_peer_context(user_id)
        # Charter-specified advisory access tracking
        context['advisory_hours_used'] = db.advisory_sessions.get_hours_this_quarter(user_id)
        context['advisory_hours_remaining'] = 1.0 - context['advisory_hours_used']
    
    return context
```

### 3.4 System Prompt Architecture — 5 Layers

**Layer 1: Base Personality (Constant)**
```
You are Nexus — a career and leadership AI companion for senior professionals 
in Asia. You are direct, analytical, and thorough. You provide honest insights, 
not motivational platitudes. You say "I don't know" when you don't know, then 
offer to find out. You never use framework names (SHIFT, DRIVE, BRIDGE, MOSAIC, 
TRIDENT, etc.) — you translate diagnostic data into natural language. You protect 
user confidentiality absolutely. You serve one user at a time with full attention.
```

**Layer 2: User Context (Assembled per conversation)**
```
ABOUT THIS USER:
- Name: [Name]
- Role: [Current role] at [Company]
- Industry: [Industry]
- Seniority: [Level]
- Key themes: [From Nexus conversation analysis]
- Development areas: [From coaching + diagnostic insights, translated]
- Stated goals: [From goal-setting conversations]
- Tier: [Membership tier]
- Council member since: [Date, if applicable]
- Coaching rhythm: [Frequency, current coach name]
```

**Layer 3: Intent-Specific Instructions**
```
[Injected based on classified intent — e.g., for Career Advisory:]
You are in career advisory mode. The user is exploring their next career move.
- Provide multi-scenario analysis (not single recommendations)
- Include risk factors and probability assessments
- Reference their specific context (assessment insights, coaching themes)
- Offer concrete next steps (not vague advice)
- If the conversation reveals unaddressed development needs, suggest coaching
```

**Layer 4: Tier-Specific Behavior**
```
[Injected based on user tier — e.g., for Elite:]
ELITE TIER BEHAVIOR:
- You have access to company-specific intelligence: org charts, leadership changes, 
  hiring signals, M&A activity. Use this proactively.
- You can run scenario models with proprietary data. Show confidence intervals.
- You can connect users to specific peer members with mutual value analysis.
- You proactively surface alerts: "Your former colleague just became CHRO at Tencent."
- You never say "I don't have access to that." You say "Here's what I can tell you, 
  here's my confidence level, and here's who can help you go deeper."
```

**Layer 5: Safety & Guardrails (Constant)**
```
BOUNDARIES:
- Never reveal another user's data, even if the requesting user has access 
  to peer comparison data (anonymized only)
- Never provide specific salary figures for named individuals
- Never give legal, tax, or medical advice — redirect to appropriate professional
- Never reveal framework names (SHIFT, DRIVE, BRIDGE, MOSAIC, TRIDENT, etc.)
  under any circumstances. These are invisible to the user.
- Never fabricate data. If you don't have data, say so.
- If a user expresses emotional distress, acknowledge it, offer coaching, 
  and if severe, provide crisis resources
- All conversations are confidential. Do not reference one user's conversation 
  in another user's session (except anonymized peer data)
```

### 3.5 Three-Tier Memory System

**Alignment with Notion C3.1 data model:**
- Memory system integrates with assessment platform's data model (C3.1 §7)
- Episodic memory includes assessment sessions, coaching sessions, event attendance
- Semantic memory includes translated diagnostic insights (NOT raw framework data)
- All memory access is subject to RLS policies (C3.1 security requirements)

**Tier 1: Working Memory (Current Conversation)**
```
Purpose: Maintain coherence within a single conversation
Storage: In-context window (last 10-20 turns)
Compression: After 10 turns, earlier turns summarized and stored
Schema: conversation_turns (id, session_id, turn_number, content, summary, timestamp)
Retention: Active for session duration, then compressed into episodic
```

**Tier 2: Episodic Memory (Past Conversations & Interactions)**
```
Purpose: Recall specific past interactions, decisions, and outcomes
Storage: Supabase table: nexus_episodic_memory
Schema:
  - id (uuid, PK)
  - user_id (uuid, FK → users)
  - episode_type (enum: 'conversation', 'coaching_session', 'event', 'peer_interaction', 'assessment')
  - episode_date (date)
  - summary (text) — 2-3 sentence summary
  - key_decisions (jsonb) — [{decision, context, outcome}]
  - emotional_themes (text[]) — extracted themes
  - action_items (jsonb) — [{item, status, due_date}]
  - relevance_tags (text[]) — for retrieval
  - created_at (timestamptz)
  
  Indexes: user_id + episode_type, user_id + episode_date, relevance_tags (GIN)

Retrieval: Semantic search on summary + key_decisions, filtered by relevance_tags
Retention: Indefinite (subject to data governance policy)
```

**Tier 3: Semantic Memory (User Model & World Knowledge)**
```
Purpose: Maintain an evolving model of the user and relevant world knowledge
Storage: Supabase table: nexus_semantic_memory
Schema:
  - id (uuid, PK)
  - user_id (uuid, FK → users)
  - memory_type (enum: 'user_trait', 'preference', 'pattern', 'relationship', 'career_model')
  - key (text) — e.g., 'communication_style', 'risk_tolerance', 'industry_network'
  - value (jsonb) — structured data
  - confidence (float) — 0-1, based on evidence volume and consistency
  - evidence_count (int) — how many data points support this
  - last_updated (timestamptz)
  - source_episodes (uuid[]) — links to episodic memory
  
  Indexes: user_id + memory_type, user_id + key
  
User model example:
{
  "communication_style": {"value": "direct, data-driven, prefers options over recommendations", "confidence": 0.85, "evidence_count": 23},
  "risk_tolerance": {"value": "moderate — averse to career risk, open to strategic risk", "confidence": 0.72, "evidence_count": 12},
  "decision_pattern": {"value": "gathers extensive data, then decides quickly", "confidence": 0.78, "evidence_count": 15},
  "career_motivators": {"value": ["autonomy", "impact", "learning"], "confidence": 0.90, "evidence_count": 30}
}
```

### 3.6 Proactive Suggestion Engine

**Alignment with Notion G2.2 content pillars:**
- Proactive suggestions should reference the 5 content pillars: Three Forces Analysis, Diagnostic Insights, Leaders in Motion, Forum & Events, Point of View
- Event recommendations should align with the content calendar

**Trigger types:**

| Trigger | Source | Priority Score | Example |
|---|---|---|---|
| Peer movement | Company intel DB | High if relevance > 0.7 | "Your former colleague just became CHRO at Tencent" |
| Opportunity match | Opportunity DB | High if fit > 0.8 | "A CFO role just opened that matches 6/7 of your criteria" |
| Event recommendation | Event calendar | Medium-High | "A roundtable on succession planning — your top development area" |
| Development milestone | Episodic memory | Medium | "You've completed 3 coaching sessions — time to review progress" |
| Content insight | Content DB + user model | Medium | "A new analysis on bilateral governance complexity — relevant to your situation" |
| Coaching follow-up | Action items DB | Medium-High | "You said you'd have the delegation conversation by Friday. How did it go?" |
| Re-engagement | Engagement gap | Low-Medium | "It's been 2 weeks. Here's what's new since we last talked" |
| Streak milestone | Engagement tracker | Low | "You've been engaging consistently for 30 days. Here's what's changed" |
| Renewal approaching | Subscription DB | High (at 30 days) | "Your membership renews in 30 days. Here's what you've gained" |
| Council eligibility | Engagement + diagnostic data | Critical (internal) | Not shown to user — flagged for LYC senior team review |

**Priority algorithm:**

```python
def calculate_priority(trigger):
    """
    Score 0-100. Higher = more urgent/important.
    """
    score = 0
    
    # Relevance to user's current situation (30%)
    score += trigger['relevance'] * 30
    
    # Urgency / time sensitivity (20%)
    score += trigger['urgency'] * 20
    
    # Historical acceptance rate for this trigger type (20%)
    score += trigger['historical_acceptance'] * 20
    
    # Value density — how much actionable insight (15%)
    score += trigger['value_density'] * 15
    
    # Credit cost to user (lower = higher priority) (10%)
    score += (1 - trigger['credit_cost'] / max_credit) * 10
    
    # Recency — newer triggers get slight boost (5%)
    score += trigger['recency_factor'] * 5
    
    return min(score, 100)
```

**Delivery queue:**
- Maximum 3 proactive suggestions per week
- Delivered via Nexus in conversation (not push notification unless urgent)
- User can dismiss ("not now", "not relevant", "stop these")
- Dismissal adjusts future trigger sensitivity

### 3.7 Multi-Model Routing (DeepSeek Only)

**Alignment with SOUL.md:** All compute via DeepSeek API. Coze = orchestration only.

| Task Type | Model | Latency Budget | Notes |
|---|---|---|---|
| Intent classification | DeepSeek Flash | <500ms | Simple pattern matching |
| Context assembly | N/A (code) | <200ms | Database queries, no LLM |
| Standard conversation | DeepSeek Flash | <3s | Most Nexus interactions |
| Complex advisory | DeepSeek Pro | <8s | Multi-scenario analysis, career strategy |
| Diagnostic translation | DeepSeek Pro | <5s | Converting assessment data to insights |
| Peer matching | DeepSeek Flash | <2s | Structured comparison |
| Content generation | DeepSeek Pro | <10s | Research briefs, summaries |
| Event summarization | DeepSeek Flash | <5s | Post-event AI summary |
| Proactive suggestion | DeepSeek Flash | <1s | Trigger evaluation + message generation |

**Fallback chain:** Flash timeout (5s) → Flash retry → Pro fallback → graceful degradation ("I'm processing something complex, give me a moment")

### 3.8 RAG Architecture

**Alignment with Notion DB1 (100 content assets):**
- Content assets span 16 categories (Report Templates, Question Banks, Email Sequences, etc.)
- RAG should index all public-facing content (Forum, webinars, workshops, advisory materials)
- Internal operational content (Search Materials, Retainer packs) is NOT exposed to Nexus
- Diagnostic specifications (D1-D8) inform Nexus's understanding but are never directly quoted

**Query types:**

| Query Type | Sources | Retrieval Strategy |
|---|---|---|
| Market intelligence | External market data + Notion content (G2.2 content pillars) | Semantic search + recency filter |
| Compensation | Proprietary compensation database | Structured query by role/industry/level |
| Company intel | Company database + news | Structured query + semantic enrichment |
| Career guidance | Content library (advisory materials, webinars) | Semantic search by topic + user context |
| Diagnostic insight | Assessment scoring results (translated) | Direct lookup by user_id |
| Peer context | Peer network data (anonymized) | Structured query + relevance filter |

### 3.9 Implementation Phases

**Phase 1 (MVP — Weeks 1-6): Foundation**
- Nexus conversational interface with basic intent routing
- Working memory + episodic memory (Tier 1 + 2)
- User context assembly (Tier 1-3 from pipeline)
- DeepSeek Flash for standard conversation, Pro for complex advisory
- Basic RAG over Notion content library
- Integration with assessment platform scoring results (C3.1 §5) — translated, not raw

**Phase 2 (Weeks 7-10): Intelligence**
- Semantic memory (Tier 3) — user model
- Proactive suggestion engine
- Peer matching algorithm
- Tier-gated context (all 5 tiers)
- Coaching pre/post-session orchestration

**Phase 3 (Weeks 11-14): Ecosystem**
- Event AI (seating algorithm, pre-briefs, post-summaries)
- Company intelligence integration
- Opportunity matching with fit scoring
- Journey Intelligence dashboard
- Content engine aligned to G2.2 content pillars

**Phase 4 (v2.0 — Post-launch): Advanced**
- AI-assisted report narrative scaffolding (C3.1 §6 explicitly calls this out for v2.0)
- Scenario modeling with historical outcome data
- Predictive career trajectory models
- Advanced peer network effects (warm introductions at scale)
- Invitation Council digital layer (Charter-compliant, Chatham House rules enforcement)

---

## Appendix: Notion Alignment Matrix

| Deep Dive Section | Notion Asset | Asset ID | Alignment Status |
|---|---|---|---|
| Council Charter | Invitation Council — Membership Charter | E1.1 | ✅ Restated, not reinvented |
| Council Invitation Protocol | Invitation Council — Member Invitation Letter Template | E1.5 | ✅ Referenced in lifecycle |
| Council Roundtable Format | Invitation Council — Roundtable Agenda Template | E1.4 | ✅ Event types aligned |
| Council Annual Briefing | Invitation Council — Annual Briefing Document | E1.6 | ✅ Quarterly review aligned |
| Digital Portal Tiers | Coaching Credits Page (code) | — | ✅ Aligned to ICP A5.1 |
| Assessment Integration | Assessment Platform Tech Spec | C3.1 | ✅ v1/v2 phasing aligned |
| Scoring Data Flow | Assessment Logic Specification | G2.2/Diagnostic Ops | ✅ Translated, not raw |
| ICP Scope | ICP & Target Account Definition | A5.1 | ✅ Mid-to-senior, not just C-suite |
| Content Engine | LinkedIn Content Calendar | G2.2 | ✅ 5 pillars inform RAG + events |
| Diagnostic Tools | Diagnostic Specs (D1-D8) | Various | ✅ Invisible to users |

---

*This document replaces `SPEC_V2.1_DEEP_DIVE.md` v1.0. All future work should reference this aligned version.*
