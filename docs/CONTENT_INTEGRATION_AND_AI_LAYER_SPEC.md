# LYC Intelligence (DEX AI) — Content Integration & AI Layer Business Spec

**Version:** 1.0 | **Date:** 2026-07-20 | **Author:** NEXUS  
**Status:** For Kevin Review

---

## Executive Summary

DEX AI has 60+ frontend pages, 45+ API handlers, and a Notion library of 100 content assets — but they're disconnected. This spec defines how to wire content, AI generation, and assessments into a unified, living experience across all four portals (Candidate, Client, Council, Internal) where nothing is static, everything is clickable, and every interaction deepens engagement.

**Core thesis:** The platform's competitive moat isn't any single feature — it's the **AI layer that connects everything**. Every portal, every page, every data point should feed into and be enriched by AI. The user should never feel like they're "looking at a dashboard" — they should feel like they're in a conversation with an intelligent system that knows them, anticipates their needs, and rewards engagement.

---

## Table of Contents

1. [Portal Architecture & Content Flow](#1-portal-architecture--content-flow)
2. [AI Layer — Cross-Portal Intelligence](#2-ai-layer--cross-portal-intelligence)
3. [Assessment → Chat Integration](#3-assessment--chat-integration)
4. [Portal-by-Portal Feature Spec](#4-portal-by-portal-feature-spec)
5. [UX Design Philosophy — Addictive by Design](#5-ux-design-philosophy--addictive-by-design)
6. [Content Integration Plan — Notion → Platform](#6-content-integration-plan--notion--platform)
7. [AI Report Generation — Business Spec](#7-ai-report-generation--business-spec)
8. [Gamification & Engagement Mechanics](#8-gamification--engagement-mechanics)
9. [Implementation Priority](#9-implementation-priority)

---

## 1. Portal Architecture & Content Flow

### 1.1 Current State

| Portal | Pages | Data Source | AI Integration | Status |
|--------|-------|-------------|----------------|--------|
| **Candidate** | 15 | Real (Supabase) | Nexus Chat, Assessments | Functional |
| **Client** | 11 | Real (Supabase) | Nexus Assistant, Reports | Functional |
| **Council** | 9 | **Static/Hardcoded** | None | Shell only |
| **Internal** | 10 | Real (Supabase) | Admin Console, Analytics | Functional |
| **Leader Portal** | 3 | Static | None | Shell only |

### 1.2 Target State — Unified Content Graph

```
┌─────────────────────────────────────────────────────────┐
│                    CONTENT LAYER                         │
│  Notion DB (100 assets) ──→ Platform DB (structured)    │
│  Question Banks │ Report Templates │ Email Sequences     │
│  Persona Profiles │ Diagnostic Specs │ Search Materials  │
└──────────────┬──────────────────────────┬────────────────┘
               │                          │
       ┌───────▼───────┐         ┌───────▼───────┐
       │  AI ENGINE    │         │  DATA ENGINE   │
       │  DeepSeek API │         │  Supabase DB   │
       │  ─────────    │         │  ────────────   │
       │  • Generation │         │  • User data   │
       │  • Scoring    │◄───────►│  • Assessments │
       │  • Persona    │         │  • Interactions│
       │  • Insights   │         │  • Events      │
       └───────┬───────┘         └───────┬───────┘
               │                          │
       ┌───────▼──────────────────────────▼───────┐
       │           NEXUS AI LAYER                  │
       │  Unified intelligence across all portals  │
       │  Memory │ Context │ Persona │ Commands     │
       └───────┬──────────┬──────────┬─────────────┘
               │          │          │
       ┌───────▼──┐  ┌───▼────┐  ┌──▼───────┐
       │CANDIDATE │  │ CLIENT │  │ COUNCIL  │
       │  PORTAL  │  │ PORTAL │  │  PORTAL  │
       └──────────┘  └────────┘  └──────────┘
```

### 1.3 Content Flow Rules

1. **Every piece of content has a lifecycle:** Created (Notion) → Reviewed → Loaded (Platform DB) → Served (Portal) → Enriched (AI) → Measured (Analytics)
2. **Every user interaction generates data** that feeds back into AI context
3. **Every AI output is traceable** to the content source + user context that generated it
4. **No dead ends** — every page has at least one actionable AI-powered next step

---

## 2. AI Layer — Cross-Portal Intelligence

### 2.1 The Nexus Persona System (Enhanced)

Current: 654-line chat handler with persona, memory, seniority calibration.  
Target: **Universal AI layer** accessible from every portal, every page, every context.

**Nexus wears different hats per portal:**

| Portal | Nexus Persona | Tone | Primary Function |
|--------|---------------|------|-------------------|
| Candidate | Career Coach | Warm, direct, challenging | Assessment interpretation, career pathing, interview prep, opportunity matching |
| Client | Strategic Advisor | Executive, data-driven | Talent intelligence, mandate insights, candidate evaluation, market briefing |
| Council | Peer Connector | Sophisticated, exclusive | Network intelligence, event curation, thought leadership, cross-member insights |
| Internal | Operations Partner | Efficient, analytical | Workflow optimization, quality checks, content generation, reporting |

### 2.2 Universal AI Endpoints

All portals use the same underlying AI infrastructure but with different context injection:

```
POST /api/ai
{
  "command": "chat" | "assess" | "report" | "brief" | "coach" | "analyze",
  "context": {
    "portal": "candidate" | "client" | "council" | "internal",
    "page": "/candidate/dashboard",
    "user_role": "candidate" | "client" | "council_member" | "consultant",
    "user_id": "...",
    "session_context": { ... }  // What they've been doing, viewing, clicking
  },
  "payload": { ... }  // Command-specific data
}
```

### 2.3 AI Command Matrix

| Command | Candidate | Client | Council | Internal |
|---------|-----------|--------|---------|----------|
| **chat** | Career coaching, interview prep | Mandate discussion, candidate Q&A | Network intros, market insights | Task delegation, status queries |
| **assess** | Take SHIFT/DRIVE/BRIDGE etc. | Team assessment, culture fit | Leadership diagnostic | Process audit |
| **report** | Personal development report | Candidate evaluation, market map | Member insight brief | Search progress, quality report |
| **brief** | Industry briefing, role insights | APAC talent trends, comp data | Quarterly briefing, peer insights | Daily ops summary |
| **coach** | 1:1 career coaching session | N/A | Executive coaching (peer) | N/A |
| **analyze** | Skill gap analysis | Pipeline analytics, hiring forecast | Network health, influence map | Revenue analytics, utilization |

### 2.4 Context Injection — How AI Knows What It Knows

For every AI call, the system builds a **context package**:

```typescript
interface AIContext {
  // Who is this user?
  userProfile: {
    role, seniority, industry, location, history
  };
  
  // What have they done?
  recentActivity: {
    assessmentsTaken[], reportsViewed[], pagesVisited[],
    messagesSent[], eventsAttended[]
  };
  
  // What's relevant right now?
  currentPage: {
    route, dataLoaded, userActions[]
  };
  
  // What does the platform know about them?
  derivedInsights: {
    archetype, seniorityLevel, engagementScore,
    assessmentHistory[], preferenceSignals[]
  };
  
  // What content is available?
  availableContent: {
    questionBanks[], reportTemplates[], emailSequences[]
  };
}
```

This context is what makes Nexus feel personal rather than generic.

---

## 3. Assessment → Chat Integration

### 3.1 The Assessment Ecosystem

**Current assessments in Notion (14 question banks):**

| Assessment | Type | Portal | AI Integration |
|------------|------|--------|----------------|
| **SHIFT** | Career transition readiness | Candidate | AI scoring + narrative report |
| **DRIVE** | Motivation & ambition profile | Candidate | AI scoring + career pathing |
| **BRIDGE** | Leadership style diagnostic | Candidate/Client | AI scoring + team fit analysis |
| **MOSAIC** | Cultural fit & adaptability | Candidate/Client | AI scoring + market matching |
| **TRIDENT** | Decision-making under pressure | Candidate | AI scoring + scenario coaching |
| **PRISM** | Cognitive flexibility | Candidate | AI scoring + development plan |
| **IMPACT** | Influence & persuasion style | Candidate/Council | AI scoring + communication coaching |
| **QUEST** | Strategic thinking capacity | Client/Council | AI scoring + org design insights |
| **LEAP** | Innovation & risk tolerance | Candidate | AI scoring + opportunity matching |
| **FORCE Exposure** | Organizational force field analysis | Client | AI analysis + change roadmap |
| **FORGE** | Team composition dynamics | Client/Internal | AI team optimization |
| **SPARK** | Energy & engagement driver | Candidate/Client | AI engagement prediction |
| **SHIFT-COACH** | Coaching readiness | Council | AI coaching plan generation |

### 3.2 Assessment-to-Chat Flow

```
User takes assessment
        │
        ▼
AI scores responses (DeepSeek)
        │
        ├──→ Generates structured score profile
        │         (dimensions, percentiles, archetype)
        │
        ├──→ Generates narrative report
        │         (human-readable, contextual to user's role)
        │
        ├──→ Updates Nexus memory
        │         (user's archetype, strengths, gaps)
        │
        └──→ Triggers proactive suggestions
                  │
                  ├──→ "Based on your DRIVE results, 
                  │     here are 3 roles that match your 
                  │     motivation profile"
                  │
                  ├──→ "Your BRIDGE score suggests you'd 
                  │     benefit from our next roundtable 
                  │     on adaptive leadership"
                  │
                  └──→ "Your TRIDENT pattern shows 
                        high-pressure decision fatigue. 
                        Want to explore coaching?"
```

### 3.3 Chat-Initiated Assessments

Not all assessments start from a "Take Assessment" button. Nexus can surface them conversationally:

**Example flows:**

1. **Candidate says:** "I'm not sure if I'm ready for a C-suite role"
   → Nexus: "Let's find out. I'd like to run a quick diagnostic — the SHIFT assessment takes 12 minutes and measures your transition readiness across 6 dimensions. Want to start now?"

2. **Client says:** "We need someone who can handle our APAC expansion"
   → Nexus: "Based on your mandate context, I'd recommend evaluating candidates on MOSAIC (cultural adaptability) and QUEST (strategic thinking). I can send the combined assessment to your shortlisted candidates — shall I?"

3. **Council member says:** "I'm curious how my leadership style compares to others in the network"
   → Nexus: "I can generate a comparative BRIDGE analysis using anonymized data from 47 network members who've completed the assessment. You'll see where you lead, where you're typical, and where you're an outlier. Ready?"

### 3.4 Assessment Progressive Disclosure

Assessments aren't one-and-done. They build over time:

- **Micro-assessments:** 3-5 question "pulse checks" triggered by context (e.g., after reading a market briefing: "How confident are you about your org's APAC positioning?")
- **Standard assessments:** Full question banks (20-40 questions) taken on-demand
- **Composite assessments:** AI combines multiple micro + standard results into a unified profile
- **Longitudinal tracking:** Re-assessment over time shows growth curves, not just snapshots

---

## 4. Portal-by-Portal Feature Spec

### 4.1 Candidate Portal

**Core identity:** Your AI career coach that knows you deeply.

#### Dashboard — Living, Not Static

| Widget | What It Does | AI-Powered | Clickable Action |
|--------|--------------|------------|------------------|
| **Readiness Radar** | 6-dimension career readiness visual | Scores from assessments + AI interpretation | Click any dimension → deep dive + improvement plan |
| **Opportunity Match** | Live match % against open mandates | AI matching based on profile + assessments | Click → see why you match + apply |
| **Interview Countdown** | Next interview prep status | AI generates prep brief based on company + role + your gaps | Click → start prep session with Nexus |
| **Skill Velocity** | Skill trajectory over time | AI compares your growth vs. peers in same seniority | Click → see gap analysis + learning path |
| **Nexus Insight** | Daily AI-generated career insight | Personalized to your profile, market, goals | Click → deeper conversation with Nexus |
| **Achievement Feed** | Gamified progress badges | Unlocked by assessments, applications, learning | Click → view badge details + share |

#### Key Interactions

**The "Am I Ready?" Button**
- Prominent CTA on candidate dashboard
- AI runs a rapid composite assessment (combines existing data + 5 new micro-questions)
- Returns: readiness score, target roles, gap analysis, action plan
- Takes 2 minutes. Addictive because it's about *them*.

**The "Prep Me" Flow**
- Before any interview, candidate clicks "Prep Me"
- AI generates: company research brief, likely questions (based on role + seniority), suggested answers drawing from candidate's actual experience, red flags to avoid
- Candidate can practice with Nexus in mock interview mode
- Session recorded, AI scores performance, suggests improvements

**The Career Timeline**
- Visual timeline of career milestones (past + projected future)
- AI projects: "Based on your trajectory, you're on track for VP in 18 months. Here's what typically accelerates that..."
- Every node is clickable → more detail, related assessments, coaching sessions

#### Pages That Need Real AI (Not Placeholder)

| Page | Current State | Required AI Enhancement |
|------|--------------|------------------------|
| CandidateDashboardPage | Real data, static display | Add Nexus Insight widget, Readiness Radar, Opportunity Match |
| CandidateAssessmentsPage | Real data | Add micro-assessments, progressive disclosure, AI scoring |
| CandidateNexusCoachPage | Shell | Full Nexus chat with assessment context injection |
| CandidateInterviewPrepPage | Shell | AI-generated prep briefs, mock interview mode |
| CandidateCareerDevPage | Shell | AI career pathing, skill gap analysis, learning recommendations |
| CandidateLifecyclePage | Real data | AI-powered lifecycle stage transitions, predictive next steps |
| CandidateOpportunitiesPage | Shell | AI-ranked opportunities with match explanations |

### 4.2 Client Portal

**Core identity:** Your AI talent intelligence system that makes you smarter about your org.

#### Dashboard — Intelligence, Not Information

| Widget | What It Does | AI-Powered | Clickable Action |
|--------|--------------|------------|------------------|
| **Mandate Pulse** | Live search progress with AI commentary | AI summarizes progress, flags risks, suggests actions | Click → deep dive into mandate + AI recommendations |
| **Talent Market Heatmap** | Supply/demand for your roles | AI analyzes market data + internal DB | Click → see specific candidates + poach targets |
| **Pipeline Health** | Funnel analytics with AI diagnosis | AI identifies bottlenecks, suggests fixes | Click → AI generates intervention plan |
| **Candidate Comparison** | Side-by-side AI evaluation | AI ranks and explains tradeoffs | Click → see detailed assessment comparisons |
| **Market Briefing** | Weekly AI-generated industry intelligence | DeepSeek-powered analysis of sector trends | Click → ask follow-up questions to Nexus |
| **ROI Tracker** | Engagement value metrics | AI calculates time saved, quality improved | Click → see detailed breakdown + case studies |

#### Key Interactions

**The "Who Should I Hire?" Flow**
- Client describes the role in natural language
- AI generates: role scorecard, assessment battery recommendation, market availability estimate, comp benchmark
- If candidates exist in pipeline: AI-ranked shortlist with explanations
- If not: AI generates sourcing strategy + timeline

**The "What's My Market?" Brief**
- One-click AI-generated market intelligence report
- Covers: talent supply, comp benchmarks, competitor hiring activity, flight risk analysis
- Updated weekly. Client can ask follow-up questions via Nexus.

**The Mandate War Room**
- For active searches: real-time collaboration space
- AI provides: candidate updates, interview feedback synthesis, market reaction signals, decision support
- Client + consultant see same data but different perspectives (AI adapts to role)

#### Pages That Need Real AI

| Page | Current State | Required AI Enhancement |
|------|--------------|------------------------|
| ClientOverviewPage | Real data, static | Add AI commentary, predictive indicators |
| ClientTalentIntelPage | Shell | Full AI market intelligence engine |
| ClientNexusAssistantPage | Shell | Nexus chat with mandate context |
| ClientPipelineAnalyticsPage | Shell | AI-powered funnel diagnosis and recommendations |
| ClientCollaborationPage | Shell | Real-time AI-facilitated collaboration |
| ClientDocumentsPage | Shell | AI-generated documents (offer letters, briefs, proposals) |

### 4.3 Council Portal (Highest Transformation Needed)

**Core identity:** Your exclusive peer network with AI-powered intelligence.

**Current state: 100% static/hardcoded data. Needs full backend integration.**

#### Dashboard — The Executive Lounge

| Widget | What It Does | AI-Powered | Clickable Action |
|--------|--------------|------------|------------------|
| **Network Pulse** | What's happening in the Council | AI curates based on member activity, interests, connections | Click → see detailed activity + join conversations |
| **Peer Insights** | Anonymized peer comparison data | AI generates insights from aggregate assessment data | Click → explore specific dimensions + benchmark |
| **Curated Connections** | AI-suggested member connections | AI matches based on complementary profiles, needs, interests | Click → intro request + conversation starter |
| **Event Intelligence** | Upcoming events with relevance scores | AI ranks events by member's interests, network gaps, goals | Click → RSVP + see who else is attending + prep brief |
| **Thought Leadership Feed** | AI-curated content + member contributions | AI summarizes, connects to member's context, suggests actions | Click → read + comment + share + AI-generated discussion prompts |
| **Council Briefing** | Quarterly intelligence document (from Notion) | AI personalizes general briefing to member's industry/role | Click → interactive version with Nexus Q&A |

#### Key Interactions

**The "Connect Me" Flow**
- Council member says: "I need to understand how PE firms are handling AI replacement in SE Asia"
- AI scans: member directory + assessment profiles + past event attendance + stated interests
- Returns: 3-5 suggested connections with explanations + conversation starters
- One-click intro request

**The "Prepare Me" for Events**
- Before Council event: AI generates attendee brief (who's going, what they do, potential synergies)
- During event: live AI-facilitated discussion prompts
- After event: AI-generated follow-up summary + connection actions

**The "Council Intelligence" Briefing**
- Monthly AI-generated document combining: market trends, member activity insights, upcoming opportunities
- Personalized per member (CEO sees different angles than CHRO)
- Interactive — can ask Nexus to elaborate on any section

#### Pages That Need Full Build

| Page | Current State | Required Build |
|------|--------------|----------------|
| CouncilDashboardPage | Static hardcoded | Full Supabase integration + AI widgets |
| CouncilCommunityPage | Shell | Real community feed with AI curation |
| CouncilDirectoryPage | Shell | Searchable directory with AI matching |
| CouncilCoachingPage | Shell | AI-facilitated peer coaching matching |
| CouncilProfilePage | Shell | Rich profile with assessment integration |
| CouncilBenefitsPage | Static | Interactive benefits calculator + usage tracker |
| SignalCouncilBriefingPage | Shell | AI-generated, personalized briefing |

### 4.4 Internal Portal

**Core identity:** Your AI-powered operations command center.

#### Key AI Enhancements

| Feature | Description |
|---------|-------------|
| **AI Document Studio** | Generate offer letters, proposals, reports, briefs from templates + live data |
| **Quality Copilot** | AI reviews search processes, flags risks, suggests improvements |
| **Revenue Intelligence** | AI-predicted close rates, pipeline value, revenue forecasting |
| **Content Factory** | Transform Notion content assets into client-facing deliverables at scale |
| **Smart Delegation** | AI routes tasks based on capacity, expertise, and development goals |

---

## 5. UX Design Philosophy — Addictive by Design

### 5.1 Core Principles

1. **No Dead Clicks** — Every button does something. No "coming soon" placeholders in production.
2. **Progressive Disclosure** — Surface the simple, hide the complex. Every page has a 1-sentence purpose.
3. **Instant Gratification** — AI responses < 3 seconds. Loading states are engaging (typing indicators, partial reveals).
4. **Personalization Depth** — The platform should feel different for every user. "How does it know that?"
5. **Variable Rewards** — Users don't know exactly what they'll get each time they log in. Novelty drives return.

### 5.2 Gamification Mechanics

#### Experience Points (XP) System

| Action | XP | Notes |
|--------|----|-------|
| Complete an assessment | 100-500 XP | Scales with assessment depth |
| Take a micro-assessment | 25 XP | Quick pulse checks |
| Read an AI briefing | 50 XP | Must spend 30+ seconds |
| Connect with a peer (Council) | 75 XP | Both parties earn |
| Attend an event | 150 XP | Verified attendance |
| Ask Nexus a question | 10 XP | Encourages daily use |
| Complete a coaching session | 200 XP | Full session completion |
| Share insight with network | 50 XP | Creates content for others |
| Update profile/skills | 25 XP | Keeps data fresh |

#### Levels & Status

**Candidate Levels:**
- Explorer (0-500 XP) → Navigator (500-2000) → Strategist (2000-5000) → Executive Ready (5000+)

**Council Levels:**
- New Member → Engaged → Contributor → Influencer → Thought Leader

**Visual indicators:**
- Level badge on profile
- Progress bar to next level
- Subtle visual treatment changes at higher levels (border colors, icon treatments)

#### Streaks & Daily Engagement

- **Daily Insight:** AI generates one personalized insight per day. Opening it maintains streak.
- **Weekly Challenge:** "Complete DRIVE this week" or "Connect with 2 new members"
- **Streak counter** visible on dashboard — subtle but motivating

#### Unlockables

- Higher levels unlock: advanced assessments, exclusive content, priority event access, deeper analytics
- Creates aspiration loop: use platform → earn XP → level up → unlock valuable features → use platform more

### 5.3 Micro-Interactions That Drive Engagement

1. **Assessment reveal:** Don't show all scores at once. Reveal one dimension at a time with a 500ms delay. Builds anticipation.

2. **AI typing indicator:** Show Nexus "thinking" with a subtle animation. Makes AI feel alive, not instant.

3. **Confetti on completion:** When user finishes an assessment or unlocks a level — brief celebration animation.

4. **Peer activity notifications:** "Sarah Chen just completed SHIFT — she's now in the top 15% for Strategic Agility." Social proof drives action.

5. **Insight cards:** Swipeable cards on mobile (Tinder-style) for market insights, peer connections, opportunities. Swipe right = save, left = skip.

6. **Live counters:** "47 candidates matched to this mandate" / "12 Council members attending this event" — real numbers create urgency.

7. **Before/After comparisons:** Show assessment score improvements over time. Progress可视化.

### 5.4 Design System Rules

| Element | Rule |
|---------|------|
| **Empty states** | Never just "No data." Always: illustration + explanation + CTA (take assessment, invite connection, etc.) |
| **Loading states** | Skeleton screens with contextual tips, not spinners |
| **Buttons** | Primary: AI-powered action (Generate, Analyze, Connect). Secondary: Navigate. Tertiary: Configure. |
| **Cards** | Every card is clickable. Hover state reveals action. Click reveals depth. |
| **Charts** | Interactive — hover for detail, click for drill-down, long-press for AI explanation |
| **Notifications** | Smart — only notify when there's genuine value. Batch low-priority. AI decides urgency. |
| **Navigation** | Contextual — sidebar changes based on portal + role. Quick actions always visible. |

---

## 6. Content Integration Plan — Notion → Platform

### 6.1 Asset → Feature Mapping

| Notion Category | Count | Maps To | Portal | Integration Method |
|-----------------|-------|---------|--------|--------------------|
| **Question Banks** (14) | 14 | Assessment engine question pools | Candidate, Client, Council | Load into `assessment_questions` table; AI generates scoring logic from spec |
| **Report Templates** (7) | 7 | AI report generation prompts | All portals | Load as prompt templates; AI fills with user data |
| **Email Sequences** (13) | 13 | Email automation engine | All portals | Load as sequence definitions; trigger based on user events |
| **Diagnostic Specs** (5) | 5 | Assessment configuration | Internal, Candidate | Define assessment structure, scoring weights, routing logic |
| **Diagnostic Ops** (9) | 9 | Assessment delivery + debrief | All portals | Briefing decks → client-facing PDFs; delivery protocols → consultant guides |
| **Search Materials** (6) | 6 | Document generation templates | Client, Internal | Templates for mandate briefs, progress reports, terms of engagement |
| **Advisory Proposals** (7) | 7 | AI proposal generation | Internal, Client | Templates for Force 1/2/3 proposals; AI customizes per client |
| **Advisory Delivery** (7) | 7 | Internal operational guides | Internal | Consultant guides, QA checklists, onboarding packs |
| **Invitation Council** (6) | 6 | Council portal content | Council | Charter → onboarding; directory protocol → directory page; briefing → briefing page |
| **Web Pages** (9) | 9 | Public-facing content | Public | Landing page copy, SEO, forms |
| **Assessment Platform** (4) | 4 | Assessment admin docs | Internal | Admin guides, UAT plans, tech specs |

### 6.2 Database Schema for Content

```sql
-- Content assets loaded from Notion
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  product_layer TEXT,
  priority TEXT, -- P0, P1, P2
  status TEXT DEFAULT 'draft', -- draft, active, archived
  format TEXT, -- MD, JSON, HTML
  body JSONB, -- Structured content
  metadata JSONB, -- Tags, dependencies, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assessment question banks
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_type TEXT NOT NULL, -- SHIFT, DRIVE, BRIDGE, etc.
  dimension TEXT NOT NULL, -- Which dimension this question measures
  question_text TEXT NOT NULL,
  question_type TEXT, -- likert, scenario, ranking, open
  options JSONB, -- For structured questions
  scoring_logic JSONB, -- How to score the response
  difficulty INT DEFAULT 1,
  order_index INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Report templates (prompt templates for AI generation)
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  assessment_type TEXT, -- Which assessment this report is for
  template_type TEXT NOT NULL, -- narrative, comparative, developmental, executive_summary
  prompt_template TEXT NOT NULL, -- The AI prompt with {{variables}}
  variables JSONB, -- What variables the template expects
  output_format TEXT DEFAULT 'markdown', -- markdown, html, pdf
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email sequences
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sequence_type TEXT NOT NULL, -- nurture, onboarding, reactivation, transactional
  trigger_event TEXT, -- What triggers this sequence
  target_role TEXT, -- candidate, client, council_member
  steps JSONB NOT NULL, -- Array of email steps with delays, conditions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User's assessment results (for AI context)
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  assessment_type TEXT NOT NULL,
  responses JSONB NOT NULL,
  scores JSONB NOT NULL, -- Dimension scores
  archetype TEXT, -- AI-assigned archetype
  narrative TEXT, -- AI-generated narrative summary
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI-generated reports
CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  assessment_result_id UUID REFERENCES assessment_results(id),
  template_id UUID REFERENCES report_templates(id),
  report_type TEXT NOT NULL,
  content JSONB NOT NULL, -- The generated report
  generated_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  shared_at TIMESTAMPTZ
);
```

### 6.3 Content Loading Priority

**Phase 1 (Week 1-2): P0 Assessment Content**
- 14 question banks → Load into `assessment_questions`
- 7 report templates → Load into `report_templates`
- 5 diagnostic specs → Configure assessment engine
- Wire assessment engine to AI scoring

**Phase 2 (Week 2-3): P0 Email & Communication**
- 13 email sequences → Load into `email_sequences`
- Connect to notification system triggers
- Test end-to-end: assessment complete → email sent

**Phase 3 (Week 3-4): Council Content**
- 6 Council assets → Wire into Council portal pages
- Member charter → onboarding flow
- Briefing doc → AI-personalized briefing page

**Phase 4 (Week 4-5): Client-Facing Templates**
- 6 search materials → Document generation templates
- 7 advisory proposals → AI proposal generator
- Test: generate proposal from mandate data

---

## 7. AI Report Generation — Business Spec

### 7.1 Report Types by Portal

| Report Type | Candidate | Client | Council | Internal |
|-------------|-----------|--------|---------|----------|
| **Assessment Narrative** | Full personality/capability narrative | Candidate evaluation summary | Peer comparison brief | Team composition analysis |
| **Market Intelligence** | Industry/role insights | Talent market map, comp benchmark | APAC trends, member insights | Sector analysis for searches |
| **Development Plan** | Personalized growth roadmap | N/A | Leadership development plan | Team capability gaps |
| **Event/Engagement Brief** | Company/role prep brief | Mandate status report | Event attendee brief, follow-up | Search progress report |
| **Comparative Analysis** | "How do I compare?" | Candidate vs. candidate | "How do I compare to peers?" | Mandate pipeline comparison |
| **Executive Summary** | Career positioning statement | Hiring decision brief | Network value summary | Revenue/performance summary |

### 7.2 Report Generation Pipeline

```
1. TRIGGER
   ├── User clicks "Generate Report"
   ├── Assessment completed
   ├── Scheduled (weekly briefing)
   └── AI-determined (context triggers)

2. CONTEXT GATHERING
   ├── User profile + history
   ├── Assessment results (if applicable)
   ├── Market data (if applicable)
   ├── Template selection (AI picks best template)
   └── Audience calibration (who will read this?)

3. AI GENERATION (DeepSeek)
   ├── Prompt assembly (template + context + user data)
   ├── Structured output (sections, insights, actions)
   ├── Tone calibration (by portal + role)
   └── Quality check (factual consistency, completeness)

4. DELIVERY
   ├── In-app notification
   ├── Email with summary + link to full report
   ├── PDF export option
   └── Share functionality (with permissions)

5. INTERACTION
   ├── Read report
   ├── Ask Nexus about any section ("explain this")
   ├── Export / download
   ├── Share (candidate → client, member → member)
   └── Bookmark / revisit
```

### 7.3 Report Quality Standards

Every AI-generated report must:
1. **Be specific** — Reference the user's actual data, not generic platitudes
2. **Be actionable** — End with clear next steps, not just observations
3. **Be honest** — Include areas for improvement, not just strengths
4. **Be contextual** — Different tone/depth for CEO vs. VP vs. CHRO
5. **Be traceable** — User can see what data informed each insight
6. **Be shareable** — Formatted for the intended audience (candidate report vs. client report)

### 7.4 Report Examples

**Candidate Assessment Report (DRIVE):**
```
# Your DRIVE Profile

## Executive Summary
Your motivation profile reveals a rare combination: high achievement drive 
paired with genuine organizational purpose-seeking. You score in the 89th 
percentile for Impact Orientation — meaning you're driven less by title 
or compensation and more by measurable contribution to something larger.

## What This Means For Your Career
[AI-generated narrative connecting scores to career implications]

## Your Top 3 Role Matches
1. [Role with match % and explanation]
2. [Role with match % and explanation]  
3. [Role with match % and explanation]

## Development Focus
[Specific, actionable growth areas with timeline]

## Next Steps
- [Actionable item 1]
- [Actionable item 2]
- [Actionable item 3]

---
Ask Nexus anything about this report →
```

**Client Candidate Evaluation Report:**
```
# Candidate Evaluation: [Name]
## Mandate: VP Operations, APAC Expansion

## AI Assessment Summary
Overall Match: 82% | Risk Level: Medium-Low

## Strengths Alignment
[How candidate's assessments map to mandate requirements]

## Risk Factors
[What to explore in interview, based on assessment gaps]

## Interview Guide
[AI-generated questions to probe specific areas]

## Comparison to Shortlist
[How this candidate ranks vs. others on key dimensions]

## Recommendation
[Clear recommendation with conditions]
```

---

## 8. Gamification & Engagement Mechanics

### 8.1 The Engagement Loop

```
        ┌─── LOG IN ───┐
        │               │
        ▼               │
  Daily Insight ──────► "Oh, that's about me"
        │               │
        ▼               │
  Take Action ────────► Assessment / Connect / Learn
        │               │
        ▼               │
  Get Results ────────► Score / Match / Insight
        │               │
        ▼               │
  Earn XP ───────────► Level up / Unlock
        │               │
        ▼               │
  Share / Compare ────► Social proof
        │               │
        └───────────────┘
              REPEAT
```

### 8.2 Portal-Specific Engagement Drivers

**Candidate Portal — "Career Growth Addiction"**
- Weekly readiness score change ("You're 3% closer to C-suite ready")
- Skill radar that visibly grows over time
- "People like you also..." recommendations
- Application success celebrations
- Peer comparison (anonymized): "Your DRIVE score is higher than 73% of VP-level candidates in technology"

**Client Portal — "Intelligence Dependency"**
- Real-time mandate activity feed
- "Your market" weekly briefing (AI-generated, personalized)
- Candidate quality score trends
- Time-saved calculator ("Nexus saved you 4.5 hours this week")
- Exclusive data they can't get elsewhere

**Council Portal — "Network FOMO"**
- "3 connections made this week" counter
- Peer activity highlights (anonymized)
- "You were mentioned in..." notifications
- Exclusive event access (scarcity)
- Influence score based on network engagement
- "Your network grew by 5 members this month"

### 8.3 Retention Mechanics

| Mechanic | How It Works | Why It Works |
|----------|-------------|--------------|
| **Streak counter** | Daily engagement streak, visible on dashboard | Loss aversion — don't want to break streak |
| **Weekly challenges** | "Complete BRIDGE this week" with reward | Goal completion drive |
| **Progress visualization** | Radar charts that grow, bars that fill | Visual progress is motivating |
| **Social proof** | "47 people took this assessment today" | Herd behavior, competitive instinct |
| **Variable rewards** | AI insights are different each time | Dopamine from unpredictability |
| **Unlockables** | Higher levels = more features | Aspiration loop |
| **Personalization depth** | Platform gets smarter about you over time | Sunk cost — switching = losing your profile |
| **Exclusivity signals** | "Council members only" content | Status motivation |

---

## 9. Implementation Priority

### Phase 1: Assessment Engine + AI Scoring (Week 1-2)
**Goal:** Wire Notion question banks → platform → AI scoring → narrative reports

- [ ] Load 14 question banks into `assessment_questions` table
- [ ] Load 7 report templates into `report_templates` table
- [ ] Connect assessment engine to DeepSeek for scoring
- [ ] Build assessment-to-chat context pipeline
- [ ] Wire CandidateAssessmentsPage to real question banks
- [ ] Test: User takes SHIFT → AI scores → narrative report generates

### Phase 2: Council Portal — Live Data (Week 2-3)
**Goal:** Replace all hardcoded data with real Supabase + AI features

- [ ] Council dashboard → real member data from Supabase
- [ ] Council directory → searchable, AI-matched
- [ ] Council community → real activity feed
- [ ] Council briefing → AI-personalized from Notion briefing doc
- [ ] Council profile → assessment integration
- [ ] Event system → RSVP, attendance, AI prep briefs

### Phase 3: AI Report Studio (Week 3-4)
**Goal:** Every portal can generate contextual AI reports

- [ ] Build report generation pipeline (context → prompt → DeepSeek → formatted output)
- [ ] Candidate reports: assessment narratives, career plans
- [ ] Client reports: candidate evaluations, market briefs
- [ ] Council reports: peer comparisons, network insights
- [ ] PDF export for all report types
- [ ] "Ask Nexus about this report" interactive follow-up

### Phase 4: Gamification Layer (Week 4-5)
**Goal:** XP, levels, streaks, unlockables across all portals

- [ ] XP tracking system (database + API)
- [ ] Level system per portal type
- [ ] Daily insight + streak counter
- [ ] Achievement badges + unlockables
- [ ] Weekly challenges
- [ ] Leaderboard (opt-in, anonymized)

### Phase 5: Email Integration (Week 5-6)
**Goal:** Wire 13 email sequences to real triggers

- [ ] Load sequences into `email_sequences` table
- [ ] Connect to notification trigger system
- [ ] Test: assessment complete → appropriate email sequence fires
- [ ] Test: new Council member → onboarding sequence
- [ ] Test: client mandate update → status email

---

## Appendix A: Notion → Platform Content Loading Commands

For each Notion asset, the loading process is:
1. Read page content via Notion API (blocks → markdown)
2. Parse into structured format (questions, templates, sequences)
3. Insert into appropriate platform table
4. Validate (question count, template variables, sequence steps)

## Appendix B: AI Prompt Architecture

```
System: You are Nexus, LYC Partners' AI intelligence layer.
Context: [Portal] [User Role] [User Profile] [Recent Activity]
Template: [Report Template with {{variables}}]
Data: [Assessment Scores] [Market Data] [Peer Comparisons]
Output: Structured report with sections, insights, actions.
Tone: [Calibrated to user seniority and portal context]
```

## Appendix C: Current Codebase Map

- **Assessment Engine:** `src/services/assessmentEngine.ts` + `shiftAnalysis.ts` + `shiftAssessmentTypes.ts`
- **AI Chat:** `api/_lib/chatHandler.ts` (654 lines) + `api/_lib/aiHandler.ts` (478 lines)
- **Report Gen:** `api/_lib/documentGenerationHandler.ts` (214 lines) + `aiInsightsHandler.ts`
- **Candidate Pages:** 15 pages in `src/pages/candidate/`
- **Client Pages:** 11 pages in `src/pages/client/`
- **Council Pages:** 9 pages in `src/pages/council/`
- **Internal Pages:** 10 pages in `src/pages/internal/`
- **UI Components:** `src/components/assessment/` (10 components), `src/components/design-system/`
