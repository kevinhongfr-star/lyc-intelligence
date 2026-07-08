import React, { useState, useEffect } from 'react';
import { X, Trophy, TrendingUp, Award, Users, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { getScoreColor, getVerdictLabel } from '@/types/pipelineStages';
import { getContact } from '@/services/supabaseApi';
import type { Contact } from '@/services/supabaseApi';

interface ComparisonCandidate {
  contact: Contact;
  overall_score: number;
  experience_score: number;
  skills_score: number;
  fit_score: number;
  verdict: 'strong_fit' | 'moderate_fit' | 'weak_fit';
  key_reasons: string[];
}

interface CandidateComparisonProps {
  candidateIds: string[];
  onClose: () => void;
  onRemoveCandidate?: (candidateId: string) => void;
}

export function CandidateComparison({ candidateIds, onClose, onRemoveCandidate }: CandidateComparisonProps) {
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'overall' | 'experience' | 'skills' | 'fit'>('overall');

  useEffect(() => {
    loadCandidates();
  }, [candidateIds]);

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);

    try {
      const loaded: ComparisonCandidate[] = await Promise.all(
        candidateIds.map(async (id) => {
          const contact = await getContact(id);
          if (!contact) throw new Error(`Candidate ${id} not found`);

          return {
            contact,
            overall_score: contact.trident_composite || 0,
            experience_score: contact.trident_d1 || 0,
            skills_score: contact.trident_d2 || 0,
            fit_score: contact.trident_d3 || 0,
            verdict: (contact.trident_composite || 0) >= 75 
              ? 'strong_fit' 
              : (contact.trident_composite || 0) >= 50 
                ? 'moderate_fit' 
                : 'weak_fit',
            key_reasons: contact.skills?.slice(0, 3).map(s => s.toString()) || [],
          };
        })
      );

      setCandidates(loaded);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  // Get best score in a dimension
  const getBestScore = (dimension: 'overall_score' | 'experience_score' | 'skills_score' | 'fit_score'): number => {
    return Math.max(...candidates.map(c => c[dimension]));
  };

  // Sort candidates by selected dimension
  const sortedCandidates = [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'overall':
        return b.overall_score - a.overall_score;
      case 'experience':
        return b.experience_score - a.experience_score;
      case 'skills':
        return b.skills_score - a.skills_score;
      case 'fit':
        return b.fit_score - a.fit_score;
      default:
        return 0;
    }
  });

  // Export comparison to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Title', 'Overall Score', 'Experience', 'Skills', 'Fit', 'Verdict'];
    const rows = sortedCandidates.map(c => [
      c.contact.name,
      c.contact.current_title || 'N/A',
      c.overall_score.toString(),
      c.experience_score.toString(),
      c.skills_score.toString(),
      c.fit_score.toString(),
      getVerdictLabel(c.verdict).label,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-text-muted mt-4">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error || candidates.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8 max-w-md">
          <p className="text-red-500 mb-4">{error || 'No candidates to compare'}</p>
          <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded-none">
            Close
          </button>
        </div>
      </div>
    );
  }

  const dimensions = [
    { key: 'overall_score' as const, label: 'Overall', icon: <Trophy className="w-4 h-4" /> },
    { key: 'experience_score' as const, label: 'Experience', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'skills_score' as const, label: 'Skills', icon: <Award className="w-4 h-4" /> },
    { key: 'fit_score' as const, label: 'Fit', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-tertiary flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Candidate Comparison</h2>
            <p className="text-sm text-text-muted">
              Comparing {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-none text-sm font-medium hover:bg-bg-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-none">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            {/* Header Row */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-bg-tertiary">
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary w-48">
                  Dimension
                </th>
                {sortedCandidates.map((c) => {
                  const verdictInfo = getVerdictLabel(c.verdict);
                  return (
                    <th key={c.contact.id} className="px-4 py-3 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: getScoreColor(c.overall_score) }}
                        >
                          {c.contact.name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{c.contact.name}</p>
                          <p className="text-xs text-text-muted truncate max-w-[150px]">
                            {c.contact.current_title || 'No title'}
                          </p>
                        </div>
                        <span
                          style={{ backgroundColor: verdictInfo.color }}
                          className="px-2 py-0.5 text-xs font-medium text-white rounded"
                        >
                          {verdictInfo.label}
                        </span>
                        {onRemoveCandidate && (
                          <button
                            onClick={() => onRemoveCandidate(c.contact.id)}
                            className="text-xs text-text-muted hover:text-red-500"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Dimension Rows */}
            <tbody>
              {dimensions.map((dim) => {
                const bestScore = getBestScore(dim.key);
                return (
                  <tr 
                    key={dim.key}
                    className="border-b border-bg-tertiary hover:bg-bg-secondary cursor-pointer"
                    onClick={() => setSortBy(dim.key === 'overall_score' ? 'overall' : dim.key.replace('_score', '') as any)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span style={{ color: getScoreColor(dim.key === 'overall_score' ? bestScore : bestScore) }}>
                          {dim.icon}
                        </span>
                        <span className="font-medium text-text-primary">{dim.label}</span>
                        {sortBy === dim.key.replace('_score', '') && (
                          <span className="text-xs text-accent">(sorted)</span>
                        )}
                      </div>
                    </td>
                    {sortedCandidates.map((c) => {
                      const score = c[dim.key];
                      const isBest = score === bestScore && bestScore > 0;
                      const scoreColor = getScoreColor(score);
                      
                      return (
                        <td key={c.contact.id} className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div 
                              className={`text-2xl font-bold ${isBest ? 'ring-2 ring-green-500 rounded-none px-2' : ''}`}
                              style={{ color: scoreColor }}
                            >
                              {score}
                            </div>
                            <div 
                              className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden"
                            >
                              <div 
                                className="h-full rounded-full"
                                style={{ width: `${score}%`, backgroundColor: scoreColor }}
                              />
                            </div>
                            {isBest && (
                              <Trophy className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Key Reasons Row */}
              <tr className="border-b border-bg-tertiary">
                <td className="px-4 py-4">
                  <span className="font-medium text-text-primary">Key Reasons</span>
                </td>
                {sortedCandidates.map((c) => (
                  <td key={c.contact.id} className="px-4 py-4 text-left">
                    <ul className="space-y-1 text-sm text-text-secondary">
                      {c.key_reasons.slice(0, 3).map((reason, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-accent">•</span>
                          <span className="truncate">{reason}</span>
                        </li>
                      ))}
                      {c.key_reasons.length === 0 && (
                        <li className="text-text-muted italic">No specific reasons</li>
                      )}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Additional Info Rows */}
              <tr className="border-b border-bg-tertiary">
                <td className="px-4 py-4">
                  <span className="font-medium text-text-primary">Seniority</span>
                </td>
                {sortedCandidates.map((c) => (
                  <td key={c.contact.id} className="px-4 py-4 text-center text-sm text-text-secondary">
                    {c.contact.seniority || 'N/A'}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-bg-tertiary">
                <td className="px-4 py-4">
                  <span className="font-medium text-text-primary">Location</span>
                </td>
                {sortedCandidates.map((c) => (
                  <td key={c.contact.id} className="px-4 py-4 text-center text-sm text-text-secondary">
                    {[c.contact.city, c.contact.country].filter(Boolean).join(', ') || 'N/A'}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-bg-tertiary">
                <td className="px-4 py-4">
                  <span className="font-medium text-text-primary">Industries</span>
                </td>
                {sortedCandidates.map((c) => (
                  <td key={c.contact.id} className="px-4 py-4 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {c.contact.skills?.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="default" className="text-xs">
                          {skill}
                        </Badge>
                      )) || <span className="text-text-muted text-sm">N/A</span>}
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-4">
                  <span className="font-medium text-text-primary">Languages</span>
                </td>
                {sortedCandidates.map((c) => (
                  <td key={c.contact.id} className="px-4 py-4 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {c.contact.languages?.slice(0, 3).map((lang, i) => (
                        <Badge key={i} variant="default" className="text-xs">
                          {lang}
                        </Badge>
                      )) || <span className="text-text-muted text-sm">N/A</span>}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bg-tertiary bg-bg-secondary flex items-center justify-between text-xs text-text-muted">
          <span>Click a dimension row to sort by that score</span>
          <span>{candidates.length} candidates compared</span>
        </div>
      </div>
    </div>
  );
}

export default CandidateComparison;
