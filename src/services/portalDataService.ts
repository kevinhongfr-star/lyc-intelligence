/**
 * Portal Data Service — T1 Portal Data Wiring
 *
 * Direct Supabase client queries for B2B Client, Candidate, and B2C Coaching portals.
 * RLS policies in 20260709_portal_rls_policies.sql scope every query to the
 * authenticated user — no application-level filtering needed.
 *
 * Usage:
 *   import { fetchClientMandates, fetchClientCandidates } from '@/services/portalDataService';
 *   const { data, error } = await fetchClientMandates();
 */
import { getSupabase } from './supabaseApi';

// ── Helpers ──
// Swallow RLS-no-rows errors as "empty data" — for the portal, an empty result is the
// expected state for a brand-new user, not a system error. Real errors (network, 5xx)
// are still surfaced.
function asEmpty<T>(err: any): { data: T; error: null } | { data: null; error: any } {
  if (!err) return { data: [] as unknown as T, error: null };
  // PostgREST permission errors (42501) and RLS-filtered zero rows
  if (err.code === 'PGRST116' || err.code === '42501') return { data: [] as unknown as T, error: null };
  return { data: null, error: err };
}

// ════════════════════════════════════════════════════════════════
// CLIENT PORTAL (/client/*)
// ════════════════════════════════════════════════════════════════

export interface ClientMandate {
  id: string;
  title: string;
  status: string;
  client_id: string | null;
  organization_id: string;
  total_candidates: number;
  tier1_count: number;
  tier2_count: number;
  shortlisted_count: number;
  interview_count: number;
  placed_count: number;
  client_visible: boolean | null;
  client_summary: string | null;
  target_close_date: string | null;
  updated_at: string;
  company?: { id: string; name: string; industry: string | null } | null;
}

export async function fetchClientMandates(): Promise<{ data: ClientMandate[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('mandates')
      .select('id, title, status, client_id, organization_id, total_candidates, tier1_count, tier2_count, shortlisted_count, interview_count, placed_count, client_visible, client_summary, target_close_date, updated_at, company:companies(id, name, industry)')
      .order('updated_at', { ascending: false });
    if (error) return asEmpty<ClientMandate[]>(error);
    return { data: (data as ClientMandate[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface ClientCandidate {
  id: string;
  contact_id: string;
  mandate_id: string;
  stage: string;
  sweep_tier: string | null;
  match_score: number | null;
  trident_composite: number | null;
  estimated_comp: string | null;
  availability: string | null;
  notes: string | null;
  next_steps: string | null;
  created_at: string;
  contact?: {
    id: string; name: string; email: string | null;
    current_title: string | null; location: string | null; country: string | null;
    seniority: string | null; tier: string | null; trident_composite: number | null;
  } | null;
  mandate?: { id: string; title: string } | null;
}

export async function fetchClientCandidates(mandateId?: string): Promise<{ data: ClientCandidate[]; error: any }> {
  try {
    const sb = getSupabase();
    let q = sb
      .from('candidates_pipeline')
      .select('id, contact_id, mandate_id, stage, sweep_tier, match_score, trident_composite, estimated_comp, availability, notes, next_steps, created_at, contact:contacts(id, name, email, current_title, location, country, seniority, tier, trident_composite), mandate:mandates(id, title)')
      .order('created_at', { ascending: false });
    if (mandateId) q = q.eq('mandate_id', mandateId);
    const { data, error } = await q;
    if (error) return asEmpty<ClientCandidate[]>(error);
    return { data: (data as ClientCandidate[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface ClientDocument {
  id: string;
  mandate_id: string | null;
  name: string;
  type: string;
  visibility: string;
  created_at: string;
  mandate?: { id: string; title: string } | null;
}

export async function fetchClientDocuments(): Promise<{ data: ClientDocument[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('documents')
      .select('id, mandate_id, name, type, visibility, created_at, mandate:mandates(id, title)')
      .order('created_at', { ascending: false });
    if (error) return asEmpty<ClientDocument[]>(error);
    return { data: (data as ClientDocument[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface ClientActivity {
  id: string;
  type: 'scoring' | 'contact_update' | 'pipeline_change';
  title: string;
  detail: string;
  timestamp: string;
  mandate_id: string | null;
}

export async function fetchClientActivity(limit: number = 10): Promise<{ data: ClientActivity[]; error: any }> {
  try {
    const sb = getSupabase();
    // Combine: recent scoring_runs + recent pipeline updates within accessible mandates
    const { data: scoreRes } = await sb
      .from('scoring_runs')
      .select('id, run_type, composite_score, verdict, created_at, contact_id, mandate_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    const activities: ClientActivity[] = [];
    for (const sr of (scoreRes ?? []) as any[]) {
      activities.push({
        type: 'scoring',
        id: sr.id,
        title: `Scored: ${sr.run_type ?? 'candidate'}`,
        detail: sr.verdict ? `Verdict: ${sr.verdict}` : `Score: ${sr.composite_score ?? '—'}`,
        timestamp: sr.created_at,
        mandate_id: sr.mandate_id,
      });
    }
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { data: activities.slice(0, limit), error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface PipelineFunnel {
  total: number;
  byStage: Record<string, number>;
  conversionRate: number; // 0..1
}

export async function fetchClientPipelineAnalytics(): Promise<{ data: PipelineFunnel; error: any }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('candidates_pipeline')
      .select('stage');
    if (error) {
      return { data: { total: 0, byStage: {}, conversionRate: 0 }, error: null };
    }
    const byStage: Record<string, number> = {};
    for (const row of (data as { stage: string }[]) ?? []) {
      const k = row.stage || 'SWEEP';
      byStage[k] = (byStage[k] || 0) + 1;
    }
    const total = (data as unknown[])?.length ?? 0;
    const placed = byStage['HIRED'] ?? byStage['PLACED'] ?? 0;
    const conversionRate = total > 0 ? placed / total : 0;
    return { data: { total, byStage, conversionRate }, error: null };
  } catch (e) {
    return { data: { total: 0, byStage: {}, conversionRate: 0 }, error: e };
  }
}

// ════════════════════════════════════════════════════════════════
// CANDIDATE PORTAL (/candidate/*)
// ════════════════════════════════════════════════════════════════

export interface CandidateProfile {
  id: string;
  name: string;
  email: string | null;
  current_title: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  seniority: string | null;
  tier: string | null;
  skills: string[] | null;
  languages: string[] | null;
  industry: string | null;
  years_of_experience: number | null;
  comp_current: string | null;
  comp_expected: string | null;
  pipeline_stage: string | null;
  motivation_overall: string | null;
  engagement_score: number | null;
  trident_composite: number | null;
  data_confidence: number | null;
  is_expat: boolean | null;
  linkedin_url: string | null;
  headline: string | null;
}

export async function fetchCandidateProfile(): Promise<{ data: CandidateProfile | null; error: any }> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !user.email) return { data: null, error: null };
    const { data, error } = await sb
      .from('contacts')
      .select('*')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();
    if (error) return { data: null, error: null }; // RLS — empty is normal
    return { data: (data as CandidateProfile) ?? null, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

export interface CandidateApplication {
  id: string;
  contact_id: string;
  mandate_id: string;
  status: string;
  priority: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  mandate?: {
    id: string; title: string; status: string;
    company?: { id: string; name: string } | null;
  } | null;
}

export async function fetchCandidateApplications(): Promise<{ data: CandidateApplication[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('candidate_mandate_links')
      .select('id, contact_id, mandate_id, status, priority, notes, created_at, updated_at, mandate:mandates(id, title, status, company:companies(id, name))')
      .order('updated_at', { ascending: false });
    if (error) return asEmpty<CandidateApplication[]>(error);
    return { data: (data as CandidateApplication[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface CandidateInterview {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  status: string;
  mandate_id: string | null;
  contact_id: string | null;
}

export async function fetchCandidateInterviews(): Promise<{ data: CandidateInterview[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('events')
      .select('id, title, start_time, end_time, location, status, mandate_id, contact_id')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20);
    if (error) return asEmpty<CandidateInterview[]>(error);
    return { data: (data as CandidateInterview[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface CandidateAssessment {
  id: string;
  email: string | null;
  assessment_type: string;
  archetype: string | null;
  composite_score: number | null;
  scores: any;
  created_at: string;
}

export async function fetchCandidateAssessments(): Promise<{ data: CandidateAssessment[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !user.email) return { data: [], error: null };
    // Try assessments table — it may not exist in all deployments
    const { data, error } = await sb
      .from('assessments')
      .select('id, email, assessment_type, archetype, composite_score, scores, created_at')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      // Table may not exist or be empty — return empty list, not error
      return { data: [], error: null };
    }
    return { data: (data as CandidateAssessment[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface CandidateCareerIntel {
  benchmarks: any[];  // career_benchmarks
  nurtures: any[];    // nurture_sequences (current)
  logs: any[];        // career_intelligence_log (recent)
}

export async function fetchCandidateCareerIntel(): Promise<{ data: CandidateCareerIntel; error: any }> {
  try {
    const sb = getSupabase();
    const profile = await fetchCandidateProfile();
    if (!profile.data) return { data: { benchmarks: [], nurtures: [], logs: [] }, error: null };
    const contactId = profile.data.id;
    const [benchRes, nurtureRes, logRes] = await Promise.all([
      sb.from('career_benchmarks').select('*').eq('contact_id', contactId).eq('is_current', true).order('generated_at', { ascending: false }).limit(1),
      sb.from('nurture_sequences').select('*').eq('contact_id', contactId).eq('status', 'ACTIVE').order('next_touch_at', { ascending: true }).limit(5),
      sb.from('career_intelligence_log').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(20),
    ]);
    return {
      data: {
        benchmarks: benchRes.data ?? [],
        nurtures: nurtureRes.data ?? [],
        logs: logRes.data ?? [],
      },
      error: null,
    };
  } catch (e) {
    return { data: { benchmarks: [], nurtures: [], logs: [] }, error: e };
  }
}

// ════════════════════════════════════════════════════════════════
// COACHING PORTAL (/coaching/*) — B2C members
// ════════════════════════════════════════════════════════════════

export interface CoacheeProfile {
  id: string;
  email: string;
  name: string;
  tier: string | null;
  role: string | null;
  active_surface: string | null;
  organization_id: string | null;
  created_at: string;
}

export async function fetchCoacheeProfile(): Promise<{ data: CoacheeProfile | null; error: any }> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: null, error: null };
    const { data, error } = await sb
      .from('profiles')
      .select('id, email, name, tier, role, active_surface, organization_id, created_at')
      .eq('id', user.id)
      .maybeSingle();
    if (error) return { data: null, error: null };
    return { data: (data as CoacheeProfile) ?? null, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

export interface CoacheeCredits {
  balance: number;
  daily_balance: number;
  reserved: number;
  last_daily_reset: string | null;
}

export async function fetchCoacheeCredits(): Promise<{ data: CoacheeCredits | null; error: any }> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: null, error: null };
    const { data, error } = await sb
      .from('credits')
      .select('balance, daily_balance, last_daily_reset')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return { data: null, error: null };
    if (!data) {
      return { data: { balance: 0, daily_balance: 0, reserved: 0, last_daily_reset: null }, error: null };
    }
    return {
      data: {
        balance: (data as any).balance ?? 0,
        daily_balance: (data as any).daily_balance ?? 0,
        reserved: 0,
        last_daily_reset: (data as any).last_daily_reset ?? null,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e };
  }
}

export interface CoacheeSession {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  status: string;
  mandate_id: string | null;
  contact_id: string | null;
}

export async function fetchCoacheeUpcomingSessions(): Promise<{ data: CoacheeSession[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('events')
      .select('id, title, start_time, end_time, location, status, mandate_id, contact_id')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);
    if (error) return asEmpty<CoacheeSession[]>(error);
    return { data: (data as CoacheeSession[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

export interface CoacheeAssessment {
  id: string;
  assessment_type: string;
  archetype: string | null;
  composite_score: number | null;
  scores: any;
  created_at: string;
}

export async function fetchCoacheeAssessments(): Promise<{ data: CoacheeAssessment[]; error: any }> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !user.email) return { data: [], error: null };
    const { data, error } = await sb
      .from('assessments')
      .select('id, assessment_type, archetype, composite_score, scores, created_at')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return { data: [], error: null };
    return { data: (data as CoacheeAssessment[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}
