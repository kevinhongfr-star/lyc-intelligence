/**
 * reportTokens.ts — #61 Report design tokens (TS mirror of reportTokens.css)
 *
 * Consumed by:
 *   - #62 B2C assessment result templates (web + PDF)
 *   - #89 PDF export service
 *   - #76 Template rendering pipeline
 *   - Email inlined CSS helper (#1348 email engine)
 *
 * If you add a variable here, add its CSS var to styles/reportTokens.css.
 */

import type { DiagnosticSlug } from '@/types/assessment';

// ── Diagnostic accent colors (matches .report-accent-<slug> classes) ──
/**
 * Diagnostic accent colors — values locked per #89 PDF spec.
 * PRISM=#C108AB SPARK=#FF6B35 FORGE=#1E88E5 BRIDGE=#00B4D8 MOSAIC=#7B2CBF DRIVE=#2D6A4F
 */
export const DIAGNOSTIC_ACCENTS: Record<DiagnosticSlug, {
  accent: string;
  accent_ink: string;
  accent_5: string;
  accent_10: string;
}> = {
  prism:  { accent: '#C108AB', accent_ink: '#760568', accent_5:  rgba(193,  8,171,0.05), accent_10: rgba(193,  8,171,0.10) },
  spark:  { accent: '#FF6B35', accent_ink: '#C94A15', accent_5:  rgba(255,107, 53,0.05), accent_10: rgba(255,107, 53,0.10) },
  forge:  { accent: '#1E88E5', accent_ink: '#0E5AA2', accent_5:  rgba( 30,136,229,0.05), accent_10: rgba( 30,136,229,0.10) },
  bridge: { accent: '#00B4D8', accent_ink: '#007B96', accent_5:  rgba(  0,180,216,0.05), accent_10: rgba(  0,180,216,0.10) },
  mosaic: { accent: '#7B2CBF', accent_ink: '#4E1682', accent_5:  rgba(123, 44,191,0.05), accent_10: rgba(123, 44,191,0.10) },
  drive:  { accent: '#2D6A4F', accent_ink: '#184330', accent_5:  rgba( 45,106, 79,0.05), accent_10: rgba( 45,106, 79,0.10) },
};

export type DiagnosticAccentKey = DiagnosticSlug;

// ── Typography ──────────────────────────────────────────────────────

export const REPORT_TYPOGRAPHY = {
  fontDisplay: "'Crimson Pro', Georgia, 'Times New Roman', serif",
  fontBody: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'IBM Plex Mono', 'SF Mono', Menlo, Consolas, monospace",
  fontSansFallback: "Arial, sans-serif",    // for Outlook-safe email inlining

  weightLight: 300,
  weightRegular: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,

  textHero:      '40px',
  textCoverH1:   '32px',
  textH1:        '22px',
  textH2:        '18px',
  textH3:        '15px',
  textLead:      '14px',
  textBody:      '12px',
  textCaption:   '10px',
  textMono:      '11px',

  leadingTight:   1.15,
  leadingHeading: 1.25,
  leadingBody:    1.55,
  leadingMono:    1.4,
} as const;

// ── Page sizes (mm for PDF, px for email) ──────────────────────────

export const REPORT_PAGE = {
  a4: { widthMM: 210, heightMM: 297, contentWidthMM: 178, contentHeightMM: 265, marginMM: 16 },
  letter: { widthIn: 8.5, heightIn: 11, contentWidthIn: 6.5, contentHeightIn: 9.0, marginIn: 1.0 },
} as const;

export const EMAIL_LAYOUT = {
  maxWidthPx: 600,
  gutterPx: 36,
  headerStripPx: 6,
  accent: '#C108AB',
  bodyBg: '#FBFAF8',
  body: '#FFFFFF',
} as const;

// ── Paper / color tokens (print-safe) ───────────────────────────────

export const REPORT_COLORS = {
  ink: '#0A0A0A',
  inkSoft: '#2E2C2C',
  text: '#1A1A1A',
  textSecondary: '#5A5A5A',
  muted: '#8C8C8C',
  mutedDim: '#B5B5B5',

  paper: '#FFFFFF',
  paperCream: '#FBFAF8',
  paperAlt: '#F6F5F3',
  card: '#FFFFFF',
  cardAlt: '#FAFAF8',

  border: '#E8E5E2',
  borderStrong: '#C9C5C0',
  borderSubtle: '#F0EEEB',
  divider: '#DDDAD6',

  success: '#0A7A4E',
  teal: '#117A8B',
  warning: '#A86A00',
  error: '#9A2336',
  info: '#1E5A9E',
  dimensionPalette: ['#C108AB', '#117A8B', '#A86A00', '#1E5A9E', '#5C4E95', '#0A7A4E'] as const,
} as const;

// ── Level scale maps score→level → color pair per level ────────────

export const REPORT_LEVELS: ReadonlyArray<{
  level: 'Developing' | 'Proficient' | 'Advanced' | 'Mastery';
  min: number;
  max: number;
  label: string;
  color: string;       // text + bar color
  bg: string;          // card bg
  description: string;
}> = [
  { level: 'Developing', min: 0, max: 39,  label: 'DEVELOPING', color: REPORT_COLORS.error,   bg: 'rgba(154,35,54,0.06)', description: 'Early awareness with clear opportunity for growth' },
  { level: 'Proficient', min: 40, max: 69, label: 'PROFICIENT', color: REPORT_COLORS.warning, bg: 'rgba(168,106,0,0.06)', description: 'Solid foundation — consistency is the next milestone' },
  { level: 'Advanced',   min: 70, max: 89, label: 'ADVANCED',   color: REPORT_COLORS.info,    bg: 'rgba(30,90,158,0.06)', description: 'High capability — selective refinement ahead' },
  { level: 'Mastery',    min: 90, max: 100,label: 'MASTERY',    color: REPORT_COLORS.success, bg: 'rgba(10,122,78,0.06)', description: 'Exceptional discipline — acts as a role model' },
] as const;

/** Map a numeric 0-100 score → matching level config (always returns a valid entry). */
export function scoreToReportLevel(score: number) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return REPORT_LEVELS.find((l) => s >= l.min && s <= l.max) ?? REPORT_LEVELS[0];
}

// ── Confidentiality statement preset (covers / footers) ────────────

export const CONFIDENTIALITY_STATEMENTS = {
  standard: 'CONFIDENTIAL — PREPARED EXCLUSIVELY FOR THE NAMED RECIPIENT. NOT FOR DISTRIBUTION.',
  forClient: 'THIS DOCUMENT CONTAINS PROPRIETARY ASSESSMENT DATA OWNED BY LYC PARTNERS.',
} as const;

// ── Helper: report shell class names from slug + paper size ─────────

export function reportShellClass(slug: DiagnosticSlug, format: 'a4' | 'letter' = 'a4'): string {
  return [
    'report-shell',
    `report-accent-${slug}`,
    format === 'a4' ? 'report-a4' : 'report-letter',
  ].join(' ');
}
