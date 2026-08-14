import type { AssessmentResultData } from '@/types/reportTemplates';
import type { ScoreResult } from '@/lib/akira/engine';
import type { TierKey } from '@/config/tierConfig';

export interface ToPdfDataOptions {
  assessmentCode: string;
  scoreResult: ScoreResult;
  matchedArchetype?: {
    name: string;
    description: string;
    key_traits?: string[];
  };
  aiInsights?: { summary: string; strengths: string[]; growthAreas: string[]; nextSteps: string[] };
  viewerTier?: 'executive_introduction' | 'professional' | 'executive';
  recipient?: { name: string; email?: string };
}

const ASSESSMENT_META: Record<string, { title: string; subtitle: string; accent: string; totalQuestions: number }> = {
  SPARK: { title: 'SPARK', subtitle: 'AI Leadership Readiness Assessment', accent: '#B45309', totalQuestions: 27 },
  LEAP: { title: 'LEAP', subtitle: 'Career Acceleration & Mandate Shift', accent: '#1E4D8C', totalQuestions: 31 },
  IMPACT: { title: 'IMPACT', subtitle: 'Board Mandate & Governance Impact', accent: '#166534', totalQuestions: 30 },
  CPI: { title: 'CPI', subtitle: 'Comprehensive Potential Index', accent: '#334155', totalQuestions: 30 },
  PRISM: { title: 'PRISM', subtitle: 'Professional Brand Legibility Assessment', accent: '#D946EF', totalQuestions: 30 },
  FORGE: { title: 'FORGE', subtitle: 'Strengths Orientation Report', accent: '#0D9488', totalQuestions: 36 },
  BRIDGE: { title: 'BRIDGE', subtitle: 'Transition & Cross-Border Mandate', accent: '#1D4ED8', totalQuestions: 36 },
  DRIVE: { title: 'DRIVE', subtitle: 'Motivation Orientation', accent: '#EA580C', totalQuestions: 30 },
  QUEST: { title: 'QUEST', subtitle: 'Team & Culture Leadership Report', accent: '#BE185D', totalQuestions: 36 },
  MOSAIC: { title: 'MOSAIC', subtitle: 'Cross-Border Partnership Intelligence', accent: '#7C3AED', totalQuestions: 25 },
  COACH: { title: 'COACH', subtitle: 'Coaching Readiness & Manager-as-Coach', accent: '#059669', totalQuestions: 26 },
};

function getOverallLevel(score: number): string {
  if (score >= 80) return 'Exceptional';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Developing';
  if (score >= 20) return 'Emerging';
  return 'Early Stage';
}

function getDimensionLevel(score: number): string {
  if (score >= 16) return 'B4';
  if (score >= 10) return 'B3';
  if (score >= 4) return 'B2';
  return 'B1';
}

function buildFallbackAiInsights(
  scoreResult: ScoreResult,
  overallLevel: string
): { summary: string; strengths: string[]; growthAreas: string[]; nextSteps: string[] } {
  const composite = scoreResult.composite?.score ?? 0;
  const dims = Object.values(scoreResult.dimension_scores);
  const sorted = [...dims].sort((a, b) => b.percentage - a.percentage);
  const top = sorted.slice(0, 2);
  const bottom = [...sorted].reverse().slice(0, 2);

  const summary = `${overallLevel} overall profile with a composite score of ${Math.round(composite)}/100. Results span ${dims.length} performance dimensions.`;

  const strengths = top
    .filter((d) => d.percentage >= 50)
    .map((d) => `${d.name} is a demonstrated strength at ${Math.round(d.percentage)}%.`);
  if (strengths.length === 0) strengths.push('Profile shows solid foundational capacity across dimensions.');

  const growthAreas = bottom
    .filter((d) => d.percentage < 70)
    .map((d) => `${d.name} (${Math.round(d.percentage)}%) warrants focused development attention.`);
  if (growthAreas.length === 0) growthAreas.push('Continue compounding existing strengths rather than chasing marginal gains.');

  const nextSteps = [
    'Book a 1:1 debrief to translate these scores into a 90-day action plan.',
    'Start with the highest-priority development area and build one visible win.',
    'Retake in 90 days to measure movement against the baseline.',
  ];

  return { summary, strengths, growthAreas, nextSteps };
}

export function scoreResultToPdfData(opts: ToPdfDataOptions): AssessmentResultData {
  const { assessmentCode, scoreResult, matchedArchetype, aiInsights, viewerTier, recipient } = opts;
  const code = assessmentCode.toUpperCase();
  const meta = ASSESSMENT_META[code];
  const title = meta?.title ?? code;
  const subtitle = meta?.subtitle ?? '';
  const accentColor = meta?.accent ?? '#4a90d9';
  const totalQuestions = meta?.totalQuestions ?? 30;
  const tierKey: TierKey = (viewerTier ?? 'executive_introduction') as TierKey;

  const dimsOrdered = scoreResult.dimensions_ordered?.length
    ? scoreResult.dimensions_ordered
    : Object.keys(scoreResult.dimension_scores);

  const totalDimensions = dimsOrdered.length;

  const localId = 'local_' + Date.now().toString();
  const overallScore = scoreResult.composite?.score ?? 0;
  const overallLevel = getOverallLevel(overallScore);

  const dimensions = dimsOrdered.map((id) => {
    const ds = scoreResult.dimension_scores[id];
    const score = ds?.normalised_score ?? 0;
    const level = getDimensionLevel(score);
    return {
      dimension_key: id,
      dimension_name: ds?.name || id,
      score: Math.round(score * 100) / 100,
      level,
      description: ds?.verdict_meaning || scoreResult.dimension_verdicts?.[id]?.meaning || '',
    };
  });

  const archetype = matchedArchetype
    ? {
        archetype_key: matchedArchetype.name,
        name: matchedArchetype.name,
        description: matchedArchetype.description,
        key_traits: matchedArchetype.key_traits ?? [],
      }
    : null;

  const resolvedAi = aiInsights ?? buildFallbackAiInsights(scoreResult, overallLevel);

  const resolvedRecipient = recipient
    ? { name: recipient.name, email: recipient.email }
    : { name: 'Executive' };

  return {
    definition: {
      assessment_id: code,
      title,
      subtitle,
      accent_color: accentColor,
      tier_key: tierKey,
      total_questions: totalQuestions,
      total_dimensions: totalDimensions,
    },
    result: {
      result_id: localId,
      attempt_id: localId,
      overall_score: overallScore,
      overall_level: overallLevel,
      style_key: code.toLowerCase(),
      archetype_key: matchedArchetype?.name ?? null,
      insights: [resolvedAi.summary],
      completed_at: new Date().toISOString(),
    },
    dimensions,
    archetype,
    aiInsights: resolvedAi,
    viewerTier: tierKey,
    recipient: resolvedRecipient,
  };
}
