/**
 * W2-2 — LEAP landing page.
 *
 * Hero assessment #1. Deep leadership self-awareness. Content verified against
 * akira_source/diagnostic_portfolio/06_scoring_engine_code/leap_config.json
 * (W2-5): 5 dimensions · 17 archetypes · 30 questions · 1-5 Likert.
 *
 * Brand: ONE accent per page — OCEAN (#1E4D8C), reserved for LEAP only.
 */
import { LandingTemplate, type LandingDimension, type LandingArchetype } from '@/components/templates/LandingTemplate';
import { OCEAN } from '@/tokens';

// ── LEAP DATA (verified against akira_source/leap_config.json) ──────
// Full name: "Leadership Archetype & APAC Translation"

const LEAP_DIMENSIONS: LandingDimension[] = [
  {
    id: 'D1',
    name: 'Market',
    short: 'Market',
    description:
      'How clearly you read competitive positioning, market intelligence, and entry signals — and adapt your positioning to where the market is moving.',
  },
  {
    id: 'D2',
    name: 'Capability',
    short: 'Capability',
    description:
      'Whether your capabilities fit the mandate, transfer across contexts, and translate into a clear value proposition — including APAC capability translation.',
  },
  {
    id: 'D3',
    name: 'Timing',
    short: 'Timing',
    description:
      'Recognising the right moment, calibrating pace, managing pressure, and aligning to APAC tempo — knowing when to move and when to wait.',
  },
  {
    id: 'D4',
    name: 'Risk',
    short: 'Risk',
    description:
      'Assessing, calibrating, and mitigating risk — including political risk — so exposure is deliberate rather than accidental.',
  },
  {
    id: 'D5',
    name: 'Impact',
    short: 'Impact',
    description:
      'Creating and attributing outcomes, influencing without authority, and extending impact across borders and stakeholder ecosystems.',
  },
];

// 17 archetypes per akira_source/leap_config.json. Codes assigned A1–A17.
const LEAP_ARCHETYPES: LandingArchetype[] = [
  { code: 'A1', name: 'Catalyst', tagline: 'Market-Timing dominant: drives change through energy and momentum.' },
  { code: 'A2', name: 'Architect', tagline: 'Market-Capability dominant: builds systems calibrated to competitive reality.' },
  { code: 'A3', name: 'Pioneer', tagline: 'Timing-Risk dominant: moves into new territory before competitors recognise the opening.' },
  { code: 'A4', name: 'Founder', tagline: 'Capability-Impact dominant: creates something durable from differentiated strength.' },
  { code: 'A5', name: 'Anchor', tagline: 'Risk-Capability dominant: creates stability in turbulent market conditions.' },
  { code: 'A6', name: 'Steward', tagline: 'Capability-Impact dominant: develops and protects organisational capability over time.' },
  { code: 'A7', name: 'Cultivator', tagline: 'Capability-Market dominant: grows capability aligned to market evolution.' },
  { code: 'A8', name: 'Guardian', tagline: 'Risk-Market dominant: maintains positioning integrity under competitive pressure.' },
  { code: 'A9', name: 'Diplomat', tagline: 'Impact-Risk dominant: navigates complex stakeholder environments with precision.' },
  { code: 'A10', name: 'Facilitator', tagline: 'Market-Impact dominant: creates alignment across different market and cultural contexts.' },
  { code: 'A11', name: 'Translator', tagline: 'Capability-Market dominant: bridges capability gaps between organisational worlds.' },
  { code: 'A12', name: 'Champion', tagline: 'Impact-Timing dominant: advocates powerfully at the right moment.' },
  { code: 'A13', name: 'Analyst', tagline: 'Market-Risk dominant: deconstructs competitive complexity into actionable intelligence.' },
  { code: 'A14', name: 'Synthesiser', tagline: 'Capability-Impact dominant: integrates diverse inputs into coherent strategic direction.' },
  { code: 'A15', name: 'Architect (Strategic)', tagline: 'Market-Capability dominant: designs the operating system others execute within.' },
  { code: 'A16', name: 'Visionary', tagline: 'Timing-Impact dominant: sees the future positioning others have not yet recognised.' },
  { code: 'A17', name: 'LEAP Instrument', tagline: 'Full archetype-by-archetype APAC translation map across all five dimensions.' },
];

const LEAP_METHOD_STEPS = [
  {
    mono: '01 · Self-Assessment',
    title: 'Your own view of your leadership operation.',
    body: 'Thirty calibrated questions across five dimensions — Market, Capability, Timing, Risk, Impact. The self-view baseline of how you actually operate.',
  },
  {
    mono: '02 · Dimension Calibration',
    title: 'Each dimension scored and interpreted.',
    body: 'Five independent dimension verdicts — from Strong Primary to Out of Scope — with written meaning tied to real leadership behaviour, not abstract traits.',
  },
  {
    mono: '03 · Archetype Mapping',
    title: 'Your primary and secondary archetype.',
    body: 'A composite 0–100 score, an archetype classification across seventeen patterns, and an APAC translation overlay for cross-border contexts.',
  },
];

const LEAP_WHO_FOR = [
  { title: 'Senior leaders & executives', desc: 'A deep self-awareness baseline for C-suite and high-potential leaders preparing their next mandate.' },
  { title: 'Leadership development programs', desc: 'Anchors structured development with measurable archetype progression rather than self-reported growth.' },
  { title: 'APAC-mandate executives', desc: 'Leaders stepping into cross-border roles who need their operating pattern translated, not just described.' },
];

const LEAP_DIFFERENT = [
  'Seventeen archetypes — the most of any single LYC assessment. A granular operating-pattern map, not a four-label personality box.',
  'Five dimensions built around how executives actually create value: Market, Capability, Timing, Risk, Impact — not abstract traits.',
  'APAC translation overlay. Every archetype carries an explicit cross-border read, so the profile travels with you into APAC mandates.',
  'Multi-phase structure. Self-view, dimension verdicts, and archetype mapping layered so the profile reflects behaviour, not a single snapshot.',
];

const LEAP_FAQ = [
  {
    q: 'What is LEAP?',
    a: 'LEAP (Leadership Archetype & APAC Translation) is a hero leadership self-awareness assessment. It measures five dimensions of executive operation, classifies you across seventeen archetypes, and produces a composite 0–100 profile with an APAC translation overlay.',
  },
  {
    q: 'How long does it take?',
    a: 'Approximately fifteen minutes. The Executive Introduction tier includes your composite score, dimension verdicts, primary and secondary archetype, and NEXUS follow-up integration.',
  },
  {
    q: 'How is LEAP different from CPI?',
    a: 'CPI is the flagship multi-layer instrument with multi-rater capability. LEAP is a focused hero assessment — the deepest single-instrument archetype map in the suite, with seventeen archetypes and an explicit APAC translation layer. Many leaders take both.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. LEAP results are private to your LYC Intelligence account. We do not sell personal information, and assessment data is never used to train public-facing models or shared outside LYC Intelligence / LYC Partners unless explicitly authorised.',
  },
];

export function LeapLanding() {
  return (
    <LandingTemplate
      code="LEAP"
      name="LEAP"
      fullName="Leadership Archetype & APAC Translation"
      tagline="Deep leadership self-awareness across five operating dimensions. Seventeen archetypes. Comprehensive multi-phase profiling."
      heroDescription="The deepest single-instrument leadership profile in the LYC suite. Five dimensions. Seventeen archetypes. A composite profile calibrated to how executives actually operate — including APAC translation."
      categoryLabel="Leadership Self-Awareness"
      tierBadge="HERO ASSESSMENT"
      accent={OCEAN}
      accentDark="#163E70"
      dimensions={LEAP_DIMENSIONS}
      archetypes={LEAP_ARCHETYPES}
      methodologySteps={LEAP_METHOD_STEPS}
      whoItsFor={LEAP_WHO_FOR}
      whatMakesDifferent={LEAP_DIFFERENT}
      faq={LEAP_FAQ}
      stats={[
        { num: '5', label: 'DIMENSIONS', sub: 'of executive operation' },
        { num: '17', label: 'ARCHETYPES', sub: 'operating patterns mapped' },
        { num: '30', label: 'QUESTIONS', sub: '~15 minutes' },
      ]}
      ctaHref="/assessment/leap/take"
      ctaLabel="Start Your LEAP Assessment"
      finalCtaLabel="Get Your LEAP Profile"
      finalSubtext="A few minutes. A clear scorecard. Seventeen archetypes. An APAC translation overlay. Your complimentary baseline covers the self-assessment layer and archetype classification."
      seoTitle="LEAP — Leadership Archetype & APAC Translation | LYC Intelligence"
      seoDescription="The deepest single-instrument leadership profile in the LYC suite. 5 dimensions, 17 archetypes, APAC translation overlay. ~15 minutes. Complimentary Executive Introduction baseline."
      seoPath="/assessment/leap"
      prefix="leap"
      heroSampleValues={[0.88, 0.65, 0.72, 0.58, 0.80]}
    />
  );
}

export default LeapLanding;
