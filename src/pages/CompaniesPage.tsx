import React, { useState, useMemo } from 'react';
import { Search, Building2, Globe, Loader2, Users, ExternalLink, TrendingUp, Filter } from 'lucide-react';
import { useCompanies } from '@/hooks/useSupabaseData';
import { Card, CardContent, Badge } from '@/components/ui';

const INDUSTRY_OPTIONS = [
  'Mining & Metals', 'Energy', 'Technology', 'Financial Services',
  'Healthcare', 'Consumer Goods', 'Industrial', 'Real Estate',
  'Telecommunications', 'Transportation', 'Media', 'Agriculture'
];

const STAIN_COLORS: Record<string, string> = {
  'A': 'text-green-500 bg-green-500/10',
  'B': 'text-blue-500 bg-blue-500/10',
  'C': 'text-yellow-500 bg-yellow-500/10',
  'D': 'text-red-500 bg-red-500/10',
};

export function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const { data: companies, count, loading } = useCompanies({
    query: search || undefined,
    industry: industry || undefined,
    country: country || undefined,
    limit,
    offset: page * limit,
  });

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) if (c.country) set.add(c.country);
    return Array.from(set).sort();
  }, [companies]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Target Companies</h1>
          <p className="text-text-muted">{count.toLocaleString()} companies in database</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            placeholder="Search companies by name or industry..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={industry}
          onChange={e => { setIndustry(e.target.value); setPage(0); }}
          className="px-3 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent min-w-[160px]"
        >
          <option value="">All Industries</option>
          {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setPage(0); }}
          className="px-3 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent min-w-[140px]"
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c ?? ''}>{c}</option>)}
        </select>
        {(search || industry || country) && (
          <button
            onClick={() => { setSearch(''); setIndustry(''); setCountry(''); setPage(0); }}
            className="px-3 py-2.5 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-text-muted text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
          <p className="text-text-muted">No companies found</p>
          <p className="text-text-muted/60 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(company => (
              <Card key={company.id} className="hover:border-accent/30 transition-colors">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary leading-tight">{company.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">{company.industry || 'Unknown industry'}</p>
                      </div>
                    </div>
                    {company.stain_tier && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STAIN_COLORS[company.stain_tier] || 'text-text-muted bg-bg-tertiary'}`}>
                        {company.stain_tier}
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-bg-tertiary rounded">
                      <p className="text-lg font-bold text-text-primary">{company.total_contacts || 0}</p>
                      <p className="text-[10px] text-text-muted">Contacts</p>
                    </div>
                    <div className="text-center p-2 bg-bg-tertiary rounded">
                      <p className="text-lg font-bold text-text-primary">{company.active_mandates || 0}</p>
                      <p className="text-[10px] text-text-muted">Mandates</p>
                    </div>
                    <div className="text-center p-2 bg-bg-tertiary rounded">
                      <p className="text-lg font-bold text-text-primary">{company.engagement_score || 0}</p>
                      <p className="text-[10px] text-text-muted">Engagement</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-text-muted">
                    {company.country && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-bg-tertiary rounded">
                        <Globe className="w-3 h-3" />{company.country}
                      </span>
                    )}
                    {company.headcount_range && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-bg-tertiary rounded">
                        <Users className="w-3 h-3" />{company.headcount_range}
                      </span>
                    )}
                    {company.stain_group && (
                      <span className="px-1.5 py-0.5 bg-bg-tertiary rounded">{company.stain_group}</span>
                    )}
                  </div>

                  {/* Links */}
                  {(company.website || company.linkedin_url) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-bg-tertiary">
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80">
                          <ExternalLink className="w-3 h-3" />Website
                        </a>
                      )}
                      {company.linkedin_url && (
                        <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80">
                          <ExternalLink className="w-3 h-3" />LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm bg-bg-secondary border border-bg-tertiary rounded disabled:opacity-40 hover:border-accent transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm bg-bg-secondary border border-bg-tertiary rounded disabled:opacity-40 hover:border-accent transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
