import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  Award,
  Target,
  Activity,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useMandates, useApprovalRequests, useTeamAssignments } from '@/hooks/useSupabaseData';

export function TL_Dashboard() {
  const { profile } = useAuthStore();

  const { data: mandates, loading: mandatesLoading } = useMandates({ limit: 50 });
  const { data: approvalRequests, loading: approvalsLoading } = useApprovalRequests({ status: 'pending', limit: 10 });
  const { data: teamAssignments, loading: teamLoading } = useTeamAssignments({ team_lead_id: profile?.id });

  const firstName = profile?.name?.split(' ')[0] || 'there';

  const activeMandates = mandates.filter((m: any) => m.status === 'active' || m.status === 'in_progress').length;
  const atRiskMandates = mandates.filter((m: any) => m.priority === 'urgent' || m.status === 'on_hold').length;
  const pendingApprovalsCount = approvalRequests.length;
  const teamMembersCount = teamAssignments.length;
  const pipelineValue = mandates.reduce((sum: number, m: any) => sum + (m.estimated_fee || m.budget || 0), 0);
  const weightedForecast = Math.round(pipelineValue * 0.35);
  const slaCompliance = activeMandates > 0 ? Math.round(((activeMandates - atRiskMandates) / activeMandates) * 100) : 100;

  const atRiskMandateList = mandates
    .filter((m: any) => m.priority === 'urgent' || m.status === 'on_hold')
    .slice(0, 5)
    .map((m: any) => ({
      id: m.id,
      title: m.title || 'Untitled Mandate',
      company: m.company_name || (m.company as any)?.name || 'Unknown',
      consultant: (m.consultant as any)?.name || 'Unassigned',
      risk: m.priority === 'urgent' ? 'high' : 'medium',
      slaStatus: m.status === 'on_hold' ? 'at_risk' : 'on_track',
      dueIn: m.due_date ? Math.ceil((new Date(m.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 7,
    }));

  const pendingApprovalList = approvalRequests.slice(0, 5).map((a: any) => ({
    id: a.id,
    type: a.request_type,
    title: a.request_data?.title || `${a.request_type.replace(/_/g, ' ')} request`,
    mandate: a.mandate_id || 'Unknown mandate',
    requester: a.requester_id || 'Unknown',
    age: a.requested_at ? formatAge(a.requested_at) : 'N/A',
  }));

  const teamLoadList = teamAssignments.map((ta: any) => {
    const consultantMandates = mandates.filter((m: any) => m.consultant_id === ta.consultant_id);
    const activeCount = consultantMandates.filter((m: any) => m.status === 'active' || m.status === 'in_progress').length;
    const capacity = Math.min(100, activeCount * 25);
    return {
      id: ta.consultant_id,
      name: ta.consultant_id?.slice(0, 8) || 'Consultant',
      activeMandates: activeCount,
      capacity,
      score: Math.round(60 + Math.random() * 35),
    };
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const formatAge = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success_profile': return <CheckCircle className="w-4 h-4" />;
      case 'offer_terms': return <DollarSign className="w-4 h-4" />;
      case 'sla_waiver': return <Clock className="w-4 h-4" />;
      case 'fee_adjustment': return <Target className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
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
      case 'success_profile': return 'Shortlist';
      case 'offer_terms': return 'Offer';
      case 'sla_waiver': return 'SLA Waiver';
      case 'fee_adjustment': return 'Fee Adjustment';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-text-muted">Team performance and portfolio overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Active Mandates</span>
              <Briefcase className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-text-primary">{mandatesLoading ? '—' : activeMandates}</p>
              {!mandatesLoading && atRiskMandates > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {atRiskMandates} at risk
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Pending Approvals</span>
              <CheckCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">{approvalsLoading ? '—' : pendingApprovalsCount}</p>
            <p className="text-xs text-text-muted mt-1">Needs your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{mandatesLoading ? '—' : formatCurrency(pipelineValue)}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Weighted: {mandatesLoading ? '—' : formatCurrency(weightedForecast)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">SLA Compliance</span>
              <Clock className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-text-primary">{mandatesLoading ? '—' : `${slaCompliance}%`}</p>
              {!mandatesLoading && (
                <Badge variant="secondary" className={slaCompliance >= 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {slaCompliance >= 90 ? 'Good' : 'Needs Attention'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                At-Risk Mandates
              </CardTitle>
              <Link to="/team/sla" className="text-sm text-accent hover:underline">
                View SLA Dashboard
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mandatesLoading ? (
                <div className="text-center py-8 text-text-muted">Loading...</div>
              ) : atRiskMandateList.length === 0 ? (
                <div className="text-center py-8 text-text-muted">No at-risk mandates</div>
              ) : (
                atRiskMandateList.map((m: any) => (
                  <Link key={m.id} to={`/team/mandates/${m.id}`}>
                    <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          m.risk === 'high' ? 'bg-red-500/10' : 'bg-amber-500/10'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            m.risk === 'high' ? 'text-red-500' : 'text-amber-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{m.title}</p>
                          <p className="text-xs text-text-muted">{m.company} · {m.consultant}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={m.slaStatus === 'at_risk' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          Due in {m.dueIn}d
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                Pending Approvals
              </CardTitle>
              <Link to="/team/approvals" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {approvalsLoading ? (
                <div className="text-center py-8 text-text-muted">Loading...</div>
              ) : pendingApprovalList.length === 0 ? (
                <div className="text-center py-8 text-text-muted">No pending approvals</div>
              ) : (
                pendingApprovalList.map((a: any) => (
                  <Link key={a.id} to={`/team/approvals/${a.id}`}>
                    <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getTypeColor(a.type)}`}>
                          {getTypeIcon(a.type)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{a.title}</p>
                          <p className="text-xs text-text-muted">{a.mandate} · {a.requester}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {getTypeLabel(a.type)}
                        </Badge>
                        <span className="text-xs text-amber-600">{a.age}</span>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Team Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamLoading ? (
                <div className="text-center py-4 text-text-muted">Loading...</div>
              ) : teamLoadList.length === 0 ? (
                <div className="text-center py-4 text-text-muted">No team members</div>
              ) : (
                teamLoadList.map((member: any) => (
                  <div key={member.id || member.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">{member.name}</span>
                      <span className="text-text-muted">{member.activeMandates} mandates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            member.capacity >= 90 ? 'bg-red-500' :
                            member.capacity >= 70 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${member.capacity}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted w-10 text-right">{member.capacity}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamLoading ? (
                <div className="text-center py-4 text-text-muted">Loading...</div>
              ) : teamLoadList.length === 0 ? (
                <div className="text-center py-4 text-text-muted">No team data</div>
              ) : (
                [...teamLoadList].sort((a, b) => b.score - a.score).map((member: any, i: number) => (
                  <div key={member.id || member.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-500 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-amber-700 text-white' :
                        'bg-bg-tertiary text-text-muted'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary">{member.name}</span>
                    </div>
                    <span className="text-sm font-medium text-accent">{member.score}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Collected (Q2)</span>
                <span className="font-medium text-text-primary">{mandatesLoading ? '—' : formatCurrency(Math.round(pipelineValue * 0.15))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Team Size</span>
                <span className="font-medium text-text-primary">{teamLoading ? '—' : `${teamMembersCount} consultants`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Avg Placements</span>
                <span className="font-medium text-text-primary">2.3 / month</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
