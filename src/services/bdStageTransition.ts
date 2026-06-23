// Phase 2.8: BD Stage Transition Service
// Validates and executes stage transitions for BD opportunities

import type { SupabaseClient } from '@supabase/supabase-js';
import { VALID_TRANSITIONS, STAGE_LABELS } from '@/types/bd';
import type { BDStage, StageTransitionMetadata, BDOpportunity } from '@/types/bd';

/**
 * Validate if a stage transition is allowed
 */
export function isValidTransition(fromStage: BDStage, toStage: BDStage): boolean {
  const allowed = VALID_TRANSITIONS[fromStage];
  return allowed ? allowed.includes(toStage) : false;
}

/**
 * Get valid next stages for a given current stage
 */
export function getValidNextStages(currentStage: BDStage): BDStage[] {
  return VALID_TRANSITIONS[currentStage] || [];
}

/**
 * Transition a BD opportunity to a new stage
 */
export async function transitionStage(
  supabase: SupabaseClient,
  opportunityId: string,
  orgId: string,
  newStage: BDStage,
  userId: string,
  metadata?: StageTransitionMetadata
): Promise<{ success: boolean; error?: string; data?: BDOpportunity }> {
  // Get current stage
  const { data: opp, error: fetchError } = await supabase
    .from('bd_opportunities')
    .select('*')
    .eq('id', opportunityId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !opp) {
    return { success: false, error: 'Opportunity not found' };
  }

  const currentStage = opp.stage as BDStage;

  // Validate transition
  if (!isValidTransition(currentStage, newStage)) {
    return {
      success: false,
      error: `Invalid transition: ${STAGE_LABELS[currentStage]} → ${STAGE_LABELS[newStage]}`,
    };
  }

  // Build updates
  const updates: Record<string, unknown> = {
    stage: newStage,
    updated_at: new Date().toISOString(),
  };

  switch (newStage) {
    case 'qualified':
      updates.qualified_at = new Date().toISOString();
      break;
    case 'proposal_sent':
      updates.proposal_sent_at = new Date().toISOString();
      break;
    case 'pitch_delivered':
      updates.pitch_delivered_at = new Date().toISOString();
      break;
    case 'signed':
      updates.signed_at = new Date().toISOString();
      if (metadata?.mandate_id) {
        updates.mandate_id = metadata.mandate_id;
      }
      break;
    case 'lost':
      updates.lost_at = new Date().toISOString();
      if (metadata?.lost_reason) {
        updates.lost_reason = metadata.lost_reason;
      }
      if (metadata?.competitor) {
        updates.competitor_firm = metadata.competitor;
      }
      break;
    case 'deferred':
      if (metadata?.deferred_until) {
        updates.deferred_until = metadata.deferred_until;
      }
      break;
  }

  // Update opportunity
  const { data: updatedOpp, error: updateError } = await supabase
    .from('bd_opportunities')
    .update(updates)
    .eq('id', opportunityId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log activity
  try {
    await supabase.from('bd_activities').insert({
      org_id: orgId,
      opportunity_id: opportunityId,
      activity_type: 'stage_change',
      description: `Stage changed: ${STAGE_LABELS[currentStage]} → ${STAGE_LABELS[newStage]}`,
      outcome: metadata?.lost_reason
        ? `Reason: ${metadata.lost_reason}`
        : undefined,
      performed_by: userId,
    });
  } catch (activityError) {
    console.error('[bdStageTransition] Failed to log activity:', activityError);
  }

  return { success: true, data: updatedOpp as BDOpportunity };
}

/**
 * Calculate days spent in current stage
 */
export function getDaysInStage(opportunity: BDOpportunity): number {
  const now = new Date();
  let stageStartDate: Date | null = null;

  switch (opportunity.stage) {
    case 'prospect':
      stageStartDate = new Date(opportunity.created_at);
      break;
    case 'qualified':
      if (opportunity.qualified_at) stageStartDate = new Date(opportunity.qualified_at);
      break;
    case 'proposal_sent':
      if (opportunity.proposal_sent_at) stageStartDate = new Date(opportunity.proposal_sent_at);
      break;
    case 'pitch_delivered':
      if (opportunity.pitch_delivered_at) stageStartDate = new Date(opportunity.pitch_delivered_at);
      break;
    case 'negotiate':
      if (opportunity.pitch_delivered_at) stageStartDate = new Date(opportunity.pitch_delivered_at);
      break;
    case 'signed':
      if (opportunity.signed_at) stageStartDate = new Date(opportunity.signed_at);
      break;
    case 'lost':
      if (opportunity.lost_at) stageStartDate = new Date(opportunity.lost_at);
      break;
    default:
      stageStartDate = new Date(opportunity.created_at);
  }

  if (!stageStartDate) return 0;

  const diffMs = now.getTime() - stageStartDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default {
  isValidTransition,
  getValidNextStages,
  transitionStage,
  getDaysInStage,
};
