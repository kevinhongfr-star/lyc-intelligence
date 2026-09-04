# NEXUS P2 / P3 Completion — Implementation Plan

Decomposition order follows dependency chains: P3-1 migration first (creates `milestones` table + RPC + indexes + profile_settings nullable check — zero deps on anything else), then P2-2 (reads existing `nexus_memory.sql` tables, just needs memory extraction code and profile_settings guard — depends on profile_settings column existing, which it will after the P3-1 migration patch), then P2-1 (depends on `reportTokens.css` being loadable on the server + `PdfReport.tsx` SSR dependency decisions, independent of DB work). Finally wire frontend glue for all 3 tickets.

## Task 1: P3-1 Migration — milestones table + validation RPC + profile_settings guard

- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Create `supabase/migrations/20260903_p3_milestones_validation.sql` with:
    - `milestones` table per FR-P3-1-1 schema (id, user_id FK auth.users cascade, name, description, tags text[], progress int CHECK 0-100, status milestone_status enum, source_assessment_code, dependency_ids uuid[], required_lens_score jsonb, created_at timestamptz, completed_at timestamptz, updated_at timestamptz)
    - GIN index on tags[], dependency_ids; btree on user_id, status, progress
    - ENABLE ROW LEVEL SECURITY + 4 owner-only policies (SELECT/INSERT/UPDATE/DELETE where auth.uid() = user_id)
    - `milestone_status` enum: 'queued' | 'active' | 'completed' (use IF NOT EXISTS pattern for idempotency with existing `CREATE TYPE` in case enum already exists from another branch)
    - `CREATE OR REPLACE FUNCTION validate_and_set_milestone_progress(...)` implementing FR-P3-1-2 rules 1-6 and auto-flip rules 7 (status transitions based on thresholds per AC-P3-1-7). Function must RETURN TABLE(ok boolean, code text, message text, previous_progress int, new_progress int) for multi-column return.
    - Also upsert-safe ALTER of `profile_settings` table: `ALTER TABLE IF EXISTS profile_settings ADD COLUMN IF NOT EXISTS enable_nexus_memory boolean DEFAULT true;` — supports FR-P2-2-5 (if this column already exists, ADD COLUMN IF NOT EXISTS is a no-op on PG12+).
    - Also add `CREATE INDEX IF NOT EXISTS idx_semantic_memory_user_model_gin ON nexus_semantic_memory USING GIN (user_model);` for NFR-3 (semantic memory index).
- **Acceptance Criteria Addressed**: AC-P3-1-1, AC-P3-1-2, AC-P3-1-3, AC-P3-1-4, AC-P3-1-7, AC-P2-2-5 (profile_settings column), NFR-3 (GIN index)
- **Test Requirements**:
  - `rule` TR-1.1: Milestone table exists + RLS on. After `psql -f migration.sql`, `SELECT relrowsecurity FROM pg_class WHERE relname='milestones'` returns `t`; `SELECT COUNT(*) FILTER (WHERE relname='milestones') FROM pg_class` returns 1. Evidence: psql output or Supabase Studio schema list.
  - `rule` TR-1.2: RPC exists + returns right shape. `SELECT proname, prorettype::regtype FROM pg_proc WHERE proname='validate_and_set_milestone_progress'` returns 1 row, rettype=TABLE(...). Evidence: psql output.
  - `rule` TR-1.3: profile_settings.enable_nexus_memory column present with default true. `SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name='profile_settings' AND column_name='enable_nexus_memory'`. Evidence: query result.
  - `rule` TR-1.4: GIN index on semantic_memory user_model present. `SELECT indexname FROM pg_indexes WHERE indexname='idx_semantic_memory_user_model_gin'`. Evidence: query result.

## Task 2: P3-1 HTTP endpoint — `action='validate_milestone'` on `api/workers/[job].ts`

- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1 (migration must exist so RPC is present at runtime; no runtime coupling at code level but testing needs both)
- **Description**:
  - Add to `api/workers/[job].ts` inside `handleChat` dispatch — after `body` parse, alongside the existing `process_doc` branch — a new `if (body.action === 'validate_milestone')` → delegate to `handleValidateMilestone(req, res, authUser, body)`.
  - New function `handleValidateMilestone` performs:
    1. Reads `milestone_id`, `new_progress`, `evidence` fields from body (zod validation).
    2. Calls the Supabase RPC `validate_and_set_milestone_progress` via `supabaseServiceFetch` or `rpc()` on the service client — passing authUser.id as `p_user_id`.
    3. Translates the RPC result to HTTP codes: `ok=true` → 200, `code='OWNER_MISMATCH'` → 403, any validation code (`PROGRESS_RANGE`, `PROGRESS_REGRESS`, `FINALIZATION_EVIDENCE`, `DEPENDENCY_UNMET`, `ALREADY_COMPLETED`) → 422 with `{ ok:false, code, message, context? }`.
    4. Also add a sibling `if (body.action === 'list_milestones')` → fetches from `milestones WHERE user_id = authUser.id ORDER BY status, created_at DESC` so the dashboard has a read path.
    5. Zero extra serverless function files. Everything lives in the existing `[job].ts` per AC-Quality-2.
- **Acceptance Criteria Addressed**: AC-P3-1-5
- **Test Requirements**:
  - `rule` TR-2.1: Action routing exists. `grep -c "action === 'validate_milestone'\\|action === 'list_milestones'" api/workers/\[job\].ts` >= 2. Evidence: grep count.
  - `rule` TR-2.2: Owner mismatch → 403 OWNER_MISMATCH. Run script POST to endpoint with Bearer token of user A but milestone_id owned by user B. Expects status=403 code=OWNER_MISMATCH. Evidence: curl log.
  - `rule` TR-2.3: Validation fail → 422 with exact codes. POST a 0→100 jump with no evidence: status=422, code=FINALIZATION_EVIDENCE. POST Bob's token to Alice's milestone → 403 OWNER_MISMATCH. POST duplicate attempt on completed milestone → 422 ALREADY_COMPLETED. Evidence: curl logs.
  - `rule` TR-2.4: list_milestones returns only caller's rows. POST as Alice; returned rows all have user_id=Alice sub; none of Bob's rows. Evidence: output JSON.
  - `rubric` TR-2.5: Security consistency (aligns with run.ts patterns). Scale 1-5. Anchors: 1 = no auth, accepts user_id from body; 3 = has bearer but loose; 5 = identical pattern to run.ts: uses existing auth context derivation (authUser already established from the outer handleChat), never trusts body.user_id, all RPC calls use server role but filter by authUser.id anyway, structured enums match. Threshold >= 4. Evidence: code review snippet comparing auth derivation of run.ts vs handleValidateMilestone.

## Task 3: P2-2 Cross-session memory — extraction, semantic upsert, audit writes in `[job].ts`

- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1 (profile_settings.enable_nexus_memory must exist so profileSettings select succeeds without error; GIN index for reads)
- **Description**:
  - Add 3 functions to `api/workers/[job].ts`:
    1. `extractMemories(userMessage: string, assistantReply: string): Array<{content: string, memory_type: nexus_memory_type}[]>` — keyword heuristic classifier from Constraints section (decision/action_item/preference/emotion/fact detection via regex). Up to 5 items per call. Dedup content with `sha256(content[:80])` + check against last 5 min of user's rows to avoid double writes (NFR-1 dedup).
    2. `updateSemanticMemoryIfDue(userId, conversationIdOrSessionId)` — checks session count or `/summary` flag; if triggered, aggregates 10 latest `fact`/`decision`/`action_item` memories, merges into `user_model` JSONB fields (goal sentences → `goals`, preference sentences → `preferences.focus_areas`, role/industry sentences → `career_context`). Upserts the single-row semantic memory table.
    3. `fetchContextMemories(userId, currentMessageText): string` — top-k retrieval: reads semantic row (always), reads up to 6 episodic rows where `importance_score >= 0.75 OR content ILIKE tokens_from_message` (case-insensitive pattern match on last 90 days). Builds and returns the "Recall (from prior sessions):" markdown block.
  - Wire:
    - At chat-end (after the DeepSeek response is fully received & credit has been deducted), call extractMemories → bulk insert into nexus_episodic_memory via service role (user_id = authUser.id, source_conversation_id = sessionId or first 36 chars). Insert rows individually + each insert writes a nexus_memory_audit created row with source=auto_extraction.
    - Every 5th session or on explicit `/summary`, call updateSemanticMemoryIfDue → upsert + write audit `updated` row.
    - At chat-begin (between docContextBlock construction and messages.push sysPrompt), call fetchContextMemories and append to the system prompt with its own divider. **Order** matters: sysPrompt original (persona + tier) → `\n\n--- Document context ...` (RAG, if any) → `\n\n--- Recall (from prior sessions): ...` (memory, if any) → END. Keep them separately labeled.
    - Profile guard: Before ANY read/write, SELECT `enable_nexus_memory FROM profile_settings WHERE user_id = authUser.id LIMIT 1`. If false or row absent but default true: treat absent as opt-in. If column explicitly = false, skip everything.
  - All queries add `WHERE user_id = authUser.id` even though service role bypasses RLS (FR-P2-2-4).
- **Acceptance Criteria Addressed**: AC-P2-2-1, AC-P2-2-3, AC-P2-2-4, AC-P2-2-5
- **Test Requirements**:
  - `rule` TR-3.1: Trigger-based extraction writes correct types. Construct a test message with triggers, mock the chat-end call. SELECT count + distinct types from episodic memory. Expect count>=3 and types contains decision+action_item+preference. Evidence: INSERT output + SELECT query.
  - `rule` TR-3.2: System prompt has Recall block on next session. After Task 3.1 writes, re-run chat beginning with a follow-up message. Log sysPrompt before DeepSeek fetch → grep for "Recall (from prior sessions):" block. Block contains ≥ 1 phrase from the extracted memories' content substrings. Evidence: log excerpt.
  - `rule` TR-3.3: Semantic memory upserted when `/summary` is used. After 1 session with `/summary`, check nexus_semantic_memory: update_count>=1 AND (jsonb_array_length(user_model->'goals')>=1 OR jsonb_array_length(user_model->'preferences'->'focus_areas')>=1). Evidence: SELECT of fields.
  - `rule` TR-3.4: Disabled settings skip writes. Set profile_settings.enable_nexus_memory=false for a test user, run 2 chat turns. Before/after counts: nexus_episodic_memory unchanged; sysPrompt has no Recall block. Evidence: before/after SQL + log excerpt.
  - `rule` TR-3.5: Audit row written on memory insert. After any extraction write: SELECT COUNT(*) FROM nexus_memory_audit WHERE user_id=$user AND source='auto_extraction' AND change_type IN ('created','updated') — before < after. Evidence: SQL count diff.

## Task 4: P2-1 PDF server render — rewrite `api/reports/pdf.ts` from 501 → working pipeline

- **Status**: `pending`
- **Priority**: high
- **Depends On**: None (decoupled from other work — only needs pdfkit npm package installed)
- **Description**:
  - Install `pdfkit` (pure Node, ~2MB dep) — add to package.json dependencies.
  - Keep existing Zod schemas (PdfDataShape) and auth skeleton in pdf.ts. Replace the 501 handler body with:
    1. **Auth + ownership check** (FR-P2-1-3): `getAuthorizedContext(req, false)` → userId. If body includes `data.result.result_id`, verify ownership via PostgREST `user_assessment_progress WHERE result_id = $1 AND user_id = $2` single-row select. Fail: 403 OWNERSHIP_MISMATCH.
    2. **Tier redaction** (FR-P2-1-2): Call the same `applyTierRedactions(data, viewerTier)` function already exported from `src/types/reportTemplates.ts` (import from relative path — note: serverless runtime can import TS from src if Vercel bundles it, which it does via esbuild). If the import path is unresolved at build time, inline a copy of the redaction rules.
    3. **Generate PDF bytes with pdfkit** matching PdfReport's 6 sections section-by-section:
      - **Cover page**: Rectangle brand strip on left (use `data.definition.accent_color`), LYC brand mark small caps, title (large, accent color), subtitle, recipient name. Score hero: big SVG-style arc drawn with `doc.circle` + stroke arcs. Recipient + date footer + confidentiality statement (`CONFIDENTIALITY_STATEMENTS[data.viewerTier]`).
      - **Exec summary**: overall score KPI, overall_level label, 1-paragraph aiInsights.summary truncate to ~300 chars, top-3 dimension KPIs grid (boxes with dimension_name + score numeric + level label).
      - **Dimension breakdown**: each dimension with label + bar-track rectangle + bar-fill rectangle at score% width + 1-sentence dimension.description. Apply EI redaction (≤ 3 visible dimensions)
      - **AI insights**: "AI-Guided Insights" heading; strengths list bullets; growthAreas list; nextSteps list. EI redaction: only 1 strength + no gaps → upgrade CTA.
      - **Archetype**: if archetype exists → name + full description + key traits as bullet list.
      - **NEXUS CTA**: tier-appropriate block (EI = upgrade pitch; Pro+ = "Book a 30-min debrief with LYC coaching").
      - Footer on every page: "LYC Partners — Confidential assessment — Page X/Y", single thin line above.
    4. **Save bytes to Storage**: Document id = `crypto.randomUUID()`. Storage path = `reports/{userId}/{document_id}.pdf`. Use service-role supabase Storage upload with `upsert: false`, `contentType: 'application/pdf'`.
    5. **Signed URL generation**: Call `supabase.storage.from('chat-uploads').createSignedUrl(path, 86400)` — the Storage RLS rule for reports folder matches the chat-uploads pattern (first folder = userId). expires_at = new Date(Date.now() + 86_400_000).toISOString().
    6. **Return 200**: Default response_mode=url → `{ ok: true, download_url, expires_at, document_id }`. response_mode=inline → set `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="LYC-${code}-${date}.pdf"`, send PDF Buffer directly. 
  - **Keep 501 fallback**: If pdfkit fails to import or if jsdom (if used) is unavailable at runtime → gracefully return 501 with the SERVER_RENDER_UNAVAILABLE code so ExportPdfButton uses client fallback. Never break the endpoint.
- **Acceptance Criteria Addressed**: AC-P2-1-1, AC-P2-1-2, AC-P2-1-4
- **Test Requirements**:
  - `rule` TR-4.1: Valid payload returns 200 with signed URL. POST valid payload with response_mode=url → status 200, ok=true, download_url starts with 'https://', document_id is uuid-ish string. Evidence: curl log.
  - `rule` TR-4.2: Generated PDF is valid + non-empty. Download the signed URL, run `pdf-parse` on it. Extract text → ≥ 2000 chars, contains recipient name + definition.title. File size ≥ 30 KB. Evidence: pdf-parse stdout + ls -l.
  - `rule` TR-4.3: Tier redactions work. Use viewerTier=executive_introduction data with 10 dimensions. Parse text, count occurrences of dimension label: ≤ 3 unique. Count 'Strength' bullets in AI section: exactly 1. Evidence: grep counts of extracted text.
  - `rule` TR-4.4: Ownership rejection. Craft a payload referencing a result_id from another user's user_assessment_progress row. POST → 403 + code=OWNERSHIP_MISMATCH. Progress of target row unchanged. Evidence: curl log + row SELECT before/after.
  - `rubric` TR-4.5: Visual fidelity to PdfReport.tsx. Scale 1-4. Anchors: 1 = no cover page, all text-only layout; 2 = missing 2+ sections (e.g. no archetype, no AI insights), fonts plain; 3 = all 6 sections present, gauges are simple numeric not arcs but scores visible, section headers are distinguishable; 4 = all 6 sections present, accent color matched for header brand strip + gauge arcs, bar chart for dimensions uses rectangles proportional to score, section ordering matches client PDF (cover → exec → dim → ai → archetype → cta). Threshold >= 3. Evidence: PDF screenshot or structured text dump section list.

## Task 5: P2-1 Frontend — `ExportPdfButton` tries server first

- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 4 (server side must be stable enough to call; timeout fallback handles failure)
- **Description**:
  - In `ExportPdfButton.tsx`'s `doExport` useCallback, add an attempt block BEFORE the current client pipeline:
    1. `const controller = new AbortController(); const t = setTimeout(() => controller.abort(), 2000)` → 2-second timeout (short so UX stays responsive)
    2. Fetch `{ method: 'POST', url: '/api/reports/pdf', headers: {Authorization: `Bearer ${accessToken}` via `supabase.auth.getSession()`, 'Content-Type': 'application/json'}, body: JSON.stringify({data, pageSize, response_mode: 'url'}), signal: controller.signal }`
    3. On success (res.ok + body.ok = true): `window.open(body.download_url, '_blank', 'noopener')` + show toast "Opening PDF in new tab…"
    4. On any failure (NetworkError, AbortError, !ok in body, res.status 4xx/5xx): clearTimeout, `clearTimeout(t)`, don't show error to user; log warning to console; proceed to the existing html2canvas pipeline with no break. Add the toast `toast.info('Using browser PDF export.')` (single-fire, debounced) if the server route failed (not if it was 200).
  - Keep the current client pipeline code untouched after the server attempt. The client pipeline already handles errors correctly; we just pre-empt it when server works.
  - No additional state is needed except `const [serverFailedOnce, setServerFailedOnce] = useState(false)` — once it fails once, stop trying for 30 seconds (avoid repeated 2s delays for same session) so the user's second click is fast.
- **Acceptance Criteria Addressed**: AC-P2-1-3
- **Test Requirements**:
  - `rule` TR-5.1: Happy path → opens signed URL in new tab. Mock fetch to return {ok:true, download_url: 'https://example.com/test.pdf'}. Spy on window.open → called with that URL + '_blank'. Client pipeline (html2canvas) not called at all. Evidence: jest/test stub assert result.
  - `rule` TR-5.2: Failure path → falls back. Mock fetch to throw NetworkError OR return 500. Spy on `exportPdfWithErrorBoundary` (client function) → called with correct args. No uncaught Promise rejection; `error` state remains null or shows fallback toast only. Evidence: test stub assert.
  - `rule` TR-5.3: Timeout path → < 2.3 s total delay before client export begins. Simulate fetch that never resolves. Trigger click; use timing stub to verify AbortSignal fires abort at ~2000 ms, then client pipeline starts ≤ 300 ms after. Evidence: timing assertion output.

## Task 6: P3-1 Frontend — `MilestonesDashboardPage.tsx` data from API + optimistic revert on validation fail

- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2 (HTTP validate_milestone + list_milestones actions exist)
- **Description**:
  - In MilestonesDashboardPage.tsx:
    1. Replace the 3 consts (ACTIVE_MILESTONES, COMPLETED_MILESTONES, QUEUED_MILESTONES) with `const [milestones, setMilestones] = useState<MilestoneItem[]>([])` and `useEffect` on mount → POST `/api/workers/chat` with `{ action: 'list_milestones' }` and Bearer token. The worker returns {data: [...milestones]}. Map status column to the existing 3 arrays via filter before rendering.
    2. Add a server-side original state ref: `const serverMilestonesRef = useRef<Record<string, {progress: number, status: string}>>({});` — populated on list_milestones success, so when a validation fails we can revert **exactly** to the server value.
    3. On progress bar click (or progress edit event — replace the current static `progress: 65` read-only display with a click-to-increment OR a slider if present): when user modifies progress, first do optimistic update (setMilestones with new progress), then POST `{ action: 'validate_milestone', milestone_id, new_progress, evidence: evidenceDraft }`. 
       - If 200: update serverMilestonesRef with new value. Mark done.
       - If 422/403: show toast.error(body.code + ': ' + body.message), revert that specific milestone's progress/status by overwriting from serverMilestonesRef.
    4. For evidence input: default evidence object starts as `{}`. When user is attempting to advance past 80% (i.e. current < 80 AND new >= 80), show an inline 3-checkbox prompt "Finalize evidence: I referenced a lens readout / I used a concrete LYC resource link / My consultant confirmed" (each checkbox toggles a boolean in the evidence JSON). Auto-show this modal on the 80→100 jump so users are aware of the requirement instead of hitting a 422. If all 3 unchecked, they get the 422 toast per FR.
    5. Handle empty milestones state: if DB returns [], show "No milestones yet — conversations with NEXUS surface suggested milestones automatically." with `progress` set to 0 so the page doesn't crash.
- **Acceptance Criteria Addressed**: AC-P3-1-6
- **Test Requirements**:
  - `rule` TR-6.1: Dashboard loads from list_milestones. Mock fetch response with 4 milestone rows (1 queued, 2 active, 1 completed). After mount, rendered screen contains milestone names from mock response; none of the mock constants' ids ("m1", "m2", "c1", etc.) appear. Evidence: DOM snapshot + rendered names assertion.
  - `rule` TR-6.2: Optimistic revert on 422 FINALIZATION_EVIDENCE. Set a milestone's progress from 75 → 100 with empty evidence. Mock returns 422 FINALIZATION_EVIDENCE. After re-render: progress displayed = server-original value (75), not 100. Toast message contains "FINALIZATION_EVIDENCE". Evidence: before/after state values + toast render assertion.
  - `rule` TR-6.3: Valid update from 30 → 50 succeeds (no evidence needed for mid-range progress). Progress value on render becomes 50; serverMilestonesRef updates accordingly; no toast. Evidence: state mutation assert.
  - `rule` TR-6.4: Empty state renders "No milestones yet…" without crashing. Mock list_milestones returns empty data. Page renders with text present, no console.error uncaught exception, 0 failing promise rejections. Evidence: page snapshot + console log capture.

## Task 7: Quality — Vercel-function count check, build pass, phantom-path audit

- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Tasks 1-6 completed (needs all artifacts present)
- **Description**:
  - Run `find api/ -maxdepth 3 -name "*.ts" -not -path "*/lib/*" | sort` before-and-after; confirm function count (files that are Vercel entrypoints, i.e. directly under `api/`) identical to pre-implementation. If we added a new entrypoint file, refactor into a dispatch route on existing file.
  - Run `npm run build`; ensure zero TS errors, exit 0, no ERR lines.
  - `grep -rn "_lib/nexusChatHandler\|api/_lib" --include='*.ts*'` to ensure no references to spec-only paths.
  - `grep -rn "import.*from.*pdf\.ts\|from.*'./_lib'"` for any incorrect cross-imports.
  - `grep -rn "user_id: body\.\|userId = body\." api/ src/services` audit that no endpoint accepts user_id from the request body (security check from AC-Quality-4). If found, fix by deriving from JWT/session instead.
  - Commit artifacts with single descriptive commit message per ticket granularity (3 commits, one per P2/P3 ticket, same convention as 136563f/e0d429f).
- **Acceptance Criteria Addressed**: AC-Quality-1, AC-Quality-2, AC-Quality-3, AC-Quality-4
- **Test Requirements**:
  - `rule` TR-7.1: Build passes exit-0. `npm run build` stdout contains `✓ built in …s` without error. Exit code 0. Evidence: last 10 lines of build output.
  - `rule` TR-7.2: No phantom paths. grep `api/_lib\|_lib/nexusChatHandler` → 0 matches. Evidence: grep output.
  - `rule` TR-7.3: Net +0 serverless functions. Before/after `find api/ -maxdepth 3 -name "*.ts"` counts are identical. Evidence: before/after diff.
  - `rubric` TR-7.4: Security score via audit grep. Score >= 4 per rubric anchors from AC-Quality-4. Evidence: grep and code review writeup.
  - `rubric` TR-7.5: Spec-to-code fidelity. Score >= 3 per AC-Quality-3 anchors. Evidence: grep TODO/fixme + phantom ref check output.
