# Org Intelligence - 5-Criteria Scoring Spec v1.2 (DRAFT)

**Status:** DRAFT - awaiting Kevin sign-off
**Author:** NEXUS (re-derivation, 2026-06-11)
**Replaces:** v1.1 internal OpenClaw spec (973 lines, lost in context compression)

---

## Context

The Org Intelligence module evaluates individuals (typically senior executives and high-potential ICs) in the org talent pool against a fixed 5-criteria framework. Each individual is scored on all 5 dimensions, then rolled up to a composite (0-100) plus tier label (T1-T4).

The original v1.1 spec (973 lines, internal OpenClaw) was lost in context compression on 2026-06-11. This v1.2 is a re-derivation based on:
- (a) the Org Intelligence module's "5-criteria" design principle (per Kevin's 2026-06-11 15:00 brief)
- (b) standard executive evaluation frameworks (Heidrick & Struggles, Egon Zehnder, Spencer Stuart)
- (c) the existing LYC codebase scoring patterns (TRIDENT 3D, PHI 3D)
- (d) the Codelco China mandate context (state-owned commodity, China market entry)

**Kevin should confirm or adjust the 5 criteria before T4 implementation begins.**

---

## The 5 Criteria (Proposed v1.2)

| # | Criterion | Definition | 0-20 Rubric Anchors | Weight |
|---|-----------|-----------|---------------------|--------|
| C1 | **Tenure & Track Record** | Years in current/most recent role, progression velocity, employer quality | 0-5 (early), 6-10 (mid), 11-15 (senior IC), 16-20 (P&L/V-suite) | 0.25 |
| C2 | **Network & Influence** | Org span, internal/external reach, P&L scope, decision authority | 0-5 (IC), 6-10 (team lead), 11-15 (dept head), 16-20 (C-suite/board) | 0.20 |
| C3 | **Performance & Impact** | Verifiable business outcomes (revenue, market share, KPIs, awards, public recognition) | 0-5 (limited), 6-10 (anecdotal), 11-15 (1-2 quant wins), 16-20 (sustained + quant + public) | 0.25 |
| C4 | **Mobility & Adaptability** | Cross-functional, cross-geo, role shifts, learning velocity, industry pivots | 0-5 (single track), 6-10 (one pivot), 11-15 (multi-track), 16-20 (multi-geo + multi-industry) | 0.15 |
| C5 | **Cultural & Mandate Fit** | Mission alignment, value fit, mandate-specific red/green flags | 0-5 (clear misfit), 6-10 (neutral), 11-15 (positive signals), 16-20 (strong fit + examples) | 0.15 |

**Default weights sum to 1.00.** Weights are hard-coded in `api/_lib/scoringCriteria.ts` for Phase 1; mandate-specific weights are Phase 2.

---

## Composite Formula

```
composite = (C1*0.25 + C2*0.20 + C3*0.25 + C4*0.15 + C5*0.15) * 5
```

Range: **0-100.** Tier mapping:

| Composite | Tier | Label | Action |
|-----------|------|-------|--------|
| 80-100 | T1 | Strong Primary | Top of shortlist |
| 60-79 | T2 | Strong Secondary | Active pipeline |
| 40-59 | T3 | Reserve | Development track |
| 0-39 | T4 | Not Recommended | Explicit dealbreaker |

(Aligned with existing TRIDENT tier convention in `src/services/tridentScoring.ts`.)

---

## LLM Prompt Architecture

**Per individual = 5 LLM calls (1 per criterion).** No batched LLM call across criteria - each criterion needs its own focused evidence pull and rubric application.

### Inputs per call
- Individual profile: name, current role, employer, tenure, public bio
- Source corpus: CV text + LinkedIn URL + recent news mentions + public filings + Chinese platform results (Liepin/Zhilian/Zhipin)
- Criterion rubric: 0-20 anchors (above)
- Mandate context: LYC client brief (e.g., Codelco China needs state-owned + commodity + China-market)

### Output JSON (per criterion)

```json
{
  "criterion": "C1_tenure",
  "score": 14,
  "evidence": [
    { "claim": "VP Sales at Co. X 2018-2024", "source_url": "https://...", "confidence": 0.92 },
    { "claim": "Director at Co. Y 2014-2018",  "source_url": "https://...", "confidence": 0.88 }
  ],
  "reasoning": "16 years progressive sales leadership, last 6 at VP level in Fortune 500 industrial. Promotion velocity above peer median.",
  "red_flags": [],
  "override_flag": false,
  "tokens_in": 9842,
  "tokens_out": 187
}
```

### Model

- **Primary:** DeepSeek-V3 (`deepseek-chat`) via `python3 ./LYC_BOTS/deepseek_call.py` (per HARD RULE)
- **Fallback:** None in Phase 1 - fail loud if DeepSeek unavailable
- **Temperature:** 0.1 (low variance; we want consistent rubric application)
- **Per-call timeout:** 7s AbortController (matches existing `api/score.ts` pattern)

---

## Override Trail

Admins can override any LLM-generated score via UI. Every override writes to `org_audit_log`:

```json
{
  "event_type": "score_override",
  "actor_id": "<admin_uuid>",
  "target_individual_id": "<uuid>",
  "criterion": "C1_tenure",
  "llm_score": 14,
  "admin_score": 17,
  "reason": "Reviewer found additional 2 years at C-suite level not in LLM corpus (private board role, 2019-2021). Bumping to 17.",
  "created_at": "2026-06-11T16:00:00Z"
}
```

**Reason field is required (min 30 chars)** - prevents drive-by overrides.

UI surfaces the override trail next to each criterion score (small icon, click -> expand).

---

## Token Budget

| Per individual | Tokens | USD (DeepSeek-V3) |
|----------------|--------|-------------------|
| 5 LLM calls * 10K input avg | ~50K input | $0.0070 |
| 5 LLM calls * 200 output avg | ~1K output | $0.0003 |
| **Subtotal per individual** | **~51K** | **~$0.0073** |

| Phase 1 scope | Individuals | Total tokens | Total USD |
|---------------|-------------|--------------|-----------|
| 50 target companies * 5 priority individuals | 250 | ~12.75M | **~$1.83** |
| Full pool (50 * 50 individuals) | 2,500 | ~127.5M | ~$18.25 |

Phase 1 priority pool = **<$2.** Trivial cost.

---

## T4 Endpoint Design

### `POST /api/admin/org-intelligence/scoring/compute`

**Auth:** `verifyAdmin` (T2 helper).

**Request body:**
```json
{
  "individual_ids": ["uuid1", "uuid2", ...],
  "criteria": ["C1_tenure", "C2_network", "C3_performance", "C4_mobility", "C5_fit"],
  "force_recompute": false
}
```

`criteria` is optional; defaults to all 5. `force_recompute` overrides existing scores (admin-only).

**Response (200):**
```json
{
  "success": true,
  "scored": 5,
  "skipped": 0,
  "token_total": 254200,
  "cost_estimate_usd": 0.036,
  "composites": [
    { "individual_id": "uuid1", "composite": 78, "tier": "T2", "criteria": { "C1_tenure": 15, "C2_network": 14 } }
  ],
  "executed_by": "kevin.hong@lyc-partners.ai",
  "executed_at": "2026-06-11T16:30:00Z"
}
```

**Pseudocode:**
```
1. verifyAdmin
2. loadIndividuals(individual_ids) from org_talent_pools (LEFT JOIN org_evaluations to skip-if-fresh)
3. for each individual:
     for each criterion in [C1..C5]:
       corpus = buildCorpus(individual, sources)  // CV + LinkedIn + news + Chinese platforms
       result = await deepseekCall(criterionPrompt(criterion, corpus, rubric, mandate))
       score = clamp(result.json.score, 0, 20)
       insertOrUpdate(org_evaluation_scores, {individual_id, criterion, score, evidence, ...})
4. computeComposite per individual (weighted sum * 5)
5. return summary
```

**Performance:** 5 LLM calls * 7s timeout = 35s ceiling per individual. Vercel `maxDuration=60` covers 1 individual comfortably; for batch, parallelize with `Promise.all` (up to 5 concurrent).

**Rate limiting:** 100 individuals per request (10*10s ~ 100s if sequential; ~20s if 5-way parallel). Above 100 -> 400 with `batch_too_large`.

---

## Phase 1 Scope (T4 deliverable)

- 5 hard-coded criteria in `api/_lib/scoringCriteria.ts`
- 1 endpoint: `POST /api/admin/org-intelligence/scoring/compute`
- Override trail: write-only for admins (UI is T5)
- Composite formula: hard-coded
- Token budget: per-individual cap of 80K input
- Truncation strategy: keep top-K most recent sources + top-K by relevance (BM25 over corpus)

## Out of Scope (Phase 2+)

- Custom criteria (admin-defined)
- Mandate-specific weights (UI)
- A/B testing of criteria
- Cross-company pool ranking
- Auto-rescore on source update
- Caching/queue for batch operations
- Public-facing read API (analyst view)

---

## Open Questions for Kevin

1. **Are the 5 criteria the right 5?** (Tenure / Network / Performance / Mobility / Cultural Fit)
2. **Are the default weights right?** (0.25 / 0.20 / 0.25 / 0.15 / 0.15 - performance + tenure dominant)
3. **Tier boundaries?** (80/60/40 thresholds - same as TRIDENT, kept for consistency)
4. **Override reason min length?** (30 chars proposed)
5. **Per-call temperature?** (0.1 proposed - low variance for rubric application)

---

## Cross-References

- T1 SQL: `supabase/migrations/20260611_create_org_intelligence_tables.sql` (10 tables, `org_evaluation_scores` + `org_audit_log` already in place)
- T2 helper: `api/_lib/adminAuth.ts`
- T3 upload: `api/admin/org-intelligence/companies/upload.ts` (predecessor pattern)
- Existing scoring: `api/score.ts` + `src/services/tridentScoring.ts` (TRIDENT 3D, similar LLM-call pattern)
- Hard rule: `python3 ./LYC_BOTS/deepseek_call.py --model flash` (Coze LLM FORBIDDEN)
