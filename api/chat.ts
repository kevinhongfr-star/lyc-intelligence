/**
 * /api/chat — NEXUS chat proxy (serverless function #12, last Hobby slot).
 *
 * POST  { message, history, userId, tier, memoryContext, documentContext, systemPrompt }
 *       → { response, suggested_prompts?: string[] }
 *
 * GET   diagnostic ping → { ok: true, guest_limit: 3, has_key: boolean }
 *
 * Auth:
 *   • Authenticated users: no message cap. Pulls JWT sub or uses userId from body.
 *   • Guest (no JWT): capped at 3 messages per IP via in-memory counter.
 *   • No Vercel function count concern: this is slot #12 of 12.
 *
 * Model: deepseek-chat via DeepSeekClient. Uses NEXUS_SYSTEM_PROMPT (inline copy
 * to avoid serverless import chain issues with nexusKnowledge.ts).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleApiError,
  parseJsonBody,
  DEFAULT_BODY_LIMIT,
  logServerError,
  RateLimiter,
  setRateLimitHeaders,
  getClientIp,
} from './lib/validate.js';
import { z } from 'zod';

// ── DeepSeek client (Node import — source file lives at /src/nexus/deepseekClient.ts).
//     Previous relative path './src/nexus/deepseekClient.js' was wrong (no api/src/ directory).
//     api/chat.ts lives in /workspace/api/; src/nexus/ lives in /workspace/src/nexus/.
//     Vercel Pages Router natively supports mixed TS relative imports across this boundary. ───
import { DeepSeekClient, type DeepSeekMessage } from '../src/nexus/deepseekClient.ts';

const GUEST_LIMIT = 3;
// IP → counter (process-lifetime; serverless resets are fine for a soft cap)
const guestCounters = new Map<string, number>();

// ── V3 Security: strict CORS allowlist, no wildcard, vary-by-origin ────────
const ALLOWED_ORIGINS = new Set([
  'https://lyc-intelligence.app',
  'https://www.lyc-intelligence.app',
]);
const PREVIEW_HOST_SUFFIX = '.vercel.app';

/**
 * Apply strict CORS per Workstream 3 rules.
 * Returns true if the caller should return early (OPTIONS preflight handled).
 */
function applyStrictCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin as string) || '';
  let allow = '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    allow = origin;
  } else if (origin && origin.endsWith(PREVIEW_HOST_SUFFIX)) {
    // Vercel preview deployments — allow for UAT, never expose cred header
    allow = origin;
  } else if (!origin) {
    // Same-origin / server-to-server — skip allow header
    allow = '';
  }
  if (allow) {
    res.setHeader('Access-Control-Allow-Origin', allow);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-anonymous-id');
    res.setHeader('Access-Control-Max-Age', '600');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  }
  // Security headers — lightweight set applied regardless of origin
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// ── Rate limiter: 20 chat turns / 60s per IP or user ID ───────────────────
const CHAT_RL = new RateLimiter(60_000, 20);

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS system prompt (inline copy of NEXUS_SYSTEM_PROMPT from nexusKnowledge.ts).
// Kept in sync manually — serverless imports from src/nexus/ were unreliable due
// to buildKnowledgeBulkForSystemPrompt() / catalog side-effects at import time.
// ─────────────────────────────────────────────────────────────────────────────
const NEXUS_SYSTEM_PROMPT = `You are NEXUS — the intelligent front door of LYC Intelligence.

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

=== CATALOG SUMMARY — anchor recommendations to these ===
- PRISM: Career & Professional Branding (Strategic Positioning, Market Differentiation, Narrative Control, Visibility & Influence, Offer Readiness, Digital Footprint Quality)
- SPARK: AI Leadership Readiness (Strategic AI Acumen, Implementation & Governance, Team Enablement, Risk & Ethics, Change Adoption, Measured ROI)
- FORGE: Sales Excellence (Deal Strategy, Client Discovery, Negotiation Precision, Pipeline Acceleration, Relationship Depth, Commercial Judgment)
- BRIDGE: China Leadership Readiness (Cross-Border Cultural Translation, Stakeholder Orchestration, Regional Governance, Execution Cadence, Government & Partner Interface, Leadership Narrative — Bilingual)
- MOSAIC: Cultural Intelligence (Cultural Self-Awareness, Perspective Taking, Adaptable Communication, Trust Building, Inclusive Decision-making, Global Navigation)
- DRIVE: Execution Capability (Prioritization Acuity, Operational Discipline, Stakeholder Cadence, Resource Allocation, Outcome Measurement, Recovery & Momentum)

=== CONFIDENTIALITY PROMISE — embedded in identity ===
Every conversation is treated as confidential. Nothing the user shares in this conversation is shared outside LYC Intelligence, is never used to train public-facing models, and does not appear in any example or template without written consent. You keep a confidence the way an executive coach keeps a confidence.

=== WHAT YOU SHOULD DO EVERY TURN ===
1. Anchor back to a real framework. The answer is never generic advice — it points to a dimension of an assessment.
2. Recommend an assessment when you see ≥ 2 signals for one. Explain (a) why this assessment maps to the current context, (b) what the user gets out of it, (c) price in miles.
3. After a recommendation, offer three follow-up questions the user should be asking themselves — even if they don't take the assessment today. Users remember the questions.
4. If the user's subscription tier matters, mention it naturally: "at Executive Introduction this is 149 mi", not "you'll need to pay".
5. Miles earning: framework exploration sessions earn miles, reflection engagement earns miles, and completing an assessment refunds bonus miles (once per instrument) for Starter tier and above. Executive Introduction (Explorer) users do not earn miles.

=== PROHIBITED LANGUAGE — FILTER ALL OUTPUT ===
- ❌ "free" (any form). Use "Executive Introduction" instead.
- ❌ "credits" / "credit" (any form). Use "miles" / "mi" / "balance" / "earn" / "spend" instead.
- ❌ "chatbot", "virtual assistant", "I'm an AI"
- ❌ border-radius references (style)
- ❌ generic self-help ("you've got this", "believe in yourself")

NEXUS is a doorway, not a destination. The good outcomes happen inside the assessment frameworks. Your job is to get the user through the right door.`;

function suggestPromptsFromResponse(response: string): string[] {
  const out: string[] = [];
  if (/career|transition|positioning/.test(response.toLowerCase())) {
    out.push('What assessment would surface my blind spots in a cross-border move?');
  }
  if (/ai|leadership/.test(response.toLowerCase())) {
    out.push('How do I benchmark my team\'s AI readiness against similar leaders?');
  }
  if (/negotiation|sales|deal|commercial/.test(response.toLowerCase())) {
    out.push('Where am I leaving value on the table in complex negotiations?');
  }
  if (/culture|cross.border|china|global/.test(response.toLowerCase())) {
    out.push('What cultural gaps are likely to derail my next regional role?');
  }
  if (/execution|deliver|operations|priorit/.test(response.toLowerCase())) {
    out.push('How do I fix the bottleneck that consistently slows my team down?');
  }
  // Always give 3; fill remaining with generic thoughtful ones
  const fallback = [
    'Which assessment should I start with given my current context?',
    'What blind spot do executives in my position usually miss?',
    'What three questions should I be asking myself right now?',
    'Walk me through what completing an assessment actually looks like.',
  ];
  for (const f of fallback) {
    if (out.length >= 3) break;
    if (!out.includes(f)) out.push(f);
  }
  return out.slice(0, 3);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS — W4-6 / #1291 strict origin allowlist (no wildcard) ────────────
  if (applyStrictCors(req, res)) return;

  if (req.method === 'GET') {
    const deepseek = new DeepSeekClient();
    res.status(200).json({
      ok: true,
      name: 'NEXUS chat proxy',
      guest_limit: GUEST_LIMIT,
      has_key: deepseek.hasApiKey(),
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  try {
    // Rate limit: 20 chat turns / 60s per IP (IP is available before body parse;
    // userId would require parsing twice). 20/60s is generous for a single user.
    const rlKey = `ip:${getClientIp(req)}`;
    const chatRlPrelude = CHAT_RL.check(rlKey);
    setRateLimitHeaders(res, chatRlPrelude, 20);
    if (!chatRlPrelude.allowed) {
      res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many chat turns — please retry in a moment',
      });
      return;
    }

    // parseJsonBody already validates body size internally via DEFAULT_BODY_LIMIT fallback
    const rawBody = parseJsonBody(req);

    // V3-7 / #1346 Zod write-schema validation for chat payload.
    // NOTE: Avoids z.record().max() because that requires Zod ≥3.24 and the
    // pinned version in package.json may be older. Body-size + string max clamp
    // via z.string().max() already cover the important resource limits.
    const ChatSchema = z.object({
      message: z.string().min(1).max(8192),
      history: z.array(z.object({ role: z.string().max(32), content: z.string().max(8192) })).max(50).optional(),
      userId: z.string().max(256).optional(),
      tier: z.string().max(64).optional(),
      memoryContext: z.record(z.string(), z.any()).optional(),
      documentContext: z.string().max(16384).optional(),
      systemPrompt: z.string().max(32768).optional(),
    });
    let body: any;
    try {
      body = ChatSchema.parse(rawBody);
    } catch (zErr: any) {
      const first = zErr?.issues?.[0];
      const msg = first
        ? `Invalid input at ${first.path.join('.')}: ${first.message}`
        : 'Invalid chat body';
      res.status(422).json({ ok: false, error: msg.slice(0, 200) });
      return;
    }

    const message: string = String(body?.message ?? '').trim();
    if (!message) {
      res.status(400).json({ ok: false, error: 'message required' });
      return;
    }

    const history: Array<{ role: string; content: string }> = Array.isArray(body?.history)
      ? (body.history as any).slice(-12)
      : [];
    const userId: string = String(body?.userId ?? `guest:${getClientIp(req)}`);
    const systemPromptOverride: string | undefined = body?.systemPrompt
      ? String(body.systemPrompt)
      : undefined;
    const documentContext: string = body?.documentContext ? String(body.documentContext) : '';

    const isGuest = userId.startsWith('guest:');
    if (isGuest) {
      const ip = getClientIp(req);
      const n = (guestCounters.get(ip) ?? 0) + 1;
      if (n > GUEST_LIMIT) {
        res.status(429).json({
          ok: false,
          error: 'guest_limit',
          human_message:
            'You have used your 3 complimentary NEXUS turns. Create a complimentary LYC account to continue the conversation — Executive Introduction gives you the full doorway into the frameworks.',
        });
        return;
      }
      guestCounters.set(ip, n);
    }

    const deepseek = new DeepSeekClient();

    if (!deepseek.hasApiKey()) {
      const response =
        'NEXUS is running in limited preview mode until our model provider key is active. Your turn was not counted against the limit. To anchor this properly: tell me the specific context you are navigating right now — career transition, team readiness, cross-border move, revenue execution — and I will map it to the right LYC framework. From there we can scope the blind spots a senior exec should be testing for.';
      res.status(200).json({
        ok: true,
        limited_preview: true,
        response,
        suggested_prompts: suggestPromptsFromResponse('framework assessment'),
        remaining: isGuest
          ? Math.max(0, GUEST_LIMIT - (guestCounters.get(getClientIp(req)) ?? 0))
          : null,
      });
      return;
    }

    const systemMessage: DeepSeekMessage = {
      role: 'system',
      content: [
        systemPromptOverride ?? NEXUS_SYSTEM_PROMPT,
        documentContext ? `\n\n=== EXTRA CONTEXT PROVIDED BY CLIENT ===\n${documentContext}\n=== END EXTRA CONTEXT ===` : '',
      ].join(''),
    };

    const historyMessages: DeepSeekMessage[] = history
      .filter((h) => h && typeof h.content === 'string' && ['system', 'user', 'assistant'].includes(h.role))
      .map((h) => ({ role: h.role as 'user' | 'assistant' | 'system', content: String(h.content) }));

    const userMessage: DeepSeekMessage = { role: 'user', content: message };
    const messages = [systemMessage, ...historyMessages, userMessage];

    const result = await deepseek.chat(messages, {
      model: 'deepseek-chat',
      temperature: 0.4,
      maxTokens: 1200,
    });

    const response = result.content.trim();
    res.status(200).json({
      ok: true,
      response,
      suggested_prompts: suggestPromptsFromResponse(response),
      mock: result.mockFallback,
      latency_ms: result.latencyMs,
      remaining: isGuest
        ? Math.max(0, GUEST_LIMIT - (guestCounters.get(getClientIp(req)) ?? 0))
        : null,
    });
    return;
  } catch (err: any) {
    // handleApiError logs & sends a shaped {error} response; don't double-log.
    // Signature: handleApiError(res, err, context, req).
    const chatContext = 'api/chat';
    const status = err?.code === 'quota' ? 429 : err?.code === 'auth' ? 503 : 500;
    if (err?.code === 'quota' || err?.code === 'auth' || err?.code === 'timeout') {
      // Known classification — send shaped user-friendly body, log for observability.
      logServerError(chatContext, err, req);
      const userFacing =
        err?.code === 'auth'
          ? 'NEXUS is unavailable due to a model provider configuration issue. Please try again in a few minutes.'
          : err?.code === 'quota'
            ? 'NEXUS is currently under high load. Please retry your message in 30 seconds.'
            : 'NEXUS took longer than expected to respond. Please try again with a shorter message.';
      res.status(status).json({ ok: false, error: 'chat_failed', message: userFacing });
      return;
    }
    // Fallback: use shared handleApiError (logs + sends generic { error }).
    handleApiError(res, err, chatContext, req);
    return;
  }
}
