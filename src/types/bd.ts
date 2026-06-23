// Phase 2.8: BD Pipeline Type Definitions

export type BDStage =
  | 'prospect'
  | 'qualified'
  | 'proposal_sent'
  | 'pitch_delivered'
  | 'negotiate'
  | 'signed'
  | 'lost'
  | 'deferred';

export type CompanySize = 'startup' | 'mid_market' | 'enterprise' | 'mnc';

export type OpportunityType = 'retained' | 'contingent' | 'exclusive' | 'non_exclusive';

export type FeeStructure = 'percentage' | 'fixed' | 'retainer_plus_success';

export type BDSource = 'referral' | 'networking' | 'inbound' | 'cold_outreach' | 'repeat_client';

export type LostReason = 'budget' | 'timing' | 'competitor' | 'internal' | 'no_response';

export interface BDOpportunity {
  id: string;
  org_id: string;

  company_name: string;
  industry: string | null;
  company_size: CompanySize | null;
  country: string;
  city: string | null;
  website: string | null;

  primary_contact_name: string;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  primary_contact_title: string | null;
  linkedin_url: string | null;

  stage: BDStage;
  opportunity_type: OpportunityType | null;
  estimated_roles: number;
  estimated_fee_total: number | null;
  estimated_fee_currency: string;
  fee_structure: FeeStructure | null;

  owner_id: string;
  team_members: string[];

  source: BDSource | null;
  source_detail: string | null;

  created_at: string;
  updated_at: string;
  qualified_at: string | null;
  proposal_sent_at: string | null;
  pitch_delivered_at: string | null;
  signed_at: string | null;
  lost_at: string | null;
  deferred_until: string | null;

  lost_reason: LostReason | null;
  competitor_firm: string | null;
  notes: string | null;

  mandate_id: string | null;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'lunch'
  | 'networking_event'
  | 'proposal_sent'
  | 'follow_up'
  | 'note'
  | 'stage_change';

export interface BDActivity {
  id: string;
  org_id: string;
  opportunity_id: string;
  activity_type: ActivityType;
  description: string;
  outcome: string | null;
  performed_by: string;
  performed_at: string;
  contact_id: string | null;
  related_document_id: string | null;
}

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'superseded';

export interface BDProposal {
  id: string;
  org_id: string;
  opportunity_id: string;
  title: string;
  version: number;
  status: ProposalStatus;

  fee_structure: string | null;
  fee_amount: number | null;
  fee_currency: string;
  payment_terms: string | null;
  guarantee_period_months: number;

  role_count: number;
  scope_description: string | null;
  timeline_weeks: number | null;

  document_url: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface BDPipelineMetrics {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;

  new_prospects: number;
  new_qualified: number;
  proposals_sent: number;
  pitches_delivered: number;
  signed: number;
  lost: number;

  prospect_to_qualified_pct: number | null;
  qualified_to_signed_pct: number | null;
  overall_win_rate_pct: number | null;

  total_pipeline_value: number | null;
  signed_value: number | null;
  avg_deal_size: number | null;

  created_at: string;
}

export interface StageTransitionMetadata {
  lost_reason?: LostReason;
  competitor?: string;
  deferred_until?: string;
  mandate_id?: string;
}

export const STAGE_LABELS: Record<BDStage, string> = {
  prospect: 'Prospect',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  pitch_delivered: 'Pitch Delivered',
  negotiate: 'Negotiate',
  signed: 'Signed',
  lost: 'Lost',
  deferred: 'Deferred',
};

export const STAGE_ORDER: BDStage[] = [
  'prospect',
  'qualified',
  'proposal_sent',
  'pitch_delivered',
  'negotiate',
  'signed',
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  lunch: 'Lunch',
  networking_event: 'Networking Event',
  proposal_sent: 'Proposal Sent',
  follow_up: 'Follow-up',
  note: 'Note',
  stage_change: 'Stage Change',
};

export const VALID_TRANSITIONS: Record<BDStage, BDStage[]> = {
  prospect: ['qualified', 'lost', 'deferred'],
  qualified: ['proposal_sent', 'lost', 'deferred'],
  proposal_sent: ['pitch_delivered', 'negotiate', 'lost', 'deferred'],
  pitch_delivered: ['negotiate', 'lost', 'deferred'],
  negotiate: ['signed', 'lost', 'deferred'],
  signed: [],
  lost: [],
  deferred: ['prospect', 'qualified'],
};
