# Phase 9: Diagnostic Pipeline Completion — Email, Sharing & Credits Wiring

**Date:** 2026-07-22
**Source:** Diagnostic system audit (Phase 7/8 gap analysis)
**Scope:** Close the remaining functional gaps in the diagnostic assessment pipeline
**Dependencies:** Phase 7 (T-701 to T-714) for report renderers & storage; Phase 8 (T-801 to T-811) for council portal & credit infrastructure
**Principle:** Every completed diagnostic must trigger: storage → report generation → email delivery → next-steps sequence → optional social sharing → optional credit-gated upsell

---

## Part A: Email Infrastructure (Build Foundation First)

### T-901: Email Sending Infrastructure (Resend API)
**Priority:** 🔴 P0 | **Est:** 6h | **No file exists yet**

**Current state:** Email templates exist (`src/email/templates.tsx`, `src/email/templates/transactional.tsx`, `src/email/templates/notifications.tsx`) but there is NO sending infrastructure — no API route, no Resend/SendGrid config, no email service module.

**Target:** A working email service that can send branded HTML emails from any trigger point in the app.

**Scope:**
1. Install `resend` package (or `@sendgrid/mail` — Kevin's preference)
2. Create `src/services/emailService.ts`:
   - `sendEmail({ to, subject, template, data })` — core send function
   - Template rendering: use existing `src/email/templates.tsx` components via `ReactDOMServer.renderToStaticMarkup`
   - Error handling + retry logic (1 retry, then log failure)
3. Create `src/pages/api/email/send.ts` (Next.js API route or Vercel serverless function):
   - Validates request (prevent abuse: rate limit by IP, max 5 emails/minute)
   - Accepts: `{ to, templateId, data }`
   - Calls `emailService.sendEmail()`
   - Returns: `{ success, messageId }`
4. Environment variables:
   - `RESEND_API_KEY` (or `SENDGRID_API_KEY`)
   - `EMAIL_FROM_ADDRESS` — `intelligence@lyc-partners.ai`
   - `EMAIL_FROM_NAME` — `LYC Intelligence`
5. Supabase table `email_log`:
   ```sql
   CREATE TABLE email_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     to_address TEXT NOT NULL,
     template_id TEXT NOT NULL,
     subject TEXT NOT NULL,
     status TEXT DEFAULT 'sent', -- sent, failed, bounced
     message_id TEXT,
     error TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

**Deliverables:**
- [ ] `src/services/emailService.ts`
- [ ] `src/pages/api/email/send.ts`
- [ ] Supabase migration for `email_log`
- [ ] Environment variables documented
- [ ] Test: send a welcome email via API route

**Acceptance criteria:**
- API route returns `{ success: true, messageId: "..." }` on valid request
- Email arrives in inbox within 30 seconds
- Failed sends logged to `email_log` with error details
- Rate limiting prevents abuse (5 emails/min per IP)

---

### T-902: Assessment Completion Email Template + Trigger
**Priority:** 🔴 P0 | **Est:** 5h | **Depends on:** T-901, T-712 (report persistence)

**Current state:** `EmailGate` component captures email but does nothing with it. No completion email exists.

**Target:** When a user completes a diagnostic assessment, automatically send them a branded email with:
1. Their archetype result (name + brief description)
2. Link to their full report page
3. "What's next" section (coaching, workshop, or Council invitation based on result)

**Scope:**
1. Create `src/email/templates/assessmentCompletion.tsx`:
   - Header: LYC Intelligence branding
   - Hero: "Your [Instrument] Result: [Archetype Name]"
   - Body: Archetype description (2-3 sentences), dimension score summary (visual bar chart or table)
   - CTA button: "View Your Full Report" → links to `/reports/[reportId]`
   - Soft upsell: "Ready to go deeper?" → coaching / workshop / Council CTA based on instrument
   - Footer: unsubscribe link, privacy policy
2. Wire trigger in assessment completion flow:
   - After `handleStartAssessment()` completes and scores are stored in Supabase (T-712)
   - Call `POST /api/email/send` with `{ to: userEmail, templateId: 'assessment_completion', data: { instrument, archetype, scores, reportId } }`
3. Update `EmailGate` component to:
   - Actually submit email to Supabase `assessment_responses` table
   - Trigger the completion email
   - Show "Check your email" confirmation

**Deliverables:**
- [ ] `src/email/templates/assessmentCompletion.tsx`
- [ ] Wire trigger in `DiagnosticPageLayout.tsx`
- [ ] Updated `EmailGate.tsx` with real submission
- [ ] Test: complete DRIVE diagnostic → receive email within 60 seconds

**Acceptance criteria:**
- Email contains correct archetype name matching the assessment result
- "View Full Report" button links to the correct report page
- Email renders correctly in Gmail, Outlook, Apple Mail
- No duplicate emails if user retakes the assessment

---

### T-903: "Next Steps" Email Sequence (Drip)
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** T-901, T-902

**Current state:** No post-assessment email sequence exists.

**Target:** A 3-email drip sequence sent after diagnostic completion, nudging the user toward deeper engagement.

**Scope:**

**Email 1 — Immediate (Day 0): "Your Results Are Ready"**
- Sent by T-902 (assessment completion email)
- Contains: archetype, report link, soft CTA

**Email 2 — Day 3: "What Your [Archetype] Means for Your Leadership"**
- Template: `src/email/templates/nextSteps_deepDive.tsx`
- Content: Expanded archetype analysis, development priorities, 2-3 actionable insights
- CTA: "Book a 1:1 Debrief" (Calendly link or contact form)
- Personalization: Use the specific archetype + dimension scores from the assessment

**Email 3 — Day 7: "Ready to Go Further?"**
- Template: `src/email/templates/nextSteps_upsell.tsx`
- Content: Based on instrument type:
  - QUEST → "Join our next Executive Capability Workshop"
  - DRIVE → "Explore what's holding you back — 1:1 Coaching"
  - SHIFT → "Lead this transformation in your team — Workshop"
  - Others → instrument-appropriate upsell
- CTA: Council invitation / Workshop registration / Coaching booking
- Secondary CTA: "Take another diagnostic" (cross-sell to complementary instrument)

**Implementation:**
1. Supabase table `email_sequences`:
   ```sql
   CREATE TABLE email_sequences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_email TEXT NOT NULL,
     sequence_type TEXT NOT NULL, -- 'post_assessment', 'post_webinar', etc.
     instrument_id TEXT,
     archetype_id TEXT,
     report_id UUID,
     emails_sent JSONB DEFAULT '[]',
     status TEXT DEFAULT 'active', -- active, completed, cancelled
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. Cron job (Vercel Cron or Supabase Edge Function):
   - Runs daily at 09:00 UTC
   - Checks `email_sequences` for emails due (Day 3, Day 7)
   - Sends via `emailService.sendEmail()`
   - Updates `emails_sent` array
   - Marks sequence as `completed` after final email
3. Create 2 new email templates:
   - `src/email/templates/nextSteps_deepDive.tsx`
   - `src/email/templates/nextSteps_upsell.tsx`
4. Wire sequence start: when T-902 sends completion email, also insert row into `email_sequences`

**Deliverables:**
- [ ] 2 new email templates
- [ ] `email_sequences` Supabase table
- [ ] Cron job configuration
- [ ] Sequence trigger wired to T-902
- [ ] Unsubscribe mechanism (set status to `cancelled`)

**Acceptance criteria:**
- Email 1 sent immediately on assessment completion
- Email 2 arrives ~3 days later (±2 hours)
- Email 3 arrives ~7 days later (±2 hours)
- Unsubscribe link in every email stops the sequence
- No duplicate sequences if user retakes same assessment

---

## Part B: Social Sharing with Real Data

### T-904: Social Share — Real Assessment Results
**Priority:** 🟡 P1 | **Est:** 6h | **Depends on:** T-712 (storage), T-902 (email)

**Current state:** `ShareAssessment` component exists but uses hardcoded mock links. `ShareCard` and `SharePage` exist but are disconnected.

**Target:** Users can generate a real, shareable link to their assessment results after completion.

**Scope:**
1. Supabase table `shared_results`:
   ```sql
   CREATE TABLE shared_results (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     report_id UUID REFERENCES assessment_responses(id),
     share_token TEXT UNIQUE NOT NULL,
     owner_email TEXT NOT NULL,
     include_scores BOOLEAN DEFAULT true,
     include_dimensions BOOLEAN DEFAULT true,
     include_percentile BOOLEAN DEFAULT false,
     expiration TIMESTAMPTZ, -- null = never
     view_count INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. API routes:
   - `POST /api/share/create` — creates share link from report_id
   - `GET /api/share/[token]` — returns share data (increments view_count)
3. Rewrite `ShareAssessment` component:
   - Replace mock data with API call to create share link
   - Toggle controls for what to include (scores, dimensions, percentile)
   - Expiration selector (7d, 30d, never)
   - Copy-to-clipboard button with real generated URL
   - Social share buttons: LinkedIn, Twitter/X, Email
4. Rewrite `SharePage` (`/share/[token]`):
   - Fetches real data from `GET /api/share/[token]`
   - Renders shareable result card: archetype name, instrument, dimension bars (if included), development suggestion
   - CTA: "Take Your Own Assessment" → links to `/assess/[instrument]`
   - Expired token → "This link has expired" message
5. Add share CTA in `DiagnosticPageLayout` — after report is unlocked, show "Share Your Result" button

**Deliverables:**
- [ ] `shared_results` Supabase table
- [ ] 2 API routes (create, get)
- [ ] Rewritten `ShareAssessment` component
- [ ] Rewritten `SharePage` component
- [ ] Share CTA added to `DiagnosticPageLayout`
- [ ] Social share buttons (LinkedIn, Twitter, Email)
- [ ] Test: share a DRIVE result → open link in incognito → see result

**Acceptance criteria:**
- Share link is unique and non-guessable (UUID token)
- Expired links show friendly message
- View count increments correctly
- Shared page renders correctly on mobile
- "Take Your Own Assessment" CTA links to the correct instrument

---

### T-905: Shareable Badge / Certificate Image
**Priority:** 🟢 P2 | **Est:** 5h | **Depends on:** T-904

**Current state:** No visual shareable asset exists.

**Target:** Generate a branded, downloadable image (PNG) of the assessment result that users can post on LinkedIn or share on social media.

**Scope:**
1. Create `src/components/share/ShareableBadge.tsx`:
   - Renders a 1200×630px card (LinkedIn/social optimized)
   - Content: LYC Intelligence branding, instrument name, archetype name, dimension scores as visual bars, tagline
   - Design: ink wash aesthetic, matching site design system
   - Export as PNG using `html2canvas` or `@vercel/og`-style SVG rendering
2. Download button on `SharePage` and in the post-assessment result view
3. "Share on LinkedIn" pre-fill:
   - Pre-populated text: "I'm a [Archetype] according to the LYC [Instrument] Diagnostic. #Leadership #ExecutiveCoaching"
   - Links to the share URL
4. Optional: watermark "LYC Intelligence" + "lyc-intelligence.app" on the image

**Deliverables:**
- [ ] `ShareableBadge` component
- [ ] PNG export functionality
- [ ] LinkedIn share pre-fill
- [ ] Download button in result view
- [ ] Test: download badge → upload to LinkedIn → image renders correctly

**Acceptance criteria:**
- Image is 1200×630px, <500KB
- Archetype name and instrument are clearly visible
- Branding is present but not overwhelming
- LinkedIn preview card renders correctly when share URL is pasted

---

## Part C: Credit → Assessment Wiring

### T-906: Credit-Gated Assessment Access
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** Phase 8 (T-811 Supabase schema, T-805 Benefits Dashboard)

**Current state:** Credit store page exists with pack definitions. Diagnostic pages are fully public. No connection between credits and assessments.

**Target:** Free diagnostics (first assessment per instrument) remain public. Full reports, retakes, and advanced instruments require credits or Council membership.

**Scope:**
1. Define access tiers per instrument:
   | Instrument | Free Tier | Credit-Gated |
   |---|---|---|
   | QUEST | Archetype name + teaser | Full report (5 credits) |
   | DRIVE | Archetype name + teaser | Full report (5 credits) |
   | SHIFT | Archetype name + teaser | Full report (5 credits) |
   | IMPACT | Archetype name + teaser | Full report (5 credits) |
   | PRISM | Archetype name + teaser | Full report (5 credits) |
   | MOSAIC | Archetype name + teaser | Full report (5 credits) |
   | FORGE | Archetype name + teaser | Full report (5 credits) |
   | LEAP | Full assessment (Council only) | N/A |
   | BRIDGE | Full assessment (Council only) | N/A |
   | SPARK | Full assessment (Council only) | N/A |

2. Update `DiagnosticPageLayout.tsx`:
   - Check auth status + credit balance before unlocking full report
   - If not logged in → "Create account to unlock your full report" (EmailGate)
   - If logged in but no credits → "This report requires 5 credits" + "Buy Credits" CTA
   - If Council member → auto-unlock (membership benefit)
   - If has credits → deduct credits on unlock, show confirmation
3. API route `POST /api/credits/deduct`:
   - Validates: user is authenticated, has sufficient credits OR is Council member
   - Deducts credits from `user_credits` table (or skips for Council members)
   - Returns: `{ success, remainingCredits }`
4. Update `CreditStorePage.tsx`:
   - Add diagnostic-specific credit pack recommendations ("Need credits for your DRIVE report? Starter pack covers 6 assessments")
5. Update `EmailGate.tsx`:
   - After email capture, check auth → if not logged in, create account first → then deduct credits for full report

**Deliverables:**
- [ ] Access tier configuration
- [ ] Updated `DiagnosticPageLayout` with credit checks
- [ ] `POST /api/credits/deduct` API route
- [ ] Updated `CreditStorePage` with recommendations
- [ ] Updated `EmailGate` with auth + credit flow
- [ ] Test: anonymous user → sees teaser → emails → creates account → sees "5 credits needed" → buys credits → unlocks report

**Acceptance criteria:**
- Anonymous users get archetype name + teaser (free)
- Logged-in non-members are prompted to buy credits or join Council
- Credit deduction happens atomically (no double-charging)
- Council members bypass credit check
- First assessment per instrument is free (no credit deduction) — if Kevin wants this
- Clear messaging at every step

---

### T-907: Workshop/Webinar → Credit Integration
**Priority:** 🟢 P2 | **Est:** 6h | **Depends on:** T-906

**Current state:** Workshop and webinar pages have registration forms but no connection to credits.

**Target:** Workshop registration deducts credits (or is free for Council members). Webinar registration captures lead and optionally deducts credits for premium webinars.

**Scope:**
1. Workshop pricing model:
   | Workshop | Non-Member | Council Member |
   |---|---|---|
   | Half-day (5-12 seats) | 30 credits | Included (1 credit) |
   | Full-day | 50 credits | Included (2 credits) |
   | Roundtable (8 seats) | 40 credits | Included (1 credit) |

2. Update workshop pages (`Force1DiscoveryPage`, `ShiftFacilitationPage`, etc.):
   - Registration form now checks auth + credits
   - If Council member: "Included with your membership" + 1-click register
   - If has credits: "This workshop costs 30 credits" + "Register & Deduct" button
   - If no credits: "Buy credits to register" + CreditStore CTA
3. Webinar registration:
   - Free webinars: just capture lead (name, email, company)
   - Premium webinars: require 5 credits OR Council membership
4. API route `POST /api/workshops/register`:
   - Validates auth, credits, and seat availability
   - Deducts credits for paid workshops
   - Sends confirmation email (use T-901 email infrastructure)
   - Returns: `{ success, bookingId, creditsRemaining }`

**Deliverables:**
- [ ] Updated 5 workshop pages with credit check
- [ ] Updated webinar registration flow
- [ ] `POST /api/workshops/register` API route
- [ ] Confirmation email template `src/email/templates/workshopConfirmation.tsx`
- [ ] Test: register for workshop → credits deducted → confirmation email received

**Acceptance criteria:**
- Council members register with 1-click (no credit deduction for included workshops)
- Non-members see clear pricing before registration
- Seat limits are respected (max 12 for half-day)
- Confirmation email includes workshop details + calendar invite link

---

## Part D: Missing Diagnostic Pages

### T-908: Build LEAP, BRIDGE, SPARK Diagnostic Pages
**Priority:** 🟡 P1 | **Est:** 6h | **Depends on:** Notion specs for these instruments

**Current state:** 7 diagnostic pages exist (QUEST, DRIVE, SHIFT, IMPACT, PRISM, MOSAIC, FORGE). 3 are missing: LEAP, BRIDGE, SPARK.

**Target:** Create the 3 missing diagnostic pages with the same `DiagnosticPageLayout` pattern.

**Scope:**
1. Add instrument definitions to `src/data/instruments.ts`:
   - LEAP: Leadership Emergence & Advancement Potential (dimensions TBD from Notion)
   - BRIDGE: Board Readiness & Impact Diagnostic (dimensions TBD from Notion)
   - SPARK: Innovation & Creative Leadership Diagnostic (dimensions TBD from Notion)
2. Add archetypes to `src/data/archetypes.ts`:
   - LEAP: 8-10 archetypes
   - BRIDGE: 8-10 archetypes
   - SPARK: 8-10 archetypes
3. Create page files:
   - `src/pages/assess/LeapPage.tsx`
   - `src/pages/assess/BridgePage.tsx`
   - `src/pages/assess/SparkPage.tsx`
4. Add routes to `App.tsx`:
   - `/assess/leap` → `LeapPage`
   - `/assess/bridge` → `BridgePage`
   - `/assess/spark` → `SparkPage`
5. Add to diagnostic hub/navigation if applicable

**Deliverables:**
- [ ] 3 new page files using `DiagnosticPageLayout`
- [ ] Instrument definitions in `instruments.ts`
- [ ] Archetype data in `archetypes.ts` (18-30 new archetypes)
- [ ] Routes added
- [ ] Test: navigate to `/assess/leap` → page renders with correct content

**Acceptance criteria:**
- All 3 pages render correctly with unique content
- Dimensions and archetypes match Notion specs
- Color coding is distinct from existing instruments
- Pages are discoverable from any diagnostic hub/index

---

## Execution Order

```
T-901 (Email Infra) → T-902 (Completion Email) → T-903 (Drip Sequence)
                                                    ↓
T-904 (Social Share) → T-905 (Badge Image)
                                                    ↓
T-906 (Credit-Gated Access) → T-907 (Workshop Credits)
                                                    ↓
T-908 (LEAP/BRIDGE/SPARK Pages)
```

**Sprint 1 (Email Foundation, 19h):** T-901 → T-902 → T-903
**Sprint 2 (Sharing & Credits, 19h):** T-904 → T-906 → T-907
**Sprint 3 (Polish, 11h):** T-905 → T-908

**Total: ~49h | 8 tickets | 3 sprints**

---

## Summary: What This Phase Delivers

After Phase 9, a user completing any diagnostic will experience:

1. **Take assessment** → real questions, not random scores
2. **See archetype result** → immediately on page
3. **Enter email** → unlocks full report + triggers completion email
4. **Receive email (Day 0)** → archetype, report link, "what's next"
5. **Receive deep-dive email (Day 3)** → expanded analysis, book a debrief CTA
6. **Receive upsell email (Day 7)** → workshop / coaching / Council invitation
7. **Share result** → generate real shareable link + downloadable badge image
8. **Post on LinkedIn** → pre-filled text + branded image
9. **Retake or try another** → credit-gated (free for Council members)
10. **Register for workshop** → credit deduction or Council-included

This completes the full diagnostic → engagement → conversion pipeline.
