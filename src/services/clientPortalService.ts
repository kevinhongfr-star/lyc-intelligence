/**
 * clientPortalService — B2B Client Portal data access (SPRINT 3 / EO_1)
 *
 * S3-T06 security rewrite: All calls now go through server-enforced ACL
 * endpoints at /api/client/* — never the Supabase client directly.
 * Server gates:
 *   - client_accounts.auth_user_id + active + not expired
 *   - client_mandate_access table (mandate-by-mandate ACL)
 *   - mandates.client_visible
 *   - contacts.client_presented
 *
 * Endpoints used:
 *   GET /api/client/company                 → resolveClientCompany
 *   GET /api/client/mandates                → fetchClientMandates
 *   GET /api/client/shortlist?mandate_id=X  → fetchMandateShortlist
 *   GET /api/client/pipeline-counts[&mandate_id=X]
 *                                             → fetchPipelineStageCounts
 */
import { authFetch } from '@/utils/authFetch';

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

// ─── Company resolution (S3-T06 gated server) ──────────────────────────────

/**
 * Resolve the client's company through the server ACL
 * (`client_accounts.auth_user_id`, active, not expired), with a graceful
 * fallback to `profiles.organization_id` for non-client users.
 */
export async function resolveClientCompany(
  _userId: string,
  _fallbackOrgId?: string | null,
): Promise<{ companyId: string | null; companyName: string | null; account: ClientAccount | null }> {
  try {
    const r = await authFetch('/api/client/company');
    if (!r.ok) {
      console.warn('[clientPortalService] resolveClientCompany HTTP', r.status);
      return { companyId: null, companyName: null, account: null };
    }
    const payload = await r.json().catch(() => ({}));
    if (!payload?.success) {
      return { companyId: null, companyName: null, account: null };
    }
    return {
      companyId: payload.companyId ?? null,
      companyName: payload.companyName ?? null,
      account: payload.account ?? null,
    };
  } catch (e) {
    console.warn('[clientPortalService] resolveClientCompany error:', e);
    return { companyId: null, companyName: null, account: null };
  }
}

// ─── Mandates (S3-T06 gated server) ─────────────────────────────────────────

/**
 * Fetch mandates accessible to this client account via
 * `client_mandate_access` + `mandates.client_visible`. Maps legacy server
 * response fields into the ClientMandate shape used by our React pages.
 */
export async function fetchClientMandates(
  _companyId: string, // passed for API-compat; server resolves from auth + ACL
): Promise<ClientMandate[]> {
  try {
    const r = await authFetch('/api/client/mandates');
    if (!r.ok) {
      console.warn('[clientPortalService] fetchClientMandates HTTP', r.status);
      return [];
    }
    const payload = await r.json().catch(() => ({}));
    const list: any[] = Array.isArray(payload?.mandates) ? payload.mandates : [];
    return list.map(row => ({
      id: row.mandate_id ?? row.id,
      title: row.title ?? '',
      status: row.status ?? null,
      priority: row.priority ?? null,
      client_id: row.client_id ?? null,
      jd_description: row.client_summary ?? row.jd_description ?? null,
      search_definition: null,
      skills_requirements: Array.isArray(row.skills_requirements)
        ? row.skills_requirements
        : null,
      keywords: null,
      created_at: row.created_at ?? null,
      updated_at: row.last_activity_at ?? row.updated_at ?? null,
      company_name: row.company_name ?? null,
      company_industry: row.company_industry ?? null,
      consultant_id: row.lead_consultant_id ?? null,
      consultant_name: row.lead_consultant_name ?? null,
      consultant_email: null,
      consultant_role: null,
    }));
  } catch (e) {
    console.warn('[clientPortalService] fetchClientMandates error:', e);
    return [];
  }
}

// ─── Pipeline rankings / shortlist (S3-T06 gated server) ───────────────────

/**
 * Ranked candidates for a mandate (Gold/Silver/Bronze). Server returns only
 * `client_presented` candidates for mandates the caller has ACL access to.
 */
export async function fetchMandateShortlist(mandateId: string): Promise<PipelineRanking[]> {
  try {
    const r = await authFetch(`/api/client/shortlist?mandate_id=${encodeURIComponent(mandateId)}`);
    if (!r.ok) {
      console.warn('[clientPortalService] fetchMandateShortlist HTTP', r.status);
      return [];
    }
    const payload = await r.json().catch(() => ({}));
    const list: any[] = Array.isArray(payload?.shortlist) ? payload.shortlist : [];
    return list.map(row => ({
      id: row.id,
      mandate_id: row.mandate_id ?? mandateId,
      candidate_id: row.candidate_id ?? row.contact_id ?? row.id,
      candidate_name: row.candidate_name ?? row.full_name ?? null,
      current_title: row.current_title ?? row.title ?? null,
      current_company: row.current_company ?? row.company_name ?? null,
      pipeline_stage: row.pipeline_stage ?? row.stage ?? null,
      weighted_score: row.weighted_score ?? row.composite_score ?? null,
      tier: (row.tier as Tier) ?? null,
      rank: row.rank ?? null,
      consultant_name: row.consultant_name ?? null,
      scored_at: row.scored_at ?? row.client_presented_at ?? null,
    }));
  } catch (e) {
    console.warn('[clientPortalService] fetchMandateShortlist error:', e);
    return [];
  }
}

// ─── Pipeline stage distribution (S3-T06 gated server) ─────────────────────

/**
 * Aggregate candidates into stage counts, filtered by mandate_id or (if
 * `mandateId` is undefined) all mandates the caller has ACL access to,
 * across the passed company scope. Server gate ensures no cross-company leaks.
 */
export async function fetchPipelineStageCounts(
  mandateId?: string,
  _companyId?: string, // server resolves scope from ACL
): Promise<PipelineStageCount[]> {
  const qs = mandateId ? `?mandate_id=${encodeURIComponent(mandateId)}` : '';
  try {
    const r = await authFetch(`/api/client/pipeline-counts${qs}`);
    if (!r.ok) {
      console.warn('[clientPortalService] fetchPipelineStageCounts HTTP', r.status);
      return [];
    }
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.stage_counts) ? payload.stage_counts : [];
  } catch (e) {
    console.warn('[clientPortalService] fetchPipelineStageCounts error:', e);
    return [];
  }
}

// ─── Tier + stage helpers (unchanged) ───────────────────────────────────────

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

// ─── Dashboard chart helpers (S1-T11 / S1-T12 / S1-T13) ─────────────────────

export interface TierDistributionRow {
  tier: Tier;
  count: number;
}

export interface MandateStatRow {
  mandate_id: string;
  mandate_title: string;
  company_name: string | null;
  total_candidates: number;
  avg_score: number;
  gold_count: number;
  silver_count: number;
  bronze_count: number;
  unranked_count: number;
}

export interface HeatmapCell {
  mandate_id: string;
  stage: string;
  count: number;
}

export interface HeatmapData {
  stages: string[];
  mandates: {
    id: string;
    title: string;
    company_name: string | null;
    total: number;
  }[];
  rows: HeatmapCell[];
  totals_by_mandate: Record<string, number>;
  totals_by_stage: Record<string, number>;
  max_cell: number;
  total_candidates: number;
}

/**
 * Tier distribution for all candidates visible to the client (across
 * ACL-accessible mandates, client_presented flag enforced server-side).
 * Used by ClientOverviewPage tier-distribution donut chart.
 */
export async function fetchTierDistribution(): Promise<TierDistributionRow[]> {
  try {
    const r = await authFetch('/api/client/tier-distribution');
    if (!r.ok) {
      console.warn('[clientPortalService] fetchTierDistribution HTTP', r.status);
      return [];
    }
    const payload = await r.json().catch(() => ({}));
    const rows: any[] = Array.isArray(payload?.distribution) ? payload.distribution : [];
    return rows.map(r => ({
      tier: (r.tier as Tier) ?? 'Unranked',
      count: Number(r.count ?? 0),
    }));
  } catch (e) {
    console.warn('[clientPortalService] fetchTierDistribution error:', e);
    return [];
  }
}

/**
 * Per-mandate aggregate stats (totals, tier counts, avg score) across the
 * mandates the client account has ACL access to. Used for mandate-rankings
 * top-N list and the Client Portal mandate horizontal stacked bar chart.
 */
export async function fetchMandateStats(limit = 10): Promise<MandateStatRow[]> {
  try {
    const r = await authFetch(`/api/client/mandate-stats?limit=${limit}`);
    if (!r.ok) {
      console.warn('[clientPortalService] fetchMandateStats HTTP', r.status);
      return [];
    }
    const payload = await r.json().catch(() => ({}));
    const rows: any[] = Array.isArray(payload?.stats) ? payload.stats : [];
    return rows.map(r => ({
      mandate_id: r.mandate_id ?? '',
      mandate_title: r.mandate_title ?? r.title ?? '',
      company_name: r.company_name ?? null,
      total_candidates: Number(r.total_candidates ?? 0),
      avg_score: Number(r.avg_score ?? 0),
      gold_count: Number(r.gold_count ?? 0),
      silver_count: Number(r.silver_count ?? 0),
      bronze_count: Number(r.bronze_count ?? 0),
      unranked_count: Number(r.unranked_count ?? 0),
    }));
  } catch (e) {
    console.warn('[clientPortalService] fetchMandateStats error:', e);
    return [];
  }
}

/**
 * Candidate × Stage × Mandate heatmap matrix.
 *
 * Returns a mandates × stages grid with cell values = candidate count in
 * that (mandate, stage) pair, plus totals and a max_cell for intensity
 * normalization. Used by CandidateStageHeatmap component.
 */
export async function fetchHeatmap(limit = 30): Promise<HeatmapData | null> {
  try {
    const r = await authFetch(`/api/client/heatmap?limit=${limit}`);
    if (!r.ok) {
      console.warn('[clientPortalService] fetchHeatmap HTTP', r.status);
      return null;
    }
    const payload = await r.json().catch(() => ({}));
    if (!payload?.success) return null;
    return payload as HeatmapData & { success: boolean };
  } catch (e) {
    console.warn('[clientPortalService] fetchHeatmap error:', e);
    return null;
  }
}
