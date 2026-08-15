/**
 * W2-3 — SPARK landing page (rebuilt).
 *
 * Hero assessment #2. Focused AI leadership readiness. Content verified against
 * akira_source/diagnostic_portfolio/06_scoring_engine_code/spark_config.json
 * (W2-5): 3 dimensions · 4 archetypes · 27 questions · 1-5 Likert.
 *
 * Replaces the prior stale SparkLanding (5 dims / 10 questions / generic AI
 * theming) with the canonical akira_source instrument definition.
 *
 * Brand: ONE accent per page — AMBER (#B45309), reserved for SPARK only.
 */
import { LandingTemplate, type LandingDimension, type LandingArchetype } from '@/components/templates/LandingTemplate';
import { AMBER } from '@/tokens';

// ── SPARK DATA (verified against akira_source/spark_config.json) ─────
// Full name: "AI Leadership Readiness & Enterprise Governance"

const SPARK_DIMENSIONS: LandingDimension[] = [
  {
    id: 'D1',
    name: 'Individual AI Adoption Readiness',
    short: 'Adoption',
    description:
      'How deeply and consistently AI tools are part of your own executive workflow — adoption, workflow integration, and the professional judgment to evaluate AI output.',
  },
  {
    id: 'D2',
    name: 'Capability Exposure Assessment',
    short: 'Exposure',
    description:
      'How aware you are of which AI capabilities are being deployed across your organisation and bilateral ecosystem — and which of your own capabilities are exposed.',
  },
  {
    id: 'D3',
    name: 'Organisational Preparedness',
    short: 'Preparedness',
    description:
      'Whether your organisation has the governance, data infrastructure, and investment posture to support AI adoption systematically, beyond individual use.',
  },
];

// 4 archetypes per akira_source/spark_config.json.
const SPARK_ARCHETYPES: LandingArchetype[] = [
  { code: 'A1', name: 'AI Champion', tagline: 'High board AI fluency × High governance maturity. Drives AI governance as a board imperative.' },
  { code: 'A2', name: 'Skeptical Director', tagline: 'High AI fluency × Low governance trust. Understands AI; distrusts governance structures.' },
  { code: 'A3', name: 'Governance Bureaucrat', tagline: 'Low AI fluency × High governance maturity. Process-compliant; AI-unaware.' },
  { code: 'A4', name: 'Disengaged Director', tagline: 'Low fluency × Low maturity. Absent from AI governance entirely.' },
];

const SPARK_METHOD_STEPS = [
  {
    mono: '01 · Self-Assessment',
    title: 'Twenty-seven benchmarked questions.',
    body: 'Three dimensions — individual adoption, capability exposure, organisational preparedness — nine questions each. No technical knowledge required; honest executive reflection is enough.',
  },
  {
    mono: '02 · Dimension Scoring',
    title: 'Three independent readiness verdicts.',
    body: 'Each dimension scores from Gap to Strong, with written interpretation tied to real enterprise AI governance behaviour, not generic digital literacy.',
  },
  {
    mono: '03 · Archetype & Band',
    title: 'Your governance archetype and composite band.',
    body: 'A composite 0–100 readiness score, a band from AI Capability Gap to AI-Ready Organisation, and one of four board governance archetypes with its primary risk.',
  },
];

const SPARK_WHO_FOR = [
  { title: 'Senior leaders steering through AI transformation', desc: 'Executives who need to understand their AI readiness gaps before they become competitive disadvantages.' },
  { title: 'Board directors with AI accountability', desc: 'Directors responsible for AI governance who must align fluency against governance maturity, not conflate the two.' },
  { title: 'Aspiring AI leaders', desc: 'Managers preparing to lead AI initiatives and wanting to identify which readiness dimension to develop first.' },
];

const SPARK_DIFFERENT = [
  'Three focused dimensions, not generic AI literacy. Individual adoption, capability exposure, and organisational preparedness are scored independently.',
  'Four governance archetypes tied to board accountability — pairing AI fluency with governance maturity so the profile reflects real director behaviour.',
  'Reads both the individual and the organisation. Most AI assessments stop at personal skill; SPARK benchmarks whether your enterprise can actually adopt.',
  'Grounded in enterprise governance, not consumer tooling. Built for the decisions boards and executives actually face.',
];

const SPARK_FAQ = [
  {
    q: 'What is SPARK?',
    a: 'SPARK (AI Leadership Readiness & Enterprise Governance) is a hero assessment measuring your readiness to lead in the age of AI. Three dimensions — individual adoption, capability exposure, and organisational preparedness — four governance archetypes, and a composite 0–100 readiness score.',
  },
  {
    q: 'Do I need technical AI knowledge?',
    a: 'No. SPARK measures executive readiness and governance judgement, not technical implementation. The questions are scenario-based reflections on your professional practice and organisational posture. No coding or tool-specific knowledge is required.',
  },
  {
    q: 'How long does it take?',
    a: 'Approximately twelve minutes for twenty-seven questions. The Executive Introduction tier includes your composite readiness band, three dimension verdicts, governance archetype, and NEXUS follow-up integration.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. SPARK results are private to your LYC Intelligence account. We do not sell personal information, and assessment data is never used to train public-facing models or shared outside LYC Intelligence / LYC Partners unless explicitly authorised.',
  },
];

export function SparkLanding() {
  return (
    <LandingTemplate
      code="SPARK"
      name="SPARK"
      fullName="AI Leadership Readiness & Enterprise Governance"
      tagline="Strategic potential and readiness for AI-era leadership. Three dimensions. Four governance archetypes. Focused and fast."
      heroDescription="Assess your readiness to lead in the age of AI. Three dimensions — individual adoption, capability exposure, and organisational preparedness. Four governance archetypes. A clear readiness profile in approximately twelve minutes."
      categoryLabel="AI Leadership Readiness"
      tierBadge="HERO ASSESSMENT"
      accent={AMBER}
      accentDark="#8A3D07"
      dimensions={SPARK_DIMENSIONS}
      archetypes={SPARK_ARCHETYPES}
      methodologySteps={SPARK_METHOD_STEPS}
      whoItsFor={SPARK_WHO_FOR}
      whatMakesDifferent={SPARK_DIFFERENT}
      faq={SPARK_FAQ}
      stats={[
        { num: '3', label: 'DIMENSIONS', sub: 'individual to organisational' },
        { num: '4', label: 'ARCHETYPES', sub: 'board governance patterns' },
        { num: '27', label: 'QUESTIONS', sub: '~12 minutes' },
      ]}
      ctaHref="/assessment/spark/take"
      ctaLabel="Start Your SPARK Assessment"
      finalCtaLabel="Get Your SPARK Readiness Profile"
      finalSubtext="Twelve minutes. Three dimension verdicts. One governance archetype. Your complimentary baseline covers the self-assessment layer and composite readiness band."
      seoTitle="SPARK — AI Leadership Readiness & Governance | LYC Intelligence"
      seoDescription="Assess your readiness to lead in the age of AI. 3 dimensions, 4 governance archetypes, composite readiness band. ~12 minutes. Complimentary Executive Introduction baseline."
      seoPath="/assessment/spark"
      prefix="spark"
      heroSampleValues={[0.78, 0.62, 0.55]}
    />
  );
}

export default SparkLanding;
