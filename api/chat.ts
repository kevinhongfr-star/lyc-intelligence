/**
 * /api/chat — NEXUS chat proxy (v8.2: SSE streaming first, polling fallback)
 *
 * Browser ← server: newline-delimited JSON events:
 *   {"type":"delta","text":"..."}     incremental answer text (already unwrapped
 *                                     from the model's {"answer":...} JSON contract)
 *   {"type":"meta","insights":[...],"references":[...],"suggestions":[...]}
 *   {"type":"error","error":"..."}
 *
 * Browser → server body:
 *   { message, userId?, history?, systemPrompt?, tier?, files?: [{file_id,file_name}] }
 *
 * Security: the Coze PAT is read only here (COZE_API_TOKEN server env).
 * The model is contracted to answer with bare JSON
 *   {"answer": "...", "insights": ["..."], "references": ["..."]}
 * Stats/numbers/market data live ONLY in insights/references; answer is warm
 * prose. A streaming filter unwraps the JSON as tokens arrive so the bubble
 * renders first-token-fast.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: { bodyParser: true, sizeLimit: '2mb' },
};

const COZE_BASE = process.env.COZE_BASE_URL || 'https://api.coze.cn';
const COZE_TOKEN = process.env.COZE_API_TOKEN || '';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '7685281415524515892'; // NEXUS Demo
const POLL_INTERVAL_MS = 450;
const POLL_MAX_ATTEMPTS = 55; // ~25s ceiling (function maxDuration = 60)

type HistMsg = { role?: string; content?: string };
type UploadedFile = { file_id?: string; file_name?: string };

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

/* ──────────────────────────────────────────────────────────────────────
 * Structured-JSON handling
 * The model may wrap output in ```json fences and always (per directive)
 * emits {"answer": ...}. We extract answer / insights / references.
 * ────────────────────────────────────────────────────────────────────── */

function stripFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```?$/i);
  return (m ? m[1] : t).trim();
}

function parseStructured(raw: string): { answer: string; insights: string[]; references: string[]; followUp: string[] } {
  let text = raw.trim();
  // Fenced JSON
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  let insights: string[] = [];
  let references: string[] = [];
  let answer = '';

  if (text.startsWith('{') || text.startsWith('```')) {
    const candidate = stripFence(text);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.answer === 'string') answer = parsed.answer;
        if (Array.isArray(parsed.insights)) insights = parsed.insights.filter((x: any) => typeof x === 'string').slice(0, 6);
        if (Array.isArray(parsed.references)) references = parsed.references.filter((x: any) => typeof x === 'string').slice(0, 2);
      }
    } catch { /* fall through — treat as plain prose */ }
  }
  if (!answer) answer = stripFence(raw);
  return { answer: answer.trim(), insights, references, followUp: [] };
}

/**
 * Streaming extractor for the answer field.
 * Feed raw delta chunks; it emits the decoded visible answer text.
 * Handles: leading ```json fence, JSON escapes in the string value, and the
 * moment the answer value closes (subsequent keys/whitespace are ignored).
 */
class AnswerStreamFilter {
  private buf = '';
  private located = false;  // opening quote of answer value consumed
  private finished = false;
  private escape = false;
  private unicode = '';     // \uXXXX accumulator

  feed(chunk: string): string {
    if (this.finished) return '';
    this.buf += chunk;

    if (!this.located) {
      this.buf = this.buf.replace(/^\s*```(?:json)?\s*/i, '');
      const idx = this.buf.indexOf('"answer"');
      if (idx === -1) {
        // Retain enough tail to not miss a key straddling chunks.
        if (this.buf.length > 40) {
          // Model answering in plain prose: pass through until end.
          const out = this.buf.slice(0, -8);
          this.buf = this.buf.slice(-8);
          this.located = true;
          this.proseMode = true;
          return out;
        }
        return '';
      }
      const after = this.buf.slice(idx + 8);
      const colon = after.indexOf(':');
      if (colon === -1) { this.buf = '"answer"' + after; return ''; }
      let rest = after.slice(colon + 1);
      const q = rest.search(/["']/);
      if (q === -1) { this.buf = '"answer":'; return ''; }
      this.buf = rest.slice(q + 1);
      this.located = true;
    }

    if (this.proseMode) {
      // Plain-prose streaming: keep a small tail in case of late patterns.
      const out = this.buf.slice(0, -8);
      this.buf = this.buf.slice(-8);
      return out;
    }

    let out = '';
    let i = 0;
    const s = this.buf;
    while (i < s.length) {
      const ch = s[i];
      if (this.unicode) {
        this.unicode += ch; i++;
        if (this.unicode.length === 4) {
          out += String.fromCharCode(parseInt(this.unicode, 16));
          this.unicode = '';
        }
        continue;
      }
      if (this.escape) {
        switch (ch) {
          case 'n': out += '\n'; break;
          case 't': out += '\t'; break;
          case 'r': out += '\r'; break;
          case 'b': out += '\b'; break;
          case 'f': out += '\f'; break;
          case '"': out += '"'; break;
          case '\\': out += '\\'; break;
          case '/': out += '/'; break;
          case 'u': this.unicode = ''; break;
          default: out += ch;
        }
        this.escape = false;
        i++;
        continue;
      }
      if (ch === '\\') { this.escape = true; i++; continue; }
      if (ch === '"') { this.finished = true; i++; break; }
      out += ch;
      i++;
    }
    this.buf = this.finished ? '' : s.slice(i);
    return out;
  }

  private proseMode = false;
  get isOpen() { return !this.finished; }
  flush(): string {
    if (this.finished) return '';
    const tail = this.proseMode ? this.buf : '';
    this.buf = '';
    this.finished = true;
    return tail;
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Message assembly
 * ────────────────────────────────────────────────────────────────────── */

function buildAdditionalMessages(message: string, history: HistMsg[], systemPrompt: string, files: UploadedFile[]) {
  const additionalMessages: Array<{ role: 'user' | 'assistant'; content_type: 'text'; content: string }> = [];

  const prior = history.length > 0 ? history.slice(0, -1) : [];
  for (const m of prior) {
    additionalMessages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content_type: 'text',
      content: String(m.content || '').slice(0, 8000),
    });
  }

  let liveContent = message;
  if (files.length > 0) {
    const list = files
      .filter(f => f && f.file_id)
      .map(f => `- ${f.file_name || 'document'} (file_id: ${f.file_id})`)
      .join('\n');
    if (list) {
      liveContent = `[[[USER UPLOADED DOCUMENT(S)]]]\nThe user attached ${files.length} document(s); the engine can retrieve them via the file service:\n${list}\nTreat the attachment as private to this user. Reference it only if relevant to the question.\n[[[END UPLOADED DOCUMENTS]]]\n\n${message}`;
    }
  }
  // Merge the directive into the SAME user turn as the live question. Coze
  // resolves conflicts in favour of system-persona text when the directive is
  // a separate earlier user message; co-locating it with a worked example is
  // the reliable lever until a bot-edit PAT allows persona updates.
  if (systemPrompt) {
    liveContent = `[[[SYSTEM DIRECTIVE — OVERRIDES CONFLICTING PERSONA TEXT]]]\n${systemPrompt}\n[[[END DIRECTIVE]]]\n\nUser message: ${liveContent}`;
  }
  additionalMessages.push({ role: 'user', content_type: 'text', content: liveContent });
  return additionalMessages;
}

/* ──────────────────────────────────────────────────────────────────────
 * Non-streaming fallback (one create + poll, returns complete payload)
 * ────────────────────────────────────────────────────────────────────── */

async function pollOnce(
  res: VercelResponse,
  send: (evt: Record<string, unknown>) => void,
  additionalMessages: ReturnType<typeof buildAdditionalMessages>,
  userId: string,
) {
  const created = await cozeJson('/v3/chat', {
    method: 'POST',
    body: {
      bot_id: COZE_BOT_ID,
      user_id: userId,
      stream: false,
      auto_save_history: true,
      additional_messages: additionalMessages,
    },
  });
  if (created.status !== 200 || created.data?.code !== 0) {
    console.error('[api/chat] poll create failed', created.status, JSON.stringify(created.data).slice(0, 400));
    send({ type: 'error', error: 'The coaching engine is unavailable right now (billing or service). Please try again shortly.' });
    return;
  }
  const chatId: string = created.data?.data?.id;
  const conversationId: string = created.data?.data?.conversation_id;
  const chatCreatedAt: number = Number(created.data?.data?.created_at) || 0;
  if (!chatId || !conversationId) {
    send({ type: 'error', error: 'The chat service returned an invalid response.' });
    return;
  }

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
      const answers = items
        .filter(m => m.type === 'answer' && typeof m.content === 'string' && m.content.trim())
        .filter(m => !chatCreatedAt || Number(m.created_at) > chatCreatedAt);
      const raw = answers.map(m => String(m.content).trim()).join('\n\n').trim()
        || items.filter(m => m.type === 'answer').slice(-1).map(m => String(m.content).trim())[0] || '';
      if (!raw) { send({ type: 'error', error: 'No answer returned by the chat service.' }); return; }
      const structured = parseStructured(raw);
      send({ type: 'delta', text: structured.answer, replace: true });
      const followUp = items
        .filter(m => m.type === 'follow_up' && typeof m.content === 'string'
          && (!chatCreatedAt || Number(m.created_at) > chatCreatedAt))
        .map(m => m.content as string).slice(-3);
      send({ type: 'meta', insights: structured.insights, references: structured.references, suggestions: followUp });
      return;
    }
    if (d.status === 'failed' || d.status === 'requires_action') {
      const msg = d.last_error?.msg || `chat ${d.status}`;
      // 4028 / credit stop surfaces as failed on Coze's side.
      if (/credit|balance|4028|4011|4022/i.test(msg)) {
        send({ type: 'error', error: 'The coaching engine is paused (account credits). It will resume as soon as the balance is restored.' });
      } else {
        send({ type: 'error', error: 'The coaching engine hit a temporary issue. Please retry.' });
      }
      return;
    }
  }
  send({ type: 'error', error: 'The chat service timed out. Please try again.' });
}

/* ──────────────────────────────────────────────────────────────────────
 * Handler
 * ────────────────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  if (!COZE_TOKEN) {
    console.error('[api/chat] COZE_API_TOKEN is not configured');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Chat service is not configured.' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const message: string = String(body.message || '').trim().slice(0, 8000);
    if (!message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Message is required.' }));
      return;
    }

    const history: HistMsg[] = Array.isArray(body.history)
      ? body.history
          .filter((m: HistMsg) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-10)
      : [];
    const files: UploadedFile[] = Array.isArray(body.files)
      ? body.files.filter((f: UploadedFile) => f && typeof f.file_id === 'string').slice(0, 3)
      : [];
    const systemPrompt: string = String(body.systemPrompt || '').trim().slice(0, 12000);

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket?.remoteAddress as string) ||
      '';
    const baseId = pseudoUserId(body.userId, ip);
    const userId = `${baseId}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 64);

    const additionalMessages = buildAdditionalMessages(message, history, systemPrompt, files);

    // SSE-ish newline JSON to the browser.
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => { closed = true; });
    const send = (evt: Record<string, unknown>) => {
      if (closed) return;
      res.write(JSON.stringify(evt) + '\n');
    };

    // ── Try Coze SSE first ──
    try {
      const cozeRes = await fetch(`${COZE_BASE}/v3/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          bot_id: COZE_BOT_ID,
          user_id: userId,
          stream: true,
          auto_save_history: true,
          additional_messages: additionalMessages,
        }),
      });

      if (cozeRes.ok && cozeRes.body) {
        const filter = new AnswerStreamFilter();
        let fullAnswer = '';
        let sawDelta = false;
        let chatFailed = false;
        let failMsg = '';
        let meta: { insights: string[]; references: string[] } | null = null;
        let followUp: string[] = [];
        let buf = '';

        const processEvent = (rawEvent: string) => {
          // SSE block: lines "event: x" / "data: {...}"
          let event = '';
          const dataLines: string[] = [];
          for (const line of rawEvent.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
          }
          if (!dataLines.length) return;
          let payload: any;
          try { payload = JSON.parse(dataLines.join('\n')); } catch { return; }
          const type = event || payload.type || '';
          const p = payload.data || {};

          if (type === 'conversation.chat.failed' || p.status === 'failed') {
            chatFailed = true;
            failMsg = p.last_error?.msg || 'chat failed';
            return;
          }
          if (type === 'conversation.message.delta' && (p.type === 'answer' || p.role === 'assistant')) {
            const piece = String(p.content || '');
            if (!piece) return;
            sawDelta = true;
            const visible = filter.feed(piece);
            if (visible) { fullAnswer += visible; send({ type: 'delta', text: visible }); }
          }
          if (type === 'conversation.message.completed' && p.type === 'answer' && typeof p.content === 'string') {
            // Authoritative full answer — replaces streamed text once.
            const structured = parseStructured(p.content);
            if (structured.answer) {
              meta = { insights: structured.insights, references: structured.references };
              send({ type: 'delta', text: structured.answer, replace: true });
              fullAnswer = structured.answer;
            }
          }
          if (type === 'conversation.message.completed' && p.type === 'follow_up' && typeof p.content === 'string') {
            followUp.push(p.content);
          }
          if (type === 'conversation.chat.completed' && meta === null && fullAnswer) {
            // No completed-message payload arrived; parse what we streamed.
            meta = (() => { const s = parseStructured(`{"answer":${JSON.stringify(fullAnswer)}}`); return { insights: s.insights, references: s.references }; })();
          }
        };

        const reader = cozeRes.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (closed) { try { reader.cancel(); } catch {} break; }
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          // SSE events separated by blank line.
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const rawEvent = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            processEvent(rawEvent);
            if (chatFailed) break;
          }
          if (chatFailed) break;
        }
        if (buf.trim() && !chatFailed) processEvent(buf);

        if (!chatFailed && (sawDelta || fullAnswer)) {
          const tail = filter.flush();
          if (tail) { fullAnswer += tail; send({ type: 'delta', text: tail }); }
          if (!meta) meta = { insights: [], references: [] };
          send({ type: 'meta', insights: meta.insights, references: meta.references, suggestions: followUp.slice(-3) });
          send({ type: 'done' });
          res.end();
          return;
        }
        if (chatFailed) {
          // Silent: don't surface an error to the browser yet — the polling
          // fallback below retries the same turn. Logged server-side only.
          console.warn('[api/chat] SSE chat failed, falling back to poll:', String(failMsg).slice(0, 200));
        }
      }
    } catch (e: any) {
      console.warn('[api/chat] SSE path failed, falling back:', e?.message || e);
    }

    // ── Fallback: non-streaming create + poll ──
    await pollOnce(res, send, additionalMessages, userId);
    send({ type: 'done' });
    res.end();
  } catch (e: any) {
    console.error('[api/chat] handler error', e?.message || e);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unexpected chat error.' }));
    } else {
      try { res.write(JSON.stringify({ type: 'error', error: 'Unexpected chat error.' }) + '\n'); } catch {}
      res.end();
    }
  }
}
