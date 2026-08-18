import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * /api/chat — NEXUS chat proxy (serverless function #12).
 *
 * Self-contained — no imports from src/ to keep bundle size small
 * and avoid Vercel serverless bundler path alias issues.
 *
 * POST { message, history, userId, tier, systemPrompt }
 *      → { response, suggested_prompts?: string[] }
 * GET  → { ok: true, guest_limit: 3, has_key: boolean }
 *
 * Auth:
 *   • Authenticated (Bearer JWT): unlimited messages
 *   • Guest: 3 messages per IP (soft, per-function-instance)
 */

const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY ||
  process.env.VITE_DEEPSEEK_API_KEY ||
  '';
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const GUEST_LIMIT = 3;
const MAX_TOKENS = 1024;
const TEMPERATURE = 0.7;

// In-memory guest counter (per function instance; resets on cold start)
const guestCounts = new Map<string, number>();

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return 'unknown';
}

// ── CORS ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  'https://lyc-intelligence.app',
  'https://www.lyc-intelligence.app',
]);
const PREVIEW_HOST_SUFFIX = '.vercel.app';

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  let allowed = false;
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin)) {
      allowed = true;
    } else if (origin.endsWith(PREVIEW_HOST_SUFFIX)) {
      allowed = true;
    }
  }
  if (allowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.lyc-intelligence.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  return req.method === 'OPTIONS';
}

// ── NEXUS Identity ─────────────────────────────────────────────────
const NEXUS_BASE_SYSTEM_PROMPT = `You are NEXUS, an Executive Intelligence layer for leaders.

Your purpose: help executives understand themselves, their leadership, and their career trajectory with precision and insight.

How to behave:
- Be incisive, data-informed, and direct. No fluff. No generic advice.
- Frame insights around the user's specific context. Ask clarifying questions when needed.
- Always refer to yourself as NEXUS — never "the AI," "the coach," or "I'm an AI."
- Keep responses focused: 3-5 paragraphs max. Use concrete examples.
- You are not a therapist, lawyer, or financial advisor. Stay in the leadership intelligence lane.
- When uncertain, say so and ask better questions rather than making things up.

Tone: thoughtful, precise, senior. A peer who's read deeply on leadership and organizational behavior.`;

function buildSystemPrompt(userSystemPrompt?: string, tier?: string): string {
  if (userSystemPrompt && userSystemPrompt.trim().length > 20) {
    return userSystemPrompt.trim();
  }
  let prompt = NEXUS_BASE_SYSTEM_PROMPT;
  if (tier) {
    prompt += `\n\nUser tier: ${tier}. Adjust depth and breadth accordingly — higher tiers get more sophisticated frameworks and deeper analysis.`;
  }
  return prompt;
}

// ── Helpers ─────────────────────────────────────────────────────────
function safeBody<T = any>(raw: any): T {
  if (raw === null || typeof raw !== 'object') return {} as T;
  return raw as T;
}

// ── Handler ─────────────────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      guest_limit: GUEST_LIMIT,
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!DEEPSEEK_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: 'Chat service not configured' });
  }

  try {
    const body = safeBody(req.body);
    const message: string = body.message || '';
    const history: Array<{ role: string; content: string }> = Array.isArray(
      body.history,
    )
      ? body.history
      : [];
    const tier: string = body.tier || 'explorer';
    const userId: string | undefined = body.userId;
    const systemPrompt: string | undefined = body.systemPrompt;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }

    // Auth check
    const authHeader = req.headers.authorization;
    const isAuthed = !!(authHeader && authHeader.startsWith('Bearer '));

    // Guest rate limit
    if (!isAuthed) {
      const ip = getClientIp(req);
      const count = (guestCounts.get(ip) || 0) + 1;
      guestCounts.set(ip, count);
      if (count > GUEST_LIMIT) {
        return res.status(429).json({
          ok: false,
          error: 'Guest limit reached. Sign up for unlimited NEXUS conversations.',
          remaining: 0,
        });
      }
    }

    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: buildSystemPrompt(systemPrompt, tier) },
    ];

    // Add recent history (last 10 turns to keep context manageable)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg && msg.role && msg.content) {
        messages.push({ role: msg.role, content: String(msg.content) });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call DeepSeek API
    const apiResponse = await fetch(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages,
          temperature: TEMPERATURE,
          max_tokens: MAX_TOKENS,
          stream: false,
        }),
      },
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        '[chat] DeepSeek API error:',
        apiResponse.status,
        errorText.slice(0, 300),
      );
      return res
        .status(502)
        .json({ ok: false, error: 'Chat service unavailable' });
    }

    const data = await apiResponse.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      ok: true,
      response: responseText,
      model: data.model || DEEPSEEK_MODEL,
      usage: data.usage || null,
    });
  } catch (error: any) {
    console.error('[chat] Unhandled error:', error?.message || error);
    return res
      .status(500)
      .json({ ok: false, error: 'Internal server error' });
  }
}
