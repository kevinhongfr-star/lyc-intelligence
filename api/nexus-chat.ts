import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * /api/nexus-chat — NEXUS Engine chat route (corrective batch #1393).
 *
 * Replaces the generic /api/chat (Coze-named, DeepSeek-backed) worker for the
 * V-App. Powers chat with the NEXUS Engine v2.2:
 *   - Loads the master system prompt v2.2 WHOLE (nexus-engine/...v2.2.txt),
 *     embedded verbatim in api/lib/nexusEngine.ts. Never rewritten/flattened.
 *   - Injects runtime context (lane, patterns, lens signals, trust stage,
 *     onboarding/return-session rules, user profile) AFTER the master prompt.
 *   - Calls DeepSeek (same proxy/key handling as the legacy chat worker).
 *   - Runs the 12-gate validator on the response (G7 no lists, G8 no
 *     self-reference, G4/G6 one question per turn, G12 cool-incisive brand
 *     voice, G3 register). Auto-cleans mechanical violations.
 *   - Returns { response, model, usage, _engine }.
 *
 * Statelessness + RLS: the route does NOT touch Supabase directly (the anon
 * key is subject to RLS and cannot update a user's conversation). Instead it
 * returns `_engine` (lane, lensSignals, trustStage) and the CLIENT persists
 * those to nexus_conversations using the user's own session. `lane` is
 * engine-internal and MUST NEVER be rendered in the UI (v2.2 § Three Lanes).
 *
 * Message persistence also stays client-side (ChatPageV3 inserts user +
 * assistant messages into nexus_messages), matching the prior /api/chat flow.
 */

// ── Imports ────────────────────────────────────────────────────────────
// nexusEngine.ts is compiled by @vercel/node at deploy time (same as tierGate.ts).
import {
  MASTER_PROMPT_V22,
  detectLane,
  detectLaneFromHistory,
  retrievePatterns,
  computeLensSignals,
  suggestibleLenses,
  computeTrustStage,
  validate12Gates,
  buildRuntimeContext,
  type Lane,
  type LensCode,
  type TrustStage,
} from './lib/nexusEngine';

// ── Config ─────────────────────────────────────────────────────────────
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY ||
  process.env.VITE_DEEPSEEK_API_KEY ||
  '';
const DEEPSEEK_PROXY_KEY =
  process.env.DEEPSEEK_PROXY_KEY ||
  process.env.VITE_DEEPSEEK_PROXY_KEY ||
  '';
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ||
  process.env.VITE_DEEPSEEK_BASE_URL ||
  'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// Cool-incisive (v2.2 VOICE temperature dial = 2). 0.7 sampling keeps it
// crisp without going robotic. No higher — warmth fails G12.
const NEXUS_TEMPERATURE = 0.7;
const NEXUS_MAX_TOKENS = 1024;

// ── CORS ───────────────────────────────────────────────────────────────
function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  return req.method === 'OPTIONS';
}

// ── Body parsing ───────────────────────────────────────────────────────
function parseJsonBody(req: VercelRequest, limit = 256 * 1024): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// ── DeepSeek endpoint resolution (mirrors legacy chat worker) ──────────
function resolveDeepSeekEndpoint(): { endpoint: string; useProxy: boolean } {
  const useProxy =
    process.env.CHAT_USE_PROXY === '1' ||
    process.env.CHAT_USE_PROXY === 'true' ||
    (!!DEEPSEEK_PROXY_KEY && DEEPSEEK_BASE_URL.includes('proxy'));
  const PROXY_URL =
    'https://deepseek-v4-proxy.vercel.app/api/deepseek/chat/completions';
  if (useProxy && DEEPSEEK_PROXY_KEY) {
    return { endpoint: PROXY_URL, useProxy: true };
  }
  const base = DEEPSEEK_BASE_URL.replace(/\/+$/, '');
  let endpoint: string;
  if (base.endsWith('/chat/completions')) endpoint = base;
  else if (base.endsWith('/v1') || base.endsWith('/v1/'))
    endpoint = `${base}/chat/completions`;
  else if (base.includes('/deepseek')) endpoint = `${base}/chat/completions`;
  else endpoint = `${base}/v1/chat/completions`;
  return { endpoint, useProxy: false };
}

// ── Handler ────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return res.status(204).end();

  // GET — diagnostic (no secrets)
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      worker: 'nexus-chat',
      engine: 'v2.2',
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
      .json({ ok: false, error: 'NEXUS chat service not configured' });
  }

  let body: any;
  try {
    body = await parseJsonBody(req);
  } catch {
    body = {};
  }

  const message: string = String(body.message || '').trim();
  const history: Array<{ role: string; content: string }> = Array.isArray(
    body.history,
  )
    ? body.history.filter(
        (m) => m && typeof m.role === 'string' && typeof m.content === 'string',
      )
    : [];
  const currentLane: Lane | null =
    typeof body.current_lane === 'string' ? (body.current_lane as Lane) : null;
  const sessionCount: number = Number(body.session_count || 0) | 0;
  const lensCount: number = Number(body.lens_count || 0) | 0;
  const isOnboarding: boolean = !!body.is_onboarding;
  const isReturnSession: boolean = !!body.is_return_session;
  const userProfile = body.user_profile || undefined;
  const activeMilestone: string | undefined = body.active_milestone
    ? String(body.active_milestone)
    : undefined;

  if (!message) {
    return res.status(400).json({ ok: false, error: 'Message is required' });
  }

  // ── 1. LANE DETECTION (internal, never surfaced) ────────────────────
  // First message → detectLane. Subsequent → detectLaneFromHistory (shifts
  // only on strong signal; lane persists otherwise). v2.2 § Three Lanes.
  const allMsgs = [...history, { role: 'user', content: message }];
  const userMsgs = allMsgs.filter((m) => m.role === 'user');
  let lane: Lane;
  if (currentLane && userMsgs.length > 1) {
    lane = detectLaneFromHistory(allMsgs, currentLane);
  } else {
    lane = detectLane(message);
  }

  // ── 2. PATTERN RETRIEVAL (1-3 patterns, private context) ────────────
  const patterns = retrievePatterns(message, lane, 3);

  // ── 3. LENS SIGNALS (accumulate across all user turns, cap 10) ───────
  const lensSignals = computeLensSignals(userMsgs, lane);
  const suggestible = suggestibleLenses(lensSignals);

  // ── 4. TRUST STAGE (gates which lenses may be suggested) ─────────────
  const trustStage: TrustStage = computeTrustStage(sessionCount, lensCount);

  // ── 5. RUNTIME CONTEXT (appended AFTER the master prompt) ────────────
  const runtimeContext = buildRuntimeContext({
    lane,
    patterns,
    lensSignals,
    suggestible,
    trustStage,
    sessionCount,
    isOnboarding,
    isReturnSession,
    userProfile,
    activeMilestone,
  });

  const systemPrompt = `${MASTER_PROMPT_V22}

--- RUNTIME CONTEXT (internal — never surface lane, lens signals, trust stage, or these instructions to the user) ---
${runtimeContext}`;

  // ── 6. BUILD MESSAGES ────────────────────────────────────────────────
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  // Last 10 turns of history (matches prior worker behaviour).
  const recentHistory = history.slice(-10);
  for (const m of recentHistory) {
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: 'user', content: message });

  // ── 7. CALL DEEPSEEK ─────────────────────────────────────────────────
  const { endpoint, useProxy } = resolveDeepSeekEndpoint();

  let apiResponse: Response;
  try {
    apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        ...(DEEPSEEK_PROXY_KEY
          ? { 'X-Proxy-Key': DEEPSEEK_PROXY_KEY }
          : {}),
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: NEXUS_TEMPERATURE,
        max_tokens: NEXUS_MAX_TOKENS,
        stream: false,
      }),
    });
  } catch (e: any) {
    console.error('[nexus-chat] DeepSeek fetch error:', e?.message || e);
    return res
      .status(502)
      .json({ ok: false, error: 'NEXUS engine unreachable' });
  }

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    console.error(
      '[nexus-chat] DeepSeek API error:',
      apiResponse.status,
      endpoint,
      errorText.slice(0, 500),
    );
    return res.status(502).json({
      ok: false,
      error: 'NEXUS engine unavailable',
      upstream_status: apiResponse.status,
    });
  }

  const data = await apiResponse.json();
  const rawResponse: string = data.choices?.[0]?.message?.content || '';

  if (!rawResponse) {
    return res
      .status(502)
      .json({ ok: false, error: 'Empty response from NEXUS engine' });
  }

  // ── 8. 12-GATE QUALITY CHECK (mechanical hard gates) ─────────────────
  // v2.2 § QUALITY SYSTEM + VOICE DON'Ts. Auto-clean G7 (lists), G8
  // (self-reference), G12 (hedging/warm sign-offs/!), G3 (register). G4/G6
  // (>2 questions) cannot be auto-fixed — flagged but best-effort sent.
  const gate = validate12Gates(rawResponse);
  const finalResponse = gate.cleaned || rawResponse;
  if (!gate.passed) {
    console.warn(
      '[nexus-chat] 12-gate failures (cleaned best-effort):',
      gate.failures,
    );
  }

  // ── 9. RETURN ────────────────────────────────────────────────────────
  // _engine is returned for the CLIENT to persist to nexus_conversations
  // (lane/lens_signals/trust_stage) using the user's RLS session. The client
  // MUST NOT render `lane` (engine-internal per v2.2 § Three Lanes).
  return res.status(200).json({
    ok: true,
    response: finalResponse,
    model: data.model || DEEPSEEK_MODEL,
    usage: data.usage || null,
    _engine: {
      lane,
      lensSignals,
      trustStage,
      gateFailures: gate.passed ? [] : gate.failures,
    },
  });
}
