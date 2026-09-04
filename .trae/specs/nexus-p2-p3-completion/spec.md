# NEXUS P2 / P3 Completion — Product Requirements Document

## Overview
- **Summary**: Build the three missing tickets from the 7-ticket NEXUS delivery plan:
  - **P2-1 PDF Report Rendering** — Upgrade `api/reports/pdf.ts` from 501 stub to working server-side NEXUS assessment readout renderer that accepts `AssessmentResultData`, renders the same 6-section branded template (`PdfReport.tsx`) on the server, and returns a signed Storage download URL or inline PDF.
  - **P2-2 Cross-session Memory** — Extract summary/memory rows from completed chat sessions, store them in the already-migrated but unused `nexus_episodic_memory` + `nexus_semantic_memory` tables, and inject the top-k relevant memories into `handleChat`'s system prompt so NEXUS remembers decisions/goals/preferences across sessions.
  - **P3-1 Milestone Validation** — Create a server-side RPC function and HTTP endpoint that validate MilestonesDashboardPage progress submissions against a milestone protocol (credit/evidence gating, status-transition rules, lens-dependency checks); reject invalid writes with structured errors; and wire the dashboard page to call the endpoint instead of relying on client-local `progress` state.
- **Purpose**: Bring the "7/7 built" claim in line with actual repository state. Close the gap between the NEXUS Quality Batch 1 spec (which references these features) and `main`.
- **Target Users**:
  - B2C paying users (Executive Introduction / Professional / Executive / Council tiers) consuming assessment PDFs and milestone dashboards
  - Internal LYC ops reviewing that milestone progress is properly validated
  - Developers maintaining the chat pipeline

## Goals
1. `api/reports/pdf.ts` returns a working PDF for all 6 B2C diagnostics rather than a 501 stub, and the client falls back to it when available.
2. Users who have had ≥2 NEXUS chat sessions see their key decisions, goals, and preferences remembered in later conversations without having to repeat themselves.
3. Milestone progress updates in `/nexus/milestones` are rejected server-side if they violate the milestone protocol (e.g. jumping from 0→100 without dependency evidence).

## Non-Goals
- Do **not** rewrite `PdfReport.tsx` or the template registry. Server rendering reuses the same React component already rendering correctly client-side (via an SSR render pipeline that avoids headless Chrome on Hobby).
- Do **not** generate embeddings with a paid OpenAI call; P2-2 uses keyword/BM25-style retrieval across `nexus_episodic_memory.content` + a heuristic importance filter. The `embedding vector(1536)` column already exists in the migration — leave it nullable; skip embedding writes in this ticket.
- Do **not** add a full milestone authoring UX. This is only the **validation + rejection path** for client state writes. Creation and editing UI stay unchanged.
- Do **not** add new Storage buckets for PDFs; reuse the existing `chat-uploads` storage bucket pattern with a `reports/` top-level folder (RLS matches the `user_id` first-folder rule added in P1-2).
- Do **not** touch the `api/_lib/` path from the spec docs; main uses `api/workers/[job].ts` as the chat dispatch. All P2-2 memory injection goes into `[job].ts`.

## Background & Context
- **Repository**: `lyc-intelligence` main branch. One remote only (`github.com/kevinhongfr-star/lyc-intelligence`). 49 total branches; the two `nexus-quality-batch1` branches (james/trae-prefixed) are parallel P0 infra pushes and **do not** contain P2/P3 code.
- **Current baseline verified by disk audit**:
  - `api/reports/pdf.ts` exists but returns HTTP 501 `SERVER_RENDER_UNAVAILABLE`, telling the client to fall back to `pdfExport.ts` (html2canvas + jsPDF client pipeline). Zod validation (PdfDataShape → matches `AssessmentResultData`) is already correct.
  - `nexus_episodic_memory` + `nexus_semantic_memory` + `nexus_memory_audit` tables exist in `supabase/migrations/20260812_nexus_memory.sql` with owner RLS. The schema is fully migrated but **zero code writes or reads to them**. No extraction job, no context injection.
  - Milestones Dashboard (`MilestonesDashboardPage.tsx`) is 100% mock data in `ACTIVE_MILESTONES`, `COMPLETED_MILESTONES`, `QUEUED_MILESTONES` consts. `progress` is a static number. No API call on state change. `MilestonesDashboardPage.tsx` line 27 explicitly says "Mock data — V4 is presentation layer; backend will wire to existing milestone engine."
  - `ExportPdfButton.tsx` → calls `exportAssessmentPdf()` which runs html2canvas on a hidden `PdfReport`. Does **not** yet try `/api/reports/pdf` first.
- **Dependencies already in package.json we can reuse**: `react` (SSR render via `renderToStaticMarkup`), `jspdf` (fallback in-browser, but server can also generate PDF bytes with `pdfkit` if added — see Constraints), `pdf-parse` (existing), `zod` (existing). `@react-pdf/renderer` is NOT installed.
- **Constraint on deployment**: Vercel Hobby serverless runtime → no headless Chromium, no Playwright/Puppeteer. Server rendering must be pure Node (React SSR → either `@react-pdf/renderer` or `react-dom/server` renderToStaticMarkup + inject into a jsPDF template).

## Functional Requirements

### P2-1 — PDF Report Rendering
- **FR-P2-1-1**: `POST /api/reports/pdf` returns either (a) HTTP 200 `{ ok: true, download_url: signedURL, expires_at: ISO, document_id }` OR (b) HTTP 200 binary `application/pdf` with `Content-Disposition: attachment` — caller chooses via `response_mode: 'url' | 'inline'` query/body (default: `'url'`). No more 501.
- **FR-P2-1-2**: The server-rendered PDF contains all 6 sections from `PdfReport.tsx`: cover, exec summary, dimension breakdown, AI insights, archetype, NEXUS CTA. Section order matches client PDF. Tier redactions from `reportTemplates.applyTierRedactions` are applied server-side before render.
- **FR-P2-1-3**: Auth: endpoint requires Bearer JWT. Caller must own the assessment_result_id referenced in `data.result.result_id` (or be an admin) — verified via `user_assessment_progress` join. Rejects 401 `UNAUTHORIZED` / 403 `OWNERSHIP_MISMATCH` with JSON body.
- **FR-P2-1-4**: `ExportPdfButton` (and the `ResultExportBar` that uses it) attempts `/api/reports/pdf` first with a short timeout; on success, opens the signed URL in a new tab. On any failure (4xx/5xx/timeout/NETWORK), silently falls back to the existing html2canvas client pipeline with no user-visible difference beyond a toast "Using browser PDF export."
- **FR-P2-1-5**: Generated PDFs are stored in a Storage `reports/{user_id}/{document_id}.pdf` path, auto-deleted after 24h via `expires_at`, with the same RLS pattern as `chat-uploads` (owner-only CRUD). Signed URLs are scoped to that 24h TTL.

### P2-2 — Cross-session Memory
- **FR-P2-2-1**: At the end of every successful chat call (after streaming/reply completes), the **worker** extracts a maximum of 5 candidate memory items from the `message + assistant.response` pair, classifying them into the already-defined `nexus_memory_type` enum values (`decision`, `action_item`, `emotion`, `fact`, `preference`, `summary`). Extractions go into `nexus_episodic_memory` with the caller's `user_id`.
- **FR-P2-2-2**: After every 5 sessions (or after a session with `summary` explicitly requested by the user), the worker writes an aggregate update into `nexus_semantic_memory.user_model.jsonb` (merging into `goals`, `preferences.focus_areas`, `career_context` fields — never overwriting the whole document). A service-role upsert is used (bypasses RLS for the single user-owned row).
- **FR-P2-2-3**: At chat-begin (before the DeepSeek call in `handleChat`), the worker retrieves top-k memories for the user: (a) semantic summary row if it exists, (b) up to 6 episodic memories where `content` ILIKEs the user's current `message` tokens OR `importance_score >= 0.75` from the last 90 days. Content is injected as a "Recall (from prior sessions):" preamble block into the system prompt. The block must be visually distinguishable from RAG document context and from fresh chat history (separate markdown divider + clear label).
- **FR-P2-2-4**: Memory reads are scoped by `user_id`. A caller can never read another user's memory rows — enforced by the WHERE clause in every worker SELECT (service role bypasses RLS, so we filter explicitly).
- **FR-P2-2-5**: Users can disable cross-session memory via `profile_settings.enable_nexus_memory = false` (column already exists in the `20260821_profile_settings.sql` migration per disk audit). When disabled, neither writes nor reads occur.
- **FR-P2-2-6**: Every insert/upsert writes a row into `nexus_memory_audit` with `change_type` + `source='auto_extraction'`. This is for the admin audit policy the migration already defines.

### P3-1 — Milestone Validation
- **FR-P3-1-1**: New SQL migration creates a `milestones` table (if absent — no existing milestone table exists in any migration per audit) with columns `id, user_id, name, description, tags[], progress int (0-100), status ('active'|'completed'|'queued'), source_assessment_code, dependency_ids uuid[], required_lens_score jsonb, created_at, completed_at, updated_at`. RLS = owner only. Foreign key to `auth.users(id)`.
- **FR-P3-1-2**: SQL RPC function `validate_and_set_milestone_progress(p_milestone_id UUID, p_new_progress INT, p_user_id UUID, p_evidence jsonb DEFAULT NULL)` that enforces:
  1. Ownership: `milestones.user_id = p_user_id` (or admin role) → else raise `'OWNER_MISMATCH'`
  2. Progress range: `0 ≤ p_new_progress ≤ 100` → else `'PROGRESS_RANGE'`
  3. No regress: `p_new_progress < current.progress - 5` raises `'PROGRESS_REGRESS'` (5% tolerance for minor UI corrections)
  4. 80→100 jump forbidden unless `p_evidence` has at least one of `{ links_used: true, lens_readout_referenced: true, consultant_approved: true }` → `'FINALIZATION_EVIDENCE'`
  5. `dependency_ids` must all have `progress ≥ 80` or status=completed → else `'DEPENDENCY_UNMET'` with list of failing dep IDs
  6. If `status = 'completed'` already and `p_new_progress < 100` → `'ALREADY_COMPLETED'`

  The RPC returns `{ ok: boolean, code text, message text, previous_progress int, new_progress int }`.
- **FR-P3-1-3**: New HTTP endpoint `POST /api/milestones/validate` (or action=validate route in existing workers pattern) accepts Bearer JWT + `{ milestone_id, new_progress, evidence }`, calls the RPC with the authenticated user's ID, and returns the result with matching HTTP statuses (200 ok / 403 owner / 422 validation / 500).
- **FR-P3-1-4**: `MilestonesDashboardPage.tsx` reads from the `milestones` table instead of `ACTIVE_MILESTONES` mocks on load. On-progress-click events call the validation endpoint; on 422, show an inline toast with the specific error code (e.g., "DEPENDENCY_UNMET: 2 prerequisite milestones need 80%+ progress first") and revert the optimistic local progress update to the previous value.
- **FR-P3-1-5**: When a milestone reaches `progress ≥ 80` via a validated write, the row's `status` auto-flips from `active` → `completed` and `completed_at` is set. At `progress < 10` the row moves `queued` → `active`. This is handled inside the RPC.

## Non-Functional Requirements
- **NFR-1 Idempotency & retries**: P2-1 PDF upload must not duplicate-storage on retry; `document_id` is `gen_random_uuid()` in the worker so duplicates are impossible anyway, but the upload path uses `upsert: false`. P2-2 memory extraction is NOT idempotent per message pair, so the worker inserts with `created_at` rather than upserting — deduplication is done by "user_id + (content_hash sha256 same within 5 min) skip" to avoid double-writes from exactly-once delivery edge cases. P3-1 RPC is fully stateless: idempotent per progress value.
- **NFR-2 Security**:
  - `Authorization: Bearer` required on all 3 new code paths (P2-1/pdf, P3-1/validate, P2-2 already runs inside auth-gated chat handler).
  - User_id always server-derived from JWT (Supabase JWT payload `sub`), never from client body.
  - SQL injection: all dynamic WHEREs use PostgREST parameters or RPC positional args — no string concatenation.
  - PDF upload path validation: Storage URL uses the same first-folder=user.id rule as chat-uploads (RLS enforces it).
- **NFR-3 Performance**: Memory retrieval (P2-2-3) must be ≤ 2 DB reads and ≤ 15 ms added latency to a chat turn. It uses the existing indexes on `idx_nexus_episodic_memory_user_id` and a GIN index on `user_model jsonb` (add it in the migration if missing). PDF server render must complete in ≤ 8 s (90p) to keep short client timeout viable.
- **NFR-4 Error codes** are machine-readable enum strings (e.g. `OWNERSHIP_MISMATCH`, `FINALIZATION_EVIDENCE`) and match the convention already used by `run.ts` (`TIER_INSUFFICIENT`, `INSUFFICIENT_CREDITS`).
- **NFR-5 Build**: `npm run build` (vite build + typecheck) must pass with zero TypeScript errors from added files.

## Constraints
- **Technical — Vercel Hobby limits**: 12 serverless functions cap. Current count is 11 active per `api/` audit (assessments/run, assessments/meta, workers/[job] + more). P3-1 **must reuse** an existing route or consolidate — add it as a new action on `api/workers/[job].ts` just like `process_doc`, not as a new `/api/milestones/validate` file. P2-1 can reuse existing `api/reports/pdf.ts`. So net +0 new files against the 12-function cap.
- **Technical — PDF rendering without Chrome**: Since headless Chromium is unavailable, render the 6 sections via `ReactDOMServer.renderToStaticMarkup(PdfReport)` (needs DOM shimmed with JSDOM or render CSS tokens inline), then pipe the HTML through `html-pdf-node` with a pure PDF backend, or more simply ship with `pdfkit` to render a text-native PDF section-by-section from the data. Pick whichever installs to ≤ 30 MB.
- **Technical — Memory extraction model**: No extra LLM calls during the chat turn (credit conservation + latency). Extract memories with deterministic keyword heuristics:
  - `decision`: sentence contains `I decided`, `we chose`, `final decision was`, `agree to`
  - `action_item`: `I will`, `need to`, `next step`, `plan to`
  - `preference`: `I prefer`, `I like`, `don't like`, `best when`
  - `emotion`: `I feel`, `frustrated`, `excited`, `worried`
  - `fact`: any named career fact sentence ("I work at", "my role is", "team of N") — heuristics are fine; precision beats recall.
  - `summary`: only written when the worker sees a role-switched `/summary` command or passes the 5-session threshold.
- **Business — Credit impact**: P2-1 PDF generation is free, not charged per-document. P2-2 memory extraction is part of the chat turn (already paid by the 1 credit charge). P3-1 validation is free.
- **Dependencies**: `nexus_memory.sql` migration already applied. `PdfReport.tsx` + `reportTokens.css` already exist and work client-side. `MilestonesDashboardPage.tsx` already renders the correct UI — only data source needs wiring.

## Assumptions
1. The `20260812_nexus_memory.sql` migration ran in production and the table/RLS is live. If not, P2-2 code will gracefully no-op with a warning instead of breaking chat (schema-version check or try/catch on first write).
2. DeepSeek (not OpenAI) is the LLM used for in-line NLU extraction — we don't call the LLM. The heuristic extractor is good enough because the recall preamble is labeled explicitly and users can override it.
3. `profile_settings` table exists with column `enable_nexus_memory boolean default true` — per NFR-5 if missing, we treat it as opt-in (default-true). If it's really absent, add it to the migration.
4. The `react-dom/server` package is available in serverless node_modules at runtime.
5. No signed-URL test harness is available — we verify the upload-to-storage side only in this environment, and trust the Supabase signed URL contract.

## Acceptance Criteria

### AC-P2-1-1: Endpoint no longer returns 501
- **Type**: `rule`
- **Given**: A valid POST `/api/reports/pdf` with matching Zod schema `PdfDataShape`, Bearer token, and an assessment_result_id the caller owns
- **When**: The request hits the live handler
- **Then**: HTTP status is 200; the response body has `{ ok: true, download_url, document_id, expires_at }` for `response_mode='url'`
- **Pass Condition**: Response code is 2xx, `ok === true`, `download_url` is a non-empty https URL
- **Evidence**: `curl` or `fetch` call captured; serverless invocation log snippet showing successful completion; no 501 in the response.

### AC-P2-1-2: Tier redactions applied server-side
- **Type**: `rule`
- **Given**: A request payload where `data.viewerTier = 'executive_introduction'` (must show ≤ 3 dimensions, only 1 strength in AI insights — per existing `reportTemplates.applyTierRedactions`)
- **When**: We inspect the stored PDF text (extract with pdf-parse after upload)
- **Then**: The number of visible dimension entries in the extracted text ≤ 3; strengths list length = 1
- **Pass Condition**: Both invariants hold after PDF text extraction
- **Evidence**: CLI text extraction of the generated PDF with a grep dimension-count + strengths-count command.

### AC-P2-1-3: ExportPdfButton falls back on failure
- **Type**: `rule`
- **Given**: `ExportPdfButton` is mounted; the `/api/reports/pdf` URL is reachable but returns 400/422/500 (simulate by sending bad payload) OR the server takes > 2 s
- **When**: User clicks "Export PDF"
- **Then**: Button shows "Exporting… (capture)" and the jsPDF download pipeline is invoked; user gets a downloaded PDF; no uncaught exception thrown
- **Pass Condition**: `exportAssessmentPdf` is called (spied/stubbed via instrumentation) in a test or the function logs a "fallback to client pipeline" line; the resulting PDF bytes exist and are ≥ 10 KB
- **Evidence**: Browser DOM trace / jest snapshot of fallback state; downloaded PDF size. For non-browser env: confirm the code path with a `grep` / inspection of `catch` block that routes to client pipeline.

### AC-P2-1-4: Ownership check prevents cross-user read
- **Type**: `rule`
- **Given**: A valid payload but `data.result.result_id` belongs to a different user_id than the one in the Bearer token (pre-create via seed script)
- **When**: POST /api/reports/pdf
- **Then**: HTTP 403; body `{ ok: false, code: 'OWNERSHIP_MISMATCH' }`
- **Pass Condition**: Status=403, code matches exactly
- **Evidence**: curl POST log showing 403 response; JSON body captured.

### AC-P2-2-1: Memories are written after a chat turn with triggers
- **Type**: `rule`
- **Given**: A chat message from user "I decided to accept the Singapore role. I prefer one-on-one check-ins with my direct reports. I will draft the transition plan by Friday." → normal assistant reply → chat turn completes
- **When**: We query `nexus_episodic_memory WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`
- **Then**: At least 3 rows exist for the user with distinct `memory_type` values covering `decision` (trigger: "I decided"), `preference` (trigger: "I prefer"), `action_item` (trigger: "I will … by Friday")
- **Pass Condition**: count_rows >= 3 AND distinct_memory_types includes 'decision' AND 'preference' AND 'action_item'
- **Evidence**: SQL query output captured; inserted content text matches substrings of the chat message.

### AC-P2-2-2: Memory preamble is injected into next chat system prompt
- **Type**: `rule`
- **Given**: Same user from AC-P2-2-1 starts a new session and sends "What's the transition plan I mentioned?" (different session_id, ≥ 1 minute later)
- **When**: We inspect the DeepSeek request body (log the sysPrompt before the fetch)
- **Then**: The sysPrompt string contains a "Recall (from prior sessions):" block that includes at least one of the previously extracted phrases ("Singapore role", "one-on-one check-ins", "transition plan by Friday")
- **Pass Condition**: Block present AND contains at least one memory content substring
- **Evidence**: Console-captured sysPrompt excerpt before outbound fetch; grep `'Recall'` in worker logs.

### AC-P2-2-3: Semantic memory upsert on summary trigger
- **Type**: `rule`
- **Given**: User has completed 6 chat sessions OR sent `/summary` at the end of a turn
- **When**: We inspect `nexus_semantic_memory WHERE user_id = $1`
- **Then**: `user_model->'goals'` jsonb array has at least 1 item OR `user_model->'preferences'->'focus_areas'` has at least 1 item; `update_count >= 1`
- **Pass Condition**: Either goals or focus_areas non-empty AND update_count >= 1
- **Evidence**: SQL SELECT of jsonb fields + update_count.

### AC-P2-2-4: Disabled user settings skip reads + writes
- **Type**: `rule`
- **Given**: `profile_settings.enable_nexus_memory = false` for a user
- **When**: 2 consecutive chat turns run for this user
- **Then**: Zero rows written to `nexus_episodic_memory` for the user in that window; sysPrompt contains neither "Recall" nor "from prior sessions"
- **Pass Condition**: row_count_after − row_count_before = 0 AND sysPrompt grep returns empty
- **Evidence**: Before/after counts; sysPrompt excerpt.

### AC-P2-2-5: Audit log populated
- **Type**: `rule`
- **Given**: Any memory write (episodic insert or semantic upsert) occurs
- **When**: Query `nexus_memory_audit WHERE user_id = $1 ORDER BY ts DESC`
- **Then**: At least 1 row with `source = 'auto_extraction'` and `change_type` in ('created', 'updated')
- **Pass Condition**: audit_count_before < audit_count_after; source field correct
- **Evidence**: Audit table SELECT after write operation.

### AC-P3-1-1: Milestone table exists + RLS applied
- **Type**: `rule`
- **Given**: P3-1 migration applied against a clean supabase dev database
- **When**: `\dt milestones` + `\d+ milestones` in psql OR Supabase API describe
- **Then**: Table exists with columns matching FR-P3-1-1; `relrowsecurity = on`; SELECT/INSERT/UPDATE/DELETE policies are owner-only
- **Pass Condition**: All named columns present; RLS ENABLED confirmed via query `SELECT relrowsecurity FROM pg_class WHERE relname = 'milestones'`
- **Evidence**: psql output or equivalent Supabase REST schema query.

### AC-P3-1-2: RPC validates OWNER_MISMATCH
- **Type**: `rule`
- **Given**: Seed a milestone where user_id = Alice
- **When**: Call `SELECT validate_and_set_milestone_progress(milestone_id, 50, Bob_id)` where Bob ≠ Alice
- **Then**: Function returns `{ ok: false, code: 'OWNER_MISMATCH' }` and progress value unchanged
- **Pass Condition**: `code == 'OWNER_MISMATCH'` and previous_progress unchanged
- **Evidence**: psql SELECT of RPC return; before/after progress field on row.

### AC-P3-1-3: RPC validates FINALIZATION_EVIDENCE
- **Type**: `rule`
- **Given**: Seed a milestone with current progress = 75, owner = Alice
- **When**: Call RPC with progress = 100, evidence = NULL or {}
- **Then**: Code = `'FINALIZATION_EVIDENCE'`; row still at 75
- **Pass Condition**: code matches, progress unchanged at original value
- **Evidence**: RPC return + subsequent SELECT on row.

Retry variant with `evidence = {lens_readout_referenced: true}` → progress=100 succeeds.

### AC-P3-1-4: RPC validates DEPENDENCY_UNMET
- **Type**: `rule`
- **Given**: Milestone M-a (progress=40), Milestone M-b (dependency_ids=[M-a.id]). Both same owner.
- **When**: Call `validate_and_set_milestone_progress(M-b.id, 90, owner)`
- **Then**: Code = `'DEPENDENCY_UNMET'`; return body includes failing dep id(s)
- **Pass Condition**: code matches AND payload lists M-a.id
- **Evidence**: RPC return JSON.

Then bump M-a to 85 and retry M-b → success.

### AC-P3-1-5: HTTP route rejects 422 on validation fail + 403 on owner fail
- **Type**: `rule`
- **Given**: HTTP endpoint action on [job].ts
- **When**: POST with Alice's Bearer token but Bob's milestone id (ownership)
- **Then**: HTTP 403 + code `OWNER_MISMATCH`
- **And when**: POST valid owner but evidence-missing 0→100 jump
- **Then**: HTTP 422 + code `FINALIZATION_EVIDENCE`
- **Pass Condition**: Both status + code combinations correct
- **Evidence**: curl POST logs for both test cases.

### AC-P3-1-6: Dashboard page wires real data + reverts on validation fail
- **Type**: `rule`
- **Given**: Logged-in user with 3 milestones in DB (one queued, one active, one completed per MilestoneItem type)
- **When**: Dashboard mounts
- **Then**: Rows rendered match the DB rows (name, date, progress) — not the mock constants
- **And when**: User clicks to set an active milestone's progress to 100 with NULL evidence (trigger FINALIZATION_EVIDENCE 422)
- **Then**: Optimistic progress → appears briefly → after 422 toast, progress reverts to original server value; toast shows `FINALIZATION_EVIDENCE` text
- **Pass Condition**: Data-from-DB visible before user action; after failing click, progress value = server-original; toast message contains exact error code
- **Evidence**: DOM snapshots (mocked DataLoader in jest or manual Playwright-ish trace); toast capture; state before/after diff.

### AC-P3-1-7: Milestone status auto-flips at thresholds inside RPC
- **Type**: `rule`
- **Given**: Milestone Q (status='queued', progress=0); Milestone A (status='active', progress=75)
- **When**: For Q: call progress=15; For A: call progress=95 evidence={lens_readout_referenced: true}
- **Then**: Q.status=='active', A.status=='completed' and A.completed_at is non-null
- **Pass Condition**: Both status transitions correct; completed_at populated for A
- **Evidence**: SELECT status, completed_at after both calls.

### AC-Quality-1: Build passes (vite + tsc)
- **Type**: `rule`
- **Given**: Fresh `npm install`
- **When**: `npm run build`
- **Then**: Exit code 0, "built in Xs" success line, no `error TS` or `Error: Transform failed` in output
- **Pass Condition**: Exit 0 + success line
- **Evidence**: Full `npm run build` tail captured with ≥ last 6 lines including "built in"

### AC-Quality-2: Net +0 serverless function files
- **Type**: `rule`
- **Given**: `ls api/**/*.ts`
- **When**: Count unique Vercel-function root files (files directly under api/, not subfragments imported by them — except workers/[job].ts which counts as 1)
- **Then**: Net function count after implementation ≤ before + 0 (i.e., no new `api/foo.ts` files; everything must route into existing routes)
- **Pass Condition**: Count is identical to pre-implementation count (P2-1 reuses pdf.ts, P2-2 reuses [job].ts, P3-1 uses [job].ts action dispatch)
- **Evidence**: `find api/ -maxdepth 3 -name "*.ts" -not -path "*/lib/*" -not -path "*/_lib/*" | sort` before/after diff.

### AC-Quality-3: Spec-to-code fidelity (no phantom path refs)
- **Type**: `rubric`
- **Dimension**: Consistency of implementation with verified existing codebase paths
- **Scale**: 1-4
- **Anchors**: 1 = Implementation references nonexistent files (e.g., imports from `api/_lib/nexusChatHandler.ts`); 2 = Some references are wrong, features work but in wrong entrypoints; 3 = All entrypoints correctly route into existing `api/workers/[job].ts`, `api/reports/pdf.ts`, `MilestonesDashboardPage.tsx`; no phantom paths; 4 = Same as 3 AND every `TODO` or `FIXME` left in the code references a clear future ticket number, not a missing file.
- **Pass Threshold**: >= 3
- **Evidence**: `grep -rn "_lib/nexusChatHandler\|// TODO: \?[^#]" --include="*.ts" --include="*.tsx"` result.

### AC-Quality-4: Security consistency
- **Type**: `rubric`
- **Dimension**: Alignment of auth + ownership patterns with existing endpoints
- **Scale**: 1-5
- **Anchors**: 1 = No auth on new endpoints, user_id accepted from POST body; 3 = Bearer JWT on external endpoints, user_id derived from JWT on most routes; 5 = Identical pattern to existing `run.ts`: `getAuthorizedContext(req, false)` call at top, tier/owner checks before any DB write, structured error codes with consistent wording, scope-restricted SELECTs.
- **Pass Threshold**: >= 4
- **Evidence**: Diff inspection of `getAuthorizedContext` usage vs P1-1 run.ts; code review of where `userId` originates in each of 3 tickets.

## Open Questions
- [ ] PDF rendering approach on Node: `pdfkit` text-native render (good output quality, ~5MB dep) vs `react-dom/server.renderToStaticMarkup` + feed into a mini CSS→PDF pipeline. Default decision: **pdfkit** because it avoids needing JSDOM + browser CSS shims on serverless. If this is unacceptable, flag it during Approve.
- [ ] Memory extraction precision: default heuristic-only per Constraints section. If you want LLM-based extraction, that would add ~$0.005/turn + ~800ms latency. Explicit flag if you'd prefer it.
- [ ] Milestone creation flow: the dashboard has no Add Milestone button today — P3-1 only validates updates. Do we need to add a DB seed on first-load for users who have zero rows? Default decision: if no milestones exist, P3-1 endpoint still works (returns empty list) and the existing dashboard gracefully shows "No milestones yet" state. If instead we should auto-create default milestones from lens readouts, specify that in approval.
