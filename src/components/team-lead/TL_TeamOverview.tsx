import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  TrendingUp,
  Briefcase,
  Clock,
  Target,
  ChevronRight,
  Star,
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const CONSULTANTS = [
  {
    id: '1',
    name: 'Alex Wang',
    avatar: null,
    title: 'Senior Consultant',
    activeMandates: 3,
    capacity: 85,
    placementsThisQuarter: 4,
    revenueThisQuarter: 480000,
    avgTimeToFill: 42,
    npsScore: 9.2,
    pipelineValue: 850000,
    utilization: 85,
    recentPlacements: ['TechCorp VP Eng', 'ScaleUp CTO'],
  },
  {
    id: '2',
    name: 'Sarah Li',
    avatar: null,
    title: 'Principal Consultant',
    activeMandates: 4,
    capacity: 95,
    placementsThisQuarter: 3,
    revenueThisQuarter: 420000,
    avgTimeToFill: 38,
    npsScore: 9.0,
    pipelineValue: 1200000,
    utilization: 95,
    recentPlacements: ['FinanceCo CFO', 'BioTech VP Finance'],
  },
  {
    id: '3',
    name: 'Mike Chen',
    avatar: null,
    title: 'Consultant',
    activeMandates: 2,
    capacity: 60,
    placementsThisQuarter: 2,
    revenueThisQuarter: 240000,
    avgTimeToFill: 51,
    npsScore: 8.2,
    pipelineValue: 420000,
    utilization: 60,
    recentPlacements: ['Retail Head of Ops'],
  },
  {
    id: '4',
    name: 'Emily Zhang',
    avatar: null,
    title: 'Senior Consultant',
    activeMandates: 3,
    capacity: 75,
    placementsThisQuarter: 3,
    revenueThisQuarter: 350000,
    avgTimeToFill: 45,
    npsScore: 8.8,
    pipelineValue: 580000,
    utilization: 75,
    recentPlacements: ['HealthTech COO', 'MedTech VP Eng'],
  },
];

const SORT_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'placements', label: 'Placements' },
  { value: 'utilization', label: 'Utilization' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'nps', label: 'NPS' },
];

export function TL_TeamOverview() {
  const [sortBy, setSortBy] = useState('revenue');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...CONSULTANTS].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return b.revenueThisQuarter - a.revenueThisQuarter;
      case 'placements': return b.placementsThisQuarter - a.placementsThisQuarter;
      case 'utilization': return b.utilization - a.utilization;
      case 'capacity': return a.capacity - b.capacity;
      case 'nps': return b.npsScore - a.npsScore;
      default: return 0;
    }
  });

  const teamStats = {
    totalConsultants: CONSULTANTS.length,
    totalActiveMandates: CONSULTANTS.reduce((sum, c) => sum + c.activeMandates, 0),
    totalPlacements: CONSULTANTS.reduce((sum, c) => sum + c.placementsThisQuarter, 0),
    totalRevenue: CONSULTANTS.reduce((sum, c) => sum + c.revenueThisQuarter, 0),
    avgNps: (CONSULTANTS.reduce((sum, c) => sum + c.npsScore, 0) / CONSULTANTS.length).toFixed(1),
    avgUtilization: Math.round(CONSULTANTS.reduce((sum, c) => sum + c.utilization, 0) / CONSULTANTS.length),
    availableCapacity: CONSULTANTS.filter((c) => c.capacity < 80).length,
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const getCapacityColor = (capacity: number) => {
    if (capacity >= 90) return 'text-red-600 bg-red-100';
    if (capacity >= 70) return 'text-amber-600 bg-amber-100';
    return 'text-green-600 bg-green-100';
  };

  const getCapacityLabel = (capacity: number) => {
    if (capacity >= 90) return 'At Capacity';
    if (capacity >= 70) return 'High Load';
    return 'Available';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Team Overview</h1>
          <p className="text-text-muted">{teamStats.totalConsultants} consultants · {teamStats.totalActiveMandates} active mandates</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(teamStats.totalRevenue)}</p>
            <p className="text-xs text-text-muted mt-1">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Placements</span>
              <Target className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold text-text-primary">{teamStats.totalPlacements}</p>
            <p className="text-xs text-text-muted mt-1">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Avg Utilization</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{teamStats.avgUtilization}%</p>
            <p className="text-xs text-text-muted mt-1">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Avg NPS</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{teamStats.avgNps}</p>
            <p className="text-xs text-text-muted mt-1">Client satisfaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif font-semibold text-text-primary">
          Consultant Leaderboard</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>Sort by: {o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {sorted.map((c, i) => (
          <Card key={c.id} className={expandedId === c.id && 'ring-2 ring-accent/20'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="font-medium text-text-primary">{c.name}</p>
                    <span className="text-sm text-text-muted">{c.title}</span>
                  </div>
                </div>

                <div className="hidden md:grid md:grid-cols-4 gap-6 text-center flex-1">
                  <div>
                    <p className="text-xs text-text-muted">Revenue</p>
                    <p className="font-semibold text-text-primary">{formatCurrency(c.revenueThisQuarter)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Placements</p>
                    <p className="font-semibold text-text-primary">{c.placementsThisQuarter}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Mandates</p>
                    <p className="font-semibold text-text-primary">{c.activeMandates}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className={getCapacityColor(c.capacity)}>
                      {getCapacityLabel(c.capacity)}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  {expandedId === c.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {expandedId === c.id && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Pipeline Value</p>
                    <p className="font-semibold text-text-primary">{formatCurrency(c.pipelineValue)}</p>
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Avg Time to Fill</p>
                    <p className="font-semibold text-text-primary">{c.avgTimeToFill} days</p>
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-muted mb-1">NPS Score</p>
                    <p className="font-semibold text-text-primary">{c.npsScore} <span className="text-xs text-text-muted">/ 10</span></p>
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Utilization</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.utilization >= 90 ? 'bg-red-500' : c.utilization >= 70 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${c.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-text-primary">{c.utilization}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
