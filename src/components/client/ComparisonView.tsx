/**
 * ComparisonView — Side-by-side candidate comparison (Phase 8)
 *
 * Compares selected candidates across scoring dimensions with:
 *   - Side-by-side dimension comparison
 *   - Winner indicators per dimension
 *   - Normalized score visualization
 *   - Key decision summary
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Trophy, X } from 'lucide-react';
import { TIER_STYLES, type ShortlistCandidate } from '@/services/clientService';

interface DimensionRow {
  key: string;
  label: string;
  higherIsBetter: boolean;
}

const DEFAULT_DIMENSIONS: DimensionRow[] = [
  { key: 'experience', label: 'Experience', higherIsBetter: true },
  { key: 'skills_match', label: 'Skills Match', higherIsBetter: true },
  { key: 'culture_fit', label: 'Culture Fit', higherIsBetter: true },
  { key: 'leadership', label: 'Leadership', higherIsBetter: true },
  { key: 'compensation', label: 'Compensation', higherIsBetter: false },
];

interface Props {
  candidates: ShortlistCandidate[];
  dimensions?: DimensionRow[];
  onRemove?: (id: string) => void;
  onClose?: () => void;
}

export function ComparisonView({ candidates, dimensions = DEFAULT_DIMENSIONS, onRemove, onClose }: Props) {
  if (candidates.length < 2) {
    return (
      <div className="bg-white border border-bg-tertiary p-8 text-center">
        <BarChart3 className="w-8 h-8 mx-auto text-text-muted mb-3" />
        <h3 className="text-sm font-semibold text-text-primary">Select at least 2 candidates</h3>
        <p className="text-xs text-text-muted mt-1">Add more candidates to compare them side by side</p>
      </div>
    );
  }

  // Compute normalized dimension scores per candidate
  const normalized = React.useMemo(() => {
    return candidates.map(c => {
      const dims: Record<string, number> = {};
      for (const dim of dimensions) {
        dims[dim.key] = c.score ?? 0;
      }
      return { ...c, normalizedDims: dims };
    });
  }, [candidates, dimensions]);

  // Determine winner per dimension
  const getWinnerIndex = (dimKey: string, higherIsBetter: boolean): number => {
    let bestIdx = 0;
    let bestVal = higherIsBetter ? -Infinity : Infinity;
    for (let i = 0; i < normalized.length; i++) {
      const val = normalized[i].normalizedDims[dimKey] ?? 0;
      if (higherIsBetter ? val > bestVal : val < bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const tierOrder: Record<string, number> = { Gold: 0, Silver: 1, Bronze: 2, Unranked: 3 };
  const topByTier = [...candidates].sort((a, b) => {
    const td = (tierOrder[a.tier] ?? 4) - (tierOrder[b.tier] ?? 4);
    if (td !== 0) return td;
    return (b.score ?? 0) - (a.score ?? 0);
  })[0];

  return (
    <div className="bg-white border border-bg-tertiary">
      {/* Header */}
      <div className="px-4 py-3 border-b border-bg-tertiary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: '#C108AB' }} />
          <h3 className="text-sm font-semibold text-text-primary">Candidate Comparison</h3>
          <span className="text-xs text-text-muted">({candidates.length} candidates)</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted w-40">
                Dimension
              </th>
              {candidates.map(c => (
                <th key={c.id} className="px-4 py-3 text-left min-w-[160px]">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text-primary truncate max-w-[120px]">
                        {c.candidate_name}
                      </div>
                      <div className="text-xs text-text-muted truncate max-w-[120px]">{c.current_title}</div>
                    </div>
                    {onRemove && (
                      <button
                        onClick={() => onRemove(c.id)}
                        className="p-0.5 text-text-muted hover:text-red-500"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className={TIER_STYLES[c.tier]}>{c.tier}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map(dim => {
              const winnerIdx = getWinnerIndex(dim.key, dim.higherIsBetter);
              return (
                <tr key={dim.key} className="border-t border-bg-tertiary hover:bg-bg-secondary">
                  <td className="px-4 py-3 text-xs font-medium text-text-primary">{dim.label}</td>
                  {normalized.map((c, idx) => {
                    const val = c.normalizedDims[dim.key] ?? 0;
                    const isWinner = idx === winnerIdx;
                    return (
                      <td
                        key={c.id}
                        className={`px-4 py-3 ${isWinner ? 'bg-[#C108AB]/5' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-sm font-semibold ${
                                  isWinner ? '' : 'text-text-secondary'
                                }`}
                                style={isWinner ? { color: '#C108AB' } : undefined}
                              >
                                {val}
                              </span>
                              {isWinner && <Trophy className="w-3 h-3" style={{ color: '#C108AB' }} />}
                            </div>
                            <div className="w-full h-1.5 bg-bg-tertiary mt-1">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${val}%`,
                                  background: isWinner ? '#C108AB' : '#D1D5DB',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Overall Score */}
            <tr className="border-t-2 border-bg-tertiary bg-bg-secondary">
              <td className="px-4 py-3 text-xs font-semibold text-text-primary">Overall Score</td>
              {candidates.map(c => {
                const isTop = c.id === topByTier?.id;
                return (
                  <td key={c.id} className="px-4 py-3">
                    <div
                      className={`text-lg font-bold ${isTop ? '' : 'text-text-secondary'}`}
                      style={isTop ? { color: '#C108AB' } : undefined}
                    >
                      {c.score}
                      <span className="text-xs font-normal text-text-muted ml-1">/100</span>
                    </div>
                    {isTop && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium" style={{ color: '#C108AB' }}>
                        <TrendingUp className="w-3 h-3" />
                        Recommended
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Decision summary */}
      <div className="px-4 py-3 border-t border-bg-tertiary bg-bg-secondary">
        <div className="flex items-center gap-2 text-xs">
          <Trophy className="w-3 h-3" style={{ color: '#C108AB' }} />
          <span className="font-medium text-text-primary">Top candidate:</span>
          <span style={{ color: '#C108AB' }}>{topByTier?.candidate_name}</span>
          <span className="text-text-muted">— {topByTier?.tier} tier, score {topByTier?.score}</span>
        </div>
      </div>
    </div>
  );
}

export default ComparisonView;