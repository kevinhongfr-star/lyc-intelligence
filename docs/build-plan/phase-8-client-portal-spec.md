# Phase 8 — Client Portal

**Status:** Draft v2.0
**Owner:** Trae (full-stack)
**Priority:** P1 — post-Phase 7, drives B2B retention and client self-service
**Estimated effort:** 3–4 weeks (~80–110h, 17 tickets)
**Predecessor:** Phase 3 (portal shells + design system), Phase 4 (internal portal patterns), Phase 6 (B2C patterns for assessment sharing), Phase 7 (document sharing). Can build UI in parallel with Phase 5/7 backend work.
**Success metric:** ≥70% of active clients log in weekly; ≥60% of shortlist feedback is submitted via portal (vs. email); client NPS for portal experience ≥40

---

## Why This Phase Exists

Phase 4 delivers a powerful internal portal for consultants and recruiters. Phase 6 delivers a B2C portal for individual candidates. Neither delivers a **client-facing portal** — the self-service surface where hiring managers, HR partners, and CEOs track their mandates, review candidates, give feedback, and collaborate with the LYC team.

Today, all client interaction happens via email, Slack, and periodic status calls. That creates three compounding problems:

1. **Information asymmetry.** Clients never have a real-time view of pipeline progress. They ask "how's the search going?" and consultants spend hours compiling status updates instead of sourcing.
2. **Feedback latency.** Shortlist reviews, interview feedback, and approval decisions travel over email — slow, unstructured, hard to track, and easy to lose. A single delayed approval can stall a search for weeks.
3. **Perceived value gap.** Clients don't see the volume of work, the pipeline depth, or the framework rigor unless the consultant manually surfaces it. The relationship feels reactive rather than proactive.

The Client Portal closes all three gaps by giving clients a secure, scoped, always-on view into their mandates. It turns LYC from a search firm clients *hire* into a platform clients *log into* — and it frees consultants to do high-value work instead of status reporting.

### Value & Impact Metrics

| # | Metric | Current State | Target State | Impact |
|---|--------|--------------|--------------|--------|
| V1 | Consultant time spent on status updates / week | 6–8h / consultant | ≤2h / consultant | High — directly recovers billable capacity |
| V2 | Shortlist feedback turnaround time | 3–5 days (email) | ≤24h (portal) | High — biggest single accelerator of search cycle |
| V3 | Client "how's it going" inbound queries / mandate / week | 3–5 | 0–1 | High — reduces reactive communication load |
| V4 | Client visibility into pipeline health | None (only what consultant shares) | Real-time dashboard with stages, counts, and health indicator | Medium — perceived value & trust |
| V5 | Document exchange method | Email attachments + version chaos | Secure portal library with version history | Medium — professionalism + risk reduction |
| V6 | Interview feedback capture rate & structure | ~60% (free-text email) | ≥90% (structured form) | Medium — data quality + candidate evaluation consistency |

**Launch requirement:** All 6 milestones complete; end-to-end RLS tested for every client role; 3+ beta clients actively using M1–M3.
**Hard gates (cannot launch without):** M1 (auth + RLS — security), M3 (shortlist review — core value prop), M5 (document sharing — compliance).

---

## What's Already Built (Legacy / Partial)

| Module | Location | State |
|--------|----------|-------|
| Client portal shell stub | v1 API `client/*` endpoints | Skeleton — dashboard + mandates endpoints stubbed |
| `client_notifications` table | supabase migrations | Schema exists |
| `client_mandate_access` table | referenced in data integrity checks | Schema exists (controls which clients see which mandates) |
| Client-facing components | `src/components/client/` | Existing — needs audit + rewire |
| `client_feedback` table | referenced in FK list | Schema exists |
| Document sharing system | Phase 7 build | Will be reused — client portal is another consumer of `document_shares` |

---

## Milestones

### M1 — Client Portal Shell, Auth & Onboarding
**Effort:** 14–20h | **Priority:** P0 (hard gate — security foundation)

Everything needed for a client to get invited, set up their account, and land on a working dashboard with the right access. This is the security and identity foundation — all other milestones depend on it.

#### Tickets

**T-C1: Client Invite & Onboarding Flow**
- Internal user (consultant/admin) invites a client contact via email
- Flow: invite email → client clicks link → verifies email → sets password → fills profile → lands on dashboard
- Magic link option as alternate login method
- Invite expiration (7 days), resend flow, rate limiting
- P0, 5–7h

**T-C2: Client Access Control & Role System**
- `client_mandate_access` table defines which client accounts can see which mandates, and at what role level
- Three client roles per mandate:
  - `client_owner` — full access: approve shortlists, give feedback, manage other client contacts on the mandate
  - `client_interviewer` — can only see candidates assigned to them for interview + give feedback on those candidates
  - `client_viewer` — read-only access to mandate + pipeline + documents, no feedback submission
- Multiple client contacts per mandate (hiring manager + HR + CEO, etc.)
- Internal users can manage client access for mandates they own
- P0, 5–7h

**T-C3: Client Profile & Settings Foundation**
- Client profile page: name, title, company, contact info, timezone, notification preferences
- Password management (change, reset)
- Company info display (linked from `client_accounts` or `companies` — TBD based on data model alignment)
- P0, 4–6h

---

### M2 — Mandate Dashboard & Pipeline Visibility
**Effort:** 14–20h | **Priority:** P0

The primary value surface — clients see their mandates, track progress, and understand pipeline health without emailing the consultant. Reuses pipeline visualization patterns from Phase 4 but with client-friendly stage names and scoped data.

#### Tickets

**T-C4: Client Home Dashboard**
- Active mandates overview (cards: title, status, key metrics, health indicator)
- Recent activity feed (candidates added, interviews scheduled, feedback requested, documents shared)
- Pending actions widget (feedback due, interview scheduling, shortlist approval)
- Quick stats: total candidates in pipeline, interviews this month, average time-to-shortlist across mandates
- P0, 5–7h

**T-C5: Mandate Detail — Overview & Pipeline**
- Mandate overview: title, role description, assigned team, key dates (kickoff, target shortlist date, target hire date)
- Success profile / role requirements summary (read-only view — no internal notes or recruiter comments)
- Mandate health indicator (on track / at risk / behind)
- Pipeline stages with candidate counts (visual funnel with stage-by-stage breakdown)
- Conversion rates between stages (aggregate, not per-candidate detail at all stages)
- Client-friendly stage names (internal stage names mapped to external labels per mandate config)
- P0, 6–8h

**T-C6: Candidate Detail (Client View)**
- Name, current title, company, key experience highlights
- Score tier badge (Gold / Silver / Bronze — no internal numeric scores by default)
- Executive summary / one-pager view (PDF viewer or formatted summary)
- Interview history + feedback summary (only for interviews the client participated in or is authorized to see)
- Status in pipeline (e.g., "Shortlisted", "Interviewing")
- **Explicitly hidden:** internal notes, full TRIDENT breakdown, recruiter comments, raw score numbers (unless mandate config allows sharing)
- P0, 3–5h

---

### M3 — Shortlist Review & Candidate Feedback
**Effort:** 16–22h | **Priority:** P0 (hard gate — core interactive value)

The most important interactive milestone. Clients review shortlisted candidates, give structured feedback, and indicate interest — all in the portal instead of email. This is where the portal earns its keep by cutting feedback turnaround from days to hours.

#### Tickets

**T-C7: Shortlist Review Interface**
- Shortlisted candidates presented as cards or list view
- Each candidate card: name, current role, score tier, key highlights, 1-pager link
- Client actions per candidate: "Interested" / "Not interested" / "Want to interview"
- Overall shortlist comments field
- Submit shortlist feedback → triggers notification to consultant team
- Side-by-side comparison view (compare 2–3 candidates' key attributes)
- P0, 6–8h

**T-C8: Candidate Comparison & Shortlist Approval**
- Comparison table mode for shortlisted candidates
- Approval workflow: client owner can formally "approve shortlist" or "request changes"
- Approval timestamp + audit trail
- Consultant gets notified of approval/change request
- P0, 3–5h

**T-C9: Structured Interview Feedback Form**
- Feedback form per interview, structured around mandate success profile
- Fields: overall rating (1–5), strengths, concerns, hire recommendation (strong hire / hire / no hire), free-text notes
- Feedback history per candidate (all interviews, all interviewers)
- Submit → automatically shared with consultant team + visible to other authorized client contacts
- P0, 5–7h

**T-C10: Interview Scheduling Coordination**
- Interview requests from consultant (with candidate info, proposed times, interviewer assignment)
- Client confirms / proposes alternate times
- Interview reminder notifications (email + in-app)
- Calendar integration deferred to Phase 10 — for now, email + in-app coordination
- P1, 2–4h

---

### M4 — Document Sharing & Collaboration
**Effort:** 10–14h | **Priority:** P0 (hard gate — compliance & IP protection)

Secure document exchange between client and consultant team. Reuses the Phase 7 document generation and sharing infrastructure as another consumer surface.

#### Tickets

**T-C11: Client Document Library**
- All documents shared with this client, organized by mandate and document type
- Document types available to clients:
  - Candidate 1-pagers (PDF)
  - Shortlist decks (PDF)
  - Assessment reports (for candidates client is interviewing)
  - Mandate briefs / search strategy docs
  - Proposals / contracts (admin-uploaded)
- Filtering, search, sorting
- P0, 4–5h

**T-C12: Document Viewer & Version History**
- In-browser PDF viewer with LYC branding
- Download capability (controlled by document share settings)
- Version history: when a document is updated, client sees latest version with changelog
- "New document shared" notifications (email + in-app)
- P0, 4–6h

**T-C13: Document Access & RLS Enforcement**
- Clients see only documents explicitly shared with them (via `document_shares` scoped to their `client_account_id` or mandate access)
- Clients cannot forward-share documents from the portal (download allowed, but no share-link generation)
- Document access auto-revoked if client mandate access is removed
- Access audit log for compliance
- P0, 2–3h

---

### M5 — Client Notifications & Settings
**Effort:** 8–12h | **Priority:** P1

Clients stay informed without being overwhelmed. Notification system + preference management ensures the portal augments rather than adds to email noise.

#### Tickets

**T-C14: Client Notification System**
- Notification types:
  - New shortlist available for review
  - Interview scheduled / upcoming interview reminder
  - New candidate added to pipeline (configurable frequency)
  - Document shared
  - Feedback requested
  - Mandate status update
- Delivery channels: in-app notification + email (per preference)
- In-app notification center with read/unread state
- P1, 4–6h

**T-C15: Notification Preferences & Digest Options**
- Per-type toggle (email on/off, in-app on/off)
- Digest options: real-time, daily digest, weekly digest
- Quiet hours (don't email outside user's business hours / timezone)
- Settings page: profile editing, password, notification preferences, timezone, language (English only for launch)
- P1, 4–6h

---

### M6 — Billing & Account Management
**Effort:** 6–10h | **Priority:** P2 (nice-to-have for launch, not a hard gate)

Client-side billing visibility and account management. Not full invoicing (that stays in the finance system), but a transparent view of what the client is paying for and the status of their engagements.

#### Tickets

**T-C16: Billing Overview & Invoice History**
- Active mandates with billing type (retained / contingency / project)
- Invoice history list (PDF invoices uploaded from finance system)
- Payment status per invoice
- "Contact billing" action (opens email to finance team)
- Full self-service billing (pay online, autopay) deferred to post-launch
- P2, 3–5h

**T-C17: Account Management & Team Contacts**
- Client owner can see all client contacts on their mandates
- Invite additional client contacts (role selection: owner / interviewer / viewer)
- Remove or change role of existing contacts (with confirmation + audit trail)
- Company profile view (read-only for most clients; editable for designated primary contacts)
- P2, 3–5h

---

## Data Model

### Existing Tables (Leveraged / Extended)

| Table | What's Reused | What's New in Phase 8 |
|-------|---------------|----------------------|
| `client_accounts` | Base client company records | May need `primary_contact_id`, `billing_email`, portal status fields |
| `client_mandate_access` | Existing schema — controls mandate visibility | Extend with `role` (owner/interviewer/viewer), `invited_by`, `invited_at`, `accepted_at` |
| `client_notifications` | Existing schema | Extend with `notification_type`, `read_at`, `delivery_status`, `channel` |
| `client_feedback` | Existing schema | Extend with `feedback_type` (shortlist/interview), `candidate_id`, `interview_id`, structured rating fields |
| `document_shares` | From Phase 7 | New share target type: `client_account_id` + `mandate_id` scoping |
| `mandates` | Core mandate data | Add `client_visible_stage_names` JSONB map (internal → client stage labels), `client_score_visibility` setting |
| `candidates` | Core candidate data | Client-facing view layer (no internal columns exposed) |

### New Tables

**`client_interview_assignments`**
- `id` (UUID, PK)
- `client_mandate_access_id` (UUID, FK → client_mandate_access)
- `candidate_id` (UUID, FK → candidates)
- `interview_id` (UUID, nullable, FK → interviews)
- `interview_round` (text — "phone_screen", "first_round", "final", etc.)
- `scheduled_at` (timestamptz, nullable)
- `status` (text — "invited", "scheduled", "completed", "cancelled")
- `feedback_submitted` (boolean, default false)
- `created_at`, `updated_at`
- RLS: client = select/update own assignments; internal = manage for their mandates

**`client_shortlist_feedback`**
- `id` (UUID, PK)
- `client_mandate_access_id` (UUID, FK → client_mandate_access)
- `candidate_id` (UUID, FK → candidates)
- `mandate_id` (UUID, FK → mandates)
- `decision` (text — "interested", "not_interested", "want_to_interview")
- `comments` (text, nullable)
- `strengths` (text array, nullable)
- `concerns` (text array, nullable)
- `submitted_at` (timestamptz)
- `created_at`, `updated_at`
- RLS: client = insert/update for own access; internal = select for their mandates

**`client_documents`** (view / join table)
- Materialized view or join table mapping `document_shares` → `client_account_id` for efficient client-side document listing
- Filters by share target type = `client` and target_id = client account
- RLS: clients see only their own shared documents

### New Views

**`v_client_mandate_summary`**
- Per-mandate summary stats for client dashboard: candidate count per stage, health indicator, last activity timestamp
- Scoped to client's authorized mandates only

**`v_client_pipeline_stages`**
- Pipeline stage breakdown with client-friendly stage names (mapped from internal names via mandate config)
- Candidate counts per stage + conversion rates between adjacent stages

---

## Frontend Components to Build

| Component | Description | Milestone |
|-----------|-------------|-----------|
| `ClientPortalShell` | Client-side app shell with navigation, branding, user menu | M1 |
| `ClientDashboard` | Home dashboard with mandate cards, activity feed, pending actions | M2 |
| `MandateDetailHeader` | Mandate overview with title, dates, team, health indicator | M2 |
| `ClientPipelineFunnel` | Visual pipeline funnel with stage counts + conversion rates (client-friendly labels) | M2 |
| `ClientCandidateCard` | Candidate card for client view — tier badge, no internal scores | M2 |
| `ClientCandidateDetail` | Full candidate detail page for client (read-only, scoped fields) | M2 |
| `ShortlistReview` | Shortlist review grid with per-candidate action buttons | M3 |
| `CandidateComparisonView` | Side-by-side comparison table for 2–3 candidates | M3 |
| `InterviewFeedbackForm` | Structured interview feedback form with rating + strengths/concerns | M3 |
| `InterviewScheduler` | Interview request display + confirm/propose alternate times | M3 |
| `ClientDocumentLibrary` | Document list organized by mandate + type | M4 |
| `ClientDocumentViewer` | In-browser PDF viewer with version info + download | M4 |
| `NotificationCenter` | In-app notification list with read/unread state | M5 |
| `NotificationPreferences` | Per-type toggles, digest options, quiet hours | M5 |
| `ClientBillingOverview` | Billing summary + invoice history list | M6 |
| `ClientTeamManagement` | Client contacts list + invite/role management | M6 |

---

## API Endpoints

### Auth & Onboarding

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/v1/client/invite` | POST | Internal user invites a client contact (creates account + sends invite) | Internal (consultant/admin) |
| `/v1/client/accept-invite` | POST | Client accepts invite, sets password, completes profile | Client (pre-auth via token) |
| `/v1/client/magic-link` | POST | Request magic link for passwordless login | Public (email-based) |
| `/v1/client/profile` | GET | Get client's own profile | Client |
| `/v1/client/profile` | PATCH | Update client profile | Client |
| `/v1/client/mandate-access` | GET | List mandates client has access to (with role) | Client |

### Mandates & Pipeline

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/v1/client/mandates` | GET | List client's mandates with summary stats | Client |
| `/v1/client/mandates/:id` | GET | Mandate detail (overview + key dates + health) | Client (scoped by access) |
| `/v1/client/mandates/:id/pipeline` | GET | Pipeline stage breakdown + candidate list per stage | Client (scoped by access) |
| `/v1/client/mandates/:id/activity` | GET | Activity feed for a mandate | Client (scoped by access) |
| `/v1/client/candidates/:id` | GET | Candidate detail (client-scoped view — no internal fields) | Client (scoped by access) |

### Shortlist & Feedback

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/v1/client/mandates/:id/shortlist` | GET | Get shortlisted candidates for a mandate | Client (scoped by access) |
| `/v1/client/candidates/:id/shortlist-feedback` | POST | Submit shortlist feedback for a candidate | Client (scoped by access) |
| `/v1/client/mandates/:id/shortlist/approve` | POST | Formally approve or request changes to shortlist | Client owner |
| `/v1/client/interviews` | GET | List upcoming + past interviews for this client | Client |
| `/v1/client/interviews/:id` | GET | Interview detail (candidate, time, feedback status) | Client (assigned interviewer only) |
| `/v1/client/interviews/:id/feedback` | POST | Submit interview feedback | Client (assigned interviewer only) |
| `/v1/client/interviews/:id/confirm` | POST | Confirm interview time | Client (assigned interviewer only) |

### Documents

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/v1/client/documents` | GET | List all documents shared with this client (filter by mandate, type) | Client |
| `/v1/client/documents/:id` | GET | Get document metadata + download URL | Client (must have access via share) |
| `/v1/client/documents/:id/versions` | GET | Get version history for a document | Client (must have access) |

### Notifications & Settings

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/v1/client/notifications` | GET | List in-app notifications (paginated) | Client |
| `/v1/client/notifications/:id/read` | POST | Mark notification as read | Client |
| `/v1/client/notifications/read-all` | POST | Mark all as read | Client |
| `/v1/client/preferences` | GET | Get notification + app preferences | Client |
| `/v1/client/preferences` | PATCH | Update preferences | Client |

### Billing & Account

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/v1/client/billing` | GET | Billing overview + mandate billing info | Client owner |
| `/v1/client/invoices` | GET | List invoices (paginated) | Client owner |
| `/v1/client/invoices/:id` | GET | Get invoice detail + download link | Client owner |
| `/v1/client/team` | GET | List client contacts on this client's mandates | Client owner |
| `/v1/client/team/invite` | POST | Invite a new client contact | Client owner |
| `/v1/client/team/:id/role` | PATCH | Change role of an existing client contact | Client owner |

---

## Phase 8.5 Integration Considerations

The Client Portal should be designed with Phase 8.5 (Platform Capabilities) in mind so that platform features naturally extend to the client surface without rework:

| Phase 8.5 Capability | Client Portal Relevance | Integration Approach |
|----------------------|------------------------|---------------------|
| **Save / Export** | Clients want to export candidate one-pagers, shortlist decks, and interview feedback summaries | Build document viewer with export awareness (PDF/DOCX export hooks) in M4. Reuse Phase 8.5's export pipeline when it lands. |
| **Custom Prompts & Framework Library** | Consultants use custom frameworks for candidate assessment; clients may get framework-specific candidate summaries | Ensure `client_candidate_detail` view supports framework-output rendering as a pluggable component. Framework outputs from Phase 4/5 can be selectively surfaced to clients via mandate config. |
| **Document Upload & Context** | Clients may want to upload their own documents (job descriptions, interview notes, company info) for the consultant team to use | `client_documents` data model should support bidirectional sharing (client → consultant) from day one, even if the upload UI is Phase 8.5. |
| **Analytics Dashboard** | Clients want mandate-level analytics (time-to-hire, pipeline velocity, quality of hire) | `v_client_mandate_summary` view should be designed to be extensible — add metrics columns as Phase 8.5 analytics are built. Dashboard widgets should be a pluggable grid. |
| **Web Connectivity** | Lower relevance for client portal — mostly internal use | Not needed in Phase 8. No action required. |

---

## Acceptance Criteria

1. **Auth & Security:** Three client roles (owner, interviewer, viewer) all enforced via RLS; no client can see data outside their authorized mandates; no internal columns (TRIDENT scores, internal notes, recruiter comments) leak to client views
2. **Shortlist Review End-to-End:** Consultant shares shortlist → client notified → client reviews and submits feedback → consultant notified → feedback visible in both portals, linked to candidate record
3. **Interview Feedback End-to-End:** Interview scheduled → client reminded → client submits structured feedback → feedback visible in candidate record in both client and internal portals
4. **Document Sharing End-to-End:** Consultant shares a document via Phase 7 system → document appears in client's library → client can view and download → access revoked if mandate access removed
5. **Notification Preferences:** Client can set per-type preferences, digest frequency, and quiet hours; all notifications respect these settings
6. **Dashboard Completeness:** Client home dashboard shows all active mandates with pipeline counts, recent activity, and pending actions; mandate detail page shows overview, pipeline funnel, and health indicator
7. **Performance:** All client-facing pages load in <2s on 3G; dashboard API responses <500ms
8. **Responsive:** Client portal works on desktop and tablet (mobile is nice-to-have, not required for launch)

---

## Dependencies

| Dependency | Phase / Source | What We Need | Timing |
|-----------|---------------|-------------|--------|
| Portal shell + design system | Phase 3 | Client portal shell stub, layout, components | Already exists; needs rewire |
| Internal portal patterns | Phase 4 | Pipeline visualization, candidate cards, document viewer patterns | Reusable — adapt for client view |
| Document sharing system | Phase 7 | `document_shares` table, document viewer, storage pipeline | Must be ready before M4 |
| B2C portal patterns | Phase 6 | Auth flow patterns, notification system patterns | Reusable |
| Interview scheduling model | Phase 4 / internal data model | `interviews` table structure, candidate-stage history | Must align before M3 |
| Email service | Platform | Invite emails, notification emails, magic links | Already exists |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RLS misconfiguration leaks internal data to clients | Low | Critical — trust + legal | Comprehensive RLS test suite covering all 3 roles × all endpoints; security review before launch; use dedicated test accounts per role |
| Stage name mapping breaks pipeline display (internal vs. client labels) | Medium | High — client confusion | Per-mandate `client_visible_stage_names` config; fallback mapping; admin UI to verify stage mapping before client onboarding |
| Clients don't adopt the portal and keep using email | Medium | High — wasted build effort | Consultant-led onboarding; make portal the *only* way to access shortlist decks and candidate one-pagers (gradually turn off email attachments) |
| Too many notification emails → clients unsubscribe | Medium | Medium — engagement | Per-type preferences + digest options from day one; default to daily digest for non-urgent notifications |
| Data model mismatch between `client_accounts`, `companies`, and mandate client reference | Medium | Medium — integration complexity | Audit existing schema first; align data model in M1 before building downstream features |
| Document sharing RLS edge cases (access revoked but cached URLs still work) | Low | High — IP risk | Use signed URLs with short TTL; no direct S3 access; re-validate share status on every document view |
| Interview feedback quality degrades because form feels bureaucratic | Medium | Medium — data quality vs. response rate tradeoff | Keep form short (≤5 fields); optional structured fields; allow free-text as fallback; A/B test form length with beta clients |

---

## Success Metrics

### Adoption
- ≥80% of active clients create portal accounts within 2 weeks of invite
- ≥70% of active clients log in at least weekly
- ≥60% of shortlist feedback is submitted via portal (vs. email)

### Efficiency
- Shortlist feedback turnaround: from 3–5 days (email) to ≤24h (portal)
- Consultant time spent on status updates: reduced by ≥60%
- Client "how's it going" inbound queries: reduced by ≥50%

### Quality
- Client NPS for portal experience ≥40
- Interview feedback capture rate ≥90% (up from ~60% via email)
- Structured feedback fields filled at ≥70% rate (not just free text)

### Security
- Zero data leakage incidents (RLS enforcement verified by audit)
- Zero unauthorized document access incidents
- All 3 client roles pass full authorization test suite

---

## Non-Goals

- ❌ Client self-service mandate creation (all mandates created by internal team)
- ❌ Chat / messaging between client and consultant (email first, chat later)
- ❌ Video interview integration
- ❌ Full invoicing / payment processing (read-only invoice view only)
- ❌ Multi-language / i18n (English only for launch)
- ❌ Client-side candidate sourcing or referrals
- ❌ Mobile-first design (desktop + tablet only for launch)
- ❌ Calendar integration (deferred to Phase 10)

---

## Technical Constraints

- All data through v1 API, scoped by client RLS (clients only see their own mandates + candidates within those mandates)
- No internal column names exposed to client (e.g., TRIDENT → "Match Score", internal stage names → client-friendly stage names)
- No internal notes, recruiter comments, or score details visible to clients (tier badges only unless explicitly shared per mandate config)
- Client portal shell from Phase 3 (rewired, not rebuilt)
- All shared documents from Phase 7 document system (reuse, don't duplicate)
- TypeScript strict — zero TS errors
- Tests for all v1/client endpoints + RLS policy tests for all client-facing tables/views
- Branch: `feature/eo4-client-portal-phase8`
