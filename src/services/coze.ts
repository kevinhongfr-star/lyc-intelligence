// coze.ts — Chat proxy client (v8.2: streaming + upload) and legacy scoring wrapper.
// All LLM calls go through /api/chat; keys never touch the browser.

export interface ChatFile {
  file_id: string;
  file_name: string;
  bytes?: number;
}

export interface StreamCallbacks {
  onDelta?: (text: string, replace?: boolean) => void;
  onMeta?: (meta: { insights?: string[]; references?: string[]; suggestions?: string[] }) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
}

export interface ChatOptions {
  systemPrompt?: string;
  memoryContext?: any[];
  documentContext?: string;
  tier?: string;
  files?: ChatFile[];
}

/**
 * Streaming chat. Reads newline-delimited JSON events from /api/chat:
 *   delta / meta / error (+ trailing done).
 * Returns an AbortController so the caller can cancel.
 */
export function streamChatMessage(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }> = [],
  options: ChatOptions = {},
  cb: StreamCallbacks = {},
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          userId,
          tier: options.tier || 'explorer',
          memoryContext: options.memoryContext || [],
          documentContext: options.documentContext || '',
          systemPrompt: options.systemPrompt,
          files: options.files || [],
        }),
      });
      if (!res.ok || !res.body) throw new Error(`API error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let gotError = '';
      let settled = false;
      const finishError = (msg: string) => {
        if (settled) return;
        settled = true;
        cb.onError?.(msg);
        cb.onDone?.();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let evt: any;
          try { evt = JSON.parse(line); } catch { continue; }
          if (evt.type === 'delta') cb.onDelta?.(String(evt.text || ''), Boolean(evt.replace));
          else if (evt.type === 'meta') cb.onMeta?.({
            insights: Array.isArray(evt.insights) ? evt.insights : undefined,
            references: Array.isArray(evt.references) ? evt.references : undefined,
            suggestions: Array.isArray(evt.suggestions) ? evt.suggestions : undefined,
          });
          else if (evt.type === 'done') settled = true;
          else if (evt.type === 'error') gotError = String(evt.error || 'Connection error.');
        }
      }
      if (buf.trim()) {
        try {
          const evt = JSON.parse(buf.trim());
          if (evt.type === 'delta') cb.onDelta?.(String(evt.text || ''), Boolean(evt.replace));
          else if (evt.type === 'meta') cb.onMeta?.(evt);
          else if (evt.type === 'error') gotError = String(evt.error || 'Connection error.');
        } catch { /* ignore trailing fragment */ }
      }
      if (gotError) { finishError(gotError); return; }
      if (!settled) cb.onDone?.();
    } catch (e: any) {
      if (e?.name === 'AbortError') { cb.onDone?.(); return; }
      console.error('[streamChatMessage] failed:', e);
      cb.onError?.("I'm having trouble connecting right now. Please try again in a moment.");
      cb.onDone?.();
    }
  })();

  return controller;
}

/** Upload a document via the /api/upload proxy → Coze file service. */
export async function uploadDocument(file: File): Promise<ChatFile> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    let detail = 'Upload failed.';
    try { detail = (await res.json()).error || detail; } catch { /* keep default */ }
    throw new Error(detail);
  }
  const data = await res.json();
  if (!data?.file_id) throw new Error('Upload returned no file reference.');
  return { file_id: data.file_id, file_name: data.file_name || file.name, bytes: data.bytes };
}

/* ── Legacy non-streaming helpers (kept for compatibility) ── */

export async function sendChatMessage(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }> = [],
  options?: ChatOptions
): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-10),
        userId,
        tier: options?.tier || 'explorer',
        memoryContext: options?.memoryContext || [],
        documentContext: options?.documentContext || '',
        systemPrompt: options?.systemPrompt,
        files: options?.files || [],
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.response || 'No response received.';
  } catch (e) {
    console.error('[sendChatMessage] Failed:', e);
    return 'I\'m having trouble connecting right now. Please try again in a moment.';
  }
}

export async function sendChatMessageWithSuggestions(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }> = [],
  options?: ChatOptions
): Promise<{ response: string; suggested_prompts: string[]; insights?: string[] }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-10),
        userId,
        tier: options?.tier || 'explorer',
        memoryContext: options?.memoryContext || [],
        documentContext: options?.documentContext || '',
        systemPrompt: options?.systemPrompt,
        files: options?.files || [],
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return {
      response: data.response || 'No response received.',
      suggested_prompts: data.suggested_prompts || [],
      insights: Array.isArray(data.insights) ? data.insights : undefined,
    };
  } catch (e) {
    console.error('[sendChatMessageWithSuggestions] Failed:', e);
    return {
      response: 'I\'m having trouble connecting right now. Please try again in a moment.',
      suggested_prompts: [],
    };
  }
}

/**
 * Score a single candidate against a job description.
 * Delegates to scoringClient.scoreSingleCandidate (uses T4 endpoint public mode).
 * Kept here for backward compat — BatchScoringPage imports scoreCandidateWithAI from this file.
 */
export async function scoreCandidateWithAI(
  jd: string,
  cv: string,
  candidateName: string = 'Candidate'
): Promise<{ d1: number; d2: number; d3: number; reasoning: string } | null> {
  const { scoreSingleCandidate } = await import('./scoringClient');
  return scoreSingleCandidate(jd, cv, candidateName);
}
