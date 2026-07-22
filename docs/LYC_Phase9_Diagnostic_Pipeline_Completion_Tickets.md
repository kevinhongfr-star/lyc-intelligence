# Phase 9: Diagnostic Pipeline Completion — Unified Engine Implementation

**Date:** 2026-07-23 (v3 — reconciled with ASSESSMENT_UNIFIED_SPEC_v1.md)
**Supersedes:** v2 (28 tickets) and v1 (17 tickets) — both incompatible with locked decisions
**Authority:** `docs/specs/ASSESSMENT_UNIFIED_SPEC_v1.md` — DECISIONS LOCKED Kevin 2026-07-20
**Dependencies:** Phase 7 (report renderers); Phase 8 (council portal, credit infrastructure)
**Core Principle:** ONE unified conversational engine. NOT a wizard. NOT a form. Nexus delivers questions through natural dialogue. Framework invisible to user.

---

## Part A: Notion Question Bank Import Pipeline

### T-901: Notion Question Bank Extraction
**Priority:** 🔴 P0 | **Est:** 8h

**Current state:** Notion API returns 0 blocks for all diagnostic pages (known blocker in Unified Spec §8). 3046 questions exist across 10 instruments in Notion but are inaccessible.

**Target:** Extract all question banks from Notion and store as structured JSON in repo.

**Scope:**
1. Resolve Notion API blocker:
   - Option A: Kevin shares diagnostic pages with N8N integration
   - Option B: Manual export via Notion UI → Markdown → parse
   - Option C: Use Notion page IDs from Unified Spec §5 to extract via alternative method
2. Extract 10 question banks:
   | # | Diagnostic | Notion Page ID | Est. Questions |
   |---|---|---|---|
   | 1 | FEA | `39bfafae-51be-81f6` | 36 |
   | 2 | SHIFT-LEAP | `bea984b4-0c50` | 305 |
   | 3 | SHIFT-QUEST | `c1fe201f-f104` | 366 |
   | 4 | SHIFT-DRIVE | `8d64b8a3-c399` (v2) | 244 |
   | 5 | SHIFT-COACH | `39bfafae-51be-8169` | 305 |
   | 6 | SHIFT-IMPACT | `40e0ae46-a9df` (v2) | 305 |
   | 7 | BRIDGE | `39bfafae-51be-8186-89c3` | 366 |
   | 8 | MOSAIC | `39bfafae-51be-81be` | 254 |
   | 9 | PRISM | `d142f44a-816d` (v2) | 305 |
   | 10 | FORGE | `39bfafae-51be-816f` | 364 |
   | 11 | SPARK | `39bfafae-51be-816c` | 273 |
3. Parse into standardized format:
   ```typescript
   interface QuestionBank {
     diagnosticId: string;
     version: string;
     questions: Question[];
     dimensions: DimensionDef[];
     scoringMappings: ScoringMapping[];
   }
   interface Question {
     id: string;
     text: string;
     dimensionId: string;
     answerScale: AnswerOption[]; // 1-5 or 1-7 Likert
     scenarioContext?: string;
   }
   ```
4. Store as `src/data/questionBanks/{diagnostic}.json`

**Deliverables:**
- [ ] Notion API access resolved (or manual extraction completed)
- [ ] All 10 question banks extracted
- [ ] Standardized JSON format
- [ ] Validation: question counts match expectations
- [ ] TypeScript types for question bank schema

**Acceptance criteria:**
- All 3046 questions accessible in structured JSON
- Each question has: text, dimension mapping, answer scale, scoring
- Version conflicts resolved (DRIVE v2, IMPACT v2, PRISM v2 per spec)

---

### T-902: Question Bank Validation & Test Harness
**Priority:** 🔴 P0 | **Est:** 4h | **Depends on:** T-901

**Target:** Verify all imported question banks are correct and complete.

**Scope:**
1. Validation script `scripts/validateQuestionBanks.ts`:
   - Every question has valid dimension mapping
   - Answer scales are consistent (1-5 or 1-7)
   - No duplicate question IDs
   - Scoring mappings produce valid dimension scores (0-100)
2. Test harness: CLI tool to take a diagnostic using imported questions
3. Report: validation results per instrument

**Deliverables:**
- [ ] Validation script
- [ ] Test harness CLI
- [ ] Validation report (per instrument)

---

## Part B: Unified Assessment Engine Core

### T-903: Assessment Session Management
**Priority:** 🔴 P0 | **Est:** 8h

**Target:** Server-side session management for all assessments.

**Scope:**
1. Supabase table `assessment_sessions`:
   ```sql
   CREATE TABLE assessment_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     diagnostic_id TEXT NOT NULL,
     status TEXT DEFAULT 'active', -- active, completed, expired, abandoned
     current_question_index INTEGER DEFAULT 0,
     answers JSONB DEFAULT '[]',
     conversation_context JSONB DEFAULT '{}',
     credits_charged BOOLEAN DEFAULT false,
     credit_amount INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     expires_at TIMESTAMPTZ, -- 60-min timeout
     completed_at TIMESTAMPTZ,
     result_id UUID,
     is_shift_component BOOLEAN DEFAULT false,
     shift_composite_id UUID
   );
   CREATE INDEX idx_sessions_user ON assessment_sessions(user_id);
   CREATE INDEX idx_sessions_status ON assessment_sessions(status);
   ```
2. RLS: users read/write own sessions; admins read all
3. Session lifecycle:
   - Create: check credits, deduct, set 60-min expiry
   - Resume: load existing active session (within 60 min)
   - Complete: lock session, trigger scoring
   - Expire: auto-mark expired sessions (cron every 15 min)
4. Concurrent block: one active session per user per diagnostic
5. API routes:
   - `POST /api/assess/start` — create session + deduct credits
   - `PATCH /api/assess/[id]/answer` — save answer + advance
   - `POST /api/assess/[id]/complete` — finalize + trigger scoring
   - `GET /api/assess/[id]` — get session state (for resume)

**Deliverables:**
- [ ] `assessment_sessions` table + RLS
- [ ] Session lifecycle management
- [ ] Credit deduction on start
- [ ] Concurrent block logic
- [ ] 4 API routes
- [ ] Expiry cron job

**Acceptance criteria:**
- Session created → credits deducted → 60-min timer starts
- Cannot start same diagnostic while session active
- Expired sessions auto-cleaned
- Resume works within 60-min window

---

### T-904: Scoring Pipeline
**Priority:** 🔴 P0 | **Est:** 8h | **Depends on:** T-903

**Target:** Raw answers → dimension scores → pattern classification → narrative → routing.

**Scope:**
1. `src/services/scoringEngine.ts`:
   ```
   Raw answers → Dimension scores (normalized 0-100)
               → Pattern classification (archetype/pattern match)
               → Narrative generation (DeepSeek API call)
               → Radar chart data
               → Routing recommendation (FEA → SHIFT/MOSAIC/BRIDGE)
               → Report assembly
   ```
2. Dimension scoring: sum question scores per dimension, normalize to 0-100
3. Pattern classification: map dimension profile → closest archetype/pattern
4. Narrative generation: call DeepSeek API with dimension scores + archetype → generate 2-3 paragraph narrative
5. Routing logic (FEA-specific):
   - Triple High → recommend full FEA
   - F1 Dominant → BRIDGE
   - F2 Dominant → SPARK
   - F3 Dominant → SHIFT
   - Balanced Moderate → SHIFT Composite
   - Low Exposure → PRISM or FORGE
6. Report assembly: combine narrative + radar data + scores + routing into result object
7. Store result in Supabase `assessment_results` table

**Deliverables:**
- [ ] `scoringEngine.ts`
- [ ] Dimension scoring function
- [ ] Pattern/archetype classification
- [ ] DeepSeek narrative generation
- [ ] FEA routing logic
- [ ] `assessment_results` table
- [ ] Test: 36 FEA answers → correct routing recommendation

**Acceptance criteria:**
- Dimension scores 0-100, consistent with same inputs
- Same answers always produce same archetype
- Narrative generated in <5 seconds (DeepSeek flash)
- Routing logic matches spec §3.1 patterns

---

### T-905: Conversational Question Delivery Layer
**Priority:** 🔴 P0 | **Est:** 10h | **Depends on:** T-903, T-904

**Target:** Nexus delivers questions through natural dialogue — NOT a form, NOT a wizard.

**Scope:**
1. `src/services/conversationLayer.ts`:
   - Wraps each question in natural dialogue context
   - Generates intro text before first question
   - Generates transitions between questions
   - Adapts follow-up based on previous answers
   - Generates completion summary
2. Anti-patterns (from spec §6):
   - ❌ No progress bar
   - ❌ No step numbers ("Question 5 of 36")
   - ❌ No dimension names visible
   - ❌ No raw numeric scores
3. Conversation flow:
   ```
   Nexus: "Let me ask you something about how you navigate complexity..."
   [Question 1 rendered in conversational context]
   User answers
   Nexus: "Interesting. Here's another situation..."
   [Question 2]
   ...
   Nexus: "Thanks for working through that. Here's what I'm seeing..."
   [Results summary]
   ```
4. DeepSeek for conversation text:
   - Before each question: generate contextual intro based on previous answers
   - On completion: generate summary transition
   - Use DeepSeek flash (fast, cheap) for conversation text
5. React component `ConversationalAssessment.tsx`:
   - Chat-like UI (messages from Nexus + user responses)
   - Auto-scroll, typing indicators
   - Mobile-responsive

**Deliverables:**
- [ ] `conversationLayer.ts`
- [ ] `ConversationalAssessment.tsx` component
- [ ] DeepSeek integration for conversation text
- [ ] Anti-pattern checks (no progress bar, no dimension names)
- [ ] Mobile-responsive chat UI
- [ ] Test: complete FEA micro quiz via conversation

**Acceptance criteria:**
- User never sees "Question X of Y"
- User never sees dimension names
- Questions feel like natural conversation
- Works on mobile (chat UI)
- Session auto-saved server-side

---

## Part C: FEA Build (Force Exposure Assessment)

### T-906: FEA Micro Quiz (Free Entry)
**Priority:** 🔴 P0 | **Est:** 6h | **Depends on:** T-901, T-905

**Target:** 6-9 question free quiz for lead capture + diagnostic routing.

**Scope:**
1. Import FEA micro quiz questions from Notion (subset of 36 questions → 6-9)
2. No credit check (FREE)
3. Conversational delivery via T-905
4. Output: pattern classification + teaser + diagnostic recommendation
5. Lead capture: email required before seeing results
6. Patterns (from spec §3.1):
   - Triple High → "Take the full assessment"
   - F1/F2/F3 Dominant → "Explore [BRIDGE/SPARK/SHIFT]"
   - Balanced Moderate → "SHIFT Composite might be for you"
   - Low Exposure → "PRISM or FORGE for growth"
7. Results: teaser only (archetype name + 1-2 sentences), full narrative requires paid FEA

**Deliverables:**
- [ ] FEA micro quiz questions imported
- [ ] Conversational flow for 6-9 questions
- [ ] Pattern classification logic
- [ ] Email gate before results
- [ ] Teaser results component
- [ ] Diagnostic recommendation CTA
- [ ] Test: complete micro quiz → get pattern + recommendation

---

### T-907: FEA Full Assessment (Paid)
**Priority:** 🔴 P0 | **Est:** 8h | **Depends on:** T-906, T-904

**Target:** 36-question paid FEA with full narrative + routing.

**Scope:**
1. All 36 FEA questions (12 per force)
2. Credit check + deduction before start
3. Full conversational delivery (10-15 min)
4. Full scoring pipeline (dimension scores + narrative + radar chart)
5. Diagnostic routing: recommend SHIFT, MOSAIC, or BRIDGE based on force profile
6. In-app report (no PDF download per spec §6)
7. Share via Nexus (generate shareable link)
8. Upsell: "Take [recommended diagnostic] for deeper analysis"

**Deliverables:**
- [ ] Full FEA question set (36 questions)
- [ ] Credit deduction flow
- [ ] Full narrative report
- [ ] Radar chart visualization
- [ ] Diagnostic routing output
- [ ] Shareable link generation
- [ ] Upsell CTA to recommended diagnostic

---

## Part D: Standalone Diagnostics

### T-908: BRIDGE — First Standalone Diagnostic
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** T-905 | **Target: Aug 2026**

**Target:** BRIDGE as first standalone diagnostic (content calendar alignment).

**Scope:**
1. Import BRIDGE question bank from Notion (366 questions → select appropriate subset)
2. Configure in unified engine (DiagnosticDefinition)
3. Conversational delivery via T-905
4. Full scoring + narrative + radar chart
5. Credit cost: Tier 2
6. Entry: Nexus conversation → credit deduction → full question set → report
7. Diagnostic page: `/assess/bridge` (existing page, update to use unified engine)

**Deliverables:**
- [ ] BRIDGE questions imported + validated
- [ ] DiagnosticDefinition configured
- [ ] Conversational flow working
- [ ] Full report (narrative + radar)
- [ ] Credit integration
- [ ] `/assess/bridge` updated to unified engine

---

### T-909: MOSAIC + SPARK Standalone Diagnostics
**Priority:** 🟡 P1 | **Est:** 12h | **Depends on:** T-908 | **Target: Sep-Oct 2026**

**Target:** MOSAIC (Sep) and SPARK (Oct) as standalone diagnostics.

**Scope:** Same pattern as T-908 for MOSAIC and SPARK.

**Deliverables:**
- [ ] MOSAIC questions imported + configured
- [ ] SPARK questions imported + configured
- [ ] Both using unified engine
- [ ] Reports working for both

---

### T-910: FORGE + PRISM Standalone Diagnostics
**Priority:** 🟢 P2 | **Est:** 10h | **Depends on:** T-909 | **Target: Nov 2026+**

**Target:** FORGE (Nov) and PRISM as final standalone diagnostics.

**Deliverables:**
- [ ] FORGE + PRISM questions imported
- [ ] Both configured in unified engine
- [ ] Reports working

---

## Part E: SHIFT Composite

### T-911: SHIFT Composite — Sub-Diagnostics (LEAP, QUEST, DRIVE, COACH, IMPACT)
**Priority:** 🟡 P1 | **Est:** 16h | **Depends on:** T-905

**Target:** 5 SHIFT sub-diagnostics available as components of SHIFT Composite.

**Scope:**
1. Import 5 question banks (LEAP, QUEST, DRIVE, COACH, IMPACT)
2. Configure each as `isShiftComponent: true` with `shiftSubType`
3. Each also available standalone (dual-mode per spec §2 Decision 3)
4. SHIFT Composite flow:
   - User starts SHIFT Composite
   - Can take all 5 or select subset
   - Results aggregated into composite leadership profile
   - Single credit charge (composite price, includes all sub-components)

**Deliverables:**
- [ ] 5 question banks imported
- [ ] Each configured as SHIFT component + standalone
- [ ] SHIFT Composite aggregator
- [ ] Composite report (aggregated profile)
- [ ] Credit: single composite charge

---

### T-912: SHIFT Composite — Aggregation & Reporting
**Priority:** 🟡 P1 | **Est:** 8h | **Depends on:** T-911

**Target:** Aggregate 5 sub-diagnostic results into composite leadership profile.

**Scope:**
1. Composite scoring: combine dimension scores from all 5 sub-diagnostics
2. Composite archetype: determine overall leadership pattern
3. Composite narrative: DeepSeek generates integrated analysis
4. Composite report: radar chart with 5 sub-scores + overall profile
5. Comparison view: see each sub-diagnostic + composite overlay

**Deliverables:**
- [ ] Composite scoring logic
- [ ] Composite archetype classification
- [ ] Composite narrative generation
- [ ] Composite report component
- [ ] Sub-diagnostic comparison view

---

## Part F: Diagnostic Routing & Nexus Integration

### T-913: Diagnostic Routing Engine
**Priority:** 🟡 P1 | **Est:** 6h | **Depends on:** T-904, T-907

**Target:** Nexus recommends diagnostic based on FEA results + conversation context.

**Scope:**
1. Routing logic (from FEA scoring output):
   - F1 Dominant → BRIDGE
   - F2 Dominant → SPARK
   - F3 Dominant → SHIFT
   - Balanced → SHIFT Composite
   - Low → PRISM/FORGE
2. Nexus conversation integration:
   - After FEA results, Nexus recommends diagnostic
   - "Based on what you've shared, I think [BRIDGE] would give you the deepest insight into..."
   - CTA: "Take [diagnostic] now" (pre-loads with credit check)
3. Contextual routing:
   - Consider user's conversation history
   - Consider previous diagnostics taken
   - Avoid recommending same diagnostic twice within 30 days

**Deliverables:**
- [ ] Routing logic function
- [ ] Nexus conversation integration
- [ ] Contextual recommendations
- [ ] CTA component in results

---

## Part G: Reports (In-App, Shared via Nexus)

### T-914: In-App Report Renderer
**Priority:** 🔴 P0 | **Est:** 8h | **Depends on:** T-904

**Target:** Rich in-app report for each completed assessment.

**Scope:**
1. `src/components/reports/AssessmentReport.tsx`:
   - Archetype/pattern card (name, description, strengths, development areas)
   - Radar chart (dimension scores, no raw numbers — use visual bands: High/Medium/Low)
   - Narrative section (DeepSeek-generated, 2-3 paragraphs)
   - "What This Means For You" section (actionable insights)
   - "Recommended Next Steps" (routing to other diagnostics, coaching, workshops)
2. No PDF download button (per spec §6 anti-patterns)
3. Share via Nexus: generate unique shareable link
4. Mobile-responsive

**Deliverables:**
- [ ] `AssessmentReport` component
- [ ] Radar chart (visual bands, not raw numbers)
- [ ] Narrative rendering
- [ ] Shareable link generation
- [ ] Mobile responsive
- [ ] Test: complete FEA → see full in-app report

---

### T-915: Social Sharing & Completion Experience
**Priority:** 🟡 P1 | **Est:** 6h | **Depends on:** T-914

**Target:** Shareable results + branded completion experience.

**Scope:**
1. Shareable link: `/share/[token]` with privacy controls
2. Social share buttons: LinkedIn, Twitter/X, Email
3. Shareable badge: 1200×630 PNG (archetype + diagnostic name)
4. Completion certificate: branded PDF with verification URL
5. In-app "Share" CTA after report

**Deliverables:**
- [ ] Shareable link system
- [ ] Social share buttons
- [ ] Badge PNG generator
- [ ] Certificate PDF generator
- [ ] Verification page `/verify/[certId]`

---

## Part H: Email & Notifications

### T-916: Email Infrastructure + Completion Sequence
**Priority:** 🟡 P1 | **Est:** 10h

**Target:** Email on completion + 3-email drip + debrief booking.

**Scope:**
1. Resend API infrastructure (same as before)
2. Completion email: archetype result + report link + "What's next"
3. 3-email drip: Day 0 (results) → Day 3 (deep-dive + debrief CTA) → Day 7 (upsell)
4. Debrief booking: Calendly embed + confirmation email
5. Retake notification: "You can retake [diagnostic] now" (30 days)

**Deliverables:**
- [ ] Resend API integration
- [ ] Completion email template
- [ ] 3-email drip sequence
- [ ] Debrief booking flow
- [ ] Retake notifications

---

## Part I: Credits, Admin & Mobile

### T-917: Credit-Gated Access (Adapted for Unified Engine)
**Priority:** 🟡 P1 | **Est:** 6h | **Depends on:** T-903

**Target:** Credit deducted on START (not completion). Micro quiz free.

**Scope:**
1. Access tiers (aligned to Unified Spec §4.4):
   - Micro Quiz: FREE (no credit check)
   - Full FEA: Deduct on start (no refund on abandonment)
   - Standalone diagnostics: Deduct on start
   - SHIFT Composite: Single composite charge
   - Council members: bypass or reduced cost
2. Update credit service to integrate with T-903 session creation
3. Clear messaging: "This assessment costs X credits. Credits are consumed when you start."

**Deliverables:**
- [ ] Credit deduction on session start
- [ ] No refund policy enforced
- [ ] Council member bypass
- [ ] Clear messaging in Nexus conversation

---

### T-918: Admin Dashboard — Submissions & Analytics
**Priority:** 🟡 P1 | **Est:** 8h

**Target:** Admin view of all assessment activity.

**Scope:**
1. Submissions table: user, diagnostic, status, date, scores, routing recommendation
2. Analytics: total assessments, completion rate, popular diagnostics, archetype distribution
3. CSV export
4. Individual submission drill-down

**Deliverables:**
- [ ] Admin assessments page
- [ ] Analytics dashboard
- [ ] CSV export
- [ ] Submission drill-down

---

### T-919: Mobile Optimization
**Priority:** 🟡 P1 | **Est:** 6h

**Target:** Conversational assessment UX optimized for mobile.

**Scope:**
1. Chat UI: full-width messages, large tap targets
2. Swipe navigation between Nexus messages
3. Auto-scroll, typing indicators
4. Native share API on mobile
5. Test on: iPhone 14, Pixel 7, iPad Mini

**Deliverables:**
- [ ] Mobile chat UI optimization
- [ ] Swipe navigation
- [ ] Native share integration
- [ ] Cross-device testing

---

## Execution Order

```
Part A — Notion Import (12h): T-901 → T-902
Part B — Engine Core (26h): T-903 → T-904 → T-905
Part C — FEA Build (14h): T-906 → T-907
Part D — Standalone (30h): T-908 → T-909 → T-910
Part E — SHIFT Composite (24h): T-911 → T-912
Part F — Routing (6h): T-913
Part G — Reports (14h): T-914 → T-915
Part H — Email (10h): T-916
Part I — Credits/Admin/Mobile (20h): T-917 → T-918 → T-919
```

**Sprint 1 — Foundation (38h):** T-901 → T-902 → T-903 → T-904
**Sprint 2 — Conversational Layer (24h):** T-905 → T-906 → T-917
**Sprint 3 — FEA + First Diagnostic (22h):** T-907 → T-908 → T-914
**Sprint 4 — SHIFT + Routing (30h):** T-911 → T-912 → T-913
**Sprint 5 — Remaining + Polish (42h):** T-909 → T-910 → T-915 → T-916 → T-918 → T-919

**Total: ~156h | 19 tickets | 5 sprints**

---

## What Changed from v2

| v2 (wrong) | v3 (aligned with Unified Spec) |
|---|---|
| Write 20 questions per instrument | Import 3046 questions from Notion |
| Form wizard with progress bar | Conversational delivery via Nexus |
| Visible dimension names + scores | Framework invisible to user |
| Separate code per diagnostic | ONE unified engine |
| PDF download | In-app report only |
| Credit on completion | Credit on START |
| 28 tickets | 19 tickets (consolidated) |
| ~208h | ~156h |

---

## Summary

Phase 9 now delivers:
1. ✅ All 10 question banks imported from Notion (3046 questions)
2. ✅ Unified assessment engine (session management, scoring, routing)
3. ✅ Conversational delivery via Nexus (NOT a wizard)
4. ✅ FEA micro quiz (free lead magnet) + full FEA (paid)
5. ✅ 9 standalone diagnostics (BRIDGE first, then MOSAIC, SPARK, FORGE, PRISM)
6. ✅ SHIFT Composite (5 sub-diagnostics aggregated)
7. ✅ Diagnostic routing (FEA → recommend SHIFT/MOSAIC/BRIDGE)
8. ✅ In-app reports (narrative + radar chart)
9. ✅ Social sharing + certificates
10. ✅ Email sequence (completion + drip + debrief)
11. ✅ Credit-gated access (deducted on start)
12. ✅ Admin dashboard
13. ✅ Mobile-optimized conversational UX
