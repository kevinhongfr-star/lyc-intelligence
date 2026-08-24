import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * NEXUS Engine — Serverless runtime for Vercel Node chat route.
 * Pure ESM TypeScript. No imports from src/. No npm deps.
 *
 * Lane derivation rules (documented above PATTERN_INDEX):
 *   - Category is Constitutional / Cultural Reference / Cross-Series → universal
 *   - Otherwise: keyword hits in name+category+triggers
 *       board/stakeholder/culture/org/governance/CEO/transformation → leadership_advisory
 *       career/transition/positioning/brand/promotion/CV → career_architecture
 *       candidate/hiring/fit/interview/recruiter → search_operations
 *     Tie or 0 hits → universal.
 *
 * Lens derivation rules (topic map):
 *   CPI=China/pipeline, LEAP=competitive/career positioning, COACH=coaching/fit,
 *   PRISM=branding/visibility, IMPACT=board/stakeholder/governance,
 *   QUEST=market/narrative/strategy, BRIDGE=cross-cultural/cross-border/institutional,
 *   MOSAIC=trust/relationships/credibility, DRIVE=motivation/isolation/identity,
 *   SPARK=AI/transformation, FORGE=sales. Unclear → [].
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** v2.7 § CORE WORLDVIEW — Three Lanes + universal fallback */
export type Lane = 'leadership_advisory' | 'career_architecture' | 'search_operations' | 'universal';

/** v2.7 § LENS SUGGESTION LOGIC — 11 diagnostic lenses */
export type LensCode =
  | 'CPI' | 'LEAP' | 'COACH' | 'PRISM' | 'IMPACT'
  | 'QUEST' | 'BRIDGE' | 'MOSAIC' | 'DRIVE' | 'SPARK' | 'FORGE';

/** v2.7 § TRUST STAGES (4 phases). Partner treated as deep for lens gating. */
export type TrustStage = 'introductory' | 'working' | 'deep' | 'partner';

/** v2.7 § OPENING SCRIPTS v1.2 — Four entry vectors (A/B/C/D) */
export type OpeningVector = 'A' | 'B' | 'C' | 'D';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

let _cachedPrompt: string | null = null;

/**
 * v2.7 Master System Prompt — loaded from file at runtime, NOT embedded or rewritten.
 * Source: nexus-engine/nexus_llm_system_prompt_v2.7.txt (510 lines, ~15.7 KB)
 * The v2.7 prompt IS the product. Use it as-is. Only add runtime context around it.
 */
export function getMasterPrompt(): string {
  if (_cachedPrompt !== null) return _cachedPrompt;
  const candidates = [
    resolve(process.cwd(), 'nexus-engine/nexus_llm_system_prompt_v2.7.txt'),
    resolve(process.cwd(), 'api/nexus_llm_system_prompt_v2.7.txt'),
  ];
  for (const p of candidates) {
    try {
      _cachedPrompt = readFileSync(p, 'utf-8');
      return _cachedPrompt;
    } catch { /* try next path */ }
  }
  console.error('[nexusEngine] v2.7 system prompt file not found');
  _cachedPrompt = '';
  return _cachedPrompt;
}

/**
 * Compact pattern index: {id, name, category, lane, lenses, triggers=activation_keywords}.
 * 45 patterns (v1.0 JSON has metadata.total_patterns=48 but patterns array=45 entries).
 * Body/data fields NOT embedded per spec.
 *
 * Lane derivation assumptions (see module header):
 *   Constitutional / Cultural Reference / Cross-Series → universal (category-first).
 *   Otherwise keyword majority across name+category+activation_keywords.
 * Lens derivation assumptions (topic map): see module header. Unclear → [].
 */
export const PATTERN_INDEX: Array<{
  id: string;
  name: string;
  category: string;
  lane: Lane;
  lenses: LensCode[];
  triggers: string[];
}> = [
  {
    "id": "P0-001",
    "name": "White Space / Iceberg Principle",
    "category": "Constitutional",
    "lane": "universal",
    "lenses": [],
    "triggers": [
      "advice",
      "solution",
      "answer",
      "explain",
      "details",
      "tell me how"
    ]
  },
  {
    "id": "P0-002",
    "name": "Experience-over-Product Positioning",
    "category": "Constitutional",
    "lane": "universal",
    "lenses": [
      "LEAP"
    ],
    "triggers": [
      "product",
      "tool",
      "app",
      "software",
      "service",
      "features"
    ]
  },
  {
    "id": "P0-003",
    "name": "Coach-as-Product Pattern",
    "category": "Constitutional",
    "lane": "universal",
    "lenses": [
      "COACH"
    ],
    "triggers": [
      "diagnosis",
      "assessment",
      "test",
      "quiz",
      "tools",
      "features",
      "dashboard"
    ]
  },
  {
    "id": "P0-004",
    "name": "Board Brief Dialogue Structure",
    "category": "Constitutional",
    "lane": "universal",
    "lenses": [
      "IMPACT",
      "QUEST"
    ],
    "triggers": [
      "decision",
      "recommendation",
      "strategy",
      "plan",
      "proposal",
      "presentation"
    ]
  },
  {
    "id": "P0-005",
    "name": "Pillar Alignment Pattern",
    "category": "Constitutional",
    "lane": "universal",
    "lenses": [
      "LEAP",
      "PRISM",
      "DRIVE"
    ],
    "triggers": [
      "brand",
      "positioning",
      "voice",
      "tone",
      "identity",
      "consistency"
    ]
  },
  {
    "id": "P0-006",
    "name": "Two-Worlds Collision Pattern",
    "category": "Constitutional",
    "lane": "universal",
    "lenses": [],
    "triggers": [
      "conflict",
      "gap",
      "tension",
      "two worlds",
      "between",
      "clash",
      "collision"
    ]
  },
  {
    "id": "B-001",
    "name": "Career Trajectory Plateau",
    "category": "DEX B-Series — Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "QUEST"
    ],
    "triggers": [
      "stuck",
      "plateau",
      "bored",
      "stagnant",
      "not growing",
      "same",
      "stale"
    ]
  },
  {
    "id": "B-002",
    "name": "Skill Obsolescence Curve",
    "category": "DEX B-Series — Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "QUEST"
    ],
    "triggers": [
      "skills",
      "learning",
      "growth",
      "relevant",
      "stale",
      "outdated",
      "resume"
    ]
  },
  {
    "id": "B-003",
    "name": "Title vs Authority Gap",
    "category": "DEX B-Series — Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "QUEST"
    ],
    "triggers": [
      "title",
      "authority",
      "power",
      "scope",
      "boss",
      "promotion",
      "control"
    ]
  },
  {
    "id": "B-004",
    "name": "Headquarter-Subsidiary Trust Gap",
    "category": "DEX B-Series — Cross-Border",
    "lane": "universal",
    "lenses": [
      "BRIDGE",
      "MOSAIC"
    ],
    "triggers": [
      "headquarters",
      "HQ",
      "head office",
      "subsidiary",
      "trust",
      "remote",
      "distance",
      "alignment"
    ]
  },
  {
    "id": "B-005",
    "name": "Invisible Stakeholder Map",
    "category": "DEX B-Series — Cross-Border",
    "lane": "leadership_advisory",
    "lenses": [
      "IMPACT",
      "BRIDGE"
    ],
    "triggers": [
      "stakeholders",
      "decision makers",
      "influence",
      "power",
      "org chart",
      "who matters",
      "politics"
    ]
  },
  {
    "id": "B-006",
    "name": "Cultural Institutional Distance",
    "category": "DEX B-Series — Cross-Border",
    "lane": "leadership_advisory",
    "lenses": [
      "BRIDGE"
    ],
    "triggers": [
      "culture",
      "cultural",
      "differences",
      "institutions",
      "norms",
      "how things work",
      "the way things are done"
    ]
  },
  {
    "id": "B-007",
    "name": "Expat Patronage Pattern",
    "category": "DEX B-Series — Cross-Border",
    "lane": "universal",
    "lenses": [
      "BRIDGE",
      "MOSAIC"
    ],
    "triggers": [
      "expat",
      "expatriate",
      "foreign",
      "outsider",
      "credibility",
      "authority from HQ"
    ]
  },
  {
    "id": "B-008",
    "name": "Cross-Border Decision Velocity",
    "category": "DEX B-Series — Cross-Border",
    "lane": "universal",
    "lenses": [
      "BRIDGE"
    ],
    "triggers": [
      "speed",
      "fast",
      "slow",
      "decision making",
      "pace",
      "urgent",
      "urgency"
    ]
  },
  {
    "id": "F-001",
    "name": "Visibility-Legitimacy Cycle",
    "category": "DEX F-Series — Executive Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "PRISM",
      "QUEST",
      "MOSAIC"
    ],
    "triggers": [
      "visibility",
      "profile",
      "recognition",
      "known",
      "reputation",
      "personal brand",
      "promotion"
    ]
  },
  {
    "id": "F-002",
    "name": "Promotion Veto Points",
    "category": "DEX F-Series — Executive Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "QUEST"
    ],
    "triggers": [
      "promotion",
      "advance",
      "next level",
      "move up",
      "partner",
      "MD",
      "director"
    ]
  },
  {
    "id": "F-003",
    "name": "Gravitas as Core Marker",
    "category": "DEX F-Series — Executive Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "QUEST",
      "MOSAIC"
    ],
    "triggers": [
      "presence",
      "gravitas",
      "executive presence",
      "credibility",
      "taken seriously",
      "confidence"
    ]
  },
  {
    "id": "F-004",
    "name": "Career Identity Shift Pattern",
    "category": "DEX F-Series — Executive Career Strategy",
    "lane": "career_architecture",
    "lenses": [
      "LEAP",
      "QUEST",
      "DRIVE"
    ],
    "triggers": [
      "identity",
      "who am I",
      "change career",
      "pivot",
      "transition",
      "different work"
    ]
  },
  {
    "id": "H-001",
    "name": "Executive Loneliness Structure",
    "category": "DEX H-Series — Executive & Organizational",
    "lane": "leadership_advisory",
    "lenses": [
      "DRIVE"
    ],
    "triggers": [
      "alone",
      "isolated",
      "no one to talk to",
      "distance",
      "removed",
      "separate",
      "top"
    ]
  },
  {
    "id": "H-002",
    "name": "Board Information Asymmetry",
    "category": "DEX H-Series — Executive & Organizational",
    "lane": "leadership_advisory",
    "lenses": [
      "IMPACT"
    ],
    "triggers": [
      "board",
      "directors",
      "governance",
      "information",
      "what the board knows",
      "transparency"
    ]
  },
  {
    "id": "H-003",
    "name": "Succession Shadow Pattern",
    "category": "DEX H-Series — Executive & Organizational",
    "lane": "leadership_advisory",
    "lenses": [],
    "triggers": [
      "succession",
      "what next",
      "after this",
      "legacy",
      "what comes after",
      "ten years"
    ]
  },
  {
    "id": "H-004",
    "name": "Organizational Change Fatigue",
    "category": "DEX H-Series — Executive & Organizational",
    "lane": "leadership_advisory",
    "lenses": [
      "SPARK"
    ],
    "triggers": [
      "change",
      "transformation",
      "fatigue",
      "burnout",
      "resistance",
      "not working",
      "pushback"
    ]
  },
  {
    "id": "H-005",
    "name": "Crisis Decision Compression",
    "category": "DEX H-Series — Executive & Organizational",
    "lane": "leadership_advisory",
    "lenses": [],
    "triggers": [
      "crisis",
      "emergency",
      "urgent",
      "pressure",
      "fast decision",
      "under pressure",
      "stress"
    ]
  },
  {
    "id": "E-001",
    "name": "AI-Human Judgment Boundary",
    "category": "DEX E-Series — AI & Executive Dynamics",
    "lane": "universal",
    "lenses": [
      "SPARK"
    ],
    "triggers": [
      "AI",
      "artificial intelligence",
      "automation",
      "judgment",
      "human vs AI",
      "hallucination"
    ]
  },
  {
    "id": "E-002",
    "name": "AI Skill Polarization",
    "category": "DEX E-Series — AI & Executive Dynamics",
    "lane": "universal",
    "lenses": [
      "SPARK"
    ],
    "triggers": [
      "AI skills",
      "workforce",
      "training",
      "reskilling",
      "adoption",
      "people",
      "team"
    ]
  },
  {
    "id": "E-003",
    "name": "AI Adoption Chasm",
    "category": "DEX E-Series — AI & Executive Dynamics",
    "lane": "universal",
    "lenses": [
      "SPARK"
    ],
    "triggers": [
      "AI rollout",
      "scaling AI",
      "pilot to production",
      "adoption gap",
      "chasm",
      "implementation"
    ]
  },
  {
    "id": "E-004",
    "name": "AI Decision Bias Pattern",
    "category": "DEX E-Series — AI & Executive Dynamics",
    "lane": "universal",
    "lenses": [
      "MOSAIC",
      "SPARK"
    ],
    "triggers": [
      "AI bias",
      "algorithmic",
      "decision quality",
      "AI errors",
      "reliability",
      "trust AI"
    ]
  },
  {
    "id": "E-005",
    "name": "AI Signal Decay in Hiring",
    "category": "DEX E-Series — AI & Executive Dynamics",
    "lane": "search_operations",
    "lenses": [
      "SPARK"
    ],
    "triggers": [
      "AI hiring",
      "recruiting",
      "resume screening",
      "talent",
      "AI in HR",
      "recruitment"
    ]
  },
  {
    "id": "D-001",
    "name": "Stakeholder Map Drift",
    "category": "DEX D-Series — Leadership & Organizations",
    "lane": "leadership_advisory",
    "lenses": [
      "IMPACT"
    ],
    "triggers": [
      "stakeholders",
      "board",
      "politics",
      "allies",
      "opposition",
      "alignment",
      "who supports"
    ]
  },
  {
    "id": "D-002",
    "name": "Credibility Transfer Pattern",
    "category": "DEX D-Series — Leadership & Organizations",
    "lane": "universal",
    "lenses": [
      "MOSAIC"
    ],
    "triggers": [
      "credibility",
      "trust",
      "earn trust",
      "prove",
      "first win",
      "early win",
      "buy-in"
    ]
  },
  {
    "id": "D-003",
    "name": "Board Room Information Filter",
    "category": "DEX D-Series — Leadership & Organizations",
    "lane": "leadership_advisory",
    "lenses": [
      "IMPACT"
    ],
    "triggers": [
      "board",
      "presentation",
      "deck",
      "slides",
      "board meeting",
      "board deck",
      "board materials"
    ]
  },
  {
    "id": "D-004",
    "name": "Institutional Memory Loss",
    "category": "DEX D-Series — Leadership & Organizations",
    "lane": "universal",
    "lenses": [
      "BRIDGE"
    ],
    "triggers": [
      "history",
      "we tried that before",
      "lessons learned",
      "past decisions",
      "why did we",
      "institutional knowledge"
    ]
  },
  {
    "id": "G-001",
    "name": "Governance Drift Pattern",
    "category": "DEX G-Series — PE & Investor Dynamics",
    "lane": "leadership_advisory",
    "lenses": [
      "IMPACT"
    ],
    "triggers": [
      "governance",
      "board oversight",
      "investor control",
      "board interference",
      "autonomy"
    ]
  },
  {
    "id": "G-002",
    "name": "Investor Narrative Capture",
    "category": "DEX G-Series — PE & Investor Dynamics",
    "lane": "leadership_advisory",
    "lenses": [
      "IMPACT",
      "QUEST"
    ],
    "triggers": [
      "investor narrative",
      "story",
      "investor message",
      "board story",
      "market narrative",
      "telling the story"
    ]
  },
  {
    "id": "G-003",
    "name": "Founder vs Professional Manager Divide",
    "category": "DEX G-Series — PE & Investor Dynamics",
    "lane": "universal",
    "lenses": [],
    "triggers": [
      "founder",
      "professional CEO",
      "founder-led",
      "professional management",
      "transition",
      "operator vs founder"
    ]
  },
  {
    "id": "C-001",
    "name": "The Prince — Machiavelli",
    "category": "Cultural Reference",
    "lane": "universal",
    "lenses": [
      "QUEST",
      "BRIDGE"
    ],
    "triggers": [
      "power",
      "influence",
      "Machiavelli",
      "prince",
      "political",
      "strategy",
      "getting things done"
    ]
  },
  {
    "id": "C-002",
    "name": "The Lonely Crowd — Riesman",
    "category": "Cultural Reference",
    "lane": "universal",
    "lenses": [
      "BRIDGE",
      "DRIVE"
    ],
    "triggers": [
      "loneliness",
      "isolation",
      "conformity",
      "inner direction",
      "other direction",
      "social pressure"
    ]
  },
  {
    "id": "C-003",
    "name": "Thin Slices — Gladwell / Ambady",
    "category": "Cultural Reference",
    "lane": "universal",
    "lenses": [
      "BRIDGE"
    ],
    "triggers": [
      "first impression",
      "gut feel",
      "intuition",
      "thin slice",
      "first few seconds",
      "quick judgment"
    ]
  },
  {
    "id": "C-004",
    "name": "Napoleon's Never Interrupt Principle",
    "category": "Cultural Reference",
    "lane": "universal",
    "lenses": [
      "BRIDGE"
    ],
    "triggers": [
      "interrupt",
      "enemy making a mistake",
      "Napoleon",
      "when they're losing",
      "opponent error"
    ]
  },
  {
    "id": "C-005",
    "name": "Silk Road Institutional Divergence",
    "category": "Cultural Reference",
    "lane": "universal",
    "lenses": [
      "CPI",
      "BRIDGE"
    ],
    "triggers": [
      "east west",
      "institutional differences",
      "silk road",
      "history of trade",
      "china west"
    ]
  },
  {
    "id": "C-006",
    "name": "The Art of War — Sun Tzu",
    "category": "Cultural Reference",
    "lane": "universal",
    "lenses": [
      "QUEST",
      "BRIDGE"
    ],
    "triggers": [
      "strategy",
      "competition",
      "Sun Tzu",
      "art of war",
      "battle",
      "winning without fighting"
    ]
  },
  {
    "id": "X-001",
    "name": "Structural Distance Pattern",
    "category": "Cross-Series Synthesis",
    "lane": "universal",
    "lenses": [],
    "triggers": [
      "distance",
      "gap",
      "separation",
      "apart",
      "between",
      "divide"
    ]
  },
  {
    "id": "X-002",
    "name": "Invisible Stakeholder Meta-Pattern",
    "category": "Cross-Series Synthesis",
    "lane": "universal",
    "lenses": [
      "IMPACT"
    ],
    "triggers": [
      "who matters",
      "hidden",
      "behind the scenes",
      "power",
      "influence",
      "real decision maker"
    ]
  },
  {
    "id": "X-003",
    "name": "Legitimacy Transfer Meta-Pattern",
    "category": "Cross-Series Synthesis",
    "lane": "universal",
    "lenses": [
      "MOSAIC"
    ],
    "triggers": [
      "credibility",
      "trust",
      "earn",
      "prove",
      "first win",
      "small win"
    ]
  },
  {
    "id": "X-004",
    "name": "Information Asymmetry Cascade",
    "category": "Cross-Series Synthesis",
    "lane": "universal",
    "lenses": [],
    "triggers": [
      "information",
      "know",
      "transparency",
      "filter",
      "don't see",
      "what they know"
    ]
  }
];

// ─── FUNCTION 1 ───────────────────────────────────────────────────────────────

/**
 * v2.7 § OPENING SCRIPTS v1.2 — 4 entry vectors.
 *
 * Precedence: D (nexus starts + zero prior user msgs) → B regex → C regex → A.
 */
export function detectOpeningVector(
  userMessage: string,
  conversationHasPriorUserMessages: boolean,
  nexusStartsTheChat: boolean
): OpeningVector {
  if (nexusStartsTheChat === true && !conversationHasPriorUserMessages) {
    return 'D';
  }
  const msg = userMessage || '';
  if (/what do you do|how can you help|what is nexus|what does nexus do|who are you|what can you do for me/i.test(msg)) {
    return 'B';
  }
  if (/start a deep diagnostic|diagnostic session|run a diagnostic|let's do a diagnosis|start diagnosis/i.test(msg)) {
    return 'C';
  }
  return 'A';
}

// ─── FUNCTION 2 ───────────────────────────────────────────────────────────────

/**
 * v2.7 § CORE WORLDVIEW — Three Lanes.
 * Case-insensitive substring hit count per lane. Max wins; tie or 0 → universal.
 */
export function detectLane(message: string): Lane {
  const m = (message || '').toLowerCase();
  const leadershipKeywords = [
    'board', 'organizational', 'governance', 'stakeholder', 'culture',
    'team leadership', 'ceo', 'coo', 'cfo', 'executive team',
    'cross-border leadership', 'regulatory', 'soe', 'boardroom',
    'transformation', 'change management'
  ];
  const careerKeywords = [
    'career', 'move', 'transition', 'promotion', 'positioning', 'brand',
    'compensation', 'leveling', 'advancement', 'exit', 'next role',
    'cv', 'bio', 'raise', 'title'
  ];
  const searchKeywords = [
    'hiring', 'candidate', 'interview', 'offer', 'negotiation', 'recruiter',
    'talent', 'selection', 'search firm', 'reference', 'onboarding hire',
    'assessment', 'fit'
  ];
  const countHits = (keywords: string[]) => keywords.reduce((sum, kw) => {
    const safe = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\\\$&');
    const re = new RegExp(safe, 'gi');
    const matches = m.match(re);
    return sum + (matches ? matches.length : 0);
  }, 0);
  const l = countHits(leadershipKeywords);
  const c = countHits(careerKeywords);
  const s = countHits(searchKeywords);
  const max = Math.max(l, c, s);
  if (max <= 0) return 'universal';
  let top: Lane[] = [];
  if (l === max) top.push('leadership_advisory');
  if (c === max) top.push('career_architecture');
  if (s === max) top.push('search_operations');
  return top.length === 1 ? top[0] : 'universal';
}

// ─── FUNCTION 3 ───────────────────────────────────────────────────────────────

/**
 * Lane stability logic. Last 1-2 user messages. Only shift if different lane has
 * strictly MORE hits AND ≥2 hits.
 */
export function detectLaneFromHistory(
  messages: Array<{ role: string; content: string }>,
  currentLane: Lane
): Lane {
  const userMsgs = (messages || []).filter(m => m && m.role && m.role.toLowerCase() === 'user').slice(-2);
  if (userMsgs.length === 0) return currentLane;
  const combined = userMsgs.map(m => m.content || '').join(' \n ');

  const m = combined.toLowerCase();
  const leadershipKeywords = [
    'board', 'organizational', 'governance', 'stakeholder', 'culture',
    'team leadership', 'ceo', 'coo', 'cfo', 'executive team',
    'cross-border leadership', 'regulatory', 'soe', 'boardroom',
    'transformation', 'change management'
  ];
  const careerKeywords = [
    'career', 'move', 'transition', 'promotion', 'positioning', 'brand',
    'compensation', 'leveling', 'advancement', 'exit', 'next role',
    'cv', 'bio', 'raise', 'title'
  ];
  const searchKeywords = [
    'hiring', 'candidate', 'interview', 'offer', 'negotiation', 'recruiter',
    'talent', 'selection', 'search firm', 'reference', 'onboarding hire',
    'assessment', 'fit'
  ];
  const countHits = (keywords: string[]) => keywords.reduce((sum, kw) => {
    const safe = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\\\$&');
    const re = new RegExp(safe, 'gi');
    const matches = m.match(re);
    return sum + (matches ? matches.length : 0);
  }, 0);
  const l = countHits(leadershipKeywords);
  const c = countHits(careerKeywords);
  const s = countHits(searchKeywords);

  const laneScores: Record<Lane, number> = {
    leadership_advisory: l,
    career_architecture: c,
    search_operations: s,
    universal: 0
  };
  const currentScore = laneScores[currentLane] ?? 0;

  let bestAltLane: Lane | null = null;
  let bestAltScore = -1;
  (Object.keys(laneScores) as Lane[]).forEach(lane => {
    if (lane === currentLane || lane === 'universal') return;
    if (laneScores[lane] > bestAltScore) {
      bestAltScore = laneScores[lane];
      bestAltLane = lane;
    }
  });

  if (bestAltLane !== null && bestAltScore > currentScore && bestAltScore >= 2) {
    return bestAltLane;
  }
  return currentLane;
}

// ─── FUNCTION 4 ───────────────────────────────────────────────────────────────

/**
 * Score patterns by trigger count substring match (case-insensitive).
 * ×2 boost when pattern.lane matches active lane; universal lane boosted ×1.5.
 * Return top n as `${id} — ${name}: ${triggers.slice(0,3).join(',')}`.
 */
export function retrievePatterns(message: string, lane: Lane, n: number = 3): string[] {
  const m = (message || '').toLowerCase();
  const scored = PATTERN_INDEX.map(p => {
    let hits = 0;
    (p.triggers || []).forEach(t => {
      const kw = (t || '').toLowerCase();
      if (!kw) return;
      const safe = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\\\$&');
      const re = new RegExp(safe, 'gi');
      const matches = m.match(re);
      if (matches) hits += matches.length;
    });
    let multiplier = 1;
    if (p.lane === lane && lane !== 'universal') multiplier = 2;
    else if (p.lane === 'universal') multiplier = 1.5;
    return { pattern: p, score: hits * multiplier };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, n)
    .filter(s => s.score > 0)
    .map(s => `${s.pattern.id} — ${s.pattern.name}: ${(s.pattern.triggers || []).slice(0, 3).join(',')}`);
}

// ─── FUNCTION 5 ───────────────────────────────────────────────────────────────

/**
 * For each user message run retrievePatterns(msg,lane,5); for each returned
 * pattern bump its lenses by +1, cap 10. Return signals (omit 0s).
 */
export function computeLensSignals(
  messages: Array<{ role: string; content: string }>,
  lane: Lane
): Partial<Record<LensCode, number>> {
  const signals: Partial<Record<LensCode, number>> = {};
  const userMsgs = (messages || []).filter(m => m && m.role && m.role.toLowerCase() === 'user');
  userMsgs.forEach(msg => {
    const results = retrievePatterns(msg.content || '', lane, 5);
    results.forEach(resultStr => {
      const idMatch = resultStr.match(/^([A-Z0-9-]+)\s*—/);
      if (!idMatch) return;
      const id = idMatch[1];
      const pattern = PATTERN_INDEX.find(p => p.id === id);
      if (!pattern) return;
      (pattern.lenses || []).forEach(lens => {
        signals[lens] = Math.min(10, (signals[lens] || 0) + 1);
      });
    });
  });
  const filtered: Partial<Record<LensCode, number>> = {};
  (Object.keys(signals) as LensCode[]).forEach(k => {
    if ((signals[k] || 0) > 0) filtered[k] = signals[k];
  });
  return filtered;
}

// ─── FUNCTION 6 ───────────────────────────────────────────────────────────────

/** Lens signal >= 7 only. v2.7 § LENS SUGGESTION LOGIC threshold. */
export function suggestibleLenses(signals: Partial<Record<LensCode, number>>): LensCode[] {
  return (Object.keys(signals || {}) as LensCode[])
    .filter(k => (signals[k] || 0) >= 7);
}

// ─── FUNCTION 7 ───────────────────────────────────────────────────────────────

/**
 * v2.7 § TRUST STAGES.
 * 0-1 → introductory. 2-4 && >=1 lens → working. 5+ && >=3 lenses → deep.
 * Else: working if >=2 sessions, else introductory. Partner → deep equivalent.
 */
export function computeTrustStage(sessionCount: number, lensCount: number): TrustStage {
  if (sessionCount <= 1) return 'introductory';
  if (sessionCount >= 5 && lensCount >= 3) return 'deep';
  if (sessionCount >= 2 && sessionCount <= 4 && lensCount >= 1) return 'working';
  return sessionCount >= 2 ? 'working' : 'introductory';
}

// ─── FUNCTION 8 ───────────────────────────────────────────────────────────────

/**
 * v2.7 § TRUST STAGES lens gating.
 * introductory → LEAP,PRISM; working → LEAP,COACH,PRISM,IMPACT,QUEST,DRIVE;
 * deep/partner → all 11.
 */
export function lensesAllowedForStage(stage: TrustStage): LensCode[] {
  if (stage === 'introductory') return ['LEAP', 'PRISM'];
  if (stage === 'working') return ['LEAP', 'COACH', 'PRISM', 'IMPACT', 'QUEST', 'DRIVE'];
  return ['CPI','LEAP','COACH','PRISM','IMPACT','QUEST','BRIDGE','MOSAIC','DRIVE','SPARK','FORGE'];
}

// ─── FUNCTION 9 ───────────────────────────────────────────────────────────────

/**
 * v2.7 § QUALITY 12-GATE + POSITIONING ANCHOR + VOICE DON'Ts + v2.7 NEW HARD GATES (G13-G16).
 * Auto-clean where possible. Non-strippable: G4/G6 (>2 questions), G13 neg defs, G16 vector-B structure.
 *
 * G7 lists, G8 self-ref, G4/G6 questions, G12 (hedges + warm sign-offs + validation preambles + !→.),
 * G3 (emojis + casual words), plus G13/G14/G15/G16 new gates.
 */
export function validate12Gates(
  text: string,
  opts?: { vector?: OpeningVector }
): { passed: boolean; failures: string[]; cleaned: string } {
  const failures: string[] = [];
  let cleaned = text || '';
  const vector = opts?.vector;

  const nonStrippableFailures: string[] = [];

  // ── G4/G6: >2 questions → FAIL non-strippable ──
  const qCount = (cleaned.match(/[?]/g) || []).length;
  if (qCount > 2) {
    nonStrippableFailures.push('G4/G6: More than 2 questions (count=' + qCount + ')');
  }

  // ── G13: Negative definitions → FAIL non-strippable ──
  if (/not a recruiter|not a career coach|not a cv-writer|not a coach|not an assistant|not a tool|not a therapist|not hr/i.test(cleaned)) {
    nonStrippableFailures.push('G13: Negative definition (what NEXUS is not)');
  }

  // ── G14: Internal-mode labels user-facing → strip + failure if present ──
  const g14SelfLabelsBefore = /\bdiagnostician\b|Cross-Border Specialist|Reflector|\bStrategist\b|\bBuilder\b/i.test(cleaned);
  cleaned = cleaned.replace(/\bdiagnostician\b/gi, '');
  cleaned = cleaned.replace(/Cross-Border Specialist/gi, '');
  cleaned = cleaned.replace(/\bReflector\b/g, '');
  cleaned = cleaned.replace(/\bStrategist\b/g, '');
  cleaned = cleaned.replace(/\bBuilder\b/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  if (g14SelfLabelsBefore) {
    failures.push('G14: Internal mode label surfaced (auto-stripped)');
  }

  // ── G15: Non-D openings → FAIL if vector !== D and greeting matches. Best-effort strip. ──
  const g15Re = /^(i'?m nexus|hi|hello|hey|welcome|good (morning|afternoon|evening)|how can i help|here to help)/i;
  if (vector !== undefined && vector !== 'D' && g15Re.test(cleaned.trim())) {
    failures.push('G15: Greeting/self-intro used on non-D vector');
    cleaned = cleaned.trim().split(/\n\n+/).map((para, idx) => {
      if (idx === 0 && g15Re.test(para.trim())) return '';
      return para;
    }).filter(Boolean).join('\n\n');
  }

  // ── G16: Vector B structure → 3+ paragraphs. Non-strippable <3. ──
  if (vector === 'B') {
    const paragraphs = cleaned.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length < 3) {
      nonStrippableFailures.push('G16: Vector B requires ≥3 double-newline-separated paragraphs (count=' + paragraphs.length + ')');
    }
  }

  // ── G7: Bullet lists → strip + failure ──
  const hasBullets = /(^|\n)\s*[-*•·]\s|(^|\n)\s*\d+[\.\)]\s/m.test(cleaned);
  if (hasBullets) {
    failures.push('G7: Bullet/numbered list detected (attempted strip)');
    cleaned = cleaned.replace(/(^|\n)\s*[-*•·]\s/g, '$1');
    cleaned = cleaned.replace(/(^|\n)\s*\d+[\.\)]\s/g, '$1');
  }

  // ── G8: Self-reference → strip + failure ──
  const selfRefRe = /\b(as an AI|in my analysis|my analysis|i think|i believe|i feel|in my opinion|my take)\b/gi;
  if (selfRefRe.test(cleaned)) {
    failures.push('G8: Self-reference detected (auto-stripped)');
    cleaned = cleaned.replace(selfRefRe, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }

  // ── G12: Hedges + warm sign-offs + validation preambles + ! → . ──
  const hedgesRe = /(^|\s)(I wonder if|it could be that|you might want to|perhaps|maybe|possibly|i suggest|i'd suggest|would you like to|let'?s explore that|how does that land\??)/gi;
  const warmSignoffsRe = /(you'?ve got this|i'?m here for you|stay strong|you can do it|keep going|all the best|cheers|warm regards|you are not alone)/gi;
  const validationRe = /^(thank you for sharing|that takes courage|i can understand|thanks for telling me|i appreciate you sharing|that really resonates|i hear you|that makes sense)/i;

  if (hedgesRe.test(cleaned)) failures.push('G12: Hedging language (auto-stripped)');
  cleaned = cleaned.replace(hedgesRe, ' ');

  if (warmSignoffsRe.test(cleaned)) failures.push('G12: Warm sign-off (auto-stripped)');
  cleaned = cleaned.replace(warmSignoffsRe, '');

  if (validationRe.test(cleaned.trim())) failures.push('G12: Validation preamble (auto-stripped)');
  cleaned = cleaned.replace(new RegExp('^(?:' + validationRe.source + ')\\s*[,\\.!?]?\\s*', 'i'), '');

  if (/!/.test(cleaned)) {
    if (!failures.includes('G12: Hedging language (auto-stripped)') &&
        !failures.includes('G12: Warm sign-off (auto-stripped)') &&
        !failures.includes('G12: Validation preamble (auto-stripped)')) {
      failures.push('G12: Exclamation marks converted to periods');
    }
    cleaned = cleaned.replace(/!/g, '.');
  }

  // ── G12 (v2.7): Confrontational language → FAIL ──
  const confrontationalRe = /\b(say it|you're avoiding the question|stop avoiding|just answer|don't dodge)\b/gi;
  if (confrontationalRe.test(cleaned)) {
    failures.push('G12: Confrontational language (v2.7 DON\'T — rude, not cool)');
    cleaned = cleaned.replace(confrontationalRe, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }

  // ── G12 (v2.7): Invented consultant jargon → FAIL ──
  const jargonRe = /\b(altitude ceiling|signal calibration problem|authority translation|visibility-legitimacy gap)\b/gi;
  if (jargonRe.test(cleaned)) {
    failures.push('G12: Invented consultant jargon (v2.7 DON\'T — use real business English)');
    cleaned = cleaned.replace(jargonRe, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }

  // ── G12 (v2.7): Coach-template phrases → FAIL ──
  const coachTemplateRe = /\b(let'?s explore that|would you like to go deeper|how does that land|tell me more about|what comes up for you)\b/gi;
  if (coachTemplateRe.test(cleaned)) {
    failures.push('G12: Coach-template phrase (v2.7 DON\'T)');
    cleaned = cleaned.replace(coachTemplateRe, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }

  // ── G3: Emojis + casual words ──
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/u;
  const casualWordsRe = /\b(awesome|amazing|cool|wow|yay|super|totally|literally|vibe|chill|lol|haha|hehe|omg|yep|nope|gotcha|wanna|gonna|kinda|sorta)\b/gi;

  if (emojiRe.test(cleaned)) {
    failures.push('G3: Emoji detected (auto-stripped)');
    cleaned = cleaned.replace(emojiRe, '');
  }
  if (casualWordsRe.test(cleaned)) {
    failures.push('G3: Casual language (auto-stripped)');
    cleaned = cleaned.replace(casualWordsRe, '');
  }

  // Cleanup extra whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/^\s+|\s+$/gm, '');

  const allFailures = [...failures, ...nonStrippableFailures];
  const passed = nonStrippableFailures.length === 0;

  return { passed, failures: allFailures, cleaned };
}

// ─── FUNCTION 10 ──────────────────────────────────────────────────────────────

/**
 * Build runtime context block to append AFTER MASTER_PROMPT v2.7.
 * v2.7 § OPENING SCRIPTS, § TURN ENGINE, § LENS SUGGESTION LOGIC, § TRUST STAGES, § POSITIONING GUARDRAILS.
 */
export function buildRuntimeContext(opts: {
  lane: Lane;
  patterns?: string[];
  lensSignals?: Partial<Record<LensCode, number>>;
  suggestible?: LensCode[];
  trustStage?: TrustStage;
  sessionCount?: number;
  isOnboarding?: boolean;
  isReturnSession?: boolean;
  openingVector?: OpeningVector;
  userProfile?: Record<string, unknown>;
  activeMilestone?: string;
}): string {
  const lane = opts?.lane ?? 'universal';
  const patternsForCtx = opts?.patterns ?? [];
  const signals = opts?.lensSignals ?? {};
  const suggestible = opts?.suggestible ?? [];
  const trustStage = opts?.trustStage ?? 'introductory';
  const allowed = lensesAllowedForStage(trustStage);
  const sessionCount = opts?.sessionCount ?? 0;
  const vector = opts?.openingVector ?? 'A';
  const isOnboarding = opts?.isOnboarding ?? sessionCount <= 1;
  const isReturn = opts?.isReturnSession ?? false;
  const userProfile = opts?.userProfile ?? {};
  const milestone = opts?.activeMilestone ?? '';

  let openingBlock = '';
  if (vector === 'D') {
    openingBlock = "OPENING VECTOR D (NEXUS first message — ONLY allowed self-intro):\nLOCKED SCRIPT VERBATIM — do not rephrase, do not add bullets, do not add welcome/enthusiasm:\n\"I'm NEXUS. I work with senior people on the structural side of career and leadership transitions — the stuff that standard advice usually misses.\nPromotion decisions that don't make sense. Cross-border roles where the playbook doesn't translate. Career pivots where the skill is there but the signal isn't landing. Board readiness. Organizational change.\nMost people start by bringing whatever's currently taking up the most headspace. We dig into it, and you leave with a clearer picture of what's actually going on underneath.\nWhat's been on your mind lately?\"\nGuardrails for D: 4 paragraphs, white space, no bullets, no \"welcome\", no \"I'm excited\".";
  } else if (vector === 'B') {
    openingBlock = "OPENING VECTOR B (user asked \"what do you do\" / scope question)\nLOCKED STRUCTURE + EXACT APPROVED COPY VERBATIM:\n\"I work with senior people on the structural side of career and leadership transitions. Promotion decisions that don't make sense, cross-border roles where the playbook doesn't translate, career pivots where the skill is there but the signal isn't landing.\nStandard advice doesn't usually help with these — because standard advice targets the surface level, and the real problem is usually one layer down.\nWhat's been taking up most of your headspace lately?\"\nLOCKED REMINDERS for vector B:\n- NO negative definitions. Never say \"not a recruiter, not a career coach…\"\n- NO bullet points / lists ever. Paragraphs only.\n- NO corporate speak / HR register.\n- This is NOT a self-introduction (that is vector D only). Do not introduce yourself as NEXUS here.\n- LOCKED STRUCTURE: scope sentence → 2-3 concrete examples → method/differentiator (1 line) → question. Must produce ≥3 double-newline-separated paragraphs (G16).";
  } else if (vector === 'C') {
    openingBlock = "OPENING VECTOR C (user requested deep diagnostic)\nLOCKED OPENING QUESTION VERBATIM — zero fanfare, no preamble, open directly with:\n\"Alright. Start with the thing that's currently taking up the most space in your working week — the situation you keep replaying in your head. Tell me what's going on.\"\nNo \"okay let's begin a diagnostic\". Just the question. Then follow Turn Engine: observation → implication → question.";
  } else {
    openingBlock = "OPENING VECTOR A (user arrived with a specific problem)\nPROTOCOL: No intro. No \"I'll route you to the X advisor.\" Just be the advisor.\nStructure requirement: One observational read + one structural implication + one question.\nSingle turn focus (G6): assess / challenge / reframe / question — pick ONE. Do not multi-task.\nFT register: cool-respectful coaching voice, observation over question, statement over hedging.";
  }

  const onboardingBlock = isOnboarding
    ? "ONBOARDING PROTOCOL (sessionCount=' + sessionCount + '):\nTurn 0 → Turn 1 → Turn 2:\n- Turn 0: Opening script (only if NEXUS starts — Vector D).\n- Turn 1: User responds. If they bring a specific problem → dive in. No recap of scope.\n- Turn 2: Onboarding over. Either working on something real or engagement at risk.\nSuccess metric after 2-3 exchanges: user thinks \"This is actually seeing something I haven't seen before.\""
    : "SESSION RESUME / RETURN DISCIPLINE:\nMemory rules — reference explicitly:\n  • Patterns identified in prior sessions\n  • Open questions left hanging\n  • Structural connections between old and new topics\nNever reference explicitly: session count, specific dates, process milestones, admin details.\nClosing protocol at session end:\n  • One sharp closing observation (not \"great session\" or \"you've made progress\")\n  • One forward-looking question or statement — something that hangs\n  • Never \"to summarize\"\n  • Never \"thank you for your time\"";

  return [
    '=== RUNTIME CONTEXT (append after MASTER_PROMPT v2.7) ===',
    '',
    'ACTIVE LANE (internal — NEVER surface to user. China activates by Lane 3 + contextual evidence only, never default):',
    'lane=' + lane,
    '',
    'PATTERN CONTEXT (private — reference pattern thinking, do not name patterns to user):',
    (patternsForCtx.length ? patternsForCtx.join('\n') : '(no triggers matched yet)'),
    '',
    'LENS STATE:',
    '  signals=' + JSON.stringify(signals),
    '  suggestible (>=7/10): ' + (suggestible.length ? suggestible.join(', ') : '(none)'),
    '  trust_stage=' + trustStage + ' (sessionCount=' + sessionCount + ', activeLenses=' + Object.keys(signals).length + ')',
    '  lenses_allowed_for_stage=' + allowed.join(', '),
    '  LENS RULES: Never suggest lens below signal 7. User says no/not-now → drop forever. No follow-up ever.',
    '',
    openingBlock,
    '',
    onboardingBlock,
    '',
    'USER PROFILE + ACTIVE MILESTONE (internal context):',
    '  active_milestone: ' + (milestone || '(none)'),
    '  profile: ' + (Object.keys(userProfile).length ? JSON.stringify(userProfile) : '(none)'),
    '',
    'POSITIONING GUARDRAILS REMINDER BLOCK (LAST — re-read before responding):',
    '  1. DIAGNOSTICS = entry point, NOT the scope, NOT the product, NOT the identity.',
    '     Diagnose first because you can\'t move forward on something you can\'t see.',
    '     Once the pattern is clear → move forward with strategy, planning, positioning, execution guidance.',
    '  2. NEVER define NEXUS by what it is NOT. No negative definitions (G13 FAIL).',
    '     State scope positively and precisely.',
    '  3. NEVER call yourself "diagnostician" or any other internal mode name to the user.',
    '     Only name to use: NEXUS. Nothing more, nothing less (G14 FAIL).',
    '  4. SCOPE TEST (altitude): If a senior leader would bring it to an executive coach,',
    '     leadership advisor, career strategist, or search consultant → IN SCOPE.',
    '     Entry-level resume optimization / basic job-search tactics → OUT OF SCOPE.',
    ''
  ].join('\n');
}