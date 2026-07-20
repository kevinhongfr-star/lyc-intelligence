/**
 * Signal Council Monthly Briefing — Issue #23
 *
 * Automated monthly intelligence briefing for council members.
 * Aggregates: market trends, executive movements, sector insights, and recommendations.
 */
import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Lightbulb,
  Target,
  Clock,
  Download,
  Share2,
  Bell,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';

export function SignalCouncilBriefingPage() {
  const [period] = useState('2026-07');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[13px] text-white/60 mb-2">
            <Bell className="h-4 w-4" />
            Signal Council
          </div>
          <h1 className="text-[32px] font-serif">Monthly Intelligence Briefing</h1>
          <p className="text-[14px] text-white/60 mt-2">
            {new Date(period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <BriefingMetric icon={<Users className="h-4 w-4" />} label="Executive Moves" value="127" trend="+12%" />
            <BriefingMetric icon={<Building2 className="h-4 w-4" />} label="M&A Activity" value="23" trend="+8%" />
            <BriefingMetric icon={<TrendingUp className="h-4 w-4" />} label="Market Sentiment" value="72" trend="+5" />
            <BriefingMetric icon={<Target className="h-4 w-4" />} label="Open Mandates" value="48" trend="-3%" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Executive Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Executive Summary</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-4">
              This month saw continued strong activity in the technology and healthcare sectors, with notable executive
              movements in AI/ML leadership roles. M&A activity increased 8% month-over-month, driven primarily by
              strategic acquisitions in fintech and digital health. Market sentiment remains cautiously optimistic despite
              macroeconomic uncertainties.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <KeyInsight
                icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                title="AI Leadership Surge"
                desc="34% increase in C-suite AI/ML roles created"
              />
              <KeyInsight
                icon={<Building2 className="h-5 w-5 text-blue-600" />}
                title="Fintech Consolidation"
                desc="Major M&A activity in payments and lending"
              />
              <KeyInsight
                icon={<MapPin className="h-5 w-5 text-amber-600" />}
                title="Regional Shift"
                desc="Increasing demand in SEA and Middle East markets"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sector Analysis */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sector Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SECTOR_DATA.map((sector) => (
                  <SectorRow key={sector.name} sector={sector} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Hotspots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {REGION_DATA.map((region) => (
                  <RegionRow key={region.name} region={region} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive Movements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notable Executive Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOVEMENTS.map((m, i) => (
                <MovementRow key={i} movement={m} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle>Strategic Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Recommendation
                priority="high"
                title="Expand AI/ML Executive Pipeline"
                desc="Strong demand for AI leadership roles. Recommend building dedicated AI executive talent pool."
              />
              <Recommendation
                priority="medium"
                title="Strengthen SEA Network"
                desc="Growing opportunity in Southeast Asia. Consider partnerships with regional executive networks."
              />
              <Recommendation
                priority="medium"
                title="Monitor Fintech Consolidation"
                desc="M&A activity may create both placement opportunities and leadership voids to fill."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Sub-components */

function BriefingMetric({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  const isPositive = !trend.startsWith('-');
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
      <div className="flex items-center gap-2 text-white/60 text-[11px] uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className="text-[24px] font-serif text-white">{value}</div>
      <div className={`flex items-center gap-1 text-[12px] ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {trend}
      </div>
    </div>
  );
}

function KeyInsight({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-lg">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h4 className="text-[14px] font-medium text-[#1A1A1A]">{title}</h4>
        <p className="text-[12px] text-[#6B6B6B] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function SectorRow({ sector }: { sector: { name: string; activity: number; change: number } }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#F0F0F0] flex items-center justify-center text-[12px] font-medium text-[#6B6B6B]">
          {sector.activity}
        </div>
        <span className="text-[13px] text-[#1A1A1A]">{sector.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[12px] ${sector.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {sector.change >= 0 ? '+' : ''}{sector.change}%
        </span>
        <div className="w-16 h-1.5 bg-[#E5E5E5] rounded-full">
          <div
            className="h-full bg-[#1A1A1A] rounded-full"
            style={{ width: `${Math.min(100, sector.activity * 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RegionRow({ region }: { region: { name: string; count: number; trend: string } }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#9B9B9B]" />
        <span className="text-[13px] text-[#1A1A1A]">{region.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium text-[#1A1A1A]">{region.count}</span>
        <Badge variant={region.trend.startsWith('+') ? 'success' : 'default'}>{region.trend}</Badge>
      </div>
    </div>
  );
}

function MovementRow({ movement }: { movement: { exec: string; prevRole: string; newRole: string; company: string } }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-[#FAFAFA] rounded-lg">
      <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center flex-shrink-0">
        <Users className="h-5 w-5 text-[#9B9B9B]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#1A1A1A]">{movement.exec}</p>
        <p className="text-[12px] text-[#6B6B6B]">
          {movement.prevRole} → <span className="font-medium text-[#1A1A1A]">{movement.newRole}</span>
        </p>
      </div>
      <div className="text-[12px] text-[#9B9B9B]">{movement.company}</div>
    </div>
  );
}

function Recommendation({ priority, title, desc }: { priority: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <Badge variant={priority === 'high' ? 'default' : 'outline'} className="mt-0.5">
        {priority}
      </Badge>
      <div>
        <h4 className="text-[14px] font-medium text-[#1A1A1A]">{title}</h4>
        <p className="text-[13px] text-[#6B6B6B] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* Mock data */

const SECTOR_DATA = [
  { name: 'Technology / SaaS', activity: 42, change: 15 },
  { name: 'Healthcare & Life Sciences', activity: 31, change: 8 },
  { name: 'Financial Services', activity: 28, change: -3 },
  { name: 'Consumer & Retail', activity: 18, change: 5 },
  { name: 'Industrial & Manufacturing', activity: 12, change: -2 },
];

const REGION_DATA = [
  { name: 'Greater China', count: 48, trend: '+12%' },
  { name: 'Southeast Asia', count: 32, trend: '+24%' },
  { name: 'North America', count: 27, trend: '-5%' },
  { name: 'Europe', count: 15, trend: '+3%' },
  { name: 'Middle East', count: 12, trend: '+18%' },
];

const MOVEMENTS = [
  { exec: 'Sarah Chen', prevRole: 'VP Engineering', newRole: 'CTO', company: 'TechCorp' },
  { exec: 'Michael Zhang', prevRole: 'CFO', newRole: 'CEO', company: 'FinTech Global' },
  { exec: 'Emily Wang', prevRole: 'Director', newRole: 'VP Product', company: 'HealthTech Inc' },
  { exec: 'James Liu', prevRole: 'SVP Sales', newRole: 'CRO', company: 'SaaS Leader' },
];