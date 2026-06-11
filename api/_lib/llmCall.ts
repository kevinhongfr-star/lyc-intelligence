/**
 * DeepSeek API client — used by T4 scoring engine for 5-criteria evaluation.
 *
 * Source: docs/org_intelligence_scoring_spec_v1.2.md §"LLM Call Detail"
 *
 * Defaults (per v1.2 spec):
 *   - model: deepseek-chat
 *   - temperature: 0.1 (low variance for rubric application)
 *   - max_tokens: 200 (sub-score + rationale is short)
 *   - timeout: 7s per call
 *
 * Env vars required:
 *   DEEPSEEK_API_KEY — NEXUS-side key (per MEMORY mandatory DeepSeek rule)
 */

import {
  LLM_MAX_TOKENS,
  LLM_MODEL,
  LLM_TEMPERATURE,
  LLM_TIMEOUT_MS,
} from './scoringCriteria.js';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export interface LLMCallOptions {
  prompt: string;
  model?: typeof LLM_MODEL;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LLMCallResult {
  content: string;
  model: typeof LLM_MODEL;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
}

export class LLMError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'LLMError';
  }
}

export async function callLLM(opts: LLMCallOptions): Promise<LLMCallResult> {
  if (!DEEPSEEK_API_KEY) {
    throw new LLMError('DEEPSEEK_API_KEY environment variable is not set');
  }

  const model = opts.model ?? LLM_MODEL;
  const temperature = opts.temperature ?? LLM_TEMPERATURE;
  const maxTokens = opts.maxTokens ?? LLM_MAX_TOKENS;
  const timeoutMs = opts.timeoutMs ?? LLM_TIMEOUT_MS;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();
  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: opts.prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new LLMError(`DeepSeek API ${res.status}: ${text.slice(0, 200)}`, res.status);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    const content = json.choices?.[0]?.message?.content ?? '';
    if (!content) {
      throw new LLMError('DeepSeek returned empty content');
    }

    return {
      content,
      model,
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    if (e instanceof LLMError) throw e;
    if ((e as any)?.name === 'AbortError') {
      throw new LLMError(`DeepSeek call timed out after ${timeoutMs}ms`);
    }
    throw new LLMError(`DeepSeek call failed: ${(e as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}
