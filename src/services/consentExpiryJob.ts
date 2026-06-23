// Phase 5.7: Consent Expiry Job
// Runs daily via Vercel Cron to deactivate expired consents

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Expire consents that have passed their expiry date.
 * Sets consent_given to false and records withdrawal time.
 * Returns count of expired consents.
 */
export async function expireConsents(
  supabase: SupabaseClient
): Promise<number> {
  const now = new Date().toISOString();

  try {
    // Find expiring consents first for audit log
    const { data: expiring, error: findError } = await supabase
      .from('data_consents')
      .select('id, org_id, data_subject_type, data_subject_id, purpose')
      .lte('expires_at', now)
      .eq('consent_given', true)
      .is('withdrawn_at', null);

    if (findError) {
      console.error('[consentExpiry] Failed to find expiring consents:', findError);
      return 0;
    }

    if (!expiring || expiring.length === 0) {
      console.log('[consentExpiry] No consents to expire');
      return 0;
    }

    // Bulk update expired consents
    const { error: updateError } = await supabase
      .from('data_consents')
      .update({
        consent_given: false,
        withdrawn_at: now,
        updated_at: now,
      })
      .in('id', expiring.map(c => c.id));

    if (updateError) {
      console.error('[consentExpiry] Failed to expire consents:', updateError);
      return 0;
    }

    console.log(
      `[consentExpiry] Expired ${expiring.length} consents:`,
      expiring.map(c => `${c.purpose} - ${c.data_subject_type}/${c.data_subject_id}`)
    );

    return expiring.length;
  } catch (error) {
    console.error('[consentExpiry] Unexpected error:', error);
    return 0;
  }
}

/**
 * Find consents that will expire soon (within the given number of days).
 * Used for proactive notifications.
 */
export async function getExpiringConsents(
  supabase: SupabaseClient,
  orgId: string,
  days: number = 30
): Promise<Array<{
  id: string;
  purpose: string;
  data_subject_type: string;
  data_subject_id: string;
  expires_at: string;
}>> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  try {
    const { data, error } = await supabase
      .from('data_consents')
      .select('id, purpose, data_subject_type, data_subject_id, expires_at')
      .eq('org_id', orgId)
      .eq('consent_given', true)
      .is('withdrawn_at', null)
      .gt('expires_at', now.toISOString())
      .lte('expires_at', futureDate.toISOString())
      .order('expires_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as Array<{
      id: string;
      purpose: string;
      data_subject_type: string;
      data_subject_id: string;
      expires_at: string;
    }>;
  } catch (error) {
    console.error('[consentExpiry] Failed to get expiring consents:', error);
    return [];
  }
}

/**
 * Get consent statistics for an organization
 */
export async function getConsentStats(
  supabase: SupabaseClient,
  orgId: string
): Promise<{
  total: number;
  active: number;
  expired: number;
  withdrawn: number;
  expiring_soon: number;
}> {
  const thirtyDaysFromNow = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const now = new Date().toISOString();

  try {
    // Total
    const { count: totalCount } = await supabase
      .from('data_consents')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Active
    const { count: activeCount } = await supabase
      .from('data_consents')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('consent_given', true)
      .is('withdrawn_at', null);

    // Expired
    const { count: expiredCount } = await supabase
      .from('data_consents')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .lte('expires_at', now)
      .eq('consent_given', false)
      .not('withdrawn_at', 'is', null);

    // Withdrawn (excluding expired)
    const { count: withdrawnCount } = await supabase
      .from('data_consents')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('consent_given', false)
      .not('withdrawn_at', 'is', null)
      .gt('expires_at', now);

    // Expiring soon
    const { count: expiringSoonCount } = await supabase
      .from('data_consents')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('consent_given', true)
      .is('withdrawn_at', null)
      .lte('expires_at', thirtyDaysFromNow);

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      expired: expiredCount || 0,
      withdrawn: withdrawnCount || 0,
      expiring_soon: expiringSoonCount || 0,
    };
  } catch (error) {
    console.error('[consentExpiry] Failed to get consent stats:', error);
    return {
      total: 0,
      active: 0,
      expired: 0,
      withdrawn: 0,
      expiring_soon: 0,
    };
  }
}

export default {
  expireConsents,
  getExpiringConsents,
  getConsentStats,
};
