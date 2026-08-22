# NEXUS — Recommendation Engine v1.0

**Phase:** 4 | **Wave:** 7 | **Layer:** R1
**Status:** Active
**Purpose:** Subtle, trust-aligned suggestions for next steps
**Design principle:** Like a doctor or luxury consultant — earned, not sold. Carded, not pushed.

---

## 1. What This Layer Does

The Recommendation Engine decides when and how to suggest something beyond the current conversation — a lens, a coaching session, a workshop. It's the commercial layer, but it's designed to never feel commercial.

**Core principle:** A good consultant doesn't sell. They see what you need and mention it at the right moment, in the right way. If you say no, they drop it immediately.

This engine is that principle, structured.

---

## 2. Six Recommendation Types

From the specification:

| # | Type | What It Offers | Trigger Source |
|---|------|---------------|----------------|
| 1 | Framework / Lens Usage | "Run this diagnostic for a more precise reading" | L0 Lens Intelligence — signal threshold |
| 2 | Lens Results Debrief | "Your results are ready — let's walk through them" | Assessment completion event |
| 3 | Executive Coaching Session | "A dedicated session would move this faster" | Conversation depth + pattern complexity |
| 4 | Advisory Working Session | "A structured working session on this specific deliverable" | Complex deliverable + milestone pressure |
| 5 | Workshops | "A team workshop on this topic would be more efficient" | Team context + recurring pattern across people |
| 6 | Team Recommendation | "Your team would benefit from X lens / assessment" | Team dynamics + organizational pattern |

---

## 3. Trust & Maturity Curve

Recommendations are gated by relationship stage. You don't propose a team workshop in the first conversation. You earn the right to suggest more significant engagements.

### 3.1 Trust Stages

| Stage | Name | What It Means | Available Recommendations |
|-------|------|---------------|--------------------------|
| 1 | **Introductory** | First contact. Proving value. The user is sampling. | Complimentary lenses (LEAP, PRISM) |
| 2 | **Working** | 2-4 sessions. 1+ lens completed. Trust established. | All standard lenses. Executive coaching sessions. |
| 3 | **Deep** | 5+ sessions. 3+ lenses completed. Real work happening. | Signature lenses (3mi). Advisory working sessions. Multi-lens deep dives. |
| 4 | **Partner** | Ongoing engagement. Demonstrated ROI. Strategic relationship. | Team workshops. Team assessments. Enterprise proposals. |

### 3.2 How Trust Advances

Trust advances when these signals accumulate:

| Signal | Trust Weight | Notes |
|--------|-------------|-------|
| Each session completed | +1 | Diminishing returns after session 8 |
| Lens completed (complimentary) | +2 | Act of trust — they gave you data |
| Lens completed (paid) | +4 | Stronger signal — they invested money |
| Recommendation accepted | +2 | They took your suggestion |
| Artifact shared (CV, etc.) | +3 | They shared personal material |
| Vulnerable disclosure | +2 | They shared something difficult |
| Returning after gap | +3 | Coming back voluntarily is the strongest signal |

**Stage thresholds (rough):**
- Stage 1 → 2: ~6 trust points
- Stage 2 → 3: ~15 trust points
- Stage 3 → 4: ~30+ trust points + time + demonstrated outcomes

**Trust never decreases.** A declined recommendation doesn't cost trust. A gap between sessions doesn't cost trust. Trust is one-way: it accumulates or holds.

### 3.3 One-Stage-Ahead Rule

NEXUS can suggest things from the next stage up, but never two stages ahead.

- Stage 1 user can receive Stage 2 suggestions (standard lenses)
- Stage 1 user CANNOT receive Stage 3 suggestions (advisory sessions)
- Stage 2 user can receive Stage 3 suggestions (signature lenses)
- etc.

**Why:** A suggestion one level ahead feels aspirational and relevant. A suggestion two levels ahead feels like a pitch.

---

## 4. Recommendation Cards

### 4.1 Format

Recommendations are delivered as cards — separate from the main conversation flow. They appear in a sidebar or as inline suggestions. They never interrupt the primary response.

```
┌──────────────────────────────────────────────┐
│  ◈  SUGGESTED                                │
│                                              │
│  Run PRISM — Professional Branding           │
│                                              │
│  The gap you're describing between           │
│  how you see your contribution and           │
│  how stakeholders perceive it is exactly     │
│  what PRISM measures. 20 minutes.            │
│                                              │
│  [ Run it now ]    [ Not now ]               │
└──────────────────────────────────────────────┘
```

### 4.2 Card Anatomy

| Element | Purpose | Rules |
|---------|---------|-------|
| Icon + label | Quick recognition of what type of recommendation | "Suggested" for lenses, "Available" for debriefs, etc. |
| Title | What is being suggested | Specific, tied to their situation. Never generic. |
| Body (1-2 lines) | Why it's relevant right now | Connects to something they just said. 1-2 lines max. |
| Primary action button | Clear next step | Specific verb: "Run it now," "Book session," "See results" |
| Dismiss button | Easy out | "Not now" — permanently dismisses this specific recommendation |

### 4.3 Card Behavior Rules

- **Max 1 card per turn.** Never more than one recommendation at a time.
- **Cards are non-blocking.** The main conversation response comes first. The card is supplementary.
- **"Not now" = gone forever** for that specific recommendation. It doesn't come back unless a new, stronger trigger fires.
- **No persistence nags.** A dismissed recommendation stays dismissed.
- **Card content is dynamic.** The same lens suggestion will use different language depending on what triggered it and what the user said.

---

## 5. Trigger Logic by Recommendation Type

### 5.1 Type 1 — Framework / Lens Usage

**Trigger:** Lens signal ≥ 7 (from L0 Lens Intelligence) + natural conversation opening + trust stage appropriate

**Suggestion rate limit:** No more than 1 lens suggestion per 3 conversation turns

**Priority among lenses:** 
1. Highest signal strength first
2. If signal is close: user context relevance wins
3. Complimentary lenses (LEAP, PRISM) have slight priority at Stage 1

**Card copy template:**
> **Run [Lens Name] — [Short Tagline]**
>
> [Specific observation tied to what they said] is exactly what [Lens Name] measures. It's a [duration] instrument that gives you [one specific benefit].

### 5.2 Type 2 — Lens Results Debrief

**Trigger:** Lens results become available (user completed a lens)

**Behavior:** This is the most natural recommendation — the user just did something, they want to know what it means. High acceptance rate.

**Priority:** Highest. If lens results are ready, this card appears before any other.

**Card copy template:**
> **[Lens Name] results are ready**
>
> Your [Lens Name] assessment is complete. Want to walk through what it shows — the patterns, the gaps, and what it means for what you're working on?

### 5.3 Type 3 — Executive Coaching Session

**Trigger:** All of the following must be true:
- Trust stage ≥ 2 (Working)
- Conversation is deep (multi-session topic)
- Complexity is high (3+ active patterns, scenario is advanced phase)
- Natural opening (user expresses frustration with progress, or says "I could really use some dedicated time on this")

**Card copy template:**
> **Dedicated coaching session**
>
> What you're working through is complex enough that a focused 45-minute coaching session might move it faster than working through it piecemeal. Want to set one up?

### 5.4 Type 4 — Advisory Working Session

**Trigger:** All of the following must be true:
- Trust stage ≥ 3 (Deep)
- Specific deliverable in milestones (presentation, strategy doc, etc.)
- Time pressure (deadline within 4 weeks)
- User has been working on it for 2+ sessions
- Natural opening (user mentions the deliverable feels stuck or needs a push)

**Card copy template:**
> **Advisory working session**
>
> Your board presentation is in three weeks and there's a lot to shape. A 90-minute working session would let us structure the full narrative and slide arc. Want to book one?

### 5.5 Type 5 — Workshops

**Trigger:** All of the following must be true:
- Trust stage ≥ 4 (Partner)
- User has mentioned team dynamics / team challenges multiple times
- Pattern is systemic (not just individual)
- Multiple team members or the team as a whole is referenced
- Natural opening

**Card copy template:**
> **Team workshop**
>
> The trust pattern you're describing isn't just individual — it's systemic across your leadership team. A half-day workshop on institutional trust building would give you tools you can deploy immediately. Interested?

### 5.6 Type 6 — Team Recommendation

**Trigger:** All of the following must be true:
- Trust stage ≥ 4 (Partner)
- User is a people leader (manager / exec with team)
- User has mentioned specific team members or team challenges
- Relevant lens would apply at team level (MOSAIC, BRIDGE, SPARK, FORGE, CPI)
- Natural opening

**Card copy template:**
> **Team assessment — MOSAIC**
>
> Based on what you've described about your leadership team dynamics, running MOSAIC across the team would give you a clear map of where trust is strong and where it's creating friction. Want to discuss how that would work?

---

## 6. Card Scheduling & Priority

### 6.1 Priority Ranking

When multiple triggers fire at once, only one card is shown. Priority order:

1. **Lens results debrief** (highest — user just did something, expects follow-up)
2. **Active milestone deadline** (time-sensitive)
3. **Highest lens signal** (strongest signal = most relevant)
4. **Most recent trigger** (tied to what they just said vs something from earlier)

### 6.2 Cadence Rules

| Metric | Rule | Reason |
|--------|------|--------|
| Max cards per session | 3 | More than that feels like sales |
| Min turns between cards | 3 | Give space between suggestions |
| Same recommendation max appearances | 1 | One shot. If dismissed, gone. |
| Lens suggestions max per session | 2 | Two different lenses max |
| Higher-stage suggestions max | 1 per session | Don't push the relationship faster than it's moving |

### 6.3 Never Show When

- User is visibly upset or vulnerable (hold space, don't sell)
- User just shared something personal and difficult (acknowledge first, suggest later — much later)
- User expressed frustration with NEXUS (fix the problem before suggesting anything)
- User said "I'm just exploring" or "no sales pitch" (respect the boundary)
- User is in crisis mode (help with the crisis, nothing else)

---

## 7. Response to Acceptance / Decline

### 7.1 If Accepted

- **Lens suggestion** → "Great. I'll start it now — it takes about [duration]. I'll walk you through it as we go." → Launch the lens instrument
- **Debrief** → "Let's start with the big picture, then drill into the dimensions that matter most for what you're working on." → Begin debrief
- **Coaching session** → "I'll send you scheduling options. What time zone are you in?" → Scheduling flow
- **Working session** → "Let me suggest a few times. What's your calendar look like this week and next?" → Scheduling flow
- **Workshop / team** → "Let me put together a short proposal — scope, format, what you'd get. When would you want it by?" → Proposal flow

### 7.2 If Declined ("Not now")

- **Response:** "No problem at all." → Immediately return to the conversation
- **System action:** Mark recommendation as dismissed. Don't resurface unless a new, significantly stronger trigger fires.
- **Trust impact:** Zero. Declining a recommendation doesn't change trust stage or trust score.
- **No follow-up.** NEXUS never brings it up again unless the user does.

### 7.3 The "Not Now" is Sacred

This is the most important rule in the recommendation engine. If the user says no, it's gone. Forever (for this specific recommendation). 

Why? Because the moment someone feels like you're going to keep asking, they stop trusting the "no." And if "no" doesn't stick, every suggestion starts to feel like a pitch.

One suggestion. One yes/no. If no, it's done.

---

## 8. The Sales Consultant Metaphor

NEXUS as sales consultant — not as salesperson.

**Salesperson:** identifies pain → amplifies it → presents product as solution → overcomes objections → closes.
**Luxury consultant:** understands the situation → sees what would help → mentions it once, low pressure → lets the client decide.

NEXUS is the second one.

The difference matters:
- The salesperson needs the sale. The consultant doesn't need the engagement — they're already being useful without it.
- The salesperson chases. The consultant is available if the client wants more.
- The salesperson handles objections. The consultant accepts "no" without blinking.
- The salesperson's value is in the close. The consultant's value is in the conversation itself.

**This is why the recommendation engine is card-based, subtle, one-shot, and instantly dismissible.** It's designed to feel like a consultant mentioning something useful in passing, not a sales engine trying to convert.

---

## 9. Implementation Structure

```python
class RecommendationEngine:
    def __init__(self, user_intel, lens_intel):
        self.user = user_intel
        self.lenses = lens_intel
    
    def evaluate_triggers(self, conversation_context):
        """Check all 6 recommendation types, return list of triggered cards"""
        candidates = []
        
        # Type 2: lens debrief (highest priority)
        if self.user.pending_lens_results:
            candidates.append(self._build_debrief_card())
        
        # Type 1: lens suggestions
        for lens, signal in self.lenses.active_signals.items():
            if signal >= 7 and not self.user.lens_completed(lens):
                if self._trust_allows(lens):
                    candidates.append(self._build_lens_card(lens, conversation_context))
        
        # Type 3-6: higher-tier recommendations
        if self.user.trust_stage >= 2:
            candidates.extend(self._check_coaching_session(conversation_context))
        if self.user.trust_stage >= 3:
            candidates.extend(self._check_advisory_session(conversation_context))
        if self.user.trust_stage >= 4:
            candidates.extend(self._check_workshops(conversation_context))
            candidates.extend(self._check_team_recommendations(conversation_context))
        
        return candidates
    
    def select_card(self, candidates):
        """Pick at most one card to show, respecting cadence and priority"""
        # Apply cadence rules
        # Sort by priority
        # Return top candidate or None
```

---

## 10. Quality & Compliance

- ✅ Zero sales language — suggestions, not pitches
- ✅ Luxury consultant tone — confident, low-pressure, doctor-like
- ✅ White space / iceberg principle — say 1/8 about the recommendation, let the user fill the rest
- ✅ No hard-ban word violations in any card copy
- ✅ User autonomy — "not now" is final, never pushed
- ✅ Trust-first design — recommendations are earned by the quality of the conversation
- ✅ FT/Economist register — sharp, specific, no fluff

---

*End of Recommendation Engine v1.0*
