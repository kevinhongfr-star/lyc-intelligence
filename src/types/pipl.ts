// Phase 5.7: PIPL Compliance Type Definitions

export type DataSubjectType = 'candidate' | 'client_contact' | 'user';

export type LegalBasis =
  | 'consent'
  | 'contract_performance'
  | 'legal_obligation'
  | 'public_interest'
  | 'legitimate_interest';

export type ConsentPurpose =
  | 'recruitment_matching'
  | 'marketing'
  | 'cross_border_transfer'
  | 'sensitive_data_processing'
  | 'assessment_processing'
  | 'communication'
  | string;

export interface DataConsent {
  id: string;
  org_id: string;
  data_subject_type: DataSubjectType;
  data_subject_id: string;
  purpose: string;
  legal_basis: LegalBasis;
  consent_given: boolean;
  consent_text: string;
  consent_version: number;
  granted_at: string | null;
  withdrawn_at: string | null;
  expires_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export type DataCategory = 'standard' | 'sensitive' | 'biometric' | 'financial' | 'minor';

export interface DataResidencyTag {
  id: string;
  org_id: string;
  entity_type: string;
  entity_id: string;
  country_code: string;
  is_china_resident: boolean;
  data_category: DataCategory;
  created_at: string;
  updated_at: string;
}

export type TransferType =
  | 'api_response'
  | 'backup_replication'
  | 'analytics_export'
  | 'manual_export';

export interface CrossBorderTransfer {
  id: string;
  org_id: string;
  transfer_type: TransferType;
  data_subject_count: number;
  destination_country: string;
  legal_basis: string;
  description: string | null;
  created_at: string;
}

export type RequestType =
  | 'access'
  | 'correction'
  | 'deletion'
  | 'portability'
  | 'withdraw_consent';

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface DataSubjectRequest {
  id: string;
  org_id: string;
  request_type: RequestType;
  data_subject_type: DataSubjectType;
  data_subject_id: string;
  status: RequestStatus;
  request_details: Record<string, unknown> | null;
  response_details: Record<string, unknown> | null;
  requested_at: string;
  due_at: string;
  completed_at: string | null;
  completed_by: string | null;
  rejection_reason: string | null;
}

export interface ClassificationResult {
  category: DataCategory;
  requires_separate_consent: boolean;
  requires_dpia: boolean;
  cross_border_restricted: boolean;
}

export interface ConsentCheckResult {
  valid: boolean;
  consent_id?: string;
  reason?: string;
}

export const PIPL_CONSENT_PURPOSES: Record<string, string> = {
  recruitment_matching: 'Recruitment matching and assessment',
  marketing: 'Marketing and promotional communications',
  cross_border_transfer: 'Cross-border data transfer',
  sensitive_data_processing: 'Sensitive personal data processing',
  assessment_processing: 'Psychometric and skills assessment processing',
  communication: 'General communication about services',
};

export const LEGAL_BASIS_LABELS: Record<LegalBasis, string> = {
  consent: 'Consent',
  contract_performance: 'Contract performance',
  legal_obligation: 'Legal obligation',
  public_interest: 'Public interest',
  legitimate_interest: 'Legitimate interest',
};

export const DATA_CATEGORY_LABELS: Record<DataCategory, string> = {
  standard: 'Standard',
  sensitive: 'Sensitive',
  biometric: 'Biometric',
  financial: 'Financial',
  minor: 'Minor (under 14)',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  access: 'Right to Access',
  correction: 'Right to Correction',
  deletion: 'Right to Deletion',
  portability: 'Right to Portability',
  withdraw_consent: 'Withdraw Consent',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
};

export const SENSITIVE_FIELD_MAP: Record<string, DataCategory> = {
  // Biometric
  face_photo: 'biometric',
  photo: 'biometric',
  fingerprint: 'biometric',
  voice_sample: 'biometric',
  avatar_url: 'biometric',

  // Financial
  salary_current: 'financial',
  salary_expected: 'financial',
  current_compensation: 'financial',
  expected_compensation: 'financial',
  bank_account: 'financial',
  tax_id: 'financial',
  equity_holdings: 'financial',
  compensation: 'financial',
  bonus: 'financial',
  salary: 'financial',

  // Sensitive (general)
  health_conditions: 'sensitive',
  disability_status: 'sensitive',
  religious_belief: 'sensitive',
  political_affiliation: 'sensitive',
  medical_history: 'sensitive',
  background_check: 'sensitive',
  criminal_record: 'sensitive',
};

export const PIPL_DEFAULT_CONFIG = {
  consent_expiry_days: 365,
  request_sla_days: 15,
  cross_border_legal_basis: 'standard_contract',
  data_residency_mode: 'logical_partition',
};
