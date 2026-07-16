/**
 * api/chat.ts — Public Nexus chatbot endpoint (DeepSeek-backed)
 *
 * Standalone Vercel serverless function. Does NOT route through
 * api/dispatch.ts (which requires auth). Allows anonymous/free-tier
 * users to chat with the Nexus advisor.
 *
 * Per Kevin's directive: all LLM compute goes through DeepSeek only.
 * Coze = orchestration only.
 *
 * Request body (POST /api/chat):
 *   {
 *     message: string,
 *     history: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
 *     userId?: string,
 *     tier?: 'free' | 'client' | 'unlimited',
 *     memoryContext?: any[],
 *     documentContext?: string,
 *     systemPrompt?: string
 *   }
 *
 * Response body:
 *   { response: string, suggested_prompts?: string[] }
 *
 * Tier limits (in-memory counter — TODO: persist to Supabase):
 *   free      → 5 messages/day
 *   client    → 50 messages/day
 *   unlimited → no cap
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSystemPrompt, type PortalType } from './_lib/nexusPrompts.js';
import { fetchUserContext, determinePortalType } from './_lib/nexusContext.js';

export const maxDuration = 30;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

const DEFAULT_SYSTEM_PROMPT = `You are Nexus, LYC Partners' AI-powered cross-border leadership advisor. You are trained on LYC's China-APAC leadership intelligence database. You help executives and board members with:
- Positioning for China-to-global leadership roles
- Understanding what Asian boards look for in C-suite candidates
- Navigating cross-border executive transitions
- Building strong China-APAC leadership profiles
Be concise, data-driven, and authoritative. Cite specific examples when possible. If asked about topics outside your domain, politely redirect to leadership and executive search topics.`;

const TIER_LIMITS: Record<string, number> = {
  free: 5,
  client: 50,
  unlimited: Infinity,
};

// In-memory rate-limit counter. Resets on cold start, so this is best-effort
// and intended as a UI guardrail, not a security boundary.
// TODO: persist counts to Supabase keyed by userId for true cross-instance enforcement.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const DAY_MS = 24 * 60 * 60 * 1000;

function getRateLimitState(key: string, limit: number): { allowed: boolean; remaining: number } {
  if (limit === Infinity) return { allowed: true, remaining: Infinity };
  const now = Date.now();
  const state = rateLimitStore.get(key);
  if (!state || now > state.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + DAY_MS });
    return { allowed: true, remaining: limit - 1 };
  }
  if (state.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  state.count += 1;
  return { allowed: true, remaining: limit - state.count };
}

function sanitizeHistory(
  history: Array<{ role?: string; content?: string }> | undefined
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content as string }));
}

function buildSuggestedPrompts(lastMessage: string): string[] {
  // Light heuristic — keep things stable and on-domain.
  return [
    'What are boards looking for in C-suite candidates today?',
    'How should I position myself for a China-to-global role?',
    'Show me a recent cross-border transition example.',
  ];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ response: 'Method not allowed.' });
  }

  if (!DEEPSEEK_API_KEY) {
    console.error('[api/chat] DEEPSEEK_API_KEY is not configured');
    return res.status(500).json({
      response: 'The chat service is not configured right now. Please contact support.',
    });
  }

  const body = (req.body || {}) as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
    userId?: string;
    tier?: string;
    portalType?: string;
    memoryContext?: any[];
    documentContext?: string;
    systemPrompt?: string;
  };

  const message = (body.message || '').toString().trim();
  if (!message) {
    return res.status(400).json({ response: 'Message is required.' });
  }

  const tier = (body.tier || 'free').toLowerCase();
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  const rateKey = `${body.userId || 'anon'}:${tier}`;
  const rate = getRateLimitState(rateKey, limit);
  if (!rate.allowed) {
    return res.status(429).json({
      response: `You've reached today's message limit for the ${tier} tier. Please try again tomorrow or upgrade.`,
      suggested_prompts: [],
    });
  }

  let systemPrompt = DEFAULT_SYSTEM_PROMPT;

  if (body.userId) {
    try {
      const detectedType = body.portalType as PortalType | undefined || await determinePortalType(body.userId);
      const userContext = await fetchUserContext(body.userId, detectedType);
      systemPrompt = buildSystemPrompt(detectedType, userContext);
    } catch (e) {
      console.error('[api/chat] Context fetch error:', e);
    }
  }

  if (body.systemPrompt && body.systemPrompt.toString().trim()) {
    systemPrompt = body.systemPrompt.toString();
  }

  // Compose messages array for DeepSeek
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Inject document/memory context into system channel if provided
  const contextBits: string[] = [];
  if (body.documentContext && body.documentContext.toString().trim()) {
    contextBits.push(`Document context:\n${body.documentContext}`);
  }
  if (Array.isArray(body.memoryContext) && body.memoryContext.length > 0) {
    contextBits.push(`Memory context:\n${JSON.stringify(body.memoryContext).slice(0, 2000)}`);
  }
  if (contextBits.length > 0) {
    messages.push({ role: 'system', content: contextBits.join('\n\n') });
  }

  const cleanHistory = sanitizeHistory(body.history);
  for (const turn of cleanHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({ role: 'user', content: message });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const upstream = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.5,
        max_tokens: 800,
        messages,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('[api/chat] DeepSeek error', upstream.status, text.slice(0, 200));
      return res.status(502).json({
        response: 'I had trouble reaching the model. Please try again in a moment.',
        suggested_prompts: buildSuggestedPrompts(message),
      });
    }

    const json = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = json.choices?.[0]?.message?.content?.toString().trim() || '';

    if (!reply) {
      return res.status(502).json({
        response: "I didn't catch a response. Could you rephrase that?",
        suggested_prompts: buildSuggestedPrompts(message),
      });
    }

    return res.status(200).json({
      response: reply,
      suggested_prompts: buildSuggestedPrompts(message),
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('[api/chat] DeepSeek call timed out');
      return res.status(504).json({
        response: 'The response is taking longer than expected. Please try again.',
        suggested_prompts: buildSuggestedPrompts(message),
      });
    }
    console.error('[api/chat] Unhandled error:', err);
    return res.status(500).json({
      response: "I'm having trouble connecting right now. Please try again in a moment.",
      suggested_prompts: buildSuggestedPrompts(message),
    });
  } finally {
    clearTimeout(timeout);
  }
}
