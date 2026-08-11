/**
 * #1325: consultantInviteService.ts
 *
 * Consultant portal premiumization + invite flow.
 *
 * Provides:
 *  1. tierLabels — display-friendly consultant premium tier names (never "free"
 *     word — entry tier = "Starter Seat").
 *  2. Consultant tier capabilities matrix — what each tier unlocks
 *     (invite quota, client seat limit, report templates, GRID/CANVAS access).
 *  3. createInvite() — create a one-time invite link for client_viewer /
 *     client_admin / peer_consultant with quota enforcement.
 *  4. listSentInvites() + getInviteStats() — track, show in portal dashboard
 *     and premium banner.
 *  5. redeemInvite() — client-side lookup + claim (called from signup page,
 *     pre-fills org/role).
 *
 * Safe offline/mock: if supabase fails, returns empty arrays/mock data so
 * the UI never breaks.
 */
import { getSupabase } from './supabaseApi';

// ── Consultant Premium Tiers ──────────────────────────────────────────

export type ConsultantTierKey =
  | 'starter_seat'   // entry: 1-2 client users, basic tools
  | 'pro_seat'       // mid: 5 client seats, full TRIDENT + GRID
  | 'executive_seat' // high: 15 client seats, CANVAS + custom templates
  | 'council_seat';  // top: unlimited + partner rev share

export const CONSULTANT_TIER_ORDER: ConsultantTierKey[] = [
  'starter_seat',
  'pro_seat',
  'executive_seat',
  'council_seat',
];

/** Display metadata — strictly no "free" word. */
export const CONSULTANT_TIER_META: Record<
  ConsultantTierKey,
  {
    label: string;
    tagline: string;
    accent: string;
    monthlyName: string;
    clientSeatLimit: number;
    inviteQuota: number;          // new invites per month
    features: string[];
  }
> = {
  starter_seat: {
    label: 'Starter Seat',
    tagline: 'Essential tools for independent associates.',
    accent: '#0369A1',
    monthlyName: 'Starter Seat · monthly',
    clientSeatLimit: 2,
    inviteQuota: 3,
    features: [
      'Dashboard · Mandates · Candidates · Pipeline',
      'TRIDENT scoring — up to 10 runs / month',
      'Share candidate reports — viewer-only links',
      '2 client viewer seats',
    ],
  },
  pro_seat: {
    label: 'Pro Seat',
    tagline: 'Full search-delivery toolkit for small practice leads.',
    accent: '#7C3AED',
    monthlyName: 'Pro Seat · monthly',
    clientSeatLimit: 5,
    inviteQuota: 10,
    features: [
      'All Starter Seat features',
      'GRID — client analytics, benchmarking, mandate heatmaps',
      'Unlimited TRIDENT scoring runs',
      'Custom deliverable templates',
      '5 client seats (viewer + admin)',
    ],
  },
  executive_seat: {
    label: 'Executive Seat',
    tagline: 'Firm-level delivery with custom reporting.',
    accent: '#C2410C',
    monthlyName: 'Executive Seat · monthly',
    clientSeatLimit: 15,
    inviteQuota: 25,
    features: [
      'All Pro Seat features',
      'CANVAS — bespoke mandate briefings + interview playbooks',
      'Custom branded report templates (white-label)',
      '15 client seats (any role mix)',
      'Dedicated account success contact',
    ],
  },
  council_seat: {
    label: 'Council Seat',
    tagline: 'Partner-level economics + strategic support.',
    accent: '#C108AB',
    monthlyName: 'Council Seat · annual',
    clientSeatLimit: 999,
    inviteQuota: 999,
    features: [
      'All Executive Seat features',
      'Unlimited client seats + invites',
      'Revenue-share on referred mandates',
      'Quarterly strategy review with LYC Partners',
      'Co-branding + featured profile on LYC Intelligence',
    ],
  },
};

// ── Premium feature → tier requirement gate ───────────────────────────

export const PREMIUM_FEATURE_TIER: Record<
  | 'grid'
  | 'canvas'
  | 'custom_templates'
  | 'batch_scoring'
  | 'client_admin_seats'
  | 'partner_rev_share',
  ConsultantTierKey
> = {
  grid: 'pro_seat',
  canvas: 'executive_seat',
  custom_templates: 'executive_seat',
  batch_scoring: 'pro_seat',
  client_admin_seats: 'pro_seat',
  partner_rev_share: 'council_seat',
};

/**
 * Returns true if `currentTier` unlocks `feature`. Strict tier-order compare.
 */
export function tierUnlocksFeature(
  currentTier: ConsultantTierKey | string | null | undefined,
  feature: keyof typeof PREMIUM_FEATURE_TIER,
): boolean {
  const required = PREMIUM_FEATURE_TIER[feature];
  if (!required) return true;
  const curIdx = CONSULTANT_TIER_ORDER.indexOf(currentTier as ConsultantTierKey);
  const reqIdx = CONSULTANT_TIER_ORDER.indexOf(required);
  if (curIdx === -1) return false;
  return curIdx >= reqIdx;
}

// ── Invite domain types ───────────────────────────────────────────────

export type InviteTargetRole = 'client_viewer' | 'client_admin' | 'lyc_consultant';

export interface InviteRecord {
  id: string;
  code: string;
  issued_by: string;
  email: string;
  name?: string;
  target_role: InviteTargetRole;
  target_organization?: string;
  message?: string;
  tier_hint?: ConsultantTierKey;
  claimed_by?: string;
  claimed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface InviteStats {
  totalIssued: number;
  thisMonth: number;
  claimed: number;
  remainingQuota: number;
  tier: ConsultantTierKey;
}

// ── Helpers ───────────────────────────────────────────────────────────

function normalizeTier(tier: string | null | undefined): ConsultantTierKey {
  if (!tier) return 'starter_seat';
  const t = tier.toLowerCase();
  if (t.includes('council')) return 'council_seat';
  if (t.includes('executive')) return 'executive_seat';
  if (t.includes('pro')) return 'pro_seat';
  return 'starter_seat';
}

function generateInviteCode(len = 10): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const cryptoGlobal = (globalThis as any).crypto;
  if (cryptoGlobal?.getRandomValues) {
    const buf = new Uint8Array(len);
    cryptoGlobal.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += charset[buf[i] % charset.length];
  } else {
    for (let i = 0; i < len; i++) {
      out += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  return out;
}

// ── Quota ─────────────────────────────────────────────────────────────

/** Current month's issued count against the tier's invite quota. */
async function countIssuedThisMonth(
  userId: string,
): Promise<number> {
  try {
    const sb = getSupabase();
    if (!sb) return 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count, error } = await sb
      .from('consultant_invites')
      .select('*', { count: 'exact', head: true })
      .eq('issued_by', userId)
      .gte('created_at', start);
    if (error) {
      console.warn('[consultantInviteService] quota count failed:', error.message);
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Create an invite. Enforces tier-based invite quota per month.
 */
export async function createInvite(opts: {
  issuedBy: string;
  email: string;
  name?: string;
  targetRole: InviteTargetRole;
  targetOrganization?: string;
  message?: string;
  issuerTier?: string;
  ttlDays?: number;
}): Promise<{ ok: boolean; invite?: InviteRecord; error?: string }> {
  const tier = normalizeTier(opts.issuerTier);
  const meta = CONSULTANT_TIER_META[tier];

  // 1. Quota check
  const issuedThisMonth = await countIssuedThisMonth(opts.issuedBy);
  if (issuedThisMonth >= meta.inviteQuota) {
    return {
      ok: false,
      error: `${meta.label} is limited to ${meta.inviteQuota} new invites per month. Upgrade to Pro Seat or Executive Seat to extend your quota.`,
    };
  }

  // 2. Seat-limit check (client_admin / client_viewer roles count against client seat limit)
  if (opts.targetRole === 'client_viewer' || opts.targetRole === 'client_admin') {
    const activeClientCount = await countActiveClientSeats(opts.issuedBy);
    if (activeClientCount >= meta.clientSeatLimit) {
      return {
        ok: false,
        error: `${meta.label} supports ${meta.clientSeatLimit} active client seat${meta.clientSeatLimit === 1 ? '' : 's'}. You're at capacity — upgrade to add more.`,
      };
    }
  }

  // 3. Persist
  try {
    const sb = getSupabase();
    const code = generateInviteCode();
    const now = new Date();
    const expires = new Date(now.getTime() + ((opts.ttlDays || 30) * 86400_000));

    const payload: Partial<InviteRecord> = {
      code,
      issued_by: opts.issuedBy,
      email: opts.email.trim().toLowerCase(),
      name: opts.name,
      target_role: opts.targetRole,
      target_organization: opts.targetOrganization,
      message: opts.message,
      tier_hint: tier,
      expires_at: expires.toISOString(),
      created_at: now.toISOString(),
    };

    if (sb) {
      const { data, error } = await sb
        .from('consultant_invites')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.warn('[consultantInviteService] insert failed:', error.message);
        // Graceful offline fallback
        return {
          ok: true,
          invite: { id: `local_${code}`, ...payload } as InviteRecord,
        };
      }
      return { ok: true, invite: data as InviteRecord };
    }

    // Mock mode (no supabase)
    return {
      ok: true,
      invite: { id: `local_${code}`, ...payload } as InviteRecord,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' };
  }
}

/** Count active (claimed) client seats tied to a consultant's org/client users. */
async function countActiveClientSeats(_issuedBy: string): Promise<number> {
  // Simplified: in a fully-linked schema this would join profiles ← org ← issuedBy.
  // For now use a soft estimate of claimed invites.
  try {
    const sb = getSupabase();
    if (!sb) return 0;
    const { count, error } = await sb
      .from('consultant_invites')
      .select('*', { count: 'exact', head: true })
      .eq('issued_by', _issuedBy)
      .not('claimed_by', 'is', null)
      .in('target_role', ['client_viewer', 'client_admin']);
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Lookup an invite by code. Used by the signup flow to pre-fill role & org.
 */
export async function redeemInvite(
  code: string,
  claimerUserId: string,
): Promise<{ ok: boolean; invite?: InviteRecord; error?: string }> {
  try {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Database unavailable' };
    const { data, error } = await sb
      .from('consultant_invites')
      .select('*')
      .eq('code', code.toUpperCase())
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, error: 'Invite code not found' };
    }
    const invite = data as InviteRecord;
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { ok: false, error: 'Invite expired' };
    }
    if (invite.claimed_by) {
      return { ok: false, error: 'Invite already claimed' };
    }
    // Mark as claimed
    await sb
      .from('consultant_invites')
      .update({
        claimed_by: claimerUserId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', invite.id);
    return { ok: true, invite: { ...invite, claimed_by: claimerUserId } };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' };
  }
}

/** List invites issued by a consultant — shows in dashboard. */
export async function listSentInvites(issuedBy: string): Promise<InviteRecord[]> {
  try {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb
      .from('consultant_invites')
      .select('*')
      .eq('issued_by', issuedBy)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[consultantInviteService] list failed:', error.message);
      return [];
    }
    return (data || []) as InviteRecord[];
  } catch {
    return [];
  }
}

export async function getInviteStats(
  issuedBy: string,
  tier?: string,
): Promise<InviteStats> {
  const tierKey = normalizeTier(tier);
  const meta = CONSULTANT_TIER_META[tierKey];
  const [all, thisMonth] = await Promise.all([
    listSentInvites(issuedBy),
    countIssuedThisMonth(issuedBy),
  ]);
  const claimed = all.filter((i) => !!i.claimed_by).length;
  return {
    totalIssued: all.length,
    thisMonth,
    claimed,
    remainingQuota: Math.max(0, meta.inviteQuota - thisMonth),
    tier: tierKey,
  };
}

/** Build a human-readable shareable invite link that goes to /signup?invite=CODE */
export function buildInviteLink(code: string, baseOrigin?: string): string {
  const origin = baseOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://lyc-intelligence.com');
  return `${origin}/signup?invite=${encodeURIComponent(code.toUpperCase())}`;
}
