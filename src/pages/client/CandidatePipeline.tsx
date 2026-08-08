/**
 * CandidatePipeline — Full pipeline view (Phase 8)
 *
 * Extends the candidate list with mandate selection,
 * comparison mode, and quick-review integration.
 */
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GitBranch, Scale, X, ArrowRight } from 'lucide-react';
import { CandidateList } from '@/components/client/CandidateList';
import { ComparisonView } from '@/components/client/ComparisonView';
import { fetchClientMandates, fetchShortlist, type ClientMandate, type ShortlistCandidate } from '@/services/clientService';

export function CandidatePipeline() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mandateId = searchParams.get('mandate') || '';

  const [mandates, setMandates] = React.useState<ClientMandate[]>([]);
  const [selectedMandate, setSelectedMandate] = React.useState<string>(mandateId);
  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [compareList, setCompareList] = React.useState<ShortlistCandidate[]>([]);
  const [compareCandidates, setCompareCandidates] = React.useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await fetchClientMandates();
      if (!cancelled) {
        setMandates(m);
        if (!selectedMandate && m.length > 0) {
          setSelectedMandate(m[0].id);
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadComparisonCandidates = async (mid: string) => {
    const sl = await fetchShortlist(mid);
    setCompareCandidates(sl);
  };

  const handleCandidateSelect = (c: ShortlistCandidate) => {
    if (comparisonMode) {
      setCompareList(prev => {
        if (prev.find(p => p.id === c.id)) return prev;
        if (prev.length >= 4) return prev;
        return [...prev, c];
      });
    } else {
      navigate(`/client-portal/reviews?candidate=${c.id}&mandate=${selectedMandate}`);
    }
  };

  const startComparison = async () => {
    setComparisonMode(true);
    setCompareList([]);
    if (selectedMandate) {
      await loadComparisonCandidates(selectedMandate);
    }
  };

  const endComparison = () => {
    setComparisonMode(false);
    setCompareList([]);
  };

  const toggleCompareCandidate = (c: ShortlistCandidate) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === c.id)) return prev.filter(p => p.id !== c.id);
      if (prev.length >= 4) return prev;
      return [...prev, c];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        <GitBranch className="w-5 h-5 animate-pulse mr-2" />
        Loading pipeline...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Candidate Pipeline</h1>
          <p className="text-sm text-text-muted">View and manage candidates across mandates</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mandate selector */}
          <select
            value={selectedMandate}
            onChange={e => {
              setSelectedMandate(e.target.value);
              setCompareList([]);
            }}
            className="text-sm bg-white border border-bg-tertiary px-3 py-2 focus:border-[#C108AB] focus:outline-none"
          >
            {mandates.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>

          {!comparisonMode ? (
            <button
              onClick={startComparison}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white"
              style={{ background: '#C108AB' }}
            >
              <Scale className="w-4 h-4" />
              Compare Candidates
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                {compareList.length}/4 selected
              </span>
              <button
                onClick={endComparison}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary border border-bg-tertiary hover:bg-bg-tertiary"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              {compareList.length >= 2 && (
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white"
                  style={{ background: '#C108AB' }}
                >
                  Compare
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparison mode selection overlay */}
      {comparisonMode && compareCandidates.length > 0 && (
        <div className="bg-[#C108AB]/5 border border-[#C108AB] p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: '#C108AB' }}>
              Select up to 4 candidates to compare:
            </span>
            {compareCandidates.map(c => {
              const isSelected = compareList.find(p => p.id === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCompareCandidate(c)}
                  className={`px-2 py-1 text-xs border transition-colors ${
                    isSelected
                      ? 'text-white border-transparent'
                      : 'text-text-secondary border-bg-tertiary hover:border-text-muted'
                  }`}
                  style={isSelected ? { background: '#C108AB' } : undefined}
                >
                  {c.candidate_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline */}
      {selectedMandate ? (
        <CandidateList mandateId={selectedMandate} onCandidateSelect={handleCandidateSelect} />
      ) : (
        <div className="bg-white border border-bg-tertiary p-8 text-center">
          <GitBranch className="w-8 h-8 mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No mandate selected.</p>
        </div>
      )}

      {/* Comparison section */}
      {comparisonMode && compareList.length >= 2 && (
        <ComparisonView candidates={compareList} onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))} />
      )}
    </div>
  );
}

export default CandidatePipeline;