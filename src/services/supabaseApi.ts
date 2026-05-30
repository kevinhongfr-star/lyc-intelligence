/**
 * Supabase API Service — Frontend Client
 * All data reads from Supabase.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
}

// ─── Query Functions ───


function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\\\$&');
}

export async function searchContacts(params: { query?: string; seniority?: string[]; skills?: string[]; country?: string; limit?: number; offset?: number; }): Promise<{ data: Contact[]; count: number }> {
  const sb = getSupabase();
  let q = sb.from('contacts').select('*, company:companies(*)', { count: 'exact' });
  if (params.query) q = q.or(`name.ilike.%${escapeLikePattern(params.query)}%,email.ilike.%${escapeLikePattern(params.query)}%,headline.ilike.%${escapeLikePattern(params.query)}%,current_title.ilike.%${escapeLikePattern(params.query)}%`);
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

export async function getMandates(params?: { status?: string; limit?: number; offset?: number; }): Promise<{ data: Mandate[]; count: number }> {
  const sb = getSupabase();
  let q = sb.from('mandates').select('*, company:companies(*)', { count: 'exact' });
  if (params?.status) q = q.eq('status', params.status);
  q = q.range(params?.offset ?? 0, (params?.offset ?? 0) + (params?.limit ?? 50) - 1).order('updated_at', { ascending: false });
  const { data, count, error } = await q;
  if (error) { console.error('[Supabase] getMandates:', error); return { data: [], count: 0 }; }
  const mandates = ((data as Mandate[]) ?? []).map(m => ({ ...m, title: cleanMandateTitle(m.title, m.company?.name) }));
  return { data: mandates, count: count ?? 0 };
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

export async function getCompanies(params?: { industry?: string; limit?: number; }): Promise<Company[]> {
  const sb = getSupabase();
  let q = sb.from('companies').select('*');
  if (params?.industry) q = q.eq('industry', params.industry);
  q = q.order('total_contacts', { ascending: false }).limit(params?.limit ?? 100);
  const { data, error } = await q;
  return error ? [] : (data as Company[]) ?? [];
}

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

export async function updatePipelineVerdict(pipelineId: string, verdict: string): Promise<boolean> {
  const { error } = await getSupabase().from('candidates_pipeline').update({ verdict, updated_at: new Date().toISOString() }).eq('id', pipelineId);
  if (error) { console.error('[Supabase] updatePipelineVerdict:', error); return false; }
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
    name: lead.name,
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

export async function logAssessmentGeneration(params: { userId?: string; email: string; toolType: string; assessmentName: string; archetype: string; compositeScore: number | null; gateData?: Record<string, unknown>; }): Promise<boolean> {
  const { error } = await getSupabase().from('ai_generations').insert({ user_id: params.userId || null, tool_type: params.toolType, contact_id: null, mandate_id: null, input_params: JSON.stringify(params.gateData ?? {}), output_text: `${params.assessmentName} — Archetype: ${params.archetype}, Composite: ${params.compositeScore ?? 'N/A'}`, confidence: params.compositeScore != null ? Math.round(params.compositeScore) : null, model: params.assessmentName, tokens_used: null });
  return !error;
}

export async function logScoringRun(params: { userId?: string; mandateId?: string; contactId?: string; runType: string; inputParams?: any; outputScores?: any; compositeScore?: number; verdict?: string; model?: string; }): Promise<boolean> {
  const { error } = await getSupabase().from('scoring_runs').insert({ user_id: params.userId || null, mandate_id: params.mandateId || null, contact_id: params.contactId || null, run_type: params.runType, input_params: params.inputParams ? JSON.stringify(params.inputParams) : null, output_scores: params.outputScores ? JSON.stringify(params.outputScores) : null, composite_score: params.compositeScore ?? null, verdict: params.verdict || null, model: params.model || null });
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
