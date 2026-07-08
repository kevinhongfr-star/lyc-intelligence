import React, { useState, useEffect } from 'react';
import { 
  Download, Award, Target, TrendingUp, Printer, ChevronRight,
  Star, Zap, CheckCircle
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import type { WorkshopScore } from '@/services/supabaseApi';

interface IndividualReportProps {
  workshopId: string;
  participantId: string;
}

const getParticipantScore = async (workshopId: string, participantId: string): Promise<WorkshopScore | null> => {
  try {
    const res = await fetch(`/api/data/workshops/${workshopId}/scores/${participantId}`);
    if (!res.ok) return null;
    const result = await res.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export function IndividualReport({ workshopId, participantId }: IndividualReportProps) {
  const [score, setScore] = useState<WorkshopScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();
  }, [workshopId, participantId]);

  const loadScore = async () => {
    setLoading(true);
    try {
      const data = await getParticipantScore(workshopId, participantId);
      setScore(data);
    } catch (err) {
      console.error('Load score error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#EAB308';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Moderate';
    return 'Developing';
  };

  const catalog = score ? ASSESSMENT_CATALOG[score.assessment_type as keyof typeof ASSESSMENT_CATALOG] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!score || !catalog) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No assessment results found</p>
      </div>
    );
  }

  const avgScore = Math.round(
    Object.values(score.dimension_scores).reduce((a, b) => a + b, 0) / 
    Object.values(score.dimension_scores).length
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-text-primary mb-2">
          Your {score.assessment_type} Assessment Report
        </h1>
        <p className="text-text-muted">Based on your workshop responses</p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-accent to-purple-600 rounded-2xl p-6 text-white mb-6">
        <div className="text-center">
          <p className="text-white/80 text-sm mb-2">Overall Assessment</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-5xl font-bold">{avgScore}</p>
              <p className="text-white/80 text-sm">Score</p>
            </div>
            <div className="w-px h-16 bg-white/20" />
            <div className="text-left">
              <p className="text-xl font-semibold">{getScoreLabel(avgScore)} Performance</p>
              <p className="text-white/80 text-sm">Based on {catalog.dimensions.length} dimensions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Archetype & Style */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-secondary rounded-none p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Primary Archetype</p>
              <p className="font-semibold text-text-primary">{score.archetype}</p>
            </div>
          </div>
          {catalog.archetypes.find(a => a.name === score.archetype) && (
            <p className="text-sm text-text-secondary">
              {catalog.archetypes.find(a => a.name === score.archetype)?.description}
            </p>
          )}
        </div>

        <div className="bg-bg-secondary rounded-none p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Communication Style</p>
              <p className="font-semibold text-text-primary">{score.style}</p>
            </div>
          </div>
          {catalog.styles.find(s => s.name === score.style) && (
            <p className="text-sm text-text-secondary">
              {catalog.styles.find(s => s.name === score.style)?.description}
            </p>
          )}
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="bg-bg-secondary rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Dimension Breakdown
        </h2>
        <div className="space-y-4">
          {catalog.dimensions.map(dim => {
            const dimScore = score.dimension_scores[dim.name] || 0;
            return (
              <div key={dim.id} className="bg-white rounded-none p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium">{dim.name}</span>
                    <Badge 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${getScoreColor(dimScore)}20`, 
                        color: getScoreColor(dimScore) 
                      }}
                    >
                      {getScoreLabel(dimScore)}
                    </Badge>
                  </div>
                  <span className="font-bold text-text-primary" style={{ color: getScoreColor(dimScore) }}>
                    {dimScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${dimScore}%`,
                      backgroundColor: getScoreColor(dimScore)
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">{dim.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-bg-secondary rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Your Strengths
        </h2>
        <div className="space-y-3">
          {score.strengths.map((strength, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-text-secondary">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Development Areas */}
      <div className="bg-bg-secondary rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          Development Opportunities
        </h2>
        <div className="space-y-3">
          {score.development_areas.map((area, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-text-secondary">{area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-bg-secondary rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recommendations</h2>
        <div className="space-y-3">
          {score.recommendations.map((rec, index) => (
            <div key={index} className="p-3 bg-white rounded-none border-l-4 border-accent">
              <p className="text-text-secondary">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

export default IndividualReport;