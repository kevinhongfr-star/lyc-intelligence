import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const MANDATES = [
  {
    id: '1',
    title: 'VP Engineering',
    company: 'TechCorp',
    company_size: '500-1000',
    industry: 'Technology',
    consultant: 'Alex Wang',
    stage: 'interview',
    stageLabel: 'Interview Stage',
    status: 'active',
    sla_status: 'at_risk',
    fee: 180000,
    days_open: 45,
    candidate_count: 12,
    shortlisted: 5,
    next_milestone: 'Client interviews',
    next_due: 3,
    priority: 'high',
  },
  {
    id: '2',
    title: 'CFO',
    company: 'FinanceCo',
    company_size: '1000+',
    industry: 'Financial Services',
    consultant: 'Sarah Li',
    stage: 'offer',
    stageLabel: 'Offer Stage',
    status: 'active',
    sla_status: 'on_track',
    fee: 200000,
    days_open: 60,
    candidate_count: 8,
    shortlisted: 3,
    next_milestone: 'Offer negotiation',
    next_due: 7,
    priority: 'high',
  },
  {
    id: '3',
    title: 'Chief Digital Officer',
    company: 'Retail Group',
    company_size: '1000+',
    industry: 'Retail',
    consultant: 'Mike Chen',
    stage: 'shortlist',
    stageLabel: 'Shortlisting',
    status: 'active',
    sla_status: 'breached',
    fee: 150000,
    days_open: 75,
    candidate_count: 15,
    shortlisted: 4,
    next_milestone: 'Shortlist review',
    next_due: -2,
    priority: 'medium',
  },
  {
    id: '4',
    title: 'COO',
    company: 'HealthTech',
    company_size: '200-500',
    industry: 'Healthcare',
    consultant: 'Emily Zhang',
    stage: 'sourcing',
    stageLabel: 'Sourcing',
    status: 'active',
    sla_status: 'on_track',
    fee: 160000,
    days_open: 20,
    candidate_count: 20,
    shortlisted: 0,
    next_milestone: 'First shortlist',
    next_due: 10,
    priority: 'medium',
  },
  {
    id: '5',
    title: 'Head of Product',
    company: 'ScaleUp',
    company_size: '50-200',
    industry: 'Technology',
    consultant: 'Alex Wang',
    stage: 'closed_won',
    stageLabel: 'Placed',
    status: 'closed',
    sla_status: 'on_track',
    fee: 140000,
    days_open: 52,
    candidate_count: 18,
    shortlisted: 6,
    next_milestone: '—',
    next_due: null,
    priority: 'low',
  },
  {
    id: '6',
    title: 'VP Sales',
    company: 'SaaS Co',
    company_size: '200-500',
    industry: 'Technology',
    consultant: 'Sarah Li',
    stage: 'sourcing',
    stageLabel: 'Sourcing',
    status: 'active',
    sla_status: 'on_track',
    fee: 130000,
    days_open: 15,
    candidate_count: 25,
    shortlisted: 0,
    next_milestone: 'First shortlist',
    next_due: 12,
    priority: 'medium',
  },
];

const STAGES = ['all', 'sourcing', 'shortlist', 'interview', 'offer', 'closed_won'];
const SLA_FILTERS = ['all', 'on_track', 'at_risk', 'breached'];

export function TL_MandatePortfolio() {
  const [stageFilter, setStageFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [consultantFilter, setConsultantFilter] = useState('all');

  const consultants = [...new Set(MANDATES.map((m) => m.consultant))];

  const filtered = MANDATES.filter((m) => {
    const matchesStage = stageFilter === 'all' || m.stage === stageFilter;
    const matchesSLA = slaFilter === 'all' || m.sla_status === slaFilter;
    const matchesConsultant = consultantFilter === 'all' || m.consultant === consultantFilter;
    const matchesSearch = !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSLA && matchesConsultant && matchesSearch;
  });

  const stats = {
    total: MANDATES.length,
    active: MANDATES.filter((m) => m.status === 'active').length,
    atRisk: MANDATES.filter((m) => m.sla_status === 'at_risk').length,
    breached: MANDATES.filter((m) => m.sla_status === 'breached').length,
    onTrack: MANDATES.filter((m) => m.sla_status === 'on_track' && m.status === 'active').length,
    totalFee: MANDATES.filter((m) => m.status === 'active').reduce((sum, m) => sum + m.fee, 0),
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const getSlaBadge = (status: string) => {
    switch (status) {
      case 'on_track': return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" /> On Track
        </Badge>
      );
      case 'at_risk': return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3 mr-1" /> At Risk
        </Badge>
      );
      case 'breached': return (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          <AlertTriangle className="w-3 h-3 mr-1" /> Breached
        </Badge>
      );
      default: return null;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'sourcing': return 'bg-blue-100 text-blue-700';
      case 'shortlist': return 'bg-purple-100 text-purple-700';
      case 'interview': return 'bg-amber-100 text-amber-700';
      case 'offer': return 'bg-green-100 text-green-700';
      case 'closed_won': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">All Mandates</h1>
          <p className="text-text-muted">{stats.total} total · {stats.active} active</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Active Mandates</span>
              <Briefcase className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold text-text-primary">{stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">On Track</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-600">{stats.onTrack}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">At Risk</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-amber-600">{stats.atRisk}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Pipeline Fee</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(stats.totalFee)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search mandates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={consultantFilter}
          onChange={(e) => setConsultantFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          <option value="all">All Consultants</option>
          {consultants.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5">
          {SLA_FILTERS.map((sla) => (
            <button
              key={sla}
              onClick={() => setSlaFilter(sla)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors min-h-[36px] ${
                slaFilter === sla
                  ? 'bg-bg-secondary text-text-primary font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {sla === 'all' ? 'All SLA' : sla.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5 mx-4 mt-4 w-fit">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors min-h-[32px] ${
              stageFilter === stage
                ? 'bg-bg-secondary text-text-primary font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {stage === 'all' ? 'All' : stage === 'closed_won' ? 'Won' : stage}
          </button>
        ))}
        </div>
        <CardContent className="p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No mandates matching your filters</p>
            </div>
          ) : (
            filtered.map((m) => (
              <Link key={m.id} to={`/team/mandates/${m.id}`}>
                <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">{m.title}</p>
                        <Badge variant="secondary" className={getStageColor(m.stage)}>
                          {m.stageLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted">
                        {m.company} · {m.industry} · {m.consultant}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-center">
                      <p className="text-xs text-text-muted">Fee</p>
                      <p className="font-medium text-text-primary">{formatCurrency(m.fee)}</p>
                    </div>
                    <div className="hidden sm:block text-center">
                      <p className="text-xs text-text-muted">Days Open</p>
                      <p className="font-medium text-text-primary">{m.days_open}</p>
                    </div>
                    {getSlaBadge(m.sla_status)}
                    {m.next_due !== null && (
                      <div className="hidden md:flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span className={m.next_due < 0 ? 'text-red-600' : 'text-text-muted'}>
                          {m.next_due < 0 ? `${Math.abs(m.next_due)}d overdue` : `${m.next_due}d left`}
                        </span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
