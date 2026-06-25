import { authFetch } from '@/utils/authFetch';
// coze.ts — Chat proxy + legacy single-candidate scoring wrapper.
// All LLM calls go through /api/chat (chat proxy) or
// /api/admin/org-intelligence/scoring/compute (public mode, see scoringClient.ts).
// Do not add API keys here.

export async function sendChatMessage(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }> = [],
  options?: { systemPrompt?: string; memoryContext?: any[]; documentContext?: string; tier?: string }
): Promise<string> {
  try {
    const res = await authFetch('/api/chat', {
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
    const res = await authFetch('/api/chat', {
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
