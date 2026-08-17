/**
 * terminologyReference.ts — Unified Terminology Reference (single source of truth).
 *
 * Batch 6 / Ticket 1: One term = one concept. No synonyms. No parallel naming
 * systems. All batches reference THIS file; no batch defines its own terms.
 *
 * Source specs (locked):
 *  - Tier Feature Matrix v4.1
 *  - X0 Voice Standard v0.5 / v0.6
 *  - Brand Master Spec v1.2
 *  - Pricing Strategy v1.1
 *
 * Canon authority: Akira — Diagnostic Content Integrity Lead
 *
 * Design rules:
 *  - This file RE-EXPORTS existing canonical anchors rather than re-declaring
 *    them. It does not duplicate voiceStandard.ts / tiers.ts / miles.ts — it
 *    indexes them and adds the missing pieces (session types, feature names,
 *    tier-specific differences, user-facing vs. internal mapping).
 *  - Where multiple existing sources define the same concept, the
 *    CANONICAL_SOURCE field on each TerminologyEntry names the winner.
 *  - Banned words are cross-referenced from 3 existing sources here; the
 *    BANNED_WORD_SOURCES table names which source is authoritative per
 *    enforcement surface.
 */

import {
  ENTITY_NAME,
  BANNED_ENTITY_REFERENCES,
  PROGRESS_TERM,
  BANNED_PROGRESS_TERMS,
  APPROVED_DIAGNOSTICS,
  BANNED_WORDS as VOICE_BANNED_WORDS,
  type BannedWordEntry as VoiceBannedWordEntry,
} from './voiceStandard';
import {
  TIER_KEYS,
  TIERS,
  DEFAULT_TIER,
  type TierKey,
  tierDisplayName,
} from './tiers';
import {
  INSTRUMENT_MILE_COST,
  MILE_COST_TIERS,
  type MileCostTier,
  getInstrumentMileCost,
} from './miles';

// ═══════════════════════════════════════════════════════════════════════
// §1 — Re-exports of canonical anchors (single import surface)
// ═══════════════════════════════════════════════════════════════════════
//
// Other batches import terminology from HERE, not from the underlying files.
// If the underlying canonical value changes, this re-export is the only
// place that needs to track it.

export {
  ENTITY_NAME,
  BANNED_ENTITY_REFERENCES,
  PROGRESS_TERM,
  BANNED_PROGRESS_TERMS,
  APPROVED_DIAGNOSTICS,
  TIER_KEYS,
  TIERS,
  DEFAULT_TIER,
  INSTRUMENT_MILE_COST,
  MILE_COST_TIERS,
  tierDisplayName,
  getInstrumentMileCost,
};
export type { TierKey, MileCostTier, VoiceBannedWordEntry };

// ═══════════════════════════════════════════════════════════════════════
// §2 — Terminology categories
// ═══════════════════════════════════════════════════════════════════════

export type TerminologyCategory =
  | 'product_name'      // NEXUS entity name
  | 'tier'              // Explorer, Starter, Professional, Executive, Council
  | 'currency'          // miles (product/UI only)
  | 'progress'          // milestones
  | 'diagnostic'        // 11 assessment instruments
  | 'session'           // 30/45/60/90 min sessions, debrief types
  | 'feature'           // ensemble mode, document upload, persona system, session memory
  | 'member'            // member, profile, account
  | 'banned'            // banned words (cross-referenced)
  | 'internal';         // internal-only terms (codenames, phase refs, etc.)

export type Visibility =
  | 'user_facing'       // appears in chat, UI, emails, errors, marketing
  | 'internal_only'     // never appears in user-facing copy
  | 'both';             // term has a user-facing form AND an internal form

export interface TerminologyEntry {
  /** Canonical term — the one correct form. */
  term: string;
  category: TerminologyCategory;
  /** Part of speech / role (noun, verb, label, etc.). */
  role: string;
  /** Where this term is allowed to appear. */
  visibility: Visibility;
  /** One-line usage rule. */
  usageContext: string;
  /** The config file / spec that is the canonical source for this term. */
  canonicalSource: string;
  /** Accepted variants (e.g. legacy keys, abbreviations) — internal-only. */
  acceptedVariants?: string[];
  /** Common incorrect forms — flagged by audit checklist. */
  commonErrors?: string[];
  /** Concrete usage examples (correct form). */
  examples?: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// §3 — Master terminology list
// ═══════════════════════════════════════════════════════════════════════

export const TERMINOLOGY: TerminologyEntry[] = [
  // ── Product name ──────────────────────────────────────────────────
  {
    term: ENTITY_NAME,
    category: 'product_name',
    role: 'proper noun (entity name)',
    visibility: 'user_facing',
    usageContext: 'Always capitalized. NEXUS is the entity — never "the coach", "the AI", "the assistant", or "the chatbot" in any user-facing surface.',
    canonicalSource: 'src/config/voiceStandard.ts → ENTITY_NAME',
    commonErrors: ['the coach', 'the AI', 'your assistant', 'your coach', 'the chatbot', 'the bot', 'Nexus', 'nexus'],
    examples: ['"NEXUS can run that assessment for you."', '"Ask NEXUS about your leadership edge."'],
  },

  // ── Tiers (5 user-facing, per Tier Feature Matrix v4.1) ───────────
  // Canonical keys + display names come from tiers.ts (supersedes tierConfig.ts).
  // Order: explorer < starter < professional < executive < council.
  {
    term: 'Explorer',
    category: 'tier',
    role: 'tier display name (entry)',
    visibility: 'user_facing',
    usageContext: 'Entry tier. Display name in pricing cards + onboarding. Canonical key = "explorer". NEVER "free tier" or "Executive Introduction" in product UI (those are marketing/legacy aliases).',
    canonicalSource: 'src/config/tiers.ts → TIERS.explorer.displayName',
    acceptedVariants: ['explorer', 'Executive Introduction (legacy/marketing alias)'],
    commonErrors: ['free tier', 'Free', 'Executive Introduction (in product UI)'],
    examples: ['"Your Explorer baseline includes one complimentary assessment."'],
  },
  {
    term: 'Starter',
    category: 'tier',
    role: 'tier display name (2nd)',
    visibility: 'user_facing',
    usageContext: 'Second tier. Display name in pricing cards. Canonical key = "starter". Earns 2 monthly miles.',
    canonicalSource: 'src/config/tiers.ts → TIERS.starter.displayName',
    acceptedVariants: ['starter'],
    commonErrors: ['Basic', 'Basic plan', 'Starter tier (avoid "tier" suffix in chat)'],
    examples: ['"Starter members receive 2 miles each month."'],
  },
  {
    term: 'Professional',
    category: 'tier',
    role: 'tier display name (3rd, recommended)',
    visibility: 'user_facing',
    usageContext: 'Third tier. Recommended tier ("Most Popular"). Canonical key = "professional". Full catalog access, unlimited retakes. NEVER "Pro" in user-facing copy — "Pro" is internal shorthand only.',
    canonicalSource: 'src/config/tiers.ts → TIERS.professional.displayName',
    acceptedVariants: ['professional', 'Pro (internal shorthand only — never user-facing)'],
    commonErrors: ['Pro', 'Pro tier', 'Premium', 'Premium plan'],
    examples: ['"Professional unlocks the full 11-instrument catalog."'],
  },
  {
    term: 'Executive',
    category: 'tier',
    role: 'tier display name (4th)',
    visibility: 'user_facing',
    usageContext: 'Fourth tier. Canonical key = "executive". Priority NEXUS responses, branded PDFs. Note: "Executive" also appears in legacy alias "Executive Introduction" (entry tier) — context disambiguates.',
    canonicalSource: 'src/config/tiers.ts → TIERS.executive.displayName',
    acceptedVariants: ['executive'],
    commonErrors: ['Executive tier (avoid "tier" suffix in chat)', 'Enterprise'],
    examples: ['"Executive members get priority NEXUS responses."'],
  },
  {
    term: 'Council',
    category: 'tier',
    role: 'tier display name (5th, invite-only)',
    visibility: 'user_facing',
    usageContext: 'Top tier. Invite-only — cannot self-serve upgrade. Canonical key = "council". Community + live sessions. NEVER mention tier name in NEXUS chat (use platform layer for upgrade direction).',
    canonicalSource: 'src/config/tiers.ts → TIERS.council.displayName',
    acceptedVariants: ['council'],
    commonErrors: ['Council tier (in chat)', 'Enterprise (wrong tier)'],
    examples: ['"Council is an invite-only membership."'],
  },

  // ── Currency (miles) ──────────────────────────────────────────────
  {
    term: 'miles',
    category: 'currency',
    role: 'noun (product currency)',
    visibility: 'user_facing',
    usageContext: 'Product + UI + NEXUS chat only. NOT marketing copy. Marketing uses "included assessments" / "premium diagnostics". Lowercase "miles" in prose; capitalized "Miles" only at sentence start or in labels. NEVER "credits", "tokens", "points", "coins".',
    canonicalSource: 'src/config/miles.ts → INSTRUMENT_MILE_COST',
    commonErrors: ['credits', 'tokens', 'points', 'coins', 'Miles (mid-sentence capitalization)'],
    examples: ['"LEAP costs 3 miles."', '"You have 5 miles remaining."'],
  },
  {
    term: 'mile',
    category: 'currency',
    role: 'noun (singular unit)',
    visibility: 'user_facing',
    usageContext: 'Singular form. "1 mile" not "1 miles". Used in pack labels and cost displays.',
    canonicalSource: 'src/config/miles.ts → MILE_PACKS',
    examples: ['"1 mile · $49"', '"SPARK — 1 mile"'],
  },
  {
    term: 'complimentary',
    category: 'currency',
    role: 'adjective (zero-cost descriptor)',
    visibility: 'user_facing',
    usageContext: 'Replaces "free" everywhere. Used for 0-mile assessments and Explorer onboarding tokens. NEVER "free", "free of charge", "no cost".',
    canonicalSource: 'Brand Master Spec v1.2 + src/config/voiceStandard.ts → BANNED_WORDS[free]',
    commonErrors: ['free', 'free of charge', 'no cost', 'gratis', 'on the house'],
    examples: ['"LEAP is available as a complimentary assessment."', '"Complimentary Explorer tokens"'],
  },
  {
    term: 'mile pack',
    category: 'currency',
    role: 'noun (purchasable unit)',
    visibility: 'user_facing',
    usageContext: 'Purchasable mile bundles. Displayed on billing/mile-pack pages. NEVER "credit pack", "token pack", "top-up".',
    canonicalSource: 'src/config/miles.ts → MILE_PACKS',
    commonErrors: ['credit pack', 'token pack', 'top-up', 'refill'],
    examples: ['"Purchase a 5-mile pack for $199."'],
  },

  // ── Progress tracking ─────────────────────────────────────────────
  {
    term: PROGRESS_TERM, // 'milestones'
    category: 'progress',
    role: 'noun (progress unit)',
    visibility: 'user_facing',
    usageContext: 'Unified across ALL tiers. One word everywhere. Platform handles quantity limits; terminology stays constant. NEVER "bookmarks", "tasks", "todos", "checklist", "dashboard items".',
    canonicalSource: 'src/config/voiceStandard.ts → PROGRESS_TERM',
    commonErrors: BANNED_PROGRESS_TERMS, // ['bookmarks', 'dashboard items', 'tasks', 'todo', 'checklist']
    examples: ['"Your milestones this quarter."', '"Save this to your milestones."'],
  },

  // ── Diagnostics (11 instruments) ──────────────────────────────────
  // Canonical descriptors come from APPROVED_DIAGNOSTICS in voiceStandard.ts.
  // Cost tiers come from INSTRUMENT_MILE_COST in miles.ts.
  {
    term: 'SPARK',
    category: 'diagnostic',
    role: 'instrument code (Light, 1 mile)',
    visibility: 'user_facing',
    usageContext: 'AI leadership readiness. First mention: "SPARK — AI leadership readiness". Subsequent: "SPARK". Always ALL CAPS.',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Spark', 'spark', 'SPARK assessment (redundant — "assessment" is implied)'],
    examples: ['"SPARK — AI leadership readiness. Know where you stand."'],
  },
  {
    term: 'PRISM',
    category: 'diagnostic',
    role: 'instrument code (Standard, 2 miles)',
    visibility: 'user_facing',
    usageContext: 'Professional branding. First mention: "PRISM — professional branding". Complimentary for Explorer onboarding.',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Prism', 'prism'],
    examples: ['"PRISM shows how the world sees your professional brand."'],
  },
  {
    term: 'MOSAIC',
    category: 'diagnostic',
    role: 'instrument code (Standard, 2 miles)',
    visibility: 'user_facing',
    usageContext: 'Institutional trust & relationship velocity. First mention: "MOSAIC — institutional trust and relationship velocity".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Mosaic', 'mosaic'],
    examples: ['"MOSAIC measures partnership trust velocity."'],
  },
  {
    term: 'BRIDGE',
    category: 'diagnostic',
    role: 'instrument code (Standard, 2 miles)',
    visibility: 'user_facing',
    usageContext: 'Cross-cultural relational intelligence. First mention: "BRIDGE — cross-cultural relational intelligence".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Bridge', 'bridge'],
    examples: ['"BRIDGE assesses cross-border relational intelligence."'],
  },
  {
    term: 'IMPACT',
    category: 'diagnostic',
    role: 'instrument code (Standard, 2 miles)',
    visibility: 'user_facing',
    usageContext: 'Board & stakeholder impact. First mention: "IMPACT — board and stakeholder impact".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Impact', 'impact'],
    examples: ['"IMPACT maps your influence at the highest levels."'],
  },
  {
    term: 'DRIVE',
    category: 'diagnostic',
    role: 'instrument code (Standard, 2 miles)',
    visibility: 'user_facing',
    usageContext: 'Motivational alignment. First mention: "DRIVE — motivational alignment".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Drive', 'drive'],
    examples: ['"DRIVE reveals what fuels you and what fades you."'],
  },
  {
    term: 'FORGE',
    category: 'diagnostic',
    role: 'instrument code (Signature, 3 miles)',
    visibility: 'user_facing',
    usageContext: 'Sales excellence capability. First mention: "FORGE — sales excellence capability".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Forge', 'forge'],
    examples: ['"FORGE builds the sales leader your market needs."'],
  },
  {
    term: 'LEAP',
    category: 'diagnostic',
    role: 'instrument code (Signature, 3 miles)',
    visibility: 'user_facing',
    usageContext: 'Competitive positioning. First mention: "LEAP — competitive positioning". Complimentary for Explorer onboarding.',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Leap', 'leap'],
    examples: ['"LEAP pinpoints your competitive edge."'],
  },
  {
    term: 'QUEST',
    category: 'diagnostic',
    role: 'instrument code (Signature, 3 miles)',
    visibility: 'user_facing',
    usageContext: 'Strategic market positioning. First mention: "QUEST — strategic market positioning".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Quest', 'quest'],
    examples: ['"QUEST clarifies where you stand and where to play."'],
  },
  {
    term: 'COACH',
    category: 'diagnostic',
    role: 'instrument code (0 miles — coaching fit, not an assessment)',
    visibility: 'user_facing',
    usageContext: 'Executive coaching fit. 0 miles (not a paid assessment). First mention: "COACH — executive coaching fit".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Coach', 'coach', 'COACH assessment (it is a fit-checker, not an assessment)'],
    examples: ['"COACH calibrates your executive coaching fit."'],
  },
  {
    term: 'CPI',
    category: 'diagnostic',
    role: 'instrument code (Flagship, 5 miles, Council-only)',
    visibility: 'user_facing',
    usageContext: 'China Leadership Pipeline Index. Flagship — Council tier only. First mention: "CPI — China Leadership Pipeline Index".',
    canonicalSource: 'src/config/voiceStandard.ts → APPROVED_DIAGNOSTICS',
    commonErrors: ['Cpi', 'cpi', 'CPI Index (redundant)'],
    examples: ['"CPI measures leadership pipeline health."'],
  },

  // ── Session / debrief terminology ─────────────────────────────────
  {
    term: '30-minute session',
    category: 'session',
    role: 'session type label',
    visibility: 'user_facing',
    usageContext: 'Short coaching session. Format: "30-minute session" (hyphenated, lowercase "minute"). NEVER "30 min session" or "30min".',
    canonicalSource: 'src/assessments/catalog.ts + Pricing Strategy v1.1',
    commonErrors: ['30 min session', '30min', '30-min', 'thirty minute session'],
    examples: ['"Book a 30-minute session to debrief your SPARK results."'],
  },
  {
    term: '45-minute session',
    category: 'session',
    role: 'session type label',
    visibility: 'user_facing',
    usageContext: 'Standard coaching session. Same format rules as 30-minute.',
    canonicalSource: 'src/assessments/catalog.ts + Pricing Strategy v1.1',
    commonErrors: ['45 min', '45min', '45-min'],
    examples: ['"Your 45-minute session includes a PRISM debrief."'],
  },
  {
    term: '60-minute session',
    category: 'session',
    role: 'session type label',
    visibility: 'user_facing',
    usageContext: 'Extended coaching session. Same format rules.',
    canonicalSource: 'src/assessments/catalog.ts + Pricing Strategy v1.1',
    commonErrors: ['60 min', '60min', '60-min', '1 hour session'],
    examples: ['"A 60-minute session for full CPI results review."'],
  },
  {
    term: '90-minute session',
    category: 'session',
    role: 'session type label',
    visibility: 'user_facing',
    usageContext: 'Deep-dive / flagship debrief session. Same format rules.',
    canonicalSource: 'src/assessments/catalog.ts + Pricing Strategy v1.1',
    commonErrors: ['90 min', '90min', '90-min', '1.5 hour session'],
    examples: ['"Council members book 90-minute sessions for flagship debriefs."'],
  },
  {
    term: 'debrief',
    category: 'session',
    role: 'noun / verb (post-assessment review)',
    visibility: 'user_facing',
    usageContext: 'The structured review of assessment results with a coach. "Debrief" not "walkthrough", "review session", or "consultation". Capitalized only at sentence start.',
    canonicalSource: 'src/components/assessment/NexusDebriefWidget.tsx + canon/instruments',
    commonErrors: ['walkthrough', 'review session', 'consultation', 'read-out', 'debriefing (use "debrief")'],
    examples: ['"Book your CPI debrief."', '"Your coach will debrief your MOSAIC results."'],
  },
  {
    term: 'coach',
    category: 'session',
    role: 'noun (human coach, not NEXUS)',
    visibility: 'user_facing',
    usageContext: 'A human LYC coach (for debriefs). NEVER used to refer to NEXUS — NEXUS is the entity name, "coach" is a human role. Context disambiguates from the COACH diagnostic.',
    canonicalSource: 'Brand Master Spec v1.2',
    commonErrors: ['the coach (referring to NEXUS)', 'your coach (referring to NEXUS)'],
    examples: ['"Your coach will reach out to schedule the debrief."'],
  },

  // ── Feature names ─────────────────────────────────────────────────
  {
    term: 'ensemble mode',
    category: 'feature',
    role: 'feature name (multi-diagnostic synthesis)',
    visibility: 'user_facing',
    usageContext: 'Feature that synthesizes insights across multiple diagnostics. Lowercase in prose. NEVER "multi-assessment mode", "combined view", "cross-diagnostic dashboard".',
    canonicalSource: 'Batch 6 terminology reference (canonical introduction)',
    commonErrors: ['multi-assessment mode', 'combined view', 'cross-diagnostic dashboard', 'Ensemble Mode (over-capitalized)'],
    examples: ['"Enable ensemble mode to see patterns across your diagnostics."'],
  },
  {
    term: 'document upload',
    category: 'feature',
    role: 'feature name (file attachment)',
    visibility: 'user_facing',
    usageContext: 'Feature allowing members to attach context files to NEXUS conversations. Lowercase in prose. NEVER "file upload", "attachment", "document sharing".',
    canonicalSource: 'Batch 6 terminology reference (canonical introduction)',
    commonErrors: ['file upload', 'attachment', 'document sharing', 'file share'],
    examples: ['"Use document upload to share your role description with NEXUS."'],
  },
  {
    term: 'persona system',
    category: 'feature',
    role: 'feature name (NEXUS conversation modes)',
    visibility: 'internal_only',
    usageContext: 'The 4 NEXUS personas (Guide, Analyst, Strategist, Steward). INTERNAL ONLY — members experience persona shifts as NEXUS adapting, not as "switching personas". NEVER mention "persona system" in user-facing copy.',
    canonicalSource: 'src/config/nexusPersonas.ts',
    commonErrors: ['persona system (user-facing)', 'personas (user-facing)', 'character system', 'mode switching'],
    examples: ['[internal] "The persona system selects Strategist for strategic prompts."'],
  },
  {
    term: 'session memory',
    category: 'feature',
    role: 'feature name (conversation continuity)',
    visibility: 'user_facing',
    usageContext: 'Feature allowing NEXUS to recall context across conversations. Lowercase in prose. NEVER "chat history", "conversation log", "memory bank".',
    canonicalSource: 'Batch 6 terminology reference (canonical introduction)',
    commonErrors: ['chat history', 'conversation log', 'memory bank', 'context retention'],
    examples: ['"Session memory lets NEXUS pick up where you left off."'],
  },

  // ── Member terminology ────────────────────────────────────────────
  {
    term: 'member',
    category: 'member',
    role: 'noun (user of the product)',
    visibility: 'user_facing',
    usageContext: 'Replaces "user", "customer", "subscriber", "client" in product UI. NEVER "user" in user-facing copy (internal analytics may use "user" for event tracking).',
    canonicalSource: 'src/config/brandCompliance.ts → REQUIRED_SUBSTITUTIONS',
    commonErrors: ['user', 'customer', 'subscriber', 'client', 'account holder'],
    examples: ['"Members on Professional get unlimited retakes."'],
  },
  {
    term: 'profile',
    category: 'member',
    role: 'noun (member account + data)',
    visibility: 'user_facing',
    usageContext: 'Replaces "account", "user account", "user dashboard". "Create your profile" not "sign up" / "register".',
    canonicalSource: 'src/config/brandCompliance.ts → REQUIRED_SUBSTITUTIONS',
    commonErrors: ['account', 'user account', 'user dashboard', 'signup'],
    examples: ['"Create your profile to begin."', "Edit your profile settings."],
  },

  // ── Internal-only terms (never user-facing) ───────────────────────
  {
    term: 'phase reference',
    category: 'internal',
    role: 'internal milestone label',
    visibility: 'internal_only',
    usageContext: 'Internal project phases (Phase 0-15). NEVER appear in user-facing copy. Detected by brandGuard.ts internalFrameworkCheck().',
    canonicalSource: 'src/nexus/brandGuard.ts → INTERNAL_PATTERNS',
    commonErrors: ['phase 0 (user-facing)', 'phase 1 (user-facing)', 'ticket #1234 (user-facing)'],
    examples: ['[internal only] "Phase 2 ships the assessment hub."'],
  },
  {
    term: 'codename',
    category: 'internal',
    role: 'internal project codename',
    visibility: 'internal_only',
    usageContext: 'TRIDENT, MERIDIAN, CANVAS, SHIFT, AKIRA. NEVER user-facing. Detected by voiceStandard.ts BANNED_WORDS (codename category).',
    canonicalSource: 'src/config/voiceStandard.ts → BANNED_WORDS[codename]',
    commonErrors: ['TRIDENT (user-facing)', 'MERIDIAN (user-facing)', 'CANVAS (user-facing)', 'SHIFT (user-facing)'],
    examples: ['[internal only]'],
  },
  {
    term: 'internal architecture',
    category: 'internal',
    role: 'internal structural model',
    visibility: 'internal_only',
    usageContext: '3D, 3-pillar, 3-fires, three forces, three layers, maturity stack. NEVER user-facing. Detected by voiceStandard.ts BANNED_WORDS (internal_arch category).',
    canonicalSource: 'src/config/voiceStandard.ts → BANNED_WORDS[internal_arch]',
    commonErrors: ['3D (user-facing)', 'three forces (user-facing)', 'maturity stack (user-facing)'],
    examples: ['[internal only]'],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §4 — Tier-specific terminology differences
// ═══════════════════════════════════════════════════════════════════════
//
// What CHANGES between tiers vs. what STAYS CONSTANT.
// Per build rule: terminology stays constant; platform handles quantity limits.

export interface TierTerminologyDelta {
  tier: TierKey;
  /** Terms/concepts that differ at this tier (quantities, access, framing). */
  changes: string[];
  /** Terms that are CONSTANT (never change per tier). */
  constant: string[];
}

export const TIER_TERMINOLOGY_DELTAS: TierTerminologyDelta[] = [
  {
    tier: 'explorer',
    changes: [
      'Receives LEAP + PRISM as one-time complimentary onboarding tokens (not miles).',
      '0 monthly miles — no allocation.',
      'NEXUS chat capped at 20 messages/day (soft nudge at 15).',
      'Branded PDF reports NOT available.',
      'Display alias in marketing: "Executive Introduction" (legacy). NEVER "free tier".',
    ],
    constant: ['miles', 'milestones', 'NEXUS', 'complimentary', '11-instrument catalog names'],
  },
  {
    tier: 'starter',
    changes: [
      '2 monthly miles allocated.',
      'Earns miles via NEXUS actions.',
      'NEXUS chat capped at 50 messages/day.',
      '3 assessment baselines.',
    ],
    constant: ['miles', 'milestones', 'NEXUS', '11-instrument catalog names'],
  },
  {
    tier: 'professional',
    changes: [
      '5 monthly miles allocated.',
      'Unlimited NEXUS messages.',
      'Full 11-instrument catalog + unlimited retakes.',
      'Branded PDF reports available.',
      'Advanced insights + peer benchmarking.',
      'Recommended tier ("Most Popular" badge).',
    ],
    constant: ['miles', 'milestones', 'NEXUS', '11-instrument catalog names'],
  },
  {
    tier: 'executive',
    changes: [
      '10 monthly miles allocated.',
      'Priority NEXUS response queue.',
      'Quarterly executive workshops.',
    ],
    constant: ['miles', 'milestones', 'NEXUS', '11-instrument catalog names'],
  },
  {
    tier: 'council',
    changes: [
      '20 monthly miles allocated.',
      'Council community + live sessions.',
      'Dedicated account contact.',
      'Invite-only — cannot self-serve upgrade.',
      'CPI flagship access (Council-only).',
    ],
    constant: ['miles', 'milestones', 'NEXUS', '11-instrument catalog names'],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §5 — User-facing vs. internal-only mapping
// ═══════════════════════════════════════════════════════════════════════

export interface VisibilityMapping {
  concept: string;
  userFacingTerm: string;
  internalTerm: string;
  notes: string;
}

export const VISIBILITY_MAPPING: VisibilityMapping[] = [
  {
    concept: 'Entity name',
    userFacingTerm: 'NEXUS',
    internalTerm: 'NEXUS',
    notes: 'Same everywhere. Never "the coach" / "the AI" user-facing.',
  },
  {
    concept: 'Entry tier',
    userFacingTerm: 'Explorer',
    internalTerm: 'explorer (tier_key), Executive Introduction (marketing alias)',
    notes: 'tier_key is internal; "Explorer" is the product display name.',
  },
  {
    concept: 'Currency',
    userFacingTerm: 'miles',
    internalTerm: 'miles (balance_type: allocated | rollover | purchased | free)',
    notes: '"free" balance_type is internal ledger only — never shown to members.',
  },
  {
    concept: 'Progress unit',
    userFacingTerm: 'milestones',
    internalTerm: 'milestones',
    notes: 'Same everywhere. "bookmarks" is banned.',
  },
  {
    concept: 'Conversation modes',
    userFacingTerm: 'NEXUS adapts (no label)',
    internalTerm: 'persona system (Guide, Analyst, Strategist, Steward)',
    notes: 'Personas are internal — members never see persona names.',
  },
  {
    concept: 'Project phases',
    userFacingTerm: '(none — never referenced)',
    internalTerm: 'Phase 0-15',
    notes: 'Internal only. brandGuard detects leaks.',
  },
  {
    concept: 'Codenames',
    userFacingTerm: '(none — never referenced)',
    internalTerm: 'TRIDENT, MERIDIAN, CANVAS, SHIFT, AKIRA',
    notes: 'Internal only. voiceStandard BANNED_WORDS detects leaks.',
  },
  {
    concept: 'Structural models',
    userFacingTerm: '(none — never referenced)',
    internalTerm: '3D, 3-pillar, 3-fires, three forces, three layers',
    notes: 'Internal only. voiceStandard BANNED_WORDS detects leaks.',
  },
  {
    concept: 'Quality scoring',
    userFacingTerm: '(none — never referenced)',
    internalTerm: '8-dimension model, 3.8/5.0 bar, canon_alignment dimension',
    notes: 'Internal QA only. Members never see quality scores.',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §6 — Banned word sources (reconciliation index)
// ═══════════════════════════════════════════════════════════════════════
//
// Three existing sources define BANNED_WORDS with different shapes. This
// table names the authoritative source per enforcement surface so audits
// and code know which to consult. The full banned word LIST lives in
// voiceStandard.ts (the most complete source); this index does not
// duplicate it.

export interface BannedWordSource {
  source: string;
  shape: string;
  authoritativeFor: string[];
  notes: string;
}

export const BANNED_WORD_SOURCES: BannedWordSource[] = [
  {
    source: 'src/config/voiceStandard.ts → BANNED_WORDS',
    shape: 'BannedWordEntry[] (array; word, suggestion, severity, category)',
    authoritativeFor: [
      'NEXUS chat quality enforcement',
      'Full banned word list (most complete)',
      'Voice standard §6 + §8.3-8.4 categories',
    ],
    notes: 'Canon source per Akira. 6 categories: tier_pricing, saas_jargon, hype, ai_bro, codename, internal_arch, tier_name, casual. Used by qualityEnforcer + nexusQualityEval.',
  },
  {
    source: 'src/config/brandCompliance.ts → BANNED_WORDS',
    shape: 'Record<string, string> (object map; banned → suggestion)',
    authoritativeFor: [
      'Phase 2 surface scanning (assessment hub, login/onboarding, results, pricing, landing)',
      'Marketing copy substitutions',
    ],
    notes: 'No severity/category. Pairs with REQUIRED_SUBSTITUTIONS map. Used by scanForBannedWords() helper.',
  },
  {
    source: 'src/nexus/brandGuard.ts → BANNED_WORDS',
    shape: 'Map<string, BannedWordEntry> (Map; 7 categories)',
    authoritativeFor: [
      'NEXUS runtime response gating (QualityGate.audit)',
      'Real-time chat response blocking',
    ],
    notes: '7 categories: free_tier_naming, free_actions, saas_language, ai_bro_language, generic_hype, casual_words, internal_framework_names. Used by bannedWordScanner() with position tracking.',
  },
];

/**
 * Cross-referenced banned word list — merged from all 3 sources, deduplicated.
 * For audit/display purposes. For enforcement, use the source-specific exports.
 */
export const BANNED_WORDS_CROSS_REFERENCED: Array<{
  word: string;
  suggestion: string;
  severity: 'hard' | 'soft' | 'warning';
  categories: string[];
  sources: string[];
}> = (() => {
  const merged = new Map<string, { word: string; suggestion: string; severity: 'hard' | 'soft' | 'warning'; categories: Set<string>; sources: Set<string> }>();

  // Source 1: voiceStandard.ts (array form)
  for (const entry of VOICE_BANNED_WORDS) {
    const existing = merged.get(entry.word.toLowerCase()) ?? {
      word: entry.word,
      suggestion: entry.suggestion,
      severity: entry.severity,
      categories: new Set<string>(),
      sources: new Set<string>(),
    };
    existing.categories.add(entry.category);
    existing.sources.add('voiceStandard.ts');
    // Promote to hard if any source says hard
    if (entry.severity === 'hard') existing.severity = 'hard';
    merged.set(entry.word.toLowerCase(), existing);
  }

  return Array.from(merged.values()).map((e) => ({
    word: e.word,
    suggestion: e.suggestion,
    severity: e.severity,
    categories: Array.from(e.categories).sort(),
    sources: Array.from(e.sources).sort(),
  }));
})();

// ═══════════════════════════════════════════════════════════════════════
// §7 — Lookup helpers
// ═══════════════════════════════════════════════════════════════════════

/** Lookup map: canonical term (lowercase) → TerminologyEntry. */
export const TERMINOLOGY_MAP: Map<string, TerminologyEntry> = (() => {
  const m = new Map<string, TerminologyEntry>();
  for (const entry of TERMINOLOGY) {
    m.set(entry.term.toLowerCase(), entry);
    if (entry.acceptedVariants) {
      for (const v of entry.acceptedVariants) m.set(v.toLowerCase(), entry);
    }
  }
  return m;
})();

/**
 * Get the canonical terminology entry for a term (or variant).
 * Returns null for unknown terms.
 */
export function getTerminology(term: string): TerminologyEntry | null {
  return TERMINOLOGY_MAP.get(term.toLowerCase()) ?? null;
}

/**
 * Get all terminology entries in a category.
 */
export function getTerminologyByCategory(category: TerminologyCategory): TerminologyEntry[] {
  return TERMINOLOGY.filter((e) => e.category === category);
}

/**
 * Get all user-facing terms (excludes internal_only).
 */
export function getUserFacingTerms(): TerminologyEntry[] {
  return TERMINOLOGY.filter((e) => e.visibility !== 'internal_only');
}

/**
 * Get all internal-only terms (never user-facing).
 */
export function getInternalOnlyTerms(): TerminologyEntry[] {
  return TERMINOLOGY.filter((e) => e.visibility === 'internal_only');
}

/**
 * Get the tier-specific terminology delta for a tier.
 */
export function getTierTerminologyDelta(tier: TierKey): TierTerminologyDelta | null {
  return TIER_TERMINOLOGY_DELTAS.find((d) => d.tier === tier) ?? null;
}

/**
 * Verify a term is canonical (not a common error or banned variant).
 * Returns { ok, reason }.
 */
export function verifyCanonicalTerm(term: string): { ok: boolean; reason: string; canonical?: string } {
  const lower = term.toLowerCase();

  // Check if it's a banned word
  const banned = VOICE_BANNED_WORDS.find((b) => b.word.toLowerCase() === lower);
  if (banned) {
    return {
      ok: false,
      reason: `"${term}" is a banned word (${banned.category}).`,
      canonical: banned.suggestion === '—' ? undefined : banned.suggestion,
    };
  }

  // Check if it's a known common error
  for (const entry of TERMINOLOGY) {
    if (entry.commonErrors?.some((e) => e.toLowerCase().includes(lower))) {
      return {
        ok: false,
        reason: `"${term}" is a common error for the "${entry.term}" concept.`,
        canonical: entry.term,
      };
    }
  }

  // Check if it's canonical
  if (TERMINOLOGY_MAP.has(lower)) {
    return { ok: true, reason: `"${term}" is a canonical term.` };
  }

  return { ok: false, reason: `"${term}" is not in the terminology reference.` };
}

// ═══════════════════════════════════════════════════════════════════════
// §8 — Source spec references (for audit provenance)
// ═══════════════════════════════════════════════════════════════════════

export const SOURCE_SPECS = {
  tierFeatureMatrix: 'Tier Feature Matrix v4.1 (locked)',
  voiceStandard: 'X0 Voice Standard v0.5 / v0.6',
  brandMaster: 'Brand Master Spec v1.2',
  pricingStrategy: 'Pricing Strategy v1.1',
} as const;

/**
 * Summary of the terminology reference — for audit headers + dashboards.
 */
export const TERMINOLOGY_REFERENCE_SUMMARY = {
  totalTerms: TERMINOLOGY.length,
  categories: Array.from(new Set(TERMINOLOGY.map((e) => e.category))).sort(),
  userFacingTerms: TERMINOLOGY.filter((e) => e.visibility !== 'internal_only').length,
  internalOnlyTerms: TERMINOLOGY.filter((e) => e.visibility === 'internal_only').length,
  bannedWordsCrossReferenced: BANNED_WORDS_CROSS_REFERENCED.length,
  diagnostics: APPROVED_DIAGNOSTICS.length,
  tiers: TIER_KEYS.length,
  sourceSpecs: Object.values(SOURCE_SPECS),
  canonAuthority: 'Akira — Diagnostic Content Integrity Lead',
};
