// Phase 4.6: Alumni Lifecycle Engine

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Alumni {
  id: string;
  candidate_id: string;
  org_id: string;
  placement_mandate_id: string;
  placement_date: string;
  company_name: string;
  job_title: string;
  guarantee_end_date: string;
  guarantee_status: 'active' | 'completed' | 'claimed' | 'failed';
  alumni_status: 'active' | 'inactive' | 'unresponsive';
  last_engagement_date: string | null;
  engagement_count: number;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniEngagement {
  id: string;
  alumni_id: string;
  org_id: string;
  engagement_type: 'email' | 'call' | 'meeting' | 'event' | 'referral_request' | 'opportunity_discussion';
  engagement_date: string;
  initiated_by: string | null;
  summary: string | null;
  outcome: 'positive' | 'neutral' | 'negative' | 'no_response' | null;
  follow_up_date: string | null;
  created_at: string;
}

export interface GuaranteePeriod {
  id: string;
  alumni_id: string;
  org_id: string;
  mandate_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  status: 'active' | 'completed' | 'claimed' | 'disputed';
  check_in_dates: string[];
  check_ins_completed: Array<{ date: string; status: string; notes: string; consultant_id: string }>;
  fee_refund_pct: number | null;
  dispute_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniReferral {
  id: string;
  alumni_id: string;
  org_id: string;
  referred_candidate_id: string | null;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  mandate_id: string | null;
  referral_date: string;
  status: 'received' | 'screening' | 'submitted' | 'interviewing' | 'placed' | 'rejected';
  referral_source: 'alumni' | 'client' | 'consultant';
  referral_fee_owed: boolean;
  referral_fee_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniCampaign {
  id: string;
  org_id: string;
  campaign_name: string;
  campaign_type: 'opportunity_match' | 'industry_newsletter' | 'event_invitation' | 'general_checkin';
  target_tags: string[];
  target_companies: string[];
  message_template: string;
  send_date: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  sent_count: number;
  response_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// ALUMNI ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate days remaining in guarantee period
 */
export function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate guarantee progress percentage
 */
export function calculateGuaranteeProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  const total = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/**
 * Generate check-in dates for guarantee period
 */
export function generateCheckInDates(startDate: string, durationMonths: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  
  // Check-ins at 30, 60, 90, 120, 150, 180 days
  for (let i = 30; i <= durationMonths * 30; i += 30) {
    const checkInDate = new Date(start);
    checkInDate.setDate(checkInDate.getDate() + i);
    dates.push(checkInDate.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Determine guarantee status based on dates
 */
export function determineGuaranteeStatus(endDate: string): 'active' | 'completed' {
  const end = new Date(endDate);
  const today = new Date();
  
  return end > today ? 'active' : 'completed';
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ═══════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create alumni record
 */
export async function createAlumni(
  supabase: SupabaseClient,
  candidateId: string,
  orgId: string,
  mandateId: string,
  placementDate: string,
  companyName: string,
  jobTitle: string,
  guaranteeMonths: number = 3
): Promise<Alumni | null> {
  const placement = new Date(placementDate);
  const guaranteeEnd = new Date(placement);
  guaranteeEnd.setMonth(guaranteeEnd.getMonth() + guaranteeMonths);

  const { data, error } = await supabase
    .from('alumni')
    .insert({
      candidate_id: candidateId,
      org_id: orgId,
      placement_mandate_id: mandateId,
      placement_date: placementDate,
      company_name: companyName,
      job_title: jobTitle,
      guarantee_end_date: guaranteeEnd.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error || !data) return null;

  // Create guarantee period
  const checkInDates = generateCheckInDates(placementDate, guaranteeMonths);
  
  await supabase.from('guarantee_periods').insert({
    alumni_id: data.id,
    org_id: orgId,
    mandate_id: mandateId,
    start_date: placementDate,
    end_date: guaranteeEnd.toISOString().split('T')[0],
    duration_months: guaranteeMonths,
    check_in_dates: checkInDates,
  });

  return data as Alumni;
}

/**
 * Get alumni by ID
 */
export async function getAlumniById(
  supabase: SupabaseClient,
  alumniId: string
): Promise<Alumni | null> {
  const { data, error } = await supabase
    .from('alumni')
    .select('*')
    .eq('id', alumniId)
    .single();

  if (error || !data) return null;
  return data as Alumni;
}

/**
 * Search alumni
 */
export async function searchAlumni(
  supabase: SupabaseClient,
  orgId: string,
  filters: {
    companyName?: string;
    jobTitle?: string;
    tags?: string[];
    status?: string;
    query?: string;
  }
): Promise<Alumni[]> {
  let query = supabase.from('alumni').select('*').eq('org_id', orgId);

  if (filters.companyName) {
    query = query.ilike('company_name', `%${filters.companyName}%`);
  }
  if (filters.jobTitle) {
    query = query.ilike('job_title', `%${filters.jobTitle}%`);
  }
  if (filters.status) {
    query = query.eq('alumni_status', filters.status);
  }
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => {
      query = query.overlaps('tags', [tag]);
    });
  }
  if (filters.query) {
    query = query.or(
      `company_name.ilike.%${filters.query}%,job_title.ilike.%${filters.query}%,notes.ilike.%${filters.query}%`
    );
  }

  const { data, error } = await query.order('placement_date', { ascending: false });
  if (error || !data) return [];
  return data as Alumni[];
}

/**
 * Update alumni record
 */
export async function updateAlumni(
  supabase: SupabaseClient,
  alumniId: string,
  updates: Partial<Alumni>
): Promise<Alumni | null> {
  const { data, error } = await supabase
    .from('alumni')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', alumniId)
    .select()
    .single();

  if (error || !data) return null;
  return data as Alumni;
}

/**
 * Log engagement
 */
export async function logEngagement(
  supabase: SupabaseClient,
  alumniId: string,
  orgId: string,
  engagementType: AlumniEngagement['engagement_type'],
  initiatedBy: string,
  summary: string,
  outcome?: AlumniEngagement['outcome'],
  followUpDate?: string
): Promise<AlumniEngagement | null> {
  const { data, error } = await supabase
    .from('alumni_engagements')
    .insert({
      alumni_id: alumniId,
      org_id: orgId,
      engagement_type: engagementType,
      engagement_date: new Date().toISOString(),
      initiated_by: initiatedBy,
      summary,
      outcome,
      follow_up_date: followUpDate,
    })
    .select()
    .single();

  if (error || !data) return null;

  // Update alumni engagement count and last engagement date
  await supabase
    .from('alumni')
    .update({
      engagement_count: supabase.raw('engagement_count + 1'),
      last_engagement_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', alumniId);

  return data as AlumniEngagement;
}

/**
 * Get alumni engagements
 */
export async function getAlumniEngagements(
  supabase: SupabaseClient,
  alumniId: string
): Promise<AlumniEngagement[]> {
  const { data, error } = await supabase
    .from('alumni_engagements')
    .select('*')
    .eq('alumni_id', alumniId)
    .order('engagement_date', { ascending: false });

  if (error || !data) return [];
  return data as AlumniEngagement[];
}

/**
 * Get guarantee period
 */
export async function getGuaranteePeriod(
  supabase: SupabaseClient,
  alumniId: string
): Promise<GuaranteePeriod | null> {
  const { data, error } = await supabase
    .from('guarantee_periods')
    .select('*')
    .eq('alumni_id', alumniId)
    .single();

  if (error || !data) return null;
  return data as GuaranteePeriod;
}

/**
 * Record guarantee check-in
 */
export async function recordCheckIn(
  supabase: SupabaseClient,
  guaranteeId: string,
  checkInDate: string,
  status: string,
  notes: string,
  consultantId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('guarantee_periods')
    .update({
      check_ins_completed: supabase.raw(`array_append(check_ins_completed, '${JSON.stringify({ date: checkInDate, status, notes, consultant_id: consultantId })}')`),
    })
    .eq('id', guaranteeId);

  return !error;
}

/**
 * Update guarantee status
 */
export async function updateGuaranteeStatus(
  supabase: SupabaseClient,
  guaranteeId: string,
  status: GuaranteePeriod['status'],
  feeRefundPct?: number,
  disputeNotes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('guarantee_periods')
    .update({
      status,
      fee_refund_pct: feeRefundPct,
      dispute_notes: disputeNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guaranteeId);

  if (!error && status !== 'active') {
    // Also update alumni guarantee status
    const { data: guarantee } = await supabase
      .from('guarantee_periods')
      .select('alumni_id')
      .eq('id', guaranteeId)
      .single();

    if (guarantee) {
      await supabase
        .from('alumni')
        .update({ guarantee_status: status })
        .eq('id', guarantee.alumni_id);
    }
  }

  return !error;
}

export default {
  calculateDaysRemaining,
  calculateGuaranteeProgress,
  generateCheckInDates,
  determineGuaranteeStatus,
  formatDate,
  createAlumni,
  getAlumniById,
  searchAlumni,
  updateAlumni,
  logEngagement,
  getAlumniEngagements,
  getGuaranteePeriod,
  recordCheckIn,
  updateGuaranteeStatus,
};