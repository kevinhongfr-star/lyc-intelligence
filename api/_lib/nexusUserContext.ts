/**
 * api/_lib/nexusUserContext.ts — S7-T03 (N3)
 *
 * User Context Assembly + Tier Gating for the Nexus conversation engine.
 *
 * Spec (TRAEE_NEXT_SPRINTS.md — S7-T03):
 *   - Assemble user context before each response:
 *     - Profile data (role, industry, seniority)
 *     - Active mandates / applications
 *     - Credit balance + tier
 *     - Past conversation summaries
 *   - Tier gating:
 *     - Executive Introduction: basic responses, no deep analysis
 *     - Credit user: full responses, market intelligence
 *     - Council member: premium responses, peer matching, event access
 *
 * Design:
 *   - All fetches run in parallel (Promise.allSettled) with tight timeouts.
 *   - Fail-open: any failed fetch is skipped, partial context is still assembled.
 *   - Non-blocking: never throws — returns a default context on error.
 *
 * Tier resolution priority (highest wins):
 *   1. Stripe subscription status (active council/pro subscription)
 *   2. Profile tier column (if present)
 *   3. Credits table tier column
 *   4. Request body tier param (fallback)
 *   5. 'free' (ultimate fallback)
 */

import { selectOne, selectMany, isSupabaseConfigured } from './supabaseRest.js';

// ── Types ──

export interface UserContext {
  userId: string;
  email: string;
  role: string;
  tier: string;
  seniority: string;
  // Profile data
  fullName: string | null;
  department: string | null;
  clientOrganization: string | null;
  phone: string | null;
  // Credit data
  creditBalance: number | null;
  dailyCreditBalance: number | null;
  // Active mandates / applications
  activeApplications: ActiveApplication[];
  activeMandateCount: number;
  // Past conversation summaries
  recentConversationCount: number;
  lastConversationAt: string | null;
  // Stripe subscription
  stripeSubscriptionStatus: string | null;
  // Assembly metadata
  assembledAt: number;
  fetchErrors: string[];
}

export interface ActiveApplication {
  mandateTitle: string | null;
  stage: string;
  matchScore: number | null;
  updatedAt: string | null;
}

// ── Tier resolution ──

/**
 * Resolve the effective user tier from multiple sources.
 * Priority: stripe subscription > profile.tier > credits.tier > fallback.
 *
 * Council/Enterprise tiers unlock premium features (peer matching, events).
 * Pro/Member/Basic tiers unlock full advisory depth.
 * Free/Intro tiers get basic responses only.
 */
export function resolveTier(params: {
  profileTier?: string | null;
  creditTier?: string | null;
  stripeStatus?: string | null;
  stripeTier?: string | null;
  bodyTier?: string;
}): string {
  const { profileTier, creditTier, stripeStatus, stripeTier, bodyTier } = params;

  // Active Stripe subscription is the strongest signal.
  if (stripeStatus === 'active' && stripeTier) {
    const t = stripeTier.toLowerCase();
    if (t === 'council' || t === 'enterprise') return 'council';
    if (t === 'pro' || t === 'member') return 'pro';
    if (t === 'basic') return 'basic';
  }

  // Profile tier column (set by /api/stripe/update-tier webhook).
  if (profileTier) {
    const t = profileTier.toLowerCase();
    if (['council', 'enterprise', 'pro', 'member', 'basic', 'free', 'intro'].includes(t)) {
      return t === 'enterprise' ? 'council' : t;
    }
  }

  // Credits table tier.
  if (creditTier) {
    const t = creditTier.toLowerCase();
    if (['council', 'enterprise', 'pro', 'member', 'basic', 'free', 'intro'].includes(t)) {
      return t === 'enterprise' ? 'council' : t;
    }
  }

  // Body fallback.
  return (bodyTier || 'free').toLowerCase();
}

/**
 * Map a resolved tier to a depth bucket used by the intent router.
 *   - 'basic': Executive Introduction — high-level guidance only
 *   - 'full':  Credit user — full advisory + market intelligence
 *   - 'premium': Council member — peer matching, events, bespoke frameworks
 */
export function tierDepth(tier: string): 'basic' | 'full' | 'premium' {
  const t = (tier || 'free').toLowerCase();
  if (t === 'council' || t === 'enterprise') return 'premium';
  if (t === 'pro' || t === 'member' || t === 'basic') return 'full';
  return 'basic'; // free / intro
}

// ── Individual context fetchers (all non-blocking) ──

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  department: string | null;
  client_organization: string | null;
  phone: string | null;
  tier: string | null;
  icp: string | null;
  stripe_subscription_status: string | null;
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const row = await selectOne(
      'profiles',
      {
        column: 'id',
        value: userId,
        select: 'id,email,full_name,role,department,client_organization,phone,tier,icp,stripe_subscription_status',
      },
      4000,
    );
    return (row as ProfileRow) || null;
  } catch (e) {
    console.warn('[nexusUserContext] fetchProfile failed (non-blocking):', e);
    return null;
  }
}

interface CreditRow {
  balance: number;
  daily_balance: number;
  tier: string | null;
}

async function fetchCredits(userId: string): Promise<CreditRow | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const row = await selectOne(
      'credits',
      {
        column: 'user_id',
        value: userId,
        select: 'balance,daily_balance,tier',
      },
      4000,
    );
    return (row as CreditRow) || null;
  } catch (e) {
    console.warn('[nexusUserContext] fetchCredits failed (non-blocking):', e);
    return null;
  }
}

/**
 * Fetch active candidate applications by matching the user's email to
 * contacts.email → candidates_pipeline.
 *
 * Only active stages are returned (excludes HIRED, REJECTED, WITHDRAWN).
 */
async function fetchActiveApplications(email: string): Promise<ActiveApplication[]> {
  if (!isSupabaseConfigured() || !email) return [];
  try {
    // Step 1: find the contact record matching this email.
    const contact = await selectOne(
      'contacts',
      {
        column: 'email',
        value: email,
        select: 'id',
      },
      3000,
    );
    if (!contact || !contact.id) return [];

    // Step 2: fetch recent pipeline rows for this contact (all stages).
    // We filter out terminal stages client-side because Supabase REST has no
    // native "not in" operator.
    const rows = await selectMany(
      'candidates_pipeline',
      {
        select: 'mandate_id,stage,match_score,updated_at',
        where: [{ column: 'contact_id', value: contact.id }],
        orderBy: { column: 'updated_at', ascending: false },
        limit: 20,
      },
      4000,
    );

    // Exclude terminal stages — only active applications are relevant context.
    const TERMINAL = new Set(['HIRED', 'REJECTED', 'WITHDRAWN']);
    const active = (rows || []).filter((r: any) => !TERMINAL.has(String(r.stage || '').toUpperCase()));

    if (active.length === 0) return [];

    // Step 3: fetch mandate titles for the active applications (best-effort).
    const mandateIds = active.map((r: any) => r.mandate_id).filter(Boolean);
    const titles = new Map<string, string | null>();
    if (mandateIds.length > 0) {
      try {
        const mandateRows = await selectMany(
          'mandates',
          {
            select: 'id,title',
            where: [{ column: 'id', value: mandateIds, op: 'in' }],
            limit: 10,
          },
          3000,
        );
        for (const m of mandateRows || []) {
          titles.set(m.id, m.title || null);
        }
      } catch (e) {
        // Titles are nice-to-have; continue without them.
      }
    }

    return active.map((r: any) => ({
      mandateTitle: titles.get(r.mandate_id) || null,
      stage: String(r.stage || 'UNKNOWN'),
      matchScore: r.match_score != null ? Number(r.match_score) : null,
      updatedAt: r.updated_at || null,
    }));
  } catch (e) {
    console.warn('[nexusUserContext] fetchActiveApplications failed (non-blocking):', e);
    return [];
  }
}

/**
 * Fetch a lightweight summary of past conversations (count + last activity).
 * Uses nexus_conversations table — does NOT retrieve full memory (that's S7-T02's
 * retrieveRelevantMemories). This gives Nexus a sense of how much history exists.
 */
async function fetchConversationHistory(userId: string): Promise<{
  count: number;
  lastAt: string | null;
}> {
  if (!isSupabaseConfigured() || !userId) return { count: 0, lastAt: null };
  try {
    const rows = await selectMany(
      'nexus_conversations',
      {
        select: 'id,updated_at',
        where: [{ column: 'user_id', value: userId }],
        orderBy: { column: 'updated_at', ascending: false },
        limit: 100,
      },
      4000,
    );
    const list = rows || [];
    return {
      count: list.length,
      lastAt: list.length > 0 ? (list[0] as any).updated_at || null : null,
    };
  } catch (e) {
    console.warn('[nexusUserContext] fetchConversationHistory failed (non-blocking):', e);
    return { count: 0, lastAt: null };
  }
}

// ── Seniority detection (mirrors nexusChatHandler for consistency) ──

type SeniorityLevel = 'c_suite' | 'vp' | 'director' | 'manager' | 'individual';

export function detectSeniority(profile?: { title?: string } | null): SeniorityLevel {
  if (!profile?.title) return 'director';
  const title = profile.title.toLowerCase();
  if (/ceo|cfo|coo|cto|cio|cmo|president|chief|managing director|md/i.test(title)) return 'c_suite';
  if (/vp|vice president|vice-president|head of|director general/i.test(title)) return 'vp';
  if (/director|senior director|executive director/i.test(title)) return 'director';
  if (/manager|senior manager|lead|team lead|supervisor/i.test(title)) return 'manager';
  return 'individual';
}

// ── Main assembly function ──

/**
 * Assemble the full user context for a Nexus conversation turn.
 *
 * Runs all fetches in parallel, tolerates partial failures, and returns a
 * structured UserContext plus a pre-formatted string for Layer 2 of the
 * system prompt.
 *
 * @param params.userId  - authenticated user id (from JWT)
 * @param params.email   - authenticated user email
 * @param params.role    - authenticated user role
 * @param params.bodyTier - tier passed in the request body (fallback)
 * @param params.profile  - lightweight profile passed in the request body
 *                          (title, company) — used for seniority detection
 */
export async function assembleUserContext(params: {
  userId?: string;
  email?: string;
  role?: string;
  bodyTier?: string;
  profile?: { title?: string; company?: string } | null;
}): Promise<{ context: UserContext; promptString: string }> {
  const { userId, email, role, bodyTier, profile } = params;
  const fetchErrors: string[] = [];

  // Anonymous / prospect user — return minimal context.
  if (!userId) {
    const seniority = detectSeniority(profile);
    const tier = (bodyTier || 'free').toLowerCase();
    const ctx: UserContext = {
      userId: '',
      email: email || '',
      role: role || 'anonymous',
      tier,
      seniority,
      fullName: null,
      department: null,
      clientOrganization: profile?.company || null,
      phone: null,
      creditBalance: null,
      dailyCreditBalance: null,
      activeApplications: [],
      activeMandateCount: 0,
      recentConversationCount: 0,
      lastConversationAt: null,
      stripeSubscriptionStatus: null,
      assembledAt: Date.now(),
      fetchErrors,
    };
    return { context: ctx, promptString: formatAnonymousContext(ctx) };
  }

  // ── Parallel fetches (all non-blocking) ──
  const [profileResult, creditResult, appsResult, historyResult] = await Promise.allSettled([
    fetchProfile(userId),
    fetchCredits(userId),
    fetchActiveApplications(email || ''),
    fetchConversationHistory(userId),
  ]);

  const profileRow = profileResult.status === 'fulfilled' ? profileResult.value : null;
  if (profileResult.status === 'rejected') fetchErrors.push('profile');

  const creditRow = creditResult.status === 'fulfilled' ? creditResult.value : null;
  if (creditResult.status === 'rejected') fetchErrors.push('credits');

  const applications = appsResult.status === 'fulfilled' ? appsResult.value : [];
  if (appsResult.status === 'rejected') fetchErrors.push('applications');

  const history = historyResult.status === 'fulfilled' ? historyResult.value : { count: 0, lastAt: null };
  if (historyResult.status === 'rejected') fetchErrors.push('history');

  // ── Resolve tier ──
  const tier = resolveTier({
    profileTier: profileRow?.tier || null,
    creditTier: creditRow?.tier || null,
    stripeStatus: profileRow?.stripe_subscription_status || null,
    stripeTier: profileRow?.tier || null,
    bodyTier,
  });

  // ── Detect seniority ──
  const seniority = detectSeniority({ title: profile?.title });

  // ── Assemble structured context ──
  const ctx: UserContext = {
    userId,
    email: profileRow?.email || email || '',
    role: profileRow?.role || role || 'member',
    tier,
    seniority,
    fullName: profileRow?.full_name || null,
    department: profileRow?.department || null,
    clientOrganization: profileRow?.client_organization || profile?.company || null,
    phone: profileRow?.phone || null,
    creditBalance: creditRow ? Number(creditRow.balance) : null,
    dailyCreditBalance: creditRow ? Number(creditRow.daily_balance) : null,
    activeApplications: applications,
    activeMandateCount: applications.length,
    recentConversationCount: history.count,
    lastConversationAt: history.lastAt,
    stripeSubscriptionStatus: profileRow?.stripe_subscription_status || null,
    assembledAt: Date.now(),
    fetchErrors,
  };

  return { context: ctx, promptString: formatUserContext(ctx) };
}

// ── Formatting (Layer 2 of the 5-layer system prompt) ──

function formatUserContext(ctx: UserContext): string {
  const lines: string[] = [];

  lines.push('## Authenticated User Profile');
  lines.push(`- Email: ${ctx.email || '(unknown)'}`);
  lines.push(`- Role: ${ctx.role}`);
  if (ctx.fullName) lines.push(`- Name: ${ctx.fullName}`);
  if (ctx.clientOrganization) lines.push(`- Organization: ${ctx.clientOrganization}`);
  if (ctx.department) lines.push(`- Department: ${ctx.department}`);
  lines.push(`- Seniority: ${ctx.seniority}`);

  lines.push('');
  lines.push('## Subscription & Credits');
  lines.push(`- Tier: ${ctx.tier} (depth: ${tierDepth(ctx.tier)})`);
  if (ctx.stripeSubscriptionStatus) {
    lines.push(`- Stripe subscription: ${ctx.stripeSubscriptionStatus}`);
  }
  if (ctx.creditBalance !== null) {
    lines.push(`- Credit balance: ${ctx.creditBalance}`);
  }
  if (ctx.dailyCreditBalance !== null) {
    lines.push(`- Daily credits: ${ctx.dailyCreditBalance}`);
  }

  // Active applications / mandates
  lines.push('');
  lines.push('## Active Mandates & Applications');
  if (ctx.activeMandateCount === 0) {
    lines.push('- No active applications on file.');
  } else {
    lines.push(`- ${ctx.activeMandateCount} active application(s):`);
    for (const app of ctx.activeApplications.slice(0, 5)) {
      const title = app.mandateTitle || 'Untitled mandate';
      const score = app.matchScore != null ? ` (match: ${app.matchScore}%)` : '';
      lines.push(`  • ${title} — stage: ${app.stage}${score}`);
    }
  }

  // Conversation history
  lines.push('');
  lines.push('## Conversation History');
  if (ctx.recentConversationCount === 0) {
    lines.push('- This is the user\'s first Nexus conversation.');
  } else {
    lines.push(`- ${ctx.recentConversationCount} prior conversation(s) on record.`);
    if (ctx.lastConversationAt) {
      lines.push(`- Last active: ${ctx.lastConversationAt}`);
    }
  }

  return lines.join('\n');
}

function formatAnonymousContext(ctx: UserContext): string {
  return [
    '## Anonymous / Prospect User',
    `- Tier: ${ctx.tier} (depth: ${tierDepth(ctx.tier)})`,
    `- Seniority: ${ctx.seniority}`,
    ctx.clientOrganization ? `- Company: ${ctx.clientOrganization}` : '',
    '',
    'No authenticated profile, credit balance, or mandate data available.',
    'Treat as a first-time visitor. Surface sign-up / Executive Introduction after delivering value.',
  ]
    .filter(Boolean)
    .join('\n');
}
