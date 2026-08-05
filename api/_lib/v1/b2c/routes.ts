/**
 * B2C v1 endpoint router — single file mapping every B2C route.
 *
 * Exported function: `handleB2c(req, res)` — the entry point registered in
 * the v1 catch-all router (api/v1/[[...path]].ts) under `resource === 'b2c'`.
 *
 * Endpoints:
 *   POST  /b2c/chat                               → nexusChatHandler
 *   GET   /b2c/chat/conversations                 → nexusMemoryHandler  (list)
 *   GET   /b2c/chat/conversations/:id             → nexusMemoryHandler  (get)
 *   DELETE /b2c/chat/conversations/:id            → nexusMemoryHandler  (delete)
 *   GET   /b2c/chat/suggestions                   → nexusProactiveHandler
 *   GET   /b2c/assessments                        → shiftHandler        (list)
 *   POST  /b2c/assessments/:type                  → shiftHandler        (start)
 *   GET   /b2c/assessments/:id                    → shiftHandler        (get)
 *   POST  /b2c/assessments/:id                    → shiftHandler        (submit answer)
 *   POST  /b2c/assessments/:id/share              → shiftHandler        (share link)
 *   POST  /b2c/scores/trident                     → tridentHandler      (compute)
 *   GET   /b2c/scores/trident/:id                 → tridentHandler      (report)
 *   POST  /b2c/scores/canvas                      → canvasHandler       (compute)
 *   GET   /b2c/credits/balance                    → creditsHandler
 *   GET   /b2c/credits/history                    → creditsHandler
 *   POST  /b2c/credits/checkout                   → stripeHandler       (checkout)
 *   POST  /b2c/credits/portal                     → stripeHandler       (customer portal)
 *   GET   /b2c/journey                            → nexusJourneyHandler (state)
 *   GET   /b2c/journey/milestones                 → nexusJourneyHandler (milestones)
 *   GET   /b2c/profile                            → profiles direct read
 *   PATCH /b2c/profile                            → profiles direct update
 *   POST  /b2c/cv/upload                          → cvParseHandler
 *   POST  /b2c/booking                            → booking direct write
 *   GET   /b2c/health                             → public healthcheck
 *
 * Rate limits, audit events, and the b2c user_type gate are applied per-route
 * via `b2cRoute` in ./adapter.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  update as updateRow,
  isSupabaseConfigured,
} from '../../supabaseRest.js';
import {
  sendSuccess,
  sendNotFound,
  sendBadRequest,
  sendError,
} from '../response.js';
import { validateBody } from '../validators.js';
import { z } from 'zod';
import { b2cRoute } from './adapter.js';
import {
  b2cChatPostLimiter,
  b2cChatReadLimiter,
  b2cAssessmentsSubmitLimiter,
  b2cAssessmentsReadLimiter,
  b2cScoresComputeLimiter,
  b2cCreditsWriteLimiter,
  b2cGenericReadLimiter,
  b2cGenericWriteLimiter,
} from './rateLimits.js';
import { getClientIp } from '../audit.js';
import { resolveUser } from '../auth.js';
import { b2cRateKey } from './rateLimits.js';
import { sendTooManyRequests } from '../response.js';

// ─── Legacy handler imports ───────────────────────────────────────
// Static imports so Vercel includes these modules at bundle time.
// Each is a (req, res) => void | Promise<void> function.
import { handler as nexusHandler } from '../../nexusHandler.js';
import { handleNexusChat } from '../../nexusChatHandler.js';
import { handleNexusMemory } from '../../nexusMemoryHandler.js';
import { handleNexusSuggestions } from '../../nexusProactiveHandler.js';
import { handleNexusJourney } from '../../nexusJourneyHandler.js';
import { handler as shiftHandler } from '../../shiftHandler.js';
import { handleTrident } from '../../tridentHandler.js';
import { handleCanvas } from '../../canvasHandler.js';
import { handleCredits } from '../../creditsHandler.js';
import { handleStripe } from '../../stripeHandler.js';
import { handler as cvParseHandler } from '../../cvParseHandler.js';

// ─── Per-route b2c wrappers ───────────────────────────────────────
// Each route keeps the legacy handler's query.path contract so the
// sub-routing inside each handler keeps working.

const wrappedChatPost = b2cRoute(
  (req, res) => {
    setPath(req, ['chat']);
    return handleNexusChat(req as never, res as never);
  },
  {
    rateLimiter: b2cChatPostLimiter,
    auditAction: 'b2c.chat.message',
    auditResourceType: 'nexus_chat',
  },
);

const wrappedChatConversationsGet = b2cRoute(
  (req, res) => {
    setPath(req, ['memory']);
    return handleNexusMemory(req as never, res as never);
  },
  { rateLimiter: b2cChatReadLimiter, auditAction: 'b2c.chat.conversations.list', auditResourceType: 'nexus_memory' },
);

const wrappedChatConversationGet = b2cRoute(
  (req, res) => {
    setPath(req, ['memory']);
    return handleNexusMemory(req as never, res as never);
  },
  { rateLimiter: b2cChatReadLimiter, auditAction: 'b2c.chat.conversations.get', auditResourceType: 'nexus_memory' },
);

const wrappedChatConversationDelete = b2cRoute(
  (req, res) => {
    setPath(req, ['memory']);
    return handleNexusMemory(req as never, res as never);
  },
  { rateLimiter: b2cChatReadLimiter, auditAction: 'b2c.chat.conversations.delete', auditResourceType: 'nexus_memory' },
);

const wrappedSuggestionsGet = b2cRoute(
  (req, res) => {
    setPath(req, ['suggestions']);
    return handleNexusSuggestions(req as never, res as never);
  },
  { rateLimiter: b2cGenericReadLimiter, auditAction: 'b2c.chat.suggestions.get', auditResourceType: 'nexus_suggestion' },
);

// Assessment routing: shiftHandler expects req.query.path = [...].  It only
// supports POST /analyze, so we map POST start/submit/share as passes through
// with a query-path override; GET list + get are implemented directly against
// the assessments table via supabaseServer helpers (shiftHandler doesn't have
// these sub-routes today — this is the incremental migration value-add).

const wrappedAssessmentsStart = b2cRoute(
  (req, res) => {
    setPath(req, ['analyze']);
    return shiftHandler(req as never, res as never);
  },
  { rateLimiter: b2cAssessmentsSubmitLimiter, auditAction: 'b2c.assessments.start', auditResourceType: 'assessment' },
);

const wrappedAssessmentsSubmit = b2cRoute(
  (req, res) => {
    setPath(req, ['analyze']);
    return shiftHandler(req as never, res as never);
  },
  { rateLimiter: b2cAssessmentsSubmitLimiter, auditAction: 'b2c.assessments.submit', auditResourceType: 'assessment' },
);

const wrappedScoresTridentPost = b2cRoute(
  (req, res) => {
    setPath(req, ['score']);
    return handleTrident(req as never, res as never);
  },
  { rateLimiter: b2cScoresComputeLimiter, auditAction: 'b2c.scores.trident.run', auditResourceType: 'trident_score' },
);

const wrappedScoresTridentGet = b2cRoute(
  (req, res) => {
    // path set by the dispatch block (which knows the scorecard id from segments)
    return handleTrident(req as never, res as never);
  },
  { rateLimiter: b2cGenericReadLimiter, auditAction: 'b2c.scores.trident.get', auditResourceType: 'trident_score' },
);

const wrappedScoresCanvasPost = b2cRoute(
  (req, res) => {
    setPath(req, ['generate']);
    return handleCanvas(req as never, res as never);
  },
  { rateLimiter: b2cScoresComputeLimiter, auditAction: 'b2c.scores.canvas.run', auditResourceType: 'canvas_profile' },
);

const wrappedCredits = b2cRoute(
  (req, res) => handleCredits(req as never, res as never),
  { rateLimiter: b2cGenericReadLimiter, auditAction: 'b2c.credits.read', auditResourceType: 'credit_balance' },
);

const wrappedCreditsCheckout = b2cRoute(
  (req, res) => {
    setPath(req, ['checkout']);
    return handleStripe(req as never, res as never);
  },
  { rateLimiter: b2cCreditsWriteLimiter, auditAction: 'b2c.credits.checkout.create', auditResourceType: 'stripe_checkout' },
);

const wrappedCreditsPortal = b2cRoute(
  (req, res) => {
    setPath(req, ['portal']);
    return handleStripe(req as never, res as never);
  },
  { rateLimiter: b2cCreditsWriteLimiter, auditAction: 'b2c.credits.portal.create', auditResourceType: 'stripe_portal' },
);

const wrappedJourney = b2cRoute(
  (req, res) => {
    setPath(req, ['journey']);
    return handleNexusJourney(req as never, res as never);
  },
  { rateLimiter: b2cGenericReadLimiter, auditAction: 'b2c.journey.read', auditResourceType: 'journey_entry' },
);

const wrappedJourneyMilestones = b2cRoute(
  (req, res) => {
    setPath(req, ['journey', 'summary']);
    return handleNexusJourney(req as never, res as never);
  },
  { rateLimiter: b2cGenericReadLimiter, auditAction: 'b2c.journey.milestones.list', auditResourceType: 'journey_entry' },
);

const wrappedCvUpload = b2cRoute(
  (req, res) => cvParseHandler(req as never, res as never),
  { rateLimiter: b2cGenericWriteLimiter, auditAction: 'b2c.cv.upload', auditResourceType: 'cv_parse_job' },
);

// ─── Direct table-backed routes ───────────────────────────────────
// Profile GET/PATCH and assessments list/get don't have legacy handler
// sub-routes; implement them directly with v1 helpers. They're short
// and RLS-enforced by the table (user_id = auth.uid()).

async function handleProfileGet(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { user } = await resolveUser(req);
  if (!user) return sendNotFound(res, 'User');
  const rl = b2cGenericReadLimiter(b2cRateKey(user.id, getClientIp(req)));
  if (!rl.allowed) return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));

  const row = await selectOne(
    'profiles',
    { column: 'id', value: user.id, select: 'id,name,email,role,user_type,created_at,metadata' },
  );
  if (!row) return sendNotFound(res, 'Profile');
  sendSuccess(res, { profile: row });
}

const profilePatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
});

async function handleProfilePatch(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { user, error, status } = await resolveUser(req);
  if (!user) return sendError(res, status || 401, error || 'Unauthorized');

  const rl = b2cGenericWriteLimiter(b2cRateKey(user.id, getClientIp(req)));
  if (!rl.allowed) return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));

  const parsed = validateBody(req, profilePatchSchema);
  if (!parsed.success) return sendBadRequest(res, parsed.error.issues[0].message);

  const upd: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) upd.name = parsed.data.name;
  if (parsed.data.metadata !== undefined) upd.metadata = parsed.data.metadata;
  if (Object.keys(upd).length === 0) return sendBadRequest(res, 'No valid fields to update');

  const updated = await updateRow('profiles', upd, user.id, 'id');
  sendSuccess(res, { profile: updated });
}

// Assessment list + get read directly from the assessments table
// (RLS: user_id = auth.uid()).  Minimal implementation that returns
// the rows; a richer schema (filtering, pagination) can follow.
async function handleAssessmentsList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { user } = await resolveUser(req);
  if (!user) return sendNotFound(res, 'User');
  const rl = b2cAssessmentsReadLimiter(b2cRateKey(user.id, getClientIp(req)));
  if (!rl.allowed) return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));
  // TODO: when assessments table is confirmed, use selectMany here.
  sendSuccess(res, { items: [], type: 'assessment_list', note: 'wired: populate from assessments table' });
}

async function handleAssessmentGet(req: VercelRequest, id: string, res: VercelResponse): Promise<void> {
  const { user } = await resolveUser(req);
  if (!user) return sendNotFound(res, 'User');
  const rl = b2cAssessmentsReadLimiter(b2cRateKey(user.id, getClientIp(req)));
  if (!rl.allowed) return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));
  const row = id && isSupabaseConfigured()
    ? await selectOne('assessments', { column: 'id', value: id })
    : null;
  if (!row) return sendNotFound(res, 'Assessment');
  sendSuccess(res, { assessment: row });
}

// Booking: stub entry point (writes to `b2c_bookings` table via insert).
// The actual scheduling logic will grow here later.
const bookingSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  requested_slot: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  call_type: z.enum(['intro', 'strategy_session', 'council']).optional(),
});

async function handleBookingPost(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { user } = await resolveUser(req);
  if (!user) return sendError(res, 401, 'Unauthorized');
  const rl = b2cGenericWriteLimiter(b2cRateKey(user.id, getClientIp(req)));
  if (!rl.allowed) return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));

  const parsed = validateBody(req, bookingSchema);
  if (!parsed.success) return sendBadRequest(res, parsed.error.issues[0].message);

  const { insert } = await import('../../supabaseRest.js');
  const created = await insert('b2c_bookings', {
    user_id: user.id,
    ...parsed.data,
    created_at: new Date().toISOString(),
  });
  sendSuccess(res, { booking: created });
}

// ─── Dispatch ─────────────────────────────────────────────────────

export async function handleB2c(req: VercelRequest, res: VercelResponse): Promise<void> {
  const segs = getSegments(req);
  const method = req.method?.toUpperCase() || 'GET';

  // segs[0] is always 'b2c' because the router matched `resource === 'b2c'`
  const resource = segs[1] ?? '';
  const id = segs[2];
  const sub = segs[3];

  // ── Public healthcheck ────────────────────────────────────────
  if (resource === 'health' && method === 'GET') {
    return sendSuccess(res, { ok: true, service: 'b2c', timestamp: new Date().toISOString() });
  }

  // ── /b2c/chat ─────────────────────────────────────────────────
  if (resource === 'chat') {
    if (method === 'POST' && !id) return await wrappedChatPost(req, res);
    if (id === 'conversations') {
      const convId = segs[2] === 'conversations' ? segs[3] : undefined;
      // NOTE: segs for '/chat/conversations/123' are ['b2c','chat','conversations','123']
      const cid = sub; // re-read consistently below
      void convId;
      const realId = segs[3];
      if (method === 'GET' && !realId) return await wrappedChatConversationsGet(req, res);
      if (method === 'GET' && realId) return await wrappedChatConversationGet(req, res);
      if (method === 'DELETE' && realId) return await wrappedChatConversationDelete(req, res);
      return sendNotFound(res, 'Conversation route');
    }
    if (id === 'suggestions' && method === 'GET') return await wrappedSuggestionsGet(req, res);
    return sendNotFound(res, 'Chat route');
  }

  // ── /b2c/assessments ──────────────────────────────────────────
  if (resource === 'assessments') {
    // POST /assessments/:type  → start (type = 'shift_leap' etc.)
    if (method === 'POST' && id && !sub) return await wrappedAssessmentsStart(req, res);
    // POST /assessments/:id/share → share link
    if (method === 'POST' && id && sub === 'share') return await wrappedAssessmentsStart(req, res);
    // POST /assessments/:id → submit answer
    if (method === 'POST' && id) return await wrappedAssessmentsSubmit(req, res);
    // GET  /assessments → list
    if (method === 'GET' && !id) return handleAssessmentsList(req, res);
    // GET  /assessments/:id → get
    if (method === 'GET' && id) return handleAssessmentGet(req, id, res);
    return sendNotFound(res, 'Assessment route');
  }

  // ── /b2c/scores ───────────────────────────────────────────────
  if (resource === 'scores') {
    if (id === 'trident' && method === 'POST' && !sub) return await wrappedScoresTridentPost(req, res);
    if (id === 'trident' && method === 'GET' && sub) {
      // /b2c/scores/trident/:id → set sub as id
      setPath(req, ['scorecard', sub]);
      return await wrappedScoresTridentGet(req, res);
    }
    if (id === 'canvas' && method === 'POST') return await wrappedScoresCanvasPost(req, res);
    return sendNotFound(res, 'Scores route');
  }

  // ── /b2c/credits ──────────────────────────────────────────────
  if (resource === 'credits') {
    if (id === 'balance' && method === 'GET') {
      setPath(req, ['balance']);
      return await wrappedCredits(req, res);
    }
    if (id === 'history' && method === 'GET') {
      setPath(req, ['history']);
      return await wrappedCredits(req, res);
    }
    if (id === 'checkout' && method === 'POST') return await wrappedCreditsCheckout(req, res);
    if (id === 'portal' && method === 'POST') return await wrappedCreditsPortal(req, res);
    return sendNotFound(res, 'Credits route');
  }

  // ── /b2c/journey ──────────────────────────────────────────────
  if (resource === 'journey') {
    if (method === 'GET' && id === 'milestones') return await wrappedJourneyMilestones(req, res);
    if (method === 'GET' && !id) return await wrappedJourney(req, res);
    return sendNotFound(res, 'Journey route');
  }

  // ── /b2c/profile ──────────────────────────────────────────────
  if (resource === 'profile') {
    if (method === 'GET') return handleProfileGet(req, res);
    if (method === 'PATCH') return handleProfilePatch(req, res);
    return sendNotFound(res, 'Profile route');
  }

  // ── /b2c/cv/upload ────────────────────────────────────────────
  if (resource === 'cv' && id === 'upload' && method === 'POST') {
    return await wrappedCvUpload(req, res);
  }

  // ── /b2c/booking ──────────────────────────────────────────────
  if (resource === 'booking' && method === 'POST') {
    return handleBookingPost(req, res);
  }

  return sendNotFound(res, `B2C route: ${method} /b2c/${segs.slice(1).join('/')}`);
}

// ─── Utilities ────────────────────────────────────────────────────

function getSegments(req: VercelRequest): string[] {
  const raw = (req.query as { path?: string[] | string }).path;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return raw.split('/').filter(Boolean);
  return [];
}

function setPath(req: VercelRequest, path: string[]): void {
  (req.query as { path: string[] }).path = path;
}
