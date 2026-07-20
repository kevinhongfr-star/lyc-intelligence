# DEX AI Spec v2.1 — Deep Dive: Council, Gamification & AI Architecture

**Version:** 1.0 | **Date:** 2026-07-20 | **Author:** NEXUS
**Companion to:** `CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md` v2.1
**Purpose:** Expand three sections from overview-level to implementation-ready detail.

---

## Part 1: The Council — Deep Dive

### 1.1 The Council Is Not a Feature. It's a Membership Identity.

The Council is the closest thing to a **private club for senior leaders in Asia** — powered by AI, not built around it. Members don't "use the Council." They **belong to** the Council. The AI (Nexus) is one of four pillars that make membership valuable.

**Analogy:** Soho House doesn't market itself as "a hotel with restaurants and coworking." It markets belonging. DEX AI's Council works the same way — the AI is the intelligence layer that makes every other benefit sharper.

### 1.2 The Four Pillars — Detailed Design

#### Pillar 1: AI Executive Advisory (Nexus, Council-Grade)

Council members get a **different tier of Nexus** than free users:

| Capability | Free Nexus | Council Nexus |
|---|---|---|
| **Context depth** | Last 10 conversations | Full history + assessment data + coaching notes + event attendance |
| **Market intelligence** | General career trends | Company-specific intel: org charts, leadership changes, hiring signals, M&A activity |
| **Benchmarking** | Industry averages | Peer-group exact comparisons: "Leaders at your level in APAC manufacturing earn ¥X-¥Y, with Z% equity" |
| **Opportunity matching** | General suggestions | Specific mandate matches with fit scores, board dynamics intel, reporting line analysis |
| **Proactive alerts** | None | "Your former colleague just became CHRO at Tencent. Your profiles overlap on 4/6 dimensions. Want an intro?" |
| **Compensation intel** | Public data only | Proprietary benchmark data from LYC's 20+ years of placement data |
| **Scenario modeling** | None | "If I take this role in Shenzhen vs. stay in Shanghai, here's the 3-year trajectory for each" |

**Council Nexus interaction example:**

```
Council Member: "I'm getting approached about a CFO role at a 
Series D fintech in Shanghai. Should I take it?"

Council Nexus:
1. Pulls user's full assessment profile (DRIVE, BRIDGE, MOSAIC scores)
2. Checks compensation database for comparable CFO roles in Shanghai fintech
3. Analyzes the specific company: funding stage, board composition, 
   leadership team profiles, recent leadership changes
4. Compares to user's current situation using career trajectory models
5. Checks user's coaching history for relevant development areas
6. Generates multi-scenario analysis:
   - Scenario A: Take the role → projected 3-year outcome
   - Scenario B: Stay → projected 3-year outcome  
   - Scenario C: Counter-offer from current employer → probability and terms
7. Surfaces risk factors: "This company's CFO turnover rate is 18 months average"
8. Offers next step: "Want me to prepare you for the conversation, 
   or would you like to discuss this with your coach first?"
```

**Key design principle:** Council Nexus NEVER says "I don't know." It says "Here's what I can tell you, here's my confidence level, and here's who can help you go deeper."

#### Pillar 2: 1-on-1 Coaching (AI-Orchestrated)

**The coaching matching algorithm:**

1. **Analyzes the member's profile:** assessment scores, stated goals, personality indicators, past coaching feedback
2. **Analyzes available coaches:** specialization, industry overlap, coaching style, availability, past success with similar profiles
3. **Generates ranked recommendation with reasoning**
4. **Pre-session orchestration:** AI generates coach pre-brief (2-3 page PDF), sends 24h before, preps member with specific reflection questions
5. **Post-session orchestration:** AI extracts key decisions, action items, emotional themes. Updates Nexus memory. Sets follow-up reminders.

**Coaching session types:**

| Session Type | Duration | Credits | AI Support Level |
|---|---|---|---|
| **Quick Check-in** | 30 min | 1 | Light pre-brief, brief post-summary |
| **Deep Strategy** | 60 min | 2 | Full pre-brief, action tracking, 2 follow-ups |
| **Transition Intensive** | 90 min | 3 | Full pre-brief + scenario modeling + 4 follow-ups |
| **Emergency Session** | 30 min | 1 (priority booking) | Minimal pre-brief, same-day booking |
| **Executive Coaching (Corporate)** | 60 min | 2 | Team context injected, org dynamics analysis |

#### Pillar 3: Exclusive Events (AI-Curated & AI-Enhanced)

| Event Type | Frequency | AI Before | AI During | AI After |
|---|---|---|---|---|
| **Roundtable** (8-12 peers) | Monthly | AI curates attendee list. Generates discussion brief per attendee. | AI captures insights. AI notes connection opportunities. | Personalized summary: "Here's what's relevant to YOUR situation." AI schedules follow-up intros. |
| **Workshop** (20-40 people) | Bi-monthly | AI assesses skill levels, customizes content depth. | AI facilitates breakout groups. | AI generates action plan per attendee. Nexus tracks completion. |
| **Networking Dinner** (12-20) | Monthly | AI creates seating plan. Generates conversation starters. | (Human-facilitated) | AI sends intro follow-ups and LinkedIn connection prompts. |
| **Webinar** (50-200) | Weekly | AI generates content based on trending topics. | Live Q&A with AI-curated questions. | Personalized highlights for non-attendees. |
| **Annual Summit** (100+) | Annual | AI creates entire agenda from member intelligence data. | AI facilitates sessions. Real-time polling. | Year-in-review per member. |

**The AI Seating Algorithm:** Optimizes for productive friction, complementary strengths, industry mix, and seniority diversity. Constraints: no same-company at same table, max 2 from same industry, at least 2 seniority levels per table.

**Event credit economy:**

| Action | Credits |
|---|---|
| Attend roundtable | 2 |
| Attend workshop | 1-2 |
| Attend networking dinner | 2 |
| Attend webinar | 0 (free — loss leader) |
| Attend annual summit | 5 |
| Request custom intro at event | 1 |
| Access event recording + AI summary | 0.5 |

#### Pillar 4: Peer Network (AI-Matched Connections)

**This is NOT LinkedIn.** The Council peer network is curated, not open. Nexus facilitates introductions based on genuine mutual benefit.

**Weekly "People You Should Know" digest:**
```
This week's matches for you:

1. James Liu — VP Operations, Automotive, Shenzhen
   Why: You're both navigating supply chain restructuring. 
   James solved a similar problem at BYD in 2024.
   Mutual value: You have APAC expansion experience he needs.
   [Request Introduction — 1 credit]

2. Maria Santos — CHRO, FMCG, Singapore
   Why: She's building a leadership development program. 
   Your DRIVE assessment shows you're strong in talent architecture.
   Mutual value: She has APAC HR network you could access.
   [Request Introduction — 1 credit]
```

**Introduction protocol:** Request (1 credit) → Nexus checks mutual benefit → Warm prompt to target → Both accept → Nexus generates conversation starter + schedules virtual coffee → Post-meeting feedback loop.

**Privacy controls:** Members control visibility (full / name+company only / anonymous) and contactability (open / via Nexus only / not contactable). Corporate members: team visible only to each other + Nexus. PE Partner: deal flow only visible to other PE Partners.

### 1.3 The Member Lifecycle

```
PROSPECT → Receives AI-personalized invitation
  ▼
ONBOARDING (14 Days)
  Day 1: Welcome video + Nexus orientation
  Day 2: Nexus deep-dive (goals, challenges, expectations)
  Day 3: First assessment (if not taken)
  Day 5: First "People You Should Know" digest
  Day 7: Invitation to first upcoming event
  Day 10: Complimentary coaching session ("test drive")
  Day 14: Check-in + guidance on maximizing membership
  ▼
ACTIVE MEMBER (Months 2-12)
  Daily Nexus interactions + Monthly coaching + Monthly events
  Quarterly briefing + Credit optimization + Mid-year review
  ▼
RENEWAL (Month 11-12)
  AI generates renewal brief: engagement summary, value delivered,
  ROI calculation, next year preview, upgrade suggestion
  ▼
ALUMNI / UPGRADE (Individual → Corporate → PE Partner)
```

### 1.4 Council Dashboard — Detailed Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  Good morning, David.                               [🔔 3] [⚙️]    │
│  Council Member since Jan 2026 | Individual Tier                     │
│  Credits: 7/12 remaining | Next reset: Aug 1                         │
│                                                                      │
│  ┌── NEXUS INSIGHT ──────────────────────────────────────────────┐  │
│  │  Based on your recent conversation about succession planning,  │  │
│  │  I've identified 3 peer members who've navigated similar       │  │
│  │  transitions. Want to see who?                                  │  │
│  │  [View Matches] [Not Now] [Tell Me More]                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── THIS MONTH ─────────────────────────────────────────────────┐  │
│  │  📅 Upcoming Events                                           │  │
│  │  Jul 25 — Roundtable: "Succession Planning in Family Business" │  │
│  │             (8 attendees, 2 credits) [RSVP] [Prep Brief]      │  │
│  │  Aug 3 — Networking Dinner: "APAC Tech Leaders"               │  │
│  │             (14 attendees, 2 credits) [RSVP] [Seating Plan]   │  │
│  │                                                                │  │
│  │  🎯 Coaching                                                   │  │
│  │  Next: Jul 28, 3:00 PM with Coach Li Wei                      │  │
│  │  Topic: "Navigating board relationship"                        │  │
│  │  [View Pre-Brief] [Reschedule] [Add Topic]                    │  │
│  │  Sessions used: 5/12                                           │  │
│  │                                                                │  │
│  │  👥 People You Should Know                                     │  │
│  │  [James Liu] VP Ops, Automotive — Supply chain match           │  │
│  │  [Maria Santos] CHRO, FMCG — Leadership development match     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── YOUR JOURNEY ───────────────────────────────────────────────┐  │
│  │  Assessment Snapshot:                                          │  │
│  │  Strategic Orientation     ████████░░  78%                     │  │
│  │  Cross-Border Adaptability ██████░░░░  62%                     │  │
│  │  Stakeholder Influence     █████████░  91%                     │  │
│  │  Execution Discipline      ███████░░░  73%                     │  │
│  │  Leadership Presence       ████████░░  84%                     │  │
│  │  Archetype: Strategic Architect                                │  │
│  │  [Full Profile] [Compare to Peers] [Retake]                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── TALK TO NEXUS ─────────────────────────────────────────────┐  │
│  │  [Start Conversation]                                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.5 Council Revenue Model & Unit Economics

| Metric | Founding | Individual | Corporate | PE Partner |
|---|---|---|---|---|
| Annual revenue/member | ¥2,800 | ¥3,800 | ¥12,000 | ¥25,000 |
| Coaching cost (full usage) | ¥3,600 | ¥3,600 | ¥14,400 | ¥30,000 |
| Event cost (allocated) | ¥1,200 | ¥1,200 | ¥4,800 | ¥10,000 |
| AI/Platform cost | ¥600 | ¥600 | ¥2,400 | ¥5,000 |
| **Gross margin** | **-¥2,600** | **-¥1,600** | **-¥9,600** | **-¥20,000** |

**Negative margins are by design.** The Council is a **loss leader for advisory and search.** Members who engage deeply generate advisory engagements (¥50K-500K) and search mandates (¥200K-800K).

**ROI from 100 members:**
- 15% → advisory = 15 × ¥150K avg = ¥2,250,000
- 5% → search = 5 × ¥400K avg = ¥2,000,000
- Total downstream: ¥4,250,000+
- Total delivery cost: ~¥1,500,000
- **Net contribution: ¥2,750,000+**

---

## Part 2: Gamification — Deep Dive

### 2.1 Design Philosophy

Gamification drives **the Companion Loop.** Every XP point, badge, and streak exists to get the user back into conversation with Nexus. Three psychological drivers:
1. **Self-discovery addiction** — Humans can't resist learning about themselves
2. **Progress visualization** — XP bars make abstract career development tangible
3. **Identity investment** — The more you use Nexus, the harder it is to leave

### 2.2 XP Earning Matrix

| Action | XP | Frequency Cap |
|---|---|---|
| Daily login | 5 | 1/day |
| Nexus conversation (5+ messages) | 15 | 3/day |
| Complete micro-assessment (3 questions) | 20 | 2/day |
| Complete full assessment | 100 | 1/week |
| Read AI-generated insight | 10 | 5/day |
| Save/bookmark insight | 5 | 10/day |
| Share insight (external) | 25 | 1/day |
| Attend coaching session | 50 | 4/month |
| Complete coaching action items | 30 | 5/week |
| Attend event (roundtable/dinner) | 75 | 4/month |
| Attend event (webinar) | 20 | 4/month |
| Make peer introduction | 40 | 2/week |
| Respond to peer introduction | 20 | 5/week |
| Weekly challenge completion | 50 | 1/week |
| Streak bonus (per day) | +5 × streak_days | 1/day |

**Caps:** Daily 200 XP max. Weekly 800 XP max. Same action within 1 hour = 0 XP. Conversations under 3 messages don't count.

### 2.3 Level System

| Level | Name | Cumulative XP | Unlock |
|---|---|---|---|
| 1 | **Explorer** | 0 | Basic Nexus access |
| 2 | **Navigator** | 200 | Assessment access, peer directory (view) |
| 3 | **Strategist** | 800 | Full assessment suite, coaching booking |
| 4 | **Architect** | 2,000 | Event access, peer introductions, custom reports |
| 5 | **Catalyst** | 4,000 | Priority event booking, advanced benchmarking |
| 6 | **Visionary** | 7,500 | Advisory program access, Nexus proactive mode |
| 7 | **Luminary** | 12,500 | Council invitation eligibility, founding perks |

### 2.4 Achievement System

**Self-Discovery:** Mirror (first assessment), True North (3 dimensions), Deep Dive (all 5), Data-Driven (10 profile checks), Evolution (retake shows growth), Multi-Dimensional (top 2 within 5%)

**Engagement:** On Fire (7-day streak), Unstoppable (30-day), Conversationalist (100 conversations), Scholar (50 insights), Follow-Through (10 action items), Early Bird / Night Owl

**Network:** Connector (5 intros), Networker (5 events), Council Voice (spoke at roundtable), Mentor (3 peers requested advice), Host (organized event)

**Career:** Launch (set goals), Growth (completed learning path), Breakthrough (landed role via Nexus — Legendary), Diamond (all categories), Legacy (1 year active)

### 2.5 Streak Mechanics

- Counts consecutive days of meaningful interaction (5+ msg conversation, assessment, coaching, event)
- Streak freezes: 1 free/month, earn more through achievements
- Streak recovery: If broken, "Come back" prompt with bonus XP
- Milestones: 7, 15, 30, 60, 90, 180, 365 days — each with unique badge + bonus XP
- Visual: 🔥 with day count, progress bar to next milestone

### 2.6 Weekly Challenges (AI-Generated, Personalized)

Generated by Nexus every Sunday 8 PM. Examples:
- "Have a career conversation about your 5-year plan" → 50 XP
- "Complete your Cross-Border adaptability assessment" → 75 XP
- "Book a coaching session this week" → 60 XP
- "Connect with 2 peers in your industry" → 40 XP
- "Attend this week's roundtable" → 75 XP

### 2.7 Social Proof — NO Public Leaderboard

Senior executives don't compete openly. Instead:

**Anonymous peer comparisons (Nexus-delivered):**
```
Leaders at your level (VP+, APAC Manufacturing) typically:
 - Check in with Nexus 2.3x per week → You: 3.1x (↑ above avg)
 - Take 1.4 assessments/quarter → You: 2 (↑ above avg)
 - Attend 1.2 events/month → You: 2.0 (↑ above avg)
 - Complete 2 coaching sessions/month → You: 1.5 (↓ below avg)

Suggestion: Consider booking a coaching session this week.
```

Small-group leaderboards available only for opt-in cohorts (workshops, challenges).

### 2.8 Notification Strategy

| Trigger | Channel | Timing | Cap |
|---|---|---|---|
| Streak at risk | Push | 6 PM | 1/day |
| Streak broken | Push + Email | 9 AM next day | 1/break |
| New peer match | In-app | 10 AM | 2/week |
| Event reminder | Push + Email | 24h + 1h before | 2/event |
| Coaching reminder | Push + Email | 24h + 2h before | 2/session |
| Weekly challenge | Push + Email | Sunday 8 PM | 1/week |
| Level up | In-app | Immediate | 1/level |
| Opportunity match | Push + In-app | Real-time | 3/week |
| Weekly briefing | Email | Sunday 8 PM | 1/week |

---

## Part 3: AI Architecture — Deep Dive

### 3.1 System Overview

```
USER INTERFACE (Chat, Dashboard, Assessment, Coaching, Events)
         │
         ▼
NEXUS ORCHESTRATION LAYER
  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐
  │   Intent      │  │   Context    │  │   Response            │
  │   Classifier  │→ │   Assembler  │→ │   Generator           │
  └──────────────┘  └──────────────┘  └───────────────────────┘
  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐
  │   Memory      │  │   Capability │  │   Proactive           │
  │   Manager     │  │   Router     │  │   Engine              │
  └──────────────┘  └──────────────┘  └───────────────────────┘
         │              │                  │
    DeepSeek API    Supabase DB      Notion + External
```

### 3.2 Intent Classification

| Intent | Examples | Routing |
|---|---|---|
| Career advice | "What should I do next?" | Career Advisory flow |
| Self-discovery | "What are my strengths?" | Assessment trigger |
| Benchmarking | "Am I paid fairly?" | Compensation + peer data |
| Opportunity | "Show me roles" | Mandate matching |
| Coaching | "I need to talk to someone" | Coaching booking |
| Market intel | "What's happening in [industry]?" | Market intelligence feed |
| Network | "Who should I know?" | Peer matching |
| Branding | "How should I position myself?" | Personal branding flow |
| Negotiation | "Is this offer fair?" | Comp analysis + strategy |
| Learning | "What skills do I need?" | Learning path generation |

**Multi-intent handling:** Classifier detects multiple intents, orchestrates priority order (most urgent first), handles time pressure flags.

### 3.3 Context Assembly — The Secret Sauce

Council tier determines context depth:

**Free user context:** Profile + basic assessments + last 10 conversations
**Council member context:** ALL of the above + full assessment history + coaching notes + event attendance + peer connections + proprietary benchmarks + company-specific intelligence + credit balance + membership tier data

Context assembly pipeline:
1. Load user profile (always)
2. Load membership context (if Council)
3. Load assessment data (if any taken)
4. Load conversation memory (last 10)
5. Load intent-specific data (compensation for benchmarking, mandates for opportunity, etc.)
6. Truncate to token budget (12K tokens max)

### 3.4 System Prompt Architecture (5 Layers)

**Layer 1 — Base Personality (always loaded):** "You are Nexus, a career and leadership AI companion for senior executives. Direct, data-driven, warm but not soft. You challenge when needed. You never say 'it depends' without explaining what it depends ON."

**Layer 2 — User Context (per user):** Name, seniority, company, industry, goals, challenges, archetype, scores, coaching focus. Council tier + credit balance if applicable.

**Layer 3 — Intent Instructions (per turn):** Specific behavioral instructions based on detected intent. E.g., benchmarking → always give ranges not single numbers, note data sources, offer coach escalation.

**Layer 4 — Council Behavior (Council members only):** Access to deeper data. Proactively reference events, peers, coaching, assessments. Help maximize membership value.

**Layer 5 — Safety (always loaded):** Never share user data cross-user. Never make definitive predictions. Never give legal/financial/medical advice. Always offer human escalation.

### 3.5 Memory System — Three-Tier Architecture

| Tier | What | Persistence | Example |
|---|---|---|---|
| **Working Memory** | Current conversation | Session only | "User asking about job offer" |
| **Episodic Memory** | Key events and decisions | Long-term | "User declined CFO role at Company X in March" |
| **Semantic Memory** | Evolving user model | Long-term, evolving | "User values work-life balance over title. Risk-averse." |

**How it builds:** After every conversation, AI extracts facts → Episodic storage. Patterns across episodes → Semantic Memory update. Working memory cleared.

**Database tables:**
- `nexus_episodic_memory`: event_type, summary, details (JSONB), emotional_valence, related_topics
- `nexus_semantic_memory`: belief_category, belief, confidence (0-1), evidence_count, last_updated

### 3.6 Proactive Suggestion Engine

| Trigger | Suggestion | Timing |
|---|---|---|
| Declining assessment dimension | "Your [dimension] shifted. Explore what changed?" | Weekly |
| Upcoming matching event | "Roundtable on [topic] next week. 3 peers attending." | 5 days before |
| Coaching action item overdue | "You committed to [X]. How's that going?" | 3 days after |
| New mandate 87%+ fit | "New opportunity: [Role] at [Company]. Want details?" | Real-time |
| Peer role change | "[Name] moved to [Role]. Worth reaching out." | Real-time |
| No engagement 7 days | "Here's what's new in your market..." | Day 7 |
| Streak about to break | "Quick check-in? Just 2 minutes." | 6 PM day 6 |
| Council credits running low | "3 credits left. Want to maximize them?" | 5 days before reset |

**Priority algorithm:** Relevance to goals (30%) + Time sensitivity (20%) + Historical acceptance rate (20%) + Value density (15%) + Credit cost inverse (10%) + Recency bonus (5%)

### 3.7 Multi-Model Routing (DeepSeek)

| Task | Model | Latency Budget |
|---|---|---|
| Intent classification | flash | < 500ms |
| Context assembly | flash | < 1s |
| General conversation | flash | < 2s |
| Assessment scoring | pro | < 5s |
| Narrative report generation | pro | < 10s |
| Career strategy analysis | pro | < 8s |
| Coach pre-brief | pro | < 5s |
| Peer matching rationale | flash | < 2s |
| Market intelligence summary | pro | < 8s |
| Proactive suggestions | flash | < 1s |

**Fallback:** Primary → timeout → retry → degrade to flash → cached/templated response

### 3.8 RAG Architecture

| Query Type | Source | Method |
|---|---|---|
| Market trends | Notion content + web search | RAG over 100 assets |
| Company intel | Supabase + web | Structured + real-time |
| Compensation | Supabase compensation_data | Direct query |
| Industry news | Web search | Real-time |
| LYC methodology | Notion advisory/playbook | RAG |
| Peer insights | Supabase peer_analytics | Aggregated, anonymized |

---

## Implementation Priority

1. **AI Architecture (Part 3) → Build first.** Context engine + memory + intent routing = foundation.
2. **Council Experience (Part 1) → Build second.** Highest revenue. Once AI supports Council-grade Nexus, build member experience.
3. **Gamification (Part 2) → Build third.** Amplifies engagement but only works if core experience is already valuable.

---

**End of Deep Dive. Companion to `CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md` v2.1.**
