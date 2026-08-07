/**
 * CandidateReviewForm — Review/scoring form for candidates (Phase 8)
 *
 * Allows client users to score candidates across predefined dimensions
 * (experience, skills_match, culture_fit, leadership, compensation),
 * provide strengths/concerns, and submit a decision.
 */
import React from 'react';
import { Star, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { submitCandidateFeedback, type SubmitFeedbackPayload } from '@/services/clientService';

interface Dimension {
  key: string;
  label: string;
  description: string;
}

const REVIEW_DIMENSIONS: Dimension[] = [
  { key: 'experience', label: 'Experience', description: 'Relevance of work history to mandate' },
  { key: 'skills_match', label: 'Skills Match', description: 'Alignment with required skills' },
  { key: 'culture_fit', label: 'Culture Fit', description: 'Alignment with client culture' },
  { key: 'leadership', label: 'Leadership', description: 'Leadership capability and track record' },
  { key: 'compensation', label: 'Compensation', description: 'Salary expectation vs range (lower is better)' },
];

interface Props {
  candidateId: string;
  mandateId: string;
  candidateName?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const DECISIONS: { value: SubmitFeedbackPayload['decision']; label: string; className: string }[] = [
  { value: 'interested', label: 'Interested', className: 'text-teal-700 border-teal-300 bg-teal-50' },
  { value: 'want_to_interview', label: 'Request Interview', className: 'text-blue-700 border-blue-300 bg-blue-50' },
  { value: 'not_interested', label: 'Not Interested', className: 'text-red-700 border-red-300 bg-red-50' },
];

export function CandidateReviewForm({
  candidateId,
  mandateId,
  candidateName = 'Candidate',
  onSubmitted,
  onCancel,
}: Props) {
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [decision, setDecision] = React.useState<SubmitFeedbackPayload['decision']>('interested');
  const [comments, setComments] = React.useState('');
  const [strengths, setStrengths] = React.useState<string[]>([]);
  const [concerns, setConcerns] = React.useState<string[]>([]);
  const [strengthInput, setStrengthInput] = React.useState('');
  const [concernInput, setConcernInput] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const averageScore = React.useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [scores]);

  const updateScore = (key: string, score: number) => {
    setScores(prev => ({ ...prev, [key]: score }));
  };

  const addStrength = () => {
    const v = strengthInput.trim();
    if (v && !strengths.includes(v)) {
      setStrengths(prev => [...prev, v]);
      setStrengthInput('');
    }
  };

  const addConcern = () => {
    const v = concernInput.trim();
    if (v && !concerns.includes(v)) {
      setConcerns(prev => [...prev, v]);
      setConcernInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const ok = await submitCandidateFeedback(candidateId, {
      mandate_id: mandateId,
      decision,
      comments: comments.trim() || undefined,
      strengths: strengths.length > 0 ? strengths : undefined,
      concerns: concerns.length > 0 ? concerns : undefined,
    });

    setSubmitting(false);

    if (ok) {
      onSubmitted?.();
    } else {
      setError('Failed to submit review. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-bg-tertiary p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Review: {candidateName}</h2>
            <p className="text-sm text-text-muted">
              Provide structured feedback across key dimensions
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: '#C108AB' }}>
              {averageScore}
            </div>
            <div className="text-xs text-text-muted">Average Score</div>
          </div>
        </div>
      </div>

      {/* Dimension scoring */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">Score Dimensions</h3>
        </div>
        <div className="p-4 space-y-4">
          {REVIEW_DIMENSIONS.map(dim => (
            <div key={dim.key} className="border-b border-bg-tertiary pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <label className="text-sm font-medium text-text-primary">{dim.label}</label>
                  <p className="text-xs text-text-muted">{dim.description}</p>
                </div>
                <span
                  className="text-lg font-semibold w-10 text-center"
                  style={{ color: scores[dim.key] ? '#C108AB' : 'transparent' }}
                >
                  {scores[dim.key] || '–'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => updateScore(dim.key, scores[dim.key] === n ? 0 : n * 20)}
                    className="p-1"
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        scores[dim.key] >= n * 20 ? '' : 'text-gray-300'
                      }`}
                      style={{ color: scores[dim.key] >= n * 20 ? '#C108AB' : undefined }}
                      fill={scores[dim.key] >= n * 20 ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">Your Decision</h3>
        </div>
        <div className="p-4 flex gap-3">
          {DECISIONS.map(d => (
            <label
              key={d.value}
              className={`flex-1 cursor-pointer border p-3 text-center text-sm font-medium transition-colors ${
                decision === d.value ? d.className : 'border-bg-tertiary text-text-muted hover:border-text-muted'
              }`}
            >
              <input
                type="radio"
                name="decision"
                value={d.value}
                checked={decision === d.value}
                onChange={() => setDecision(d.value)}
                className="sr-only"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">Strengths</h3>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={strengthInput}
              onChange={e => setStrengthInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStrength())}
              placeholder="Add a strength..."
              className="flex-1 px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
            />
            <button
              type="button"
              onClick={addStrength}
              className="px-3 py-2 text-xs font-medium text-white"
              style={{ background: '#C108AB' }}
            >
              Add
            </button>
          </div>
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {strengths.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-300"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setStrengths(prev => prev.filter(x => x !== s))}
                    className="hover:text-teal-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Concerns */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">Concerns</h3>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={concernInput}
              onChange={e => setConcernInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addConcern())}
              placeholder="Add a concern..."
              className="flex-1 px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
            />
            <button
              type="button"
              onClick={addConcern}
              className="px-3 py-2 text-xs font-medium text-white"
              style={{ background: '#C108AB' }}
            >
              Add
            </button>
          </div>
          {concerns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {concerns.map(c => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-300"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => setConcerns(prev => prev.filter(x => x !== c))}
                    className="hover:text-red-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">Additional Comments</h3>
        </div>
        <div className="p-4">
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Any additional feedback about this candidate..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 border border-red-300 bg-red-50 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-bg-tertiary hover:bg-bg-tertiary"
          >
            Cancel
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-text-muted">
            {Object.keys(scores).length} of {REVIEW_DIMENSIONS.length} dimensions scored
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#C108AB' }}
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CandidateReviewForm;