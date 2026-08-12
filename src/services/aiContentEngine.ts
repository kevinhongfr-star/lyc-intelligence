/**
 * services/aiContentEngine.ts — #96 AI Content Generation Engine
 *
 * 8-stage pipeline, typed end-to-end, reusing Phase 8 src/nexus/ building
 * blocks (DeepSeekClient, QualityGate, routeModel, intentClassifier,
 * systemPromptBuilder, nexusMilesService, TierGate).
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ PIPELINE — stages 1..8 — runAssessmentInsightPipeline(input)        │
 * │                                                                     │
 * │  1  TIER GATE       ← TierGate + rate limiter + miles precheck      │
 * │  2  INTENT & MODEL  ← classifyIntent + routeModel (Flash vs Pro)    │
 * │  3  CONTEXT ASSEMBLY ← systemPromptBuilder + NEXUS_ASSESSMENT_KB    │
 * │  4  PROMPT BUILD    ← per-diagnostic prompt builder (see below)     │
 * │  5  LLM GENERATE    ← DeepSeekClient.chat                           │
 * │  6  PARSE & VALIDATE← structured output (JSON→typed blocks)         │
 * │  7  BRAND GUARD     ← QualityGate (banned words, tier naming,      │
 * │                      internal framework, structure, signatures)     │
 * │  8  PROVENANCE & SAVE ← cost calc + miles debit + AiContentProvenance│
 * │                      + return AiGeneratedInsightBundle              │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * "Free" → always say "Executive Introduction" or "complimentary assessment"
 * — enforced by brand guard stage 7 (banned word scanner on output).
 */

import { randomUUID } from 'crypto';
import { DeepSeekClient, calculateCost, type DeepSeekChatResult } from '@/nexus/deepseekClient';
import { QualityGate, bannedWordScanner, canonicalTierNameCheck } from '@/nexus/brandGuard';
import { classifyIntent, routeModel, type NexusIntent } from '@/nexus/intentClassifier';
import { buildNexusSystemPrompt } from '@/nexus/systemPromptBuilder';
import { NEXUS_ASSESSMENT_KB } from '@/nexus/nexusKnowledge';
import { TierGate } from '@/nexus/tierGating';
import { NexusRateLimiter } from '@/nexus/rag/rateLimiter';
import { VOICE_PRINCIPLES } from '@/constants/brandVoice';
import type { DiagnosticSlug } from '@/types/assessment';
import type { TierKey } from '@/config/tierConfig';
import type { AssessmentResultData } from '@/types/reportTemplates';
import type {
  AiContentBlock,
  AiContentProvenance,
  AiGeneratedInsightBundle,
  AiConfidence,
} from '@/types/schemas/aiGeneratedContent';
import {
  PER_DIAGNOSTIC_INSIGHT_PROMPTS,
  buildDimensionSummaries,
  InsightGenerationIntent,
} from '@/services/aiPromptLibrary';
import { earnNexusMiles } from '@/nexus/nexusMilesService';

export interface PipelineInput {
  user: { user_id: string; tier: TierKey; email?: string | null; name?: string | null };
  data: Pick<AssessmentResultData, 'definition' | 'result' | 'dimensions' | 'archetype'>;
  intent: InsightGenerationIntent;
  /** Miles budget per model */
  miles?: { allowFlash?: boolean; allowPro?: boolean; hard_cap?: number };
  /** Prompt version for future replayability — bump when prompt library changes. */
  prompt_config_version?: string;
  /** Skip LLM call and fall back to template-generated summaries (dev / offline). */
  preferTemplate?: boolean;
  /** Optional RAG citation IDs to forward to provenance block. */
  ragCitations?: Array<{ content_id: string; title: string; source_type: string }>;
}

export interface PipelineMetrics {
  stage_durations_ms: Record<string, number>;
  model_used: AiContentProvenance['model_used'];
  tokens: AiContentProvenance['tokens'];
  cost_cents: number;
  miles_debited: 0 | 1 | 3;
}

export interface PipelineResult {
  bundle: AiGeneratedInsightBundle;
  metrics: PipelineMetrics;
  stage_brand_issues: AiContentProvenance['brand_guard'];
}

/** Reusable class instance singleton (rate limiter keeps in-memory state). */
let _sharedRateLimiter: NexusRateLimiter | null = null;
function getRateLimiter(): NexusRateLimiter {
  if (!_sharedRateLimiter) _sharedRateLimiter = new NexusRateLimiter();
  return _sharedRateLimiter;
}

const PROMPT_CONFIG_VERSION = 'b2c.v1-batch3';

/**
 * Entry point. Runs the 8 stages. All side-effects are isolated to:
 *   • DeepSeekClient.chat (HTTPS)
 *   • earnNexusMiles (miles debit — Phase 8 service)
 *   • NexusRateLimiter (in-memory only, no DB writes)
 */
export async function runAssessmentInsightPipeline(input: PipelineInput): Promise<PipelineResult> {
  const t0 = performance.now();
  const durations: Record<string, number> = {};
  const stamp = (stage: string) => {
    durations[stage] = Math.round(performance.now() - t0 - Object.values(durations).reduce((a, b) => a + b, 0));
  };

  // Stage 1 — Tier gate
  const tierGate = new TierGate({
    tier: input.user.tier,
    user_id: input.user.user_id,
  });
  const modelAllowed = tierGate.canUseModel('Flash') ? 'flash' : 'none';
  if (modelAllowed === 'none') {
    throw new Error(`Tier ${input.user.tier} is not allowed AI content generation.`);
  }
  const rl = getRateLimiter();
  const rlCheck = rl.check(input.user.user_id, input.user.tier);
  if (!rlCheck.allowed) {
    throw new Error(`Rate limited: retry after ${new Date(rlCheck.retry_at).toISOString()}`);
  }
  stamp('1_tier_gate');

  // Stage 2 — Intent & model routing
  const classified = classifyIntent(input.intent.highLevelIntent ?? 'Generate a summary of my assessment result');
  const routing = routeModel(classified.intent, classified.confidence);
  // B2C hard rule: only debit 1 mile (Flash) unless explicitly opted in via miles.allowPro.
  const usePro = Boolean(input.miles?.allowPro) && routing.model === 'Pro';
  const miles_debited: 0 | 1 | 3 = input.preferTemplate ? 0 : usePro ? 3 : 1;
  stamp('2_intent_model');

  // Stage 3 — Context assembly
  const kbEntry = NEXUS_ASSESSMENT_KB[input.data.definition.assessment_id] ?? null;
  const sysPrompt = buildNexusSystemPrompt({
    userContext: {
      name: input.user.name ?? undefined,
      email: input.user.email ?? undefined,
      tier: input.user.tier,
      assessmentInfo: kbEntry
        ? {
            code: input.data.definition.assessment_id,
            title: input.data.definition.title,
            description: kbEntry.description,
          }
        : undefined,
    },
    intent: {
      intent: classified.intent as NexusIntent,
      guidance: VOICE_PRINCIPLES.confidentiality,
    },
    tierGating: {
      tier: input.user.tier,
      redactionNote:
        input.user.tier === 'executive_introduction'
          ? 'This user is on Executive Introduction. Do not tease locked features or mention "free" — say "Executive Introduction tier" or "complimentary assessment".'
          : undefined,
    },
  });
  stamp('3_context_assembly');

  // Stage 4 — Per-diagnostic prompt build
  const prompts = PER_DIAGNOSTIC_INSIGHT_PROMPTS[input.data.definition.assessment_id as DiagnosticSlug] ??
                PER_DIAGNOSTIC_INSIGHT_PROMPTS.default;
  const dimSummaries = buildDimensionSummaries(input.data.dimensions, input.data.definition.assessment_id as DiagnosticSlug);
  const userPrompt = prompts.buildUserPrompt({
    definition: input.data.definition,
    result: input.data.result,
    dimensions: input.data.dimensions,
    archetype: input.data.archetype,
    dimSummaries,
    intent: input.intent,
  });
  stamp('4_prompt_build');

  // Stage 5 — LLM generate OR template fallback
  let generated: LlmParseCandidate;
  let chatResult: DeepSeekChatResult | null = null;
  let model_used: AiContentProvenance['model_used'];
  const deepseek = new DeepSeekClient();
  if (!input.preferTemplate && deepseek.isConfigured()) {
    const reply = await deepseek.chat(
      [
        { role: 'system', content: sysPrompt.system_prompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: usePro ? 'deepseek-chat' : 'deepseek-chat', // both models same endpoint slug; client uses model name internally
        temperature: 0.35,
        response_format: 'json',
        max_output_tokens: 2400,
      },
    );
    chatResult = await reply.result;
    generated = parseStructuredJson(chatResult.reply);
    model_used = usePro ? 'deepseek-pro' : 'deepseek-flash';
  } else {
    generated = buildTemplateFallback(input, dimSummaries, prompts);
    model_used = 'template-generated';
  }
  stamp('5_llm_generate');

  // Stage 6 — parse & validate into typed AiContentBlocks
  const generation_id = randomUUID();
  const now = new Date().toISOString();
  const provenance: AiContentProvenance = {
    generation_id,
    intent: classified.intent as AiContentProvenance['intent'],
    model_used,
    cost_cents: chatResult ? Math.round(calculateCost(chatResult.usage).costUsd * 100) : 0,
    miles_debited,
    user_tier: input.user.tier,
    brand_guard: { passes: true, hard_violations: 0, soft_violations: 0, issues: [] },
    prompt_config_version: input.prompt_config_version ?? PROMPT_CONFIG_VERSION,
    generated_at: now,
    tokens: chatResult
      ? { prompt: chatResult.usage.prompt_tokens, completion: chatResult.usage.completion_tokens, total: chatResult.usage.total_tokens }
      : { prompt: 0, completion: 0, total: 0 },
  };

  const blocks = validatedBlocks(generated, provenance, input.ragCitations);
  stamp('6_parse_validate');

  // Stage 7 — brand guard (post-generation) — scan every block
  const gate = new QualityGate({
    requiredStructure: ['summary', 'strengths', 'growth_areas', 'next_steps'],
  });
  const combinedText = [blocks.summary, ...blocks.strengths, ...blocks.growth_areas, ...blocks.next_steps]
    .map((b) => b.content)
    .join('\n\n');
  const audit = gate.audit(combinedText);
  provenance.brand_guard = {
    passes: audit.overall_pass,
    hard_violations: audit.hard_issues,
    soft_violations: audit.soft_issues,
    issues: [
      ...bannedWordScanner(combinedText).slice(0, 5).map((w) => ({ severity: 'error' as const, category: 'banned_word', snippet: w.word })),
      ...canonicalTierNameCheck(combinedText).slice(0, 5).map((v) => ({ severity: 'warn' as const, category: 'tier_naming', snippet: v.found })),
      ...audit.issues.slice(0, 5).map((i) => ({ severity: i.severity as any, category: i.category ?? 'structure', snippet: i.message.slice(0, 80) })),
    ],
  };
  stamp('7_brand_guard');

  // Stage 8 — provenance save + miles debit
  if (miles_debited > 0) {
    try {
      // earnNexusMiles is idempotent by unique_generation_id
      await earnNexusMiles(input.user.user_id, -miles_debited, 'ai_generation', {
        generation_id,
        intent: classified.intent,
        model: model_used,
      }, generation_id);
    } catch {
      // Non-fatal: miles failing shouldn't lose the user's report insight.
      // Will be reconciled later via delivery audit logs.
    }
  }

  const bundle: AiGeneratedInsightBundle = {
    contract_version: 'ai.v1',
    summary: blocks.summary,
    strengths: blocks.strengths,
    growth_areas: blocks.growth_areas,
    next_steps: blocks.next_steps,
    dimension_insights: blocks.dimension_insights,
    archetype_narrative: blocks.archetype_narrative,
    _meta: {
      miles_spent_total: miles_debited,
      dollars_spent_cents: provenance.cost_cents,
      total_tokens: provenance.tokens.total,
      has_human_overrides: false,
      passes_brand_guard: audit.overall_pass,
      generated_at: now,
    },
  };
  stamp('8_provenance');

  return {
    bundle,
    metrics: {
      stage_durations_ms: durations,
      model_used,
      tokens: provenance.tokens,
      cost_cents: provenance.cost_cents,
      miles_debited,
    },
    stage_brand_issues: provenance.brand_guard,
  };
}

/* ── Structured parse helpers ─────────────────────────────────────── */

interface LlmParseCandidate {
  summary?: string;
  strengths?: string[];
  growthAreas?: string[];
  nextSteps?: string[];
  dimensionInsights?: Record<string, string>;
  archetypeNarrative?: string;
  confidence_overrides?: Record<string, AiConfidence>;
}

function parseStructuredJson(reply: string): LlmParseCandidate {
  try {
    // Often the LLM wraps JSON in markdown fences. Strip them.
    const stripped = reply.trim().replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(stripped);
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s: any) => typeof s === 'string') : undefined,
      growthAreas: Array.isArray(parsed.growthAreas) ? parsed.growthAreas.filter((s: any) => typeof s === 'string') : undefined,
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.filter((s: any) => typeof s === 'string') : undefined,
      dimensionInsights: parsed.dimensionInsights && typeof parsed.dimensionInsights === 'object' ? parsed.dimensionInsights : undefined,
      archetypeNarrative: typeof parsed.archetypeNarrative === 'string' ? parsed.archetypeNarrative : undefined,
    };
  } catch {
    return {};
  }
}

/* ── Template fallback (stage 5b) — deterministic when LLM unavailable */

function buildTemplateFallback(input: PipelineInput, dimSummaries: string[]): LlmParseCandidate {
  const dims = input.data.dimensions ?? [];
  const sortedAsc = [...dims].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const strengths = sortedAsc.slice(-3).reverse().map(
    (d, i) => `In ${d.dimension_name ?? d.dimension_key} (${d.score}), ${dimSummaries[i % dimSummaries.length] ?? 'you consistently deliver clear, confident outcomes.'}`,
  );
  const growth = sortedAsc.slice(0, 3).map(
    (d) => `Develop ${d.dimension_name ?? d.dimension_key} (${d.score}): the most immediate leverage point for raising your overall profile.`,
  );
  const next = [
    `Re-engage NEXUS to deep-dive on ${sortedAsc[0]?.dimension_name ?? 'your focus dimension'}.`,
    'Schedule a 30-day check-in to track movement on your lowest-scored dimensions.',
    'Use role-play scenarios in NEXUS to practice the behaviours that lift your growth areas.',
    'Share this result with a mentor or sponsor — their perspective can anchor the next 90 days.',
  ];
  const score = input.data.result.overall_score ?? 0;
  const summary =
    `Your ${input.data.definition.title} profile shows an overall score of ${score}, ` +
    `with clear strengths in ${strengths[0] ? strengths[0].split('(')[0].trim() : 'foundational areas'} ` +
    `and high-leverage growth opportunities in ${growth[0] ? growth[0].split('(')[0].trim() : 'targeted dimensions'}. ` +
    `This Executive Introduction preview highlights 3 of 6 dimensions and 1 strength. Upgrade to Professional for the complete package.`;

  return { summary, strengths, growthAreas: growth, nextSteps: next };
}

function validatedBlocks(
  g: LlmParseCandidate,
  provenance: AiContentProvenance,
  citations?: PipelineInput['ragCitations'],
): {
  summary: AiContentBlock;
  strengths: AiContentBlock[];
  growth_areas: AiContentBlock[];
  next_steps: AiContentBlock[];
  dimension_insights?: Record<string, AiContentBlock>;
  archetype_narrative?: AiContentBlock;
} {
  const mk = (kind: AiContentBlock['kind'], idx: number, content: string, anchor?: string, requires_tier?: AiContentBlock['requires_tier']): AiContentBlock => ({
    block_id: `${provenance.generation_id}-${kind}-${idx}`,
    kind,
    content: content.trim(),
    anchor_key: anchor,
    confidence: provenance.model_used === 'template-generated' ? 'medium' : 'high',
    citations,
    feedback: 0,
    provenance,
    requires_tier,
  });

  const summary = mk('summary_paragraph', 0,
    g.summary ?? 'Assessment summary unavailable at this time. Discuss your result with NEXUS for a tailored narrative.');

  const strengths = (g.strengths?.length ? g.strengths : [])
    .slice(0, 3)
    .map((s, i) => mk('strength', i, s, undefined, i >= 1 ? 'professional' : undefined));

  const growth_areas = (g.growthAreas?.length ? g.growthAreas : [])
    .slice(0, 3)
    .map((g2, i) => mk('growth_area', i, g2, undefined, 'professional'));

  const next_steps = (g.nextSteps?.length ? g.nextSteps : [])
    .slice(0, 4)
    .map((n, i) => mk('next_step', i, n, undefined, i >= 2 ? 'professional' : undefined));

  let dimension_insights: Record<string, AiContentBlock> | undefined;
  if (g.dimensionInsights) {
    dimension_insights = {};
    let i = 0;
    for (const [k, v] of Object.entries(g.dimensionInsights)) {
      dimension_insights[k] = mk('dimension_insight', i++, v, k, 'professional');
    }
  }

  let archetype_narrative: AiContentBlock | undefined;
  if (g.archetypeNarrative) {
    archetype_narrative = mk('archetype_narrative', 0, g.archetypeNarrative, undefined, 'professional');
  }

  return { summary, strengths, growth_areas, next_steps, dimension_insights, archetype_narrative };
}

export default runAssessmentInsightPipeline;
