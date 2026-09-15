// coze.ts — Chat proxy + legacy single-candidate scoring wrapper.
// All LLM calls go through /api/chat (chat proxy) or
// /api/admin/org-intelligence/scoring/compute (public mode, see scoringClient.ts).
// Do not add API keys here.

// ─── Response shape (shared by streaming + non-streaming) ────────────────────
export interface NexusChatResponse {
  response: string;
  insights?: string;
  suggested_prompts: string[];
  model?: string;
  mile_balance?: number;
}

export async function sendChatMessage(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }> = [],
  options?: { systemPrompt?: string; memoryContext?: any[]; documentContext?: string; tier?: string }
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
  options?: { systemPrompt?: string; memoryContext?: any[]; documentContext?: string; tier?: string }
): Promise<{ response: string; suggested_prompts: string[] }> {
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
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return {
      response: data.response || 'No response received.',
      suggested_prompts: data.suggested_prompts || [],
    };
  } catch (e) {
    console.error('[sendChatMessageWithSuggestions] Failed:', e);
    return {
      response: 'I\'m having trouble connecting right now. Please try again in a moment.',
      suggested_prompts: [],
    };
  }
}

// ─── Streaming variant ───────────────────────────────────────────────────────
// Parses SSE events from the DeepSeek streaming proxy:
//   data: {"token": "<text>"}       → calls onToken(text)
//   data: {"done": true, ...}       → resolves with final NexusChatResponse
// Falls back to non-streaming parse if SSE is not available.

export async function sendChatMessageStream(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }> = [],
  options: { systemPrompt?: string; memoryContext?: any[]; documentContext?: string; tier?: string } | undefined,
  onToken: (token: string) => void,
): Promise<NexusChatResponse> {
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
        stream: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    // If the server didn't return SSE, fall back to JSON parse
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/event-stream') || !res.body) {
      const data = await res.json();
      return {
        response: data.response || 'No response received.',
        insights: data.insights,
        suggested_prompts: data.suggested_prompts || [],
        model: data.model,
        mile_balance: data.mile_balance,
      };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let finalInsights: string | undefined;
    let finalPrompts: string[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (readerDone) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.done) {
            finalInsights = parsed.insights;
            finalPrompts = parsed.suggested_prompts || [];
            done = true;
            break;
          }
          if (parsed.token) {
            accumulated += parsed.token;
            onToken(parsed.token);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    return {
      response: accumulated || 'No response received.',
      insights: finalInsights,
      suggested_prompts: finalPrompts,
    };
  } catch (e) {
    console.error('[sendChatMessageStream] Failed:', e);
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
