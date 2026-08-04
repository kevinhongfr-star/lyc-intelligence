/**
 * CandidateDashboardPage — Candidate Portal landing dashboard (S1-T03)
 *
 * Wired to live Supabase data:
 *   - v_pipeline_rankings view → pipeline rankings with tier badge + score
 *   - getCandidateApplications() → application status cards
 *   - getCandidateProfile() → profile completion metrics
 *
 * Renders inside AppShell → Outlet.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Calendar, ClipboardCheck, TrendingUp, ArrowRight, Clock, Video, MapPin, Star, Trophy, Award, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Progress } from '@/components/ui';
import { TierBadge, Tier } from '@/components/ui/TierBadge';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { getCandidateApplications, getCandidateProfile, CandidateApplication, CandidateProfile } from '@/services/supabaseApi';

// ── Types ──

interface PipelineRanking {
  id: string;
  mandate_id: string | null;
  candidate_id: string | null;
  mandate_title: string | null;
  company_name: string | null;
  pipeline_stage: string | null;
  weighted_score: number | null;
  tier: Tier | null;
  rank: number | null;
  consultant_name: string | null;
  scored_at: string | null;
}

interface AssessmentResult {
  id: string;
  name: string;
  archetype: string;
  score: number;
  takenAt: string;
  dimensions: { name: string; score: number }[];
}

// ── Helpers ──

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

const STAGE_ORDER: Record<string, number> = {
  'Sourcing': 10, 'Screening': 20, 'Assessment': 30, 'Shortlist': 40,
  'Interview': 50, 'Final Interview': 60, 'Offer': 70, 'Placed': 80,
};

function stageProgress(stage: string | null): number {
  if (!stage) return 0;
  return STAGE_ORDER[stage] ?? 0;
}

const STAGE_COLORS: Record<string, string> = {
  'Sourcing': 'bg-gray-100 text-gray-600',
  'Screening': 'bg-amber-100 text-amber-700',
  'Assessment': 'bg-blue-100 text-blue-700',
  'Shortlist': 'bg-fuchsia-100 text-fuchsia-700',
  'Interview': 'bg-indigo-100 text-indigo-700',
  'Final Interview': 'bg-violet-100 text-violet-700',
  'Offer': 'bg-green-100 text-green-700',
  'Placed': 'bg-green-100 text-green-700',
};

// ── Component ──

export function CandidateDashboardPage() {
  const { user } = useAuthStore();
  const [rankings, setRankings] = useState<PipelineRanking[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    setError('');

    try {
      // Fetch pipeline rankings, applications, and profile in parallel
      const [rankingsRes, apps, prof] = await Promise.all([
        supabase
          .from('v_pipeline_rankings')
          .select('*')
          .eq('candidate_id', user.id)
          .order('rank', { ascending: true, nullsFirst: false })
          .limit(50),
        getCandidateApplications(),
        getCandidateProfile(),
      ]);

      if (rankingsRes.error) {
        console.warn('[CandidateDashboard] v_pipeline_rankings query error:', rankingsRes.error.message);
      } else {
        setRankings((rankingsRes.data as PipelineRanking[]) ?? []);
      }

      setApplications(apps);
      setProfile(prof);
    } catch (e: any) {
      console.error('[CandidateDashboard] load error:', e);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived metrics ──

  const activeCount = applications.length;
  const rankedCount = rankings.filter(r => r.tier && r.tier !== 'Unranked').length;
  const topRank = rankings.length > 0 ? rankings[0] : null;

  // Profile completion: check which fields are filled
  const profileFields = profile
    ? [
        profile.name, profile.current_title, profile.current_company,
        profile.linkedin_url, profile.city, profile.years_experience,
        profile.industries?.length, profile.skills?.length,
      ]
    : [];
  const filledFields = profileFields.filter(f => f !== null && f !== undefined && f !== '' && f !== 0).length;
  const profileCompletion = profileFields.length > 0
    ? Math.round((filledFields / profileFields.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Candidate Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Your career journey at a glance.</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="text-sm text-fuchsia hover:underline flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Status metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : activeCount}</div>
              <div className="text-xs text-text-muted">Active Applications</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Trophy className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : rankedCount}</div>
              <div className="text-xs text-text-muted">Ranked Positions</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Award className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {loading ? '—' : topRank?.tier ? topRank.tier : '—'}
              </div>
              <div className="text-xs text-text-muted">Top Tier</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : `${profileCompletion}%`}</div>
              <div className="text-xs text-text-muted">Profile Completion</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Rankings — the critical v_pipeline_rankings view */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Pipeline Rankings</CardTitle>
            <span className="text-xs text-text-muted">
              {rankings.length} position{rankings.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rankings...
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">
              You have no active pipeline rankings yet. Rankings appear when you're being considered for a position.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium text-text-muted">Rank</th>
                    <th className="py-2 pr-4 font-medium text-text-muted">Position</th>
                    <th className="py-2 pr-4 font-medium text-text-muted">Company</th>
                    <th className="py-2 pr-4 font-medium text-text-muted">Stage</th>
                    <th className="py-2 pr-4 font-medium text-text-muted">Tier</th>
                    <th className="py-2 pr-4 font-medium text-text-muted text-right">Score</th>
                    <th className="py-2 pr-4 font-medium text-text-muted">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-bg-warm/50">
                      <td className="py-3 pr-4">
                        {r.rank ? <span className="font-semibold text-text-primary">#{r.rank}</span> : '—'}
                      </td>
                      <td className="py-3 pr-4 font-medium text-text-primary">
                        {r.mandate_title ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {r.company_name ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${STAGE_COLORS[r.pipeline_stage ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                          {r.pipeline_stage ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <TierBadge tier={r.tier} size="sm" />
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-text-primary">
                        {r.weighted_score != null ? r.weighted_score.toFixed(1) : '—'}
                      </td>
                      <td className="py-3 pr-4 text-xs text-text-muted">
                        {fmtDate(r.scored_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Application Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">No active applications yet.</div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => {
                  const progress = stageProgress(app.stage);
                  return (
                    <div key={app.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-text-primary text-sm">
                            {app.mandate?.title ?? app.client_name}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${STAGE_COLORS[app.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                            {app.stage}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {app.mandate?.company?.name ?? app.client_name} · Updated {fmtDate(app.updated_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {app.match_score != null && (
                          <span className="text-xs font-medium text-text-secondary">
                            Score: {app.match_score}
                          </span>
                        )}
                        <div className="w-20 h-2 bg-bg-warm rounded-full overflow-hidden">
                          <div className="h-full bg-fuchsia rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-medium text-text-secondary w-8 text-right">{progress}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile completion */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading profile...
              </div>
            ) : !profile ? (
              <div className="py-8 text-center text-text-muted text-sm">
                Complete your profile to improve your match quality.
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Name', filled: !!profile.name },
                  { label: 'Current Title', filled: !!profile.current_title },
                  { label: 'Current Company', filled: !!profile.current_company },
                  { label: 'LinkedIn URL', filled: !!profile.linkedin_url },
                  { label: 'Location', filled: !!profile.city },
                  { label: 'Years of Experience', filled: !!profile.years_experience },
                  { label: 'Industries', filled: (profile.industries?.length ?? 0) > 0 },
                  { label: 'Skills', filled: (profile.skills?.length ?? 0) > 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-primary">{item.label}</span>
                      <span className={item.filled ? 'text-green-600 font-medium' : 'text-text-muted'}>
                        {item.filled ? 'Complete' : 'Missing'}
                      </span>
                    </div>
                    <Progress value={item.filled ? 100 : 0} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CandidateDashboardPage;
