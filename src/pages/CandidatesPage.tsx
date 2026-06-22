import { useAuthStore } from '@/stores/authStore';
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Loader2, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Linkedin, Globe, Briefcase, Award, Target, Upload } from 'lucide-react';
import { useContacts } from '@/hooks/useSupabaseData';
import { Badge, Card, CardContent } from '@/components/ui';
import type { Contact } from '@/services/supabaseApi';
import { LinkedInImportModal } from '@/components/import/LinkedInImportModal';

const SENIORITY_OPTIONS = [
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'senior_manager', label: 'Senior Manager' },
  { value: 'manager', label: 'Manager' },
];

const TIER_THRESHOLDS = { S: 85, A: 65, B: 45 };

function getTier(score: number | null, cxo: boolean | null): string {
  if (cxo || (score ?? 0) >= 85) return 'S';
  if ((score ?? 0) >= 65) return 'A';
  if ((score ?? 0) >= 45) return 'B';
  return 'C';
}

const TIER_STYLES: Record<string, string> = {
  S: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  A: 'bg-green-500/15 text-green-500 border-green-500/30',
  B: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  C: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

type SortField = 'name' | 'score' | 'seniority' | 'country';

export function CandidatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const limit = 30;

  const { data: contacts, count, loading } = useContacts({ userId: profile?.id || undefined,
    query: search || undefined,
    seniority: seniorityFilter.length ? seniorityFilter : undefined,
    country: countryFilter || undefined,
    limit: 200, // fetch more for client-side tier filtering
  });

  // Client-side tier filtering + sorting
  const filtered = useMemo(() => {
    let result = contacts;
    if (tierFilter) {
      result = result.filter(c => getTier(c.trident_composite, !!c.cxo_stamp) === tierFilter);
    }
    // Client-side country filter (since useContacts only supports one country)
    if (countryFilter) {
      result = result.filter(c => c.country === countryFilter);
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortField === 'score') cmp = (a.trident_composite ?? 0) - (b.trident_composite ?? 0);
      else if (sortField === 'seniority') {
        const order = ['c_suite', 'leadership', 'vp', 'director', 'senior_manager', 'manager'];
        cmp = order.indexOf(a.seniority || '') - order.indexOf(b.seniority || '');
      } else if (sortField === 'country') cmp = (a.country || '').localeCompare(b.country || '');
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [contacts, tierFilter, countryFilter, sortField, sortAsc]);

  const paginated = filtered.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const c of contacts) if (c.country) set.add(c.country);
    return Array.from(set).sort();
  }, [contacts]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const toggleSeniority = (val: string) => {
    setSeniorityFilter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    setPage(0);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Talent Pool</h1>
          <p className="text-text-muted">{count.toLocaleString()} contacts{filtered.length !== count ? ` · ${filtered.length} shown` : ''}</p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors min-h-[44px]"
        >
          <Upload className="w-4 h-4" />
          Import from LinkedIn
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              placeholder="Search by name, title, headline, skills..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <select
            value={countryFilter}
            onChange={e => { setCountryFilter(e.target.value); setPage(0); }}
            className="px-3 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent min-w-[140px]"
          >
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={tierFilter}
            onChange={e => { setTierFilter(e.target.value); setPage(0); }}
            className="px-3 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent min-w-[120px]"
          >
            <option value="">All Tiers</option>
            <option value="S">S — C-Suite Elite</option>
            <option value="A">A — Senior Leader</option>
            <option value="B">B — Mid-Senior</option>
            <option value="C">C — Emerging</option>
          </select>
        </div>

        {/* Seniority chips */}
        <div className="flex flex-wrap gap-1.5">
          {SENIORITY_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => toggleSeniority(s.value)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                seniorityFilter.includes(s.value)
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-bg-tertiary text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
          {(search || seniorityFilter.length || countryFilter || tierFilter) && (
            <button
              onClick={() => { setSearch(''); setSeniorityFilter([]); setCountryFilter(''); setTierFilter(''); setPage(0); }}
              className="px-2.5 py-1 text-xs text-accent hover:bg-accent/10 rounded-full transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-text-muted text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Loading talent pool...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
          <p className="text-text-muted">No candidates match your filters</p>
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-lg border border-bg-tertiary overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-tertiary">
                  <th onClick={() => toggleSort('name')} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none">
                    <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Current Role</th>
                  <th onClick={() => toggleSort('country')} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none">
                    <span className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th onClick={() => toggleSort('seniority')} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none">
                    <span className="flex items-center gap-1">Seniority <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th onClick={() => toggleSort('score')} className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none">
                    <span className="flex items-center justify-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tier</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Links</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => {
                  const tier = getTier(c.trident_composite, !!c.cxo_stamp);
                  return (
                    <tr key={c.id} className="border-b border-bg-tertiary/50 hover:bg-bg-tertiary/30 transition-colors cursor-pointer" onClick={() => navigate(`/platform/candidates/${c.id}`)}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-accent hover:underline">{c.name}</p>
                          {c.headline && <p className="text-[11px] text-text-muted truncate max-w-[200px]">{c.headline}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary truncate max-w-[200px]">{c.current_title || '—'}</p>
                        <p className="text-[11px] text-text-muted">{c.company?.name || c.career_history?.[0]?.company || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-text-muted">
                          <Globe className="w-3 h-3" />
                          {c.city ? `${c.city}, ${c.country}` : c.country || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text-muted capitalize">{(c.seniority || '—').replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono font-bold ${
                          (c.trident_composite ?? 0) >= 75 ? 'text-green-500' :
                          (c.trident_composite ?? 0) >= 50 ? 'text-blue-500' :
                          'text-text-muted'
                        }`}>
                          {c.trident_composite ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_STYLES[tier]}`}>
                          {tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-400" title="LinkedIn"
                              onClick={(e) => e.stopPropagation()}>
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-bg-tertiary">
              <p className="text-xs text-text-muted">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded bg-bg-tertiary disabled:opacity-40 hover:bg-bg-tertiary/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-text-muted">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded bg-bg-tertiary disabled:opacity-40 hover:bg-bg-tertiary/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <LinkedInImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          setShowImportModal(false);
        }}
      />
    </div>
  );
}
