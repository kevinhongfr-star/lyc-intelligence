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

export function voiceForEmail(kind: EmailKind): {
  tone: VoiceTone;
  subject_prefix: string;
  max_subject_len: number;
  forbidden_words: string[];
  min_paragraphs: number;
} {
  switch (kind) {
    case 'welcome':
      return {
        tone: TONE_BY_CONTEXT.assessment_intake,
        subject_prefix: 'LYC Partners',
        max_subject_len: 60,
        forbidden_words: ['free', 'discount', 'unlock', 'level up'],
        min_paragraphs: 2,
      };
    case 'assessment_complete':
      return {
        tone: TONE_BY_CONTEXT.assessment_result,
        subject_prefix: 'Your result',
        max_subject_len: 70,
        forbidden_words: ['passed', 'failed', 'grade', 'scorecard'],
        min_paragraphs: 2,
      };
    case 'email_verification':
      return {
        tone: TONE_BY_CONTEXT.coach_prompt,
        subject_prefix: 'Verify email',
        max_subject_len: 50,
        forbidden_words: [],
        min_paragraphs: 1,
      };
    case 'password_reset':
      return {
        tone: TONE_BY_CONTEXT.crisis,
        subject_prefix: 'Password reset',
        max_subject_len: 50,
        forbidden_words: ['compromised', 'hacked'],
        min_paragraphs: 1,
      };
    case 'upgrade_confirmation':
      return {
        tone: TONE_BY_CONTEXT.consultant_update,
        subject_prefix: 'Upgrade confirmed',
        max_subject_len: 70,
        forbidden_words: ['free', 'sale', 'deal', 'bargain'],
        min_paragraphs: 2,
      };
    case 'weekly_digest':
      return {
        tone: TONE_BY_CONTEXT.assessment_result,
        subject_prefix: 'Weekly digest',
        max_subject_len: 80,
        forbidden_words: [],
        min_paragraphs: 3,
      };
    case 'nexus_conversation_summary':
      return {
        tone: TONE_BY_CONTEXT.consultant_update,
        subject_prefix: 'NEXUS summary',
        max_subject_len: 80,
        forbidden_words: ['magic', 'secret', 'trick'],
        min_paragraphs: 3,
      };
    case 'share_result':
      return {
        tone: TONE_BY_CONTEXT.client_introduction,
        subject_prefix: 'Shared by',
        max_subject_len: 80,
        forbidden_words: ['free', 'check out this', 'amazing'],
        min_paragraphs: 2,
      };
  }
}

/* ── #104 Content generator (lightweight; no LLM unless opted in) ── */

export interface ContentGenerateRequest {
  kind: EmailKind;
  subject_template: string;
  preheader_template: string;
  variables: EmailVariables;
  enable_ai?: boolean;
}

export async function generateEmailContent(
  req: ContentGenerateRequest,
): Promise<{ subject: string; preheader: string; ai_enhanced: boolean }> {
  // 1. Default: pure variable substitution (no API calls).
  let subject = substituteVariables(req.subject_template, req.variables);
  let preheader = substituteVariables(req.preheader_template, req.variables);

  // 2. Opt-in AI enhancement: no-op implementation here — placeholder for
  // future DeepSeek call if caller wants it. We keep the pipeline typed so
  // Batch 4 can add real generation without changing callers.
  const voice = voiceForEmail(req.kind);
  subject = applyToneToSubject(subject, voice.subject_prefix, voice.max_subject_len);

  return { subject, preheader, ai_enhanced: false };
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
  /** Diagnostic or tier influence brand lens */
  diagnosticSlug?: DiagnosticSlug;
  tier?: TierKey;
}

export interface RunPipelineResult {
  kind: EmailKind;
  validated: ValidatedEmail;
  lens: BrandLens;
  banned_hits: BannedWordResult[];
  brand_issues: EmailValidationIssue[];
  ai_enhanced: boolean;
}

/**
 * Run the full #101–#106 pipeline. The caller then passes `validated` into
 * the #114 SendCloud adapter (and the adapter writes #116 delivery log).
 */
export async function runEmailPipeline<V extends AnyVars = AnyVars>(
  input: RunPipelineInput<V>,
): Promise<RunPipelineResult> {
  const def = TEMPLATE_REGISTRY[input.kind];
  if (!def) throw new Error(`Unknown email kind: ${input.kind}`);

  const lens = applyBrandLens({ kind: input.kind, diagnosticSlug: input.diagnosticSlug, tier: input.tier });
  // #105 substitute + render
  const subject_tpl = input.subject_template ?? def.defaultSubject;
  const preheader_tpl = input.preheader_template ?? def.defaultPreheader;

  // #104 content gen (subject / preheader — AI optional)
  const { subject, preheader, ai_enhanced } = await generateEmailContent({
    kind: input.kind,
    subject_template: subject_tpl,
    preheader_template: preheader_tpl,
    variables: input.variables,
    enable_ai: input.enable_ai,
  });

  // Render template HTML (runs variables inside React for typed safety)
  const html_body = renderEmailHtml(def, { ...input.variables, __preheader: preheader }, lens);

  // #103 voice: apply brand phrase normalization (already in renderHtml via normalizeBrandPhrases)
  // #102 lens variables: ensure accent references are brand-correct
  const voice = voiceForEmail(input.kind);
  const voiceIssues: EmailValidationIssue[] = [];
  for (const fw of voice.forbidden_words) {
    const re = new RegExp(`\\b${fw}\\b`, 'i');
    if (re.test(subject) || re.test(html_body.replace(/<[^>]+>/g, ' '))) {
      voiceIssues.push({ severity: 'warn', code: 'VOICE_FORBIDDEN_WORD', message: `Forbidden word for ${input.kind} tone: "${fw}"` });
    }
  }

  // #106 banned word scan
  const banned_hits = scanBannedWords(html_body + ' ' + subject);
  const brand_issues_from_scan: EmailValidationIssue[] = banned_hits
    .filter((h) => h.severity === 'hard')
    .slice(0, 10)
    .map((h) => ({
      severity: 'error' as const,
      code: 'BRAND_BANNED_WORD',
      message: `Hard violation (${h.category}): "${h.word}" appears ${h.occurrences}x`,
    }));

  // canonical tier naming
  const canonicalIssues = canonicalTierNameCheck(html_body + ' ' + subject)
    .slice(0, 5)
    .map((t) => ({ severity: 'warn' as const, code: 'TIER_NAMING' as const, message: t.detail }));

  // #101 structural
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
