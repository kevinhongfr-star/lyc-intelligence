# T-302: New `/insights/newsletter` — Newsletter Hub

**Phase:** 3 | **Batch:** 3A | **Effort:** 0.5 day
**CD Source:** CD20 (FW-3 Content Cascade)
**Depends On:** Phase 2 (newsletter recaps reference webinars)
**Blocks:** None

---

## What to Build

Newsletter archive hub page at `/insights/newsletter`.

## Page Structure

1. **Hero:** "The LYC Brief — Monthly Insights for APAC Leaders"
2. **Current Issue:** Latest newsletter displayed inline
3. **Archive:** Grid of past issues (title, date, 1-line summary)
4. **Signup Form:** Prominent Resend-powered signup
5. **Segmentation Tags (Resend):**
   - `newsletter_signup` (general)
   - `newsletter_webinar_recap` (interested in webinars)
   - `newsletter_[instrument]` (interested in specific diagnostic)

## Content Integration

Each newsletter issue should reference:
- The month's webinar(s) → link to `/webinars/[slug]`
- Featured diagnostic → link to `/assess/[instrument]`
- Advisory CTA → booking link

## Acceptance Criteria

- [ ] Hub page renders at `/insights/newsletter`
- [ ] Archive grid works (even if empty initially)
- [ ] Signup form integrates with Resend
- [ ] SEO metadata set
- [ ] Mobile responsive
