/**
 * Portal Data Hooks — T1 Portal Data Wiring
 *
 * React hooks for B2B Client, Candidate, and B2C Coaching portal pages.
 * All hooks use the direct Supabase client (with RLS) and gracefully handle
 * empty results — a brand-new portal user should see "no data yet" states,
 * not error states.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  // Client
  fetchClientMandates,
  fetchClientCandidates,
  fetchClientDocuments,
  fetchClientActivity,
  fetchClientPipelineAnalytics,
  type ClientMandate,
  type ClientCandidate,
  type ClientDocument,
  type ClientActivity,
  type PipelineFunnel,
  // Candidate
  fetchCandidateProfile,
  fetchCandidateApplications,
  fetchCandidateInterviews,
  fetchCandidateAssessments,
  fetchCandidateCareerIntel,
  type CandidateProfile,
  type CandidateApplication,
  type CandidateInterview,
  type CandidateAssessment,
  type CandidateCareerIntel,
  // Coaching
  fetchCoacheeProfile,
  fetchCoacheeCredits,
  fetchCoacheeUpcomingSessions,
  fetchCoacheeAssessments,
  type CoacheeProfile,
  type CoacheeCredits,
  type CoacheeSession,
  type CoacheeAssessment,
} from '@/services/portalDataService';

// ── Generic loading state hook helper ──
function useAsync<T>(loader: () => Promise<{ data: T; error: any }>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await loader();
      setData(r.data);
      if (r.error && !(Array.isArray(r.data) && r.data.length === 0)) {
        setError(typeof r.error === 'string' ? r.error : r.error?.message ?? 'Failed to load');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, refresh: reload };
}

// ════════════════════════════════════════════════════════════════
// CLIENT PORTAL HOOKS
// ════════════════════════════════════════════════════════════════

export function useClientMandates() {
  return useAsync<ClientMandate[]>(fetchClientMandates);
}

export function useClientCandidates(mandateId?: string) {
  return useAsync<ClientCandidate[]>(() => fetchClientCandidates(mandateId), [mandateId]);
}

export function useClientDocuments() {
  return useAsync<ClientDocument[]>(fetchClientDocuments);
}

export function useClientActivity(limit: number = 10) {
  return useAsync<ClientActivity>(() => fetchClientActivity(limit), [limit]);
}

export function useClientPipelineAnalytics() {
  return useAsync<PipelineFunnel>(fetchClientPipelineAnalytics);
}

// ════════════════════════════════════════════════════════════════
// CANDIDATE PORTAL HOOKS
// ════════════════════════════════════════════════════════════════

export function useCandidateProfile() {
  const { user } = useAuthStore();
  return useAsync<CandidateProfile | null>(fetchCandidateProfile, [user?.id]);
}

export function useCandidateApplications() {
  const { user } = useAuthStore();
  return useAsync<CandidateApplication[]>(fetchCandidateApplications, [user?.id]);
}

export function useCandidateInterviews() {
  const { user } = useAuthStore();
  return useAsync<CandidateInterview[]>(fetchCandidateInterviews, [user?.id]);
}

export function useCandidateAssessments() {
  const { user } = useAuthStore();
  return useAsync<CandidateAssessment[]>(fetchCandidateAssessments, [user?.id]);
}

export function useCandidateCareerIntel() {
  const { user } = useAuthStore();
  return useAsync<CandidateCareerIntel>(fetchCandidateCareerIntel, [user?.id]);
}

// ════════════════════════════════════════════════════════════════
// COACHING PORTAL HOOKS
// ════════════════════════════════════════════════════════════════

export function useCoacheeProfile() {
  const { user } = useAuthStore();
  return useAsync<CoacheeProfile | null>(fetchCoacheeProfile, [user?.id]);
}

export function useCoacheeCredits() {
  const { user } = useAuthStore();
  return useAsync<CoacheeCredits | null>(fetchCoacheeCredits, [user?.id]);
}

export function useCoacheeUpcomingSessions() {
  const { user } = useAuthStore();
  return useAsync<CoacheeSession[]>(fetchCoacheeUpcomingSessions, [user?.id]);
}

export function useCoacheeAssessments() {
  const { user } = useAuthStore();
  return useAsync<CoacheeAssessment[]>(fetchCoacheeAssessments, [user?.id]);
}
