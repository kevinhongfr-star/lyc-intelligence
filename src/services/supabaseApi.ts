/**
 * Supabase API Service — Frontend Client
 * All data reads from Supabase.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

let supabase: SupabaseClient;
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_KEY) return createClient('https://placeholder.supabase.co', 'placeholder-key');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

// Clean mandate title — strips Notion ID prefixes
function cleanMandateTitle(title: string, companyName?: string | null): string {
  if (!title) return 'Untitled Mandate';
  if (/^NO\.[a-f0-9]+H/i.test(title) || /^[a-f0-9]{20,}$/i.test(title)) {
    return companyName ? `${companyName} — Mandate` : 'Mandate';
  }
  return title;
}

// Heuristic TRIDENT score for contacts with NULL scores
function heuristicTrident(c: Partial<Contact>): { d1: number; d2: number; d3: number; composite: number } {
  let d1 = 50, d2 = 45, d3 = 40;
  if (c.seniority === 'leadership' || c.seniority === 'c_suite') d1 += 20;
  else if (c.seniority === 'vp') d1 += 15;
  else if (c.seniority === 'director') d1 += 10;
  const careerLen = Array.isArray(c.career_history) ? c.career_history.length : 0;
  if (careerLen >= 5) d1 += 15; else if (careerLen >= 3) d1 += 10; else if (careerLen >= 1) d1 += 5;
  if (c.cxo_stamp) d1 += 8;
  const title = (c.current_title || '').toLowerCase();
  if (/\b(ceo|cfo|cto|coo|cmo|cpo|cio|ciso)\b/i.test(title)) d1 += 7;
  if (/\bvp\b|vice president/i.test(title)) d1 += 5;
  if (/\bdirector\b/i.test(title)) d1 += 3;
  d1 = Math.min(100, Math.max(0, d1));
  const skillsLen = Array.isArray(c.skills) ? c.skills.length : 0;
  if (skillsLen >= 15) d2 += 20; else if (skillsLen >= 10) d2 += 15; else if (skillsLen >= 5) d2 += 10; else if (skillsLen >= 2) d2 += 5;
  const langsLen = Array.isArray(c.languages) ? c.languages.length : 0;
  if (langsLen >= 4) d2 += 10; else if (langsLen >= 2) d2 += 5;
  if (c.icp_profile) d2 += 8;
  if (c.advisory_lane) d2 += 5;
  if ((c.headline || '').length > 50) d2 += 5;
  d2 = Math.min(100, Math.max(0, d2));
  if (c.advisory_tier === 'T1' || c.advisory_tier === 't1') d3 += 20;
  else if (c.advisory_tier === 'T2' || c.advisory_tier === 't2') d3 += 12;
  else if (c.advisory_tier) d3 += 5;
  if (c.council_tier === 'T1' || c.council_tier === 't1') d3 += 15;
  else if (c.council_tier === 'T2' || c.council_tier === 't2') d3 += 8;
  else if (c.council_tier) d3 += 3;
  if (c.market_side === 'candidate') d3 += 5;
  if (c.bd_priority) d3 += 5;
  if (c.commercial_readiness === 'high' || c.commercial_readiness === 'ready') d3 += 10;
  else if (c.commercial_readiness) d3 += 3;
  const eduLen = Array.isArray(c.education) ? c.education.length : 0;
  if (eduLen >= 2) d3 += 5;
  d3 = Math.min(100, Math.max(0, d3));
  const composite = Math.round(d1 * 0.40 + d2 * 0.35 + d3 * 0.25);
  return { d1, d2, d3, composite };
}
// ─── Types ───
export interface Contact {
  id: string; name: string; email: string | null; company_id: string | null; current_title: string | null;
  location: string | null; country: string | null; city: string | null; seniority: string | null;
  proximity: string | null; skills: string[] | null; languages: string[] | null;
  career_history: Array<{ company: string; role: string }> | null; education: Array<{ school: string; degree: string }> | null;
  is_expat: boolean; linkedin_url: string | null; headline: string | null; summary: string | null;
  icp_profile: string | null; council_tier: string | null; advisory_lane: string | null; advisory_tier: string | null;
  cxo_stamp: string | null; market_side: string | null; bd_priority: string | null;
  commercial_readiness: string | null; activity_status: string | null;
  match_score_best: number | null; trident_composite: number | null;
  trident_d1: number | null; trident_d2: number | null; trident_d3: number | null;
  engagement_score: number; notion_id: string | null; source: string; created_at: string; updated_at: string;
  company?: Company | null;
}

export interface Company {
  id: string; name: string; industry: string | null; stain_group: string | null; stain_tier: string | null;
  proximity: string | null; country: string | null; city: string | null; region: string | null;
  headcount_range: string | null; website: string | null; linkedin_url: string | null; description: string | null;
  total_contacts: number; active_mandates: number; engagement_score: number; notion_id: string | null; source: string;
}

export interface Mandate {
  id: string; title: string; client_id: string | null; status: string; progress: string | null; priority: string | null;
  skills_requirements: string[] | null; jd_description: string | null; search_definition: string | null;
  competitive_landscape: string | null; market_benchmark: string | null; keywords: string | null;
  client_first_name: string | null; total_candidates: number; tier1_count: number; tier2_count: number;
  shortlisted_count: number; interview_count: number; placed_count: number;
  notion_id: string | null; source: string; created_at: string; updated_at: string;
  // PHI fields
  phi_urgency: number | null; phi_strategic: number | null; phi_value: number | null;
  phi_retainer: number | null; phi_decision: number | null; phi_composite: number | null;
  phi_status: string | null; phi_action_priority: number | null; phi_sla_behind: boolean | null;
  // Phase 1.1 — structured intake
  intake_data?: any | null;
  company?: Company | null;
}

export interface CandidatePipeline {
  id: string; contact_id: string; mandate_id: string; stage: string; sweep_tier: string | null;
  match_score: number | null; match_reasons: any | null; key_match_reasons: string | null;
  estimated_comp: string | null; availability: string | null; notes: string | null;
  trident_composite: number | null; trident_d1: number | null; trident_d2: number | null; trident_d3: number | null;
  fit_analysis: string[] | null; risk_factors: string[] | null; approach_strategy: string | null;
  verdict: string | null; flags: string | null; next_steps: string | null; client_stage_override: string | null;
  notion_id: string | null; source: string; created_at: string; updated_at: string;
  contact?: Contact | null; mandate?: Mandate | null;
  client_feedback?: {
    decision: 'approved' | 'rejected' | 'hold';
    comment: string;
    decided_by: string | null;
    decided_at: string;
  } | null;
}

// ─── Query Functions ───

export async function searchContacts(params: { query?: string; seniority?: string[]; skills?: string[]; country?: string; limit?: number; offset?: number; userId?: string; }): Promise<{ data: Contact[]; count: number }> {
  const sb = getSupabase();

  // If userId provided, route through API for server-side mandate-based filtering
  if (params.userId) {
    const qp = new URLSearchParams();
    if (params.query) qp.set('search', params.query);
    if (params.seniority?.length) qp.set('seniority', params.seniority.join(','));
    if (params.country) qp.set('country', params.country);
    qp.set('limit', String(params.limit ?? 50));
    qp.set('offset', String(params.offset ?? 0));
    qp.set('user_id', params.userId);
    const res = await fetch(`/api/data/contact?${qp}`);
    const json = await res.json();
    const contacts = (json.data || []) as Contact[];
    // Apply heuristic trident enrichment
    const enriched = contacts.map(c => {
      if (c.trident_composite == null) {
        const h = heuristicTrident(c);
        return { ...c, trident_d1: h.d1, trident_d2: h.d2, trident_d3: h.d3, trident_composite: h.composite, match_score_best: h.composite };
      }
      return c;
    });
    return { data: enriched, count: json.total ?? enriched.length };
  }

  let q = sb.from('contacts').select('*, company:companies(*)', { count: 'exact' });
  if (params.query) q = q.or(`name.ilike.%${params.query}%,email.ilike.%${params.query}%,headline.ilike.%${params.query}%,current_title.ilike.%${params.query}%`);
  if (params.seniority?.length) q = q.in('seniority', params.seniority);
  if (params.country) q = q.eq('country', params.country);
  q = q.range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1).order('updated_at', { ascending: false });
  const { data, count, error } = await q;
  if (error) { console.error('[Supabase] searchContacts:', error); return { data: [], count: 0 }; }
  const enriched = ((data as Contact[]) ?? []).map(c => {
    if (c.trident_composite == null) {
      const h = heuristicTrident(c);
      return { ...c, trident_d1: h.d1, trident_d2: h.d2, trident_d3: h.d3, trident_composite: h.composite, match_score_best: h.composite };
    }
    return c;
  });
  return { data: enriched, count: count ?? 0 };
}

export async function getContact(id: string): Promise<Contact | null> {
  const { data, error } = await getSupabase().from('contacts').select('*, company:companies(*)').eq('id', id).single();
  if (error) return null;
  const c = data as Contact;
  if (c.trident_composite == null) {
    const h = heuristicTrident(c);
    return { ...c, trident_d1: h.d1, trident_d2: h.d2, trident_d3: h.d3, trident_composite: h.composite, match_score_best: h.composite };
  }
  return c;
}

export async function getMandates(params?: { status?: string; limit?: number; offset?: number; userId?: string; }): Promise<{ data: Mandate[]; count: number }> {
  // Use the API endpoint for authorization filtering
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());
  if (params?.userId) queryParams.set('user_id', params.userId);
  
  try {
    const res = await fetch(`/api/data/mandate?${queryParams.toString()}`);
    const result = await res.json();
    if (result.success) {
      const mandates = (result.data || []).map((m: any) => ({ ...m, title: cleanMandateTitle(m.title, m.company?.name) }));
      return { data: mandates, count: mandates.length };
    }
    console.error('[API] getMandates failed:', result.error);
    return { data: [], count: 0 };
  } catch (err) {
    console.error('[API] getMandates error:', err);
    return { data: [], count: 0 };
  }
}

export async function getMandateWithPipeline(mandateId: string): Promise<{ mandate: Mandate | null; pipeline: CandidatePipeline[] }> {
  const sb = getSupabase();
  const [mRes, pRes] = await Promise.all([
    sb.from('mandates').select('*, company:companies(*)').eq('id', mandateId).single(),
    sb.from('candidates_pipeline').select('*, contact:contacts(*, company:companies(*)), mandate:mandates(*)').eq('mandate_id', mandateId),
  ]);
  const mandate = mRes.data ? { ...(mRes.data as Mandate), title: cleanMandateTitle((mRes.data as Mandate).title, (mRes.data as Mandate).company?.name) } : null;
  return { mandate, pipeline: (pRes.data as CandidatePipeline[]) ?? [] };
}

// getCompanies — enhanced version with search, country, pagination (defined below in Companies section)

export async function getDashboardStats(): Promise<{
  totalContacts: number; totalMandates: number; totalCompanies: number; totalProposals: number;
  mandatesByStatus: Record<string, number>; contactsBySeniority: Record<string, number>;
}> {
  const sb = getSupabase();
  const [cRes, mRes, coRes, pRes] = await Promise.all([
    sb.from('contacts').select('id, seniority', { count: 'exact' }).limit(10000),
    sb.from('mandates').select('id, status', { count: 'exact' }).limit(10000),
    sb.from('companies').select('id', { count: 'exact' }).limit(1),
    sb.from('proposals').select('id', { count: 'exact' }).limit(1),
  ]);
  const contacts = cRes.data ?? [];
  const mandates = mRes.data ?? [];
  const contactsBySeniority: Record<string, number> = {};
  for (const c of contacts) { const k = c.seniority || 'unknown'; contactsBySeniority[k] = (contactsBySeniority[k] || 0) + 1; }
  const mandatesByStatus: Record<string, number> = {};
  for (const m of mandates) { const k = m.status || 'unknown'; mandatesByStatus[k] = (mandatesByStatus[k] || 0) + 1; }
  return { totalContacts: cRes.count ?? contacts.length, totalMandates: mRes.count ?? mandates.length, totalCompanies: coRes.count ?? 0, totalProposals: pRes.count ?? 0, mandatesByStatus, contactsBySeniority };
}

export async function getPipelineByMandate(mandateId: string): Promise<Record<string, CandidatePipeline[]>> {
  const { data, error } = await getSupabase().from('candidates_pipeline').select('*, contact:contacts(*, company:companies(*))').eq('mandate_id', mandateId);
  if (error || !data) return {};
  const grouped: Record<string, CandidatePipeline[]> = {};
  for (const item of data as CandidatePipeline[]) { const stage = item.stage || 'SWEEP'; if (!grouped[stage]) grouped[stage] = []; grouped[stage].push(item); }
  return grouped;
}

// ─── Events / Documents / Notifications ───
export interface CalendarEvent { id: string; mandate_id: string | null; contact_id: string | null; title: string; start_time: string; end_time: string | null; location: string | null; status: string; created_at: string; }
export interface Document { id: string; mandate_id: string | null; contact_id: string | null; name: string; type: string; visibility: string; created_at: string; }

export async function getEvents(): Promise<CalendarEvent[]> { const { data, error } = await getSupabase().from('events').select('*').order('start_time'); return error ? [] : (data as CalendarEvent[]) ?? []; }
export async function getDocuments(): Promise<Document[]> { const { data, error } = await getSupabase().from('documents').select('*').order('created_at', { ascending: false }); return error ? [] : (data as Document[]) ?? []; }

export async function getNotifications(): Promise<any[]> { const { data } = await getSupabase().from('vista_action_queue').select('*').order('created_at', { ascending: false }).limit(20); return data ?? []; }


// ─── Write Operations ───
export async function updateMandateStatus(mandateId: string, status: string): Promise<boolean> {
  const { error } = await getSupabase().from('mandates').update({ status, updated_at: new Date().toISOString() }).eq('id', mandateId);
  if (error) { console.error('[Supabase] updateMandateStatus:', error); return false; }
  return true;
}

export async function updatePipelineStage(pipelineId: string, stage: string): Promise<boolean> {
  const { error } = await getSupabase().from('candidates_pipeline').update({ stage, updated_at: new Date().toISOString() }).eq('id', pipelineId);
  if (error) { console.error('[Supabase] updatePipelineStage:', error); return false; }
  return true;
}

// Bulk update mandates status
export async function bulkUpdateMandateStatus(mandateIds: string[], status: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('mandates')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', mandateIds);
  if (error) {
    console.error('[Supabase] bulkUpdateMandateStatus:', error);
    return false;
  }
  return true;
}

// Get METRIX transcripts for a candidate
export async function getMetrixTranscripts(candidateName: string, company?: string): Promise<{
  id: string;
  content: string;
  relevance_score: number;
  created_at: string;
}[]> {
  const sb = getSupabase();
  
  let query = sb
    .from('org_intel_transcripts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (company) {
    query = query.or(`participant_name.ilike.%${candidateName}%,company.ilike.%${company}%`);
  } else {
    query = query.ilike('participant_name', `%${candidateName}%`);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] getMetrixTranscripts:', error);
    return [];
  }
  
  return (data || []).map((t: any) => ({
    id: t.id,
    content: t.transcript_text || t.content || '',
    relevance_score: t.relevance_score || 0,
    created_at: t.created_at,
  }));
}

// Check if candidate has METRIX transcript
export async function hasMetrixTranscript(candidateId: string): Promise<boolean> {
  const sb = getSupabase();
  
  const { data, error } = await sb
    .from('org_intel_transcripts')
    .select('id')
    .limit(1)
    .single();
  
  // This is a simplified check - in reality you'd link by contact_id
  return !error && data !== null;
}

// Notifications API
export async function getNotifications(userId: string): Promise<{
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}[]> {
  const { data, error } = await getSupabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('[Supabase] getNotifications:', error);
    return [];
  }
  
  return data.map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    created_at: n.created_at,
    metadata: n.metadata,
  }));
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('[Supabase] markNotificationAsRead:', error);
    return false;
  }
  
  return true;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  
  if (error) {
    console.error('[Supabase] markAllAsRead:', error);
    return false;
  }
  
  return true;
}

export async function createNotification(userId: string, data: {
  type: string;
  title: string;
  message: string;
  link: string;
  metadata?: Record<string, any>;
}): Promise<boolean> {
  const { error } = await getSupabase()
    .from('notifications')
    .insert({
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      metadata: data.metadata || {},
      read: false,
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error('[Supabase] createNotification:', error);
    return false;
  }
  
  return true;
}

// Client Feedback API
export async function updateCandidateFeedback(pipelineId: string, feedback: {
  decision: 'approved' | 'rejected' | 'hold';
  comment: string;
  decided_by: string | null;
  decided_at: string;
}): Promise<boolean> {
  const { error } = await getSupabase()
    .from('candidates_pipeline')
    .update({
      client_feedback: feedback,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pipelineId);
  
  if (error) {
    console.error('[Supabase] updateCandidateFeedback:', error);
    return false;
  }
  
  return true;
}

// Reports API
export async function getMandatesWithStats(orgId: string): Promise<Mandate[]> {
  const { data, error } = await getSupabase()
    .from('mandates')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[Supabase] getMandatesWithStats:', error);
    return [];
  }
  
  return data as Mandate[];
}

export async function getPipelineStats(orgId: string): Promise<{
  total_candidates: number;
  by_stage: Record<string, number>;
  conversion_rates: { stage: string; rate: number }[];
  avg_time_per_stage: { stage: string; days: number }[];
}> {
  const sb = getSupabase();
  
  try {
    // Get total candidates
    const { data: candidates, error: candidatesError } = await sb
      .from('candidates_pipeline')
      .select('stage')
      .eq('organization_id', orgId);
    
    if (candidatesError) throw candidatesError;
    
    const byStage: Record<string, number> = {};
    candidates.forEach((c: any) => {
      const stage = c.stage || 'unknown';
      byStage[stage] = (byStage[stage] || 0) + 1;
    });
    
    return {
      total_candidates: candidates.length,
      by_stage: byStage,
      conversion_rates: [],
      avg_time_per_stage: [],
    };
  } catch (error) {
    console.error('[Supabase] getPipelineStats:', error);
    return {
      total_candidates: 0,
      by_stage: {},
      conversion_rates: [],
      avg_time_per_stage: [],
    };
  }
}

// Mandate Solutions API
export async function createMandateSolutions(solutions: Array<{
  mandate_id: string;
  solution_type: string;
  solution_detail: Record<string, any>;
  linked_assessment_type?: string;
  linked_assessment_id?: string;
  status: string;
  defined_by?: string;
}>): Promise<boolean> {
  const sb = getSupabase();
  
  try {
    const { error } = await sb.from('mandate_solutions').insert(solutions);
    if (error) {
      console.error('[Supabase] createMandateSolutions:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] createMandateSolutions:', e);
    return false;
  }
}

export async function getMandateSolutions(mandateId: string): Promise<Array<{
  id: string;
  mandate_id: string;
  solution_type: string;
  solution_detail: Record<string, any>;
  linked_assessment_type?: string;
  linked_assessment_id?: string;
  status: string;
  defined_by?: string;
  defined_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  approval_notes?: string;
  rejection_notes?: string;
  created_at: string;
  updated_at: string;
}>> {
  const { data, error } = await getSupabase()
    .from('mandate_solutions')
    .select(`
      *,
      defined_by:profiles!defined_by(id, name),
      approved_by:profiles!approved_by(id, name)
    `)
    .eq('mandate_id', mandateId)
    .order('created_at');
  
  if (error) {
    console.error('[Supabase] getMandateSolutions:', error);
    return [];
  }
  
  return (data || []).map((s: any) => ({
    id: s.id,
    mandate_id: s.mandate_id,
    solution_type: s.solution_type,
    solution_detail: s.solution_detail || {},
    linked_assessment_type: s.linked_assessment_type,
    linked_assessment_id: s.linked_assessment_id,
    status: s.status,
    defined_by: s.defined_by?.id,
    defined_by_name: s.defined_by?.name,
    approved_by: s.approved_by?.id,
    approved_by_name: s.approved_by?.name,
    approval_notes: s.approval_notes,
    rejection_notes: s.rejection_notes,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));
}

export async function updateSolutionStatus(
  solutionId: string,
  status: 'approved' | 'rejected',
  approvedById: string | undefined,
  notes: string
): Promise<boolean> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (approvedById) {
    updates.approved_by = approvedById;
  }
  
  if (status === 'rejected') {
    updates.rejection_notes = notes;
  } else {
    updates.approval_notes = notes;
  }
  
  const { error } = await getSupabase()
    .from('mandate_solutions')
    .update(updates)
    .eq('id', solutionId);
  
  if (error) {
    console.error('[Supabase] updateSolutionStatus:', error);
    return false;
  }
  
  return true;
}

export async function updateMandateSolution(solutionId: string, updates: Partial<{
  solution_detail: Record<string, any>;
  linked_assessment_type?: string;
  linked_assessment_id?: string;
  status?: string;
}>): Promise<boolean> {
  const { error } = await getSupabase()
    .from('mandate_solutions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', solutionId);
  
  if (error) {
    console.error('[Supabase] updateMandateSolution:', error);
    return false;
  }
  
  return true;
}

export async function deleteMandateSolution(solutionId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('mandate_solutions')
    .delete()
    .eq('id', solutionId);
  
  if (error) {
    console.error('[Supabase] deleteMandateSolution:', error);
    return false;
  }
  
  return true;
}

export async function createEvent(event: { title: string; start_time: string; end_time?: string; location?: string; mandate_id?: string; contact_id?: string; }): Promise<CalendarEvent | null> {
  const { data, error } = await getSupabase().from('events').insert({ title: event.title, start_time: event.start_time, end_time: event.end_time || null, location: event.location || null, mandate_id: event.mandate_id || null, contact_id: event.contact_id || null, status: 'confirmed' }).select().single();
  if (error) { console.error('[Supabase] createEvent:', error); return null; }
  return data as CalendarEvent;
}

// ─── Lead Capture ───
export async function insertB2CLead(lead: { name: string; email: string; source: string }): Promise<boolean> {
  const { error } = await getSupabase().from('b2c_leads').insert({
    email: lead.email,
    source: lead.source,
  });
  if (error) {
    console.error('[Supabase] insertB2CLead:', error);
    return false;
  }
  return true;
}

export async function insertB2BLead(lead: { name: string; email: string; company: string; source: string }): Promise<boolean> {
  const { error } = await getSupabase().from('b2b_leads').insert({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    source: lead.source,
  });
  if (error) {
    console.error('[Supabase] insertB2BLead:', error);
    return false;
  }
  return true;
}

export async function upsertLead(lead: { name: string; email: string; current_title?: string; country?: string; source: string; }): Promise<boolean> {
  const { error } = await getSupabase().from('contacts').insert({ name: lead.name, email: lead.email, current_title: lead.current_title || null, country: lead.country || null, seniority: 'leadership', source: lead.source, activity_status: 'Lead', market_side: 'candidate', engagement_score: 10, is_expat: false, skills: [], languages: [] });
  return !error;
}

export async function logAssessmentGeneration(params: { email: string; toolType: string; assessmentName: string; archetype: string; compositeScore: number | null; gateData?: Record<string, unknown>; }): Promise<boolean> {
  const { error } = await getSupabase().from('ai_generations').insert({ user_id: '3cf508f5-dd29-4d1c-846b-6633b616f9c6', tool_type: params.toolType, contact_id: null, mandate_id: null, input_params: JSON.stringify(params.gateData ?? {}), output_text: `${params.assessmentName} — Archetype: ${params.archetype}, Composite: ${params.compositeScore ?? 'N/A'}`, confidence: params.compositeScore != null ? Math.round(params.compositeScore) : null, model: params.assessmentName, tokens_used: null });
  return !error;
}

export async function logScoringRun(params: { mandateId?: string; contactId?: string; runType: string; inputParams?: any; outputScores?: any; compositeScore?: number; verdict?: string; model?: string; }): Promise<boolean> {
  const { error } = await getSupabase().from('scoring_runs').insert({ user_id: '3cf508f5-dd29-4d1c-846b-6633b616f9c6', mandate_id: params.mandateId || null, contact_id: params.contactId || null, run_type: params.runType, input_params: params.inputParams ? JSON.stringify(params.inputParams) : null, output_scores: params.outputScores ? JSON.stringify(params.outputScores) : null, composite_score: params.compositeScore ?? null, verdict: params.verdict || null, model: params.model || null });
  return !error;
}

// ─── Assessment Persistence ───
export async function saveAssessment(params: {
  email: string;
  assessmentType: string;
  answers: Record<string, number>;
  scores: Record<string, number>;
  archetype: string;
  compositeScore: number;
  writingStyle?: string;
}): Promise<boolean> {
  try {
    const { error } = await getSupabase().from('assessments').insert({
      email: params.email,
      assessment_type: params.assessmentType,
      answers: JSON.stringify(params.answers),
      scores: JSON.stringify(params.scores),
      archetype: params.archetype,
      composite_score: params.compositeScore,
      writing_style: params.writingStyle || null,
      created_at: new Date().toISOString()
    });
    if (error) {
      console.error('[Supabase] saveAssessment:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] saveAssessment:', e);
    return false;
  }
}

export async function getAssessmentsByEmail(email: string): Promise<any[]> {
  try {
    const { data, error } = await getSupabase()
      .from('assessments')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ─── Companies / Target Companies ───
export async function getCompanies(params?: {
  industry?: string; country?: string; stainGroup?: string;
  query?: string; limit?: number; offset?: number;
}): Promise<{ data: Company[]; count: number }> {
  const sb = getSupabase();
  let q = sb.from('companies').select('*', { count: 'exact' });
  if (params?.query) q = q.or(`name.ilike.%${params.query}%,industry.ilike.%${params.query}%`);
  if (params?.industry) q = q.eq('industry', params.industry);
  if (params?.country) q = q.eq('country', params.country);
  if (params?.stainGroup) q = q.eq('stain_group', params.stainGroup);
  q = q.range(params?.offset ?? 0, (params?.offset ?? 0) + (params?.limit ?? 50) - 1)
       .order('engagement_score', { ascending: false });
  const { data, count, error } = await q;
  if (error) { console.error('[Supabase] getCompanies:', error); return { data: [], count: 0 }; }
  return { data: (data as Company[]) ?? [], count: count ?? 0 };
}

export async function getCompany(id: string): Promise<Company | null> {
  const { data, error } = await getSupabase().from('companies').select('*').eq('id', id).single();
  if (error) return null;
  return data as Company;
}

// ─── Tier Distribution (S/A/B/C based on trident_composite) ───
export async function getTierDistribution(): Promise<Record<string, number>> {
  const sb = getSupabase();
  const { data, error } = await sb.from('contacts')
    .select('trident_composite, council_tier, advisory_tier, cxo_stamp')
    .limit(15000);
  if (error || !data) return { S: 0, A: 0, B: 0, C: 0 };

  const tiers: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 };
  for (const c of data) {
    const score = c.trident_composite ?? 0;
    if (c.cxo_stamp || score >= 85) tiers.S++;
    else if (score >= 65) tiers.A++;
    else if (score >= 45) tiers.B++;
    else tiers.C++;
  }
  return tiers;
}

// ─── Recent Activity Feed ───
export async function getRecentActivity(limit: number = 20): Promise<any[]> {
  const sb = getSupabase();
  // Get recent scoring runs + recently updated contacts
  const [scoreRes, contactRes] = await Promise.all([
    sb.from('scoring_runs').select('id, run_type, composite_score, verdict, created_at, contact_id, mandate_id')
      .order('created_at', { ascending: false }).limit(limit),
    sb.from('contacts').select('id, name, current_title, updated_at, source')
      .order('updated_at', { ascending: false }).limit(limit),
  ]);

  const activities: any[] = [];
  for (const sr of (scoreRes.data ?? [])) {
    activities.push({
      type: 'scoring',
      id: sr.id,
      title: `Scored: ${sr.run_type}`,
      detail: sr.verdict ? `Verdict: ${sr.verdict}` : `Score: ${sr.composite_score ?? '—'}`,
      timestamp: sr.created_at,
      contact_id: sr.contact_id,
      mandate_id: sr.mandate_id,
    });
  }
  for (const c of (contactRes.data ?? [])) {
    activities.push({
      type: 'contact_update',
      id: c.id,
      title: c.name,
      detail: c.current_title ?? 'Profile updated',
      timestamp: c.updated_at,
    });
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, limit);
}

// ─── Company CRUD ───
export async function createCompany(company: Partial<Company>): Promise<Company | null> {
  const { data, error } = await getSupabase().from('companies')
    .insert(company).select().single();
  if (error) { console.error('[Supabase] createCompany:', error); return null; }
  return data as Company;
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
  const { data, error } = await getSupabase().from('companies')
    .update(updates).eq('id', id).select().single();
  if (error) { console.error('[Supabase] updateCompany:', error); return null; }
  return data as Company;
}

// ─── Mandate Intake (Phase 1.1) ────────────────────────────────────

export async function saveMandateIntake(mandateId: string, intakeData: unknown): Promise<boolean> {
  const { error } = await getSupabase()
    .from('mandates')
    .update({ intake_data: intakeData, updated_at: new Date().toISOString() })
    .eq('id', mandateId);
  if (error) { console.error('[Supabase] saveMandateIntake:', error); return false; }
  return true;
}

export async function generateIntakeQuestions(
  mandate: Pick<Mandate, 'title' | 'keywords' | 'location' | 'intake_data'>
): Promise<string[]> {
  try {
    const existingIntake = (mandate.intake_data as any) || {};
    const painSummary = (existingIntake.pain_points || [])
      .slice(0, 3)
      .map((p: any) => `- ${p.pain} (${p.severity})`)
      .join('\n');

    const prompt = [
      'You are an executive search consultant.',
      'Based on this mandate context:',
      `- Title: ${mandate.title}`,
      `- Industry: ${mandate.keywords || 'not specified'}`,
      `- Location: ${mandate.location || 'not specified'}`,
      painSummary ? `- Pain points already identified:\n${painSummary}` : '',
      '',
      'Generate exactly 5 discovery questions to ask the client to deepen intake.',
      'Focus on organizational pain points, leadership needs, and talent gaps.',
      'Return ONLY a JSON array of 5 strings. No preamble, no markdown. Example:',
      '["What…", "How…", "…"]',
    ].filter(Boolean).join('\n');

    const res = await fetch('/api/data/intake-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (Array.isArray(body.questions)) return body.questions as string[];
    if (typeof body.questions === 'string') {
      try { return JSON.parse(body.questions) as string[]; } catch {
        return (body.questions as string).split('\n').filter(Boolean);
      }
    }
    return [];
  } catch (e) {
    console.error('[Supabase] generateIntakeQuestions failed:', e);
    return [];
  }
}

export function isIntakeComplete(mandate: Mandate | null | undefined): boolean {
  if (!mandate) return false;
  const intake = mandate.intake_data as any;
  return intake && intake.intake_complete === true;
}

// ─── Success Profile (Phase 1.2) ────────────────────────────────────

export async function saveSuccessProfile(mandateId: string, profileData: unknown): Promise<boolean> {
  const { error } = await getSupabase()
    .from('success_profiles')
    .upsert({ ...profileData, mandate_id: mandateId })
    .select();
  if (error) { console.error('[Supabase] saveSuccessProfile:', error); return false; }
  return true;
}

export async function getSuccessProfiles(mandateId: string): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from('success_profiles')
    .select('*')
    .eq('mandate_id', mandateId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) { console.error('[Supabase] getSuccessProfiles:', error); return []; }
  return data || [];
}

export async function getApprovedSuccessProfile(mandateId: string): Promise<any | null> {
  const { data, error } = await getSupabase()
    .from('success_profiles')
    .select('*')
    .eq('mandate_id', mandateId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) { console.error('[Supabase] getApprovedSuccessProfile:', error); return null; }
  return data || null;
}

export async function approveSuccessProfile(profileId: string, approverId: string, notes?: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('success_profiles')
    .update({
      status: 'approved',
      approved_by: approverId,
      approval_notes: notes || null,
      rejection_reason: null,
    })
    .eq('id', profileId);
  if (error) { console.error('[Supabase] approveSuccessProfile:', error); return false; }
  return true;
}

export async function rejectSuccessProfile(profileId: string, approverId: string, reason: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('success_profiles')
    .update({
      status: 'rejected',
      approved_by: approverId,
      rejection_reason: reason,
    })
    .eq('id', profileId);
  if (error) { console.error('[Supabase] rejectSuccessProfile:', error); return false; }
  return true;
}

export function hasApprovedSuccessProfile(mandate: Mandate | null | undefined): boolean {
  return false;
}

// ─── Outreach Tracking (Phase 1.4) ───────────────────────────────────

export async function saveOutreachAttempt(data: {
  candidate_id: string;
  mandate_id: string;
  channel: string;
  attempt_number?: number;
  attempt_date?: string;
  outcome?: string | null;
  response_text?: string | null;
  notes?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  created_by?: string | null;
  organization_id?: string | null;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/data/outreach-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error('[Outreach] saveOutreachAttempt failed:', res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Outreach] saveOutreachAttempt error:', e);
    return false;
  }
}

export async function getOutreachAttempts(candidateId: string, mandateId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/data/outreach-attempts?candidate_id=${encodeURIComponent(candidateId)}&mandate_id=${encodeURIComponent(mandateId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('[Outreach] getOutreachAttempts error:', e);
    return [];
  }
}

export async function getAllOutreachAttempts(mandateId?: string): Promise<any[]> {
  try {
    const url = mandateId
      ? `/api/data/outreach-attempts?mandate_id=${encodeURIComponent(mandateId)}`
      : '/api/data/outreach-attempts?all=true';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('[Outreach] getAllOutreachAttempts error:', e);
    return [];
  }
}

export async function deleteOutreachAttempt(attemptId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/outreach-attempts/${attemptId}`, { method: 'DELETE' });
    if (!res.ok) return false;
    return true;
  } catch (e) {
    console.error('[Outreach] deleteOutreachAttempt error:', e);
    return false;
  }
}

export async function getOutreachNextActions(daysAhead: number = 7): Promise<any[]> {
  try {
    const res = await fetch(`/api/data/outreach-next-actions?days_ahead=${daysAhead}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('[Outreach] getOutreachNextActions error:', e);
    return [];
  }
}

export async function getAttemptCount(candidateId: string, mandateId: string): Promise<number> {
  const attempts = await getOutreachAttempts(candidateId, mandateId);
  return attempts.length;
}

export async function getOutreachStatsForCandidate(candidateId: string, mandateId: string): Promise<{
  total: number;
  responded: number;
  positive: number;
  lastAttemptDate: string | null;
  hasPositiveOutcome: boolean;
}> {
  const attempts = await getOutreachAttempts(candidateId, mandateId);
  const positiveOutcomes = ['positive', 'interested', 'scheduled_interview', 'referred_other'];

  return {
    total: attempts.length,
    responded: attempts.filter(a => a.outcome && a.outcome !== 'no_response').length,
    positive: attempts.filter(a => a.outcome && positiveOutcomes.includes(a.outcome)).length,
    lastAttemptDate: attempts.length > 0 ? attempts[0].attempt_date : null,
    hasPositiveOutcome: attempts.some(a => a.outcome && positiveOutcomes.includes(a.outcome)),
  };
}

// ─── Market Definition (Phase 1.5) ───────────────────────────────────

export interface CompanyOverviewInput {
  name: string;
  industry?: string;
  location?: string;
}

export interface CompanyOverviewResult {
  success: boolean;
  data?: {
    description?: string;
    revenue?: string;
    employee_count?: string;
    founded?: number;
    headquarters?: string;
    key_products?: string[];
    recent_news?: string;
    generated_at?: string;
  };
  error?: string;
}

export async function generateCompanyOverview(
  companyId: string,
  input: CompanyOverviewInput
): Promise<CompanyOverviewResult> {
  try {
    const res = await fetch('/api/data/company-overview-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, ...input }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: err.error || 'Failed to generate overview' };
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

export async function getTargetCompanies(mandateId?: string): Promise<any[]> {
  try {
    const url = mandateId
      ? `/api/data/target-companies?mandate_id=${encodeURIComponent(mandateId)}`
      : '/api/data/target-companies';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('[Market] getTargetCompanies error:', e);
    return [];
  }
}

export async function updateTargetCompany(companyId: string, updates: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/target-companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (e) {
    console.error('[Market] updateTargetCompany error:', e);
    return false;
  }
}

export async function calculateFitScores(mandateId: string, successProfileId: string): Promise<{
  success: boolean;
  updated?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/data/company-fit-calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mandate_id: mandateId, success_profile_id: successProfileId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: err.error };
    }

    const data = await res.json();
    return { success: true, updated: data.updated };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addTargetCompany(data: {
  name: string;
  industry?: string;
  location?: string;
  size?: string;
  domain?: string;
  mandate_id?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/data/target-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add company' }));
      return { success: false, error: err.error };
    }

    const result = await res.json();
    return { success: true, data: result.data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteTargetCompany(companyId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/target-companies/${companyId}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    console.error('[Market] deleteTargetCompany error:', e);
    return false;
  }
}

// ─── Advisory Assessment API Functions ───

export interface WorkshopData {
  id: string;
  organization_id: string;
  title: string;
  assessment_type: 'PRISM' | 'FORGE' | 'SPARK' | 'BRIDGE' | 'MOSAIC';
  mandate_id: string | null;
  scheduled_date: string;
  duration_minutes: number;
  location: string | null;
  max_participants: number;
  status: 'draft' | 'launched' | 'completed' | 'cancelled';
  allow_report_download: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipantData {
  id: string;
  workshop_id: string;
  email: string;
  name: string | null;
  token: string;
  status: 'invited' | 'started' | 'completed';
  responses: Record<string, any> | null;
  submitted_at: string | null;
  created_at: string;
}

export interface WorkshopScore {
  id: string;
  workshop_id: string;
  participant_id: string;
  assessment_type: string;
  dimension_scores: Record<string, number>;
  archetype: string;
  style: string;
  strengths: string[];
  development_areas: string[];
  recommendations: string[];
  raw_analysis: string;
  created_at: string;
}

export async function createWorkshop(data: {
  organization_id: string;
  title: string;
  assessment_type: 'PRISM' | 'FORGE' | 'SPARK' | 'BRIDGE' | 'MOSAIC';
  mandate_id?: string | null;
  scheduled_date: string;
  duration_minutes: number;
  location?: string | null;
  max_participants: number;
  created_by: string;
}): Promise<WorkshopData | null> {
  try {
    const res = await fetch('/api/data/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create workshop' }));
      console.error('[Workshop] createWorkshop error:', err);
      return null;
    }

    const result = await res.json();
    return result.data as WorkshopData;
  } catch (e) {
    console.error('[Workshop] createWorkshop error:', e);
    return null;
  }
}

export async function addWorkshopParticipants(workshopId: string, participants: Array<{ email: string; name?: string }>): Promise<boolean> {
  try {
    const res = await fetch('/api/data/workshops/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workshop_id: workshopId, participants }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Workshop] addWorkshopParticipants error:', e);
    return false;
  }
}

export async function sendInviteEmails(workshopId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/workshops/send-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workshop_id: workshopId }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Workshop] sendInviteEmails error:', e);
    return false;
  }
}

export async function getMandatesForOrg(orgId: string): Promise<Mandate[]> {
  try {
    const res = await fetch(`/api/data/mandates?org_id=${orgId}`);
    const result = await res.json();
    if (result.success) {
      return (result.data || []).map((m: any) => ({ ...m, title: cleanMandateTitle(m.title) }));
    }
    return [];
  } catch (e) {
    console.error('[Workshop] getMandatesForOrg error:', e);
    return [];
  }
}

export async function deductOrgCredits(orgId: string, amount: number, reason: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/orgs/deduct-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, amount, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to deduct credits' }));
      console.error('[Workshop] deductOrgCredits error:', err);
      return false;
    }

    const result = await res.json();
    return result.success;
  } catch (e) {
    console.error('[Workshop] deductOrgCredits error:', e);
    return false;
  }
}

export async function getWorkshopByToken(token: string): Promise<{ workshop: WorkshopData; participant: ParticipantData } | null> {
  try {
    const res = await fetch(`/api/data/workshops/participant?token=${token}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as { workshop: WorkshopData; participant: ParticipantData };
    }
    return null;
  } catch (e) {
    console.error('[Workshop] getWorkshopByToken error:', e);
    return null;
  }
}

export async function saveParticipantResponses(participantId: string, responses: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch('/api/data/workshops/participant/responses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: participantId, responses }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Workshop] saveParticipantResponses error:', e);
    return false;
  }
}

export async function submitAssessment(participantId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/workshops/participant/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: participantId }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Workshop] submitAssessment error:', e);
    return false;
  }
}

export async function scoreAdvisoryAssessment(workshopId: string, participantId: string): Promise<WorkshopScore | null> {
  try {
    const res = await fetch('/api/scoring/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workshop_id: workshopId, participant_id: participantId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to score assessment' }));
      console.error('[Workshop] scoreAdvisoryAssessment error:', err);
      return null;
    }

    const result = await res.json();
    if (result.success) {
      return result.data as WorkshopScore;
    }
    return null;
  } catch (e) {
    console.error('[Workshop] scoreAdvisoryAssessment error:', e);
    return null;
  }
}

export async function getWorkshopById(workshopId: string): Promise<WorkshopData | null> {
  try {
    const res = await fetch(`/api/data/workshops/${workshopId}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as WorkshopData;
    }
    return null;
  } catch (e) {
    console.error('[Workshop] getWorkshopById error:', e);
    return null;
  }
}

export async function getWorkshopParticipants(workshopId: string): Promise<ParticipantData[]> {
  try {
    const res = await fetch(`/api/data/workshops/${workshopId}/participants`);
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as ParticipantData[];
    }
    return [];
  } catch (e) {
    console.error('[Workshop] getWorkshopParticipants error:', e);
    return [];
  }
}

export async function getWorkshopScores(workshopId: string): Promise<WorkshopScore[]> {
  try {
    const res = await fetch(`/api/data/workshops/${workshopId}/scores`);
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as WorkshopScore[];
    }
    return [];
  } catch (e) {
    console.error('[Workshop] getWorkshopScores error:', e);
    return [];
  }
}

// ─── Org Chart & Talent Density API Functions (Phase 3.5) ───

export interface OrgNode {
  id: string;
  name: string;
  title?: string;
  department?: string;
  location?: string;
  reports_to?: string | null;
  talent_relevance?: number;
}

export interface OrgChartData {
  nodes: OrgNode[];
}

export interface TargetCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  sector?: string;
  location?: string;
  region?: string;
  size?: string;
  mandate_id?: string;
  org_chart?: OrgChartData | null;
  talent_density_score?: number;
  key_talent_count?: number;
  company_overview?: string;
  fit_score?: number;
  ranking_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TalentDensityCell {
  sector: string;
  geography: string;
  density_score: number;
  company_count: number;
  companies: TargetCompany[];
}

export interface TalentDensityData {
  companies: TargetCompany[];
  density_matrix: Record<string, Record<string, TalentDensityCell>>;
  total_companies: number;
}

export interface OrgChartPDFData {
  mandate: Mandate;
  companies: TargetCompany[];
  org_charts: Record<string, OrgChartData>;
  insights: {
    total_companies: number;
    top_sectors: string[];
    top_geographies: string[];
    highest_density: { sector: string; geo: string; score: number };
    lowest_density: { sector: string; geo: string; score: number };
    companies_with_charts: number;
    high_relevance_positions: number;
  };
}

export async function getOrgChart(companyId: string): Promise<OrgChartData | null> {
  try {
    const res = await fetch(`/api/data/org-chart/${companyId}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as OrgChartData;
    }
    return null;
  } catch (e) {
    console.error('[OrgChart] getOrgChart error:', e);
    return null;
  }
}

export async function saveOrgChart(companyId: string, orgChart: OrgChartData): Promise<{ success: boolean; density_score?: number }> {
  try {
    const res = await fetch(`/api/data/org-chart/${companyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_chart: orgChart }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save org chart' }));
      console.error('[OrgChart] saveOrgChart error:', err);
      return { success: false };
    }

    const result = await res.json();
    return { success: true, density_score: result.density_score };
  } catch (e) {
    console.error('[OrgChart] saveOrgChart error:', e);
    return { success: false };
  }
}

export async function getTalentDensity(mandateId: string): Promise<TalentDensityData | null> {
  try {
    const res = await fetch(`/api/data/talent-density/${mandateId}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as TalentDensityData;
    }
    return null;
  } catch (e) {
    console.error('[TalentDensity] getTalentDensity error:', e);
    return null;
  }
}

export async function getOrgChartPDFData(mandateId: string, companyIds?: string[]): Promise<OrgChartPDFData | null> {
  try {
    const res = await fetch('/api/data/org-chart-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mandate_id: mandateId, company_ids: companyIds }),
    });

    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as OrgChartPDFData;
    }
    return null;
  } catch (e) {
    console.error('[OrgChartPDF] getOrgChartPDFData error:', e);
    return null;
  }
}

export async function getTargetCompanies(mandateId: string): Promise<TargetCompany[]> {
  try {
    const res = await fetch(`/api/data/target-companies?mandate_id=${mandateId}`);
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as TargetCompany[];
    }
    return [];
  } catch (e) {
    console.error('[TargetCompanies] getTargetCompanies error:', e);
    return [];
  }
}

export async function getMandateById(mandateId: string): Promise<Mandate | null> {
  try {
    const res = await fetch(`/api/data/mandate/${mandateId}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as Mandate;
    }
    return null;
  } catch (e) {
    console.error('[Mandate] getMandateById error:', e);
    return null;
  }
}

// ─── LENS Report API Functions (Phase 3.6) ───

export interface LENSReportCandidate {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  match_score: number;
  dimensions: {
    experience: number;
    skills: number;
    fit: number;
  };
  strengths: string[];
  development_areas: string[];
  disc_profile: string;
  disc_scores: { D: number; I: number; S: number; C: number };
  disc_summary: string;
  disc_type: string;
  verdict: 'proceed' | 'hold' | 'pass';
  trident: string;
  recommendation: string;
  work_history: any[];
  skills: any[];
  shift_assessment: any;
  references: any[];
}

export interface LENSReportData {
  id: string;
  mandate: {
    title: string;
    client: string;
  };
  candidates: LENSReportCandidate[];
  candidate_count: number;
  top_candidate: LENSReportCandidate;
  proceed_count: number;
  hold_count: number;
  avg_match_score: number;
  generated_at: string;
  report_type: 'T1' | 'T2' | 'T3';
  pdf_url?: string;
  share_url?: string;
}

export interface CandidatePipeline {
  id: string;
  mandate_id: string;
  contact_id: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    current_title: string;
    company?: { name: string; industry: string };
    location: string;
  };
  stage: string;
  match_score: number | null;
  trident_composite: string | null;
  verdict: 'proceed' | 'hold' | 'pass' | null;
  scoring_output: any;
  analysis: any;
  created_at: string;
}

export async function generateLENSReport(
  mandateId: string,
  candidateIds: string[],
  reportType: 'T1' | 'T2' | 'T3'
): Promise<LENSReportData | null> {
  try {
    const res = await fetch('/api/data/lens-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mandate_id: mandateId,
        candidate_ids: candidateIds,
        report_type: reportType,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate report' }));
      console.error('[LENS] generateLENSReport error:', err);
      return null;
    }

    const result = await res.json();
    if (result.success) {
      return result.data as LENSReportData;
    }
    return null;
  } catch (e) {
    console.error('[LENS] generateLENSReport error:', e);
    return null;
  }
}

export async function sendReportEmail(reportId: string, recipients: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/data/lens-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: reportId,
        recipients: recipients,
      }),
    });

    return res.ok;
  } catch (e) {
    console.error('[LENS] sendReportEmail error:', e);
    return false;
  }
}

export async function createReportShareLink(reportId: string, expiry: string): Promise<string | null> {
  try {
    const res = await fetch('/api/data/lens-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: reportId,
        expiry: expiry,
      }),
    });

    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.share_url;
    }
    return null;
  } catch (e) {
    console.error('[LENS] createReportShareLink error:', e);
    return null;
  }
}

export async function generateGRIDReport(mandateId: string): Promise<{ pdf_url: string } | null> {
  try {
    const res = await fetch('/api/data/grid-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mandate_id: mandateId }),
    });

    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as { pdf_url: string };
    }
    return null;
  } catch (e) {
    console.error('[GRID] generateGRIDReport error:', e);
    return null;
  }
}

export async function getCandidatesForMandate(mandateId: string): Promise<CandidatePipeline[]> {
  try {
    const res = await fetch(`/api/data/candidates?mandate_id=${mandateId}`);
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as CandidatePipeline[];
    }
    return [];
  } catch (e) {
    console.error('[Candidates] getCandidatesForMandate error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// CANDIDATE PORTAL API (Phase 4.1)
// ═══════════════════════════════════════════════════════════════

export interface CandidateApplication {
  id: string;
  mandate_id: string;
  mandate: {
    title: string;
    description: string;
    jd_description?: string;
    location: string;
    compensation_range: string;
    company?: { name: string; industry?: string };
  };
  client_name: string;
  stage: string;
  match_score: number | null;
  trident_composite?: number;
  match_reasons?: string[];
  list_status: string | null;
  created_at: string;
  updated_at: string;
  applied_date: string;
  last_updated: string;
  stage_history: Array<{
    id: string;
    from_stage: string | null;
    to_stage: string;
    changed_at: string;
    notes: string | null;
  }>;
  next_steps: string | null;
  client_feedback?: {
    decision: 'approved' | 'rejected' | 'hold';
    comment: string;
    decided_by: string | null;
    decided_at: string;
  } | null;
  feedback: {
    decision: 'approved' | 'rejected' | 'hold';
    comment: string;
    decided_by: string | null;
    decided_at: string;
  } | null;
}

export interface CandidateProfile {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  linkedin_url: string;
  city: string;
  country: string;
  current_title: string;
  current_company: string;
  years_experience: number;
  industries: string[];
  skills: string[];
  languages: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  career_history: Array<{ company: string; role: string; duration: string }>;
  job_search_status: 'actively_looking' | 'open_to_opportunities' | 'not_looking';
  preferred_industries: string[];
  preferred_geographies: string[];
  preferred_company_sizes: string[];
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  cv_url: string | null;
  cv_extracted: {
    name?: string;
    email?: string;
    phone?: string;
    experience?: Array<{ company: string; role: string; years: string }>;
    skills?: string[];
  } | null;
  notification_preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  assessment_invitation: { enabled: boolean; email: boolean; in_app: boolean };
  interview_reminder: { enabled: boolean; email: boolean; in_app: boolean };
  stage_change: { enabled: boolean; email: boolean; in_app: boolean };
  feedback_received: { enabled: boolean; email: boolean; in_app: boolean };
  career_insight: { enabled: boolean; email: boolean; in_app: boolean; frequency: 'immediate' | 'daily' | 'weekly' };
}

export interface CareerInsight {
  id: string;
  title: string;
  description: string;
  category: 'market_trend' | 'opportunity' | 'company' | 'skill_demand';
  action_items: string[];
  related_data: {
    companies?: string[];
    skills?: string[];
    geographies?: string[];
  };
  relevance_score: number;
  saved: boolean;
  created_at: string;
}

export interface CandidateNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  read: boolean;
  created_at: string;
}

// Get candidate's applications
export async function getCandidateApplications(): Promise<CandidateApplication[]> {
  try {
    const res = await fetch('/api/data/candidate/applications');
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as CandidateApplication[];
    }
    return [];
  } catch (e) {
    console.error('[Candidate] getCandidateApplications error:', e);
    return [];
  }
}

// Get candidate's profile
export async function getCandidateProfile(): Promise<CandidateProfile | null> {
  try {
    const res = await fetch('/api/data/candidate/profile');
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as CandidateProfile;
    }
    return null;
  } catch (e) {
    console.error('[Candidate] getCandidateProfile error:', e);
    return null;
  }
}

// Update candidate's profile
export async function updateCandidateProfile(updates: Partial<CandidateProfile>): Promise<boolean> {
  try {
    const res = await fetch('/api/data/candidate/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) return false;

    const result = await res.json();
    return result.success;
  } catch (e) {
    console.error('[Candidate] updateCandidateProfile error:', e);
    return false;
  }
}

// Get candidate's notifications
export async function getCandidateNotifications(): Promise<{
  notifications: CandidateNotification[];
  preferences: NotificationPreferences;
}> {
  try {
    const res = await fetch('/api/data/candidate/notifications');
    if (!res.ok) return { notifications: [], preferences: getDefaultNotificationPreferences() };

    const result = await res.json();
    if (result.success) {
      return {
        notifications: result.data as CandidateNotification[],
        preferences: result.preferences as NotificationPreferences,
      };
    }
    return { notifications: [], preferences: getDefaultNotificationPreferences() };
  } catch (e) {
    console.error('[Candidate] getCandidateNotifications error:', e);
    return { notifications: [], preferences: getDefaultNotificationPreferences() };
  }
}

// Mark notifications as read
export async function markCandidateNotificationsRead(notificationIds: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/data/candidate/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_ids: notificationIds }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Candidate] markCandidateNotificationsRead error:', e);
    return false;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
  try {
    const res = await fetch('/api/data/candidate/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });

    if (!res.ok) return false;

    const result = await res.json();
    return result.success;
  } catch (e) {
    console.error('[Candidate] updateNotificationPreferences error:', e);
    return false;
  }
}

// Get career insights
export async function getCareerInsights(): Promise<CareerInsight[]> {
  try {
    const res = await fetch('/api/data/candidate/insights');
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as CareerInsight[];
    }
    return [];
  } catch (e) {
    console.error('[Candidate] getCareerInsights error:', e);
    return [];
  }
}

// Save/bookmark a career insight
export async function saveCareerInsight(insightId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/candidate/insights/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insight_id: insightId }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Candidate] saveCareerInsight error:', e);
    return false;
  }
}

// Remove saved career insight
export async function unsaveCareerInsight(insightId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/candidate/insights/save', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insight_id: insightId }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Candidate] unsaveCareerInsight error:', e);
    return false;
  }
}

// Helper function for default notification preferences
function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    assessment_invitation: { enabled: true, email: true, in_app: true },
    interview_reminder: { enabled: true, email: true, in_app: true },
    stage_change: { enabled: true, email: false, in_app: true },
    feedback_received: { enabled: true, email: false, in_app: true },
    career_insight: { enabled: true, email: true, in_app: true, frequency: 'weekly' },
  };
}

// ═══════════════════════════════════════════════════════════════
// CANDIDATE ASSESSMENT API (Phase 4.2)
// ═══════════════════════════════════════════════════════════════

export type AssessmentQuestionType = 'likert' | 'mcq_single' | 'mcq_multi' | 'text' | 'ranking';

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  text: string;
  description?: string;
  required?: boolean;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_min_label?: string;
  scale_max_label?: string;
  max_length?: number;
  ranking_items?: string[];
}

export interface AssessmentConfig {
  id: string;
  title: string;
  type: string;
  description?: string;
  estimated_minutes: number;
  show_timer: boolean;
  questions: AssessmentQuestion[];
  mandate?: {
    id: string;
    title: string;
    client_name: string;
  };
  previous_responses?: AssessmentResponse[] | null;
}

export interface AssessmentResponse {
  question_id: string;
  value: string | number | string[] | number[];
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  mandate_id: string;
  overall_score: number;
  recommendation: 'proceed' | 'hold' | 'pass';
  dimension_scores: Array<{
    name: string;
    score: number;
    description?: string;
  }>;
  strengths: string[];
  development_areas: string[];
  visibility: 'full' | 'pass_fail' | 'hidden';
  completed_at: string;
}

export interface AssessmentInvitation {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  mandate_id: string;
  mandate_title: string;
  client_name: string;
  assessment_type: string;
  assessment_id: string;
  assessment_title: string;
  duration_minutes: number;
  assessment_link: string;
  consultant_name: string;
  consultant_email: string;
  invited_at: string;
  expires_at?: string;
  status: 'pending' | 'sent' | 'viewed' | 'completed' | 'expired';
}

// Get assessment configuration for a candidate
export async function getCandidateAssessment(assessmentId: string, candidateId: string): Promise<AssessmentConfig | null> {
  try {
    const res = await fetch(`/scoring/candidate/assessment?assessment_id=${assessmentId}&candidate_id=${candidateId}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as AssessmentConfig;
    }
    return null;
  } catch (e) {
    console.error('[Assessment] getCandidateAssessment error:', e);
    return null;
  }
}

// Submit assessment responses
export async function submitAssessment(params: {
  candidateId: string;
  assessmentId: string;
  mandateId: string;
  assessmentType: string;
  responses: AssessmentResponse[];
  visibility?: 'full' | 'pass_fail' | 'hidden';
}): Promise<boolean> {
  try {
    const res = await fetch('/scoring/candidate/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) return false;

    const result = await res.json();
    return result.success;
  } catch (e) {
    console.error('[Assessment] submitAssessment error:', e);
    return false;
  }
}

// Get assessment result for candidate
export async function getAssessmentResult(assessmentId: string, candidateId: string): Promise<AssessmentResult | null> {
  try {
    const res = await fetch(`/scoring/candidate/result?assessment_id=${assessmentId}&candidate_id=${candidateId}`);
    if (!res.ok) return null;

    const result = await res.json();
    if (result.success) {
      return result.data as AssessmentResult;
    }
    return null;
  } catch (e) {
    console.error('[Assessment] getAssessmentResult error:', e);
    return null;
  }
}

// Auto-save assessment responses (during assessment)
export async function autoSaveAssessment(params: {
  candidateId: string;
  assessmentId: string;
  mandateId: string;
  assessmentType: string;
  responses: AssessmentResponse[];
}): Promise<boolean> {
  try {
    const res = await fetch('/scoring/candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        visibility: 'hidden', // Auto-save doesn't show results
      }),
    });

    return res.ok;
  } catch (e) {
    console.error('[Assessment] autoSaveAssessment error:', e);
    return false;
  }
}

// Send assessment invitation
export async function sendAssessmentInvitation(params: {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  mandateId: string;
  mandateTitle: string;
  clientName: string;
  assessmentType: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  assessmentLink: string;
  consultantName: string;
  consultantEmail: string;
}): Promise<{ success: boolean; invitationId?: string }> {
  try {
    const res = await fetch('/api/data/assessments/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) return { success: false };

    const result = await res.json();
    return { success: true, invitationId: result.invitation_id };
  } catch (e) {
    console.error('[Assessment] sendAssessmentInvitation error:', e);
    return { success: false };
  }
}

// Get candidate's assessment invitations
export async function getAssessmentInvitations(candidateId: string): Promise<AssessmentInvitation[]> {
  try {
    const res = await fetch(`/api/data/assessments/invitations?candidate_id=${candidateId}`);
    if (!res.ok) return [];

    const result = await res.json();
    if (result.success) {
      return result.data as AssessmentInvitation[];
    }
    return [];
  } catch (e) {
    console.error('[Assessment] getAssessmentInvitations error:', e);
    return [];
  }
}

// Update result visibility (consultant only)
export async function updateResultVisibility(resultId: string, visibility: 'full' | 'pass_fail' | 'hidden'): Promise<boolean> {
  try {
    const res = await fetch('/scoring/candidate/visibility', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_id: resultId, visibility }),
    });

    if (!res.ok) return false;

    const result = await res.json();
    return result.success;
  } catch (e) {
    console.error('[Assessment] updateResultVisibility error:', e);
    return false;
  }
}