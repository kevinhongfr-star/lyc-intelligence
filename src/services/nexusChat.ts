// nexusChat.ts — Corrective batch #1393, v2.4 spec.
// Client for /api/nexus-chat. Replaces legacy sendChatMessage (coze.ts → old
// /api/chat). Returns { response, _engine } state; caller persists _engine
// to nexus_conversations. _engine.lane is ENGINE-INTERNAL — never render.

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
}

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
      nexus_starts_the_chat: !!opts.nexusStartsTheChat,
      user_profile: opts.userProfile,
      active_milestone: opts.activeMilestone,
    }),
  });
  if (!res.ok) {
    let detail = '';
    try { const j = await res.json(); detail = j?.error || ''; } catch { /* ignore */ }
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
