import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Star,
  TrendingUp,
  Briefcase,
  DollarSign,
  ChevronRight,
  Users,
  Activity,
  Award,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

const CLIENTS = [
  {
    id: '1',
    name: 'TechCorp',
    industry: 'Technology',
    size: '500-1000',
    logo: null,
    wonMandates: 5,
    totalRevenue: 820000,
    avgFee: 164000,
    nps: 9.5,
    activeOpportunities: 2,
    activeMandates: 1,
    lastEngagement: '2024-06-15',
    tier: 'enterprise',
    consultant: 'Alex Wang',
    primaryContact: 'CEO - David Chen',
    growthSignal: 'expanding APAC team',
  },
  {
    id: '2',
    name: 'FinanceCo',
    industry: 'Financial Services',
    size: '1000+',
    logo: null,
    wonMandates: 3,
    totalRevenue: 600000,
    avgFee: 200000,
    nps: 9.0,
    activeOpportunities: 1,
    activeMandates: 1,
    lastEngagement: '2024-06-10',
    tier: 'enterprise',
    consultant: 'Sarah Li',
    primaryContact: 'CHRO - Lisa Wang',
    growthSignal: 'new fintech division',
  },
  {
    id: '3',
    name: 'HealthTech',
    industry: 'Healthcare',
    size: '200-500',
    logo: null,
    wonMandates: 2,
    totalRevenue: 310000,
    avgFee: 155000,
    nps: 9.3,
    activeOpportunities: 1,
    activeMandates: 1,
    lastEngagement: '2024-06-05',
    tier: 'growth',
    consultant: 'Emily Zhang',
    primaryContact: 'Founder - Dr. Li',
    growthSignal: 'Series C funding',
  },
  {
    id: '4',
    name: 'Retail Group',
    industry: 'Retail',
    size: '1000+',
    logo: null,
    wonMandates: 4,
    totalRevenue: 520000,
    avgFee: 130000,
    nps: 8.2,
    activeOpportunities: 2,
    activeMandates: 1,
    lastEngagement: '2024-05-28',
    tier: 'enterprise',
    consultant: 'Mike Chen',
    primaryContact: 'HR VP - Tom Wu',
    growthSignal: 'digital transformation',
  },
  {
    id: '5',
    name: 'ScaleUp',
    industry: 'Technology',
    size: '50-200',
    logo: null,
    wonMandates: 3,
    totalRevenue: 390000,
    avgFee: 130000,
    nps: 8.8,
    activeOpportunities: 1,
    activeMandates: 0,
    lastEngagement: '2024-06-01',
    tier: 'growth',
    consultant: 'Alex Wang',
    primaryContact: 'CEO - Jenny Liu',
    growthSignal: 'Series B expansion',
  },
  {
    id: '6',
    name: 'BioTech',
    industry: 'Biotech',
    size: '200-500',
    logo: null,
    wonMandates: 1,
    totalRevenue: 140000,
    avgFee: 140000,
    nps: 8.5,
    activeOpportunities: 2,
    activeMandates: 0,
    lastEngagement: '2024-05-15',
    tier: 'emerging',
    consultant: 'Sarah Li',
    primaryContact: 'COO - Mark Zhang',
    growthSignal: 'pipeline expansion',
  },
];

const INDUSTRIES = ['all', 'Technology', 'Financial Services', 'Healthcare', 'Retail', 'Biotech'];
const TIERS = ['all', 'enterprise', 'growth', 'emerging'];

export function TL_ClientOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const filtered = CLIENTS.filter((c) => {
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchesSearch && matchesIndustry && matchesTier;
  });

  const stats = {
    totalClients: CLIENTS.length,
    totalRevenue: CLIENTS.reduce((sum, c) => sum + c.totalRevenue, 0),
    avgNps: (CLIENTS.reduce((sum, c) => sum + c.nps, 0) / CLIENTS.length).toFixed(1),
    totalMandates: CLIENTS.reduce((sum, c) => sum + c.wonMandates, 0),
    activeOpportunities: CLIENTS.reduce((sum, c) => sum + c.activeOpportunities, 0),
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise': return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          <Award className="w-3 h-3 mr-1" />
          Enterprise
        </Badge>
      );
      case 'growth': return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          <TrendingUp className="w-3 h-3 mr-1" />
          Growth
        </Badge>
      );
      case 'emerging': return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Emerging
        </Badge>
      );
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Client Overview</h1>
          <p className="text-text-muted">{stats.totalClients} clients · {stats.totalMandates} placements</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-text-muted mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Active Opportunities</span>
              <Briefcase className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold text-text-primary">{stats.activeOpportunities}</p>
            <p className="text-xs text-text-muted mt-1">In pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Avg NPS</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{stats.avgNps}</p>
            <p className="text-xs text-text-muted mt-1">Client satisfaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Total Placements</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{stats.totalMandates}</p>
            <p className="text-xs text-text-muted mt-1">Successful placements</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>{i === 'all' ? 'All Industries' : i}</option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{client.name}</h3>
                    <p className="text-xs text-text-muted">{client.industry} · {client.size}</p>
                  </div>
                </div>
                {getTierBadge(client.tier)}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-muted">Revenue</p>
                  <p className="font-semibold text-text-primary text-sm">{formatCurrency(client.totalRevenue)}</p>
                </div>
                <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-muted">NPS</p>
                  <p className="font-semibold text-text-primary text-sm">{client.nps}</p>
                </div>
                <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-muted">Won</p>
                  <p className="font-semibold text-text-primary text-sm">{client.wonMandates}</p>
                </div>
              </div>

              {client.growthSignal && (
                <div className="p-2 bg-green-50 rounded-lg mb-3">
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Growth signal: {client.growthSignal}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-xs text-text-muted">
                  <p>Consultant: {client.consultant}</p>
                  <p>Last: {client.lastEngagement}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No clients matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
