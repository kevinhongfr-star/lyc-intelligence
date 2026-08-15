/**
 * W2-4 — IMPACT landing page.
 *
 * Hero assessment #3. Board & team impact. Content verified against
 * akira_source/diagnostic_portfolio/06_scoring_engine_code/impact_config.json
 * (W2-5): 5 dimensions · 8 archetypes · 30 questions · 1-5 Likert.
 *
 * Note on archetype count: akira_source lists 10 entries in the archetypes
 * array — 8 real board-effectiveness archetypes plus 2 framework axes
 * ("Axis 1: Impact Orientation", "Axis 2: Mandate Strength Band"). Per the
 * existing `filterArchetypes` convention in src/assessments/catalog.ts, the
 * 2 axes are framework modulators, not archetypes, so 8 archetypes are
 * displayed. The 2 axes still modulate every archetype (orientation + band).
 *
 * Brand: ONE accent per page — FOREST_GREEN (#166534), reserved for IMPACT.
 */
import { LandingTemplate, type LandingDimension, type LandingArchetype } from '@/components/templates/LandingTemplate';
import { ACCENT, ACCENT_DARK } from '@/tokens';

// ── IMPACT DATA (verified against akira_source/impact_config.json) ───
// Full name: "Board Effectiveness Assessment"

const IMPACT_DIMENSIONS: LandingDimension[] = [
  {
    id: 'D1',
    name: 'Strategic Oversight',
    short: 'Strategy',
    description:
      'How effectively you contribute to strategy formulation at the board level — challenging management proposals and framing the strategic conversation rather than ratifying it.',
  },
  {
    id: 'D2',
    name: 'Governance Rigour',
    short: 'Governance',
    description:
      'Your rigour on process, fiduciary duties, compliance, and governance mechanics. Whether you protect the institution while enabling progress.',
  },
  {
    id: 'D3',
    name: 'Stakeholder Intelligence',
    short: 'Stakeholders',
    description:
      'How well you read stakeholder ecosystems, manage boardroom dynamics, and build relationships that create influence beyond formal authority.',
  },
  {
    id: 'D4',
    name: 'Mandate Legacy',
    short: 'Legacy',
    description:
      'Whether you think about lasting institutional value, not just short-term decisions. The degree to which you build boards that outlive your tenure.',
  },
  {
    id: 'D5',
    name: 'APAC Mandate Credibility',
    short: 'APAC',
    description:
      'Your credibility specifically in APAC governance contexts — regulatory awareness, cultural fluency, and relationship capital with APAC-native stakeholders.',
  },
];

// 8 board-effectiveness archetypes per akira_source/impact_config.json
// (Axis 1 / Axis 2 are framework modulators, excluded per filterArchetypes).
const IMPACT_ARCHETYPES: LandingArchetype[] = [
  { code: '01', name: 'The Architect', tagline: 'Governance + Strategy dominant · High band. Sets the standards and sees the big picture.' },
  { code: '02', name: 'The Steward', tagline: 'Governance + Legacy dominant · High band. Protects what is built while building for the future.' },
  { code: '03', name: 'The Networker', tagline: 'Relationship-dominant · High band. Connects stakeholders and reads boardroom dynamics with precision.' },
  { code: '04', name: 'The Guardian', tagline: 'Governance-dominant · Building band. Rigorous on process; strategic contribution still developing.' },
  { code: '05', name: 'The Visionary', tagline: 'Strategy-dominant · Building band. Sees the future clearly; governance mechanics still tightening.' },
  { code: '06', name: 'The Bridge-Builder', tagline: 'Relationship + Legacy dominant · Building band. A connector committed to lasting value.' },
  { code: '07', name: 'The Nominee', tagline: 'Any profile · Fragile band. Recently appointed; at least one dimension shows credible foundation.' },
  { code: '08', name: 'The Passenger', tagline: 'All dims low · Fragile band. Contributes minimally; presence does not strengthen the board.' },
];

const IMPACT_METHOD_STEPS = [
  {
    mono: '01 · Self-Assessment',
    title: 'Thirty questions across five governance dimensions.',
    body: 'Strategic Oversight, Governance Rigour, Stakeholder Intelligence, Mandate Legacy, and APAC Mandate Credibility — six questions each. An honest read of your board contribution.',
  },
  {
    mono: '02 · Dimension Verdicts',
    title: 'Five independent mandate verdicts.',
    body: 'Each dimension scores from Gap to Strong, with written meaning tied to real board behaviour — benchmarked against the governance trade-offs directors actually face.',
  },
  {
    mono: '03 · Archetype & Mandate Band',
    title: 'Your board archetype and mandate strength.',
    body: 'A composite 0–100 mandate score, a band from Fragile to High Mandate, and one of eight board archetypes — modulated by your Impact Orientation and APAC credibility.',
  },
];

const IMPACT_WHO_FOR = [
  { title: 'Board directors', desc: 'Sitting directors benchmarking their contribution and identifying the dimension that most limits board effectiveness.' },
  { title: 'Executives preparing board roles', desc: 'Leaders stepping toward governance who need an honest read on governance rigour before the mandate begins.' },
  { title: 'Leaders shaping organisational culture', desc: 'Executives accountable for team and institutional impact, not just personal delivery.' },
];

const IMPACT_DIFFERENT = [
  'Board-level focus, not just individual capability. IMPACT measures your contribution to collective governance, where most leadership assessments stop at personal style.',
  'Eight archetypes paired with explicit mandate bands — High, Building, Fragile — so the profile says how credibly you operate, not just how you prefer to.',
  'APAC Mandate Credibility as a first-class dimension. Western governance credibility does not automatically translate; IMPACT makes the APAC gap visible.',
  'Bridges personal and institutional performance. Mandate Legacy measures whether you build boards that outlive your tenure, not just decisions you ratify.',
];

const IMPACT_FAQ = [
  {
    q: 'What is IMPACT?',
    a: 'IMPACT (Board Effectiveness Assessment) is a hero assessment benchmarking your contribution at the board and organisational level. Five dimensions — strategic oversight, governance rigour, stakeholder intelligence, mandate legacy, and APAC mandate credibility — eight board archetypes, and a composite 0–100 mandate score.',
  },
  {
    q: 'Is IMPACT only for sitting directors?',
    a: 'No. IMPACT is built for sitting directors and for executives preparing for board roles. The dimension verdicts and mandate band give both groups an honest read on governance rigour before it becomes a boardroom liability.',
  },
  {
    q: 'How long does it take?',
    a: 'Approximately fifteen minutes for thirty questions. The Executive Introduction tier includes your composite mandate score, five dimension verdicts, board archetype, and NEXUS follow-up integration.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. IMPACT results are private to your LYC Intelligence account. We do not sell personal information, and assessment data is never used to train public-facing models or shared outside LYC Intelligence / LYC Partners unless explicitly authorised.',
  },
];

export function ImpactLanding() {
  return (
    <LandingTemplate
      code="IMPACT"
      name="IMPACT"
      fullName="Board Effectiveness Assessment"
      tagline="Understand your leadership impact on boards, teams, and culture. Five dimensions. Eight archetypes. Governance-level benchmarking."
      heroDescription="Benchmark your contribution at the board and organisational level. Five dimensions — strategic oversight, governance rigour, stakeholder intelligence, mandate legacy, and APAC mandate credibility. Eight board-effectiveness archetypes."
      categoryLabel="Board & Team Impact"
      tierBadge="HERO ASSESSMENT"
      heroH1="A board mandate that's actually built for the governance decisions you face today"
      heroEyebrow="IMPACT · BOARD EFFECTIVENESS"
      accent={ACCENT}
      accentDark={ACCENT_DARK}
      dimensions={IMPACT_DIMENSIONS}
      archetypes={IMPACT_ARCHETYPES}
      methodologySteps={IMPACT_METHOD_STEPS}
      whoItsFor={IMPACT_WHO_FOR}
      whatMakesDifferent={IMPACT_DIFFERENT}
      faq={IMPACT_FAQ}
      stats={[
        { num: '5', label: 'DIMENSIONS', sub: 'of board effectiveness' },
        { num: '8', label: 'ARCHETYPES', sub: 'board operating patterns' },
        { num: '30', label: 'QUESTIONS', sub: '~15 minutes' },
      ]}
      ctaHref="/assessment/impact/take"
      ctaLabel="Start Your IMPACT Assessment"
      finalCtaLabel="Get Your IMPACT Profile"
      finalSubtext="Fifteen minutes. Five mandate verdicts. One board archetype. Your complimentary baseline covers the self-assessment layer and composite mandate score."
      seoTitle="IMPACT — Board Effectiveness Assessment | LYC Intelligence"
      seoDescription="Benchmark your board and organisational impact. 5 dimensions, 8 board archetypes, APAC mandate credibility. ~15 minutes. Complimentary Executive Introduction baseline."
      seoPath="/assessment/impact"
      prefix="impact"
      heroSampleValues={[0.82, 0.70, 0.75, 0.60, 0.55]}
    />
  );
}

export default ImpactLanding;
