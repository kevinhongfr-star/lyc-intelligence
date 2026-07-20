# T-113: Gated Archetype Result Page Template

**Phase:** 1 | **Batch:** 1D | **Effort:** 1 day
**CD Source:** CD10, CD11, CD16
**Depends On:** T-101 (design system components), T-001 (API), T-002 (classification), T-003 (modifiers)
**Blocks:** None (used by all diagnostic pages)

---

## What to Build

A reusable result page template that all 9 diagnostic instruments use to display archetype results. This is the core monetization page — it's where the free→gated conversion happens.

## Gating Model (Kevin's Decision)

```
FREE TIER                    EMAIL GATE                    FULL REPORT
─────────────────────────    ──────────────────────────    ──────────────────────────
Archetype name               Email address form            Full dimension radar chart
1-paragraph description      Submit → unlock               Modifier readout (all)
Instrument color                                          Confidence indicator
Archetype icon                                           Core strength (detailed)
                             (Resend integration)          Key risk (detailed)
                                                           Development priorities (3)
                                                           Share button
```

## Template Components

### `components/ArchetypeResult.tsx`

Props:
- `result: AssessmentResult` (from T-001 API)
- `isGated: boolean` (whether user has unlocked via email)
- `instrumentColor: string` (from design system)
- `archetypeIcon: string` (SVG path from design system)

### Free Tier Display

```
┌─────────────────────────────────┐
│  [Archetype Icon]               │
│                                 │
│  Your Archetype: [Name]         │
│  Instrument: [Color Bar]        │
│                                 │
│  [1-paragraph description]      │
│                                 │
│  ─────────────────────────────  │
│  🔒 Unlock your full report     │
│  [Email input] [Submit]         │
│  ─────────────────────────────  │
└─────────────────────────────────┘
```

### Gated (Full) Report Display

```
┌─────────────────────────────────┐
│  [Archetype Icon]               │
│  Your Archetype: [Name]         │
│  Confidence: [indicator]        │
│                                 │
│  ┌─── Radar Chart ───┐          │
│  │  [Dimensions]      │          │
│  └────────────────────┘          │
│                                 │
│  Modifiers:                     │
│  • AI Readiness: [value]        │
│  • APAC Credibility: [value]    │
│  • ...                          │
│                                 │
│  ✅ Core Strength: [detailed]   │
│  ⚠️ Key Risk: [detailed]        │
│                                 │
│  Development Priorities:        │
│  1. [priority 1]                │
│  2. [priority 2]                │
│  3. [priority 3]                │
│                                 │
│  [Share Result] [Download PDF]  │
└─────────────────────────────────┘
```

## Email Gate Integration

- Use Resend for email delivery (Kevin's decision — keep existing)
- On email submit: `POST /api/assessment/unlock` with `{ result_id, email }`
- Resend tag: `archetype_unlocked_[instrument]` for segmentation
- After submit: show full report inline (no page reload)

## Acceptance Criteria

- [ ] Template renders with any instrument's AssessmentResult
- [ ] Free tier shows archetype name + teaser only
- [ ] Email gate form works and integrates with Resend
- [ ] After email submit: full report displays (radar chart + modifiers + strengths/risks/dev priorities)
- [ ] Radar chart uses RadarChart component (T-101)
- [ ] Share button generates shareable URL
- [ ] Mobile responsive
- [ ] Works as a route: `/assess/[instrument]/result/[id]`

## Technical Notes

- This is a template — each diagnostic page (T-106 to T-112) instantiates it with their specific data
- The email gate is the KEY conversion point — make it prominent but not aggressive
- "Transitional" archetype status (confidence < 0.6) should display as: "Your primary archetype is [Name] — you're in a transitional phase, showing strong traits of [secondary archetype] too"
