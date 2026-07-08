import React, { useState } from 'react';
import { Trophy, Medal, Award, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { MOCK_LEADERBOARD } from '@/mocks/internalPortal';

type SortColumn = 'rank' | 'name' | 'placements' | 'revenue' | 'satisfaction';
type SortDirection = 'asc' | 'desc';

export default function PerformanceLeaderboard() {
  const [sortColumn, setSortColumn] = useState<SortColumn>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rank' ? 'asc' : 'desc');
    }
  };

  const parseRevenue = (rev: string) => parseInt(rev.replace(/[$kK]/g, ''), 10);

  const sorted = [...MOCK_LEADERBOARD].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;
    switch (sortColumn) {
      case 'rank': aVal = a.rank; bVal = b.rank; break;
      case 'name': aVal = a.name; bVal = b.name; break;
      case 'placements': aVal = a.placements; bVal = b.placements; break;
      case 'revenue': aVal = parseRevenue(a.revenue); bVal = parseRevenue(b.revenue); break;
      case 'satisfaction': aVal = a.satisfaction; bVal = b.satisfaction; break;
      default: return 0;
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-text-muted font-semibold">{rank}</span>;
    }
  };

  const SortHeader = ({ column, label }: { column: SortColumn; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 text-text-muted hover:text-accent transition-colors text-xs font-medium uppercase tracking-wide"
    >
      {label}
      {sortColumn === column && (
        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary bg-bg-secondary">
              <th className="px-4 py-3 text-left"><SortHeader column="rank" label="Rank" /></th>
              <th className="px-4 py-3 text-left"><SortHeader column="name" label="Name" /></th>
              <th className="px-4 py-3 text-center"><SortHeader column="placements" label="Placements" /></th>
              <th className="px-4 py-3 text-center"><SortHeader column="revenue" label="Revenue" /></th>
              <th className="px-4 py-3 text-center"><SortHeader column="satisfaction" label="Satisfaction" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.rank} className="border-b border-bg-tertiary hover:bg-bg-secondary transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">{getRankIcon(entry.rank)}</div>
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{entry.name}</td>
                <td className="px-4 py-3 text-center text-text-primary">{entry.placements}</td>
                <td className="px-4 py-3 text-center text-text-primary font-medium">{entry.revenue}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-text-primary">{entry.satisfaction}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
