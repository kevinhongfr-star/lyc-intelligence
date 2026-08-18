# PII Handling Approach — LYC Intelligence Platform

Scope: V3-5 / #1345 PII Exclusion Audit. Applies to client-side analytics (eventTracker), error reporting (errorMonitor), audit logging (auditLogger), and server-side API logging (api/_lib_src/validate.ts → logServerError).

---

## 1. What counts as PII

We classify the following data as Personally Identifiable Information or
sensitive user-linked data that must **never** be sent to third-party
analytics (Vercel Analytics, PostHog, log drains), or written to error
reports or shared audit trails in raw form:

- **Direct identifiers**
  - Full name, first name, last name, display name (`name*`)
  - Email address (`email*`)
  - Phone number, mobile, fax (`phone*`)
  - Physical / billing address (`address*`)
  - Passport / national ID numbers (`passport*`)
  - IP address (`ip*`, `x-forwarded-for`, `x-real-ip`)
  - Company name — when attached to a single person (string < 100 chars)

- **Account-linked identifiers (linkable to real person)**
  - Raw `user_id` UUID, Supabase `auth.uid()`, `profile.id`
  - Session IDs, anonymous IDs, auth sessions (`session*`)
  - Bearer tokens, API keys, cookies (never logged)

- **User-generated sensitive content**
  - Assessment results, scores, dimension values (`result*`, `score*`)
  - Assessment profile / answers blobs (`profile*`, `answers*`)
  - NEXUS chat messages and message bubble text (`chat*`, `message*`)

Anything in this list is scrubbed before leaving the browser / hitting a
third-party sink. Server logs keep scrubbed versions only (see §5).

---

## 2. Scrubber function location

Primary scrubber (universal, browser):
- **`src/analytics/eventTracker.ts` → `scrubPII<T>(obj: T): T`** (exported)
- Called automatically on every `trackEvent()` call before buffering.
- Also re-used by `errorMonitor.ts` via the re-export.

Scrubber capabilities:
1. **Key-based redaction** (recursive, case-insensitive partial match):
   Keys matching `name`, `email`, `phone`, `result*`, `score*`, `profile*`,
   `chat*`, `message*`, `ip`, `session`, `passport`, `address`, `company`
   → value replaced with `[<key> scrubbed]`. For large strings (> 64 char)
   the length is preserved as `[<key>_len=N_scrubbed]`.
2. **Value-pattern redaction** (applied to all string values regardless of key):
   - Emails (RFC 5322-ish regex) → `[email scrubbed]`
   - UUIDs (any version) → `[uuid_<8-char-hash>]` (non-reversible, only
     preserves grouping/identity for log-correlation, not recovery).
3. **Long-assessment-blob length summary** (applied to values whose key-hint
   suggests assessment/result/profile/message/chat content):
   `[assessment_results len=XX scrubbed]` / `[message_bubble len=XX scrubbed]`
   if length > 80 chars.

Secondary scrubbers:
- `src/analytics/errorMonitor.ts` → `scrubErrorMessage(message: string)`
  (email regex, UUID 8-char hash, long-assessment-blob length summary).
- `src/utils/auditLogger.ts` → private `scrubObject()` + `scrubPIIString()`.
- `api/_lib_src/validate.ts` → private `scrubMessage()` + `scrubBodyForLog()`.

---

## 3. Event policy (analytics)

Rule: **No PII in analytics events. Ever.**

Enforcement:
1. `trackEvent(name, props, opts)` runs `scrubPII()` on:
   - `props` (event properties)
   - `ctx` (browser context: URL, userAgent, sessionId → see §6)
   - `funnel` metadata
   - `user.id` → replaced with `[user_<8-char-hash>]`; `user.role` is
     retained (role is not PII; role helps with cohort analysis).
2. Vercel Analytics `window.va()` mirror payload is also scrubbed.
3. PostHog identity: `posthog.identify()` only runs when the caller sets
   `analyticsEnabled` (key required); the id is already passed through a
   hashing function via `setTrackingUser` partial (PostHog `distinct_id`
   should be a synthetic id, not a raw UUID, and the PostHog call site
   only runs when `analyticsEnabled === true` in the current build).

Banned fields (will always be scrubbed even if a developer adds them):
- `props.email`, `props.name`, `props.phone`, `props.assessmentResultsArray`,
  `props.chatMessageText`, `props.user_id` (raw).

---

## 4. Error policy (messages scrubbed)

Rule: **Error messages captured for monitoring are scrubbed of all PII
patterns before being sent to analytics or drains.**

Enforcement in `src/analytics/errorMonitor.ts`:
1. `normalizeError(err)` scrubs the `Error.message` and `Error.stack`
   through `scrubErrorMessage()` before the error is cached anywhere.
   - Email regex: `[email scrubbed]`
   - UUID regex: `[uuid_<8-char-hash>]` (hash is FNV-1a → hex 8 chars)
   - Long assessment JSON blobs matching `RE_LONG_ASSESSMENT_BLOB`:
     `[assessment_results len=N scrubbed]`
2. `reportError()` additionally:
   - Scrubs `ctx.user.id` → `[user_<8-char-hash>]`; `role` kept.
   - Scrubs `ctx.api.url` for embedded emails/UUIDs.
   - Runs `ctx.extra` / `ctx.scope` through `scrubPII()` from eventTracker.

Server-side (`api/_lib_src/validate.ts → logServerError`):
- Same email + UUID regex patterns applied to `err.message`, `err.stack`,
  `req.url`, and header values.
- Assessment dimension values (CPI/Shift/Prism/Spark dimension keys and
  numeric scores) matched by `RE_ASSESSMENT_VALUES` are collapsed to
  `[assessment_dim_val scrubbed]`.
- `req.body` is serialized → scrubbed → length-capped (512 chars) so a
  trace like `req.body.message = "I'm John at john@example.com, score 92"`
  becomes `"I'm [name scrubbed] at [email scrubbed], [assessment_dim_val scrubbed]"`.

---

## 5. IP logging policy

Rule: **IP addresses are NEVER sent to third parties (PostHog, Vercel
Analytics, error monitoring SaaS endpoints).**

Where IPs may appear:
- Server logs (`logServerError`): client IP is never written to the JSON
  payload. The header key `x-forwarded-for` / `x-real-ip` is in
  `SENSITIVE_HEADER_KEYS` → replaced with `[REDACTED]` before any write.
- Audit logger: `ipAddress` param is run through `scrubPIIString()` so
  embedded emails/UUIDs are redacted; we do not write raw IPs to
  `audit_logs.ip_address` from the scrubbed path. (In a future pass this
  column should be nullable to support GDPR data-minimization.)
- Browser analytics (`ctx`): IP is not available client-side, so this is
  a non-issue for `eventTracker`. Any IP derived header in an
  `x-geo-*` extension must be added to `SENSITIVE_HEADER_KEYS` on day zero.

---

## 6. Session ID and user-ID policy

Raw `sessionId` (client-generated random string stored in
`sessionStorage['lyc:session_id']`) is **not** sent to third-party sinks
in raw form:
- `scrubPII()` treats the `sessionId` key as PII →
  `[sessionId len=XX scrubbed]` in event payloads (because long random
  strings can be cross-correlated to identify a user over time).

Raw `user.id` (Supabase UUID) is:
- Never sent in raw form to analytics.
- Replaced by `[user_<8-char-hash>]` for cohort grouping (same user →
  same hash within a single deploy; hash is non-reversible 32-bit FNV
  truncated to 8 hex chars, so cannot be reversed to a UUID).

---

## 7. Third-party services in use and their PII posture

| Service             | Data sent                    | PII controls applied                                           |
|---------------------|------------------------------|----------------------------------------------------------------|
| Vercel Analytics    | Event name + props           | All props scrubbed via `scrubPII()` before `window.va()` call  |
| PostHog (opt-in)    | `$pageview`, `identify()`    | Enabled only with `VITE_POSTHOG_KEY`; user.id → hashed        |
| Vercel log drains   | `logServerError` JSON lines  | Email + UUID scrubbed; IP/headers redacted; body cap 512 chars|
| Supabase `audit_logs` table | auditLogger inserts | `changes`/`metadata`/`ip`/`ua` scrubbed via auditLogger PII fn|

Third-party services explicitly **NOT** configured in this build:
Segment, Mixpanel, Intercom, Hotjar, FullStory, Sentry (no external DSN).
If any of these are enabled later, they must route through the same
`scrubPII()` wrapper and their SDK must be configured with the
PII-redaction before-upload hook.

---

## 8. Enforcement checklist (when adding new telemetry)

Before calling `trackEvent()`, `reportError()`, or appending to an
audit log, ask:

1. [ ] Does this payload contain any field from §1? If yes → the
      scrubber will catch it, but you should drop it at the call site
      anyway (data minimization).
2. [ ] Could a `req.body` / `Error.message` string contain a user's
      email or UUID? Test with `scrubMessage()` locally before merging.
3. [ ] Never call `.toString()` on a Supabase error object without
      routing through `logServerError` (raw PG errors leak column names
      which are covered under §5 safe mapping — but PII fragments in
      parameter values still need scrubbing).
4. [ ] Do not log full `assessment_results.score_summary` JSON; use the
      length-summary form if aggregation is required.

This document is the canonical reference for ticket V3-5 acceptance
("Documented PII handling approach").
