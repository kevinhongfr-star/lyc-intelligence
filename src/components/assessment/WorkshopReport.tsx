import React, { useState, useEffect } from 'react';
import { 
  Download, BarChart3, Users, Award, Target, TrendingUp,
  Printer, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { 
  getWorkshopById, 
  getWorkshopParticipants, 
  getWorkshopScores 
} from '@/services/supabaseApi';
import type { WorkshopData, ParticipantData, WorkshopScore } from '@/services/supabaseApi';

interface WorkshopReportProps {
  workshopId: string;
}

export function WorkshopReport({ workshopId }: WorkshopReportProps) {
  const [workshop, setWorkshop] = useState<WorkshopData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [scores, setScores] = useState<WorkshopScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParticipants, setExpandedParticipants] = useState(false);

  useEffect(() => {
    loadData();
  }, [workshopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [w, p, s] = await Promise.all([
        getWorkshopById(workshopId),
        getWorkshopParticipants(workshopId),
        getWorkshopScores(workshopId),
      ]);
      setWorkshop(w);
      setParticipants(p);
      setScores(s);
    } catch (err) {
      console.error('Load report data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    if (scores.length === 0) return {};
    
    const dimensionTotals: Record<string, number> = {};
    scores.forEach(score => {
      Object.entries(score.dimension_scores).forEach(([dim, val]) => {
        dimensionTotals[dim] = (dimensionTotals[dim] || 0) + val;
      });
    });

    const averages: Record<string, number> = {};
    Object.entries(dimensionTotals).forEach(([dim, total]) => {
      averages[dim] = Math.round(total / scores.length);
    });

    return averages;
  };

  const getArchetypeDistribution = () => {
    const distribution: Record<string, number> = {};
    scores.forEach(score => {
      distribution[score.archetype] = (distribution[score.archetype] || 0) + 1;
    });
    return distribution;
  };

  const getStyleDistribution = () => {
    const distribution: Record<string, number> = {};
    scores.forEach(score => {
      distribution[score.style] = (distribution[score.style] || 0) + 1;
    });
    return distribution;
  };

  const getAllStrengths = () => {
    const allStrengths: Record<string, number> = {};
    scores.forEach(score => {
      score.strengths.forEach(strength => {
        allStrengths[strength] = (allStrengths[strength] || 0) + 1;
      });
    });
    return Object.entries(allStrengths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getAllDevelopmentAreas = () => {
    const allAreas: Record<string, number> = {};
    scores.forEach(score => {
      score.development_areas.forEach(area => {
        allAreas[area] = (allAreas[area] || 0) + 1;
      });
    });
    return Object.entries(allAreas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const completedCount = participants.filter(p => p.status === 'completed').length;
  const catalog = workshop ? ASSESSMENT_CATALOG[workshop.assessment_type as keyof typeof ASSESSMENT_CATALOG] : null;
  const avgScores = calculateAverages();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Workshop not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">{workshop.title}</h1>
          <p className="text-text-muted">
            {workshop.assessment_type} Workshop Report | {new Date(workshop.scheduled_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-accent" />
            <span className="text-sm text-text-muted">Total Participants</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{participants.length}</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-500" />
            <span className="text-sm text-text-muted">Completed</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{completedCount}</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-text-muted">Responses</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{scores.length}</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-text-muted">Duration</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{workshop.duration_minutes} min</p>
        </div>
      </div>

      {/* Dimension Averages */}
      <div className="bg-bg-secondary rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Dimension Averages
        </h2>
        {catalog && (
          <div className="space-y-4">
            {catalog.dimensions.map(dim => (
              <div key={dim.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-primary font-medium">{dim.name}</span>
                  <span className="text-text-muted">{avgScores[dim.name] || 0}%</span>
                </div>
                <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${avgScores[dim.name] || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archetype Distribution */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-secondary rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Archetype Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(getArchetypeDistribution()).map(([archetype, count]) => (
              <div key={archetype} className="flex items-center justify-between">
                <span className="text-text-secondary">{archetype}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(count / scores.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-muted w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Style Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(getStyleDistribution()).map(([style, count]) => (
              <div key={style} className="flex items-center justify-between">
                <span className="text-text-secondary">{style}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${(count / scores.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-muted w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Development Areas */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-secondary rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Strengths</h2>
          <div className="space-y-3">
            {getAllStrengths().map(([strength, count], index) => (
              <div key={strength} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-400 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-600 text-white' :
                  'bg-bg-tertiary text-text-muted'
                }`}>
                  {index + 1}
                </span>
                <span className="text-text-secondary flex-1">{strength}</span>
                <Badge variant="default">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Development Areas</h2>
          <div className="space-y-3">
            {getAllDevelopmentAreas().map(([area, count], index) => (
              <div key={area} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-red-400 text-white' :
                  index === 1 ? 'bg-orange-400 text-white' :
                  index === 2 ? 'bg-amber-500 text-white' :
                  'bg-bg-tertiary text-text-muted'
                }`}>
                  {index + 1}
                </span>
                <span className="text-text-secondary flex-1">{area}</span>
                <Badge variant="default">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-bg-secondary rounded-xl p-6">
        <button
          onClick={() => setExpandedParticipants(!expandedParticipants)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participants ({participants.length})
          </h2>
          {expandedParticipants ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedParticipants && (
          <div className="mt-4 space-y-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{p.name || p.email}</p>
                  <p className="text-sm text-text-muted">{p.email}</p>
                </div>
                <Badge className={
                  p.status === 'completed' ? 'bg-green-100 text-green-700' :
                  p.status === 'started' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {p.status === 'completed' ? 'Completed' : p.status === 'started' ? 'Started' : 'Invited'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkshopReport;