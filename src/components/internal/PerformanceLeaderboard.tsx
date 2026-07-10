import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Loader2, TrendingUp, Users, Target, Briefcase } from 'lucide-react';
import { getSupabase } from '@/services/supabaseApi';

interface ConsultantStat {
  name: string;
  mandates: number;
  won: number;
  completed: number;
  pipeline: number;
  avgPhi: number;
  totalCandidates: number;
}

export default function PerformanceLeaderboard() {
  const [data, setData] = useState<ConsultantStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('mandates');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      // Get all mandates
      const { data: mandates } = await sb.from('mandates').select('*');
      if (!mandates) { setLoading(false); return; }

      // Aggregate by consultant (using created_by or assignee if available)
      const byConsultant: Record<string, ConsultantStat> = {};

      mandates.forEach((m: any) => {
        const consultant = m.assigned_to || m.created_by || 'Unassigned';
        if (!byConsultant[consultant]) {
          byConsultant[consultant] = {
            name: consultant,
            mandates: 0,
            won: 0,
            completed: 0,
            pipeline: 0,
            avgPhi: 0,
            totalCandidates: 0,
          };
        }
        const c = byConsultant[consultant];
        c.mandates++;
        if (m.status === 'won') c.won++;
        if (m.status === 'completed') c.completed++;
        if (['1_search', '2_call', '3_deliver'].includes(m.status)) c.pipeline++;
        if (m.phi_composite) c.avgPhi += m.phi_composite;
        c.totalCandidates += m.total_candidates || 0;
      });

      // Calculate average PHI
      Object.values(byConsultant).forEach(c => {
        if (c.mandates > 0) c.avgPhi = Math.round(c.avgPhi / c.mandates);
      });

      const sorted = Object.values(byConsultant)
        .sort((a, b) => {
          const aVal = (a as any)[sortBy] ?? 0;
          const bVal = (b as any)[sortBy] ?? 0;
          const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
          return sortDir === 'asc' ? cmp : -cmp;
        });

      setData(sorted);
    } catch (e) {
      console.error('Leaderboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-[#737373] font-semibold">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#737373]">Loading performance data...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
        <p className="text-[#737373]">No consultant data available yet</p>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Consultant', align: 'left' as const },
    { key: 'mandates', label: 'Total Mandates', align: 'center' as const },
    { key: 'pipeline', label: 'Active Pipeline', align: 'center' as const },
    { key: 'won', label: 'Won', align: 'center' as const },
    { key: 'completed', label: 'Completed', align: 'center' as const },
    { key: 'totalCandidates', label: 'Candidates', align: 'center' as const },
    { key: 'avgPhi', label: 'Avg PHI', align: 'center' as const },
  ];

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#171717]">Consultant Performance</h3>
        <span className="text-xs text-[#737373]">{data.length} consultants</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase tracking-wider">#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-[#171717] transition-colors ${
                    col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'
                  } ${sortBy === col.key ? 'text-[#C108AB]' : 'text-[#737373]'}`}
                >
                  {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.name} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3">{getRankIcon(idx + 1)}</td>
                <td className="px-4 py-3 font-medium text-[#171717]">{row.name}</td>
                <td className="px-4 py-3 text-center tabular-nums">{row.mandates}</td>
                <td className="px-4 py-3 text-center tabular-nums text-[#00897B]">{row.pipeline}</td>
                <td className="px-4 py-3 text-center tabular-nums text-[#10B981]">{row.won}</td>
                <td className="px-4 py-3 text-center tabular-nums">{row.completed}</td>
                <td className="px-4 py-3 text-center tabular-nums">{row.totalCandidates}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold tabular-nums ${row.avgPhi >= 70 ? 'text-[#10B981]' : row.avgPhi >= 50 ? 'text-[#C108AB]' : 'text-[#737373]'}`}>
                    {row.avgPhi || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
