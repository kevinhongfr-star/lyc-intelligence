// Phase 4.6: Alumni Referral Logic

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AlumniReferral } from './engine';

// ═══════════════════════════════════════════════════════════════
// REFERRAL ATTRIBUTION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Create alumni referral
 */
export async function createReferral(
  supabase: SupabaseClient,
  alumniId: string,
  orgId: string,
  referredName: string,
  referredEmail?: string,
  referredPhone?: string,
  mandateId?: string,
  notes?: string
): Promise<AlumniReferral | null> {
  const { data, error } = await supabase
    .from('alumni_referrals')
    .insert({
      alumni_id: alumniId,
      org_id: orgId,
      referred_name: referredName,
      referred_email: referredEmail,
      referred_phone: referredPhone,
      mandate_id: mandateId,
      referral_date: new Date().toISOString(),
      status: 'received',
      referral_source: 'alumni',
      notes,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as AlumniReferral;
}

/**
 * Update referral status
 */
export async function updateReferralStatus(
  supabase: SupabaseClient,
  referralId: string,
  status: AlumniReferral['status'],
  referredCandidateId?: string
): Promise<AlumniReferral | null> {
  const updates: Record<string, any> = { status };
  
  if (referredCandidateId) {
    updates.referred_candidate_id = referredCandidateId;
  }

  // If placed, mark fee as owed
  if (status === 'placed') {
    updates.referral_fee_owed = true;
    // Calculate fee based on mandate (simplified)
    updates.referral_fee_amount = 25000; // Placeholder
  }

  const { data, error } = await supabase
    .from('alumni_referrals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', referralId)
    .select()
    .single();

  if (error || !data) return null;
  return data as AlumniReferral;
}

/**
 * Get referrals for alumni
 */
export async function getAlumniReferrals(
  supabase: SupabaseClient,
  alumniId: string
): Promise<AlumniReferral[]> {
  const { data, error } = await supabase
    .from('alumni_referrals')
    .select('*')
    .eq('alumni_id', alumniId)
    .order('referral_date', { ascending: false });

  if (error || !data) return [];
  return data as AlumniReferral[];
}

/**
 * Get all referrals for organization
 */
export async function getOrganizationReferrals(
  supabase: SupabaseClient,
  orgId: string,
  status?: string
): Promise<AlumniReferral[]> {
  let query = supabase
    .from('alumni_referrals')
    .select('*')
    .eq('org_id', orgId)
    .order('referral_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AlumniReferral[];
}

/**
 * Calculate referral conversion rate
 */
export async function calculateReferralMetrics(
  supabase: SupabaseClient,
  orgId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total_referrals: number;
  placed_count: number;
  conversion_rate: number;
  total_fees_owed: number;
}> {
  let query = supabase
    .from('alumni_referrals')
    .select('status, referral_fee_amount')
    .eq('org_id', orgId);

  if (startDate) {
    query = query.gte('referral_date', startDate);
  }
  if (endDate) {
    query = query.lte('referral_date', endDate);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { total_referrals: 0, placed_count: 0, conversion_rate: 0, total_fees_owed: 0 };
  }

  const total_referrals = data.length;
  const placed_count = data.filter((r: any) => r.status === 'placed').length;
  const conversion_rate = total_referrals > 0 ? Math.round((placed_count / total_referrals) * 100) : 0;
  const total_fees_owed = data
    .filter((r: any) => r.referral_fee_owed)
    .reduce((sum: number, r: any) => sum + (r.referral_fee_amount || 0), 0);

  return { total_referrals, placed_count, conversion_rate, total_fees_owed };
}

/**
 * Track referral attribution
 */
export async function trackReferralAttribution(
  supabase: SupabaseClient,
  referralId: string,
  candidateId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('alumni_referrals')
    .update({ referred_candidate_id: candidateId })
    .eq('id', referralId);

  return !error;
}

export default {
  createReferral,
  updateReferralStatus,
  getAlumniReferrals,
  getOrganizationReferrals,
  calculateReferralMetrics,
  trackReferralAttribution,
};