# NEXUS — Lens Identification System v1.0

**Phase:** 4 | **Wave:** 7 | **Layer:** L0
**Status:** Active
**Input:** 164 pattern cards (Knowledge Base v3.1)
**Output:** Lens signal scoring + suggestion triggers
**Canon:** Diagnostic Canon Package v1.0 (11 lenses)

---

## 1. What This Layer Does

The Lens Identification System sits between pattern recognition and the user experience. It takes the patterns NEXUS identifies in conversation and maps them to diagnostic lenses — but only when the signal is strong enough.

**Rule:** NEXUS never leads with a lens. Patterns come first. Lenses are suggested only when pattern accumulation makes it obvious that a specific diagnostic would add precision.

---

## 2. The 11 Lenses — Quick Reference

| ID | Lens Name | Full Name | Duration | Tier | Pillar |
|----|-----------|-----------|----------|------|--------|
| L01 | CPI | China Leadership Pipeline Index | 5mi | Flagship | P1 |
| L02 | LEAP | Competitive Positioning | 1mi | Light | P1 |
| L03 | COACH | Executive Coaching Fit | 2mi | Standard | P1 |
| L04 | PRISM | Professional Branding | 2mi | Standard | P3 |
| L05 | IMPACT | Board & Stakeholder Impact | 2mi | Standard | P3 |
| L06 | QUEST | Strategic Market Positioning | 2mi | Standard | P3 |
| L07 | BRIDGE | Cross-Cultural Relational Intelligence | 3mi | Signature | P2 |
| L08 | MOSAIC | Institutional Trust & Relationship Velocity | 3mi | Signature | P2 |
| L09 | DRIVE | Motivational Alignment | 2mi | Standard | P2 |
| L10 | SPARK | AI Leadership Readiness | 3mi | Signature | P4 |
| L11 | FORGE | Sales Excellence Capability | 3mi | Signature | P4 |

---

## 3. Pattern → Lens Affinity System

### 3.1 Scoring

Each pattern card has an affinity score for each lens. Score range: 0-3.

| Score | Meaning | Implication |
|-------|---------|-------------|
| 0 | No connection | This pattern doesn't indicate anything about this lens |
| 1 | Tangential | This pattern can appear in many contexts; the lens is one possible frame |
| 2 | Relevant | This pattern commonly appears when this lens would add real value |
| 3 | Diagnostic | This pattern is a primary indicator — a strong signal that this lens is needed |

### 3.2 Signal Accumulation

As NEXUS identifies patterns in a conversation, lens signals accumulate.

**Signal = sum of affinity scores for all activated patterns**

**Per-pattern contribution is capped:**
- First activation of a pattern: full affinity score
- Subsequent mentions of same pattern: 0 (no additional signal)
- Rationale: you either see the pattern or you don't. Repeating it doesn't make the lens more indicated.

### 3.3 Signal Thresholds

| Signal Range | Status | NEXUS Behavior |
|-------------|--------|----------------|
| 0-2 | Dormant | Lens is not active in NEXUS's thinking |
| 3-4 | Background | NEXUS views the situation through this lens but doesn't name it |
| 5-6 | Active | NEXUS references lens-like concepts in conversation but doesn't suggest the lens |
| 7+ | Suggestible | NEXUS may suggest running the lens, if the conversation provides a natural opening |

**Hard rule:** No lens suggestion before signal 7. No exceptions.

### 3.4 Conversation Opening Required

Even at signal 7+, NEXUS doesn't suggest the lens unless the conversation provides a natural opening. A natural opening is:

- User expresses confusion or uncertainty about the pattern
- User asks "what should I do about this?"
- User expresses desire for more clarity or precision
- User asks "how do I know if this is really the issue?"
- A milestone is reached and next steps are being discussed

**Forced suggestions are forbidden.** If no opening exists, NEXUS continues the conversation. The signal stays active. The suggestion waits.

---

## 4. Pattern → Lens Mapping — Core Affinities

Below are the primary pattern-to-lens affinities (score 2-3 only). This is the core mapping. The full 164-card mapping is implemented as a data structure in the engine.

### 4.1 LEAP (Competitive Positioning) — L02

**What it diagnoses:** How strong is the user's competitive position in their market?

**High-affinity patterns (score 3):**
- Invisible Value Syndrome — strong work, weak market perception
- Commoditization Trap — being compared on price/titles rather than value
- Positioning Drift — unclear or inconsistent market positioning
- Talent Market Arbitrage — market undervalues their specific background

**Relevant patterns (score 2):**
- Reference Level Problem — benchmarking against wrong peer set
- Cross-Border Discount — international background undervalued in local market
- Narrow Framing Problem — defined too narrowly by current role
- First 90 Days Pressure — transition where positioning clarity is critical

### 4.2 COACH (Executive Coaching Fit) — L03

**What it diagnoses:** Is the user ready to benefit from coaching, and what kind?

**High-affinity patterns (score 3):**
- Executive Isolation — no one to talk to at their level
- Stuck Loop — repeating the same pattern without progress
- The Ambiguity Gap — knowing something's off but can't name it
- Action Addiction — doing more instead of thinking differently

**Relevant patterns (score 2):**
- Imposter Syndrome Variant — feeling like they don't belong
- Overfunctioning Trap — carrying more than their share
- Decision Fatigue Cascade — too many decisions, poor quality
- Success Trap — past success creates blind spots

### 4.3 PRISM (Professional Branding) — L04

**What it diagnoses:** How does the user's professional brand land?

**High-affinity patterns (score 3):**
- Invisible Value Syndrome — contributions under-recognized
- Stakeholder Perception Gap — how they're seen ≠ how they think they're seen
- Executive Presence Mismatch — presence doesn't match level
- Reference Level Problem — benchmarking against wrong standard

**Relevant patterns (score 2):**
- Narrow Framing Problem — defined too narrowly
- The Transparency Paradox — over-sharing in wrong places
- Cultural Code Mismatch — signaling doesn't land in target culture
- Commoditization Trap — perceived as interchangeable

### 4.4 IMPACT (Board & Stakeholder Impact) — L05

**What it diagnoses:** How effective is the user with boards and key stakeholders?

**High-affinity patterns (score 3):**
- Board Level Blind Spot — missing what the board actually cares about
- Stakeholder Map Blind Spot — misreading who actually influences outcomes
- Executive Presence Mismatch — C-suite presence gap
- Strategic Narrative Gap — can't tell the story that moves stakeholders

**Relevant patterns (score 2):**
- The Preparation Paradox — over-preparing wrong things
- Quiet Influence Problem — under-estimating their own impact
- Power Without Authority — influence without formal control
- Trust Velocity Gap — building trust too slowly with stakeholders

### 4.5 QUEST (Strategic Market Positioning) — L06

**What it diagnoses:** How strong is the user's strategic positioning in their market?

**High-affinity patterns (score 3):**
- Positioning Drift — unclear strategic direction
- Commoditization Trap — competing on wrong dimensions
- Market Entry Friction — entering a new market with wrong approach
- Strategic Narrative Gap — can't articulate strategic position

**Relevant patterns (score 2):**
- Cross-Border Discount — international value not recognized locally
- Reference Level Problem — wrong market benchmark
- Narrow Framing Problem — too narrowly defined
- Cultural Code Mismatch — strategic message doesn't land in target culture

### 4.6 BRIDGE (Cross-Cultural Relational Intelligence) — L07

**What it diagnoses:** How well does the user navigate cross-cultural relationships?

**High-affinity patterns (score 3):**
- Cultural Code Mismatch — signals don't translate
- Cross-Border Discount — international background undervalued
- Trust Velocity Gap — building trust slowly across cultures
- Translation Engine Failure — ideas get lost in cultural translation

**Relevant patterns (score 2):**
- High-Context / Low-Context Gap — communication style mismatch
- Institutional Cultural Gap — different organizational cultures
- Face Dynamics — misreading face-saving patterns
- Global-Local Tension — HQ vs local subsidiary dynamics

### 4.7 MOSAIC (Institutional Trust & Relationship Velocity) — L08

**What it diagnoses:** How quickly and deeply does the user build institutional trust?

**High-affinity patterns (score 3):**
- Trust Velocity Gap — building trust too slowly
- Stakeholder Map Blind Spot — misreading relationship networks
- Institutional Cultural Gap — different organizational trust cultures
- Relationship Equity Drain — relationships depreciating faster than building

**Relevant patterns (score 2):**
- The Transparency Paradox — over-sharing erodes trust
- Quiet Influence Problem — under-estimating relationship impact
- Face Dynamics — trust damaged by face missteps
- Power Without Authority — relying on relationships vs formal authority

### 4.8 DRIVE (Motivational Alignment) — L09

**What it diagnoses:** Is the user's motivation aligned with their current path?

**High-affinity patterns (score 3):**
- Motivational Drift — losing connection to what drives them
- Success Trap — achieving someone else's definition of success
- Executive Isolation — feeling disconnected from purpose
- Plateau Paradox — at the top, questioning the climb

**Relevant patterns (score 2):**
- Stuck Loop — repeating without progress
- The Ambiguity Gap — unclear what they actually want
- Action Addiction — filling void with activity
- Imposter Syndrome Variant — success doesn't feel real

### 4.9 SPARK (AI Leadership Readiness) — L10

**What it diagnoses:** How ready is the user to lead in an AI-transformed environment?

**High-affinity patterns (score 3):**
- AI Adoption Chasm — gap between AI potential and actual leadership use
- Digital Fluency Gap — leadership confidence with AI/tech
- AI Integration Blind Spot — missing where AI adds most value
- Change Saturation Point — too many initiatives, AI adds more noise

**Relevant patterns (score 2):**
- Skill Obsolescence Curve — current skills depreciating
- Strategic Narrative Gap — can't articulate AI vision
- Decision Fatigue Cascade — AI adds decision complexity
- Institutional Cultural Gap — culture resists AI adoption

### 4.10 FORGE (Sales Excellence Capability) — L11

**What it diagnoses:** How strong is the user's sales and revenue generation capability?

**High-affinity patterns (score 3):**
- Revenue Leak Blind Spot — leaving money on the table
- Value Articulation Gap — can't quantify and communicate value
- Pipeline Velocity Problem — deals move too slowly or stall
- Relationship-Conversion Gap — strong relationships, weak conversion

**Relevant patterns (score 2):**
- Commoditization Trap — competing on price
- Positioning Drift — unclear value proposition
- Trust Velocity Gap — slow trust-building slows deals
- Strategic Narrative Gap — can't tell the story that sells

### 4.11 CPI (China Leadership Pipeline Index) — L01

**What it diagnoses:** Flagship 360° leadership pipeline assessment for China market leaders.

**CPI is different.** It's the flagship, 5-mile instrument. It's not triggered by single patterns — it's suggested when multiple lenses are active simultaneously and the user is at a China-relevant leadership inflection point.

**CPI suggestion trigger:**
- Minimum 3 other lenses at signal 5+ (multi-dimensional pattern signal)
- China-relevant context present (role, market, or patterns indicate China leadership)
- Trust stage ≥ Working (Stage 2+)
- Natural opening in conversation

**Reason:** CPI is the flagship. It's not an entry-level instrument. It should feel like a comprehensive deep-dive that's only offered when we already know the user well enough to know it would be genuinely valuable.

---

## 5. Lens Suggestion Protocol

### 5.1 When to Suggest

A lens may be suggested when ALL of these are true:
1. ✅ Signal ≥ 7
2. ✅ Conversation provides a natural opening
3. ✅ Trust stage is appropriate (see R1 Recommendation Engine)
4. ✅ User hasn't already completed this lens
5. ✅ No other lens suggestion was made in the last 3 turns

### 5.2 How to Suggest — The Three-Line Format

**Line 1 — Connect to what they just said:**
"What you're describing — [specific thing they said] —"

**Line 2 — Name the lens and what it measures:**
"— is exactly what [Lens Name] measures. It's a [duration] instrument that gives you [one specific benefit]."

**Line 3 — Low-friction invitation:**
"If you're curious, I can run it now. No pressure either way."

**Example (PRISM at signal 8):**
> "What you're describing — the gap between how you see your contribution and how stakeholders seem to perceive it — is exactly what PRISM measures. It's a 20-minute instrument that gives you a precise reading on how your professional brand lands across four dimensions. If you're curious, I can run it now. No pressure either way."

### 5.3 What Not to Do

❌ Don't lead with "you should" — it's a suggestion, not a prescription
❌ Don't list benefits like a sales page — one specific benefit is enough
❌ Don't mention cost unless they ask — it kills the flow
❌ Don't push if they decline — "no problem" and back to the conversation
❌ Don't suggest multiple lenses at once — overwhelm = no

### 5.4 Decline Handling

If the user says no, not now, or anything that isn't yes:
- "No problem at all."
- Immediately return to the previous conversation thread
- Don't mention the lens again unless new patterns push signal significantly higher
- Mark the recommendation as "dismissed" — don't resurface the same suggestion

---

## 6. Lens Results Integration

When a user completes a lens:

1. **Result stored in User Intelligence (U0)** — full report + date + key findings extracted
2. **Debrief offered** — "Your [Lens Name] results are ready. Want to walk through what they mean?"
3. **Findings become patterns** — key lens findings are converted to pattern-level insights and added to conversation context
4. **Signal resets** — this lens is no longer "suggestible" (it's been done). But the results feed into other lens signals.
5. **Trust advances** — completing a lens moves trust stage forward (more data = deeper work possible)

**Important design choice:** Lens results are inputs to coaching, not verdicts. NEXUS never says "your PRISM score is 62, so you're bad at branding." NEXUS says "PRISM shows a gap between how you see your contribution and how stakeholders perceive it. That's useful data — let's work with it."

---

## 7. Implementation Notes

### 7.1 Data Structure

The pattern-to-lens mapping is implemented as a dictionary:
```python
pattern_lens_affinity = {
    "pattern_name": {
        "L02_LEAP": 2,
        "L04_PRISM": 3,
        "L06_QUEST": 1,
        # ... other lenses with non-zero affinity
    }
}
```

### 7.2 Signal Calculation

```python
def calculate_lens_signals(activated_patterns):
    signals = defaultdict(int)
    seen_patterns = set()
    for pattern in activated_patterns:
        if pattern in seen_patterns:
            continue
        seen_patterns.add(pattern)
        affinities = pattern_lens_affinity.get(pattern, {})
        for lens, score in affinities.items():
            signals[lens] += score
    return signals
```

### 7.3 Suggestion Check

```python
def should_suggest_lens(lens_signal, trust_stage, conversation_opening,
                        lens_already_completed, recent_suggestion_count):
    return (
        lens_signal >= 7 and
        conversation_opening and
        trust_stage_supports_lens(trust_stage, lens) and
        not lens_already_completed and
        recent_suggestion_count == 0
    )
```

---

## 8. Quality & Compliance

- ✅ No hard-ban word violations in suggestion scripts
- ✅ White space / iceberg principle — say 1/8 about the lens, let user fill the rest
- ✅ Luxury consultant tone — confident, low-pressure, doctor-like
- ✅ No sales language — suggestions, not pitches
- ✅ User autonomy respected — "no pressure either way" is mandatory
- ✅ FT/Economist register in all user-facing text

---

*End of Lens Identification System v1.0*
