# NEXUS — User Intelligence Model v1.0

**Phase:** 4 | **Wave:** 7 | **Layer:** U0
**Status:** Active
**Purpose:** Structured user context that accumulates across sessions
**Design principle:** Summaries, not transcripts. Useful and private.

---

## 1. What This Layer Does

User Intelligence is NEXUS's memory of who you are and what you've done together. It's not a transcript dump — it's a structured, curated profile that gets more useful with every interaction.

The principle: a good coach remembers what matters. They don't need to review every word you've ever said — they remember the important stuff: your goals, your patterns, what you've tried, what worked, what didn't. That's what this layer is.

---

## 2. Data Model — Six Modules

```
USER INTELLIGENCE PROFILE
├── 1. IDENTITY CONTEXT       (who they are)
├── 2. ARTIFACTS              (what they've shared)
├── 3. ASSESSMENT HISTORY     (what lenses they've run)
├── 4. CONVERSATION MEMORY    (what we've talked about)
├── 5. MILESTONES TRACKER     (what we're working toward)
└── 6. TRUST & MATURITY       (where the relationship is)
```

---

## 3. Module 1 — Identity Context

### 3.1 Purpose

The basic facts about who this person is. Used to weight pattern retrieval, frame suggestions, and avoid asking redundant questions.

### 3.2 Fields

| Field | Source | Update Frequency |
|-------|--------|-----------------|
| Name | User statement / artifact | Set once |
| Current role | User statement / CV | When changes |
| Company | User statement / artifact | When changes |
| Level | Inferred from role + pattern | When changes |
| Industry | User statement / artifact | When changes |
| Function | User statement / artifact | When changes |
| Geography / base | User statement / pattern | When changes |
| Career stage | Inferred from patterns + artifacts | Every few sessions |
| Transition status | Inferred from conversation | When changes |
| Key people mentioned | Conversation extraction | Per session |

### 3.3 Rules

- **Inferred, not interrogated.** NEXUS builds identity context from conversation, not from a form. If the user mentions they work at a CPG company in Shanghai, that's added to context. No "please fill out your profile."
- **Assumptions are provisional.** Anything NEXUS infers is held lightly. If new information contradicts it, it updates without fanfare.
- **Never read back like a dossier.** NEXUS doesn't say "according to your profile, you're a VP at a CPG company." It just knows.

---

## 4. Module 2 — Artifacts

### 4.1 Purpose

Documents and materials the user shares. These are analyzed, key insights extracted, and then fed into conversation context.

### 4.2 Artifact Types

| Type | What NEXUS Extracts | Lens Signals Triggered |
|------|---------------------|----------------------|
| CV / Resume | Career trajectory, patterns of progression, gaps, positioning | LEAP, PRISM, DRIVE, CPI |
| Articles / writing samples | Thinking style, positioning, strengths as a thinker | PRISM, IMPACT, QUEST |
| Leadership essays | Leadership philosophy, self-concept, maturity level | IMPACT, DRIVE, COACH, CPI |
| Portfolio / case studies | Work quality, impact narrative, value articulation | FORGE, IMPACT, PRISM |
| 360 review results | Stakeholder perception gaps, blind spots | IMPACT, PRISM, BRIDGE, MOSAIC |
| Performance reviews | Manager feedback, growth areas, strengths | IMPACT, DRIVE, COACH |
| Other documents | Varies by content | Varies |

### 4.3 Ingestion Process

When a user uploads an artifact:

1. **Acknowledgment** — "Got it, I'll read through this."
2. **Analysis** — NEXUS reads the document and extracts structured insights
3. **Insight summary** — 3-5 key observations about what the document reveals
4. **Pattern extraction** — which patterns from the knowledge base are visible in the document
5. **Lens signal update** — accumulated patterns push relevant lens signals up
6. **Memory update** — key insights added to conversation memory
7. **Conversation opening** — NEXUS mentions what stood out and asks what the user wants to do with it

### 4.4 Artifact Rules

- **NEXUS reads but doesn't judge.** "Here's what I see" not "here's how good/bad this is."
- **Patterns, not evaluations.** The output is pattern identification, not a score or grade.
- **User controls access.** Uploaded artifacts can be removed at any time.
- **Insights are debatable.** NEXUS presents observations, the user can push back and correct.

---

## 5. Module 3 — Assessment History

### 5.1 Purpose

Record of all lenses the user has completed, with results and key findings. These feed into future conversations and prevent redundant diagnostics.

### 5.2 Record Structure

```
LENS RESULT RECORD
├── Lens ID + name
├── Date completed
├── Overall score / profile
├── Dimension scores (3-5 per lens)
├── Key findings (3-5 bullet points)
├── Where they scored highest
├── Where the biggest gaps are
└── Conversation insights extracted
    (what this result tells us about their situation)
```

### 5.3 How Results Are Used

- **In conversation** — NEXUS references lens findings naturally: "Looking at your IMPACT results, the stakeholder perception gap on your direct reports side is interesting in the context of this promotion conversation."
- **For lens suggestions** — already-completed lenses are never suggested again. But results from one lens can increase signal for other lenses.
- **For progression** — lens results feed into milestones and goal-setting.
- **For memory** — key findings are elevated to conversation memory as durable insights.

### 5.4 Results Dashboard

The user has an intelligence dashboard where they can see:
- All completed lenses with results
- Score trajectories (if same lens taken multiple times)
- Pattern map across all diagnostics
- Key insights summary
- Recommendations based on collective findings

**Design:** The dashboard is a reference, not a destination. NEXUS brings relevant findings into conversation — the user doesn't have to go dig them up.

---

## 6. Module 4 — Conversation Memory

### 6.1 Purpose

What we've discussed, what we've discovered, what's been resolved. Structured summaries across sessions.

### 6.2 Memory Structure

```
CONVERSATION MEMORY
├── Active Threads
│   ├── Open topics currently being explored
│   ├── Each with: topic, current phase, key insights, next step
│   └── Max 5 active threads (oldest archived when new ones open)
│
├── Session Summaries
│   ├── Per session: date, scenario, key insights
│   ├── Patterns identified
│   ├── Decisions made
│   └── Action items / commitments
│
├── Durable Insights
│   ├── Cross-session findings that hold up
│   ├── Core patterns about this person
│   ├── Recurring themes
│   └── What they respond well to / don't respond to
│
└── Archive
    ├── Closed threads (resolved or inactive 30+ days)
    └── Historical sessions (all, but summarized)
```

### 6.3 How Memory Feeds Into Conversation

- **Session opening** — "Last time we were working through the stakeholder dynamics around your promotion. Where are you with that?"
- **Pattern continuity** — when a pattern from a prior session appears again, NEXUS connects the dots
- **Avoiding repetition** — NEXUS doesn't ask the same questions or re-explain the same concepts
- **Milestone referencing** — "You mentioned wanting to be ready for the board presentation by mid-September. That's three weeks out."

### 6.4 Memory Rules

- **Summaries, not transcripts.** Long-term memory stores structured insights, not raw conversation. This is more useful and respects privacy.
- **Memory decays gracefully.** Details from sessions long ago fade to higher-level summaries. Recent conversations are more vivid.
- **User is always right.** If the user corrects NEXUS's memory ("that's not quite what I meant"), NEXUS updates immediately without argument.
- **No memory as a weapon.** NEXUS never uses past statements against the user or says "but you said..." in a gotcha way.

---

## 7. Module 5 — Milestones Tracker

### 7.1 Purpose

Goals, progress markers, and action items. NEXUS helps the user track what they're working toward and checks in on progress.

### 7.2 Milestone Structure

```
MILESTONE
├── Goal statement (user's words, not NEXUS's)
├── Category (career transition / promotion / leadership / etc.)
├── Priority (high / medium / low)
├── Status (not started / in progress / blocked / achieved)
├── Target date (if user specified one)
├── Sub-steps / milestones
│   ├── Each with status and target date
│   └── Each tied to patterns / lens findings
├── NEXUS support role
│   └── What NEXUS is helping with on this goal
└── Related artifacts / lens results
```

### 7.3 How Milestones Are Used

- **Natural check-ins** — "How's the presentation prep going? You were targeting mid-September."
- **Pattern-milestone connection** — NEXUS links patterns identified in conversation to milestone progress
- **Lens-milestone connection** — lens results can create or update milestones
- **Progress celebration** — when a milestone is hit, NEXUS acknowledges it (briefly, not effusively)

### 7.4 Milestone Rules

- **User owns the goals.** NEXUS never sets goals for the user. Goals come from what the user says they want.
- **NEXUS reflects, doesn't drive.** "You mentioned wanting X — here's what I see about progress toward that."
- **No pressure.** Milestones are tracking tools, not KPIs. If something slips, NEXUS asks what's happening, not why it's late.
- **Max 3 active milestones** at any time. More than that dilutes focus.

---

## 8. Module 6 — Trust & Maturity

### 8.1 Purpose

Where the relationship is at. Determines what recommendations are appropriate, how deep NEXUS can go, and what kind of interventions land well.

### 8.2 Trust Stages

See R1 Recommendation Engine for full trust curve details.

| Stage | Name | Trigger | What's Available |
|-------|------|---------|-----------------|
| 1 | Introductory | 0-1 sessions | Complimentary lenses only (LEAP, PRISM) |
| 2 | Working | 2-4 sessions + 1+ lens | All standard lenses, coaching sessions |
| 3 | Deep | 5+ sessions + 3+ lenses | Signature lenses, advisory sessions |
| 4 | Partner | Ongoing + demonstrated ROI | Team workshops, enterprise |

### 8.3 Trust Signals

Trust advances based on:
- **Session count** — more sessions = deeper trust (up to a point)
- **Lens completion** — completing a lens is an act of trust
- **Disclosure depth** — how vulnerable / specific the user is being
- **Recommendation acceptance** — accepting suggestions shows trust
- **Artifact sharing** — sharing personal documents shows trust
- **Return rate** — coming back voluntarily is the strongest signal

**Trust never goes backward.** A declined recommendation doesn't lower trust. A long gap between sessions doesn't lower trust. Trust is cumulative.

---

## 9. Runtime Integration

### 9.1 Where User Intelligence Injects Into the Stack

```
EVERY CONVERSATION TURN:
  │
  ├─ U0 → L1 (Core Identity)
  │    User context shapes how NEXUS positions itself
  │
  ├─ U0 → L3 (Pattern Context)
  │    Pattern retrieval weighted by user context
  │    (e.g., CPG patterns surface first for CPG execs)
  │
  ├─ U0 → L4 (Scenario Controller)
  │    Scenario adapts to known context
  │    (skip basic questions if CV is on file)
  │
  ├─ U0 → L5 (Turn Engine)
  │    References active milestones, open threads
  │    Memory check-in at conversation start
  │
  ├─ U0 → L0 (Lens Intelligence)
  │    Assessment history: which lenses done, signal from results
  │
  └─ U0 → R1 (Recommendation Engine)
       Trust stage determines what's recommendable
```

### 9.2 Memory Update Cycle

At the end of each session (or periodically during long sessions):

1. **Extract key insights** — what did we learn this session?
2. **Update active threads** — progress made, new threads opened, threads closed
3. **Update milestones** — any movement on tracked goals
4. **Update identity context** — any new information about who they are
5. **Update lens signals** — new patterns accumulated this session
6. **Update trust stage** — has trust advanced?
7. **Generate session summary** — 3-5 bullet points, stored in memory

---

## 10. Privacy & Control

### 10.1 User Controls

- **Pause memory** — user can say "don't remember this conversation"
- **Clear memory** — user can wipe all accumulated context (reset to zero)
- **Remove specific items** — user can say "forget that thing I said about X"
- **Export** — user can export all their data
- **No data sharing** — user data is never shared with third parties

### 10.2 Data Minimization

- NEXUS only remembers what's useful for coaching
- Transient details (specific dates, names of acquaintances) aren't retained unless clearly relevant
- Old sessions are compressed to higher-level summaries
- Memory is structured — never a raw transcript dump

---

## 11. Quality & Compliance

- ✅ Memory is a coaching tool, not a surveillance tool
- ✅ User controls what's remembered
- ✅ No hard-ban word violations in any memory-related UI text
- ✅ White space / iceberg principle — memory is referenced naturally, not enumerated
- ✅ Trust model is user-centric — trust is earned by NEXUS, not demanded
- ✅ All artifact analysis follows pattern framework, never gives unsolicited evaluations

---

*End of User Intelligence Model v1.0*
