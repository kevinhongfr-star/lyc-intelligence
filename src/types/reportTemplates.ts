/**
 * reportTemplates.ts — #76 Template Registry + Rendering Pipeline (B2C 8-template scopedown)
 *
 * B2C scope is ~8 templates (down from 68 B2B):
 *   1. AssessmentResultWebLayout  — shared result page wrapper (all 6 diagnostics)
 *   2. PrismResultPdf             — PRISM Career & Professional Branding PDF
 *   3. SparkResultPdf             — SPARK AI Leadership Readiness PDF
 *   4. ForgeResultPdf             — FORGE Sales Excellence PDF
 *   5. BridgeResultPdf            — BRIDGE China Leadership Readiness PDF
 *   6. MosaicResultPdf            — MOSAIC Cultural Intelligence PDF
 *   7. DriveResultPdf             — DRIVE Execution Capability Framework PDF
 *   8. ShareResultEmail           — Single-page email-friendly share (used by #1348)
 *
 * Architecture:
 *   - Registry pattern via `TEMPLATES` Record — keyed by `TemplateId`
 *   - Each template implements `ReportTemplate<Data>`: { id, slug, kind,
 *     title, render(ctx), validateData, applyTierRedactions }
 *   - Rendering pipeline: `renderReport()` — runs validate → tier-redact
 *     (Executive Introduction shows partial insights + upgrade CTA) → render
 *   - This is the FOUNDATION; actual React components for each template
 *     are built in Batch 2 (ticket #62/#1343). For Batch 1 we define the
 *     contracts, registry stubs, and pipeline so #97 can bind against it.
 */

import React from 'react';
import type { DiagnosticSlug } from '@/types/assessment';
import type {
  AssessmentResultRow,
  AssessmentResultDimensionRow,
  AssessmentArchetypeRow,
  AssessmentDefinitionRow,
} from '@/types/database';
import type { TierKey } from '@/config/tierConfig';

/* ── Template Identifiers ─────────────────────────────────────────── */

export type B2CTemplateId =
  | 'assessment/web/result'              // 1 — shared web layout
  | 'assessment/pdf/prism'               // 2
  | 'assessment/pdf/spark'               // 3
  | 'assessment/pdf/forge'               // 4
  | 'assessment/pdf/bridge'              // 5
  | 'assessment/pdf/mosaic'              // 6
  | 'assessment/pdf/drive'               // 7
  | 'assessment/email/share-result';     // 8 — share email

export const ALL_B2C_TEMPLATE_IDS: B2CTemplateId[] = [
  'assessment/web/result',
  'assessment/pdf/prism',
  'assessment/pdf/spark',
  'assessment/pdf/forge',
  'assessment/pdf/bridge',
  'assessment/pdf/mosaic',
  'assessment/pdf/drive',
  'assessment/email/share-result',
];

/* ── Template kinds (drives rendering host) ──────────────────────── */

export type TemplateKind = 'web' | 'pdf' | 'email';

/* ── Data shape — shared across all 6 diagnostic result templates ── */

export interface AssessmentResultData {
  definition: Pick<AssessmentDefinitionRow, 'assessment_id' | 'title' | 'subtitle' | 'accent_color' | 'tier_key' | 'total_questions' | 'total_dimensions'>;
  result: Pick<AssessmentResultRow, 'result_id' | 'attempt_id' | 'overall_score' | 'overall_level' | 'style_key' | 'archetype_key' | 'insights' | 'completed_at'>;
  dimensions: Array<Pick<AssessmentResultDimensionRow, 'dimension_key' | 'score' | 'level' | 'dimension_name' | 'description'>>;
  archetype?: Pick<AssessmentArchetypeRow, 'archetype_key' | 'name' | 'description' | 'key_traits'> | null;
  aiInsights?: {
    summary: string;
    strengths: string[];
    growthAreas: string[];
    nextSteps: string[];
  };
  /** Executive Introduction tier sees this as partial; #1343 redactions apply */
  viewerTier: TierKey;
  recipient: {
    name: string;
    displayName?: string;
    email?: string;
  };
  /** Optional share-token (for share link + share email templates) */
  shareToken?: string;
  shareBaseUrl?: string;
}

/* ── Abstract Template Interface ──────────────────────────────────── */

export interface ReportTemplate<Data = unknown, Ctx = unknown> {
  id: B2CTemplateId;
  /** Diagnostic slug this template is for — null for generic (web wrapper / share) */
  diagnostic: DiagnosticSlug | null;
  kind: TemplateKind;
  title: string;               // human readable, e.g. "PRISM PDF — Career Branding Report"
  description: string;         // 1-line for registry UI

  /** Type guard / validator — returns list of validation issues (empty = OK) */
  validateData(data: unknown): string[];

  /**
   * Tier-based redactions (#1343).
   * Executive Introduction = partial insights + upgrade CTA appended.
   * Professional+ = full data pass-through.
   * Returns a NEW data copy — NEVER mutate input.
   */
  applyTierRedactions(data: Data, viewerTier: TierKey): { data: Data; ctaVariant?: 'executive_introduction_upgrade' | null };

  /**
   * Render the template to a React node.
   * ctx is reserved for per-call flags (e.g. { forPdfExport: true, locale })
   */
  render(data: Data, ctx?: RenderContext<Ctx>): React.ReactElement;
}

export interface RenderContext<Extras = unknown> {
  forPdfExport?: boolean;
  forEmailEmbed?: boolean;
  locale?: 'en' | 'zh';
  brand?: 'standard' | 'premium';
  extras?: Extras;
}

/* ── Pipeline: validate → redact → render ─────────────────────────── */

export interface RenderReportOptions<Ctx = unknown> extends RenderContext<Ctx> {
  /** Skip validation for perf hot paths (caller already validated) — defaults false */
  skipValidate?: boolean;
  /** Force a specific viewer tier in rendering (used in preview/admin) */
  overrideViewerTier?: TierKey;
}

export interface RenderReportResult<Data = unknown> {
  node: React.ReactElement;
  template: B2CTemplateId;
  validation: string[];
  redactions: {
    applied: boolean;
    ctaVariant: 'executive_introduction_upgrade' | null;
  };
  data: Data;
}

/**
 * Primary entry point: run a template through the full pipeline.
 */
export function renderReport<Data, Ctx = unknown>(
  template: ReportTemplate<Data, Ctx>,
  data: Data,
  options: RenderReportOptions<Ctx> = {},
): RenderReportResult<Data> {
  // 1) Validate (unless caller opts out)
  const validation = options.skipValidate ? [] : template.validateData(data);

  // 2) Resolve viewer tier (override → data.viewerTier → fallback: executive_introduction)
  const viewerTier: TierKey =
    options.overrideViewerTier ??
    ((data as AssessmentResultData)?.viewerTier ?? 'executive_introduction');

  // 3) Tier redactions
  const redacted = template.applyTierRedactions(data, viewerTier);

  // 4) Render
  const renderCtx: RenderContext<Ctx> = {
    forPdfExport: options.forPdfExport,
    forEmailEmbed: options.forEmailEmbed,
    locale: options.locale,
    brand: options.brand,
    extras: options.extras,
  };
  const node = template.render(redacted.data, renderCtx);

  return {
    node,
    template: template.id,
    validation,
    redactions: {
      applied: viewerTier === 'executive_introduction',
      ctaVariant: redacted.ctaVariant ?? null,
    },
    data: redacted.data,
  };
}

/* ── Registry stubs (8 templates) ──────────────────────────────────
 * Batch 1: registry entries with placeholder renderers.
 * Batch 2: replace each placeholder with real React implementations per #62/#1343.
 * Each entry is typed, so TS enforces contracts immediately.
 */

type AssessmentResultTemplate = ReportTemplate<AssessmentResultData>;

/** Placeholder that renders a "Template stub" banner — used until Batch 2. */
function stubTemplate(id: B2CTemplateId, diagnostic: DiagnosticSlug | null, kind: TemplateKind, title: string): AssessmentResultTemplate {
  return {
    id,
    diagnostic,
    kind,
    title,
    description: `${title} — stub implementation (Batch 2: #62/#1343 will replace)`,
    validateData(data) {
      const d = data as AssessmentResultData | null | undefined;
      const issues: string[] = [];
      if (!d) return ['data is null/undefined'];
      if (!d.definition?.assessment_id) issues.push('definition.assessment_id is required');
      if (typeof d.result?.overall_score !== 'number' || d.result.overall_score < 0 || d.result.overall_score > 100) {
        issues.push('result.overall_score must be a number 0-100');
      }
      if (!Array.isArray(d.dimensions)) issues.push('dimensions must be an array');
      if (!d.recipient?.name) issues.push('recipient.name is required');
      return issues;
    },
    applyTierRedactions(data, viewerTier) {
      // Executive Introduction redaction spec (#1343):
      //  - AI insights: show summary only, hide growth areas/next steps
      //  - Dimensions: show 3, truncate rest with "Upgrade to see all N"
      //  - Insert upgrade CTA
      if (viewerTier !== 'executive_introduction') {
        return { data, ctaVariant: null };
      }
      const next = { ...data };
      if (next.aiInsights) {
        next.aiInsights = {
          summary: next.aiInsights.summary,
          strengths: next.aiInsights.strengths.slice(0, 1),
          growthAreas: [],
          nextSteps: [],
        };
      }
      if (next.dimensions && next.dimensions.length > 3) {
        next.dimensions = next.dimensions.slice(0, 3);
      }
      return { data: next, ctaVariant: 'executive_introduction_upgrade' };
    },
    render(data) {
      const slug = data.definition.assessment_id ?? 'unknown';
      return React.createElement(
        'div',
        {
          className: `report-shell report-accent-${slug} report-a4`,
          'data-template': id,
          'data-stub': '1',
          style: { padding: '32px', border: '2px dashed var(--report-border-strong)' },
        },
        React.createElement('p', { className: 'report-brand-mark' }, `TEMPLATE STUB — Batch 2 implementation`),
        React.createElement('h1', { className: 'report-h1' }, title),
        React.createElement('p',  { className: 'report-lead' }, `${data.recipient.name} — ${data.definition.title ?? slug}`),
        React.createElement('p',  { className: 'report-body' }, `Overall score: ${data.result.overall_score} / 100 (${data.result.overall_level ?? '—'})`),
      );
    },
  };
}

export const TEMPLATES: Record<B2CTemplateId, AssessmentResultTemplate> = {
  'assessment/web/result':      stubTemplate('assessment/web/result',      null,    'web',   'Assessment Results — Shared Web Layout'),
  'assessment/pdf/prism':       stubTemplate('assessment/pdf/prism',       'prism', 'pdf',   'PRISM — Career & Professional Branding PDF Report'),
  'assessment/pdf/spark':       stubTemplate('assessment/pdf/spark',       'spark', 'pdf',   'SPARK — AI Leadership Readiness PDF Report'),
  'assessment/pdf/forge':       stubTemplate('assessment/pdf/forge',       'forge', 'pdf',   'FORGE — Sales Excellence PDF Report'),
  'assessment/pdf/bridge':      stubTemplate('assessment/pdf/bridge',      'bridge','pdf',   'BRIDGE — China Leadership Readiness PDF Report'),
  'assessment/pdf/mosaic':      stubTemplate('assessment/pdf/mosaic',      'mosaic','pdf',   'MOSAIC — Cultural Intelligence PDF Report'),
  'assessment/pdf/drive':       stubTemplate('assessment/pdf/drive',       'drive', 'pdf',   'DRIVE — Execution Capability Framework PDF Report'),
  'assessment/email/share-result': stubTemplate('assessment/email/share-result', null, 'email', 'Share Result — Email Single-Pager'),
};

/* ── Lookup helpers ─────────────────────────────────────────────── */

/** Diagnostic slug → its PDF template id (6 cases). */
export const DIAGNOSTIC_TO_PDF_TEMPLATE: Record<DiagnosticSlug, B2CTemplateId> = {
  prism:  'assessment/pdf/prism',
  spark:  'assessment/pdf/spark',
  forge:  'assessment/pdf/forge',
  bridge: 'assessment/pdf/bridge',
  mosaic: 'assessment/pdf/mosaic',
  drive:  'assessment/pdf/drive',
};

export function getTemplate(id: B2CTemplateId): AssessmentResultTemplate {
  const t = TEMPLATES[id];
  if (!t) throw new Error(`Unknown B2C template id: ${id}`);
  return t;
}

export function getPdfTemplateFor(slug: DiagnosticSlug): AssessmentResultTemplate {
  return getTemplate(DIAGNOSTIC_TO_PDF_TEMPLATE[slug]);
}

export function listTemplatesByKind(kind: TemplateKind): B2CTemplateId[] {
  return ALL_B2C_TEMPLATE_IDS.filter((id) => TEMPLATES[id].kind === kind);
}
