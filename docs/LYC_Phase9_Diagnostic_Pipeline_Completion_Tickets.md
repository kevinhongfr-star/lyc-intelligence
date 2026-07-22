# Phase 9: Diagnostic Pipeline Completion — Full Stack Implementation

**Date:** 2026-07-22 (v2 — expanded from 17 to 27 tickets)
**Source:** Diagnostic system audit (Phase 7/8 gap analysis + Kevin review)
**Scope:** Complete end-to-end diagnostic pipeline: storage, questions, results UX, email, sharing, credits, admin, notifications
**Dependencies:** Phase 7 (T-701 to T-714) for report renderers; Phase 8 (T-801 to T-811) for council portal & credit infrastructure
**Principle:** Every diagnostic must work: take assessment → store answers → see rich results → receive email → share socially → pay credits for full report → admin can track everything

---

## Part A: Data & API Infrastructure

### T-901: Assessment Response Storage Schema
**Priority:** 🔴 P0 | **Est:** 5h

**Current state:** No storage for assessment responses. Scores are client-side only, lost on refresh.

**Target:** Complete Supabase schema for storing assessment submissions, responses, and results.

**Scope:**
1. Supabase tables:
   ```sql
   -- Assessment submissions (one per assessment attempt)
   CREATE TABLE assessment_submissions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     user_email TEXT NOT NULL,
     instrument_id TEXT NOT NULL, -- 'QUEST', 'DRIVE', etc.
     archetype_id TEXT, -- classified result
     archetype_confidence DECIMAL, -- 0-1
     dimension_scores JSONB NOT NULL, -- {"dimension_1": 72, "dimension_2": 45, ...}
     overall_score INTEGER,
     status TEXT DEFAULT 'in_progress', -- in_progress, completed, abandoned
     started_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ,
     time_spent_seconds INTEGER,
     device_type TEXT, -- 'mobile', 'desktop', 'tablet'
     referrer_url TEXT,
     metadata JSONB DEFAULT '{}'
   );

   -- Individual question responses
   CREATE TABLE assessment_responses (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     submission_id UUID REFERENCES assessment_submissions(id) ON DELETE CASCADE,
     question_index INTEGER NOT NULL, -- 0-19
     question_id TEXT NOT NULL,
     dimension_id TEXT NOT NULL,
     selected_answer_index INTEGER NOT NULL,
     score INTEGER NOT NULL, -- 1-5
     answered_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Index for fast lookups
   CREATE INDEX idx_submissions_user ON assessment_submissions(user_id);
   CREATE INDEX idx_submissions_instrument ON assessment_submissions(instrument_id);
   CREATE INDEX idx_responses_submission ON assessment_responses(submission_id);
   ```
2. RLS policies:
   - Users can read/write their own submissions
   - Admins can read all
3. TypeScript types: `src/types/assessment.ts`

**Deliverables:**
- [ ] Migration file with 2 tables + indexes
- [ ] RLS policies
- [ ] TypeScript types/interfaces
- [ ] Test: insert + query submission with responses

---

### T-902: Assessment API Endpoints
**Priority:** 🔴 P0 | **Est:** 6h | **Depends on:** T-901

**Target:** RESTful API for assessment submission, progress saving, and retrieval.

**Scope:**
1. `POST /api/assess/start` — Create new submission
   - Input: `{ instrumentId }`
   - Returns: `{ submissionId, questions[] }`
   - Auth: optional (anonymous users can start)

2. `PATCH /api/assess/[id]/progress` — Save partial progress
   - Input: `{ responses: [{questionIndex, answerIndex, score}] }`
   - Updates status to 'in_progress'
   - Auth: requires user_id or session token

3. `POST /api/assess/[id]/complete` — Submit final answers + classify
   - Input: `{ responses: [...], email?: string }`
   - Calculates dimension scores
   - Classifies archetype
   - Updates status to 'completed'
   - Triggers completion email (T-912)
   - Returns: `{ archetypeId, dimensionScores, reportUrl }`

4. `GET /api/assess/history` — User's assessment history
   - Returns: all submissions for authenticated user
   - Includes: instrument, archetype, date, scores

5. `GET /api/assess/[id]` — Get specific submission details
   - Auth: owner or admin only

6. Rate limiting: 10 starts/hour per IP

**Deliverables:**
- [ ] 5 API route files
- [ ] Rate limiting middleware
- [ ] Auth middleware (optional + required modes)
- [ ] Input validation (zod schemas)
- [ ] Test: full flow start → progress → complete → retrieve

---

### T-903: Save & Resume (Progress Persistence)
**Priority:** 🟡 P1 | **Est:** 4h | **Depends on:** T-902

**Target:** Users can save progress mid-assessment and resume later.

**Scope:**
1. Auto-save every 3 questions (debounced PATCH to `/api/assess/[id]/progress`)
2. Local storage fallback for anonymous users
3. "Resume Assessment" button on diagnostic page if in_progress submission exists
4. "You left off at question X of 20" messaging
5. Progress bar reflects actual saved progress
6. Abandoned after 7 days → status = 'abandoned'

**Deliverables:**
- [ ] Auto-save logic in `DiagnosticPageLayout`
- [ ] Resume detection on page load
- [ ] "Resume" CTA component
- [ ] Local storage fallback
- [ ] Test: start → close browser → reopen → resume at question 12

---

## Part B: Question Sets (Per-Instrument)

### T-904: QUEST Question Set — 20 Scenario Questions
**Priority:** 🔴 P0 | **Est:** 6h

**Target:** 20 scenario-based questions mapped to 5 dimensions (Cognitive Complexity, Adaptive Leadership, Stakeholder Intelligence, Mission Alignment, AI Readiness). Each question = leadership scenario with 4 answer choices scored 1-5.

**Scope:**
1. `src/data/questions/quest.ts` — 20 questions × 4 answers each
2. Update `DiagnosticPageLayout.tsx` for QUEST:
   - Replace `handleStartAssessment()` with real question flow via T-902 API
   - Render questions one at a time with progress bar
   - Auto-save progress (T-903)
   - Calculate dimension scores from answers
   - Classify archetype from dimension scores
3. Archetype classification: map dimension profile → closest archetype template + confidence score

**Deliverables:**
- [ ] `src/data/questions/quest.ts` (20 questions)
- [ ] QUEST question flow integrated with API
- [ ] Scoring + archetype classification
- [ ] Test: 20 answers → consistent archetype

---

### T-905: DRIVE Question Set — 20 Scenario Questions
**Priority:** 🔴 P0 | **Est:** 6h

**Target:** 20 questions mapped to DRIVE dimensions (Intrinsic Motivation, Relational Investment, Mission Alignment, Growth Orientation, Sustainability).

**Deliverables:**
- [ ] `src/data/questions/drive.ts`
- [ ] DRIVE question flow
- [ ] Scoring + classification (10 archetypes: Achiever, Craftsman, Champion, Explorer, etc.)

---

### T-906: SHIFT Question Set — 20 Scenario Questions
**Priority:** 🔴 P0 | **Est:** 6h

**Target:** 20 questions for SHIFT (Organizational Transformation Readiness).

**Deliverables:**
- [ ] `src/data/questions/shift.ts`
- [ ] SHIFT question flow + scoring

---

### T-907: IMPACT Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions for IMPACT (Board Effectiveness).

**Deliverables:**
- [ ] `src/data/questions/impact.ts`
- [ ] IMPACT question flow + scoring

---

### T-908: PRISM Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions for PRISM dimensions.

**Deliverables:**
- [ ] `src/data/questions/prism.ts`
- [ ] PRISM question flow + scoring

---

### T-909: MOSAIC Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions for MOSAIC dimensions.

**Deliverables:**
- [ ] `src/data/questions/mosaic.ts`
- [ ] MOSAIC question flow + scoring

---

### T-910: FORGE Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions for FORGE dimensions.

**Deliverables:**
- [ ] `src/data/questions/forge.ts`
- [ ] FORGE question flow + scoring

---

### T-911: LEAP Page + Question Set
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Build LEAP diagnostic page from scratch + 20 questions. LEAP = Leadership Emergence & Advancement Potential.

**Scope:**
1. `src/pages/assess/LeapPage.tsx` (using DiagnosticPageLayout)
2. `src/data/questions/leap.ts` (20 questions)
3. Add LEAP to `src/data/instruments.ts` (dimensions + score scales)
4. Add LEAP archetypes to `src/data/archetypes.ts` (8-10 archetypes)
5. Route `/assess/leap`
6. Full copy: description, dimensions, archetype grid, "what you'll learn"

**Deliverables:**
- [ ] LEAP page + copy
- [ ] Question set (20)
- [ ] Instrument + archetype definitions
- [ ] Route added

---

### T-912: BRIDGE Page + Question Set
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Build BRIDGE page + 20 questions. BRIDGE = Board Readiness & Impact Diagnostic.

**Deliverables:**
- [ ] BRIDGE page + copy
- [ ] Question set (20)
- [ ] Instrument + archetype definitions
- [ ] Route `/assess/bridge`

---

### T-913: SPARK Page + Question Set
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Build SPARK page + 20 questions. SPARK = Innovation & Creative Leadership.

**Deliverables:**
- [ ] SPARK page + copy
- [ ] Question set (20)
- [ ] Instrument + archetype definitions
- [ ] Route `/assess/spark`

---

## Part C: Results Experience

### T-914: Results Dashboard Component
**Priority:** 🔴 P0 | **Est:** 8h | **Depends on:** T-902

**Target:** Rich results page showing full diagnostic breakdown, not just archetype name.

**Scope:**
1. `src/components/diagnostic/ResultsDashboard.tsx`:
   - Archetype card: name, description, strengths, development areas
   - Radar/spider chart: 5 dimension scores (0-100 each)
   - Dimension breakdown: bar chart + per-dimension narrative
   - Archetype confidence indicator (high/medium/low)
   - Peer comparison (anonymized percentile bands, if data available)
   - "Your Top 3 Strengths" + "Your Top 3 Development Areas"
   - CTA: "Download PDF Report" / "Book a Debrief" / "Share Result"
2. Mobile-responsive layout
3. Loads from submission data (API)
4. Route: `/results/[submissionId]`

**Deliverables:**
- [ ] `ResultsDashboard` component
- [ ] Radar chart (reusable)
- [ ] Dimension breakdown
- [ ] Mobile responsive
- [ ] Route `/results/[submissionId]`
- [ ] Test: complete QUEST → see full results dashboard

---

### T-915: PDF Report Generation
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** T-914

**Target:** Downloadable branded PDF for each completed assessment.

**Scope:**
1. `src/services/pdfGenerator.ts`:
   - Uses `@react-pdf/renderer` or `puppeteer` (server-side)
   - Branded PDF template per instrument
   - Content: cover page, archetype profile, dimension scores, narratives, development recommendations
2. `POST /api/reports/[submissionId]/pdf`:
   - Generates PDF on-demand
   - Caches in Supabase Storage
   - Returns download URL (signed, 24h expiry)
3. "Download PDF" button in ResultsDashboard
4. PDF includes: LYC branding, assessment date, archetype, scores, actionable insights

**Deliverables:**
- [ ] PDF generation service
- [ ] API endpoint
- [ ] Download button in results
- [ ] PDF caching in Supabase Storage
- [ ] Test: download PDF → open → verify content matches results

---

### T-916: Retest & Progress Tracking
**Priority:** 🟢 P2 | **Est:** 6h | **Depends on:** T-902, T-914

**Target:** Users can retake assessments and compare before/after.

**Scope:**
1. "Retake" button in ResultsDashboard (available after 30 days)
2. Comparison view: side-by-side dimension scores (before vs. after)
3. Delta indicators: ↑ improved, ↓ declined, → stable
4. History view: all past attempts with dates + archetypes
5. `GET /api/assess/[instrumentId]/history` — returns all submissions for instrument
6. Notification: "You can retake [Instrument] now" (30 days after completion)

**Deliverables:**
- [ ] Retake flow (create new submission from existing)
- [ ] Comparison component (before/after)
- [ ] History view
- [ ] API endpoint for instrument history
- [ ] Test: take QUEST → wait → retake → see comparison

---

## Part D: Email Infrastructure

### T-917: Email Sending Infrastructure (Resend API)
**Priority:** 🔴 P0 | **Est:** 6h

**Current state:** Templates exist but NO sending infrastructure.

**Target:** Working email service for branded HTML emails.

**Scope:**
1. Install `resend` package
2. `src/services/emailService.ts`:
   - `sendEmail({ to, subject, template, data })`
   - Template rendering via `ReactDOMServer.renderToStaticMarkup`
   - Error handling + retry (1 retry, then log)
3. `src/pages/api/email/send.ts`:
   - Rate limit: 5 emails/minute per IP
   - Returns: `{ success, messageId }`
4. Env vars: `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` (intelligence@lyc-partners.ai)
5. Supabase table `email_log`

**Deliverables:**
- [ ] Email service
- [ ] API endpoint
- [ ] `email_log` table
- [ ] Test: send welcome email via API

---

### T-918: Assessment Completion Email
**Priority:** 🔴 P0 | **Est:** 5h | **Depends on:** T-917

**Target:** Automatic branded email on diagnostic completion.

**Scope:**
1. `src/email/templates/assessmentCompletion.tsx`:
   - Archetype name + description
   - Dimension score summary (mini chart)
   - "View Your Full Report" CTA → `/results/[submissionId]`
   - Soft upsell based on instrument
2. Wire trigger in T-902 completion flow
3. Update `EmailGate.tsx` to capture email + trigger

**Deliverables:**
- [ ] Completion email template
- [ ] Trigger wired
- [ ] Updated EmailGate
- [ ] Test: complete DRIVE → receive email within 30 seconds

---

### T-919: "Next Steps" Email Sequence (3-Email Drip)
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** T-917, T-918

**Target:** 3-email drip: Day 0 (results), Day 3 (deep-dive + debrief CTA), Day 7 (upsell).

**Scope:**
1. Email 2 (Day 3): `nextSteps_deepDive.tsx`
   - Expanded archetype analysis + 2-3 actionable insights
   - CTA: "Book a 1:1 Debrief" (Calendly link)
2. Email 3 (Day 7): `nextSteps_upsell.tsx`
   - Instrument-appropriate upsell (workshop/coaching/Council)
   - Secondary CTA: "Take another diagnostic"
3. `email_sequences` table + cron job (daily 09:00 UTC)
4. Unsubscribe mechanism

**Deliverables:**
- [ ] 2 email templates
- [ ] `email_sequences` table
- [ ] Cron job
- [ ] Unsubscribe link
- [ ] Test: complete → receive 3 emails over 7 days

---

### T-920: Debrief Booking Flow
**Priority:** 🟡 P1 | **Est:** 5h | **Depends on:** T-918

**Target:** "Book a debrief with a certified coach" CTA integrated into results + emails.

**Scope:**
1. Calendly embed or custom booking form
2. Pre-fill: user name, email, instrument taken, archetype
3. After booking: confirmation email with calendar invite
4. `src/email/templates/debriefConfirmation.tsx`
5. Integration point: ResultsDashboard CTA + drip email Day 3

**Deliverables:**
- [ ] Booking form/embed component
- [ ] Pre-fill from assessment data
- [ ] Confirmation email template
- [ ] Wired in results + emails
- [ ] Test: click CTA → book → receive confirmation

---

## Part E: Social Sharing & Certificates

### T-921: Social Share — Real Assessment Results
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** Generate real shareable links to assessment results.

**Scope:**
1. `shared_results` table (share_token, report_id, permissions, expiration, view_count)
2. `POST /api/share/create` + `GET /api/share/[token]`
3. Rewrite `ShareAssessment` + `SharePage` with real data
4. Social buttons: LinkedIn, Twitter/X, Email, Copy Link
5. Privacy controls: scores visible / archetype only / hidden

**Deliverables:**
- [ ] `shared_results` table
- [ ] 2 API routes
- [ ] Rewritten share components
- [ ] Privacy controls
- [ ] Test: share result → open in incognito → see result

---

### T-922: Shareable Badge Image
**Priority:** 🟢 P2 | **Est:** 5h | **Depends on:** T-921

**Target:** 1200×630 PNG of assessment result for LinkedIn/social.

**Scope:**
1. `ShareableBadge` component (1200×630px, LYC branding)
2. PNG export via `html2canvas`
3. "Share on LinkedIn" pre-fill text
4. Download button in results

**Deliverables:**
- [ ] Badge component + PNG export
- [ ] LinkedIn pre-fill
- [ ] Download button
- [ ] Test: download → upload to LinkedIn → renders correctly

---

### T-923: Completion Certificates
**Priority:** 🟢 P2 | **Est:** 5h | **Depends on:** T-914

**Target:** Branded downloadable certificate upon assessment completion.

**Scope:**
1. `src/components/certificate/Certificate.tsx`:
   - 1920×1360px (A4 landscape at 2x)
   - User name, instrument, archetype, completion date
   - LYC branding + ink wash aesthetic
   - Unique certificate ID
2. PDF export (via same mechanism as T-915)
3. "Download Certificate" button in ResultsDashboard
4. Verification: `/verify/[certificateId]` — public page confirming authenticity

**Deliverables:**
- [ ] Certificate component
- [ ] PDF export
- [ ] Download button
- [ ] Verification page
- [ ] Test: complete → download certificate → verify on public URL

---

## Part F: Credits & Admin

### T-924: Credit-Gated Assessment Access
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Free teaser → credits or Council membership for full report.

**Scope:**
1. Access tiers:
   | Tier | Anonymous | Registered (Free) | Credit Purchase | Council Member |
   |---|---|---|---|---|
   | Take assessment | ✅ | ✅ | ✅ | ✅ |
   | See archetype | ✅ | ✅ | ✅ | ✅ |
   | See dimension scores | ❌ | ❌ | ✅ (5 credits) | ✅ |
   | Download PDF report | ❌ | ❌ | ✅ (5 credits) | ✅ |
   | Download certificate | ❌ | ❌ | ✅ (3 credits) | ✅ |
   | Retake | ❌ | After 30d | After 30d | After 7d |

2. Update `DiagnosticPageLayout.tsx` with credit check
3. `POST /api/credits/deduct` — atomic deduction
4. Update `CreditStorePage.tsx` with diagnostic recommendations
5. Clear messaging at every gate

**Deliverables:**
- [ ] Access tier config
- [ ] Credit check in layout
- [ ] Credit deduction API
- [ ] Updated CreditStore
- [ ] Test: anonymous → teaser → register → buy credits → unlock

---

### T-925: Workshop/Webinar Credit Integration
**Priority:** 🟢 P2 | **Est:** 6h | **Depends on:** T-924

**Target:** Workshop registration deducts credits; Council members included.

**Scope:**
1. Workshop credit pricing (Half-day: 30, Full-day: 50, Roundtable: 40)
2. Update 5 workshop pages with credit check
3. `POST /api/workshops/register` — validate + deduct + confirm
4. Confirmation email: `workshopConfirmation.tsx`

**Deliverables:**
- [ ] 5 workshop pages updated
- [ ] Registration API
- [ ] Confirmation email
- [ ] Test: register → credits deducted → confirmation

---

### T-926: Admin Dashboard — Submissions & Analytics
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Admin view of all assessment submissions with analytics.

**Scope:**
1. `src/pages/admin/assessments.tsx`:
   - Table: all submissions (user, instrument, archetype, date, status, time spent)
   - Filters: instrument, date range, status, archetype
   - Export to CSV
2. Analytics summary cards:
   - Total assessments (all time / 30d / 7d)
   - Completion rate (% started → completed)
   - Most popular instrument
   - Top archetypes distribution
   - Email capture rate
   - Credit conversion rate
3. Charts: completion trend (line), archetype distribution (bar), instrument popularity (pie)
4. Individual submission drill-down (view answers, scores)
5. Route: `/admin/assessments` (admin-only)

**Deliverables:**
- [ ] Admin assessments page
- [ ] Analytics cards + charts
- [ ] CSV export
- [ ] Submission drill-down
- [ ] Admin auth guard
- [ ] Test: view dashboard → see real data → export CSV

---

### T-927: In-App Notification Center
**Priority:** 🟢 P2 | **Est:** 5h

**Target:** Users see notifications for: assessment completed, report ready, can retake, new features.

**Scope:**
1. `src/components/notifications/NotificationCenter.tsx`:
   - Bell icon in header with unread count
   - Dropdown: list of notifications
   - Types: assessment_complete, report_ready, retake_available, system
2. Supabase table `notifications`:
   ```sql
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     type TEXT NOT NULL,
     title TEXT NOT NULL,
     message TEXT,
     link TEXT,
     read BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
3. Trigger notifications from assessment completion, report generation, etc.
4. Mark as read / mark all as read

**Deliverables:**
- [ ] `notifications` table
- [ ] NotificationCenter component
- [ ] Bell icon in header
- [ ] Trigger wiring
- [ ] Test: complete assessment → see notification bell

---

### T-928: Mobile Assessment Optimization
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** Full assessment experience optimized for mobile devices.

**Scope:**
1. Question card: full-width, large tap targets (44px min), swipe navigation
2. Progress bar: sticky top, thumb-friendly
3. Results dashboard: vertical stack, swipeable dimension cards
4. Email capture: native keyboard types, autofill support
5. Share: native share API where available
6. Certificate: mobile-optimized preview + download
7. Test on: iPhone 14, Pixel 7, iPad Mini

**Deliverables:**
- [ ] Mobile question card component
- [ ] Swipe navigation
- [ ] Mobile results layout
- [ ] Native share integration
- [ ] Cross-device testing

---

## Execution Order

```
Part A — Data & API (15h): T-901 → T-902 → T-903
Part B — Questions (98h): T-904 → T-905 → T-906 → T-907 → T-908 → T-909 → T-910 → T-911 → T-912 → T-913
Part C — Results (22h): T-914 → T-915 → T-916
Part D — Email (24h): T-917 → T-918 → T-919 → T-920
Part E — Sharing (16h): T-921 → T-922 → T-923
Part F — Credits & Admin (33h): T-924 → T-925 → T-926 → T-927 → T-928
```

**Sprint 1 — Foundation + Core Questions (38h):**
T-901 → T-902 → T-903 → T-904 → T-905 → T-917

**Sprint 2 — Questions + Results (38h):**
T-906 → T-907 → T-908 → T-909 → T-914 → T-918

**Sprint 3 — Missing Pages + Email (33h):**
T-910 → T-911 → T-912 → T-913 → T-919 → T-920

**Sprint 4 — Sharing + Credits (32h):**
T-921 → T-922 → T-923 → T-924 → T-925

**Sprint 5 — Admin + Polish (24h):**
T-926 → T-927 → T-928 → T-915 → T-916

**Total: ~208h | 28 tickets | 5 sprints**

---

## Summary: What Phase 9 Delivers

After Phase 9, the complete diagnostic pipeline works:

| Capability | Status |
|---|---|
| Supabase storage for all responses | ✅ T-901 |
| RESTful API for assessment lifecycle | ✅ T-902 |
| Save & resume (progress persistence) | ✅ T-903 |
| 9 instruments × 20 real questions | ✅ T-904–T-913 |
| 3 new diagnostic pages (LEAP/BRIDGE/SPARK) | ✅ T-911–T-913 |
| Rich results dashboard (radar chart, dimensions) | ✅ T-914 |
| PDF report generation | ✅ T-915 |
| Retest & before/after comparison | ✅ T-916 |
| Email infrastructure (Resend) | ✅ T-917 |
| Completion email (auto-triggered) | ✅ T-918 |
| 3-email drip sequence | ✅ T-919 |
| Debrief booking flow | ✅ T-920 |
| Social sharing with real data | ✅ T-921 |
| Shareable badge image | ✅ T-922 |
| Completion certificates | ✅ T-923 |
| Credit-gated access tiers | ✅ T-924 |
| Workshop credit integration | ✅ T-925 |
| Admin dashboard & analytics | ✅ T-926 |
| In-app notifications | ✅ T-927 |
| Mobile-optimized assessment UX | ✅ T-928 |
