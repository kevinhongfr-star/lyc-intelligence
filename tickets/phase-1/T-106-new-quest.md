# T-106: New `/assess/quest` — QUEST Leadership Capability Diagnostic

**Phase:** 1 | **Batch:** 1C | **Effort:** 0.5 day
**CD Source:** CD02 (QUEST Question Bank v2), CD10 (Product/Brochure/Website)
**Depends On:** T-101 (design system), T-001 (API)
**Blocks:** None

---

## What to Build

New page at `/assess/quest` — the QUEST Leadership Capability diagnostic. This is a full diagnostic page with assessment flow + archetype result.

## 10 QUEST Archetypes

Architect, Catalyst, Diplomat, Commander, Navigator, Strategist, Engine, Entrepreneur, Specialist, Seedling

## Page Structure

1. **Hero:** QUEST title + tagline + "Discover your leadership archetype" CTA
2. **About Section:** What QUEST measures (dimensions from CD02)
3. **Archetype Preview Grid:** 10 ArchetypeCards (icon + name + 1-line teaser) — each card is slightly blurred/teaser until you take the assessment
4. **Assessment CTA:** "Take the free QUEST assessment" → triggers assessment flow
5. **Free Result Teaser:** After assessment, show archetype name + icon + color + 1-paragraph description
6. **Email Gate:** "Unlock your full QUEST report" → email form
7. **Full Report (gated):** Radar chart + modifiers + confidence + core strength + key risk + development priorities + share button
8. **Related Products:** "Continue your journey" → linked webinars, programmes, workshops
9. **Soft CTA Block:** Universal soft CTA (from Phase 6)

## Assessment Integration

- QUEST has specific dimensions defined in CD02 (Question Bank)
- Questions stored in question bank → need to render them in the assessment UI
- Scoring logic in T-002 (classification engine)

## Acceptance Criteria

- [ ] Page renders at `/assess/quest`
- [ ] All 10 archetype cards visible with correct icons (QUEST color)
- [ ] Assessment flow works (questions render → submit → result)
- [ ] Free teaser shows archetype name + description
- [ ] Email gate works (submit email → unlock full report)
- [ ] Full report shows radar chart + modifiers
- [ ] Related products link correctly
- [ ] Mobile responsive

## Question Bank Reference

Read `../cd_docs/CD02_QUEST_Question_Bank_v2*` for the complete question set and dimension definitions.
