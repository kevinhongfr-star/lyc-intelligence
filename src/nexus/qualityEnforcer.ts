/**
 * qualityEnforcer.ts — 8-dimension quality scoring + AI-tell detection.
 *
 * Batch 2B / Ticket 3: Quality enforcement system.
 * Scores responses against the 8-dimension model, detects AI-tells,
 * checks lead-with-point structure, paragraph control, and active voice.
 *
 * The 3.8/5.0 bar is constant across all tiers.
 */
import {
  QUALITY_DIMENSIONS,
  QUALITY_BAR,
  QUALITY_MAX,
  STYLE_RULES,
  AI_TELL_PATTERNS,
} from '@/config/voiceStandard';

export interface QualityScore {
  dimension: string;
  label: string;
  score: number; // 0-5
  weight: number;
  weightedScore: number;
  notes: string;
}

export interface QualityAuditResult {
  scores: QualityScore[];
  overall: number; // 0-5 weighted
  passes: boolean; // overall >= 3.8
  hardViolations: string[];
  softFlags: string[];
  summary: string;
}

/**
 * Detect AI-tell patterns in a response.
 */
export function detectAITells(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const pattern of AI_TELL_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      found.push(pattern);
    }
  }
  return found;
}

/**
 * Check lead-with-the-point structure.
 * First sentence should be the most important point, not a filler opener.
 */
export function checkLeadWithPoint(text: string): { passes: boolean; firstSentence: string } {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return { passes: false, firstSentence: '' };

  const first = sentences[0].trim();
  const fillerOpeners = [
    /^(great|good|excellent|interesting|wonderful|fantastic)\b/i,
    /^(i (understand|see|note|appreciate|agree))\b/i,
    /^(thank you|thanks)\b/i,
    /^(that'?s (a (great|good|wonderful|fascinating)|an (interesting|important)))\b/i,
    /^(let me|allow me to|i'?ll|i will)\b/i,
    /^(of course|certainly|absolutely|sure)\b/i,
    /^(it'?s (important to note|worth noting|interesting that))\b/i,
  ];

  const passes = !fillerOpeners.some((re) => re.test(first));
  return { passes, firstSentence: first };
}

/**
 * Check paragraph length control.
 */
export function checkParagraphControl(text: string): { passes: boolean; violations: string[] } {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const violations: string[] = [];

  if (paragraphs.length > STYLE_RULES.maxParagraphs) {
    violations.push(`Too many paragraphs: ${paragraphs.length} (max ${STYLE_RULES.maxParagraphs})`);
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const sentences = paragraphs[i].split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    if (sentences.length > STYLE_RULES.maxSentencesPerParagraph) {
      violations.push(`Paragraph ${i + 1}: ${sentences.length} sentences (max ${STYLE_RULES.maxSentencesPerParagraph})`);
    }
  }

  if (text.length > STYLE_RULES.maxResponseChars) {
    violations.push(`Response too long: ${text.length} chars (max ${STYLE_RULES.maxResponseChars})`);
  }

  return { passes: violations.length === 0, violations };
}

/**
 * Check for exclamation points.
 */
export function checkExclamationPoints(text: string): { passes: boolean; count: number } {
  const count = (text.match(/!/g) || []).length;
  return { passes: count === 0, count };
}

/**
 * Check for emoji.
 */
export function checkEmoji(text: string): { passes: boolean; found: string[] } {
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const found = text.match(emojiRegex) || [];
  return { passes: found.length === 0, found };
}

/**
 * Check for passive voice overuse (heuristic).
 */
export function checkActiveVoice(text: string): { passes: boolean; passiveCount: number } {
  const passiveIndicators = [
    /\b(was|were|been|being|is|are|am)\s+\w+(ed|en)\b/gi,
    /\b(was|were|been|being|is|are|am)\s+being\s+\w+ed\b/gi,
  ];
  let passiveCount = 0;
  for (const re of passiveIndicators) {
    passiveCount += (text.match(re) || []).length;
  }
  // Allow up to 2 passive constructions per response
  return { passes: passiveCount <= 2, passiveCount };
}

/**
 * Full quality audit of a response.
 * Scores all 8 dimensions and computes the weighted overall score.
 */
export function auditQuality(text: string): QualityAuditResult {
  const scores: QualityScore[] = [];
  const hardViolations: string[] = [];
  const softFlags: string[] = [];

  // 1. AI-tell detection (affects coach_presence + brand_compliance)
  const aiTells = detectAITells(text);
  if (aiTells.length > 0) {
    hardViolations.push(`AI-tells detected: ${aiTells.join(', ')}`);
  }

  // 2. Lead-with-point check (affects structural_clarity)
  const leadCheck = checkLeadWithPoint(text);
  if (!leadCheck.passes) {
    softFlags.push(`Does not lead with the point: "${leadCheck.firstSentence.slice(0, 60)}..."`);
  }

  // 3. Paragraph control (affects structural_clarity + appropriate_depth)
  const paraCheck = checkParagraphControl(text);
  if (!paraCheck.passes) {
    paraCheck.violations.forEach((v) => softFlags.push(v));
  }

  // 4. Exclamation points (affects brand_compliance)
  const exclCheck = checkExclamationPoints(text);
  if (!exclCheck.passes) {
    softFlags.push(`${exclCheck.count} exclamation point(s) — none allowed`);
  }

  // 5. Emoji check (affects brand_compliance)
  const emojiCheck = checkEmoji(text);
  if (!emojiCheck.passes) {
    hardViolations.push(`Emoji detected: ${emojiCheck.found.join(', ')}`);
  }

  // 6. Active voice (affects insight_quality)
  const voiceCheck = checkActiveVoice(text);
  if (!voiceCheck.passes) {
    softFlags.push(`Passive voice overuse: ${voiceCheck.passiveCount} instances`);
  }

  // Score each dimension
  for (const dim of QUALITY_DIMENSIONS) {
    let score = 5.0; // Start at max, deduct for issues
    let notes = '';

    switch (dim.id) {
      case 'coach_presence':
        if (aiTells.length > 0) { score = 1.5; notes = `AI-tells: ${aiTells.length}`; }
        else if (text.length < 50) { score = 2.5; notes = 'Response too short for coach presence'; }
        else { score = 4.2; notes = 'Adequate presence'; }
        break;

      case 'structural_clarity':
        if (!leadCheck.passes) score -= 1.0;
        if (!paraCheck.passes) score -= 0.8;
        notes = `Lead: ${leadCheck.passes ? 'pass' : 'fail'}, Paragraphs: ${paraCheck.passes ? 'pass' : 'fail'}`;
        break;

      case 'brand_compliance':
        if (aiTells.length > 0) score -= 2.0;
        if (!exclCheck.passes) score -= 0.5;
        if (!emojiCheck.passes) score = 0;
        notes = `${hardViolations.length} hard, ${softFlags.length} soft`;
        break;

      case 'insight_quality':
        if (voiceCheck.passiveCount > 2) score -= 0.8;
        if (text.length < 100) score -= 1.0;
        notes = voiceCheck.passes ? 'Active voice' : `${voiceCheck.passiveCount} passive constructions`;
        break;

      case 'diagnostic_accuracy':
        // Checked separately by diagnosticGuardrails — assume pass here
        score = 4.5;
        notes = 'Diagnostic accuracy checked by guardrail module';
        break;

      case 'canon_alignment':
        // Heuristic: does the response align with approved brand voice, diagnostic canon, and quality guardrails?
        const hasCanonAlignment = /NEXUS|complimentary|miles|milestones/.test(text);
        score = hasCanonAlignment ? 4.3 : 3.8;
        notes = hasCanonAlignment ? 'Aligns with brand voice and canon' : 'Brand voice or canon misalignment';
        break;

      case 'question_quality':
        const hasQuestion = text.includes('?');
        score = hasQuestion ? 4.0 : 3.2;
        notes = hasQuestion ? 'Contains probing question' : 'No question in response';
        break;

      case 'appropriate_depth':
        if (text.length > STYLE_RULES.maxResponseChars) score -= 1.5;
        if (text.length < 100) score -= 1.0;
        notes = `${text.length} chars`;
        break;
    }

    score = Math.max(0, Math.min(5, score));
    const weightedScore = (score / 5) * (dim.weight / 100) * 5;
    scores.push({
      dimension: dim.id,
      label: dim.label,
      score: Math.round(score * 10) / 10,
      weight: dim.weight,
      weightedScore: Math.round(weightedScore * 10) / 10,
      notes,
    });
  }

  // Weighted overall score
  const overall = scores.reduce((sum, s) => sum + s.weightedScore, 0);
  const overallRounded = Math.round(overall * 10) / 10;

  const passes = overallRounded >= QUALITY_BAR;
  const summary = `${passes ? 'PASS' : 'FAIL'} — ${overallRounded}/${QUALITY_MAX} (bar: ${QUALITY_BAR}). ${hardViolations.length} hard, ${softFlags.length} soft.`;

  return { scores, overall: overallRounded, passes, hardViolations, softFlags, summary };
}
