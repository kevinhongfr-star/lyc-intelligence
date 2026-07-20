# LYC Intelligence — Content Integration, AI Layer & Experience Design Spec

**Version:** 2.1 | **Date:** 2026-07-20 | **Author:** NEXUS  
**Status:** For Kevin Review  
**Supersedes:** v1.0, v2.0 (corrected: Nexus-first framing)

---

## Executive Summary

**DEX AI IS Nexus.** Not a platform that "has" AI — the product itself is an AI companion for senior leaders' careers and leadership journeys.

### The Core Insight

Nexus is a **career & leadership AI advisor** — the user's always-on companion for:
- Career planning, strategy, and mapping
- Job search guidance and interview preparation
- Benchmarking against peer groups and market
- Professional branding and thought leadership
- Upskilling strategy
- Coaching, mentorship, and leadership development
- Executive decision support

**Assessment is NOT the product.** It's one entry point that feeds Nexus intelligence about the user. LYC frameworks (SHIFT, DRIVE, BRIDGE, etc.) are **invisible to users** — they power the engine behind the scenes, but the user never sees framework names. They experience Nexus.

**The real moat is the ecosystem:**
- Specialized AI behavior (trained on LYC's executive intelligence)
- Live coaching sessions (human coaches, AI-briefed)
- Webinars, roundtables, workshops
- Content library (market intelligence, career insights)
- Professional network (The Council — curated C-suite community)

### Product Architecture

```
                    ┌──────────────────────────┐
                    │     NEXUS (DEX AI)        │
                    │  Career & Leadership       │
                    │  AI Companion              │
                    │                            │
                    │  "What should I do next     │
                    │   in my career?"            │
                    │  "How do I prepare for      │
                    │   this board role?"         │
                    │  "Am I being paid fairly?"   │
                    │  "Who should I know?"        │
                    └──────────┬───────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
     │   THE LAYERS   │ │  THE MOAT   │ │  THE BUSINESS │
     │                │ │             │ │               │
     │ Forum (open)   │ │ Coaching    │ │ Credit packs  │
     │ Assessments    │ │ Events      │ │ Council tiers │
     │ Advisory       │ │ Network     │ │ Advisory fees │
     │ Search         │ │ Content     │ │ Search fees   │
     │ Council        │ │ Intelligence│ │               │
     └───────────────┘ └─────────────┘ └───────────────┘
```

**Users don't navigate "layers" or "portals."** They talk to Nexus, and Nexus gives them what they need — drawing from assessments, coaching, network, content, and market intelligence as appropriate.

### The 5 Engagement Layers (Backend, Not User-Facing)

These are how LYC monetizes and delivers value — not how users experience the product:

| Layer | What It Does | What Users Experience |
|---|---|---|
| **Forum** | Open content, lead magnet | "I found this free career insight tool" |
| **Assessments** | Data collection, self-awareness | "Nexus helped me understand my strengths" (never "I took SHIFT") |
| **Advisory** | Consulting engagement delivery | "My coach and I worked through this together" |
| **Search** | Executive placement | "Nexus found me an opportunity that's a great fit" |
| **Council** | Premium membership community | "I'm a member of an exclusive leadership community" |

---

## 1. The User Experience — Through Nexus, Not Through "Portals"

### 1.1 What the User Actually Experiences

A senior leader arrives at DEX AI. They don't see layers, portals, or frameworks. They see:

**Nexus.** A conversational AI that knows the executive world, understands career complexity, and gets smarter about them over time.

```
USER: "I'm thinking about making a move. I've been VP of Sales for 4 years, 
       but I want to be a GM or CEO. Where should I look?"

NEXUS: [Draws on: user's assessment data + market intelligence + 
        peer benchmarking + career trajectory models]

       "Based on your background and where you want to go, there are 
        three paths worth considering:
        
        1. CEO of a Series B-C startup (12-18 months to readiness)
        2. GM of a business unit in a larger org (6-12 months)
        3. COO-to-CEO succession play (18-24 months)
        
        Your biggest gap across all three: P&L ownership at scale.
        
        Want me to show you specific opportunities, or would you 
        rather work on closing that gap first?"
```

**The user never sees:** SHIFT, DRIVE, BRIDGE, MOSAIC, TRIDENT, scoring dimensions, question banks, report templates, or any framework name.

**The user always sees:** Personalized, actionable career intelligence that draws from all of LYC's capabilities.

### 1.2 How Nexus Gets Smarter About Each User

Nexus builds a living profile of each user through multiple touchpoints — all invisible:

| Touchpoint | What Nexus Learns | User Experience |
|---|---|---|
| **Conversational interaction** | Career goals, concerns, decision patterns, seniority, industry | "Nexus remembers what I told it last time" |
| **Assessment completion** | Leadership style, strengths, gaps, cross-border adaptability, motivation | "Nexus gave me a deeper understanding of myself" |
| **Coaching sessions** | Development areas, progress, behavioral patterns (AI pre-briefs coach) | "My coach already knew what we'd been working on" |
| **Content consumption** | What they read, what topics interest them, what they save/share | "Nexus keeps surfacing relevant stuff" |
| **Event attendance** | Network interests, peer engagement, industry focus | "The people I met at the roundtable were exactly who I needed to know" |
| **Opportunity exploration** | What roles they consider, what they decline, what matters in decisions | "Nexus knows what I'm looking for better than I do" |
| **Market data** | Industry trends, compensation benchmarks, hiring patterns | "Nexus knows what's happening in my market" |

### 1.3 The Companion Loop (Why It's Addictive)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   User asks Nexus something                           │
│         │                                            │
│         ▼                                            │
│   Nexus responds with personalized intelligence       │
│         │                                            │
│         ▼                                            │
│   User acts on it (takes step, attends event,         │
│   meets someone, completes assessment)                │
│         │                                            │
│         ▼                                            │
│   Nexus records the outcome, updates its model        │
│         │                                            │
│         ▼                                            │
│   Next interaction is EVEN MORE personalized          │
│         │                                            │
│         ▼                                            │
│   User thinks: "How does it know me so well?"        │
│         │                                            │
│         ▼                                            │
│   User comes back. Every day. Because Nexus           │
│   is the only thing that truly understands            │
│   their career situation.                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 1.4 Nexus Capabilities (What Users Can Do)

Not "portals" or "pages" — these are capabilities Nexus offers:

| Capability | What It Does | How It's Triggered |
|---|---|---|
| **Career Advisory** | Job search, career mapping, next-step planning | "Where should I go next?" |
| **Interview Prep** | Role-specific prep, mock interviews, feedback | "I have an interview at [Company]" |
| **Self-Discovery** | Understand strengths, gaps, leadership style | "Help me understand where I stand" (triggers assessment) |
| **Benchmarking** | Compare to peers, market rates, career trajectories | "Am I being paid fairly?" / "How do I compare?" |
| **Coaching Access** | Book and prepare for sessions with human coaches | "I want to talk to someone" |
| **Network** | Discover and connect with relevant peers | "Who should I know?" |
| **Market Intelligence** | Industry trends, hiring patterns, opportunity alerts | "What's happening in my market?" |
| **Personal Branding** | LinkedIn strategy, thought leadership, executive presence | "How do I position myself for the next level?" |
| **Compensation** | Market benchmarks, negotiation strategy, offer evaluation | "Is this offer fair?" |
| **Learning Path** | Upskilling recommendations, resource curation | "What skills do I need to develop?" |
| **Opportunity Matching** | AI-matched roles based on full profile + preferences | "Show me what's out there" |

### 1.5 Forum — The Open Door (Layer 1)

**What users experience:** Free, high-value content that introduces them to Nexus.

- Landing page: "Know where you stand. Know where to go." — one CTA: talk to Nexus.
- Free archetype quiz (60 seconds) → "You're a Strategic Architect. Want to go deeper?" → email capture.
- Webinar content, articles, market insights — all with "Ask Nexus about this" buttons.
- Lead capture sequences that nurture toward deeper engagement.

**Content from Notion (17 Forum assets) → integration targets:**

| Notion Asset | Where It Goes |
|---|---|
| Home Page Copy | Public landing page |
| Executive Forum Landing Page Copy | Events/webinar section |
| Webinar Graphics | Event cards |
| About Kevin / LYC Page Copy | About section |
| Privacy Policy & Terms | Legal pages |
| 6 Email Sequences | Nurture automation |
| Website Technical Setup | SEO infrastructure |

**Key:** Every piece of Forum content ends with the same CTA: **"Talk to Nexus."** Not "take an assessment." Not "sign up." The conversion point is always the AI companion.

### 1.6 Self-Discovery — How Nexus Learns About You (Layer 2)

**What users experience:** "Nexus asked me some questions and gave me insights about myself." They never know they "took SHIFT."

The 13 diagnostic instruments run behind the scenes, feeding Nexus's model of the user:

| User Says | Nexus Does (Behind the Scenes) |
|---|---|
| "Help me understand my leadership style" | Runs BRIDGE-style assessment → feeds leadership style model |
| "Am I ready for a bigger role?" | Runs DRIVE-style assessment → feeds readiness model |
| "How do I handle pressure?" | Runs TRIDENT-style questions → feeds decision-making model |
| "Can I lead across cultures?" | Runs MOSAIC-style questions → feeds cross-border model |
| "What motivates me?" | Runs IMPACT-style questions → feeds motivation model |
| "Show me my full profile" | Aggregates all assessment data → visual profile |

**Assessment is a conversation, not a test.** Nexus weaves questions naturally into dialogue. After 3-4 exchanges, the user has already provided assessment data without feeling like they're filling out a form.

For deeper dives, Nexus can offer: "I'd like to spend 15 minutes going deeper on this. The insights will be really valuable for your situation. Shall we?" — and only then presents a structured assessment flow.

### 1.7 Coaching — Where AI Meets Human (Part of the Ecosystem)

**What users experience:** "I have a coach who really understands my situation, because Nexus briefs them before every session."

- AI matches user to the right coach based on profile, goals, and personality
- Before each session: AI generates a pre-brief for the coach (assessment data, recent conversations, progress, suggested focus areas)
- After each session: AI summarizes key points, tracks action items, updates the user's profile
- Between sessions: Nexus follows up on commitments ("Last session you committed to reaching out to your board chair. How did that go?")

**Current coaching system (9 pages) already has the right structure:**
- CoachingEngagementPage → engagement metrics + activity tracking
- CoachingCoachPage → coach dashboard with session history
- CoachingCreditsPage → credit balance + plan tiers
- CoachingIntelligencePage → AI-generated insights
- CoachingGrowthPage → development tracking

### 1.8 Advisory — Nexus Connects You to Experts (Layer 3)

**What users experience:** "Nexus told me this was a pattern, and connected me with someone who could help."

- Nexus identifies patterns from assessment + conversation data
- When appropriate: "This is actually a common challenge for leaders in your position. We have an advisory program specifically for this. Would you like to explore it?"
- Advisory proposals are generated from templates but personalized by AI
- During advisory: Nexus supports the engagement with session summaries, progress tracking, and between-session insights

**Content from Notion (14 Advisory assets) → powers AI recommendation engine:**
- Force 1/2/3 service menus → AI knows when to recommend which
- Proposal templates → AI generates personalized proposals
- Delivery handbook → AI guides consultants
- Case studies → AI surfaces relevant examples

### 1.9 Search — Nexus Finds Your Next Role (Layer 4)

**What users experience:** "Nexus knows what I'm looking for and surfaces opportunities that are actually a good fit."

- Nexus maintains a living model of what the user wants (not just "open to opportunities" but specific criteria)
- When a matching mandate appears: "There's a new opportunity that matches your profile. GM role, Shanghai, $500K+, reporting to CEO. 87% fit. Want the details?"
- User can express interest through Nexus: "Interested, but I'd need to understand the board dynamics better."
- Nexus generates interview prep briefs tailored to the specific role + company
- Throughout the process: Nexus is the single point of contact. No portals, no forms, no pipeline views. Just conversation.

**Content from Notion (6 Search assets) → powers matching engine:**
- Mandate brief template → AI parses requirements
- Candidate assessment framework → AI matches user profile to requirements
- Progress report template → AI generates updates for both candidate and client

---

### Layer 5: The Council — Inner Circle Premium Membership

**Purpose:** The pinnacle of the LYC ecosystem. A curated, paid membership community offering continuous access to AI intelligence, executive coaching, exclusive events, and a peer network of senior leaders.

**This is NOT just a "portal." The Council is a membership experience — think Soho House meets McKinsey Alumni Network meets AI-powered career OS.**

**Four Pillars:**

| Pillar | What It Delivers | AI Integration |
|---|---|---|
| **AI Executive Advisory** | On-demand career, compensation, and market intelligence | Nexus chat with Council-member context, deeper data access, benchmark queries |
| **1-on-1 Coaching** | Senior LYC coaches on-demand. Strategy, transitions, negotiation. | AI matches coach to member based on assessment profile. AI pre-briefs coach. AI tracks progress across sessions. |
| **Exclusive Events** | Workshops, roundtables, networking dinners | AI curates event recommendations. Pre-event briefings. Post-event summaries. AI-facilitated introductions. |
| **Peer Network** | Curated directory of C-suite professionals | AI-powered matching. "People you should know." Anonymized peer benchmarks. |

**Membership Tiers:**

| Tier | Price | Credits/yr | Coaching Sessions | Key Differentiator |
|---|---|---|---|---|
| **Founding** | ¥2,800 | 12 | 12 | Legacy badge, priority booking, locked rate |
| **Individual** | ¥3,800 | 12 | 12 | Standard membership, monthly newsletter |
| **Corporate** | ¥12,000 | 48 | 48 | 5 seats, team intelligence reports |
| **PE Partner** | ¥25,000 | 100 | 100 | Deal flow access, priority matching |

**Credit Economy:**

Credits are the Council's internal currency. Every valuable interaction costs credits:
- Assessment: 1-3 credits depending on depth
- Coaching session: 1 credit
- Event attendance: 1-2 credits
- AI advisory chat (beyond basic): 1 credit per deep session
- Custom report generation: 1-2 credits

This creates a **usage-aware experience** where members are conscious of their engagement and the platform actively helps them maximize value.

**Content Integration Plan:**

| Notion Asset | Integration Target | Action |
|---|---|---|
| Membership Charter | Council onboarding flow | Auto-generate personalized welcome pack from charter |
| Member Invitation Letter | Recruitment flow | AI-personalize invitation letters based on prospect profile |
| Inaugural Cohort List | Member directory seed data | Import as founding members |
| Directory Protocol | CouncilDirectoryPage | Implement directory with privacy controls per protocol |
| Annual Briefing Document | CouncilBriefingPage | AI-personalize for each member's industry/role |
| Roundtable Agenda Template | Event management | Auto-generate agendas based on attendee profiles |

**Council Dashboard — The Member's Command Center:**

```
┌─────────────────────────────────────────────────────────────┐
│  Good morning, [Name].                                       │
│  You have 8 Council Credits remaining. Next reset: Mar 1.    │
│                                                              │
│  ┌── YOUR WEEK ──────────────────────────────────────────┐  │
│  │  📊 Assessment Insight                                  │  │
│  │  "Your DRIVE motivation profile shifted 8% toward       │  │
│  │   Impact Orientation since last quarter."               │  │
│  │  [Explore What Changed] [Compare to Peers]              │  │
│  │                                                         │  │
│  │  🎯 Recommended Action                                   │  │
│  │  "Based on your trajectory, consider the SHIFT-COACH    │  │
│  │   diagnostic to align your coaching plan."              │  │
│  │  [Start SHIFT-COACH — 2 credits]                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── UPCOMING ───────────────────────────────────────────┐  │
│  │  🗓️ Roundtable: "AI & Leadership" — Jan 25, Shanghai    │  │
│  │     14 attendees | 3 people you should meet              │  │
│  │     [RSVP — 2 credits] [See Attendee Brief]              │  │
│  │                                                         │  │
│  │  🧑‍🏫 Next Coaching Session — Jan 22, 14:00               │  │
│  │     Coach: Michael Tan | Topic: Board Readiness          │  │
│  │     [Pre-Session Brief] [Reschedule]                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── NETWORK PULSE ──────────────────────────────────────┐  │
│  │  🔗 Suggested Connection                                 │  │
│  │  "Sarah Chen (VP Strategy, Fortune 500 Tech) shares     │  │
│  │   your interest in APAC expansion. Your BRIDGE styles    │  │
│  │   are complementary."                                   │  │
│  │  [Request Introduction]                                  │  │
│  │                                                         │  │
│  │  📈 Peer Benchmark                                       │  │
│  │  "Your QUEST (Strategic Thinking) score is in the        │  │
│  │   top 15% of Council members in Technology sector."      │  │
│  │  [View Full Comparison]                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── NEXUS AI ───────────────────────────────────────────┐  │
│  │  💬 Ask Nexus anything about your career, market,       │  │
│  │     compensation, or leadership.                        │  │
│  │  [Start Conversation]                                   │  │
│  │                                                         │  │
│  │  📰 Your Personalized Briefing                          │  │
│  │  "3 developments in APAC executive compensation this    │  │
│  │   week that affect your situation."                     │  │
│  │  [Read Briefing]                                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Council Experience Design — What Makes It Addictive:**

1. **The "Sunday Evening Briefing"** — Every Sunday at 8pm, AI generates a personalized weekly briefing: market moves, peer activity, upcoming events, recommended actions. Members start their week with DEX AI.

2. **"Your Network Said..."** — Aggregated, anonymized insights from peer interactions. "62% of Council members in your sector are prioritizing AI transformation this quarter." Creates FOMO and relevance.

3. **Coaching Continuity** — AI remembers every coaching session. Before each session, it generates a pre-brief for the coach: "Last session focused on board readiness. Member has since completed QUEST assessment showing 15% improvement in strategic thinking. Suggested focus: actual board opportunity at [Company]."

4. **Event Intelligence** — Before any event, AI generates a "who's attending" brief with conversation starters based on complementary profiles. After the event, AI sends a follow-up: "You met 3 people. Here's what they discussed. Suggested follow-up actions."

5. **The "Council Credit" Game** — Credits create scarcity and intentionality. Members think: "Should I spend 2 credits on this event or save for the SHIFT-COACH assessment?" This makes every interaction feel valuable.

6. **Tier Progression** — Visible path from Individual → Corporate → PE Partner. "Upgrade to Corporate and give your leadership team the same intelligence." Gamified upgrade prompts.

7. **Founding Member Exclusivity** — "You are 1 of 8 Founding Members. Your legacy badge is permanent." Creates identity and loyalty.

---

## 2. The AI Layer — Nexus as Universal Intelligence

### 2.1 Nexus Persona Calibration (Current + Enhanced)

Current system already calibrates by seniority (c_suite / vp / director). Enhanced version adds:

| Context Dimension | Effect on Nexus Behavior |
|---|---|
| **Portal** (Candidate/Client/Council) | Changes knowledge scope, data access, tone |
| **Seniority** (C-suite/VP/Director) | Changes vocabulary, depth, strategic vs. tactical |
| **Membership Tier** (Founding/Individual/Corporate/PE) | Changes data depth, exclusivity of insights |
| **Assessment History** | Informs recommendations, avoids repeating insights |
| **Career Situation** (seeking/transitioning/building) | Changes focus of advice |
| **Engagement History** | Tracks what's been discussed, avoids redundancy |

### 2.2 Nexus Commands by Portal

| Command | Candidate | Client | Council | Internal |
|---|---|---|---|---|
| `chat` | Career coaching, interview prep | Mandate Q&A, market questions | Career strategy, peer insights, market intelligence | Task delegation, status queries |
| `assess` | Take diagnostics | Commission team assessments | Advanced diagnostics (SHIFT-COACH, TRIDENT) | Process audits |
| `report` | Personal development narrative | Candidate evaluation, market map | Peer comparison, network insight brief | Search progress, quality report |
| `brief` | Industry/role insights | APAC talent trends, comp data | Quarterly intelligence, sector analysis | Daily ops summary |
| `coach` | Interview simulation | N/A | Pre-session prep, post-session reflection | N/A |
| `analyze` | Skill gap analysis | Pipeline analytics, hiring forecast | Network health, influence map, peer benchmarking | Revenue analytics, utilization |
| `connect` | N/A | Introduce to candidate | Request member introduction | Connect to external expert |

### 2.3 AI Data Flow — How Nexus Gets Smarter Over Time

```
User Interaction
    │
    ├── Assessment → Scores, archetype, dimensions
    ├── Chat → Topics of interest, concerns, goals
    ├── Event attendance → Interests, network patterns
    ├── Coaching sessions → Development areas, progress
    ├── Content consumption → What they read, share, save
    ├── Search behavior → What opportunities they explore
    │
    ▼
AI Context Engine (updated continuously)
    │
    ├── User Profile Enrichment
    │   ├── Career trajectory model
    │   ├── Leadership archetype evolution
    │   ├── Network position analysis
    │   └── Engagement pattern recognition
    │
    ├── Personalization Layer
    │   ├── Content recommendations
    │   ├── Event suggestions
    │   ├── Connection matching
    │   ├── Opportunity alerts
    │   └── Coaching topic suggestions
    │
    └── Platform Intelligence
        ├── Aggregate trend detection
        ├── Market signal extraction
        ├── Cohort analysis
        └── Predictive engagement modeling
```

---

## 3. User Experience Design Principles

### 3.1 Core Rules — "Nothing Static"

1. **Every number is live.** Don't show "2,500 members" as hardcoded text. Show it as a real counter that updates.
2. **Every card is clickable.** No decorative elements. Every card either expands, navigates, or triggers an action.
3. **Every list has a CTA.** Empty states say "Take your first assessment" not "No data yet."
4. **Every page has an AI touchpoint.** Nexus chat button always visible. Context-aware suggestions on every page.
5. **Every action has feedback.** Micro-animations, sound (optional), haptic (mobile). Completion feels good.

### 3.2 Gamification System

**XP Economy:**

| Action | XP | Tier Relevance |
|---|---|---|
| Complete micro-assessment (3-5 questions) | 25 | All |
| Complete standard assessment (20-40 questions) | 100-300 | All |
| Complete composite assessment (SHIFT) | 500 | All |
| Read AI briefing | 50 | All |
| Attend event | 150 | Council |
| Complete coaching session | 200 | Council |
| Make peer connection | 75 | Council |
| Share insight to network | 50 | Council |
| Daily login streak | 10/day | All |
| Profile completion milestones | 100/250/500 | All |

**Level System:**

Candidate Levels:
- **Explorer** (0-500 XP) → "You're discovering your leadership profile"
- **Navigator** (500-2,000) → "You're charting your career trajectory"
- **Strategist** (2,000-5,000) → "You're building executive presence"
- **Executive Ready** (5,000+) → "You're positioned for the next level"

Council Levels:
- **Member** (0-1,000) → New member, exploring
- **Engaged** (1,000-3,000) → Active participant
- **Contributor** (3,000-7,000) → Shares insights, mentors others
- **Influencer** (7,000-15,000) → Network hub, thought leader
- **Thought Leader** (15,000+) → Recognized voice in the community

**Visual Progress Indicators:**
- Circular progress ring on dashboard (fills as XP grows)
- Level badge next to name (color-coded: bronze → silver → gold → platinum → diamond)
- Subtle UI upgrades at higher levels (profile border colors, icon treatments)
- Annual "Year in Review" — personalized data visualization of engagement

### 3.3 Micro-Interactions That Drive Retention

| Interaction | Design | Psychological Trigger |
|---|---|---|
| **Assessment score reveal** | One dimension at a time, gauge fills with animation, 800ms delay between reveals | Anticipation, variable reward |
| **Archetype reveal** | Full-screen takeover with archetype name, visual treatment changes, shareable card auto-generated | Identity, social proof |
| **Nexus typing indicator** | "Nexus is analyzing your situation..." with pulsing dots | Engagement, perceived intelligence |
| **Credit deduction** | Satisfying animation: credit counter ticks down, subtle sound | Scarcity awareness, value perception |
| **Peer activity notification** | "Sarah Chen just completed BRIDGE" with their archetype badge | Social proof, competitive instinct |
| **Streak counter** | Fire emoji 🔥 with day count, streak freeze option | Loss aversion, habit formation |
| **Level up animation** | Full-screen celebration, confetti, new badge reveal | Achievement, status |
| **Weekly briefing delivery** | Sunday 8pm push notification with preview card | Anticipation, routine building |
| **"People like you" cards** | "78% of VP-level tech leaders in APAC chose this path" | Social validation, FOMO |
| **Opportunity match alert** | "New role match: 87% fit based on your DRIVE profile" | Exclusivity, urgency |

### 3.4 Mobile-First Interaction Patterns

- **Swipeable insight cards** (Tinder-style): Right = save/bookmark, Left = skip, Up = deep dive
- **Voice-to-Nexus**: Hold mic button → ask Nexus anything → get voice response
- **Quick assessment mode**: 3-question pulse check, completable in 60 seconds while waiting for coffee
- **Event check-in**: QR code scan → automatic credit deduction → post-event AI summary
- **One-thumb navigation**: All primary actions reachable with thumb in bottom third of screen

---

## 4. Cross-Portal Integration Flows

### 4.1 The Leader Journey (Forum → Council)

```
VISITOR (Forum)
  │  Lands on B2CLanding.tsx
  │  "Know where you stand. Know where to go."
  │
  ├──→ Takes 60-second archetype quiz (Layer 1 engagement)
  │    Result: "You're a Strategic Architect"
  │    CTA: "Get your full profile — take the DRIVE assessment"
  │
  ▼
LEAD (Captured)
  │  Email captured. Nexus can now send personalized content.
  │  Diagnostic Prospect Sequence triggers (Day 1, 3, 7, 14)
  │
  ├──→ Takes DRIVE assessment (Layer 2)
  │    AI generates narrative report
  │    CTA: "Book a debrief session to explore your results"
  │
  ▼
ENGAGED USER (Assessment)
  │  Profile is now rich. Nexus knows their archetype, goals, gaps.
  │  AI starts surfacing relevant opportunities and content.
  │
  ├──→ Takes MOSAIC + BRIDGE (deeper self-knowledge)
  │    AI: "Your profile suggests you'd benefit from strategic advisory"
  │    CTA: "Explore our Partnership Deficit advisory program"
  │
  ├──→ OR: AI: "You match 3 open mandates. Want to see them?"
  │    CTA: Enter candidate pipeline (Layer 4)
  │
  ▼
COUNCIL MEMBER (Layer 5)
  │  Invited (or applies) to Council membership
  │  All assessment data flows into Council context
  │  AI now has full picture: assessments + coaching + network + events
  │
  ├──→ Takes SHIFT-COACH → coaching plan auto-generated
  ├──→ Attends roundtable → AI-facilitated connections
  ├──→ Gets quarterly briefing → personalized to their trajectory
  ├──→ Uses Nexus daily → AI gets smarter → recommendations improve
  │
  └──→ UPGRADE: Individual → Corporate → PE Partner
       "Your team could benefit from the same intelligence"
```

### 4.2 Client Journey (B2B)

```
CLIENT (Prospect)
  │  Sees LYC case study or referral
  │
  ├──→ B2BLanding → "AI-Powered Talent Intelligence"
  │    CTA: "See what AI can tell you about your talent gaps"
  │
  ▼
CLIENT (Engaged)
  │  Takes Force Exposure Assessment (organizational diagnostic)
  │  AI generates organizational health report
  │
  ├──→ AI: "Your organization shows a Force 2 pattern (Partnership Deficit)"
  │    CTA: "Explore our advisory program"
  │
  ├──→ OR: AI: "We have 3 candidates matching your VP Operations mandate"
  │    CTA: "Start a search"
  │
  ▼
CLIENT (Active)
  │  Active mandate(s) in system
  │  Real-time pipeline visibility
  │  AI-generated weekly reports
  │
  └──→ EXPAND: Search → Advisory → Retainer
       "Based on your search results, we recommend..."
```

---

## 5. Implementation Priority (Revised)

### Phase 1: Assessment Engine + Content Loading (Week 1-2)
**Priority: P0 — This is the foundation everything else builds on.**

- [ ] Load 14 question banks → `assessment_questions` table
- [ ] Load 7 report templates → `report_templates` table  
- [ ] Wire AI scoring (DeepSeek) to assessment completion
- [ ] Build narrative report generation pipeline
- [ ] Connect assessment results → Nexus context (so Nexus knows your scores)
- [ ] Test end-to-end: User takes DRIVE → AI scores → narrative report → Nexus can reference it

### Phase 2: Council Portal — From Static to Living (Week 2-3)
**Priority: P0 — Highest revenue impact. Current pages are 100% static.**

- [ ] CouncilDashboardPage: Replace hardcoded stats with real data
- [ ] CouncilDirectoryPage: Build searchable directory with AI matching
- [ ] CouncilCommunityPage: Real activity feed from Supabase
- [ ] CouncilCoachingPage: Real coach matching + session booking
- [ ] CouncilBriefingPage: AI-personalized briefing from Notion briefing doc
- [ ] CouncilProfilePage: Assessment integration + XP/level display
- [ ] Credit system: Real credit tracking, consumption, monthly reset
- [ ] Stripe integration for membership tiers

### Phase 3: Nexus Context Engine (Week 3-4)
**Priority: P0 — Makes AI personal across all portals.**

- [ ] Build context aggregation service (pull assessment + activity + profile data)
- [ ] Enhance chatHandler.ts to accept and use rich context
- [ ] Portal-specific Nexus persona variants (career coach / strategic advisor / peer connector)
- [ ] Memory system: Nexus remembers cross-session context
- [ ] Proactive suggestion engine: "Based on your [X], you might want to [Y]"

### Phase 4: AI Report Studio (Week 4-5)
**Priority: P1 — High value but depends on Phase 1.**

- [ ] Build report generation API (context → prompt → DeepSeek → formatted output)
- [ ] Candidate reports: career narrative, development plan, opportunity match
- [ ] Client reports: candidate evaluation, market map, pipeline analysis
- [ ] Council reports: peer comparison, network insight, quarterly briefing
- [ ] PDF export with LYC branding
- [ ] "Ask Nexus about this report" interactive follow-up

### Phase 5: Gamification & Engagement Layer (Week 5-6)
**Priority: P1 — Retention multiplier.**

- [ ] XP tracking system (database + API + frontend)
- [ ] Level system with visual badges
- [ ] Daily insight + streak counter
- [ ] Achievement/unlockable system
- [ ] Weekly challenges
- [ ] Social proof notifications ("X people took this assessment today")

### Phase 6: Email & Automation (Week 6-7)
**Priority: P1 — Nurtures the funnel.**

- [ ] Load 13 email sequences → automation engine
- [ ] Trigger mapping: assessment complete → diagnostic onboarding sequence
- [ ] Trigger mapping: Council signup → welcome sequence
- [ ] Trigger mapping: weekly briefing → personalized email
- [ ] A/B testing framework for subject lines

---

## 6. Database Schema (Supplement to v1.0)

```sql
-- Council membership
CREATE TABLE council_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  tier TEXT NOT NULL DEFAULT 'individual', -- founding, individual, corporate, pe_partner
  credits_total INT NOT NULL DEFAULT 12,
  credits_remaining INT NOT NULL DEFAULT 12,
  credits_reset_date TIMESTAMPTZ,
  coaching_sessions_total INT NOT NULL DEFAULT 12,
  coaching_sessions_used INT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, suspended, cancelled
  joined_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  founding_badge BOOLEAN DEFAULT false
);

-- XP and gamification
CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  total_xp INT DEFAULT 0,
  current_level TEXT DEFAULT 'explorer',
  streak_count INT DEFAULT 0,
  last_active_date DATE,
  achievements JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coaching sessions
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES council_members(id),
  coach_id UUID REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 60,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  topic TEXT,
  pre_session_brief JSONB, -- AI-generated
  post_session_notes JSONB, -- AI-generated summary
  credits_charged INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE council_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- roundtable, workshop, dinner, webinar
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  capacity INT,
  credits_cost INT DEFAULT 2,
  attendee_brief JSONB -- AI-generated attendee brief
);

-- Event registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES council_events(id),
  member_id UUID REFERENCES council_members(id),
  registered_at TIMESTAMPTZ DEFAULT now(),
  attended BOOLEAN DEFAULT false
);

-- Peer connections
CREATE TABLE peer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_a UUID REFERENCES council_members(id),
  member_b UUID REFERENCES council_members(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  introduced_by TEXT DEFAULT 'ai', -- ai, manual, event
  ai_reasoning TEXT, -- Why AI suggested this connection
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nexus conversation memory
CREATE TABLE nexus_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  conversation_id TEXT,
  topic TEXT,
  key_insights JSONB, -- Extracted insights from conversation
  emotional_context TEXT, -- User's emotional state/intent
  follow_up_needed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Appendix: What Makes This Addictive (Summary)

1. **Self-discovery is inherently addictive.** Every assessment reveals something new about yourself. Humans can't resist learning about themselves.

2. **Progress visualization creates momentum.** XP bars, level badges, streak counters — they exploit the Zeigarnik effect (incomplete tasks create tension).

3. **Social proof creates FOMO.** "47 leaders took this assessment this week." "Your peer group is 3x more engaged." Nobody wants to be left behind.

4. **Variable rewards drive repetition.** AI insights are different each time. You don't know what Nexus will tell you. This is the same mechanic that makes social media addictive.

5. **Identity investment creates lock-in.** The more assessments you take, the richer your profile, the better the AI knows you. Leaving = losing your digital twin.

6. **Exclusivity drives aspiration.** Council tiers, founding member badges, "invitation only" — status symbols that motivate continued engagement.

7. **Credit scarcity creates intentionality.** Limited credits make every interaction feel valuable. Members don't browse — they engage deliberately.

8. **Community creates obligation.** When you're part of a cohort, people expect you to show up. Social obligation is a powerful retention driver.

9. **AI personalization creates dependency.** The platform gets smarter about you over time. No competitor can replicate your history. Switching costs are high.

10. **Real-world outcomes create loyalty.** When the platform helps you land a role, find a coach, or make a key connection — you're locked in for life.
