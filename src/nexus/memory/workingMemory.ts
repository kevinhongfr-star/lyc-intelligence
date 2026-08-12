export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  priority?: number;
  tokens?: number;
  ts?: number;
}

export type Tier = 'Flash' | 'Pro';

const TIER_BUDGETS: Record<Tier, number> = {
  Flash: 4000,
  Pro: 8000,
};

const ROLE_PRIORITY: Record<MessageRole, number> = {
  system: 3,
  user: 2,
  assistant: 1,
};

const SLIDING_WINDOW_MAX = 20;
const MIN_RECENT_USER = 5;
const MIN_RECENT_ASSISTANT = 3;

export function estimateTokens(content: string): number {
  return Math.ceil(content.length * 0.3);
}

export class WorkingMemory {
  private messages: Message[] = [];
  private tier: Tier;
  private tokenBudget: number;

  constructor(tier: Tier = 'Flash') {
    this.tier = tier;
    this.tokenBudget = TIER_BUDGETS[tier];
  }

  addMessage(message: Message): void {
    const enriched: Message = {
      ...message,
      priority: message.priority ?? ROLE_PRIORITY[message.role],
      tokens: message.tokens ?? estimateTokens(message.content),
      ts: message.ts ?? Date.now(),
    };
    this.messages.push(enriched);

    if (this.messages.length > SLIDING_WINDOW_MAX) {
      this.trimToWindow();
    }

    this.trimToBudget();
  }

  getWindow(): Message[] {
    return [...this.messages];
  }

  setTier(tier: Tier): void {
    this.tier = tier;
    this.tokenBudget = TIER_BUDGETS[tier];
    this.trimToBudget();
  }

  getTier(): Tier {
    return this.tier;
  }

  getBudget(): number {
    return this.tokenBudget;
  }

  size(): number {
    return this.messages.length;
  }

  totalTokens(): number {
    return this.messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0);
  }

  clear(): void {
    this.messages = [];
  }

  private trimToWindow(): void {
    while (this.messages.length > SLIDING_WINDOW_MAX) {
      const idx = this.findRemovalCandidate();
      if (idx === -1) break;
      this.messages.splice(idx, 1);
    }
  }

  trimToBudget(): void {
    let iterations = 0;
    const maxIterations = this.messages.length * 2;

    while (this.totalTokens() > this.tokenBudget && iterations < maxIterations) {
      if (this.messages.length <= 1) break;

      const idx = this.findRemovalCandidate();
      if (idx === -1) break;

      this.messages.splice(idx, 1);
      iterations++;
    }
  }

  private findRemovalCandidate(): number {
    const userMessages = this.messages
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.role === 'user');
    const assistantMessages = this.messages
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.role === 'assistant');

    const protectedUserIndices = new Set(
      userMessages.slice(-MIN_RECENT_USER).map(({ i }) => i)
    );
    const protectedAssistantIndices = new Set(
      assistantMessages.slice(-MIN_RECENT_ASSISTANT).map(({ i }) => i)
    );
    const systemIndices = new Set(
      this.messages
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.role === 'system')
        .map(({ i }) => i)
    );

    const candidates: { index: number; priority: number; ts: number }[] = [];

    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      if (systemIndices.has(i)) continue;
      if (msg.role === 'user' && protectedUserIndices.has(i)) continue;
      if (msg.role === 'assistant' && protectedAssistantIndices.has(i)) continue;

      candidates.push({
        index: i,
        priority: msg.priority ?? ROLE_PRIORITY[msg.role],
        ts: msg.ts ?? 0,
      });
    }

    if (candidates.length === 0) {
      for (let i = 0; i < this.messages.length; i++) {
        const msg = this.messages[i];
        if (msg.role === 'system') continue;
        if (msg.role === 'user' && protectedUserIndices.has(i)) continue;
        if (msg.role === 'assistant' && protectedAssistantIndices.has(i)) continue;
        candidates.push({
          index: i,
          priority: msg.priority ?? ROLE_PRIORITY[msg.role],
          ts: msg.ts ?? 0,
        });
      }
    }

    if (candidates.length === 0) {
      for (let i = 0; i < this.messages.length - 1; i++) {
        const msg = this.messages[i];
        if (msg.role === 'system') continue;
        candidates.push({
          index: i,
          priority: msg.priority ?? ROLE_PRIORITY[msg.role],
          ts: msg.ts ?? 0,
        });
      }
    }

    if (candidates.length === 0) return -1;

    candidates.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.ts - b.ts;
    });

    return candidates[0].index;
  }
}
