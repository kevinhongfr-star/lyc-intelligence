/**
 * POST /api/admin/org-intelligence/grid-reports/generate
 *
 * Body: { target_company_id: string, title?: string }
 *
 * Generates a 5-slide GRID PDF for the given target company:
 *   Slide 1: Company overview (name, sector, country, headcount, status)
 *   Slide 2: Org structure (BUs, top leadership, key facts)
 *   Slide 3: Talent pool stats (count by BU, by level, leadership ratio)
 *   Slide 4: Evaluation outcomes (tier distribution, recent composites)
 *   Slide 5: Source quality (count of sources, types breakdown, audit summary)
 *
 * Returns the PDF as a binary response (Content-Type: application/pdf).
 * Also inserts a `grid_reports` row + `org_audit_log` entry on success.
 *
 * Source: docs/org_intelligence_scoring_spec_v1.2.md §"T6 — GRID PDF Output"
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsPDF } from 'jspdf';
import { verifyAdmin } from '../../../_lib/adminAuth.js';
import {
  isSupabaseConfigured,
  selectOne,
  selectMany,
  insert,
  update,
  handleError,
} from '../../../_lib/supabaseRest.js';
import { TIER_BOUNDARIES, type TierId } from '../../../_lib/scoringCriteria.js';

// Vercel Hobby default is 10s; PDF gen + DB queries can take 15-20s
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface GenerateRequestBody {
  target_company_id?: string;
  title?: string;
}

interface Company {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  hq_city: string | null;
  status: string | null;
  is_comparator: boolean | null;
  website: string | null;
  brief_description: string | null;
}

interface Snapshot {
  id: string;
  headcount_total: number | null;
  structure_json: any;
  snapshot_date: string;
}

interface Talent {
  id: string;
  name: string;
  title: string | null;
  bu: string | null;
  level: number | null;
  is_leadership: boolean | null;
  tenure_years: number | null;
}

interface Evaluation {
  id: string;
  overall_score: number | null;
  scorecard: any;
  is_final: boolean | null;
  updated_at: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse | void> {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured (SUPABASE_URL or SUPABASE_SERVICE_KEY missing)',
      });
    }

    // Auth
    const { user, error: authErr } = await verifyAdmin(req);
    if (authErr || !user) {
      return res.status(401).json({ success: false, error: authErr || 'Unauthorized' });
    }

    // Validate body
    const body = (req.body ?? {}) as GenerateRequestBody;
    if (!body.target_company_id || !UUID_RE.test(body.target_company_id)) {
      return res.status(400).json({
        success: false,
        error: 'target_company_id is required and must be a UUID',
      });
    }
    const targetCompanyId = body.target_company_id;
    const title = body.title || `GRID — ${new Date().toISOString().slice(0, 10)}`;

    // Fetch data
    const company = (await selectOne('target_companies', {
      column: 'id',
      value: targetCompanyId,
    })) as Company | null;
    if (!company) {
      return res.status(404).json({
        success: false,
        error: `Company ${targetCompanyId} not found`,
      });
    }

    const [snapshots, talent, evaluations] = await Promise.all([
      selectMany('org_snapshots', {
        select: 'id,headcount_total,structure_json,snapshot_date',
        where: [{ column: 'target_company_id', value: targetCompanyId }],
        orderBy: { column: 'snapshot_date', ascending: false },
        limit: 1,
      }) as Promise<Snapshot[]>,
      selectMany('org_talent_pools', {
        select: 'id,name,title,bu,level,is_leadership,tenure_years',
        where: [{ column: 'target_company_id', value: targetCompanyId }],
        limit: 500,
      }) as Promise<Talent[]>,
      selectMany('org_evaluations', {
        select: 'id,overall_score,scorecard,is_final,updated_at,org_talent_pools!inner(target_company_id)',
        where: [{ column: 'org_talent_pools.target_company_id', value: targetCompanyId }],
        orderBy: { column: 'updated_at', ascending: false },
        limit: 200,
      }) as Promise<Evaluation[]>,
    ]);

    const snapshot = snapshots[0] ?? null;

    // Insert grid_reports row (status: generating)
    const inserted = (await insert('grid_reports', {
      target_company_id: targetCompanyId,
      mandate_id: null,
      title,
      pdf_path: null,
      slide_count: 5,
      slide_config: { version: 'v1', generator: 'jspdf', slides: ['overview', 'org_structure', 'talent_pool', 'evaluation_outcomes', 'source_quality'] },
      status: 'generating',
      generated_by: user.id,
    })) as { id: string } | null;
    const reportId = inserted?.id ?? 'unknown';

    // Build PDF
    const pdfBytes = buildGridPdf({ company, snapshot, talent, evaluations, title, reportId, userEmail: user.email });

    // Mark report complete
    try {
      await update('grid_reports', { column: 'id', value: reportId }, {
        status: 'completed',
        pdf_path: `inline:${reportId}`,
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[grid-reports.generate] failed to mark report complete:', e);
    }

    // Audit log (non-fatal)
    try {
      await insert('org_audit_log', {
        actor_id: user.id,
        action: 'grid_report.generate',
        resource_type: 'grid_report',
        resource_id: reportId,
        after_state: {
          target_company_id: targetCompanyId,
          slide_count: 5,
          pdf_bytes: pdfBytes.length,
          talent_count: talent.length,
          evaluation_count: evaluations.length,
        },
        ip_address:
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        user_agent: (req.headers['user-agent'] as string) || null,
      });
    } catch (e) {
      console.error('[grid-reports.generate] audit log failed:', e);
    }

    // Stream PDF binary
    const safeName = (company.name || 'company').replace(/[^a-z0-9-]+/gi, '_');
    const filename = `${safeName}_GRID_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdfBytes.length));
    res.setHeader('X-Grid-Report-Id', reportId);
    res.setHeader('X-Slide-Count', '5');
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (e) {
    return handleError(res, 'grid-reports.generate', e) as VercelResponse;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PDF builder
// ─────────────────────────────────────────────────────────────────────────

interface GridInputs {
  company: Company;
  snapshot: Snapshot | null;
  talent: Talent[];
  evaluations: Evaluation[];
  title: string;
  reportId: string;
  userEmail?: string;
}

function buildGridPdf(input: GridInputs): Uint8Array {
  const { company, snapshot, talent, evaluations, title, reportId, userEmail } = input;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const INK = '#1a1a1a';
  const MUTED = '#6b6b6b';
  const ACCENT = '#8a6f3a';
  const RULE = '#d4d4d4';

  const drawFooter = (pageNum: number, total: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`LYC Intelligence · Org Intelligence · ${title}`, M, H - 24);
    doc.text(`${pageNum} / ${total}`, W - M, H - 24, { align: 'right' });
    doc.setDrawColor(RULE);
    doc.line(M, H - 36, W - M, H - 36);
  };

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(ACCENT);
    doc.text('LYC INTELLIGENCE — ORG INTELLIGENCE', M, M);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(company.name, W - M, M, { align: 'right' });
    doc.setDrawColor(RULE);
    doc.line(M, M + 12, W - M, M + 12);
  };

  const sectionTitle = (y: number, text: string): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(INK);
    doc.text(text, M, y);
    return y + 24;
  };

  const body = (y: number, text: string, opts: { size?: number; color?: string; bold?: boolean } = {}): number => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(opts.color ?? INK);
    const lines = doc.splitTextToSize(text, W - 2 * M);
    doc.text(lines, M, y);
    return y + lines.length * (opts.size ?? 10) * 1.35;
  };

  const kvRow = (y: number, k: string, v: string): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text(k, M, y);
    doc.setTextColor(INK);
    doc.text(v || '—', M + 140, y);
    return y + 16;
  };

  // Slide 1: Company overview
  drawHeader();
  let y = M + 36;
  y = sectionTitle(y, '1. Company Overview');
  y = kvRow(y, 'Name', company.name);
  y = kvRow(y, 'Sector', company.sector || '—');
  y = kvRow(y, 'Country', company.country || '—');
  y = kvRow(y, 'HQ city', company.hq_city || '—');
  y = kvRow(y, 'Status', company.status || '—');
  y = kvRow(y, 'Comparator?', company.is_comparator ? 'Yes' : 'No');
  y = kvRow(y, 'Website', company.website || '—');
  y = kvRow(y, 'Headcount (snapshot)', String(snapshot?.headcount_total ?? '—'));
  y = kvRow(y, 'Snapshot date', snapshot?.snapshot_date ?? '—');
  y += 12;
  if (company.brief_description) {
    y = sectionTitle(y, 'Brief');
    y = body(y, company.brief_description, { size: 10, color: INK });
  }
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(`Report ID: ${reportId}  ·  Generated: ${generatedAt} UTC`, M, y);
  drawFooter(1, 5);

  // Slide 2: Org structure
  doc.addPage();
  drawHeader();
  y = M + 36;
  y = sectionTitle(y, '2. Org Structure');
  const bus = Array.from(new Set(talent.map((t) => t.bu).filter(Boolean))) as string[];
  const leadership = talent.filter((t) => t.is_leadership).sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
  y = body(y, `Business units identified: ${bus.length > 0 ? bus.join(', ') : 'none tagged'}.`, { size: 11 });
  y += 8;
  y = body(y, `Top leadership (${leadership.length}):`, { size: 11, bold: true });
  y += 4;
  if (leadership.length === 0) {
    y = body(y, 'No leadership tagged in the talent pool.', { size: 10, color: MUTED });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const p of leadership.slice(0, 12)) {
      if (y > H - 80) break;
      const line = `- ${p.name}${p.title ? ` — ${p.title}` : ''}${p.bu ? ` (${p.bu})` : ''}${p.level != null ? ` · L${p.level}` : ''}`;
      doc.text(line, M + 8, y);
      y += 14;
    }
    if (leadership.length > 12) {
      y = body(y, `... and ${leadership.length - 12} more.`, { size: 9, color: MUTED });
    }
  }
  if (snapshot?.structure_json) {
    y += 12;
    y = body(y, 'Snapshot structure (latest):', { size: 11, bold: true });
    y = body(y, JSON.stringify(snapshot.structure_json, null, 2), { size: 8, color: MUTED });
  }
  drawFooter(2, 5);

  // Slide 3: Talent pool
  doc.addPage();
  drawHeader();
  y = M + 36;
  y = sectionTitle(y, '3. Talent Pool');
  y = kvRow(y, 'Total individuals', String(talent.length));
  y = kvRow(y, 'Leadership', String(leadership.length));
  y = kvRow(y, 'BU coverage', `${bus.length} BUs`);
  y += 8;
  y = body(y, 'By business unit:', { size: 11, bold: true });
  y += 4;
  const buCounts = new Map<string, number>();
  for (const t of talent) {
    const k = t.bu || 'untagged';
    buCounts.set(k, (buCounts.get(k) ?? 0) + 1);
  }
  const buEntries = Array.from(buCounts.entries()).sort((a, b) => b[1] - a[1]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const [bu, count] of buEntries) {
    if (y > H - 100) break;
    doc.text(`- ${bu}`, M + 8, y);
    doc.text(String(count), W - M, y, { align: 'right' });
    y += 14;
  }
  y += 8;
  y = body(y, 'By level:', { size: 11, bold: true });
  y += 4;
  const levelCounts = new Map<number, number>();
  for (const t of talent) {
    if (t.level != null) {
      levelCounts.set(t.level, (levelCounts.get(t.level) ?? 0) + 1);
    }
  }
  const levelEntries = Array.from(levelCounts.entries()).sort((a, b) => b[0] - a[0]);
  for (const [lvl, count] of levelEntries) {
    if (y > H - 80) break;
    doc.text(`- L${lvl}`, M + 8, y);
    doc.text(String(count), W - M, y, { align: 'right' });
    y += 14;
  }
  drawFooter(3, 5);

  // Slide 4: Evaluation outcomes
  doc.addPage();
  drawHeader();
  y = M + 36;
  y = sectionTitle(y, '4. Evaluation Outcomes');
  const tierCounts: Record<TierId, number> = { T1_STRONG: 0, T2_GOOD: 0, T3_POTENTIAL: 0, T4_NOT_YET: 0 };
  let totalFinal = 0;
  for (const ev of evaluations) {
    if (!ev.is_final || ev.overall_score == null) continue;
    totalFinal++;
    const score = Number(ev.overall_score);
    if (score >= TIER_BOUNDARIES.T1_STRONG.min) tierCounts.T1_STRONG++;
    else if (score >= TIER_BOUNDARIES.T2_GOOD.min) tierCounts.T2_GOOD++;
    else if (score >= TIER_BOUNDARIES.T3_POTENTIAL.min) tierCounts.T3_POTENTIAL++;
    else tierCounts.T4_NOT_YET++;
  }
  y = kvRow(y, 'Total evaluations', String(evaluations.length));
  y = kvRow(y, 'Final evaluations', String(totalFinal));
  y += 8;
  y = body(y, 'Tier distribution:', { size: 11, bold: true });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const t of ['T1_STRONG', 'T2_GOOD', 'T3_POTENTIAL', 'T4_NOT_YET'] as TierId[]) {
    if (y > H - 100) break;
    const c = TIER_BOUNDARIES[t];
    const count = tierCounts[t];
    const pct = totalFinal > 0 ? ((count / totalFinal) * 100).toFixed(0) : '0';
    doc.text(`- ${c.label} (${c.min}+)`, M + 8, y);
    doc.text(`${count}  (${pct}%)`, W - M, y, { align: 'right' });
    y += 14;
  }
  y += 12;
  y = body(y, 'Recent evaluations (top 8):', { size: 11, bold: true });
  y += 4;
  doc.setFontSize(9);
  for (const ev of evaluations.slice(0, 8)) {
    if (y > H - 80) break;
    const score = ev.overall_score != null ? Number(ev.overall_score).toFixed(1) : '—';
    const tierLabel = ev.scorecard?.tier_label ?? '—';
    const date = ev.updated_at?.slice(0, 10) ?? '—';
    doc.text(`- ${date}  ·  ${score}  ·  ${tierLabel}`, M + 8, y);
    y += 13;
  }
  drawFooter(4, 5);

  // Slide 5: Source quality
  doc.addPage();
  drawHeader();
  y = M + 36;
  y = sectionTitle(y, '5. Source Quality');
  y = body(y, 'Data sources used in this GRID report:', { size: 11, bold: true });
  y += 8;
  const sourceCounts = { admin_supplied: 0, professional_network: 0, web: 0, total: 0 };
  for (const t of talent) {
    if (t.linkedin_url) {
      sourceCounts.professional_network++;
      sourceCounts.total++;
    }
    if (t.email) {
      sourceCounts.admin_supplied++;
      sourceCounts.total++;
    }
  }
  y = kvRow(y, 'Total sources used', String(sourceCounts.total));
  y = kvRow(y, 'Admin-supplied', String(sourceCounts.admin_supplied));
  y = kvRow(y, 'Professional network', String(sourceCounts.professional_network));
  y = kvRow(y, 'Web sources', String(sourceCounts.web));
  y += 12;
  y = body(y, 'Audit summary:', { size: 11, bold: true });
  y = body(y,
    `This report was generated by ${userEmail || 'an admin'} on ${generatedAt} UTC. ` +
    `All underlying data is stored in Supabase and traceable via the audit log. ` +
    `Re-generate this report at any time from the One-Pager tab to refresh with the latest data.`,
    { size: 10, color: MUTED });
  y = body(y, `Report ID: ${reportId}`, { size: 9, color: MUTED });
  drawFooter(5, 5);

  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
}
