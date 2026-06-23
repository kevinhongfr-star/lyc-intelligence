import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Clock,
  Users,
  Target,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type { ConsultantPerformance } from '@/services/analytics/AnalyticsService';

export interface ConsultantLeaderboardProps {
  consultants: ConsultantPerformance[];
}

type SortColumn = 'placementsThisQuarter' | 'totalPlacements' | 'avgMatchScore' | 'avgTimeToFill';
type SortDirection = 'asc' | 'desc';

export function ConsultantLeaderboard({ consultants }: ConsultantLeaderboardProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('placementsThisQuarter');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedConsultants = [...consultants].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    }
    return 0;
  });

  const top3 = sortedConsultants.slice(0, 3);
  const rest = sortedConsultants.slice(3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-text-muted">{rank}</span>;
    }
  };

  const SortHeader = ({ column, label, className = '' }: { column: SortColumn; label: string; className?: string }) => (
    <button
      onClick={() => handleSort(column)}
      className={`flex items-center gap-1 font-medium hover:text-accent transition-colors ${className}`}
    >
      {label}
      {sortColumn === column && (
        sortDirection === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Consultant Leaderboard</h2>
            <p className="text-sm text-text-muted">Performance rankings by placement</p>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-4 py-4">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-gray-700">
                  {top3[1].consultantName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <span className="text-sm font-medium text-text-primary truncate max-w-24" title={top3[1].consultantName}>
                {top3[1].consultantName}
              </span>
              <span className="text-xs text-text-muted">{top3[1].placementsThisQuarter} Q</span>
              <div className="h-16 w-16 bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-lg mt-2 flex items-center justify-center">
                <Medal className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center mb-2 ring-4 ring-yellow-200">
                <span className="text-2xl font-bold text-yellow-900">
                  {top3[0].consultantName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <span className="text-sm font-bold text-text-primary truncate max-w-28" title={top3[0].consultantName}>
                {top3[0].consultantName}
              </span>
              <span className="text-xs text-text-muted">{top3[0].placementsThisQuarter} Q</span>
              <div className="h-20 w-20 bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-t-lg mt-2 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-700" />
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-amber-800">
                  {top3[2].consultantName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <span className="text-sm font-medium text-text-primary truncate max-w-24" title={top3[2].consultantName}>
                {top3[2].consultantName}
              </span>
              <span className="text-xs text-text-muted">{top3[2].placementsThisQuarter} Q</span>
              <div className="h-12 w-16 bg-gradient-to-t from-amber-300 to-amber-100 rounded-t-lg mt-2 flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Rankings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-alt border-b border-card-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted w-16">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Consultant</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                <SortHeader column="placementsThisQuarter" label="This Quarter" className="mx-auto" />
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                <SortHeader column="totalPlacements" label="Total" className="mx-auto" />
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                <SortHeader column="avgMatchScore" label="Match Score" className="mx-auto" />
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">
                <SortHeader column="avgTimeToFill" label="Avg Time" className="mx-auto" />
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">Active</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">Pipeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {sortedConsultants.map((consultant, index) => (
              <tr
                key={consultant.consultantId}
                className={`hover:bg-bg-alt transition-colors ${
                  index < 3 ? 'bg-yellow-50/50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    {getRankIcon(consultant.rank)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-amber-100' : 'bg-bg-alt'
                    }`}>
                      <span className="text-sm font-medium text-text-primary">
                        {consultant.consultantName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-text-primary">{consultant.consultantName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    className={
                      consultant.placementsThisQuarter >= 5
                        ? 'bg-green-100 text-green-700'
                        : consultant.placementsThisQuarter >= 2
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {consultant.placementsThisQuarter}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-medium text-text-primary">{consultant.totalPlacements}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className={`w-4 h-4 ${
                      consultant.avgMatchScore >= 80
                        ? 'text-yellow-500'
                        : consultant.avgMatchScore >= 60
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`} />
                    <span className="font-medium text-text-primary">{consultant.avgMatchScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${
                    consultant.avgTimeToFill <= 60
                      ? 'text-green-600'
                      : consultant.avgTimeToFill <= 90
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {consultant.avgTimeToFill}d
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-text-primary">{consultant.activeMandates}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-text-muted">{consultant.candidatesInPipeline}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedConsultants.length === 0 && (
          <div className="p-12 text-center text-text-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No consultant data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Consultant Stats Cards
export function ConsultantStatsCards({ consultants }: { consultants: ConsultantPerformance[] }) {
  const totalPlacements = consultants.reduce((sum, c) => sum + c.totalPlacements, 0);
  const totalQPlacements = consultants.reduce((sum, c) => sum + c.placementsThisQuarter, 0);
  const avgMatchScore = consultants.length > 0
    ? Math.round(consultants.reduce((sum, c) => sum + c.avgMatchScore, 0) / consultants.length)
    : 0;
  const avgTimeToFill = consultants.length > 0
    ? Math.round(consultants.reduce((sum, c) => sum + c.avgTimeToFill, 0) / consultants.length)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalQPlacements}</p>
            <p className="text-sm text-text-muted">Q Placements</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalPlacements}</p>
            <p className="text-sm text-text-muted">Total Placements</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{avgMatchScore}</p>
            <p className="text-sm text-text-muted">Avg Match Score</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{avgTimeToFill}d</p>
            <p className="text-sm text-text-muted">Avg Time to Fill</p>
          </div>
        </div>
      </div>
    </div>
  );
}
