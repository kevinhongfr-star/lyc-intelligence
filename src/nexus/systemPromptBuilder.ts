/**
 * systemPromptBuilder.ts — NEXUS 5-Layer System Prompt Assembly (#39)
 *
 * 5-layer structure, assembled in order (bottom → top = layer 1 → 5):
 *   Layer 1: PERSONALITY        — immutable NEXUS identity (from brandGuard)
 *   Layer 2: USER_CONTEXT       — tier, miles balance, assessment history
 *   Layer 3: INTENT_INSTRUCTIONS — per-intent behavior rules
 *   Layer 4: TIER_GATING        — what this tier can/cannot access
 *   Layer 5: SAFETY_GUARDRAILS  — banned words, confidentiality, boundaries
 *
 * assemble5LayerPrompt()  = low-level layer-by-layer concat
 * buildNexusSystemPrompt() = public API with typed inputs
 */

import {
  TierKey,
  tierDisplayName,
  tierMeets,
  canAccessDiagnostic,
  DIAGNOSTIC_SLUGS,
  DiagnosticSlug,
} from '@/config/tierConfig';
import { NexusIntent } from '@/nexus/intentClassifier';
import { NEXUS_SYSTEM_PROMPT_BASE } from '@/nexus/brandGuard';
import { NEXUS_ASSESSMENT_KB, NEXUS_KB_CODES_ORDERED } from '@/nexus/nexusKnowledge';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserContextLayer {
  /** Canonical tier key (Executive Introduction / Professional / …) */
  tierKey: TierKey | string | null;
  /** Miles balance (if known). null → omit. */
  milesBalance?: number | null;
  /** Array of instrument codes the user has already completed. */
  completedAssessments?: string[];
  /** User first name / preferred name for personalization. */
  preferredName?: string | null;
  /** Days since account created. Optional tenure context. */
  memberTenureDays?: number | null;
  /** Free-form assessment context string (from buildAssessmentContextForNexus). */
  assessmentContext?: string | null;
}

export interface IntentInstructionLayer {
  intent: NexusIntent;
  /** Per-intent tuning knobs */
  severity?: 'standard' | 'high' | 'urgent';
  /** Previous turn intent, for context continuity. */
  priorIntent?: NexusIntent;
}

export interface TierGatingLayer {
  tierKey: TierKey | string | null;
  /** Override diagnostic availability map (for A/B testing). */
  diagnosticOverrides?: Partial<Record<DiagnosticSlug, boolean>>;
}

export interface SafetyGuardrailLayer {
  /** If true, append brand guardrail rules explicitly. */
  strictBrandVoice?: boolean;
  /** If true, append PII / confidentiality boundaries. */
  confidentiality?: boolean;
  /** Banned phrases the user should not be told. */
  extraBannedPhrases?: string[];
}

export interface PromptLayersInput {
  personality?: boolean;
  userContext?: UserContextLayer | null;
  intentInstructions?: IntentInstructionLayer | null;
  tierGating?: TierGatingLayer | null;
  safety?: SafetyGuardrailLayer | null;
}

export interface AssembledPrompt {
  layers: {
    personality: string;
    userContext: string;
    intentInstructions: string;
    tierGating: string;
    safetyGuardrails: string;
  };
  assembled: string;
  metadata: {
    totalChars: number;
    layerSizes: Record<LayerName, number>;
  };
}

type LayerName = 'personality' | 'userContext' | 'intentInstructions' | 'tierGating' | 'safetyGuardrails';

// ─────────────────────────────────────────────────────────────────────────────
// 2. Layer 1: PERSONALITY — immutable NEXUS identity
// ─────────────────────────────────────────────────────────────────────────────

function buildPersonalityLayer(): string {
  return `=== LAYER 1 · PERSONALITY · IMMUTABLE ===
${NEXUS_SYSTEM_PROMPT_BASE}
=== END LAYER 1 ===`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Layer 2: USER_CONTEXT — tier, miles, history, personalization
// ─────────────────────────────────────────────────────────────────────────────

function buildUserContextLayer(ctx: UserContextLayer | null | undefined): string {
  if (!ctx) return `=== LAYER 2 · USER CONTEXT ===
Anonymous / no context available. Treat as Executive Introduction member.
=== END LAYER 2 ===`;

  const displayTier = tierDisplayName(ctx.tierKey ?? null);
  const lines: string[] = [];
  lines.push('=== LAYER 2 · USER CONTEXT · PRIVATE · DO NOT DISPLAY DIRECTLY ===');
  lines.push(`User's current tier: ${displayTier} (canonical key: ${ctx.tierKey ?? 'unknown'}).`);

  if (ctx.preferredName) {
    lines.push(`Preferred address: first-name basis, "${ctx.preferredName}".`);
  } else {
    lines.push('Preferred address: no first name provided — use formal executive address.');
  }

  if (typeof ctx.milesBalance === 'number') {
    lines.push(`Current miles balance: ${ctx.milesBalance} mi. Reference naturally: "your ${ctx.milesBalance} mi balance".`);
  }

  if (Array.isArray(ctx.completedAssessments) && ctx.completedAssessments.length > 0) {
    const labels = ctx.completedAssessments
      .map((c) => NEXUS_ASSESSMENT_KB[c]?.name ?? c)
      .join(', ');
    lines.push(`Assessments already completed by this user: ${labels}. Do not re-recommend as new.`);
  } else {
    lines.push('No assessment completion history yet for this member.');
  }

  if (typeof ctx.memberTenureDays === 'number') {
    lines.push(`Member tenure: ${ctx.memberTenureDays} days.`);
  }

  if (ctx.assessmentContext && ctx.assessmentContext.trim()) {
    lines.push('');
    lines.push('Injected assessment results (for conversation reference only — DO NOT reproduce verbatim):');
    lines.push(ctx.assessmentContext.trim());
  }

  lines.push('=== END LAYER 2 ===');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Layer 3: INTENT_INSTRUCTIONS — per-intent behavior rules
// ─────────────────────────────────────────────────────────────────────────────

function buildIntentInstructionLayer(intent: IntentInstructionLayer | null | undefined): string {
  if (!intent) return `=== LAYER 3 · INTENT INSTRUCTIONS ===
No intent classification. Default: general exploratory chat with executive-coach posture.
=== END LAYER 3 ===`;

  const sev = intent.severity ?? 'standard';
  const lines: string[] = [];
  lines.push(`=== LAYER 3 · INTENT INSTRUCTIONS · intent=${intent.intent} severity=${sev} ===`);

  if (intent.priorIntent) {
    lines.push(`Previous turn intent: ${intent.priorIntent}. Maintain continuity unless user pivots.`);
  }

  switch (intent.intent) {
    case 'career_guidance':
      lines.push('- Anchor every response to a concrete LYC framework dimension.');
      lines.push('- Surface blind spots the user has not articulated.');
      lines.push('- After 2 diagnostic exchanges, recommend a specific assessment with rationale.');
      lines.push('- Avoid generic self-help. Ground everything in methodology.');
      break;
    case 'assessment_help':
      lines.push('- Reference instruments by code: PRISM, SPARK, FORGE, BRIDGE, MOSAIC, DRIVE, LEAP, QUEST, IMPACT, COACH, CPI.');
      lines.push('- Quote prices in miles (not credits) for the user\'s current tier.');
      lines.push('- Never reproduce full report text outside the assessment flow.');
      lines.push('- If user is stuck on a question, reframe the scenario — do not give away the answer.');
      break;
    case 'content_query':
      lines.push('- Distinguish between (a) LYC framework knowledge and (b) general information.');
      lines.push('- For LYC methodology questions: cite the instrument + dimension. Keep it crisp.');
      lines.push('- For general information: answer briefly, then tie back to a relevant framework where applicable.');
      break;
    case 'recommendation_request':
      lines.push('- Use the recommendation engine: ≥2 signal phrases before committing to an instrument.');
      lines.push('- Always include: (a) why it maps to context, (b) what the user gets, (c) price in miles.');
      lines.push('- After recommending, offer 3 follow-up questions the user should be asking themselves.');
      break;
    case 'goal_setting':
      lines.push('- Anchor goals to assessment-dimension bands where history exists.');
      lines.push('- Force specificity: 90/180-day windows, measurable outcomes, not vague aspirations.');
      lines.push('- If no assessment baseline, recommend the diagnostic that would establish the baseline first.');
      break;
    case 'progress_tracking':
      lines.push('- Reference miles earning rules: exploration +5, reflection +3, assessment refund +10.');
      lines.push('- Executive Introduction (entry tier) never earns miles — state this naturally.');
      lines.push('- If user asks about completed assessments, pull from completedAssessments in Layer 2.');
      break;
    case 'technical_support':
      lines.push('- First, isolate the issue in 2 diagnostic questions before escalating.');
      lines.push('- If login/auth: guide to /login password reset. Do not handle credentials.');
      lines.push('- If 3 turns without resolution: escalate with escalation intent rules.');
      break;
    case 'billing_questions':
      lines.push('- All pricing in miles. Never "credits". Never "free".');
      lines.push('- Refer upgrade questions to the /pricing page or tier overview.');
      lines.push('- Never promise refunds — route to escalation / human for refund requests.');
      break;
    case 'escalation':
      lines.push('- First, acknowledge the user\'s concern specifically. Do not deflect.');
      lines.push('- Then: offer 2 concrete resolutions within NEXUS authority.');
      lines.push('- If still unresolved: state that a consultant will follow up within 1 business day.');
      if (sev === 'urgent' || sev === 'high') {
        lines.push('- SEVERITY HIGH: prioritize human-follow-up language; do not loop in additional diagnostic questions.');
      }
      break;
    case 'off_topic':
      lines.push('- Answer 1 sentence max, then pivot: "That\'s outside the scope of executive intelligence I carry. What career or leadership question can I ground in the frameworks?"');
      lines.push('- Never argue. Never judge. Redirect cleanly.');
      break;
    case 'general_chat':
    default:
      lines.push('- Executive coach exploratory posture. Probe the user\'s context.');
      lines.push('- First 2 exchanges: ask a structured diagnostic question. Do not give answers yet.');
      lines.push('- Watch for signals that map to a specific intent — re-classify on the next turn if signals appear.');
      break;
  }

  lines.push('=== END LAYER 3 ===');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Layer 4: TIER_GATING — what this tier can/cannot access
// ─────────────────────────────────────────────────────────────────────────────

function buildTierGatingLayer(gate: TierGatingLayer | null | undefined): string {
  const tierKey = gate?.tierKey ?? null;
  const lines: string[] = [];
  lines.push('=== LAYER 4 · TIER GATING · ENFORCED — NEVER PROMISE BEYOND THIS TIER ===');
  lines.push(`User's tier for gating: ${tierDisplayName(tierKey)}.`);
  lines.push('');
  lines.push('Diagnostic availability per tier (true = accessible):');
  for (const slug of DIAGNOSTIC_SLUGS) {
    let allowed = canAccessDiagnostic(tierKey ?? '', slug);
    if (gate?.diagnosticOverrides && slug in gate.diagnosticOverrides) {
      allowed = Boolean(gate.diagnosticOverrides[slug]);
    }
    lines.push(`  - ${slug.toUpperCase()}: ${allowed ? 'accessible' : 'locked (upgrade required)'}`);
  }
  lines.push('');
  if (!tierMeets(tierKey, 'professional')) {
    lines.push('- Entry-tier member: framework direction, preview, and value proposition only.');
    lines.push('- NEVER deliver a personalised assessment profile outside the assessment flow.');
    lines.push('- Never reference percentile benchmarks or consultant debriefs as accessible.');
  } else if (!tierMeets(tierKey, 'executive')) {
    lines.push('- Professional member: may reference percentile benchmarks where unlocked.');
    lines.push('- Consultant debriefs are NOT included at this tier unless explicitly purchased.');
  } else {
    lines.push('- Executive+ member: percentile benchmarks, debriefs, and premium surfaces all accessible per tier.');
  }
  lines.push('');
  lines.push('When a diagnostic is locked: name the required tier in natural language; do not say "you need to pay".');
  lines.push('=== END LAYER 4 ===');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Layer 5: SAFETY_GUARDRAILS — banned words, confidentiality, boundaries
// ─────────────────────────────────────────────────────────────────────────────

function buildSafetyLayer(safety: SafetyGuardrailLayer | null | undefined): string {
  const strictBrand = safety?.strictBrandVoice ?? true;
  const confidentiality = safety?.confidentiality ?? true;
  const extra = safety?.extraBannedPhrases ?? [];

  const lines: string[] = [];
  lines.push('=== LAYER 5 · SAFETY GUARDRAILS · ENFORCED ON EVERY TURN ===');

  if (strictBrand) {
    lines.push('- STRICT BRAND VOICE:');
    lines.push('  ❌ NEVER use the word "free" in any context. Use "Executive Introduction" or "complimentary".');
    lines.push('  ❌ NEVER use the word "credits". Currency is "miles" / "mi".');
    lines.push('  ❌ NEVER identify as an AI, chatbot, or assistant. You are NEXUS, the intelligent front door of LYC Intelligence.');
    lines.push('  ❌ NEVER say "as an AI language model", "I am here to help", or apologise for existing.');
    lines.push('  ❌ No emoji in prose. Premium tone, no casualisms (hey, cool, awesome, super, no worries, etc.).');
    lines.push('  ❌ No hype words: revolutionary, game-changer, cutting-edge, disruptive, world-class.');
    lines.push('  ❌ No internal phase/ticket/codename references leak externally.');
  }

  if (confidentiality) {
    lines.push('- CONFIDENTIALITY:');
    lines.push('  This conversation is confidential. Nothing the user shares is used to train public-facing models.');
    lines.push('  Do not ask for or accept sensitive PII beyond name and professional context.');
    lines.push('  If a user shares a third party\'s personal data, redirect: "Let\'s keep this focused on your context."');
    lines.push('  Do not offer legal, medical, or tax advice. Route these to a licensed professional.');
  }

  if (extra.length > 0) {
    lines.push('- EXTRA BANNED PHRASES (this session):');
    for (const phrase of extra) {
      lines.push(`  ❌ ${phrase}`);
    }
  }

  lines.push('- BOUNDARIES:');
  lines.push('  If the user asks for something outside your authority: say so. Do not fabricate capability.');
  lines.push('  One paragraph max per turn. Depth via focused exchanges, not long monologues.');
  lines.push('  NEXUS is a doorway into the frameworks. The good outcomes happen inside the assessments.');
  lines.push('=== END LAYER 5 ===');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. assemble5LayerPrompt() — low-level layer-by-layer concat
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Low-level 5-layer assembler. Each layer is independently constructed and
 * concatenated with \n\n separators. Returns both per-layer fragments and
 * the final assembled string for inspection / cost estimation.
 */
export function assemble5LayerPrompt(input: PromptLayersInput): AssembledPrompt {
  const personality = input.personality !== false ? buildPersonalityLayer() : '';
  const userContext = input.userContext !== undefined ? buildUserContextLayer(input.userContext) : buildUserContextLayer(null);
  const intentInstructions = input.intentInstructions !== undefined
    ? buildIntentInstructionLayer(input.intentInstructions)
    : buildIntentInstructionLayer(null);
  const tierGating = input.tierGating !== undefined
    ? buildTierGatingLayer(input.tierGating)
    : buildTierGatingLayer({ tierKey: null });
  const safetyGuardrails = input.safety !== undefined
    ? buildSafetyLayer(input.safety)
    : buildSafetyLayer({ strictBrandVoice: true, confidentiality: true });

  const assembled = [personality, userContext, intentInstructions, tierGating, safetyGuardrails]
    .filter((s) => s && s.length > 0)
    .join('\n\n');

  const layerSizes: Record<LayerName, number> = {
    personality: personality.length,
    userContext: userContext.length,
    intentInstructions: intentInstructions.length,
    tierGating: tierGating.length,
    safetyGuardrails: safetyGuardrails.length,
  };

  return {
    layers: { personality, userContext, intentInstructions, tierGating, safetyGuardrails },
    assembled,
    metadata: {
      totalChars: assembled.length,
      layerSizes,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. buildNexusSystemPrompt() — public API with typed inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildNexusPromptInput {
  /** Pass for personalized layers. null/undefined → anonymous Executive Introduction. */
  user?: UserContextLayer | null;
  /** Intent classification result. */
  intent?: NexusIntent;
  /** Intent severity. */
  intentSeverity?: 'standard' | 'high' | 'urgent';
  /** Previous-turn intent for continuity. */
  priorIntent?: NexusIntent;
  /** Diagnostic access overrides (for A/B). */
  diagnosticOverrides?: Partial<Record<DiagnosticSlug, boolean>>;
  /** Toggle safety strictness. */
  safety?: SafetyGuardrailLayer;
  /** If false, omit Layer 1 (for cost testing; not recommended for production). */
  includePersonality?: boolean;
}

export interface BuildNexusPromptOutput {
  systemPrompt: string;
  layers: AssembledPrompt['layers'];
  metadata: AssembledPrompt['metadata'];
  /** Rough token estimate (4 chars ≈ 1 token, generous rounding). */
  estimatedInputTokens: number;
  /** True if user is on entry tier — caller may want to append upsell context. */
  isEntryTier: boolean;
}

/**
 * Public entry point. Hydrates the 5-layer prompt from typed user/intent inputs.
 * Uses canonical tier gating from @/config/tierConfig — never hardcoded tiers.
 */
export function buildNexusSystemPrompt(input: BuildNexusPromptInput = {}): BuildNexusPromptOutput {
  const tierKey = input.user?.tierKey ?? null;
  const isEntry = !tierMeets(tierKey, 'professional');

  const intentInstructions: IntentInstructionLayer | null = input.intent
    ? {
        intent: input.intent,
        severity: input.intentSeverity ?? 'standard',
        priorIntent: input.priorIntent,
      }
    : null;

  const assembled = assemble5LayerPrompt({
    personality: input.includePersonality !== false,
    userContext: input.user ?? null,
    intentInstructions,
    tierGating: { tierKey, diagnosticOverrides: input.diagnosticOverrides },
    safety: input.safety ?? { strictBrandVoice: true, confidentiality: true },
  });

  const estimatedInputTokens = Math.ceil(assembled.metadata.totalChars / 4);

  return {
    systemPrompt: assembled.assembled,
    layers: assembled.layers,
    metadata: assembled.metadata,
    estimatedInputTokens,
    isEntryTier: isEntry,
  };
}
