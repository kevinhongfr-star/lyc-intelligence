# T-402: New `/roundtable` — Roundtable + Payment Flow

**Phase:** 4 | **Batch:** 4A | **Effort:** 1.5 days
**CD Source:** CD22 (FW-5 Council + Roundtable)
**Depends On:** Phase 2 (roundtable follows webinars in funnel)
**Blocks:** None

---

## What to Build

The Roundtable product page + **separate payment flow** (Kevin's decision — independent from webinar registration).

## Page Structure

1. **Hero:** "Roundtable — Peer-Level Strategy Discussions for APAC Executives"
2. **Format Section:**
   - What is a Roundtable? (60-90 min, max 12 participants, facilitated by Kevin)
   - How it works: Theme → Pre-read → Live discussion → Action commitments
3. **Calendar:** 2 Roundtables per month (aligned with webinar themes)
4. **Pricing (from CD22/FW-5):**

   | Participant Type | Price | Rationale |
   |---|---|---|
   | Webinar Speakers (Council members) | FREE | Contribution = perk |
   | Webinar Attendees (post-webinar) | $500 USD | Natural progression |
   | Direct Registration | $800 USD | Cold entry, higher price |
   | Council Members (non-speaker) | $300 USD | Member discount |

5. **Registration/Payment Flow:**
   - Select Roundtable date
   - Determine participant type (auto-detect if logged in as Council/speaker)
   - Show correct price
   - Payment form (Stripe or similar)
   - Confirmation + calendar invite

## Payment Integration

**Kevin's Decision:** Separate payment flow — do NOT share with webinar registration system.

- Need to integrate a payment provider (Stripe recommended)
- Different pricing tiers based on participant type
- Store payment records in Supabase

## Acceptance Criteria

- [ ] Page renders at `/roundtable`
- [ ] Format and calendar clearly displayed
- [ ] Pricing table shows all 4 tiers
- [ ] Payment flow works (select → pay → confirm)
- [ ] Participant type detection works (speaker/Council/webinar attendee/direct)
- [ ] Correct price shown based on participant type
- [ ] Confirmation email sent
- [ ] Mobile responsive

## Technical Notes

- Payment provider: Stripe is recommended (check if already integrated)
- Participant type logic:
  - If email matches speaker list → FREE
  - If email matches Council member list → $300
  - If email matches webinar attendee list → $500
  - Otherwise → $800
