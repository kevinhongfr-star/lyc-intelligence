# Ticket Index — Master Build Order

**41 tickets | 7 phases | 17 batches | Strict dependency order**

---

## Dependency Graph

```
Phase 0: Data Architecture (3 tickets)
    │
    ▼
Phase 1: Archetype Foundation (13 tickets)
    ├── Batch 1A: Design System (prerequisite — icons/colors before any page)
    ├── Batch 1B: Existing page edits (4 tickets)
    ├── Batch 1C: New diagnostic pages (7 tickets)
    └── Batch 1D: Result page template (1 ticket)
    │
    ├────────────────────┬────────────────────┐
    ▼                    ▼                    ▼
Phase 2:             Phase 5:             Design System
Webinar Engine       Programmes &         (if not done
(9 tickets)          Workshops            in Phase 1)
                     (10 tickets)
    │
    ├────────────┬────────────┐
    ▼            ▼            ▼
Phase 3      Phase 4      Phase 6
Content      Premium      Global
Cascade      Products     Integration
(4 tickets)  (5 tickets)  (4 tickets)
```

---

## Phase Summary

| Phase | Title | Batches | Tickets | Est. Effort | Depends On |
|---|---|---|---|---|---|
| 0 | Data Architecture | 1 | 3 | 2 days | None |
| 1 | Archetype Foundation | 4 | 13 | 5 days | Phase 0 |
| 2 | Webinar Engine | 2 | 9 | 7 days | Phase 1 |
| 3 | Content Cascade | 2 | 4 | 3 days | Phase 2 |
| 4 | Premium Products | 2 | 5 | 3 days | Phase 2 |
| 5 | Programmes & Workshops | 3 | 10 | 5 days | Phase 1 + Phase 2 |
| 6 | Global Integration | 2 | 4 | 5 days | All above |
| **TOTAL** | | **15** | **41** | **~30 days** | |

---

## Complete Ticket List

### Phase 0: Data Architecture

| ID | Title | Batch | File |
|---|---|---|---|
| T-001 | Assessment Result API Schema & Endpoints | 0A | `phase-0/T-001-assessment-api-schema.md` |
| T-002 | Deterministic Classification Engine | 0A | `phase-0/T-002-classification-engine.md` |
| T-003 | Modifier System | 0A | `phase-0/T-003-modifier-system.md` |

### Phase 1: Archetype Foundation

| ID | Title | Batch | File |
|---|---|---|---|
| T-101 | Design System: 9 Instrument Colors + 62 Archetype Icons + Components | 1A | `phase-1/T-101-design-system.md` |
| T-102 | Edit `/assess/bridge` — Add BRIDGE Archetypes | 1B | `phase-1/T-102-edit-bridge.md` |
| T-103 | Edit `/assess/spark` — Add SPARK Archetypes | 1B | `phase-1/T-103-edit-spark.md` |
| T-104 | Edit `/platform` — Add 62-Archetype Overview | 1B | `phase-1/T-104-edit-platform.md` |
| T-105 | Edit `/advisory` — Archetype Service Descriptions | 1B | `phase-1/T-105-edit-advisory.md` |
| T-106 | New `/assess/quest` — QUEST Diagnostic Page | 1C | `phase-1/T-106-new-quest.md` |
| T-107 | New `/assess/drive` — DRIVE Diagnostic Page | 1C | `phase-1/T-107-new-drive.md` |
| T-108 | New `/assess/impact` — IMPACT Diagnostic Page | 1C | `phase-1/T-108-new-impact.md` |
| T-109 | New `/assess/prism` — PRISM Diagnostic Page | 1C | `phase-1/T-109-new-prism.md` |
| T-110 | New `/assess/mosaic` — MOSAIC Diagnostic Page | 1C | `phase-1/T-110-new-mosaic.md` |
| T-111 | New `/assess/forge` — FORGE Diagnostic Page | 1C | `phase-1/T-111-new-forge.md` |
| T-112 | New `/assess/shift` — SHIFT Composite Page | 1C | `phase-1/T-112-new-shift.md` |
| T-113 | Gated Archetype Result Page Template | 1D | `phase-1/T-113-result-page-template.md` |

### Phase 2: Webinar Engine

| ID | Title | Batch | File |
|---|---|---|---|
| T-201 | `/webinars` — Calendar Hub Page | 2A | `phase-2/T-201-webinar-hub.md` |
| T-202 | `/webinars/[slug]` — 24 Individual Webinar Pages (Template) | 2A | `phase-2/T-202-webinar-pages.md` |
| T-203 | `/webinars/[slug]/register` — Registration Flow | 2A | `phase-2/T-203-registration-flow.md` |
| T-204 | Webinar Data Model & Seed Content (24 entries) | 2B | `phase-2/T-204-webinar-data.md` |

### Phase 3: Content Cascade

| ID | Title | Batch | File |
|---|---|---|---|
| T-301 | Edit `/insights` — Add Standing Sections | 3A | `phase-3/T-301-edit-insights.md` |
| T-302 | New `/insights/newsletter` — Newsletter Hub | 3A | `phase-3/T-302-newsletter-hub.md` |
| T-303 | New `/insights/podcast` — Podcast Hub | 3B | `phase-3/T-303-podcast-hub.md` |
| T-304 | New `/insights/brief` — Quarterly Brief (Gated) | 3B | `phase-3/T-304-quarterly-brief.md` |

### Phase 4: Premium Products

| ID | Title | Batch | File |
|---|---|---|---|
| T-401 | New `/council` — Invitation Council Page | 4A | `phase-4/T-401-council-page.md` |
| T-402 | New `/roundtable` — Roundtable + Payment Flow | 4A | `phase-4/T-402-roundtable-payment.md` |
| T-403 | Edit `/network` — Reframe as Council + Roundtable Hub | 4B | `phase-4/T-403-edit-network.md` |

### Phase 5: Programmes & Workshops

| ID | Title | Batch | File |
|---|---|---|---|
| T-501 | New `/programmes/advisory` | 5A | `phase-5/T-501-programme-advisory.md` |
| T-502 | New `/programmes/governance` | 5A | `phase-5/T-502-programme-governance.md` |
| T-503 | New `/programmes/cross-border` | 5A | `phase-5/T-503-programme-cross-border.md` |
| T-504 | New `/programmes/ai-leadership` | 5A | `phase-5/T-504-programme-ai-leadership.md` |
| T-505 | New `/programmes/coaching` | 5A | `phase-5/T-505-programme-coaching.md` |
| T-506 | New `/workshops/force-1-discovery` | 5B | `phase-5/T-506-workshop-discovery.md` |
| T-507 | New `/workshops/team-cohesion` | 5B | `phase-5/T-507-workshop-cohesion.md` |
| T-508 | New `/workshops/career-resilience` | 5B | `phase-5/T-508-workshop-resilience.md` |
| T-509 | New `/workshops/revenue-leadership` | 5B | `phase-5/T-509-workshop-revenue.md` |
| T-510 | New `/workshops/shift-facilitation` | 5B | `phase-5/T-510-workshop-shift.md` |

### Phase 6: Global Integration

| ID | Title | Batch | File |
|---|---|---|---|
| T-601 | Universal Soft CTA Block Component | 6A | `phase-6/T-601-soft-cta-block.md` |
| T-602 | Footer Update | 6A | `phase-6/T-602-footer-update.md` |
| T-603 | Homepage Enhancement — Archetype CTA + Webinar Widget | 6B | `phase-6/T-603-homepage-enhancement.md` |
| T-604 | Global Newsletter Signup (Resend) | 6B | `phase-6/T-604-newsletter-global.md` |

---

## Recommended Build Cadence

| Week | Target | Phases |
|---|---|---|
| Week 1 | Phase 0 + Phase 1 Batch 1A (design system) | 0, 1A |
| Week 2 | Phase 1 Batches 1B-1D (all diagnostic pages) | 1B-1D |
| Week 3 | Phase 2 (webinar engine) | 2 |
| Week 4 | Phase 3 + Phase 4 | 3, 4 |
| Week 5 | Phase 5 + Phase 6 | 5, 6 |
| Week 6 | QA, integration testing, staging review | — |
