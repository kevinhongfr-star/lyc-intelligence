/**
 * legalPagesHandler.ts — Terms, privacy, compliance documents
 *
 * Endpoints:
 *   GET  /api/legal/terms           — Get terms of service
 *   GET  /api/legal/privacy         — Get privacy policy
 *   GET  /api/legal/dpa             — Get data processing agreement
 *   GET  /api/legal/compliance      — Get compliance status
 *   POST /api/legal/accept          — Accept legal document
 *   GET  /api/legal/accepted        — List accepted documents
 *   GET  /api/legal/versions/:type  — Get document version history
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 10;

type DocumentType = 'terms' | 'privacy' | 'dpa' | 'cookies' | 'subprocessors';

const LEGAL_DOCUMENTS: Record<DocumentType, { title: string; version: string; content: string; updated_at: string }> = {
  terms: {
    title: 'Terms of Service',
    version: '2.3',
    updated_at: '2026-08-01',
    content: `Terms of Service

1. Acceptance of Terms
By accessing and using this platform, you agree to be bound by these Terms of Service.

2. Use License
Permission is granted to temporarily download one copy of the materials on any single computer for personal, non-commercial transitory viewing only.

3. Restrictions
You may not modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to decompile or reverse engineer any software contained on the platform.

4. Disclaimer
The materials on this platform are provided on an 'as is' basis. The platform makes no warranties, expressed or implied.

5. Limitations
In no event shall the platform or its suppliers be liable for any damages arising out of the use or inability to use the materials.

6. Revisions and Errata
The materials appearing on this platform could include technical, typographical, or photographic errors. The platform does not warrant that any of the materials are accurate, complete, or current.`,
  },
  privacy: {
    title: 'Privacy Policy',
    version: '2.1',
    updated_at: '2026-07-15',
    content: `Privacy Policy

1. Information We Collect
We collect information you provide directly, such as when you create an account or contact us. We also automatically collect certain information when you visit our platform.

2. How We Use Your Information
We use the information we collect to: provide, maintain, and improve our services; process transactions; send you related information; personalize your experience.

3. Data Sharing
We do not sell, trade, or otherwise transfer your personally identifiable information to third parties.

4. Data Security
We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.

5. Your Rights
You have the right to access, update, or delete your personal information at any time.

6. Cookies
We use cookies and similar tracking technologies to track activity on our platform.`,
  },
  dpa: {
    title: 'Data Processing Agreement',
    version: '1.5',
    updated_at: '2026-06-01',
    content: `Data Processing Agreement

This Data Processing Agreement ("DPA") is entered into between the Customer and the Platform.

1. Processor Obligations
The Processor will process personal data only for the purposes specified in this Agreement and will implement appropriate technical and organizational security measures.

2. Data Subject Rights
The Processor will assist the Controller in responding to data subject access requests, rectification requests, erasure requests, and data portability requests.

3. Data Transfer
Any transfer of personal data from the European Economic Area to countries outside the EEA will be subject to appropriate safeguards.

4. Subprocessing
The Processor may engage sub-processors with the prior written consent of the Controller.

5. Termination
Upon termination, the Processor will return or delete all personal data within 30 days.`,
  },
  cookies: {
    title: 'Cookie Policy',
    version: '1.2',
    updated_at: '2026-05-01',
    content: `Cookie Policy

We use cookies to improve your experience on our platform. This policy explains what cookies are, how we use them, and your choices.

Essential cookies are required for the platform to function. Analytics cookies help us understand how visitors interact with the platform.`,
  },
  subprocessors: {
    title: 'List of Subprocessors',
    version: '1.1',
    updated_at: '2026-04-01',
    content: `Subprocessors

The following subprocessors may process personal data on our behalf:

- Supabase (Database)
- Vercel (Hosting)
- Stripe (Payment Processing)
- PostHog (Analytics)
- Sentry (Error Monitoring)`,
  },
};

export async function handleLegal(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];
    const subAction = pathArr[1];

    const docTypes: Record<string, DocumentType> = {
      terms: 'terms',
      privacy: 'privacy',
      dpa: 'dpa',
      cookies: 'cookies',
      subprocessors: 'subprocessors',
    };

    if (docTypes[action] && req.method === 'GET' && !subAction) {
      return handleGetDocument(req, res, docTypes[action]);
    }
    if (action === 'compliance' && req.method === 'GET') {
      return handleCompliance(req, res);
    }
    if (action === 'accept' && req.method === 'POST') {
      return handleAccept(req, res, user.id);
    }
    if (action === 'accepted' && req.method === 'GET') {
      return handleAccepted(req, res, user.id);
    }
    if (action === 'versions' && subAction && req.method === 'GET') {
      return handleVersions(req, res, subAction as DocumentType);
    }

    return res.status(404).json({ success: false, error: 'Legal route not found' });
  } catch (err) {
    return handleError(res, 'legalPages', err);
  }
}

async function handleGetDocument(_req: VercelRequest, res: VercelResponse, type: DocumentType) {
  const doc = LEGAL_DOCUMENTS[type];
  return res.json({ success: true, document: { type, ...doc } });
}

async function handleCompliance(_req: VercelRequest, res: VercelResponse) {
  return res.json({
    success: true,
    compliance: {
      gdpr: { status: 'compliant', last_audit: '2026-07-01', next_audit: '2027-07-01' },
      ccpa: { status: 'compliant', last_audit: '2026-06-01', next_audit: '2027-06-01' },
      hipaa: { status: 'not_applicable' },
      soc2: { status: 'in_progress', last_audit: '2026-03-01', next_audit: '2026-12-01' },
      iso27001: { status: 'certified', last_audit: '2026-05-01', next_audit: '2027-05-01' },
    },
  });
}

async function handleAccept(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const { document_type, version } = body;
  if (!document_type || !version) {
    return res.status(400).json({ success: false, error: 'document_type and version required' });
  }

  const acceptance = await insert('legal_acceptances', {
    id: `acc_${Date.now()}`,
    user_id: userId,
    document_type,
    version,
    accepted_at: new Date().toISOString(),
    ip_address: body.ip_address || null,
    user_agent: body.user_agent || null,
  });

  return res.status(201).json({ success: true, acceptance });
}

async function handleAccepted(_req: VercelRequest, res: VercelResponse, userId: string) {
  const acceptances = await selectMany(
    'legal_acceptances',
    { user_id: userId },
    ['accepted_at DESC'],
    20,
    0,
    'id,document_type,version,accepted_at'
  );
  return res.json({ success: true, acceptances });
}

async function handleVersions(_req: VercelRequest, res: VercelResponse, type: DocumentType) {
  const doc = LEGAL_DOCUMENTS[type];
  const versionHistory = await selectMany(
    'legal_document_versions',
    { document_type: type },
    ['version DESC'],
    20,
    0,
    'version,title,updated_at,content'
  );

  return res.json({
    success: true,
    document_type: type,
    current_version: doc.version,
    versions: versionHistory || [{ version: doc.version, title: doc.title, updated_at: doc.updated_at, content: doc.content }],
  });
}