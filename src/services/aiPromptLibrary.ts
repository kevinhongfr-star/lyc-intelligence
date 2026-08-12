/**
 * services/aiPromptLibrary.ts — #96 prompt library (6 diagnostics × 3 intents)
 *
 * All prompts MUST include:
 *   1. Mandatory brand-voice preamble (no "free", premium-not-SaaS language,
 *      Crimson-Pro headings via copy tone, always use tier_key for logic, never
 *      tier display names)
 *   2. Mandatory JSON response schema contract — the parser in
 *      aiContentEngine.ts.parseStructuredJson depends on these field names.
 *   3. Per-diagnostic framing (from NEXUS_ASSESSMENT_KB entry).
 *   4. Per-intent focus:
 *        summary_and_highlights   → overall + 3 strengths + 3 growth + 4 next_steps
 *        full_dimension_deep_dive → additionally: dimension_insights Record<string,string>
 *        archetype_narrative      → additionally: archetypeNarrative paragraph
 */

import type { DiagnosticSlug } from '@/types/assessment';
import type {
  AssessmentDefinitionRow,
  AssessmentResultDimensionRow,
  AssessmentArchetypeRow,
  AssessmentResultRow,
} from '@/types/database';
import { DIAGNOSTIC_ACCENTS, REPORT_LEVELS, scoreToReportLevel } from '@/types/reportTokens';
import type { AiContentProvenance } from '@/types/schemas/aiGeneratedContent';

export type InsightIntentKind =
  | 'summary_and_highlights'
  | 'full_dimension_deep_dive'
  | 'archetype_narrative';

export interface InsightGenerationIntent {
  kind: InsightIntentKind;
  /** Short free-form prompt (shown in "Discuss with NEXUS" and logged to provenance) */
  highLevelIntent?: string;
  /** Only include these dimensions (for dimension-specific refresh) */
  dimension_filter?: string[];
}

export interface PromptBuildCtx {
  definition: Pick<AssessmentDefinitionRow, 'assessment_id' | 'title' | 'subtitle' | 'description' | 'total_dimensions'>;
  result: Pick<AssessmentResultRow, 'overall_score' | 'overall_level' | 'completed_at' | 'attempt_id'>;
  dimensions: Pick<AssessmentResultDimensionRow, 'dimension_key' | 'dimension_name' | 'score' | 'level' | 'description'>[];
  archetype?: Pick<AssessmentArchetypeRow, 'archetype_code' | 'name' | 'description' | 'key_traits'> | null;
  dimSummaries: string[];
  intent: InsightGenerationIntent;
}

export interface PerDiagnosticPrompts {
  /** System-level framing block (injected AFTER the personality layer). */
  framing: string;
  /** Builds the user prompt for a given result + intent. */
  buildUserPrompt: (ctx: PromptBuildCtx) => string;
}

const RESPONSE_SCHEMA_PREABMLE = `
---
OUTPUT FORMAT (strict JSON, no markdown fences unless wrapping JSON in a single \\\`\\\`\\\`json fence at top and bottom):
{
  "summary": "1 paragraph overall assessment, 80–120 words, Premium not SaaS, Executive Introduction tier preview only shows summary + 1 strength + 0 growth — never mention the word free.",
  "strengths": ["Strength one.", "Strength two.", "Strength three."],
  "growthAreas": ["Growth one.", "Growth two.", "Growth three."],
  "nextSteps": ["Next step one — start with verb.", "Next step two.", "Next step three.", "Next step four."]
  ${/* for deeper intents, add optional extras */ ''}
  // only for kind=full_dimension_deep_dive, include ONE additional field:
  // "dimensionInsights": { "<dimension_key>": "1-2 sentence tailored insight that references the specific score and level context" }
  // only for kind=archetype_narrative, include ONE additional field:
  // "archetypeNarrative": "Rich narrative paragraph (100–160 words) tying the archetype's name and description to this specific person's scores"
}

BRAND LANGUAGE RULES — failure to follow these is a hard audit issue:
  - NEVER write the word "free" anywhere. Call the entry tier "Executive Introduction" or "complimentary assessment".
  - Use LYC Partners brand voice: premium, confidential, executive. No startup/SaaS metaphors.
  - Never use display names ("Professional", "Executive") in logic — just as a natural English noun phrase is okay, but tier_key logic must not appear in copy.
  - Reference the specific diagnostic by its title, and reference concrete scores ("72 in Strategic Positioning") to avoid generic fluff.
  - Zero emoji, zero buzzword clichés (game-changer, disrupt, unicorn, level up, unlock — avoid).
  - Always use a colon-space after numbered list headings that appear in summary text (if any).
`;

/* ── Framing per diagnostic (kept short, specific enough to avoid generic copy) ── */

const framingPrism =
  'PRISM measures Career & Professional Branding — dimensions are Strategic Positioning, Market Differentiation, Narrative Control, Visibility & Influence, Offer Readiness, Digital Footprint Quality. Headings carry Crimson Pro weight (thick, authoritative, editorial).';

const framingSpark =
  'SPARK measures AI Leadership Readiness — dimensions are Strategic AI Acumen, Implementation & Governance, Team Enablement, Risk & Ethics, Change Adoption, Measured ROI. Avoid hype language ("AGI is here", etc.). Stick to practical application and governance.';

const framingForge =
  'FORGE measures Sales Excellence — dimensions are Deal Strategy, Client Discovery, Negotiation Precision, Pipeline Acceleration, Relationship Depth, Commercial Judgment. Write from a senior deal-maker perspective.';

const framingBridge =
  'BRIDGE measures China Leadership Readiness — dimensions are Cross-Border Cultural Translation, Stakeholder Orchestration, Regional Governance, Execution Cadence, Government & Partner Interface, Leadership Narrative (Bilingual). Reference both China and global context.';

const framingMosaic =
  'MOSAIC measures Cultural Intelligence — dimensions are Cultural Self-Awareness, Perspective Taking, Adaptable Communication, Trust Building, Inclusive Decision-making, Global Navigation. No stereotypes.';

const framingDrive =
  'DRIVE measures Execution Capability Framework — dimensions are Prioritization Acuity, Operational Discipline, Stakeholder Cadence, Resource Allocation, Outcome Measurement, Recovery & Momentum. Write like a Chief of Staff reviewing an operator.';

const framingDefault =
  'Generic executive assessment. Anchor insights to the reported dimension scores. Use concrete numbers and level labels (Developing/Proficient/Advanced/Mastery).';

/* ── Prompt builders (mostly shared schema, per-diagnostic framing + accent reference) ── */

function sharedUserPrompt(ctx: PromptBuildCtx, extraFraming: string): string {
  const accent =
    DIAGNOSTIC_ACCENTS[ctx.definition.assessment_id as DiagnosticSlug]?.accent ?? '#C108AB';
  const score = ctx.result.overall_score ?? 0;
  const lvl = scoreToReportLevel(score);
  const levelDesc = REPORT_LEVELS.find((r) => r.level === lvl.label)?.description ?? '';

  const dimRows = ctx.dimensions
    .filter((d) => !ctx.intent.dimension_filter || ctx.intent.dimension_filter.includes(d.dimension_key))
    .map(
      (d, i) =>
        `${i + 1}. **${d.dimension_name ?? d.dimension_key}** (dimension_key=${d.dimension_key}, score=${d.score}, level=${d.level ?? scoreToReportLevel(d.score ?? 0).label}). ${d.description ?? ''}`,
    )
    .join('\n');

  const archetype = ctx.archetype
    ? `MATCHED ARCHETYPE: ${ctx.archetype.name} (code=${ctx.archetype.archetype_code}). Description: ${ctx.archetype.description}. Key traits: ${(ctx.archetype.key_traits ?? []).join(', ') || '—'}`
    : '';

  const intentKindLine =
    ctx.intent.kind === 'summary_and_highlights'
      ? 'Return summary, strengths, growthAreas, nextSteps. Do NOT include dimensionInsights or archetypeNarrative fields.'
      : ctx.intent.kind === 'full_dimension_deep_dive'
        ? 'Return summary, strengths, growthAreas, nextSteps. ALSO include the dimensionInsights object — one 1-2 sentence entry per dimension_key listed below.'
        : ctx.intent.kind === 'archetype_narrative'
          ? 'Return summary, strengths, growthAreas, nextSteps. ALSO include archetypeNarrative — a 100–160 word paragraph story about this person using the ARCHETYPE section below.'
          : 'Return summary, strengths, growthAreas, nextSteps.';

  const userRequest = ctx.intent.highLevelIntent
    ? `User's explicit request: "${ctx.intent.highLevelIntent.trim()}". Weave this focus into the summary and prioritise strengths/growth it relates to.`
    : '';

  return [
    `## ${ctx.definition.title} (${ctx.definition.assessment_id})`,
    `Accent color (for brand guard reference — do not output color codes): ${accent}`,
    '',
    extraFraming,
    '',
    `### Recipient result context`,
    `- Overall score: ${score}/100 — level ${lvl.label}. ${levelDesc}`,
    `- Result date: ${ctx.result.completed_at ?? '—'}`,
    ctx.definition.total_dimensions ? `- Total dimensions: ${ctx.definition.total_dimensions}` : '',
    archetype,
    '',
    `### Dimension scores (${ctx.dimensions.length} rows)`,
    dimRows,
    '',
    userRequest,
    '',
    `### Generation intent: ${ctx.intent.kind}`,
    intentKindLine,
    RESPONSE_SCHEMA_PREABMLE,
  ]
    .filter(Boolean)
    .join('\n');
}

function makePrompts(framing: string): PerDiagnosticPrompts {
  return {
    framing,
    buildUserPrompt: (ctx) => sharedUserPrompt(ctx, framing),
  };
}

export const PER_DIAGNOSTIC_INSIGHT_PROMPTS: Record<DiagnosticSlug | 'default', PerDiagnosticPrompts> = {
  prism:  makePrompts(framingPrism),
  spark:  makePrompts(framingSpark),
  forge:  makePrompts(framingForge),
  bridge: makePrompts(framingBridge),
  mosaic: makePrompts(framingMosaic),
  drive:  makePrompts(framingDrive),
  default: makePrompts(framingDefault),
};

/**
 * Build compact dimension summaries for the template fallback.
 * These are deterministic, non-LLM, but written in NEXUS voice.
 */
export function buildDimensionSummaries(
  dimensions: PromptBuildCtx['dimensions'],
  slug: DiagnosticSlug | string,
): string[] {
  const base = [
    'you demonstrate reliably strong framing that positions you ahead of many peer profiles.',
    'your consistency here translates into compounding outcomes over time — lean into this as a signature.',
    'this differentiator, paired with your narrative discipline, is how you close gaps elsewhere.',
    'you move through this dimension with a methodical cadence that others describe as reassuring.',
    'anchors your profile — use it deliberately when negotiating upgrades, roles, or scope.',
    'a multiplier: improving it raises every other dimension in your follow-up assessments.',
  ];
  const slugFragments = (s: string) => {
    switch (s) {
      case 'prism':  return ['branding', 'positioning', 'visibility', 'narrative', 'offer', 'digital'];
      case 'spark':  return ['AI governance', 'enablement', 'adoption', 'ethics', 'ROI tracking', 'change'];
      case 'forge':  return ['discovery', 'negotiation', 'deal strategy', 'pipeline', 'relationships', 'commercial'];
      case 'bridge': return ['stakeholder orchestration', 'regional governance', 'bilingual narrative', 'execution cadence', 'China context', 'partner interface'];
      case 'mosaic': return ['perspective taking', 'trust building', 'inclusive decisions', 'communication', 'cultural self-awareness', 'global'];
      case 'drive':  return ['prioritization', 'operational discipline', 'resource allocation', 'stakeholder cadence', 'outcome measurement', 'recovery'];
      default:       return ['delivery', 'craft', 'judgment', 'cadence', 'impact', 'follow-through'];
    }
  };
  const frags = slugFragments(String(slug));
  // Zip dimensions to base + fragment sentences.
  return dimensions.map((d, i) => {
    const f = frags[i % frags.length];
    const b = base[i % base.length];
    return `with ${f}, ${b}`;
  });
}

/* ── Brand-voice utility — filters AI copy BEFORE stage 7 for efficiency ── */

/**
 * Post-process LLM output: replace banned brand-language phrases with
 * canonical phrasing. Run as a cheap prefilter before the QualityGate scan.
 *
 * Safe idempotent replacements — no structural changes.
 */
export function normalizeBrandPhrases(copy: string): string {
  // Entry tier language: never "free"
  let c = copy;
  c = c.replace(/\bfree (assessment|report|tier|preview|plan|version|tier)\b/gi, 'complimentary $1');
  c = c.replace(/\bfree assessment\b/gi, 'Executive Introduction assessment');
  c = c.replace(/\bfree trial\b/gi, 'complimentary Executive Introduction');
  c = c.replace(/\bno cost\b/gi, 'complimentary');
  c = c.replace(/\b0 cost\b/gi, 'complimentary');
  // SaaS language downgrade → premium voice
  c = c.replace(/\bunlock(ed)?\b/gi, (_m, _p1, offset, str: string) => {
    // Capitalize if it's at start of sentence
    return (offset > 0 && /[.!?]\s*$/.test(str.slice(Math.max(0, offset - 3), offset))) ? 'Access' : 'access';
  });
  c = c.replace(/\blevel up\b/gi, 'raise your profile');
  c = c.replace(/\bdisrupt(ion|ive)?\b/gi, 'redefine');
  c = c.replace(/\bgame.?changer\b/gi, 'significant differentiator');
  c = c.replace(/\bunicorn\b/gi, 'standout profile');
  // Tier naming canonicals: never use "Explorer/Starter/Pro/Executive/Council" alone — map to display names (but not logic)
  c = c.replace(/\bExplorer tier\b/gi, 'Executive Introduction tier');
  c = c.replace(/\bStarter tier\b/gi, 'Professional tier');
  c = c.replace(/\bPro tier\b/gi, 'Executive tier');
  // Never expose tier_key underscores
  c = c.replace(/\bexecutive_introduction\b/g, 'Executive Introduction');
  // Buzzword damping
  c = c.replace(/\bsynerg(y|ize|istic)\b/gi, 'alignment');
  c = c.replace(/\bleverage\b/gi, 'apply');
  c = c.replace(/\bdeep dive\b/gi, 'detailed review');
  c = c.replace(/\bactionable insights\b/gi, 'practical next steps');
  return c;
}

/* ── Type re-exports for convenience of callers ── */
export type { AiContentProvenance };
