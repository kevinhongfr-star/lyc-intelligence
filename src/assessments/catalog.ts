import { SCORING_CONFIGS } from "@/services/scoring/index";
import { QUESTION_BANKS } from "@/services/questions/index";

export type InstrumentTierGroup = "flagship" | "shift" | "advisory";
export type PricingTier = "intro" | "professional" | "executive";

export interface AssessmentPricing {
  tier: PricingTier;
  name: string;
  miles_cost: number;
  features: string[];
}

export interface AssessmentDimension {
  id: string;
  name: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  question_count: number;
}

export interface AssessmentStyle {
  id: string;
  name: string;
  description: string;
}

export interface AssessmentArchetype {
  name: string;
  description: string;
  traits: string[];
}

export interface AssessmentInfo {
  code: string;
  name: string;
  b2cName: string;
  tagline: string;
  tierGroup: InstrumentTierGroup;
  tierLabel: string;
  priceMiles: number;
  pricing: AssessmentPricing[];
  duration_minutes: number;
  total_questions: number;
  scale: string;
  version: string;
  dimensions: AssessmentDimension[];
  archetypes: AssessmentArchetype[];
  compositeBands: { band: string; interpretation: string }[];
  is_cpi?: boolean;
  is_shift?: boolean;
  is_advisory?: boolean;
  style_count: number;
  archetype_count: number;
}

export const SHARED_PRICING_TIERS: AssessmentPricing[] = [
  {
    tier: "intro",
    name: "Executive Introduction",
    miles_cost: 99,
    features: [
      "Full instrument assessment",
      "PDF report download",
      "Dimension scorecard",
      "Archetype identification",
      "Composite band interpretation",
    ],
  },
  {
    tier: "professional",
    name: "Professional Deep-Dive",
    miles_cost: 149,
    features: [
      "Everything in Executive Introduction",
      "Development roadmap generation",
      "Comparative benchmark percentiles",
      "Priority gap analysis",
      "NEXUS AI coaching session (30 min)",
    ],
  },
  {
    tier: "executive",
    name: "Executive Advisory",
    miles_cost: 249,
    features: [
      "Everything in Professional Deep-Dive",
      "Consultant-matched 1:1 debrief",
      "Custom development plan",
      "Board-readiness assessment",
      "APAC market context overlay",
    ],
  },
];

export const TIER_GROUP_LABELS: Record<InstrumentTierGroup, string> = {
  flagship: "Leadership",
  shift: "Leadership",
  advisory: "Leadership Assessments",
};

const FLAGSHIP_PRICING: AssessmentPricing[] = [
  {
    tier: "intro",
    name: "Executive Introduction",
    miles_cost: 199,
    features: [
      "Full CPI assessment with scenario-based evidence",
      "PDF report download",
      "5-dimension scorecard with APAC benchmarks",
      "Archetype identification",
      "Composite band interpretation",
      "Validated against 20 years of APAC placement data",
    ],
  },
  {
    tier: "professional",
    name: "Professional Deep-Dive",
    miles_cost: 299,
    features: [
      "Everything in Executive Introduction",
      "Development roadmap generation",
      "Comparative APAC benchmark percentiles",
      "Priority gap analysis",
      "NEXUS AI coaching session (30 min)",
    ],
  },
  {
    tier: "executive",
    name: "Executive Advisory",
    miles_cost: 399,
    features: [
      "Everything in Professional Deep-Dive",
      "Senior consultant-matched 1:1 debrief",
      "Custom positioning & narrative development plan",
      "Board-readiness assessment",
      "APAC cross-border context overlay",
    ],
  },
];

function dimDescription(instrument: string, dimId: string, dimName: string): string {
  const key = `${instrument}:${dimId}`;
  const map: Record<string, string> = {
    "CPI:D1": "How clearly you articulate long-term strategic direction, connect initiatives to organizational purpose, and make trade-offs aligned with a coherent strategic model.",
    "CPI:D2": "Your ability to operate effectively across cultural contexts, adapt communication and decision-making styles to diverse markets, and manage cross-border stakeholder dynamics.",
    "CPI:D3": "How skillfully you align diverse stakeholder groups, build buy-in across competing interests, and influence outcomes without relying on positional authority alone.",
    "CPI:D4": "Your consistency in translating strategy into results, managing execution rigor, removing bottlenecks, and building accountability cultures that deliver predictably.",
    "CPI:D5": "How you show up as an executive leader — your ability to command rooms authentically, build trust, project confidence under uncertainty, and inspire through presence rather than position.",
    "PRISM:D1": "How clearly you articulate your distinct professional value and positioning to boards and search firms. Strong brand clarity means the market understands what you're known for without explanation.",
    "PRISM:D2": "How readily decision-makers can find, understand, and assess your professional profile. Market legibility measures whether your capability is visible to the audiences that hire you.",
    "PRISM:D3": "How consistently your professional identity shows up across channels, interactions, and contexts. Identity consistency reduces friction when stakeholders encounter you in different settings.",
    "PRISM:D4": "How compellingly your career story communicates your value. Narrative power measures whether your achievements are framed to create differentiation and urgency in the market.",
    "PRISM:D5": "How actively you are seen and referenced by decision-makers in your target market. Visibility level measures whether advocates are promoting you in rooms you are not present in.",
    "SPARK:D1": "How deeply and consistently AI tools are part of your personal executive workflow. Individual AI Adoption Readiness gauges whether you are using AI in your own day-to-day decision-making and output.",
    "SPARK:D2": "How aware you are of AI capabilities being deployed across your organization and bilateral ecosystem. Capability Exposure Assessment measures whether you understand where AI is already changing work around you.",
    "SPARK:D3": "Whether your organization has the governance, data infrastructure, and investment posture to support AI adoption systematically. Organisational Preparedness gauges structural readiness beyond individual use.",
    "LEAP:Positioning": "How clearly you can articulate what differentiates you from peers in your field. Positioning measures whether you have a defined professional value proposition that the market can recognise.",
    "LEAP:Proof": "Whether you have documented, measurable achievements that demonstrate impact beyond responsibilities. Proof measures whether your track record is evidence-backed rather than anecdotal.",
    "LEAP:Visibility": "How actively decision-makers in your target organisations are aware of your capabilities. Visibility measures whether you are on the radar of people who can create the roles you want.",
    "LEAP:Move": "Whether you have a clear next-career vision and are actively preparing for it. Move measures transition readiness — planning, upskilling, and confidence to execute the step.",
    "LEAP:Alignment": "How well your current role, organisation, and career direction match your behavioral strengths and personal values. Alignment measures sustainability and motivational fit.",
    "QUEST:D1": "Your ability to set direction, recognise patterns across horizons, and translate strategic intent into actionable priorities. Strategic Thinking is the executive capability to shape the future, not just react to it.",
    "QUEST:D2": "How consistently you convert strategy into results through organisational design, accountability structure, and performance visibility. Execution Excellence measures delivery discipline at scale.",
    "QUEST:D3": "Your understanding of value creation mechanics, financial literacy, and commercial judgment under uncertainty. Commercial Acumen gauges whether you make decisions grounded in P&L reality.",
    "QUEST:D4": "How effectively you design teams, develop succession, and make high-stakes people decisions. People Leadership measures whether you build capability, not just deliver through others.",
    "QUEST:D5": "Your tolerance for ambiguity, ability to pivot when context changes, and track record of adapting during market shifts. Adaptive Capacity gauges how you perform when the playbook stops working.",
    "QUEST:D6": "Whether you have the decision structure, data governance awareness, and AI ethics oversight required for board-level AI accountability. AI Readiness measures your governance fluency.",
    "IMPACT:D1": "How effectively you contribute to strategy formulation at the board level, challenging management proposals and framing the strategic conversation rather than ratifying it.",
    "IMPACT:D2": "Your rigor on process, fiduciary duties, compliance, and governance mechanics. Governance Rigour measures whether you protect the institution while enabling progress.",
    "IMPACT:D3": "How well you read stakeholder ecosystems, manage boardroom dynamics, and build relationships that create influence beyond formal authority. Stakeholder Intelligence measures relational governance capability.",
    "IMPACT:D4": "Whether you think about lasting institutional value, not just short-term decisions. Mandate Legacy measures the degree to which you build boards that outlive your tenure.",
    "IMPACT:D5": "Your credibility specifically in APAC governance contexts, including regulatory awareness, cultural fluency, and relationship capital with APAC-native stakeholders.",
    "FORGE:D1": "Whether you actively seek operating contexts that stretch your capabilities and integrate feedback that challenges your existing mental models. Adaptive Learning Orientation gauges whether you grow when it matters most.",
    "FORGE:D2": "How aware you are of the three structural forces shaping bilateral operating contexts: AI capability asymmetry, tempo gap acceleration, and governance & succession decisions. Three Forces Awareness measures system-level thinking.",
    "FORGE:D3": "Whether you take structured, deliberate ownership of your development rather than waiting for your organisation to provide it. Development Agency measures how actively you close your own capability gaps.",
    "FORGE:D4": "How effectively you lead in bilateral contexts where authority is ambiguous, counterpart capability varies, and multiple concurrent leadership challenges operate simultaneously. Bilateral Context Management gauges operating leadership in partnership environments.",
    "DRIVE:D1": "Your motivation derived from the work itself — curiosity, craft, autonomy, flow state frequency, and intrinsic task engagement. Intrinsic Motivation measures whether you are fueled by the substance of what you do.",
    "DRIVE:D2": "Your responsiveness to external motivators — recognition, visibility, rewards, progression, and peer benchmarking. Extrinsic Motivation measures whether external signals activate or sustain your drive.",
    "DRIVE:D3": "How congruent your personal values, sense of purpose, and ethical model are with your current role and organisation. Values Alignment measures whether you can sustain commitment long-term.",
    "DRIVE:D4": "Your belief in your own capability to perform under pressure, adapt to challenges, and deliver in your specific role context. Confidence & Self-Efficacy measures whether you act when conditions are uncertain.",
    "DRIVE:D5": "Whether you actively seek development, prefer challenging contexts, and have an appetite for new learning curves. Growth Orientation measures whether you will outgrow your current mandate or plateau in it.",
    "COACH:D1": "Whether you invest as deliberately in developing counterparts outside your reporting line as you do in your own team. Cross-Boundary Developmental Orientation gauges whether development thinking stops at organisational boundaries.",
    "COACH:D2": "How flexibly you apply different coaching approaches, adjusting directness, tone, and structure based on the specific counterpart and context. Adaptive Coaching Style measures whether you have more than one gear.",
    "COACH:D3": "The quality of trust you build in developmental relationships — your ability to hold counterparts accountable, sustain trust through difficulty, and re-engage after setbacks. Developmental Relationship Quality measures trust depth.",
    "COACH:D4": "Whether you can maintain a coaching stance when the partnership is under performance pressure, authority is ambiguous, or structural constraints make coaching difficult. Coaching Under Constraints gauges reliability when it matters most.",
    "BRIDGE:D1": "How specific and detailed your understanding is of what your APAC mandate actually requires — beyond the job description to the real stakeholder expectations, organisational history, and make-or-break priorities.",
    "BRIDGE:D2": "Your structured approach to mapping stakeholders, building informal relationships, managing power dynamics, and managing government or political connections in APAC contexts.",
    "BRIDGE:D3": "How effectively you adapt your natural communication style to high-context APAC environments, read silence and indirection, check for alignment, and deliver difficult messages without destroying relationships.",
    "BRIDGE:D4": "Whether you can sustain performance and focus through extended periods of multi-directional pressure — from headquarters, local teams, political stakeholders, and crises. Pressure Resilience measures durability in the APAC mandate.",
    "BRIDGE:D5": "Your comfort investing in 3–5 year trust-building cycles, resisting short-term pressure for quick wins, and making decisions that protect long-term relationship capital even when it creates quarterly friction.",
    "BRIDGE:D6": "Your current, specific understanding of cultural norms, decision-making processes, and relationship protocols in your target APAC market — plus a track record of learning from missteps rather than defending them.",
    "MOSAIC:D1": "How well you understand and manage institutional dynamics in cross-border partnerships — including contractual versus relational enforcement, AI adoption asymmetry between partners, and how bilateral institutional trust actually operates.",
    "MOSAIC:D2": "How quickly you can establish working trust in new cross-border contexts, adapt relationship-building for different institutional environments, and maintain relationship quality through interruptions.",
    "MOSAIC:D3": "Your ability to read and operate within unstated normative expectations in different institutional contexts — and to make decisions that meet local normative standards even when they differ from your default approach.",
    "MOSAIC:D4": "How effectively you distinguish between interpersonal, institutional, and capability-asymmetry conflicts in cross-border partnerships — and whether you address root causes or just manage symptoms.",
  };
  return map[key] || `Measures ${dimName.toLowerCase()} as a core dimension of the ${instrument} instrument.`;
}

function getVerdictLabels(dimensionVerdicts: any[]): { lowLabel: string; highLabel: string } {
  if (!dimensionVerdicts || dimensionVerdicts.length === 0) {
    return { lowLabel: "Gap", highLabel: "Strong" };
  }
  const sorted = [...dimensionVerdicts].sort((a, b) => (a.min ?? 0) - (b.min ?? 0));
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const lowLabel = lowest?.verdict || lowest?.label || "Gap";
  const highLabel = highest?.verdict || highest?.label || "Strong";
  return { lowLabel, highLabel };
}

function buildArchetypeTraits(instrument: string, archetype: any): string[] {
  const traits: string[] = [];
  switch (instrument) {
    case "PRISM":
      if (archetype.foundation && archetype.visibility) {
        traits.push(`${archetype.foundation} Foundation × ${archetype.visibility} Visibility`);
      }
      if (archetype["#"]) traits.push(`Archetype #${archetype["#"]}`);
      if (archetype.risk_if_unaddressed) traits.push(`Risk: ${String(archetype.risk_if_unaddressed).slice(0, 60)}`);
      break;
    case "SPARK":
      if (archetype.board_ai_fluency) traits.push(`Board AI Fluency: ${archetype.board_ai_fluency}`);
      if (archetype.governance_maturity) traits.push(`Governance Maturity: ${archetype.governance_maturity}`);
      if (archetype.core_pattern) traits.push(`Pattern: ${String(archetype.core_pattern).slice(0, 60)}`);
      break;
    case "LEAP":
      if (archetype.disc_primary) traits.push(`DISC Primary: ${archetype.disc_primary}`);
      if (archetype.cr_band) traits.push(`CR Band: ${archetype.cr_band}`);
      if (archetype.prism_parent) traits.push(`PRISM Parent: ${archetype.prism_parent}`);
      break;
    case "QUEST":
      if (archetype["#"]) traits.push(`Profile #${archetype["#"]}`);
      if (archetype.profile) traits.push(String(archetype.profile).slice(0, 70));
      if (archetype.key_risk) traits.push(`Key Risk: ${String(archetype.key_risk).slice(0, 60)}`);
      break;
    case "IMPACT":
      if (archetype.orientation) traits.push(`Orientation: ${archetype.orientation}`);
      if (archetype.mandate_band) traits.push(`Mandate Band: ${archetype.mandate_band}`);
      if (archetype["#"]) traits.push(`Profile #${archetype["#"]}`);
      break;
    case "FORGE":
      if (archetype.selling_acumen) traits.push(`Selling Acumen: ${archetype.selling_acumen}`);
      if (archetype.system_leadership) traits.push(`System Leadership: ${archetype.system_leadership}`);
      if (archetype.core_pattern) traits.push(`Pattern: ${String(archetype.core_pattern).slice(0, 60)}`);
      break;
    case "DRIVE":
      if (archetype.motivation_type) traits.push(`Motivation Type: ${archetype.motivation_type}`);
      if (archetype.state) traits.push(`State: ${archetype.state}`);
      if (archetype.pattern) traits.push(`Pattern: ${String(archetype.pattern).slice(0, 60)}`);
      break;
    case "COACH":
      if (archetype.profile) traits.push(String(archetype.profile).slice(0, 70));
      if (archetype.organisational_impact) traits.push(`Org Impact: ${String(archetype.organisational_impact).slice(0, 60)}`);
      break;
    case "BRIDGE":
      if (archetype.weakest_dimension) traits.push(`Weakest Dim: ${archetype.weakest_dimension}`);
      if (archetype["#"]) traits.push(`Profile #${archetype["#"]}`);
      if (archetype.risk_layer) traits.push(String(archetype.risk_layer).slice(0, 60));
      break;
    case "MOSAIC":
      if (archetype.profile) traits.push(String(archetype.profile).slice(0, 70));
      if (archetype.organisational_impact) traits.push(`Org Impact: ${String(archetype.organisational_impact).slice(0, 60)}`);
      break;
    case "CPI":
      if (archetype.description) traits.push(String(archetype.description).slice(0, 70));
      if (archetype.id) traits.push(`Archetype ${archetype.id}`);
      break;
    default:
      if (archetype.description) traits.push(String(archetype.description).slice(0, 70));
  }
  return traits.slice(0, 3);
}

function getArchetypeDescription(archetype: any): string {
  return (
    archetype.description ||
    archetype.core_dynamic ||
    archetype.core_strength ||
    archetype.narrative ||
    archetype.core_pattern ||
    (archetype.traits && archetype.traits[0]) ||
    (archetype as any).canonName ?? archetype.name ||
    ""
  );
}

function filterArchetypes(instrument: string, archetypes: any[]): any[] {
  const axes = new Set(["Axis 1", "Axis 2"]);
  return archetypes.filter((a) => !axes.has(a.name));
}

// ── Batch A #1387 — all 11 assessments in catalog (single source of truth).
// Hero lineup per Kevin's decision: CPI (flagship), LEAP, SPARK, IMPACT.
// Nav/catalog: PRISM, BRIDGE, DRIVE, FORGE, MOSAIC, COACH, QUEST.
const INSTRUMENT_ORDER = [
  "CPI", "LEAP", "SPARK", "IMPACT",      // Hero (featured)
  "PRISM", "BRIDGE", "DRIVE", "FORGE", "MOSAIC", "COACH", "QUEST",  // Nav/catalog
] as const;

// Marketing hero lineup — the 4 featured assessments shown prominently.
export const HERO_KEYS: string[] = ["CPI", "LEAP", "SPARK", "IMPACT"];

// Tier groups (map to backend pricing / access control)
export const FLAGSHIP_KEYS: string[] = ["CPI"];
export const SHIFT_SUITE_KEYS: string[] = ["LEAP", "QUEST", "IMPACT", "DRIVE", "COACH"];
export const ADVISORY_PRODUCT_KEYS: string[] = ["PRISM", "SPARK", "FORGE", "BRIDGE", "MOSAIC"];
export const LISTED_INSTRUMENT_KEYS: string[] = [
  ...FLAGSHIP_KEYS,
  ...SHIFT_SUITE_KEYS,
  ...ADVISORY_PRODUCT_KEYS,
];

export const ASSESSMENT_CATALOG: Record<string, AssessmentInfo> = INSTRUMENT_ORDER.reduce(
  (acc, code) => {
    const scoring = (SCORING_CONFIGS as any)[code];
    const questions = (QUESTION_BANKS as any)[code];

    const tierGroup: InstrumentTierGroup =
      scoring.TIER === "flagship" ? "flagship" : scoring.TIER === "shift" ? "shift" : "advisory";
    const tierLabel = TIER_GROUP_LABELS[tierGroup];

    // Batch A #1387 — canonical pricing for all 11 assessments.
    // Flagship  ($199 · 199 mi): CPI
    // Shift      ($149 · 149 mi): LEAP, QUEST, IMPACT, DRIVE, COACH
    // Standard   ($99 · 99 mi): PRISM, SPARK, FORGE, BRIDGE, MOSAIC
    // Executive Introduction: complimentary
    const CANONICAL_PRICE_MILES: Record<string, number> = {
      CPI: 199,
      LEAP: 149, QUEST: 149, IMPACT: 149, DRIVE: 149, COACH: 149,
      PRISM: 99, SPARK: 99, FORGE: 99, BRIDGE: 99, MOSAIC: 99,
    };
    const priceMiles = CANONICAL_PRICE_MILES[code] ?? 99;

    const is_cpi = tierGroup === "flagship";
    const is_shift = tierGroup === "shift";
    const is_advisory = tierGroup === "advisory";

    let pricing: AssessmentPricing[];
    if (is_cpi) {
      pricing = FLAGSHIP_PRICING.map((p) => ({ ...p }));
    } else {
      pricing = SHARED_PRICING_TIERS.map((p) => ({ ...p, features: [...p.features] }));
    }

    const { lowLabel, highLabel } = getVerdictLabels(scoring.DIMENSION_VERDICTS || []);

    const dimensions: AssessmentDimension[] = (scoring.DIMENSIONS || []).map((d: any) => {
      const qCount =
        d.n_questions ||
        (d.question_ids ? d.question_ids.length : 0) ||
        (d.items ? d.items.length : 0) ||
        Math.max(1, Math.round((questions?.total_questions || 0) / (scoring.DIMENSIONS?.length || 1)));
      const dimId = d.id || d.name;
      return {
        id: dimId,
        name: d.name,
        description: dimDescription(code, dimId, d.name),
        lowLabel,
        highLabel,
        question_count: qCount,
      };
    });

    const rawArchetypes = filterArchetypes(code, scoring.ARCHETYPES || []);
    const archetypes: AssessmentArchetype[] = rawArchetypes.map((a: any) => ({
      name: a.name,
      description: getArchetypeDescription(a),
      traits: buildArchetypeTraits(code, a),
    }));

    const compositeBands = (scoring.COMPOSITE_BANDS || []).map((cb: any) => ({
      band: cb.band || cb.label || "",
      interpretation: cb.interpretation || "",
    }));

    const b2cName = scoring.B2C_NAME || scoring.FULL_NAME || code;
    const tagline = scoring.TAGLINE || "";

    acc[code] = {
      code,
      name: scoring.FULL_NAME || code,
      b2cName,
      tagline,
      tierGroup,
      tierLabel,
      priceMiles,
      pricing,
      duration_minutes: scoring.DELIVERY_MINUTES || questions?.delivery_minutes || 10,
      total_questions: scoring.TOTAL_QUESTIONS || questions?.total_questions || 0,
      scale: scoring.SCALE || questions?.scale || "",
      version: scoring.VERSION || "1.0",
      dimensions,
      archetypes,
      compositeBands,
      is_cpi,
      is_shift,
      is_advisory,
      style_count: archetypes.length,
      archetype_count: archetypes.length,
    };

    return acc;
  },
  {} as Record<string, AssessmentInfo>
);

export function getMilesCost(code: string, tier?: PricingTier): number {
  const info = ASSESSMENT_CATALOG[code];
  if (!info) return 99;
  if (!tier) return info.priceMiles;
  const match = info.pricing.find((p) => p.tier === tier);
  return match?.miles_cost ?? info.priceMiles;
}

export const SHIFT_ALIASES: Record<string, string> = {
  SHIFT_LEAP: "LEAP",
  SHIFT_QUEST: "QUEST",
  SHIFT_IMPACT: "IMPACT",
  SHIFT_DRIVE: "DRIVE",
  SHIFT_COACH: "COACH",
  CPI: "CPI",
  LEAP: "LEAP",
  QUEST: "QUEST",
  IMPACT: "IMPACT",
  DRIVE: "DRIVE",
  COACH: "COACH",
  PRISM: "PRISM",
  SPARK: "SPARK",
  FORGE: "FORGE",
  BRIDGE: "BRIDGE",
  MOSAIC: "MOSAIC",
};

// ── W2-7 — Canonical pillar taxonomy (single source of truth) ──────────────
//
// AUDIT TRAIL (W2-7): The "content canon v3.4" referenced in the W2 brief is
// NOT present in this repository. The only upstream canon is
// /workspace/specs/NEXUS_PRODUCT_SPEC_v3_ALIGNED.md §6, which classifies the
// 11 instruments along a COMMERCIAL axis (Flagship / SHIFT Suite / Advisory
// Products) — not a behavioral pillar axis. Because the commercial axis is
// already expressed via `InstrumentTierGroup` and the catalog's flagship/hero
// sections, the behavioral pillar scheme below is the de-facto canonical
// CONTENT taxonomy for the catalog filter + nav.
//
// This module is the single source of truth: the catalog page, nav, and any
// landing-page category labels read from here. To rename a pillar or remap an
// assessment, edit PILLAR_CATEGORIES / ASSESSMENT_PILLAR only.
//
// All 11 assessments are mapped. Mapping rationale is behavioral (what each
// instrument measures), not commercial tier.

/** Behavioral pillar key (slug form). The literal "all" is reserved for the
 *  catalog filter's "show everything" state and is NOT a real pillar. */
export type PillarKey =
  | "self-awareness"
  | "leadership-impact"
  | "transition-change"
  | "team-culture";

export interface PillarCategory {
  key: PillarKey;
  /** Display label shown in filter tabs + nav. */
  label: string;
  /** One-line description for nav / recommender copy. */
  blurb: string;
}

/** Configurable pillar list. Order = filter tab order. */
export const PILLAR_CATEGORIES: PillarCategory[] = [
  {
    key: "self-awareness",
    label: "Self-Awareness",
    blurb: "Individual professional insight and positioning.",
  },
  {
    key: "leadership-impact",
    label: "Leadership Impact",
    blurb: "How you lead, operate, and create impact.",
  },
  {
    key: "transition-change",
    label: "Transition & Change",
    blurb: "Moving roles, markets, and mandates.",
  },
  {
    key: "team-culture",
    label: "Team & Culture",
    blurb: "Shaping teams, partnerships, and culture.",
  },
];

/** Assessment code (UPPERCASE) → pillar key. All 11 mapped. */
export const ASSESSMENT_PILLAR: Record<string, PillarKey> = {
  // Self-Awareness — individual insight, brand, readiness
  CPI: "self-awareness",
  PRISM: "self-awareness",
  SPARK: "self-awareness",
  COACH: "self-awareness",
  // Leadership Impact — operating patterns, board/mandate contribution
  LEAP: "leadership-impact",
  IMPACT: "leadership-impact",
  FORGE: "leadership-impact",
  // Transition & Change — cross-border, motivation, mandate integration
  BRIDGE: "transition-change",
  DRIVE: "transition-change",
  MOSAIC: "transition-change",
  // Team & Culture — operating model + team structure leadership
  QUEST: "team-culture",
};

export function pillarLabelFor(code: string): string {
  const key = ASSESSMENT_PILLAR[code.toUpperCase()];
  const pillar = PILLAR_CATEGORIES.find((p) => p.key === key);
  return pillar?.label ?? "";
}
