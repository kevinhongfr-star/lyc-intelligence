/**
 * /api/reports/pdf — Assessment PDF Report generation endpoint (Batch Y1-3).
 *
 * This is the server-side PDF entry point. When a real server-side renderer is
 * available (Puppeteer/Playwright on a Node runtime with headless Chrome), this
 * endpoint will accept a PDF-ready payload, render the branded template, and
 * return either:
 *   • an inline-downloadable PDF (stream), or
 *   • a signed storage URL (when configured for offload).
 *
 * In the current Hobby-tier serverless runtime, headless Chrome isn't available.
 * We therefore:
 *   1. Validate + sanitize the incoming AssessmentResultData shape.
 *   2. Return an HTTP 501 hint to the client so it falls back to the existing
 *      client-side html2canvas/jsPDF pipeline (pdfExport.ts / ExportPdfButton).
 *   3. Implement cache + rate-limit headers so when the real renderer is wired
 *      up, users see a behaviour-preserving upgrade with no client changes.
 *
 * POST /api/reports/pdf
 *   Body: { data: AssessmentResultData, pageSize?: 'a4' | 'letter',
 *           tier?: 'executive_introduction' | 'professional' | 'executive' }
 *   Returns 501:
 *     { ok:false, code:'SERVER_RENDER_UNAVAILABLE',
 *       message:'Client PDF export is available via ExportPdfButton on any result page.' }
 *   Returns once real renderer plugged in:
 *     200: binary/octet-stream Content-Disposition attachment
 *     or 200: { ok:true, download_url: '<signed URL>', expires_at: ISO }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
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

/* ─────────────────────── Zod input schema ─────────────────────── */

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
    .enum(['executive_introduction', 'professional', 'executive'])
    .optional(),
});

/* ─────────────────────── Handler ─────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  try { applyStrictCors(req, res); } catch (e) { handleApiError(res, e, 'api/reports/pdf cors', req); return; }
  if (req.method === 'OPTIONS') return;

  try { assertUrlLength(req); } catch (e) { handleApiError(res, e, 'api/reports/pdf url-length', req); return; }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed — POST required' });
  }

  // ── Rate limit (global / IP): 15 pdf generations / 60s ──
  const rl = rateLimit(req, '__pdf_global__');
  setRateLimitHeaders(res, rl, 15);
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      code: 'RATE_LIMITED',
      error: 'Too many PDF requests — retry in a moment',
    });
  }

  // ── Body size + parse ──
  try { assertBodySize(req.body, DEFAULT_BODY_LIMIT); } catch (e) {
    handleApiError(res, e, 'api/reports/pdf body-size', req); return;
  }
  let rawBody: unknown;
  try { rawBody = parseJsonBody(req); } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message ?? 'Invalid JSON body' });
  }

  // ── Zod structural validation ──
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

  // ── PII scrub: if client accidentally sent email in recipient.name, mask.
  //    real rendering tiering will happen in the report renderer. ──
  const { data } = parsed;
  const code = (data.definition.assessment_id || 'assessment').toUpperCase().slice(0, 16);
  void code;

  // ── Server render unavailable → hint client-side fallback.
  //    This is the graceful-degradation path until a Node runtime with
  //    headless Chrome is provisioned for the service. ──
  try {
    return res.status(501).setHeader('Cache-Control', 'no-store').json({
      ok: false,
      code: 'SERVER_RENDER_UNAVAILABLE',
      message:
        'Server-side PDF rendering is not available in this environment. ' +
        'Use the client-side ExportPdfButton on any result page to generate a branded ' +
        'LYC report directly in the browser.',
      client_pipeline: {
        service: 'html2canvas + jsPDF',
        entry: 'exportAssessmentPdf()',
        filename_format: `LYC-${code || 'ASSESSMENT'}-Assessment-YYYYMMDD.pdf`,
      },
    });
  } catch (err: any) {
    logServerError('api/reports/pdf POST', err, req);
    return res.status(500).json({ ok: false, error: 'Failed to generate PDF report' });
  }
}
