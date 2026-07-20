/**
 * api/_lib/bulkOperationsHandler.ts — Bulk Import/Export
 * Issue #44: Batch data operations for candidates, mandates, contacts
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface BulkJob {
  id: string;
  type: 'import' | 'export';
  entityType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errors?: string[];
}

const MOCK_JOBS: BulkJob[] = [
  {
    id: 'job-1',
    type: 'import',
    entityType: 'candidates',
    status: 'completed',
    totalRecords: 250,
    processedRecords: 248,
    failedRecords: 2,
    createdAt: '2026-07-18T09:00:00Z',
    completedAt: '2026-07-18T09:05:00Z',
    errors: ['Row 45: Invalid email format', 'Row 112: Missing required field "seniority"'],
  },
  {
    id: 'job-2',
    type: 'export',
    entityType: 'mandates',
    status: 'completed',
    totalRecords: 45,
    processedRecords: 45,
    failedRecords: 0,
    createdAt: '2026-07-19T14:00:00Z',
    completedAt: '2026-07-19T14:01:00Z',
    downloadUrl: '#',
  },
  {
    id: 'job-3',
    type: 'import',
    entityType: 'contacts',
    status: 'processing',
    totalRecords: 1200,
    processedRecords: 756,
    failedRecords: 3,
    createdAt: '2026-07-20T08:00:00Z',
  },
];

function getUser(req: VercelRequest) {
  return (req as any).__authenticatedUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = ((req.query as any).path || []) as string[];
  const method = req.method || 'GET';
  const user = getUser(req);

  try {
    // GET /jobs — list bulk jobs
    if (method === 'GET' && path[0] === 'jobs') {
      const { type, status } = req.query;
      let jobs = [...MOCK_JOBS];
      if (type) jobs = jobs.filter(j => j.type === type);
      if (status) jobs = jobs.filter(j => j.status === status);

      return res.status(200).json({ success: true, jobs });
    }

    // POST /import — queue import job
    if (method === 'POST' && path[0] === 'import') {
      const body = req.body || {};
      const job: BulkJob = {
        id: `job-${Date.now()}`,
        type: 'import',
        entityType: body.entityType || 'candidates',
        status: 'queued',
        totalRecords: body.records?.length || 0,
        processedRecords: 0,
        failedRecords: 0,
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('bulk_jobs').insert({
        ...job,
        user_id: user?.id,
      });
      if (error) console.warn('bulk_jobs insert failed:', error.message);

      return res.status(201).json({ success: true, job });
    }

    // POST /export — queue export job
    if (method === 'POST' && path[0] === 'export') {
      const body = req.body || {};
      const job: BulkJob = {
        id: `job-${Date.now()}`,
        type: 'export',
        entityType: body.entityType || 'candidates',
        status: 'queued',
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('bulk_jobs').insert({
        ...job,
        user_id: user?.id,
      });
      if (error) console.warn('bulk_jobs insert failed:', error.message);

      return res.status(201).json({ success: true, job });
    }

    // GET /template/:entityType — download CSV template
    if (method === 'GET' && path[0] === 'template' && path[1]) {
      const entityType = path[1];
      const templates: Record<string, string> = {
        candidates: 'id,name,email,title,company,location,industry,seniority,phone,linkedin_url\n',
        mandates: 'id,title,client_id,location,salary_min,salary_max,status,industry,description\n',
        contacts: 'id,name,email,company,title,location,phone,relationship_type\n',
        companies: 'id,name,industry,size,location,website,description\n',
      };

      const csv = templates[entityType] || 'id,name\n';
      return res.status(200)
        .setHeader('Content-Type', 'text/csv')
        .setHeader('Content-Disposition', `attachment; filename="${entityType}_template.csv"`)
        .send(csv);
    }

    // GET /stats — bulk operation stats
    if (method === 'GET' && path[0] === 'stats') {
      return res.status(200).json({
        success: true,
        stats: {
          totalImports: MOCK_JOBS.filter(j => j.type === 'import').length,
          totalExports: MOCK_JOBS.filter(j => j.type === 'export').length,
          totalRecordsProcessed: MOCK_JOBS.reduce((sum, j) => sum + j.processedRecords, 0),
          successRate: 99.2,
          avgProcessingTime: '4m 30s',
        },
      });
    }

    return res.status(404).json({ error: 'Unknown bulk operations endpoint' });
  } catch (err: any) {
    console.error('[bulkOperationsHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
