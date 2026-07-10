import React, { useState, useEffect } from 'react';
import { Loader2, DollarSign, TrendingUp, Briefcase, Target } from 'lucide-react';
import { getSupabase } from '@/services/supabaseApi';

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMandates: 0,
    wonMandates: 0,
    totalFees: 0,
    avgFee: 0,
    pipelineValue: 0,
    activeCount: 0,
    completedRevenue: 0,
    wonRevenue: 0,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data: mandates } = await sb.from('mandates').select('status, fee_amount, fee_type');

      if (!mandates) { setLoading(false); return; }

      let totalFees = 0;
      let wonRevenue = 0;
      let completedRevenue = 0;
      let pipelineValue = 0;

      mandates.forEach((m: any) => {
        const fee = m.fee_amount || 0;
        if (m.status === 'won') { wonRevenue += fee; totalFees += fee; }
        else if (m.status === 'completed') { completedRevenue += fee; totalFees += fee; }
        else if (['1_search', '2_call', '3_deliver'].includes(m.status)) { pipelineValue += fee; }
      });

      const wonCount = mandates.filter((m: any) => m.status === 'won').length;
      const activeCount = mandates.filter((m: any) => ['1_search', '2_call', '3_deliver'].includes(m.status)).length;
      const totalWithFees = mandates.filter((m: any) => (m.fee_amount || 0) > 0).length;

      setStats({
        totalMandates: mandates.length,
        wonMandates: wonCount,
        totalFees,
        avgFee: totalWithFees > 0 ? Math.round(totalFees / totalWithFees) : 0,
        pipelineValue,
        activeCount,
        completedRevenue,
        wonRevenue,
      });
    } catch (e) {
      console.error('RevenueAnalytics error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#737373]">Loading revenue data...</span>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats.wonRevenue + stats.completedRevenue), subtitle: `Won: ${formatCurrency(stats.wonRevenue)} | Completed: ${formatCurrency(stats.completedRevenue)}`, icon: DollarSign, color: '#10B981' },
    { label: 'Pipeline Value', value: formatCurrency(stats.pipelineValue), subtitle: `${stats.activeCount} active mandates`, icon: Briefcase, color: '#C108AB' },
    { label: 'Average Fee', value: formatCurrency(stats.avgFee), subtitle: `Across ${stats.totalMandates} mandates`, icon: TrendingUp, color: '#F59E0B' },
    { label: 'Win Rate', value: stats.totalMandates > 0 ? `${((stats.wonMandates / stats.totalMandates) * 100).toFixed(1)}%` : '0%', subtitle: `${stats.wonMandates} won of ${stats.totalMandates}`, icon: Target, color: '#2563EB' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">{card.label}</p>
                <div className="w-7 h-7 flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#171717]">{card.value}</p>
              <p className="text-xs text-[#737373] mt-1">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue breakdown by status */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <h3 className="text-sm font-semibold text-[#171717] mb-4">Revenue by Status</h3>
        <div className="space-y-3">
          {[
            { label: 'Won', value: stats.wonRevenue, color: '#10B981' },
            { label: 'Completed', value: stats.completedRevenue, color: '#333333' },
            { label: 'Pipeline', value: stats.pipelineValue, color: '#C108AB' },
          ].map(item => {
            const maxVal = Math.max(stats.wonRevenue, stats.completedRevenue, stats.pipelineValue, 1);
            const pct = (item.value / maxVal) * 100;
            return (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-[#171717] text-right shrink-0">{item.label}</div>
                <div className="flex-1 h-8 bg-[#F0F0F0] overflow-hidden">
                  <div className="h-full flex items-center px-3" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: item.color }}>
                    <span className="text-xs font-semibold text-white">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
