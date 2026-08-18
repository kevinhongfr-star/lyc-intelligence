import type { InstrumentConfig, InstrumentDimension, DimensionVerdict, CompositeBand, Archetype } from "./types";

export interface DimensionScore {
  id: string;
  name: string;
  raw_score: number;
  raw_max: number;
  normalised_score: number;
  normalised_max: number;
  percentage: number;
  verdict?: string;
  verdict_meaning?: string;
  question_count: number;
}

export interface CompositeScore {
  score: number;
  band?: string;
  interpretation?: string;
}

export interface MatchedArchetype {
  id?: string | number;
  name: string;
  description?: string;
  match_score: number;
  [k: string]: unknown;
}

export interface DevelopmentPriority {
  dimension_id: string;
  dimension_name: string;
  priority: "critical" | "high" | "medium" | "low";
  rationale: string;
}

export interface ScoreResult {
  dimension_scores: Record<string, DimensionScore>;
  dimensions_ordered: string[];
  composite: CompositeScore;
  archetype?: MatchedArchetype;
  archetypes_ranked?: MatchedArchetype[];
  development_priorities: DevelopmentPriority[];
  dimension_verdicts: Record<string, { verdict: string; meaning: string }>;
  summary: {
    total_questions_answered: number;
    completion_rate: number;
    composite_percentile?: number;
  };
}

export class AkiraScorer {
  private config: InstrumentConfig;

  constructor(config: InstrumentConfig) {
    this.config = config;
  }

  score(responses: Record<string, number>): ScoreResult {
    const dimensions = this.config.dimensions || [];
    const dimensionScores: Record<string, DimensionScore> = {};
    const dimensionsOrdered: string[] = [];
    const dimensionVerdicts: Record<string, { verdict: string; meaning: string }> = {};
    let totalQuestionsAnswered = 0;
    let totalConfiguredQuestions = 0;

    for (const dim of dimensions) {
      const dimResult = this.scoreDimension(dim, responses);
      dimensionScores[dim.id] = dimResult.score;
      dimensionsOrdered.push(dim.id);
      dimensionVerdicts[dim.id] = dimResult.verdict;
      totalQuestionsAnswered += dimResult.answered_count;
      totalConfiguredQuestions += dimResult.configured_count;
    }

    const composite = this.scoreComposite(dimensionScores);
    const { archetype, archetypesRanked } = this.matchArchetype(dimensionScores);
    const developmentPriorities = this.deriveDevelopmentPriorities(dimensionScores, dimensionVerdicts);

    return {
      dimension_scores: dimensionScores,
      dimensions_ordered: dimensionsOrdered,
      composite,
      archetype,
      archetypes_ranked: archetypesRanked,
      development_priorities: developmentPriorities,
      dimension_verdicts: dimensionVerdicts,
      summary: {
        total_questions_answered: totalQuestionsAnswered,
        completion_rate: totalConfiguredQuestions > 0 ? totalQuestionsAnswered / totalConfiguredQuestions : 0,
      },
    };
  }

  private scoreDimension(
    dim: InstrumentDimension,
    responses: Record<string, number>
  ): { score: DimensionScore; verdict: { verdict: string; meaning: string }; answered_count: number; configured_count: number } {
    const questionIds = dim.question_ids || [];
    const reverseCoded = new Set(dim.reverse_coded || []);
    const scaleMax = this.inferScaleMax();
    let rawSum = 0;
    let answeredCount = 0;

    for (const qid of questionIds) {
      const val = responses[qid];
      if (typeof val === "number" && !Number.isNaN(val)) {
        let v = val;
        if (reverseCoded.has(qid)) {
          v = scaleMax + 1 - v;
        }
        rawSum += v;
        answeredCount++;
      }
    }

    const configuredCount = questionIds.length || dim.n_questions || dim.count || 0;
    const nQuestions = answeredCount > 0 ? answeredCount : configuredCount || 1;
    const rawMax = dim.raw_max || nQuestions * scaleMax;
    const normalisedMax = dim.normalised_max || 20;
    const percentage = rawMax > 0 ? (rawSum / rawMax) * 100 : 0;
    const normalisedScore = rawMax > 0 ? (rawSum / rawMax) * normalisedMax : 0;

    const verdict = this.lookupDimensionVerdict(percentage, dim.id);

    const score: DimensionScore = {
      id: dim.id,
      name: dim.name || dim.id,
      raw_score: rawSum,
      raw_max: rawMax,
      normalised_score: Math.round(normalisedScore * 100) / 100,
      normalised_max: normalisedMax,
      percentage: Math.round(percentage * 10) / 10,
      verdict: verdict.verdict,
      verdict_meaning: verdict.meaning,
      question_count: nQuestions,
    };

    return { score, verdict, answered_count: answeredCount, configured_count: configuredCount };
  }

  private inferScaleMax(): number {
    const scale = (this.config.scale || "").toLowerCase();
    if (scale.includes("1-5") || scale.includes("5-point") || scale.includes("5 point")) return 5;
    if (scale.includes("1-7") || scale.includes("7-point")) return 7;
    if (scale.includes("1-10") || scale.includes("10-point")) return 10;
    if (scale.includes("0-4")) return 4;
    return 5;
  }

  private lookupDimensionVerdict(percentage: number, dimId: string): { verdict: string; meaning: string } {
    const verdicts = this.config.dimension_verdicts || [];
    const specific = verdicts.filter(v => v.dim && v.dim !== "all" && v.dim === dimId);
    const pool = specific.length > 0 ? specific : verdicts.filter(v => !v.dim || v.dim === "all");
    for (const v of pool) {
      const min = typeof v.min === "number" ? v.min : -Infinity;
      const max = typeof v.max === "number" ? v.max : Infinity;
      if (percentage >= min && percentage <= max) {
        return { verdict: v.verdict, meaning: v.meaning };
      }
    }
    if (verdicts.length > 0) {
      return { verdict: verdicts[0].verdict, meaning: verdicts[0].meaning };
    }
    return { verdict: "Unrated", meaning: "No verdict configuration available" };
  }

  private scoreComposite(dimensionScores: Record<string, DimensionScore>): CompositeScore {
    const dims = Object.values(dimensionScores);
    if (dims.length === 0) return { score: 0 };

    const weights = (this.config.dimensions || []).map(d => d.weight || (1 / dims.length));
    const weightsSum = weights.reduce((a, b) => a + b, 0) || 1;
    let composite = 0;

    dims.forEach((ds, i) => {
      const w = (weights[i] || (1 / dims.length)) / weightsSum;
      composite += ds.percentage * w;
    });

    composite = Math.round(composite * 10) / 10;

    const bands = (this.config.composite_bands || []) as CompositeBand[];
    let band: string | undefined;
    let interpretation: string | undefined;

    for (const b of bands) {
      if (composite >= b.min && composite <= b.max) {
        band = b.band;
        interpretation = b.interpretation;
        break;
      }
    }

    return { score: composite, band, interpretation };
  }

  private matchArchetype(dimensionScores: Record<string, DimensionScore>): {
    archetype?: MatchedArchetype;
    archetypesRanked: MatchedArchetype[];
  } {
    const archetypes = (this.config.archetypes || []) as Archetype[];
    if (archetypes.length === 0) return { archetypesRanked: [] };

    const percentages = Object.fromEntries(
      Object.entries(dimensionScores).map(([k, v]) => [k, v.percentage])
    );

    const ranked: MatchedArchetype[] = archetypes.map((arch, idx) => {
      const matchScore = this.computeArchetypeMatch(arch, percentages, idx);
      return {
        ...arch,
        id: arch.id ?? idx,
        match_score: matchScore,
      } as MatchedArchetype;
    });

    ranked.sort((a, b) => b.match_score - a.match_score);
    return { archetype: ranked[0], archetypesRanked: ranked };  }

  private computeArchetypeMatch(
    arch: Archetype,
    percentages: Record<string, number>,
    _idx: number
  ): number {
    const vals = Object.values(percentages);
    if (vals.length === 0) return 50;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);

    const hasFoundation = typeof arch.foundation === "string";
    const hasVisibility = typeof arch.visibility === "string";

    if (hasFoundation || hasVisibility) {
      const dimIds = Object.keys(percentages);
      const half = Math.ceil(dimIds.length / 2);
      const sorted = [...dimIds].sort((a, b) => percentages[b] - percentages[a]);
      const topHalfAvg = sorted.slice(0, half).reduce((a, id) => a + percentages[id], 0) / Math.max(1, half);
      const bottomHalfAvg = sorted.slice(half).reduce((a, id) => a + percentages[id], 0) / Math.max(1, dimIds.length - half);

      let score = 50;
      if (arch.foundation === "Strong") score += topHalfAvg * 0.3;
      else if (arch.foundation === "Weak") score += (100 - topHalfAvg) * 0.3;
      else score += mean * 0.15;

      if (arch.visibility === "High") score += bottomHalfAvg * 0.3;
      else if (arch.visibility === "Low") score += (100 - bottomHalfAvg) * 0.3;
      else score += mean * 0.15;

      return Math.min(100, Math.max(0, Math.round(score)));
    }

    const pseudo = 50 + (mean - 50) * 0.5 + (std - 20) * 0.5 + ((_idx % 7) - 3) * 2;
    return Math.min(100, Math.max(0, Math.round(pseudo)));
  }

  private deriveDevelopmentPriorities(
    dimensionScores: Record<string, DimensionScore>,
    _dimensionVerdicts: Record<string, { verdict: string; meaning: string }>
  ): DevelopmentPriority[] {
    const entries = Object.entries(dimensionScores)
      .map(([id, ds]) => ({ id, name: ds.name, percentage: ds.percentage }))
      .sort((a, b) => a.percentage - b.percentage);

    const result: DevelopmentPriority[] = [];
    for (let i = 0; i < Math.min(3, entries.length); i++) {
      const e = entries[i];
      let priority: "critical" | "high" | "medium" | "low";
      if (e.percentage < 40) priority = "critical";
      else if (e.percentage < 60) priority = "high";
      else if (e.percentage < 75) priority = "medium";
      else priority = "low";

      result.push({
        dimension_id: e.id,
        dimension_name: e.name,
        priority,
        rationale: `${e.name} scored ${e.percentage}% — ${priority === "critical" ? "requires immediate focused intervention" : priority === "high" ? "represents a high-impact development opportunity" : "would benefit from targeted strengthening"}.`,
      });
    }
    return result;
  }
}

export type { ScoreResult as AkiraScoreResult };
