import { useAuthStore } from '@/stores/authStore';
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Loader2, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Linkedin, Globe, Briefcase, Award, Target, Upload, MapPin } from 'lucide-react';
import { useContacts } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui';
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

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  S: { bg: 'rgba(184,134,11,0.08)', text: '#B8860B' },
  A: { bg: 'rgba(26,125,66,0.08)', text: '#1A7D42' },
  B: { bg: 'rgba(44,82,130,0.08)', text: '#2C5282' },
  C: { bg: 'rgba(140,133,125,0.08)', text: '#A3A3A3' },
};

const TIER_BADGES: Record<string, string> = {
  S: 'Elite',
  A: 'Senior',
  B: 'Mid-Level',
  C: 'Emerging',
};

type SortField = 'name' | 'score' | 'seniority' | 'country';

export function CandidatesPage() {
  const { profile } = useAuthStore();
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

  const { data: contacts, count, loading } = useContacts({
    userId: profile?.id || undefined,
    query: search || undefined,
    seniority: seniorityFilter.length ? seniorityFilter : undefined,
    country: countryFilter || undefined,
    limit: 200,
  });

  const filtered = useMemo(() => {
    let result = contacts;
    if (tierFilter) {
      result = result.filter(c => getTier(c.trident_composite, !!c.cxo_stamp) === tierFilter);
    }
    if (countryFilter) {
      result = result.filter(c => c.country === countryFilter);
    }
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return '#A3A3A3';
    if (score >= 75) return '#1A7D42';
    if (score >= 50) return '#2C5282';
    return '#A3A3A3';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#171717] tracking-tight">Talent Pool</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">{count.toLocaleString()} contacts{filtered.length !== count ? ` · ${filtered.length} shown` : ''}</p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C108AB] text-white text-sm font-medium hover:bg-[#A50798] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Upload className="w-4 h-4" />
          Import from LinkedIn
        </button>
      </div>

      {/* Search + Filters */}
      <div
        className="bg-white p-5 space-y-4"
        style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
      >
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4D4D4]" />
            <input
              placeholder="Search by name, title, headline, skills..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-11 pr-4 py-2.5 bg-[#FAFAFA] border border-[#EBEBEB] text-sm text-[#171717] placeholder:text-[#D4D4D4] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200"
            />
          </div>
          <select
            value={countryFilter}
            onChange={e => { setCountryFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 bg-[#FAFAFA] border border-[#EBEBEB] text-sm text-[#171717] focus:outline-none focus:border-[#C108AB]/40 min-w-[140px] transition-all duration-200"
          >
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={tierFilter}
            onChange={e => { setTierFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 bg-[#FAFAFA] border border-[#EBEBEB] text-sm text-[#171717] focus:outline-none focus:border-[#C108AB]/40 min-w-[120px] transition-all duration-200"
          >
            <option value="">All Tiers</option>
            <option value="S">S — C-Suite Elite</option>
            <option value="A">A — Senior Leader</option>
            <option value="B">B — Mid-Senior</option>
            <option value="C">C — Emerging</option>
          </select>
        </div>

        {/* Seniority chips */}
        <div className="flex flex-wrap gap-2">
          {SENIORITY_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => toggleSeniority(s.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                seniorityFilter.includes(s.value)
                  ? 'text-[#C108AB]'
                  : 'text-[#A3A3A3] hover:text-[#171717]'
              }`}
              style={{
                background: seniorityFilter.includes(s.value) ? 'rgba(193,8,171,0.06)' : '#F7F7F7',
                border: seniorityFilter.includes(s.value) ? '1px solid rgba(193,8,171,0.2)' : '1px solid transparent',
              }}
            >
              {s.label}
            </button>
          ))}
          {(search || seniorityFilter.length || countryFilter || tierFilter) && (
            <button
              onClick={() => { setSearch(''); setSeniorityFilter([]); setCountryFilter(''); setTierFilter(''); setPage(0); }}
              className="px-3 py-1.5 text-xs font-medium text-[#C108AB] hover:bg-[rgba(193,8,171,0.06)] transition-colors duration-200"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" />
          <span className="ml-3 text-sm text-[#A3A3A3]">Loading talent pool...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div
          className="bg-white p-16 text-center"
          style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
        >
          <Users className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3 opacity-50" />
          <p className="text-[#A3A3A3]">No candidates match your filters</p>
        </div>
      ) : (
        <div
          className="bg-white overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F7F7F7]">
                  <th onClick={() => toggleSort('name')} className="text-left px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px] cursor-pointer hover:text-[#171717] select-none transition-colors">
                    <span className="flex items-center gap-1.5">Name <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px]">Current Role</th>
                  <th onClick={() => toggleSort('country')} className="text-left px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px] cursor-pointer hover:text-[#171717] select-none transition-colors">
                    <span className="flex items-center gap-1.5">Location <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th onClick={() => toggleSort('seniority')} className="text-left px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px] cursor-pointer hover:text-[#171717] select-none transition-colors">
                    <span className="flex items-center gap-1.5">Seniority <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th onClick={() => toggleSort('score')} className="text-center px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px] cursor-pointer hover:text-[#171717] select-none transition-colors">
                    <span className="flex items-center justify-center gap-1.5">Score <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-center px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px]">Tier</th>
                  <th className="text-center px-6 py-4 text-[11px] font-bold text-[#A3A3A3] uppercase tracking-[1.5px]">Links</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => {
                  const tier = getTier(c.trident_composite, !!c.cxo_stamp);
                  const tierStyle = TIER_STYLES[tier];
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[#F7F7F7] transition-colors duration-150 cursor-pointer hover:bg-[#FAFAFA]"
                      onClick={() => navigate(`/platform/candidates/${c.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-[#C108AB] hover:text-[#A50798] transition-colors">{c.name}</p>
                          {c.headline && <p className="text-[11px] text-[#A3A3A3] truncate max-w-[220px] mt-0.5">{c.headline}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#171717] font-medium truncate max-w-[200px]">{c.current_title || '—'}</p>
                        <p className="text-[11px] text-[#A3A3A3]">{c.company?.name || c.career_history?.[0]?.company || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[#A3A3A3] text-xs">
                          <MapPin className="w-3 h-3" />
                          {c.city ? `${c.city}, ${c.country}` : c.country || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#525252] capitalize font-medium">{(c.seniority || '—').replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="font-mono font-bold text-base"
                          style={{ color: getScoreColor(c.trident_composite) }}
                        >
                          {c.trident_composite ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-block text-[10px] font-bold px-2.5 py-1 uppercase tracking-wide"
                          style={{ background: tierStyle.bg, color: tierStyle.text }}
                        >
                          {tier} · {TIER_BADGES[tier]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-[#F7F7F7] transition-colors" title="LinkedIn"
                              onClick={(e) => e.stopPropagation()}>
                              <Linkedin className="w-4 h-4 text-[#2C5282]" />
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#F7F7F7]">
              <p className="text-xs text-[#A3A3A3]">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 bg-[#F7F7F7] disabled:opacity-30 hover:bg-[#F7F7F7] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#A3A3A3] font-medium px-2">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 bg-[#F7F7F7] disabled:opacity-30 hover:bg-[#F7F7F7] transition-colors"
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
