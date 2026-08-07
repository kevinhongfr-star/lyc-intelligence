import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, Eye, MousePointer, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface FunnelData {
  step: string;
  count: number;
  rate: number;
}

interface ChannelPerformance {
  channel: string;
  sent: number;
  openRate: number;
  responseRate: number;
  clickRate: number;
}

const FUNNEL_DATA: FunnelData[] = [
  { step: 'Sent', count: 450, rate: 100 },
  { step: 'Delivered', count: 382, rate: 84.9 },
  { step: 'Opened', count: 172, rate: 38.2 },
  { step: 'Responded', count: 48, rate: 10.7 },
  { step: 'Interviewed', count: 29, rate: 6.4 },
  { step: 'Offered', count: 12, rate: 2.7 },
  { step: 'Placed', count: 7, rate: 1.6 },
];

const CHANNEL_DATA: ChannelPerformance[] = [
  { channel: 'Email', sent: 320, openRate: 42.5, responseRate: 12.3, clickRate: 8.1 },
  { channel: 'SMS', sent: 89, openRate: 78.2, responseRate: 18.5, clickRate: 5.2 },
  { channel: 'LinkedIn', sent: 41, openRate: 35.1, responseRate: 8.9, clickRate: 3.4 },
];

const TREND_DATA = [
  { day: 'Mon', sent: 25, opened: 10, responded: 3 },
  { day: 'Tue', sent: 32, opened: 14, responded: 5 },
  { day: 'Wed', sent: 28, opened: 12, responded: 4 },
  { day: 'Thu', sent: 45, opened: 20, responded: 7 },
  { day: 'Fri', sent: 38, opened: 17, responded: 6 },
  { day: 'Sat', sent: 12, opened: 5, responded: 1 },
  { day: 'Sun', sent: 8, opened: 3, responded: 0 },
];

export function OutreachAnalytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'channels' | 'trends'>('overview');

  const maxFunnel = useMemo(() => FUNNEL_DATA[0].count, []);
  const maxTrend = useMemo(() => Math.max(...TREND_DATA.map(d => d.sent)), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          Outreach Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4">
          {(['overview', 'funnel', 'channels', 'trends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs border transition-colors ${
                activeTab === tab
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-accent/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<MessageCircle className="w-4 h-4" />} label="Total Sent" value="450" trend="+12%" />
            <StatCard icon={<Eye className="w-4 h-4" />} label="Open Rate" value="38.2%" trend="+2.4%" />
            <StatCard icon={<MousePointer className="w-4 h-4" />} label="Response Rate" value="10.7%" trend="-1.2%" />
            <StatCard icon={<Target className="w-4 h-4" />} label="Placed" value="7" trend="+3" />
            <StatCard icon={<Users className="w-4 h-4" />} label="Unique Candidates" value="312" trend="+18" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Response Time" value="18.5h" trend="-2.1h" />
            <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Active Campaigns" value="5" trend="+1" />
            <StatCard icon={<MessageCircle className="w-4 h-4" />} label="Best Channel" value="Email" trend="" />
          </div>
        )}

        {activeTab === 'funnel' && (
          <div>
            <p className="text-xs text-text-muted mb-3">Outreach Pipeline Funnel</p>
            <div className="space-y-2">
              {FUNNEL_DATA.map((item, i) => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-text-secondary">{item.step}</span>
                  <div className="flex-1 bg-bg-tertiary h-8 relative">
                    <div
                      className="h-full bg-accent transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(item.count / maxFunnel) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                  <span className="w-16 text-xs text-text-muted text-right">{item.rate}%</span>
                  {i < FUNNEL_DATA.length - 1 && (
                    <span className="w-12 text-xs text-text-muted text-right">
                      {item.rate > 0 && FUNNEL_DATA[i + 1].count > 0
                        ? Math.round((FUNNEL_DATA[i + 1].count / item.count) * 100)
                        : 0}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div>
            <p className="text-xs text-text-muted mb-3">Channel Performance Comparison</p>
            <div className="space-y-3">
              {CHANNEL_DATA.map(ch => (
                <div key={ch.channel} className="border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-text-primary">{ch.channel}</span>
                    <span className="text-xs text-text-muted">{ch.sent} sent</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <MetricBar label="Open Rate" value={ch.openRate} />
                    <MetricBar label="Response" value={ch.responseRate} />
                    <MetricBar label="Click" value={ch.clickRate} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div>
            <p className="text-xs text-text-muted mb-3">14-Day Outreach Trends</p>
            <div className="flex items-end gap-1 h-40 border-b border-border pb-2">
              {TREND_DATA.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end h-32">
                    <div className="flex-1 bg-accent/40" style={{ height: `${(d.sent / maxTrend) * 100}%` }} title={`Sent: ${d.sent}`} />
                    <div className="flex-1 bg-accent" style={{ height: `${(d.opened / maxTrend) * 100}%` }} title={`Opened: ${d.opened}`} />
                    <div className="flex-1 bg-accent/60" style={{ height: `${(d.responded / maxTrend) * 100}%` }} title={`Responded: ${d.responded}`} />
                  </div>
                  <span className="text-xs text-text-muted">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent/40" /> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent" /> Opened</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent/60" /> Responded</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="border border-border p-3">
      <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xl font-serif font-semibold text-text-primary">{value}</div>
      {trend && (
        <div className="text-xs text-green-600 mt-1">{trend}</div>
      )}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-primary font-medium">{value}%</span>
      </div>
      <div className="w-full h-2 bg-bg-tertiary">
        <div className="h-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}