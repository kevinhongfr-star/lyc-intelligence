/**
 * intentClassifier.ts — NEXUS Intent Classification Engine (#39)
 *
 * 11 canonical intents from ticket #39:
 *   general_chat, career_guidance, assessment_help, content_query,
 *   recommendation_request, goal_setting, progress_tracking,
 *   technical_support, billing_questions, escalation, off_topic
 *
 * classifyIntent() = heuristic keyword classifier returning confidence 0–1.
 * Confidence < 0.7 → fallback to general_chat.
 * routeModel()     = Flash (1 mi) or Pro (3 mi) routing decision.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Intent type + keyword sets
// ─────────────────────────────────────────────────────────────────────────────

export const NEXUS_INTENTS = [
  'general_chat',
  'career_guidance',
  'assessment_help',
  'content_query',
  'recommendation_request',
  'goal_setting',
  'progress_tracking',
  'technical_support',
  'billing_questions',
  'escalation',
  'off_topic',
] as const;

export type NexusIntent = (typeof NEXUS_INTENTS)[number];

export interface IntentKeywordSet {
  intent: NexusIntent;
  /** High-signal primary keywords — strong boost */
  primary: string[];
  /** Moderate-signal secondary keywords — mild boost */
  secondary: string[];
  /** Negative keywords — reduce confidence for this intent */
  negative: string[];
  /** Minimum raw score to consider before confidence normalization */
  threshold: number;
}

const INTENT_KEYWORDS: IntentKeywordSet[] = [
  {
    intent: 'career_guidance',
    primary: [
      'career', 'next role', 'transition', 'move', 'positioning', 'search firm',
      'board presentation', 'stakeholder', 'executive presence', 'c-suite',
      'promotion', 'salary', 'offer', 'negotiation', 'interview', 'cv', 'resume',
      'linkedin', 'profile', 'personal brand', 'visibility',
    ],
    secondary: [
      'what should i do', 'which direction', 'how to advance', 'next step',
      'career move', 'job change', 'job search', 'headhunter', 'recruiter',
    ],
    negative: ['assessment', 'diagnostic', 'instrument', 'price', 'cost', 'miles'],
    threshold: 2,
  },
  {
    intent: 'assessment_help',
    primary: [
      'assessment', 'diagnostic', 'instrument', 'prism', 'spark', 'forge',
      'bridge', 'mosaic', 'drive', 'leap', 'quest', 'impact', 'coach', 'cpi',
      'questionnaire', 'questions', 'result', 'report', 'score', 'complete',
      'taking an assessment', 'start assessment', 'assessment results',
    ],
    secondary: [
      'how does it work', 'what do i get', 'dimension', 'archetype', 'benchmark',
      'framework', 'methodology', 'scoring',
    ],
    negative: ['login', 'password', 'payment', 'bill', 'refund'],
    threshold: 1,
  },
  {
    intent: 'content_query',
    primary: [
      'what is', 'explain', 'define', 'tell me about', 'how does',
      'difference between', 'compare', 'vs', 'versus', 'meaning of',
      'article', 'research', 'data', 'report', 'study',
    ],
    secondary: [
      'why do', 'how do', 'who is', 'when do', 'where can',
    ],
    negative: ['assessment', 'recommend', 'help me', 'billing', 'login'],
    threshold: 2,
  },
  {
    intent: 'recommendation_request',
    primary: [
      'recommend', 'should i take', 'which assessment', 'best for me',
      'suggest', 'advise which', 'pick one', 'choose between',
      'which instrument', 'what framework', 'which diagnostic',
    ],
    secondary: [
      'good for me', 'fit for me', 'right for me', 'what would you', 'what do you suggest',
    ],
    negative: ['how much', 'price', 'miles', 'login', 'password'],
    threshold: 1,
  },
  {
    intent: 'goal_setting',
    primary: [
      'goal', 'objective', 'target', 'milestone', '90 day', '180 day',
      'development plan', 'growth plan', 'career goal', 'personal goal',
      'okrs', 'kpi', 'want to achieve', 'set out to',
    ],
    secondary: [
      'plan for', 'roadmap', 'timeline', 'i want to', 'aspiration',
      'ambition', 'where do i start',
    ],
    negative: ['assessment', 'result', 'report', 'price', 'bill'],
    threshold: 2,
  },
  {
    intent: 'progress_tracking',
    primary: [
      'progress', 'track', 'how am i doing', 'status', 'update',
      'dashboard', 'overview', 'miles', 'balance', 'earned', 'history',
      'assessment history', 'my results', 'my profile', 'journey',
    ],
    secondary: [
      'where am i', 'my progress', 'my stats', 'completion', 'achievement',
    ],
    negative: ['recommend', 'assessment help', 'login', 'password'],
    threshold: 2,
  },
  {
    intent: 'technical_support',
    primary: [
      'technical', 'error', 'bug', 'broken', 'not working', 'issue',
      'login', 'password', 'sign in', 'cant access', 'cant log',
      'loading', 'slow', 'crash', 'glitch', 'support', 'help me',
    ],
    secondary: [
      'trouble', 'problem', 'difficulty', 'wont load', 'fails', 'stuck',
    ],
    negative: ['assessment', 'recommend', 'career', 'price', 'bill'],
    threshold: 2,
  },
  {
    intent: 'billing_questions',
    primary: [
      'billing', 'invoice', 'payment', 'price', 'cost', 'miles', 'refund',
      'subscription', 'membership', 'tier', 'upgrade', 'downgrade',
      'cancel', 'renewal', 'charge', 'credit card', 'receipt',
    ],
    secondary: [
      'how much', 'pay', 'pricing', 'plan', 'bill me', 'charged',
    ],
    negative: ['assessment', 'recommend', 'career', 'login', 'password'],
    threshold: 1,
  },
  {
    intent: 'escalation',
    primary: [
      'speak to a human', 'speak to someone', 'talk to a person',
      'consultant', 'escalate', 'urgent', 'emergency', 'need help now',
      'complaint', 'unhappy', 'terrible', 'worst', 'disappointed',
    ],
    secondary: [
      'not satisfied', 'wrong', 'this is not', 'you are not helping',
      'i want a refund', 'this is useless',
    ],
    negative: ['assessment', 'recommend', 'explain', 'define'],
    threshold: 1,
  },
  {
    intent: 'off_topic',
    primary: [
      'weather', 'joke', 'funny', 'movie', 'music', 'game', 'sport',
      'food', 'restaurant', 'travel', 'holiday', 'news', 'politics',
      'religion', 'dating', 'health advice', 'medical', 'legal advice',
      'tax advice', 'financial advice',
    ],
    secondary: [
      'how old are you', 'your name', 'who are you', 'your favorite',
      'tell me a story', 'sing', 'dance',
    ],
    negative: ['assessment', 'career', 'executive', 'leadership'],
    threshold: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Classify result type
// ─────────────────────────────────────────────────────────────────────────────

export interface ClassificationResult {
  intent: NexusIntent;
  confidence: number;
  scores: Partial<Record<NexusIntent, number>>;
  /** True if fallback to general_chat was applied */
  fallbackApplied: boolean;
  matchedKeywords: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. classifyIntent() — heuristic keyword classifier
// ─────────────────────────────────────────────────────────────────────────────

const CONFIDENCE_THRESHOLD = 0.7;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function classifyIntent(userMessage: string): ClassificationResult {
  if (!userMessage || !userMessage.trim()) {
    return {
      intent: 'general_chat',
      confidence: 0,
      scores: { general_chat: 0 },
      fallbackApplied: true,
      matchedKeywords: [],
    };
  }

  const normalized = normalize(userMessage);
  const tokens = normalized.split(' ');
  const scores: Partial<Record<NexusIntent, number>> = {};
  const matchedByIntent: Partial<Record<NexusIntent, string[]>> = {};

  for (const kwSet of INTENT_KEYWORDS) {
    let raw = 0;
    const matched: string[] = [];

    for (const kw of kwSet.primary) {
      const count = countPhraseOccurrences(normalized, kw);
      if (count > 0) {
        raw += count * 3;
        matched.push(kw);
      }
    }

    for (const kw of kwSet.secondary) {
      const count = countPhraseOccurrences(normalized, kw);
      if (count > 0) {
        raw += count * 1.5;
        matched.push(kw);
      }
    }

    for (const kw of kwSet.negative) {
      if (normalized.includes(kw)) {
        raw -= 1;
      }
    }

    if (raw >= kwSet.threshold) {
      scores[kwSet.intent] = raw;
    }
    if (matched.length > 0) {
      matchedByIntent[kwSet.intent] = matched;
    }
  }

  const scoreEntries = Object.entries(scores) as Array<[NexusIntent, number]>;
  scoreEntries.sort((a, b) => b[1] - a[1]);

  if (scoreEntries.length === 0) {
    return {
      intent: 'general_chat',
      confidence: 0.5,
      scores,
      fallbackApplied: true,
      matchedKeywords: [],
    };
  }

  const [topIntent, topScore] = scoreEntries[0];
  const secondScore = scoreEntries[1]?.[1] ?? 0;

  const gap = topScore - secondScore;
  let confidence = 0.5 + Math.min(gap / 10, 0.5);
  confidence = Math.min(1, Math.max(0, confidence));

  if (confidence < CONFIDENCE_THRESHOLD) {
    const allMatched: string[] = [];
    for (const arr of Object.values(matchedByIntent)) {
      for (const m of arr) allMatched.push(m);
    }
    return {
      intent: 'general_chat',
      confidence,
      scores,
      fallbackApplied: true,
      matchedKeywords: Array.from(new Set(allMatched)),
    };
  }

  return {
    intent: topIntent,
    confidence,
    scores,
    fallbackApplied: false,
    matchedKeywords: Array.from(new Set(matchedByIntent[topIntent] ?? [])),
  };
}

function countPhraseOccurrences(text: string, phrase: string): number {
  const p = phrase.toLowerCase().trim();
  if (!p) return 0;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'g');
  let count = 0;
  while (regex.exec(text) !== null) count++;
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Model routing — Flash (1 mi) vs Pro (3 mi)
// ─────────────────────────────────────────────────────────────────────────────

export type NexusModel = 'Flash' | 'Pro';

export interface ModelRoutingResult {
  model: NexusModel;
  costMiles: 1 | 3;
  rationale: string;
}

const PRO_INTENTS: NexusIntent[] = [
  'career_guidance',
  'assessment_help',
  'recommendation_request',
  'goal_setting',
  'progress_tracking',
  'escalation',
];

const FLASH_INTENTS: NexusIntent[] = [
  'general_chat',
  'content_query',
  'technical_support',
  'billing_questions',
  'off_topic',
];

export function routeModel(intent: NexusIntent, confidence: number = 0): ModelRoutingResult {
  if (PRO_INTENTS.includes(intent)) {
    return {
      model: 'Pro',
      costMiles: 3,
      rationale: `${intent} requires framework-aware, methodology-grounded response → DeepSeek-V3 (Pro).`,
    };
  }

  if (FLASH_INTENTS.includes(intent)) {
    return {
      model: 'Flash',
      costMiles: 1,
      rationale: `${intent} is high-volume, low-complexity → DeepSeek-V3-Flash (Flash).`,
    };
  }

  const usePro = confidence >= 0.85;
  return {
    model: usePro ? 'Pro' : 'Flash',
    costMiles: usePro ? 3 : 1,
    rationale: usePro
      ? `High confidence (${(confidence * 100).toFixed(0)}%) → Pro.`
      : `Low confidence (${(confidence * 100).toFixed(0)}%) → conservative Flash routing.`,
  };
}
