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