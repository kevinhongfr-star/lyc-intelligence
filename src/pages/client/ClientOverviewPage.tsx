/**
 * ClientOverviewPage — B2B Client Dashboard (S3-T01)
 *
 * Resolves the logged-in client's company from `client_accounts` (fallback
 * `profiles.organization_id`), then shows active mandates with pipeline
 * summaries and assigned consultants.
 *
 * Renders inside AppShell → Outlet (the /client surface).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Users, TrendingUp, Mail, ChevronRight, AlertCircle, Building2 } from 'lucide-react';
import { Card, CardContent, Button, Badge, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import {
  resolveClientCompany,
  fetchClientMandates,
  fetchPipelineStageCounts,
  type ClientMandate,
  type PipelineStageCount,
  PIPELINE_STAGES,
} from '@/services/clientPortalService';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  open: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-700',
  paused: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-100 text-gray-600',
  filled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600';
  return STATUS_COLORS[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
}

export function ClientOverviewPage() {
  const user = useAuthStore(s => s.user);
  const profile = useAuthStore(s => s.profile);

  const [mandates, setMandates] = useState<ClientMandate[]>([]);
  const [stageCounts, setStageCounts] = useState<PipelineStageCount[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setError(null);
        const { companyId, companyName: cn } = await resolveClientCompany(user.id, profile?.organization_id);
        if (cancelled) return;

        if (!companyId) {
          setNoCompany(true);
          setLoading(false);
          return;
        }
        setCompanyName(cn);

        const [m, sc] = await Promise.all([
          fetchClientMandates(companyId),
          fetchPipelineStageCounts(undefined, companyId),
        ]);
        if (cancelled) return;
        setMandates(m);
        setStageCounts(sc);
      } catch (e) {
        console.warn('[ClientOverviewPage] error:', e);
        if (!cancelled) setError('Failed to load your dashboard. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.organization_id]);

  const activeMandates = useMemo(
    () => mandates.filter(m => {
      const s = (m.status ?? '').toLowerCase();
      return s === 'active' || s === 'open';
    }),
    [mandates],
  );

  const totalCandidates = useMemo(
    () => stageCounts.reduce((sum, s) => sum + s.count, 0),
    [stageCounts],
  );

  const stageMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of stageCounts) m[s.stage] = s.count;
    return m;
  }, [stageCounts]);

  // Unique consultants across mandates (S3-T04)
  const consultants = useMemo(() => {
    const seen = new Map<string, { name: string; email: string; role: string }>();
    for (const m of mandates) {
      if (m.consultant_id && m.consultant_name && !seen.has(m.consultant_id)) {
        seen.set(m.consultant_id, { name: m.consultant_name, email: m.consultant_email ?? '', role: m.consultant_role ?? 'Consultant' });
      }
    }
    return Array.from(seen.values());
  }, [mandates]);

  if (loading) {
    return <div className="py-12 text-center text-text-muted text-sm">Loading your dashboard…</div>;
  }

  if (noCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          icon={<Building2 className="w-10 h-10 text-text-muted" />}
          title="No client account linked"
          description="Your account isn't linked to a client company yet. Please contact your LYC Partners consultant to get access."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">
          {companyName ? `${companyName} Dashboard` : 'Client Dashboard'}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Active mandates, candidate pipeline, and your assigned consultants.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Briefcase className="w-3.5 h-3.5" /> Active Mandates
          </div>
          <div className="text-2xl font-bold text-text-primary">{activeMandates.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Briefcase className="w-3.5 h-3.5" /> Total Mandates
          </div>
          <div className="text-2xl font-bold text-text-primary">{mandates.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Users className="w-3.5 h-3.5" /> Candidates in Pipeline
          </div>
          <div className="text-2xl font-bold text-text-primary">{totalCandidates}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Interview Stage
          </div>
          <div className="text-2xl font-bold text-text-primary">{stageMap['Interview'] ?? 0}</div>
        </Card>
      </div>

      {/* Pipeline distribution */}
      {stageCounts.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-medium text-text-primary mb-4">Pipeline Stage Distribution</h3>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map(stage => {
                const count = stageMap[stage] ?? 0;
                const pct = totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0;
                return (
                  <div key={stage} className="flex-1 min-w-[100px] text-center">
                    <div className="text-xs text-text-muted mb-1">{stage}</div>
                    <div className="text-lg font-bold text-text-primary">{count}</div>
                    <div className="h-1 bg-bg-warm mt-1 overflow-hidden">
                      <div className="h-full bg-fuchsia" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultants (S3-T04) */}
      {consultants.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-medium text-text-primary mb-4">Your Consultants</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {consultants.map(c => (
                <div key={c.email} className="flex items-center gap-3 p-3 bg-bg-warm">
                  <div className="w-9 h-9 bg-fuchsia text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary truncate">{c.name}</div>
                    <div className="text-xs text-text-muted capitalize">{c.role.replace(/_/g, ' ')}</div>
                  </div>
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-fuchsia hover:opacity-70">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active mandates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-text-primary">Active Mandates</h3>
          <a href="/client/mandates"><Button variant="outline" size="sm">View All <ChevronRight className="w-3.5 h-3.5" /></Button></a>
        </div>
        {mandates.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-10 h-10 text-text-muted" />}
            title="No mandates yet"
            description="Your active executive search mandates will appear here."
          />
        ) : (
          <div className="space-y-3">
            {(activeMandates.length > 0 ? activeMandates : mandates.slice(0, 5)).map(m => (
              <Card key={m.id} className="p-4 hover:border-fuchsia/40 transition-colors cursor-pointer" >
                <a href={`/client/mandates?id=${m.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text-primary truncate">{m.title}</span>
                        <Badge className={statusColor(m.status)}>{m.status ?? 'Unknown'}</Badge>
                        {m.priority && (
                          <Badge variant="outline" className="text-xs">{m.priority}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                        {m.company_name && <span>{m.company_name}</span>}
                        {m.company_industry && <span>· {m.company_industry}</span>}
                        <span>· Updated {formatDate(m.updated_at)}</span>
                      </div>
                    </div>
                    {m.consultant_name && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary flex-shrink-0">
                        <div className="w-6 h-6 bg-fuchsia/10 text-fuchsia flex items-center justify-center font-semibold text-[10px]">
                          {m.consultant_name.charAt(0)}
                        </div>
                        <span className="hidden sm:inline">{m.consultant_name}</span>
                      </div>
                    )}
                  </div>
                  {m.skills_requirements && m.skills_requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.skills_requirements.slice(0, 5).map(s => (
                        <span key={s} className="text-[10px] bg-bg-warm text-text-secondary px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientOverviewPage;
