/**
 * /api/chat — NEXUS chat proxy backed by Coze Chat API (v3, non-streaming + poll)
 *
 * POST body:
 *   { message, userId?, history?: [{role, content}], systemPrompt?,
 *     memoryContext?, documentContext?, tier? }
 *
 * Security: the Coze PAT never ships to the browser — this function is the
 * only place the token is read (COZE_API_TOKEN server env).
 *
 * Coze v3 does not honour per-request `system` role messages, so the dynamic
 * system prompt assembled by the web app (tier / assessment / lens context)
 * is forwarded once as a [[[SYSTEM_DIRECTIVE]]] user message the bot is
 * configured to treat as authoritative.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COZE_BASE = process.env.COZE_BASE_URL || 'https://api.coze.cn';
const COZE_TOKEN = process.env.COZE_API_TOKEN || '';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '7685281415524515892'; // NEXUS Demo
const POLL_INTERVAL_MS = 700;
const POLL_MAX_ATTEMPTS = 34; // ~24s ceiling (function maxDuration = 30)

type HistMsg = { role?: string; content?: string };

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function pseudoUserId(raw: unknown, ip: string): string {
  const s = String(raw || '').trim();
  if (s && /^[a-zA-Z0-9_\-:]{1,64}$/.test(s)) return s;
  return `guest-${(ip || 'anon').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || 'anon'}`;
}

async function cozeJson(path: string, init: { method: string; body?: unknown } = { method: 'GET' }) {
  const res = await fetch(`${COZE_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${COZE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!COZE_TOKEN) {
    console.error('[api/chat] COZE_API_TOKEN is not configured');
    return json(res, 500, { error: 'Chat service is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const message: string = String(body.message || '').trim().slice(0, 8000);
    if (!message) return json(res, 400, { error: 'Message is required.' });

    const history: HistMsg[] = Array.isArray(body.history)
      ? body.history
          .filter((m: HistMsg) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-10)
      : [];

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket?.remoteAddress as string) ||
      '';
    // Fresh per-request id: keeps every call stateless on Coze's side
    // (auto_save_history=true is required with non-streaming chat).
    const baseId = pseudoUserId(body.userId, ip);
    const userId = `${baseId}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 64);

    // Additional messages sent to Coze (chronological).
    const additionalMessages: Array<{ role: 'user' | 'assistant'; content_type: 'text'; content: string }> = [];

    // 1) Dynamic session directive (system prompt) — only when it adds value.
    const systemPrompt: string = String(body.systemPrompt || '').trim().slice(0, 12000);
    if (systemPrompt) {
      additionalMessages.push({
        role: 'user',
        content_type: 'text',
        content: `[[[SYSTEM_DIRECTIVE]]]\n${systemPrompt}\n[[[END_DIRECTIVE]]]`,
      });
    }

    // 2) Prior turns (exclude the final user message — it is the live `message`).
    const prior = history.length > 0 ? history.slice(0, -1) : [];
    for (const m of prior) {
      additionalMessages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content_type: 'text',
        content: String(m.content).slice(0, 8000),
      });
    }

    // 3) The current message.
    additionalMessages.push({ role: 'user', content_type: 'text', content: message });

    // ── Create chat ──
    const created = await cozeJson('/v3/chat', {
      method: 'POST',
      body: {
        bot_id: COZE_BOT_ID,
        user_id: userId,
        stream: false,
        // Coze v3 rejects (stream=false + auto_save_history=false).
        // Calls are stateless from our side; userId is unique per visitor IP
        // when unauthenticated, so no cross-visitor leakage occurs.
        auto_save_history: true,
        additional_messages: additionalMessages,
      },
    });
    if (created.status !== 200 || created.data?.code !== 0) {
      console.error('[api/chat] create failed', created.status, JSON.stringify(created.data).slice(0, 500));
      return json(res, 502, { error: 'Chat service rejected the request.' });
    }
    const chatId: string = created.data?.data?.id;
    const conversationId: string = created.data?.data?.conversation_id;
    if (!chatId || !conversationId) {
      return json(res, 502, { error: 'Chat service returned an invalid response.' });
    }

    // ── Poll until completed ──
    let lastError = '';
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      const got = await cozeJson(
        `/v3/chat/retrieve?chat_id=${encodeURIComponent(chatId)}&conversation_id=${encodeURIComponent(conversationId)}`,
      );
      const d = got.data?.data;
      if (!d) continue;
      if (d.status === 'completed') {
        const listed = await cozeJson(
          `/v3/chat/message/list?chat_id=${encodeURIComponent(chatId)}&conversation_id=${encodeURIComponent(conversationId)}`,
        );
        const items: any[] = listed.data?.data || [];
        const answer = items
          .filter(m => m.type === 'answer' && typeof m.content === 'string')
          .map(m => m.content as string)
          .join('\n\n')
          .trim();
        if (!answer) return json(res, 502, { error: 'No answer returned by the chat service.' });
        const suggested = items
          .filter(m => m.type === 'follow_up' && typeof m.content === 'string')
          .map(m => m.content as string)
          .slice(0, 3);
        return json(res, 200, { response: answer, suggested_prompts: suggested });
      }
      if (d.status === 'failed' || d.status === 'requires_action') {
        lastError = d.last_error?.msg || `chat ${d.status}`;
        break;
      }
      // status in_progress / created → keep polling
    }

    console.error('[api/chat] polling ended:', lastError || 'timeout');
    return json(res, 504, { error: lastError || 'The chat service timed out. Please try again.' });
  } catch (e: any) {
    console.error('[api/chat] handler error', e?.message || e);
    return json(res, 500, { error: 'Unexpected chat error.' });
  }
}
