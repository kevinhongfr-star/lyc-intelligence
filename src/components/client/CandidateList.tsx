/**
 * CandidateList — Candidate pipeline view (Phase 8)
 *
 * Displays candidates in a Kanban-style board grouped by pipeline stage,
 * with tier badges, scores, and filtering/sorting options.
 */
import React from 'react';
import { Search, Filter, ArrowUpDown, Users } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import {
  fetchShortlist,
  fetchMandatePipeline,
  type ShortlistCandidate,
  type PipelineStage,
  type Tier,
  type HealthStatus,
} from '@/services/clientService';

interface Props {
  mandateId: string;
  onCandidateSelect?: (candidate: ShortlistCandidate) => void;
}

const PIPELINE_STAGES = [
  { key: 'sourced', label: 'Sourced', color: 'bg-gray-400' },
  { key: 'screened', label: 'Screened', color: 'bg-blue-500' },
  { key: 'shortlist', label: 'Shortlist', color: 'bg-purple-500' },
  { key: 'interview', label: 'Interview', color: 'bg-amber-500' },
  { key: 'offer', label: 'Offer', color: 'bg-teal-500' },
  { key: 'placed', label: 'Placed', color: 'bg-green-500' },
];

const TIER_FILTERS: Tier[] = ['Gold', 'Silver', 'Bronze', 'Unranked'];

export function CandidateList({ mandateId, onCandidateSelect }: Props) {
  const [candidates, setCandidates] = React.useState<ShortlistCandidate[]>([]);
  const [stages, setStages] = React.useState<PipelineStage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedTiers, setSelectedTiers] = React.useState<Set<Tier>>(new Set());
  const [sortBy, setSortBy] = React.useState<'tier' | 'score' | 'name'>('tier');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sl, ps] = await Promise.all([
        fetchShortlist(mandateId),
        fetchMandatePipeline(mandateId),
      ]);
      if (!cancelled) {
        setCandidates(sl);
        setStages(ps);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mandateId]);

  const filtered = React.useMemo(() => {
    let list = candidates;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.candidate_name.toLowerCase().includes(q) ||
        c.current_title.toLowerCase().includes(q) ||
        c.current_company.toLowerCase().includes(q),
      );
    }

    if (selectedTiers.size > 0) {
      list = list.filter(c => selectedTiers.has(c.tier));
    }

    const tierOrder: Record<Tier, number> = { Gold: 0, Silver: 1, Bronze: 2, Unranked: 3 };

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'score': return (b.score ?? 0) - (a.score ?? 0);
        case 'name': return a.candidate_name.localeCompare(b.candidate_name);
        case 'tier':
        default: {
          const td = tierOrder[a.tier] - tierOrder[b.tier];
          if (td !== 0) return td;
          return (b.score ?? 0) - (a.score ?? 0);
        }
      }
    });

    return list;
  }, [candidates, search, selectedTiers, sortBy]);

  const toggleTier = (t: Tier) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  // Group by pipeline stage for Kanban view
  const groupedByStage = React.useMemo(() => {
    const groups: Record<string, ShortlistCandidate[]> = {};
    for (const c of filtered) {
      const stage = c.pipeline_stage || 'sourced';
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(c);
    }
    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <Users className="w-5 h-5 animate-pulse" />
        <span className="ml-2 text-sm">Loading candidates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="bg-white border border-bg-tertiary p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-4 h-4 text-text-muted" />
              {TIER_FILTERS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTier(t)}
                  className={`px-2 py-1 border text-xs font-medium transition-colors ${
                    selectedTiers.has(t)
                      ? 'text-white border-transparent'
                      : 'text-text-muted border-bg-tertiary hover:border-text-muted'
                  }`}
                  style={selectedTiers.has(t) ? { background: '#C108AB' } : undefined}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-text-muted" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs bg-bg-secondary border border-bg-tertiary px-2 py-1.5 focus:border-[#C108AB] focus:outline-none"
            >
              <option value="tier">Sort: Tier</option>
              <option value="score">Sort: Score</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
          <span>{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</span>
          {stages.map(s => (
            <span key={s.label} className="flex items-center gap-1">
              <span className="w-2 h-2" style={{ background: '#C108AB' }} />
              {s.label}: {s.count}
            </span>
          ))}
        </div>
      </div>

      {/* Pipeline Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const stageCandidates = groupedByStage[stage.key] || [];
          return (
            <div key={stage.key} className="bg-bg-secondary border border-bg-tertiary">
              <div className="px-3 py-2 flex items-center justify-between border-b border-bg-tertiary bg-white">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${stage.color}`} />
                  <span className="text-xs font-semibold text-text-primary">{stage.label}</span>
                </div>
                <span className="text-xs text-text-muted">{stageCandidates.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {stageCandidates.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-4">—</div>
                ) : (
                  stageCandidates.map(c => (
                    <button
                      key={c.id}
                      onClick={() => onCandidateSelect?.(c)}
                      className="w-full text-left bg-white border border-bg-tertiary p-2 hover:border-[#C108AB] transition-colors"
                    >
                      <div className="text-xs font-medium text-text-primary truncate">
                        {c.candidate_name}
                      </div>
                      <div className="text-xs text-text-muted truncate">{c.current_title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 ${
                            c.tier === 'Gold' ? 'bg-amber-100 text-amber-800' :
                            c.tier === 'Silver' ? 'bg-gray-100 text-gray-700' :
                            c.tier === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                            'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {c.tier}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: '#C108AB' }}>
                          {c.score}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CandidateList;