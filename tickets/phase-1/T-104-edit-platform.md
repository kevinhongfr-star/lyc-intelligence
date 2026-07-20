# T-104: Edit `/platform` — Add All 9 Archetypes

**Phase:** 1 | **Batch:** 1B | **Effort:** 0.5 day
**CD Source:** 
**Depends On:** T-101 (design system — colors + icons needed)
**Blocks:** None (can run in parallel with other 1B tickets)

---

## What to Do

Update the existing `/platform` page to integrate the archetype system.

## Changes Required

CD10, CD01

## Archetypes to Add

- **Instrument:** All 9
- **Count:** 62 total across all instruments
- **Archetype names:** Add '9 instruments, 62 named archetypes' overview section + one ArchetypeCard per instrument (showing sample archetype) + link to each /assess/[instrument] page.

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
