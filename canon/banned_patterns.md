# Banned Patterns — Diagnostic Canon

**Authority:** Akira — Diagnostic Content Integrity Lead
**Scope:** All diagnostic instruments, engine configs, UI strings, report templates, marketing copy, and customer-facing surfaces

---

## Level 1 — Hard Banned Words (Never Use)

These words are forbidden in all customer-facing surfaces and product definitions.

| Banned Word | Why Banned | Acceptable Alternatives |
|---|---|---|
| architecture / architect | Messaging Canon v1.0 + ECHO v6 banned list | structure, system, design, builder, strategist, planner |
| framework | ECHO v6 banned list | model, approach, method, system, structure |
| platform | ECHO v6 banned list | tool, assessment, diagnostic, product |
| navigate / navigation / navigator | Messaging Canon v1.0 banned list | understand, map, work with, relationship builder, guide |
| fire / burn / ignite / flame | Messaging Canon v1.0 banned list | drive, build, develop, grow, accelerate |
| leverage | ECHO v6 banned list | use, apply, draw on, build from |
| landscape | ECHO v6 banned list | context, environment, market setting |
| disrupt / disruption | ECHO v6 banned list | transform, reshape, change, evolve |
| calibrated / calibration | ECHO v6 banned list | aligned, tailored, adapted |
| flywheel | ECHO v6 banned list | momentum, cycle, system, progression |
| 3-layer / Layer 1/2/3 | ECHO v6 banned list (internal framework leak) | tier, level, stage (if truly needed; avoid when possible) |
| maturity stack | ECHO v6 banned list | development path, growth trajectory |
| stages | ECHO v6 banned list | phases, progression, journey |
| signals | ECHO v6 banned list | indicators, markers, patterns |
| entry point | Messaging Canon v1.0 banned list | starting point, introduction, first step |
| funnel | ECHO v6 banned list | path, journey, progression |
| endorsed brand | ECHO v6 banned list | approved, validated, recognized |
| taxonomy rule | ECHO v6 banned list | naming standard, naming convention |
| anti-positioning | ECHO v6 banned list | differentiation, distinct position |
| benchmark | ECHO v6 banned list (USE WITH CAUTION) | reference point, comparison data, industry standard |
| quiet | Messaging Canon v1.0 banned list | understated, thoughtful, measured |
| war / force | Messaging Canon v1.0 banned list | effort, focus, drive, energy |
| hunt / hunting | Messaging Canon v1.0 banned list | search, identify, find, pursue |
| free | ECHO v6 banned list | complimentary, at no cost, included |

**Note on "benchmark":** CPI legitimately uses benchmark data. In CPI-specific technical and report contexts, "benchmark" is acceptable as a technical term for the comparison dataset. It should NOT appear in marketing headlines, product names, or general descriptions. Verify with ECHO on marketing copy usage.

---

## Level 2 — Banned Framework Leaks (Internal Concepts That Must Not Appear in Products)

These are internal strategic frameworks that leaked into product definitions. They belong in internal strategy docs, NOT in customer-facing diagnostic products.

| Leaked Concept | Where It Leaked | What It Should Be |
|---|---|---|
| Three Fires / Three Forces | FORGE D2: "THREE FORCES AWARENESS (TFA)" | Market Context Awareness (the actual construct being measured) |
| Three Layers of Mandate Risk | BRIDGE (was fixed in v2.0) | N/A — already corrected |
| Internal pillar structure | Various — "Architecture" used as product descriptor | Customer-facing value descriptions |
| "Bilateral" terminology | COACH — "Bilateral Coaching Readiness", "Bilateral Developmental Relationship Quality" | Simplify to customer language: "Coaching Fit", "Developmental Relationship Quality" |
| "APAC Mandate" | IMPACT D5: "APAC Mandate Credibility" | Executive Presence & Influence (the general construct, not APAC-specific) |
| "Engagement Risk" | DRIVE — added as separate feature | DRIVE is motivational alignment; engagement risk is a derivative metric, not a product name |

**Rule:** If a concept requires an internal glossary to explain, it shouldn't be in a customer-facing assessment name or dimension label.

---

## Level 3 — Structural Patterns That Are Not Archetypes

These are structural/modeling elements that were incorrectly counted as archetypes in the source code.

| Pattern | Where | Correct Classification |
|---|---|---|
| Axis 1 / Axis 2 | PRISM, IMPACT config JSONs | Matrix positioning axes (grid lines), not person archetypes |
| "LEAP Instrument" | LEAP config JSON | Clearly a data entry error — the instrument name, not an archetype |
| "Architect (Strategic)" | LEAP config JSON | Duplicate of "Architect" archetype with parenthetical modifier |

**Rule:** An archetype must be:
1. A person/personality type (not a structural element)
2. Unique (no duplicates with modifiers)
3. Distinct from the instrument name itself

---

## Level 4 — Naming Format Violations

### 4.1 Assessment Name Format

**Required format:** `ASSESSMENT_NAME — short outcome descriptor`
- Use em-dash (—), not hyphen (-)
- Descriptor is lowercase (except proper nouns)
- Descriptor describes the OUTCOME, not the method
- Never add "Architecture", "Framework", "System" to the descriptor

**Wrong → Correct:**
- "Executive Performance Architecture" → "strategic market positioning"
- "AI Leadership Readiness & Enterprise Governance" → "AI leadership readiness"
- "Sales Excellence & Revenue Architecture" → "sales excellence capability"
- "Motivation Architecture & Engagement Risk Assessment" → "motivational alignment"
- "Board Effectiveness Assessment" → "board & stakeholder impact"

### 4.2 Version Suffix Rules

- **DRIVE:** No "v2" suffix. Ever. The product is DRIVE.
- All other assessments: version numbers only in internal engineering files, never in customer-facing names
- If a major revision happens, it gets a new descriptor, not a version number

### 4.3 Dimension Naming Conventions

All dimensions across the portfolio should follow:
- Title Case (not ALL CAPS)
- Descriptive name first, abbreviation optional in parentheses
- No internal jargon or acronym soup
- Customer-understandable without a glossary

---

## Level 5 — Pillar Alignment Rules

1. **Each assessment has ONE primary pillar.** Cross-pillar relevance is noted but secondary.
2. **CPI is P1 flagship.** No other assessment claims flagship of P1.
3. **BRIDGE is P2 flagship.** MOSAIC and DRIVE are P2 related, not flagship.
4. **IMPACT is P3 flagship.** PRISM and QUEST are P3 related.
5. **SPARK is P4 flagship.** FORGE is P4 related.
6. **QUEST spans P1 and P3 and P4** — primary is P3, with secondary relevance to P1 (talent pipeline) and P4 (AI readiness dimension).
7. **Pillar mapping is product strategy, not scoring math.** Don't let pillar assignments change dimension weights or scoring logic.

---

## Level 6 — Content Drift Patterns to Watch For

These are recurring patterns found in the drift audit. Watch for them in all new content:

1. **"Official Full Name" fabrication** — content teams inventing elaborate "full names" for assessments. There is no "full name" — there is only the NAME — descriptor format.
2. **Descriptor inflation** — adding extra concepts to the descriptor that aren't part of the product (e.g., SPARK + "Enterprise Governance").
3. **Architecture suffix** — appending "Architecture" to everything because it sounds impressive.
4. **Internal framework language** — leaking internal strategic concepts (Three Forces, Bilateral, etc.) into customer-facing content.
5. **Repositioning drift** — completely changing what the product is about (e.g., QUEST from "strategic market positioning" to "Executive Performance Architecture").

---

## Level 7 — Source of Truth Priority

When sources disagree, this is the priority order (higher = more authoritative):

1. **Akira Diagnostic Canon** (this canon package) — final authority
2. **Approved product specifications** (one-pagers, product specs signed off by Kevin)
3. **Scoring engine code** (config JSONs + engine logic) — authoritative for scoring mechanics, NOT for naming
4. **Report templates and UI copy** — should align to canon, often drift
5. **Marketing and sales materials** — most likely to drift, always lowest priority

**The canon wins. Period.** If the engine disagrees, the engine is wrong. If marketing disagrees, marketing is wrong. If someone says "but the live site says X" — the live site is wrong until it's fixed to match canon.
