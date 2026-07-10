import { createClient } from '@supabase/supabase-js';
import type { PortalType, UserContext } from './nexusPrompts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let sbClient: any = null;

function getSb() {
  if (!sbClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    sbClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return sbClient;
}

export async function fetchUserContext(
  userId: string,
  portalType: PortalType
): Promise<Partial<UserContext>> {
  const sb = getSb();

  const baseContext: Partial<UserContext> = {
    portalType,
    name: 'User',
  };

  if (!sb) {
    console.warn('[nexusContext] Supabase not configured, returning base context');
    return baseContext;
  }

  try {
    switch (portalType) {
      case 'client':
        return fetchClientContext(userId, sb, baseContext);
      case 'coaching':
        return fetchCoachingContext(userId, sb, baseContext);
      case 'candidate':
        return fetchCandidateContext(userId, sb, baseContext);
      case 'internal':
        return fetchInternalContext(userId, sb, baseContext);
      default:
        return baseContext;
    }
  } catch (e) {
    console.error('[nexusContext] Error fetching context:', e);
    return baseContext;
  }
}

async function fetchClientContext(
  userId: string,
  sb: any,
  baseContext: Partial<UserContext>
): Promise<Partial<UserContext>> {
  const ctx = { ...baseContext };

  try {
    const { data: profileData } = await sb
      .from('contacts')
      .select('name, title, email, company:companies(name), client_account_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData) {
      ctx.name = profileData.name || ctx.name;
      ctx.title = profileData.title;
      ctx.email = profileData.email;
      ctx.companyName = profileData.company?.name;

      const clientAccountId = profileData.client_account_id;
      if (clientAccountId) {
        const { data: mandates } = await sb
          .from('mandates')
          .select('id, title, status')
          .eq('client_account_id', clientAccountId)
          .eq('status', 'open');

        ctx.activeMandates = (mandates || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          status: m.status,
        }));

        const { count: candidateCount, data: pipelineData } = await sb
          .from('candidates_pipeline')
          .select('id, stage', { count: 'exact' })
          .eq('client_account_id', clientAccountId);

        ctx.totalCandidatesInPipeline = candidateCount ?? 0;

        if (pipelineData) {
          const breakdown: Record<string, number> = {};
          for (const item of pipelineData) {
            const stage = (item as any).stage || 'Unknown';
            breakdown[stage] = (breakdown[stage] || 0) + 1;
          }
          ctx.pipelineStageBreakdown = breakdown;
        }
      }
    }
  } catch (e) {
    console.error('[nexusContext] Client context error:', e);
  }

  return ctx;
}

async function fetchCoachingContext(
  userId: string,
  sb: any,
  baseContext: Partial<UserContext>
): Promise<Partial<UserContext>> {
  const ctx = { ...baseContext };

  try {
    const { data: profileData } = await sb
      .from('profiles')
      .select('name, email, current_role, target_role, tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData) {
      ctx.name = profileData.name || ctx.name;
      ctx.email = profileData.email;
      ctx.currentRole = profileData.current_role;
      ctx.targetRole = profileData.target_role;
    }

    const { data: sessions } = await sb
      .from('coaching_sessions')
      .select('id, status, scheduled_at, title, coach_id')
      .eq('coachee_id', userId)
      .order('scheduled_at', { ascending: false })
      .limit(20);

    const sessionList = sessions || [];
    const completed = sessionList.filter((s: any) => s.status === 'completed');
    const upcoming = sessionList.filter((s: any) =>
      ['scheduled', 'confirmed'].includes(s.status)
    );

    ctx.coachingSessions = {
      total: sessionList.length,
      completed: completed.length,
      upcoming: upcoming.length,
    };

    const firstSession = sessionList.find((s: any) => s.coach_id);
    if (firstSession?.coach_id) {
      const { data: coachData } = await sb
        .from('profiles')
        .select('name')
        .eq('user_id', firstSession.coach_id)
        .maybeSingle();
      ctx.coachName = coachData?.name;
    }

    const { data: assessments } = await sb
      .from('assessments')
      .select('id, assessment_title, score, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (assessments && assessments.length > 0) {
      const latest = assessments[0] as any;
      ctx.latestAssessment = {
        title: latest.assessment_title || 'Assessment',
        score: latest.score || 0,
        completedAt: latest.completed_at?.split('T')[0] || 'Recent',
      };
    }

    const totalCompleted = completed.length;
    if (totalCompleted >= 8) {
      ctx.growthPlanStatus = 'Advanced';
    } else if (totalCompleted >= 3) {
      ctx.growthPlanStatus = 'In progress';
    } else {
      ctx.growthPlanStatus = 'Getting started';
    }
  } catch (e) {
    console.error('[nexusContext] Coaching context error:', e);
  }

  return ctx;
}

async function fetchCandidateContext(
  userId: string,
  sb: any,
  baseContext: Partial<UserContext>
): Promise<Partial<UserContext>> {
  const ctx = { ...baseContext };

  try {
    const { data: candidateData } = await sb
      .from('contacts')
      .select('id, name, title, email, location, current_company, headline')
      .eq('user_id', userId)
      .maybeSingle();

    if (candidateData) {
      ctx.name = candidateData.name || ctx.name;
      ctx.email = candidateData.email;
      ctx.currentRole = candidateData.title;

      let completeness = 0;
      if (candidateData.name) completeness += 20;
      if (candidateData.title) completeness += 20;
      if (candidateData.email) completeness += 15;
      if (candidateData.location) completeness += 15;
      if (candidateData.headline) completeness += 15;
      if (candidateData.current_company) completeness += 15;
      ctx.profileCompleteness = Math.min(100, completeness);
    }

    const candidateId = candidateData?.id;
    if (candidateId) {
      const { count: applicationCount } = await sb
        .from('candidates_pipeline')
        .select('id', { count: 'exact' })
        .eq('contact_id', candidateId);
      ctx.activeApplications = applicationCount ?? 0;

      const { data: assessments } = await sb
        .from('assessments')
        .select('id, status')
        .eq('contact_id', candidateId);

      const totalAssessments = assessments?.length || 0;
      const completed = assessments?.filter((a: any) => a.status === 'completed').length || 0;
      if (totalAssessments === 0) {
        ctx.assessmentStatus = 'Not started';
      } else if (completed === totalAssessments) {
        ctx.assessmentStatus = 'All completed';
      } else {
        ctx.assessmentStatus = `${completed}/${totalAssessments} completed`;
      }

      const { data: events } = await sb
        .from('events')
        .select('id, title, scheduled_at, type, location')
        .eq('contact_id', candidateId)
        .eq('type', 'interview')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      ctx.upcomingInterviews = (events || []).map((e: any) => ({
        id: e.id,
        company: e.location || 'Client',
        role: e.title,
        date: new Date(e.scheduled_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));
    }
  } catch (e) {
    console.error('[nexusContext] Candidate context error:', e);
  }

  return ctx;
}

async function fetchInternalContext(
  userId: string,
  sb: any,
  baseContext: Partial<UserContext>
): Promise<Partial<UserContext>> {
  const ctx = { ...baseContext };

  try {
    const { data: profileData } = await sb
      .from('profiles')
      .select('name, email, role, team')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData) {
      ctx.name = profileData.name || ctx.name;
      ctx.email = profileData.email;
      ctx.role = profileData.role;
      ctx.team = profileData.team;
    }

    // Mark as admin for prompt routing
    ctx.isAdmin = profileData?.role === 'admin';

    // Inject mandate summary for internal users
    try {
      const { data: mandates } = await sb
        .from('mandates')
        .select('id, position_title, org_id, status, organizations(name)')
        .in('status', ['kick_off', 'sourcing', 'screening', 'shortlist', 'interview', 'offer'])
        .order('updated_at', { ascending: false })
        .limit(20);

      if (mandates && mandates.length > 0) {
        const summary = mandates.slice(0, 10).map((m: any) => {
          const client = m.organizations?.name || 'Unknown Client';
          return `${m.position_title} @ ${client} (${m.status})`;
        }).join('; ');
        ctx.activeMandatesSummary = `${mandates.length} active: ${summary}`;
      } else {
        ctx.activeMandatesSummary = 'No active mandates currently';
      }
    } catch (e) {
      ctx.activeMandatesSummary = 'Mandate data unavailable';
    }
  } catch (e) {
    console.error('[nexusContext] Internal context error:', e);
  }

  return ctx;
}

export async function determinePortalType(userId: string, sb?: any): Promise<PortalType> {
  const client = sb || getSb();
  if (!client) return 'candidate';

  try {
    const { data: profileData } = await client
      .from('profiles')
      .select('role, is_coachee')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileData?.role === 'admin' || profileData?.role === 'consultant') {
      return 'internal';
    }
    if (profileData?.is_coachee) {
      return 'coaching';
    }

    const { data: contactData } = await client
      .from('contacts')
      .select('client_account_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (contactData?.client_account_id) {
      return 'client';
    }
  } catch (e) {
    console.error('[nexusContext] determinePortalType error:', e);
  }

  return 'candidate';
}
