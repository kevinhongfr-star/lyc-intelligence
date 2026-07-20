# T-103: Edit `/assess/spark` — Add SPARK Archetypes

**Phase:** 1 | **Batch:** 1B | **Effort:** 0.5 day
**CD Source:** CD16
**Depends On:** T-101 (design system — colors + icons needed)
**Blocks:** None (can run in parallel with other 1B tickets)

---

## What to Do

Update the existing `/assess/spark` page to integrate the archetype system.

## Changes Required

Add 4 SPARK archetypes + AI Readiness modifier + archetype teaser section.

## Archetypes to Add

- **Instrument:** SPARK
- **Count:** 4
- **Archetype names:** AI Champion, Skeptical Director, Governance Bureaucrat, Disengaged Director

## Implementation Notes

- Use `ArchetypeCard` component from T-101
- Instrument color from design tokens (T-101)
- Add "What's your archetype?" CTA section linking to the assessment
- Add archetype teaser grid (shows icon + name + 1-line teaser for each archetype)
- Keep existing page content — ADD archetype sections, don't remove anything
- Mobile responsive

## Acceptance Criteria

- [ ] Page loads without errors
- [ ] All archetype cards render with correct icons and colors
- [ ] "What's your archetype?" CTA visible and links correctly
- [ ] Existing content preserved (additive changes only)
- [ ] Mobile responsive
- [ ] SEO metadata updated to mention archetypes

## Reference

Read the CD documents in `../cd_docs/` for exact archetype descriptions and messaging.
