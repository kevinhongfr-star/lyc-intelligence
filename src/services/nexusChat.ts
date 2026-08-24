// nexusChat.ts — Corrective batch v4, v2.7 system prompt.
// Client for /api/nexus-chat SSE streaming. Replaces legacy sendChatMessage
// (coze.ts → old /api/chat). Takes onToken callback so caller progressively
// appends to the placeholder message. Returns { response, _engine } state once
// the "engine" SSE event is received. _engine.lane is ENGINE-INTERNAL —
// never render.

export interface NexusHistoryTurn {
  role: string;
  content: string;
}

export interface NexusUserProfile {
  name?: string;
  tier?: string;
  icp?: string;
}

export interface NexusEngineState {
  lane: string;
  lensSignals: Record<string, number>;
  trustStage: string;
  openingVector?: 'A' | 'B' | 'C' | 'D';
  gateFailures?: string[];
  model?: string;
  usage?: unknown;
}

export interface NexusChatResponse {
  response: string;
  model?: string;
  usage?: unknown;
  _engine: NexusEngineState;
}

export interface NexusChatOptions {
  conversationId: string;
  userId: string;
  history: NexusHistoryTurn[];
  currentLane?: string | null;
  sessionCount?: number;
  lensCount?: number;
  nexusStartsTheChat?: boolean;
  userProfile?: NexusUserProfile;
  activeMilestone?: string;
  /** Fires as each token delta arrives from the SSE stream. */
  onToken?: (delta: string) => void;
  /**
   * Optional: fires when server sends a "full" replacement text (after the
   * 12-gate validator cleaned up the full response). Caller should replace
   * the whole placeholder content with this text.
   */
  onFullReplace?: (fullCleaned: string) => void;
}

/**
 * SSE streaming call to /api/nexus-chat.
 * - Stream deltas → opts.onToken(delta)
 * - Optionally opts.onFullReplace(text) — cleaned full text override
 * - Returns { response, _engine } once the engine event arrives
 */
export async function sendNexusMessage(
  message: string,
  opts: NexusChatOptions,
): Promise<NexusChatResponse> {
  const { onToken, onFullReplace, ...request } = opts;

  const res = await fetch('/api/nexus-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: request.conversationId,
      user_id: request.userId,
      history: request.history.slice(-12),
      current_lane: request.currentLane ?? null,
      session_count: request.sessionCount ?? 0,
      lens_count: request.lensCount ?? 0,
      nexus_starts_the_chat: !!request.nexusStartsTheChat,
      user_profile: request.userProfile,
      active_milestone: request.activeMilestone,
    }),
  });
  if (!res.ok) {
    let detail = '';
    try { const j = await res.json(); detail = j?.error || ''; } catch { /* ignore */ }
    throw new Error(
      `NEXUS chat error ${res.status}${detail ? `: ${detail}` : ''}`,
    );
  }

  // ── SSE line reader ────────────────────────────────────────────────────
  const reader = res.body?.getReader();
  if (!reader) throw new Error('NEXUS stream empty');
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulated = '';
  let engine: NexusEngineState | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line) continue;
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr) continue;

      let ev: any;
      try { ev = JSON.parse(dataStr); } catch { continue; }

      if (!ev || typeof ev !== 'object' || typeof ev.t !== 'string') continue;

      if (ev.t === 'text') {
        if (ev.full === true && typeof ev.c === 'string') {
          accumulated = ev.c;
          onFullReplace?.(ev.c);
        } else if (typeof ev.c === 'string' && ev.c) {
          accumulated += ev.c;
          onToken?.(ev.c);
        }
      } else if (ev.t === 'error') {
        throw new Error(String(ev.m || 'NEXUS chat error'));
      } else if (ev.t === 'engine' && ev.e) {
        const e: any = ev.e;
        engine = {
          lane: String(e.lane || 'universal'),
          lensSignals: (e.lensSignals as any) || {},
          trustStage: String(e.trustStage || 'introductory'),
          openingVector: e.openingVector,
          gateFailures: Array.isArray(e.gateFailures) ? e.gateFailures : undefined,
          model: typeof e.model === 'string' ? e.model : undefined,
          usage: e.usage,
        };
      }
    }
  }

  if (!engine) {
    engine = {
      lane: 'universal',
      lensSignals: {},
      trustStage: 'introductory',
    };
  }

  return {
    response: accumulated,
    model: engine.model,
    usage: engine.usage,
    _engine: engine,
  };
}
