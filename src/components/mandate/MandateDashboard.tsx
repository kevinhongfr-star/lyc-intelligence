import React, { useState, useEffect } from 'react';
import {
  Building2, Users, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle,
  ArrowRight, RefreshCw, ChevronRight, Calendar, Target, BarChart3,
  MessageSquare, Briefcase, Eye, Send, Filter
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';

interface Mandate {
  id: string;
  title: string;
  client?: { id: string; name: string };
  status: string;
  phase: string;
  phase_entered_at: string;
  days_in_phase?: number;
  lead_consultant?: { id: string; name: string };
  executive_sponsor?: { id: string; name: string };
  fee_amount?: number;
  fee_currency?: string;
  target_close_date?: string;
  created_at: string;
}

interface PipelineSummary {
  identified: number;
  sourced: number;
  screened: number;
  shortlisted: number;
  presented: number;
  interview: number;
  offer: number;
  placed: number;
}

interface PaymentMilestone {
  number: number;
  amount: number;
  status: string;
  due_date?: string;
  paid_date?: string;
}

interface PhaseHistoryEntry {
  phase: string;
  entered_at: string;
  exited_at?: string;
}

interface MandateDetail {
  mandate: Mandate;
  pipeline_summary: PipelineSummary;
  scoring_summary?: any;
  grid_summary?: any;
  payment_summary?: {
    fee_amount: number;
    milestones: PaymentMilestone[];
  };
  phase_timeline: PhaseHistoryEntry[];
  risk_flags: any[];
}

type ViewMode = 'list' | 'detail';

export function MandateDashboard() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [selectedMandate, setSelectedMandate] = useState<string | null>(null);
  const [mandateDetail, setMandateDetail] = useState<MandateDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'payments' | 'activity'>('pipeline');

  useEffect(() => {
    loadMandates();
  }, []);

  const loadMandates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mandates?status=active');
      const data = await response.json();
      if (data.success) {
        setMandates(data.data);
      }
    } catch (err) {
      console.error('Load mandates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMandateDetail = async (mandateId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mandates/${mandateId}`);
      const data = await response.json();
      if (data.success) {
        setMandateDetail(data.data);
        setViewMode('detail');
      }
    } catch (err) {
      console.error('Load mandate detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const advancePhase = async (mandateId: string) => {
    try {
      const response = await fetch(`/api/mandates/${mandateId}/advance-phase`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        loadMandateDetail(mandateId);
        loadMandates();
      }
    } catch (err) {
      console.error('Advance phase error:', err);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'kickoff': return 'bg-blue-500';
      case 'sourcing': return 'bg-purple-500';
      case 'shortlisting': return 'bg-yellow-500';
      case 'interview': return 'bg-orange-500';
      case 'offer': return 'bg-green-500';
      case 'close': return 'bg-green-600';
      case 'on_hold': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-green-700';
      default: return 'bg-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'on_hold': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number, currency = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysInPhase = (enteredAt: string) => {
    const entered = new Date(enteredAt);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const PipelineCard = ({ label, count, icon }: { label: string; count: number; icon: React.ReactNode }) => (
    <div className="bg-bg-alt rounded-none p-3 text-center">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold text-text-primary">{count}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );

  const PaymentCard = ({ milestone }: { milestone: PaymentMilestone }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge variant={
          milestone.status === 'paid' ? 'success' :
          milestone.status === 'due' ? 'warning' :
          milestone.status === 'overdue' ? 'error' : 'default'
        }>
          Milestone {milestone.number}
        </Badge>
        <span className="text-lg font-bold text-text-primary">
          {formatCurrency(milestone.amount, mandateDetail?.mandate.fee_currency)}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span>Status: {milestone.status}</span>
        {milestone.due_date && <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>}
        {milestone.paid_date && <span>Paid: {new Date(milestone.paid_date).toLocaleDateString()}</span>}
      </div>
      {milestone.status !== 'paid' && (
        <Button variant="outline" size="sm" className="mt-3 w-full">
          Mark as Paid
        </Button>
      )}
    </Card>
  );

  const PhaseTimeline = ({ timeline }: { timeline: PhaseHistoryEntry[] }) => (
    <div className="space-y-2">
      {timeline.map((entry, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getPhaseColor(entry.phase)}`} />
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary capitalize">{entry.phase}</div>
            <div className="text-xs text-text-muted">
              {new Date(entry.entered_at).toLocaleDateString()}
              {entry.exited_at && ` - ${new Date(entry.exited_at).toLocaleDateString()}`}
            </div>
          </div>
          {i < timeline.length - 1 && (
            <ArrowRight className="w-4 h-4 text-text-muted" />
          )}
        </div>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Active Mandates</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadMandates}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button>
            <Building2 className="w-4 h-4 mr-1" /> New Mandate
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-bg-alt border-b border-border text-sm font-medium text-text-muted">
          <div className="col-span-4">Mandate</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Phase</div>
          <div className="col-span-1">Days</div>
          <div className="col-span-2">Consultant</div>
          <div className="col-span-1">Fee</div>
        </div>

        <div className="divide-y divide-border">
          {mandates.map(mandate => (
            <div
              key={mandate.id}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-bg-alt cursor-pointer transition-colors"
              onClick={() => loadMandateDetail(mandate.id)}
            >
              <div className="col-span-4">
                <div className="font-medium text-text-primary">{mandate.title}</div>
                <div className="text-xs text-text-muted">
                  Created {new Date(mandate.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="col-span-2 text-sm text-text-muted">
                {mandate.client?.name || '-'}
              </div>
              <div className="col-span-2">
                <Badge className={getPhaseColor(mandate.phase)} variant="secondary">
                  {mandate.phase}
                </Badge>
              </div>
              <div className="col-span-1 text-sm text-text-muted">
                {getDaysInPhase(mandate.phase_entered_at)}d
              </div>
              <div className="col-span-2 text-sm text-text-muted">
                {mandate.lead_consultant?.name || '-'}
              </div>
              <div className="col-span-1 text-sm text-text-primary font-medium">
                {mandate.fee_amount ? formatCurrency(mandate.fee_amount, mandate.fee_currency) : '-'}
              </div>
            </div>
          ))}

          {mandates.length === 0 && (
            <div className="p-8 text-center text-text-muted">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active mandates</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const DetailView = () => {
    if (!mandateDetail) return null;

    const { mandate, pipeline_summary, payment_summary, phase_timeline } = mandateDetail;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => setViewMode('list')}>
            ← Back to List
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary">{mandate.title}</h2>
            <p className="text-sm text-text-muted">{mandate.client?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPhaseColor(mandate.phase)}>{mandate.phase}</Badge>
            <Button variant="outline" onClick={() => advancePhase(mandate.id)}>
              Advance Phase →
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-accent/10">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Days in Phase</div>
                <div className="text-2xl font-bold text-text-primary">
                  {getDaysInPhase(mandate.phase_entered_at)}d
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-green-500/10">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Target Close</div>
                <div className="text-lg font-bold text-text-primary">
                  {mandate.target_close_date
                    ? new Date(mandate.target_close_date).toLocaleDateString()
                    : '-'}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-yellow-500/10">
                <Users className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Candidates</div>
                <div className="text-2xl font-bold text-text-primary">
                  {pipeline_summary.identified}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Fee</div>
                <div className="text-lg font-bold text-text-primary">
                  {mandate.fee_amount ? formatCurrency(mandate.fee_amount, mandate.fee_currency) : '-'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'pipeline'
                  ? 'text-accent border-accent'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Pipeline
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'payments'
                  ? 'text-accent border-accent'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Payments
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'activity'
                  ? 'text-accent border-accent'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Timeline
              </div>
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'pipeline' && (
              <div className="space-y-4">
                <div className="grid grid-cols-8 gap-2">
                  <PipelineCard label="Identified" count={pipeline_summary.identified} icon={<Users className="w-4 h-4" />} />
                  <PipelineCard label="Sourced" count={pipeline_summary.sourced} icon={<Target className="w-4 h-4" />} />
                  <PipelineCard label="Screened" count={pipeline_summary.screened} icon={<CheckCircle className="w-4 h-4" />} />
                  <PipelineCard label="Shortlisted" count={pipeline_summary.shortlisted} icon={<BarChart3 className="w-4 h-4" />} />
                  <PipelineCard label="Presented" count={pipeline_summary.presented} icon={<MessageSquare className="w-4 h-4" />} />
                  <PipelineCard label="Interview" count={pipeline_summary.interview} icon={<Users className="w-4 h-4" />} />
                  <PipelineCard label="Offer" count={pipeline_summary.offer} icon={<Briefcase className="w-4 h-4" />} />
                  <PipelineCard label="Placed" count={pipeline_summary.placed} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-2">Pipeline Progress</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={(pipeline_summary.placed / Math.max(pipeline_summary.identified, 1)) * 100} className="flex-1 h-3" />
                    <span className="text-sm text-text-muted">
                      {Math.round((pipeline_summary.placed / Math.max(pipeline_summary.identified, 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && payment_summary && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-text-primary">Payment Milestones</h4>
                  <span className="text-lg font-bold text-text-primary">
                    Total: {formatCurrency(payment_summary.fee_amount, mandate.fee_currency)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {payment_summary.milestones.map(milestone => (
                    <PaymentCard key={milestone.number} milestone={milestone} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h4 className="font-medium text-text-primary">Phase Timeline</h4>
                <PhaseTimeline timeline={phase_timeline} />

                <div className="mt-6">
                  <h4 className="font-medium text-text-primary mb-3">Team</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                        {mandate.lead_consultant?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {mandate.lead_consultant?.name || 'Unassigned'}
                        </div>
                        <div className="text-xs text-text-muted">Lead Consultant</div>
                      </div>
                    </div>
                    {mandate.executive_sponsor && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-medium">
                          {mandate.executive_sponsor?.name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {mandate.executive_sponsor?.name || '-'}
                          </div>
                          <div className="text-xs text-text-muted">Executive Sponsor</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  if (loading && mandates.length === 0) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
        <p className="text-text-muted">Loading mandates...</p>
      </div>
    );
  }

  return viewMode === 'list' ? <ListView /> : <DetailView />;
}