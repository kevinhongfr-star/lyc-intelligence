/**
 * ClientMandatesPage — B2B Client Portal mandate management
 * Renders inside AppShell → Outlet. Data sourced from Supabase via useClientMandates (RLS-scoped).
 */
import React, { useState } from 'react';
import { Search, Calendar, Building2 } from 'lucide-react';
import { Card, Input } from '@/components/ui';
import { useClientMandates } from '@/hooks/usePortalData';

interface ClientMandate {
  id: string;
  title: string;
  company: string;
  status: string;
  seniority: string;
  location: string;
  candidatesCount: number;
  shortlisted: number;
  interviewed: number;
  progress: number;
  startDate: string;
  updatedAt: string;
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function progressForMandate(m: { total_candidates: number; tier1_count: number; interview_count: number; placed_count: number; shortlisted_count?: number; }): number {
  const total = Math.max(m.total_candidates, 1);
  const advanced = m.placed_count * 1.0 + m.interview_count * 0.6 + (m.tier1_count || 0) * 0.2;
  return Math.min(100, Math.round((advanced / total) * 100));
}

const statusColors: Record<string, string> = {
  'Active': 'bg-green/10 text-green',
  'ACTIVE': 'bg-green/10 text-green',
  'On Hold': 'bg-amber/10 text-amber',
  'ON_HOLD': 'bg-amber/10 text-amber',
  'Paused': 'bg-amber/10 text-amber',
  'Closed': 'bg-text-muted/10 text-text-muted',
  'CLOSED': 'bg-text-muted/10 text-text-muted',
};

export function ClientMandatesPage() {
  const { data: raw, loading } = useClientMandates();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const mandates: ClientMandate[] = (raw ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    company: m.company?.name ?? '—',
    status: m.status || 'Active',
    seniority: m.company?.industry ?? '—',
    location: '—', // not joined in this query
    candidatesCount: m.total_candidates ?? 0,
    shortlisted: m.tier1_count ?? 0,
    interviewed: m.interview_count ?? 0,
    progress: progressForMandate(m),
    startDate: formatDateShort(m.target_close_date),
    updatedAt: formatDateShort(m.updated_at),
  }));

  const filteredMandates = mandates.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Mandates & Pipeline</h1>
        <p className="text-text-secondary text-sm mt-1">Track all your executive search mandates.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search mandates..."
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
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Mandate cards */}
      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm">Loading mandates...</div>
      ) : filteredMandates.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">No mandates found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMandates.map((mandate) => (
            <Card key={mandate.id} className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-fuchsia" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-text-primary">{mandate.title}</h3>
                    <p className="text-xs text-text-muted">{mandate.company} · {mandate.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[mandate.status] || 'bg-fuchsia-light text-fuchsia'}`}>
                  {mandate.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{mandate.candidatesCount}</div>
                  <div className="text-xs text-text-muted">Candidates</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{mandate.shortlisted}</div>
                  <div className="text-xs text-text-muted">Shortlisted</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{mandate.interviewed}</div>
                  <div className="text-xs text-text-muted">Interviewed</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg-warm rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fuchsia rounded-full transition-all"
                    style={{ width: `${mandate.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-text-secondary">{mandate.progress}%</span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                Started {mandate.startDate} · Updated {mandate.updatedAt}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientMandatesPage;
