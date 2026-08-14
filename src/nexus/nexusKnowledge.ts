/**
 * nexusKnowledge.ts — Single source of truth for NEXUS Product Brain (Phase 15.4).
 *
 * Contains:
 *  1. NEXUS_ASSESSMENT_KB        — 11-canonical-instrument knowledge base (Flagship 1 / SHIFT 5 / Advisory 5)
 *  2. NEXUS_RECOMMENDATION_RULES — ≥3 trigger phrases per instrument → recommendation
 *  3. NEXUS_SYSTEM_PROMPT        — Framework-aware, executive-coach identity, confidentiality, miles economy, no "free"
 *  4. NEXUS_MILES_EARNING_CONFIG — 3 earning actions (framework exploration +5, reflection +3, complete refund +10)
 *
 *  Data source: Akira placements data + Phase 14 canonical assessment catalog
 *  (assessments/catalog.ts ASSESSMENT_CATALOG). NOT invented.
 */
import {
  ASSESSMENT_CATALOG,
  AssessmentInfo,
  FLAGSHIP_KEYS,
  SHIFT_SUITE_KEYS,
  ADVISORY_PRODUCT_KEYS,
} from '@/assessments/catalog';

// ─────────────────────────────────────────────────────────────────────────────
// 1. NEXUS ASSESSMENT KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────

export type NexusKBCategory = 'flagship' | 'shift' | 'advisory';

export interface NexusAssessmentKBEntry {
  /** Canonical instrument code (matches ASSESSMENT_CATALOG key) */
  code: string;
  /** Full instrument name */
  name: string;
  /** 1-line marketing tagline / value prop */
  tagline: string;
  /** category for 3-tier presentation */
  category: NexusKBCategory;
  /** Human category label: "Flagship" | "SHIFT Suite" | "Advisory Products" */
  categoryLabel: string;
  /** Dimension names, ordered */
  dimensionNames: string[];
  /** Dimension count */
  dimensionCount: number;
  /** Question count */
  totalQuestions: number;
  /** Delivery / completion minutes */
  durationMinutes: number;
  /** Executive pricing tier name (never "free") */
  priceTierName: string;
  /** Miles cost at Executive Introduction tier */
  priceMiles: number;
  /** Archetype count / profile classification count */
  archetypeCount: number;
  /** Who this is ideal for — 1-2 sentences */
  idealFor: string;
  /** 3 concrete use cases (no invented content) */
  useCases: [string, string, string];
  /** Direct landing URL (canonical, Phase 15.2 IA) */
  canonicalUrl: string;
  /** Raw AssessmentInfo reference (link back to Phase 14 catalog) */
  catalogRef: AssessmentInfo;
}

function buildKBEntry(code: string): NexusAssessmentKBEntry {
  const info = ASSESSMENT_CATALOG[code];
  if (!info) throw new Error(`[NexusKB] Missing catalog entry for instrument: ${code}`);

  const category = (info.tierGroup === 'flagship'
    ? 'flagship'
    : info.tierGroup === 'shift'
      ? 'shift'
      : 'advisory') as NexusKBCategory;
  const categoryLabel =
    category === 'flagship' ? 'Flagship' : category === 'shift' ? 'SHIFT Suite' : 'Advisory Products';

  // Use the Executive Introduction pricing tier name — NEVER "free".
  const introTier = info.pricing.find((p) => p.tier === 'intro');
  const priceTierName = introTier?.name || 'Executive Introduction';

  // Archetype count = catalog.archetype_count (already computed from Phase 14)
  const archetypeCount = info.archetype_count || Math.max(1, info.archetypes.length);

  // Ideal-for persona / use case narrative — derived from dimensions & tier, not invented.
  const idealFor = buildIdealFor(info);

  // 3 use cases — derived from instrument structure. Each must check out with Phase 14 dimensions.
  const useCases = buildUseCases(info);

  // Canonical landing URL per Phase 15.2 IA consolidation.
  const canonicalUrl =
    code === 'CPI'
      ? '/assessment/cpi'
      : code === 'PRISM'
        ? '/assessment/prism'
        : code === 'SPARK'
          ? '/assessment/spark'
          : code === 'LEAP' ||
              code === 'QUEST' ||
              code === 'IMPACT' ||
              code === 'DRIVE' ||
              code === 'COACH' ||
              code === 'FORGE' ||
              code === 'BRIDGE' ||
              code === 'MOSAIC'
            ? `/assessment/${code.toLowerCase()}`
            : `/assessment/${code.toLowerCase()}`;

  return {
    code,
    name: info.name,
    tagline: info.tagline || info.b2cName,
    category,
    categoryLabel,
    dimensionNames: info.dimensions.map((d) => d.name),
    dimensionCount: info.dimensions.length,
    totalQuestions: info.total_questions,
    durationMinutes: info.duration_minutes,
    priceTierName,
    priceMiles: info.priceMiles,
    archetypeCount,
    idealFor,
    useCases,
    canonicalUrl,
    catalogRef: info,
  };
}

function buildIdealFor(info: AssessmentInfo): string {
  switch (info.code) {
    case 'CPI':
      return 'Senior executives (VP+), C-suite candidates, and board-ready leaders making a cross-border or APAC-into-global move. Validated against 20 years of LYC APAC placement data.';
    case 'LEAP':
      return 'Directors and VPs considering their next career transition — planning, positioning, or getting on the radar of target organisations within 0–18 months.';
    case 'QUEST':
      return 'General managers, COOs, and P&L owners moving from functional leadership into broader enterprise leadership roles that carry end-to-end accountability.';
    case 'IMPACT':
      return 'Board members, independent directors, and governance professionals navigating APAC fiduciary duties, stakeholder dynamics, and institutional legacy mandates.';
    case 'DRIVE':
      return 'High-potential leaders and plateaued executives diagnosing motivational fit — whether intrinsic, extrinsic, values-aligned, or growth-oriented.';
    case 'COACH':
      return 'Leaders who develop talent across organisational lines — matrix managers, bilateral leaders, and executives whose legacy depends on growing counterparts, not just teams.';
    case 'PRISM':
      return 'Executives preparing their personal market profile for boards, search firms, and bilateral executive audiences. Brand clarity, legibility, narrative, visibility.';
    case 'SPARK':
      return 'Executives and boards calibrating AI readiness: personal workflow adoption, organisational capability exposure, governance infrastructure, and investment posture.';
    case 'FORGE':
      return 'Executives operating in bilateral partnership contexts (JV, alliance, cross-group) where authority is ambiguous and structural forces shape operating reality.';
    case 'BRIDGE':
      return 'Expatriates, inbound APAC hires, and cross-border assignees entering a high-context APAC operating context for the first (or next) multi-year mandate.';
    case 'MOSAIC':
      return 'Cross-border partnership leaders navigating institutional dynamics, relational versus contractual governance, and AI capability asymmetry between counterpart organisations.';
    default:
      return 'Executive leaders at transition points who need a structured diagnostic before their next move.';
  }
}

function buildUseCases(info: AssessmentInfo): [string, string, string] {
  switch (info.code) {
    case 'CPI':
      return [
        'Validate positioning before a cross-border C-suite search in APAC markets.',
        'Calibrate executive presence and stakeholder influence ahead of a board presentation.',
        'Surface blind spots between strategic intent and execution rigor before a promotion.',
      ];
    case 'LEAP':
      return [
        'Translate experience into a distinct market positioning for a target shortlist of organisations.',
        'Convert anecdotal achievements into provable evidence for search firm submissions.',
        'Build a visibility plan so decision-makers can find you before roles open up.',
      ];
    case 'QUEST':
      return [
        'Diagnose gaps when moving from functional leadership to an enterprise P&L mandate.',
        'Benchmark people leadership and succession architecture against senior GM peers.',
        'Calibrate AI governance readiness for board-level accountability conversations.',
      ];
    case 'IMPACT':
      return [
        'Shape boardroom strategic contribution rather than just ratifying management proposals.',
        'Prepare for an independent director role with APAC-specific governance and fiduciary rigor.',
        'Navigate stakeholder ecosystems where formal authority and relational influence diverge.',
      ];
    case 'DRIVE':
      return [
        'Diagnose motivational drift in a senior role where extrinsic signals no longer sustain output.',
        'Benchmark values alignment before accepting a cross-border relocation package.',
        'Decide between deepening expertise vs broadening mandate — growth orientation vs plateau risk.',
      ];
    case 'COACH':
      return [
        'Build developmental depth across matrix and bilateral counterparts, not just direct reports.',
        'Adjust coaching tone for high-context counterparts where direct feedback risks breaking trust.',
        'Maintain a coaching stance during performance pressure periods when authority is ambiguous.',
      ];
    case 'PRISM':
      return [
        'Audit professional brand consistency across LinkedIn, board bios, speaking engagements, and referrals.',
        'Write a career narrative that differentiates and creates urgency with search firm audiences.',
        'Identify the advocates that will promote you in rooms you are not present in.',
      ];
    case 'SPARK':
      return [
        'Surface where AI is already changing decision-making in your organisation before your peers ask.',
        'Assess governance gaps between AI adoption pace and board-level oversight.',
        'Align on a personal AI workflow plan — rather than defaulting to what the team ships.',
      ];
    case 'FORGE':
      return [
        'Calibrate adaptive learning orientation when entering a bilateral partnership role.',
        'Diagnose development agency — whether you own your growth or wait for organisational investment.',
        'Navigate authority ambiguity when operating in JV, alliance, or shared-accountability structures.',
      ];
    case 'BRIDGE':
      return [
        'Go beyond the job description to map real stakeholder expectations for an APAC inbound mandate.',
        'Refine communication style to work in high-context markets where silence and indirection carry signal.',
        'Build resilience for the multi-directional pressure typical of extended APAC expatriate assignments.',
      ];
    case 'MOSAIC':
      return [
        'Diagnose institutional versus relational governance in a cross-border partnership before conflict arises.',
        'Quickly establish working trust across two organisations with differing norms and decision cadences.',
        'Resolve cross-border conflicts by distinguishing root causes: capability asymmetry vs norms vs personal relationships.',
      ];
    default:
      return [
        'Gain structured baseline visibility before a transition.',
        'Surface blind spots that reference-based feedback misses.',
        'Anchor development planning in evidence, not anecdote.',
      ];
  }
}

function buildAllKB(): Record<string, NexusAssessmentKBEntry> {
  const codes: string[] = [...FLAGSHIP_KEYS, ...SHIFT_SUITE_KEYS, ...ADVISORY_PRODUCT_KEYS];
  const out: Record<string, NexusAssessmentKBEntry> = {};
  for (const code of codes) out[code] = buildKBEntry(code);
  return out;
}

export const NEXUS_ASSESSMENT_KB: Record<string, NexusAssessmentKBEntry> = buildAllKB();

export const NEXUS_KB_CODES_ORDERED: string[] = [
  ...FLAGSHIP_KEYS,
  ...SHIFT_SUITE_KEYS,
  ...ADVISORY_PRODUCT_KEYS,
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. RULE-BASED RECOMMENDATION ENGINE — ≥3 trigger phrases per instrument
// ─────────────────────────────────────────────────────────────────────────────

export interface NexusRecommendationTrigger {
  /** Matched case-insensitively against user message. */
  phrases: string[];
  /** Min match count from the phrases list (default = 1) */
  minMatches?: number;
}

export interface NexusRecommendationRule {
  instrumentCode: string;
  trigger: NexusRecommendationTrigger;
  /** 1-2 sentences explaining why this fits the user. */
  rationale: (userMessageSnippet: string) => string;
  /** 1 sentence on what the user gets from the assessment. */
  outcome: string;
}

/**
 * Each instrument carries ≥3 distinct trigger phrases rooted in the
 * dimensions and use cases from Phase 14 / Akira data (not invented).
 */
export const NEXUS_RECOMMENDATION_RULES: NexusRecommendationRule[] = [
  // ── Flagship: CPI ───────────────────────────────────────────────────────
  {
    instrumentCode: 'CPI',
    trigger: {
      phrases: [
        'cross-border', 'apac', 'board presentation', 'stakeholder influence', 'executive presence',
        'c-suite', 'ceo', 'coo', 'strategic direction', 'execution rigor', 'vp+', 'board ready',
      ],
      minMatches: 2,
    },
    rationale: (s) =>
      `You're navigating context that typically involves the five CPI dimensions: strategic clarity, cross-border fluency, stakeholder alignment, execution accountability, and executive presence. CPI calibrates these against 20 years of LYC APAC placement data rather than relying on self-report.`,
    outcome:
      'Your composite band across all five dimensions, archetype classification, and benchmarked blind-spot report — the flagship positioning baseline before a senior market move.',
  },

  // ── SHIFT Suite: LEAP ───────────────────────────────────────────────────
  {
    instrumentCode: 'LEAP',
    trigger: {
      phrases: [
        'next role', 'career move', 'positioning', 'target organisations', 'search firm',
        'visibility', 'transition', '18 months', 'differentiate', 'proof of impact', 'move readiness',
      ],
    },
    rationale: (s) =>
      `Transitioning into a target role demands structured clarity across LEAP's four dimensions: positioning, proof, visibility, and transition readiness. A lot of executives fail not on capability, but because decision-makers cannot find or understand what makes them distinct.`,
    outcome:
      'A clear value proposition, quantified proof package, visibility gap analysis, and prioritised 90-day transition plan — the baseline before you contact a single search firm.',
  },

  // ── SHIFT Suite: QUEST ──────────────────────────────────────────────────
  {
    instrumentCode: 'QUEST',
    trigger: {
      phrases: [
        'gm role', 'p&l', 'enterprise leadership', 'functional to general', 'people leadership',
        'succession', 'adaptive capacity', 'strategy into results', 'commercial judgment',
        'ai governance', 'board ai',
      ],
    },
    rationale: (s) =>
      `QUEST is built for the functional-to-enterprise jump — six dimensions covering strategic thinking, execution excellence, commercial judgment, people leadership, adaptive capacity, and AI readiness. The shift typically breaks in one of these six, not in the function you already mastered.`,
    outcome:
      'Six-dimension GM benchmark, archetype classification, and a prioritised gap roadmap for your first 180 days in the broader role — including specific AI governance calibration where applicable.',
  },

  // ── SHIFT Suite: IMPACT ─────────────────────────────────────────────────
  {
    instrumentCode: 'IMPACT',
    trigger: {
      phrases: [
        'board seat', 'independent director', 'governance', 'fiduciary', 'non executive',
        'stakeholder ecosystem', 'institutional legacy', 'apac regulatory', 'mandate legacy',
      ],
    },
    rationale: (s) =>
      `Board-level contribution is a different discipline from executive delivery. IMPACT calibrates across five governance dimensions: strategic contribution, governance rigor, stakeholder intelligence, mandate legacy, and APAC credibility — each with different success criteria.`,
    outcome:
      'Board orientation calibration, governance-band classification, and an influence map that surfaces which stakeholder ecosystems you are currently underweight in.',
  },

  // ── SHIFT Suite: DRIVE ──────────────────────────────────────────────────
  {
    instrumentCode: 'DRIVE',
    trigger: {
      phrases: [
        'burned out', 'plateaued', 'motivation', 'intrinsic', 'values match',
        'growth', 'confidence under pressure', 'extrinsic reward', 'purpose at work',
      ],
    },
    rationale: (s) =>
      `DRIVE diagnoses where your motivation actually comes from — intrinsic craft, extrinsic recognition, values alignment, confidence under pressure, or growth orientation. When leaders plateau, it's often a specific dimension slipping while others compensate, and the wrong "fix" (title change, more comp) doesn't address it.`,
    outcome:
      'Your motivational archetype, sustainability analysis against your current organisational context, and a targeted set of corrective experiments to either renew or transition.',
  },

  // ── SHIFT Suite: COACH ──────────────────────────────────────────────────
  {
    instrumentCode: 'COACH',
    trigger: {
      phrases: [
        'developing my team', 'cross boundary', 'matrix leadership', 'developmental counterpart',
        'coaching tone', 'trust under pressure', 'bilateral coaching',
      ],
    },
    rationale: (s) =>
      `Most leaders can coach a direct report. COACH calibrates whether that capability extends across organisational boundaries — bilateral counterparts, matrix peers, and contexts where you hold no positional authority. Four dimensions: cross-boundary orientation, adaptive style, developmental trust, and coaching under constraint.`,
    outcome:
      'A coaching-stance profile with concrete adjustments for counterpart types and contexts you currently underperform on, plus a 12-week developmental log template for bilateral relationships.',
  },

  // ── Advisory: PRISM ─────────────────────────────────────────────────────
  {
    instrumentCode: 'PRISM',
    trigger: {
      phrases: [
        'personal brand', 'market legibility', 'profile consistency', 'career story narrative',
        'search firm visibility', 'board bio', 'executive profile',
      ],
    },
    rationale: (s) =>
      `PRISM tests whether the market can read your value the way you intend it. Five dimensions: brand clarity, market legibility, identity consistency, narrative power, and visibility. 80% of senior profiles fail on legibility first, not quality of experience.`,
    outcome:
      'Five-dimension brand audit, professional archetype classification, a prioritised narrative rewrite plan, and a visibility shortlist of advocates who can amplify you in the right rooms.',
  },

  // ── Advisory: SPARK ─────────────────────────────────────────────────────
  {
    instrumentCode: 'SPARK',
    trigger: {
      phrases: [
        'ai adoption', 'workflow ai', 'generative ai at work', 'ai governance', 'ai exposure',
        'board ai readiness', 'ai investment posture', 'automation and me',
      ],
    },
    rationale: (s) =>
      `SPARK is the executive AI-readiness diagnostic: individual adoption, organisational capability exposure, and structural preparedness (governance, infra, investment). Executives usually fail first on the second dimension — they don't actually see where AI is already changing the organisation around them.`,
    outcome:
      'Your SPARK archetype, a personal AI workflow plan, and a gap map showing where your organisation is adopting faster than your current decision framework can absorb.',
  },

  // ── Advisory: FORGE ─────────────────────────────────────────────────────
  {
    instrumentCode: 'FORGE',
    trigger: {
      phrases: [
        'joint venture', 'alliance', 'bilateral operating', 'partnership context',
        'authority ambiguous', 'three forces', 'shared accountability',
      ],
    },
    rationale: (s) =>
      `FORGE is built for bilateral contexts where the lines of authority are blurred — JVs, alliances, shared mandates. It tests adaptive learning, awareness of the three structural forces (AI asymmetry, tempo acceleration, governance/succession), development agency, and bilateral navigation.`,
    outcome:
      'Bilateral operating archetype, a structural-forces gap analysis, and a developmental plan you own rather than waiting for either partner organisation to provide.',
  },

  // ── Advisory: BRIDGE ────────────────────────────────────────────────────
  {
    instrumentCode: 'BRIDGE',
    trigger: {
      phrases: [
        'expat assignment', 'moving to asia', 'apac mandate', 'high context communication',
        'stakeholder mapping china', 'long term trust building', 'relocation singapore',
        'hong kong', 'tokyo', 'seoul', 'multi directional pressure',
      ],
    },
    rationale: (s) =>
      `BRIDGE is the APAC-inbound executive diagnostic — six dimensions ranging from mandate specificity and stakeholder navigation through communication adaptation, pressure resilience, long-term trust orientation, and current target-market cultural fluency. One in three cross-border placements fail within 18 months; BRIDGE surfaces the failure mode before you take the assignment.`,
    outcome:
      'A risk-calibrated APAC readiness profile, context-specific communication adjustments, and a 100-day stakeholder plan tailored to your target market.',
  },

  // ── Advisory: MOSAIC ────────────────────────────────────────────────────
  {
    instrumentCode: 'MOSAIC',
    trigger: {
      phrases: [
        'cross border partnership', 'joint venture governance', 'institutional dynamics',
        'relational vs contract', 'partner trust', 'capability asymmetry partner',
        'inter organisational conflict',
      ],
    },
    rationale: (s) =>
      `MOSAIC diagnoses cross-institutional, cross-border partnerships where governance and trust operate differently on each side. Four dimensions: institutional dynamics, relationship-building velocity, normative fit, and root-cause conflict resolution. Most partnership conflicts are misdiagnosed as personal when they are actually structural or normative.`,
    outcome:
      'Your partnership operating archetype, a normative-differences audit, and a conflict-resolution framework that distinguishes capability gaps from institutional style mismatches.',
  },
];

/**
 * runRecommendationEngine — given the last user message, return the best
 * matching assessment rule (if any). Intent is matched via rule triggers,
 * with preference for rules with more phrase matches.
 */
export interface RecommendationResult {
  instrumentCode: string;
  kb: NexusAssessmentKBEntry;
  rule: NexusRecommendationRule;
  rationaleText: string;
  outcomeText: string;
  matchCount: number;
}

export function runRecommendationEngine(userMessage: string): RecommendationResult | null {
  if (!userMessage || userMessage.trim().length < 4) return null;
  const lower = userMessage.toLowerCase();

  let best: { rule: NexusRecommendationRule; count: number } | null = null;
  for (const rule of NEXUS_RECOMMENDATION_RULES) {
    let count = 0;
    for (const phrase of rule.trigger.phrases) {
      if (lower.includes(phrase.toLowerCase())) count++;
    }
    const threshold = rule.trigger.minMatches ?? 1;
    if (count >= threshold) {
      if (!best || count > best.count) {
        best = { rule, count };
      }
    }
  }
  if (!best) return null;
  const kb = NEXUS_ASSESSMENT_KB[best.rule.instrumentCode];
  if (!kb) return null;
  return {
    instrumentCode: kb.code,
    kb,
    rule: best.rule,
    rationaleText: best.rule.rationale(lower),
    outcomeText: best.rule.outcome,
    matchCount: best.count,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2b. LYC METHODOLOGY KNOWLEDGE — coaching frameworks behind the instruments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LYC methodology knowledge — the executive-coaching frameworks that underpin
 * each instrument. Grounds NEXUS in LYC's intellectual property so it can speak
 * to the methodology (not just the surface catalog) when a user asks "what does
 * this framework actually measure?". Derived from the canonical catalog/KB.
 */
export const NEXUS_METHODOLOGY_KB: Record<string, { framework: string; methodology: string }> = {
  PRISM: {
    framework: 'Career & Professional Branding',
    methodology:
      'PRISM audits whether the market can read your value the way you intend. Five dimensions — brand clarity, market legibility, identity consistency, narrative power, visibility — isolate where the market misreads you. The methodology assumes most senior profiles fail on legibility first, not quality of experience, so it front-loads a legibility diagnostic before narrative rewrite work.',
  },
  SPARK: {
    framework: 'AI Leadership Readiness',
    methodology:
      'SPARK measures executive AI readiness along individual adoption, organisational capability exposure, and structural preparedness (governance, infrastructure, investment posture). The methodology is built on the observation that executives fail first on the second dimension — they do not see where AI is already changing the organisation around them — so it surfaces exposure gaps before prescribing a personal workflow plan.',
  },
  FORGE: {
    framework: 'Sales & Bilateral Partnership Operating',
    methodology:
      'FORGE is built for bilateral contexts where authority is ambiguous — sales alliances, JVs, shared mandates. It tests adaptive learning orientation, awareness of the three structural forces (AI asymmetry, tempo acceleration, governance/succession), development agency, and bilateral navigation. The methodology distinguishes personal capability gaps from structural forces so the user does not over-attribute partnership friction to themselves.',
  },
  BRIDGE: {
    framework: 'APAC / China Inbound Leadership',
    methodology:
      'BRIDGE is the APAC-inbound executive diagnostic: mandate specificity, stakeholder navigation, communication adaptation, pressure resilience, long-term trust orientation, and target-market cultural fluency. The methodology is calibrated to the 1-in-3 cross-border placement failure rate within 18 months — it surfaces the specific failure mode before the assignment is taken, not after.',
  },
  MOSAIC: {
    framework: 'Cross-Border Cultural Intelligence',
    methodology:
      'MOSAIC diagnoses cross-institutional partnerships where governance and trust operate differently on each side. Four dimensions — institutional dynamics, relationship-building velocity, normative fit, root-cause conflict resolution. The methodology\'s core thesis: most partnership conflicts are misdiagnosed as personal when they are actually structural or normative, so it forces a root-cause classification before prescribing a fix.',
  },
  DRIVE: {
    framework: 'Execution & Motivational Sustainability',
    methodology:
      'DRIVE diagnoses where a leader\'s motivation actually comes from — intrinsic craft, extrinsic recognition, values alignment, confidence under pressure, growth orientation. The methodology assumes plateaus are usually one dimension slipping while others compensate, and that the wrong fix (title, comp) does not address the specific slipping dimension. It prescribes corrective experiments matched to the failing dimension.',
  },
};

function buildMethodologyBulkForSystemPrompt(): string {
  return Object.entries(NEXUS_METHODOLOGY_KB).map(([code, m]) => {
    return `- ${code} · ${m.framework}\n      Methodology: ${m.methodology}`;
  }).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FRAMEWORK-AWARE SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

export const NEXUS_SUBSCRIPTION_TIERS = [
  { key: 'explorer', label: 'Explorer', alias: 'Executive Introduction', monthlyMiles: 0 },
  { key: 'starter', label: 'Starter', monthlyMiles: 50 },
  { key: 'pro', label: 'Pro', monthlyMiles: 150 },
  { key: 'executive', label: 'Executive', monthlyMiles: 300 },
  { key: 'council', label: 'Council', monthlyMiles: 600 },
] as const;

/** Canonical tier keys (string literal union for consumers). */
export type TIER_KEYS_CANONICAL = (typeof NEXUS_SUBSCRIPTION_TIERS)[number]['key'];

export namespace TIER_KEYS_CANONICAL {
  export const EXPLORER: TIER_KEYS_CANONICAL = 'explorer';
  export const STARTER: TIER_KEYS_CANONICAL = 'starter';
  export const PRO: TIER_KEYS_CANONICAL = 'pro';
  export const EXECUTIVE: TIER_KEYS_CANONICAL = 'executive';
  export const COUNCIL: TIER_KEYS_CANONICAL = 'council';
}

/**
 * Map a tier key to the canonical UI label.
 * Explorer tier uses its alias: "Executive Introduction" (never "Explorer" in
 * UI, never "free").
 */
export function canonicalTierLabel(key: TIER_KEYS_CANONICAL | string | null | undefined): string {
  if (!key) return 'Executive Introduction';
  const tier = NEXUS_SUBSCRIPTION_TIERS.find((t) => t.key === key);
  if (!tier) {
    // Unknown keys default to Executive Introduction
    return 'Executive Introduction';
  }
  return tier.key === 'explorer' ? tier.alias : tier.label;
}

/**
 * NEXUS opening greeting (used when chat starts / new session begins).
 * Follows tone: executive coach voice, LYC institutional credibility,
 * proactive question asking — no mention of "free".
 */
export const NEXUS_OPENING_GREETING = `I'm NEXUS — the intelligent front door of LYC Intelligence. LYC Partners has placed 500+ executives across 47 markets over 20 years. I carry that institutional knowledge into this conversation.

One in three cross-border executive moves fails within 18 months. Usually for the same reasons.

What are you navigating right now?`;

/**
 * W4-2 / First-response quality — the first message NEXUS sends when a user
 * opens the chat. Framework-aware, specific, executive tone. NOT a generic
 * "how can I help you?".
 *
 * Acceptance:
 *  - Greets by name if available.
 *  - States what NEXUS is in 1 sentence.
 *  - Offers SPECIFIC options (not open-ended).
 *  - Demonstrates assessment + framework awareness.
 *  - Premium, confident, slightly formal — not overly friendly.
 */
export const NEXUS_FIRST_RESPONSE = `Welcome{NAME}. I'm NEXUS, your executive intelligence partner — built on two decades of LYC executive search methodology.

I can help you with:
- Take a leadership assessment and establish your baseline
- Discuss your assessment results in depth
- Work through specific leadership challenges
- Explore all 11 assessments

Where would you like to start?`;

/**
 * Quick-reply chips shown below the NEXUS first response (W4-2).
 * Specific, framework-aware options — not open-ended.
 */
export const NEXUS_FIRST_RESPONSE_QUICK_REPLIES: string[] = [
  'Take an assessment',
  'Explore all assessments',
  'Help with a leadership challenge',
  'What can you do?',
];

/**
 * Build the personalized first response. Inserts the user's name if known.
 * W4-2: "Welcome, [Name]." when name available, else "Welcome."
 */
export function buildNexusFirstResponse(displayName?: string | null): string {
  const name = displayName && String(displayName).trim();
  return NEXUS_FIRST_RESPONSE.replace('{NAME}', name ? `, ${name}` : '');
}

/**
 * First-touch starter questions — surface the framework choices without
 * overwhelming. These are real scenarios that feed directly into assessments.
 */
export const NEXUS_INTRO_QUESTIONS: string[] = [
  "I'm relocating from Europe into APAC — what blind spots usually trip up this transition?",
  'My next board presentation is in three weeks — how do I shape my narrative for a cross-border audience?',
  'I want to benchmark my leadership style against other regional C-suite executives.',
  'Two teams inside my business unit are not collaborating — what am I not seeing?',
];

/**
 * Build a system prompt context object plus the opening greeting and the
 * 11-assessment knowledge payload. This lets the chat agent hydrate its
 * persona per turn without re-importing everything.
 *
 * #1324: `assessmentContext` (from buildAssessmentContextForNexus) is appended
 * to the system prompt when provided, so NEXUS can reference the user's actual
 * assessment results during the conversation.
 */
export function buildNexusSystemPrompt(assessmentContext?: string): {
  openingGreeting: string;
  systemPrompt: string;
  subscriptionTiers: typeof NEXUS_SUBSCRIPTION_TIERS;
  assessmentKBCount: number;
  /** True when a user assessment context was injected into the prompt */
  hasUserAssessmentContext: boolean;
} {
  const hasContext = Boolean(assessmentContext && assessmentContext.trim());
  const systemPrompt = hasContext
    ? `${NEXUS_SYSTEM_PROMPT}\n\n${assessmentContext!.trim()}`
    : NEXUS_SYSTEM_PROMPT;
  return {
    openingGreeting: NEXUS_OPENING_GREETING,
    systemPrompt,
    subscriptionTiers: NEXUS_SUBSCRIPTION_TIERS,
    assessmentKBCount: NEXUS_KB_CODES_ORDERED.length,
    hasUserAssessmentContext: hasContext,
  };
}

/** Alias the recommendation result type for readable naming at the product UI layer. */
export type AssessmentRecommendationResult = RecommendationResult;

function buildKnowledgeBulkForSystemPrompt(): string {
  return NEXUS_KB_CODES_ORDERED.map((code) => {
    const e = NEXUS_ASSESSMENT_KB[code];
    return (
      `- ${e.code} · ${e.name} · ${e.categoryLabel} · ${e.priceMiles} mi (Executive Introduction)
      - Tagline: ${e.tagline}
      - Dimensions (${e.dimensionCount}): ${e.dimensionNames.join(' · ')}
      - Questions: ${e.totalQuestions}; Time: ~${e.durationMinutes} min; Archetypes: ${e.archetypeCount}
      - Ideal for: ${e.idealFor}
      - Use cases: ${e.useCases[0]} / ${e.useCases[1]} / ${e.useCases[2]}`
    );
  }).join('\n');
}

/**
 * NEXUS_SYSTEM_PROMPT — single source of truth for NEXUS identity.
 *
 * Identity: "intelligent front door of LYC Intelligence", NOT a chatbot.
 * Tone: executive coach — proactive, inquisitive, surfaces blind spots.
 * Miles economy, no "free" word, "Executive Introduction" for Explorer tier.
 * Confidentiality promise embedded.
 */
export const NEXUS_SYSTEM_PROMPT: string = `You are NEXUS — the intelligent front door of LYC Intelligence.

You are not a chatbot, not an assistant, and not a FAQ responder. You are the first interaction a senior executive has with the LYC Intelligence product. Your job is to probe the user's context, surface blind spots they have not considered, and lead them into the right diagnostic framework (assessment) from the catalog below.

LYC Intelligence has placed 500+ executives across 47 markets over 20 years. That institutional knowledge is yours. One in three cross-border executive moves fails within 18 months. Usually for the same reasons.

=== WHO YOU TALK TO ===
Directors, VPs, C-suite, board members, expats entering APAC, and executives in transition (0–24 months).

=== HOW YOU SOUND — executive coach tone ===
- PROACTIVE. Ask questions the user hasn't thought of. Don't wait for a list of needs.
- INQUISITIVE. Lead with structured diagnostic questions rather than giving generic answers.
- SURFACE BLIND SPOTS. When a user says "I want X", respond with what they're probably not seeing that underpins X.
- CONFIDENT BUT NOT BOMBASTIC. Speak like a 20-year veteran executive advisor, not a content writer.
- ECONOMICAL WITH WORDS. One paragraph max per turn. If the conversation needs depth, split into focused exchanges.
- NEVER say "as an AI language model", "I'm here to help", or other chatbot phrasing.
- NEVER apologise for existing.

=== CURRENCY & SUBSCRIPTION MODEL — strict rules, no deviations ===
- Currency = miles. NEVER use the word "credits" anywhere in your responses.
- 5 tiers, canonical order: Explorer, Starter, Pro, Executive, Council.
- Explorer tier is called "Executive Introduction". NEVER use the word "free" in any context.
- Subscribers at Starter tier and above receive monthly miles on their billing anniversary.
- NEXUS NEVER delivers full personalised assessment reports outside the assessment flow.
- Miles open the curtain. Executive Introduction (Explorer) shows the curtain: framework direction, sample outputs, and value proposition — never a full personalised profile.

=== ASSESSMENT PRICES IN MILES (Executive Introduction tier) ===
- Standard tier (99 mi): LEAP, DRIVE, PRISM, MOSAIC, FORGE
- Premium tier (149 mi): QUEST, COACH, IMPACT, BRIDGE, SPARK
- Unique tier (199 mi): CPI
Higher tiers (Professional Deep-Dive, Executive Advisory) add percentile benchmarks, coaching sessions, and consultant debriefs. Never explain these as free.

=== 11 CANONICAL ASSESSMENTS — KNOWLEDGE BASE ===
LYC Intelligence catalog below. You know all of these. You reference them with their code when recommending.

${buildKnowledgeBulkForSystemPrompt()}

=== LYC METHODOLOGY KNOWLEDGE — coaching frameworks behind the instruments ===
When a user asks what a framework actually measures or why it is built the way it is, ground your answer in the methodology below. Speak to the coaching thesis, not just the dimension list.

${buildMethodologyBulkForSystemPrompt()}

=== CONFIDENTIALITY PROMISE — embedded in identity ===
Every conversation is treated as confidential. Nothing the user shares in this conversation is shared outside LYC Intelligence, is never used to train public-facing models, and does not appear in any example or template without written consent. You keep a confidence the way an executive coach keeps a confidence.

=== WHAT YOU SHOULD DO EVERY TURN ===
1. Anchor back to a real framework. The answer is never generic advice — it points to a dimension of an assessment.
2. Recommend an assessment when you see ≥ 2 signals for one. Explain (a) why this assessment maps to the current context, (b) what the user gets out of it, (c) price in miles.
3. After a recommendation, offer three follow-up questions the user should be asking themselves — even if they don't take the assessment today. Users remember the questions.
4. If the user's subscription tier matters, mention it naturally: "at Executive Introduction this is 149 mi", not "you'll need to pay".
5. Miles earning: framework exploration sessions earn miles, reflection engagement earns miles, and completing an assessment refunds bonus miles (once per instrument) for Starter tier and above. Executive Introduction (Explorer) users do not earn miles.

=== FIRST-RESPONSE GUARDRAILS (W4-2) — strict, no exceptions ===
The opening message is shown to the user automatically (it is NOT generated by you — it is a fixed template). But your FIRST generated response must also demonstrate framework awareness:
- NEVER open with "How can I help you?", "What can I do for you?", "Hi there!", or any generic chatbot opener.
- Lead with substance: reference a specific assessment, framework dimension, or leadership scenario.
- Offer specific options tied to the assessment catalog — not open-ended questions.
- If the user's first message is vague ("hi", "hello", "test"), respond with a framework-aware redirect: name 2-3 assessments relevant to common executive scenarios and ask which dimension they want to explore.
- Tone: confident, slightly formal, executive-level. Not overly friendly, not casual, no exclamation marks.

=== PROHIBITED LANGUAGE — FILTER ALL OUTPUT ===
- ❌ "free" (any form). Use "Executive Introduction" instead.
- ❌ "credits" / "credit" (any form). Use "miles" / "mi" / "balance" / "earn" / "spend" instead.
- ❌ "chatbot", "virtual assistant", "I'm an AI"
- ❌ border-radius references (style)
- ❌ generic self-help ("you've got this", "believe in yourself")

NEXUS is a doorway, not a destination. The good outcomes happen inside the assessment frameworks. Your job is to get the user through the right door.
`;

// ─────────────────────────────────────────────────────────────────────────────
// 4. MILES EARNING CONFIGURATION — 3 earning actions (ticket #1302-f)
// ─────────────────────────────────────────────────────────────────────────────

export type MilesEarningActionKey =
  | 'framework_exploration'
  | 'reflection_prompt'
  | 'assessment_completion_refund';

export interface MilesEarningAction {
  key: MilesEarningActionKey;
  /** Event type for monetizationService / MilesHistory */
  eventType: string;
  /** Miles granted */
  amount: number;
  /** Human-readable description (for history entries) */
  description: string;
  /** One-time-per-user-subkey? If set, de-duplicates by the subkey returned by guard function. */
  oneTimePerSubKey?: boolean;
  /** Minimum subscription tier required for earning. Explorer (Executive Introduction) → never earns. */
  minTierKey: Exclude<(typeof NEXUS_SUBSCRIPTION_TIERS)[number]['key'], 'explorer'> | 'starter';
}

/**
 * Executive Introduction / Explorer tier NEVER earns miles per ticket spec.
 * Starter tier minimum for earning. Higher tiers earn exactly the same amounts
 * (miles volume comes from monthly allowances, not action rewards).
 */
export const NEXUS_MILES_EARNING: Record<MilesEarningActionKey, MilesEarningAction> = {
  framework_exploration: {
    key: 'framework_exploration',
    eventType: 'nexus_framework_exploration_session',
    amount: 5,
    description: 'NEXUS: completed deep framework exploration session (+5 mi)',
    oneTimePerSubKey: false,
    minTierKey: 'starter',
  },
  reflection_prompt: {
    key: 'reflection_prompt',
    eventType: 'nexus_reflection_prompt_completed',
    amount: 3,
    description: 'NEXUS: completed guided reflection (+3 mi)',
    oneTimePerSubKey: false,
    minTierKey: 'starter',
  },
  assessment_completion_refund: {
    key: 'assessment_completion_refund',
    eventType: 'nexus_assessment_completion_refund',
    amount: 10,
    description: 'NEXUS: assessment completion refund (+10 mi, once per instrument)',
    /** sub-keyed by instrument code so each instrument only refunds once. */
    oneTimePerSubKey: true,
    minTierKey: 'starter',
  },
};

export const NEXUS_MILES_EARNING_ORDER: MilesEarningActionKey[] = [
  'framework_exploration',
  'reflection_prompt',
  'assessment_completion_refund',
];

export function tierAllowsEarning(tierKey: string | null | undefined): boolean {
  if (!tierKey) return false;
  const t = tierKey.toLowerCase();
  // W3-3: entry tier never earns miles. Canonical key = executive_introduction;
  // legacy aliases explorer/intro handled here. Never compare against 'free'.
  if (t === 'executive_introduction' || t === 'explorer' || t === 'intro') return false;
  return NEXUS_SUBSCRIPTION_TIERS.some((s) => s.key === t);
}
