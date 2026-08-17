/**
 * brandGuardrails.ts — Unified banned word enforcement from canon.
 *
 * Batch 2B / Ticket 4: Brand language guardrails (hard rules).
 * Unifies the 3 competing banned-word lists into one canon-aligned
 * scanner. Reads from config/voiceStandard.ts only.
 */
import {
  BANNED_WORDS,
  type BannedWordEntry,
  BANNED_ENTITY_REFERENCES,
  ENTITY_NAME,
  BANNED_PROGRESS_TERMS,
  PROGRESS_TERM,
} from '@/config/voiceStandard';

export interface BrandViolation {
  word: string;
  suggestion: string;
  severity: 'hard' | 'soft' | 'warning';
  category: string;
  position: number;
  context: string;
}

/**
 * Scan text for banned words.
 * Returns all violations with positions and context.
 */
export function scanBannedWords(text: string): BrandViolation[] {
  const violations: BrandViolation[] = [];
  const lower = text.toLowerCase();

  for (const entry of BANNED_WORDS) {
    const wordLower = entry.word.toLowerCase();
    let idx = lower.indexOf(wordLower);
    while (idx !== -1) {
      // Check word boundary for single words (not phrases)
      const isPhrase = entry.word.includes(' ');
      if (isPhrase || isWordBoundary(text, idx, entry.word.length)) {
        const contextStart = Math.max(0, idx - 20);
        const contextEnd = Math.min(text.length, idx + entry.word.length + 20);
        violations.push({
          ...entry,
          position: idx,
          context: text.slice(contextStart, contextEnd),
        });
      }
      idx = lower.indexOf(wordLower, idx + 1);
    }
  }

  return violations;
}

/**
 * Scan for banned entity references ("the coach", "the AI", etc.).
 */
export function scanEntityReferences(text: string): BrandViolation[] {
  const violations: BrandViolation[] = [];
  const lower = text.toLowerCase();

  for (const ref of BANNED_ENTITY_REFERENCES) {
    const idx = lower.indexOf(ref.toLowerCase());
    if (idx !== -1) {
      violations.push({
        word: ref,
        suggestion: ENTITY_NAME,
        severity: 'hard',
        category: 'entity_reference',
        position: idx,
        context: text.slice(Math.max(0, idx - 20), idx + ref.length + 20),
      });
    }
  }

  return violations;
}

/**
 * Scan for banned progress terms ("bookmarks", "dashboard items", etc.).
 */
export function scanProgressTerms(text: string): BrandViolation[] {
  const violations: BrandViolation[] = [];
  const lower = text.toLowerCase();

  for (const term of BANNED_PROGRESS_TERMS) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx !== -1) {
      violations.push({
        word: term,
        suggestion: PROGRESS_TERM,
        severity: 'soft',
        category: 'progress_term',
        position: idx,
        context: text.slice(Math.max(0, idx - 20), idx + term.length + 20),
      });
    }
  }

  return violations;
}

/**
 * Full brand guardrail audit.
 */
export interface BrandAuditResult {
  passed: boolean; // true = zero hard violations
  hardViolations: BrandViolation[];
  softFlags: BrandViolation[];
  /** WARNING tier — flagged for context evaluation, not blocking. P0-3. */
  warningFlags: BrandViolation[];
  totalViolations: number;
  summary: string;
}

export function auditBrandCompliance(text: string): BrandAuditResult {
  const banned = scanBannedWords(text);
  const entity = scanEntityReferences(text);
  const progress = scanProgressTerms(text);

  const all = [...banned, ...entity, ...progress];
  const hardViolations = all.filter((v) => v.severity === 'hard');
  const softFlags = all.filter((v) => v.severity === 'soft');
  const warningFlags = all.filter((v) => v.severity === 'warning');

  const passed = hardViolations.length === 0;
  const summary = passed
    ? `PASS — ${softFlags.length} soft flag(s), ${warningFlags.length} warning(s)`
    : `BLOCKED — ${hardViolations.length} hard violation(s), ${softFlags.length} soft flag(s), ${warningFlags.length} warning(s)`;

  return { passed, hardViolations, softFlags, warningFlags, totalViolations: all.length, summary };
}

/**
 * Check if text contains any tier name (Starter/Pro/Executive/Council/Explorer).
 * Tier names must never appear in coach dialogue.
 */
export function containsTierNames(text: string): string[] {
  const tierNames = ['Starter', 'Professional', 'Executive', 'Council', 'Explorer'];
  const found: string[] = [];
  for (const tier of tierNames) {
    // Match tier name followed by "tier" or standalone (case-sensitive to avoid false positives)
    const re = new RegExp(`\\b${tier}\\s*(?:tier|plan|subscription|membership)\\b`, 'i');
    if (re.test(text)) {
      found.push(tier);
    }
  }
  return found;
}

/**
 * Check if text mentions DEX AI (should never be mentioned unless directly asked).
 */
export function mentionsDexAI(text: string): boolean {
  return /\b(DEX|DEX AI|dex\.ai)\b/i.test(text);
}

/**
 * Check if text contains internal codenames.
 */
export function containsCodenames(text: string): string[] {
  const codenames = ['TRIDENT', 'MERIDIAN', 'CANVAS', 'SHIFT'];
  const found: string[] = [];
  for (const code of codenames) {
    if (new RegExp(`\\b${code}\\b`).test(text)) {
      found.push(code);
    }
  }
  return found;
}

/**
 * Check if text contains archetype labels (should not appear in chat).
 */
export function containsArchetypeLabels(text: string): string[] {
  // Common archetype label patterns
  const archetypePatterns = [
    /\bThe (Architect|Strategist|Pioneer|Catalyst|Anchor|Steward|Cultivator|Guardian|Diplomat|Convener|Translator|Champion|Analyst|Visionary|Founder)\b/g,
    /\b(Glass Ceiling|Shallow Bench|Cultural Mismatch|Leaky Bucket|External Dependency|World-Class Pipeline)\b/g,
  ];
  const found: string[] = [];
  for (const re of archetypePatterns) {
    const matches = text.match(re);
    if (matches) found.push(...matches);
  }
  return found;
}

// ── Helpers ──

function isWordBoundary(text: string, idx: number, wordLen: number): boolean {
  const before = idx > 0 ? text[idx - 1] : ' ';
  const after = idx + wordLen < text.length ? text[idx + wordLen] : ' ';
  return !/\w/.test(before) && !/\w/.test(after);
}
