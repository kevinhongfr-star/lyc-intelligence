'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  DollarSign,
  Activity,
  Zap,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: any;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  color = 'blue',
  subtitle,
}: StatCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
  };

  const colors = colorClasses[color];

  const renderChange = () => {
    if (change === undefined) return null;
    const isPositive = change >= 0;
    const isNegative = change < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const colorClass = isPositive
      ? 'text-emerald-600'
      : isNegative
      ? 'text-red-600'
      : 'text-gray-500';

    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span className="font-medium">{Math.abs(change)}%</span>
        <span className="text-text-muted">{changeLabel}</span>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-none p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-none ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        )}
      </div>
      <div className="mt-3">{renderChange()}</div>
    </div>
  );
}

interface PipelineFunnelProps {
  funnel: Record<string, number>;
  conversions?: Record<string, number>;
  stages?: string[];
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

function formatStageShort(stage: string): string {
  const match = stage.match(/^S(\d+)_(.+)$/);
  if (match) return `S${match[1]}`;
  return stage;
}

function formatStageName(stage: string): string {
  return stage.replace(/^S\d+_/, '').replace(/_/g, ' ');
}

export function PipelineFunnel({ funnel, conversions = {} }: PipelineFunnelProps) {
  const stages = DEFAULT_STAGES.filter(s => funnel[s] !== undefined || true);
  const maxCount = Math.max(...Object.values(funnel), 1);

  return (
    <div className="bg-card border border-border rounded-none p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Pipeline Funnel</h3>
        <span className="text-sm text-text-muted">
          {Object.values(funnel).reduce((a, b) => a + b, 0)} total candidates
        </span>
      </div>

      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const count = funnel[stage] || 0;
          const widthPercent = (count / maxCount) * 100;
          const nextStage = stages[idx + 1];
          const convKey = nextStage ? `${stage}_to_${nextStage}` : null;
          const convRate = convKey && conversions[convKey]
            ? Math.round(conversions[convKey] * 100)
            : null;

          return (
            <div key={stage} className="group">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-text-muted w-12 flex-shrink-0">
                  {formatStageShort(stage)}
                </span>
                <div className="flex-1 h-8 bg-bg-alt rounded-none overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-none transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white drop-shadow-sm">
                    {formatStageName(stage)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-text-primary w-10 text-right">
                  {count}
                </span>
              </div>
              {convRate !== null && idx < stages.length - 1 && (
                <div className="pl-15 mt-0.5 mb-0.5">
                  <div className="flex items-center gap-2 pl-12">
                    <div className="w-px h-3 bg-border" />
                    <span className="text-xs text-text-muted">
                      → {convRate}% conversion
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KPIScorecardProps {
  kpis: any[];
}

export function KPIScorecard({ kpis }: KPIScorecardProps) {
  const statusColors: Record<string, string> = {
    met: 'bg-emerald-100 text-emerald-700',
    on_track: 'bg-blue-100 text-blue-700',
    at_risk: 'bg-amber-100 text-amber-700',
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
    <div className="bg-card border border-border rounded-none p-5">
      <h3 className="font-semibold text-text-primary mb-4">KPI Scorecard</h3>
      <div className="space-y-3">
        {kpis.slice(0, 6).map(kpi => {
          const Icon = categoryIcons[kpi.category] || Target;
          const progress = Math.min(kpi.progress_percent || 0, 100);

          return (
            <div key={kpi.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">{kpi.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {kpi.current_value}
                    <span className="text-text-muted font-normal"> / {kpi.target_value}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[kpi.status] || 'bg-gray-100 text-gray-700'}`}>
                    {kpi.status}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    kpi.status === 'met'
                      ? 'bg-emerald-500'
                      : kpi.status === 'on_track'
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MandateHealthGridProps {
  mandates: any[];
}

export function MandateHealthGrid({ mandates }: MandateHealthGridProps) {
  const healthColors: Record<string, { bg: string; dot: string; text: string }> = {
    healthy: { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' },
    at_risk: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
    stalled: { bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', text: 'text-orange-700' },
    critical: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
  };

  return (
    <div className="bg-card border border-border rounded-none p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Mandate Health</h3>
        <span className="text-sm text-text-muted">{mandates.length} active</span>
      </div>

      {mandates.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No active mandates</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {mandates.slice(0, 5).map(mandate => {
            const colors = healthColors[mandate.health_label] || healthColors.at_risk;
            return (
              <div
                key={mandate.mandate_id}
                className={`p-3 rounded-none border ${colors.bg} hover:shadow-sm transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary text-sm truncate">
                      {mandate.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span>{mandate.phase}</span>
                      <span>•</span>
                      <span>{mandate.days_in_phase}d in phase</span>
                      <span>•</span>
                      <span>{mandate.total_candidates} candidates</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {mandate.health_score}
                    </span>
                  </div>
                </div>
                {mandate.alerts?.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    ⚠️ {mandate.alerts[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ActivityFeedProps {
  items: any[];
}

const typeIcons: Record<string, any> = {
  outreach: Activity,
  pipeline_change: TrendingUp,
  import: Zap,
  client_feedback: MessageSquare,
};

import { MessageSquare } from 'lucide-react';

export function ActivityFeed({ items }: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-card border border-border rounded-none p-5">
      <h3 className="font-semibold text-text-primary mb-4">Recent Activity</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No recent activity</p>
          </div>
        ) : (
          items.slice(0, 15).map((item, idx) => {
            const Icon = typeIcons[item.type] || Activity;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-none bg-bg-alt flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{item.title}</p>
                  {item.detail && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{item.detail}</p>
                  )}
                </div>
                <span className="text-xs text-text-muted flex-shrink-0">
                  {formatTime(item.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ConsultantLeaderboardProps {
  consultants: any[];
}

export function ConsultantLeaderboard({ consultants }: ConsultantLeaderboardProps) {
  return (
    <div className="bg-card border border-border rounded-none p-5">
      <h3 className="font-semibold text-text-primary mb-4">Team Leaderboard</h3>
      <div className="space-y-2">
        {consultants.map((c, idx) => (
          <div
            key={c.consultant_id}
            className="flex items-center gap-3 p-2 rounded-none hover:bg-bg-alt/50 transition-colors"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              idx === 0 ? 'bg-amber-100 text-amber-700' :
              idx === 1 ? 'bg-gray-100 text-gray-700' :
              idx === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-bg-alt text-text-muted'
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
              <p className="text-xs text-text-muted">
                {c.pipeline_count} candidates · {c.activity_30d.outreach} outreach (30d)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600">
                {c.engagement_rate}%
              </p>
              <p className="text-xs text-text-muted">engagement</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BottleneckAlertProps {
  bottlenecks: any[];
}

export function BottleneckAlert({ bottlenecks }: BottleneckAlertProps) {
  if (bottlenecks.length === 0) return null;

  const severityColors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`p-4 rounded-none border ${severityColors[bottlenecks[0].severity] || severityColors.warning}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5" />
        <h4 className="font-semibold">Pipeline Bottlenecks Detected</h4>
      </div>
      <div className="space-y-1.5">
        {bottlenecks.slice(0, 3).map((b, idx) => (
          <p key={idx} className="text-sm">
            <span className="font-medium">{b.stage.replace(/_/g, ' ')}</span>
            {' — '}{b.count} candidates stuck
            {b.avg_days > 0 && ` (avg ${b.avg_days}d)`}
          </p>
        ))}
      </div>
    </div>
  );
}

import { AlertCircle } from 'lucide-react';
