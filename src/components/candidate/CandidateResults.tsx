import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Lock,
  Award,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export type ResultVisibility = 'full' | 'pass_fail' | 'hidden';

export interface DimensionScore {
  name: string;
  score: number;
  description?: string;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  assessment_type: string;
  mandate_id: string;
  mandate_title: string;
  overall_score: number;
  recommendation: 'proceed' | 'hold' | 'pass';
  dimension_scores: DimensionScore[];
  strengths: string[];
  development_areas: string[];
  completed_at: string;
  visibility: ResultVisibility;
}

export interface CandidateResultsProps {
  result: AssessmentResult;
  onClose?: () => void;
  showExitButton?: boolean;
}

// Helper to get recommendation badge
function getRecommendationBadge(recommendation: AssessmentResult['recommendation']) {
  switch (recommendation) {
    case 'proceed':
      return (
        <Badge variant="success" className="px-3 py-1">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Proceed
        </Badge>
      );
    case 'hold':
      return (
        <Badge variant="warning" className="px-3 py-1">
          <Clock className="w-4 h-4 mr-1" />
          Hold
        </Badge>
      );
    case 'pass':
      return (
        <Badge variant="default" className="px-3 py-1">
          <XCircle className="w-4 h-4 mr-1" />
          Pass
        </Badge>
      );
  }
}

// Score gauge component
function ScoreGauge({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (s: number) => {
    if (s >= 80) return 'bg-green-100';
    if (s >= 60) return 'bg-yellow-100';
    if (s >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl',
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizeClasses[size]} rounded-full ${getScoreBgColor(score)} flex items-center justify-center font-bold ${getScoreColor(score)}`}
      >
        {score}
      </div>
      <p className="mt-2 text-sm text-text-muted">{label}</p>
    </div>
  );
}

// Dimension bar component
function DimensionBar({ dimension }: { dimension: DimensionScore }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-text-primary">{dimension.name}</span>
        <span className="text-text-muted">{dimension.score}/100</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(dimension.score)} transition-all duration-500`}
          style={{ width: `${dimension.score}%` }}
        />
      </div>
    </div>
  );
}

// Full results view
function FullResultsView({ result }: { result: AssessmentResult }) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex flex-col items-center p-6 bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl">
        <ScoreGauge score={result.overall_score} label="Overall Fit Score" size="lg" />
        <div className="mt-4">{getRecommendationBadge(result.recommendation)}</div>
      </div>

      {/* Dimension Scores */}
      <div className="bg-card rounded-none border border-card-border p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          Dimension Scores
        </h3>
        <div className="space-y-4">
          {result.dimension_scores.map((dim, idx) => (
            <DimensionBar key={idx} dimension={dim} />
          ))}
        </div>
      </div>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="bg-card rounded-none border border-card-border p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {result.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-primary">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Development Areas */}
      {result.development_areas.length > 0 && (
        <div className="bg-card rounded-none border border-card-border p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Development Areas
          </h3>
          <ul className="space-y-2">
            {result.development_areas.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-xs text-yellow-600">•</span>
                </div>
                <span className="text-text-primary">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation Summary */}
      <div className="bg-accent/5 border border-accent/20 rounded-none p-5">
        <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          Recommendation
        </h3>
        <p className="text-text-primary">
          {result.recommendation === 'proceed'
            ? 'You have demonstrated strong alignment with the role requirements. We recommend proceeding to the next stage of the selection process.'
            : result.recommendation === 'hold'
            ? 'Your profile shows some alignment with the role requirements. We would like to explore certain areas further before making a final determination.'
            : 'Based on the assessment, there are some gaps between your profile and the role requirements. We encourage you to continue developing the highlighted areas.'}
        </p>
      </div>
    </div>
  );
}

// Pass/Fail only view
function PassFailOnlyView({ result }: { result: AssessmentResult }) {
  const isPass = result.recommendation === 'proceed';

  return (
    <div className="flex flex-col items-center p-8 text-center">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
          isPass ? 'bg-green-100' : 'bg-yellow-100'
        }`}
      >
        {isPass ? (
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        ) : (
          <Clock className="w-12 h-12 text-yellow-600" />
        )}
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-2">
        {isPass ? 'Congratulations!' : 'Assessment Complete'}
      </h2>

      <p className="text-text-muted mb-6">
        {isPass
          ? 'You have passed the assessment and are moving forward in the process.'
          : 'Your application is under further consideration. We will be in touch soon.'}
      </p>

      {getRecommendationBadge(result.recommendation)}

      <p className="mt-6 text-sm text-text-muted">
        A detailed report has been shared with the hiring team.
      </p>
    </div>
  );
}

// Hidden view (for candidates who shouldn't see results)
function HiddenResultsView() {
  return (
    <div className="flex flex-col items-center p-8 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Lock className="w-12 h-12 text-gray-400" />
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-2">Assessment Complete</h2>

      <p className="text-text-muted max-w-sm">
        Your assessment has been submitted successfully. The results have been shared with the hiring team
        and they will be in touch with the next steps.
      </p>

      <div className="mt-6 p-4 bg-bg-alt rounded-none">
        <p className="text-sm text-text-muted">
          If you have any questions about the process, please contact your recruiter directly.
        </p>
      </div>
    </div>
  );
}

// Loading state
export function CandidateResultsLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
      <p className="text-text-muted">Loading your results...</p>
    </div>
  );
}

// Error state
export function CandidateResultsError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-text-primary mb-2">Unable to Load Results</h2>

      <p className="text-text-muted max-w-sm mb-6">{message}</p>

      {onRetry && (
        <Button onClick={onRetry} variant="default">
          Try Again
        </Button>
      )}
    </div>
  );
}

// Main component
export function CandidateResults({ result, onClose, showExitButton = true }: CandidateResultsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Assessment Results</h1>
              <p className="text-sm text-text-muted">{result.mandate_title}</p>
            </div>
            {showExitButton && onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Completion date */}
        <p className="text-center text-sm text-text-muted mb-6">
          Completed on {formatDate(result.completed_at)}
        </p>

        {/* Results based on visibility */}
        {result.visibility === 'full' && <FullResultsView result={result} />}
        {result.visibility === 'pass_fail' && <PassFailOnlyView result={result} />}
        {result.visibility === 'hidden' && <HiddenResultsView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-sm text-text-muted">
          <p>
            This assessment was conducted by LYC Intelligence as part of the executive search process
            for {result.mandate_title}.
          </p>
          <p className="mt-2">
            For questions about your results, please contact the hiring team directly.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Consultant-side results summary (for admin view)
export interface ResultsSummaryProps {
  results: AssessmentResult[];
  onViewDetails?: (resultId: string) => void;
  onChangeVisibility?: (resultId: string, visibility: ResultVisibility) => void;
}

export function ResultsSummary({ results, onViewDetails, onChangeVisibility }: ResultsSummaryProps) {
  const [filter, setFilter] = React.useState<'all' | 'proceed' | 'hold' | 'pass'>('all');

  const filteredResults = React.useMemo(() => {
    if (filter === 'all') return results;
    return results.filter(r => r.recommendation === filter);
  }, [results, filter]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {(['all', 'proceed', 'hold', 'pass'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-none text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-accent text-white'
                : 'text-text-muted hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({results.filter(r => r.recommendation === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {filteredResults.map(result => (
          <div
            key={result.id}
            className="bg-white rounded-none border border-card-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
                  {result.overall_score}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{result.mandate_title}</p>
                  <p className="text-sm text-text-muted">{result.assessment_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getRecommendationBadge(result.recommendation)}

                {onChangeVisibility && (
                  <select
                    value={result.visibility}
                    onChange={e => onChangeVisibility(result.id, e.target.value as ResultVisibility)}
                    className="text-sm border border-border rounded-none px-2 py-1"
                  >
                    <option value="full">Full Results</option>
                    <option value="pass_fail">Pass/Fail Only</option>
                    <option value="hidden">Hidden</option>
                  </select>
                )}

                {onViewDetails && (
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(result.id)}>
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredResults.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            No results found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateResults;
