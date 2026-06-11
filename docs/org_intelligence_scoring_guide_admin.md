# Org Intelligence — Scoring Framework
## Admin User Guide

**Version:** 0.1 (DRAFT — pending sign-off on 5-criteria + weights)
**Audience:** Platform admins reviewing scoring outputs, applying overrides, briefing engagement teams
**Last updated:** 2026-06-11

---

## What this guide is

This guide explains how the Org Intelligence module evaluates individuals against a target role. It is a reference for admins — not a substitute for the engagement-specific brief. Every client engagement has additional context that may shift the relative importance of the 5 criteria for that mandate.

The scoring framework has three building blocks: **5 criteria**, a **composite score**, and **tier labels**. Each is explained below.

---

## How scoring works (high level)

1. An individual is identified for evaluation (manually by an admin, or via CSV upload of a talent pool).
2. The platform runs an automated evaluation against each of the 5 criteria independently.
3. The 5 sub-scores are combined into a single 0–100 composite using the weights below.
4. The composite maps to a tier label (Strong Fit, Good Fit, Potential Fit, Not Yet Fit).
5. All sources, sub-scores, and the composite are time-stamped and stored. Admins can review, override, and annotate.

A full evaluation typically completes in under a minute. Evaluations can be re-run if new intelligence is supplied.

---

## The 5 criteria

### C1 — Tenure & Track Record
**What it measures:** Career progression, stability, and growth in scope. How the individual has accumulated responsibility, leadership, and domain expertise over time.

**What high scores look like:**
- Long, stable tenure with progressive responsibility
- Track record of promotions, expanded scope, or senior-leadership roles
- Recognized domain expertise built over multiple years

**What low scores look like:**
- Frequent short tenures without clear progression
- Long employment gaps without explanation
- Limited scope or seniority in past roles

---

### C2 — Network & Influence
**What it measures:** The breadth and depth of the individual's professional network and their ability to influence within their domain.

**What high scores look like:**
- Recognized authority in the field
- Well-connected across relevant industries or functions
- Active in speaking, publishing, advisory, or board roles

**What low scores look like:**
- Limited visibility outside the immediate employer
- No published or speaking record
- Narrow industry footprint

---

### C3 — Performance & Impact
**What it measures:** Quantified business outcomes the individual has delivered. Revenue, market share, cost savings, product launches, team performance, or other measurable achievements.

**What high scores look like:**
- Specific, attributable wins tied to the individual
- Clear metrics (e.g., "led APAC expansion to \$40M ARR in 18 months")
- Outcomes that compound over time

**What low scores look like:**
- Vague or un-attributable achievements
- Lack of clear business impact in past roles
- Outputs without outcomes

---

### C4 — Mobility & Adaptability
**What it measures:** The individual's openness and ability to move — between roles, industries, geographies, or into new functional areas.

**What high scores look like:**
- Demonstrated career pivots
- Cross-functional moves or international experience
- Willingness to relocate or change scope

**What low scores look like:**
- Deep specialization in a narrow niche
- Limited cross-functional exposure
- Geographic or functional constraints

---

### C5 — Cultural & Mandate Fit
**What it measures:** Alignment between the individual's working style, values, and past operating context and the specific requirements of the target mandate.

**What high scores look like:**
- Past roles required similar stakeholder management, pace, governance, or values-fit
- Strong evidence of cultural alignment (e.g., state-owned enterprise to state-owned enterprise, founder-led startup to founder-led startup)

**What low scores look like:**
- Past roles operated in very different cultural or governance contexts
- Misalignment between the individual's typical working style and the target mandate

---

## Composite score

The 5 sub-scores are weighted and combined into a single 0–100 composite:

```
Composite = (C1 × 0.25) + (C2 × 0.20) + (C3 × 0.25) + (C4 × 0.15) + (C5 × 0.15)
Final     = Composite × 5     (rescaled to 0–100)
```

| Sub-score | Weight | Why it carries this weight |
|-----------|--------|----------------------------|
| C1 Tenure | 0.25 | Strong predictor of execution and follow-through |
| C2 Network | 0.20 | Important for senior mandates; secondary to actual delivery |
| C3 Performance | 0.25 | The strongest single signal of value delivered |
| C4 Mobility | 0.15 | Modifier, not a primary driver |
| C5 Cultural Fit | 0.15 | Highly mandate-specific; weight may shift per engagement |

The weights above are **defaults**. Engagement leads may request a re-weight for a specific mandate (e.g., a CEO succession search may weight C2 and C5 more heavily). Re-weighted mandates will show the modified weights in the individual detail view.

---

## Tier bands

| Composite | Tier | Interpretation |
|-----------|------|----------------|
| 80–100 | **Strong Fit** | Recommend direct approach; high-priority candidate |
| 60–79 | **Good Fit** | Worth pursuing; some development needed |
| 40–59 | **Potential Fit** | Possible with role adjustment or longer ramp |
| 0–39 | **Not Yet Fit** | Not a current match; revisit in 12–18 months |

Tiers are advisory. They are starting points for engagement discussion, not binding recommendations.

---

## Manual overrides

- Admins can adjust any sub-score on any individual.
- Every override requires a **written reason** (minimum 30 characters) explaining why the automated score was changed.
- All overrides are timestamped, attributed to the admin, and stored in the audit trail.
- Overrides change the composite score; the tier label updates automatically.
- Overrides can be reverted by the same admin (also with a written reason).

### When to override
- New intelligence has come to light that the automated evaluation could not access.
- The automated sub-score conflicts with direct knowledge the admin has of the individual.
- The mandate requirements have shifted and the original scoring is no longer relevant.

### When NOT to override
- To "round up" or "round down" a sub-score near a tier boundary — use the composite directly.
- Based on a single source that contradicts multiple stronger sources — collect more intel first.

---

## Data sources

The platform draws on multiple source types to produce sub-scores:

- **Public web sources** — company sites, news, professional profiles
- **Professional networks** — LinkedIn-equivalent, industry publications, conference speaker lists
- **Admin-supplied intelligence** — uploaded via CSV or manual entry

All sources are time-stamped and cited in the audit trail. Admins can view the full source list on any individual detail page.

The platform treats all public sources as equivalent by default. The relative weight of one source type vs. another is not exposed in the admin UI.

---

## What this guide does NOT cover

- The internal mechanics of how the automated evaluation engine produces its sub-scores. That is implementation detail and may change over time without notice.
- The override-appeal process (handled separately by the engagement lead).
- Mandate-specific re-weighting workflows (handled by engagement leads, not platform admins).

---

## Questions?

If you have questions about how a specific score was derived, open the individual's detail page and review the cited sources. If you still have concerns, raise them in the engagement channel with the engagement lead.

If the framework itself feels wrong for a particular mandate, raise it with the engagement lead before applying overrides on a case-by-case basis. The override trail will reveal systematic issues, but it is better to address them at the framework level.
