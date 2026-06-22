export type UserRole =
  | 'candidate'
  | 'member'
  | 'council'
  | 'client_admin'
  | 'client_viewer'
  | 'lyc_consultant'
  | 'lyc_admin'
  | 'super_admin';

export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  'user': 'member',
  'admin': 'super_admin',
};

export type ICP = 'client' | 'consultant' | 'leader' | 'candidate';

export type AssessmentType = string;

export interface AssessmentReport {
  title: string;
  summary: string;
  sections: Array<{heading:string; content:string}>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  icp: ICP;
  role: UserRole;
}

// ─── Mandate Intake (Phase 1.1) ────────────────────────────────────

export type PainSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FrictionArea = 'org structure' | 'talent gaps' | 'leadership' | 'culture';
export type LeadershipPriority = 'must-have' | 'nice-to-have';

export interface PainPoint {
  pain: string;
  severity: PainSeverity;
  impact: string;
}

export interface FrictionIssue {
  issue: string;
  area: FrictionArea;
  detail: string;
}

export interface LeadershipQuality {
  quality: string;
  why: string;
  priority: LeadershipPriority;
}

export interface SkillGap {
  skill: string;
  current_level: string;
  required_level: string;
}

export interface TalentDensityIssue {
  area: string;
  current_density: string;
  target_density: string;
}

export interface IntakeData {
  pain_points: PainPoint[];
  org_friction: FrictionIssue[];
  leadership_needs: LeadershipQuality[];
  skills_gaps: SkillGap[];
  talent_density_issues: TalentDensityIssue[];
  discovered_by?: string | null;
  discovery_date?: string | null;
  client_interview_notes?: string | null;
  intake_complete: boolean;
}

export const DEFAULT_INTAKE: IntakeData = {
  pain_points: [],
  org_friction: [],
  leadership_needs: [],
  skills_gaps: [],
  talent_density_issues: [],
  discovered_by: null,
  discovery_date: new Date().toISOString().slice(0, 10),
  client_interview_notes: null,
  intake_complete: false,
};

// ─── Success Profile (Phase 1.2) ────────────────────────────────────

export type DiscProfile = 'D' | 'i' | 'S' | 'C' | 'mixed';
export type CharacterLevel = 'essential' | 'preferred' | 'nice-to-have';
export type LanguageLevel = 'native' | 'fluent' | 'conversational';
export type ProfileStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface PersonalityIndicator {
  trait: string;
  importance: number; // 1-5
  evidence: string;
}

export interface CharacterRequirement {
  trait: string;
  level: CharacterLevel;
}

export interface EducationRequirement {
  degree: string;
  field: string;
  required: boolean;
}

export interface LanguageRequirement {
  language: string;
  level: LanguageLevel;
}

export interface SuccessProfile {
  id: string;
  mandate_id: string;
  // Experience
  required_experience_years?: number | null;
  required_industries?: string[] | null;
  required_geographies?: string[] | null;
  required_companies?: string[] | null;
  deal_size_range?: string | null;
  team_size_managed?: number | null;
  // Personality
  target_disc_profile?: DiscProfile | null;
  personality_indicators?: PersonalityIndicator[] | null;
  character_requirements?: CharacterRequirement[] | null;
  // Background
  education_requirements?: EducationRequirement[] | null;
  certifications?: string[] | null;
  language_requirements?: LanguageRequirement[] | null;
  // Metadata
  status: ProfileStatus;
  defined_by?: string | null;
  approved_by?: string | null;
  approval_notes?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Outreach Tracking (Phase 1.4) ──

export type OutreachChannel =
  | 'cold_call'
  | 'wechat_add'
  | 'email'
  | 'linkedin_message'
  | 'phone_call'
  | 'in_person';

export type OutreachOutcome =
  | 'no_response'
  | 'positive'
  | 'negative'
  | 'interested'
  | 'not_interested'
  | 'scheduled_interview'
  | 'referred_other'
  | 'invalid_contact';

export interface OutreachAttempt {
  id: string;
  candidate_id: string;
  mandate_id: string;
  channel: OutreachChannel;
  attempt_number: number;
  attempt_date: string;
  outcome?: OutreachOutcome | null;
  response_text?: string | null;
  notes?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  created_by?: string | null;
  organization_id?: string | null;
  created_at: string;
}

export const CHANNEL_LABELS: Record<OutreachChannel, string> = {
  cold_call: 'Cold Call',
  wechat_add: 'WeChat',
  email: 'Email',
  linkedin_message: 'LinkedIn',
  phone_call: 'Phone Call',
  in_person: 'In Person',
};

export const OUTCOME_LABELS: Record<OutreachOutcome, string> = {
  no_response: 'No Response',
  positive: 'Positive',
  negative: 'Negative',
  interested: 'Interested',
  not_interested: 'Not Interested',
  scheduled_interview: 'Interview Scheduled',
  referred_other: 'Referred Others',
  invalid_contact: 'Invalid Contact',
};

export const CHANNEL_ICON_LABELS: Record<OutreachChannel, string> = {
  cold_call: '📞',
  wechat_add: '💬',
  email: '✉️',
  linkedin_message: 'in',
  phone_call: '☎️',
  in_person: '👥',
};

export const DEFAULT_SUCCESS_PROFILE: Partial<SuccessProfile> = {
  required_experience_years: 10,
  required_industries: [],
  required_geographies: [],
  required_companies: [],
  deal_size_range: '',
  team_size_managed: 0,
  target_disc_profile: 'mixed',
  personality_indicators: [],
  character_requirements: [],
  education_requirements: [],
  certifications: [],
  language_requirements: [],
  status: 'draft',
};