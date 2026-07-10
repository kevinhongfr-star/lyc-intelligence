import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Report Templates ─── */
async function handleTemplates(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const templateId = path[1];

  try {
    if (req.method === 'GET') {
      if (templateId) {
        const template = await selectOne('report_templates', { where: [{ column: 'id', value: templateId }] });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        return res.status(200).json({ success: true, template });
      }
      const templates = await selectMany('report_templates', {}, 50);
      return res.status(200).json({ success: true, templates });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Templates] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Report Generation ─── */
async function handleReports(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const reportId = path[1];

  try {
    if (req.method === 'POST' && !reportId) {
      const { template_id, override_params } = req.body;
      const template = await selectOne('report_templates', { where: [{ column: 'id', value: template_id }] });
      if (!template) return res.status(404).json({ error: 'Template not found' });

      const content = await generateReportContent(template, override_params);
      const report = await insert('report_instances', {
        template_id,
        content,
        format: template.output_format,
        triggered_by: 'manual',
        generated_at: new Date().toISOString(),
      });

      return res.status(201).json({ success: true, report_id: report.id, content, format: template.output_format });
    }

    if (req.method === 'GET') {
      if (reportId) {
        const report = await selectOne('report_instances', { where: [{ column: 'id', value: reportId }] });
        if (!report) return res.status(404).json({ error: 'Report not found' });
        return res.status(200).json({ success: true, report });
      }
      const templateId = req.query.template_id as string;
      const where: any[] = [];
      if (templateId) where.push({ column: 'template_id', value: templateId });
      const reports = await selectMany('report_instances', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, reports });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Reports] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateReportContent(template: any, params: any): Promise<string> {
  const sections = template.sections || [];
  const parts: string[] = [];

  parts.push(`# ${template.name}\n`);
  parts.push(`Generated: ${new Date().toISOString()}\n`);

  for (const section of sections) {
    parts.push(`\n## ${section.name}\n`);
    if (section.type === 'summary') {
      parts.push('- Pipeline overview placeholder\n');
    } else if (section.type === 'table') {
      parts.push('| Column | Value |\n|--------|-------|\n| Metric | Value |\n');
    } else if (section.type === 'chart') {
      parts.push('[Chart placeholder]\n');
    } else if (section.type === 'alert') {
      parts.push('- No active alerts\n');
    } else if (section.type === 'list') {
      parts.push('- Item 1\n- Item 2\n');
    }
  }

  return parts.join('');
}

/* ─── Distribution ─── */
async function handleDistribution(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'POST' && action === 'send') {
      const { report_id, targets } = req.body;
      const deliveryIds = [];

      for (const target of targets) {
        const log = await insert('distribution_logs', {
          report_id,
          target_type: target.type,
          target_id: target.id,
          status: 'pending',
          attempts: 0,
          created_at: new Date().toISOString(),
        });
        deliveryIds.push(log.id);
      }

      return res.status(200).json({ success: true, delivery_ids: deliveryIds, status: 'queued' });
    }

    if (req.method === 'GET' && action === 'history') {
      const reportId = req.query.report_id as string;
      const where: any[] = [];
      if (reportId) where.push({ column: 'report_id', value: reportId });
      const history = await selectMany('distribution_logs', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, history });
    }

    if (req.method === 'GET' && action) {
      const log = await selectOne('distribution_logs', { where: [{ column: 'id', value: action }] });
      if (!log) return res.status(404).json({ error: 'Distribution log not found' });
      return res.status(200).json({ success: true, log });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Distribution] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'templates':
      return handleTemplates(req, res);
    case 'reports':
      return handleReports(req, res);
    case 'distribution':
      return handleDistribution(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v10/${resource}` });
  }
}