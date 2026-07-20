# T-101: Design System — 9 Instrument Colors + 62 Archetype Icons + Components

**Phase:** 1 | **Batch:** 1A | **Effort:** 2 days
**CD Source:** CD10 (Product/Brochure/Website), CD01 (Blast Radius)
**Depends On:** Phase 0 (needs to know the 9 instruments and 62 archetypes)
**Blocks:** ALL other Phase 1 tickets

---

## What to Build

Create the design tokens and reusable components for the archetype system. This MUST be completed before any page in Phase 1 can be built.

## Deliverables

### 1. Instrument Color Palette (9 colors)

Define one color per diagnostic instrument. These colors appear on every page that references the instrument.

| Instrument | Color | Usage |
|---|---|---|
| QUEST | TBD — propose 3 options for Kevin | Leadership Capability |
| DRIVE | TBD — propose 3 options for Kevin | Motivational Profile |
| IMPACT | TBD — propose 3 options for Kevin | Board Effectiveness |
| PRISM | TBD — propose 3 options for Kevin | Brand Identity |
| BRIDGE | TBD — propose 3 options for Kevin | Cultural Intelligence |
| MOSAIC | TBD — propose 3 options for Kevin | Cultural Intelligence (Org) |
| FORGE | TBD — propose 3 options for Kevin | Revenue Leadership |
| SPARK | TBD — propose 3 options for Kevin | AI Readiness |
| SHIFT | TBD — propose 3 options for Kevin | Composite |

**Action:** Generate 3 color palette options (with hex codes, dark/light variants, accessibility contrast ratios) and present to Kevin for selection. Do NOT pick colors autonomously.

### 2. Archetype Icons (62 icons)

Create one SVG icon per archetype. Icons should be:
- Consistent style (line art, 24×24 or 48×48, single-color with instrument color)
- Distinct and recognizable at small sizes
- Thematically matching the archetype name

Full list of 62 archetypes:
- **QUEST (10):** Architect, Catalyst, Diplomat, Commander, Navigator, Strategist, Engine, Entrepreneur, Specialist, Seedling
- **DRIVE (10):** Achiever, Craftsman, Champion, Explorer, Stalwart, Restless, Golden Handcuffs, Drifter, Burned-Out, Frozen Asset
- **IMPACT (8):** Architect, Steward, Networker, Guardian, Visionary, Bridge-Builder, Nominee, Passenger
- **PRISM (10):** Authority, Signal, Monument, Chameleon, Amplifier, Operator, Ghost, Mask, Static, Blank Page
- **BRIDGE (6):** Envoy, Navigator, Chameleon, Anchor, Sprinter, Cultural Operator
- **MOSAIC (4):** Cultural Catalyst, Cultural Expert, Cultural Leader, Cultural Tourist
- **FORGE (4):** Rainmaker, System Builder, Revenue Architect, Promoted Seller
- **SPARK (4):** AI Champion, Skeptical Director, Governance Bureaucrat, Disengaged Director

**Action:** Use AI image generation to create initial icon drafts. Present to Kevin for review.

### 3. Archetype Card Component (`components/ArchetypeCard.tsx`)

Reusable card showing:
- Archetype icon (SVG)
- Archetype name
- Instrument color accent (border or background tint)
- 1-paragraph teaser description
- Optional: confidence indicator

### 4. Radar Chart Component (`components/RadarChart.tsx`)

For the gated result page. Shows:
- All dimensions for the instrument as a radar/spider chart
- Instrument color for the chart fill
- Percentile markers
- Responsive (mobile-friendly)

## Acceptance Criteria

- [ ] 9 instrument colors defined as CSS variables / Tailwind tokens
- [ ] 62 archetype icons as SVG files in `/public/icons/archetypes/`
- [ ] `ArchetypeCard` component renders correctly with all props
- [ ] `RadarChart` component renders with sample data
- [ ] Color palette approved by Kevin
- [ ] Icons reviewed by Kevin
- [ ] Both components have Storybook entries or preview pages

## ⚠️ DO NOT

- Pick final colors without Kevin's approval
- Skip icon generation — they're required for Phase 1 pages
- Use placeholder images — these go on the live site eventually
