import React, { useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Clock,
  ChevronRight,
  Award,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { Interview, InterviewScorecard, InterviewRecommendation, AggregateFeedback } from '@/services/supabaseApi';

const COMPETENCIES = [
  { id: 'technical', name: 'Technical Expertise' },
  { id: 'communication', name: 'Communication' },
  { id: 'leadership', name: 'Leadership' },
  { id: 'cultural_fit', name: 'Cultural Fit' },
  { id: 'problem_solving', name: 'Problem Solving' },
];

const RECOMMENDATION_CONFIG: Record<InterviewRecommendation, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  strong_hire: { label: 'Strong Hire', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  hire: { label: 'Hire', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp },
  no_hire: { label: 'No Hire', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: AlertTriangle },
  strong_no_hire: { label: 'Strong No Hire', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
};

export interface InterviewFeedbackProps {
  interview: Interview;
  onViewScorecard?: (panelistId: string) => void;
  onAdvanceStage?: () => void;
  onClose?: () => void;
}

export function InterviewFeedback({ interview, onViewScorecard, onAdvanceStage, onClose }: InterviewFeedbackProps) {
  const { scorecards, aggregate_feedback } = interview;

  const stats = useMemo(() => {
    if (!scorecards || scorecards.length === 0) {
      return {
        avgOverall: 0,
        panelistCount: 0,
        competencyAverages: {} as Record<string, number>,
        recommendationDistribution: {} as Record<string, number>,
      };
    }

    const avgOverall = Math.round(
      scorecards.reduce((sum: number, s: InterviewScorecard) => sum + s.overall_score, 0) / scorecards.length
    );

    const competencyAverages: Record<string, number> = {};
    COMPETENCIES.forEach(comp => {
      competencyAverages[comp.id] = Math.round(
        scorecards.reduce((sum: number, s: InterviewScorecard) => sum + (s.competency_scores[comp.id] || 0), 0) / scorecards.length
      );
    });

    const recommendationDistribution: Record<string, number> = {};
    scorecards.forEach((s: InterviewScorecard) => {
      recommendationDistribution[s.recommendation] =
        (recommendationDistribution[s.recommendation] || 0) + 1;
    });

    return {
      avgOverall,
      panelistCount: scorecards.length,
      competencyAverages,
      recommendationDistribution,
    };
  }, [scorecards]);

  const getConsensusRecommendation = (): InterviewRecommendation => {
    if (!scorecards || scorecards.length === 0) return 'no_hire';
    
    const recCounts: Record<string, number> = {};
    scorecards.forEach((s: InterviewScorecard) => {
      recCounts[s.recommendation] = (recCounts[s.recommendation] || 0) + 1;
    });

    const sortedRecs = Object.entries(recCounts).sort((a, b) => b[1] - a[1]);
    return sortedRecs[0][0] as InterviewRecommendation;
  };

  const consensusRecommendation = getConsensusRecommendation();
  const recommendationConfig = RECOMMENDATION_CONFIG[consensusRecommendation];
  const RecommendationIcon = recommendationConfig.icon;

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const RadarChart = () => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 100;
    const numSides = COMPETENCIES.length;
    const angleStep = (2 * Math.PI) / numSides;

    const dataPoints = COMPETENCIES.map((comp, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const value = (stats.competencyAverages[comp.id] || 0) / 10;
      const x = centerX + maxRadius * value * Math.cos(angle);
      const y = centerY + maxRadius * value * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    const gridLines = [];
    for (let r = 20; r <= maxRadius; r += 20) {
      const points = Array.from({ length: numSides }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
      }).join(' ');
      gridLines.push(<polygon key={r} points={points} fill="none" stroke="#E5E7EB" strokeWidth="1" />);
    }

    const axisLines = COMPETENCIES.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + maxRadius * Math.cos(angle);
      const y = centerY + maxRadius * Math.sin(angle);
      return (
        <line
          key={i}
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      );
    });

    const labels = COMPETENCIES.map((comp, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const labelRadius = maxRadius + 25;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      return (
        <text
          key={comp.id}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600"
        >
          {comp.name}
        </text>
      );
    });

    return (
      <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
        {gridLines}
        {axisLines}
        <polygon
          points={dataPoints}
          fill="rgba(193, 8, 171, 0.2)"
          stroke="#C108AB"
          strokeWidth="2"
        />
        {labels}
      </svg>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Interview Feedback</h1>
            <p className="text-text-muted">Round {interview.round} - {formatDate(interview.interview_date)}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">
                {interview.candidate_name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{interview.candidate_name}</h2>
              <p className="text-text-muted">{interview.mandate_title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default">Round {interview.round}</Badge>
            <Badge className={`${recommendationConfig.bgColor} text-text-primary`}>
              <RecommendationIcon className="w-4 h-4 mr-1" />
              {recommendationConfig.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(interview.interview_date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTime(interview.interview_date)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {stats.panelistCount} panelist{stats.panelistCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-6 text-center">
          <div className={`w-24 h-24 rounded-full ${getScoreBgColor(stats.avgOverall)} flex items-center justify-center mx-auto mb-4`}>
            <span className={`text-4xl font-bold ${getScoreColor(stats.avgOverall)}`}>
              {stats.avgOverall}
            </span>
          </div>
          <p className="text-sm text-text-muted">Average Score</p>
          <p className="font-semibold text-text-primary">Out of 10</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-sm text-text-muted">Panelists</p>
          <p className="text-2xl font-bold text-text-primary">{stats.panelistCount}</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 text-center">
          <div className={`w-24 h-24 rounded-full ${recommendationConfig.bgColor} flex items-center justify-center mx-auto mb-4`}>
            <RecommendationIcon className={`w-12 h-12 ${recommendationConfig.color}`} />
          </div>
          <p className="text-sm text-text-muted">Consensus</p>
          <p className={`text-lg font-semibold ${recommendationConfig.color}`}>
            {recommendationConfig.label}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Competency Radar
          </h3>
          <RadarChart />
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Competency Scores
          </h3>
          <div className="space-y-4">
            {COMPETENCIES.map(comp => {
              const score = stats.competencyAverages[comp.id] || 0;
              return (
                <div key={comp.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-text-primary">{comp.name}</span>
                    <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}/10</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Strengths
          </h3>
          <ul className="space-y-3">
            {(aggregate_feedback?.combined_strengths || scorecards.flatMap((s: InterviewScorecard) => s.strengths)).map((strength: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-primary">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Areas for Development
          </h3>
          <ul className="space-y-3">
            {(aggregate_feedback?.combined_concerns || scorecards.flatMap((s: InterviewScorecard) => s.concerns)).map((concern: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-primary">{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {scorecards && scorecards.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Individual Scorecards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scorecards.map((scorecard: InterviewScorecard, idx: number) => {
              const recConfig = RECOMMENDATION_CONFIG[scorecard.recommendation];
              return (
                <div
                  key={idx}
                  className="p-4 bg-bg-alt rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onViewScorecard?.(scorecard.panelist_id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-medium">
                        {scorecard.panelist_name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <Badge className={`${recConfig.bgColor} text-sm`}>
                      {recConfig.label}
                    </Badge>
                  </div>
                  <p className="font-medium text-text-primary">{scorecard.panelist_name}</p>
                  <p className={`text-2xl font-bold ${getScoreColor(scorecard.overall_score)}`}>
                    {scorecard.overall_score}/10
                  </p>
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                    View details <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onAdvanceStage && (
          <Button
            onClick={onAdvanceStage}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Advance to Next Stage
          </Button>
        )}
      </div>
    </div>
  );
}