# T-112: New `/assess/shift` — SHIFT Composite Diagnostic

**Phase:** 1 | **Batch:** 1C | **Effort:** 0.5 day
**CD Source:** CD12 (SHIFT Programme/Workshop), CD10
**Depends On:** T-101, T-001, and ideally at least one of T-106 to T-111 (to understand composite logic)
**Blocks:** None

---

## What to Build

New page at `/assess/shift` — the SHIFT Composite diagnostic. This is NOT a standalone instrument — it aggregates results from multiple instruments into a composite leadership profile.

## SHIFT Composite

SHIFT = composite view across instruments. It doesn't have its own archetypes in the same way — it shows a cross-instrument leadership picture.

## Page Structure

1. **Hero:** SHIFT title + "Your Integrated Leadership Profile"
2. **About Section:** What SHIFT measures (composite of multiple dimensions)
3. **Composite Assessment:** If user has taken multiple diagnostics, show aggregated view. If not, prompt to take individual diagnostics first.
4. **Composite Result:** Multi-radar chart overlaying multiple instrument results
5. **Track Alignment:** Show which SHIFT Programme Track aligns with the composite:
   - Track 1 (Force 1 Discovery) → Governance
   - Track 2 (Force 2 Development) → Cross-Border
   - Track 3 (Force 3 Development) → AI Leadership
6. **Related Products:** SHIFT workshops, programmes, webinars

## Special Notes

- SHIFT is the most complex page — it requires data from multiple assessments
- If user has only taken one diagnostic, show that result with a prompt to take more
- If user has taken multiple, show the composite overlay
- This page is the bridge to SHIFT programmes (Phase 5)

## Acceptance Criteria

- [ ] Page renders at `/assess/shift`
- [ ] Composite view works with 1+ instrument results
- [ ] Multi-radar chart overlays correctly
- [ ] Track alignment recommendation works
- [ ] Links to SHIFT programmes and workshops
- [ ] Mobile responsive (multi-radar chart needs to work on mobile)
