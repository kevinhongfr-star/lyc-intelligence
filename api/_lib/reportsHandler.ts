/**
 * Phase 7 — Reports & Documents handler
 *
 * Routes (via dispatch.ts → req.query.path segments):
 *   GET    /api/reports/templates          — List available report templates
 *   GET    /api/reports                     — List reports (optional: ?status=&templateId=)
 *   POST   /api/reports/generate            — Generate a new report
 *   GET    /api/reports/:id                 — Get a single report
 *   PATCH  /api/reports/:id                 — Update report content
 *   DELETE /api/reports/:id                 — Delete a report
 *   POST   /api/reports/:id/export          — Export a report to PDF/DOCX/PNG
 *   POST   /api/reports/schedule            — Schedule a recurring report
 *   GET    /api/reports/schedules           — List scheduled reports
 *   DELETE /api/reports/schedules/:id       — Delete a scheduled report
 *
 * Frontend service: src/services/reportService.ts
 * Libraries: reportGenerator.ts, reportExporter.ts, reportScheduler.ts, reportTemplates.ts
 * Migration: 20260807_phase7_reports.sql (tables: reports, report_schedules)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';
import { REPORT_TEMPLATES, getTemplateById } from './reportTemplates.js';
import { generateReport as generateReportLib } from './reportGenerator.js';

export const maxDuration = 60;

export async function handleReports(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0] || '';
    const id = pathArr[1];
    const subResource = pathArr[2];

    // ── GET /templates ──────────────────────────────────────────────
    if (resource === 'templates' && req.method === 'GET') {
      const templates = REPORT_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
      }));
      return res.status(200).json(templates);
    }

    // ── POST /generate ──────────────────────────────────────────────
    if (resource === 'generate' && req.method === 'POST') {
      return handleGenerate(req, res);
    }

    // ── POST /schedule ──────────────────────────────────────────────
    if (resource === 'schedule' && req.method === 'POST') {
      return handleSchedule(req, res);
    }

    // ── GET /schedules ──────────────────────────────────────────────
    if (resource === 'schedules' && req.method === 'GET') {
      return handleListSchedules(req, res);
    }

    // ── DELETE /schedules/:id ───────────────────────────────────────
    if (resource === 'schedules' && id && req.method === 'DELETE') {
      const deleted = await remove('report_schedules', { column: 'id', value: id });
      if (deleted === 0) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }
      return res.status(200).json({ success: true });
    }

    // ── GET / (list reports) ────────────────────────────────────────
    if (!resource && req.method === 'GET') {
      return handleListReports(req, res);
    }

    // ── /:id/export ─────────────────────────────────────────────────
    if (resource && resource !== 'templates' && resource !== 'generate' && resource !== 'schedule' && resource !== 'schedules' && id === 'export' && req.method === 'POST') {
      return handleExportReport(req, res, resource);
    }

    // ── /:id routes ─────────────────────────────────────────────────
    if (resource && resource !== 'templates' && resource !== 'generate' && resource !== 'schedule' && resource !== 'schedules') {
      if (req.method === 'GET') {
        return handleGetReport(req, res, resource);
      }
      if (req.method === 'PATCH') {
        return handleUpdateReport(req, res, resource);
      }
      if (req.method === 'DELETE') {
        return handleDeleteReport(req, res, resource);
      }
    }

    return res.status(404).json({ success: false, error: 'Reports route not found' });
  } catch (err) {
    return handleError(res, 'reports', err);
  }
}

// ── Handlers ────────────────────────────────────────────────────────

async function handleListReports(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).__authenticatedUser;
  const where: any[] = [{ column: 'created_by', value: user.id }];

  const status = (req.query as any).status;
  const templateId = (req.query as any).templateId;
  if (status) where.push({ column: 'status', value: status });
  if (templateId) where.push({ column: 'template_id', value: templateId });

  const reports = await selectMany('reports', { where, orderBy: { column: 'created_at', ascending: false } });
  return res.status(200).json(reports.map(mapReportRow));
}

async function handleGenerate(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).__authenticatedUser;
  const body = req.body || {};
  const { templateId, format, context } = body;

  if (!templateId) {
    return res.status(400).json({ success: false, error: 'templateId is required' });
  }

  const template = getTemplateById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, error: `Template not found: ${templateId}` });
  }

  // Generate report data using the library
  const genResult = await generateReportLib({
    templateId,
    format: format || 'PDF',
    context: context || { data: {} },
  });

  // Persist to DB
  const reportData = genResult.data;
  const row = await insert('reports', {
    template_id: templateId,
    template_name: template.name,
    format: format || 'PDF',
    status: genResult.success ? 'completed' : 'failed',
    title: reportData?.header?.title || template.name,
    sections: reportData?.sections || [],
    tables: reportData?.tables || [],
    charts: reportData?.charts || [],
    header: reportData?.header || {},
    footer: reportData?.footer || {},
    download_url: genResult.success ? genResult.filename : null,
    created_by: user.id,
  });

  return res.status(200).json({
    success: genResult.success,
    reportId: row.id,
    downloadUrl: genResult.success ? genResult.filename : undefined,
    error: genResult.error,
  });
}

async function handleGetReport(req: VercelRequest, res: VercelResponse, reportId: string) {
  const report = await selectOne('reports', { where: [{ column: 'id', value: reportId }] });
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  return res.status(200).json(mapReportRow(report));
}

async function handleUpdateReport(req: VercelRequest, res: VercelResponse, reportId: string) {
  const body = req.body || {};
  const patch: Record<string, any> = {};
  if (body.sections !== undefined) patch.sections = body.sections;
  if (body.tables !== undefined) patch.tables = body.tables;
  if (body.charts !== undefined) patch.charts = body.charts;
  if (body.title !== undefined) patch.title = body.title;

  const updated = await update('reports', { column: 'id', value: reportId }, patch);
  if (!updated || updated.length === 0) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  return res.status(200).json(mapReportRow(updated[0]));
}

async function handleDeleteReport(req: VercelRequest, res: VercelResponse, reportId: string) {
  const deleted = await remove('reports', { column: 'id', value: reportId });
  if (deleted === 0) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  return res.status(200).json({ success: true });
}

async function handleExportReport(req: VercelRequest, res: VercelResponse, reportId: string) {
  const report = await selectOne('reports', { where: [{ column: 'id', value: reportId }] });
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }

  const body = req.body || {};
  const format = body.format || report.format || 'PDF';

  // Re-generate using the library for export
  const genResult = await generateReportLib({
    templateId: report.template_id,
    format,
    context: { data: {} },
  });

  // Update download URL
  if (genResult.success) {
    await update('reports', { column: 'id', value: reportId }, { download_url: genResult.filename });
  }

  return res.status(200).json({
    success: genResult.success,
    downloadUrl: genResult.success ? genResult.filename : undefined,
    error: genResult.error,
  });
}

async function handleSchedule(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).__authenticatedUser;
  const body = req.body || {};
  const { templateId, format, frequency, context, exportOptions } = body;

  if (!templateId) {
    return res.status(400).json({ success: false, error: 'templateId is required' });
  }

  const template = getTemplateById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, error: `Template not found: ${templateId}` });
  }

  // Compute next run time
  const freq = frequency || 'weekly';
  const next = new Date();
  if (freq === 'daily') next.setDate(next.getDate() + 1);
  else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 7);

  const row = await insert('report_schedules', {
    template_id: templateId,
    template_name: template.name,
    format: format || 'PDF',
    frequency: freq,
    next_run_at: next.toISOString(),
    status: 'scheduled',
    context: context || {},
    export_options: exportOptions || {},
    created_by: user.id,
  });

  return res.status(200).json({
    success: true,
    scheduleId: row.id,
  });
}

async function handleListSchedules(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).__authenticatedUser;
  const schedules = await selectMany('report_schedules', {
    where: [{ column: 'created_by', value: user.id }],
    orderBy: { column: 'created_at', ascending: false },
  });

  return res.status(200).json(schedules.map((s: any) => ({
    id: s.id,
    templateId: s.template_id,
    templateName: s.template_name,
    format: s.format,
    frequency: s.frequency,
    nextRunAt: s.next_run_at,
    lastRunAt: s.last_run_at || undefined,
    status: s.status,
    createdBy: s.created_by,
    createdAt: s.created_at,
  })));
}

// ── Helpers ─────────────────────────────────────────────────────────

function mapReportRow(row: any) {
  return {
    id: row.id,
    templateId: row.template_id,
    templateName: row.template_name,
    format: row.format,
    status: row.status,
    title: row.title,
    sections: row.sections || [],
    tables: row.tables || [],
    charts: row.charts || [],
    header: row.header || {},
    footer: row.footer || {},
    downloadUrl: row.download_url || undefined,
    shareUrl: row.share_url || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
