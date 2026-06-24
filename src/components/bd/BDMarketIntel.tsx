import React, { useState } from 'react';
import {
  Globe,
  TrendingUp,
  Building2,
  BarChart3,
  Search,
  ChevronRight,
  Sparkles,
  Briefcase,
  Users,
  DollarSign,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const INDUSTRIES = [
  { name: 'Technology & SaaS', growth: 23, trend: 'up', roles: 'VP Engineering, CTO, CPO', salary: '$180K-$300K' },
  { name: 'Financial Services', growth: 15, trend: 'up', roles: 'MD, Head of Tech, CIO', salary: '$200K-$350K' },
  { name: 'Consumer & Retail', growth: 8, trend: 'stable', roles: 'CDO, CMO, VP Supply Chain', salary: '$150K-$250K' },
  { name: 'Healthcare & Life Sciences', growth: 18, trend: 'up', roles: 'CEO, COO, CTO', salary: '$220K-$400K' },
  { name: 'Industrial & Manufacturing', growth: -3, trend: 'down', roles: 'VP Ops, Plant GM, CFO', salary: '$140K-$220K' },
];

const COMPANY_RANKINGS = [
  { rank: 1, name: 'ByteDance', industry: 'Technology', hires: 42, growth: 'Very High' },
  { rank: 2, name: 'SHEIN', industry: 'E-commerce', hires: 38, growth: 'Very High' },
  { rank: 3, name: 'TikTok', industry: 'Social Media', hires: 35, growth: 'High' },
  { rank: 4, name: 'Ant Group', industry: 'FinTech', hires: 28, growth: 'High' },
  { rank: 5, name: 'Nio', industry: 'Automotive', hires: 22, growth: 'Moderate' },
  { rank: 6, name: 'JD.com', industry: 'E-commerce', hires: 20, growth: 'Moderate' },
  { rank: 7, name: 'Meituan', industry: 'Services', hires: 18, growth: 'Moderate' },
  { rank: 8, name: 'Geely', industry: 'Automotive', hires: 15, growth: 'Stable' },
];

const TALENT_TRENDS = [
  { title: 'AI Leadership Demand Exploding', detail: '87% of tech companies seeking AI/ML leadership roles in 2024', impact: 'High' },
  { title: 'Remote-First Leadership', detail: '62% of cross-border roles offer hybrid or remote arrangements', impact: 'Medium' },
  { title: 'Compensation Up 15% YoY', detail: 'Executive compensation in tech sees strongest growth since 2021', impact: 'High' },
  { title: 'Talent Migration to Singapore', detail: 'Shanghai-based leaders increasingly open to SG relocation', impact: 'Medium' },
];

export function BDMarketIntel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('industries');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Market Intel</h1>
          <p className="text-text-muted">Industry trends, company rankings, and talent landscape insights</p>
        </div>
        <Button>
          <Sparkles className="w-4 h-4 mr-2" />
          Ask Nexus BD
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search companies, industries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5">
          {['industries', 'companies', 'talent'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors min-h-[36px] ${
                activeTab === tab
                  ? 'bg-bg-secondary text-text-primary font-medium'
                  : 'text-text-muted'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'industries' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {INDUSTRIES.map((ind) => (
              <Card key={ind.name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary">{ind.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">Key roles: {ind.roles}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {ind.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        {ind.trend === 'down' && (
                          <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                        )}
                        {ind.trend === 'stable' && (
                          <BarChart3 className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`font-bold ${
                          ind.trend === 'up' ? 'text-green-600' :
                          ind.trend === 'down' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                          {ind.growth > 0 ? '+' : ''}{ind.growth}%
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">YoY growth</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs text-text-secondary">{ind.salary}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs text-text-secondary">4 key roles</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-accent/5 to-purple-50 border-accent/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-medium text-text-primary">Hot Industries Right Now</h3>
                </div>
                <div className="space-y-2">
                  {['AI/ML Platforms', 'Semiconductor', 'Renewable Energy', 'HealthTech', 'Cross-Border E-commerce'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">#{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary">{item}</span>
                      <TrendingUp className="w-3 h-3 text-green-500 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Regional Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { region: 'Shanghai', pct: 45, color: 'bg-accent' },
                  { region: 'Beijing', pct: 25, color: 'bg-blue-500' },
                  { region: 'Singapore', pct: 20, color: 'bg-green-500' },
                  { region: 'Hong Kong', pct: 10, color: 'bg-purple-500' },
                ].map((r) => (
                  <div key={r.region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{r.region}</span>
                      <span className="text-text-muted">{r.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-tertiary rounded-full">
                      <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              Top Hiring Companies — China/APAC
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-12">Rank</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Leadership Hires (12mo)</th>
                  <th className="px-4 py-3">Growth</th>
                </tr>
              </thead>
              <tbody>
                {COMPANY_RANKINGS.map((c) => (
                  <tr key={c.rank} className="border-b border-border hover:bg-bg-tertiary">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        c.rank <= 3 ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'
                      }`}>
                        {c.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.industry}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-text-muted" />
                        {c.hires} hires
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={
                          c.growth === 'Very High' ? 'bg-green-100 text-green-700' :
                          c.growth === 'High' ? 'bg-blue-100 text-blue-700' :
                          c.growth === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {c.growth}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'talent' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TALENT_TRENDS.map((trend, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      trend.impact === 'High' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }
                  >
                    {trend.impact} Impact
                  </Badge>
                </div>
                <h3 className="font-medium text-text-primary mb-1">{trend.title}</h3>
                <p className="text-sm text-text-secondary">{trend.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
