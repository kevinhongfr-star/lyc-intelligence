/**
 * v1 Candidate Portal API — catch-all router.
 *
 * Single Vercel edge function that routes all /api/v1/* requests based
 * on the path array. Organized by domain:
 *
 *   /health                 — public health check
 *   /contacts               — internal CRUD
 *   /mandates               — internal CRUD
 *   /pipeline               — internal pipeline reads
 *   /campaigns              — internal campaign CRUD
 *   /campaign-contacts      — internal campaign contact management
 *   /client/*               — client portal endpoints
 *   /candidate/*            — candidate portal endpoints
 *   /b2c/*                  — B2C portal endpoints
 *   /council/*              — council portal endpoints
 *
 * Every endpoint goes through the same middleware stack:
 *   1. Rate limit (default: 60 req/min)
 *   2. Auth resolution (JWT → profile)
 *   3. RBAC check (role + user_type based on route)
 *   4. Audit logging (for mutations)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveUser, type V1AuthUser } from '../_lib/v1/auth.js';
import {
  hasRole,
  isInternalUser,
  hasUserType,
  isAuthorized,
} from '../_lib/v1/roleCheck.js';
import { defaultLimiter, authLimiter } from '../_lib/v1/rateLimit.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendTooManyRequests,
} from '../_lib/v1/response.js';
import {
  validateBody,
  validateQuery,
  firstZodError,
  contactCreateSchema,
  contactUpdateSchema,
  mandateCreateSchema,
  mandateUpdateSchema,
  campaignCreateSchema,
  campaignUpdateSchema,
  paginationSchema,
  searchSchema,
} from '../_lib/v1/validators.js';
import { select, selectOne, insert, update, deleteRows, countRows } from '../_lib/v1/supabaseServer.js';
import { logAuditEvent, getClientIp, getUserAgent } from '../_lib/v1/audit.js';
import { logInfo, logError, logWarn } from '../_lib/v1/logging.js';
import { getCache, setCache, deleteCachePrefix } from '../_lib/v1/cache.js';
import {
  handleAuthLogin,
  handleAuthSignup,
  handleAuthLogout,
  handleAuthMe,
  handleAuthResetPassword,
} from '../_lib/v1/authEndpoints.js';
import { handleB2c } from '../_lib/v1/b2c/routes.js';

export const maxDuration = 60;

// ─── Helpers ──────────────────────────────────────────────────────

function getPathSegments(req: VercelRequest): string[] {
  const path = req.query.path;
  if (Array.isArray(path)) return path;
  if (typeof path === 'string') return path.split('/').filter(Boolean);
  return [];
}

function rateLimitKey(user: V1AuthUser | null, req: VercelRequest): string {
  return user ? user.id : getClientIp(req);
}

async function requireAuth(req: VercelRequest): Promise<V1AuthUser | null> {
  const result = await resolveUser(req);
  return result.user;
}

// ─── Health ───────────────────────────────────────────────────────

async function handleHealth(_req: VercelRequest, res: VercelResponse): Promise<void> {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
}

// ─── Contacts (internal only) ─────────────────────────────────────

async function handleContactsList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const queryResult = validateQuery(req, paginationSchema.merge(searchSchema));
  if (!queryResult.success) {
    return sendBadRequest(res, firstZodError(queryResult));
  }
  const { page, page_size, q } = queryResult.data;
  const offset = (page - 1) * page_size;

  const cacheKey = `contacts:list:${page}:${page_size}:${q || ''}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return sendSuccess(res, cached, { source: 'cache' });
  }

  const rows = await select(
    'contacts',
    'id,first_name,last_name,email,phone,company,title,linkedin_url,source,created_at',
    { limit: page_size, offset, order: 'created_at.desc' }
  );

  const total = await countRows('contacts');
  const result = { items: rows, page, page_size, total };
  setCache(cacheKey, result, 30_000);
  sendSuccess(res, result);
}

async function handleContactsCreate(req: VercelRequest, res: VercelResponse, user: V1AuthUser): Promise<void> {
  const bodyResult = validateBody(req, contactCreateSchema);
  if (!bodyResult.success) {
    return sendBadRequest(res, firstZodError(bodyResult));
  }

  const newContact = await insert('contacts', bodyResult.data);
  deleteCachePrefix('contacts:');

  await logAuditEvent({
    user_id: user.id,
    action: 'contact.created',
    resource_type: 'contacts',
    resource_id: newContact?.id,
    details: { email: bodyResult.data.email },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendCreated(res, newContact);
}

async function handleContactsGet(req: VercelRequest, res: VercelResponse, id: string): Promise<void> {
  const contact = await selectOne('contacts', { column: 'id', value: id, select: '*' });
  if (!contact) return sendNotFound(res, 'Contact');
  sendSuccess(res, contact);
}

async function handleContactsUpdate(req: VercelRequest, res: VercelResponse, id: string, user: V1AuthUser): Promise<void> {
  const bodyResult = validateBody(req, contactUpdateSchema);
  if (!bodyResult.success) {
    return sendBadRequest(res, firstZodError(bodyResult));
  }

  const updated = await update('contacts', { column: 'id', value: id }, bodyResult.data);
  deleteCachePrefix('contacts:');

  await logAuditEvent({
    user_id: user.id,
    action: 'contact.updated',
    resource_type: 'contacts',
    resource_id: id,
    details: { fields: Object.keys(bodyResult.data) },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendSuccess(res, updated);
}

async function handleContactsDelete(req: VercelRequest, res: VercelResponse, id: string, user: V1AuthUser): Promise<void> {
  await deleteRows('contacts', { column: 'id', value: id });
  deleteCachePrefix('contacts:');

  await logAuditEvent({
    user_id: user.id,
    action: 'contact.deleted',
    resource_type: 'contacts',
    resource_id: id,
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendSuccess(res, { id, deleted: true });
}

// ─── Mandates (internal only) ─────────────────────────────────────

async function handleMandatesList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const queryResult = validateQuery(req, paginationSchema.merge(searchSchema));
  if (!queryResult.success) {
    return sendBadRequest(res, firstZodError(queryResult));
  }
  const { page, page_size, q } = queryResult.data;
  const offset = (page - 1) * page_size;

  const cacheKey = `mandates:list:${page}:${page_size}:${q || ''}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return sendSuccess(res, cached, { source: 'cache' });
  }

  const rows = await select(
    'mandates',
    'id,title,company_name,status,priority,location,function_area,seniority,created_at',
    { limit: page_size, offset, order: 'created_at.desc' }
  );

  const total = await countRows('mandates');
  const result = { items: rows, page, page_size, total };
  setCache(cacheKey, result, 30_000);
  sendSuccess(res, result);
}

async function handleMandatesCreate(req: VercelRequest, res: VercelResponse, user: V1AuthUser): Promise<void> {
  const bodyResult = validateBody(req, mandateCreateSchema);
  if (!bodyResult.success) {
    return sendBadRequest(res, firstZodError(bodyResult));
  }

  const newMandate = await insert('mandates', bodyResult.data);
  deleteCachePrefix('mandates:');

  await logAuditEvent({
    user_id: user.id,
    action: 'mandate.created',
    resource_type: 'mandates',
    resource_id: newMandate?.id,
    details: { title: bodyResult.data.title },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendCreated(res, newMandate);
}

async function handleMandatesGet(req: VercelRequest, res: VercelResponse, id: string): Promise<void> {
  const mandate = await selectOne('mandates', { column: 'id', value: id, select: '*' });
  if (!mandate) return sendNotFound(res, 'Mandate');
  sendSuccess(res, mandate);
}

async function handleMandatesUpdate(req: VercelRequest, res: VercelResponse, id: string, user: V1AuthUser): Promise<void> {
  const bodyResult = validateBody(req, mandateUpdateSchema);
  if (!bodyResult.success) {
    return sendBadRequest(res, firstZodError(bodyResult));
  }

  const updated = await update('mandates', { column: 'id', value: id }, bodyResult.data);
  deleteCachePrefix('mandates:');

  await logAuditEvent({
    user_id: user.id,
    action: 'mandate.updated',
    resource_type: 'mandates',
    resource_id: id,
    details: { fields: Object.keys(bodyResult.data) },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendSuccess(res, updated);
}

// ─── Pipeline (internal only) ─────────────────────────────────────

async function handlePipelineList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const queryResult = validateQuery(req, paginationSchema);
  if (!queryResult.success) {
    return sendBadRequest(res, firstZodError(queryResult));
  }
  const { page, page_size } = queryResult.data;
  const offset = (page - 1) * page_size;

  const rows = await select(
    'candidates_pipeline',
    '*',
    { limit: page_size, offset, order: 'created_at.desc' }
  );
  const total = await countRows('candidates_pipeline');
  sendSuccess(res, { items: rows, page, page_size, total });
}

// ─── Campaigns (internal only) ────────────────────────────────────

async function handleCampaignsList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const queryResult = validateQuery(req, paginationSchema);
  if (!queryResult.success) {
    return sendBadRequest(res, firstZodError(queryResult));
  }
  const { page, page_size } = queryResult.data;
  const offset = (page - 1) * page_size;

  const rows = await select(
    'campaigns',
    '*',
    { limit: page_size, offset, order: 'created_at.desc' }
  );
  const total = await countRows('campaigns');
  sendSuccess(res, { items: rows, page, page_size, total });
}

async function handleCampaignsCreate(req: VercelRequest, res: VercelResponse, user: V1AuthUser): Promise<void> {
  const bodyResult = validateBody(req, campaignCreateSchema);
  if (!bodyResult.success) {
    return sendBadRequest(res, firstZodError(bodyResult));
  }

  const newCampaign = await insert('campaigns', {
    ...bodyResult.data,
    owner_id: user.id,
  });

  await logAuditEvent({
    user_id: user.id,
    action: 'campaign.created',
    resource_type: 'campaigns',
    resource_id: newCampaign?.id,
    details: { name: bodyResult.data.name, type: bodyResult.data.type },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendCreated(res, newCampaign);
}

async function handleCampaignsGet(req: VercelRequest, res: VercelResponse, id: string): Promise<void> {
  const campaign = await selectOne('campaigns', { column: 'id', value: id, select: '*' });
  if (!campaign) return sendNotFound(res, 'Campaign');
  sendSuccess(res, campaign);
}

async function handleCampaignsUpdate(req: VercelRequest, res: VercelResponse, id: string, user: V1AuthUser): Promise<void> {
  const bodyResult = validateBody(req, campaignUpdateSchema);
  if (!bodyResult.success) {
    return sendBadRequest(res, firstZodError(bodyResult));
  }

  const updated = await update('campaigns', { column: 'id', value: id }, bodyResult.data);

  await logAuditEvent({
    user_id: user.id,
    action: 'campaign.updated',
    resource_type: 'campaigns',
    resource_id: id,
    details: { fields: Object.keys(bodyResult.data) },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendSuccess(res, updated);
}

// ─── Campaign Contacts (internal only) ────────────────────────────

async function handleCampaignContactsList(req: VercelRequest, res: VercelResponse, campaignId: string): Promise<void> {
  const queryResult = validateQuery(req, paginationSchema);
  if (!queryResult.success) {
    return sendBadRequest(res, firstZodError(queryResult));
  }
  const { page, page_size } = queryResult.data;
  const offset = (page - 1) * page_size;

  const rows = await select(
    'campaign_contacts',
    '*',
    { campaign_id: `eq.${campaignId}`, limit: page_size, offset, order: 'added_at.desc' }
  );
  const total = await countRows('campaign_contacts', { where: [{ column: 'campaign_id', value: campaignId, op: 'eq' }] });
  sendSuccess(res, { items: rows, page, page_size, total });
}

// ─── Client portal ────────────────────────────────────────────────

async function handleClientDashboard(req: VercelRequest, res: VercelResponse, user: V1AuthUser): Promise<void> {
  // Client-facing dashboard — active mandates, recent activity, pipeline summary
  // Scoped to the client's own data via client_id (enforced by RLS)
  const mandates = await select(
    'mandates',
    'id,title,status,priority,created_at',
    { limit: 10, order: 'created_at.desc' }
  );
  sendSuccess(res, {
    mandates,
    profile: {
      id: user.id,
      email: user.email,
      role: user.role,
      user_type: user.user_type,
    },
  });
}

// ─── Candidate portal ─────────────────────────────────────────────

async function handleCandidateProfile(req: VercelRequest, res: VercelResponse, user: V1AuthUser): Promise<void> {
  const profile = await selectOne('profiles', { column: 'id', value: user.id, select: 'id,email,name,role,user_type,created_at' });
  sendSuccess(res, profile);
}

async function handleCandidateMandates(_req: VercelRequest, res: VercelResponse, _user: V1AuthUser): Promise<void> {
  // Candidate-facing mandate list — mandates where candidate is in pipeline
  // Real impl would join through candidate_mandate_links (currently empty per audit)
  sendSuccess(res, { items: [], page: 1, page_size: 20, total: 0 });
}

// ─── B2C portal ───────────────────────────────────────────────────

async function handleB2cAssessments(_req: VercelRequest, res: VercelResponse, _user: V1AuthUser): Promise<void> {
  sendSuccess(res, { items: [], page: 1, page_size: 20, total: 0 });
}

// ─── Council portal ───────────────────────────────────────────────

async function handleCouncilDashboard(_req: VercelRequest, res: VercelResponse, _user: V1AuthUser): Promise<void> {
  sendSuccess(res, { active: true });
}

// ─── Main router ──────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const segments = getPathSegments(req);
  const resource = segments[0];

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.status(204).end();
    return;
  }

  try {
    // ─── Public endpoints ──────────────────────────────────────────
    if (resource === 'health') {
      return await handleHealth(req, res);
    }

    // ─── Auth endpoints (public, stricter rate limit) ─────────────
    // login / signup / reset-password / logout are unauthenticated.
    // /auth/me self-resolves the caller from the cookie and returns 401
    // when there is none (the client useAuth hook treats 401 as "no user").
    if (resource === 'auth') {
      const sub = segments[1] ?? '';

      // Stricter per-IP limit — auth endpoints are the main abuse surface.
      const authKey = `auth:${getClientIp(req)}`;
      const authRl = authLimiter(authKey);
      if (!authRl.allowed) {
        return sendTooManyRequests(res, Math.ceil(authRl.retryAfterMs / 1000));
      }

      if (sub === 'login' && req.method === 'POST') return await handleAuthLogin(req, res);
      if (sub === 'signup' && req.method === 'POST') return await handleAuthSignup(req, res);
      if (sub === 'logout' && req.method === 'POST') return await handleAuthLogout(req, res);
      if (sub === 'me' && req.method === 'GET') return await handleAuthMe(req, res);
      if (sub === 'reset-password' && req.method === 'POST')
        return await handleAuthResetPassword(req, res);

      return sendNotFound(res, 'Auth endpoint');
    }

    // ─── B2C portal endpoints (per-route auth + rate limits) ────────
    // handleB2c applies its own auth (via b2cRoute → resolveUser), its
    // own strict per-group rate limits, and its own audit events. It
    // gates user_type === 'b2c' by default, so internal users can NOT
    // accidentally access b2c data.
    if (resource === 'b2c') {
      return await handleB2c(req, res);
    }

    // ─── Rate limit (all authenticated endpoints) ─────────────────
    const key = rateLimitKey(null, req);
    const rl = defaultLimiter(key);
    if (!rl.allowed) {
      logWarn('Rate limit exceeded', { key, method: req.method, url: req.url });
      return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));
    }

    // ─── Auth (everything below needs a valid user) ───────────────
    const user = await requireAuth(req);
    if (!user) {
      return sendUnauthorized(res);
    }

    // Authenticated user key for rate limiting
    const authKey = rateLimitKey(user, req);
    const authRl = defaultLimiter(authKey);
    if (!authRl.allowed) {
      return sendTooManyRequests(res, Math.ceil(authRl.retryAfterMs / 1000));
    }

    // ─── Contacts (internal) ──────────────────────────────────────
    if (resource === 'contacts') {
      if (!isInternalUser(user)) return sendForbidden(res);

      const id = segments[1];
      if (!id) {
        if (req.method === 'GET') return await handleContactsList(req, res);
        if (req.method === 'POST') return await handleContactsCreate(req, res, user);
        return sendError(res, 405, 'Method not allowed');
      }
      if (req.method === 'GET') return await handleContactsGet(req, res, id);
      if (req.method === 'PUT' || req.method === 'PATCH') return await handleContactsUpdate(req, res, id, user);
      if (req.method === 'DELETE') return await handleContactsDelete(req, res, id, user);
      return sendError(res, 405, 'Method not allowed');
    }

    // ─── Mandates (internal) ──────────────────────────────────────
    if (resource === 'mandates') {
      if (!isInternalUser(user)) return sendForbidden(res);

      const id = segments[1];
      if (!id) {
        if (req.method === 'GET') return await handleMandatesList(req, res);
        if (req.method === 'POST') return await handleMandatesCreate(req, res, user);
        return sendError(res, 405, 'Method not allowed');
      }
      if (req.method === 'GET') return await handleMandatesGet(req, res, id);
      if (req.method === 'PUT' || req.method === 'PATCH') return await handleMandatesUpdate(req, res, id, user);
      return sendError(res, 405, 'Method not allowed');
    }

    // ─── Pipeline (internal) ──────────────────────────────────────
    if (resource === 'pipeline') {
      if (!isInternalUser(user)) return sendForbidden(res);
      if (req.method === 'GET') return await handlePipelineList(req, res);
      return sendError(res, 405, 'Method not allowed');
    }

    // ─── Campaigns (internal) ─────────────────────────────────────
    if (resource === 'campaigns') {
      if (!isInternalUser(user)) return sendForbidden(res);

      const id = segments[1];
      if (!id) {
        if (req.method === 'GET') return await handleCampaignsList(req, res);
        if (req.method === 'POST') return await handleCampaignsCreate(req, res, user);
        return sendError(res, 405, 'Method not allowed');
      }

      // /campaigns/:id/contacts
      if (segments[2] === 'contacts') {
        if (req.method === 'GET') return await handleCampaignContactsList(req, res, id);
        return sendError(res, 405, 'Method not allowed');
      }

      if (req.method === 'GET') return await handleCampaignsGet(req, res, id);
      if (req.method === 'PUT' || req.method === 'PATCH') return await handleCampaignsUpdate(req, res, id, user);
      return sendError(res, 405, 'Method not allowed');
    }

    // ─── Client portal ────────────────────────────────────────────
    if (resource === 'client') {
      if (!hasUserType(user, 'client')) return sendForbidden(res);
      const sub = segments[1];
      if (sub === 'dashboard' && req.method === 'GET') return await handleClientDashboard(req, res, user);
      return sendNotFound(res, 'Client endpoint');
    }

    // ─── Candidate portal ─────────────────────────────────────────
    if (resource === 'candidate') {
      if (!hasUserType(user, 'candidate')) return sendForbidden(res);
      const sub = segments[1];
      if (sub === 'profile' && req.method === 'GET') return await handleCandidateProfile(req, res, user);
      if (sub === 'mandates' && req.method === 'GET') return await handleCandidateMandates(req, res, user);
      return sendNotFound(res, 'Candidate endpoint');
    }

    // ─── B2C portal ───────────────────────────────────────────────
    if (resource === 'b2c') {
      if (!hasUserType(user, 'b2c')) return sendForbidden(res);
      const sub = segments[1];
      if (sub === 'assessments' && req.method === 'GET') return await handleB2cAssessments(req, res, user);
      return sendNotFound(res, 'B2C endpoint');
    }

    // ─── Council portal ───────────────────────────────────────────
    if (resource === 'council') {
      if (!hasUserType(user, 'council')) return sendForbidden(res);
      const sub = segments[1];
      if (sub === 'dashboard' && req.method === 'GET') return await handleCouncilDashboard(req, res, user);
      return sendNotFound(res, 'Council endpoint');
    }

    // ─── Fallback ─────────────────────────────────────────────────
    logInfo('v1 route not found', { segments, method: req.method });
    sendNotFound(res, 'Endpoint');

  } catch (err) {
    logError('v1 handler error', {
      error: err instanceof Error ? err.message : String(err),
      resource,
      method: req.method,
    });
    sendError(res, 500, 'Internal server error');
  }
}
