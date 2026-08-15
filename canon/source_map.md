# Diagnostic Canon — Source Map & Provenance

**Authority:** Akira — Diagnostic Content Integrity Lead
**Canon Version:** 1.0
**Date:** 2026-08-15

---

## Purpose

This document traces every canonical value in the diagnostic canon package to its original approved source. No value in the canon is invented — every dimension name, archetype label, and descriptor traces back to an approved artifact.

When questions arise about "where did this value come from," this is the reference.

---

## Source Hierarchy

1. **Akira Canon Package** (this folder) — compiled, authoritative, final
2. **Kevin-approved product specs** (Notion + one-pagers) — product-level sign-off
3. **Scoring engine source code** (config JSONs + Python engines) — authoritative for scoring mechanics and question counts
4. **Question bank exports** (Notion QB JSONs) — authoritative for question content
5. **Report templates and UI copy** — should align to canon, often drifted

---

## Per-Instrument Provenance

### CPI — China Leadership Pipeline Index

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 6 dimensions | Scoring engine v2.0 | `cpi_scoring_engine_v2.py` → DIMENSION_WEIGHTS | ✅ Verified |
| Dimension weights (25/20/15/15/15/10) | Scoring engine v2.0 | Same file | ✅ Verified |
| 6 archetypes (A1-A6) | Scoring engine v2.0 | Same file → ARCHETYPES constant | ✅ Verified |
| Balanced Profile fallback | Scoring engine v2.0 | Same file → A0 entry | ✅ Verified |
| Tier 1-4 bands | Scoring engine v2.0 | Same file → TIER_BANDS | ✅ Verified |
| 8 industry benchmarks | Scoring engine v2.0 | Same file → INDUSTRY_BENCHMARKS | ✅ Verified |
| 12Q Lite / 36Q Full dual-tier | Scoring engine v2.0 | Same file → QUESTION_BANK with is_lite flags | ✅ Verified |
| Dimension name: Talent Representation | Canon alignment | Was "Representation at Top" in engine — realigned to match product spec language | ⚠️ Realigned |
| Dimension name: Development Investment | Canon alignment | Was "Development Velocity" in engine — "investment" matches CPI's measurement focus (level of investment, not speed) | ⚠️ Realigned |
| Dimension name: External Hiring Capability | Canon alignment | Was "External Hiring Ratio" in engine — "capability" is broader and more accurate for the dimension's multi-question scope | ⚠️ Realigned |
| Descriptor: "China Leadership Pipeline Index" | Product spec + naming canon | Full approved product name | ✅ Approved |

---

### PRISM — professional branding

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 5 dimensions | Config + Notion QB | `prism_config.json` + `PRISM_QB_notion.json` | ✅ Both match |
| Dimension names | Config | `prism_config.json` → dimensions array | ✅ Verified |
| 6 questions per dimension = 30 total | Notion QB | `PRISM_QB_notion.json` → dimensions[].questions | ✅ Verified |
| 10 real archetypes | Config analysis | `prism_config.json` → archetypes array (12 entries, 2 are axes) | ⚠️ Corrected count |
| Axis 1 / Axis 2 = grid axes | Structural analysis | Not archetypes — they define the 2D positioning grid | ⚠️ Reclassified |
| Descriptor: "professional branding" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Professional Brand Legibility" | Drifted source | Full name in config was wrong — "legibility" is one dimension, not the whole product | ❌ Drift found |
| Archetype names | Config | `prism_config.json` → archetypes[].name (first 10) | ✅ Verified (10 of 12) |
| 2×2 → 3×3 grid expansion | Archetype analysis | 9 archetypes fit a 3×3 grid + 1 below-grid = 10 total | 🔍 Inferred |

---

### IMPACT — board & stakeholder impact

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 5 dimensions | Config + Notion QB | `impact_config.json` + `IMPACT_QB_notion.json` | ✅ Both match |
| 6 questions per dimension = 30 total | Notion QB | `IMPACT_QB_notion.json` → dimensions[].questions | ✅ Verified |
| 8 real archetypes | Config analysis | `impact_config.json` → archetypes array (10 entries, 2 are axes) | ⚠️ Corrected count |
| Axis 1 / Axis 2 = grid axes | Structural analysis | Same pattern as PRISM — matrix axes, not archetypes | ⚠️ Reclassified |
| Descriptor: "board & stakeholder impact" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Board Effectiveness Assessment" | Drifted source | Too narrow — IMPACT covers stakeholder intelligence and mandate legacy too | ❌ Drift found |
| Archetype: The Steward | Config | `impact_config.json` | ✅ Verified |
| Archetype: The Networker | Config | Same | ✅ Verified |
| Archetype: The Guardian | Config | Same | ✅ Verified |
| Archetype: The Visionary | Config | Same | ✅ Verified |
| Archetype: The Bridge-Builder | Config | Same | ✅ Verified |
| Archetype: The Nominee | Config | Same | ✅ Verified |
| Archetype: The Passenger | Config | Same | ✅ Verified |
| Archetype: "The Architect" → "The Strategic Builder" | Banned word fix | "Architect" is banned; "Strategic Builder" captures the same meaning cleanly | ⚠️ Renamed |
| Dimension: "APAC Mandate Credibility" → "Executive Presence & Influence" | Pillar alignment fix | "APAC Mandate" is BRIDGE territory; dimension is actually about executive influence capability | ⚠️ Renamed |

---

### FORGE — sales excellence capability

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 4 dimensions | Config + Notion QB | `forge_config.json` + `FORGE_QB_notion.json` | ✅ Both match |
| 9 questions per dimension = 36 total | Notion QB | `FORGE_QB_notion.json` → dimensions[].questions | ✅ Verified |
| 4 archetypes | Config | `forge_config.json` → archetypes array | ✅ Verified |
| Descriptor: "sales excellence capability" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Sales Excellence & Revenue Architecture" | Drifted source | Added "Revenue Architecture" — banned word + scope creep | ❌ Drift found |
| D1: "ADAPTIVE LEARNING ORIENTATION (ALO)" → "Adaptive Learning Orientation" | Format fix | All-caps to Title Case for consistency across portfolio | ⚠️ Reformatted |
| D2: "THREE FORCES AWARENESS (TFA)" → "Market Context Awareness" | Banned framework leak | "Three Forces" derived from banned "Three Fires" terminology; actual construct is market/situational awareness | ❌🚨 Leak found, fixed |
| D3: "DEVELOPMENT AGENCY (DA)" → "Development Agency" | Format fix | All-caps to Title Case | ⚠️ Reformatted |
| D4: "BILATERAL CONTEXT NAVIGATION (BCN)" → "Bilateral Relationship Quality" | Banned word + clarity | "Navigation" banned; actual construct is relationship quality, not "navigation" | ❌ Drift found, fixed |
| Archetype: "Revenue Architect" → "Strategic Seller" | Banned word fix | "Architect" banned; "Strategic Seller" better describes the market-savvy relationship builder profile | ⚠️ Renamed |
| Archetype: Rainmaker | Config | `forge_config.json` | ✅ Verified |
| Archetype: System Builder | Config | Same | ✅ Verified |
| Archetype: Promoted Seller | Config | Same | ✅ Verified |

---

### BRIDGE — cross-cultural relational intelligence

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 6 dimensions | Config + Notion QB | `bridge_config.json` + `BRIDGE_QB_notion.json` | ✅ Both match |
| 6 questions per dimension = 36 total | Notion QB | `BRIDGE_QB_notion.json` → dimensions[].questions | ✅ Verified |
| 6 archetypes | Config | `bridge_config.json` → archetypes array | ✅ Verified |
| Descriptor: "cross-cultural relational intelligence" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "APAC Mandate Execution & Cross-Border Leadership Readiness" | Drifted source | Complete repositioning — not the product at all | ❌ Drift found |
| Dimension: "Stakeholder Navigation" → "Stakeholder Alignment" | Banned word fix | "Navigation" banned | ⚠️ Pending rename |
| Archetype: "The Navigator" → rename needed | Banned word fix | "Navigator" banned | ⚠️ Pending rename |
| Archetype names | Config | `bridge_config.json` → archetypes[].name | ✅ Verified (minus Navigator fix) |

---

### SPARK — AI leadership readiness

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 3 dimensions | Config + Notion QB | `spark_config.json` + `SPARK_QB_notion.json` | ✅ Both match |
| 9 questions per dimension = 27 total | Notion QB | `SPARK_QB_notion.json` → dimensions[].questions | ✅ Verified |
| 4 archetypes | Config | `spark_config.json` → archetypes array | ✅ Verified |
| Descriptor: "AI leadership readiness" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "AI Leadership Readiness & Enterprise Governance" | Drifted source | Added "Enterprise Governance" — not part of the product | ❌ Drift found |
| Dimension naming style | Config | All caps with acronyms (IAAR, CEA, OP) | ⚠️ Inconsistent with portfolio |
| Archetype names | Config | AI Champion, Skeptical Director, Governance Bureaucrat, Disengaged Director | ✅ Verified |

---

### MOSAIC — institutional trust & relationship velocity

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 4 dimensions | Config + Notion QB | `mosaic_config.json` + `MOSAIC_QB_notion.json` | ✅ Both match |
| Uneven question distribution (8+7+5+5 = 25) | Notion QB | `MOSAIC_QB_notion.json` → dimensions[].questions | ✅ Verified (uneven) |
| 6 archetypes | Config | `mosaic_config.json` → archetypes array | ✅ Verified |
| Archetypes in Notion QB: 0 | Notion QB gap | `MOSAIC_QB_notion.json` → archetypes: [] | ❌ Data gap |
| Descriptor: "institutional trust & relationship velocity" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Cross-Border Partnership Intelligence & Institutional Navigation" | Drifted source | Complete repositioning + banned word | ❌ Drift found |
| Banned word: "Navigation" in full name | Drift | "Institutional Navigation" | ❌ Banned word |
| Dimension naming style | Config | All caps (no acronyms) | ⚠️ Inconsistent |

---

### DRIVE — motivational alignment

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 5 dimensions | Config v2 + QB v2 | `drive_v2_config.json` + `DRIVE_Questions_v2.json` | ✅ Both match |
| 10 profiles (archetypes) | Config v2 | `drive_v2_config.json` → archetypes array | ✅ Verified |
| 36 questions total | QB v2 | `DRIVE_Questions_v2.json` → total_questions | ✅ Verified |
| Descriptor: "motivational alignment" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Motivation Architecture & Engagement Risk Assessment" | Drifted source | Banned word + scope creep | ❌ Drift found |
| "v2" in filenames | Naming rule violation | `drive_v2_config.json`, `DRIVE_Questions_v2.json` | ❌ Rule violation |
| DRIVE naming rule: no version suffix | Memory / canon | Approved naming standard | ✅ Approved |

---

### QUEST — strategic market positioning

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 6 dimensions | Config + Notion QB (skeleton) | `quest_config.json` + `QUEST_QB_notion.json` | ✅ Config matches |
| 36 questions total | Config | `quest_config.json` → total_questions | ✅ Config only |
| Notion QB: 0 questions per dimension | Notion QB gap | Skeleton only — no question content exported | ❌ Data gap |
| 10 archetypes | Config | `quest_config.json` → archetypes array | ✅ Verified |
| Descriptor: "strategic market positioning" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Executive Performance Architecture" | Drifted source | Complete repositioning + banned word | ❌ Drift found |
| D6: "AI Readiness" | Config | QUEST has an AI dimension that feeds P4 | ✅ Verified (cross-pillar) |
| Archetype: "The Architect" → rename needed | Banned word | "Architect" banned | ⚠️ Pending rename |

---

### LEAP — competitive positioning

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 5 dimensions | Config + Notion QB (skeleton) | `leap_config.json` + `LEAP_QB_notion.json` | ✅ Config matches |
| 30 questions total | Config | `leap_config.json` → total_questions | ✅ Config only |
| Notion QB: 0 questions per dimension | Notion QB gap | Skeleton only | ❌ Data gap |
| 17 archetypes in config | Config | `leap_config.json` → archetypes array | ⚠️ Contains errors |
| Valid archetypes: 15 | Config audit | 1 duplicate ("Architect" + "Architect (Strategic)") + 1 placeholder ("LEAP Instrument") | ❌ Data error |
| "Architect" banned word | LEAP archetypes | Appears twice (regular + Strategic variant) | ❌ Banned word |
| Descriptor: "competitive positioning" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Leadership Archetype & APAC Translation" | Drifted source | Complete repositioning | ❌ Drift found |
| LEAP v2 separate config | Two configs | `leap_config.json` + `leap2_config.json` | ⚠️ Version confusion |

---

### COACH — executive coaching fit

| Canonical Value | Source | File | Verification Status |
|---|---|---|---|
| 4 dimensions | Config + Notion QB | `coach_config.json` + `COACH_QB_notion.json` | ✅ Both match |
| 6 questions per dimension = 24 total | Notion QB | `COACH_QB_notion.json` → dimensions[].questions | ✅ Verified |
| 5 archetypes (config) / 0 (Notion QB) | Config vs QB gap | Config has 5, Notion export has 0 | ❌ Data gap |
| Descriptor: "executive coaching fit" | Product spec + naming canon | Approved canonical descriptor | ✅ Approved |
| Was: "Bilateral Coaching Readiness & Leadership Development Architecture" | Drifted source | Banned word + scope creep + internal jargon | ❌ Drift found |
| "Bilateral" terminology | All 4 dimensions + archetype | Internal framework language — "bilateral" is jargon | ⚠️ Needs simplification |
| Dimension naming style | Config | All caps with acronyms (CBDO, ACS, BDRQ, CBC) | ⚠️ Inconsistent |

---

## 4-Pillar Framework v1.4 Provenance

| Pillar | Flagship | Related Assessments | Source |
|---|---|---|---|
| P1 Talent Pipeline Health | CPI | COACH, LEAP, QUEST | 4-Pillar v1.4 official locked + Flywheel Sprint decisions |
| P2 Cross-Border Leadership Effectiveness | BRIDGE | DRIVE, MOSAIC | 4-Pillar v1.4 official locked |
| P3 Strategic & Organizational Impact | IMPACT | PRISM, QUEST | 4-Pillar v1.4 official locked (MOSAIC moved P3→P2, IMPACT became P3 flagship) |
| P4 AI-Augmented Leadership | SPARK | FORGE (+ QUEST D6) | 4-Pillar v1.4 official locked |

Source document: `diagnostic_portfolio/01_framework_architecture/4_Pillar_Framework_v1.4.md`
Authority: Kevin Hong, approved during Flywheel Sprint (2026-08-11)

---

## Naming Standard Provenance

- **Standard format:** `NAME — short outcome descriptor` (em-dash)
- **Source:** Messaging & Positioning Canon v1.0 (ECHO, 2026-08-14)
- **Authority:** ECHO = primary executor for messaging; Akira = primary executor for diagnostic naming accuracy
- **Approval:** Phase 0 Foundation Lock confirmed by both ECHO and Akira (2026-08-14)

---

## Drift Root Cause Analysis

**Where drift originates:**
1. **Full_name field in config JSONs** — content team wrote elaborate "official full names" instead of canonical descriptors
2. **Internal framework language** — concepts like "Three Forces" and "Bilateral" leaked from strategy docs into product definitions
3. **"Architecture" suffix addiction** — 8 instances across the portfolio where someone appended "Architecture" to sound impressive
4. **Notion → JSON export gaps** — 4 assessments have incomplete or empty Notion QB exports, creating data integrity issues
5. **Axis entries misclassified as archetypes** — PRISM and IMPACT include matrix axes in archetype arrays

**Fix priority:**
1. Fix all 11 full_name fields in engine configs (single source, downstream fixes cascade)
2. Remove banned words and internal framework language from dimensions/archetypes
3. Separate axes from archetypes in config structures
4. Complete Notion QB exports for incomplete assessments
5. Standardize dimension naming conventions across portfolio
