# Phase 9 — Candidate Portal &amp; MARIA Outreach Automation

**Status:** Draft v2.0 (restructured)
**Owner:** Trae (full-stack)
**Priority:** P1 — unlocks B2B candidate-side experience &amp; scalable sourcing
**Estimated effort:** 4–5 weeks (~160–200h), ~20 tickets
**Predecessor:** Phase 6 (B2C portal — assessment + profile patterns re-used), Phase 7 (documents/reports), Phase 7.5 (coaching excellence), Phase 8.5 (platform capabilities)
**Success metric:** End-to-end candidate journey live: invite → profile → apply → assess → coach → offer. MARIA delivers ≥3x outbound candidate volume per consultant.

---

## Why This Phase Exists

Phase 8 builds the client portal. Phase 9 closes the loop on the **other side of the marketplace** — the candidate. Today, candidate interaction is manual: consultants email CVs back and forth, assessments are sent as one-off links, and outreach is done from personal inboxes with no tracking, no sequencing, and no compliance layer.

This phase transforms LYC from a consultant-driven boutique into a **platform-driven recruitment firm** by:

1. **Giving candidates a proper home** — a portal where they manage their profile, track applications, complete assessments, and access coaching.
2. **Scaling candidate sourcing through MARIA** — automated multi-touch outreach sequences that let each consultant engage 5–10x more candidates without proportional headcount growth.
3. **Activating coaching as a candidate differentiator** — candidates get access to NEXUS interview prep and career coaching (from Phase 7.5), turning the application process into a value-add experience rather than a black box.
4. **Providing platform-grade tooling** — document upload, save/export, and web research (from Phase 8.5) are baked into the candidate experience from day one.

### Value &amp; Impact Metrics

| Metric | Current State | Target (Post-Phase 9) | Impact Type |
|--------|--------------|----------------------|-------------|
| Candidate outreach touches / consultant / week | ~30 (manual, personal email) | 200+ (MARIA sequences) | Efficiency — 6x+ volume |
| Candidate profile completion rate | N/A (no portal) | ≥70% of invited candidates complete profile | Engagement |
| Assessment completion rate (invited → finished) | ~55% (manual links) | ≥75% (in-portal + reminders) | Conversion |
| Time from mandate kickoff to first candidate submission | 5–7 days | 2–3 days | Speed to delivery |
| Candidate NPS on application experience | Not measured | ≥40 | Candidate experience |
| Outreach reply rate | ~5% (manual) | 12–18% (targeted sequences + AI reply routing) | Sourcing yield |
| Coaching tool activation (interview prep users) | N/A | ≥40% of active candidates use coaching tools | Retention &amp; differentiation |

---

## Milestones

### M1 — Candidate Portal Shell, Auth &amp; Profile Builder
**Effort:** 24–32h | **Priority:** P0

Foundation of the candidate experience. Candidates must be able to get in, build their profile, and upload their CV before anything else works.

#### Tickets

**T-C1: Candidate Auth &amp; Invitation System**
- Candidate account model (separate user_type from clients and internal users)
- Invitation flow: consultant invites → candidate receives magic-link / set-password email
- Self-signup path (candidate finds portal → creates profile → enters pending review state)
- Email verification required for all candidate accounts
- Password reset, session management, RLS bootstrap
- P0, 6–8h

**T-C2: Candidate Profile Builder**
- Multi-section profile: basic info, experience, education, skills, career preferences
- Career preferences: target roles, industries, seniority, salary expectations, location preferences
- Privacy settings: control what's visible to consultants vs. internal vs. public (if public profiles enabled)
- Profile completeness meter (guides candidate through sections)
- Save-as-draft + auto-save
- P0, 6–8h

**T-C3: CV / Document Upload Manager**
- Upload CV/resume (PDF, DOCX) — reuses Phase 8.5 document upload infrastructure
- Multiple CV support (e.g., general vs. technical version)
- CV preview, replace, delete, set-as-primary
- Auto-extracted profile data suggestion (Phase 5 NLP — parse CV → pre-fill profile fields)
- Document storage in `docs` system with proper access control
- P0, 4–6h

**T-C4: Candidate Dashboard Shell**
- Landing page after login: active applications, pending assessments, upcoming interviews, action items
- Navigation: Dashboard, Applications, Assessments, Profile, Documents, Coaching
- Notification bell + unread count
- Mobile-responsive layout (candidates are often on phones)
- P0, 4–6h

**T-C5: Notifications &amp; Email Preferences**
- Notification center (in-app list of events: new application stage, assessment invited, interview scheduled, feedback received)
- Email preference center (opt in/out of each notification type)
- Email templates for each notification event
- Unsubscribe links on all non-transactional emails
- P1, 4–6h

---

### M2 — Job Discovery &amp; Application Tracking
**Effort:** 20–28h | **Priority:** P0

Candidates can discover mandates they're eligible for, submit applications, and track progress through the pipeline.

#### Tickets

**T-C6: Mandate Browsing &amp; Job Discovery**
- Browse active mandates (filtered to what the candidate is eligible for per consultant curation)
- Mandate detail page: role description, company info (visibility per mandate settings), requirements, compensation range (if disclosed)
- Search + filters: role type, industry, location, seniority, remote/hybrid/on-site
- Saved / bookmarked mandates list
- "Express interest" button for mandates they haven't been submitted to yet
- P0, 6–8h

**T-C7: Application Submission Flow**
- Apply to a mandate: select CV, add cover letter (optional), confirm profile visibility
- Application confirmation page + email
- Consultant notification when candidate applies
- Withdraw application functionality (with reason prompt)
- P0, 4–6h

**T-C8: Application Tracking Dashboard**
- "My Applications" list: active + archived
- Stage per application: Resume Review → Initial Interview → Client Interview(s) → Offer → Closed
- Status badges + next-action callouts (e.g., "Interview scheduled — Friday 2pm")
- Application timeline: stage changes, feedback received, documents shared
- Archived applications (placed, withdrawn, rejected) with reason where applicable
- P0, 6–8h

**T-C9: Application Detail &amp; Interview Management**
- Full application detail view
- Interview list: upcoming + past, with date/time, interviewer name &amp; title, format (video/in-person)
- Interview detail: calendar invite sync, prep materials (shared by consultant), join links
- Reschedule request flow (candidate proposes new times → consultant approves)
- Document sharing (assessment reports, interview prep guides) — reuses Phase 7 document sharing
- P1, 4–6h

---

### M3 — NEXUS Assessment Integration &amp; Evaluation Results
**Effort:** 16–24h | **Priority:** P1 (high)

Candidates complete NEXUS assessments inside the portal (invited by consultants) and receive structured feedback. Reuses ~80% of Phase 6 B2C assessment engine.

#### Tickets

**T-C10: Assessment Invitation Flow**
- Consultant invites candidate to assessment (from internal portal — integration with Phase 4/8)
- Candidate receives email + in-app notification
- Assessment welcome page: purpose, estimated time, instructions, privacy note
- Start assessment → creates assessment session linked to candidate + mandate
- P1, 4–6h

**T-C11: In-Portal Assessment Experience (reuse Phase 6)**
- Reuse SHIFT / TRIDENT assessment wizard components from Phase 6 B2C portal
- Adapt auth context: candidate user_type + mandate-scoped (vs. B2C self-serve)
- Progress saving + resume capability
- Assessment complete → results generated (reuses Phase 5 scoring engine)
- P1, 6–8h

**T-C12: Candidate-Facing Assessment Results &amp; Feedback**
- Results page: candidate view (configurable — consultant controls what's visible)
- Visual score cards, competency breakdown, development suggestions
- Option to share full results with consultant / download PDF report
- Results tied to specific mandate application
- Feedback history across multiple assessments
- P1, 6–8h

---

### M4 — MARIA Outreach Automation (Campaigns &amp; Sequences)
**Effort:** 32–40h | **Priority:** P0

The biggest new system in this phase. MARIA is the outbound engine that lets consultants run multi-touch email campaigns at scale.

#### Tickets

**T-C13: Campaign &amp; Sequence Engine (Core)**
- **Campaign** entity: tied to a mandate, with target audience, assigned sequence, status
- **Sequence** entity: multi-step email sequence with timing between steps
- **Sequence Step** entity: subject line, body template, send delay (e.g., "+2 days"), variant (for A/B)
- Sequence builder UI (internal): create/edit sequences, drag-and-drop step ordering, preview
- Campaign management UI: create campaign, select target candidates, assign sequence, start/pause/end
- Enrollment engine: add candidates to sequence → track step progress → auto-send at scheduled time
- Pause rules: reply detected → auto-pause; candidate opts out → remove; candidate moves pipeline stage → pause
- P0, 10–12h

**T-C14: Email Sending Infrastructure &amp; Deliverability**
- Email provider integration (Resend / SendGrid / SES — decision in implementation)
- Dedicated sending domain(s) separate from lyc-partners.ai (protect main domain reputation)
- Domain authentication: SPF, DKIM, DMARC setup
- Template rendering with merge variables: `{{first_name}}`, `{{company}}`, `{{role_title}}`, etc.
- Open tracking (pixel), click tracking (link rewriting), bounce handling
- Unsubscribe link + compliance footer (CAN-SPAM / PIPL / GDPR compliant)
- Send throttling: ramp-up per domain, max sends/hour, business-hours send windows
- P0, 8–10h

**T-C15: Suppression Lists &amp; Compliance**
- Global unsubscribe list (honored across all campaigns)
- Hard bounce suppression (auto-added on bounce)
- Do-not-contact lists per client / per mandate
- Opt-out reason capture
- Compliance audit log: who was sent what, when they opted out
- P1, 4–6h

**T-C16: Campaign Performance Dashboard (Internal)**
- Campaign stats: sent, delivered, opened, clicked, replied, bounced, unsubscribed
- Funnel visualization
- A/B test results comparison
- Per-candidate engagement detail
- Export to CSV / report
- P1, 4–6h

**T-C17: Reply Detection, Routing &amp; AI Classification**
- Reply ingestion: webhook / IMAP polling → detect candidate replies
- Reply auto-classification (AI-powered, Phase 5 NLP):
  - Interested / Not interested / Out of office / Question / Referral / Unsubscribe
- Priority scoring
- Auto-respond rules: out-of-office → pause + retry later; referral → thank you + ask for intro contact
- Reply inbox (internal): all replies in one place, filter by campaign/consultant/status, assign to consultant
- Conversation threading: full email thread per candidate per campaign
- Consultant can reply from portal (sends through outreach infrastructure)
- Follow-up reminders: nudge consultant after X days of unanswered reply
- P1, 6–8h

---

### M5 — Interview Prep &amp; Coaching (Phase 7.5 Integration)
**Effort:** 16–22h | **Priority:** P1 (high differentiator)

Candidates get access to NEXUS coaching tools for interview prep and career development. This is a **major candidate experience differentiator** — no competing recruitment firm gives candidates free AI coaching.

#### Tickets

**T-C18: Coaching Hub for Candidates**
- "Coaching" section in candidate portal navigation
- Coaching dashboard: active coaching sessions, interview prep modules, career development resources
- Entry points tied to context:
  - From interview page → "Prepare for this interview with NEXUS"
  - From assessment results → "Work on your development areas with NEXUS"
  - From profile → "Career development coaching"
- Reuses Phase 7.5 coaching excellence modules (interview prep, offer negotiation, positioning)
- Access rules: active candidates get limited coaching credits; placed candidates get extended access
- P1, 6–8h

**T-C19: Interview-Specific Coaching Module**
- Interview prep flow: company research (uses Phase 8.5 web research), role analysis, STAR story bank
- Mock interview Q&A with NEXUS (voice or text)
- Feedback on response quality, structure, and content
- Interview prep sheet generation (exportable — reuses Phase 7 deliverable templates)
- P1, 6–8h

**T-C20: Web Research Integration (Phase 8.5)**
- Candidate can research target companies / roles before interviews
- Reuses Phase 8.5 web research engine
- Research results saved to candidate's document library
- Integration with interview prep module (auto-research the company for upcoming interviews)
- P2, 4–6h

---

### M6 — Communication Hub &amp; Notification System
**Effort:** 12–16h | **Priority:** P1

Unified communication layer — in-app, email, and candidate-consultant messaging.

#### Tickets

**T-C21: In-App Messaging with Consultant**
- Direct messaging between candidate and assigned consultant
- Real-time or near-real-time (polling / websockets — decision in implementation)
- Message history tied to candidate + mandate
- File attachments (reuses document upload)
- Email notification for new messages
- P1, 6–8h

**T-C22: Notification Center &amp; Preferences**
- Consolidated notification center (inbox-style)
- Notification categories: application updates, assessment invites, interview changes, messages, coaching, marketing
- Per-category email / in-app toggle
- Digest option (daily / weekly summary instead of real-time)
- Push notification foundation (mobile-ready — actual push in later phase)
- P1, 4–6h

**T-C23: Reminder Automation**
- Auto-reminders: upcoming interviews (24h before), pending assessments (invited + 3 days), incomplete profiles
- Coaching engagement nudges (if candidate hasn't used coaching in 7 days but has active application)
- Reminder templates + schedule config
- P2, 2–4h

---

## Data Model Additions

### New Tables

**`candidate_profiles`**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, unique)
- `first_name`, `last_name`, `email`, `phone`, `location`
- `current_company`, `current_title`, `linkedin_url`
- `career_preferences` (JSONB — target roles, industries, salary, location, seniority)
- `privacy_settings` (JSONB — visibility controls)
- `profile_completeness_pct` (integer, 0-100)
- `status` (text — `invited`, `active`, `inactive`, `opted_out`)
- `source` (text — `consultant_invite`, `self_signup`, `outreach_campaign`)
- `created_at`, `updated_at`
- RLS: candidate = select/update own; consultants = select candidates in their pipeline; internal = full

**`candidate_cvs`**
- `id` (UUID, PK)
- `candidate_profile_id` (UUID, FK → candidate_profiles)
- `document_id` (UUID, FK → docs.documents)
- `file_name`, `file_type`
- `is_primary` (boolean)
- `extracted_data` (JSONB — auto-parsed CV data)
- `created_at`, `updated_at`
- RLS: candidate = own; consultants = read-only for candidates they work with

**`candidate_applications`**
- `id` (UUID, PK)
- `candidate_profile_id` (UUID, FK → candidate_profiles)
- `mandate_id` (UUID, FK → mandates)
- `cv_id` (UUID, FK → candidate_cvs, nullable)
- `stage` (text — `resume_review`, `initial_interview`, `client_interview`, `offer`, `closed_won`, `closed_lost`, `withdrawn`)
- `status_reason` (text, nullable)
- `submitted_by` (UUID, FK → auth.users — consultant who submitted, or self-applied)
- `next_action` (text, nullable)
- `next_action_date` (timestamptz, nullable)
- `created_at`, `updated_at`
- RLS: candidate = own; consultants = candidates in their pipeline

**`candidate_application_timeline`**
- `id` (UUID, PK)
- `application_id` (UUID, FK → candidate_applications)
- `event_type` (text — `stage_change`, `feedback`, `interview_scheduled`, `document_shared`, `note`)
- `event_data` (JSONB)
- `visible_to_candidate` (boolean)
- `created_by` (UUID, FK → auth.users)
- `created_at`
- RLS: candidate = own + visible_to_candidate=true; consultants = all for their candidates

**`candidate_interviews`**
- `id` (UUID, PK)
- `application_id` (UUID, FK → candidate_applications)
- `interviewer_name`, `interviewer_title`
- `scheduled_at` (timestamptz)
- `duration_minutes` (integer)
- `format` (text — `video`, `in_person`, `phone`)
- `location` or `meeting_link` (text, nullable)
- `status` (text — `scheduled`, `completed`, `cancelled`, `reschedule_requested`)
- `prep_materials_doc_ids` (UUID array, nullable)
- `created_at`, `updated_at`
- RLS: candidate = own; consultants = their candidates

**`candidate_assessment_invites`**
- `id` (UUID, PK)
- `candidate_profile_id` (UUID, FK → candidate_profiles)
- `application_id` (UUID, FK → candidate_applications, nullable)
- `assessment_type` (text — `shift`, `trident`, `executive_coaching`, etc.)
- `assessment_session_id` (UUID, FK → nexus_assessment_sessions, nullable)
- `invited_by` (UUID, FK → auth.users)
- `status` (text — `invited`, `started`, `completed`, `expired`)
- `results_visibility` (JSONB — what the candidate can see)
- `invited_at`, `started_at`, `completed_at`, `expires_at`
- RLS: candidate = own; consultants = their candidates

**`outreach_campaigns`**
- `id` (UUID, PK)
- `mandate_id` (UUID, FK → mandates, nullable)
- `sequence_id` (UUID, FK → outreach_sequences)
- `name`, `description`
- `created_by` (UUID, FK → auth.users)
- `owner_id` (UUID, FK → auth.users — consultant responsible)
- `status` (text — `draft`, `active`, `paused`, `completed`, `archived`)
- `target_count` (integer)
- `started_at`, `ended_at`, `created_at`, `updated_at`
- RLS: internal users only; consultants = own campaigns; admins = all

**`outreach_sequences`**
- `id` (UUID, PK)
- `name`, `description`
- `created_by` (UUID, FK → auth.users)
- `is_template` (boolean — can be reused across campaigns)
- `created_at`, `updated_at`
- RLS: internal users only

**`outreach_sequence_steps`**
- `id` (UUID, PK)
- `sequence_id` (UUID, FK → outreach_sequences)
- `step_index` (integer — order in sequence)
- `subject_template` (text)
- `body_template` (text — markdown/HTML)
- `send_delay_hours` (integer — delay after previous step)
- `variant` (text — `A`, `B`, etc. for A/B testing)
- `send_window_start`, `send_window_end` (time — business hours)
- `created_at`, `updated_at`
- RLS: internal users only

**`outreach_enrollments`**
- `id` (UUID, PK)
- `campaign_id` (UUID, FK → outreach_campaigns)
- `candidate_profile_id` (UUID, FK → candidate_profiles)
- `current_step_index` (integer)
- `next_send_at` (timestamptz)
- `status` (text — `enrolled`, `active`, `paused`, `completed`, `replied`, `unsubscribed`, `bounced`)
- `enrolled_at`, `status_changed_at`
- RLS: internal users only

**`outreach_email_events`**
- `id` (UUID, PK)
- `enrollment_id` (UUID, FK → outreach_enrollments)
- `step_id` (UUID, FK → outreach_sequence_steps)
- `event_type` (text — `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `replied`)
- `event_data` (JSONB — link clicked, bounce reason, etc.)
- `occurred_at` (timestamptz)
- RLS: internal users only

**`outreach_suppressions`**
- `id` (UUID, PK)
- `email` (text, unique)
- `candidate_profile_id` (UUID, FK → candidate_profiles, nullable)
- `reason` (text — `unsubscribe`, `hard_bounce`, `complaint`, `manual_dnc`)
- `source_campaign_id` (UUID, nullable)
- `created_at`
- RLS: internal users only

**`candidate_messages`**
- `id` (UUID, PK)
- `candidate_profile_id` (UUID, FK → candidate_profiles)
- `application_id` (UUID, FK → candidate_applications, nullable)
- `sender_user_id` (UUID, FK → auth.users)
- `sender_type` (text — `candidate`, `consultant`)
- `body` (text)
- `attachments` (UUID array — document IDs)
- `read_at` (timestamptz, nullable)
- `created_at`
- RLS: candidate = own thread; consultants = their candidate threads

**`candidate_notifications`**
- `id` (UUID, PK)
- `candidate_profile_id` (UUID, FK → candidate_profiles)
- `type` (text — `application_update`, `assessment`, `interview`, `message`, `coaching`, `system`)
- `title`, `body`
- `read_at` (timestamptz, nullable)
- `action_url` (text, nullable)
- `created_at`
- RLS: candidate = own only

### New Views

**`v_candidate_application_overview`**
- Aggregates application + latest stage + next action for dashboard display
- Used by candidate dashboard "My Applications"

**`v_campaign_performance`**
- Aggregates outreach_email_events per campaign
- Sent, delivered, opened, clicked, replied, bounced, unsubscribed counts
- Used by campaign performance dashboard

**`v_candidate_active_journey`**
- Active applications + upcoming interviews + pending assessments
- Used by coaching hub for context-aware coaching entry points

---

## Frontend Components to Build

| Component | Description | Milestone |
|-----------|-------------|-----------|
| `CandidateProfileEditor` | Multi-section profile form with completeness meter | M1 |
| `CvUploadManager` | CV upload, preview, replace, set-primary | M1 |
| `CandidateDashboard` | Landing page — applications, interviews, assessments, action items | M1 |
| `NotificationBell` | In-app notification indicator + dropdown list | M1 / M6 |
| `MandateBrowseList` | Job/mandate browsing with search + filters | M2 |
| `MandateDetailCard` | Full mandate description + apply button | M2 |
| `ApplicationTimeline` | Stage-by-stage timeline of application events | M2 |
| `InterviewCard` | Interview details with join link + prep materials | M2 |
| `AssessmentInviteCard` | Assessment invitation + start button | M3 |
| `AssessmentResultsViewer` | Candidate-facing results display (configurable visibility) | M3 |
| `SequenceBuilder` | (Internal) Drag-and-drop sequence step editor | M4 |
| `CampaignPerformanceChart` | (Internal) Campaign funnel + engagement metrics | M4 |
| `ReplyInbox` | (Internal) Reply management with AI classification | M4 |
| `CoachingHub` | Candidate coaching dashboard with entry points | M5 |
| `InterviewPrepModule` | Structured interview prep with NEXUS integration | M5 |
| `ResearchPanel` | Company/role web research (Phase 8.5 integration) | M5 |
| `CandidateMessageThread` | Candidate-consultant messaging UI | M6 |
| `NotificationCenter` | Full notification list with filters + mark-read | M6 |

---

## API Endpoints

### Candidate Portal (candidate-facing, `/v1/candidate/*`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/candidate/invite` | POST | (Internal) Invite candidate — creates account + sends email |
| `/v1/candidate/accept-invite` | POST | Accept invite + set password |
| `/v1/candidate/profile` | GET | Get own profile |
| `/v1/candidate/profile` | PATCH | Update own profile |
| `/v1/candidate/cv` | GET | List CVs |
| `/v1/candidate/cv/upload` | POST | Upload new CV (uses Phase 8.5 doc upload) |
| `/v1/candidate/cv/:id` | DELETE | Delete CV |
| `/v1/candidate/cv/:id/primary` | PUT | Set CV as primary |
| `/v1/candidate/mandates` | GET | Browse visible mandates |
| `/v1/candidate/mandates/:id` | GET | Mandate detail |
| `/v1/candidate/applications` | GET | List own applications |
| `/v1/candidate/applications` | POST | Submit new application |
| `/v1/candidate/applications/:id` | GET | Application detail + timeline |
| `/v1/candidate/applications/:id/withdraw` | POST | Withdraw application |
| `/v1/candidate/interviews` | GET | List upcoming interviews |
| `/v1/candidate/interviews/:id/reschedule-request` | POST | Request reschedule |
| `/v1/candidate/assessments` | GET | List assessment invites |
| `/v1/candidate/assessments/:id/start` | POST | Start assessment session |
| `/v1/candidate/assessments/:id` | GET | Assessment state / results |
| `/v1/candidate/assessments/:id/submit` | POST | Submit assessment answer(s) |
| `/v1/candidate/assessments/:id/report` | GET | Download assessment report PDF |
| `/v1/candidate/messages` | GET | List message threads |
| `/v1/candidate/messages/:threadId` | GET | Thread detail |
| `/v1/candidate/messages/:threadId` | POST | Send message |
| `/v1/candidate/notifications` | GET | List notifications |
| `/v1/candidate/notifications/:id/read` | PUT | Mark notification read |
| `/v1/candidate/notifications/preferences` | GET / PUT | Notification preferences |
| `/v1/candidate/coaching/sessions` | GET | List coaching sessions |
| `/v1/candidate/coaching/start` | POST | Start coaching session (NEXUS) |

### Outreach / MARIA (internal-only, `/v1/outreach/*`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/outreach/sequences` | GET / POST | List / create sequences |
| `/v1/outreach/sequences/:id` | GET / PUT / DELETE | Sequence CRUD |
| `/v1/outreach/sequences/:id/steps` | GET / POST | Sequence steps CRUD |
| `/v1/outreach/campaigns` | GET / POST | List / create campaigns |
| `/v1/outreach/campaigns/:id` | GET / PUT / DELETE | Campaign CRUD |
| `/v1/outreach/campaigns/:id/start` | POST | Start campaign |
| `/v1/outreach/campaigns/:id/pause` | POST | Pause campaign |
| `/v1/outreach/campaigns/:id/enroll` | POST | Enroll candidates into campaign |
| `/v1/outreach/campaigns/:id/performance` | GET | Campaign performance stats |
| `/v1/outreach/enrollments` | GET | List enrollments (filterable) |
| `/v1/outreach/replies` | GET | List replies (reply inbox) |
| `/v1/outreach/replies/:id/assign` | POST | Assign reply to consultant |
| `/v1/outreach/replies/:id/respond` | POST | Send response to candidate |
| `/v1/outreach/suppressions` | GET / POST | Manage suppression list |
| `/webhooks/outreach/email-events` | POST | Email provider event webhook (delivery, open, click, bounce) |
| `/webhooks/outreach/replies` | POST | Incoming reply processing |

---

## Cross-Phase Integrations

| Phase | Integration Point |
|-------|-------------------|
| **Phase 6** (B2C Portal) | Assessment engine + wizard components reused for candidate assessments (~80% code reuse). Profile builder patterns adapted. |
| **Phase 7** (Reports &amp; Documents) | Assessment report generation, document sharing, CV storage all reuse Phase 7 document infrastructure. |
| **Phase 7.5** (Coaching Excellence) | NEXUS coaching modules (interview prep, offer negotiation, career development) exposed to candidates via Coaching Hub. Access rules tied to application status. |
| **Phase 8** (Client Portal) | Mandate data, pipeline stages, and consultant workflows are shared. Candidate portal is the mirror side of the client portal. |
| **Phase 8.5** (Platform Capabilities) | Document upload, save/export, and web research all built on Phase 8.5 platform primitives. Candidates get the same doc tooling as clients. |
| **Phase 5** (AI Engine) | NEXUS scoring, NLP CV parsing, AI reply classification, and coaching conversation all route through Phase 5 AI services. |

---

## Acceptance Criteria

1. **Candidate journey end-to-end**: A new candidate can be invited → build profile → upload CV → browse mandates → apply → complete assessment → see results → use interview coaching → track to offer, all within the portal.
2. **MARIA outreach scale**: A consultant can create a campaign with a 5-step sequence, enroll 200 candidates, and the system sends all emails on schedule with proper tracking.
3. **Reply handling**: Candidate replies are detected within 5 minutes, classified by type, and routed to the correct consultant.
4. **Coaching integration**: Candidates with active applications can access NEXUS interview prep and launch a coaching session in ≤3 clicks from the interview page.
5. **Assessment parity**: Candidate assessment experience matches B2C quality (same wizard, same scoring engine) but with mandate-specific context and consultant-controlled result visibility.
6. **Data privacy**: RLS ensures candidates only see their own data; consultants only see candidates in their pipeline; outreach data is internal-only.
7. **Compliance**: All outreach emails have working unsubscribe links; suppression is honored within 24 hours; all events are auditable.
8. **Platform feature parity**: Document upload, save/export, and web research all work in the candidate portal using Phase 8.5 infrastructure.

---

## Dependencies

| Dependency | Phase / Source | Needed For |
|-----------|---------------|------------|
| NEXUS assessment engine | Phase 5 / 6 | M3 — candidate assessments |
| Document upload &amp; storage | Phase 7 / 8.5 | M1 (CV upload), M2 (document sharing), M5 (prep materials) |
| NEXUS coaching modules | Phase 7.5 | M5 — interview prep &amp; career coaching |
| Web research engine | Phase 8.5 | M5 — company/role research for interview prep |
| Mandate data model | Phase 4 / 8 | M2 — mandate browsing &amp; applications |
| Consultant internal portal | Phase 4 / 8 | M4 — campaign builder, reply inbox, assessment invites |
| Email provider account | New vendor | M4 — MARIA email sending infrastructure |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Email deliverability — outreach emails land in spam | Medium | High | Use dedicated sending domain, warm up gradually, authenticate SPF/DKIM/DMARC, monitor deliverability metrics, start with smaller test campaigns |
| CV auto-parse quality is poor | Medium | Medium | Make auto-fill a suggestion (not replacement), let candidate edit everything. Start with basic field extraction; improve in later phases. |
| Assessment engine integration more complex than expected (auth context differences) | Medium | Medium | Build thin adapter layer between candidate portal and Phase 6 assessment engine. Validate integration pattern with one assessment type first before enabling all. |
| Outreach compliance risk (PIPL / GDPR violations) | Low | Critical | Legal review of all templates and flows before launch. Mandatory unsubscribe on every email. Suppression list tested and verified. Audit log complete. |
| Coaching access model is ambiguous (how much free coaching do candidates get?) | Medium | Medium | Define clear entitlement model before building: active candidates = 3 coaching sessions; placed = 10; idle = 1. Start simple, adjust based on usage data. |
| Reply detection latency — IMAP polling is slow | Medium | Low | Use provider webhooks if available. For IMAP, poll every 5 min during business hours. Acceptable SLA: replies routed within 5–10 min. |
| Candidate portal and client portal share too much code, creating coupling risk | Medium | Medium | Clear separation of concerns: shared components live in `components/shared/`, candidate and client have their own page trees and API routes. Integration happens at the data layer, not the UI layer. |

---

## Success Metrics

### Quantitative
- **Outreach volume**: ≥200 candidate touches / consultant / week (up from ~30 manual)
- **Outreach reply rate**: ≥12% (cold outbound benchmark)
- **Assessment completion rate**: ≥75% of invited candidates complete assessment
- **Profile completion**: ≥70% of invited candidates reach 80%+ profile completeness
- **Coaching activation**: ≥40% of active candidates use at least one coaching module
- **Portal login frequency**: Active candidates log in ≥2x/week on average

### Qualitative
- Candidate NPS ≥ 40 on portal experience
- Consultant feedback: outreach saves ≥5 hours/week per consultant
- Zero compliance incidents (unsubscribe failures, data leaks, etc.)

---

## Non-Goals

- ❌ LinkedIn / social media outreach automation (email only for Phase 9)
- ❌ SMS / WhatsApp outreach
- ❌ Full CRM functionality (this is outreach tracking + candidate portal, not a full CRM)
- ❌ AI-generated fully-personalized cold emails (template-based + merge variables; AI personalization is Phase 10+)
- ❌ Public job board (candidates are invited or sourced; no public self-serve application)
- ❌ Mobile native app (responsive web only for Phase 9)
- ❌ Video interview platform integration (external tools like Zoom / Teams via links)
- ❌ Billing / payments for candidates (coaching is free as a value-add; no candidate payments in Phase 9)
