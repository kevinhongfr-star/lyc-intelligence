# Agent Supabase Impact Briefs

**Version:** 1.0 | **Date:** 2026-08-05
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`
**Source:** Supabase Data Architecture & Impact Map v1.0

---

## Overview

Each agent's impact brief covers:
1. **Executive Summary** — what's changing and why it matters
2. **Table Mapping** — which tables the agent uses, current vs. new architecture
3. **Workflow Changes** — specific workflows that need adjustment
4. **Phase Dependencies** — which build phases affect this agent, and how
5. **Critical Risks** — severity + mitigation
6. **Action Items** — prioritized list of changes needed
7. **Key Tables to Monitor** — the most important tables for this agent

---

## All 10 Agent Impact Briefs

| # | Agent | Role | High-Impact Phase |
|---|-------|------|-------------------|
| 1 | [SWEEP](01_SWEEP_Impact_Brief.md) | Sourcing & Pipeline Administration | Phase 09 — AI matching |
| 2 | [PROBE](02_PROBE_Impact_Brief.md) | Pipeline Visibility & Dashboards | Phase 04 — Portal dashboards |
| 3 | [LENS](03_LENS_Impact_Brief.md) | Research & Intelligence | Phase 07 — Report Engine |
| 4 | [MARIA](04_MARIA_Impact_Brief.md) | Outreach & Engagement | Phase 09 — Outreach automation |
| 5 | [ALESSIO](05_ALESSIO_Impact_Brief.md) | Search Ops & Project Management | Phase 04 — Internal Portal |
| 6 | [DEX AI](06_DEX_AI_Impact_Brief.md) | Assessment Platform | Phase 06 — B2C Portal go-live |
| 7 | [JAMES](07_JAMES_Impact_Brief.md) | Frontend & Portal Engineering | Phase 03+04 — Design System + Portal |
| 8 | [CARL](08_CARL_Impact_Brief.md) | BD & Marketing Operations | Phase 01+09 — Auth + AI BD |
| 9 | [AKIRA](09_AKIRA_Impact_Brief.md) | Training & Workshops | Phase 05+06 — Workshop portals |
| 10 | [VALENTINA](10_VALENTINA_Impact_Brief.md) | Business Intelligence | Phase 04+07 — BI + Report Engine |

---

## Reference Documents

- **Supabase Data Architecture & Impact Map** — master reference (400 tables, 378 FKs, 830 RLS policies)
- **10-Phase Build Plan** — `../build-plan/` (Phase 01–10 × 5 sprints × 25 tickets each)
- **Backend Architecture Spec** — `../specs/v2/02_Supabase_Backend_Architecture.md`

---

## Security Note

All briefs assume Phase 01 will:
- Revoke all public RLS policies on `contacts`, `vista_contacts`, `mandates`, `candidates_pipeline`
- Fix broken views (`v_mandate_scores`, `v_mandate_pipeline`)
- Add RLS policies for 20+ tables currently locked out
- Implement user type taxonomy in the database

**No agent should build new features on broken views or public access patterns.**
