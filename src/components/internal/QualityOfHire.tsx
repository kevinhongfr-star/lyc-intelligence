import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Target, Star, TrendingUp } from 'lucide-react';
import { getSupabase } from '@/services/supabaseApi';

interface QualityMetric {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface StageConversion {
  from: string;
  to: string;
  count: number;
  rate: number;
}

export default function QualityOfHire() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [conversions, setConversions] = useState<StageConversion[]>([]);
  const [tierDist, setTierDist] = useState<Record<string, number>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const [pipeRes, mandateRes] = await Promise.all([
        sb.from('candidates_pipeline').select('stage, trident_composite'),
        sb.from('mandates').select('status, phi_composite, total_candidates, shortlisted_count'),
      ]);

      const pipeline = pipeRes.data || [];
      const mandates = mandateRes.data || [];

      // Stage counts
      const stageCounts: Record<string, number> = {};
      pipeline.forEach(p => { stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1; });

      // Stage conversions
      const stageOrder = ['GRID', 'LENS', 'SWEEP', 'CANVA', 'PLACED'];
      const conv: StageConversion[] = [];
      for (let i = 0; i < stageOrder.length - 1; i++) {
        const from = stageCounts[stageOrder[i]] || 0;
        const to = stageCounts[stageOrder[i + 1]] || 0;
        conv.push({
          from: stageOrder[i],
          to: stageOrder[i + 1],
          count: to,
          rate: from > 0 ? Math.round((to / from) * 100) : 0,
        });
      }
      setConversions(conv);

      // Tier distribution from pipeline candidates
      const tiers: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 };
      pipeline.forEach(p => {
        const score = p.trident_composite ?? 0;
        if (score >= 85) tiers.S++;
        else if (score >= 65) tiers.A++;
        else if (score >= 45) tiers.B++;
        else tiers.C++;
      });
      setTierDist(tiers);

      // Overall metrics
      const totalPlaced = stageCounts['PLACED'] || 0;
      const avgScore = pipeline.length > 0
        ? Math.round(pipeline.reduce((s, p) => s + (p.trident_composite ?? 0), 0) / pipeline.length)
        : 0;
      const wonMandates = mandates.filter(m => m.status === 'won' || m.status === 'completed').length;
      const avgPhi = mandates.length > 0
        ? Math.round(mandates.reduce((s, m) => s + (m.phi_composite ?? 0), 0) / mandates.length)
        : 0;

      setMetrics([
        { label: 'Total in Pipeline', value: pipeline.length, subtitle: `${Object.keys(stageCounts).length} stages active`, icon: Target, color: '#C108AB' },
        { label: 'Avg Candidate Score', value: avgScore, subtitle: 'TRIDENT composite', icon: Star, color: '#F59E0B' },
        { label: 'Mandates Won', value: wonMandates, subtitle: `of ${mandates.length} total`, icon: CheckCircle, color: '#10B981' },
        { label: 'Avg PHI Score', value: avgPhi, subtitle: 'Mandate health index', icon: TrendingUp, color: '#2563EB' },
      ]);
    } catch (e) {
      console.error('QualityOfHire error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#737373]">Loading quality metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">{m.label}</p>
                <div className="w-7 h-7 flex items-center justify-center" style={{ backgroundColor: m.color + '15' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#171717]">{m.value}</p>
              <p className="text-xs text-[#737373] mt-1">{m.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Stage conversion funnel */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <h3 className="text-sm font-semibold text-[#171717] mb-4">Stage Conversion Rates</h3>
        <div className="space-y-4">
          {conversions.map(c => (
            <div key={`${c.from}-${c.to}`} className="flex items-center gap-4">
              <div className="w-32 text-sm text-[#404040] text-right shrink-0">
                {c.from} → {c.to}
              </div>
              <div className="flex-1 h-6 bg-[#F0F0F0] overflow-hidden">
                <div
                  className="h-full flex items-center px-3 transition-all duration-500"
                  style={{
                    width: `${Math.max(c.rate, c.rate > 0 ? 8 : 0)}%`,
                    backgroundColor: c.rate >= 50 ? '#10B981' : c.rate >= 25 ? '#F59E0B' : '#EF4444',
                  }}
                >
                  {c.rate > 0 && <span className="text-xs font-semibold text-white">{c.rate}%</span>}
                </div>
              </div>
              <div className="w-16 text-sm text-[#737373] text-right shrink-0">{c.count} moved</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier distribution */}
      <div className="bg-white border border-[#E5E5E5] p-6">
        <h3 className="text-sm font-semibold text-[#171717] mb-4">Pipeline Tier Distribution</h3>
        <div className="flex gap-3">
          {[
            { tier: 'S', label: 'Elite', color: '#B8860B' },
            { tier: 'A', label: 'Senior', color: '#1A7D42' },
            { tier: 'B', label: 'Mid-Level', color: '#2C5282' },
            { tier: 'C', label: 'Emerging', color: '#A3A3A3' },
          ].map(t => {
            const count = tierDist[t.tier] || 0;
            const total = Object.values(tierDist).reduce((s, v) => s + v, 0);
            const pct = total > 0 ? (count / total * 100).toFixed(0) : '0';
            return (
              <div key={t.tier} className="flex-1 text-center p-4 border border-[#E5E5E5]">
                <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center text-lg font-bold" style={{ backgroundColor: t.color + '15', color: t.color }}>
                  {t.tier}
                </div>
                <p className="text-xl font-bold text-[#171717]">{count}</p>
                <p className="text-xs text-[#737373]">{t.label} ({pct}%)</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
