import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSupabase } from '@/services/supabaseApi';

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  color: string;
}

export default function HiringFunnel() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadFunnel();
  }, []);

  const loadFunnel = async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data, count: totalCount, error } = await sb
        .from('mandates')
        .select('status', { count: 'exact' });

      if (error) throw error;

      const statusCounts: Record<string, number> = {};
      data?.forEach((m: any) => {
        const s = m.status || 'unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      const stageConfig: { key: string; label: string; color: string }[] = [
        { key: '1_search', label: 'Search', color: '#00897B' },
        { key: '2_call', label: 'Canva', color: '#F59E0B' },
        { key: '3_deliver', label: 'Grid/Lens', color: '#10B981' },
        { key: 'won', label: 'Won', color: '#10B981' },
        { key: 'completed', label: 'Completed', color: '#333333' },
        { key: 'on_hold', label: 'On Hold', color: '#F59E0B' },
        { key: 'lost', label: 'Lost', color: '#EF4444' },
      ];

      const funnelStages: FunnelStage[] = stageConfig.map(s => ({
        stage: s.key,
        label: s.label,
        count: statusCounts[s.key] || 0,
        color: s.color,
      }));

      setStages(funnelStages);
      setTotal(data?.length || 0);
    } catch (e) {
      console.error('Funnel load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#737373]">Loading funnel data...</span>
      </div>
    );
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1);
  const pipelineStages = stages.filter(s => ['1_search', '2_call', '3_deliver'].includes(s.stage));
  const pipelineTotal = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const wonCount = stages.find(s => s.stage === 'won')?.count || 0;
  const completedCount = stages.find(s => s.stage === 'completed')?.count || 0;
  const conversionRate = total > 0 ? ((wonCount + completedCount) / total * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5E5] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">Total Mandates</p>
          <p className="text-2xl font-bold text-[#171717]">{total}</p>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">In Pipeline</p>
          <p className="text-2xl font-bold text-[#00897B]">{pipelineTotal}</p>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">Won + Completed</p>
          <p className="text-2xl font-bold text-[#10B981]">{wonCount + completedCount}</p>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-[#C108AB]">{conversionRate}%</p>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <h3 className="text-sm font-semibold text-[#171717] mb-4">Mandate Status Distribution</h3>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const percentage = total > 0 ? (stage.count / total) * 100 : 0;
            const barWidth = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-[#171717] text-right shrink-0">
                  {stage.label}
                </div>
                <div className="flex-1">
                  <div
                    className="h-8 flex items-center px-3 transition-all duration-500"
                    style={{
                      width: `${Math.max(barWidth, 2)}%`,
                      backgroundColor: stage.color,
                      opacity: 0.85 - (index * 0.05),
                    }}
                  >
                    <span className="text-xs font-semibold text-white">{stage.count}</span>
                  </div>
                </div>
                <div className="w-16 text-sm text-[#737373] text-right shrink-0">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline breakdown */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <h3 className="text-sm font-semibold text-[#171717] mb-4">Active Pipeline Breakdown</h3>
        <div className="flex gap-2 h-10 overflow-hidden">
          {pipelineStages.map(stage => {
            const width = pipelineTotal > 0 ? (stage.count / pipelineTotal) * 100 : 0;
            return (
              <div
                key={stage.stage}
                className="flex items-center justify-center text-xs font-semibold text-white transition-all"
                style={{ width: `${width}%`, backgroundColor: stage.color, minWidth: width > 0 ? '40px' : '0' }}
                title={`${stage.label}: ${stage.count}`}
              >
                {width > 5 && stage.count}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3">
          {pipelineStages.map(stage => (
            <div key={stage.stage} className="flex items-center gap-2">
              <div className="w-3 h-3" style={{ backgroundColor: stage.color }} />
              <span className="text-xs text-[#737373]">{stage.label}: {stage.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
