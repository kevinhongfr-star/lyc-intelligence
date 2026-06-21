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