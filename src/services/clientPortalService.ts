/**
 * clientPortalService — B2B Client Portal data access (SPRINT 3 / EO_1)
 *
 * Queries the live Supabase tables/views directly, scoped to the logged-in
 * client's company. The client's company is resolved from `client_accounts`
 * (by user_id) with a fallback to `profiles.organization_id`.
 *
 * Live objects used:
 *   - client_accounts   (8 active client accounts)
 *   - mandates          (7,449 mandates; filtered by company)
 *   - v_pipeline_rankings (ranked candidates per mandate, Gold/Silver/Bronze)
 *   - candidates_pipeline (385 rows, 9 pipeline stages)
 *   - consultants       (4 consultants)
 */
import { getSupabase } from './supabaseApi';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ClientAccount {
  id: string;
  user_id: string | null;
  company_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  role: string | null; // 'client_user' | 'client_admin'
  status: string | null;
}

export interface ClientMandate {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  client_id: string | null;
  jd_description: string | null;
  search_definition: string | null;
  skills_requirements: string[] | null;
  keywords: string | null;
  created_at: string | null;
  updated_at: string | null;
  company_name: string | null;
  company_industry: string | null;
  consultant_id: string | null;
  consultant_name: string | null;
  consultant_email: string | null;
  consultant_role: string | null;
}

export type Tier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';

export interface PipelineRanking {
  id: string;
  mandate_id: string;
  candidate_id: string;
  candidate_name: string | null;
  current_title: string | null;
  current_company: string | null;
  pipeline_stage: string | null;
  weighted_score: number | null;
  tier: Tier | null;
  rank: number | null;
  consultant_name: string | null;
  scored_at: string | null;
}

export interface PipelineStageCount {
  stage: string;
  count: number;
}

// ─── Company resolution ─────────────────────────────────────────────────────

/**
 * Resolve the client's company_id. Tries `client_accounts` first (joined with
 * companies for the name), then falls back to `profiles.organization_id`.
 */
export async function resolveClientCompany(
  userId: string,
  fallbackOrgId?: string | null,
): Promise<{ companyId: string | null; companyName: string | null; account: ClientAccount | null }> {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('client_accounts')
      .select(`
        id, user_id, company_id, role, status,
        contact_name, contact_email,
        company:companies(id, name)
      `)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[clientPortalService] resolveClientCompany query failed:', error.message);
    } else if (data) {
      const row = data as any;
      const company = Array.isArray(row.company) ? row.company[0] : row.company;
      return {
        companyId: row.company_id ?? company?.id ?? fallbackOrgId ?? null,
        companyName: company?.name ?? null,
        account: {
          id: row.id,
          user_id: row.user_id,
          company_id: row.company_id,
          company_name: company?.name ?? null,
          contact_name: row.contact_name,
          contact_email: row.contact_email,
          role: row.role,
          status: row.status,
        },
      };
    }
  } catch (e) {
    console.warn('[clientPortalService] resolveClientCompany error:', e);
  }
  return { companyId: fallbackOrgId ?? null, companyName: null, account: null };
}

// ─── Mandates ───────────────────────────────────────────────────────────────

/**
 * Fetch mandates for a client's company, with consultant info joined.
 * `companyId` maps to `mandates.client_id`.
 */
export async function fetchClientMandates(companyId: string): Promise<ClientMandate[]> {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('mandates')
      .select(`
        id, title, status, priority, client_id,
        jd_description, search_definition, skills_requirements, keywords,
        created_at, updated_at,
        company:companies(name, industry),
        consultant:consultant_id(id, name, email, role)
      `)
      .eq('client_id', companyId)
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.warn('[clientPortalService] fetchClientMandates query failed:', error.message);
      return [];
    }
    return ((data as any[]) ?? []).map(row => {
      const company = Array.isArray(row.company) ? row.company[0] : row.company;
      const consultant = Array.isArray(row.consultant) ? row.consultant[0] : row.consultant;
      return {
        id: row.id,
        title: row.title,
        status: row.status,
        priority: row.priority,
        client_id: row.client_id,
        jd_description: row.jd_description,
        search_definition: row.search_definition,
        skills_requirements: row.skills_requirements,
        keywords: row.keywords,
        created_at: row.created_at,
        updated_at: row.updated_at,
        company_name: company?.name ?? null,
        company_industry: company?.industry ?? null,
        consultant_id: consultant?.id ?? null,
        consultant_name: consultant?.name ?? null,
        consultant_email: consultant?.email ?? null,
        consultant_role: consultant?.role ?? null,
      } as ClientMandate;
    });
  } catch (e) {
    console.warn('[clientPortalService] fetchClientMandates error:', e);
    return [];
  }
}

// ─── Pipeline rankings (shortlist) ──────────────────────────────────────────

/**
 * Fetch ranked candidates for a specific mandate from `v_pipeline_rankings`.
 * Returns candidates sorted by rank ascending (best first).
 */
export async function fetchMandateShortlist(mandateId: string): Promise<PipelineRanking[]> {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from('v_pipeline_rankings')
      .select('*')
      .eq('mandate_id', mandateId)
      .order('rank', { ascending: true, nullsFirst: false });

    if (error) {
      console.warn('[clientPortalService] fetchMandateShortlist query failed:', error.message);
      return [];
    }
    return ((data as any[]) ?? []).map(row => ({
      id: row.id,
      mandate_id: row.mandate_id,
      candidate_id: row.candidate_id,
      candidate_name: row.candidate_name ?? row.name ?? null,
      current_title: row.current_title ?? null,
      current_company: row.current_company ?? row.company_name ?? null,
      pipeline_stage: row.pipeline_stage ?? row.stage ?? null,
      weighted_score: row.weighted_score ?? row.score ?? null,
      tier: (row.tier as Tier) ?? null,
      rank: row.rank ?? null,
      consultant_name: row.consultant_name ?? null,
      scored_at: row.scored_at ?? null,
    } as PipelineRanking));
  } catch (e) {
    console.warn('[clientPortalService] fetchMandateShortlist error:', e);
    return [];
  }
}

// ─── Pipeline stage distribution ────────────────────────────────────────────

/**
 * Fetch the distribution of candidates across pipeline stages for a mandate
 * (or all mandates for a company). Read-only Kanban column counts.
 */
export async function fetchPipelineStageCounts(
  mandateId?: string,
  companyId?: string,
): Promise<PipelineStageCount[]> {
  const sb = getSupabase();
  try {
    let q = sb.from('candidates_pipeline').select('stage');
    if (mandateId) {
      q = q.eq('mandate_id', mandateId);
    } else if (companyId) {
      q = q.eq('mandate.client_id', companyId);
    }
    const { data, error } = await q;
    if (error) {
      console.warn('[clientPortalService] fetchPipelineStageCounts query failed:', error.message);
      return [];
    }
    const counts: Record<string, number> = {};
    for (const row of (data as any[]) ?? []) {
      const stage = row.stage ?? 'Unknown';
      counts[stage] = (counts[stage] ?? 0) + 1;
    }
    return Object.entries(counts).map(([stage, count]) => ({ stage, count }));
  } catch (e) {
    console.warn('[clientPortalService] fetchPipelineStageCounts error:', e);
    return [];
  }
}

// ─── Tier badge helpers ─────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  'New', 'Sourcing', 'Screening', 'Shortlisted', 'Presented', 'Interview', 'Offer', 'Hired',
] as const;

export const TIER_COLORS: Record<Tier, string> = {
  Gold: 'bg-amber-100 text-amber-800 border-amber-300',
  Silver: 'bg-gray-100 text-gray-700 border-gray-300',
  Bronze: 'bg-orange-100 text-orange-800 border-orange-300',
  Unranked: 'bg-stone-100 text-stone-500 border-stone-300',
};

export const TIER_EMOJI: Record<Tier, string> = {
  Gold: '🥇',
  Silver: '🥈',
  Bronze: '🥉',
  Unranked: '—',
};
