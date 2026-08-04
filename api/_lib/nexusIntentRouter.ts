/**
 * api/_lib/nexusIntentRouter.ts — S7-T01 (N1)
 *
 * Intent classifier for the Nexus conversation engine. Routes user messages
 * to one of 11 intents using DeepSeek (Flash model = low-latency classification,
 * target < 500ms) and returns per-intent system-prompt instructions + tier gating.
 *
 * Spec: docs/DEX_AI_NEXUS_PHASE1_TICKETS.md (N1 — Conversation Engine + Intent Router)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
// Flash = fast classification model. DeepSeek exposes `deepseek-chat` (V3) for chat
// and `deepseek-reasoner` (R1) for reasoning. We use deepseek-chat with tiny max_tokens
// as the "Flash" tier for sub-500ms intent classification.
const DEEPSEEK_FLASH_MODEL = process.env.DEEPSEEK_FLASH_MODEL || 'deepseek-chat';

export type NexusIntent =
  | 'career_advisory'
  | 'self_understanding'
  | 'market_intel'
  | 'compensation'
  | 'opportunity'
  | 'coaching'
  | 'peer_connection'
  | 'event'
  | 'skill_building'
  | 'system_nav'
  | 'out_of_scope';

export const NEXUS_INTENTS: NexusIntent[] = [
  'career_advisory',
  'self_understanding',
  'market_intel',
  'compensation',
  'opportunity',
  'coaching',
  'peer_connection',
  'event',
  'skill_building',
  'system_nav',
  'out_of_scope',
];

interface IntentConfig {
  label: string;
  description: string;
  keywords: string[];
  instructions: string; // injected into Layer 3 (intent instructions)
}

// Per-intent system-prompt instructions (Layer 3 of the 5-layer assembly).
export const INTENT_CONFIG: Record<NexusIntent, IntentConfig> = {
  career_advisory: {
    label: 'Career Advisory',
    description: 'Career trajectory, transitions, next moves',
    keywords: ['career', 'transition', 'next move', 'trajectory', 'role change', 'promotion'],
    instructions:
      'Apply the diagnostic protocol before recommending a path. Surface at most 2 candidate trajectories and the trade-offs between them. Avoid generic "follow your passion" framing.',
  },
  self_understanding: {
    label: 'Self-Understanding',
    description: 'Strengths, archetypes, self-assessment',
    keywords: ['strengths', 'archetype', 'self assess', 'who am i', 'profile', 'identity'],
    instructions:
      'Anchor advice in the user assessment profile if available. Use TRIDENT dimensions (Trajectory, Reach, Impact) when relevant. Never disclose proprietary scoring weights.',
  },
  market_intel: {
    label: 'Market Intelligence',
    description: 'Market conditions, demand, geography trends',
    keywords: ['market', 'demand', 'geography', 'apac', 'europe', 'trend', 'sector'],
    instructions:
      'Provide general market context only. Never reference specific client mandates or named placements. Use directional language ("the APAC CFO market has tightened") not specific intelligence.',
  },
  compensation: {
    label: 'Compensation',
    description: 'Salary, package, negotiation',
    keywords: ['salary', 'compensation', 'package', 'negotiate', 'equity', 'bonus', 'offer'],
    instructions:
      'Reference public benchmarks only. Do not disclose specific candidate offers. Provide a negotiation framework (anchor, justify, package) rather than a single number.',
  },
  opportunity: {
    label: 'Opportunity',
    description: 'Open mandates, role matches',
    keywords: ['opportunity', 'role', 'mandate', 'opening', 'position', 'apply'],
    instructions:
      'Direct user to /candidates/mandates for live openings. Do not disclose mandate client names. Share only public mandate fields (industry, location, level).',
  },
  coaching: {
    label: 'Coaching',
    description: '1:1 coaching, session booking',
    keywords: ['coach', 'session', 'book', '1:1', 'mentoring', 'guide'],
    instructions:
      'Offer to book a 1:1 coaching session via /dex/book. Charge 1 credit per booking. Surface consultant availability if known.',
  },
  peer_connection: {
    label: 'Peer Connection',
    description: 'Council member networking',
    keywords: ['peer', 'connect', 'network', 'council', 'member', 'introduction'],
    instructions:
      'Council-tier feature only. For non-council users, surface the Council upgrade path. Never share another member contact info without explicit consent.',
  },
  event: {
    label: 'Event',
    description: 'Council events, webinars',
    keywords: ['event', 'webinar', 'summit', 'meetup', 'salon', 'gather'],
    instructions:
      'Surface upcoming Council events if user is council-tier. Otherwise direct to public event calendar. Include registration CTA.',
  },
  skill_building: {
    label: 'Skill Building',
    description: 'Academy courses, development plans',
    keywords: ['skill', 'course', 'academy', 'learn', 'develop', 'training'],
    instructions:
      'Recommend Academy courses matched to the user assessment gaps. Link to /academy when available. Avoid generic "read more books" advice.',
  },
  system_nav: {
    label: 'System Navigation',
    description: 'How to use the platform',
    keywords: ['how do i', 'where', 'navigate', 'find', 'use', 'platform', 'feature'],
    instructions:
      'Provide concise navigation instructions. Direct user to the relevant portal page. Avoid deep technical explanations of internal systems.',
  },
  out_of_scope: {
    label: 'Out of Scope',
    description: 'Non-career topics, off-domain',
    keywords: ['weather', 'news', 'joke', 'politics', 'religion', 'sports'],
    instructions:
      'Politely decline and redirect to executive advisory topics. Do not engage with off-domain requests. Suggest 2-3 relevant on-domain prompts.',
  },
};

// Keyword pre-filter — short-circuits the LLM call when an unambiguous keyword match exists.
// Keeps p95 latency low for the common case.
function keywordClassify(message: string): NexusIntent | null {
  const lower = message.toLowerCase();
  let best: { intent: NexusIntent; score: number } | null = null;
  for (const intent of NEXUS_INTENTS) {
    const cfg = INTENT_CONFIG[intent];
    let score = 0;
    for (const kw of cfg.keywords) {
      if (lower.includes(kw)) score += kw.length > 6 ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { intent, score };
    }
  }
  // Require a confident keyword match (score >= 2) to short-circuit.
  return best && best.score >= 2 ? best.intent : null;
}

export interface IntentClassification {
  intent: NexusIntent;
  confidence: number; // 0..1
  latency_ms: number;
  method: 'keyword' | 'llm' | 'fallback';
}

/**
 * Classify the user message intent. Uses keyword pre-filter first, falls back to
 * a tiny DeepSeek call (Flash tier, max 10 tokens) for ambiguous messages.
 */
export async function classifyIntent(message: string): Promise<IntentClassification> {
  const start = Date.now();

  // 1. Keyword fast-path.
  const kwHit = keywordClassify(message);
  if (kwHit) {
    return {
      intent: kwHit,
      confidence: 0.85,
      latency_ms: Date.now() - start,
      method: 'keyword',
    };
  }

  // 2. LLM classification (Flash tier).
  if (DEEPSEEK_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500); // < 5s budget
      const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_FLASH_MODEL,
          messages: [
            {
              role: 'system',
              content: `Classify the user message into exactly one intent. Respond with JSON: {"intent":"<one of>","confidence":0..1}.
Intents: ${NEXUS_INTENTS.join(', ')}.
Rules:
- "system_nav" = platform navigation questions.
- "out_of_scope" = weather, jokes, politics, sports, news.
- Default to "career_advisory" if ambiguous.`,
            },
            { role: 'user', content: message.slice(0, 800) },
          ],
          max_tokens: 40,
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        const intent = NEXUS_INTENTS.includes(parsed.intent) ? parsed.intent : 'career_advisory';
        return {
          intent,
          confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.6)),
          latency_ms: Date.now() - start,
          method: 'llm',
        };
      }
    } catch (e) {
      console.warn('[nexusIntentRouter] LLM classification failed:', e);
    }
  }

  // 3. Fallback: default to career_advisory.
  return {
    intent: 'career_advisory',
    confidence: 0.4,
    latency_ms: Date.now() - start,
    method: 'fallback',
  };
}

/**
 * Tier gating per intent — what each tier is allowed to receive.
 * Used by Layer 4 (tier modifiers) in the system prompt.
 */
export function getIntentTierPolicy(
  intent: NexusIntent,
  tier: string,
): { allowed: boolean; depth: 'basic' | 'full' | 'premium'; note?: string } {
  const t = (tier || 'free').toLowerCase();

  // Council-only intents.
  if (intent === 'peer_connection' || intent === 'event') {
    if (t === 'council' || t === 'enterprise') {
      return { allowed: true, depth: 'premium', note: 'Council-tier premium access' };
    }
    return {
      allowed: false,
      depth: 'basic',
      note: 'Council membership required. Suggest upgrade to /pricing.',
    };
  }

  // Executive Introduction (free): basic responses only, no deep analysis.
  if (t === 'free' || t === 'intro') {
    if (intent === 'out_of_scope' || intent === 'system_nav') {
      return { allowed: true, depth: 'basic' };
    }
    return {
      allowed: true,
      depth: 'basic',
      note: 'Executive Introduction tier — provide high-level guidance only. Suggest upgrade for deeper analysis.',
    };
  }

  // Credit-pack users: full responses + market intelligence.
  if (t === 'basic' || t === 'pro' || t === 'member') {
    return { allowed: true, depth: 'full' };
  }

  // Council / Enterprise: premium responses, peer matching, event access.
  return { allowed: true, depth: 'premium' };
}

// ── Optional standalone HTTP handler: POST /api/nexus/intent ──
// Useful for debugging or pre-classification on the client.
export async function handleIntentClassify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }
  const result = await classifyIntent(message);
  const policy = getIntentTierPolicy(result.intent, req.body?.tier || 'free');
  return res.status(200).json({
    success: true,
    classification: result,
    config: {
      label: INTENT_CONFIG[result.intent].label,
      description: INTENT_CONFIG[result.intent].description,
    },
    tier_policy: policy,
  });
}
