# T-202: `/webinars/[slug]` — 24 Individual Webinar Pages (Template)

**Phase:** 2 | **Batch:** 2A | **Effort:** 3 days
**CD Source:** CD19 (FW-2 Webinar Page Restructure)
**Depends On:** T-201 (hub page exists), T-204 (webinar data seeded)
**Blocks:** None

---

## What to Build

Create a reusable webinar page template, then instantiate it for all 24 webinars. Each webinar gets its own page at `/webinars/[slug]`.

## Standard Page Template (from CD19/FW-2)

Every webinar page follows this exact structure:

1. **Hero:** Title + Date/Time + "Register Now" CTA button
2. **Speaker Section:** Kevin Hong + Guest (if applicable) — photo, title, 2-line bio
3. **What You'll Learn:** 3-5 bullet points specific to the webinar theme
4. **Related LYC Products:**
   - Free Diagnostic → link to `/assess/[linked-instrument]`
   - Programme → link to `/programmes/[related-programme]`
   - Workshop → link to `/workshops/[related-workshop]`
5. **Soft CTAs (inline):**
   - Quick Diagnostic | Nexus Advisory | Exec Search | Council | Roundtable
6. **Content Cascade Section:**
   - Newsletter recap link (after webinar)
   - Podcast episode link (after webinar)
   - Executive Brief download link (after webinar)
   - LinkedIn article link (after webinar)
7. **Upcoming Webinars:** Next 3 webinars as cards (link to their pages)

## 24 Webinar Slugs + Linked Products

| Slug | Linked Diagnostic | Linked Programme | Linked Workshop |
|---|---|---|---|
| governance-shift-aug-2026 | BRIDGE | `/programmes/governance` | `/workshops/force-1-discovery` |
| cross-border-teams-sep-2026 | MOSAIC | `/programmes/cross-border` | `/workshops/team-cohesion` |
| ai-ready-leadership-oct-2026 | SPARK | `/programmes/ai-leadership` | — |
| revenue-architect-nov-2026 | FORGE | — | `/workshops/revenue-leadership` |
| board-effectiveness-dec-2026 | IMPACT | — | — |
| leading-the-shift-jan-2027 | SHIFT | `/programmes/advisory` | `/workshops/shift-facilitation` |
| exec-presence-ai-age-feb-2027 | QUEST | `/programmes/advisory` | — |
| succession-illusion-mar-2027 | DRIVE | — | `/workshops/career-resilience` |
| brand-identity-borderless-apr-2027 | PRISM | `/programmes/advisory` | — |
| integrated-leader-may-2027 | SHIFT + LEAP | `/programmes/advisory` | — |
| career-resilience-jun-2027 | DRIVE + LEAP | — | `/workshops/career-resilience` |
| council-launch-jul-2027 | All 9 | `/council` | — |

*(Each month has 2 webinars — table shows one per month for brevity. Read CD18 for the second webinar per month.)*

## Implementation Approach

1. Build the template as a dynamic Next.js page: `app/webinars/[slug]/page.tsx`
2. Store webinar content in a data file (see T-204)
3. Generate all 24 pages from the data + template
4. For "Content Cascade" section: show placeholders until content exists, then populate

## Acceptance Criteria

- [ ] Template renders correctly with webinar-specific data
- [ ] All 24 pages accessible at `/webinars/[slug]`
- [ ] Each page links to correct diagnostic, programme, and workshop
- [ ] Soft CTA block present on every page
- [ ] Content cascade section shows (even if placeholders for now)
- [ ] "Upcoming Webinars" shows next 3 correctly
- [ ] Mobile responsive
- [ ] SEO metadata unique per webinar (title, description, OG image)

## Reference

Read `../cd_docs/CD19_FW2_Webinar_Page_Restructure*` for the exact page template spec.
