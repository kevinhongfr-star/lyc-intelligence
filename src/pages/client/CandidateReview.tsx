/**
 * CandidateReview — Review and scoring page (Phase 8)
 *
 * Provides the candidate review form, comparison view,
 * and interview feedback submission.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  ArrowLeft,
  Eye,
  Users,
} from 'lucide-react';
import { CandidateReviewForm } from '@/components/client/CandidateReviewForm';
import { ComparisonView } from '@/components/client/ComparisonView';
import {
  fetchCandidate,
  fetchShortlist,
  type Candidate,
  type ShortlistCandidate,
} from '@/services/clientService';

export function CandidateReview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const candidateId = searchParams.get('candidate') || '';
  const mandateId = searchParams.get('mandate') || '';

  const [candidate, setCandidate] = React.useState<Candidate | null>(null);
  const [shortlist, setShortlist] = React.useState<ShortlistCandidate[]>([]);
  const [view, setView] = React.useState<'review' | 'comparison'>('review');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!candidateId || !mandateId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const [c, sl] = await Promise.all([
        fetchCandidate(candidateId),
        fetchShortlist(mandateId),
      ]);
      if (!cancelled) {
        setCandidate(c);
        setShortlist(sl);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId, mandateId]);

  const handleSwitchCandidate = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('candidate', id);
    setSearchParams(newParams);
    setCandidate(null);
    setSubmitted(false);
  };

  const handleSubmitted = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Candidate Reviews</h1>
          <p className="text-sm text-text-muted">Review and provide feedback on candidates</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-bg-tertiary">
            <button
              onClick={() => setView('review')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 ${
                view === 'review' ? 'text-white' : 'text-text-muted hover:text-text-primary'
              }`}
              style={view === 'review' ? { background: '#C108AB' } : undefined}
            >
              <ClipboardCheck className="w-3 h-3" />
              Review Form
            </button>
            <button
              onClick={() => setView('comparison')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 border-l border-bg-tertiary ${
                view === 'comparison' ? 'text-white' : 'text-text-muted hover:text-text-primary'
              }`}
              style={view === 'comparison' ? { background: '#C108AB' } : undefined}
            >
              <Eye className="w-3 h-3" />
              Compare
            </button>
          </div>
        </div>
      </div>

      {submitted && (
        <div className="flex items-center gap-2 p-3 border border-teal-300 bg-teal-50 text-sm text-teal-700">
          <ClipboardCheck className="w-4 h-4" />
          Review submitted successfully!
        </div>
      )}

      {view === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left: candidate selector */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-bg-tertiary">
              <div className="px-4 py-3 border-b border-bg-tertiary">
                <h3 className="text-sm font-semibold text-text-primary">Shortlist</h3>
                <p className="text-xs text-text-muted">{shortlist.length} candidates</p>
              </div>
              <div className="max-h-[500px] overflow-auto divide-y divide-bg-tertiary">
                {shortlist.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted">No candidates</div>
                ) : (
                  shortlist.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSwitchCandidate(c.id)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-bg-secondary transition-colors ${
                        c.id === candidateId ? 'bg-bg-secondary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: '#C108AB' }}>
                          {c.candidate_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-text-primary truncate">{c.candidate_name}</div>
                          <div className="text-xs text-text-muted truncate">{c.current_title}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: review form */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-text-muted text-sm">
                <ClipboardCheck className="w-5 h-5 animate-pulse mr-2" />
                Loading candidate...
              </div>
            ) : candidate ? (
              <CandidateReviewForm
                candidateId={candidate.id}
                mandateId={mandateId}
                candidateName={candidate.full_name}
                onSubmitted={handleSubmitted}
              />
            ) : (
              <div className="bg-white border border-bg-tertiary p-8 text-center">
                <Users className="w-8 h-8 mx-auto text-text-muted mb-3" />
                <p className="text-sm text-text-muted">
                  {candidateId ? 'Candidate not found.' : 'Select a candidate from the shortlist to begin.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'comparison' && (
        <ComparisonView candidates={shortlist} />
      )}
    </div>
  );
}

export default CandidateReview;