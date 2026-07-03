/**
 * api/[[...path]].ts — Single catch-all router for all business API endpoints
 * Replaces 35+ individual route files. Routes to handler modules in _lib/.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './_lib/adminAuth.js';
import { sendEmail } from './_lib/email.js';
import {
  selectMany,
  countRows,
  handleError as handleDbError,
  insert,
  isSupabaseConfigured,
} from './_lib/supabaseRest.js';

// ── Handler imports ──
import { handleAdminClientAccounts } from './_lib/adminClientHandler.js';
import { handleAgentsInvoke } from './_lib/agentsHandler.js';
import { handleAgentActions } from './_lib/agentActionsHandler.js';
import { handleAnalytics } from './_lib/analyticsHandler.js';
import { handler as handleCompaniesUpload } from './_lib/companiesUploadHandler.js';
import { handleCandidates } from './_lib/candidatesHandler.js';
import { handleCanvas } from './_lib/canvasHandler.js';
import handleCareer from './_lib/careerIntelligenceHandler.js';
import {
  handleChannels,
  handleEmail,
  handleWechat,
  handleCommunications,
} from './_lib/communicationsHandler.js';
import { handleClient } from './_lib/clientHandler.js';
import { handleCredits } from './_lib/creditsHandler.js';
import { handler as handleData } from './_lib/dataHandler.js';
import { handleEnrichment } from './_lib/enrichmentHandler.js';
import { handler as handleGridReportsGenerate } from './_lib/gridReportsGenerateHandler.js';
import handleIntelligence from './_lib/intelligenceHandler.js';
import { handleKevinOversight } from './_lib/kevinHandler.js';
import { handleLinkedIn } from './_lib/linkedinHandler.js';
import { handleMandates } from './_lib/mandatesHandler.js';
import { handleMatching } from './_lib/matchingHandler.js';
import { handleRbac, handleAdminRbac } from './_lib/rbacHandler.js';
import { handler as handleScoringCompute } from './_lib/scoringComputeHandler.js';
import { handleScore } from './_lib/scoreHandler.js';
import { handleScore5 } from './_lib/score5Handler.js';
import { handleSignals } from './_lib/signalsHandler.js';
import { handleTrident } from './_lib/tridentHandler.js';
import { handler as handleChat } from './_lib/chatHandler.js';

export const maxDuration = 300;

// ── Rate limiter (in-memory, per-serverless-instance) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (entry && now < entry.resetAt) {
    if (entry.count >= maxRequests) return false;
    entry.count++;
    return true;
  }
  rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
  return true;
}

function getClientIp(req: VercelRequest): string {
  return ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
    (req.headers['x-real-ip'] as string) ||
    'unknown';
}

// ── Email rate limiter ──
const emailRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// ── uuid helper ──
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ════════════════════════════════════════════
// INLINE: Dashboard (from api/dashboard.ts)
// ════════════════════════════════════════════
async function handleDashboard(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [contactsData, mandatesData, activityResult] = await Promise.all([
      selectMany(
        'contacts',
        { select: 'seniority,trident_composite,cxo_stamp', limit: 20000 },
        12000
      ),
      (async () => {
        const [statuses, recent] = await Promise.all([
          selectMany('mandates', { select: 'status', limit: 10000 }, 12000),
          selectMany(
            'mandates',
            {
              select:
                'id,title,status,client_id,tier1_count,tier2_count,shortlisted_count,interview_count,placed_count,updated_at',
              orderBy: { column: 'updated_at', ascending: false },
              limit: 10,
            },
            10000
          ),
        ]);
        return { statuses, recent };
      })(),
      (async () => {
        const [scoringRuns, recentContacts] = await Promise.all([
          selectMany(
            'scoring_runs',
            {
              select:
                'id,run_type,composite_score,verdict,created_at,contact_id,mandate_id',
              orderBy: { column: 'created_at', ascending: false },
              limit: 15,
            },
            10000
          ),
          selectMany(
            'contacts',
            {
              select: 'id,name,current_title,updated_at',
              orderBy: { column: 'updated_at', ascending: false },
              limit: 15,
            },
            10000
          ),
        ]);
        const activities: any[] = [];
        for (const sr of scoringRuns) {
          activities.push({
            type: 'scoring',
            id: sr.id,
            title: `Scored: ${sr.run_type}`,
            detail: sr.verdict
              ? `Verdict: ${sr.verdict}`
              : `Score: ${sr.composite_score ?? '—'}`,
            timestamp: sr.created_at,
            contact_id: sr.contact_id,
            mandate_id: sr.mandate_id,
          });
        }
        for (const c of recentContacts) {
          activities.push({
            type: 'contact_update',
            id: c.id,
            title: c.name,
            detail: c.current_title ?? 'Profile updated',
            timestamp: c.updated_at,
          });
        }
        activities.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return activities.slice(0, 20);
      })(),
    ]);

    const totalContacts = contactsData.length;
    const contactsBySeniority: Record<string, number> = {};
    const tierDistribution = { S: 0, A: 0, B: 0, C: 0 };
    for (const c of contactsData) {
      const k = c.seniority || 'unknown';
      contactsBySeniority[k] = (contactsBySeniority[k] || 0) + 1;
      const score = c.trident_composite ?? 0;
      if (c.cxo_stamp || score >= 85) tierDistribution.S++;
      else if (score >= 65) tierDistribution.A++;
      else if (score >= 45) tierDistribution.B++;
      else tierDistribution.C++;
    }

    const totalMandates = mandatesData.statuses.length;
    const mandatesByStatus: Record<string, number> = {};
    for (const m of mandatesData.statuses) {
      const k = m.status || 'unknown';
      mandatesByStatus[k] = (mandatesByStatus[k] || 0) + 1;
    }

    let totalCompanies = 0,
      totalProposals = 0;
    try {
      const [co, pr] = await Promise.all([
        countRows('companies'),
        countRows('proposals'),
      ]);
      totalCompanies = co;
      totalProposals = pr;
    } catch {}

    res.status(200).json({
      stats: {
        totalContacts,
        totalMandates,
        totalCompanies,
        totalProposals,
        mandatesByStatus,
        contactsBySeniority,
      },
      mandates: mandatesData.recent,
      tierDistribution,
      recentActivity: activityResult,
    });
  } catch (err) {
    handleDbError(res, err, 'Dashboard fetch failed');
  }
}

// ════════════════════════════════════════════
// INLINE: Upload (from api/upload.ts)
// ════════════════════════════════════════════
async function handleUpload(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (req.method !== 'POST')
      return res.status(405).json({ error: 'Method not allowed' });
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data'))
      return res
        .status(400)
        .json({ error: 'Content-Type must be multipart/form-data' });

    const rawBody = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      (req as any).on('data', (chunk: Buffer) => chunks.push(chunk));
      (req as any).on('end', () => resolve(Buffer.concat(chunks)));
      (req as any).on('error', reject);
    });

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'Missing boundary' });
    const parts = rawBody.toString().split(`--${boundary}`);
    let fileContent = '',
      fileName = '';
    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        const m = part.match(/filename="([^"]+)"/);
        if (m) fileName = m[1];
        const cs = part.indexOf('\r\n\r\n');
        if (cs !== -1) {
          const c = part.substring(cs + 4).trimEnd();
          if (!part.includes('name="type"')) fileContent = c;
        }
      }
    }

    if (!fileName)
      return res.status(400).json({ error: 'No file provided' });
    const ext = fileName.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(ext || ''))
      return res.status(400).json({ error: 'Unsupported file type' });
    if (rawBody.length > 10 * 1024 * 1024)
      return res.status(400).json({ error: 'File exceeds 10MB limit' });

    let text = fileContent;
    if (ext === 'pdf')
      text =
        text
          .replace(/%PDF-\d+\.\d+/g, '')
          .replace(/\/Type\/[^\/]+/g, '')
          .replace(/\/Subtype\/[^\/]+/g, '')
          .replace(/\/Length[\s]*[\d]+/g, '')
          .replace(/stream[\s\S]*?endstream/g, '')
          .replace(/[\x00-\x1F\x7F-\xFF]/g, '')
          .replace(/\s+/g, ' ')
          .trim() || 'Unable to extract text from PDF';
    else if (ext === 'docx') {
      const m = text.match(/<w:t>([^<]+)<\/w:t>/g);
      text = m
        ? m.map((x) => x.replace(/<\/?w:t>/g, '')).join(' ')
        : 'Unable to extract text from DOCX';
    }

    return res
      .status(200)
      .json({ text, filename: fileName, size: rawBody.length });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
  }
}

// ════════════════════════════════════════════
// INLINE: Share (from api/share.ts)
// ════════════════════════════════════════════
async function handleShare(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });
  if (!isSupabaseConfigured())
    return res.status(500).json({ error: 'Supabase not configured' });
  const { type, data, userId } = req.body;
  if (!type || !data || !userId)
    return res.status(400).json({ error: 'Missing required fields' });
  const shareCard = await insert('share_cards', {
    id: uuidv4(),
    user_id: userId,
    type,
    data,
    image_url:
      'https://placehold.co/1200x630/0A0A0A/C108AB?text=LYC+Intelligence+Share+Card',
    public_uuid: uuidv4(),
  });
  return res.status(200).json(shareCard);
}

// ════════════════════════════════════════════
// INLINE: Lead Capture (from api/lead-capture.ts)
// ════════════════════════════════════════════
async function handleLeadCapture(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });
  if (!isSupabaseConfigured())
    return res
      .status(500)
      .json({ error: 'Supabase not configured', success: false });
  const {
    type,
    name,
    email,
    work_email,
    company,
    title,
    current_title,
    country,
    source,
    message_summary,
  } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  if (!email && !work_email)
    return res.status(400).json({ error: 'Missing email' });
  const leadEmail = work_email || email;
  const isB2B = type === 'b2b';

  try {
    if (isB2B)
      await insert('b2b_leads', {
        name,
        work_email: leadEmail,
        company: company || '',
        title,
        source: source || 'b2b_landing',
        created_at: new Date().toISOString(),
      });
    else
      await insert('b2c_leads', {
        name,
        email: leadEmail,
        current_title,
        country,
        source: source || 'b2c_landing',
        message_summary,
        created_at: new Date().toISOString(),
      });
  } catch (e) {
    console.warn(`[Lead Capture] DB save failed:`, e);
  }

  const [n, c] = await Promise.all([
    sendEmail('lead_notify', {
      leadType: isB2B ? 'B2B' : 'B2C',
      name,
      email: leadEmail,
      company,
      title,
      country,
      currentTitle: current_title,
      source,
      messageSummary: message_summary,
    }),
    sendEmail('lead_capture', { name, email: leadEmail }),
  ]);

  return res.status(200).json({
    success: true,
    leadNotifySent: n.sent,
    leadCaptureSent: c.sent,
  });
}

// ════════════════════════════════════════════
// DISPATCH TABLE
// ════════════════════════════════════════════
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Parse route from regex rewrite query params (__module, __path)
  // vercel.json regex rewrite: /api/{module}/{sub-path} → /api?__module={module}&__path={sub-path}
  const rwModule = (req.query as any).__module as string | undefined;
  const rwPath = (req.query as any).__path as string | undefined;

  let module: string;
  let pathArr: string[];

  if (rwModule) {
    module = rwModule;
    const subSegs = (rwPath || '').split('/').filter(Boolean);
    pathArr = [module, ...subSegs];
    delete (req.query as any).__module;
    delete (req.query as any).__path;
  } else {
    const cleanUrl = (req.url || '').split('?')[0].replace(/^\//, '');
    pathArr = cleanUrl ? cleanUrl.split('/').filter(Boolean) : [];
    if (pathArr[0] === 'api') pathArr.shift();
    module = pathArr[0] || '';
  }

  // Set req.query.path for downstream handlers (segments after the module name)
  (req.query as any).path = pathArr.slice(1);

  const ip = getClientIp(req);
  const publicRoutes = ['lead-capture', 'share'];
  const isPublic = publicRoutes.includes(module) ||
    (module === 'email') ||
    (module === 'stripe' && pathArr[1] === 'webhook') ||
    (module === 'x' && pathArr[1] === 'cron');

  if (!checkRateLimit(ip, isPublic ? 30 : 100, 60000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    switch (module) {
      // ── Admin ──
      case 'admin': {
        const sub = pathArr[1] || '';
        if (sub === 'client-accounts') return handleAdminClientAccounts(req, res);
        if (sub === 'rbac') return handleAdminRbac(req, res);
        if (sub === 'payments') { (req.query as any).path = ['admin', ...pathArr.slice(1)]; return handleMandates(req, res); }
        if (sub === 'org-intelligence') {
          const key = pathArr.slice(2).join('/');
          if (key.startsWith('companies'))
            return handleCompaniesUpload(req, res);
          if (key.startsWith('grid-reports'))
            return handleGridReportsGenerate(req, res);
          if (key.startsWith('scoring'))
            return handleScoringCompute(req, res);
          return res.status(404).json({ error: 'Not found' });
        }
        return res.status(404).json({ error: 'Unknown admin route' });
      }

      // ── Standard business routes ──
      case 'agent-actions':
        return handleAgentActions(req, res);
      case 'agents':
        return handleAgentsInvoke(req, res);
      case 'analytics':
        return handleAnalytics(req, res);
      case 'candidates':
        return handleCandidates(req, res);
      case 'canvas':
        return handleCanvas(req, res);
      case 'career':
        return handleCareer(req, res);
      case 'chat':
        return handleChat(req, res);
      case 'client':
        return handleClient(req, res);
      case 'consultants':
        (req.query as any).path = ['consultants', ...pathArr.slice(1)];
        return handleMandates(req, res);
      case 'credits':
        return handleCredits(req, res);
      case 'data':
        return handleData(req, res);
      case 'enrichment':
        return handleEnrichment(req, res);
      case 'intelligence':
        return handleIntelligence(req, res);
      case 'kevin':
        return handleKevinOversight(req, res);
      case 'linkedin':
        return handleLinkedIn(req, res);
      case 'mandates':
        (req.query as any).path = ['mandates', ...pathArr.slice(1)];
        return handleMandates(req, res);
      case 'matching':
        return handleMatching(req, res);
      case 'rbac':
        return handleRbac(req, res);
      case 'signals':
        return handleSignals(req, res);
      case 'trident':
        return handleTrident(req, res);

      // ── Scoring (complex sub-routing) ──
      case 'scoring': {
        const sub = pathArr[1] || '';
        if (sub === 'shift' && pathArr[2] === 'report') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleSHIFTReport(req, res);
        }
        if (sub === 'shift') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleSHIFTAssessment(req, res);
        }
        if (sub === 'advisory' && pathArr[2] === 'report') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleAdvisoryReport(req, res);
        }
        if (sub === 'advisory' && pathArr[2] === 'participant') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleParticipantAssessment(req, res);
        }
        if (sub === 'advisory') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleAdvisoryAssessment(req, res);
        }
        if (sub === 'candidate' && pathArr[2] === 'submit') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleSubmitCandidateAssessment(req, res);
        }
        if (sub === 'candidate' && pathArr[2] === 'assessment') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleGetCandidateAssessment(req, res);
        }
        if (sub === 'candidate' && pathArr[2] === 'result') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleGetCandidateResult(req, res);
        }
        if (sub === 'candidate' && pathArr[2] === 'visibility') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleUpdateResultVisibility(req, res);
        }
        if (sub === 'candidate') {
          const m = await import('./_lib/scoringComputeHandler.js');
          return m.handleCandidateAssessmentScoring(req, res);
        }
        if (sub === '5') return handleScore5(req, res);
        return handleScore(req, res);
      }

      // ── Stripe ──
      case 'stripe': {
        const m = await import('./_lib/stripeHandler.js');
        const sub = pathArr[1] || '';
        if (sub === 'webhook') return m.webhookHandler(req, res);
        return m.handleStripe(req, res);
      }

      // ── Grid ──
      case 'grid':
        return handleGridReportsGenerate(req, res);

      // ── Communication channels ──
      case 'channels':
        return handleChannels(req, res);
      case 'email': {
        if (req.method !== 'POST')
          return res.status(405).json({ error: 'Method not allowed' });
        const { type, data } = req.body || {};
        if (type !== 'signup')
          return res.status(400).json({ error: 'Only signup emails supported' });
        const ip =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          'unknown';
        const now = Date.now();
        const entry = emailRateLimitMap.get(ip);
        if (entry && now < entry.resetAt && entry.count >= 3)
          return res.status(429).json({ error: 'Rate limit exceeded' });
        emailRateLimitMap.set(ip, {
          count: (entry?.count || 0) + 1,
          resetAt: now + 60000,
        });
        const result = await sendEmail(type, data);
        return res.status(200).json(result);
      }
      case 'wechat':
        return handleWechat(req, res);
      case 'contacts':
        return handleCommunications(req, res);

      // ── Standalone routes (inlined) ──
      case 'dashboard':
        return handleDashboard(req, res);
      case 'upload':
        return handleUpload(req, res);
      case 'share':
        return handleShare(req, res);
      case 'lead-capture':
        return handleLeadCapture(req, res);

      // ── Direct sub-module dispatchers (frontend calls /api/{module}/* directly) ──
      case 'bd':
      case 'compensation':
      case 'approvals':
      case 'automation':
      case 'sla':
      case 'alumni':
      case 'saved-searches':
      case 'talent-alerts':
      case 'consents':
      case 'data-subject-requests':
      case 'kpis':
      case 'nexus':
      case 'benchmark':
      case 'shift':
      case 'ai': {
        const { user: _u, error: _e } = await getUserFromRequest(req);
        if (_e || !_u) return res.status(401).json({ error: 'Unauthorized', success: false });
        (req as any).__authenticatedUser = _u;
        const _subMod = pathArr[0];
        const _subHandlers: Record<string, () => Promise<any>> = {
          'bd': () => import('./_lib/bdHandler.js'),
          'compensation': () => import('./_lib/compensationHandler.js'),
          'approvals': () => import('./_lib/approvalsHandler.js'),
          'automation': () => import('./_lib/automationHandler.js'),
          'sla': () => import('./_lib/slaHandler.js'),
          'alumni': () => import('./_lib/alumniHandler.js'),
          'saved-searches': () => import('./_lib/savedSearchesHandler.js'),
          'talent-alerts': () => import('./_lib/talentAlertsHandler.js'),
          'consents': () => import('./_lib/consentsHandler.js'),
          'data-subject-requests': () => import('./_lib/dsrHandler.js'),
          'kpis': () => import('./_lib/kpisHandler.js'),
          'nexus': () => import('./_lib/nexusHandler.js'),
          'benchmark': () => import('./_lib/benchmarkHandler.js'),
          'shift': () => import('./_lib/shiftHandler.js'),
          'ai': () => import('./_lib/aiHandler.js'),
        };
        const _loader = _subHandlers[_subMod];
        if (!_loader) return res.status(404).json({ error: `Unknown module: ${_subMod}` });
        const _handlerMod = await _loader();
        return _handlerMod.handler(req, res);
      }

      // ── Legacy /api/x/* dispatcher (backward compat) ──
      case 'x': {
        const xModule = pathArr[1] || '';
        (req.query as any).path = pathArr.slice(2);
        if (xModule === 'email') {
          if (req.method !== 'POST')
            return res.status(405).json({ error: 'Method not allowed' });
          const { type, data } = req.body || {};
          if (type !== 'signup')
            return res
              .status(400)
              .json({ error: 'Only signup emails supported' });
          const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            'unknown';
          const now = Date.now();
          const entry = emailRateLimitMap.get(ip);
          if (entry && now < entry.resetAt && entry.count >= 3)
            return res.status(429).json({ error: 'Rate limit exceeded' });
          emailRateLimitMap.set(ip, {
            count: (entry?.count || 0) + 1,
            resetAt: now + 60000,
          });
          return res.status(200).json(await sendEmail(type, data));
        }
        if (xModule !== 'cron') {
          const { user, error } = await getUserFromRequest(req);
          if (error || !user)
            return res.status(401).json({ error: 'Unauthorized', success: false });
          (req as any).__authenticatedUser = user;
        } else {
          if (
            (req.headers['x-cron-secret'] || req.query.secret) !==
            process.env.CRON_SECRET
          )
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const xHandlers: Record<string, () => Promise<any>> = {
          'bd': () => import('./_lib/bdHandler.js'),
          'compensation': () => import('./_lib/compensationHandler.js'),
          'approvals': () => import('./_lib/approvalsHandler.js'),
          'automation': () => import('./_lib/automationHandler.js'),
          'sla': () => import('./_lib/slaHandler.js'),
          'alumni': () => import('./_lib/alumniHandler.js'),
          'saved-searches': () => import('./_lib/savedSearchesHandler.js'),
          'talent-alerts': () => import('./_lib/talentAlertsHandler.js'),
          'consents': () => import('./_lib/consentsHandler.js'),
          'data-subject-requests': () => import('./_lib/dsrHandler.js'),
          'kpis': () => import('./_lib/kpisHandler.js'),
          'nexus': () => import('./_lib/nexusHandler.js'),
          'cron': () => import('./_lib/cronHandler.js'),
          'benchmark': () => import('./_lib/benchmarkHandler.js'),
          'shift': () => import('./_lib/shiftHandler.js'),
          'ai': () => import('./_lib/aiHandler.js'),
        };
        const loader = xHandlers[xModule];
        if (!loader)
          return res.status(404).json({ error: `Unknown module: ${xModule}` });
        const mod = await loader();
        return mod.handler(req, res);
      }

      default:
        return res.status(404).json({ error: `Route not found: /api/${module}` });
    }
  } catch (err: any) {
    console.error(`[mega-router] /api/${module}:`, err);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}