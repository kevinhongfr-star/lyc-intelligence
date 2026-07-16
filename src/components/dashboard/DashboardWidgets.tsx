'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Activity,
  Zap,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── StatCard ────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: any;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'fuchsia';
  subtitle?: string;
  onClick?: () => void;
}

const COLOR_MAP = {
  blue:    { bg: 'rgba(37,99,235,0.05)',  accent: '#2563EB' },
  green:   { bg: 'rgba(22,163,74,0.05)',  accent: '#16A34A' },
  amber:   { bg: 'rgba(202,138,4,0.05)',  accent: '#CA8A04' },
  purple:  { bg: 'rgba(124,58,237,0.05)', accent: '#7C3AED' },
  red:     { bg: 'rgba(220,38,38,0.05)',   accent: '#DC2626' },
  fuchsia: { bg: 'rgba(193,8,171,0.05)',  accent: '#C108AB' },
};

export function StatCard({
  title, value, change, changeLabel = 'vs last period',
  icon: Icon, color = 'blue', subtitle, onClick,
}: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden bg-white border border-[#E5E5E5]
        p-5 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-[#D4D4D4] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[13px] font-semibold uppercase tracking-[1.5px] text-[#737373]">
          {title}
        </p>
        {Icon && (
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: c.bg }}>
            <Icon className="w-4 h-4" style={{ color: c.accent }} />
          </div>
        )}
      </div>

      <p className="text-[28px] font-bold text-[#171717] tracking-tight leading-none mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      <div className="flex items-center gap-2">
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
        <span className="text-xs text-[#737373]">{subtitle || changeLabel}</span>
      </div>

      {onClick && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[13px] font-medium text-[#737373] opacity-0 hover:opacity-100 transition-opacity">
          View <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Funnel ─────────────────────────────────────────────────
interface PipelineFunnelProps {
  funnel: Record<string, number>;
  conversions?: Record<string, number>;
  stages?: string[];
  onStageClick?: (stage: string) => void;
}

const DEFAULT_STAGES = ['GRID', 'LENS', 'SWEEP', 'CANVA', 'PLACED'];

const STAGE_LABELS: Record<string, string> = {
  'GRID': 'Grid',
  'LENS': 'Lens',
  'SWEEP': 'Sweep',
  'CANVA': 'Canva',
  'PLACED': 'Placed',
};

function formatStageShort(stage: string): string {
  const match = stage.match(/^S(\d+)_/);
  return match ? `S${match[1]}` : stage;
}

function formatStageName(stage: string): string {
  return STAGE_LABELS[stage] || stage.replace(/^S\d+_/, '').replace(/_/g, ' ');
}

const FUNNEL_COLORS = [
  '#6366F1', '#8B5CF6', '#A855F7', '#C026D3',
  '#C108AB', '#D946EF', '#E879A0', '#F59E0B', '#10B981', '#22C55E',
];

export function PipelineFunnel({ funnel, conversions = {}, onStageClick }: PipelineFunnelProps) {
  const stages = DEFAULT_STAGES.filter(s => funnel[s] !== undefined || true);
  const maxCount = Math.max(...Object.values(funnel), 1);
  const totalCandidates = Object.values(funnel).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[15px] text-[#171717]">Pipeline Funnel</h3>
            <p className="text-xs text-[#737373] mt-0.5">{totalCandidates} total candidates</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(193,8,171,0.05)]">
            <Activity className="w-3 h-3 text-[#C108AB]" />
            <span className="text-[13px] font-semibold text-[#C108AB]">Live</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-1">
        {stages.map((stage, idx) => {
          const count = funnel[stage] || 0;
          const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 2);
          const nextStage = stages[idx + 1];
          const convKey = nextStage ? `${stage}_to_${nextStage}` : null;
          const convRate = convKey && conversions[convKey] ? Math.round(conversions[convKey] * 100) : null;

          return (
            <React.Fragment key={stage}>
              <div
                onClick={() => onStageClick?.(stage)}
                className={`flex items-center gap-3 ${onStageClick ? 'cursor-pointer' : ''}`}
              >
                <span className="text-[14px] font-mono font-bold text-[#737373] w-7 text-right">
                  {formatStageShort(stage)}
                </span>
                <div className="flex-1 relative h-8 bg-[#F7F7F7] overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${widthPercent}%`,
                      background: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
                      opacity: 0.85,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-[13px] font-medium text-white drop-shadow-sm truncate">
                      {formatStageName(stage)}
                    </span>
                    <span className="ml-auto text-xs font-bold text-white/90 drop-shadow-sm">
                      {count}
                    </span>
                  </div>
                </div>
              </div>
              {convRate !== null && idx < stages.length - 1 && (
                <div className="flex items-center gap-2 pl-10 ml-[1.75rem]">
                  <ChevronRight className="w-3 h-3 text-[#A3A3A3]" />
                  <span className="text-[14px] font-medium text-[#737373]">{convRate}% conversion</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── ActivityFeed ────────────────────────────────────────────────────
interface ActivityItem {
  type: string;
  title: string;
  detail?: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  onActivityClick?: (item: ActivityItem) => void;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  outreach:     { icon: Users,    color: '#2563EB', bg: 'rgba(37,99,235,0.05)' },
  interview:    { icon: Target,   color: '#7C3AED', bg: 'rgba(124,58,237,0.05)' },
  placement:    { icon: DollarSign, color: '#16A34A', bg: 'rgba(22,163,74,0.05)' },
  assessment:   { icon: Activity, color: '#CA8A04', bg: 'rgba(202,138,4,0.05)' },
  meeting:      { icon: Zap,      color: '#C108AB', bg: 'rgba(193,8,171,0.05)' },
};

export function ActivityFeed({ items, onActivityClick }: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-[#171717]">Recent Activity</h3>
          <span className="text-[13px] font-medium text-[#737373]">{items.length} events</span>
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-8 h-8 text-[#A3A3A3] mx-auto mb-2" />
            <p className="text-sm text-[#737373]">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F7F7F7]">
            {items.slice(0, 20).map((item, idx) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.outreach;
              const Icon = config.icon;
              return (
                <div
                  key={idx}
                  onClick={() => onActivityClick?.(item)}
                  className={`flex items-start gap-3 px-6 py-3.5 transition-colors duration-150 ${
                    onActivityClick ? 'cursor-pointer hover:bg-[#FAFAFA]' : ''
                  }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: config.bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#171717] leading-snug">{item.title}</p>
                    {item.detail && <p className="text-xs text-[#737373] mt-0.5 truncate">{item.detail}</p>}
                  </div>
                  <span className="text-[14px] text-[#A3A3A3] flex-shrink-0 font-medium mt-0.5 tabular-nums">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI Scorecard ───────────────────────────────────────────────────
interface KPIScorecardProps {
  kpis: any[];
}

export function KPIScorecard({ kpis }: KPIScorecardProps) {
  const statusStyles: Record<string, { bg: string; text: string }> = {
    met:      { bg: 'rgba(22,163,74,0.06)',  text: '#16A34A' },
    on_track: { bg: 'rgba(37,99,235,0.06)',  text: '#2563EB' },
    at_risk:  { bg: 'rgba(202,138,4,0.06)',  text: '#CA8A04' },
  };

  const categoryIcons: Record<string, any> = {
    pipeline: Users, conversion: Target, velocity: Zap,
    activity: Activity, revenue: DollarSign, quality: TrendingUp,
  };

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <h3 className="font-semibold text-[15px] text-[#171717]">KPI Scorecard</h3>
      </div>
      <div className="px-6 py-4 space-y-5">
        {kpis.slice(0, 6).map(kpi => {
          const Icon = categoryIcons[kpi.category] || Target;
          const progress = Math.min(kpi.progress_percent || 0, 100);
          const st = statusStyles[kpi.status] || statusStyles.at_risk;

          return (
            <div key={kpi.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#737373]" />
                  <span className="text-sm font-medium text-[#171717]">{kpi.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#171717] tabular-nums">
                    {kpi.current_value}
                    <span className="text-[#737373] font-normal"> / {kpi.target_value}</span>
                  </span>
                  <span className="px-2 py-0.5 text-[14px] font-bold uppercase tracking-wide" style={{ background: st.bg, color: st.text }}>
                    {kpi.status}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-[#F7F7F7] overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: kpi.status === 'met' ? '#16A34A' : kpi.status === 'on_track' ? '#2563EB' : '#CA8A04',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mandate Health Grid ─────────────────────────────────────────────
interface MandateHealthGridProps {
  mandates: any[];
  onMandateClick?: (mandate: any) => void;
}

export function MandateHealthGrid({ mandates, onMandateClick }: MandateHealthGridProps) {
  const healthStyles: Record<string, { dot: string; text: string }> = {
    healthy:  { dot: '#16A34A', text: '#16A34A' },
    at_risk:  { dot: '#CA8A04', text: '#CA8A04' },
    stalled:  { dot: '#EA580C', text: '#EA580C' },
    critical: { dot: '#DC2626', text: '#DC2626' },
  };

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-[#171717]">Mandate Health</h3>
          <span className="text-[13px] font-medium text-[#737373]">{mandates.length} active</span>
        </div>
      </div>

      {mandates.length === 0 ? (
        <div className="py-12 text-center">
          <Target className="w-8 h-8 text-[#A3A3A3] mx-auto mb-2" />
          <p className="text-sm text-[#737373]">No active mandates</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F7F7F7]">
          {mandates.slice(0, 6).map(mandate => {
            const hs = healthStyles[mandate.health_label] || healthStyles.at_risk;
            return (
              <div
                key={mandate.mandate_id}
                onClick={() => onMandateClick?.(mandate)}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#171717] truncate">{mandate.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#737373]">
                    <span>{mandate.phase}</span>
                    <span className="text-[#EBEBEB]">·</span>
                    <span>{mandate.days_in_phase}d in phase</span>
                    <span className="text-[#EBEBEB]">·</span>
                    <span>{mandate.total_candidates} candidates</span>
                  </div>
                  {mandate.alerts?.length > 0 && (
                    <p className="text-xs text-[#DC2626] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {mandate.alerts[0]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <div className="w-2 h-2" style={{ background: hs.dot }} />
                  <span className="text-sm font-bold tabular-nums" style={{ color: hs.text }}>
                    {mandate.health_score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Consultant Leaderboard ──────────────────────────────────────────
interface ConsultantLeaderboardProps {
  consultants: any[];
}

export function ConsultantLeaderboard({ consultants }: ConsultantLeaderboardProps) {
  const RANK_STYLES = [
    { bg: 'rgba(202,138,4,0.06)', text: '#CA8A04' },
    { bg: 'rgba(107,114,128,0.06)', text: '#6B7280' },
    { bg: 'rgba(234,88,12,0.06)', text: '#EA580C' },
  ];

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <h3 className="font-semibold text-[15px] text-[#171717]">Team Leaderboard</h3>
      </div>
      <div className="divide-y divide-[#F7F7F7]">
        {consultants.map((c, idx) => {
          const rs = RANK_STYLES[idx] || { bg: '#F7F7F7', text: '#A3A3A3' };
          return (
            <div key={c.consultant_id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors">
              <div className="w-6 h-6 flex items-center justify-center text-[13px] font-bold" style={{ background: rs.bg, color: rs.text }}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#171717] truncate">{c.name}</p>
                <p className="text-xs text-[#737373]">{c.pipeline_count} candidates · {c.activity_30d.outreach} outreach (30d)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#16A34A] tabular-nums">{c.engagement_rate}%</p>
                <p className="text-[14px] text-[#737373] uppercase tracking-wide">engagement</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bottleneck Alert ────────────────────────────────────────────────
interface BottleneckAlertProps {
  bottlenecks: any[];
}

export function BottleneckAlert({ bottlenecks }: BottleneckAlertProps) {
  if (bottlenecks.length === 0) return null;

  const severityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    critical: { bg: 'rgba(220,38,38,0.03)',  border: 'rgba(220,38,38,0.3)',  icon: '#DC2626' },
    warning:  { bg: 'rgba(202,138,4,0.03)',  border: 'rgba(202,138,4,0.3)', icon: '#CA8A04' },
    info:     { bg: 'rgba(37,99,235,0.03)',   border: 'rgba(37,99,235,0.3)', icon: '#2563EB' },
  };

  const s = severityStyles[bottlenecks[0].severity] || severityStyles.warning;

  return (
    <div className="flex items-start gap-3 p-5" style={{ background: s.bg, borderLeft: `2px solid ${s.icon}` }}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.icon }} />
      <div>
        <h4 className="text-sm font-bold text-[#171717] mb-2">Pipeline Bottlenecks Detected</h4>
        <div className="space-y-1">
          {bottlenecks.slice(0, 3).map((b, idx) => (
            <p key={idx} className="text-sm text-[#404040]">
              <span className="font-semibold">{b.stage.replace(/_/g, ' ')}</span>
              {' — '}{b.count} candidates stuck
              {b.avg_days > 0 && ` (avg ${b.avg_days}d)`}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Build Progress Widget (NOTION-008) ──────────────────────────────
interface BuildProgressWidgetProps {
  onPhaseClick?: (phase: string) => void;
}

interface BuildPhaseData {
  phase: string;
  total: number;
  building: number;
  complete: number;
  blocked: number;
  deferred: number;
}

export function BuildProgressWidget({ onPhaseClick }: BuildProgressWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [phaseData, setPhaseData] = useState<BuildPhaseData[]>([]);
  const [totalComplete, setTotalComplete] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadBuildData();
  }, []);

  const loadBuildData = async () => {
    try {
      const { data, error } = await supabase
        .from('build_tracker')
        .select('build_phase, status');

      if (error) throw error;

      const phaseMap = new Map<string, BuildPhaseData>();
      
      for (const item of data || []) {
        if (!phaseMap.has(item.build_phase)) {
          phaseMap.set(item.build_phase, {
            phase: item.build_phase,
            total: 0,
            building: 0,
            complete: 0,
            blocked: 0,
            deferred: 0,
          });
        }
        const phase = phaseMap.get(item.build_phase)!;
        phase.total++;
        if (item.status === 'Building') phase.building++;
        else if (item.status === 'Complete') phase.complete++;
        else if (item.status === 'Blocked') phase.blocked++;
        else if (item.status === 'Deferred') phase.deferred++;
      }

      const phases = Array.from(phaseMap.values()).sort((a, b) => a.phase.localeCompare(b.phase));
      setPhaseData(phases);
      setTotalItems(phases.reduce((sum, p) => sum + p.total, 0));
      setTotalComplete(phases.reduce((sum, p) => sum + p.complete, 0));
    } catch (e) {
      console.error('Failed to load build tracker data:', e);
    } finally {
      setLoading(false);
    }
  };

  const overallPercent = totalItems > 0 ? Math.round((totalComplete / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E5E5] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-[#F0F0F0] w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-6 bg-[#F5F5F5]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[15px] text-[#171717]">365 Build Progress</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              {totalComplete} of {totalItems} deliverables complete ({overallPercent}%)
            </p>
          </div>
          <BarChart3 className="w-4 h-4 text-[#737373]" />
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        {phaseData.map(phase => {
          const completePct = phase.total > 0 ? (phase.complete / phase.total) * 100 : 0;
          const buildingPct = phase.total > 0 ? (phase.building / phase.total) * 100 : 0;
          const blockedPct = phase.total > 0 ? (phase.blocked / phase.total) * 100 : 0;

          return (
            <div
              key={phase.phase}
              onClick={() => onPhaseClick?.(phase.phase)}
              className={`space-y-1.5 ${onPhaseClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#404040] truncate">{phase.phase}</span>
                <span className="text-[#737373] tabular-nums">{phase.total}</span>
              </div>
              <div className="h-2 flex overflow-hidden">
                <div className="bg-[#16A34A]" style={{ width: `${completePct}%` }} />
                <div className="bg-[#CA8A04]" style={{ width: `${buildingPct}%` }} />
                <div className="bg-[#DC2626]" style={{ width: `${blockedPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 border-t border-[#F0F0F0] flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#16A34A]" />
          <span className="text-[#737373]">Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#CA8A04]" />
          <span className="text-[#737373]">Building</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#DC2626]" />
          <span className="text-[#737373]">Blocked</span>
        </div>
      </div>
    </div>
  );
}

// ─── Asset Pipeline Widget (NOTION-009) ──────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  'ATTRACT': '#2563EB',
  'ENGAGE': '#7C3AED',
  'ASSESS': '#C108AB',
  'RESOLVE': '#DC2626',
  'SUSTAIN': '#CA8A04',
  'PROMOTE': '#16A34A',
  'OPS': '#6B7280',
};

const PHASES = ['ATTRACT', 'ENGAGE', 'ASSESS', 'RESOLVE', 'SUSTAIN', 'PROMOTE', 'OPS'];

interface AssetPipelineWidgetProps {
  onPhaseClick?: (phase: string) => void;
}

export function AssetPipelineWidget({ onPhaseClick }: AssetPipelineWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [phaseCounts, setPhaseCounts] = useState<Record<string, number>>({});
  const [totalAssets, setTotalAssets] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [priorityCounts, setPriorityCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAssetData();
  }, []);

  const loadAssetData = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('notion_phase, status, asset_priority')
        .not('notion_asset_id', 'is', null);

      if (error) throw error;

      const phases: Record<string, number> = {};
      const statuses: Record<string, number> = {};
      const priorities: Record<string, number> = {};

      for (const asset of data || []) {
        const phase = asset.notion_phase || 'Uncategorized';
        phases[phase] = (phases[phase] || 0) + 1;

        const status = asset.status || 'unknown';
        statuses[status] = (statuses[status] || 0) + 1;

        const priority = asset.asset_priority || 'Unprioritized';
        priorities[priority] = (priorities[priority] || 0) + 1;
      }

      setPhaseCounts(phases);
      setStatusCounts(statuses);
      setPriorityCounts(priorities);
      setTotalAssets(data?.length || 0);
    } catch (e) {
      console.error('Failed to load asset data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E5E5] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-[#F0F0F0] w-1/3" />
          <div className="h-8 bg-[#F5F5F5]" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-[#F5F5F5]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[15px] text-[#171717]">Asset Pipeline</h3>
            <p className="text-xs text-[#737373] mt-0.5">{totalAssets} total assets</p>
          </div>
          <Layers className="w-4 h-4 text-[#737373]" />
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="h-3 flex overflow-hidden">
          {PHASES.map(phase => {
            const count = phaseCounts[phase] || 0;
            const pct = totalAssets > 0 ? (count / totalAssets) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={phase}
                onClick={() => onPhaseClick?.(phase)}
                className={`h-full ${onPhaseClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                style={{ width: `${pct}%`, background: PHASE_COLORS[phase] || '#6B7280' }}
                title={`${phase}: ${count}`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {PHASES.map(phase => {
            const count = phaseCounts[phase] || 0;
            if (count === 0) return null;
            return (
              <div
                key={phase}
                onClick={() => onPhaseClick?.(phase)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs ${onPhaseClick ? 'cursor-pointer hover:bg-[#F5F5F5]' : ''}`}
              >
                <div className="w-2 h-2" style={{ background: PHASE_COLORS[phase] }} />
                <span className="text-[#404040]">{phase}</span>
                <span className="text-[#737373] tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-xs">
            <p className="text-[#737373] mb-1">By Status</p>
            <div className="space-y-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-[#404040] capitalize">{status}</span>
                  <span className="text-[#737373] tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs">
            <p className="text-[#737373] mb-1">By Priority</p>
            <div className="space-y-1">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-[#404040]">{priority}</span>
                  <span className="text-[#737373] tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sync Health Indicator (NOTION-014) ──────────────────────────────
interface SyncHealthIndicatorProps {
  onSyncClick?: () => void;
}

export function SyncHealthIndicator({ onSyncClick }: SyncHealthIndicatorProps) {
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_notion_sync_status');
      if (error) throw error;

      const statusMap: Record<string, any> = {};
      for (const item of data || []) {
        statusMap[item.source_db] = item;
      }
      setSyncStatus(statusMap);
    } catch (e) {
      console.error('Failed to load sync status:', e);
    } finally {
      setLoading(false);
    }
  };

  const getHealthInfo = (source: string) => {
    const status = syncStatus[source];
    if (!status || !status.last_sync_at) {
      return { color: '#DC2626', label: 'Never synced', icon: XCircle };
    }

    const lastSync = new Date(status.last_sync_at);
    const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    if (status.last_sync_status === 'failed') {
      return { color: '#DC2626', label: 'Sync failed', icon: XCircle };
    }
    if (hoursAgo > 48) {
      return { color: '#DC2626', label: `${Math.floor(hoursAgo / 24)}d ago`, icon: AlertTriangle };
    }
    if (hoursAgo > 24) {
      return { color: '#CA8A04', label: `${Math.floor(hoursAgo)}h ago`, icon: Clock };
    }
    return { color: '#16A34A', label: formatTimeAgo(hoursAgo), icon: CheckCircle2 };
  };

  const formatTimeAgo = (hours: number) => {
    if (hours < 1) return 'Just synced';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    await loadSyncStatus();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#737373]">
        <div className="w-2 h-2 bg-[#D4D4D4] animate-pulse" />
        <span>Checking sync status...</span>
      </div>
    );
  }

  return (
    <div
      onClick={onSyncClick}
      className={`flex items-center gap-3 text-xs ${onSyncClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {['launch_assets', 'build_tracker'].map(source => {
        const health = getHealthInfo(source);
        const Icon = health.icon;
        return (
          <div key={source} className="flex items-center gap-1.5">
            <Icon className="w-3 h-3" style={{ color: health.color }} />
            <span className="text-[#737373]">
              {source === 'launch_assets' ? 'Assets' : 'Build'}: {health.label}
            </span>
          </div>
        );
      })}
      <button
        onClick={handleRefresh}
        className="p-1 hover:bg-[#F5F5F5] rounded"
        title="Refresh status"
      >
        <RefreshCw className={`w-3 h-3 text-[#737373] ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

// ─── Asset Status Donut (NOTION-010) ─────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  idea: '#9CA3AF',
  draft: '#3B82F6',
  review: '#F59E0B',
  approved: '#10B981',
  archived: '#6B7280',
};

export function AssetStatusDonut() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('status');

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const item of data || []) {
        counts[item.status] = (counts[item.status] || 0) + 1;
      }
      setStatusData(counts);
      setTotal(data?.length || 0);
    } catch (e) {
      console.error('Failed to load status data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E5E5] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-[#F0F0F0] w-1/3" />
          <div className="w-24 h-24 mx-auto bg-[#F5F5F5] rounded-full" />
        </div>
      </div>
    );
  }

  const size = 100;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="px-6 py-4 border-b border-[#E5E5E5]">
        <h3 className="font-semibold text-[15px] text-[#171717]">Asset Status</h3>
      </div>
      <div className="px-6 py-4 flex items-center justify-center">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            {Object.entries(statusData).map(([status, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              const dashLength = (pct / 100) * circumference;
              const dashOffset = -offset;
              offset += dashLength;

              return (
                <circle
                  key={status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={STATUS_COLORS[status] || '#9CA3AF'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-[#171717]">{total}</span>
          </div>
        </div>
      </div>
      <div className="px-6 pb-4 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(statusData).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2">
            <div className="w-2 h-2" style={{ background: STATUS_COLORS[status] }} />
            <span className="text-[#404040] capitalize">{status}</span>
            <span className="ml-auto text-[#737373] tabular-nums">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
