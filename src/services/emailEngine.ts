/**
 * services/emailEngine.ts — #1348 B2C Email Engine:
 *   #101 EmailValidator          structural checks before sending
 *   #102 BrandLens               ensures brand-accent + tier language
 *   #103 VoiceEngine             maps email type → tone, copy rules
 *   #104 ContentGenerator       optional AI-enhanced subject/preheader
 *   #105 VariableSubstitution    {{template_var}} → value
 *   #106 BannedWordScanner       post-render audit against banned word list
 *
 * Pipeline order (runEmailPipeline):
 *   selectTemplate → #105 substitute → #104 content gen → #103 apply voice →
 *   #102 apply brand lens → #106 scan → #101 validate → provider send.
 *
 * 8 B2C email templates (registered in TEMPLATE_REGISTRY below):
 *   1. welcome
 *   2. assessment_complete
 *   3. email_verification
 *   4. password_reset
 *   5. upgrade_confirmation
 *   6. weekly_digest
 *   7. nexus_conversation_summary
 *   8. share_result  (web template also exists in components/email/ShareResultEmail)
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.browser';
import type { DiagnosticSlug } from '@/types/assessment';
import { DIAGNOSTIC_ACCENTS } from '@/types/reportTokens';
import { VOICE_PRINCIPLES, TONE_BY_CONTEXT } from '@/constants/brandVoice';
import { QualityGate, bannedWordScanner, canonicalTierNameCheck } from '@/nexus/brandGuard';
import { normalizeBrandPhrases } from '@/services/aiPromptLibrary';
import type { TierKey } from '@/config/tierConfig';
import { TIER_META } from '@/config/tierConfig';
import { DeepSeekClient, type DeepSeekChatResult } from '@/nexus/deepseekClient';
import { deductMiles, refundMiles } from '@/services/creditService';

const deepseek = new DeepSeekClient();

import { WelcomeEmailTemplate } from '@/components/email/WelcomeEmail';
import { AssessmentCompleteEmailTemplate } from '@/components/email/AssessmentCompleteEmail';
import { EmailVerificationEmailTemplate } from '@/components/email/EmailVerificationEmail';
import { PasswordResetEmailTemplate } from '@/components/email/PasswordResetEmail';
import { UpgradeConfirmationEmailTemplate } from '@/components/email/UpgradeConfirmationEmail';
import { WeeklyDigestEmailTemplate } from '@/components/email/WeeklyDigestEmail';
import { NexusConversationSummaryEmailTemplate } from '@/components/email/NexusConversationSummaryEmail';
import { ShareResultEmail } from '@/components/email/ShareResultEmail';
import type { AssessmentResultData } from '@/types/reportTemplates';

export const B2C_EMAIL_KINDS = [
  'welcome',
  'assessment_complete',
  'email_verification',
  'password_reset',
  'upgrade_confirmation',
  'weekly_digest',
  'nexus_conversation_summary',
  'share_result',
] as const;
export type EmailKind = (typeof B2C_EMAIL_KINDS)[number];

/* ── #105 Variable substitution ──────────────────────────────────── */

export type EmailVariables = Record<string, string | number | Date | null | undefined>;

export function substituteVariables(input: string, vars: EmailVariables): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/g, (_m, key: string) => {
    const raw = vars[key];
    if (raw === undefined || raw === null) return '';
    if (raw instanceof Date) return raw.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return String(raw);
  });
}

/* ── #106 Banned word scanner (wraps nexus bannedWordScanner) ─────── */

export interface BannedWordResult {
  word: string;
  category: string;
  severity: 'hard' | 'soft';
  occurrences: number;
}

export function scanBannedWords(html: string): BannedWordResult[] {
  // strip HTML tags to catch plain text only
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  return bannedWordScanner(plain).map((h) => ({
    word: h.word,
    category: h.reason_short,
    severity: h.hard_violation ? 'hard' : 'soft',
    occurrences: h.occurrences,
  }));
}

/* ── #102 Brand lens ─────────────────────────────────────────────── */

export interface BrandLensInput {
  kind: EmailKind;
  diagnosticSlug?: DiagnosticSlug;
  tier?: TierKey;
}
export interface BrandLens {
  accent: string;        // hex
  accent_ink: string;    // darker companion hex
  header_title: string;
  accent_label: string;  // short uppercase tagline
  confidentiality_banner: string;
}

export function applyBrandLens(input: BrandLensInput): BrandLens {
  const slug = input.diagnosticSlug;
  const accent = slug ? DIAGNOSTIC_ACCENTS[slug].accent : '#C108AB';
  const accent_ink = slug ? DIAGNOSTIC_ACCENTS[slug].accent_ink : '#760568';
  const header_title =
    input.kind === 'welcome' ? 'Welcome to LYC Partners'
    : input.kind === 'assessment_complete' ? 'Your assessment result is ready'
    : input.kind === 'email_verification' ? 'Verify your email address'
    : input.kind === 'password_reset' ? 'Reset your password'
    : input.kind === 'upgrade_confirmation' ? 'Thank you for upgrading'
    : input.kind === 'weekly_digest' ? 'Your weekly NEXUS digest'
    : input.kind === 'nexus_conversation_summary' ? 'Your NEXUS conversation summary'
    : /* share_result */     'A colleague shared an assessment result with you';
  const accent_label = (input.kind === 'upgrade_confirmation' && input.tier)
    ? TIER_META[input.tier].displayName.toUpperCase()
    : input.diagnosticSlug
      ? input.diagnosticSlug.toUpperCase()
      : 'LYC PARTNERS';
  return {
    accent,
    accent_ink,
    header_title,
    accent_label,
    confidentiality_banner:
      'This email and any attachments are confidential and for the named recipient only.',
  };
}

/* ── #103 Voice engine ────────────────────────────────────────────── */

export type VoiceTone = (typeof TONE_BY_CONTEXT)[keyof typeof TONE_BY_CONTEXT];

export interface VoiceEngineResult {
  /** Rewritten HTML body. */
  html_body: string;
  /** Rewritten subject (if voice engine touched it). Keep original when voice skipped. */
  subject: string;
  /** True when DeepSeek call was attempted and returned content. */
  voice_rewrote: boolean;
  /** Whether rules fallback was used (AI path failed, or user tier/opt-out skipped AI). */
  used_fallback: boolean;
  /** Step to append to provenance chain for the email pipeline. */
  provenance_step: {
    stage: 'voice_engine';
    at: string;
    miles_debited: 0 | 1;
    tokens?: { prompt_tokens: number; completion_tokens: number };
    error?: string;
  };
}

export function voiceForEmail(kind: EmailKind): {
  tone: VoiceTone;
  subject_prefix: string;
  max_subject_len: number;
  forbidden_words: string[];
  min_paragraphs: number;
  /** per-template voice-engine policy. */
  enable_voice_engine_default: boolean;
} {
  switch (kind) {
    case 'welcome':
      return {
        tone: TONE_BY_CONTEXT.assessment_intake,
        subject_prefix: 'LYC Partners',
        max_subject_len: 60,
        forbidden_words: ['free', 'discount', 'unlock', 'level up'],
        min_paragraphs: 2,
        enable_voice_engine_default: true,
      };
    case 'assessment_complete':
      return {
        tone: TONE_BY_CONTEXT.assessment_result,
        subject_prefix: 'Your result',
        max_subject_len: 70,
        forbidden_words: ['passed', 'failed', 'grade', 'scorecard'],
        min_paragraphs: 2,
        enable_voice_engine_default: true,
      };
    case 'email_verification':
      return {
        tone: TONE_BY_CONTEXT.coach_prompt,
        subject_prefix: 'Verify email',
        max_subject_len: 50,
        forbidden_words: [],
        min_paragraphs: 1,
        enable_voice_engine_default: false,
      };
    case 'password_reset':
      return {
        tone: TONE_BY_CONTEXT.crisis,
        subject_prefix: 'Password reset',
        max_subject_len: 50,
        forbidden_words: ['compromised', 'hacked'],
        min_paragraphs: 1,
        enable_voice_engine_default: false,
      };
    case 'upgrade_confirmation':
      return {
        tone: TONE_BY_CONTEXT.consultant_update,
        subject_prefix: 'Upgrade confirmed',
        max_subject_len: 70,
        forbidden_words: ['free', 'sale', 'deal', 'bargain'],
        min_paragraphs: 2,
        enable_voice_engine_default: true,
      };
    case 'weekly_digest':
      return {
        tone: TONE_BY_CONTEXT.assessment_result,
        subject_prefix: 'Weekly digest',
        max_subject_len: 80,
        forbidden_words: [],
        min_paragraphs: 3,
        enable_voice_engine_default: true,
      };
    case 'nexus_conversation_summary':
      return {
        tone: TONE_BY_CONTEXT.consultant_update,
        subject_prefix: 'NEXUS summary',
        max_subject_len: 80,
        forbidden_words: ['magic', 'secret', 'trick'],
        min_paragraphs: 3,
        enable_voice_engine_default: true,
      };
    case 'share_result':
      return {
        tone: TONE_BY_CONTEXT.client_introduction,
        subject_prefix: 'Shared by',
        max_subject_len: 80,
        forbidden_words: ['free', 'check out this', 'amazing'],
        min_paragraphs: 2,
        enable_voice_engine_default: true,
      };
  }
}

function voiceSystemPrompt(kind: EmailKind): string {
  const voice = voiceForEmail(kind);
  const tone = typeof voice.tone === 'object' ? JSON.stringify(voice.tone) : String(voice.tone);
  const principles = Array.isArray(VOICE_PRINCIPLES)
    ? VOICE_PRINCIPLES.map((p, i) => `${i + 1}. ${typeof p === 'string' ? p : JSON.stringify(p)}`).join('\n')
    : String(VOICE_PRINCIPLES ?? '');
  const contextHint =
    kind === 'assessment_complete'
      ? 'This email delivers a recent assessment result to the person who completed it. Be supportive, specific, and concise — no corporate speak. The recipient has earned real insight; treat them like a seasoned executive.'
      : kind === 'weekly_digest'
      ? 'This email is a weekly digest of NEXUS activity, completed assessments and shareable insights. Be informative without being cheerful. Prioritize brevity and a clear next step.'
      : kind === 'share_result'
      ? 'This email is from one professional to another sharing an assessment report link. Respect the sender voice: formal but not cold. The body contains the sender note — keep its spirit but tighten phrasing.'
      : kind === '3day_checkin'
      ? 'This is a 3-day check-in after a completed assessment. Reference exactly one key insight. Invite them back to their dashboard to continue the journey.'
      : 'Standard LYC Partners voice — executive, concise, human, never corporate-speak.';
  return (
    'You rewrite email HTML content to match LYC Partners brand voice.\n' +
    'Rules:\n' +
    '- Keep ALL factual content intact. Do not invent new data, names, numbers, scores, links, tokens, or dates.\n' +
    '- Keep the HTML structure intact: do not remove <table>, <a href="…">, <img>, <style> blocks, or CTA links.\n' +
    '- Rewrite prose only (p, h1-h4, div text, span, li text nodes). Keep all non-text markup untouched.\n' +
    '- Executive, concise, human. No "Hey there!" or corporate platitudes ("At X we believe …").\n' +
    '- Never invent the word "free" — use "Executive Introduction" or "complimentary assessment".\n' +
    '- Brand tone context: ' + tone + '\n' +
    '- Template context: ' + contextHint + '\n' +
    '- Brand principles:\n' + principles + '\n\n' +
    'Return exactly the rewritten HTML in a JSON string field: { "html": "<!— rewritten HTML —>" }. Do not wrap HTML with markdown code fences.'
  );
}

/**
 * #103 Voice engine (LLM version). Per-template, per-tier:
 *   Executive Introduction → skip (return content unchanged, provenance records skip, 0 mi)
 *   professional tier (and above) → rewrite enabled (1 mi on success, 0 mi on failure).
 *   professional tier with enable_voice_engine=false → skip.
 * Costs 1 mile. Falls back to rules-only if LLM unavailable or returns invalid shape.
 */
export async function applyVoiceEngineRewriting(opts: {
  kind: EmailKind;
  subject: string;
  html_body: string;
  tier?: TierKey | null;
  enable_voice_engine?: boolean;
  user_id?: string;
}): Promise<VoiceEngineResult> {
  const baseline = (status: 'rules_fallback' | 'skip', miles: 0 | 1, error?: string): VoiceEngineResult => ({
    html_body: normalizeBrandPhrases(rulesRewrite(opts.html_body, opts.kind)),
    subject: applyToneToSubject(opts.subject, voiceForEmail(opts.kind).subject_prefix, voiceForEmail(opts.kind).max_subject_len),
    voice_rewrote: false,
    used_fallback: status === 'rules_fallback',
    provenance_step: {
      stage: 'voice_engine',
      at: new Date().toISOString(),
      miles_debited: miles,
      error,
    },
  });

  const voiceCfg = voiceForEmail(opts.kind);
  const useVoice =
    opts.enable_voice_engine !== false &&
    voiceCfg.enable_voice_engine_default &&
    opts.tier &&
    opts.tier !== 'executive_introduction' &&
    opts.tier !== 'explorer';

  if (!useVoice) {
    // EI tier or template opted out — skip voice engine. 0 miles charged.
    return baseline('skip', 0);
  }

  // Deduct miles up front; refund on failure.
  let debited = false;
  try {
    if (opts.user_id) {
      const r = await deductMiles(1, `email voice_engine ${opts.kind}`, {
        description: `Voice engine rewrite (${opts.kind}) — 1 mile`,
      });
      debited = r.success;
    }
  } catch { /* ignore — miles debit best-effort */ }

  if (!deepseek.hasApiKey()) {
    if (debited) void refundMiles(1, `email voice_engine ${opts.kind} offline`).catch(() => {});
    return baseline('rules_fallback', 0, 'deepseek offline/no-key');
  }

  let chatResult: DeepSeekChatResult | null = null;
  try {
    chatResult = await deepseek.chat(
      [
        { role: 'system', content: voiceSystemPrompt(opts.kind) },
        { role: 'user', content: `Subject: ${opts.subject}\n\nHTML body:\n${truncateHtml(opts.html_body, 14_000)}\n` },
      ],
      {
        model: 'deepseek-chat',
        temperature: 0.4,
        maxTokens: 3600,
        responseFormat: { type: 'json_object' },
      },
    );
  } catch (e: any) {
    if (debited) void refundMiles(1, `email voice_engine ${opts.kind} failure`).catch(() => {});
    return baseline('rules_fallback', 0, e?.message ?? String(e));
  }

  const parsed = parseJsonBodySafe(chatResult.content) as { html?: string };
  if (!parsed || !parsed.html || typeof parsed.html !== 'string') {
    if (debited) void refundMiles(1, `email voice_engine ${opts.kind} parse failure`).catch(() => {});
    return baseline('rules_fallback', 0, 'invalid voice rewrite response');
  }

  return {
    html_body: parsed.html,
    subject: applyToneToSubject(opts.subject, voiceCfg.subject_prefix, voiceCfg.max_subject_len),
    voice_rewrote: true,
    used_fallback: false,
    provenance_step: {
      stage: 'voice_engine',
      at: new Date().toISOString(),
      miles_debited: 1,
      tokens: {
        prompt_tokens: chatResult.usage?.prompt_tokens ?? 0,
        completion_tokens: chatResult.usage?.completion_tokens ?? 0,
      },
    },
  };
}

/** Deterministic rules-based rewrite (fallback). Normalizes brand phrases and subject casing only. */
function rulesRewrite(html: string, _kind: EmailKind): string {
  return normalizeBrandPhrases(html);
}

function truncateHtml(html: string, chars: number): string {
  if (html.length <= chars) return html;
  return html.slice(0, chars) + '\n<!-- [truncated for LLM context budget] -->';
}

function parseJsonBodySafe(content: string): any {
  try { return JSON.parse(content); } catch { /* ignore */ }
  const m = content.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
  return null;
}

/* ── #104 Content generator (AI opt-in) ──────────────────────────── */

export const AI_CONTENT_MILES_COST: Record<EmailKind, 0 | 2 | 3 | 5> = {
  welcome: 0,
  password_reset: 0,
  email_verification: 0,
  upgrade_confirmation: 2,
  assessment_complete: 3,
  share_result: 2,
  weekly_digest: 5,
  nexus_conversation_summary: 4,
};

export interface ContentGenerateRequest {
  kind: EmailKind;
  subject_template: string;
  preheader_template: string;
  variables: EmailVariables;
  /** If true: use AI when tier + miles allow. */
  enable_ai?: boolean;
  tier?: TierKey | null;
  user_id?: string;
  /** Optional: data to personalize with (assessment results, digest counts, etc.). */
  context?: Record<string, unknown>;
}

export interface ContentGenerateResult {
  subject: string;
  preheader: string;
  /** Optional personalized intro paragraph the template can render as {{ai_intro_paragraph}}. */
  ai_intro_paragraph?: string;
  /** Optional list of key insight callouts for templates with an insights block. */
  ai_callouts?: string[];
  /** Optional closing / CTA paragraph. */
  ai_closing_paragraph?: string;
  ai_enhanced: boolean;
  provenance_step: {
    stage: 'content_generator';
    at: string;
    miles_debited: 0 | 2 | 3 | 4 | 5;
    tokens?: { prompt_tokens: number; completion_tokens: number };
    error?: string;
  };
}

function contentGeneratorSystemPrompt(kind: EmailKind): string {
  return (
    'You personalize outbound LYC Partners email content. You receive the default template subject, preheader, and user+context. You write:\n' +
    '- subject_line (short, executive-friendly)\n' +
    '- preheader (preview text, 80–120 chars, no emoji, no words like "free")\n' +
    '- opening_paragraph (personalized summary, 2–4 sentences)\n' +
    '- closing_paragraph (CTA-forward, 1–2 sentences) — optional but preferred for AI templates\n' +
    '- key_callouts: string[] — 1 to 3 bullets, one sentence each, grounded ONLY in data provided.\n\n' +
    'Rules:\n' +
    '- Executive, concise, human. No corporate-speak. No words "free", "deal", "amazing".\n' +
    '- DO NOT invent data. If context is empty, keep callouts empty and stick to template defaults.\n' +
    '- Output strict JSON: { "subject_line": string, "preheader": string, "opening_paragraph": string, "closing_paragraph": string, "key_callouts": string[] }.\n' +
    `Template type: ${kind}.\n`
  );
}

function contentGeneratorUserMessage(req: ContentGenerateRequest): string {
  const baseSubject = substituteVariables(req.subject_template, req.variables);
  const basePreheader = substituteVariables(req.preheader_template, req.variables);
  return (
    `Default subject: ${baseSubject}\n` +
    `Default preheader: ${basePreheader}\n` +
    `User/template variables (JSON): ${JSON.stringify(safeVarsSnapshot(req.variables), null, 2)}\n` +
    (req.context ? `Context (JSON): ${JSON.stringify(req.context, null, 2)}\n` : '') +
    `User tier: ${req.tier ?? 'unknown'}\n` +
    `\nReturn strictly { subject_line, preheader, opening_paragraph, closing_paragraph, key_callouts: [] } JSON.`
  );
}

function safeVarsSnapshot(v: EmailVariables): EmailVariables {
  const safe: EmailVariables = {};
  for (const [k, val] of Object.entries(v ?? {})) {
    if (k.toLowerCase().includes('password') || k.toLowerCase().includes('secret')) continue;
    safe[k] = val;
  }
  return safe;
}

/**
 * #104 AI email content generator. Per-template, per-tier behavior:
 *   Executive Introduction → never use AI; return template-only (0 miles).
 *   professional: AI subject + opening paragraph (full package depends on template; default we return all fields).
 *   executive / council / enterprise: full AI content + voice engine enabled downstream.
 * Miles cost per template: see AI_CONTENT_MILES_COST (0/2/3/4/5).
 */
export async function generateEmailContent(
  req: ContentGenerateRequest,
): Promise<ContentGenerateResult> {
  // 1. Default: pure variable substitution (no API calls).
  const subject_base = substituteVariables(req.subject_template, req.variables);
  const preheader_base = substituteVariables(req.preheader_template, req.variables);
  const voice = voiceForEmail(req.kind);
  const subject_subject_formatted = applyToneToSubject(subject_base, voice.subject_prefix, voice.max_subject_len);

  const makeSkip = (error?: string): ContentGenerateResult => ({
    subject: subject_subject_formatted,
    preheader: preheader_base,
    ai_enhanced: false,
    provenance_step: {
      stage: 'content_generator',
      at: new Date().toISOString(),
      miles_debited: 0,
      error,
    },
  });

  // Gates
  const milesCost = AI_CONTENT_MILES_COST[req.kind];
  if (!req.enable_ai || milesCost === 0 || !req.tier || req.tier === 'executive_introduction' || req.tier === 'explorer') {
    return makeSkip(milesCost === 0 ? 'template ai_disabled by policy' : undefined);
  }
  if (!deepseek.hasApiKey()) {
    return makeSkip('deepseek no-api-key');
  }

  // Deduct miles up front; refund on failure.
  let debited = false;
  try {
    if (req.user_id) {
      const r = await deductMiles(milesCost, `email content_generator ${req.kind}`, {
        description: `AI content generation (${req.kind}) — ${milesCost} miles`,
      });
      debited = r.success;
    }
  } catch { /* ignore */ }

  let chatResult: DeepSeekChatResult | null = null;
  try {
    chatResult = await deepseek.chat(
      [
        { role: 'system', content: contentGeneratorSystemPrompt(req.kind) },
        { role: 'user', content: contentGeneratorUserMessage(req) },
      ],
      {
        model: 'deepseek-chat',
        temperature: 0.35,
        maxTokens: 2400,
        responseFormat: { type: 'json_object' },
      },
    );
  } catch (e: any) {
    if (debited) void refundMiles(milesCost, `email content_generator ${req.kind} failure`).catch(() => {});
    return makeSkip(e?.message ?? String(e));
  }

  const parsed = parseJsonBodySafe(chatResult.content) as {
    subject_line?: string;
    preheader?: string;
    opening_paragraph?: string;
    closing_paragraph?: string;
    key_callouts?: string[];
  } | null;
  if (!parsed) {
    if (debited) void refundMiles(milesCost, `email content_generator ${req.kind} parse`).catch(() => {});
    return makeSkip('invalid json from llm');
  }

  const subject = applyToneToSubject(
    parsed.subject_line?.trim() || subject_base,
    voice.subject_prefix,
    voice.max_subject_len,
  );
  const preheader = parsed.preheader?.trim() || preheader_base;

  return {
    subject,
    preheader,
    ai_intro_paragraph: parsed.opening_paragraph?.trim() || undefined,
    ai_closing_paragraph: parsed.closing_paragraph?.trim() || undefined,
    ai_callouts: Array.isArray(parsed.key_callouts) ? parsed.key_callouts.filter(Boolean) : undefined,
    ai_enhanced: true,
    provenance_step: {
      stage: 'content_generator',
      at: new Date().toISOString(),
      miles_debited: milesCost,
      tokens: {
        prompt_tokens: chatResult.usage?.prompt_tokens ?? 0,
        completion_tokens: chatResult.usage?.completion_tokens ?? 0,
      },
    },
  };
}

function applyToneToSubject(subject: string, prefix: string, maxLen: number): string {
  let s = subject.trim();
  if (!s.toLowerCase().startsWith(prefix.toLowerCase())) {
    s = `${prefix} — ${s}`;
  }
  if (s.length > maxLen) {
    s = s.slice(0, maxLen - 1).trimEnd() + '…';
  }
  return s;
}

/* ── #101 Structural email validator ─────────────────────────────── */

export interface EmailValidationIssue {
  severity: 'error' | 'warn';
  code: string;
  message: string;
}
export interface ValidatedEmail {
  to: string[];
  from_name: string;
  subject: string;
  html_body: string;
  plain_body?: string;
  reply_to?: string;
  issues: EmailValidationIssue[];
  ok: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailStructural(input: {
  to?: string | string[];
  from_name?: string;
  subject?: string;
  html_body?: string;
  plain_body?: string;
  reply_to?: string;
}): ValidatedEmail {
  const issues: EmailValidationIssue[] = [];
  const to = Array.isArray(input.to) ? input.to : input.to ? [input.to] : [];

  if (to.length === 0) issues.push({ severity: 'error', code: 'NO_RECIPIENTS', message: 'At least one "to" recipient is required.' });
  for (const addr of to) {
    if (!EMAIL_REGEX.test(addr)) {
      issues.push({ severity: 'error', code: 'INVALID_ADDRESS', message: `Invalid email address: ${addr}` });
    }
  }
  if (!input.from_name || String(input.from_name).trim().length === 0) {
    issues.push({ severity: 'warn', code: 'NO_FROM_NAME', message: 'Missing from_name — defaulting to LYC Partners.' });
  }
  if (!input.subject || String(input.subject).trim().length === 0) {
    issues.push({ severity: 'error', code: 'NO_SUBJECT', message: 'Email subject is required.' });
  } else if (String(input.subject).length > 150) {
    issues.push({ severity: 'warn', code: 'LONG_SUBJECT', message: 'Subject exceeds 150 chars — will truncate on some clients.' });
  }
  if (!input.html_body || !/<[a-z][\s\S]*>/i.test(input.html_body)) {
    issues.push({ severity: 'warn', code: 'NO_HTML_BODY', message: 'HTML body missing or not HTML.' });
  }

  return {
    to,
    from_name: input.from_name || 'LYC Partners',
    subject: input.subject || '(no subject)',
    html_body: input.html_body || '',
    plain_body: input.plain_body,
    reply_to: input.reply_to,
    issues,
    ok: !issues.some((i) => i.severity === 'error'),
  };
}

/* ── Template registry + pipeline ────────────────────────────────── */

export type AnyVars = EmailVariables;

export interface EmailTemplateDefinition<V extends AnyVars = AnyVars> {
  kind: EmailKind;
  defaultSubject: string;
  defaultPreheader: string;
  defaultFromName: string;
  render: (ctx: { variables: V; brandLens: BrandLens }) => React.ReactElement;
  variableCheck?: (vars: AnyVars) => EmailValidationIssue[];
}

/* Shared React wrapper → HTML static */
export function renderEmailHtml(def: EmailTemplateDefinition, variables: AnyVars, lens: BrandLens): string {
  const node = def.render({ variables, brandLens: lens });
  // Render to static markup. This runs in Node/Vercel too (react-dom/server.browser entry).
  const html = renderToStaticMarkup(node);
  return normalizeBrandPhrases(html);
}

/* ── Pipeline ────────────────────────────────────────────────────── */

export interface RunPipelineInput<V extends AnyVars = AnyVars> {
  kind: EmailKind;
  variables: V;
  /** Optional: recipient + sender metadata */
  to: string | string[];
  reply_to?: string;
  /** Override default subject / preheader */
  subject_template?: string;
  preheader_template?: string;
  /** If true: ask ContentGenerator to try AI-enhanced subject/preheader. */
  enable_ai?: boolean;
  /** Enable/disable voice-engine rewriting for this run independent of template default. */
  enable_voice_engine?: boolean;
  /** Diagnostic or tier influence brand lens */
  diagnosticSlug?: DiagnosticSlug;
  tier?: TierKey;
  /** Miles debit auth: user performing the action. */
  user_id?: string;
}

export type ProvenanceStep =
  | ContentGenerateResult['provenance_step']
  | VoiceEngineResult['provenance_step'];

export interface RunPipelineResult {
  kind: EmailKind;
  validated: ValidatedEmail;
  lens: BrandLens;
  banned_hits: BannedWordResult[];
  brand_issues: EmailValidationIssue[];
  ai_enhanced: boolean;
  voice_rewrote: boolean;
  provenance: ProvenanceStep[];
  total_miles_debited: number;
}

/**
 * Run the full #101–#106 pipeline. The caller then passes `validated` into
 * the #114 SendCloud adapter (and the adapter writes #116 delivery log).
 *
 * Pipeline stages (ordered):
 *   1. Brand lens + template selection (#102)
 *   2. AI content generation — subject / preheader / AI paragraph injection (#104)
 *   3. Template HTML render with substituted variables (#105)
 *   4. Voice engine rewrite — HTML prose rewritten in brand voice (#103)
 *   5. Forbidden-word / tier-naming audit (#106)
 *   6. Structural validation (#101)
 */
export async function runEmailPipeline<V extends AnyVars = AnyVars>(
  input: RunPipelineInput<V>,
): Promise<RunPipelineResult> {
  const def = TEMPLATE_REGISTRY[input.kind];
  if (!def) throw new Error(`Unknown email kind: ${input.kind}`);

  const lens = applyBrandLens({ kind: input.kind, diagnosticSlug: input.diagnosticSlug, tier: input.tier });
  const provenance: ProvenanceStep[] = [];
  let total_miles_debited = 0;

  const subject_tpl = input.subject_template ?? def.defaultSubject;
  const preheader_tpl = input.preheader_template ?? def.defaultPreheader;

  // ── 2. #104 Content generation ─────────────────────────────────────
  const content = await generateEmailContent({
    kind: input.kind,
    subject_template: subject_tpl,
    preheader_template: preheader_tpl,
    variables: input.variables,
    enable_ai: input.enable_ai,
    tier: input.tier ?? null,
    user_id: input.user_id,
  });
  provenance.push(content.provenance_step);
  total_miles_debited += content.provenance_step.miles_debited;
  let subject = content.subject;
  let preheader = content.preheader;
  const ai_enhanced = content.ai_enhanced;

  // Wire AI paragraphs into template variables so React components receive them.
  const enhancedVariables: AnyVars = {
    ...input.variables,
    __preheader: preheader,
    __ai_intro_paragraph: content.ai_intro_paragraph ?? '',
    __ai_closing_paragraph: content.ai_closing_paragraph ?? '',
    __ai_callouts_json: content.ai_callouts ? JSON.stringify(content.ai_callouts) : '',
  };

  // ── 3. Template HTML render ───────────────────────────────────────
  let html_body = renderEmailHtml(def, enhancedVariables, lens);

  // ── 4. #103 Voice engine rewriting ────────────────────────────────
  const voiceRewrite = await applyVoiceEngineRewriting({
    kind: input.kind,
    subject,
    html_body,
    tier: input.tier ?? null,
    enable_voice_engine: input.enable_voice_engine,
    user_id: input.user_id,
  });
  provenance.push(voiceRewrite.provenance_step);
  total_miles_debited += voiceRewrite.provenance_step.miles_debited;
  html_body = voiceRewrite.html_body;
  subject = voiceRewrite.subject;
  const voice_rewrote = voiceRewrite.voice_rewrote;

  // ── 5. Forbidden word audit (#106) + tier naming ──────────────────
  const voice = voiceForEmail(input.kind);
  const voiceIssues: EmailValidationIssue[] = [];
  for (const fw of voice.forbidden_words) {
    const re = new RegExp(`\\b${fw}\\b`, 'i');
    if (re.test(subject) || re.test(html_body.replace(/<[^>]+>/g, ' '))) {
      voiceIssues.push({ severity: 'warn', code: 'VOICE_FORBIDDEN_WORD', message: `Forbidden word for ${input.kind} tone: "${fw}"` });
    }
  }
  const banned_hits = scanBannedWords(html_body + ' ' + subject);
  const brand_issues_from_scan: EmailValidationIssue[] = banned_hits
    .filter((h) => h.severity === 'hard')
    .slice(0, 10)
    .map((h) => ({
      severity: 'error' as const,
      code: 'BRAND_BANNED_WORD',
      message: `Hard violation (${h.category}): "${h.word}" appears ${h.occurrences}x`,
    }));
  const canonicalIssues = canonicalTierNameCheck(html_body + ' ' + subject)
    .slice(0, 5)
    .map((t) => ({ severity: 'warn' as const, code: 'TIER_NAMING' as const, message: t.detail }));

  // ── 6. Structural validation (#101) ───────────────────────────────
  const structural = validateEmailStructural({
    to: input.to,
    from_name: def.defaultFromName,
    subject,
    html_body,
    reply_to: input.reply_to,
  });
  const variableIssues = def.variableCheck ? def.variableCheck(input.variables) : [];

  const allIssues = [...structural.issues, ...variableIssues, ...voiceIssues, ...brand_issues_from_scan, ...canonicalIssues];
  const validated: ValidatedEmail = {
    ...structural,
    subject,
    html_body,
    issues: allIssues,
    ok: !allIssues.some((i) => i.severity === 'error'),
  };

  return {
    kind: input.kind,
    validated,
    lens,
    banned_hits,
    brand_issues: [...voiceIssues, ...brand_issues_from_scan, ...canonicalIssues],
    ai_enhanced,
    voice_rewrote,
    provenance,
    total_miles_debited,
  };
}

/* ── Registry — stubs forward to the 8 real React template components built in the next task. */
export const TEMPLATE_REGISTRY: Record<EmailKind, EmailTemplateDefinition> = {
  welcome: WelcomeEmailTemplate,
  assessment_complete: AssessmentCompleteEmailTemplate,
  email_verification: EmailVerificationEmailTemplate,
  password_reset: PasswordResetEmailTemplate,
  upgrade_confirmation: UpgradeConfirmationEmailTemplate,
  weekly_digest: WeeklyDigestEmailTemplate,
  nexus_conversation_summary: NexusConversationSummaryEmailTemplate,
  share_result: {
    kind: 'share_result',
    defaultSubject: '{{sender_name}} shared an assessment result with you — {{assessment_title}}',
    defaultPreheader: 'View the full report in your browser.',
    defaultFromName: 'LYC Partners via {{sender_name}}',
    render({ variables, brandLens }) {
      return React.createElement(ShareResultEmail, {
        shareUrl: String(variables.share_url ?? ''),
        senderNote: typeof variables.sender_note === 'string' ? variables.sender_note : null,
        senderName: typeof variables.sender_name === 'string' ? variables.sender_name : null,
        data: (variables.assessment_result ?? {}) as unknown as AssessmentResultData,
      } satisfies Parameters<typeof ShareResultEmail>[0]);
    },
    variableCheck(vars) {
      const issues: EmailValidationIssue[] = [];
      if (!vars.share_url) issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'share_url missing from share_result email.' });
      return issues;
    },
  },
};

/* Reference VOICE_PRINCIPLES to ensure import isn't accidentally stripped. */
export const _engineBrandPrinciples = VOICE_PRINCIPLES;
export const _engineQualityGateRef = QualityGate;
