// nexusChat.ts — NEXUS Engine chat client (corrective batch #1393).
//
// Replaces the legacy sendChatMessage (services/coze.ts → /api/chat) for the
// V-App. Calls /api/nexus-chat, which runs the NEXUS Engine v2.2 (master
// system prompt + runtime context + DeepSeek + 12-gate validator).
//
// The route is stateless and RLS-safe: it returns `_engine` (lane, lensSignals,
// trustStage) for the caller to persist to nexus_conversations. `lane` is
// engine-internal — NEVER render it in the UI (v2.2 § Three Lanes).

export interface NexusChatHistoryTurn {
  role: 'user' | 'assistant' | string;
  content: string;
}

export interface NexusChatUserProfile {
  name?: string;
  tier?: string;
  icp?: string;
}

export interface NexusEngineState {
  lane: string;
  lensSignals: Record<string, number>;
  trustStage: string;
  gateFailures?: string[];
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
  history: NexusChatHistoryTurn[];
  currentLane?: string | null;
  sessionCount?: number;
  lensCount?: number;
  isOnboarding?: boolean;
  isReturnSession?: boolean;
  userProfile?: NexusChatUserProfile;
  activeMilestone?: string;
}

/**
 * Send a message to the NEXUS Engine and receive a v2.2-voiced response.
 * Throws on network/API errors; callers should catch and show a fallback.
 */
export async function sendNexusMessage(
  message: string,
  opts: NexusChatOptions,
): Promise<NexusChatResponse> {
  const res = await fetch('/api/nexus-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: opts.conversationId,
      user_id: opts.userId,
      history: opts.history.slice(-12),
      current_lane: opts.currentLane ?? null,
      session_count: opts.sessionCount ?? 0,
      lens_count: opts.lensCount ?? 0,
      is_onboarding: !!opts.isOnboarding,
      is_return_session: !!opts.isReturnSession,
      user_profile: opts.userProfile,
      active_milestone: opts.activeMilestone,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error || '';
    } catch {
      /* ignore */
    }
    throw new Error(
      `NEXUS chat error ${res.status}${detail ? `: ${detail}` : ''}`,
    );
  }

  const data = await res.json();
  const response: string = data.response || '';
  const engine: NexusEngineState = data._engine || {
    lane: 'universal',
    lensSignals: {},
    trustStage: 'introductory',
  };

  return {
    response,
    model: data.model,
    usage: data.usage,
    _engine: engine,
  };
}
