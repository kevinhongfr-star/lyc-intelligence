# T-203: `/webinars/[slug]/register` — Registration Flow

**Phase:** 2 | **Batch:** 2A | **Effort:** 1 day
**CD Source:** CD19, CD21 (FW-4 Outreach Reframe)
**Depends On:** T-202 (webinar pages exist with Register CTAs)
**Blocks:** None

---

## What to Build

Registration flow for webinar signups. Each webinar has its own registration page.

## Registration Page

Route: `/webinars/[slug]/register`

### Form Fields
- Full name (required)
- Email (required)
- Job title (required)
- Company (required)
- "How did you hear about us?" (optional dropdown)

### Post-Registration
- Auto-confirmation email (via Resend)
- Calendar invite (.ics attachment) — add to Google/Outlook/Apple
- Thank you page with:
  - Webinar details (date, time, link)
  - "Add to calendar" buttons
  - "While you wait: Take the free [linked diagnostic] →"

### Post-Webinar Email Sequence (from CD21/FW-4)
Configure in Resend:
1. **Immediate:** Confirmation + calendar invite
2. **Day of webinar:** Reminder + join link (2 hours before)
3. **Day +1:** Replay link + diagnostic CTA
4. **Day +3:** "Take the free [diagnostic]" email
5. **Day +7:** Next webinar invitation

## Data Storage

- Store registrations in Supabase
- Tag in Resend: `webinar_registered_[slug]`
- After attendance: `webinar_attended_[slug]`

## Acceptance Criteria

- [ ] Registration page renders for each webinar
- [ ] Form validation works (required fields)
- [ ] Confirmation email sent via Resend
- [ ] Calendar invite (.ics) generated correctly
- [ ] Thank you page shows diagnostic CTA
- [ ] Resend tags applied correctly
- [ ] Mobile responsive
- [ ] Data stored in Supabase

## Technical Notes

- "Separate payment flow" (Kevin's decision) applies to Roundtable only — webinar registration is FREE
- Resend integration already exists — reuse existing email infrastructure
