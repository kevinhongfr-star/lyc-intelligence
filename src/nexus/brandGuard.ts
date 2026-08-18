/**
 * brandGuard.ts — NEXUS Brand Voice Guardrails (#96)
 *
 * 7 enforcement surfaces:
 *   1. BANNED_WORDS          — 6-category banned vocabulary Map
 *   2. bannedWordScanner()   — regex-based scanner with positions + suggestions
 *   3. canonicalTierNameCheck() — tier naming compliance (tierConfig-aware)
 *   4. internalFrameworkCheck()  — internal codenames never leak externally
 *   5. structureValidator()      — response structural rules
 *   6. signatureBlockEnforcer()  — NEXUS identity signature rules
 *   7. QualityGate.audit()       — composes all checks, returns structured report
 *
 * Uses canonical tier imports from @/config/tierConfig (#1340).
 */

import { TIER_META, TIER_KEYS, tierDisplayName, normalizeTier, TierKey } from '@/config/tierConfig';

// ─────────────────────────────────────────────────────────────────────────────
// 1. BANNED_WORDS — 6 categories from ticket #96
// ─────────────────────────────────────────────────────────────────────────────

export type BannedCategory =
  | 'free_tier_naming'
  | 'free_actions'
  | 'saas_language'
  | 'ai_bro_language'
  | 'generic_hype'
  | 'casual_words'
  | 'internal_framework_names';

export interface BannedWordEntry {
  word: string;
  category: BannedCategory;
  /** Replacement suggestion. "—" means pure ban with no acceptable substitute. */
  suggestion: string;
  /** Severity: hard = block response, soft = flag only */
  severity: 'hard' | 'soft';
}

const _BANNED: Array<BannedWordEntry> = [
  // ── Category 1: free_tier_naming (NEVER say "free" tier) ──────────────
  { word: 'free tier', category: 'free_tier_naming', suggestion: 'Executive Introduction', severity: 'hard' },
  { word: 'free plan', category: 'free_tier_naming', suggestion: 'Executive Introduction', severity: 'hard' },
  { word: 'free level', category: 'free_tier_naming', suggestion: 'Executive Introduction', severity: 'hard' },
  { word: 'explorer tier', category: 'free_tier_naming', suggestion: 'Executive Introduction', severity: 'hard' },
  { word: 'starter tier', category: 'free_tier_naming', suggestion: 'Professional', severity: 'soft' },

  // ── Category 2: free_actions (complimentary, not free) ───────────────
  { word: 'free', category: 'free_actions', suggestion: 'complimentary', severity: 'hard' },
  { word: 'for free', category: 'free_actions', suggestion: 'as a compliment', severity: 'hard' },
  { word: 'free trial', category: 'free_actions', suggestion: 'Executive Introduction', severity: 'hard' },
  { word: 'try free', category: 'free_actions', suggestion: 'begin exploration', severity: 'hard' },
  { word: 'get free', category: 'free_actions', suggestion: 'receive as a compliment', severity: 'hard' },
  { word: 'free preview', category: 'free_actions', suggestion: 'assessment preview', severity: 'hard' },
  { word: 'unlimited', category: 'free_actions', suggestion: 'extensive', severity: 'hard' },
  { word: 'unlimited access', category: 'free_actions', suggestion: 'full access', severity: 'hard' },
  { word: 'no credit card', category: 'free_actions', suggestion: '—', severity: 'hard' },
  { word: 'cancel anytime', category: 'free_actions', suggestion: '—', severity: 'hard' },

  // ── Category 3: saas_language (premium positioning, not SaaS) ────────
  { word: 'platform', category: 'saas_language', suggestion: 'system', severity: 'soft' },
  { word: 'dashboard', category: 'saas_language', suggestion: 'overview', severity: 'soft' },
  { word: 'users', category: 'saas_language', suggestion: 'members', severity: 'hard' },
  { word: 'user account', category: 'saas_language', suggestion: 'profile', severity: 'hard' },
  { word: 'feature', category: 'saas_language', suggestion: 'capability', severity: 'hard' },
  { word: 'features', category: 'saas_language', suggestion: 'capabilities', severity: 'hard' },
  { word: 'subscription plan', category: 'saas_language', suggestion: 'membership', severity: 'hard' },
  { word: 'pricing plan', category: 'saas_language', suggestion: 'tier', severity: 'hard' },
  { word: 'powered by', category: 'saas_language', suggestion: '—', severity: 'hard' },
  { word: 'seamless', category: 'saas_language', suggestion: 'integrated', severity: 'hard' },
  { word: 'leverage', category: 'saas_language', suggestion: 'apply', severity: 'hard' },
  { word: 'synergy', category: 'saas_language', suggestion: '—', severity: 'hard' },
  { word: 'streamline', category: 'saas_language', suggestion: 'refine', severity: 'hard' },
  { word: 'empower', category: 'saas_language', suggestion: 'equip', severity: 'hard' },
  { word: 'onboarding', category: 'saas_language', suggestion: 'profile setup', severity: 'hard' },

  // ── Category 4: ai_bro language (never reveal internals) ────────────
  { word: 'chatbot', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'virtual assistant', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'as an AI', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'as a language model', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'I am an AI', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'my training', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'I was trained', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'LLM', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'GPT', category: 'ai_bro_language', suggestion: '—', severity: 'hard' },
  { word: 'prompt', category: 'ai_bro_language', suggestion: 'question', severity: 'soft' },
  { word: 'token', category: 'ai_bro_language', suggestion: '—', severity: 'soft' },

  // ── Category 5: generic hype (empty adjectives) ──────────────────────
  { word: 'revolutionize', category: 'generic_hype', suggestion: 'transform', severity: 'hard' },
  { word: 'cutting-edge', category: 'generic_hype', suggestion: 'distinguished', severity: 'hard' },
  { word: 'state-of-the-art', category: 'generic_hype', suggestion: 'distinguished', severity: 'hard' },
  { word: 'world-class', category: 'generic_hype', suggestion: 'distinguished', severity: 'hard' },
  { word: 'game changer', category: 'generic_hype', suggestion: '—', severity: 'hard' },
  { word: 'next generation', category: 'generic_hype', suggestion: '—', severity: 'hard' },
  { word: 'disruptive', category: 'generic_hype', suggestion: '—', severity: 'hard' },
  { word: 'best value', category: 'generic_hype', suggestion: 'most chosen', severity: 'hard' },
  { word: 'most popular', category: 'generic_hype', suggestion: 'most chosen', severity: 'hard' },
  { word: 'awesome', category: 'generic_hype', suggestion: '—', severity: 'hard' },
  { word: 'amazing', category: 'generic_hype', suggestion: '—', severity: 'hard' },
  { word: 'incredible', category: 'generic_hype', suggestion: '—', severity: 'hard' },

  // ── Category 6: casual words (premium tone, not casual) ─────────────
  { word: 'hey', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'hi there', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'cool', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'super', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'super easy', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'easy peasy', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'no worries', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'boom', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'voila', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'ta-da', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'you got this', category: 'casual_words', suggestion: '—', severity: 'hard' },
  { word: 'believe in yourself', category: 'casual_words', suggestion: '—', severity: 'hard' },

  // ── Category 7: internal framework names (Phase 0-3 codenames) ─────
  { word: 'phase 0', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 1', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 2', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 3', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 4', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 5', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 6', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 7', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 8', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 9', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 10', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 11', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 12', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 13', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 14', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'phase 15', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'ticket #', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'ticket number', category: 'internal_framework_names', suggestion: '—', severity: 'soft' },
  { word: 'prism config', category: 'internal_framework_names', suggestion: 'PRISM framework', severity: 'soft' },
  { word: 'spark config', category: 'internal_framework_names', suggestion: 'SPARK framework', severity: 'soft' },
  { word: 'forge config', category: 'internal_framework_names', suggestion: 'FORGE framework', severity: 'soft' },
  { word: 'drive config', category: 'internal_framework_names', suggestion: 'DRIVE framework', severity: 'soft' },
  { word: 'bridge config', category: 'internal_framework_names', suggestion: 'BRIDGE framework', severity: 'soft' },
  { word: 'mosaic config', category: 'internal_framework_names', suggestion: 'MOSAIC framework', severity: 'soft' },
  { word: 'leap config', category: 'internal_framework_names', suggestion: 'LEAP framework', severity: 'soft' },
  { word: 'quest config', category: 'internal_framework_names', suggestion: 'QUEST framework', severity: 'soft' },
  { word: 'impact config', category: 'internal_framework_names', suggestion: 'IMPACT framework', severity: 'soft' },
  { word: 'coach config', category: 'internal_framework_names', suggestion: 'COACH framework', severity: 'soft' },
  { word: 'cpi config', category: 'internal_framework_names', suggestion: 'CPI framework', severity: 'soft' },
];

/**
 * BANNED_WORDS Map — keyed by lowercase banned phrase for O(1) lookup.
 * 7 categories: free_tier_naming, free_actions, saas_language,
 * ai_bro_language, generic_hype, casual_words, internal_framework_names.
 */
export const BANNED_WORDS: Map<string, BannedWordEntry> = (() => {
  const m = new Map<string, BannedWordEntry>();
  for (const entry of _BANNED) {
    m.set(entry.word.toLowerCase(), entry);
  }
  return m;
})();

// ─────────────────────────────────────────────────────────────────────────────
// 2. bannedWordScanner() — regex-based scanner with positions + suggestions
// ─────────────────────────────────────────────────────────────────────────────

export interface BannedWordHit {
  word: string;
  matchedText: string;
  category: BannedCategory;
  suggestion: string;
  severity: 'hard' | 'soft';
  /** 0-based character offset in the input text */
  position: number;
}

export function bannedWordScanner(text: string): BannedWordHit[] {
  if (!text || !text.trim()) return [];

  const hits: BannedWordHit[] = [];
  const lower = text.toLowerCase();

  for (const [bannedLower, entry] of BANNED_WORDS.entries()) {
    const escaped = bannedLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      hits.push({
        word: entry.word,
        matchedText: match[0],
        category: entry.category,
        suggestion: entry.suggestion,
        severity: entry.severity,
        position: match.index,
      });
    }
  }

  hits.sort((a, b) => a.position - b.position);
  return hits;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. canonicalTierNameCheck() — tier naming compliance (tierConfig-aware)
// ─────────────────────────────────────────────────────────────────────────────

export interface TierNamingViolation {
  /** Detected non-canonical tier reference */
  detected: string;
  /** Position in text */
  position: number;
  /** What it should say instead (from tierDisplayName()) */
  expected: string;
  /** True if this is a legacy key that maps via TIER_LEGACY_MAP */
  isLegacyKey: boolean;
}

const CANONICAL_TIER_NAMES: Record<string, TierKey> = {};
for (const k of TIER_KEYS) {
  CANONICAL_TIER_NAMES[k.toLowerCase()] = k;
  const display = TIER_META[k].displayName.toLowerCase();
  if (display !== k.toLowerCase()) {
    CANONICAL_TIER_NAMES[display] = k;
  }
}

const ACCEPTABLE_TIER_TOKENS_LOWER = new Set<string>();
for (const k of TIER_KEYS) {
  ACCEPTABLE_TIER_TOKENS_LOWER.add(k.toLowerCase());
  ACCEPTABLE_TIER_TOKENS_LOWER.add(TIER_META[k].displayName.toLowerCase());
}
ACCEPTABLE_TIER_TOKENS_LOWER.add('executive introduction');

const SUSPECT_TIER_PATTERNS: Array<{ pattern: RegExp; legacyKey?: string }> = [
  { pattern: /\bexplorer\s+tier\b/i },
  { pattern: /\bexplorer\b/i, legacyKey: 'explorer' },
  { pattern: /\bstarter\s+tier\b/i, legacyKey: 'starter' },
  { pattern: /\bpro\s+tier\b/i, legacyKey: 'pro' },
  { pattern: /\bexecutive\s+tier\b/i, legacyKey: 'executive' },
  { pattern: /\bcouncil\s+tier\b/i, legacyKey: 'council' },
  { pattern: /\benterprise\s+tier\b/i },
];

export function canonicalTierNameCheck(text: string): TierNamingViolation[] {
  if (!text || !text.trim()) return [];

  const violations: TierNamingViolation[] = [];

  for (const { pattern, legacyKey } of SUSPECT_TIER_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const detected = match[0];
      const lower = detected.toLowerCase();
      if (ACCEPTABLE_TIER_TOKENS_LOWER.has(lower.replace(/\s+tier$/i, '').trim())) {
        continue;
      }
      const normalized = legacyKey ? normalizeTier(legacyKey) : null;
      const expected = normalized ? tierDisplayName(normalized) : 'Executive Introduction';
      violations.push({
        detected,
        position: match.index,
        expected,
        isLegacyKey: Boolean(legacyKey),
      });
    }
  }

  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. internalFrameworkCheck() — internal codenames never leak externally
// ─────────────────────────────────────────────────────────────────────────────

export interface InternalFrameworkHit {
  matched: string;
  position: number;
  type: 'phase_ref' | 'ticket_ref' | 'codename_ref' | 'config_ref';
  severity: 'hard' | 'soft';
  suggestion: string;
}

const INTERNAL_PATTERNS: Array<{ regex: RegExp; type: InternalFrameworkHit['type']; severity: 'hard' | 'soft'; suggestion: string }> = [
  {
    regex: /\bphase\s*[0-9]{1,2}(\.[0-9]+)?(\s*\.|$|\b)/gi,
    type: 'phase_ref',
    severity: 'soft',
    suggestion: 'Do not reference internal phase numbers externally.',
  },
  {
    regex: /(?:ticket|issue|bug)\s*#?\s*[0-9]{3,6}/gi,
    type: 'ticket_ref',
    severity: 'soft',
    suggestion: 'Do not reference internal ticket numbers externally.',
  },
  {
    regex: /\b(prism|spark|forge|drive|bridge|mosaic|leap|quest|impact|coach|cpi)\s+config\b/gi,
    type: 'config_ref',
    severity: 'soft',
    suggestion: 'Refer to "<CODE> framework" not "<CODE> config".',
  },
  {
    regex: /\b(?:akira|trident|nexus\s+v1|nexus\s+v2|phase\s+0\.5)\b/gi,
    type: 'codename_ref',
    severity: 'soft',
    suggestion: 'Use public product names only.',
  },
];

export function internalFrameworkCheck(text: string): InternalFrameworkHit[] {
  if (!text || !text.trim()) return [];

  const hits: InternalFrameworkHit[] = [];
  for (const { regex, type, severity, suggestion } of INTERNAL_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      hits.push({
        matched: match[0],
        position: match.index,
        type,
        severity,
        suggestion,
      });
    }
  }
  hits.sort((a, b) => a.position - b.position);
  return hits;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. structureValidator() — response structural rules
// ─────────────────────────────────────────────────────────────────────────────

export interface StructureIssue {
  rule: string;
  severity: 'hard' | 'soft';
  details: string;
}

export interface StructureValidatorOptions {
  /** Max paragraphs per turn (default: 3). NEXUS = economical with words. */
  maxParagraphs?: number;
  /** Min sentence length for anything flagged as "too short" (default: 12 chars). */
  minSentenceLength?: number;
  /** If true, reject emoji (premium tone, no emoji in prose). */
  forbidEmoji?: boolean;
}

const EMOJI_REGEX = /[\p{Extended_Pictographic}]/u;

export function structureValidator(
  text: string,
  opts: StructureValidatorOptions = {},
): StructureIssue[] {
  const {
    maxParagraphs = 3,
    minSentenceLength = 12,
    forbidEmoji = true,
  } = opts;

  const issues: StructureIssue[] = [];
  if (!text || !text.trim()) {
    issues.push({ rule: 'empty_response', severity: 'hard', details: 'Response is empty.' });
    return issues;
  }

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  if (paragraphs.length > maxParagraphs) {
    issues.push({
      rule: 'too_many_paragraphs',
      severity: 'soft',
      details: `Response has ${paragraphs.length} paragraphs; max ${maxParagraphs} per turn.`,
    });
  }

  const totalLen = text.length;
  if (totalLen > 1200) {
    issues.push({
      rule: 'response_too_long',
      severity: 'soft',
      details: `Response is ${totalLen} chars. Keep under 1200 chars per turn.`,
    });
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  for (const s of sentences) {
    if (s.trim().length < minSentenceLength && s.trim().length > 0 && !/^[0-9]+\./.test(s.trim())) {
      issues.push({
        rule: 'sentence_too_short',
        severity: 'soft',
        details: `Short sentence (${s.trim().length} chars): "${s.trim().slice(0, 60)}"`,
      });
    }
  }

  if (forbidEmoji && EMOJI_REGEX.test(text)) {
    issues.push({
      rule: 'emoji_present',
      severity: 'hard',
      details: 'Emoji detected. Premium prose does not use emoji.',
    });
  }

  const chatbotPhrases = [
    /as an ai language model/i,
    /i('m| am) here to help/i,
    /i('m| am) an ai/i,
    /i don'?t have (personal )?opinions/i,
    /i was (created|built|trained)/i,
  ];
  for (const re of chatbotPhrases) {
    if (re.test(text)) {
      issues.push({
        rule: 'chatbot_self_reference',
        severity: 'hard',
        details: 'NEXUS never self-identifies as an AI or chatbot.',
      });
      break;
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. signatureBlockEnforcer() — NEXUS identity signature rules
// ─────────────────────────────────────────────────────────────────────────────

export interface SignatureIssue {
  rule: string;
  severity: 'hard' | 'soft';
  details: string;
}

export const NEXUS_SYSTEM_PROMPT_BASE: string = `You are NEXUS, LYC Partners' executive intelligence assistant.

You are the intelligent front door of LYC Intelligence. LYC Partners has placed 500+ executives across 47 markets over 20 years. You carry that institutional knowledge into this conversation.

One in three cross-border executive moves fails within 18 months. Usually for the same reasons.

=== IDENTITY ===
- You are not a chatbot, not an assistant, and not a FAQ responder.
- You are the first interaction a senior executive has with LYC Intelligence.
- Your job: probe context, surface blind spots, lead into the right diagnostic framework.

=== TONE ===
- PROACTIVE. Ask questions the user hasn't thought of.
- INQUISITIVE. Lead with diagnostic questions, not generic answers.
- SURFACE BLIND SPOTS. When a user says "I want X", respond with what underpins X.
- CONFIDENT BUT NOT BOMBASTIC. 20-year veteran executive advisor, not content writer.
- ECONOMICAL. One paragraph max per turn. Depth comes via focused exchanges.
- NEVER say "as an AI" or "I'm here to help". NEVER apologise for existing.

=== CURRENCY & TIERS ===
- Currency = miles. NEVER say "credits".
- 5 canonical tiers: Executive Introduction < Professional < Executive < Council < Enterprise.
- Executive Introduction: NEVER say "free" — always "Executive Introduction" or "complimentary".
- Starter+ subscribers receive monthly miles on billing anniversary.
- NEXUS never delivers full personalised assessment reports outside the assessment flow.

=== CONFIDENTIALITY ===
Every conversation is confidential. Nothing shared is used to train public-facing models. You keep a confidence the way an executive coach keeps a confidence.`;

export function signatureBlockEnforcer(text: string): SignatureIssue[] {
  const issues: SignatureIssue[] = [];
  if (!text || !text.trim()) return issues;

  const lower = text.toLowerCase();

  if (/\bfree\b/.test(lower) && !/\bfreeman\b/.test(lower)) {
    issues.push({
      rule: 'banned_word_free',
      severity: 'hard',
      details: 'The word "free" is banned. Use "complimentary" or "Executive Introduction".',
    });
  }

  if (/\bcredit(s)?\b/.test(lower)) {
    issues.push({
      rule: 'banned_word_credits',
      severity: 'hard',
      details: 'The word "credits" is banned. Use "miles".',
    });
  }

  if (/chatbot|virtual assistant|as an ai|as a language model/i.test(text)) {
    issues.push({
      rule: 'identity_break',
      severity: 'hard',
      details: 'NEXUS must never self-identify as AI/chatbot/assistant.',
    });
  }

  if (/i('m| am) sorry|apolog|i apologise/i.test(text) && !/we regret|unfortunately/i.test(text)) {
    issues.push({
      rule: 'apology_for_existing',
      severity: 'soft',
      details: 'NEXUS does not apologise for existing. Re-frame apologies as regrets only when warranted.',
    });
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. QualityGate class — composes all checks, returns structured audit report
// ─────────────────────────────────────────────────────────────────────────────

export interface QualityAuditReport {
  passed: boolean;
  score: number;
  hardViolations: number;
  softViolations: number;
  details: {
    bannedWords: BannedWordHit[];
    tierNaming: TierNamingViolation[];
    internalFramework: InternalFrameworkHit[];
    structure: StructureIssue[];
    signature: SignatureIssue[];
  };
  summary: string;
}

export class QualityGate {
  private structureOpts: StructureValidatorOptions;

  constructor(opts: StructureValidatorOptions = {}) {
    this.structureOpts = opts;
  }

  /**
   * Run the full audit pipeline. Returns a structured report with:
   *   - passed: true iff zero hard violations
   *   - score: 0–100 (hard violations weigh 20pts, soft 5pts)
   *   - details: all hits grouped by surface
   *   - summary: 1-line human-readable summary
   */
  audit(text: string): QualityAuditReport {
    const bannedWords = bannedWordScanner(text);
    const tierNaming = canonicalTierNameCheck(text);
    const internalFramework = internalFrameworkCheck(text);
    const structure = structureValidator(text, this.structureOpts);
    const signature = signatureBlockEnforcer(text);

    let hard = 0;
    let soft = 0;

    for (const h of bannedWords) hard += h.severity === 'hard' ? 1 : 0, soft += h.severity === 'soft' ? 1 : 0;
    hard += tierNaming.length;
    for (const h of internalFramework) hard += h.severity === 'hard' ? 1 : 0, soft += h.severity === 'soft' ? 1 : 0;
    for (const h of structure) hard += h.severity === 'hard' ? 1 : 0, soft += h.severity === 'soft' ? 1 : 0;
    for (const h of signature) hard += h.severity === 'hard' ? 1 : 0, soft += h.severity === 'soft' ? 1 : 0;

    const score = Math.max(0, 100 - hard * 20 - soft * 5);
    const passed = hard === 0;

    const summary = passed
      ? soft === 0
        ? `Passed cleanly (${score}/100).`
        : `Passed with ${soft} soft flag${soft === 1 ? '' : 's'} (${score}/100).`
      : `BLOCKED — ${hard} hard violation${hard === 1 ? '' : 's'}, ${soft} soft flag${soft === 1 ? '' : 's'} (${score}/100).`;

    return {
      passed,
      score,
      hardViolations: hard,
      softViolations: soft,
      details: { bannedWords, tierNaming, internalFramework, structure, signature },
      summary,
    };
  }

  /** Convenience: true iff audit(text).passed. */
  passes(text: string): boolean {
    return this.audit(text).passed;
  }
}
