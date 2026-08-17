/**
 * transitionPatterns.ts — Diagnostic transition + soft gate patterns.
 *
 * Batch 2B / Tickets 6 + 7: Conversational depth model, lens introduction,
 * formal diagnostic transition, soft gate pattern, Explorer onboarding,
 * milestone tracking.
 *
 * Source: X0 Voice Standard §7 (Response Patterns) + §9 (Depth & Transition)
 */
import {
  TRANSITION_PATTERNS,
  APPROVED_DIAGNOSTICS,
  getDiagnosticDescriptor,
  ENTITY_NAME,
  PROGRESS_TERM,
} from '@/config/voiceStandard';
import { getInstrumentMileCost, EXPLORER_FREE_ASSESSMENTS } from '@/config/miles';
import { normalizeTier, tierMeets, type TierKey } from '@/config/tiers';
import { CPI_REQUIRED_TIER } from '@/config/miles';

// ═══════════════════════════════════════════════════════════════════════
// Conversational depth model
// ═══════════════════════════════════════════════════════════════════════

export type DepthLevel = 'chat' | 'directional_read' | 'formal_assessment';

export interface DepthTransition {
  from: DepthLevel;
  to: DepthLevel;
  trigger: string;
  pattern: string;
}

/**
 * The depth progression: chat → directional read → formal assessment.
 * NEXUS initiates transitions, not the user.
 */
export const DEPTH_PROGRESSION: DepthTransition[] = [
  {
    from: 'chat',
    to: 'directional_read',
    trigger: 'Member discusses a pattern that maps to a diagnostic lens',
    pattern: 'Name the pattern you see, then offer a directional read (brief, conversational insight — not a full assessment).',
  },
  {
    from: 'directional_read',
    to: 'formal_assessment',
    trigger: 'Member wants to go deeper after a directional read',
    pattern: 'Introduce the formal diagnostic by full name + descriptor, state mile cost, ask "Want me to run it?"',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Lens introduction patterns
// ═══════════════════════════════════════════════════════════════════════

/**
 * Format the first mention of a diagnostic lens.
 * Pattern: full name + descriptor. Subsequent mentions: code only.
 */
export function formatLensIntroduction(code: string, isFirstMention: boolean): string {
  const diag = getDiagnosticDescriptor(code);
  if (!diag) return code;
  if (isFirstMention) {
    return `${diag.fullName}. ${diag.tagline}`;
  }
  return diag.code;
}

/**
 * Build the formal diagnostic proposal flow.
 * Returns the 5-step transition as an array of prompt instructions.
 */
export function buildFormalProposalFlow(code: string, userBalance: number): string[] {
  const diag = getDiagnosticDescriptor(code);
  if (!diag) return [];

  const cost = getInstrumentMileCost(code);
  const canAfford = userBalance >= cost;

  return [
    // Step 1: Establish pattern
    `Name the pattern you see in the conversation that connects to ${diag.code}.`,

    // Step 2: Name lens
    `Introduce ${diag.fullName} — ${diag.descriptor}.`,

    // Step 3: Frame as tool
    `Frame it as a tool that will reveal specific insights — not a product to purchase.`,

    // Step 4: State mile cost
    cost === 0
      ? `Mention that this is a complimentary assessment included with signup.`
      : `State the mile cost: ${cost} ${cost === 1 ? 'mile' : 'miles'}. The member has ${userBalance} miles remaining.`,

    // Step 5: User decides
    canAfford
      ? `Ask: "Want me to run it?" — let the member decide.`
      : `Note that the member needs ${cost - userBalance} more miles. Offer the upgrade path without naming tiers.`,
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// Soft gate pattern
// ═══════════════════════════════════════════════════════════════════════

export interface SoftGateResult {
  /** The full soft gate response text (for NEXUS to deliver). */
  text: string;
  /** The best available alternative to offer. */
  alternative: string;
  /** Whether this is a CPI gate (Council-only). */
  isCpiGate: boolean;
}

/**
 * Build a soft gate response for when a member's tier doesn't include
 * a capability. Never mentions tier names — platform handles upgrade UI.
 *
 * Pattern: acknowledge → specific value → best alternative → upgrade direction
 */
export function buildSoftGate(opts: {
  capability: string;
  specificValue: string;
  alternative: string;
  isCpiGate?: boolean;
}): SoftGateResult {
  const { capability, specificValue, alternative, isCpiGate } = opts;

  const text = [
    `You're looking at ${capability}.`,
    `${specificValue}`,
    `${alternative}`,
    isCpiGate
      ? `This capability becomes available as your engagement with LYC Intelligence deepens. I can flag this for your account team.`
      : `If you'd like to explore expanding your access, I can point you to the right place.`,
  ].join(' ');

  return { text, alternative, isCpiGate: !!isCpiGate };
}

/**
 * Build the CPI soft gate (Council-only).
 */
export function buildCpiSoftGate(): SoftGateResult {
  return buildSoftGate({
    capability: 'the China Leadership Pipeline Index',
    specificValue: 'This is a comprehensive organizational diagnostic that maps leadership pipeline health across multiple dimensions.',
    alternative: 'For now, I can share directional insights on your talent pipeline based on what we discuss here.',
    isCpiGate: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Explorer onboarding pattern
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build the Explorer onboarding message for complimentary assessments.
 * LEAP + PRISM are free tokens on signup — NOT miles.
 */
export function buildExplorerOnboardingMessage(): string {
  return `As part of your complimentary introduction, you have two assessments available: LEAP — competitive positioning, and PRISM — professional branding. No miles required for either. Would you like to start with one of these?`;
}

/**
 * Check if a diagnostic is available as a free Explorer token.
 */
export function isExplorerFreeAssessment(code: string): boolean {
  return EXPLORER_FREE_ASSESSMENTS.includes(code.toUpperCase());
}

/**
 * Build the "all free tokens used" soft gate for Explorer.
 */
export function buildExplorerTokensExhaustedMessage(): string {
  return `You've completed both complimentary assessments. To continue with deeper diagnostics, you can expand your access. I can point you to the right place if you'd like.`;
}

// ═══════════════════════════════════════════════════════════════════════
// Profile credit language
// ═══════════════════════════════════════════════════════════════════════

/**
 * Format the profile credit language for included monthly assessments.
 * Never says "free" or "included" — says "profile credit available".
 */
export function formatProfileCredit(code: string): string {
  const diag = getDiagnosticDescriptor(code);
  if (!diag) return code;
  return `${diag.code} — profile credit available this month`;
}

// ═══════════════════════════════════════════════════════════════════════
// Multi-lens analysis (Executive+ tier)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build a multi-lens analysis proposal (Executive+ tier only).
 * Combined cost = sum of individual costs. User must opt in.
 */
export function buildMultiLensProposal(codes: string[], userBalance: number): {
  text: string;
  totalCost: number;
  canAfford: boolean;
} {
  const diagnostics = codes.map((c) => getDiagnosticDescriptor(c)).filter(Boolean);
  if (diagnostics.length === 0) return { text: '', totalCost: 0, canAfford: false };

  const totalCost = codes.reduce((sum, c) => sum + getInstrumentMileCost(c), 0);
  const names = diagnostics.map((d) => d!.code).join(' + ');
  const canAfford = userBalance >= totalCost;

  const text = `Based on what we've discussed, a combined analysis using ${names} would give us a multi-dimensional view. The combined cost is ${totalCost} ${totalCost === 1 ? 'mile' : 'miles'}. You have ${userBalance} miles remaining. ${canAfford ? 'Would you like to proceed with all of them?' : `You'd need ${totalCost - userBalance} more miles for the full set. I can start with one if you prefer.`}`;

  return { text, totalCost, canAfford };
}

/**
 * Check if multi-lens analysis is available for a tier (Executive+).
 */
export function canMultiLens(tier: string | null | undefined): boolean {
  return tierMeets(tier, 'executive');
}

// ═══════════════════════════════════════════════════════════════════════
// Milestone tracking
// ═══════════════════════════════════════════════════════════════════════

/**
 * Milestone patterns for NEXUS to use in responses.
 * "Milestones" is the unified term — never "bookmarks" or "dashboard items".
 */
export const MILESTONE_PATTERNS = {
  create: `I've noted this as a milestone — we can track your progress on this over time.`,
  track: `Your milestones are updated. You can review them any time.`,
  resume: `Picking up from your last milestone —`,
  reference: `This connects to a milestone we set earlier.`,
};

/**
 * Build a milestone creation message.
 */
export function buildMilestoneCreate(title: string): string {
  return `I've created a milestone: "${title}". We'll track progress against this in future conversations.`;
}

// ═══════════════════════════════════════════════════════════════════════
// Doc upload transition
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build the doc upload transition message.
 * NEXUS reads + references documents, rolling 30-day window.
 */
export function buildDocUploadTransition(): string {
  return `I can review documents you share. I'll reference them in our conversations for the next 30 days. What would you like me to look at?`;
}

// ═══════════════════════════════════════════════════════════════════════
// System prompt fragment for transition patterns
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build the transition patterns instruction block for the system prompt.
 * This is injected after the persona layer.
 */
export function buildTransitionPromptLayer(): string {
  return `=== TRANSITION PATTERNS ===
Depth progression: chat → directional read → formal assessment.
You initiate transitions, not the member. Never present a catalog of diagnostics.

LENS INTRODUCTION:
- First mention: full name + descriptor (e.g., "LEAP — competitive positioning")
- Subsequent mentions: code only (e.g., "LEAP")
- Never use internal codenames (SHIFT, CANVAS, TRIDENT, MERIDIAN) in member-facing responses

FORMAL DIAGNOSTIC TRANSITION:
1. Establish the pattern you see in the conversation
2. Name the diagnostic lens (full name + descriptor)
3. Frame it as a tool, not a product
4. State the mile cost
5. Let the member decide — ask "Want me to run it?"

PROFILE CREDIT:
- For included monthly assessments, say "profile credit available" — never "free" or "included"

SOFT GATES:
- When a capability is above the member's plan: acknowledge → state specific value → offer best alternative → point to upgrade direction
- Never mention tier names (Starter, Professional, Executive, Council) in dialogue — the platform handles upgrade UI
- Never say "you can't" — always offer the best available alternative

EXPLORER ONBOARDING:
- LEAP and PRISM are complimentary assessments included with signup — no miles required
- When both are used, soft gate to expanded access (no tier names)

MULTI-LENS ANALYSIS:
- Available for advanced members only
- Combined cost = sum of individual costs
- Always ask for opt-in before running multiple diagnostics

MILESTONES:
- Use "milestones" as the unified progress term — never "bookmarks" or "dashboard"
- Create, track, and resume milestones as the conversation develops

DOC UPLOADS:
- You can reference documents the member shares for 30 days
- Reference specific content when relevant, do not summarize unprompted
=== END TRANSITION PATTERNS ===`;
}
