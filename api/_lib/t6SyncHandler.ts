import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, insert, update, isSupabaseConfigured } from './supabaseRest.js';

async function handleImport(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const entityType = path[0];

  try {
    const data = req.body?.data || [];
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        switch (entityType) {
          case 'organizations':
            await importOrganization(item, () => imported++, () => updated++, () => skipped++);
            break;
          case 'mandates':
            await importMandate(item, () => imported++, () => updated++, () => skipped++);
            break;
          case 'candidates':
            await importCandidate(item, () => imported++, () => updated++, () => skipped++);
            break;
          case 'consultants':
            await importConsultant(item, () => imported++, () => updated++, () => skipped++);
            break;
          default:
            errors.push(`Unknown entity type: ${entityType}`);
            skipped++;
        }
      } catch (err: any) {
        errors.push(`Item ${item.id || item.name}: ${err.message}`);
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      total: data.length,
      imported,
      updated,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 20) : [],
    });
  } catch (err: any) {
    console.error('[Import] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function importOrganization(item: any, onImport: () => void, onUpdate: () => void, onSkip: () => void) {
  const existing = await selectMany('organizations', { name: item.name }, 1);
  if (existing.length > 0) {
    await update('organizations', existing[0].id, item);
    onUpdate();
  } else {
    await insert('organizations', item);
    onImport();
  }
}

async function importMandate(item: any, onImport: () => void, onUpdate: () => void, onSkip: () => void) {
  if (!item.org_id) {
    onSkip();
    return;
  }

  const existing = await selectMany('mandates', { position_title: item.position_title, org_id: item.org_id }, 1);
  if (existing.length > 0) {
    await update('mandates', existing[0].id, item);
    onUpdate();
  } else {
    await insert('mandates', item);
    onImport();
  }
}

async function importCandidate(item: any, onImport: () => void, onUpdate: () => void, onSkip: () => void) {
  if (item.email) {
    const existing = await selectMany('candidates', { email: item.email }, 1);
    if (existing.length > 0) {
      await update('candidates', existing[0].id, item);
      onUpdate();
      return;
    }
  }
  if (item.phone) {
    const existing = await selectMany('candidates', { phone: item.phone }, 1);
    if (existing.length > 0) {
      await update('candidates', existing[0].id, item);
      onUpdate();
      return;
    }
  }

  await insert('candidates', item);
  onImport();
}

async function importConsultant(item: any, onImport: () => void, onUpdate: () => void, onSkip: () => void) {
  const existing = await selectMany('consultants', { email: item.email }, 1);
  if (existing.length > 0) {
    await update('consultants', existing[0].id, item);
    onUpdate();
  } else {
    await insert('consultants', item);
    onImport();
  }
}

async function handleExport(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const entityType = path[0];

  try {
    let data: any[] = [];

    switch (entityType) {
      case 'organizations':
        data = await selectMany('organizations', { is_deleted: false });
        break;
      case 'mandates':
        data = await selectMany('mandates', { is_deleted: false });
        break;
      case 'candidates':
        data = await selectMany('candidates', {});
        break;
      case 'consultants':
        data = await selectMany('consultants', {});
        break;
      case 'pipeline':
        data = await selectMany('mandate_candidates', {});
        break;
      case 'all': {
        const [orgs, mandates, candidates, consultants, pipeline] = await Promise.all([
          selectMany('organizations', { is_deleted: false }),
          selectMany('mandates', { is_deleted: false }),
          selectMany('candidates', {}),
          selectMany('consultants', {}),
          selectMany('mandate_candidates', {}),
        ]);
        data = { organizations: orgs, mandates, candidates, consultants, pipeline };
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown entity type: ${entityType}` });
    }

    const format = (req.query as any).format || 'json';
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}_export_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(convertToCSV(Array.isArray(data) ? data : []));
    }

    return res.status(200).json({
      success: true,
      count: Array.isArray(data) ? data.length : Object.keys(data).reduce((sum, key) => sum + (Array.isArray(data[key]) ? data[key].length : 1), 0),
      data,
      exported_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Export] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(','));

  return [headers.join(','), ...rows].join('\n');
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const source = path[0];

  try {
    switch (source) {
      case 'stripe':
        return handleStripeWebhook(req, res);
      case 'linkedin':
        return handleLinkedInWebhook(req, res);
      case 'calendar':
        return handleCalendarWebhook(req, res);
      case 'email':
        return handleEmailWebhook(req, res);
      default:
        return res.status(404).json({ error: `Unknown webhook source: ${source}` });
    }
  } catch (err: any) {
    console.error('[Webhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleStripeWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body?.event || {};
  const type = event.type;

  if (type === 'payment_intent.succeeded') {
    const payment = event.data?.object || {};
    const invoiceId = payment.invoice;

    await insert('activity_logs', {
      entity_type: 'system',
      entity_id: 'stripe',
      action: 'payment_received',
      metadata: {
        payment_id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        invoice_id: invoiceId,
        status: payment.status,
      },
    });
  }

  if (type === 'invoice.paid') {
    const invoice = event.data?.object || {};

    await insert('activity_logs', {
      entity_type: 'system',
      entity_id: 'stripe',
      action: 'invoice_paid',
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        customer: invoice.customer,
      },
    });
  }

  return res.status(200).json({ success: true, event_type: type });
}

async function handleLinkedInWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body || {};

  if (event.type === 'profile_update') {
    const profile = event.profile || {};
    const email = profile.email;

    if (email) {
      const candidates = await selectMany('candidates', { email }, 1);
      if (candidates.length > 0) {
        await update('candidates', candidates[0].id, {
          linkedin_url: profile.linkedin_url,
          current_title: profile.headline,
          current_company: profile.company,
          skills: profile.skills || [],
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  return res.status(200).json({ success: true });
}

async function handleCalendarWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body || {};

  if (event.summary && event.summary.toLowerCase().includes('interview')) {
    const description = event.description || '';
    const mandateMatch = description.match(/\[mandate:(\w+-\w+-\w+-\w+-\w+)\]/);
    const candidateMatch = description.match(/\[candidate:(\w+-\w+-\w+-\w+-\w+)\]/);

    if (mandateMatch && candidateMatch) {
      const mc = await selectMany('mandate_candidates', {
        mandate_id: mandateMatch[1],
        candidate_id: candidateMatch[1],
      }, 1);

      if (mc.length > 0) {
        await update('mandate_candidates', mc[0].id, {
          interview_date: event.start?.date_time,
          stage: 'first_interview',
        });
      }
    }
  }

  return res.status(200).json({ success: true });
}

async function handleEmailWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body || {};

  if (event.type === 'email_received') {
    const from = event.from || '';
    const candidates = await selectMany('candidates', { email: from }, 1);

    if (candidates.length > 0) {
      await update('candidates', candidates[0].id, { status: 'contacted' });

      await insert('activity_logs', {
        entity_type: 'candidate',
        entity_id: candidates[0].id,
        action: 'email_received',
        metadata: {
          from,
          subject: event.subject,
          timestamp: event.timestamp,
        },
      });
    }
  }

  return res.status(200).json({ success: true });
}

async function handleValidation(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [orgs, mandates, candidates, consultants] = await Promise.all([
      selectMany('organizations', { is_deleted: false }),
      selectMany('mandates', { is_deleted: false }),
      selectMany('candidates', {}),
      selectMany('consultants', {}),
    ]);

    const issues: string[] = [];

    for (const m of mandates) {
      if (!m.org_id) issues.push(`Mandate "${m.position_title}" has no org_id`);
      if (!m.consultant_id) issues.push(`Mandate "${m.position_title}" has no consultant assigned`);
      if (m.salary_range_min && m.salary_range_max && m.salary_range_min >= m.salary_range_max) {
        issues.push(`Mandate "${m.position_title}" has invalid salary range`);
      }
    }

    for (const c of candidates) {
      if (!c.email && !c.phone) issues.push(`Candidate "${c.first_name} ${c.last_name}" has no contact info`);
    }

    for (const c of consultants) {
      if (!c.email) issues.push(`Consultant "${c.name}" has no email`);
    }

    return res.status(200).json({
      success: true,
      validation: {
        total_organizations: orgs.length,
        total_mandates: mandates.length,
        total_candidates: candidates.length,
        total_consultants: consultants.length,
        issues_found: issues.length,
        issues: issues.slice(0, 50),
      },
    });
  } catch (err: any) {
    console.error('[Validation] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'import':
      return handleImport(req, res);
    case 'export':
      return handleExport(req, res);
    case 'webhook':
      return handleWebhook(req, res);
    case 'validate':
      return handleValidation(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v6/${resource}` });
  }
}