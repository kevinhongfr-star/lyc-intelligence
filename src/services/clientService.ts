/**
 * clientService — Client Portal API service layer (Phase 8)
 *
 * All client-side API calls go through this module, which uses authFetch
 * to communicate with the server-enforced ACL endpoints.
 *
 * Endpoints used:
 *   GET  /api/client-portal/mandates
 *   GET  /api/client-portal/mandates/:id/pipeline
 *   GET  /api/client-portal/mandates/:id/activity
 *   GET  /api/client-portal/candidates/:id
 *   GET  /api/client-portal/mandates/:id/shortlist
 *   POST /api/client-portal/candidates/:id/feedback
 *   POST /api/client-portal/mandates/:id/approve
 *   GET  /api/client-portal/interviews
 *   POST /api/client-portal/interviews/:id/feedback
 *   GET  /api/client-portal/documents
 *   GET  /api/client-portal/notifications
 *   POST /api/client-portal/notifications/:id/read
 *   GET  /api/client-portal/preferences
 *   POST /api/client-engagement/nps
 *   GET  /api/client-engagement/nps
 *   POST /api/client-engagement/survey
 *   GET  /api/client-engagement/engagement
 *   GET  /api/client-workflow/workflows
 *   POST /api/client-workflow/workflows
 *   GET  /api/client-workflow/approvals
 *   POST /api/client-workflow/approvals/:id/approve
 */
import { authFetch } from '@/utils/authFetch';

// ── Types ───────────────────────────────────────────────────────────────

export type ClientRole = 'client_owner' | 'client_interviewer' | 'client_viewer';
export type Tier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';
export type HealthStatus = 'on_track' | 'at_risk' | 'behind';
export type EngagementLevel = 'active' | 'moderate' | 'low' | 'inactive';

export interface ClientMandate {
  id: string;
  title: string;
  status: string;
  health: HealthStatus;
  lead_consultant_name: string;
  days_since_kickoff: number;
  pipeline_summary: Record<string, number>;
  last_activity_at: string | null;
  role: ClientRole;
}

export interface PipelineStage {
  label: string;
  count: number;
}

export interface Candidate {
  id: string;
  full_name: string;
  title: string;
  company_name: string;
  tier: Tier;
  pipeline_stage: string;
  summary: string;
  one_pager_url: string | null;
  score: number | null;
}

export interface ShortlistCandidate {
  id: string;
  candidate_name: string;
  current_title: string;
  current_company: string;
  tier: Tier;
  score: number;
  pipeline_stage: string;
}

export interface SubmitFeedbackPayload {
  mandate_id: string;
  decision: 'interested' | 'not_interested' | 'want_to_interview';
  comments?: string;
  strengths?: string[];
  concerns?: string[];
}

export interface InterviewRecord {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_title: string;
  interview_round: string;
  scheduled_at: string | null;
  status: string;
  feedback_submitted: boolean;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export interface NPSRecord {
  id: string;
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  comment: string | null;
  created_at: string;
}

export interface EngagementMetrics {
  total_logins: number;
  login_streak_days: number;
  last_login_at: string | null;
  documents_viewed: number;
  feedback_submitted: number;
  average_response_time_hours: number | null;
  nps_score: number | null;
  engagement_level: EngagementLevel;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  nodes: any[];
  created_at: string;
  updated_at: string;
}

// ── Mandates ─────────────────────────────────────────────────────────────

export async function fetchClientMandates(): Promise<ClientMandate[]> {
  try {
    const r = await authFetch('/api/client-portal/mandates');
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.mandates) ? payload.mandates : [];
  } catch {
    return [];
  }
}

export async function fetchMandatePipeline(mandateId: string): Promise<PipelineStage[]> {
  try {
    const r = await authFetch(`/api/client-portal/mandates/${mandateId}/pipeline`);
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.stages) ? payload.stages : [];
  } catch {
    return [];
  }
}

export async function fetchMandateActivity(mandateId: string): Promise<any[]> {
  try {
    const r = await authFetch(`/api/client-portal/mandates/${mandateId}/activity`);
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.activity) ? payload.activity : [];
  } catch {
    return [];
  }
}

// ── Candidates ──────────────────────────────────────────────────────────

export async function fetchCandidate(candidateId: string): Promise<Candidate | null> {
  try {
    const r = await authFetch(`/api/client-portal/candidates/${candidateId}`);
    if (!r.ok) return null;
    const payload = await r.json().catch(() => ({}));
    return payload?.candidate || null;
  } catch {
    return null;
  }
}

export async function fetchShortlist(mandateId: string): Promise<ShortlistCandidate[]> {
  try {
    const r = await authFetch(`/api/client-portal/mandates/${mandateId}/shortlist`);
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.shortlist) ? payload.shortlist : [];
  } catch {
    return [];
  }
}

export async function submitCandidateFeedback(
  candidateId: string,
  payload: SubmitFeedbackPayload,
): Promise<boolean> {
  try {
    const r = await authFetch(`/api/client-portal/candidates/${candidateId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function approveShortlist(
  mandateId: string,
  action: 'approve' | 'request_changes',
  comments?: string,
): Promise<boolean> {
  try {
    const r = await authFetch(`/api/client-portal/mandates/${mandateId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comments }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Interviews ──────────────────────────────────────────────────────────

export async function fetchClientInterviews(): Promise<InterviewRecord[]> {
  try {
    const r = await authFetch('/api/client-portal/interviews');
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.interviews) ? payload.interviews : [];
  } catch {
    return [];
  }
}

export async function submitInterviewFeedback(
  interviewId: string,
  payload: { rating: number; strengths?: string[]; concerns?: string[]; hire_recommendation: string; notes?: string },
): Promise<boolean> {
  try {
    const r = await authFetch(`/api/client-portal/interviews/${interviewId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Documents ───────────────────────────────────────────────────────────

export async function fetchClientDocuments(): Promise<any[]> {
  try {
    const r = await authFetch('/api/client-portal/documents');
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.documents) ? payload.documents : [];
  } catch {
    return [];
  }
}

// ── Notifications ────────────────────────────────────────────────────────

export async function fetchNotifications(): Promise<{ notifications: Notification[]; unread_count: number }> {
  try {
    const r = await authFetch('/api/client-portal/notifications');
    if (!r.ok) return { notifications: [], unread_count: 0 };
    const payload = await r.json().catch(() => ({}));
    return {
      notifications: Array.isArray(payload?.notifications) ? payload.notifications : [],
      unread_count: Number(payload?.unread_count ?? 0),
    };
  } catch {
    return { notifications: [], unread_count: 0 };
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const r = await authFetch(`/api/client-portal/notifications/${id}/read`, {
      method: 'POST',
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Preferences ──────────────────────────────────────────────────────────

export async function fetchPreferences(): Promise<any | null> {
  try {
    const r = await authFetch('/api/client-portal/preferences');
    if (!r.ok) return null;
    const payload = await r.json().catch(() => ({}));
    return payload?.preferences || null;
  } catch {
    return null;
  }
}

// ── NPS & Engagement ────────────────────────────────────────────────────

export async function submitNPS(
  score: number,
  mandateId?: string,
  comment?: string,
): Promise<boolean> {
  try {
    const r = await authFetch('/api/client-engagement/nps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, mandate_id: mandateId, comment }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function fetchNPS(): Promise<{ nps: number; records: NPSRecord[] } | null> {
  try {
    const r = await authFetch('/api/client-engagement/nps');
    if (!r.ok) return null;
    const payload = await r.json().catch(() => ({}));
    return { nps: payload?.nps ?? 0, records: payload?.records ?? [] };
  } catch {
    return null;
  }
}

export async function fetchEngagementMetrics(): Promise<EngagementMetrics | null> {
  try {
    const r = await authFetch('/api/client-engagement/engagement');
    if (!r.ok) return null;
    const payload = await r.json().catch(() => ({}));
    return payload?.metrics || null;
  } catch {
    return null;
  }
}

// ── Workflows ────────────────────────────────────────────────────────────

export async function fetchWorkflows(): Promise<WorkflowRecord[]> {
  try {
    const r = await authFetch('/api/client-workflow/workflows');
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.workflows) ? payload.workflows : [];
  } catch {
    return [];
  }
}

export async function createWorkflow(
  data: { name: string; description?: string; trigger_type: string; mandate_id?: string; nodes?: any[] },
): Promise<WorkflowRecord | null> {
  try {
    const r = await authFetch('/api/client-workflow/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) return null;
    const payload = await r.json().catch(() => ({}));
    return payload?.workflow || null;
  } catch {
    return null;
  }
}

export async function fetchApprovals(status?: string): Promise<any[]> {
  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const r = await authFetch(`/api/client-workflow/approvals${qs}`);
    if (!r.ok) return [];
    const payload = await r.json().catch(() => ({}));
    return Array.isArray(payload?.approvals) ? payload.approvals : [];
  } catch {
    return [];
  }
}

export async function approveItem(id: string, comments?: string): Promise<boolean> {
  try {
    const r = await authFetch(`/api/client-workflow/approvals/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function rejectItem(id: string, comments?: string): Promise<boolean> {
  try {
    const r = await authFetch(`/api/client-workflow/approvals/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Brand helpers ───────────────────────────────────────────────────────

export const BRAND_COLOR = '#C108AB';
export const BRAND_HOVER = '#A00790';

export const TIER_STYLES: Record<Tier, string> = {
  Gold: 'bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-xs font-medium',
  Silver: 'bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5 text-xs font-medium',
  Bronze: 'bg-orange-100 text-orange-800 border border-orange-300 px-2 py-0.5 text-xs font-medium',
  Unranked: 'bg-stone-100 text-stone-500 border border-stone-300 px-2 py-0.5 text-xs font-medium',
};

export const HEALTH_STYLES: Record<HealthStatus, string> = {
  on_track: 'bg-teal text-white px-2 py-0.5 text-xs font-medium',
  at_risk: 'bg-amber-500 text-white px-2 py-0.5 text-xs font-medium',
  behind: 'bg-red-600 text-white px-2 py-0.5 text-xs font-medium',
};

export const ENGAGEMENT_STYLES: Record<EngagementLevel, string> = {
  active: 'bg-teal text-white px-2 py-0.5 text-xs font-medium',
  moderate: 'bg-amber-500 text-white px-2 py-0.5 text-xs font-medium',
  low: 'bg-orange-500 text-white px-2 py-0.5 text-xs font-medium',
  inactive: 'bg-gray-500 text-white px-2 py-0.5 text-xs font-medium',
};