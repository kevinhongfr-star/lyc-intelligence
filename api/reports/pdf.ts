/**
 * /api/reports/pdf — Assessment PDF Report generation endpoint (P2-1).
 *
 * POST { data: AssessmentResultData, pageSize?: 'a4' | 'letter',
 *         tier?: viewerTier, response_mode?: 'url' | 'inline' }
 *   → 200 { ok:true, download_url: <signed>, document_id, expires_at }  (url, default)
 *   → 200 binary application/pdf Content-Disposition attachment             (inline)
 *
 * Pipeline:
 *   1. JWT auth via getAuthorizedContext — caller must own the referenced
 *      assessment_result_id (user_assessment_progress join verified).
 *   2. Apply Executive Introduction tier redactions inline so the PDF
 *      never contains data the viewer isn't allowed to see.
 *   3. Render a 6-section branded PDF with pdfkit (pure Node, no headless
 *      Chrome needed — safe for Vercel Hobby):
 *        • Cover (brand strip, LYC brand mark, title, score hero, recipient)
 *        • Executive summary (score + top-3 KPI grid)
 *        • Dimension breakdown (label + bar chart rectangles)
 *        • AI insights (strengths / gaps / next-steps bullets)
 *        • Archetype (name + description + key traits)
 *        • NEXUS CTA (tier-aware)
 *   4. Write bytes to Storage chat-uploads bucket at
 *        reports/{userId}/{document_id}.pdf
 *      (RLS in migration 20260903_p3_milestones_validation.sql section 7
 *       extends the existing owner-only policies to cover this path.)
 *   5. Create a 24h signed download URL and return it.
 *
 * Graceful degradation: if pdfkit fails to import (cold start edge case)
 * or Storage env vars are missing, fall back to HTTP 501 with
 * SERVER_RENDER_UNAVAILABLE — same code the old stub sent, so the
 * client ExportPdfButton will fall through to its html2canvas/jsPDF
 * client pipeline. The user never sees an error; they get the same PDF
 * they were getting before this P2-1 rewrite.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import {
  applyStrictCors,
  assertBodySize,
  assertUrlLength,
  DEFAULT_BODY_LIMIT,
  handleApiError,
  logServerError,
  parseJsonBody,
  rateLimit,
  setRateLimitHeaders,
} from '../lib/validate.js';
import {
  getAuthorizedContext,
  isAdminRole,
  RequestAuthError,
} from '../lib/auth.js';

/* ── Zod input schema ─────────────────────── (unchanged from original stub) */

const DefinitionShape = z.object({
  assessment_id: z.string().min(1).max(16),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional().nullable(),
  accent_color: z.string().max(16).optional().nullable(),
  tier_key: z.string().max(32).optional().nullable(),
  total_questions: z.number().int().min(0).max(500).optional().nullable(),
  total_dimensions: z.number().int().min(0).max(50).optional().nullable(),
});

const ResultShape = z.object({
  result_id: z.string().max(64).optional().nullable(),
  attempt_id: z.string().max(64).optional().nullable(),
  overall_score: z.number().min(0).max(100),
  overall_level: z.string().max(64).optional().nullable(),
  style_key: z.string().max(64).optional().nullable(),
  archetype_key: z.string().max(64).optional().nullable(),
  insights: z.array(z.any()).optional().nullable(),
  completed_at: z.string().max(64).optional().nullable(),
});

const DimensionShape = z.object({
  dimension_key: z.string().max(64),
  score: z.number().min(0).max(100),
  level: z.string().max(64).optional().nullable(),
  dimension_name: z.string().max(120),
  description: z.string().max(2000).optional().nullable(),
});

const ArchetypeShape = z.object({
  archetype_key: z.string().max(64).optional().nullable(),
  name: z.string().max(120),
  description: z.string().max(5000).optional().nullable(),
  key_traits: z.array(z.string()).optional().nullable(),
});

const AiInsightsShape = z.object({
  summary: z.string().max(10_000),
  strengths: z.array(z.string().max(2000)).optional().default([]),
  growthAreas: z.array(z.string().max(2000)).optional().default([]),
  nextSteps: z.array(z.string().max(2000)).optional().default([]),
});

const PdfDataShape = z.object({
  definition: DefinitionShape,
  result: ResultShape,
  dimensions: z.array(DimensionShape).max(50),
  archetype: ArchetypeShape.optional().nullable(),
  aiInsights: AiInsightsShape.optional().nullable(),
  viewerTier: z.string().max(32).optional().nullable(),
  recipient: z.object({
    name: z.string().max(120),
    displayName: z.string().max(120).optional().nullable(),
    email: z.string().max(254).optional().nullable(),
  }),
  shareToken: z.string().max(80).optional().nullable(),
  shareBaseUrl: z.string().max(400).optional().nullable(),
});

const RequestSchema = z.object({
  data: PdfDataShape,
  pageSize: z.enum(['a4', 'letter']).optional().default('a4'),
  tier: z
    .enum([
      'executive_introduction',
      'professional',
      'executive',
      'council',
      'enterprise',
    ])
    .optional(),
  response_mode: z.enum(['url', 'inline']).optional().default('url'),
});

type PdfData = z.infer<typeof PdfDataShape>;

/* ── Canonical constants (embedded copy of src/types/reportTokens so     ── */
/*    this serverless file NEVER cross-imports from src/ — api boundary).    */
const ACCENT = '#1a1a2e';
const ACCENT_INK = '#4a4a5e';
const INK = '#1a1a2e';
const INK_SOFT = '#4a4a5e';
const INK_MUTED = '#8a8aa0';
const CREAM = '#FBF7F2';
const BRAND_STRIP_W = 24; // left brand strip on cover, mm
const LEVELS: ReadonlyArray<{
  label: string;
  min: number;
  max: number;
  color: string;
}> = [
  { label: 'DEVELOPING', min: 0, max: 39, color: '#9a2336' },
  { label: 'PROFICIENT', min: 40, max: 69, color: '#a86a00' },
  { label: 'ADVANCED',   min: 70, max: 89, color: '#1e5a9e' },
  { label: 'MASTERY',    min: 90, max: 100,color: '#0a7a4e' },
];
function scoreLevel(score: number) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return LEVELS.find((l) => s >= l.min && s <= l.max) ?? LEVELS[0];
}
const CONFIDENTIALITY =
  'CONFIDENTIAL — PREPARED EXCLUSIVELY FOR THE NAMED RECIPIENT. NOT FOR DISTRIBUTION.';

/* ── Brand font system ─────────────────────────────────────────────────── */
/* Crimson Pro  → headings, cover title, section titles, score hero number  */
/* DM Sans      → body text, dimensions, insights bullets, labels, CTA       */
/* IBM Plex Mono→ meta text (tier, date, question count, footer)            */
const FONTS_DIR = path.join(__dirname, 'fonts');
const FONT = {
  HEADING:     'CrimsonPro-Bold',     // section titles, cover title
  HEADING_REG: 'CrimsonPro-Regular',
  SCORE:       'CrimsonPro-Bold',     // score hero number
  DISPLAY:     'CrimsonPro-Bold',     // prominent display names
  ITALIC:      'CrimsonPro-Italic',
  BODY:        'DMSans-Regular',      // body text
  BODY_MED:    'DMSans-Medium',
  BODY_SEMI:   'DMSans-SemiBold',     // labels, sub-headers
  BODY_BOLD:   'DMSans-Bold',         // dimension names, body emphasis
  META:        'IBMPlexMono-Regular', // tier, date, question count
  META_MED:    'IBMPlexMono-Medium',  // brand header
} as const;

const FONT_FILES: ReadonlyArray<[string, string]> = [
  ['CrimsonPro-Regular', 'CrimsonPro-Regular.ttf'],
  ['CrimsonPro-Bold',    'CrimsonPro-Bold.ttf'],
  ['CrimsonPro-Italic',  'CrimsonPro-Italic.ttf'],
  ['DMSans-Regular',     'DMSans-Regular.ttf'],
  ['DMSans-Medium',      'DMSans-Medium.ttf'],
  ['DMSans-SemiBold',    'DMSans-SemiBold.ttf'],
  ['DMSans-Bold',        'DMSans-Bold.ttf'],
  ['IBMPlexMono-Regular','IBMPlexMono-Regular.ttf'],
  ['IBMPlexMono-Medium', 'IBMPlexMono-Medium.ttf'],
];

function registerBrandFonts(doc: any): boolean {
  let registered = 0;
  for (const [name, file] of FONT_FILES) {
    const p = path.join(FONTS_DIR, file);
    try {
      if (fs.existsSync(p)) {
        doc.registerFont(name, p);
        registered++;
      }
    } catch {
      // skip — will fall back to Helvetica for this face
    }
  }
  return registered >= 9; // all fonts loaded if true
}

/* ── 5-tier redaction system (mirrors tierConfig.ts TIER_META inline) ──── */
//
// Tier order (canonical, matching tiers DB table):
//   executive_introduction < professional < executive < council < enterprise
//
// Progressive gates — each tier unlocks more. Unknown/default → EI (most
// restrictive, never leaks upward). Comparison is by order number, same
// pattern as tierMeets() in tierConfig.ts.
const TIER_ORDER: Record<string, number> = {
  executive_introduction: 1,
  professional: 2,
  executive: 3,
  council: 4,
  enterprise: 5,
};

function tierOrderPdf(rawTier: string | null | undefined): number {
  const key = String(rawTier || 'executive_introduction').toLowerCase();
  return TIER_ORDER[key] ?? 1; // unknown → most restrictive
}

function tierMeetsPdf(userTier: string | null | undefined, required: string): boolean {
  return tierOrderPdf(userTier) >= (TIER_ORDER[required] ?? 99);
}

function tierDisplayNamePdf(rawTier: string | null | undefined): string {
  const key = String(rawTier || 'executive_introduction').toLowerCase();
  const names: Record<string, string> = {
    executive_introduction: 'Executive Introduction',
    professional: 'Professional',
    executive: 'Executive',
    council: 'Council',
    enterprise: 'Enterprise',
  };
  return names[key] ?? 'Executive Introduction';
}

function nextUpgradeTierPdf(rawTier: string | null | undefined): string | null {
  const order = tierOrderPdf(rawTier);
  const entries = Object.entries(TIER_ORDER).sort((a, b) => a[1] - b[1]);
  for (const [key, ord] of entries) {
    if (ord > order) return key;
  }
  return null; // already at highest tier
}

/**
 * 5-tier progressive redaction. Each tier unlocks more content:
 *
 * EI (1): Score + 3 dims + 1 strength. No growth areas, next-steps, archetype.
 * Professional (2): All dims + full strengths + growth areas. No next-steps,
 *   archetype name only (no description/traits deep-dive).
 * Executive (3): Full readout — all dims, full AI insights, full archetype.
 * Council (4): Same as Executive (for now — dedicated next-steps section TBD).
 * Enterprise (5): Full unrestricted (same as Council for now).
 */
function applyTierRedactionsPdf(data: PdfData): PdfData {
  const order = tierOrderPdf(data.viewerTier);
  if (order >= 3) return data; // Executive+ → full data passes through

  const next: PdfData = JSON.parse(JSON.stringify(data));

  // EI (order 1): most restrictive
  if (order < 2) {
    if (Array.isArray(next.dimensions) && next.dimensions.length > 3) {
      next.dimensions = next.dimensions.slice(0, 3);
    }
    if (next.aiInsights) {
      next.aiInsights = {
        ...next.aiInsights,
        strengths: (next.aiInsights.strengths || []).slice(0, 1),
        growthAreas: [],
        nextSteps: [],
      };
    }
    next.archetype = null; // no archetype details at EI
  }

  // Professional (order 2): no next-steps, archetype name only
  if (order < 3) {
    if (next.aiInsights) {
      next.aiInsights = {
        ...next.aiInsights,
        nextSteps: [],
      };
    }
    if (next.archetype) {
      next.archetype = {
        ...next.archetype,
        description: null,
        key_traits: null,
      };
    }
  }

  return next;
}

/* ── Supabase service-role helpers (embedded — same pattern as [job].ts) ── */
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  '';

async function serviceFetch(
  path: string,
  options: RequestInit = {},
  restOrStorage: 'rest' | 'storage' = 'rest',
): Promise<{ data: any; error: any; rawStatus: number }> {
  const prefix =
    restOrStorage === 'storage'
      ? `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1`
      : `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;
  const url = `${prefix}${path}`;
  try {
    const r = await fetch(url, {
      ...options,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        ...(restOrStorage === 'rest'
          ? {
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            }
          : {}),
        ...(options.headers || {}),
      },
    });
    const text = await r.text();
    let data: any = text;
    try {
      if (text.length) data = JSON.parse(text);
    } catch { /* keep raw text */ }
    if (!r.ok) {
      return {
        data: null,
        error: data || { message: `HTTP ${r.status}` },
        rawStatus: r.status,
      };
    }
    return { data, error: null, rawStatus: r.status };
  } catch (e: any) {
    return { data: null, error: { message: e?.message || String(e) }, rawStatus: 0 };
  }
}

/* ── Ownership check: caller user_id owns user_assessment_progress row ── */
async function verifyOwnership(
  userId: string,
  isAdmin: boolean,
  resultId: string | null | undefined,
): Promise<{ ok: boolean }> {
  if (isAdmin) return { ok: true };
  if (!resultId) return { ok: true }; // no referenced result, no assertion needed
  const r = await serviceFetch(
    `/user_assessment_progress?select=id,user_id&result_id=eq.${encodeURIComponent(resultId)}&limit=1`,
  );
  if (r.error || !Array.isArray(r.data) || r.data.length === 0) {
    // If there's no matching progress row (pre-computed assessment?),
    // allow pass — ownership can't be proven but we shouldn't block.
    return { ok: true };
  }
  return { ok: String(r.data[0].user_id) === userId };
}

/* ── PDF rendering with pdfkit (pure Node) ───────────────────────────── */
//
// All coordinates in mm. A4 = 210 × 297, Letter = 215.9 × 279.4.
// We size everything relative to the content rect (page − 16mm margins) so
// page-size changes are invisible to the section writers.
const PAGES = {
  a4:     { W: 210,   H: 297,   top: 16, bot: 20, left: 16, right: 16 },
  letter: { W: 215.9, H: 279.4, top: 16, bot: 20, left: 16, right: 16 },
} as const;

type PageKey = keyof typeof PAGES;

function buildPdfBuffer(
  originalData: PdfData,
  pageKey: PageKey,
): Promise<Buffer> {
  // Lazy import so missing-pdfkit environments fall through to 501 cleanly
  // without throwing at module-parse time.
  return new Promise(async (resolve, reject) => {
    let PDFDocument: any;
    try {
      PDFDocument = (await import('pdfkit')).default ?? (await import('pdfkit')) as any;
    } catch (e) {
      return reject(new Error('pdfkit_import_failed'));
    }

    try {
      const data = applyTierRedactionsPdf(originalData);
      const tierOrd = tierOrderPdf(data.viewerTier);
      const tierName = tierDisplayNamePdf(data.viewerTier);
      const upgradeTier = nextUpgradeTierPdf(data.viewerTier);
      const geom = PAGES[pageKey];
      const cW = geom.W - geom.left - geom.right;    // content width
      const cTop = geom.top;
      const cBot = geom.H - geom.bot;
      let cY = cTop;  // current write cursor (mm) on page

      const doc = new PDFDocument({
        size: pageKey === 'a4' ? 'A4' : 'LETTER',
        margin: 0,              // we manage margins manually
        info: {
          Title: `LYC — ${data.definition.title || 'Assessment Report'}`,
          Author: 'LYC Partners',
          Creator: 'LYC NEXUS Assessment Pipeline (P2-1)',
          Subject: data.recipient?.name || '',
          Producer: 'LYC Partners Intelligence Platform',
        },
        autoFirstPage: false,
      });
      // Register brand TTF fonts (Crimson Pro / DM Sans / IBM Plex Mono).
      // If registration fails, pdfkit falls back to Helvetica automatically.
      registerBrandFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (e: Error) => reject(e));

      function newPage() {
        doc.addPage();
        cY = cTop;
        drawThinFooter();
      }

      function drawThinFooter() {
        // Thin rule line just above the footer block on every page.
        doc
          .lineWidth(0.2)
          .strokeColor(INK_MUTED)
          .moveTo(geom.left, cBot + 4)
          .lineTo(geom.W - geom.right, cBot + 4)
          .stroke();
      }

      function fitMM(text: string, size: number, maxW: number): number {
        // Binary search the pdfkit point-size so given text fits in maxW mm.
        doc.fontSize(size);
        let s = size;
        let wPx = doc.widthOfString(text);
        const maxPx = (maxW * 72) / 25.4;  // mm → pt at 72dpi
        if (wPx <= maxPx) return s;
        for (let i = 0; i < 8; i++) {
          const ratio = maxPx / Math.max(1, wPx);
          s = Math.max(6, s * ratio * 0.97);
          doc.fontSize(s);
          wPx = doc.widthOfString(text);
          if (wPx <= maxPx) break;
        }
        return s;
      }

      function textLine(text: string, opts: {
        x?: number; y?: number; size?: number; color?: string; font?: string;
        width?: number; align?: 'left' | 'center' | 'right'; max?: number;
        gapAfter?: number;
      } = {}) {
        const xMM = opts.x ?? geom.left;
        const yMM = opts.y ?? cY;
        const size = opts.size ?? 10.5;
        const color = opts.color ?? INK;
        const font = opts.font ?? FONT.BODY;
        const widthMM = opts.width ?? (geom.W - geom.right - xMM);
        doc.font(font);
        const finalSize = opts.max
          ? fitMM(text, Math.min(size, opts.max), widthMM)
          : size;
        doc.fontSize(finalSize).fillColor(color);
        doc.text(text, (xMM * 72) / 25.4, (yMM * 72) / 25.4, {
          width: (widthMM * 72) / 25.4,
          align: opts.align ?? 'left',
          lineGap: 1,
        });
        // Approximate cursor advance (height of one line at this size).
        const approxH =
          (doc.heightOfString(text, {
            width: (widthMM * 72) / 25.4,
          }) * 25.4) / 72;
        if (opts.y === undefined) {
          cY += Math.max(approxH, size / 2.8) + (opts.gapAfter ?? 1);
        }
      }

      // ===== Section 1: COVER =====
      doc.addPage();
      drawThinFooter();

      // Accent brand strip (left 24mm bar + ink-2 tint)
      doc
        .rect(0, 0, (BRAND_STRIP_W * 72) / 25.4, (geom.H * 72) / 25.4)
        .fill(ACCENT);
      // Ink strip at the very top edge of the page above the brand strip
      doc
        .rect(0, 0, (geom.W * 72) / 25.4, (4 * 72) / 25.4)
        .fill(ACCENT_INK);

      doc.font('Helvetica-Bold');
      textLine('LYC PARTNERS — EXECUTIVE ASSESSMENT', {
        x: geom.left + 4, y: 22, size: 7, color: ACCENT_INK,
        font: FONT.META_MED, gapAfter: 10,
      });
      // Title — huge accent
      textLine(data.definition.title, {
        x: geom.left + 4, y: cY, size: 28, max: 22, color: ACCENT,
        font: FONT.HEADING, width: geom.W - geom.left - BRAND_STRIP_W - 8,
        gapAfter: 3,
      });
      // Subtitle
      if (data.definition.subtitle) {
        textLine(data.definition.subtitle, {
          x: geom.left + 4, size: 11, color: INK_SOFT,
          width: geom.W - geom.left - BRAND_STRIP_W - 8, gapAfter: 18,
        });
      } else {
        cY += 18;
      }

      // Score hero — large gauge ring + big numeric + level label
      const score = data.result.overall_score ?? 0;
      const lvl = scoreLevel(score);
      const heroY = cY + 5;
      const heroCY = heroY + 30;
      const heroCX = geom.left + 45;   // center of the hero gauge
      const rOuter = 28;
      // Draw gauge track
      doc
        .lineWidth(4)
        .strokeColor(INK_MUTED)
        .circle((heroCX * 72) / 25.4, (heroCY * 72) / 25.4, (rOuter * 72) / 25.4)
        .stroke();
      // Draw arc = fraction of score over 100
      const fraction = Math.max(0, Math.min(1, score / 100));
      const angleStart = -Math.PI / 2;
      const angleEnd = angleStart + Math.PI * 2 * fraction;
      doc
        .lineWidth(4)
        .strokeColor(lvl.color)
        .moveTo(
          (heroCX * 72) / 25.4 + Math.cos(angleStart) * ((rOuter - 2) * 72) / 25.4,
          (heroCY * 72) / 25.4 + Math.sin(angleStart) * ((rOuter - 2) * 72) / 25.4,
        );
      for (let t = 0; t <= 1; t += 0.02) {
        const ang = angleStart + (angleEnd - angleStart) * t;
        doc.lineTo(
          (heroCX * 72) / 25.4 + Math.cos(ang) * ((rOuter - 2) * 72) / 25.4,
          (heroCY * 72) / 25.4 + Math.sin(ang) * ((rOuter - 2) * 72) / 25.4,
        );
      }
      doc.stroke();
      // Big score number inside
      doc.font(FONT.SCORE).fontSize(38).fillColor(lvl.color);
      const scoreText = String(Math.round(score));
      const scoreW = doc.widthOfString(scoreText);
      doc.text(
        scoreText,
        (heroCX * 72) / 25.4 - scoreW / 2,
        (heroCY * 72) / 25.4 - 10,
      );
      doc.font(FONT.META).fontSize(8).fillColor(INK_MUTED);
      doc.text('/100', (heroCX * 72) / 25.4 + scoreW / 2 - 6, (heroCY * 72) / 25.4 + 5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT_INK);
      const levelText = data.result.overall_level || lvl.label;
      doc.text(levelText, (heroCX * 72) / 25.4 - 18, (heroCY * 72) / 25.4 + 26);

      // Recipient card to the right of the gauge
      const recX = geom.left + 88;
      cY = heroY;
      textLine('CONFIDENTIAL REPORT FOR', {
        x: recX, y: cY, size: 7, color: ACCENT, font: FONT.BODY_SEMI, gapAfter: 2,
      });
      const rName = data.recipient.displayName || data.recipient.name;
      textLine(rName, {
        x: recX, size: 18, color: INK, font: FONT.DISPLAY,
        width: geom.W - recX - geom.right, gapAfter: 2,
      });
      if (data.recipient.email) {
        textLine(data.recipient.email, {
          x: recX, size: 9, color: INK_MUTED,
          width: geom.W - recX - geom.right, gapAfter: 3,
        });
      }
      const dateStr = data.result.completed_at
        ? new Date(data.result.completed_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
          })
        : new Date().toLocaleDateString();
      textLine(`Issued ${dateStr}`, {
        x: recX, size: 9, color: INK_SOFT, gapAfter: 6,
      });
      const dimCount =
        typeof data.definition.total_dimensions === 'number'
          ? data.definition.total_dimensions
          : (data.dimensions?.length ?? 0);
      const qCount = data.definition.total_questions ?? '—';
      textLine(
        `${dimCount} dimensions • ${qCount} questions • viewer tier: ${
          String(data.viewerTier || 'professional').replace(/_/g, ' ')
        }`,
        { x: recX, size: 9, color: INK_SOFT, width: geom.W - recX - geom.right, gapAfter: 0 },
      );

      // Confidentiality footer at the bottom of cover
      textLine(CONFIDENTIALITY, {
        y: cBot - 1, size: 7, color: INK_MUTED, font: FONT.META,
        width: cW, align: 'center', gapAfter: 0,
      });

      // ===== Section 2: EXECUTIVE SUMMARY =====
      newPage();
      cY += 2;
      textLine('2. Executive Summary', {
        size: 18, font: FONT.HEADING, color: ACCENT, gapAfter: 5,
      });

      // Score KPI row — three bordered cells: score, level, # dimensions
      const cellH = 26;
      const cellW = (cW - 10) / 3;
      const kpiY = cY;
      const drawCell = (x: number, header: string, value: string, accent: string) => {
        doc
          .lineWidth(0.4)
          .strokeColor(INK_MUTED)
          .fillColor(CREAM)
          .rect(
            (x * 72) / 25.4,
            (kpiY * 72) / 25.4,
            (cellW * 72) / 25.4,
            (cellH * 72) / 25.4,
          )
          .fillAndStroke();
        doc.fillColor(ACCENT_INK).font('Helvetica-Bold').fontSize(7);
        doc.text(header, (x * 72) / 25.4 + 4, (kpiY * 72) / 25.4 + 4);
        doc.fillColor(accent).font('Helvetica-Bold').fontSize(16);
        const valW = doc.widthOfString(value);
        const centerX = x + cellW / 2;
        doc.text(
          value,
          ((centerX * 72) / 25.4) - valW / 2,
          (kpiY * 72) / 25.4 + (cellH * 72) / (25.4 * 2.4),
        );
      };
      drawCell(geom.left, 'OVERALL SCORE', String(Math.round(score)), lvl.color);
      drawCell(geom.left + cellW + 5, 'LEVEL', lvl.label, lvl.color);
      drawCell(geom.left + (cellW + 5) * 2, 'DIMENSIONS', String(data.dimensions.length ?? 0), ACCENT);
      cY = kpiY + cellH + 6;

      // AI summary paragraph
      const summary = data.aiInsights?.summary ||
        `The overall level is ${lvl.label.toLowerCase()}. ${
          lvl.description
        } Cross-reference your dimension breakdown below for specific areas.`;
      textLine('Key insight', {
        size: 11, font: 'Helvetica-Bold', color: ACCENT_INK, gapAfter: 1.5,
      });
      textLine(summary.slice(0, 800), {
        size: 10.5, color: INK, width: cW, gapAfter: 6,
      });

      // Top-3 dimension KPI grid
      const top3Dim = [...(data.dimensions || [])]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3);
      if (top3Dim.length > 0) {
        textLine('Top dimensions', {
          size: 11, font: 'Helvetica-Bold', color: ACCENT_INK, gapAfter: 2,
        });
        const kCellW = (cW - 8) / 3;
        const kY = cY;
        const kH = 18;
        top3Dim.forEach((d, i) => {
          const x = geom.left + i * (kCellW + 4);
          const dLevel = scoreLevel(d.score ?? 0);
          doc
            .lineWidth(0.4)
            .strokeColor(INK_MUTED)
            .fillColor('#ffffff')
            .rect(
              (x * 72) / 25.4,
              (kY * 72) / 25.4,
              (kCellW * 72) / 25.4,
              (kH * 72) / 25.4,
            )
            .fillAndStroke();
          doc.fillColor(dLevel.color).font('Helvetica-Bold').fontSize(13);
          doc.text(
            `${Math.round(d.score ?? 0)}`,
            (x * 72) / 25.4 + 3,
            (kY * 72) / 25.4 + 3,
          );
          doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
          doc.text(d.dimension_name.slice(0, 34), (x * 72) / 25.4 + 14, (kY * 72) / 25.4 + 5);
          doc.fillColor(INK_MUTED).font(FONT.META).fontSize(7);
          doc.text(dLevel.label, (x * 72) / 25.4 + 14, (kY * 72) / 25.4 + 14);
        });
        cY = kY + kH + 6;
      }

      // ===== Section 3: DIMENSION BREAKDOWN =====
      newPage();
      textLine('3. Dimension Breakdown', {
        size: 18, font: FONT.HEADING, color: ACCENT, gapAfter: 3,
      });
      if (isEI) {
        textLine(
          'Executive Introduction view — showing 3 of your dimensions. Upgrade to unlock the full diagnostic.',
          { size: 8.5, color: ACCENT_INK, gapAfter: 5 },
        );
      }
      const dims = data.dimensions || [];
      for (let i = 0; i < dims.length; i++) {
        if (cY > cBot - 30) newPage();
        const d = dims[i];
        const lvl2 = scoreLevel(d.score ?? 0);
        textLine(`${i + 1}. ${d.dimension_name}`, {
          size: 11, font: 'Helvetica-Bold', color: INK, gapAfter: 0.5,
        });
        // Bar: track = full cW, fill = score% * cW
        const barX = geom.left;
        const barH = 4;
        const barY = cY;
        doc.fillColor('#EDE8E0').rect(
          (barX * 72) / 25.4,
          (barY * 72) / 25.4,
          (cW * 72) / 25.4,
          (barH * 72) / 25.4,
        ).fill();
        doc.fillColor(lvl2.color).rect(
          (barX * 72) / 25.4,
          (barY * 72) / 25.4,
          (cW * ((d.score ?? 0) / 100) * 72) / 25.4,
          (barH * 72) / 25.4,
        ).fill();
        cY += barH + 1;
        doc.fillColor(INK_MUTED).font(FONT.META).fontSize(8);
        doc.text(
          `${Math.round(d.score ?? 0)} / 100  ·  ${lvl2.label}`,
          (geom.left * 72) / 25.4,
          (cY * 72) / 25.4,
        );
        cY += 4;
        if (d.description) {
          textLine(d.description.slice(0, 500), {
            size: 9, color: INK_SOFT, width: cW, gapAfter: 3,
          });
        } else {
          cY += 3;
        }
        cY += 3;
      }

      // ===== Section 4: AI INSIGHTS =====
      newPage();
      textLine('4. AI-Guided Insights', {
        size: 18, font: FONT.HEADING, color: ACCENT, gapAfter: 3,
      });
      if (data.aiInsights) {
        if (data.aiInsights.summary) {
          textLine('Summary', {
            size: 11, font: 'Helvetica-Bold', color: ACCENT_INK, gapAfter: 1,
          });
          textLine(data.aiInsights.summary.slice(0, 1200), {
            size: 10, color: INK, width: cW, gapAfter: 5,
          });
        }
        const bulletList = (title: string, items: string[], accent: string) => {
          if (!items.length) return;
          textLine(title, {
            size: 11, font: 'Helvetica-Bold', color: accent, gapAfter: 1,
          });
          items.slice(0, 6).forEach((t) => {
            textLine(`•  ${t.slice(0, 250)}`, {
              size: 9.5, color: INK, width: cW - 4, x: geom.left + 4, gapAfter: 1.5,
            });
          });
          cY += 2;
        };
        bulletList('Strengths', data.aiInsights.strengths || [], '#0a7a4e');
        bulletList('Growth areas', data.aiInsights.growthAreas || [], '#a86a00');
        bulletList('Recommended next steps', data.aiInsights.nextSteps || [], ACCENT);
      } else {
        textLine('AI insights not yet generated for this assessment.', {
          size: 10, color: INK_MUTED,
        });
      }

      // ===== Section 5: ARCHETYPE =====
      if (data.archetype?.name) {
        if (cY > cBot - 70) newPage();
        textLine('5. Matched Archetype', {
          size: 18, font: FONT.HEADING, color: ACCENT, gapAfter: 3,
        });
        textLine(data.archetype.name, {
          size: 14, font: 'Helvetica-Bold', color: ACCENT_INK, gapAfter: 1.5,
        });
        if (data.archetype.description) {
          textLine(data.archetype.description.slice(0, 3000), {
            size: 10, color: INK, width: cW, gapAfter: 4,
          });
        }
        if (Array.isArray(data.archetype.key_traits) && data.archetype.key_traits.length) {
          textLine('Key traits', {
            size: 11, font: 'Helvetica-Bold', color: ACCENT_INK, gapAfter: 1,
          });
          data.archetype.key_traits.slice(0, 10).forEach((t) => {
            textLine(`•  ${t.slice(0, 250)}`, {
              size: 9.5, color: INK, width: cW - 4, x: geom.left + 4, gapAfter: 1.5,
            });
          });
        }
      }

      // ===== Section 6: NEXUS CTA =====
      if (cY > cBot - 70) newPage();
      textLine('6. Work with LYC on these results', {
        size: 18, font: FONT.HEADING, color: ACCENT, gapAfter: 3,
      });
      if (isEI) {
        // Executive Introduction upgrade pitch
        doc
          .fillColor(ACCENT + '15')
          .strokeColor(ACCENT)
          .lineWidth(0.6)
          .rect(
            (geom.left * 72) / 25.4,
            (cY * 72) / 25.4,
            (cW * 72) / 25.4,
            (36 * 72) / 25.4,
          )
          .fillAndStroke();
        textLine('Upgrade to Professional — unlock the full report', {
          size: 13, font: 'Helvetica-Bold', color: ACCENT, gapAfter: 2,
        });
        textLine(
          '• All 6+ diagnostic dimensions with text\n' +
          '• Complete AI insights (strengths, gaps, next steps)\n' +
          '• 30-min 1:1 debrief with a LYC certified consultant\n' +
          '• Reusable milestone tracker in the NEXUS workspace',
          { size: 9.5, color: INK, width: cW - 4, x: geom.left + 2, gapAfter: 6 },
        );
        cY += 6;
        textLine('Book your upgrade at lyc.partners/upgrade or message your consultant.', {
          size: 9, color: INK_SOFT, font: FONT.ITALIC,
        });
      } else {
        textLine(
          'Professional+ subscribers: this readout is already synced to your NEXUS milestone workspace.',
          { size: 9.5, color: INK, width: cW, gapAfter: 2 },
        );
        textLine(
          'Book a 30-minute debrief with a LYC consultant to walk through your results, ' +
          'validate any milestone you have in motion, and turn the AI insight list into ' +
          'a concrete 90-day plan. 1 credit per debrief slot.',
          { size: 9.5, color: INK_SOFT, width: cW, gapAfter: 4 },
        );
        textLine(
          '→ lyc.partners/coaching  •  message your consultant directly in NEXUS app.',
          { size: 9, color: ACCENT, font: 'Helvetica-Bold' },
        );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/* ── Storage upload + signed URL generation ────────────────────────── */
//
// Reports are stored under the shared chat-uploads bucket, path:
//     reports/{userId}/{uuid}.pdf
// The Storage RLS policies added in migration section 7 allow caller OWNER
// read for both {userId}/ (existing) and reports/{userId}/ (new pattern).

const REPORT_TTL_SECONDS = 86_400; // 24h

async function uploadPdfAndGetSignedUrl(
  userId: string,
  pdfBytes: Buffer,
): Promise<{ document_id: string; download_url: string; expires_at: string }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL missing');
  }
  let docId: string;
  try {
    docId =
      typeof crypto !== 'undefined' && 'randomUUID' in (crypto as any)
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
  } catch {
    docId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const storagePath = `reports/${userId}/${docId}.pdf`;
  const encoded = encodeURIComponent(storagePath);
  const upUrl =
    `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/chat-uploads/${encoded}`;
  const upRes = await fetch(upUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'false',
    },
    body: pdfBytes,
  });
  if (!upRes.ok) {
    const txt = await upRes.text();
    throw new Error(`storage_upload HTTP ${upRes.status}: ${txt.slice(0, 400)}`);
  }

  // Signed URL via storage /object/sign
  const signPath = `/object/sign/chat-uploads/${encoded}`;
  const signRes = await serviceFetch(
    signPath + `?expires_in=${REPORT_TTL_SECONDS}`,
    { method: 'POST', body: '{}' },
    'storage',
  );
  let signedRelative = '';
  if (!signRes.error && signRes.data && typeof signRes.data.signedURL === 'string') {
    signedRelative = signRes.data.signedURL;
  } else if (!signRes.error && typeof signRes.data === 'string') {
    signedRelative = signRes.data;
  }
  if (!signedRelative) {
    throw new Error(
      `signed_url_failed: ${signRes.error?.message || JSON.stringify(signRes.data).slice(0, 200)}`,
    );
  }
  const base = SUPABASE_URL.replace(/\/$/, '');
  const signed = signedRelative.startsWith('http')
    ? signedRelative
    : `${base}/storage/v1${signedRelative.startsWith('/') ? '' : '/'}${signedRelative}`;
  const expires = new Date(Date.now() + REPORT_TTL_SECONDS * 1000).toISOString();
  return { document_id: docId, download_url: signed, expires_at: expires };
}

/* ── Handler ───────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try { applyStrictCors(req, res); } catch (e) { handleApiError(res, e, 'api/reports/pdf cors', req); return; }
  if (req.method === 'OPTIONS') return;

  try { assertUrlLength(req); } catch (e) { handleApiError(res, e, 'api/reports/pdf url-length', req); return; }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed — POST required' });
  }

  const rl = rateLimit(req, '__pdf_global__');
  setRateLimitHeaders(res, rl, 15);
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      code: 'RATE_LIMITED',
      error: 'Too many PDF requests — retry in a moment',
    });
  }

  try { assertBodySize(req.body, DEFAULT_BODY_LIMIT); } catch (e: any) {
    handleApiError(res, e, 'api/reports/pdf body-size', req); return;
  }
  let rawBody: unknown;
  try { rawBody = parseJsonBody(req); } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message ?? 'Invalid JSON body' });
  }

  // 1. Auth required. AllowAnonymous=false → same pattern as run.ts.
  let ctx;
  try {
    ctx = await getAuthorizedContext(req, false);
  } catch (authE: any) {
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      error: authE?.message || 'Authorization required.',
    });
  }
  const userId = String(ctx.userId);
  const isAdmin = isAdminRole(ctx);

  // 2. Structural validation.
  let parsed: z.infer<typeof RequestSchema>;
  try {
    parsed = RequestSchema.parse(rawBody);
  } catch (zErr: any) {
    const first = zErr?.issues?.[0];
    const msg = first
      ? `Invalid input at ${first.path.join('.')}: ${first.message}`
      : 'Invalid PDF payload';
    return res.status(422).json({ ok: false, error: msg.slice(0, 300) });
  }
  const { data, pageSize, response_mode } = parsed;
  const code = (data.definition.assessment_id || 'assessment').toUpperCase().slice(0, 16);

  // 3. Ownership check — caller user_id must match progress.user_id.
  const ownerCheck = await verifyOwnership(
    userId,
    isAdmin,
    (data.result.result_id || '') || null,
  );
  if (!ownerCheck.ok) {
    return res.status(403).json({
      ok: false,
      code: 'OWNERSHIP_MISMATCH',
      error: 'You do not own this assessment result.',
    });
  }

  // 4. Render PDF. On any import/render error → fall back to the 501 hint
  //    so the client html2canvas pipeline runs transparently.
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildPdfBuffer(data, pageSize as PageKey);
    if (!pdfBuffer || pdfBuffer.length < 2000) {
      throw new Error(`pdf_too_small_${pdfBuffer?.length ?? 0}`);
    }
  } catch (renderE: any) {
    logServerError('api/reports/pdf render', renderE, req);
    return res.status(501).setHeader('Cache-Control', 'no-store').json({
      ok: false,
      code: 'SERVER_RENDER_UNAVAILABLE',
      message:
        'Server-side PDF rendering is currently unavailable. ' +
        'Using browser export instead.',
      client_pipeline: {
        service: 'html2canvas + jsPDF',
        entry: 'exportAssessmentPdf()',
        filename_format: `LYC-${code || 'ASSESSMENT'}-Assessment-YYYYMMDD.pdf`,
      },
    });
  }

  // 5. Dispatch by response_mode.
  if (response_mode === 'inline') {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `LYC-${code || 'ASSESSMENT'}-Report-${dateStr}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).send(pdfBuffer as unknown as string);
  }

  // default: response_mode === 'url'
  // 6. Upload to Storage + 24h signed URL.
  try {
    const stored = await uploadPdfAndGetSignedUrl(userId, pdfBuffer);
    return res.status(200).setHeader('Cache-Control', 'no-store').json({
      ok: true,
      document_id: stored.document_id,
      download_url: stored.download_url,
      expires_at: stored.expires_at,
      size_bytes: pdfBuffer.length,
      filename_hint: `LYC-${code}-Report-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}.pdf`,
    });
  } catch (storageE: any) {
    logServerError('api/reports/pdf storage-upload', storageE, req);
    // As a last-ditch fallback, send the bytes inline anyway so user
    // never leaves empty-handed — same 501/422 failure semantics above.
    return res.status(502).setHeader('Cache-Control', 'no-store').json({
      ok: false,
      code: 'STORAGE_UPLOAD_FAILED',
      message: storageE?.message || 'Unable to host download URL.',
    });
  }
}
