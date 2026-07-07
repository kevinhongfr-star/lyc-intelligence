import React, { useMemo, useState } from 'react';
import { OpportunityFilters, DEFAULT_FILTERS, type OpportunityFiltersState } from '@/components/candidate/OpportunityFilters';
import { OpportunityList, MOCK_OPPORTUNITIES, type Opportunity } from '@/components/candidate/OpportunityList';
import { OpportunityDetail } from '@/components/candidate/OpportunityDetail';

export function CandidateOpportunitiesPage() {
  const [filters, setFilters] = useState<OpportunityFiltersState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_OPPORTUNITIES[0].id);

  const filtered: Opportunity[] = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter((op) => {
      if (filters.industry !== 'All' && op.industry !== filters.industry) return false;
      if (filters.location !== 'All' && op.location !== filters.location) return false;
      if (filters.seniority !== 'All' && op.seniority !== filters.seniority) return false;
      return true;
    });
  }, [filters]);

  const selected = useMemo(
    () => MOCK_OPPORTUNITIES.find((op) => op.id === selectedId) || filtered[0] || null,
    [selectedId, filtered]
  );

  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-6">
        <h1 className="font-serif text-2xl font-bold text-text-primary">Opportunities</h1>
        <p className="text-text-muted mt-1">Curated roles matched to your profile</p>
      </header>

      <OpportunityFilters filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OpportunityList
            opportunities={filtered}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-2">
          <OpportunityDetail opportunity={selected} />
        </div>
      </div>
    </div>
  );
}
