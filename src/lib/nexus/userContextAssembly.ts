/**
 * N3: User Context Assembly
 * Aggregates 8 fetchers into a context (Consultant/client/candidate profile, org data,
 * recent mandates, assessment credits scope, RAG libraries → system_prefix prompt prefix.
 * Parallel Promise.all via supabase (RLS org + user context).
 */

import { supabase } from '@/lib/supabase/client';

export interface UserContext {
  identity: {
    userId: string;
    fullName?: string;
    email?: string;
    role: string;
    icp?: string;
    avatarUrl?: string;
    tier: 'free' | 'core' | 'premium' | 'staff';
  };
  organization?: {
    orgId: string;
    name?: string;
    industry?: string;
    tier?: string;
    customDomain?: string;
  };
  mandateContext: string[];
  recentActivitySummary: string[];
  candidateTouchSummary: string[];
  assessmentsTaken: { instrument: string; score?: number; takenAt: string }[];
  credits: { balance: number; burn7d: number; plan: string };
  ragLibraries: string[];
  assembledAt: string;
}

export interface AssemblyOptions {
  maxRecentDays?: number;
  ragLimit?: number;
}

/**
 * Parallel Promise.all 8 fetchers
 */
export async function assembleUserContext(
  userId: string,
  opts: AssemblyOptions = {}
): Promise<UserContext> {
  const days = opts.maxRecentDays ?? 7;
  const ragLimit = opts.ragLimit ?? 3;

  const identityP = fetchIdentity(userId);
  const recentP = fetchRecentActivity(userId, days);
  const mandatesP = fetchOpenMandates(userId);
  const candidatesP = fetchRecentCandidates(userId, days);
  const assessP = fetchAssessments(userId);
  const creditsP = fetchCredits(userId);
  const ragP = fetchRagLibraries(userId, ragLimit);

  const [identity, recent, mandates, candidates, assessments, credits, rag] =
    await Promise.all([identityP, recentP, mandatesP, candidatesP, assessP, creditsP, ragP]);

  return {
    identity: {
      userId,
      fullName: identity.fullName,
      email: identity.email,
      role: identity.role,
      icp: identity.icp,
      avatarUrl: identity.avatarUrl,
      tier: identity.tier,
    },
    organization: identity.orgId
      ? {
          orgId: identity.orgId,
          name: identity.orgName,
          industry: identity.orgIndustry,
          tier: identity.orgTier,
          customDomain: identity.customDomain,
        }
      : undefined,
    mandateContext: mandates,
    recentActivitySummary: recent,
    candidateTouchSummary: candidates,
    assessmentsTaken: assessments,
    credits,
    ragLibraries: rag,
    assembledAt: new Date().toISOString(),
  };
}

async function fetchIdentity(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role, icp, avatar_url, organization_id, org: organizations(name, industry, tier, custom_domain)'
      )
      .eq('id', userId)
      .limit(1)
      .maybeSingle();
    const p = (profile ?? {}) as any;
    const org = Array.isArray(p?.org) ? p.org[0] : p?.org || {};

    const staffRoles = ['admin', 'lyc_admin', 'super_admin', 'consultant', 'team_lead', 'bd_manager'];
    const tier: 'free' | 'core' | 'premium' | 'staff' = staffRoles.includes(p.role || '')
      ? 'staff'
      : org?.tier === 'enterprise'
        ? 'premium'
        : org?.tier === 'core'
          ? 'core'
          : 'free';

    return {
      fullName: p.full_name,
      email: p.email,
      role: p.role || 'member',
      icp: p.icp,
      avatarUrl: p.avatar_url,
      orgId: p.organization_id,
      orgName: org?.name,
      orgIndustry: org?.industry,
      orgTier: org?.tier,
      customDomain: org?.custom_domain,
      tier,
    };
  } catch {
    return { role: 'member', tier: 'free' as const };
  }
}

async function fetchRecentActivity(userId: string, days: number) {
  try {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const { data } = await supabase
      .from('activity_logs')
      .select('type, summary, created_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(8);
    return (data || []).map((a: any) => `${a.type}: ${a.summary}`);
  } catch {
    return [];
  }
}

async function fetchOpenMandates(userId: string) {
  try {
    const { data } = await supabase
      .from('mandates')
      .select('id, title, stage, status, mandate_members(consultant_id)')
      .or(`owner_id.eq.${userId},mandate_members.consultant_id.eq.${userId}`)
      .neq('status', 'closed')
      .limit(5);
    return (data || []).map(
      (m: any) => `#${m.id?.slice?.(-4) ?? m.id} ${m.title} (${m.stage})`
    );
  } catch {
    return [];
  }
}

async function fetchRecentCandidates(userId: string, days: number) {
  try {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const { data } = await supabase
      .from('candidate_notes')
      .select('candidate: candidates(full_name, id)')
      .eq('created_by', userId)
      .gte('created_at', since)
      .limit(5);
    return (data || []).map((c: any) => `${c.candidates?.full_name || 'candidate'} touched`);
  } catch {
    return [];
  }
}

async function fetchAssessments(userId: string) {
  try {
    const { data } = await supabase
      .from('assessment_runs')
      .select('instrument, overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    return (data || []).map((a: any) => ({
      instrument: a.instrument,
      score: a.overall_score,
      takenAt: a.created_at,
    }));
  } catch {
    return [];
  }
}

async function fetchCredits(userId: string) {
  try {
    const { data } = await supabase
      .from('credits_ledger')
      .select('balance, plan, credits_burn7d')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    const d = data as any;
    return {
      balance: d?.balance ?? 0,
      burn7d: d?.credits_burn7d ?? 0,
      plan: d?.plan ?? 'free',
    };
  } catch {
    return { balance: 0, burn7d: 0, plan: 'free' };
  }
}

async function fetchRagLibraries(userId: string, limit: number) {
  try {
    const { data } = await supabase
      .from('knowledge_chunks')
      .select('library, tags')
      .limit(limit);
    const libs = new Set((data || []).map((c: any) => c.library).filter(Boolean));
    return Array.from(libs).slice(0, limit) as string[];
  } catch {
    return [];
  }
}

/**
 * N3: Serialise context prompt prefix for LLM system_prompt
 */
export function contextToPrompt(
  ctx: UserContext,
  tierOverride?: 'free' | 'core' | 'premium' | 'staff'
): string {
  const id = ctx.identity;
  const lines = [
    `User identity: ${id.fullName || 'User'} <${id.email || '—'}> role=${id.role} icp=${id.icp || '—'} tier=${tierOverride || id.tier}`,
  ];
  if (ctx.organization)
    lines.push(
      `Organization: ${ctx.organization.name || '—'} industry=${ctx.organization.industry || '—'}`
    );
  if (ctx.mandateContext.length)
    lines.push(`Open mandates: ${ctx.mandateContext.join('; ')}`);
  if (ctx.recentActivitySummary.length)
    lines.push(
      `Recent activity (7d): ${ctx.recentActivitySummary.join('; ').slice(0, 500)}`
    );
  if (ctx.candidateTouchSummary.length)
    lines.push(`Touched candidates: ${ctx.candidateTouchSummary.join('; ')}`);
  if (ctx.assessmentsTaken.length)
    lines.push(
      `Assessments: ${ctx.assessmentsTaken
        .map((a) => `${a.instrument}${a.score ? `(${a.score})` : ''}`)
        .join(', ')}`
    );
  lines.push(`Credits: ${ctx.credits.balance} plan=${ctx.credits.plan}`);
  if (ctx.ragLibraries.length)
    lines.push(`RAG libraries: ${ctx.ragLibraries.join(', ')}`);
  lines.push(`Assembled ${ctx.assembledAt}`);
  return lines.join('\n');
}

export default {
  assembleUserContext,
  contextToPrompt,
};
