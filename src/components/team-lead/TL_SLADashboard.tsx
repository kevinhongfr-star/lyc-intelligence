import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Briefcase,
  User,
  Calendar,
  TrendingDown,
  TrendingUp,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const SLA_MANDATES = [
  {
    id: '1',
    title: 'Chief Digital Officer',
    company: 'Retail Group',
    consultant: 'Mike Chen',
    sla_status: 'breached',
    breached_milestone: 'Shortlist due',
    breached_by: 2,
    shortlist_due: '2024-06-22',
    fill_due: '2024-08-15',
    fee: 150000,
    waiver_requested: true,
    waiver_status: 'pending',
  },
  {
    id: '2',
    title: 'VP Engineering',
    company: 'TechCorp',
    consultant: 'Alex Wang',
    sla_status: 'at_risk',
    next_milestone: 'Client interviews',
    days_until: 3,
    shortlist_due: '2024-06-20',
    fill_due: '2024-08-10',
    fee: 180000,
  },
  {
    id: '3',
    title: 'COO',
    company: 'HealthTech',
    consultant: 'Emily Zhang',
    sla_status: 'on_track',
    next_milestone: 'First shortlist',
    days_until: 10,
    shortlist_due: '2024-07-04',
    fill_due: '2024-09-01',
    fee: 160000,
  },
  {
    id: '4',
    title: 'CFO',
    company: 'FinanceCo',
    consultant: 'Sarah Li',
    sla_status: 'on_track',
    next_milestone: 'Offer close',
    days_until: 7,
    shortlist_due: '2024-05-15',
    fill_due: '2024-07-20',
    fee: 200000,
  },
  {
    id: '5',
    title: 'VP Sales',
    company: 'SaaS Co',
    consultant: 'Sarah Li',
    sla_status: 'on_track',
    next_milestone: 'First shortlist',
    days_until: 12,
    shortlist_due: '2024-07-06',
    fill_due: '2024-09-15',
    fee: 130000,
  },
];

const FILTERS = ['all', 'breached', 'at_risk', 'on_track'];

export function TL_SLADashboard() {
  const [filter, setFilter] = useState('all');

  const filtered = SLA_MANDATES.filter((m) => filter === 'all' || m.sla_status === filter);

  const stats = {
    total: SLA_MANDATES.length,
    onTrack: SLA_MANDATES.filter((m) => m.sla_status === 'on_track').length,
    atRisk: SLA_MANDATES.filter((m) => m.sla_status === 'at_risk').length,
    breached: SLA_MANDATES.filter((m) => m.sla_status === 'breached').length,
    complianceRate: Math.round(
      (SLA_MANDATES.filter((m) => m.sla_status === 'on_track').length / SLA_MANDATES.length) * 100
    ),
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const getStatusBadge = (status: string) => {
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
          <AlertCircle className="w-3 h-3 mr-1" /> Breached
        </Badge>
      );
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">SLA Monitor</h1>
          <p className="text-text-muted">{stats.total} mandates tracked</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">SLA Compliance</span>
              <Target className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-text-primary">{stats.complianceRate}%</p>
              {stats.complianceRate >= 90 ? (
                <span className="text-xs text-green-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Good
                </span>
              ) : (
                <span className="text-xs text-red-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> Needs work
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">On Track</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.onTrack}</p>
            <p className="text-xs text-text-muted mt-1">
              {Math.round((stats.onTrack / stats.total) * 100)}% of mandates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">At Risk</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.atRisk}</p>
            <p className="text-xs text-text-muted mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Breached</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.breached}</p>
            <p className="text-xs text-text-muted mt-1">Past deadline</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex bg-bg-tertiary rounded-lg p-0.5 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-md capitalize transition-colors ${
              filter === f
                ? 'bg-bg-secondary text-text-primary font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {f === 'all' ? 'All Mandates' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-text-muted">No mandates in this category</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((m) => (
            <Link key={m.id} to={`/team/mandates/${m.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        m.sla_status === 'breached' ? 'bg-red-500/10' :
                        m.sla_status === 'at_risk' ? 'bg-amber-500/10' :
                        'bg-green-500/10'
                      }`}>
                        <Clock className={`w-5 h-5 ${
                          m.sla_status === 'breached' ? 'text-red-500' :
                          m.sla_status === 'at_risk' ? 'text-amber-500' :
                          'text-green-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-text-primary">{m.title}</h3>
                          {getStatusBadge(m.sla_status)}
                        </div>
                        <p className="text-sm text-text-muted">{m.company} · {m.consultant}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary">{formatCurrency(m.fee)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                    {m.sla_status === 'breached' ? (
                      <>
                        <div>
                          <p className="text-xs text-text-muted">Breached Milestone</p>
                          <p className="text-sm font-medium text-red-600">{m.breached_milestone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Breached By</p>
                          <p className="text-sm font-medium text-red-600">{m.breached_by} days ago</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Waiver Request</p>
                          {m.waiver_requested ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              {m.waiver_status}
                            </Badge>
                          ) : (
                            <span className="text-sm text-text-muted">None</span>
                          )}
                        </div>
                        <div className="text-right">
                          <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); }}>
                            Review
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-text-muted">Next Milestone</p>
                          <p className="text-sm font-medium text-text-primary">{m.next_milestone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Days Left</p>
                          <p className={`text-sm font-medium ${
                            m.days_until <= 3 ? 'text-amber-600' : 'text-text-primary'
                          }`}>
                            {m.days_until} days
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Fill Due</p>
                          <p className="text-sm font-medium text-text-primary">{m.fill_due}</p>
                        </div>
                        <div className="text-right">
                          <ChevronRight className="w-4 h-4 text-text-muted inline" />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
