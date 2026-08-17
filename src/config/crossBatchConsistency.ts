/**
 * crossBatchConsistency.ts — Cross-Batch Consistency Audit Framework.
 *
 * Batch 6 / Ticket 3: Final QA alignment process. Runs after Batches 2B,
 * 3, 4, 5 are complete. Defines consistency criteria, cross-batch
 * dependency tracking, the brand voice QA rubric, and the Lighthouse /
 * accessibility copy pass checklist.
 *
 * This is the LAST polish pass before release. It does not introduce new
 * terms (those live in terminologyReference.ts) — it verifies that every
 * batch's output is mutually consistent.
 */

import {
  ENTITY_NAME,
  PROGRESS_TERM,
  TIER_KEYS,
  TIERS,
  INSTRUMENT_MILE_COST,
  APPROVED_DIAGNOSTICS,
} from './terminologyReference';
import { AUDIT_SURFACES, type AuditSurfaceId } from './terminologyAuditChecklist';

// ═══════════════════════════════════════════════════════════════════════
// §1 — Consistency criteria (7, per Batch 6 spec)
// ═══════════════════════════════════════════════════════════════════════

export type ConsistencyCriterionId =
  | 'nexus_naming'           // Entity name = NEXUS everywhere
  | 'tier_display'           // Capitalization, positioning one-liners, price formatting
  | 'mile_cost_format'       // Consistent "X miles" pattern
  | 'cta_consistency'        // Primary CTA language across all surfaces
  | 'upgrade_path_language'  // Soft gate consistency, no tier names in chat
  | 'tone_consistency'       // Marketing vs product vs chat — different registers, same brand
  | 'format_consistency';    // No emoji, punctuation, capitalization standards

export interface ConsistencyCriterion {
  id: ConsistencyCriterionId;
  label: string;
  /** What "consistent" means for this criterion. */
  rule: string;
  /** The canonical source that defines the correct form. */
  canonicalSource: string;
  /** Surfaces most affected by this criterion. */
  affectedSurfaces: AuditSurfaceId[];
  /** How to verify consistency. */
  verifyMethod: string;
  /** Common failure modes. */
  commonFailures: string[];
  /** Severity if this criterion fails. */
  severity: 'blocker' | 'major' | 'minor';
}

export const CONSISTENCY_CRITERIA: ConsistencyCriterion[] = [
  {
    id: 'nexus_naming',
    label: 'NEXUS Naming',
    rule: 'Entity name = NEXUS everywhere. Never "the coach", "the AI", "your assistant", "the chatbot". Always ALL CAPS.',
    canonicalSource: 'terminologyReference.ts → ENTITY_NAME + BANNED_ENTITY_REFERENCES',
    affectedSurfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'onboarding_flow', 'assessment_pages', 'email_templates', 'error_messages', 'settings_account', 'mile_balance_packs', 'debrief_booking', 'milestones_progress', 'navigation_footer'],
    verifyMethod: 'Codebase-wide grep for BANNED_ENTITY_REFERENCES + "Nexus" (wrong case) across all 12 surface locations. Zero matches in user-facing string literals.',
    commonFailures: [
      '"the coach" slips into chat copy',
      '"the AI" appears in error messages',
      '"Nexus" (title case) in nav/footer',
      '"your assistant" in onboarding microcopy',
    ],
    severity: 'blocker',
  },
  {
    id: 'tier_display',
    label: 'Tier Display Names',
    rule: 'Canonical display names from tiers.ts: Explorer, Starter, Pro, Executive, Council. Capitalization, positioning one-liners, and price formatting consistent across pricing, settings, onboarding, email. NOTE: "Pro" is the canonical DISPLAY name (per Batch 6 P0-7); "professional" is the backend tier_key only and must NEVER appear in user-facing copy.',
    canonicalSource: 'terminologyReference.ts → tiers (TIER_KEYS, TIERS) + tiers.ts → TIER_PRICING',
    affectedSurfaces: ['pricing_page', 'settings_account', 'onboarding_flow', 'landing_pages', 'email_templates', 'navigation_footer'],
    verifyMethod: 'Grep for tier display names across surfaces; cross-check against tiers.ts. Verify "Pro" is the canonical display name (never "Professional" in user-facing copy — "professional" is the backend tier_key only). Verify price formatting uses computeTierPrice() + formatPrice().',
    commonFailures: [
      '"Professional" in pricing card (should be "Pro"), "Pro" and "Professional" used inconsistently',
      '"Enterprise" appears (collapsed into Council)',
      'Inconsistent annual discount math across surfaces',
      'Raw tier_key ("explorer") displayed instead of "Explorer"',
    ],
    severity: 'major',
  },
  {
    id: 'mile_cost_format',
    label: 'Mile Cost Display Format',
    rule: 'Consistent "X miles" pattern. Singular "1 mile", plural "X miles". Zero-cost = "Complimentary". Never "credits", "tokens", "Free", "$0".',
    canonicalSource: 'terminologyReference.ts → miles + INSTRUMENT_MILE_COST + miles.ts → MILE_COST_TIERS',
    affectedSurfaces: ['chat_responses', 'assessment_pages', 'mile_balance_packs', 'pricing_page', 'error_messages'],
    verifyMethod: 'Grep for "credits|tokens|points|Free|\\$0" in mile/billing/assessment components. Verify MileCostBadge renders "X miles" or "Complimentary". Cross-check costs against INSTRUMENT_MILE_COST.',
    commonFailures: [
      '"Free" instead of "Complimentary" for 0-mile assessments',
      '"credits" in legacy billing components',
      'Wrong pluralization ("1 miles")',
      'Wrong mile cost stated (e.g. LEAP=3 instead of 1, or SPARK=1 instead of 3 — see INSTRUMENT_MILE_COST for the locked canon)',
    ],
    severity: 'blocker',
  },
  {
    id: 'cta_consistency',
    label: 'CTA Consistency',
    rule: 'Primary CTA language consistent across all surfaces. Uses TIER_CTA_LABEL from tierConfig.ts. No "Sign Up Free", "Buy Now", "Get Started".',
    canonicalSource: 'tierConfig.ts → TIER_CTA_LABEL + terminologyReference.ts → complimentary',
    affectedSurfaces: ['pricing_page', 'landing_pages', 'onboarding_flow', 'assessment_pages', 'email_templates'],
    verifyMethod: 'Grep for CTA strings across surfaces; cross-check against TIER_CTA_LABEL. Verify no "free"/"buy now"/"get started" in CTA copy.',
    commonFailures: [
      '"Sign Up Free" on landing page vs "Start Your Complimentary Baseline" on pricing',
      '"Buy Now" in email vs "Go Professional" on pricing',
      'Inconsistent CTA for the same tier across surfaces',
    ],
    severity: 'major',
  },
  {
    id: 'upgrade_path_language',
    label: 'Upgrade Path Language',
    rule: 'Soft gate consistency. Tier names HARD BANNED in casual/diagnostic NEXUS chat (NEXUS should not reference the user\'s tier or other tiers during normal coaching — breaks immersion). Tier names ALLOWED in explicit upgrade/recommendation context (e.g. "If you upgrade to Pro, you\'d get X"), pricing surfaces, account/billing pages, and comparison tables. Soft gates use acknowledge → specific value → best alternative → upgrade direction pattern.',
    canonicalSource: 'terminologyReference.ts → tiers (visibility) + voiceStandard.ts → TRANSITION_PATTERNS.softGate',
    affectedSurfaces: ['chat_responses', 'assessment_pages', 'mile_balance_packs', 'pricing_page'],
    verifyMethod: 'Runtime: brandGuard.canonicalTierNameCheck() on chat corpus. Verify soft gate copy follows the 4-step pattern. Verify no tier names in CASUAL chat responses, but tier names ARE allowed in explicit upgrade/recommendation contexts.',
    commonFailures: [
      '"Upgrade to Professional tier" in chat (use "Pro" not "Professional" — and only in explicit upgrade context, not casual chat)',
      'Hard wall instead of soft gate',
      'Inconsistent soft gate copy across surfaces',
    ],
    severity: 'blocker',
  },
  {
    id: 'tone_consistency',
    label: 'Tone Consistency',
    rule: 'Marketing vs product vs chat — different registers, same brand voice. Marketing: aspirational, premium. Product: clear, functional. Chat: proactive, diagnostic, economical. All three: no banned words, no emoji, no exclamation points.',
    canonicalSource: 'voiceStandard.ts → STYLE_RULES + AI_TELL_PATTERNS + terminologyReference.ts',
    affectedSurfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'onboarding_flow', 'email_templates', 'error_messages'],
    verifyMethod: 'Visual + manual review per surface. Verify register matches context. Verify STYLE_RULES (noEmoji, noExclamationPoints, maxResponseChars) enforced in chat.',
    commonFailures: [
      'Chat copy too marketing-y (aspirational instead of diagnostic)',
      'Landing copy too casual ("cool", "super easy")',
      'Error messages too chipper ("Oops!")',
      'Emoji leaks into email or chat',
    ],
    severity: 'major',
  },
  {
    id: 'format_consistency',
    label: 'Format Consistency',
    rule: 'No emoji rule (everywhere). Punctuation: no exclamation points. Capitalization: NEXUS ALL CAPS, diagnostic codes ALL CAPS, tier names Title Case. Sentence case for body copy.',
    canonicalSource: 'voiceStandard.ts → STYLE_RULES + terminologyReference.ts',
    affectedSurfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'onboarding_flow', 'assessment_pages', 'email_templates', 'error_messages', 'settings_account', 'mile_balance_packs', 'debrief_booking', 'milestones_progress', 'navigation_footer'],
    verifyMethod: 'Grep for emoji (\\p{Extended_Pictographic}) + "!" codebase-wide. Verify capitalization rules per term category.',
    commonFailures: [
      'Emoji in email subject or chat',
      'Exclamation points in marketing or chat',
      'Diagnostic codes in title case (Spark instead of SPARK)',
      'Inconsistent capitalization of "miles" (Miles mid-sentence)',
    ],
    severity: 'major',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §2 — Cross-batch dependency tracking
// ═══════════════════════════════════════════════════════════════════════

export type BatchId = 'batch_1.5' | 'batch_2A' | 'batch_2B' | 'batch_2_corrective' | 'batch_3' | 'batch_4' | 'batch_5' | 'batch_6';

export interface CrossBatchDependency {
  batch: BatchId;
  /** What this batch delivers that the final pass depends on. */
  delivers: string[];
  /** Which consistency criteria this batch most affects. */
  affectsCriteria: ConsistencyCriterionId[];
  /** Whether this batch must be complete before the final pass runs. */
  requiredForFinalPass: boolean;
  /** Status of this batch. */
  status: 'complete' | 'in_progress' | 'pending';
  notes: string;
}

export const CROSS_BATCH_DEPENDENCIES: CrossBatchDependency[] = [
  {
    batch: 'batch_1.5',
    delivers: [
      '5-tier system (tiers.ts) — canonical tier keys, display names, pricing',
      'Tier feature matrix — per-tier feature flags + limits',
      'Mile economy foundation — monthly allocations, rollover rules',
    ],
    affectsCriteria: ['tier_display', 'mile_cost_format', 'upgrade_path_language'],
    requiredForFinalPass: true,
    status: 'complete',
    notes: 'Foundation batch. tiers.ts supersedes tierConfig.ts (legacy keys mapped).',
  },
  {
    batch: 'batch_2A',
    delivers: [
      'Mile engine — validation, token management, ledger',
      'Explorer complimentary tokens (LEAP + PRISM)',
      'MileCostBadge UI component',
      'NEXUS mile integration — cost formatting in chat',
    ],
    affectsCriteria: ['mile_cost_format', 'nexus_naming', 'cta_consistency'],
    requiredForFinalPass: true,
    status: 'complete',
    notes: 'Corrective pass applied: "free" → "complimentary" everywhere.',
  },
  {
    batch: 'batch_2B',
    delivers: [
      'Voice standard (voiceStandard.ts) — quality dimensions, banned words, diagnostics',
      'Quality enforcer — 8-dimension scoring, AI-tell detection',
      'Brand guardrails — banned word scanner, tier name check, internal framework check',
      'NEXUS personas (Guide, Analyst, Strategist, Steward)',
      'QA evaluation framework — 20+ test cases',
    ],
    affectsCriteria: ['nexus_naming', 'tone_consistency', 'format_consistency', 'upgrade_path_language'],
    requiredForFinalPass: true,
    status: 'complete',
    notes: 'Corrective pass applied: "Framework Integration" → "Canon Alignment", "Prompt Architecture" → "Prompt System Design".',
  },
  {
    batch: 'batch_2_corrective',
    delivers: [
      'Banned word remediation — "free" → "complimentary" across Ticket 2 surfaces',
      'Quality dimension rename — "Framework Integration" → "Canon Alignment"',
      'Internal rename — "Prompt Architecture" → "Prompt System Design"',
    ],
    affectsCriteria: ['nexus_naming', 'tone_consistency', 'format_consistency'],
    requiredForFinalPass: true,
    status: 'complete',
    notes: 'Akira audit corrections applied to Batch 2A + 2B.',
  },
  {
    batch: 'batch_3',
    delivers: [
      'Assessment flow + depth pages',
      'Results panel + report rendering',
      'Diagnostic catalog — 11 instruments',
    ],
    affectsCriteria: ['mile_cost_format', 'tier_display', 'cta_consistency', 'tone_consistency'],
    requiredForFinalPass: true,
    status: 'pending',
    notes: 'Must verify diagnostic names match APPROVED_DIAGNOSTICS exactly. Mile costs match INSTRUMENT_MILE_COST.',
  },
  {
    batch: 'batch_4',
    delivers: [
      'Email engine + templates',
      'Transactional + marketing email',
      'Invite email template',
    ],
    affectsCriteria: ['nexus_naming', 'tone_consistency', 'format_consistency', 'cta_consistency'],
    requiredForFinalPass: true,
    status: 'pending',
    notes: 'High banned-word risk surface. emailEngine.ts forbidden_words lists must cover all BANNED_WORDS.',
  },
  {
    batch: 'batch_5',
    delivers: [
      'Onboarding wizard + signup flow',
      'Settings + account pages',
      'Mile balance + pack purchase',
      'Debrief booking flow',
    ],
    affectsCriteria: ['tier_display', 'cta_consistency', 'tone_consistency', 'mile_cost_format'],
    requiredForFinalPass: true,
    status: 'pending',
    notes: 'Onboarding prone to "sign up" instead of "create your profile". Settings prone to "account" instead of "profile".',
  },
  {
    batch: 'batch_6',
    delivers: [
      'Unified terminology reference (this framework)',
      'Automated terminology audit checklist',
      'Cross-batch consistency audit framework',
    ],
    affectsCriteria: ['nexus_naming', 'tier_display', 'mile_cost_format', 'cta_consistency', 'upgrade_path_language', 'tone_consistency', 'format_consistency'],
    requiredForFinalPass: true,
    status: 'in_progress',
    notes: 'This batch. Defines the final pass process; does not introduce new product terms.',
  },
];

/**
 * Batches that must be complete before the final consistency pass can run.
 */
export const BATCHES_REQUIRED_FOR_FINAL_PASS: BatchId[] = CROSS_BATCH_DEPENDENCIES
  .filter((d) => d.requiredForFinalPass)
  .map((d) => d.batch);

/**
 * Check if all prerequisite batches are complete.
 */
export function arePrerequisitesMet(): { met: boolean; pendingBatches: BatchId[] } {
  const pending = CROSS_BATCH_DEPENDENCIES
    .filter((d) => d.requiredForFinalPass && d.status !== 'complete')
    .map((d) => d.batch);
  return { met: pending.length === 0, pendingBatches: pending };
}

// ═══════════════════════════════════════════════════════════════════════
// §3 — Brand voice QA rubric (quick-score 1-5 per surface)
// ═══════════════════════════════════════════════════════════════════════

export interface BrandVoiceRubricItem {
  /** The dimension being scored. */
  dimension: string;
  /** What a score of 5 looks like. */
  score5Description: string;
  /** What a score of 1 looks like. */
  score1Description: string;
  /** Weight in the overall brand voice score. */
  weight: number;
}

export const BRAND_VOICE_RUBRIC: BrandVoiceRubricItem[] = [
  {
    dimension: 'NEXUS Identity',
    score5Description: 'NEXUS referenced consistently as NEXUS. Zero banned entity references. Entity feels like a seasoned advisor, not a chatbot.',
    score1Description: 'Multiple instances of "the AI", "the coach", or chatbot self-identification.',
    weight: 25,
  },
  {
    dimension: 'Banned Word Compliance',
    score5Description: 'Zero banned words across the entire surface. No "free", no SaaS jargon, no hype, no AI-bro language.',
    score1Description: 'Multiple hard-banned words present (e.g. "free", "framework", "credits").',
    weight: 25,
  },
  {
    dimension: 'Tone & Register',
    score5Description: 'Register matches context (marketing aspirational, product clear, chat diagnostic). Premium, not SaaS. No emoji, no exclamation.',
    score1Description: 'Wrong register (chat too marketing-y, landing too casual). Emoji or exclamation present.',
    weight: 20,
  },
  {
    dimension: 'Terminology Consistency',
    score5Description: 'All terms match terminologyReference.ts. "miles" not "credits", "milestones" not "bookmarks", "profile" not "account", canonical tier names.',
    score1Description: 'Multiple terminology violations (credits, bookmarks, account, "Professional" instead of Pro).',
    weight: 20,
  },
  {
    dimension: 'Diagnostic Accuracy',
    score5Description: 'All 11 diagnostic names, descriptors, taglines, and mile costs match APPROVED_DIAGNOSTICS + INSTRUMENT_MILE_COST exactly.',
    score1Description: 'Wrong diagnostic name, wrong descriptor, or wrong mile cost stated.',
    weight: 10,
  },
];

export interface BrandVoiceScore {
  surface: AuditSurfaceId;
  scores: Array<{ dimension: string; score: number; weight: number; weightedScore: number }>;
  overall: number; // 1-5 weighted
  passing: boolean; // overall >= 3.8 (same bar as quality enforcer)
  notes: string;
}

/**
 * Compile a brand voice score from per-dimension scores (1-5 each).
 */
export function compileBrandVoiceScore(
  surface: AuditSurfaceId,
  rawScores: Record<string, number>,
  notes = '',
): BrandVoiceScore {
  const scores = BRAND_VOICE_RUBRIC.map((item) => {
    const score = Math.max(1, Math.min(5, rawScores[item.dimension] ?? 1));
    return {
      dimension: item.dimension,
      score,
      weight: item.weight,
      weightedScore: (score / 5) * item.weight,
    };
  });

  const overall = scores.reduce((sum, s) => sum + s.weightedScore, 0) / 100 * 5;
  const passing = overall >= 3.8;

  return { surface, scores, overall, passing, notes };
}

// ═══════════════════════════════════════════════════════════════════════
// §4 — Lighthouse / accessibility copy pass checklist
// ═══════════════════════════════════════════════════════════════════════

export interface LighthouseA11yCheck {
  id: string;
  category: 'lighthouse' | 'accessibility' | 'copy';
  check: string;
  acceptanceCriteria: string;
  verifyMethod: string;
  status: 'pass' | 'fail' | 'pending';
}

export const LIGHTHOUSE_A11Y_CHECKLIST: LighthouseA11yCheck[] = [
  // ── Lighthouse ──
  {
    id: 'lh-performance',
    category: 'lighthouse',
    check: 'Lighthouse Performance score',
    acceptanceCriteria: '>= 90 on all primary routes (/, /pricing, /assessment, /nexus/chat).',
    verifyMethod: 'Run Lighthouse in CI against primary routes; gate on score < 90.',
    status: 'pending',
  },
  {
    id: 'lh-accessibility',
    category: 'lighthouse',
    check: 'Lighthouse Accessibility score',
    acceptanceCriteria: '>= 95 on all primary routes.',
    verifyMethod: 'Run Lighthouse a11y audit; gate on score < 95.',
    status: 'pending',
  },
  {
    id: 'lh-best-practices',
    category: 'lighthouse',
    check: 'Lighthouse Best Practices score',
    acceptanceCriteria: '>= 95 on all primary routes.',
    verifyMethod: 'Run Lighthouse best-practices audit.',
    status: 'pending',
  },
  {
    id: 'lh-seo',
    category: 'lighthouse',
    check: 'Lighthouse SEO score',
    acceptanceCriteria: '>= 95 on all primary routes.',
    verifyMethod: 'Run Lighthouse SEO audit. Verify meta tags + pageMetadata.ts copy.',
    status: 'pending',
  },

  // ── Accessibility (copy-related) ──
  {
    id: 'a11y-alt-text',
    category: 'accessibility',
    check: 'Image alt text',
    acceptanceCriteria: 'All informative images have descriptive alt text. Decorative images have empty alt. No banned words in alt text.',
    verifyMethod: 'axe-core scan + manual review of image components.',
    status: 'pending',
  },
  {
    id: 'a11y-aria-labels',
    category: 'accessibility',
    check: 'ARIA labels on interactive elements',
    acceptanceCriteria: 'All buttons, links, form inputs have accessible names. Labels use canonical terminology (e.g. "Milestones" not "Bookmarks").',
    verifyMethod: 'axe-core scan + screen reader spot-check.',
    status: 'pending',
  },
  {
    id: 'a11y-color-contrast',
    category: 'accessibility',
    check: 'Color contrast (WCAG AA)',
    acceptanceCriteria: 'Text contrast >= 4.5:1 (normal text), >= 3:1 (large text). UI components >= 3:1.',
    verifyMethod: 'axe-core contrast check + manual review of accent color usage (#C108AB).',
    status: 'pending',
  },
  {
    id: 'a11y-heading-hierarchy',
    category: 'accessibility',
    check: 'Heading hierarchy',
    acceptanceCriteria: 'Single h1 per page. No skipped heading levels (h1 → h3). Diagnostic names in headings are ALL CAPS.',
    verifyMethod: 'axe-core heading-order check + manual review.',
    status: 'pending',
  },
  {
    id: 'a11y-form-labels',
    category: 'accessibility',
    check: 'Form labels',
    acceptanceCriteria: 'Every form input has a visible label. No placeholder-as-label. Labels use canonical terms ("profile" not "account").',
    verifyMethod: 'axe-core form-labels check + manual review of onboarding/settings forms.',
    status: 'pending',
  },

  // ── Copy (a11y-adjacent) ──
  {
    id: 'copy-lang-attr',
    category: 'copy',
    check: 'HTML lang attribute',
    acceptanceCriteria: '<html lang="en"> (or appropriate locale). Email templates include lang attribute.',
    verifyMethod: 'Grep for <html lang= in index.html + email templates.',
    status: 'pending',
  },
  {
    id: 'copy-page-titles',
    category: 'copy',
    check: 'Page <title> tags',
    acceptanceCriteria: 'Every route has a descriptive title. Titles use canonical terms. No banned words. Format: "Page Name | LYC Intelligence".',
    verifyMethod: 'Grep pageMetadata.ts for title fields; verify against routes.',
    status: 'pending',
  },
  {
    id: 'copy-meta-descriptions',
    category: 'copy',
    check: 'Meta description tags',
    acceptanceCriteria: 'Every public route has a meta description (80-160 chars). No banned words. No emoji.',
    verifyMethod: 'Grep pageMetadata.ts for description fields; scan with BANNED_WORDS.',
    status: 'pending',
  },
  {
    id: 'copy-focus-order',
    category: 'copy',
    check: 'Focus order + visible focus',
    acceptanceCriteria: 'Tab order follows visual order. Visible focus indicator on all interactive elements.',
    verifyMethod: 'Manual keyboard navigation per route.',
    status: 'pending',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §5 — Final QA pass process
// ═══════════════════════════════════════════════════════════════════════

export type FinalPassPhaseId =
  | 'phase_1_prereq_check'   // Verify all prerequisite batches complete
  | 'phase_2_terminology'    // Run terminology audit checklist
  | 'phase_3_consistency'    // Run 7 consistency criteria
  | 'phase_4_brand_voice'    // Score brand voice per surface (1-5 rubric)
  | 'phase_5_lighthouse_a11y'// Lighthouse + accessibility copy pass
  | 'phase_6_sign_off';      // Akira sign-off

export interface FinalPassPhase {
  id: FinalPassPhaseId;
  label: string;
  description: string;
  /** What runs in this phase. */
  activities: string[];
  /** Exit criteria — must be met before next phase. */
  exitCriteria: string[];
  /** Owner of this phase. */
  owner: string;
}

export const FINAL_PASS_PROCESS: FinalPassPhase[] = [
  {
    id: 'phase_1_prereq_check',
    label: 'Phase 1 — Prerequisite Check',
    description: 'Verify all prerequisite batches (1.5, 2A, 2B, 2 corrective, 3, 4, 5) are complete before the final pass runs.',
    activities: [
      'Run arePrerequisitesMet() from crossBatchConsistency.ts',
      'Confirm CROSS_BATCH_DEPENDENCIES status for each batch',
      'Block final pass if any required batch is pending/in_progress',
    ],
    exitCriteria: [
      'All requiredForFinalPass batches marked "complete"',
      'No pendingBatches in arePrerequisitesMet() result',
    ],
    owner: 'Build lead',
  },
  {
    id: 'phase_2_terminology',
    label: 'Phase 2 — Terminology Audit',
    description: 'Run the automated terminology audit checklist across all 12 surfaces.',
    activities: [
      'Run AUDIT_CHECKLIST items per surface (terminologyAuditChecklist.ts)',
      'Run CROSS_SURFACE_CHECKS (6 cross-surface consistency checks)',
      'Verify BANNED_WORD_PER_SURFACE risk profiles',
      'Record AuditResult (pass/fail/pending) per item',
    ],
    exitCriteria: [
      'Zero "fail" status items across all 12 surfaces',
      'Zero "pending" status items (all items audited)',
      'compileFullAuditReport() returns overallSummary starting with "PASS"',
    ],
    owner: 'Akira (Diagnostic Content Integrity)',
  },
  {
    id: 'phase_3_consistency',
    label: 'Phase 3 — Consistency Criteria',
    description: 'Verify all 7 consistency criteria across batches.',
    activities: [
      'Verify nexus_naming: codebase-wide grep for BANNED_ENTITY_REFERENCES',
      'Verify tier_display: canonical names from tiers.ts everywhere',
      'Verify mile_cost_format: "X miles" / "Complimentary" everywhere',
      'Verify cta_consistency: TIER_CTA_LABEL used across surfaces',
      'Verify upgrade_path_language: no tier names in CASUAL chat (allowed in explicit upgrade/recommendation context), soft gates consistent',
      'Verify tone_consistency: register matches context per surface',
      'Verify format_consistency: no emoji, no exclamation, capitalization rules',
    ],
    exitCriteria: [
      'All 7 CONSISTENCY_CRITERIA pass (zero blockers, zero majors)',
      'Minors logged as follow-up issues (non-blocking)',
    ],
    owner: 'Akira + Build lead',
  },
  {
    id: 'phase_4_brand_voice',
    label: 'Phase 4 — Brand Voice Scoring',
    description: 'Score brand voice per surface using the 1-5 rubric. Same 3.8/5.0 bar as quality enforcer.',
    activities: [
      'Score each of the 12 surfaces against BRAND_VOICE_RUBRIC (5 dimensions)',
      'Compile BrandVoiceScore per surface via compileBrandVoiceScore()',
      'Flag any surface scoring < 3.8 as failing',
    ],
    exitCriteria: [
      'All 12 surfaces score >= 3.8 (passing: true)',
      'No surface has a dimension scored 1 (critical failure)',
    ],
    owner: 'Brand + Akira',
  },
  {
    id: 'phase_5_lighthouse_a11y',
    label: 'Phase 5 — Lighthouse + Accessibility',
    description: 'Run Lighthouse + accessibility copy pass on all primary routes.',
    activities: [
      'Run Lighthouse (Performance, Accessibility, Best Practices, SEO) per route',
      'Run axe-core accessibility scan per route',
      'Verify LIGHTHOUSE_A11Y_CHECKLIST items (15 checks)',
      'Spot-check screen reader navigation on key flows',
    ],
    exitCriteria: [
      'Lighthouse Performance >= 90, Accessibility >= 95 on all primary routes',
      'All LIGHTHOUSE_A11Y_CHECKLIST items pass',
      'Zero axe-core violations on primary routes',
    ],
    owner: 'Build lead + a11y reviewer',
  },
  {
    id: 'phase_6_sign_off',
    label: 'Phase 6 — Sign-Off',
    description: 'Akira sign-off on terminology + brand voice integrity. Build lead sign-off on consistency + a11y.',
    activities: [
      'Akira reviews terminology audit + brand voice scores',
      'Build lead reviews consistency + Lighthouse/a11y results',
      'Record sign-off in release notes',
      'Archive audit reports for provenance',
    ],
    exitCriteria: [
      'Akira sign-off recorded',
      'Build lead sign-off recorded',
      'All audit reports archived',
    ],
    owner: 'Akira + Build lead',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §6 — Final pass report compilation
// ═══════════════════════════════════════════════════════════════════════

export interface FinalPassReport {
  generatedAt: string;
  prerequisitesMet: boolean;
  pendingBatches: BatchId[];
  consistencyCriteria: ConsistencyCriterionId[];
  brandVoiceBar: number; // 3.8
  surfacesToScore: AuditSurfaceId[];
  finalPassPhases: FinalPassPhaseId[];
  summary: {
    totalConsistencyCriteria: number;
    totalBrandVoiceDimensions: number;
    totalLighthouseA11yChecks: number;
    totalFinalPassPhases: number;
  };
}

/**
 * Generate a final pass report skeleton (for planning + dashboards).
 */
export function generateFinalPassReport(): FinalPassReport {
  const { met, pendingBatches } = arePrerequisitesMet();
  return {
    generatedAt: new Date().toISOString(),
    prerequisitesMet: met,
    pendingBatches,
    consistencyCriteria: CONSISTENCY_CRITERIA.map((c) => c.id),
    brandVoiceBar: 3.8,
    surfacesToScore: AUDIT_SURFACES.map((s) => s.id),
    finalPassPhases: FINAL_PASS_PROCESS.map((p) => p.id),
    summary: {
      totalConsistencyCriteria: CONSISTENCY_CRITERIA.length,
      totalBrandVoiceDimensions: BRAND_VOICE_RUBRIC.length,
      totalLighthouseA11yChecks: LIGHTHOUSE_A11Y_CHECKLIST.length,
      totalFinalPassPhases: FINAL_PASS_PROCESS.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// §7 — Framework summary (for dashboards)
// ═══════════════════════════════════════════════════════════════════════

export const CROSS_BATCH_FRAMEWORK_SUMMARY = {
  consistencyCriteria: CONSISTENCY_CRITERIA.length,
  blockerCriteria: CONSISTENCY_CRITERIA.filter((c) => c.severity === 'blocker').length,
  majorCriteria: CONSISTENCY_CRITERIA.filter((c) => c.severity === 'major').length,
  crossBatchDependencies: CROSS_BATCH_DEPENDENCIES.length,
  batchesRequiredForFinalPass: BATCHES_REQUIRED_FOR_FINAL_PASS.length,
  brandVoiceDimensions: BRAND_VOICE_RUBRIC.length,
  brandVoiceBar: 3.8,
  lighthouseA11yChecks: LIGHTHOUSE_A11Y_CHECKLIST.length,
  finalPassPhases: FINAL_PASS_PROCESS.length,
  surfacesToScore: AUDIT_SURFACES.length,
};
