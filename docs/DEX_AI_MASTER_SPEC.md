# DEX AI — Master Product & Business Specification
## Unifying the B2C Platform and B2B Flywheel

**Version:** 3.1 | **Date:** 2026-07-20 | **Author:** NEXUS
**Replaces:** `DEX_AI_MASTER_SPEC.md` v3.0, `CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md` v2.1, `SPEC_V2.1_DEEP_DIVE.md` v2.0
**Supplements:** Notion content assets (E1.1, C3.1, A5.1, G2.2, D1–D8)

---

## Executive Summary

DEX AI operates on **two integrated layers** that share the same infrastructure but serve different markets:

| Layer | Target | Diagnostics | Pricing Model | Revenue Model |
|---|---|---|---|---|
| **DEX AI Platform** (B2C) | Individual professionals | Invisible — Nexus translates to insights | Monthly subscription | Recurring SaaS revenue |
| **LYC Flywheel** (B2B) | Organizations, HR/L&D, boards | Visible — named, priced, sold | Per-diagnostic / per-programme | High-value project revenue |

**The Bridge:** B2C users graduate into the B2B flywheel. The Council is the connection point — B2C Elite members become Council candidates, who become speakers, content creators, and advisory clients.

**One sentence:** DEX AI is the digital engine that powers the LYC flywheel at scale.

---

## Part 1: DEX AI Platform (B2C)

### 1.1 Core Identity

**DEX AI IS Nexus** — a career & leadership AI companion for mid-to-senior professionals navigating career and leadership complexity.

- Users interact ONLY with Nexus
- Diagnostics (SHIFT, MOSAIC, BRIDGE, etc.) run invisibly in the background
- LYC frameworks are NEVER visible to end users
- Assessment is one entry point, not the product
- The ecosystem (coaching + events + content + network) is the real moat

### 1.2 User Experience Model

```
User: "Help me understand my leadership style"
  → Nexus runs SHIFT assessment in background
  → User sees: "Based on our conversation, your leadership approach 
    tends toward strategic architecture with strong stakeholder 
    influence. Here's what that means for your current situation..."
  → User NEVER sees: "SHIFT score: 78, Archetype: Strategic Architect"

User: "Am I being paid fairly?"
  → Nexus queries compensation database
  → User sees: "Leaders at your level in APAC manufacturing 
    earn ¥X-¥Y with Z% equity. Here's your position..."

User: "Who should I know?"
  → Nexus runs peer matching algorithm
  → User sees: "James Liu is navigating a similar challenge. 
    Want me to facilitate an introduction?"
```

### 1.3 Subscription Tiers

| Tier | Target ICP | Price | Credits/Month | Sessions/Month | Nexus Depth |
|---|---|---|---|---|---|
| **Free** | Curious professionals | ¥0 | 0 | 0 | Basic — general career conversation |
| **Starter** | Senior managers exploring next step | ¥199/mo (¥1,999/yr) | 8 | 1 | Standard — full Nexus with user context |
| **Growth** | Directors/VPs navigating complexity | ¥499/mo (¥4,999/yr) | 20 | 2 | Enhanced — adds peer benchmarks, opportunity matching |
| **Elite** | C-suite / GM / Founders | ¥999/mo (¥9,999/yr) | 50 | Unlimited | Premium — scenario modeling, company intel, proactive alerts |
| **Corporate** | Teams of 5+ from same org | ¥4,999/mo | 200 | 10/team | Organization-wide with team analytics |

### 1.4 Nexus Capabilities by Tier

| Capability | Free | Starter | Growth | Elite | Corporate |
|---|---|---|---|---|---|
| General career conversation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Conversation history | Last 5 | Full | Full | Full | Full |
| Assessment-derived insights | None | Detailed | Detailed | Detailed | Team view |
| Peer benchmarking | None | Industry avg | Peer-group | Peer-group + comp | Org benchmarks |
| Opportunity matching | None | Basic | Ranked + fit | + company intel | + team fit |
| Proactive alerts | None | None | Market trends | Company-specific | Org-wide signals |
| Scenario modeling | None | None | None | ✅ | ✅ |

### 1.5 Journey Intelligence (Not Gamification)

No XP, badges, streaks, or leaderboards. Executives don't play games.

**What Nexus tracks privately:**
- Development dimensions (strategic thinking, cross-border adaptability, stakeholder influence, etc.)
- Engagement signals (conversation frequency, event attendance, coaching follow-through)
- Peer comparison data (anonymous, opt-in)

**What the user sees — Quarterly Development Review:**
```
Your Development Journey — Q3 2026

STRENGTH MOMENTUM
• Strategic scenario thinking — You've moved from reactive 
  problem-solving to proactive scenario analysis.

• Cross-cultural communication — Since your coaching work 
  with [Coach], you've applied more nuanced approaches.

WATCH AREAS
• Delegation patterns — You still default to "let me check" 
  rather than empowering direct reports.

• Network activation — You have 47 connections but initiated 
  only 2 introductions this quarter. Peers are 3x more active.

PEER CONTEXT (anonymous, opt-in)
• Conversation depth: Above average
• Event engagement: Average
• Action follow-through: Below average — this is the gap to close
```

**Milestone Recognition** (delivered by Nexus in conversation, not as badges):
- "I now have a solid understanding of your leadership approach"
- "You're building a good coaching rhythm — the consistency is showing"
- "Other members are benefiting from your perspective"

### 1.6 The Companion Loop (Retention Engine)

```
Nexus learns from every interaction
  → Provides more targeted insights
  → User gets more value than any alternative
  → User deepens engagement (coaching, events, peer connections)
  → Nexus has more data to learn from
  → Switching cost = losing an AI that truly knows you
  → User renews / upgrades
```

**Retention targets:**
- Month 1-3: 80% (hook phase)
- Month 3-6: 70% (habit phase)
- Month 6-12: 65% (embedded phase)
- Year 2+: 85% (lock-in)

### 1.7 🔴 Nexus Scope Boundary — What We Build vs What We Recommend

**This section is the product firewall.** It defines what Nexus delivers as a product experience versus what it recommends from the external flywheel ecosystem. These two domains must never blur in the user interface.

#### What Nexus Delivers Directly (Product Features)

These are **built into the platform** and exist as Nexus capabilities:

| Capability | Description | In-App Experience |
|---|---|---|
| **Conversational AI** | Career & leadership dialogue | Chat interface, natural language |
| **Invisible Diagnostics** | SHIFT, MOSAIC, BRIDGE etc. run in background | User sees translated insights, never scores |
| **Journey Intelligence** | Private development tracking | Quarterly reviews, conversational nudges |
| **Coaching Orchestration** | Match, book, prep, follow-up | In-app booking, pre-session briefs, post-session synthesis |
| **Peer Matching** | Algorithmic connection to relevant peers | "James Liu is navigating a similar challenge" |
| **Content Curation** | RAG over 120+ annual content assets | Personalized articles, insights, recommendations |
| **Market Intelligence** | Compensation data, industry trends, opportunity matching | In-app dashboards, proactive alerts |
| **Proactive Nudges** | Timely suggestions based on user context | "The roundtable on cross-border teams next Thursday might be relevant" |
| **Quarterly Development Reviews** | Periodic progress synthesis | Delivered in-conversation by Nexus |
| **Memory & Context** | 3-tier memory system (working/episodic/semantic) | Nexus "remembers" across sessions |

#### What Nexus Recommends (External Flywheel Services)

These are **real-world services** that exist outside the platform. Nexus can suggest them conversationally, but they are **not product features** — they are external offerings that the user engages with through LYC directly:

| External Service | How Nexus Surfaces It | What Happens Next |
|---|---|---|
| **Named Diagnostic Products** (QUEST $500, DRIVE $500, etc.) | "Based on what we've discussed, a deeper assessment might give you more clarity" | User is connected to LYC advisory team |
| **Webinars** (monthly, themed) | "There's a session on cross-border team dynamics this Thursday" | User registers via LYC event page |
| **Roundtables** (2x/month, $500-800) | "A small group is discussing exactly this challenge next week" | User is introduced to event coordinator |
| **Workshops** ($5K-15K/org) | "Your team might benefit from a structured session on this" | User is connected to LYC programme team |
| **Advisory Programmes** ($15K-50K/org) | "This is the kind of challenge where structured advisory helps" | Warm handoff to LYC advisory |
| **Council Membership** ($5K-50K/yr) | "There's a peer group that examines exactly these questions" | Invitation process per E1.1 Charter |
| **External Coaches** | "Based on your theme, I'd recommend talking to [Coach Name]" | User books via coaching marketplace |
| **Podcast/Speaker Opportunities** | "Your experience would be valuable for our next webinar" | User is connected to content team |

#### The Boundary Rule

```
IF it's a conversation, insight, or digital experience
  → Nexus DELIVERS it (built into the product)

IF it's a physical event, organizational engagement, external service, 
   or involves named diagnostic pricing
  → Nexus RECOMMENDS it (surfaces conversationally, user engages externally)

Nexus NEVER:
  ❌ Displays diagnostic product names or prices
  ❌ Shows a "shop" or "store" for assessments
  ❌ Lists events as a calendar the user browses alone
  ❌ Sells anything — it suggests, recommends, and connects
  ❌ Reveals the flywheel mechanics to the user

Nexus DOES:
  ✅ Translate diagnostic results into natural language insights
  ✅ Proactively suggest relevant events/services based on conversation context
  ✅ Make warm introductions to external coaches, speakers, and peers
  ✅ Orchestrate the handoff between product experience and real-world services
  ✅ Remember what it recommended and follow up on outcomes
```

#### Why This Boundary Matters

1. **User trust:** The moment Nexus feels like a sales funnel, trust evaporates. Recommendations must feel like a knowledgeable friend, not a chatbot pushing products.
2. **Product clarity:** The engineering team needs to know what to build vs what to integrate. Everything in the "Delivers" column is a sprint item. Everything in the "Recommends" column is an API integration or CRM handoff.
3. **Business model protection:** The B2B flywheel relies on diagnostics being sold at premium prices. If B2C users see the same diagnostics for free (or as a subscription feature), B2B pricing collapses.
4. **Nexus identity:** Nexus is a companion, not a storefront. Its value comes from knowing the user deeply and making thoughtful recommendations — not from displaying a menu of services.

---

## Part 2: LYC Flywheel (B2B)

### 2.1 The Flywheel in One Sentence

Every diagnostic leads to a conversation. Every conversation leads to a relationship. Every relationship compounds into revenue.

### 2.2 Three Entry Doors

**Door 1: Speaker Invitation** (highest value, lowest volume)
- Invitation to speak at a webinar
- Speaker gets visibility + credibility
- Progression: Speaker → Council Member → Podcast Guest → Roundtable Host
- Revenue: Council membership ($5K-15K/yr) + co-delivered programmes

**Door 2: Attendee Invitation** (medium value, medium volume)
- Invitation to attend a webinar (free or low-cost)
- Attendee engages with content + diagnostic
- Progression: Attendee → Newsletter → Diagnostic → Roundtable → Programme
- Revenue: Diagnostic ($500-2K) → Roundtable ($500-800) → Programme ($5K-25K)

**Door 3: Diagnostic Invitation** (low friction, highest volume)
- Invitation to take a self-assessment (free or low-cost)
- Prospect gets archetype result
- Progression: Assessment → Report → Newsletter → Webinar → Roundtable → Programme
- Revenue: Full debrief ($1K-3K) → Programme ($5K-25K)

### 2.3 Monthly Content Rhythm

Every month = 1 themed webinar + 1 diagnostic focus + 1 programme link

| Month | Theme | Diagnostic | Programme Link |
|---|---|---|---|
| Aug 2026 | Governance Shift | BRIDGE | P1.1 Advisory |
| Sep 2026 | Cross-Border Teams | MOSAIC | P2.1 Cross-Border |
| Oct 2026 | AI-Ready Leadership | SPARK | P3.1 AI Leadership |
| Nov 2026 | Revenue Architecture | FORGE | FORGE Workshop |
| Dec 2026 | Board Effectiveness | IMPACT | Advisory retainer |
| Jan 2027 | Leading the SHIFT | SHIFT Composite | SHIFT Programme |
| Feb 2027 | Executive Presence + AI | QUEST | Coaching (P3.3) |
| Mar 2027 | Succession Illusion | DRIVE | Advisory Force 3 |
| Apr 2027 | Brand Identity | PRISM | Advisory Force 2 |
| May 2027 | Integrated Leader | SHIFT+LEAP | Full suite |
| Jun 2027 | Career Resilience | DRIVE+LEAP | B2C + Coaching |
| Jul 2027 | Invitation Council | ALL 9 | Council launch |

Each webinar generates 5 content pieces: article, newsletter edition, 3 LinkedIn posts, 1 podcast segment. 24 webinars/year = 120 content assets.

### 2.4 Conversion Stack (6 Tiers)

**Tier 1: Free/Low (Awareness)**
- Webinar attendance (free), Newsletter subscription (free), Self-assessment archetype (free or $50-100)

**Tier 2: Diagnostic ($500-2,000)**
- Full diagnostic with debrief, Organization diagnostic (MOSAIC $500/pax)

**Tier 3: Roundtable ($500-800/seat)**
- 2x/month, 20-25 pax, Chatham House Rule, ~24/year, ~$166K/yr

**Tier 4: Workshop ($5K-15K/organization)**
- Half-day or full-day, customized, 20-30/year

**Tier 5: Programme ($15K-50K/organization)**
- Multi-module, 6-12 weeks, 10-15/year

**Tier 6: Council + Advisory ($5K-50K/year)**
- Invitation Council: 15-25 members, annual membership, advisory access

---

## Part 3: The Integration Layer — How B2C and B2B Connect

### 3.1 System Architecture (One Product, Two Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  DEX AI PLATFORM (B2C — THE PRODUCT)                        │
│                                                              │
│  Users interact with Nexus only                              │
│  Diagnostics are INVISIBLE — translated to insights          │
│  Nexus delivers: conversation, coaching, peer matching,      │
│                  journey tracking, content curation           │
│  Nexus recommends: events, diagnostics (B2B), advisory,      │
│                    council, speaker opportunities             │
│  Nexus NEVER shows prices, diagnostic names, or a "store"    │
└────────────────────────────┬────────────────────────────────┘
                             │
                    THE BRIDGE
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LYC FLYWHEEL (B2B — THE BUSINESS MODEL)                    │
│                                                              │
│  Organizations buy diagnostics, workshops, programmes        │
│  Diagnostics are VISIBLE — named, priced, sold               │
│  Conversion stack: Free → Diagnostic → Roundtable →         │
│                    Workshop → Programme → Council            │
│                                                              │
│  B2B clients who engage deeply:                              │
│  → Become Council members                                    │
│  → Create content for the B2C platform                       │
│  → Feed the flywheel                                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 The Invitation Council — The Connection Point

**The Council serves BOTH layers:**

| Aspect | B2C Context | B2B Context |
|---|---|---|
| **What it is** | Premium upgrade for Elite DEX AI members | Invitation-only peer examination group |
| **Size** | No cap (any Elite member who qualifies) | 20 active members max |
| **Selection** | Algorithmic + human review | Invitation by LYC senior partner |
| **Criteria** | 12+ months engagement, diagnostic depth, documented navigation | Same (per E1.1 Charter) |
| **Diagnostics** | Invisible (Nexus translates) | Visible (sold as products) |
| **Revenue** | Part of Elite subscription | $5K-50K/yr membership + advisory |

### 3.3 Data Flow Between Layers

```
B2C User takes diagnostic (invisible)
  → Data stored in LEAP platform
  → Nexus uses insights for personalized guidance
  → If exceptional: flagged for Council
  → Council member → invited to speak at B2B webinar
  → B2B attendee takes same diagnostic (visible, $500-1,500)
  → B2B attendee enters conversion stack
  → Some become Council members
  → Loop continues
```

### 3.4 The Recommendation Engine (How Nexus Surfaces Flywheel Services)

This is the technical implementation of §1.7's boundary rule:

```python
def should_recommend_flywheel_service(user_message, user_context):
    """
    Nexus evaluates whether to recommend an external flywheel service.
    Rules:
    - Never recommend if user hasn't had at least 3 substantive conversations
    - Never recommend the same service twice without acknowledged follow-up
    - Always frame as contextual suggestion, not product listing
    - Always offer opt-out ("No pressure — just thought it might be relevant")
    """
    triggers = {
        'recurring_theme': user_context.recurring_themes.count >= 3,
        'coaching_readiness': user_context.coaching_sessions.completed >= 2,
        'event_proximity': days_until_next_event(user_context.industry) <= 14,
        'peer_activity': user_context.peer_group.engagement_level > user_context.engagement_level * 1.5,
        'diagnostic_depth': user_context.conversation_depth_score > 0.7,
    }
    
    service = match_service(user_context, triggers)
    if service and not recently_recommended(user_context, service):
        return format_as_natural_suggestion(service, user_context)
    return None
```

**Example outputs (what the user actually sees):**
- "You've mentioned cross-border team challenges three times now. We have a roundtable on exactly this topic next Thursday — small group, senior leaders. Want me to hold a spot?"
- "Based on what you've been working through with your executive team, a structured diagnostic might give you a shared language. I can connect you with our advisory team if you're curious."
- "Your peer group is really engaging with the governance shift topic this month. There's a webinar Thursday that might add perspective."

---

## Part 4: AI Architecture

### 4.1 System Overview

```
USER INTERFACE (Chat, Dashboard, Email)
         │
    NEXUS ORCHESTRATOR
    ├── Intent Classifier → Context Assembler → Response Generator (DeepSeek)
    ├── Memory Manager (Working / Episodic / Semantic)
    ├── Capability Router (Assessment API, Coaching API, Event API, etc.)
    ├── Recommendation Engine (flywheel service surfacing, per §3.4)
    └── Proactive Engine (Trigger detection, priority scoring, delivery)
         │
    DATA LAYER
    ├── User profiles + conversation history
    ├── Assessment results (LEAP platform, translated insights)
    ├── Compensation database
    ├── Market intelligence
    ├── Content library (120+ assets from monthly rhythm)
    ├── Peer network graph
    └── Flywheel service catalog (events, diagnostics, programmes — for recommendation only)
```

### 4.2 Intent Classification

| Intent | Example | Router Action | Model |
|---|---|---|---|
| Career Advisory | "Where should I go next?" | Standard Nexus + full context | DeepSeek Pro |
| Self-Understanding | "Help me understand my leadership style" | Trigger diagnostic → translate to insights | DeepSeek Pro |
| Market Intelligence | "What's happening in my industry?" | RAG → market data + content | DeepSeek Flash |
| Compensation | "Am I being paid fairly?" | RAG → compensation DB | DeepSeek Flash |
| Opportunity | "Show me relevant roles" | RAG → opportunity DB + fit scoring | DeepSeek Pro |
| Coaching | "I need to talk to someone" | Booking flow + pre-session prep | DeepSeek Flash |
| Peer Connection | "Who should I know?" | Peer matching + intro protocol | DeepSeek Flash |
| Event | "What events are coming up?" | Event calendar + recommendations | DeepSeek Flash |
| Skill Building | "How do I improve negotiation?" | RAG → content library + learning paths | DeepSeek Flash |
| System Navigation | "How do I change my password?" | FAQ lookup + system action | DeepSeek Flash |
| Out of Scope | "What's the weather?" | Polite redirect | DeepSeek Flash |

### 4.3 Context Assembly Pipeline

```python
def assemble_context(user_message, user_id, tier):
    context = {}
    
    # Layer 1: Always available
    context['user'] = db.users.get(user_id)
    context['conversation_history'] = db.conversations.get_recent(user_id, limit=20)
    context['current_goals'] = db.user_goals.get_active(user_id)
    
    # Layer 2: Diagnostic insights (TRANSLATED — never raw scores)
    diagnostic_data = db.scoring_results.get_latest(user_id)
    if diagnostic_data:
        context['assessment_insights'] = translate_to_insights(
            diagnostic_data, output_format='natural_language'
        )
        # Benchmark only if cohort ≥ 20 (per C3.1 §5)
        benchmark = db.benchmarks.get_percentile(diagnostic_data)
        if benchmark and benchmark['cohort_size'] >= 20:
            context['peer_comparison'] = benchmark
    
    # Layer 3: Coaching context
    context['coaching_themes'] = extract_recurring_themes(
        db.coaching_sessions.get_completed(user_id, limit=10)
    )
    context['action_items'] = db.action_items.get_pending(user_id)
    
    # Layer 4: Tier-gated context
    if tier >= 'starter':
        context['peer_benchmarks'] = db.benchmarks.get_peer_group(user_id)
    if tier >= 'growth':
        context['opportunity_matches'] = db.opportunities.get_ranked(user_id)
        context['market_intelligence'] = db.market_data.get_relevant(user_id)
    if tier >= 'elite':
        context['company_intelligence'] = db.company_data.get_relevant(user_id)
        context['proactive_alerts'] = db.alerts.get_for_user(user_id)
    
    # Layer 5: Recommendation context (flywheel service matching)
    context['recommendation_state'] = get_recommendation_state(user_id)
    # Includes: last recommended service, recommendation frequency, 
    # opt-out preferences, trigger scores per service category
    
    return context
```

### 4.4 System Prompt Architecture (5 Layers)

**Layer 1 — Base Personality (constant):**
Nexus is direct, analytical, thorough. Provides honest insights, not platitudes. Never uses framework names. Protects confidentiality absolutely.

**Layer 2 — User Context (per conversation):**
Name, role, industry, seniority, key themes, development areas, goals, tier, coaching rhythm.

**Layer 3 — Intent Instructions (per intent):**
Specific behavior per intent category (career advisory, coaching booking, etc.)

**Layer 4 — Tier Behavior (per tier):**
Unlocks capabilities based on subscription level. Elite gets proactive alerts, company intel, scenario modeling.

**Layer 5 — Safety & Guardrails (constant):**
Never reveal other users' data. Never give legal/tax/medical advice. Never fabricate data. Redirect emotional distress to coaching. **Never display diagnostic product names or prices — this is a hard rule per §1.7.**

### 4.5 Three-Tier Memory System

| Tier | Purpose | Storage | Retention |
|---|---|---|---|
| **Working** | Current conversation coherence | In-context (10-20 turns) | Session duration |
| **Episodic** | Past conversations, decisions, outcomes | `nexus_episodic_memory` table | Indefinite |
| **Semantic** | User model, preferences, patterns | `nexus_semantic_memory` table | Indefinite |

### 4.6 Multi-Model Routing

| Task | Model | Latency Budget |
|---|---|---|
| Intent classification | DeepSeek Flash | <500ms |
| Standard conversation | DeepSeek Flash | <3s |
| Complex advisory | DeepSeek Pro | <8s |
| Diagnostic translation | DeepSeek Pro | <5s |
| Peer matching | DeepSeek Flash | <2s |
| Content generation | DeepSeek Pro | <10s |
| Proactive suggestion | DeepSeek Flash | <1s |
| Flywheel service recommendation | DeepSeek Flash | <1s |

All compute via DeepSeek API. Coze = orchestration only.

---

## Part 5: Content Engine

### 5.1 Monthly Production Rhythm

Aligned to the B2B flywheel's 12-month calendar. Each month produces:

| Output | Source | Delivery |
|---|---|---|
| 1 Webinar (60 min) | Themed to monthly diagnostic | Live + replay |
| 1 Article (1,500 words) | Webinar recording → AI draft | Published within 48hrs |
| 1 Newsletter edition | Article + curated content | Sent to all subscribers |
| 3 LinkedIn posts | Key insight, diagnostic tie-in, CTA | Day 1/3/7 after webinar |
| 1 Podcast segment (15-20 min) | Webinar excerpt + analysis | Next episode |
| 1 Roundtable discussion guide | Webinar themes | Next month's session |

**Total: 120 content assets/year from 24 webinars.**

### 5.2 Content Pillars (from G2.2)

1. **Three Forces Analysis** — Framework application to current events
2. **Diagnostic & Assessment** — What the data shows, methodology transparency
3. **Leaders in Motion** — Podcast excerpts, guest insights
4. **Forum & Events** — Session insights, announcements
5. **Point of View** — Direct opinion, short-form (100-150 words)

### 5.3 Nexus as Content Curator

Nexus uses the content library for RAG queries:
- User asks about industry trends → Nexus pulls from monthly articles + webinars
- User asks about leadership development → Nexus references relevant workshop content
- User asks about cross-border challenges → Nexus surfaces BRIDGE-related content

Content is personalized based on user's diagnostic insights and tier. **Nexus references content themes, never diagnostic product names.** ("There's been a lot of thinking this month about how governance structures are shifting" — not "This month features the BRIDGE diagnostic.")

---

## Part 6: Revenue Model — Combined Economics

### 6.1 B2C Revenue (DEX AI Platform)

| Tier | Annual Revenue/Member | Net Margin | Notes |
|---|---|---|---|
| Starter | ¥1,999 | 27% | |
| Growth | ¥4,999 | 24% | |
| Elite | ¥9,999 | 11% | Higher coaching cost |
| Corporate | ¥59,988 | 65% | Team pricing |

### 6.2 B2B Revenue (LYC Flywheel)

| Stream | Unit Price | Volume/Year | Annual Revenue |
|---|---|---|---|
| Diagnostics | $500-1,500 | ~200 | $100K-300K |
| Roundtables | $500-800 | 24 × 20 pax | ~$166K |
| Workshops | $5K-15K | 20-30 | $100K-450K |
| Programmes | $15K-50K | 10-15 | $150K-750K |
| Council + Advisory | $5K-50K | 15-25 | $75K-1,250K |
| **Total B2B** | | | **$591K-2,916K** |

### 6.3 The Bridge Economics

- Council members from B2C: ~5-10/year (from Elite tier)
- Each Council member generates additional advisory/search revenue: ¥200K-500K
- Net contribution from 20 Council members: ¥2,750,000+ (conservative)

### 6.4 Blended Model

```
B2C subscriptions → Recurring base revenue + user pipeline
B2B flywheel → High-value project revenue + brand amplification
Council → Connection point + highest-value conversions
```

---

## Part 7: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-6)
- Nexus conversational interface + intent routing
- Working memory + episodic memory
- User context assembly (tier-gated)
- DeepSeek integration (Flash + Pro)
- Basic RAG over content library
- Assessment data integration (translated insights)

### Phase 2: Intelligence (Weeks 7-10)
- Semantic memory (user model)
- Proactive suggestion engine
- Peer matching algorithm
- Journey Intelligence dashboard
- Coaching pre/post-session orchestration
- **Recommendation engine** (flywheel service surfacing per §3.4)

### Phase 3: Ecosystem (Weeks 11-14)
- Event AI (seating algorithm, pre-briefs, post-summaries)
- Company intelligence integration
- Opportunity matching with fit scoring
- Content engine aligned to monthly rhythm
- B2B flywheel integration (CRM handoffs, lead tracking)

### Phase 4: Advanced (Post-launch)
- AI-assisted report narrative scaffolding (per C3.1 §6)
- Scenario modeling with historical outcomes
- Predictive career trajectory models
- Advanced peer network effects
- Invitation Council digital layer (Chatham House enforcement)

---

## Appendix: Notion Alignment Matrix

| Spec Section | Notion Asset | Asset ID | Status |
|---|---|---|---|
| Council Charter | Invitation Council — Membership Charter | E1.1 | ✅ Aligned |
| Council Invitation | Member Invitation Letter Template | E1.5 | ✅ Aligned |
| Council Roundtable | Roundtable Agenda Template | E1.4 | ✅ Aligned |
| Council Briefing | Annual Briefing Document | E1.6 | ✅ Aligned |
| Assessment Platform | Technical Specification | C3.1 | ✅ Aligned (v1/v2 phasing) |
| Assessment Logic | Scoring & Routing | G2.2/Diag Ops | ✅ Aligned |
| ICP Definition | ICP & Target Account Definition | A5.1 | ✅ Aligned |
| Content Calendar | LinkedIn Content Calendar | G2.2 | ✅ Aligned |
| 9 Diagnostics | Diagnostic Specifications | D1-D8 | ✅ Aligned |
| Flywheel | Kevin's Flywheel Document | — | ✅ Integrated |
| Nexus Scope Boundary | §1.7 (new in v3.1) | — | ✅ Defined |

---

*v3.1 changelog: Added §1.7 Nexus Scope Boundary (defines what Nexus builds vs recommends); Added §3.4 Recommendation Engine (technical implementation of boundary); Updated §4.1/§4.2/§4.3/§4.4/§5.3 to reference boundary rule; Bumped to v3.1.*

*This is the single source of truth for DEX AI product and business specification. All future development should reference this document.*
