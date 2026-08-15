import { getInstrumentMeta, getInstrumentRuntime } from "./assessmentEngine";

export type AkiraInstrumentKey = import("./assessmentEngine").InstrumentKey;

export type AssessmentTier = "intro" | "professional" | "executive";

// ── Legacy SHIFT-compatibility exports (deleted APIs replaced with Akira-backed fallbacks) ──
export type SHIFTAssessmentType = "LEAP" | "QUEST" | "DRIVE" | "COACH" | "IMPACT";
export const SHIFT_TYPES: SHIFTAssessmentType[] = ["LEAP", "QUEST", "DRIVE", "COACH", "IMPACT"];
export type SHIFTDimension = { id: string; name: string; description: string; question_count: number };
export interface SHIFTAssessmentConfig {
  type: SHIFTAssessmentType;
  name: string;
  purpose: string;
  credits: number;
  miles_cost: number;
  dimensions: SHIFTDimension[];
}
export interface SHIFTIntake {
  gate: { name: string; email: string; title?: string; company?: string; country?: string };
  context: { role: string; industry: string; years_experience: number; challenges: string; improvement_goals: string };
  dimensions: Record<string, number>;
  evidence: Record<string, string>;
  crossBorder: { cultural_experience: boolean; international_teams: number; global_projects: string };
  style: { disc_profile: "D" | "I" | "S" | "C" | null; work_style: string };
  goals: { short_term: string; long_term: string; success_definition: string };
}
export interface SHIFTAnalysisResult {
  dimension_scores: Record<string, number>;
  strengths: Array<{ strength: string; evidence: string }>;
  development_areas: Array<{ area: string; example: string }>;
  recommendations: string[];
  composite_score: number;
  archetype: string;
  confidence: number;
}
export const SHIFT_CONFIGS: Record<SHIFTAssessmentType, SHIFTAssessmentConfig> = (() => {
  const out = {} as Record<SHIFTAssessmentType, SHIFTAssessmentConfig>;
  for (const t of SHIFT_TYPES) {
    const meta = getInstrumentMeta(t);
    out[t] = {
      type: t,
      name: meta.full_name,
      purpose: meta.tagline.slice(0, 80),
      credits: meta.price_miles,
      miles_cost: meta.price_miles,
      dimensions: meta.dimensions.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.name + " — SHIFT suite dimension",
        question_count: d.question_count,
      })),
    };
  }
  return out;
})();
export interface SHIFTArchetype {
  name: string;
  description: string;
  strengths: string[];
  development: string[];
}
export const SHIFT_ARCHETYPES: Record<string, SHIFTArchetype> = (() => {
  const out: Record<string, SHIFTArchetype> = {};
  for (const t of SHIFT_TYPES) {
    const meta = getInstrumentMeta(t);
    for (const a of meta.archetypes) {
      const strengths: string[] =
        typeof (a as any).core_strength === "string" ? [(a as any).core_strength] :
        Array.isArray((a as any).strengths) ? (a as any).strengths :
        typeof a.description === "string" ? [a.description] : [];
      const development: string[] =
        Array.isArray((a as any).development) ? (a as any).development :
        typeof (a as any).development_priority === "string" ? [(a as any).development_priority] :
        [
          "Sharpen data-backed self-awareness through 360 feedback cycles",
          "Invest in targeted 90-day experiments for the weakest dimension",
          "Engage an executive coach to accelerate cross-border practice",
        ];
      out[a.name] = {
        name: a.name,
        description: typeof a.description === "string" ? a.description : "",
        strengths: strengths.slice(0, 4),
        development: development.slice(0, 4),
      };
    }
  }
  out["Balanced Leader"] = {
    name: "Balanced Leader",
    description: "Fallback cross-dimensional profile.",
    strengths: [
      "Cross-dimensional balance — no critical blind spots",
      "Contextual agility — adapts approach to situation",
      "Stable collaboration partner for peers",
    ],
    development: [
      "Identify top 2 strengths to compound as signature pillars",
      "Target weakest dimension with 90-day focused experiment",
      "Seek executive coach for cross-border mastery",
    ],
  };
  out["Strategic Builder"] = {
    name: "Strategic Builder",
    description: "Systemic thinker who designs long-horizon strategies.",
    strengths: ["Long-horizon strategic framing", "Complex systems mapping", "Trade-off discipline"],
    development: ["Tighten execution cadence", "Balance big-picture with ground-level detail", "Strengthen stakeholder co-creation"],
  };
  out["Precision Operator"] = {
    name: "Precision Operator",
    description: "Results-focused operator who delivers reliably.",
    strengths: ["Execution discipline", "Operational rigor", "Quality at pace"],
    development: ["Expand strategic framing beyond execution", "Invest in stakeholder storytelling", "Practice strategic delegation"],
  };
  out["Influential Builder"] = {
    name: "Influential Builder",
    description: "Relationship-led leader who mobilizes ecosystems.",
    strengths: ["Stakeholder mobilization", "Narrative influence", "Coalition building"],
    development: ["Add measurement rigor to relationship work", "Strengthen trade-off decision-making", "Tighten operational follow-through"],
  };
  out["Cross-Border Catalyst"] = {
    name: "Cross-Border Catalyst",
    description: "Bridges cultures, markets, and organizational silos.",
    strengths: ["Cross-cultural translation", "Multi-market perspective", "Boundary spanning"],
    development: ["Anchor impact in measurable outcomes", "Narrow prioritization from broad exposure", "Add structural rigor to cross-border plays"],
  };
  out["Adaptive Visionary"] = {
    name: "Adaptive Visionary",
    description: "Presence-led leader who inspires confident execution.",
    strengths: ["Executive presence", "Inspiring narrative", "Adaptive response under pressure"],
    development: ["Ground vision in measurable milestones", "Strengthen execution rhythm", "Deepen 1:1 coaching of direct reports"],
  };
  return out;
})();
export function getSHIFTArchetype(archetypeName: string): SHIFTArchetype {
  return SHIFT_ARCHETYPES[archetypeName] || SHIFT_ARCHETYPES["Balanced Leader"];
}
export function calculateSHIFTComposite(dimScores: Record<string, number>): number {
  const vals = Object.values(dimScores).filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!vals.length) return 0;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.max(0, Math.min(100, Math.round((sum / vals.length) * 10)));
}

export interface AkiraPricingTier {
  tier: AssessmentTier;
  name: string;
  miles_cost: number;
  features: string[];
}

export const SHARED_PRICING_TIERS: AkiraPricingTier[] = [
  {
    tier: "intro",
    name: "Executive Introduction",
    miles_cost: 99,
    features: [
      "Full 360° diagnostic across all dimensions",
      "Personalised archetype profile",
      "Dimension scorecard with verdicts",
      "Top 3 development priorities",
      "8-12 page HTML report",
    ],
  },
  {
    tier: "professional",
    name: "Professional Deep-Dive",
    miles_cost: 149,
    features: [
      "Full 360° diagnostic across all dimensions",
      "Personalised archetype profile",
      "Dimension scorecard with verdicts",
      "Top 3 development priorities",
      "8-12 page HTML report",
      "Archetype-to-mandate suitability matrix",
      "APAC-calibrated narrative interpretation",
      "Coach-ready 12-week development plan",
      "Shareable executive summary",
    ],
  },
  {
    tier: "executive",
    name: "Executive Board Brief",
    miles_cost: 199,
    features: [
      "Full 360° diagnostic across all dimensions",
      "Personalised archetype profile",
      "Dimension scorecard with verdicts",
      "Top 3 development priorities",
      "8-12 page HTML report",
      "Archetype-to-mandate suitability matrix",
      "APAC-calibrated narrative interpretation",
      "Coach-ready 12-week development plan",
      "Shareable executive summary",
      "Board-level narrative talking points",
      "Cross-dimension dynamics analysis",
      "Direct consultant debrief 30 min",
      "12-month progress retake included",
    ],
  },
];

export interface AkiraAssessmentConfig {
  key: AkiraInstrumentKey;
  tier_group: "flagship" | "shift" | "advisory";
  price_miles: number;
  name: string;
  full_name: string;
  tagline: string;
  delivery_minutes: number;
  total_questions: number;
  dimensions: { id: string; name: string; description?: string; count: number }[];
  archetypes: { name: string; description?: string }[];
  archetype_count: number;
  composite_bands: { band: string; interpretation: string }[];
}

export function getAkiraConfig(key: AkiraInstrumentKey): AkiraAssessmentConfig {
  const meta = getInstrumentMeta(key);
  const runtime = getInstrumentRuntime(key);

  const runtimeDimById = new Map<string, { description?: string }>();
  for (const d of runtime.qb_dimensions as Array<{ id: string; description?: string }>) {
    if (d && typeof d.id === "string") {
      runtimeDimById.set(d.id, { description: d.description });
    }
  }

  return {
    key,
    tier_group: meta.tier as "flagship" | "shift" | "advisory",
    price_miles: meta.price_miles,
    name: meta.instrument,
    full_name: meta.full_name,
    tagline: meta.tagline,
    delivery_minutes: meta.delivery_minutes,
    total_questions: meta.total_questions,
    dimensions: meta.dimensions.map((md: { id: string; name: string; question_count: number }) => ({
      id: md.id,
      name: md.name,
      description: runtimeDimById.get(md.id)?.description,
      count: md.question_count,
    })),
    archetypes: meta.archetypes.map((a: { name: string; description?: unknown }) => ({
      name: a.name,
      description: typeof a.description === "string" ? a.description : undefined,
    })),
    archetype_count: meta.archetype_count,
    composite_bands: meta.composite_bands.map((cb: { band: string; interpretation: string }) => ({
      band: cb.band,
      interpretation: cb.interpretation,
    })),
  };
}
