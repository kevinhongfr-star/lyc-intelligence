/**
 * api/_lib/documentGenerationHandler.ts — Document Generation
 * Issue #45: Auto document creation (offer letters, contracts, proposals, reports)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'offer_letter' | 'contract' | 'proposal' | 'report' | 'nda' | 'onboarding';
  category: string;
  description: string;
  variables: string[];
  createdAt: string;
}

interface GeneratedDocument {
  id: string;
  templateId: string;
  name: string;
  status: 'draft' | 'generated' | 'sent' | 'signed';
  variables: Record<string, any>;
  downloadUrl?: string;
  createdAt: string;
  generatedAt?: string;
}

const MOCK_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Executive Offer Letter',
    type: 'offer_letter',
    category: 'Hiring',
    description: 'Standard executive offer letter with compensation details',
    variables: ['candidate_name', 'position', 'salary', 'start_date', 'reporting_to'],
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'tmpl-2',
    name: 'Client Proposal',
    type: 'proposal',
    category: 'Business Development',
    description: 'Search proposal template for new client mandates',
    variables: ['client_name', 'position', 'fee_structure', 'timeline', 'consultant_name'],
    createdAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'tmpl-3',
    name: 'Consulting Agreement',
    type: 'contract',
    category: 'Legal',
    description: 'Independent consulting agreement for Council members',
    variables: ['consultant_name', 'engagement_type', 'rate', 'duration', 'scope'],
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'tmpl-4',
    name: 'Candidate Assessment Report',
    type: 'report',
    category: 'Assessment',
    description: 'Structured candidate evaluation report',
    variables: ['candidate_name', 'position', 'scores', 'interviewer', 'recommendation'],
    createdAt: '2026-03-01T14:00:00Z',
  },
  {
    id: 'tmpl-5',
    name: 'NDA — Standard',
    type: 'nda',
    category: 'Legal',
    description: 'Mutual non-disclosure agreement',
    variables: ['party_name', 'effective_date', 'jurisdiction'],
    createdAt: '2026-03-15T10:00:00Z',
  },
];

const MOCK_DOCUMENTS: GeneratedDocument[] = [
  {
    id: 'doc-1',
    templateId: 'tmpl-1',
    name: 'Offer Letter — Sarah Chen',
    status: 'sent',
    variables: { candidate_name: 'Sarah Chen', position: 'VP Engineering', salary: '$320,000', start_date: '2026-09-01', reporting_to: 'CTO' },
    createdAt: '2026-07-15T10:00:00Z',
    generatedAt: '2026-07-15T10:05:00Z',
  },
  {
    id: 'doc-2',
    templateId: 'tmpl-2',
    name: 'Proposal — Apex Digital CTO Search',
    status: 'generated',
    variables: { client_name: 'Apex Digital', position: 'CTO', fee_structure: '30% of first year', timeline: '90 days', consultant_name: 'Kevin Hong' },
    createdAt: '2026-07-18T09:00:00Z',
    generatedAt: '2026-07-18T09:02:00Z',
  },
  {
    id: 'doc-3',
    templateId: 'tmpl-4',
    name: 'Assessment — James Wilson',
    status: 'draft',
    variables: { candidate_name: 'James Wilson', position: 'CFO' },
    createdAt: '2026-07-19T14:00:00Z',
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
    // GET /templates — list document templates
    if (method === 'GET' && path[0] === 'templates') {
      const { category, type } = req.query;
      let templates = [...MOCK_TEMPLATES];
      if (category) templates = templates.filter(t => t.category === category);
      if (type) templates = templates.filter(t => t.type === type);

      return res.status(200).json({ success: true, templates });
    }

    // GET /documents — list generated documents
    if (method === 'GET' && path[0] === 'documents') {
      const { status } = req.query;
      let documents = [...MOCK_DOCUMENTS];
      if (status) documents = documents.filter(d => d.status === status);

      return res.status(200).json({ success: true, documents });
    }

    // POST /generate — generate a document from template
    if (method === 'POST' && path[0] === 'generate') {
      const body = req.body || {};
      const doc: GeneratedDocument = {
        id: `doc-${Date.now()}`,
        templateId: body.templateId,
        name: body.name,
        status: 'generated',
        variables: body.variables || {},
        createdAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('generated_documents').insert({
        ...doc,
        user_id: user?.id,
      });
      if (error) console.warn('generated_documents insert failed:', error.message);

      return res.status(201).json({
        success: true,
        document: doc,
        downloadUrl: `/api/document-generation/download/${doc.id}`,
      });
    }

    // PUT /documents/:id/status — update document status
    if (method === 'PUT' && path[0] === 'documents' && path[2] === 'status') {
      const updates = req.body || {};
      const { error } = await supabase
        .from('generated_documents')
        .update(updates)
        .eq('id', path[1]);

      if (error) console.warn('generated_documents update failed:', error.message);

      return res.status(200).json({ success: true, id: path[1], updates });
    }

    // GET /categories — document categories
    if (method === 'GET' && path[0] === 'categories') {
      return res.status(200).json({
        success: true,
        categories: ['Hiring', 'Business Development', 'Legal', 'Assessment', 'Onboarding'],
      });
    }

    // GET /stats — document generation stats
    if (method === 'GET' && path[0] === 'stats') {
      return res.status(200).json({
        success: true,
        stats: {
          totalTemplates: MOCK_TEMPLATES.length,
          totalDocuments: MOCK_DOCUMENTS.length,
          byStatus: {
            draft: MOCK_DOCUMENTS.filter(d => d.status === 'draft').length,
            generated: MOCK_DOCUMENTS.filter(d => d.status === 'generated').length,
            sent: MOCK_DOCUMENTS.filter(d => d.status === 'sent').length,
            signed: MOCK_DOCUMENTS.filter(d => d.status === 'signed').length,
          },
          byCategory: {
            Hiring: 1,
            'Business Development': 1,
            Assessment: 1,
          },
        },
      });
    }

    return res.status(404).json({ error: 'Unknown document generation endpoint' });
  } catch (err: any) {
    console.error('[documentGenerationHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
