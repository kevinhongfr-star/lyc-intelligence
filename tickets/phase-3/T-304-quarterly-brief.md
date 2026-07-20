# T-304: New `/insights/brief` — Quarterly Executive Brief (Gated)

**Phase:** 3 | **Batch:** 3B | **Effort:** 1 day
**CD Source:** CD20 (FW-3 Content Cascade)
**Depends On:** Phase 2, T-302 (newsletter exists)
**Blocks:** None

---

## What to Build

Quarterly Executive Brief page at `/insights/brief` — a gated downloadable report that aggregates 3 months of webinar insights + diagnostic data.

## Page Structure

1. **Hero:** "The Executive Brief — Quarterly Insights from 10,000+ APAC Leaders"
2. **Current Brief:** Cover image + title + 3-paragraph summary
3. **What's Inside:** Table of contents (chapters/sections)
4. **Download Gate:** Email form → PDF download
5. **Archive:** Past briefs (if any)
6. **Related Content:** Links to newsletters, podcasts, webinars from the same quarter

## Gating Model

- Same as diagnostic gating (Kevin's decision)
- Email required → Resend tag: `brief_downloaded`
- After download: show inline preview + "Share with a colleague" CTA

## Brief Production Schedule

- Q3 2026 (Aug-Oct webinars) → Brief published Nov 2026
- Q4 2026 (Nov-Jan webinars) → Brief published Feb 2027
- etc.

For now, create the page structure + gate. Content will be added quarterly.

## Acceptance Criteria

- [ ] Page renders at `/insights/brief`
- [ ] Email gate works (Resend integration)
- [ ] PDF download works after email submission
- [ ] Archive section visible (even if empty)
- [ ] Related content links correct
- [ ] Mobile responsive
