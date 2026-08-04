/**
 * CandidateApplicationsPage — Candidate Portal application tracker (S1-T04)
 *
 * Wired to live Supabase data via getCandidateApplications().
 * Lists all applications with stage, match score, and last updated date.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Briefcase, Users, Award, CheckCircle2, Building2, Calendar, MapPin, ArrowRight, Loader2, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { getCandidateApplications, CandidateApplication } from '@/services/supabaseApi';

// ── Helpers ──

function fmtDate(iso: string | null | undefined): string {
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

function stageProgress(stage: string | null | undefined): number {
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
  'Not Selected': 'bg-red-100 text-red-700',
};

// ── Component ──

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCandidateApplications();
      setApplications(data);
    } catch (e) {
      console.error('[CandidateApplications] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Get unique stages for filter dropdown
  const stageOptions = React.useMemo(() => {
    const stages = new Set(applications.map(a => a.stage).filter(Boolean));
    return ['all', ...Array.from(stages).sort()];
  }, [applications]);

  const filtered = applications.filter((a) => {
    const title = a.mandate?.title ?? '';
    const company = a.mandate?.company?.name ?? a.client_name ?? '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.stage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = applications.filter((a) =>
    !['Placed', 'Not Selected'].includes(a.stage ?? '')
  ).length;
  const interviewCount = applications.filter((a) =>
    a.stage?.toLowerCase().includes('interview')
  ).length;
  const offerCount = applications.filter((a) =>
    a.stage?.toLowerCase().includes('offer')
  ).length;
  const totalCount = applications.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Applications</h1>
          <p className="text-text-secondary text-sm mt-1">Track the roles you've been submitted to and their status.</p>
        </div>
        <button
          onClick={loadApplications}
          disabled={loading}
          className="text-sm text-fuchsia hover:underline flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : activeCount}</div>
              <div className="text-xs text-text-muted">Active</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : interviewCount}</div>
              <div className="text-xs text-text-muted">In Interviews</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Award className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : offerCount}</div>
              <div className="text-xs text-text-muted">Offers</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : totalCount}</div>
              <div className="text-xs text-text-muted">Total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by role or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia"
        >
          {stageOptions.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Stages' : s}</option>
          ))}
        </select>
      </div>

      {/* Application list */}
      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">
          {applications.length === 0
            ? 'No applications yet. Your consultant will submit you to relevant positions.'
            : 'No applications match your filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((app) => {
            const progress = stageProgress(app.stage);
            const title = app.mandate?.title ?? '—';
            const company = app.mandate?.company?.name ?? app.client_name ?? '—';
            const location = app.mandate?.location ?? '';
            const comp = app.mandate?.compensation_range ?? '';
            return (
              <Card key={app.id} className="p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-fuchsia" />
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-text-primary">{title}</h3>
                      <p className="text-xs text-text-muted">
                        {company}
                        {location ? ` · ${location}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${STAGE_COLORS[app.stage ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                    {app.stage ?? '—'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 bg-bg-warm rounded-full overflow-hidden">
                    <div className="h-full bg-fuchsia rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-text-secondary">{progress}%</span>
                </div>

                {app.match_score != null && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                    <Award className="w-3 h-3 text-fuchsia flex-shrink-0" />
                    <span>Match Score: <strong>{app.match_score}</strong></span>
                    {app.trident_composite != null && (
                      <span className="text-text-muted">· Trident: {app.trident_composite}</span>
                    )}
                  </div>
                )}

                {comp && (
                  <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                    <DollarSign className="w-3 h-3" />
                    <span>{comp}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar className="w-3 h-3" />
                  Applied {fmtDate(app.applied_date)} · Updated {fmtDate(app.updated_at)}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CandidateApplicationsPage;
