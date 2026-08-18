/**
 * schemas/assessmentResult.ts — #97 SHARED contract for all 6 diagnostic results
 *
 * This is the data contract ALL result templates (#62/web + #62/pdf variants)
 * consume. Keeping one shared schema avoids divergence: per-diagnostic schemas
 * in prism.ts / spark.ts / etc. EXTEND this base (via intersection) with
 * diagnostic-specific fields only.
 *
 * The canonical runtime source of truth is the 8-table assessment domain
 * (see types/database.ts). Schemas here are the TS-level compile-time guards.
 */

import type { TierKey } from '@/config/tierConfig';
import type { DiagnosticSlug, CanonicalQuestionType } from '@/types/assessment';
import type { AssessmentResultDimensionRow } from '@/types/database';

/* ── BASE: Dimension score row (per-diagnostic 4-6 dimensions) ───── */

export interface SchemaDimensionScore
  extends Pick<AssessmentResultDimensionRow, 'dimension_key' | 'score' | 'level' | 'dimension_name' | 'description'> {
  /** Weight this dimension contributed (for debug/visibility displays) */
  weight?: number;
  /** Optional human-readable band label: 'Developing' | 'Proficient' | 'Advanced' | 'Mastery' */
  band_label?: string;
  /** 1-3 bullet insights surfaced for this dimension (AI-generated) */
  insights?: string[];
  /** Resource recommendations associated with this dimension (RAG hits) */
  resource_refs?: Array<{ id: string; title: string; type: 'article' | 'guide' | 'playbook' }>;
}

/* ── BASE: Archetype profile match ───────────────────────────────── */

export interface SchemaArchetypeMatch {
  archetype_key: string;
  name: string;
  description: string;
  key_traits: string[];
  /** 0-100 how strongly this archetype matched the answers */
  match_strength: number;
  /** Second-place archetype, if close enough to show (within 10 points) */
  runner_up?: { archetype_key: string; name: string; match_strength: number };
}

/* ── BASE: AI insights (output from #96 AI Content Engine) ───────── */

export interface SchemaAiInsights {
  /** 1-paragraph executive summary of the overall result */
  summary: string;
  /** 2-3 named strengths, tied directly to diagnostic dimensions */
  strengths: Array<{ title: string; dimension_key: string; description: string }>;
  /** 2-3 growth areas, each with a specific, non-fluffy action */
  growth_areas: Array<{ title: string; dimension_key: string; action: string }>;
  /** 3-4 concrete next steps — ordered 30/60/90-day style */
  next_steps: Array<{ label: string; timeframe: '30d' | '60d' | '90d' | 'ongoing'; detail: string }>;
  /** How this result was produced (guardrails info — for audit), not shown to EI tier */
  _audit?: {
    model_used: 'deepseek-flash' | 'deepseek-pro' | 'template-generated';
    prompt_version: string;
    passes_brand_guard: boolean;
    generated_at: string;
    tokens: number;
  };
}

/* ── BASE: NEXUS CTA block appended to all result experiences ────── */

export interface SchemaNexusCta {
  variant: 'discussion' | 'upgrade_to_professional' | 'upgrade_to_executive' | 'complete_more_diagnostics' | 'none';
  headline: string;
  body: string;
  /** 1-3 suggested prompts for the user to send to NEXUS */
  suggested_prompts: string[];
  /** Miles cost preview for initiating a chat about this result */
  miles_cost_preview: 1 | 3;
}

/* ── BASE: Share link metadata ──────────────────────────────────── */

export interface SchemaShareInfo {
  share_token?: string;
  share_url?: string;
  /** Share is considered private — viewers must be authed + whitelisted */
  is_private: boolean;
  expires_at?: string;
}

/* ── SHARED RESULT CONTRACT ──────────────────────────────────────── */

export interface AssessmentResultSchema<Ext = unknown> {
  /** Runtime contract version — bump when breaking changes are released */
  readonly contract_version: 'b2c.v1';

  /** Assessment metadata */
  assessment: {
    slug: DiagnosticSlug;
    title: string;
    subtitle: string;
    accent: string;              // hex color (per-diagnostic accent)
    tier_key: TierKey;           // minimum tier required for full view
    completed_at: string;        // ISO date
    time_taken_seconds?: number; // attempt duration
    anonymous: boolean;
  };

  /** Attempt + user reference */
  attempt: {
    attempt_id: string;
    result_id: string;
    recipient: {
      name: string;
      display_name?: string;
      email?: string;
      user_id?: string;           // null if anonymous
    };
    /** The tier of the PERSON VIEWING the result (not the assessment tier_key) */
    viewer_tier: TierKey;
  };

  /** Scoring core */
  score: {
    overall: number;             // 0-100
    level: 'Developing' | 'Proficient' | 'Advanced' | 'Mastery';
    /** Optional: percentile (hidden in B2C v1 per #1341, kept for internal dashboards) */
    percentile_internal?: number;
    dimensions: SchemaDimensionScore[];
  };

  /** Archetype */
  archetype?: SchemaArchetypeMatch;

  /** AI-generated content (null for Executive Introduction REDACTED state) */
  ai_insights?: SchemaAiInsights;

  /** NEXUS call-to-action block */
  nexus_cta: SchemaNexusCta;

  /** Share metadata */
  share: SchemaShareInfo;

  /** Tiering redaction state — so templates know what was hidden */
  tiering: {
    /** True if viewer_tier is below assessment.tier_key capability */
    redaction_applied: boolean;
    redacted_sections: Array<'ai_growth' | 'ai_next_steps' | 'full_dimensions' | 'archetype_detail'>;
    upgrade_tier?: TierKey;      // e.g. viewer is EI, assessment needs Professional -> "professional"
  };

  /** EXTENSION POINT: per-diagnostic schema additions intersect via Ext */
  diagnostic_specific?: Ext;
}

/* ── Concrete base default builder (avoids partial object bugs) ── */

export function createBaseResultSchema(props: Omit<AssessmentResultSchema, 'contract_version'>): AssessmentResultSchema {
  return { contract_version: 'b2c.v1', ...props };
}

/* ── Shared: Answer snapshot (used by Q&A / discuss-with-nexus flows) ── */

export interface SchemaAnswerSnapshot {
  question_key: string;
  question_type: CanonicalQuestionType;
  prompt: string;
  answer: unknown;
  dimension_key?: string;
}

/* ── Shared: validation (for API ingress) ───────────────────────── */

/**
 * Lightweight runtime validation for the shared result schema.
 * Returns list of issues (empty = OK). Intentionally non-throwing —
 * renderReport pipeline appends issues to a warning banner instead of failing.
 */
export function validateResultSchema(v: unknown): string[] {
  if (!v || typeof v !== 'object') return ['Result schema: value is not an object'];
  const issues: string[] = [];
  const r = v as AssessmentResultSchema;
  if (r.contract_version !== 'b2c.v1') issues.push(`contract_version must be 'b2c.v1', got ${r.contract_version}`);
  if (!r.assessment?.slug) issues.push('assessment.slug is required');
  if (!r.assessment?.title) issues.push('assessment.title is required');
  if (typeof r.score?.overall !== 'number' || r.score.overall < 0 || r.score.overall > 100) {
    issues.push('score.overall must be 0-100');
  }
  if (!Array.isArray(r.score?.dimensions)) issues.push('score.dimensions must be an array');
  if (!r.attempt?.recipient?.name) issues.push('attempt.recipient.name is required');
  if (!r.attempt?.viewer_tier) issues.push('attempt.viewer_tier is required');
  if (typeof r.nexus_cta !== 'object' || r.nexus_cta === null) issues.push('nexus_cta object is required');
  if (typeof r.share !== 'object' || r.share === null) issues.push('share object is required');
  return issues;
}
