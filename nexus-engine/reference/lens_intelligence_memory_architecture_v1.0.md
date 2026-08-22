# NEXUS — Lens Intelligence & Memory Architecture v1.0

**Phase:** 4 | **Wave:** 7 | **Status:** Active
**Previous:** System Prompt Architecture v1.0 (5-layer stack)
**This wave:** 3 new vertical layers + 1 updated architecture
**Lenses:** 11 diagnostic instruments (Canon v1.0)

---

## 1. Architecture Overview

Wave 7 adds three vertical capabilities that sit across the existing 5-layer horizontal stack. These are not new layers on top — they run alongside and feed into every layer.

```
                    ┌─────────────────────────────────────────┐
                    │      RECOMMENDATION ENGINE (R1)        │
                    │     subtle · trust-based · carded      │
                    └─────────────────────────────────────────┘
                                      ▲
                                      │ feeds
                    ┌─────────────────────────────────────────┐
                    │       LENS INTELLIGENCE (L0)            │
                    │  pattern → lens · signal strength      │
                    │  diagnostic-to-conversation bridge     │
                    └─────────────────────────────────────────┘
                                      ▲
                                      │ feeds
                    ┌─────────────────────────────────────────┐
                    │       USER INTELLIGENCE (U0)            │
                    │  context · memory · milestones         │
                    │  artifacts · assessments · history     │
                    └─────────────────────────────────────────┘
                                      │
                                      ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │  EXISTING 5-LAYER HORIZONTAL STACK                                    │
  │  L5 Turn Engine · L4 Scenario Controller · L3 Pattern Context         │
  │  L2 Quality System · L1 Core Identity                                 │
  └───────────────────────────────────────────────────────────────────────┘
```

**Three new vertical layers:**
- **U0 — User Intelligence** — who is this person, what do we know, what's their context
- **L0 — Lens Intelligence** — pattern recognition → lens identification → suggestion trigger
- **R1 — Recommendation Engine** — subtle, trust-aligned recommendations for next steps

**Design principle:** These layers run invisibly. The user experiences a coach who remembers them, sees their patterns clearly, and occasionally offers something more — never a sales pitch, always a relevant next step.

---

## 2. The Core Insight

NEXUS is not a diagnostic tool. NEXUS is a coach who uses diagnostics.

The lenses (11 assessments) are instruments NEXUS can deploy. The pattern library (164 cards) is the substrate that lets NEXUS see which lens might be useful. The user never sees the machinery — they experience a coach who occasionally says "I'm noticing X — have you considered running the Y lens? It would give us a more precise reading."

This is exactly how a luxury consultant works: you show expertise first, then offer a deeper instrument only when the situation clearly calls for it. The suggestion feels earned, not sold.

---

## 3. Layer U0 — User Intelligence

### 3.1 What it is

A structured profile of the user that accumulates across sessions and feeds into every conversation turn. NEXUS doesn't start from zero each time.

### 3.2 User Intelligence Data Model

```
USER INTELLIGENCE PROFILE
├── Identity
│   ├── Name, role, company, level
│   ├── Industry, function, geography
│   └── Career stage, transition status
│
├── Artifacts (uploaded / ingested)
│   ├── CV / resume
│   ├── Articles / writing samples
│   ├── Leadership essays
│   ├── Portfolio / case studies
│   ├── 360 review results
│   └── Other documents
│
├── Assessment History
│   ├── Lens results (11 lenses, with dates)
│   ├── Lens reports (full canon output)
│   └── Score trajectories (how scores change over time)
│
├── Conversation Memory
│   ├── Session history (summaries, not transcripts)
│   ├── Active threads / open questions
│   ├── Insights generated in prior sessions
│   └── Patterns identified across conversations
│
├── Milestones Tracker
│   ├── Stated goals (career, leadership, transition)
│   ├── Progress markers
│   ├── Action items / commitments
│   └── Completed milestones
│
└── Trust & Maturity
    ├── Relationship stage (intro → working → deep → partner)
    ├── Lens adoption count
    ├── Session frequency
    ├── Disclosure depth
    └── Recommendation acceptance rate
```

### 3.3 How it feeds into the stack

- **L1 (Core Identity)** — user context shapes how NEXUS positions itself relative to this specific person
- **L3 (Pattern Context)** — pattern retrieval is weighted by user context (e.g., if we know they're in CPG, CPG-relevant patterns surface first)
- **L4 (Scenario Controller)** — scenario progression adapts based on what we already know (e.g., skip basic context-gathering if CV is already on file)
- **L5 (Turn Engine)** — references prior milestones, open threads, and commitments
- **L0 (Lens Intelligence)** — assessment history tells us which lenses have been run, which are relevant next
- **R1 (Recommendation Engine)** — trust & maturity determines what recommendations are appropriate

### 3.4 Memory Rules

- **Summaries, not transcripts.** Long-term memory stores structured summaries and key insights, not raw conversation text. This is more useful and more private.
- **User controls what's remembered.** The user can clear memory, remove specific artifacts, or pause memory accumulation at any time.
- **Memory is additive but editable.** NEXUS accumulates context, but the user can correct or update anything.
- **Cross-session continuity.** When a user returns, NEXUS references the last session's conclusion naturally — "Last time we were looking at your board presentation structure. Where are you with that?"

---

## 4. Layer L0 — Lens Intelligence

### 4.1 What it is

The bridge between pattern recognition (164 cards) and the 11 diagnostic lenses. NEXUS never leads with a lens — but as patterns accumulate in conversation, lens signal strength builds. When a lens signal crosses a threshold, NEXUS may suggest it.

### 4.2 Lens Canon (11 instruments)

From Diagnostic Canon Package v1.0:

| Lens | Full Name | Duration | Tier | Pillar |
|------|-----------|----------|------|--------|
| CPI | China Leadership Pipeline Index | 5mi | Flagship | P1 |
| LEAP | Competitive Positioning | 1mi | Light | P1 |
| COACH | Executive Coaching Fit | 2mi | Standard | P1 |
| PRISM | Professional Branding | 2mi | Standard | P3 |
| IMPACT | Board & Stakeholder Impact | 2mi | Standard | P3 |
| QUEST | Strategic Market Positioning | 2mi | Standard | P3 |
| BRIDGE | Cross-Cultural Relational Intelligence | 3mi | Signature | P2 |
| MOSAIC | Institutional Trust & Relationship Velocity | 3mi | Signature | P2 |
| DRIVE | Motivational Alignment | 2mi | Standard | P2 |
| SPARK | AI Leadership Readiness | 3mi | Signature | P4 |
| FORGE | Sales Excellence Capability | 3mi | Signature | P4 |

### 4.3 Pattern → Lens Mapping

Every pattern card in the knowledge base has a lens affinity score — how strongly this pattern signals that a particular lens would be useful.

**Scoring scale: 0-3 per pattern**
- 0 = no connection
- 1 = tangential (this pattern can appear in many contexts, lens is one possible frame)
- 2 = relevant (this pattern commonly appears when this lens would add value)
- 3 = diagnostic (this pattern is a primary indicator for this lens)

**Signal accumulation:** As NEXUS identifies patterns in conversation, lens signal accumulates. Each activated pattern contributes its affinity score to the corresponding lens.

**Thresholds:**
- **Signal 3-4:** Lens is background context. NEXUS thinks about the situation through this lens but doesn't mention it.
- **Signal 5-6:** Lens is relevant. NEXUS may reference lens-like concepts in conversation but doesn't name the lens.
- **Signal 7+:** Lens suggestion threshold. NEXUS may suggest running the lens, framed as a way to get a more precise reading.

**Suggestion rule:** NEXUS never suggests a lens before signal 7. And even then, only when the conversation naturally opens a door. Suggestions are never forced.

### 4.4 Lens Suggestion Format

When a lens reaches suggestion threshold AND the conversation provides a natural opening:

> "What you're describing — the gap between how you see your contribution and how stakeholders perceive it — is exactly what PRISM measures. It's a 20-minute instrument that gives you a precise reading on how your professional brand lands across four dimensions. If you're curious, I can run it now. No pressure either way."

**What makes it not salesy:**
- Specific, not generic — tied to something they just said
- Conditional — "if you're curious," not "you should"
- Low-friction — clear what it is, what it costs (in time), and how to say no
- Useful even if they decline — the insight itself has value

### 4.5 Lens Results Integration

When a user completes a lens:
1. The result is added to User Intelligence (U0) — Assessment History
2. NEXUS debriefs the result in conversation
3. Key findings are extracted into memory as structured insights
4. Those insights feed into future pattern retrieval and scenario progression
5. The lens result appears in the user's intelligence dashboard

**Important:** Lens results are inputs to coaching, not outputs of coaching. NEXUS uses the lens result to have a better conversation — never as a final verdict.

---

## 5. Layer R1 — Recommendation Engine

### 5.1 What it is

A subtle, trust-aligned system for suggesting next steps to the user. Recommendations appear as "cards" — non-disruptive notifications that feel like "by the way, you might find this useful" rather than a pitch.

### 5.2 Six Recommendation Types

From Kevin's specification:

1. **Framework / Lens usage** — "I'm noticing X. The Y lens would give us a precise reading."
2. **Lens results debriefs** — "Your PRISM results are ready. Want to walk through them?"
3. **Executive coaching session** — "We've been working on this for a few sessions. A dedicated coaching session might be the right next step."
4. **Advisory working session** — "This board presentation is complex enough that a structured working session would move it faster."
5. **Workshops** — "Your team is facing the same pattern across multiple people. A workshop might be more efficient than individual work."
6. **Team recommendation** — "Based on what you've described about your team dynamics, MOSAIC for the team would give you a map of where trust is strong and where it's thin."

### 5.3 Trust & Maturity Curve

Recommendations are gated by relationship stage. You don't propose a workshop in the first conversation.

```
STAGE 1 — INTRODUCTORY
0-1 sessions
- No recommendations beyond complimentary lenses
- Focus: build trust, demonstrate value
- Available: LEAP, PRISM (complimentary)

STAGE 2 — WORKING
2-4 sessions, 1+ lens completed
- Lens suggestions for paid instruments
- Coaching session suggestions
- Available: all standard lenses, individual coaching

STAGE 3 — DEEP
5+ sessions, 3+ lenses completed
- Advisory working session suggestions
- Multi-lens deep dive proposals
- Available: signature lenses, advisory sessions

STAGE 4 — PARTNER
Ongoing engagement, demonstrated ROI
- Team / workshop recommendations
- Enterprise proposals
- Available: full suite, team deployments
```

**Rule:** NEXUS can suggest something one stage ahead of current stage, but never two stages ahead. You can suggest a coaching session to a Stage 2 user. You can't suggest a team workshop to a Stage 1 user.

### 5.4 Recommendation Delivery — Card Format

Recommendations are delivered as cards — separate from the main conversation flow. They appear in a sidebar or as inline suggestions, never as the primary response.

**Card structure:**
```
┌─────────────────────────────────────────┐
│  [Icon] RECOMMENDATION                  │
│  Title: Short, specific, tied to them   │
│  Body: 1-2 lines, what it is and why    │
│         it's relevant right now         │
│  [Action button]  [Not now]             │
└─────────────────────────────────────────┘
```

**Card appearance rules:**
- Maximum 1 card per conversation turn
- Never interrupt the main flow — cards are supplementary
- Cards tied to the specific conversation feel organic; generic cards feel salesy
- "Not now" permanently dismisses that specific recommendation (not the category)
- Same recommendation is never shown twice without a new triggering signal

### 5.5 Recommendation Triggers

Recommendations are triggered by:
- **Pattern signal** — lens signal crosses threshold → lens suggestion card
- **Lens completion** — lens result is ready → debrief card
- **Conversation depth** — topic is complex and multi-session → coaching session card
- **Artifact analysis** — CV/article analysis reveals patterns → lens suggestion card
- **Team mentions** — user talks about team dynamics → team/workshop card
- **Milestone achievement** — user makes progress → next-level recommendation card

**No trigger = no recommendation.** NEXUS never recommends just because it can.

---

## 6. How It All Connects

### 6.1 The Full Flow

```
User speaks
    │
    ▼
U0 USER INTELLIGENCE loads context
  ├─ Who they are
  ├─ What we know
  ├─ Prior history
  └─ Trust stage
    │
    ▼
L3 PATTERN RETRIEVAL finds relevant patterns
  (weighted by user context)
    │
    ▼
L0 LENS INTELLIGENCE scores lens signals
  ├─ Pattern affinities accumulate
  ├─ Existing lens results considered
  └─ Suggestion threshold check
    │
    ▼
L4 SCENARIO CONTROLLER guides progression
  (adapted to user context)
    │
    ▼
L5 TURN ENGINE shapes response
  ├─ Main response (coaching / question / insight)
  ├─ Memory update (new insights / milestones)
  └─ R1 RECOMMENDATION ENGINE
      └─ If trigger + trust gate passed:
         → Recommendation card generated
```

### 6.2 Key Behavioral Rules

1. **Pattern first, lens second.** NEXUS always works with patterns in conversation. Lenses are suggested only when pattern signal is strong enough.
2. **Lens is instrument, not answer.** Running a lens gives data. The value is in what NEXUS does with that data in conversation.
3. **Memory is invisible but present.** NEXUS references past conversations naturally — not as "according to our records" but as "last time we were working on..."
4. **Recommendations are earned, not given.** Every recommendation is tied to something specific the user said or did. Generic recommendations feel like sales.
5. **No is a complete answer.** If the user declines a recommendation, NEXUS drops it immediately. No follow-up, no "are you sure," no repositioning.
6. **Trust moves forward, not backward.** Once a trust stage is reached, it doesn't reset. A declined recommendation doesn't lower trust.

---

## 7. Wave 7 Deliverables

| # | File | Layer | Description |
|---|------|-------|-------------|
| 1 | `06_lens_intelligence_memory_architecture_v1.0.md` | Master | This document — architectural overview |
| 2 | `07_lens_identification_system_v1.0.md` | L0 | Pattern→lens mapping, signal scoring, thresholds, 11-lens canon integration |
| 3 | `08_user_intelligence_model_v1.0.md` | U0 | User profile data model, memory structure, milestones tracker, artifact ingestion |
| 4 | `09_recommendation_engine_v1.0.md` | R1 | Trust/maturity curve, 6 recommendation types, card format, trigger logic |
| 5 | `10_system_prompt_architecture_v2.0.md` | Stack | Updated 5-layer + 3-vertical architecture, runtime assembly spec |
| 6 | `11_nexus_lens_memory_engine_v1.0.py` | Engine | Python implementation: UserIntel + LensScorer + RecommendationEngine |
| 7 | `nexus_demo_showcase_v3.0.html` | UI | Updated demo with context panel, lens suggestions, recommendation cards |

---

## 8. Quality & Compliance

- ✅ All user-facing language follows FT/Economist register
- ✅ Zero hard-ban word violations
- ✅ White space / iceberg principle — lens suggestions say 1/8, user fills 7/8
- ✅ No sales language — recommendations are suggestions, not pitches
- ✅ Luxury consultant tone — doctor-like, confident, low-pressure
- ✅ User privacy and control baked into memory layer design
- ✅ Brand voice consistency across all three new layers

---

*End of Lens Intelligence & Memory Architecture v1.0*
