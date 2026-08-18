/**
 * /api/chat — NEXUS chat proxy (serverless function #12).
 *
 * Self-contained — no imports from src/ and no @vercel/node import
 * to keep bundle size small and avoid Vercel bundler issues.
 * Uses plain Node.js types from Request/Response.
 *
 * POST { message, history, userId, tier, systemPrompt }
 *      → { response, usage, model }
 * GET  → { ok: true, guest_limit: 3, has_key: boolean }
 *
 * Auth:
 *   • Authenticated (Bearer JWT): unlimited
 *   • Guest: 3 messages per IP (soft, per-instance)
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

// Alias for Vercel request/response (they extend Node's http types)
type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
};
type VercelResponse = ServerResponse & {
  setHeader(name: string, value: string | number | string[]): void;
  status(code: number): VercelResponse;
  json(body: any): void;
  send(body: any): void;
  end(body?: any): void;
};

// ── Config ──────────────────────────────────────────────────────────
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

// In-memory guest counter (per function instance)
const guestCounts = new Map<string, number>();

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].split(',')[0].trim();
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
  const origin = req.headers.origin;
  const originStr = typeof origin === 'string' ? origin : Array.isArray(origin) ? origin[0] : undefined;
  let allowed = false;
  if (originStr) {
    if (ALLOWED_ORIGINS.has(originStr)) {
      allowed = true;
    } else if (originStr.endsWith(PREVIEW_HOST_SUFFIX)) {
      allowed = true;
    }
  }
  if (allowed && originStr) {
    res.setHeader('Access-Control-Allow-Origin', originStr);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.lyc-intelligence.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  const method = req.method || '';
  return method === 'OPTIONS';
}

// ── NEXUS System Prompt ─────────────────────────────────────────────
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

// ── Body parser ─────────────────────────────────────────────────────
function parseBody(req: VercelRequest): Promise<any> {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString();
      if (data.length > 100 * 1024) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ── Handler ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) {
    res.statusCode = 204;
    res.end();
    return;
  }

  const method = req.method || '';

  if (method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      guest_limit: GUEST_LIMIT,
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
    }));
    return;
  }

  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  if (!DEEPSEEK_API_KEY) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Chat service not configured' }));
    return;
  }

  try {
    const body = await parseBody(req);
    const message: string = body.message || '';
    const history: Array<{ role: string; content: string }> = Array.isArray(body.history) ? body.history : [];
    const tier: string = body.tier || 'explorer';
    const systemPrompt: string | undefined = body.systemPrompt;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Message is required' }));
      return;
    }

    // Auth check
    const authHeader = req.headers.authorization;
    const authStr = typeof authHeader === 'string' ? authHeader : Array.isArray(authHeader) ? authHeader[0] : '';
    const isAuthed = !!(authStr && authStr.startsWith('Bearer '));

    // Guest rate limit
    let remaining: number | undefined;
    if (!isAuthed) {
      const ip = getClientIp(req);
      const count = (guestCounts.get(ip) || 0) + 1;
      guestCounts.set(ip, count);
      if (count > GUEST_LIMIT) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          ok: false,
          error: 'Guest limit reached. Sign up for unlimited NEXUS conversations.',
          remaining: 0,
        }));
        return;
      }
      remaining = GUEST_LIMIT - count;
    }

    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: buildSystemPrompt(systemPrompt, tier) },
    ];

    // Add recent history (last 10 turns)
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
      console.error('[chat] DeepSeek API error:', apiResponse.status, errorText.slice(0, 300));
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Chat service unavailable' }));
      return;
    }

    const data = await apiResponse.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      response: responseText,
      model: data.model || DEEPSEEK_MODEL,
      usage: data.usage || null,
      remaining,
    }));
    return;

  } catch (error: any) {
    console.error('[chat] Unhandled error:', error?.message || error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
    return;
  }
}
