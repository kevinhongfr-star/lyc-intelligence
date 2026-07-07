import React from 'react';

export interface OpportunityFiltersState {
  industry: string;
  location: string;
  seniority: string;
}

export const DEFAULT_FILTERS: OpportunityFiltersState = {
  industry: 'All',
  location: 'All',
  seniority: 'All',
};

const INDUSTRIES = ['All', 'Fintech', 'SaaS', 'Healthcare', 'Consumer', 'Infrastructure'];
const LOCATIONS = ['All', 'Singapore', 'Hong Kong', 'Remote APAC', 'London', 'New York'];
const SENIORITY = ['All', 'VP', 'C-Level', 'Director', 'Head of'];

interface OpportunityFiltersProps {
  filters: OpportunityFiltersState;
  onChange: (filters: OpportunityFiltersState) => void;
}

const SELECT_CLASS =
  'px-3 py-2 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:outline-none focus:border-accent';

export function OpportunityFilters({ filters, onChange }: OpportunityFiltersProps) {
  const handle = (field: keyof OpportunityFiltersState) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, [field]: e.target.value });
  };

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs uppercase tracking-wider text-text-muted">Filters</span>
        <div className="flex flex-col">
          <label className="text-xs text-text-muted mb-1">Industry</label>
          <select value={filters.industry} onChange={handle('industry')} className={SELECT_CLASS}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-text-muted mb-1">Location</label>
          <select value={filters.location} onChange={handle('location')} className={SELECT_CLASS}>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-text-muted mb-1">Seniority</label>
          <select value={filters.seniority} onChange={handle('seniority')} className={SELECT_CLASS}>
            {SENIORITY.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
