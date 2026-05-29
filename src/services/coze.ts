/** @deprecated Use serverApi or /api/chat directly. This file will be removed. */
// coze.ts — Legacy service file. All AI calls now go through /api/chat proxy.
// This file is kept only for type compatibility. Do not add API keys here.

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
        tier: options?.tier || 'free',
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
        tier: options?.tier || 'free',
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

export async function scoreCandidateWithAI(jd: string, cv: string): Promise<{ d1: number; d2: number; d3: number; reasoning: string } | null> {
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd, cv }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.result || null;
  } catch (e) {
    console.error('[scoreCandidateWithAI] Failed:', e);
    return null;
  }
}
