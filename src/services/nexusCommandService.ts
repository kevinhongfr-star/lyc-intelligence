/**
 * nexusCommandService — Frontend service for NEXUS Command Bar
 * Calls /api/nexus/chat (serverless endpoint with DeepSeek integration)
 */

import { authFetch } from '@/utils/authFetch';

export interface NexusCommandResponse {
  response: string;
  suggested_prompts?: string[];
  diagnostic_tags?: string[];
  milestone_tags?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  session_id?: string;
  seniority?: string;
}

/**
 * Send a message to NEXUS AI via serverless endpoint
 * Falls back to a helpful error message if the API is unavailable
 */
export async function sendNexusCommand(
  message: string,
  history?: Array<{ role: string; content: string }>,
  sessionId?: string | null
): Promise<NexusCommandResponse> {
  const res = await authFetch('/api/nexus/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: history || [],
      session_id: sessionId,
      stream: false,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'NEXUS request failed');
  }

  return data as NexusCommandResponse;
}

/**
 * Stream a NEXUS response via SSE (Server-Sent Events)
 * Calls onToken for each streamed token chunk
 */
export async function streamNexusCommand(
  message: string,
  history: Array<{ role: string; content: string }>,
  sessionId: string | null,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): Promise<void> {
  const { supabase } = await import('@/stores/authStore').then(m => m.useAuthStore.getState());
  let authHeader = '';
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader = `Bearer ${session.access_token}`;
    }
  }

  try {
    const res = await fetch('/api/nexus/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify({
        message,
        history,
        session_id: sessionId,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Request failed' }));
      onError(errData.error || `HTTP ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.token) {
            onToken(parsed.token);
          }
        } catch {
          // Ignore malformed chunks
        }
      }
    }

    onDone();
  } catch (err: any) {
    onError(err.message || 'Streaming failed');
  }
}

export default {
  sendNexusCommand,
  streamNexusCommand,
};
