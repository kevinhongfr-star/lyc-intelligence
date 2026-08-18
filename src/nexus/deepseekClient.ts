/**
 * deepseekClient.ts — DeepSeek API Client for NEXUS (#39)
 *
 * DeepSeekClient class:
 *   - Base URL: https://api.deepseek.com/v1
 *   - API key: VITE_DEEPSEEK_API_KEY env var
 *   - chat(): 30s timeout, 3 retries with exponential backoff (1s → 2s → 4s)
 *   - Structured error wrapping (DeepSeekError extends Error)
 *   - Mock fallback when no API key configured (returns deterministic canned response)
 *   - Cost calculation: $0.14/1M input tokens, $0.28/1M output tokens
 *
 * No React. Strict TypeScript. Works in browser + Node (via global fetch).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Types
// ─────────────────────────────────────────────────────────────────────────────

export type DeepSeekRole = 'system' | 'user' | 'assistant';

export interface DeepSeekMessage {
  role: DeepSeekRole;
  content: string;
  /** Optional name for multi-user conversations */
  name?: string;
}

export interface DeepSeekChatOptions {
  model?: 'deepseek-chat' | 'deepseek-reasoner';
  /** Sampling temperature 0–2. Default 0.7. */
  temperature?: number;
  /** Top-p nucleus sampling 0–1. Default 1. */
  topP?: number;
  /** Max tokens to generate. Default 2048. */
  maxTokens?: number;
  /** Presence penalty -2 to 2. Default 0. */
  presencePenalty?: number;
  /** Frequency penalty -2 to 2. Default 0. */
  frequencyPenalty?: number;
  /** Stop sequences. Up to 16. */
  stop?: string[];
  /** Response format (JSON mode). */
  responseFormat?: { type: 'text' | 'json_object' };
  /** Abort signal for cancellation from caller. */
  signal?: AbortSignal;
}

export interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /** DeepSeek V3-specific cache-hit tokens (if enabled). */
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface DeepSeekChatChoice {
  index: number;
  message: {
    role: DeepSeekRole;
    content: string;
    /** Reasoner models may include reasoning_content */
    reasoning_content?: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

export interface DeepSeekChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: DeepSeekChatChoice[];
  usage: DeepSeekUsage;
  system_fingerprint?: string;
}

export interface DeepSeekCost {
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  /** Currency-formatted string for display */
  formatted: string;
}

export interface DeepSeekChatResult {
  response: DeepSeekChatResponse;
  content: string;
  usage: DeepSeekUsage;
  cost: DeepSeekCost;
  /** True if the mock fallback was used */
  mockFallback: boolean;
  /** Retry count (0 = first attempt succeeded). */
  retries: number;
  /** Wall-clock ms for entire request including retries. */
  latencyMs: number;
}

/**
 * Structured error with machine-readable category.
 * Categories:
 *   auth        — 401, invalid API key
 *   quota       — 402/429, rate limit or billing
 *   bad_request — 400, bad payload
 *   server      — 5xx, DeepSeek-side
 *   timeout     — request timed out or aborted
 *   network     — connectivity / DNS / TLS
 *   unknown     — anything else
 */
export type DeepSeekErrorCode =
  | 'auth'
  | 'quota'
  | 'bad_request'
  | 'server'
  | 'timeout'
  | 'network'
  | 'unknown';

export class DeepSeekError extends Error {
  readonly code: DeepSeekErrorCode;
  readonly statusCode?: number;
  readonly retryAfterMs?: number;
  readonly cause?: unknown;

  constructor(
    message: string,
    code: DeepSeekErrorCode,
    opts: { statusCode?: number; retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'DeepSeekError';
    this.code = code;
    this.statusCode = opts.statusCode;
    this.retryAfterMs = opts.retryAfterMs;
    this.cause = opts.cause;
    Object.setPrototypeOf(this, DeepSeekError.prototype);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pricing constants
// ─────────────────────────────────────────────────────────────────────────────

/** USD per 1M input tokens for DeepSeek V3 Chat (flash tier). */
export const DEEPSEEK_INPUT_COST_PER_1M_USD = 0.14;
/** USD per 1M output tokens for DeepSeek V3 Chat (flash tier). */
export const DEEPSEEK_OUTPUT_COST_PER_1M_USD = 0.28;

export function calculateCost(usage: DeepSeekUsage): DeepSeekCost {
  const inputCostUsd = (usage.prompt_tokens / 1_000_000) * DEEPSEEK_INPUT_COST_PER_1M_USD;
  const outputCostUsd = (usage.completion_tokens / 1_000_000) * DEEPSEEK_OUTPUT_COST_PER_1M_USD;
  const totalCostUsd = inputCostUsd + outputCostUsd;
  const formatted = `$${totalCostUsd.toFixed(6)}`;
  return { inputCostUsd, outputCostUsd, totalCostUsd, formatted };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Client class
// ─────────────────────────────────────────────────────────────────────────────

export interface DeepSeekClientConfig {
  /** Override base URL (for proxies / staging). Default: https://api.deepseek.com/v1 */
  baseUrl?: string;
  /** Override API key (otherwise reads VITE_DEEPSEEK_API_KEY env). */
  apiKey?: string | null;
  /** Default request timeout ms. Default 30000. */
  timeoutMs?: number;
  /** Max retry attempts for retryable errors. Default 3 (total attempts = 1 + retries). */
  maxRetries?: number;
  /** Initial backoff ms (exponential: backoff * 2^attempt). Default 1000. */
  initialBackoffMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 1000;

function readEnvKey(): string | null {
  // W4-6 / #1291 — server-only key read. NEVER read from import.meta.env
  // (client bundle) — that would expose the DeepSeek API key to anyone
  // viewing the built JS. All DeepSeek calls must go through /api/chat
  // (serverless) which reads process.env at runtime.
  if (typeof process !== 'undefined' && process.env) {
    const v = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function delayMs(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export class DeepSeekClient {
  readonly baseUrl: string;
  readonly apiKey: string | null;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly initialBackoffMs: number;

  constructor(config: DeepSeekClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.apiKey = config.apiKey ?? readEnvKey();
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = config.initialBackoffMs ?? DEFAULT_BACKOFF_MS;
  }

  /** True when a real API key was found. */
  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  // ── Public chat API ─────────────────────────────────────────────────

  async chat(
    messages: DeepSeekMessage[],
    options: DeepSeekChatOptions = {},
  ): Promise<DeepSeekChatResult> {
    const startedAt = Date.now();
    const model = options.model ?? 'deepseek-chat';

    if (!this.hasApiKey()) {
      const { response, content } = this.mockChatResponse(messages, model);
      return {
        response,
        content,
        usage: response.usage,
        cost: calculateCost(response.usage),
        mockFallback: true,
        retries: 0,
        latencyMs: Date.now() - startedAt,
      };
    }

    const url = `${this.baseUrl}/chat/completions`;
    const payload = this.buildPayload(messages, options, model);

    let lastError: DeepSeekError | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.fetchOnce(url, payload, options.signal);
        const choice = result.choices[0];
        const content = choice?.message?.content ?? '';
        return {
          response: result,
          content,
          usage: result.usage,
          cost: calculateCost(result.usage),
          mockFallback: false,
          retries: attempt,
          latencyMs: Date.now() - startedAt,
        };
      } catch (err) {
        const wrapped = this.wrapError(err);
        lastError = wrapped;

        if (!this.isRetryable(wrapped)) {
          throw wrapped;
        }
        if (attempt === this.maxRetries) {
          break;
        }
        const backoffBase = wrapped.retryAfterMs ?? this.initialBackoffMs;
        const backoff = backoffBase * Math.pow(2, attempt);
        await delayMs(backoff, options.signal);
      }
    }

    throw lastError ?? new DeepSeekError('Unknown error', 'unknown');
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private buildPayload(
    messages: DeepSeekMessage[],
    options: DeepSeekChatOptions,
    model: string,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      model,
      messages: messages.map((m) => (m.name ? { role: m.role, content: m.content, name: m.name } : { role: m.role, content: m.content })),
    };
    if (typeof options.temperature === 'number') payload.temperature = options.temperature;
    if (typeof options.topP === 'number') payload.top_p = options.topP;
    if (typeof options.maxTokens === 'number') payload.max_tokens = options.maxTokens;
    if (typeof options.presencePenalty === 'number') payload.presence_penalty = options.presencePenalty;
    if (typeof options.frequencyPenalty === 'number') payload.frequency_penalty = options.frequencyPenalty;
    if (Array.isArray(options.stop) && options.stop.length > 0) payload.stop = options.stop;
    if (options.responseFormat) payload.response_format = options.responseFormat;
    return payload;
  }

  private async fetchOnce(
    url: string,
    payload: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<DeepSeekChatResponse> {
    const controller = new AbortController();
    const userSignal = signal;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (this.timeoutMs > 0) {
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }
    if (userSignal) {
      if (userSignal.aborted) {
        controller.abort();
      } else {
        userSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const bodyText = await res.text();
      let body: any = null;
      try {
        body = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        body = null;
      }

      if (!res.ok) {
        const msg = body?.error?.message ?? body?.message ?? bodyText ?? `HTTP ${res.status}`;
        const retryAfter = res.headers.has('retry-after')
          ? parseInt(res.headers.get('retry-after') ?? '0', 10) * 1000
          : undefined;
        const code = this.statusToErrorCode(res.status);
        throw new DeepSeekError(msg, code, { statusCode: res.status, retryAfterMs: retryAfter });
      }

      if (!body || typeof body !== 'object') {
        throw new DeepSeekError('Empty or non-JSON response', 'server');
      }
      if (!Array.isArray(body.choices) || body.choices.length === 0) {
        throw new DeepSeekError('Response has no choices', 'server');
      }
      return body as DeepSeekChatResponse;
    } catch (err) {
      if (err instanceof DeepSeekError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        const msg = userSignal?.aborted ? 'Request aborted by caller' : `Request timed out after ${this.timeoutMs}ms`;
        throw new DeepSeekError(msg, 'timeout');
      }
      if (err instanceof TypeError && /fetch|network|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(err.message)) {
        throw new DeepSeekError(`Network error: ${err.message}`, 'network', { cause: err });
      }
      throw new DeepSeekError(
        err instanceof Error ? err.message : 'Unknown fetch error',
        'unknown',
        { cause: err },
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private statusToErrorCode(status: number): DeepSeekErrorCode {
    if (status === 401 || status === 403) return 'auth';
    if (status === 402 || status === 429) return 'quota';
    if (status >= 400 && status < 500) return 'bad_request';
    if (status >= 500) return 'server';
    return 'unknown';
  }

  private isRetryable(err: DeepSeekError): boolean {
    switch (err.code) {
      case 'timeout':
      case 'network':
      case 'server':
      case 'quota':
        return true;
      case 'auth':
      case 'bad_request':
      case 'unknown':
      default:
        return false;
    }
  }

  private wrapError(err: unknown): DeepSeekError {
    if (err instanceof DeepSeekError) return err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new DeepSeekError('Request aborted', 'timeout');
    }
    if (err instanceof TypeError && /fetch|network|ENOTFOUND|ECONNREFUSED/i.test(err.message)) {
      return new DeepSeekError(`Network error: ${err.message}`, 'network', { cause: err });
    }
    return new DeepSeekError(
      err instanceof Error ? err.message : 'Unknown error',
      'unknown',
      { cause: err },
    );
  }

  // ── Mock fallback — deterministic canned response for dev/test ─────

  private mockChatResponse(
    messages: DeepSeekMessage[],
    model: string,
  ): { response: DeepSeekChatResponse; content: string } {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const prompt = lastUser?.content ?? '';
    const wordCount = Math.max(30, Math.min(150, prompt.trim().split(/\s+/).length * 2 + 40));
    const sample = buildMockReply(prompt, wordCount);

    const promptTokens = Math.ceil(messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0));
    const completionTokens = Math.ceil(sample.length / 4);

    const response: DeepSeekChatResponse = {
      id: `mock-${Date.now().toString(36)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: sample },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };
    return { response, content: sample };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mock reply generator (self-contained, no randomness for determinism)
// ─────────────────────────────────────────────────────────────────────────────

function buildMockReply(userPrompt: string, targetWords: number): string {
  const lower = userPrompt.toLowerCase();
  const fragments: string[] = [];

  if (/career|transition|next role|positioning/.test(lower)) {
    fragments.push(
      'Before we position you for that next move, let us isolate the one dimension most likely to break the transition.',
      'Most executives fail not on capability but on a single blind spot a search firm will spot in five minutes.',
      'If you are open to it, I would walk you through LEAP — positioning, proof, visibility, and transition readiness.',
    );
  } else if (/assessment|diagnostic|prism|spark|forge|bridge|mosaic|drive|leap|quest|impact|coach|cpi/.test(lower)) {
    fragments.push(
      'Let me ground this in the framework.',
      'The right instrument depends on the blind spot you are trying to surface, not the title you hold.',
      'I can recommend one once I understand the context you are navigating.',
    );
  } else if (/help|stuck|issue|not working/.test(lower)) {
    fragments.push(
      'Let us narrow this down before escalating.',
      'Two quick questions: when did this begin, and have you tried the standard recovery step?',
      'This usually isolates 80% of cases within two turns.',
    );
  } else {
    fragments.push(
      'To answer this properly, I want to anchor it to a concrete framework rather than giving generic advice.',
      'The executives who get the most out of this conversation arrive at a specific diagnostic question.',
      'What context are you navigating right now that we can structure against the LYC methodology?',
    );
  }

  const joined = fragments.join(' ');
  const words = joined.split(/\s+/).filter(Boolean);
  if (words.length <= targetWords) return joined;
  return words.slice(0, targetWords).join(' ') + '.';
}
