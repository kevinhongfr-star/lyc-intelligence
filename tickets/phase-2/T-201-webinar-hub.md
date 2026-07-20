# T-201: `/webinars` — Calendar Hub Page

**Phase:** 2 | **Batch:** 2A | **Effort:** 2 days
**CD Source:** CD18 (6-Month Webinar Calendar), CD19 (Webinar Page Restructure)
**Depends On:** Phase 1 (diagnostic pages exist for linking)
**Blocks:** T-202, Phase 3, Phase 4

---

## What to Build

The `/webinars` hub page — central calendar for all 24 executive webinars.

## Page Structure (from CD19/FW-2)

1. **Hero:** "Executive Forum — Free Monthly Webinars for APAC Leaders"
2. **Upcoming 3 Webinars:** Highlighted cards for next 3 webinars (by date)
3. **Full Calendar Grid:** All 24 webinars in a filterable grid
   - Filter by: diagnostic instrument, theme, date range
   - Each card: Title | Date | Linked Diagnostic | Speaker | "Register" CTA
4. **Past Webinars:** Collapsible section with replay links (if available)
5. **Newsletter Signup:** Embedded form — "Get webinar recaps in your inbox"
6. **Standing CTA:** "Can't find a topic? Try our free diagnostics →" (links to /platform)

## Webinar Calendar (24 entries from CD18)

| Month | Theme | Linked Diagnostic |
|---|---|---|
| Aug 2026 | The Governance Shift | BRIDGE |
| Sep 2026 | Cross-Border Teams | MOSAIC |
| Oct 2026 | AI-Ready Leadership | SPARK |
| Nov 2026 | The Revenue Architect | FORGE |
| Dec 2026 | Board Effectiveness | IMPACT |
| Jan 2027 | Leading the SHIFT | SHIFT Composite |
| Feb 2027 | Executive Presence in AI Age | QUEST |
| Mar 2027 | The Succession Illusion | DRIVE |
| Apr 2027 | Brand Identity Borderless | PRISM |
| May 2027 | The Integrated Leader | SHIFT + LEAP |
| Jun 2027 | Career Resilience | DRIVE + LEAP |
| Jul 2027 | Invitation Council Launch | All 9 |

## URL Structure

- Hub: `/webinars`
- Individual: `/webinars/[slug]` (e.g., `/webinars/governance-shift-aug-2026`)
- Registration: `/webinars/[slug]/register`

## Acceptance Criteria

- [ ] Hub page renders at `/webinars`
- [ ] All 24 webinars displayed (data from T-204)
- [ ] Filter by instrument, theme, date works
- [ ] Next 3 webinars highlighted
- [ ] Each card links to `/webinars/[slug]`
- [ ] Newsletter signup embedded
- [ ] "Try free diagnostics" CTA links to `/platform`
- [ ] Mobile responsive

## Technical Notes

- Webinar data should come from a structured data source (JSON file or CMS) — see T-204
- Slug generation: lowercase theme + month-year (e.g., "governance-shift-aug-2026")
- "Past" vs "Upcoming" determined by current date
