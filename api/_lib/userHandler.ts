/**
 * api/_lib/userHandler.ts — Self-service user data endpoints (GDPR / PIPL)
 *
 * Routes (dispatched via /api/user/*):
 *   GET  /api/user/data-export   → export the authenticated user's personal data
 *   POST /api/user/delete        → initiate account deletion (soft delete → 30-day hard delete)
 *
 * Auth: handled by dispatch.ts (getUserFromRequest). The verified user is
 * attached to req.__authenticatedUser as { id, email, role }.
 *
 * Each data section is fetched defensively (try/catch) so a missing or
 * RLS-blocked table never aborts the whole export — the section simply
 * returns null with an error note.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectOne, selectMany, update } from './supabaseRest.js';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

const HARD_DELETE_DELAY_DAYS = 30;

export async function handler(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).__authenticatedUser as AuthenticatedUser | undefined;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const method = req.method || 'GET';
  const path = (req.query.path as string[] | string) || [];
  const action = Array.isArray(path) ? path[0] : String(path || '');

  if (method === 'GET' && action === 'data-export') {
    return handleDataExport(req, res, user);
  }

  if (method === 'POST' && action === 'delete') {
    return handleAccountDeletion(req, res, user);
  }

  return res.status(404).json({ success: false, error: `Unknown user action: ${method} ${action}` });
}

// ── GET /api/user/data-export ──
async function handleDataExport(
  _req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser,
) {
  const exportedAt = new Date().toISOString();

  const [profile, assessments, conversations, credits, creditTransactions, bookings, contact] = await Promise.all([
    fetchSection('profile', () =>
      selectOne('profiles', { column: 'id', value: user.id, select: '*' }),
    ),
    fetchSection('assessments', () =>
      selectMany('assessments', {
        select: '*',
        or: `user_id.eq.${user.id},email.eq.${encodeURIComponent(user.email)}`,
        orderBy: { column: 'created_at', ascending: false },
        limit: 200,
      }),
    ),
    fetchSection('nexus_conversations', () =>
      selectMany('nexus_conversations', {
        select: 'id,title,created_at,updated_at,messages',
        where: [{ column: 'user_id', value: user.id }],
        orderBy: { column: 'created_at', ascending: false },
        limit: 100,
      }),
    ),
    fetchSection('credits', () =>
      // Canonical ledger (single `credits` table, tier-discriminated).
      // Replaces the legacy `dex_credits` reference so the GDPR export
      // returns the user's actual balance + transaction history.
      selectOne('credits', {
        column: 'user_id',
        value: user.id,
        select: 'id,balance,daily_balance,total_earned,total_spent,tier,created_at,updated_at',
      }),
    ),
    fetchSection('credit_transactions', () =>
      selectMany('credit_transactions', {
        select: 'id,amount,transaction_type,description,reference_id,created_at',
        where: [{ column: 'user_id', value: user.id }],
        orderBy: { column: 'created_at', ascending: false },
        limit: 500,
      }),
    ),
    fetchSection('coaching_sessions', () =>
      selectMany('coaching_sessions', {
        select: 'id,consultant_id,scheduled_at,status,notes,created_at',
        where: [{ column: 'user_id', value: user.id }],
        orderBy: { column: 'scheduled_at', ascending: false },
        limit: 100,
      }),
    ),
    fetchSection('contact', () =>
      selectOne('contacts', { column: 'email', value: user.email, select: 'id,name,email,phone,location,title,company,created_at' }),
    ),
  ]);

  return res.status(200).json({
    success: true,
    exported_at: exportedAt,
    user: { id: user.id, email: user.email, role: user.role },
    data: {
      profile: profile.data,
      contact: contact.data,
      assessments: assessments.data,
      nexus_conversations: conversations.data,
      credits: credits.data,
      credit_transactions: creditTransactions.data,
      coaching_sessions: bookings.data,
    },
    errors: collectErrors([
      profile, assessments, conversations, credits, creditTransactions, bookings, contact,
    ]),
  });
}

// ── POST /api/user/delete — soft delete, schedule hard delete ──
async function handleAccountDeletion(
  _req: VercelRequest,
  res: VercelResponse,
  user: AuthenticatedUser,
) {
  const now = new Date();
  const hardDeleteAt = new Date(now.getTime() + HARD_DELETE_DELAY_DAYS * 24 * 60 * 60 * 1000);

  try {
    // Soft delete: mark profile, schedule hard delete, withdraw active consents.
    await update(
      'profiles',
      {
        status: 'deleted',
        deleted_at: now.toISOString(),
        scheduled_hard_delete_at: hardDeleteAt.toISOString(),
        updated_at: now.toISOString(),
        // Clear direct contact PII retained on the profile row itself.
        phone: '[deleted]',
      },
      user.id,
    );

    // Best-effort: withdraw any active data consents for this subject.
    try {
      await update(
        'data_consents',
        {
          consent_given: false,
          withdrawn_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        user.id,
        'data_subject_id',
      );
    } catch {
      /* consents table may not have a matching row — ignore */
    }

    return res.status(200).json({
      success: true,
      message: `Account scheduled for deletion. Personal data will be permanently removed on ${hardDeleteAt.toISOString().slice(0, 10)}. You may contact privacy@lyc-intelligence.app to cancel within 30 days.`,
      scheduled_hard_delete_at: hardDeleteAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[userHandler/delete]', err);
    return res.status(500).json({
      success: false,
      error: `Could not complete deletion request: ${err?.message || 'unknown error'}`,
    });
  }
}

// ── helpers ──
async function fetchSection<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ name: string; data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { name, data, error: null };
  } catch (err: any) {
    return { name, data: null, error: err?.message || 'fetch failed' };
  }
}

function collectErrors(
  sections: Array<{ name: string; error: string | null }>,
): Array<{ section: string; error: string }> {
  return sections
    .filter((s) => s.error !== null)
    .map((s) => ({ section: s.name, error: s.error! }));
}
