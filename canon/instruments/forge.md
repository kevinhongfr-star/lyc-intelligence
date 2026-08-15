# FORGE — Deep Canon
**sales excellence capability**

---

## Model Explanation

FORGE is a B2C individual assessment that measures sales excellence capability across four dimensions. It is positioned in the P4 AI-Augmented Leadership pillar as a related product — the "human capability" counterpart to SPARK's AI readiness. Sales leaders need both AI literacy (SPARK) and core sales excellence (FORGE).

The model uses a 36-question self-report survey (9 per dimension) on a 5-point Likert scale. Outputs include a four-dimension profile, a sales archetype (one of four), and a development roadmap for growing sales leadership capability.

**Historical note:** FORGE's D2 dimension was originally named "THREE FORCES AWARENESS" — a direct descendant of the banned "Three Fires" terminology from BRIDGE. This was an internal framework leak. The canon name is "Market Context Awareness," which accurately describes the construct being measured without referencing banned internal terminology.

---

## Dimension Interrelationships

The four dimensions measure different aspects of sales capability:

**Growth orientation ↔ Relationship orientation:**
- Adaptive Learning Orientation (how you grow and adapt)
- Development Agency (how you drive your own growth)

**Market context ↔ Client relationship:**
- Market Context Awareness (understanding the broader market environment)
- Bilateral Relationship Quality (depth and quality of client relationships)

**Key interaction patterns:**
- High Adaptive Learning + High Relationship Quality = Rainmaker
- High Development Agency + High Market Context = System Builder
- High Market Context + High Relationship Quality = Strategic Seller
- High Adaptive Learning + High Development Agency = Promoted Seller

---

## Archetype Detail

### Rainmaker
**Primary dimensions:** Adaptive Learning Orientation + Bilateral Relationship Quality

The classic high-performing sales leader — natural closer, strong client relationships, learns fast and adapts to each situation. Rainmakers make it rain because they read people, they build trust quickly, and they know how to close.

**Strengths:**
- Closing ability and deal instinct
- Client trust and relationship depth
- Adaptability across different client types
- Natural sales charisma

**Growth areas:**
- Market context depth — can underestimate structural and competitive factors
- System building — reliance on personal talent vs. scalable processes
- Team development — may struggle to replicate their success in others

**Ideal next step:** Develop the market context and system-building capabilities to move from "great salesperson" to "great sales leader."

---

### System Builder
**Primary dimensions:** Development Agency + Market Context Awareness

Process-driven sales professional who builds scalable systems, development frameworks, and structured approaches. System Builders don't just sell — they build the machine that enables selling.

**Strengths:**
- Process design and scalability
- Development of teams and individuals
- Structured approach to market analysis
- Organizational and planning skills

**Growth areas:**
- Frontline closing instinct — can over-rely on process and lose deal intuition
- Client relationship spontaneity — may follow the playbook too rigidly
- Adaptability in unstructured situations

**Ideal next step:** Get closer to frontline selling situations to rebuild deal instinct and client relationship spontaneity.

---

### Strategic Seller
**Primary dimensions:** Market Context Awareness + Bilateral Relationship Quality

Market-savvy seller with strong context awareness and deep client relationships — thrives in complex enterprise deals and strategic accounts. Strategic Sellers understand the full market landscape and use that understanding to position solutions at the highest level.

**Strengths:**
- Complex deal navigation and enterprise sales
- Client advisory approach (not just transactional)
- Strategic thinking and market insight
- Long-term relationship building

**Growth areas:**
- Development proactivity — may wait for opportunities instead of creating them
- Structured growth planning — excellent in the moment, less systematic about own development
- Can get too comfortable with existing accounts

**Ideal next step:** Build a more proactive development system — target new markets, expand the client base systematically, invest in personal growth planning.

---

### Promoted Seller
**Primary dimensions:** Adaptive Learning Orientation + Development Agency

Strong individual performer who has moved into sales leadership but still operates from an individual contributor mindset. Promoted Sellers got the promotion because they were great sellers — but they haven't fully shifted into enabling others to sell.

**Strengths:**
- Individual results and personal track record
- Personal drive and ambition
- Quick learning and adaptation
- Clear understanding of what great selling looks like

**Growth areas:**
- Team enablement — need to shift from doing to enabling
- Letting go of individual contributor habits
- Developing others vs. doing it themselves
- Relationship leverage — using their network to develop their team's network

**Ideal next step:** Focus on team enablement and leadership — delegate, coach, and build the team's capability instead of carrying the team.

---

## Interpretation Framework

**Development priority logic:**
1. **If Adaptive Learning is lowest** → Focus on learning agility and sales adaptability first
2. **If Market Context is lowest** → Build market and competitive understanding
3. **If Development Agency is lowest** → Build proactive development habits and systems
4. **If Relationship Quality is lowest** → Focus on deepening client relationships and trust building

**Report structure:**
- Overall sales excellence score
- Four-dimension profile (radar chart)
- Primary archetype with detailed explanation
- Strengths and growth areas
- Three prioritized development actions
- Sales leadership progression path

---

## Edge Cases

**All very high:**
- Unicorn sales leader — strong across all four dimensions
- Development focus: team scaling, organizational impact, thought leadership

**All very low:**
- Early-stage sales professional
- Development focus: start with Adaptive Learning Orientation + Relationship Quality fundamentals

**Rainmaker at risk:**
- High relationship quality, high adaptability, low development agency
- Risk: plateaus because they don't invest in their own growth
- Intervention: structured development plan with accountability

**System Builder at risk:**
- High process orientation, low relationship spontaneity
- Risk: becomes a bureaucrat, loses deal instinct
- Intervention: frontline immersion, client-facing practice

---

## Banned Patterns — FORGE Specific

1. **Never call it "Sales Excellence & Revenue Architecture"** — "Architecture" is banned, and "Revenue Architecture" isn't what FORGE measures.
2. **Never use "Three Forces Awareness"** — banned framework language (derived from "Three Fires"). Use "Market Context Awareness."
3. **Never use "Revenue Architect" as an archetype name** — banned word "Architect." Use "Strategic Seller."
4. **Never use "Navigation" language** — banned. Dimensions and archetypes should use relationship-building language instead.
5. **Never present FORGE as a B2B organizational product** — it's an individual sales capability assessment.
6. **Never use ALL CAPS dimension names with acronyms in customer-facing surfaces** — use Title Case. The acronyms (ALO, MCA, DA, BRQ) are acceptable in internal engineering contexts only.

---

## Source Provenance

| Canonical Value | Source | File | Change from Source |
|---|---|---|---|
| 4 dimensions | forge_config.json + FORGE_QB_notion.json | `diagnostic_portfolio/06_scoring_engine_code/forge_config.json` | Count verified ✅ |
| 36 questions (9×4) | FORGE_QB_notion.json | `diagnostic_portfolio/07_question_banks/FORGE_QB_notion.json` | Verified ✅ |
| 4 archetypes | forge_config.json | Same file | Count verified ✅ |
| Descriptor: "sales excellence capability" | Akira canon / product spec | Approved canonical descriptor | Was "Sales Excellence & Revenue Architecture" ❌ |
| D1: Adaptive Learning Orientation | forge_config.json | Same file → dimensions[0] | Name retained, formatting standardized |
| D2: Market Context Awareness | Canon realignment | Was "THREE FORCES AWARENESS (TFA)" | Renamed — banned framework leak |
| D3: Development Agency | forge_config.json | Same file → dimensions[2] | Name retained, formatting standardized |
| D4: Bilateral Relationship Quality | Canon realignment | Was "BILATERAL CONTEXT NAVIGATION (BCN)" | Renamed — banned word "Navigation" |
| Archetype: Rainmaker | forge_config.json | Same file → archetypes[0] | Verified ✅ |
| Archetype: System Builder | forge_config.json | Same file → archetypes[1] | Verified ✅ |
| Archetype: Strategic Seller | Canon realignment | Was "Revenue Architect" | Renamed — banned word "Architect" |
| Archetype: Promoted Seller | forge_config.json | Same file → archetypes[3] | Verified ✅ |
