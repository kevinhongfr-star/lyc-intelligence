/**
 * N1 Nexus Intent Router service
 *
 * Routes natural language → handler, confidence + tier gating.
 * Wired into Chat session dispatch endpoint: /api/_lib/chatHandler + /api/dispatch
 */

export interface Intent {
  id: string;
  intent: string;
  displayName: string;
  pattern: RegExp;
  examples: string[];
  handler: string;
  baseConfidence: number;
  tier: 'free' | 'core' | 'premium';
  creditCost: number;
}

export interface IntentMatch {
  intent: Intent | null;
  confidence: number;
  score: number;
  reason: string;
  fallback?: {
    suggestions: string[];
  };
}

export const INTENTS: Intent[] = [
  {
    id: 'mandate_search',
    intent: 'mandate_search',
    displayName: 'Mandate Search',
    pattern: /mandate.*(search|find|list|open|show)|(search|find).*mandate/i,
    examples: ['Find mandates for CFO in APAC', 'Show open mandates', 'List mandates in tech'],
    handler: 'matchService.searchMandates',
    baseConfidence: 0.92,
    tier: 'core',
    creditCost: 2,
  },
  {
    id: 'candidate_lookup',
    intent: 'candidate_lookup',
    displayName: 'Candidate Lookup',
    pattern: /candidate.*(find|search|profile|show)|(find|look).*candidate|profile.*candidate/i,
    examples: ['Find Priya Sharma profile', 'Candidates with supply chain experience'],
    handler: 'matchService.searchCandidates',
    baseConfidence: 0.90,
    tier: 'core',
    creditCost: 2,
  },
  {
    id: 'document_generate',
    intent: 'document_generate',
    displayName: 'Generate Document',
    pattern: /(generate|draft|create|write).*(proposal|report|email|letter|brief|debrief)/i,
    examples: ['Draft D01 proposal for mandate #482', 'Write an offer letter'],
    handler: 'ai.generateDocument',
    baseConfidence: 0.88,
    tier: 'premium',
    creditCost: 5,
  },
  {
    id: 'score_compare',
    intent: 'score_compare',
    displayName: 'Score / Compare Candidates',
    pattern: /(compare|score|shortlist|rank).*(candidate|people|shortlist)/i,
    examples: ['Compare candidates 4, 8, 15', 'Score shortlist'],
    handler: 'matchService.compareCandidates',
    baseConfidence: 0.91,
    tier: 'core',
    creditCost: 3,
  },
  {
    id: 'schedule_interview',
    intent: 'schedule_interview',
    displayName: 'Schedule Interview',
    pattern: /(schedule|book|plan|arrange).*(interview|meeting|slot|time)/i,
    examples: ['Schedule round 2 for Priya'],
    handler: 'scheduler.suggestTimes',
    baseConfidence: 0.85,
    tier: 'core',
    creditCost: 2,
  },
  {
    id: 'career_advice',
    intent: 'career_advice',
    displayName: 'Career Advice',
    pattern: /(advice|help|should|opinion|suggest).*(career|move|offer|decision)/i,
    examples: ['Should I take this offer?', 'Help me decide'],
    handler: 'nexus.coachAdvice',
    baseConfidence: 0.87,
    tier: 'free',
    creditCost: 0,
  },
  {
    id: 'comp_negotiate',
    intent: 'comp_negotiate',
    displayName: 'Compensation Benchmark / Negotiate',
    pattern: /(salary|compensation|negotiate|offer.*worth|pay).*(benchmark|compare|fair|market)/i,
    examples: ['Is 180k SGD fair for CFO in Singapore?', 'Negotiate offer'],
    handler: 'ai.compBenchmark',
    baseConfidence: 0.84,
    tier: 'premium',
    creditCost: 5,
  },
  {
    id: 'market_intel',
    intent: 'market_intel',
    displayName: 'Market Intelligence',
    pattern: /(market|trend|competition|industry|talent).*(intel|report|insight|trend|salary|benchmark)/i,
    examples: ['APAC CFO compensation 2026 trend', 'Tech talent supply in SG'],
    handler: 'intelligence.getMarketIntel',
    baseConfidence: 0.82,
    tier: 'premium',
    creditCost: 8,
  },
  {
    id: 'onboarding_wizard',
    intent: 'onboarding_wizard',
    displayName: 'Onboarding / Help',
    pattern: /(onboard|setup|first.*time|get.*started|welcome|help.*start)/i,
    examples: ['Help me get started', 'Setup my profile'],
    handler: 'onboarding.advance',
    baseConfidence: 0.94,
    tier: 'free',
    creditCost: 0,
  },
  {
    id: 'escalate_kevin',
    intent: 'escalate_kevin',
    displayName: 'Handoff / Escalate to Kevin',
    pattern: /(kevin|human|escalat|talk.*(person|human|someone)|need.*help)|(speak).*(boss|manager|kevin)/i,
    examples: ['Talk to Kevin', 'I need human help'],
    handler: 'handoff.toKevin',
    baseConfidence: 0.95,
    tier: 'premium',
    creditCost: 0,
  },
];

/**
 * N1: Primary route function
 * @returns intent match
 */
export function routeIntent(
  query: string,
  opts: { tier: 'free' | 'core' | 'premium' | 'staff' } = { tier: 'core' }
): IntentMatch {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { intent: null, confidence: 0, score: 0, reason: 'Empty query' };

  const scored: { intent: Intent; score: number; reasons: string[] }[] = [];

  for (const intent of INTENTS) {
    // 1: regex match boost × 1.0
    const patternMatch = intent.pattern.test(query);
    // 2: keyword overlap with intent examples
    const qWords = new Set(normalized.split(/\W+/).filter((w) => w.length > 2));
    let overlap = 0;
    intent.examples
      .flatMap((ex) => ex.toLowerCase().split(/\W+/))
      .filter(Boolean)
      .forEach((w) => {
        if (qWords.has(w)) overlap += 1;
      });
    const keywordScore = Math.min(1, overlap / 4);
    const patternScore = patternMatch ? 1 : 0;
    const composite = patternScore * 0.6 + keywordScore * 0.4;
    const finalScore = composite * intent.baseConfidence;

    if (finalScore > 0.15) {
      scored.push({
        intent,
        score: finalScore,
        reasons: [
          patternMatch ? 'regex match' : null,
          overlap > 0 ? `${overlap} keyword matches with examples` : null,
        ].filter(Boolean) as string[],
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      intent: null,
      confidence: 0,
      score: 0,
      reason: 'No intents matched. Low overlap',
      fallback: {
        suggestions: ['Try rephrasing with keywords like "mandate", "candidate", "generate report"'],
      },
    };
  }

  const top = scored[0];
  // N3: Check gate on tier
  const TIER_RANK = ['staff', 'premium', 'core', 'free'];
  const userIdx = TIER_RANK.indexOf(opts.tier || 'core');
  const intentIdx = TIER_RANK.indexOf(top.intent.tier);
  const gated = userIdx > intentIdx;

  if (gated) {
    return {
      intent: null,
      confidence: top.score,
      score: top.score,
      reason: `Intent ${top.intent.id} requires tier ${top.intent.tier} or higher. Current: ${opts.tier}.`,
      fallback: {
        suggestions: [
          `Upgrade to ${top.intent.tier} to use this feature.`,
          'Current tier insufficient',
        ],
      },
    };
  }

  return {
    intent: top.intent,
    confidence: top.score,
    score: top.score,
    reason: top.reasons.join(' + '),
  };
}

/**
 * Run all intents list + handlers
 */
export function listIntents(): Intent[] {
  return INTENTS.slice();
}

export default {
  routeIntent,
  listIntents,
  INTENTS,
};
