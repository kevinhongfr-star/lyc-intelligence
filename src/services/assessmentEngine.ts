import { SCORING_CONFIGS } from "./scoring";
import { QUESTION_BANKS } from "./questions";
import { AkiraScorer, type ScoreResult } from "../lib/akira/engine";
import type { InstrumentConfig, AssessmentQuestion } from "../lib/akira/types";
import * as supabaseApi from "./supabaseApi";

export const TIER_GROUP_LABELS: Record<string, string> = {
  flagship: "Flagship",
  shift: "SHIFT Suite",
  advisory: "Advisory Products",
} as const;

export const TIER_PRICE_MILES: Record<string, number> = {
  flagship: 199,
  shift: 149,
  advisory: 99,
} as const;

export type InstrumentKey = keyof typeof SCORING_CONFIGS;

export interface InstrumentMeta {
  code: InstrumentKey;
  tier: "flagship" | "shift" | "advisory";
  price_miles: number;
  instrument: string;
  full_name: string;
  b2c_name: string;
  tagline: string;
  version: string;
  total_questions: number;
  scale: string;
  delivery_minutes: number;
  dimensions: Array<{ id: string; name: string; question_count: number; raw_max?: number }>;
  dimension_verdicts: Array<{ min: number; max: number; verdict: string; meaning: string; dim?: string }>;
  composite_bands: Array<{ min: number; max: number; band: string; interpretation: string }>;
  archetypes: Array<{ id?: string | number; name: string; description?: string; ["#"]?: string; foundation?: string; visibility?: string; core_dynamic?: string; risk_if_unaddressed?: string; development_priority?: string; apac_note?: string; apac_modifier_note?: string; profile?: string; core_strength?: string; orientation?: string; mandate_band?: string; motivation_type?: string; weakest_dimension?: string; organisational_impact?: string; board_ai_fluency?: string; selling_acumen?: string; key_risk?: string; state?: string; [k: string]: unknown }>;
  archetype_count: number;
}

export interface InstrumentRuntime {
  questions: AssessmentQuestion[];
  reverse_coded_ids: string[];
  qb_dimensions: unknown[];
}

export interface ScoreOptions {
  persist?: boolean;
  userId?: string;
  pricingTier?: "intro" | "professional" | "executive";
}

export function instrumentKeyFromString(k: string): InstrumentKey {
  const key = k.toUpperCase() as InstrumentKey;
  if (!(key in SCORING_CONFIGS)) {
    throw new Error(`Unknown instrument key: ${k}`);
  }
  return key;
}

export function getInstrumentMeta(code: InstrumentKey | string): InstrumentMeta {
  const key = instrumentKeyFromString(code);
  const cfg = SCORING_CONFIGS[key];

  const tierRaw = (cfg as any).TIER;
  const tier: "flagship" | "shift" | "advisory" =
    tierRaw === "flagship" || tierRaw === "shift" || tierRaw === "advisory"
      ? tierRaw
      : "advisory";

  const price_miles = TIER_PRICE_MILES[tier];

  const rawDims: any[] = (cfg as any).DIMENSIONS || [];
  const dimensions = rawDims.map((d: any) => {
    const nQuestions =
      typeof d.n_questions === "number"
        ? d.n_questions
        : typeof d.count === "number"
        ? d.count
        : Array.isArray(d.questions)
        ? d.questions.length
        : Array.isArray(d.question_ids)
        ? d.question_ids.length
        : 0;
    return {
      id: String(d.id || ""),
      name: String(d.name || d.id || ""),
      question_count: nQuestions,
      raw_max: typeof d.raw_max === "number" ? d.raw_max : undefined,
    };
  });

  const rawArchetypes: any[] = (cfg as any).ARCHETYPES || [];
  const archetypes = rawArchetypes.map((a: any, idx: number) => ({
    ...a,
    id: a.id ?? idx,
  }));

  const composite_bands = ((cfg as any).COMPOSITE_BANDS || []).map((b: any) => ({
    min: Number(b.min ?? 0),
    max: Number(b.max ?? 100),
    band: String(b.band || ""),
    interpretation: String(b.interpretation || ""),
  }));

  const dimension_verdicts = ((cfg as any).DIMENSION_VERDICTS || []).map((v: any) => ({
    min: Number(v.min ?? 0),
    max: Number(v.max ?? 100),
    verdict: String(v.verdict || ""),
    meaning: String(v.meaning || ""),
    ...(v.dim ? { dim: String(v.dim) } : {}),
  }));

  return {
    code: key,
    tier,
    price_miles,
    instrument: String((cfg as any).INSTRUMENT || key),
    full_name: String((cfg as any).FULL_NAME || (cfg as any).INSTRUMENT || key),
    b2c_name: String((cfg as any).B2C_NAME || (cfg as any).FULL_NAME || key),
    tagline: String((cfg as any).TAGLINE || ""),
    version: String((cfg as any).VERSION || "1.0"),
    total_questions: Number((cfg as any).TOTAL_QUESTIONS || dimensions.reduce((s, d) => s + d.question_count, 0)),
    scale: String((cfg as any).SCALE || "1-5 Likert"),
    delivery_minutes: Number((cfg as any).DELIVERY_MINUTES || 10),
    dimensions,
    dimension_verdicts,
    composite_bands,
    archetypes,
    archetype_count: archetypes.length,
  };
}

export function getInstrumentRuntime(code: InstrumentKey | string): InstrumentRuntime {
  const key = instrumentKeyFromString(code);
  const bank = QUESTION_BANKS[key];
  const qbDimensions: any[] = (bank as any).dimensions || [];

  const questions: AssessmentQuestion[] = [];
  const reverseSet = new Set<string>();

  const bankReverse = (bank as any).reverse_coded_ids || [];
  for (const rid of bankReverse) reverseSet.add(rid);

  const allQuestionsFlat = (bank as any).all_questions;

  if (Array.isArray(allQuestionsFlat) && allQuestionsFlat.length > 0) {
    for (const q of allQuestionsFlat) {
      const dimFromQ = (q as any).dimension || (q as any).dimension_id;
      const nameFromQ = (q as any).dimension_name;
      const qDim = dimFromQ || findDimIdForQuestion(qbDimensions, (q as any).id) || "";
      const qName = nameFromQ || findDimNameForQuestion(qbDimensions, (q as any).id) || qDim;

      const qObj: AssessmentQuestion = {
        id: String((q as any).id || ""),
        text: String((q as any).text || (q as any).stem || (q as any).id || ""),
        type: ((q as any).type as any) || "likert",
        reverse_coded: Boolean((q as any).reverse_coded),
        dimension_id: qDim || undefined,
        dimension_name: qName || undefined,
        ...((q as any).options ? { options: (q as any).options } : {}),
        ...((q as any).scale_labels ? { scale_labels: (q as any).scale_labels } : {}),
      };
      questions.push(qObj);
      if (qObj.reverse_coded && qObj.id) reverseSet.add(qObj.id);
    }
  } else {
    for (const dim of qbDimensions) {
      const dimId = String(dim.id || "");
      const dimName = String(dim.name || dimId);
      const dimQuestions = Array.isArray(dim.questions) ? dim.questions : [];
      const dimReverse = Array.isArray(dim.reverse_coded) ? dim.reverse_coded : [];
      for (const rid of dimReverse) reverseSet.add(rid);
      for (const q of dimQuestions) {
        const qObj: AssessmentQuestion = {
          id: String((q as any).id || ""),
          text: String((q as any).text || (q as any).stem || (q as any).id || ""),
          type: ((q as any).type as any) || "likert",
          reverse_coded: Boolean((q as any).reverse_coded),
          dimension_id: dimId,
          dimension_name: dimName,
          ...((q as any).options ? { options: (q as any).options } : {}),
          ...((q as any).scale_labels ? { scale_labels: (q as any).scale_labels } : {}),
        };
        questions.push(qObj);
        if (qObj.reverse_coded && qObj.id) reverseSet.add(qObj.id);
      }
    }
  }

  return {
    questions,
    reverse_coded_ids: Array.from(reverseSet),
    qb_dimensions: qbDimensions,
  };
}

function findDimIdForQuestion(qbDimensions: any[], qid: string): string | undefined {
  for (const d of qbDimensions) {
    const qs: any[] = d.questions || [];
    if (qs.some(q => String((q as any).id) === String(qid))) return String(d.id || "");
    if (Array.isArray(d.question_ids) && d.question_ids.includes(qid)) return String(d.id || "");
  }
  return undefined;
}

function findDimNameForQuestion(qbDimensions: any[], qid: string): string | undefined {
  for (const d of qbDimensions) {
    const qs: any[] = d.questions || [];
    if (qs.some(q => String((q as any).id) === String(qid))) return String(d.name || d.id || "");
    if (Array.isArray(d.question_ids) && d.question_ids.includes(qid)) return String(d.name || d.id || "");
  }
  return undefined;
}

const LIKERT_STRING_MAP: Record<string, number> = {
  "strongly disagree": 1, "very low": 1, "never": 1, "not at all": 1, "low": 1,
  "disagree": 2, "below average": 2, "rarely": 2, "slightly low": 2,
  "neutral": 3, "average": 3, "sometimes": 3, "moderate": 3, "somewhat": 3,
  "agree": 4, "above average": 4, "often": 4, "slightly high": 4,
  "strongly agree": 5, "very high": 5, "always": 5, "exceptional": 5, "high": 5,
};

function coerceToNumericResponses(
  responses: Record<string, number | string | number[]>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(responses)) {
    if (Array.isArray(v)) continue;
    if (typeof v === "number") {
      if (!Number.isNaN(v)) out[k] = v;
      continue;
    }
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const n = Number(trimmed);
        if (!Number.isNaN(n)) out[k] = n;
        continue;
      }
      const lower = trimmed.toLowerCase();
      if (lower in LIKERT_STRING_MAP) {
        out[k] = LIKERT_STRING_MAP[lower];
        continue;
      }
      const match = lower.match(/^(\d+)/);
      if (match) {
        const n = Number(match[1]);
        if (!Number.isNaN(n)) out[k] = n;
      }
    }
  }
  return out;
}

function buildInstrumentConfigFromScoring(code: InstrumentKey): InstrumentConfig {
  const cfg: any = SCORING_CONFIGS[code];
  return {
    instrument: String(cfg.INSTRUMENT || code),
    full_name: cfg.FULL_NAME,
    version: cfg.VERSION,
    total_questions: cfg.TOTAL_QUESTIONS,
    scale: cfg.SCALE,
    delivery_minutes: cfg.DELIVERY_MINUTES,
    scoring_mode: cfg.SCORING_MODE || "weighted_average",
    dimensions: Array.isArray(cfg.DIMENSIONS) ? cfg.DIMENSIONS : [],
    composite_bands: Array.isArray(cfg.COMPOSITE_BANDS) ? cfg.COMPOSITE_BANDS : [],
    dimension_verdicts: Array.isArray(cfg.DIMENSION_VERDICTS) ? cfg.DIMENSION_VERDICTS : undefined,
    archetypes: Array.isArray(cfg.ARCHETYPES) ? cfg.ARCHETYPES : undefined,
    ...(cfg.engagement_risk ? { engagement_risk: cfg.engagement_risk } : {}),
  };
}

export async function scoreAssessment(
  code: InstrumentKey | string,
  responses: Record<string, number | string | number[]>,
  opts: ScoreOptions = {}
): Promise<
  | { ok: true; meta: InstrumentMeta; result: ScoreResult; persisted_id?: string }
  | { ok: false; error: string }
> {
  try {
    const key = instrumentKeyFromString(code);
    const meta = getInstrumentMeta(key);
    const numericResponses = coerceToNumericResponses(responses);

    // All instruments — including CPI (B2C v1 single-rater port, X2-1) —
    // flow through the deterministic Akira engine. The legacy random
    // scoreLegacyCPI was removed; CPI now uses the same scoring path as
    // every other hero assessment.
    const config = buildInstrumentConfigFromScoring(key);
    const scorer = new AkiraScorer(config);
    const result: ScoreResult = scorer.score(numericResponses);

    let persisted_id: string | undefined;
    if (opts.persist) {
      try {
        const sb = supabaseApi.getSupabase();
        const insertPayload: Record<string, unknown> = {
          instrument_code: key,
          responses_json: responses,
          dimension_scores_json: result.dimension_scores,
          composite_json: result.composite,
          archetype_json: result.archetype || null,
          development_priorities_json: result.development_priorities,
        };
        if (opts.userId) insertPayload.user_id = opts.userId;
        if (opts.pricingTier) insertPayload.pricing_tier = opts.pricingTier;
        insertPayload.miles_cost = meta.price_miles;

        const { data, error } = await sb
          .from("assessment_results")
          .insert([insertPayload])
          .select("id")
          .maybeSingle();

        if (error) {
          console.warn("[assessmentEngine] persist insert failed:", error.message);
        } else if (data && typeof (data as any).id === "string") {
          persisted_id = (data as any).id;
        }
      } catch (persistErr: unknown) {
        const msg = persistErr instanceof Error ? persistErr.message : String(persistErr);
        console.warn("[assessmentEngine] persist threw (graceful degrade):", msg);
      }
    }

    return { ok: true, meta, result, persisted_id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export const INSTRUMENT_KEYS: InstrumentKey[] = Object.keys(SCORING_CONFIGS) as InstrumentKey[];

export const INSTRUMENTS_BY_TIER: Record<"flagship" | "shift" | "advisory", InstrumentKey[]> = {
  flagship: [],
  shift: [],
  advisory: [],
};

for (const k of INSTRUMENT_KEYS) {
  const meta = getInstrumentMeta(k);
  INSTRUMENTS_BY_TIER[meta.tier].push(k);
}

export interface CrossBorderTierInfo {
  label: string;
  color: string;
  interpretation: string;
}

export function getCrossBorderTier(composite: number): CrossBorderTierInfo {
  if (composite >= 80) return { label: "Elite", color: "#22C55E", interpretation: "Cross-border mastery demonstrated." };
  if (composite >= 65) return { label: "Advanced", color: "#3B82F6", interpretation: "Strong cross-border aptitude with nuanced room for growth." };
  if (composite >= 50) return { label: "Established", color: "#EAB308", interpretation: "Competent baseline; targeted coaching will compound." };
  return { label: "Developing", color: "#F43F5E", interpretation: "Foundational cross-border readiness — start with exposure experiences." };
}

// ═══════════════════════════════════════════════════════════════
// LEGACY BACKWARD-COMPAT EXPORTS (Phase 12 CPD/SHIFT — fallback shims, Akira is source of truth)
// These support old UI wizard / results components. Do NOT use for new code.
// ═══════════════════════════════════════════════════════════════

export type DimensionId = "strategic_orientation" | "cross_border_adaptability" | "stakeholder_influence" | "execution_discipline" | "leadership_presence";
export type CPDArchetype =
  | "Strategic Architect"
  | "Precision Operator"
  | "Influential Builder"
  | "Adaptive Visionary"
  | "Grounded Executor"
  | "Cross-Border Catalyst"
  | "Balanced Leader";

export type AssessmentState =
  | "intake"
  | "scenarios"
  | "style"
  | "cross_border"
  | "scoring"
  | "results";

export type WritingStyle = "Academic" | "Executive" | "Storyteller" | "Data-Driven";

export interface CPDScenario {
  id: string;
  dimension: DimensionId;
  prompt: string;
  options: { label: string; value: 1 | 2 | 3 | 4 | 5; archetype_bias?: CPDArchetype }[];
}

export const CPD_SCENARIOS: CPDScenario[] = [
  {
    id: "sc1",
    dimension: "strategic_orientation",
    prompt: "Your division is given a new 3-year mandate. The board wants both growth and margin expansion.",
    options: [
      { label: "Define three strategic pillars with measurable guardrails before execution.", value: 5, archetype_bias: "Strategic Architect" },
      { label: "Frame a bold vision and empower direct reports to design the path.", value: 4, archetype_bias: "Adaptive Visionary" },
      { label: "Start with a 90-day execution sprint and refine from data.", value: 3, archetype_bias: "Precision Operator" },
      { label: "Interview key stakeholders to co-create the mandate together.", value: 4, archetype_bias: "Influential Builder" },
    ],
  },
  {
    id: "sc2",
    dimension: "execution_discipline",
    prompt: "A critical cross-functional project is slipping on timeline and quality.",
    options: [
      { label: "Reset the plan with weekly tracking, owners, and clear milestones.", value: 5, archetype_bias: "Precision Operator" },
      { label: "Hold a team workshop to rebuild commitments collaboratively.", value: 3, archetype_bias: "Influential Builder" },
      { label: "Escalate the two biggest blockers to stakeholders personally.", value: 4, archetype_bias: "Cross-Border Catalyst" },
      { label: "Revisit the success metrics and narrow the scope.", value: 4, archetype_bias: "Strategic Architect" },
    ],
  },
  {
    id: "sc3",
    dimension: "stakeholder_influence",
    prompt: "A sceptical regional leader must approve your budget proposal this week.",
    options: [
      { label: "Tailor a one-page story to their incentives, then a short call.", value: 5, archetype_bias: "Influential Builder" },
      { label: "Send a data-heavy deck with supporting evidence.", value: 3, archetype_bias: "Precision Operator" },
      { label: "Find a peer they trust to warm the relationship first.", value: 4, archetype_bias: "Cross-Border Catalyst" },
      { label: "Anchor the proposal in the board's latest strategic themes.", value: 4, archetype_bias: "Strategic Architect" },
    ],
  },
  {
    id: "sc4",
    dimension: "leadership_presence",
    prompt: "You need to inspire a nervous team the day after a tough reorganisation.",
    options: [
      { label: "Acknowledge uncertainty, share a clear narrative, and invite questions.", value: 5, archetype_bias: "Adaptive Visionary" },
      { label: "Lay out the concrete next 30 days to restore confidence.", value: 4, archetype_bias: "Grounded Executor" },
      { label: "Run small-team listening sessions before company-wide messaging.", value: 4, archetype_bias: "Influential Builder" },
      { label: "Frame it as a strategic inflection point with clear upside.", value: 4, archetype_bias: "Strategic Architect" },
    ],
  },
  {
    id: "sc5",
    dimension: "cross_border_adaptability",
    prompt: "Your HQ decision is being resisted strongly by an APAC market team.",
    options: [
      { label: "Fly in, listen first, and adapt the decision to their operating reality.", value: 5, archetype_bias: "Cross-Border Catalyst" },
      { label: "Share the context behind the decision and ask for a 90-day trial.", value: 3, archetype_bias: "Grounded Executor" },
      { label: "Map their incentives and rebuild the proposal around their KPIs.", value: 4, archetype_bias: "Influential Builder" },
      { label: "Escalate to regional leadership for alignment.", value: 2, archetype_bias: "Precision Operator" },
    ],
  },
];

export const CROSS_BORDER_QUESTIONS: Array<{ id: string; prompt: string; scale_low: string; scale_high: string; question: string; options: Array<{ label: string; score: number }> }> = [
  {
    id: "cb_read_1",
    prompt: "How familiar are you with employment regulations in APAC markets?",
    scale_low: "Little exposure", scale_high: "Deep practitioner knowledge",
    question: "How familiar are you with employment regulations in APAC markets?",
    options: [
      { label: "Little exposure — mostly HQ-centric regulations", score: 1 },
      { label: "Basic awareness of a single market", score: 2 },
      { label: "Working familiarity with 2-3 APAC markets", score: 3 },
      { label: "Strong practitioner knowledge across 4+ markets", score: 4 },
      { label: "Deep, advisory-grade expertise across APAC", score: 5 },
    ],
  },
  {
    id: "cb_read_2",
    prompt: "How experienced are you at managing cross-border virtual teams?",
    scale_low: "No experience", scale_high: "Daily leadership across 3+ markets",
    question: "How experienced are you at managing cross-border virtual teams?",
    options: [
      { label: "No cross-border virtual team experience", score: 1 },
      { label: "Occasional contributor to a cross-border team", score: 2 },
      { label: "Lead one virtual cross-border team regularly", score: 3 },
      { label: "Lead multiple cross-border teams across 2-3 markets", score: 4 },
      { label: "Daily executive leadership across 3+ APAC/global markets", score: 5 },
    ],
  },
  {
    id: "cb_read_3",
    prompt: "How often do you adapt your communication style to cultural norms?",
    scale_low: "Rarely", scale_high: "Systematically and intuitively",
    question: "How often do you adapt your communication style to cultural norms?",
    options: [
      { label: "Rarely — one standard communication style", score: 1 },
      { label: "Occasionally, when explicitly prompted", score: 2 },
      { label: "Regularly in cross-border interactions", score: 3 },
      { label: "Proactively across most cross-border situations", score: 4 },
      { label: "Systematically and intuitively, second nature", score: 5 },
    ],
  },
  {
    id: "cb_read_4",
    prompt: "How comfortable are you with ambiguity in multi-market execution?",
    scale_low: "Highly uncomfortable", scale_high: "Operate with ease under uncertainty",
    question: "How comfortable are you with ambiguity in multi-market execution?",
    options: [
      { label: "Highly uncomfortable — require clear plans", score: 1 },
      { label: "Tolerate ambiguity but prefer structure", score: 2 },
      { label: "Comfortable operating under reasonable ambiguity", score: 3 },
      { label: "Perform strongly under ambiguity and complexity", score: 4 },
      { label: "Operate with ease under high uncertainty across markets", score: 5 },
    ],
  },
  {
    id: "cb_read_5",
    prompt: "Rate your cross-border stakeholder network depth.",
    scale_low: "Local network only", scale_high: "Dense, trust-rich multi-market relationships",
    question: "Rate your cross-border stakeholder network depth.",
    options: [
      { label: "Local network only — no cross-border relationships", score: 1 },
      { label: "Some cross-border acquaintances, low trust depth", score: 2 },
      { label: "Working cross-border relationships in 1-2 markets", score: 3 },
      { label: "Strong stakeholder relationships across 3+ markets", score: 4 },
      { label: "Dense, trust-rich, executive-grade network across APAC/global", score: 5 },
    ],
  },
];

export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  strategic_orientation: 0.22,
  cross_border_adaptability: 0.20,
  stakeholder_influence: 0.20,
  execution_discipline: 0.20,
  leadership_presence: 0.18,
};

export const DIMENSION_INFO: Record<DimensionId, { name: string; description: string; low: string; high: string }> = {
  strategic_orientation: { name: "Strategic Orientation", description: "Long-horizon framing and trade-off discipline.", low: "Tactical / reactive", high: "Architectural / future-back" },
  cross_border_adaptability: { name: "Cross-Border Adaptability", description: "Agility across cultures, markets, and structures.", low: "Local / homogeneous", high: "Global / boundary-spanning" },
  stakeholder_influence: { name: "Stakeholder Influence", description: "Mobilizing ecosystem actors without formal authority.", low: "Self-reliant", high: "Coalition-building" },
  execution_discipline: { name: "Execution Discipline", description: "Reliable delivery through structure and cadence.", low: "Unstructured", high: "Disciplined operator" },
  leadership_presence: { name: "Leadership Presence", description: "Composure, narrative, and inspiration under pressure.", low: "Background operator", high: "Visible executive presence" },
};

export const ARCHETYPE_INFO: Record<CPDArchetype, { name: CPDArchetype; tagline: string; description: string; strengths: string[]; development: string[]; color: string }> = {
  "Strategic Architect": {
    name: "Strategic Architect",
    tagline: "Designs the playing field.",
    description: "Systemic thinker with future-back orientation and trade-off discipline.",
    strengths: ["Long-horizon strategy", "Complex systems mapping", "Trade-off rigor"],
    development: ["Tighten execution cadence", "Ground ideas in ground-level detail", "Strengthen co-creation with stakeholders"],
    color: "#6366F1",
  },
  "Precision Operator": {
    name: "Precision Operator",
    tagline: "Delivers reliably at pace.",
    description: "Results-focused operator with quality and cadence discipline.",
    strengths: ["Execution discipline", "Operational rigor", "Consistent quality"],
    development: ["Expand strategic framing", "Invest in stakeholder storytelling", "Practice strategic delegation"],
    color: "#3B82F6",
  },
  "Influential Builder": {
    name: "Influential Builder",
    tagline: "Mobilizes the ecosystem.",
    description: "Relationship-led leader who coalitions and aligns actors across boundaries.",
    strengths: ["Stakeholder mobilization", "Narrative influence", "Coalition building"],
    development: ["Add measurement rigor", "Strengthen decision trade-offs", "Tighten operational follow-through"],
    color: "#10B981",
  },
  "Adaptive Visionary": {
    name: "Adaptive Visionary",
    tagline: "Inspires confident execution.",
    description: "Presence-led leader with strong narrative and composure under pressure.",
    strengths: ["Executive presence", "Inspiring narrative", "Grace under fire"],
    development: ["Ground vision in milestones", "Strengthen execution rhythm", "Deepen 1:1 coaching"],
    color: "#8B5CF6",
  },
  "Grounded Executor": {
    name: "Grounded Executor",
    tagline: "Pragmatic delivery anchor.",
    description: "No-nonsense operator who translates strategy into trackable milestones.",
    strengths: ["Translation to action", "Pragmatic prioritization", "Reliable delivery"],
    development: ["Elevate strategic framing", "Invest in stakeholder presence", "Expand cross-border exposure"],
    color: "#0D9488",
  },
  "Cross-Border Catalyst": {
    name: "Cross-Border Catalyst",
    tagline: "Bridges markets and cultures.",
    description: "Boundary-spanning leader who translates across cultures, markets, and silos.",
    strengths: ["Cross-cultural translation", "Multi-market perspective", "Boundary spanning"],
    development: ["Anchor impact in measurable outcomes", "Narrow prioritization from exposure", "Add structural rigor"],
    color: "#EC4899",
  },
  "Balanced Leader": {
    name: "Balanced Leader",
    tagline: "Cross-dimensional balance.",
    description: "No critical blind spots — strong adaptive baseline across all dimensions.",
    strengths: ["Balance across all dimensions", "Contextual agility", "Stable collaboration"],
    development: ["Identify 2 signature strengths to compound", "Target weakest dimension over 90 days", "Hire executive coach for leverage"],
    color: "#C108AB",
  },
};

// Legacy ASSESSMENT_ENGINE object — wraps existing helpers for old UIs
export const ASSESSMENT_ENGINE = {
  calculateDimensionScore: (dimId: string, responses: Record<string, number | string | number[]>): number => {
    const numericResponses: Record<string, number> = {};
    for (const [k, v] of Object.entries(responses)) {
      if (typeof v === "number") numericResponses[k] = v;
      else if (Array.isArray(v)) numericResponses[k] = v[0] ?? 3;
      else numericResponses[k] = 3;
    }
    const values = Object.values(numericResponses).filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (!values.length) return 60;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const raw = Math.round(avg * 20);
    return Math.max(0, Math.min(100, raw));
  },
  getDimensionScores: (dimValues: Partial<Record<DimensionId, number>>): Record<DimensionId, number> => {
    const ALL_DIMS: DimensionId[] = ["strategic_orientation", "cross_border_adaptability", "stakeholder_influence", "execution_discipline", "leadership_presence"];
    const out = {} as Record<DimensionId, number>;
    for (const d of ALL_DIMS) {
      const v = dimValues[d];
      if (typeof v === "number" && !Number.isNaN(v)) {
        out[d] = Math.max(0, Math.min(100, Math.round(v * 10)));
      } else {
        out[d] = 60;
      }
    }
    return out;
  },
  calculateCrossBorderScore: (cbAnswers: Record<string, number>): number => {
    const vals = Object.values(cbAnswers).filter((v) => typeof v === "number");
    if (!vals.length) return 60;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.max(0, Math.min(100, Math.round(avg * 20)));
  },
  getCompositeScore: (dimScores: Record<DimensionId, number>, crossBorderScore?: number): number => {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const d of Object.keys(dimScores) as DimensionId[]) {
      const w = typeof DIMENSION_WEIGHTS[d] === "number" ? DIMENSION_WEIGHTS[d] : 0.2;
      weightedSum += (dimScores[d] || 0) * w;
      totalWeight += w;
    }
    const base = totalWeight > 0 ? weightedSum / totalWeight : 50;
    if (typeof crossBorderScore === "number") {
      return Math.max(0, Math.min(100, Math.round(base * 0.8 + crossBorderScore * 0.2)));
    }
    return Math.max(0, Math.min(100, Math.round(base)));
  },
  getArchetype: (dimScores: Record<DimensionId, number>, _crossBorderScore?: number): CPDArchetype => {
    const entries = Object.entries(dimScores).sort((a, b) => b[1] - a[1]) as [DimensionId, number][];
    const top = entries[0]?.[0] || "strategic_orientation";
    const second = entries[1]?.[0] || "execution_discipline";
    if (top === "strategic_orientation") return "Strategic Architect";
    if (top === "execution_discipline") return "Precision Operator";
    if (top === "stakeholder_influence") return second === "cross_border_adaptability" ? "Cross-Border Catalyst" : "Influential Builder";
    if (top === "cross_border_adaptability") return "Cross-Border Catalyst";
    if (top === "leadership_presence") return second === "strategic_orientation" ? "Adaptive Visionary" : "Grounded Executor";
    return "Balanced Leader";
  },
  getCrossBorderTier,
  ARCHETYPE_INFO,
  DIMENSION_INFO,
};
