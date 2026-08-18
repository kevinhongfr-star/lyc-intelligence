/**
 * W4-T10 — Assessment Depth Page (11-instance router page).
 *
 * Route: /assessment/:code/deep
 *
 * Wraps DepthPageTemplate with URL-based diagnostic code lookup.
 * Maps every approved diagnostic (11 total) to a complete depth page instance:
 *   - Dimension placeholder sets (3–5 depending on cost tier)
 *   - Pillar code mapping (per-diagnostic placeholder)
 *   - Question count + time estimate (per cost tier)
 *   - SEO meta (per-diagnostic)
 *
 * Rules:
 *   - 404 → NotFoundPage component for unknown codes
 *   - All data from APPROVED_DIAGNOSTICS canon — never hardcoded names/descriptors
 *   - CTA always → /nexus/chat, never catalog
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { DS } from '@/tokens';
import { APPROVED_DIAGNOSTICS, DIAGNOSTIC_MAP, getDiagnosticDescriptor } from '@/config/voiceStandard';
import { getInstrumentMileCost } from '@/config/miles';
import { DepthPageTemplate, type LandingDimension } from '@/components/assessment/DepthPageTemplate';
import { SEO } from '@/components/seo/SEO';
import NotFoundPage from './NotFoundPage';

// ── TIER → FORMAT MAPPINGS ──────────────────────────────────────────
// Per spec:
//   1mi Light:    20 questions, 8 min
//   2mi Standard: 30 questions, 10-12 min
//   3mi Signature: 42 questions, 15 min
//   5mi Flagship: 96 questions, 25 min

interface FormatSpec {
  questions: number;
  minutes: number;
  dimensionCount: number;
}

const TIER_FORMAT: Record<string, FormatSpec> = {
  Light:     { questions: 20, minutes: 8,  dimensionCount: 3 },
  Standard:  { questions: 30, minutes: 12, dimensionCount: 4 },
  Signature: { questions: 42, minutes: 15, dimensionCount: 4 },
  Flagship:  { questions: 96, minutes: 25, dimensionCount: 5 },
};

// ── PER-DIAGNOSTIC PILLAR MAPPING ───────────────────────────────────
// Internal pillar code placeholders. Format: "P# · Short pillar label"
const PILLAR_MAPPING: Record<string, string> = {
  LEAP:   'P3 · Competitive Positioning Layer',
  PRISM:  'P2 · Professional Brand Intelligence',
  IMPACT: 'P2 · Board & Stakeholder Influence Layer',
  BRIDGE: 'P3 · Cross-Cultural Relational Intelligence',
  DRIVE:  'P1 · Motivational Alignment Layer',
  MOSAIC: 'P2 · Institutional Trust & Partnership Velocity',
  FORGE:  'P3 · Sales Excellence Capability',
  SPARK:  'P1 · AI Leadership Readiness',
  QUEST:  'P3 · Strategic Market Positioning',
  COACH:  'P1 · Executive Coaching Fit Diagnostic',
  CPI:    'P1 · China Leadership Pipeline Index · Flagship',
};

// ── PLACEHOLDER DIMENSION LIBRARY ──────────────────────────────────
// Generic placeholder dimension sets, one per tier (3/4/4/5 dimensions).
// Each diagnostic instance uses the count matching its costTier.

const LIGHT_DIMENSIONS: LandingDimension[] = [
  { name: '[Emily: Dim 1 name — placeholder]', shortDescription: '[Emily: Dim 1 shortDescription — placeholder. Core dimension 1 of 3 measuring the primary diagnostic angle.]' },
  { name: '[Emily: Dim 2 name — placeholder]', shortDescription: '[Emily: Dim 2 shortDescription — placeholder. Secondary dimension covering the behavioural context layer.]' },
  { name: '[Emily: Dim 3 name — placeholder]', shortDescription: '[Emily: Dim 3 shortDescription — placeholder. Integration dimension measuring how the first two axes combine in practice.]' },
];

const STANDARD_DIMENSIONS: LandingDimension[] = [
  { name: '[Emily: Dim 1 name — placeholder]', shortDescription: '[Emily: Dim 1 shortDescription — placeholder. Primary axis: the core capability or orientation the diagnostic evaluates.]' },
  { name: '[Emily: Dim 2 name — placeholder]', shortDescription: '[Emily: Dim 2 shortDescription — placeholder. Context axis: how the leader reads and responds to their operating environment.]' },
  { name: '[Emily: Dim 3 name — placeholder]', shortDescription: '[Emily: Dim 3 shortDescription — placeholder. Execution axis: translation of intent into consistent operational behaviour.]' },
  { name: '[Emily: Dim 4 name — placeholder]', shortDescription: '[Emily: Dim 4 shortDescription — placeholder. Impact axis: the measurable downstream effect of how the leader operates.]' },
];

const SIGNATURE_DIMENSIONS: LandingDimension[] = [
  { name: '[Emily: Dim 1 name — placeholder]', shortDescription: '[Emily: Dim 1 shortDescription — placeholder. Signature tier: deeper primary axis with sub-scoring and behavioural anchors.]' },
  { name: '[Emily: Dim 2 name — placeholder]', shortDescription: '[Emily: Dim 2 shortDescription — placeholder. Context axis: situational reading, stakeholder calibration, and cultural translation.]' },
  { name: '[Emily: Dim 3 name — placeholder]', shortDescription: '[Emily: Dim 3 shortDescription — placeholder. Capability axis: specific skills, patterns, and operating methods.]' },
  { name: '[Emily: Dim 4 name — placeholder]', shortDescription: '[Emily: Dim 4 shortDescription — placeholder. Outcome axis: composite impact, trajectory, and blind-spot detection.]' },
];

const FLAGSHIP_DIMENSIONS: LandingDimension[] = [
  { name: '[Emily: Dim 1 name — placeholder]', shortDescription: '[Emily: Dim 1 shortDescription — placeholder. Flagship layer 1: individual pipeline health and leader-level capability read.]' },
  { name: '[Emily: Dim 2 name — placeholder]', shortDescription: '[Emily: Dim 2 shortDescription — placeholder. Flagship layer 2: team-level structure, roles, and succession coverage.]' },
  { name: '[Emily: Dim 3 name — placeholder]', shortDescription: '[Emily: Dim 3 shortDescription — placeholder. Flagship layer 3: organisational context and mandate alignment.]' },
  { name: '[Emily: Dim 4 name — placeholder]', shortDescription: '[Emily: Dim 4 shortDescription — placeholder. Flagship layer 4: cross-functional relationships and institutional trust.]' },
  { name: '[Emily: Dim 5 name — placeholder]', shortDescription: '[Emily: Dim 5 shortDescription — placeholder. Flagship layer 5: strategic horizon, pipeline trajectory, and 12–24 month risk view.]' },
];

function getPlaceholderDimensions(tier: string): LandingDimension[] {
  if (tier === 'Light') return LIGHT_DIMENSIONS;
  if (tier === 'Standard') return STANDARD_DIMENSIONS;
  if (tier === 'Signature') return SIGNATURE_DIMENSIONS;
  if (tier === 'Flagship') return FLAGSHIP_DIMENSIONS;
  return STANDARD_DIMENSIONS;
}

// ── SAMPLE REPORT PLACEHOLDER TEXT ─────────────────────────────────

const SAMPLE_REPORT_TEXT: Record<string, string> = {
  LEAP:   '[Emily: LEAP sample report preview — placeholder. Will show: 5-dimension radar (Market/Capability/Timing/Risk/Impact), composite score dial 0-100, archetype classification (A1–A17), APAC translation overlay excerpt.]',
  PRISM:  '[Emily: PRISM sample report preview — placeholder. Will show: professional brand profile 4-axis, external perception vs self-view gap analysis, brand archetype match, LinkedIn/executive narrative recommendations.]',
  IMPACT: '[Emily: IMPACT sample report preview — placeholder. Will show: board & stakeholder influence heatmap, credibility read across 5 stakeholder groups, communication pattern diagnosis, presence calibration suggestions.]',
  BRIDGE: '[Emily: BRIDGE sample report preview — placeholder. Will show: cross-cultural relational intelligence profile, high-context vs low-context calibration, trust-building pattern map, cross-border mandate risk overlay.]',
  DRIVE:  '[Emily: DRIVE sample report preview — placeholder. Will show: motivational alignment 4-factor profile (Purpose / Mastery / Autonomy / Impact), engagement risk indicators, demotivator sensitivity read, 12-month retention indicators.]',
  MOSAIC: '[Emily: MOSAIC sample report preview — placeholder. Will show: institutional trust & relationship velocity profile, partner ecosystem map, trust-building vs friction patterns, partnership conversion trajectory.]',
  FORGE:  '[Emily: FORGE sample report preview — placeholder. Will show: sales excellence capability 4-axis (Founder Seller / System Builder / Rainmaker / Enablement), pipeline structure read, team scaling capability, revenue culture calibration.]',
  SPARK:  '[Emily: SPARK sample report preview — placeholder. Will show: AI leadership readiness 4-dimension profile (AI Literacy / Strategic AI Adoption / AI Change Leadership / Responsible AI), AI mandate gap analysis, capability roadmap preview.]',
  QUEST:  '[Emily: QUEST sample report preview — placeholder. Will show: strategic market positioning profile, market vs capability vs timing alignment read, position-in-market map, strategic choice recommendations.]',
  COACH:  '[Emily: COACH sample report preview — placeholder. Will show: manager-as-coach capability profile, coaching presence calibration, developmental vs directive pattern read, 1:1 conversation structure recommendations.]',
  CPI:    '[Emily: CPI sample report preview — placeholder. Will show: full China Leadership Pipeline Index 5-layer dashboard, individual readiness scores, team succession heatmap, 24-month pipeline trajectory, Council-level risk & opportunity summary.]',
};

// ── MAIN EXPORT ─────────────────────────────────────────────────────

export function AssessmentDepthPage() {
  const { code } = useParams<{ code: string }>();

  const key = (code || '').toUpperCase();
  const descriptor = getDiagnosticDescriptor(key);

  if (!descriptor) {
    return <NotFoundPage />;
  }

  const { fullName, descriptor: descText, tagline, mileCost, costTier } = descriptor;
  const format = TIER_FORMAT[costTier] ?? TIER_FORMAT.Standard;
  const dimensionPlaceholders = getPlaceholderDimensions(costTier);
  const pillarMapping = PILLAR_MAPPING[key];
  const sampleReportPlaceholder =
    SAMPLE_REPORT_TEXT[key] ??
    '[Emily: sample report preview description — placeholder. Composite score, dimension breakdowns, written interpretation, visualization samples, and action plan preview.]';

  const seoTitle = `${fullName} | LYC Intelligence`;
  const seoDescription = `${tagline} ${costTier} diagnostic · ${format.questions} questions · ~${format.minutes} minutes · ${mileCost} ${mileCost === 1 ? 'mile' : 'miles'}. Run with NEXUS.`;
  const seoPath = `/assessment/${key.toLowerCase()}/deep`;

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} path={seoPath} />
      <DepthPageTemplate
        diagnosticCode={key}
        diagnosticName={fullName}
        descriptor={descText}
        tagline={tagline}
        mileCost={mileCost}
        costTier={costTier}
        dimensionPlaceholders={dimensionPlaceholders}
        pillarMapping={pillarMapping}
        formatQuestionCount={format.questions}
        formatTimeMinutes={format.minutes}
        sampleReportPlaceholder={sampleReportPlaceholder}
      />
    </>
  );
}

export default AssessmentDepthPage;
