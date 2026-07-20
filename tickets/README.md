# LYC Website — Consolidated Build Plan: Engineering Tickets

**For:** Trae (Software Engineer)
**From:** NEXUS (PM/Orchestrator) on behalf of Kevin Hong (CTO)
**Date:** 2026-07-20
**Status:** READY FOR BUILD — Nothing deployed, nothing on live site

---

## 🔴 CRITICAL RULES

1. **DO NOT deploy to production without explicit approval from Kevin**
2. **DO NOT change anything on the live website** — all work happens on a staging branch
3. All compute/AI features use **DeepSeek API only** — no Coze LLM for content generation
4. B2C courses are on `lyc-intelligence.app` — **out of scope** for this website

---

## Repo & Environment

| Item | Value |
|---|---|
| **Framework** | Next.js (TypeScript) + Vercel |
| **Staging branch** | `staging/build-plan` (create from `main`) |
| **Vercel Project** | `prj_usb8IjK6Sk2XqgbaRQNMXF2Mhz6C` |
| **Deploy policy** | Preview deploys only until Kevin approves production |
| **API compute** | DeepSeek API (see `./LYC_Consolidated_Build_Plan.md` for spec) |
| **Newsletter** | Resend (keep existing integration) |

---

## Scope Summary

| Metric | Count |
|---|---|
| **Phases** | 7 (Phase 0–6) |
| **Batches** | 17 |
| **Total tickets** | 45 |
| **New pages** | ~66 |
| **Edited pages** | ~10 |
| **Out of scope** | B2C courses (4 pages → `lyc-intelligence.app`) |

---

## Key Design Decisions (Locked by Kevin)

| # | Decision | Resolution |
|---|---|---|
| 1 | Navbar naming | Keep "Network" — no rename |
| 2 | Webinar URL | `/webinars/[slug]` |
| 3 | Diagnostic gating | Gated full report — free archetype teaser → email gate → full report |
| 4 | B2C platform | `lyc-intelligence.app` — separate subdomain, NOT in scope |
| 5 | Archetype visuals | Unique icon per archetype + color per instrument |
| 6 | Newsletter | Keep Resend — add archetype segmentation tags |
| 7 | Roundtable payment | Separate payment flow — independent from webinar registration |

---

## How to Use These Tickets

1. Read `INDEX.md` first — it has the dependency graph and build order
2. Each `PHASE-X-OVERVIEW.md` has context and batch grouping
3. Each `T-X-YY-*.md` is a self-contained ticket with:
   - What to build
   - Acceptance criteria
   - CD document references (in `../cd_docs/` directory)
   - Dependencies on other tickets
4. Work strictly in phase order — each phase depends on the previous

---

## Reference Documents

| File | What it contains |
|---|---|
| `../LYC_Consolidated_Build_Plan.md` | Master build plan with all route mappings |
| `../cd_docs/` | 24 CD documents with full requirements |
| `../LYC_Website_Asset_Reconciliation.xlsx` | 68 Notion assets → route mapping |

---

## Questions?

Contact NEXUS (PM) via Feishu. Do not make design decisions autonomously — flag them for Kevin.
