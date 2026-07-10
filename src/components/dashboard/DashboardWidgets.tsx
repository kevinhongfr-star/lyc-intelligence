'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  DollarSign,
  Activity,
  Zap,
  ChevronRight,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

// ─── Premium StatCard ────────────────────────────────────────────────────────
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
  blue:    { bg: 'rgba(44,82,130,0.06)',  icon: '#2C5282', accent: '#2C5282' },
  green:   { bg: 'rgba(26,125,66,0.06)',  icon: '#1A7D42', accent: '#1A7D42' },
  amber:   { bg: 'rgba(184,134,11,0.06)', icon: '#B8860B', accent: '#B8860B' },
  purple:  { bg: 'rgba(139,92,246,0.06)', icon: '#7C3AED', accent: '#7C3AED' },
  red:     { bg: 'rgba(192,57,43,0.06)',  icon: '#C0392B', accent: '#C0392B' },
  fuchsia: { bg: 'rgba(193,8,171,0.06)', icon: '#C108AB', accent: '#C108AB' },
};

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  color = 'blue',
  subtitle,
  onClick,
}: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const c = COLOR_MAP[color];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden
        bg-white
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer' : ''}
      `}
      style={{
        boxShadow: hovered
          ? '0 12px 24px rgba(26,23,20,0.08), 0 4px 8px rgba(26,23,20,0.04)'
          : '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)',
        transform: hovered && onClick ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Accent bar top */}
      <div style={{ height: '3px', background: c.accent, opacity: hovered ? 1 : 0.6, transition: 'opacity 0.3s' }} />

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#8C857D]">
            {title}
          </p>
          {Icon && (
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ background: c.bg }}
            >
              <Icon className="w-4 h-4" style={{ color: c.icon }} />
            </div>
          )}
        </div>

        <p className="text-3xl font-bold text-[#1A1714] tracking-tight leading-none mb-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        <div className="flex items-center gap-2">
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-[#1A7D42]' : 'text-[#C0392B]'}`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
          {subtitle && (
            <span className="text-xs text-[#8C857D]">{subtitle}</span>
          )}
          {!subtitle && change !== undefined && (
            <span className="text-xs text-[#8C857D]">{changeLabel}</span>
          )}
        </div>
      </div>

      {onClick && (
        <div
          className="absolute bottom-3 right-4 flex items-center gap-1 text-[11px] font-medium transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0, color: c.accent }}
        >
          查看详情 <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

// ─── Premium Pipeline Funnel ─────────────────────────────────────────────────
interface PipelineFunnelProps {
  funnel: Record<string, number>;
  conversions?: Record<string, number>;
  stages?: string[];
  onStageClick?: (stage: string) => void;
}

const DEFAULT_STAGES = [
  'S1_Sourced',
  'S2_Screened',
  'S3_Contacted',
  'S5_Responded',
  'S7_Interested',
  'S9_Call_Positive',
  'S11_Internal_Interview',
  'S12_Presented',
  'S16_Offer',
  'S19_Closed',
];

const STAGE_LABELS: Record<string, string> = {
  S1_Sourced: 'Sourced',
  S2_Screened: 'Screened',
  S3_Contacted: 'Contacted',
  S5_Responded: 'Responded',
  S7_Interested: 'Interested',
  S9_Call_Positive: 'Call +',
  S11_Internal_Interview: 'Internal Int.',
  S12_Presented: 'Presented',
  S16_Offer: 'Offer',
  S19_Closed: 'Closed',
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
    <div
      className="bg-white"
      style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
    >
      <div className="px-6 py-5 border-b border-[#F0EDEA]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1A1714]">Pipeline Funnel</h3>
            <p className="text-xs text-[#8C857D] mt-0.5">{totalCandidates} total candidates across all stages</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(193,8,171,0.06)]">
            <Activity className="w-3.5 h-3.5 text-[#C108AB]" />
            <span className="text-xs font-semibold text-[#C108AB]">Live</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-1.5">
        {stages.map((stage, idx) => {
          const count = funnel[stage] || 0;
          const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 8 : 2);
          const nextStage = stages[idx + 1];
          const convKey = nextStage ? `${stage}_to_${nextStage}` : null;
          const convRate = convKey && conversions[convKey]
            ? Math.round(conversions[convKey] * 100)
            : null;

          return (
            <React.Fragment key={stage}>
              <div
                onClick={() => onStageClick?.(stage)}
                className={`flex items-center gap-4 group ${onStageClick ? 'cursor-pointer' : ''}`}
              >
                <span className="text-[11px] font-bold text-[#8C857D] w-8 text-right font-mono">
                  {formatStageShort(stage)}
                </span>
                <div className="flex-1 relative h-9 bg-[#F5F3F0] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${widthPercent}%`,
                      background: `linear-gradient(90deg, ${FUNNEL_COLORS[idx % FUNNEL_COLORS.length]}CC, ${FUNNEL_COLORS[idx % FUNNEL_COLORS.length]})`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-[11px] font-medium text-white drop-shadow-md truncate">
                      {formatStageName(stage)}
                    </span>
                    <span className="ml-auto text-xs font-bold text-white/90 drop-shadow-md">
                      {count}
                    </span>
                  </div>
                </div>
              </div>
              {convRate !== null && idx < stages.length - 1 && (
                <div className="flex items-center gap-2 pl-12 ml-[2rem]">
                  <div className="w-px h-2.5 bg-[#E8E5E0]" />
                  <span className="text-[10px] font-medium text-[#8C857D]">
                    {convRate}% conversion
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Premium Activity Feed ───────────────────────────────────────────────────
interface ActivityFeedProps {
  items: any[];
  onActivityClick?: (item: any) => void;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  outreach:          { icon: MessageSquare, color: '#2C5282', bg: 'rgba(44,82,130,0.06)' },
  pipeline_change:   { icon: TrendingUp,    color: '#1A7D42', bg: 'rgba(26,125,66,0.06)' },
  import:            { icon: Zap,           color: '#B8860B', bg: 'rgba(184,134,11,0.06)' },
  client_feedback:   { icon: Users,         color: '#C108AB', bg: 'rgba(193,8,171,0.06)' },
};

export function ActivityFeed({ items, onActivityClick }: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="bg-white"
      style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
    >
      <div className="px-6 py-5 border-b border-[#F0EDEA]">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#1A1714]">Recent Activity</h3>
          <span className="text-[11px] font-medium text-[#8C857D]">{items.length} events</span>
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-10 h-10 text-[#B8B0A6] mx-auto mb-3" />
            <p className="text-sm text-[#8C857D]">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F3F0]">
            {items.slice(0, 20).map((item, idx) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.outreach;
              const Icon = config.icon;
              return (
                <div
                  key={idx}
                  onClick={() => onActivityClick?.(item)}
                  className={`flex items-start gap-3.5 px-6 py-3.5 transition-colors duration-150 ${
                    onActivityClick ? 'cursor-pointer hover:bg-[#FAF9F7]' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: config.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1714] leading-snug">{item.title}</p>
                    {item.detail && (
                      <p className="text-xs text-[#8C857D] mt-0.5 truncate">{item.detail}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#B8B0A6] flex-shrink-0 font-medium mt-0.5">
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

// ─── KPI Scorecard ───────────────────────────────────────────────────────────
interface KPIScorecardProps {
  kpis: any[];
}

export function KPIScorecard({ kpis }: KPIScorecardProps) {
  const statusStyles: Record<string, { bg: string; text: string }> = {
    met:      { bg: 'rgba(26,125,66,0.08)',  text: '#1A7D42' },
    on_track: { bg: 'rgba(44,82,130,0.08)',  text: '#2C5282' },
    at_risk:  { bg: 'rgba(184,134,11,0.08)', text: '#B8860B' },
  };

  const categoryIcons: Record<string, any> = {
    pipeline: Users,
    conversion: Target,
    velocity: Zap,
    activity: Activity,
    revenue: DollarSign,
    quality: TrendingUp,
  };

  return (
    <div
      className="bg-white"
      style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
    >
      <div className="px-6 py-5 border-b border-[#F0EDEA]">
        <h3 className="font-serif font-bold text-base text-[#1A1714]">KPI Scorecard</h3>
      </div>
      <div className="px-6 py-4 space-y-5">
        {kpis.slice(0, 6).map(kpi => {
          const Icon = categoryIcons[kpi.category] || Target;
          const progress = Math.min(kpi.progress_percent || 0, 100);
          const st = statusStyles[kpi.status] || statusStyles.at_risk;

          return (
            <div key={kpi.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#8C857D]" />
                  <span className="text-sm font-medium text-[#1A1714]">{kpi.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1A1714]">
                    {kpi.current_value}
                    <span className="text-[#8C857D] font-normal"> / {kpi.target_value}</span>
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: st.bg, color: st.text }}
                  >
                    {kpi.status}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-[#F0EDEA] overflow-hidden">
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: kpi.status === 'met' ? '#1A7D42' : kpi.status === 'on_track' ? '#2C5282' : '#B8860B',
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

// ─── Mandate Health Grid ─────────────────────────────────────────────────────
interface MandateHealthGridProps {
  mandates: any[];
  onMandateClick?: (mandate: any) => void;
}

export function MandateHealthGrid({ mandates, onMandateClick }: MandateHealthGridProps) {
  const healthStyles: Record<string, { dot: string; bg: string; text: string }> = {
    healthy:  { dot: '#1A7D42', bg: 'rgba(26,125,66,0.04)',  text: '#1A7D42' },
    at_risk:  { dot: '#B8860B', bg: 'rgba(184,134,11,0.04)', text: '#B8860B' },
    stalled:  { dot: '#EA580C', bg: 'rgba(234,88,12,0.04)',  text: '#EA580C' },
    critical: { dot: '#C0392B', bg: 'rgba(192,57,43,0.04)',  text: '#C0392B' },
  };

  return (
    <div
      className="bg-white"
      style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
    >
      <div className="px-6 py-5 border-b border-[#F0EDEA]">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#1A1714]">Mandate Health</h3>
          <span className="text-[11px] font-medium text-[#8C857D]">{mandates.length} active</span>
        </div>
      </div>

      {mandates.length === 0 ? (
        <div className="py-12 text-center">
          <Target className="w-10 h-10 text-[#B8B0A6] mx-auto mb-3" />
          <p className="text-sm text-[#8C857D]">No active mandates</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F3F0]">
          {mandates.slice(0, 6).map(mandate => {
            const hs = healthStyles[mandate.health_label] || healthStyles.at_risk;
            return (
              <div
                key={mandate.mandate_id}
                onClick={() => onMandateClick?.(mandate)}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#FAF9F7] transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#1A1714] truncate">{mandate.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#8C857D]">
                    <span>{mandate.phase}</span>
                    <span className="text-[#E8E5E0]">·</span>
                    <span>{mandate.days_in_phase}d in phase</span>
                    <span className="text-[#E8E5E0]">·</span>
                    <span>{mandate.total_candidates} candidates</span>
                  </div>
                  {mandate.alerts?.length > 0 && (
                    <p className="text-xs text-[#C0392B] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {mandate.alerts[0]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: hs.dot }} />
                  <span
                    className="text-sm font-bold"
                    style={{ color: hs.text }}
                  >
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

// ─── Consultant Leaderboard ──────────────────────────────────────────────────
interface ConsultantLeaderboardProps {
  consultants: any[];
}

export function ConsultantLeaderboard({ consultants }: ConsultantLeaderboardProps) {
  const RANK_STYLES = [
    { bg: 'rgba(184,134,11,0.08)', text: '#B8860B', ring: '#B8860B' },
    { bg: 'rgba(107,114,128,0.08)', text: '#6B7280', ring: '#6B7280' },
    { bg: 'rgba(234,88,12,0.08)',  text: '#EA580C', ring: '#EA580C' },
  ];

  return (
    <div
      className="bg-white"
      style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
    >
      <div className="px-6 py-5 border-b border-[#F0EDEA]">
        <h3 className="font-serif font-bold text-base text-[#1A1714]">Team Leaderboard</h3>
      </div>
      <div className="divide-y divide-[#F5F3F0]">
        {consultants.map((c, idx) => {
          const rs = RANK_STYLES[idx] || { bg: '#F0EDEA', text: '#8C857D', ring: '#E8E5E0' };
          return (
            <div key={c.consultant_id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FAF9F7] transition-colors">
              <div
                className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                style={{ background: rs.bg, color: rs.text }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1714] truncate">{c.name}</p>
                <p className="text-xs text-[#8C857D]">
                  {c.pipeline_count} candidates · {c.activity_30d.outreach} outreach (30d)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1A7D42]">{c.engagement_rate}%</p>
                <p className="text-[10px] text-[#8C857D] uppercase tracking-wide">engagement</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bottleneck Alert ────────────────────────────────────────────────────────
interface BottleneckAlertProps {
  bottlenecks: any[];
}

export function BottleneckAlert({ bottlenecks }: BottleneckAlertProps) {
  if (bottlenecks.length === 0) return null;

  const severityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    critical: { bg: 'rgba(192,57,43,0.04)',  border: 'rgba(192,57,43,0.2)',  icon: '#C0392B' },
    warning:  { bg: 'rgba(184,134,11,0.04)', border: 'rgba(184,134,11,0.2)', icon: '#B8860B' },
    info:     { bg: 'rgba(44,82,130,0.04)',  border: 'rgba(44,82,130,0.2)',  icon: '#2C5282' },
  };

  const s = severityStyles[bottlenecks[0].severity] || severityStyles.warning;

  return (
    <div
      className="flex items-start gap-3 p-5"
      style={{ background: s.bg, borderLeft: `3px solid ${s.icon}` }}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: s.icon }} />
      <div>
        <h4 className="text-sm font-bold text-[#1A1714] mb-2">Pipeline Bottlenecks Detected</h4>
        <div className="space-y-1">
          {bottlenecks.slice(0, 3).map((b, idx) => (
            <p key={idx} className="text-sm text-[#4A4541]">
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
