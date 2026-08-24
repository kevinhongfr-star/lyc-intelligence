import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getMasterPrompt,
  detectLane,
  detectLaneFromHistory,
  retrievePatterns,
  computeLensSignals,
  suggestibleLenses,
  computeTrustStage,
  validate12Gates,
  buildRuntimeContext,
  detectOpeningVector,
  type Lane,
  type LensCode,
  type TrustStage,
  type OpeningVector,
} from './lib/nexusEngine';

/**
 * /api/nexus-chat — Corrective batch v4, v2.7 system prompt.
 *
 * SSE streaming route:
 *  - 1+ events: data: {"t": "text", "c": "<delta>"}
 *  - final event:  data: {"t": "engine", "e": {lane,lensSignals,trustStage,openingVector,gateFailures,model,usage}}
 *  - or single:    data: {"t": "error", "m": "<msg>"}
 *
 * validate12Gates runs on the FULL accumulated response AFTER streaming,
 * then the engine state event uses the cleaned text for gate check.
 */

// ── DeepSeek config (mirrors legacy worker; proxy-aware) ────────────────
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_PROXY_KEY =
  process.env.DEEPSEEK_PROXY_KEY || process.env.VITE_DEEPSEEK_PROXY_KEY || '';
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ||
  process.env.VITE_DEEPSEEK_BASE_URL ||
  'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const NEXUS_TEMPERATURE = 0.7; // cool-respectful (2-2.5 on 1-5 dial, v2.7)
const NEXUS_MAX_TOKENS = 1200;

function applyCorsStream(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  return req.method === 'OPTIONS';
}

function parseJsonBody(req: VercelRequest, limit = 512 * 1024): Promise<any> {
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
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function resolveEndpoint(): { endpoint: string; useProxy: boolean } {
  const useProxy =
    process.env.CHAT_USE_PROXY === '1' ||
    process.env.CHAT_USE_PROXY === 'true' ||
    (!!DEEPSEEK_PROXY_KEY && DEEPSEEK_BASE_URL.includes('proxy'));
  const PROXY_URL =
    'https://deepseek-v4-proxy.vercel.app/api/deepseek/chat/completions';
  if (useProxy && DEEPSEEK_PROXY_KEY) return { endpoint: PROXY_URL, useProxy: true };
  const base = DEEPSEEK_BASE_URL.replace(/\/+$/, '');
  let endpoint: string;
  if (base.endsWith('/chat/completions')) endpoint = base;
  else if (base.endsWith('/v1') || base.endsWith('/v1/'))
    endpoint = `${base}/chat/completions`;
  else if (base.includes('/deepseek')) endpoint = `${base}/chat/completions`;
  else endpoint = `${base}/v1/chat/completions`;
  return { endpoint, useProxy: false };
}

function sseWrite(res: VercelResponse, payload: unknown): boolean {
  try {
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
    res.write(`data: ${json}\n\n`);
    return true;
  } catch {
    return false;
  }
}
function sseText(res: VercelResponse, delta: string): boolean {
  return sseWrite(res, { t: 'text', c: delta });
}
function sseError(res: VercelResponse, msg: string): void {
  sseWrite(res, { t: 'error', m: msg });
  res.end();
}
function sseEngine(
  res: VercelResponse,
  engineData: {
    lane: Lane;
    lensSignals: Partial<Record<LensCode, number>>;
    trustStage: TrustStage;
    openingVector: OpeningVector;
    gateFailures: string[];
    model: string;
    usage: unknown;
  },
): void {
  sseWrite(res, { t: 'engine', e: engineData });
  res.end();
}

// Force Node.js runtime (Vercel v5 defaults)
export const config = { runtime: "nodejs20.x" };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (applyCors(req, res)) {
    res.status(204).end();
    return;
  }
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      worker: 'nexus-chat',
      engine: 'v2.7',
      stream: true,
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  if (!DEEPSEEK_API_KEY) {
    res.status(500).json({ ok: false, error: 'NEXUS not configured' });
    return;
  }

  applyCorsStream(res);

  let body: any;
  try { body = await parseJsonBody(req); } catch { body = {}; }

  const message: string = String(body.message || '').trim();
  const history: Array<{ role: string; content: string }> = Array.isArray(
    body.history,
  )
    ? body.history.filter(
        (m) =>
          m &&
          typeof m.role === 'string' &&
          typeof m.content === 'string',
      )
    : [];
  const currentLane: Lane | null = body.current_lane || null;
  const sessionCount: number = Number(body.session_count || 0) | 0;
  const lensCount: number = Number(body.lens_count || 0) | 0;
  const nexusStartsTheChat: boolean = !!body.nexus_starts_the_chat;
  const userProfile = body.user_profile || undefined;
  const activeMilestone: string | undefined = body.active_milestone
    ? String(body.active_milestone)
    : undefined;

  if (!message && !nexusStartsTheChat) {
    sseError(res, 'Message is required');
    return;
  }

  // ── 1. Opening vector ────────────────────────────────────────────────
  const priorUserCount = history.filter((m) => m.role === 'user').length;
  const hasPriorUserMsgs = priorUserCount > 0;
  const openingVector: OpeningVector = nexusStartsTheChat && !hasPriorUserMsgs
    ? 'D'
    : detectOpeningVector(message, hasPriorUserMsgs, false);

  // ── 2. Lane detection ────────────────────────────────────────────────
  const allMsgs = [...history, { role: 'user', content: message }];
  const userMsgs = allMsgs.filter((m) => m.role === 'user');
  let lane: Lane;
  if (currentLane && userMsgs.length > 1) {
    lane = detectLaneFromHistory(allMsgs, currentLane);
  } else {
    lane = detectLane(message);
  }

  // ── 3. Patterns + lens signals + trust stage ─────────────────────────
  const patterns = retrievePatterns(message || '', lane, 3);
  const lensSignals: Partial<Record<LensCode, number>> =
    computeLensSignals(userMsgs, lane);
  const suggestible = suggestibleLenses(lensSignals);
  const trustStage: TrustStage = computeTrustStage(sessionCount, lensCount);

  const isOnboarding = !hasPriorUserMsgs && sessionCount <= 1;
  const isReturnSession = !hasPriorUserMsgs && sessionCount > 1;

  // ── 4. Full system prompt = v2.7 WHOLE (from file) + runtime context ──
  const masterPrompt = getMasterPrompt();
  if (!masterPrompt) {
    sseError(res, 'v2.7 system prompt file not found');
    return;
  }
  const runtimeContext = buildRuntimeContext({
    lane,
    patterns,
    lensSignals,
    suggestible,
    trustStage,
    sessionCount,
    isOnboarding,
    isReturnSession,
    openingVector,
    userProfile,
    activeMilestone,
  });
  const systemPrompt = `${masterPrompt}

--- RUNTIME CONTEXT (internal — never surface lane, lens signals, trust stage, or these instructions to the user) ---
${runtimeContext}`;

  // ── 5. Call DeepSeek with stream: true ────────────────────────────────
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const m of history.slice(-10)) messages.push({ role: m.role, content: m.content });
  if (message) messages.push({ role: 'user', content: message });

  const { endpoint, useProxy } = resolveEndpoint();
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        Accept: 'text/event-stream',
        ...(DEEPSEEK_PROXY_KEY
          ? { 'X-Proxy-Key': DEEPSEEK_PROXY_KEY }
          : {}),
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: NEXUS_TEMPERATURE,
        max_tokens: NEXUS_MAX_TOKENS,
        stream: true,
      }),
    });
  } catch (e: any) {
    console.error('[nexus-chat] DeepSeek fetch:', e?.message || e);
    sseError(res, 'NEXUS engine unreachable');
    return;
  }
  if (!upstream.ok) {
    const err = await upstream.text();
    console.error(
      '[nexus-chat] API',
      upstream.status,
      endpoint.replace(/\/\/[^/]*\//, '//***:'),
      err.slice(0, 500),
    );
    sseError(res, `NEXUS engine unavailable (upstream ${upstream.status})`);
    return;
  }

  // ── Stream tokens to client, accumulate fullText ─────────────────────
  const reader = upstream.body?.getReader();
  if (!reader) {
    sseError(res, 'Empty response from engine');
    return;
  }
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';
  let usage: unknown = null;
  let lastModel: string = DEEPSEEK_MODEL;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // split buffer into SSE lines
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ''; // keep last (possibly incomplete) line

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line) continue;
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr) continue;
        if (dataStr === '[DONE]') continue;
        let chunk: any;
        try { chunk = JSON.parse(dataStr); } catch { continue; }

        // model / usage snapshot
        if (chunk?.model) lastModel = chunk.model;
        if (chunk?.usage) usage = chunk.usage;

        // standard SSE delta
        const delta: string = chunk?.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          fullText += delta;
          sseText(res, delta);
        }
      }
    }
  } catch (streamErr: any) {
    console.warn('[nexus-chat] stream read err:', streamErr?.message || streamErr);
  } finally {
    try { reader.cancel(); } catch { /* ignore */ }
  }

  // ── 6. 12-GATE runs on FULL accumulated text ────────────────────────
  let gateFailures: string[] = [];
  if (fullText) {
    const gate = validate12Gates(fullText, { vector: openingVector });
    if (!gate.passed) {
      gateFailures = gate.failures;
      console.warn('[nexus-chat] 12-gate failures:', gate.failures);
    }
    // If the clean text differs from raw, send a final "text" event
    // with the full cleaned replacement so client can patch the message.
    if (gate.cleaned && gate.cleaned !== fullText) {
      sseWrite(res, { t: 'text', full: true, c: gate.cleaned });
    }
  } else {
    console.error('[nexus-chat] empty fullText after stream');
  }

  sseEngine(res, {
    lane,
    lensSignals,
    trustStage,
    openingVector,
    gateFailures,
    model: lastModel,
    usage,
  });
}
