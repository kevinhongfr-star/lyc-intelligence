# T-001: Assessment Result API Schema & Endpoints

**Phase:** 0 | **Batch:** 0A | **Effort:** 1 day
**CD Source:** CD16 (Assessment Platform) — `../cd_docs/CD16_Assessment_Platform*`
**Depends On:** Nothing
**Blocks:** T-002, T-113, all Phase 1 diagnostic pages

---

## What to Build

Implement the Assessment Result API that stores and retrieves assessment results. This is the data layer that all diagnostic pages and archetype result displays consume.

## API Endpoints

### `POST /api/assessment/submit`
Submit a completed assessment.
- **Request Body:** `{ instrument_id, answers: { [question_id]: number } }`
- **Response:** Full `AssessmentResult` object (see data model in PHASE-0-OVERVIEW.md)
- **Logic:** Calculate dimension scores → run classification engine (T-002) → compute modifiers (T-003) → return result

### `GET /api/assessment/result/[id]`
Retrieve a specific assessment result by ID.
- **Response:** Full `AssessmentResult` object
- **Used by:** Result page template (T-113) for gated full report display

### `GET /api/assessment/result/[id]/summary`
Retrieve teaser-only data (for non-gated display).
- **Response:** `{ archetype: { name, category, description }, instrument_color, archetype_icon }`
- **Used by:** Free tier display before email gate

## Data Model

See `PHASE-0-OVERVIEW.md` for full TypeScript interface.

## Acceptance Criteria

- [ ] `POST /api/assessment/submit` accepts answers and returns full result
- [ ] `GET /api/assessment/result/[id]` returns full result
- [ ] `GET /api/assessment/result/[id]/summary` returns teaser-only data
- [ ] All 9 instruments have correct dimension definitions
- [ ] Results persisted to database (Supabase)
- [ ] API documented with OpenAPI/Swagger or inline comments
- [ ] Unit tests for input validation and error handling

## Technical Notes

- Use existing Supabase connection (already integrated for newsletter/leads)
- TypeScript interfaces must match CD16 spec exactly
- No frontend work in this ticket — API only
