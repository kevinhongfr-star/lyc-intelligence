// Phase 4.6: Alumni Referral Logic

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AlumniReferral } from './engine';

// ═══════════════════════════════════════════════════════════════
// REFERRAL FEE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Referral fee policy.
 *
 * Resolution order (first match wins):
 *   1. org_settings.referral_fee_pct  → percentage of mandate fee_amount
 *   2. org_settings.referral_fee_flat  → flat amount in USD
 *   3. DEFAULT_REFERRAL_FEE_FLAT       → safety-net flat fee
 */
const DEFAULT_REFERRAL_FEE_PCT = 0.10; // 10% of mandate fee
const DEFAULT_REFERRAL_FEE_FLAT = 5000; // $5,000 fallback

interface OrgReferralFeeConfig {
  fee_pct: number | null;
  fee_flat: number | null;
}

/**
 * Look up org-level referral fee config from the `org_settings` table.
 * Returns nulls when no overrides are configured so callers can fall back
 * to the mandate-percentage or default-flat logic.
 */
async function getOrgReferralFeeConfig(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgReferralFeeConfig> {
  try {
    const { data, error } = await supabase
      .from('org_settings')
      .select('referral_fee_pct, referral_fee_flat')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error || !data) {
      return { fee_pct: null, fee_flat: null };
    }

    return {
      fee_pct: typeof data.referral_fee_pct === 'number' ? data.referral_fee_pct : null,
      fee_flat: typeof data.referral_fee_flat === 'number' ? data.referral_fee_flat : null,
    };
  } catch {
    return { fee_pct: null, fee_flat: null };
  }
}

/**
 * Look up the mandate's fee_amount. Returns null when unavailable.
 */
async function getMandateFeeAmount(
  supabase: SupabaseClient,
  mandateId: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('mandates')
      .select('fee_amount, fee_type')
      .eq('id', mandateId)
      .maybeSingle();

    if (error || !data) return null;
    const fee = Number(data.fee_amount);
    return Number.isFinite(fee) && fee > 0 ? fee : null;
  } catch {
    return null;
  }
}

/**
 * Calculate the referral fee owed for a placed referral.
 *
 * Resolution:
 *   1. If org has a flat override  → use it
 *   2. Else if mandate has fee_amount and org has pct override → pct * fee_amount
 *   3. Else if mandate has fee_amount → DEFAULT_REFERRAL_FEE_PCT * fee_amount
 *   4. Else → DEFAULT_REFERRAL_FEE_FLAT
 */
export async function calculateReferralFee(
  supabase: SupabaseClient,
  orgId: string,
  mandateId: string | null | undefined
): Promise<number> {
  const orgConfig = await getOrgReferralFeeConfig(supabase, orgId);

  // 1. Org-level flat override wins outright
  if (orgConfig.fee_flat != null) {
    return orgConfig.fee_flat;
  }

  // 2 & 3. Percentage of mandate fee
  if (mandateId) {
    const mandateFee = await getMandateFeeAmount(supabase, mandateId);
    if (mandateFee != null) {
      const pct = orgConfig.fee_pct ?? DEFAULT_REFERRAL_FEE_PCT;
      return Math.round(mandateFee * pct);
    }
  }

  // 4. Safety-net flat default
  return DEFAULT_REFERRAL_FEE_FLAT;
}

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

  // If placed, calculate fee from org config + mandate fee_amount
  if (status === 'placed') {
    updates.referral_fee_owed = true;
    // Fetch the existing referral to get org_id + mandate_id for fee calc
    const { data: existing } = await supabase
      .from('alumni_referrals')
      .select('org_id, mandate_id')
      .eq('id', referralId)
      .maybeSingle();

    if (existing) {
      updates.referral_fee_amount = await calculateReferralFee(
        supabase,
        existing.org_id,
        existing.mandate_id
      );
    }
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
  calculateReferralFee,
  createReferral,
  updateReferralStatus,
  getAlumniReferrals,
  getOrganizationReferrals,
  calculateReferralMetrics,
  trackReferralAttribution,
};