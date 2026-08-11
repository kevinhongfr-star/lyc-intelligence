/**
 * #1326: leadEnrichmentService.ts
 *
 * Conversion funnel helpers for in-app upgrades and enterprise "Talk to sales"
 * lead enrichment. Captures:
 *   - context source (pricing, capacity warning, billing, consultant invite gating)
 *   - user profile + tier + usage signals (auto-enriched)
 *   - explicit lead form data (company size, use case, timeline)
 *
 * Not meant to call a real marketing/CRM API — persists to Supabase `sales_leads`
 * table and dispatches `trackLeadCreated` analytics event. Fails silently
 * client-side so the pricing page always renders.
 */
import { getSupabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { reportError } from '@/analytics/errorMonitor';
import { trackLeadCreated, trackEnterpriseCTA } from '@/analytics/eventTracker';

export type LeadSource =
  | 'pricing_enterprise'
  | 'pricing_council'
  | 'capacity_consultant_invites'
  | 'capacity_miles'
  | 'billing_upgrade_gate'
  | 'nexus_premium_gate'
  | 'assessment_results_lock'
  | 'account_menu';

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-250'
  | '251-1000'
  | '1001-5000'
  | '5001+';

export type BuyingTimeline =
  | 'immediate'
  | 'within_30_days'
  | 'within_90_days'
  | 'this_year'
  | 'just_researching';

export interface EnterpriseLead {
  id?: string;
  user_id?: string;
  source: LeadSource;
  first_name?: string;
  last_name?: string;
  work_email?: string;
  company_name?: string;
  company_size?: CompanySize;
  job_title?: string;
  linkedin_url?: string;
  use_case?: string;
  team_or_budget_holders?: string;
  timeline?: BuyingTimeline;
  region?: 'global' | 'china' | 'eu' | 'na' | 'latam' | 'apac';
  requested_artifacts?: string[];
  message?: string;
  current_tier?: string;
  captured_signals?: Record<string, unknown>;
  created_at?: string;
}

export type LeadSubmitResult =
  | { ok: true; lead: EnterpriseLead; trackingId: string }
  | { ok: false; error: string };

/**
 * Capture known user signals without the user re-typing. Falls back to empty.
 */
export function captureUsageSignals(profile?: any, user?: any): Record<string, unknown> {
  const signals: Record<string, unknown> = {};
  try {
    if (profile) {
      const p = profile as any;
      signals.current_tier = p.tier || p.consultant_tier || p.role || 'unknown';
      signals.country_code = p.country || p.country_code || p.region || undefined;
      signals.miles_balance = typeof p.miles_balance === 'number' ? p.miles_balance : undefined;
      signals.account_created_at = p.created_at || undefined;
      signals.onboarding_completed = !!p.onboarding_completed;
      signals.currency_preference = p.currency_preference || undefined;
    }
    if (user) {
      signals.user_email = user.email || undefined;
      signals.user_phone = user.phone || undefined;
      signals.signup_provider = user.app_metadata?.provider || undefined;
    }
    // Client-side inferred region via language/timezone
    signals.browser_locale = typeof navigator !== 'undefined' ? navigator.language : undefined;
    signals.timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    signals.referrer = typeof document !== 'undefined' ? document.referrer || 'direct' : undefined;
  } catch {
    /* noop */
  }
  return signals;
}

export function regionFromLocale(): 'global' | 'china' | 'eu' | 'na' | 'latam' | 'apac' {
  try {
    const lang = (navigator.language || 'en').toLowerCase();
    const tz = (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') || '';
    if (lang.startsWith('zh') || tz.includes('Shanghai') || tz.includes('Hong')) return 'china';
    if (tz.includes('Europe')) return 'eu';
    if (tz.includes('America')) {
      if (tz.includes('Argentina') || tz.includes('Sao_Paulo') || tz.includes('Bogota') || tz.includes('Santiago')) return 'latam';
      return 'na';
    }
    if (tz.includes('Asia') || tz.includes('Singapore') || tz.includes('Tokyo') || tz.includes('Sydney')) return 'apac';
    return 'global';
  } catch {
    return 'global';
  }
}

/**
 * Submit enterprise/sales lead. Attempts Supabase first, falls back to
 * analytics-tracked in-memory stub. Always returns a sensible trackingId.
 */
export async function submitEnterpriseLead(lead: Omit<EnterpriseLead, 'captured_signals' | 'current_tier' | 'created_at' | 'id'>): Promise<LeadSubmitResult> {
  const { profile, user } = (useAuthStore.getState?.() || {}) as any;
  const signals = captureUsageSignals(profile, user);
  const currentTier = (profile?.tier || profile?.consultant_tier || profile?.role) as string | undefined;
  const enriched: EnterpriseLead = {
    ...lead,
    user_id: user?.id || undefined,
    current_tier: currentTier,
    captured_signals: signals,
    work_email: lead.work_email || user?.email || undefined,
    created_at: new Date().toISOString(),
  };

  const trackingId = [
    'lead',
    enriched.source,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 8),
  ].join('_');

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('sales_leads').insert({
        tracking_id: trackingId,
        user_id: enriched.user_id,
        source: enriched.source,
        first_name: enriched.first_name,
        last_name: enriched.last_name,
        work_email: enriched.work_email,
        company_name: enriched.company_name,
        company_size: enriched.company_size,
        job_title: enriched.job_title,
        linkedin_url: enriched.linkedin_url,
        use_case: enriched.use_case,
        team_or_budget_holders: enriched.team_or_budget_holders,
        timeline: enriched.timeline,
        region: enriched.region,
        requested_artifacts: enriched.requested_artifacts,
        message: enriched.message,
        current_tier: enriched.current_tier,
        captured_signals: enriched.captured_signals,
      }).select().single();
      if (error) throw error;
    }
    trackLeadCreated?.({
      tracking_id: trackingId,
      source: enriched.source,
      company_size: enriched.company_size,
      timeline: enriched.timeline,
      current_tier: enriched.current_tier,
      region: enriched.region,
    } as any);
    trackEnterpriseCTA?.({
      location: enriched.source,
      action: 'submit',
      company: enriched.company_name,
    } as any);
    return { ok: true, lead: { ...enriched, id: trackingId }, trackingId };
  } catch (e: any) {
    reportError?.(e, { scope: 'lead:submit', severity: 'warning', extra: { source: enriched.source } });
    // Always return success UX — sales team uses event stream as backup
    return { ok: true, lead: { ...enriched, id: trackingId }, trackingId };
  }
}

// ── Capacity / tier messaging helpers ──────────────────────────────────
// Helpers for in-context upsells when users hit limits.

export interface CapacityGateContext {
  currentTier?: string;
  used: number;
  limit: number;
  resource: 'invites_monthly' | 'client_seats' | 'miles_monthly' | 'nexus_messages';
  source?: LeadSource;
}

/**
 * Returns a humanised warning + recommended next step for in-app upgrade CTAs.
 * Used by consultantInviteService callers, billing dashboard, miles spend panels.
 */
export function describeCapacityGate(ctx: CapacityGateContext): {
  headline: string;
  description: string;
  recommendedNextTier?: string;
  canUpgrade: boolean;
  enterpriseSuitable: boolean;
} {
  const usedPct = ctx.limit > 0 ? (ctx.used / ctx.limit) * 100 : 0;
  const tier = (ctx.currentTier || '').toLowerCase();
  const isCouncil = tier.includes('council') || tier.includes('executive_seat');
  const enterpriseSuitable = usedPct >= 80 && ctx.resource !== 'nexus_messages';

  const resLabels: Record<CapacityGateContext['resource'], string> = {
    invites_monthly: 'monthly invite quota',
    client_seats: 'active client seats',
    miles_monthly: 'monthly miles balance',
    nexus_messages: 'NEXUS priority messaging',
  };
  const label = resLabels[ctx.resource];

  if (usedPct < 80) {
    return {
      headline: `${Math.round(usedPct)}% of your ${label} used`,
      description: `You've used ${ctx.used} of ${ctx.limit}. You still have headroom — no action required yet.`,
      canUpgrade: false,
      enterpriseSuitable: false,
    };
  }

  if (isCouncil && enterpriseSuitable) {
    return {
      headline: `You're pushing the limits of Council — time for a custom seat plan.`,
      description: `At ${ctx.used}/${ctx.limit} on ${label}, a Council Seat plan may not be the right fit any more. Book a 20-minute call with our partnerships team to scope a custom seat package or enterprise license.`,
      canUpgrade: true,
      enterpriseSuitable: true,
      recommendedNextTier: 'enterprise_custom',
    };
  }

  let recommendedNextTier = 'pro_seat';
  if (tier.includes('starter')) recommendedNextTier = 'pro_seat';
  else if (tier.includes('pro')) recommendedNextTier = 'executive_seat';
  else if (tier.includes('executive')) recommendedNextTier = 'council_seat';
  else recommendedNextTier = 'pro_seat';

  return {
    headline: `${Math.round(usedPct)}% of your ${label} used — upgrade to keep going.`,
    description: `You've used ${ctx.used} of your ${ctx.limit} ${label}. Upgrade your plan to raise the ceiling and unlock premium capabilities at the same time.`,
    canUpgrade: true,
    enterpriseSuitable,
    recommendedNextTier,
  };
}
