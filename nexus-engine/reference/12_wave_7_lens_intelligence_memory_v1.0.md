# Wave 7 — Lens Intelligence + Memory + Recommendation Architecture

**Phase:** 4 | **Wave:** 7 | **Status:** Complete
**Previous:** Wave 6 — S21/S22 + Pricing v5.0
**This wave:** 3 vertical layers added to the 5-layer horizontal stack

---

## What We Built

Three vertical intelligence layers that run alongside the existing 5-layer horizontal stack. These aren't layers on top — they feed into every layer, making NEXUS remember, see patterns that point to diagnostics, and suggest next steps subtly.

### Architecture v2.0

```
                    ┌─────────────────────────┐
                    │  R1 RECOMMENDATION      │
                    │  ENGINE                 │
                    │  subtle · trust-based   │
                    └────────────┬────────────┘
                                 │ feeds
                    ┌────────────▼────────────┐
                    │  L0 LENS INTELLIGENCE   │
                    │  pattern → lens         │
                    │  signal · suggestion    │
                    └────────────┬────────────┘
                                 │ feeds
                    ┌────────────▼────────────┐
                    │  U0 USER INTELLIGENCE   │
                    │  context · memory       │
                    │  milestones · artifacts │
                    └────────────┬────────────┘
                                 │
  ┌──────────────────────────────┼──────────────────────────────┐
  │  L5 Turn Engine · L4 Scenario · L3 Patterns                  │
  │  L2 Quality System · L1 Core Identity                        │
  └──────────────────────────────────────────────────────────────┘
```

---

## Layer U0 — User Intelligence

**What it does:** Structured memory of who this person is and what you've done together. Summaries, not transcripts.

Six modules:
1. **Identity Context** — role, company, industry, level, geography. Built from conversation, never from a form.
2. **Artifacts** — CV, articles, 360 reviews, portfolio. Analyzed for patterns, key findings extracted.
3. **Assessment History** — all 11 lens results, with key findings and score trajectories.
4. **Conversation Memory** — active threads, session summaries, durable insights, archive.
5. **Milestones Tracker** — goals, progress, action items, target dates.
6. **Trust & Maturity** — 4-stage trust curve, what's recommendable at each stage.

**Design principle:** A good coach remembers what matters — not every word, but the important stuff.

---

## Layer L0 — Lens Intelligence

**What it does:** Bridges pattern recognition (164 cards) to the 11 diagnostic lenses. NEXUS never leads with a lens — patterns come first.

### How it works

- Every pattern card has an affinity score (0-3) for each lens
- As patterns activate in conversation, lens signals accumulate
- Signal thresholds: dormant (0-2) → background (3-4) → active (5-6) → suggestible (7+)
- **Hard rule:** No lens suggestion before signal 7. No exceptions.

### Suggestion protocol (3-line format)

1. Connect to what they just said
2. Name the lens and what it measures
3. Low-friction invitation: "If you're curious, I can run it now. No pressure either way."

### 11 lenses in the canon

CPI (flagship, 5mi) · LEAP (complimentary, 1mi) · COACH (2mi) · PRISM (complimentary, 2mi) · IMPACT (2mi) · QUEST (2mi) · BRIDGE (signature, 3mi) · MOSAIC (signature, 3mi) · DRIVE (2mi) · SPARK (signature, 3mi) · FORGE (signature, 3mi)

**CPI is different:** flagship 5-mile instrument, triggered only when 3+ lenses are active simultaneously AND user is China-relevant AND trust stage ≥ Working.

---

## Layer R1 — Recommendation Engine

**What it does:** Subtle, trust-aligned suggestions. Card-based. Never disruptive.

### Six recommendation types

1. **Framework / Lens usage** — "Run this diagnostic for a more precise reading"
2. **Lens results debriefs** — "Your results are ready — let's walk through them"
3. **Executive coaching session** — "A dedicated session would move this faster"
4. **Advisory working session** — "A structured working session on this specific deliverable"
5. **Workshops** — "A team workshop would be more efficient"
6. **Team recommendation** — "Your team would benefit from X assessment"

### Trust curve (4 stages)

| Stage | When | What's available |
|-------|------|-----------------|
| 1 Introductory | 0-1 sessions | Complimentary lenses (LEAP, PRISM) |
| 2 Working | 2-4 sessions + 1+ lens | All standard lenses, coaching sessions |
| 3 Deep | 5+ sessions + 3+ lenses | Signature lenses, advisory sessions |
| 4 Partner | Ongoing + ROI | Team workshops, enterprise |

**One-stage-ahead rule:** NEXUS can suggest things from the next stage up, but never two stages ahead.

### Card rules

- Max 1 card per turn. Never interrupts the main response.
- "Not now" = gone forever for that specific recommendation.
- Trust never decreases. A declined recommendation doesn't cost trust.
- No is a complete answer.

### The core metaphor

NEXUS is a luxury consultant, not a salesperson.
- Salesperson: identifies pain → amplifies → presents solution → overcomes objections → closes
- Luxury consultant: understands the situation → sees what would help → mentions it once, low pressure → lets the client decide

---

## Files Delivered (7 files)

| # | File | Description |
|---|------|-------------|
| 1 | `06_lens_intelligence_memory_architecture_v1.0.md` | Master architectural overview — 3 vertical layers concept |
| 2 | `07_lens_identification_system_v1.0.md` | Pattern→lens mapping, signal scoring, 11-lens canon, suggestion protocol |
| 3 | `08_user_intelligence_model_v1.0.md` | 6-module user profile: identity, artifacts, assessments, memory, milestones, trust |
| 4 | `09_recommendation_engine_v1.0.md` | Trust/maturity curve, 6 recommendation types, card format, trigger logic |
| 5 | `10_system_prompt_architecture_v2.0.md` | Updated architecture — 5-layer stack + 3 vertical layers |
| 6 | `demo_engine/nexus_lens_memory_engine_v1.0.py` | Python implementation: UserIntel + LensScorer + RecommendationEngine (verified working) |

---

## Phase 4 Progress

**~96%** (7 of ~8 waves complete)

What's done:
- ✅ Wave 1 — Demo Build Spec
- ✅ Wave 2 — System Prompt Architecture (5-layer stack)
- ✅ Wave 3 — 5 happy-path dialogue scripts
- ✅ Wave 4 — Demo Engine v1.0 + Interactive Showcase
- ✅ Wave 5 — Real LLM Conversation v1.0
- ✅ Wave 6 — S21 + S22 scenarios (pricing removed from scope)
- ✅ Wave 7 — Lens Intelligence + Memory + Recommendation Engine

What's left:
- One more wave to close it out — could be:
  - A) Full integration of Wave 7 into the live LLM demo
  - B) Showcase v3.0 UI with context panel + recommendation cards
  - C) Phase 4 final QA pass + official v1.0 close

---

*Wave 7 complete.*
