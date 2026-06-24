import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Filter,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

const MOCK_CLIENTS = [
  {
    id: '1',
    name: 'TechCorp',
    industry: 'Technology',
    location: 'Shanghai',
    mandates_won: 3,
    mandates_total: 5,
    last_contact: '2024-06-20',
    total_revenue: 450000,
    nps: 9,
    active_opportunities: 1,
    contact_count: 4,
  },
  {
    id: '2',
    name: 'FinanceCo',
    industry: 'Financial Services',
    location: 'Singapore',
    mandates_won: 2,
    mandates_total: 3,
    last_contact: '2024-06-18',
    total_revenue: 320000,
    nps: 8,
    active_opportunities: 1,
    contact_count: 3,
  },
  {
    id: '3',
    name: 'ScaleUp Inc',
    industry: 'Technology',
    location: 'Beijing',
    mandates_won: 1,
    mandates_total: 1,
    last_contact: '2024-06-15',
    total_revenue: 120000,
    nps: 10,
    active_opportunities: 1,
    contact_count: 2,
  },
  {
    id: '4',
    name: 'Retail Group',
    industry: 'Consumer',
    location: 'Shanghai',
    mandates_won: 0,
    mandates_total: 2,
    last_contact: '2024-06-10',
    total_revenue: 0,
    nps: 0,
    active_opportunities: 1,
    contact_count: 2,
  },
  {
    id: '5',
    name: 'HealthTech Co',
    industry: 'Healthcare',
    location: 'Singapore',
    mandates_won: 2,
    mandates_total: 2,
    last_contact: '2024-05-28',
    total_revenue: 280000,
    nps: 9,
    active_opportunities: 0,
    contact_count: 3,
  },
  {
    id: '6',
    name: 'Industrial Giant',
    industry: 'Manufacturing',
    location: 'Shenzhen',
    mandates_won: 1,
    mandates_total: 1,
    last_contact: '2024-05-20',
    total_revenue: 160000,
    nps: 7,
    active_opportunities: 0,
    contact_count: 1,
  },
];

export function ClientRelationships() {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const industries = Array.from(new Set(MOCK_CLIENTS.map((c) => c.industry)));

  const filtered = MOCK_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!industryFilter || c.industry === industryFilter)
  );

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const totalRevenue = MOCK_CLIENTS.reduce((sum, c) => sum + c.total_revenue, 0);
  const winRate = MOCK_CLIENTS.length > 0
    ? Math.round((MOCK_CLIENTS.filter((c) => c.mandates_won > 0).length / MOCK_CLIENTS.length) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Clients</h1>
          <p className="text-text-muted">{MOCK_CLIENTS.length} client relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Clients</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{MOCK_CLIENTS.length}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Active Deals</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {MOCK_CLIENTS.filter((c) => c.active_opportunities > 0).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Revenue</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Avg NPS</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {Math.round(MOCK_CLIENTS.reduce((sum, c) => sum + c.nps, 0) / MOCK_CLIENTS.filter((c) => c.nps > 0).length)}/10
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
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
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <Link key={client.id} to={`/bd/clients/${client.id}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{client.name}</h3>
                      <p className="text-xs text-text-muted">{client.industry} · {client.location}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  <div>
                    <p className="text-lg font-semibold text-text-primary">{client.mandates_won}</p>
                    <p className="text-[10px] text-text-muted">Won</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatCurrency(client.total_revenue)}
                    </p>
                    <p className="text-[10px] text-text-muted">Revenue</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      {client.active_opportunities > 0 ? (
                        <Badge variant="secondary" className="bg-accent/10 text-accent text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </p>
                    <p className="text-[10px] text-text-muted">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
