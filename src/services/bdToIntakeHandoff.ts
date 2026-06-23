// Phase 2.8: BD to Intake Handoff Service
// Handles conversion of signed BD opportunities to mandates in the Intake module

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BDOpportunity, BDProposal } from '@/types/bd';

/**
 * Handoff a signed BD opportunity to the Intake module
 * Creates a new mandate and links it back to the opportunity
 */
export async function handoffToIntake(
  supabase: SupabaseClient,
  opportunityId: string,
  orgId: string,
  userId: string
): Promise<{ success: boolean; mandate_id?: string; error?: string }> {
  // Get the opportunity with its proposals
  const { data: opp, error: oppError } = await supabase
    .from('bd_opportunities')
    .select('*')
    .eq('id', opportunityId)
    .eq('org_id', orgId)
    .single();

  if (oppError || !opp) {
    return { success: false, error: 'Opportunity not found' };
  }

  const opportunity = opp as BDOpportunity;

  // Validate stage
  if (opportunity.stage !== 'signed') {
    return { success: false, error: 'Opportunity must be in "signed" stage to handoff' };
  }

  // Check if already handed off
  if (opportunity.mandate_id) {
    return { success: true, mandate_id: opportunity.mandate_id };
  }

  // Get latest proposal for fee details
  const { data: proposals } = await supabase
    .from('bd_proposals')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('version', { ascending: false })
    .limit(1);

  const latestProposal = proposals && proposals.length > 0
    ? (proposals[0] as BDProposal)
    : null;

  try {
    // Create mandate in Phase 1.1 Intake module
    const mandateTitle = buildMandateTitle(opportunity);

    const { data: mandate, error: mandateError } = await supabase
      .from('mandates')
      .insert({
        org_id: orgId,
        title: mandateTitle,
        client_company: opportunity.company_name,
        industry: opportunity.industry,
        location: opportunity.city || opportunity.country,
        city: opportunity.city,
        country: opportunity.country,
        status: 'intake',
        fee_structure: latestProposal?.fee_structure || opportunity.fee_structure,
        total_fee: latestProposal?.fee_amount || opportunity.estimated_fee_total,
        fee_currency: latestProposal?.fee_currency || opportunity.estimated_fee_currency,
        owner_id: opportunity.owner_id,
        source: 'bd_pipeline',
        intake_data: {
          bd_opportunity_id: opportunityId,
          handoff_at: new Date().toISOString(),
          handed_off_by: userId,
          opportunity_type: opportunity.opportunity_type,
          primary_contact: {
            name: opportunity.primary_contact_name,
            email: opportunity.primary_contact_email,
            phone: opportunity.primary_contact_phone,
            title: opportunity.primary_contact_title,
          },
          proposal: latestProposal ? {
            id: latestProposal.id,
            title: latestProposal.title,
            version: latestProposal.version,
            fee_structure: latestProposal.fee_structure,
            fee_amount: latestProposal.fee_amount,
            payment_terms: latestProposal.payment_terms,
            guarantee_period_months: latestProposal.guarantee_period_months,
            role_count: latestProposal.role_count,
            scope_description: latestProposal.scope_description,
            timeline_weeks: latestProposal.timeline_weeks,
          } : null,
        },
      })
      .select()
      .single();

    if (mandateError) {
      return { success: false, error: `Failed to create mandate: ${mandateError.message}` };
    }

    // Link mandate back to BD opportunity
    const { error: updateError } = await supabase
      .from('bd_opportunities')
      .update({
        mandate_id: mandate.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId);

    if (updateError) {
      console.error('[bdToIntakeHandoff] Failed to link mandate to opportunity:', updateError);
    }

    // Log activity
    try {
      await supabase.from('bd_activities').insert({
        org_id: orgId,
        opportunity_id: opportunityId,
        activity_type: 'stage_change',
        description: `Handed off to Intake - Mandate ID: ${mandate.id}`,
        performed_by: userId,
      });
    } catch (activityError) {
      console.error('[bdToIntakeHandoff] Failed to log handoff activity:', activityError);
    }

    return { success: true, mandate_id: mandate.id };
  } catch (error) {
    console.error('[bdToIntakeHandoff] Handoff failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during handoff',
    };
  }
}

/**
 * Build a mandate title from the opportunity data
 */
function buildMandateTitle(opportunity: BDOpportunity): string {
  const parts: string[] = [opportunity.company_name];

  if (opportunity.estimated_roles && opportunity.estimated_roles > 1) {
    parts.push(`${opportunity.estimated_roles} roles`);
  } else if (opportunity.estimated_roles === 1) {
    parts.push('Executive Search');
  } else {
    parts.push('Search Mandate');
  }

  if (opportunity.primary_contact_title) {
    parts.push(`(${opportunity.primary_contact_title})`);
  }

  return parts.join(' — ');
}

/**
 * Check if an opportunity is ready for handoff
 */
export function isReadyForHandoff(opportunity: BDOpportunity): boolean {
  return opportunity.stage === 'signed' && !opportunity.mandate_id;
}

export default {
  handoffToIntake,
  isReadyForHandoff,
};
