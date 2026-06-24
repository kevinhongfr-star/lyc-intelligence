import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Target,
  FileText,
  Filter,
  Search,
  ChevronRight,
  AlertCircle,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const TYPES = ['all', 'success_profile', 'offer_terms', 'sla_waiver', 'fee_adjustment'];
const STATUSES = ['pending', 'approved', 'rejected', 'all'];

const MOCK_APPROVALS = [
  {
    id: '1',
    type: 'success_profile',
    title: 'Shortlist Review - VP Engineering',
    mandate: 'TechCorp VP Engineering',
    requester: 'Alex Wang',
    requester_avatar: null,
    status: 'pending',
    age: '4 hours',
    requested_at: '2024-06-24T08:00:00Z',
    summary: '5 candidates shortlisted for VP Eng role. Requesting partner review before client submission.',
    candidate_count: 5,
  },
  {
    id: '2',
    type: 'offer_terms',
    title: 'Offer Terms - CFO Role',
    mandate: 'FinanceCo CFO',
    requester: 'Sarah Li',
    requester_avatar: null,
    status: 'pending',
    age: '8 hours',
    requested_at: '2024-06-24T04:00:00Z',
    summary: 'Proposed 30% fee structure for CFO placement. Needs partner sign-off.',
    proposed_fee: '$180,000',
  },
  {
    id: '3',
    type: 'sla_waiver',
    title: 'SLA Extension - CDO Search',
    mandate: 'Retail Group CDO',
    requester: 'Mike Chen',
    requester_avatar: null,
    status: 'pending',
    age: '1 day',
    requested_at: '2024-06-23T10:00:00Z',
    summary: 'Requesting 2-week SLA extension due to client hiring freeze.',
    extension: '+14 days',
  },
  {
    id: '4',
    type: 'fee_adjustment',
    title: 'Fee Adjustment - COO Role',
    mandate: 'HealthTech COO',
    requester: 'Emily Zhang',
    requester_avatar: null,
    status: 'approved',
    age: '2 days',
    requested_at: '2024-06-22T09:00:00Z',
    reviewed_at: '2024-06-23T11:00:00Z',
    reviewer: 'Partner (you)',
    summary: 'Fee reduced from 30% to 25% for strategic client relationship.',
  },
  {
    id: '5',
    type: 'success_profile',
    title: 'Shortlist - Head of Product',
    mandate: 'ScaleUp Head of Product',
    requester: 'Alex Wang',
    requester_avatar: null,
    status: 'approved',
    age: '3 days',
    requested_at: '2024-06-21T14:00:00Z',
    reviewed_at: '2024-06-22T09:00:00Z',
    reviewer: 'Partner (you)',
    candidate_count: 4,
  },
];

export function TL_Approvals() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_APPROVALS.filter((a) => {
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch = !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.mandate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const pendingCount = MOCK_APPROVALS.filter((a) => a.status === 'pending').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success_profile': return <FileText className="w-4 h-4" />;
      case 'offer_terms': return <DollarSign className="w-4 h-4" />;
      case 'sla_waiver': return <Clock className="w-4 h-4" />;
      case 'fee_adjustment': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success_profile': return 'text-blue-500 bg-blue-500/10';
      case 'offer_terms': return 'text-green-500 bg-green-500/10';
      case 'sla_waiver': return 'text-amber-500 bg-amber-500/10';
      case 'fee_adjustment': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success_profile': return 'Shortlist Review';
      case 'offer_terms': return 'Offer Terms';
      case 'sla_waiver': return 'SLA Waiver';
      case 'fee_adjustment': return 'Fee Adjustment';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Approvals</h1>
          <p className="text-text-muted">
            {pendingCount} pending · {MOCK_APPROVALS.length} total
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors min-h-[36px] ${
                statusFilter === status
                  ? 'bg-bg-secondary text-text-primary font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {status === 'all' ? 'All' : status}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-accent text-white text-[10px] rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Types' : getTypeLabel(t)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-text-muted">No approvals matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((approval) => (
            <Link key={approval.id} to={`/team/approvals/${approval.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(approval.type)}`}>
                        {getTypeIcon(approval.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-text-primary">{approval.title}</h3>
                          <Badge variant="secondary" className={getStatusColor(approval.status)}>
                            {approval.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted mt-0.5">{approval.mandate}</p>
                        <p className="text-sm text-text-secondary mt-2 max-w-xl">{approval.summary}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-xs text-text-muted flex items-center gap-1 justify-end">
                          <User className="w-3 h-3" />
                          {approval.requester}
                        </p>
                        <p className="text-xs text-text-muted mt-1">{approval.age} ago</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
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
