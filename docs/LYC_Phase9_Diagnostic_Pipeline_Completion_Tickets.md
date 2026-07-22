# Phase 9: Diagnostic Pipeline Completion — Email, Sharing & Credits Wiring

**Date:** 2026-07-22
**Source:** Diagnostic system audit (Phase 7/8 gap analysis)
**Scope:** Close the remaining functional gaps in the diagnostic assessment pipeline
**Dependencies:** Phase 7 (T-701 to T-714) for report renderers & storage; Phase 8 (T-801 to T-811) for council portal & credit infrastructure
**Principle:** Every completed diagnostic must trigger: storage → report generation → email delivery → next-steps sequence → optional social sharing → optional credit-gated upsell

---

## Part A: Question Sets (Per-Instrument)

### T-901: QUEST Question Set — 20 Scenario Questions
**Priority:** 🔴 P0 | **Est:** 6h

**Current state:** No real questions for QUEST. `handleStartAssessment()` generates random scores.

**Target:** 20 scenario-based questions mapped to 5 dimensions (Cognitive Complexity, Adaptive Leadership, Stakeholder Intelligence, Mission Alignment, AI Readiness). Each question presents a leadership scenario with 4 answer choices scored 1-5. Scoring engine maps answers → dimension scores → archetype classification.

**Scope:**
1. Create `src/data/questions/quest.ts`:
   - 20 questions × 4 answers each
   - Each question tagged with dimension ID
   - Each answer has score (1-5) and text label
2. Update `DiagnosticPageLayout.tsx` for QUEST:
   - Replace `handleStartAssessment()` with real question flow
   - Render questions one at a time with progress bar
   - Calculate dimension scores from answers
   - Classify archetype from dimension scores
3. Archetype classification logic:
   - Map dimension score profile to closest archetype template
   - Handle transitional archetypes (score near boundary)
   - Return confidence score

**Deliverables:**
- [ ] `src/data/questions/quest.ts` (20 questions)
- [ ] QUEST-specific question flow in `DiagnosticPageLayout`
- [ ] Scoring + archetype classification
- [ ] Test: answer all 20 questions → get consistent archetype result

**Acceptance criteria:**
- Questions are leadership-relevant, not generic
- Same answers always produce same archetype
- Dimension scores sum correctly (0-100 per dimension)
- Progress bar shows completion (20 steps)

---

### T-902: DRIVE Question Set — 20 Scenario Questions
**Priority:** 🔴 P0 | **Est:** 6h

**Current state:** Same as QUEST — random scores.

**Target:** 20 questions mapped to 5 dimensions (Intrinsic Motivation, Relational Investment, Mission Alignment, Growth Orientation, Sustainability).

**Scope:** Same pattern as T-901 but for DRIVE dimensions and archetypes (Achiever, Craftsman, Champion, Explorer, Stalwart, Restless, Golden Handcuffs, Drifter, Burned-Out, Frozen Asset).

**Deliverables:**
- [ ] `src/data/questions/drive.ts`
- [ ] DRIVE question flow
- [ ] Scoring + classification
- [ ] Test: consistent archetype result

---

### T-903: SHIFT Question Set — 20 Scenario Questions
**Priority:** 🔴 P0 | **Est:** 6h

**Target:** 20 questions mapped to SHIFT dimensions. SHIFT = Organizational Transformation Readiness.

**Deliverables:**
- [ ] `src/data/questions/shift.ts`
- [ ] SHIFT question flow
- [ ] Scoring + classification

---

### T-904: IMPACT Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions mapped to IMPACT dimensions (Board Effectiveness).

**Deliverables:**
- [ ] `src/data/questions/impact.ts`
- [ ] IMPACT question flow
- [ ] Scoring + classification

---

### T-905: PRISM Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions mapped to PRISM dimensions.

**Deliverables:**
- [ ] `src/data/questions/prism.ts`
- [ ] PRISM question flow
- [ ] Scoring + classification

---

### T-906: MOSAIC Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions mapped to MOSAIC dimensions.

**Deliverables:**
- [ ] `src/data/questions/mosaic.ts`
- [ ] MOSAIC question flow
- [ ] Scoring + classification

---

### T-907: FORGE Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** 20 questions mapped to FORGE dimensions.

**Deliverables:**
- [ ] `src/data/questions/forge.ts`
- [ ] FORGE question flow
- [ ] Scoring + classification

---

### T-908: LEAP Page + Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Build LEAP diagnostic page + 20 questions. LEAP = Leadership Emergence & Advancement Potential.

**Scope:**
1. Create `src/pages/assess/LeapPage.tsx` using `DiagnosticPageLayout`
2. Create `src/data/questions/leap.ts` (20 questions)
3. Add LEAP to `src/data/instruments.ts` (dimensions from Notion spec)
4. Add LEAP archetypes to `src/data/archetypes.ts` (8-10 archetypes)
5. Add route `/assess/leap`

**Deliverables:**
- [ ] LEAP page file
- [ ] Question set (20 questions)
- [ ] Instrument + archetype definitions
- [ ] Route added
- [ ] Test: page renders, questions flow works

---

### T-909: BRIDGE Page + Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Build BRIDGE diagnostic page + 20 questions. BRIDGE = Board Readiness & Impact Diagnostic.

**Scope:** Same as T-908 but for BRIDGE.

**Deliverables:**
- [ ] BRIDGE page file
- [ ] Question set (20 questions)
- [ ] Instrument + archetype definitions
- [ ] Route added

---

### T-910: SPARK Page + Question Set — 20 Scenario Questions
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Build SPARK diagnostic page + 20 questions. SPARK = Innovation & Creative Leadership Diagnostic.

**Scope:** Same as T-908 but for SPARK.

**Deliverables:**
- [ ] SPARK page file
- [ ] Question set (20 questions)
- [ ] Instrument + archetype definitions
- [ ] Route added

---

## Part B: Email Infrastructure

### T-911: Email Sending Infrastructure (Resend API)
**Priority:** 🔴 P0 | **Est:** 6h

**Current state:** Email templates exist but NO sending infrastructure.

**Target:** Working email service that can send branded HTML emails from any trigger.

**Scope:**
1. Install `resend` package
2. Create `src/services/emailService.ts`:
   - `sendEmail({ to, subject, template, data })`
   - Template rendering via `ReactDOMServer.renderToStaticMarkup`
   - Error handling + retry (1 retry, then log)
3. Create `src/pages/api/email/send.ts`:
   - Rate limit: 5 emails/minute per IP
   - Accepts: `{ to, templateId, data }`
   - Returns: `{ success, messageId }`
4. Environment variables: `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` (intelligence@lyc-partners.ai), `EMAIL_FROM_NAME` (LYC Intelligence)
5. Supabase table `email_log`:
   ```sql
   CREATE TABLE email_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     to_address TEXT NOT NULL,
     template_id TEXT NOT NULL,
     subject TEXT NOT NULL,
     status TEXT DEFAULT 'sent',
     message_id TEXT,
     error TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

**Deliverables:**
- [ ] `src/services/emailService.ts`
- [ ] `src/pages/api/email/send.ts`
- [ ] `email_log` table migration
- [ ] Environment variables documented
- [ ] Test: send welcome email via API

**Acceptance criteria:**
- Email arrives within 30 seconds
- Failed sends logged with error details
- Rate limiting prevents abuse

---

### T-912: Assessment Completion Email Template + Trigger
**Priority:** 🔴 P0 | **Est:** 5h | **Depends on:** T-911

**Target:** Automatic branded email on diagnostic completion with archetype result + report link.

**Scope:**
1. Create `src/email/templates/assessmentCompletion.tsx`:
   - Archetype name + description
   - Dimension score summary
   - "View Your Full Report" CTA → `/reports/[reportId]`
   - Soft upsell based on instrument
2. Wire trigger in assessment completion flow
3. Update `EmailGate.tsx` to submit email to Supabase + trigger email

**Deliverables:**
- [ ] `src/email/templates/assessmentCompletion.tsx`
- [ ] Trigger wired in `DiagnosticPageLayout`
- [ ] Updated `EmailGate.tsx`
- [ ] Test: complete DRIVE → receive email

**Acceptance criteria:**
- Correct archetype in email
- Report link works
- Renders in Gmail, Outlook, Apple Mail
- No duplicates on retake

---

### T-913: "Next Steps" Email Sequence (3-Email Drip)
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** T-911, T-912

**Target:** 3-email drip: Day 0 (results), Day 3 (deep-dive + debrief CTA), Day 7 (upsell).

**Scope:**
1. Email 1: T-912 (completion email)
2. Email 2 — Day 3: `src/email/templates/nextSteps_deepDive.tsx`
   - Expanded archetype analysis
   - 2-3 actionable insights
   - CTA: "Book a 1:1 Debrief" (Calendly)
3. Email 3 — Day 7: `src/email/templates/nextSteps_upsell.tsx`
   - Instrument-appropriate upsell (workshop/coaching/Council)
   - Secondary CTA: "Take another diagnostic"
4. Supabase table `email_sequences`:
   ```sql
   CREATE TABLE email_sequences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_email TEXT NOT NULL,
     sequence_type TEXT NOT NULL,
     instrument_id TEXT,
     archetype_id TEXT,
     report_id UUID,
     emails_sent JSONB DEFAULT '[]',
     status TEXT DEFAULT 'active',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
5. Cron job (Vercel Cron or Supabase Edge Function):
   - Runs daily 09:00 UTC
   - Sends due emails (Day 3, Day 7)
   - Updates `emails_sent`
   - Marks `completed` after final email
6. Unsubscribe mechanism

**Deliverables:**
- [ ] 2 new email templates
- [ ] `email_sequences` table
- [ ] Cron job config
- [ ] Sequence trigger wired to T-912
- [ ] Unsubscribe mechanism
- [ ] Test: complete assessment → receive all 3 emails over 7 days

**Acceptance criteria:**
- Email 2 arrives Day 3 (±2 hours)
- Email 3 arrives Day 7 (±2 hours)
- Unsubscribe stops sequence
- No duplicates on retake

---

## Part C: Social Sharing

### T-914: Social Share — Real Assessment Results
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** Generate real shareable links to assessment results.

**Scope:**
1. Supabase table `shared_results`:
   ```sql
   CREATE TABLE shared_results (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     report_id UUID,
     share_token TEXT UNIQUE NOT NULL,
     owner_email TEXT NOT NULL,
     include_scores BOOLEAN DEFAULT true,
     include_dimensions BOOLEAN DEFAULT true,
     include_percentile BOOLEAN DEFAULT false,
     expiration TIMESTAMPTZ,
     view_count INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. API routes:
   - `POST /api/share/create`
   - `GET /api/share/[token]`
3. Rewrite `ShareAssessment` component with real API
4. Rewrite `SharePage` (`/share/[token]`) with real data
5. Add share CTA in `DiagnosticPageLayout`
6. Social buttons: LinkedIn, Twitter/X, Email

**Deliverables:**
- [ ] `shared_results` table
- [ ] 2 API routes
- [ ] Rewritten `ShareAssessment` + `SharePage`
- [ ] Share CTA in result view
- [ ] Social buttons
- [ ] Test: share DRIVE result → open in incognito → see result

**Acceptance criteria:**
- Unique, non-guessable token
- Expired links show friendly message
- View count increments
- Mobile-responsive shared page

---

### T-915: Shareable Badge / Certificate Image
**Priority:** 🟢 P2 | **Est:** 5h | **Depends on:** T-914

**Target:** Branded 1200×630 PNG of assessment result for LinkedIn/social.

**Scope:**
1. `src/components/share/ShareableBadge.tsx`:
   - 1200×630px card (LinkedIn optimized)
   - LYC branding, instrument, archetype, dimension bars
   - Ink wash aesthetic
2. PNG export via `html2canvas`
3. Download button in result view
4. "Share on LinkedIn" pre-fill: "I'm a [Archetype] according to LYC [Instrument] Diagnostic. #Leadership #ExecutiveCoaching"
5. Watermark: "LYC Intelligence" + "lyc-intelligence.app"

**Deliverables:**
- [ ] `ShareableBadge` component
- [ ] PNG export
- [ ] LinkedIn pre-fill
- [ ] Download button
- [ ] Test: download → upload to LinkedIn → renders correctly

**Acceptance criteria:**
- 1200×630px, <500KB
- Archetype clearly visible
- LinkedIn preview card renders

---

## Part D: Credit-Gated Access

### T-916: Credit-Gated Assessment Access
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Free teaser (archetype name) → credits or Council membership for full report.

**Scope:**
1. Access tiers:
   | Instrument | Free Tier | Credit-Gated |
   |---|---|---|
   | QUEST/DRIVE/SHIFT/IMPACT/PRISM/MOSAIC/FORGE | Archetype + teaser | Full report (5 credits) |
   | LEAP/BRIDGE/SPARK | Council only | N/A |

2. Update `DiagnosticPageLayout.tsx`:
   - Check auth + credits before unlocking
   - Not logged in → EmailGate
   - Logged in, no credits → "Buy Credits" CTA
   - Council member → auto-unlock
   - Has credits → deduct + unlock
3. API route `POST /api/credits/deduct`:
   - Validates auth + credits
   - Deducts atomically
   - Returns: `{ success, remainingCredits }`
4. Update `CreditStorePage.tsx` with diagnostic recommendations
5. Update `EmailGate.tsx` with auth + credit flow

**Deliverables:**
- [ ] Access tier config
- [ ] Updated `DiagnosticPageLayout`
- [ ] `POST /api/credits/deduct`
- [ ] Updated `CreditStorePage`
- [ ] Updated `EmailGate`
- [ ] Test: anonymous → teaser → email → account → "5 credits" → buy → unlock

**Acceptance criteria:**
- Free tier shows archetype + teaser
- Credit deduction atomic (no double-charge)
- Council members bypass
- Clear messaging at every step

---

### T-917: Workshop/Webinar → Credit Integration
**Priority:** 🟢 P2 | **Est:** 6h | **Depends on:** T-916

**Target:** Workshop registration deducts credits or is free for Council.

**Scope:**
1. Workshop pricing:
   | Workshop | Non-Member | Council Member |
   |---|---|---|
   | Half-day (5-12 seats) | 30 credits | Included (1 credit) |
   | Full-day | 50 credits | Included (2 credits) |
   | Roundtable (8 seats) | 40 credits | Included (1 credit) |

2. Update 5 workshop pages with credit check
3. Webinar: free = lead capture, premium = 5 credits OR Council
4. API route `POST /api/workshops/register`:
   - Validates auth, credits, seat availability
   - Deducts credits
   - Sends confirmation email
5. Create `src/email/templates/workshopConfirmation.tsx`

**Deliverables:**
- [ ] 5 workshop pages updated
- [ ] Webinar registration updated
- [ ] `POST /api/workshops/register`
- [ ] Confirmation email template
- [ ] Test: register → credits deducted → confirmation email

**Acceptance criteria:**
- Council members 1-click register
- Seat limits respected
- Confirmation email includes details + calendar invite

---

## Execution Order

```
Question Sets (54h): T-901 → T-902 → T-903 → T-904 → T-905 → T-906 → T-907 → T-908 → T-909 → T-910
Email Infra (19h): T-911 → T-912 → T-913
Sharing (11h): T-914 → T-915
Credits (14h): T-916 → T-917
```

**Sprint 1 — Question Sets Part 1 + Email (32h):** T-901 → T-902 → T-903 → T-911 → T-912
**Sprint 2 — Question Sets Part 2 + Sharing (32h):** T-904 → T-905 → T-906 → T-907 → T-914
**Sprint 3 — Missing Pages + Credits + Polish (34h):** T-908 → T-909 → T-910 → T-916 → T-917 → T-913 → T-915

**Total: ~98h | 17 tickets | 3 sprints**

---

## Summary: What This Phase Delivers

After Phase 9, every diagnostic instrument has:
1. ✅ 20 real scenario questions (not random scores)
2. ✅ Scoring engine that classifies archetype from answers
3. ✅ Automatic completion email with result + report link
4. ✅ 3-email drip sequence (Day 0/3/7)
5. ✅ Shareable link + downloadable badge image
6. ✅ Credit-gated access (free teaser → paid full report)
7. ✅ Council members bypass credit check
8. ✅ Workshop/webinar credit integration

This completes the full diagnostic → engagement → conversion pipeline.
