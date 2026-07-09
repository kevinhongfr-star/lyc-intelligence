/**
 * ClientMandatesPage — B2B Client Portal mandate management
 * Renders inside AppShell → Outlet.
 */
import React, { useState, useEffect } from 'react';
import { Search, Filter, Target, Users, Calendar, ArrowRight, Building2, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getMandates, type Mandate } from '@/services/supabaseApi';

interface ClientMandate {
  id: string;
  title: string;
  company: string;
  status: 'Active' | 'On Hold' | 'Closed';
  seniority: string;
  location: string;
  candidatesCount: number;
  shortlisted: number;
  interviewed: number;
  progress: number;
  startDate: string;
  updatedAt: string;
}

export function ClientMandatesPage() {
  const [mandates, setMandates] = useState<ClientMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const { clientAccount, profile, isLoading: authLoading } = useTenantContext();

  useEffect(() => {
    if (!profile?.id || authLoading) {
      setLoading(false);
      return;
    }

    const loadMandates = async () => {
      try {
        const result = await getMandates({ userId: profile.id });
        const mapped: ClientMandate[] = result.data.map((m: Mandate) => ({
          id: m.id,
          title: m.title,
          company: m.company?.name || 'Unknown Company',
          status: (m.status === 'active' ? 'Active' : m.status === 'on_hold' ? 'On Hold' : 'Closed') as 'Active' | 'On Hold' | 'Closed',
          seniority: m.client_first_name || 'Not specified',
          location: m.company?.city || m.company?.country || 'Not specified',
          candidatesCount: m.total_candidates ?? 0,
          shortlisted: m.shortlisted_count ?? 0,
          interviewed: m.interview_count ?? 0,
          progress: m.progress ? parseInt(m.progress, 10) : 0,
          startDate: m.created_at ? new Date(m.created_at).toLocaleDateString() : '',
          updatedAt: m.updated_at ? new Date(m.updated_at).toLocaleDateString() : '',
        }));
        setMandates(mapped);
      } catch (e) {
        console.error('[ClientMandatesPage] Error:', e);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };

    loadMandates();
  }, [profile?.id, authLoading]);

  const filteredMandates = mandates.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    'Active': 'bg-green/10 text-green',
    'On Hold': 'bg-amber/10 text-amber',
    'Closed': 'bg-text-muted/10 text-text-muted',
  };

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Mandates & Pipeline</h1>
            <p className="text-text-secondary text-sm mt-1">Track all your executive search mandates.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{organization}</div>
            </div>
          </div>
        </div>
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
      ) : error ? (
        <div className="py-12 text-center text-text-muted text-sm">{error}</div>
      ) : filteredMandates.length === 0 ? (
        <EmptyState
          title="No mandates found"
          description="Adjust your search or filters to see more results."
        />
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
                <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[mandate.status]}`}>
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
