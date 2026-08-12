/**
 * diagnosticScoring.ts — Pure scoring functions for diagnostic assessments.
 *
 * #1342: All diagnostics use the same weighted-average scoring method for
 * placeholder purposes. Real scoring algorithms will be added by content
 * team later via JSON file updates.
 *
 * Scoring flow:
 *   1. For each dimension: sum(question_score * weight) / sum(weights) → 0-100
 *   2. Overall score: weighted average of all dimensions
 *   3. Level thresholds: 0-39 Developing, 40-69 Proficient, 70-89 Advanced, 90-100 Mastery
 *   4. Archetype: based on highest-scoring dimension combination pattern
 */

import type {
  DiagnosticDefinition,
  DiagnosticQuestion,
  DiagnosticDimension,
  DiagnosticArchetype,
} from '@/types/assessment';
import { scoreToLevel } from '@/types/assessment';

// ── Types ──────────────────────────────────────────────────────────

export interface DimensionScore {
  dimension_key: string;
  dimension_name: string;
  score: number;          // 0-100
  level: string;          // Developing, Proficient, Advanced, Mastery
  description: string;    // insight text based on score level
}

export interface ScoringResult {
  overall_score: number;       // 0-100
  overall_level: string;       // Developing, Proficient, Advanced, Mastery
  dimension_scores: DimensionScore[];
  archetype_key: string | null;
  archetype_name: string | null;
  insights: string[];
}

// ── Answer type ────────────────────────────────────────────────────

export type AnswerValue = string | number | string[];

export type AnswerMap = Record<string, AnswerValue>;

// ── Scoring ────────────────────────────────────────────────────────

/**
 * Score a single question answer to a 0-100 value.
 * - scale: normalize to 0-100 (e.g., 1-5 → 0, 25, 50, 75, 100)
 * - single_select: use the option's score field, normalize to 0-100
 * - multi_select: average of selected option scores
 * - scenario: same as scale
 * - text: neutral 50 (no scoring for open text in placeholder)
 */
function scoreQuestion(question: DiagnosticQuestion, answer: AnswerValue): number {
  if (answer === undefined || answer === null) return 0;

  switch (question.type) {
    case 'scale':
    case 'scenario': {
      const val = typeof answer === 'number' ? answer : parseInt(String(answer), 10);
      const min = question.scale_min ?? 1;
      const max = question.scale_max ?? 5;
      if (max === min) return 50;
      return Math.round(((val - min) / (max - min)) * 100);
    }
    case 'single_select': {
      const option = question.options?.find((o) => o.value === answer);
      if (!option?.score) return 50;
      // Normalize score (typically 1-5) to 0-100
      const maxScore = Math.max(...(question.options?.map((o) => o.score ?? 0) ?? [5]));
      return Math.round((option.score / maxScore) * 100);
    }
    case 'multi_select': {
      if (!Array.isArray(answer)) return 50;
      const scores = answer.map((v) => {
        const opt = question.options?.find((o) => o.value === v);
        return opt?.score ?? 2;
      });
      if (scores.length === 0) return 50;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...(question.options?.map((o) => o.score ?? 2) ?? [2]));
      return Math.round((avg / maxScore) * 100);
    }
    case 'text':
      return 50; // neutral for placeholder
    default:
      return 50;
  }
}

/**
 * Score a complete assessment attempt.
 */
export function scoreAttempt(
  definition: DiagnosticDefinition,
  answers: AnswerMap
): ScoringResult {
  const { dimensions, questions, archetypes, result_insights } = definition;

  // Group questions by dimension
  const questionsByDimension: Record<string, DiagnosticQuestion[]> = {};
  for (const q of questions) {
    if (!questionsByDimension[q.dimension_key]) {
      questionsByDimension[q.dimension_key] = [];
    }
    questionsByDimension[q.dimension_key].push(q);
  }

  // Score each dimension
  const dimension_scores: DimensionScore[] = dimensions.map((dim) => {
    const dimQuestions = questionsByDimension[dim.key] ?? [];
    let weightedSum = 0;
    let weightSum = 0;

    for (const q of dimQuestions) {
      const answer = answers[q.key];
      if (answer !== undefined && answer !== null) {
        const score = scoreQuestion(q, answer);
        const weight = q.weight ?? 1.0;
        weightedSum += score * weight;
        weightSum += weight;
      }
    }

    const rawScore = weightSum > 0 ? weightedSum / weightSum : 0;
    const score = Math.round(Math.max(0, Math.min(100, rawScore)));
    const level = scoreToLevel(score);

    // Generate insight text based on level
    let description: string;
    if (score >= 70) description = result_insights.high;
    else if (score >= 40) description = result_insights.medium;
    else description = result_insights.low;

    return {
      dimension_key: dim.key,
      dimension_name: dim.name,
      score,
      level,
      description,
    };
  });

  // Overall score: weighted average of dimensions
  let overallSum = 0;
  let overallWeight = 0;
  for (let i = 0; i < dimensions.length; i++) {
    const weight = dimensions[i].weight ?? 1.0;
    overallSum += dimension_scores[i].score * weight;
    overallWeight += weight;
  }
  const overall_score = overallWeight > 0 ? Math.round(overallSum / overallWeight) : 0;
  const overall_level = scoreToLevel(overall_score);

  // Archetype: find the one whose traits best match the highest-scoring dimension
  const sortedDims = [...dimension_scores].sort((a, b) => b.score - a.score);
  const topDimKey = sortedDims[0]?.dimension_key;
  const archetype = archetypes.find((_, i) => i === Math.floor((overall_score / 100) * archetypes.length)) ?? archetypes[0] ?? null;

  // Generate insights
  const insights: string[] = [];
  const topDim = sortedDims[0];
  const bottomDim = sortedDims[sortedDims.length - 1];
  if (topDim) {
    insights.push(`Your strongest dimension is ${topDim.dimension_name} (${topDim.score}/100, ${topDim.level}). ${topDim.description}`);
  }
  if (bottomDim && bottomDim.dimension_key !== topDim?.dimension_key) {
    insights.push(`Your development priority is ${bottomDim.dimension_name} (${bottomDim.score}/100, ${bottomDim.level}). ${bottomDim.description}`);
  }
  insights.push(`Your overall readiness level is ${overall_level} (${overall_score}/100).`);

  return {
    overall_score,
    overall_level,
    dimension_scores,
    archetype_key: archetype?.key ?? null,
    archetype_name: archetype?.name ?? null,
    insights,
  };
}
