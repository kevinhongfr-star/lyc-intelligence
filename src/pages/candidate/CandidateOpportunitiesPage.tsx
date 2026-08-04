/**
 * CandidateOpportunitiesPage — Public Mandate Browser (S1-T05)
 *
 * Shows available mandates from the database that candidates can browse.
 * Supports text search and filtering by industry/location.
 * Wired to getMandates() from supabaseApi.ts.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Briefcase, Building2, MapPin, DollarSign, Clock, Loader2, ChevronRight } from 'lucide-react';
import { Card, Input } from '@/components/ui';
import { getMandates, Mandate } from '@/services/supabaseApi';

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

// Map internal status codes to user-friendly labels
const STATUS_LABELS: Record<string, string> = {
  '1_search': 'Active Search',
  '2_sourcing': 'Sourcing',
  '3_screen': 'Screening',
  '4_interview': 'Interviewing',
  '5_offer': 'Offer Stage',
  '6_closed': 'Closed',
  'on_hold': 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  'Active Search': 'bg-green-100 text-green-700',
  'Sourcing': 'bg-blue-100 text-blue-700',
  'Screening': 'bg-amber-100 text-amber-700',
  'Interviewing': 'bg-fuchsia-100 text-fuchsia-700',
  'Offer Stage': 'bg-violet-100 text-violet-700',
  'Closed': 'bg-gray-100 text-gray-500',
  'On Hold': 'bg-gray-100 text-gray-500',
};

export function CandidateOpportunitiesPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  const loadMandates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMandates({ limit: 100 });
      // Only show active mandates (not closed or on hold)
      setMandates(data.filter(m => m.status !== '6_closed' && m.status !== 'on_hold'));
    } catch (e) {
      console.error('[Opportunities] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMandates();
  }, [loadMandates]);

  // Extract unique industries for filter
  const industries = useMemo(() => {
    const set = new Set<string>();
    mandates.forEach(m => {
      const ind = m.company?.industry;
      if (ind) set.add(ind);
    });
    return ['all', ...Array.from(set).sort()];
  }, [mandates]);

  const filtered = useMemo(() => {
    return mandates.filter((m) => {
      const title = (m.title ?? '').toLowerCase();
      const company = (m.company?.name ?? '').toLowerCase();
      const keywords = (m.keywords ?? '').toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        company.includes(q) ||
        keywords.includes(q);

      const matchesIndustry =
        industryFilter === 'all' ||
        m.company?.industry === industryFilter;

      return matchesSearch && matchesIndustry;
    });
  }, [mandates, searchTerm, industryFilter]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Opportunities</h1>
          <p className="text-text-secondary text-sm mt-1">
            Browse open executive search mandates matched to your profile.
          </p>
        </div>
        <button
          onClick={loadMandates}
          disabled={loading}
          className="text-sm text-fuchsia hover:underline flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by title, company, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind === 'all' ? 'All Industries' : ind}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-text-muted">
        {loading ? 'Loading...' : `${filtered.length} opportunity${filtered.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Mandate list */}
      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading opportunities...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">
          {mandates.length === 0
            ? 'No open opportunities at this time. Check back soon.'
            : 'No opportunities match your filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((m) => {
            const statusLabel = STATUS_LABELS[m.status] ?? m.status;
            const desc = m.jd_description ?? m.description ?? '';
            const skills = m.skills_requirements ?? [];
            return (
              <Card
                key={m.id}
                className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-fuchsia" />
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-text-primary">{m.title}</h3>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {m.company?.name ?? '—'}
                        {m.company?.industry ? ` · ${m.company.industry}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${STATUS_COLORS[statusLabel] ?? 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel}
                  </span>
                </div>

                {desc && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {desc.length > 150 ? desc.slice(0, 150) + '...' : desc}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-bg-warm text-text-secondary rounded">
                        {s}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-text-muted">
                        +{skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-text-muted pt-3 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Posted {fmtDate(m.created_at)}
                  </span>
                  {m.priority && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      m.priority === 'high' ? 'bg-red-100 text-red-700' :
                      m.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {m.priority} priority
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-fuchsia font-medium">
                    View details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CandidateOpportunitiesPage;
