import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  Flame,
  Award,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { useOpportunities } from '@/hooks/useSupabaseData';
import type { Opportunity } from '@/services/supabaseApi';

interface OpportunityItem {
  id: string;
  company: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
}

interface StagePipeline {
  stage: string;
  count: number;
  value: number;
}

interface ActivityItem {
  id: string;
  type: 'meeting' | 'proposal' | 'followup' | 'email';
  title: string;
  company: string;
  time: string;
}

const STAGES = ['prospect', 'meeting_booked', 'meeting_done', 'proposal_sent', 'negotiation', 'won'];
const STAGE_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  meeting_booked: 'Meeting Booked',
  meeting_done: 'Meeting Held',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export function BDDashboard() {
  const { profile } = useAuthStore();

  const { data: opportunities, loading: oppsLoading } = useOpportunities({ limit: 100 });

  const firstName = profile?.name?.split(' ')[0] || 'there';

  const activeOpps: Opportunity[] = opportunities.filter((o: Opportunity) => o.stage !== 'won' && o.stage !== 'lost');
  const wonOpps: Opportunity[] = opportunities.filter((o: Opportunity) => o.stage === 'won');

  const pipelineTotal = activeOpps.reduce((sum: number, o: Opportunity) => sum + (o.estimated_fee_usd || 0), 0);
  const weightedPipeline = activeOpps.reduce((sum: number, o: Opportunity) => {
    return sum + ((o.estimated_fee_usd || 0) * ((o.probability || 10) / 100));
  }, 0);
  const totalOpps = opportunities.length;
  const winRate = totalOpps > 0 ? Math.round((wonOpps.length / totalOpps) * 100) : 0;
  const activeOpportunities = activeOpps.length;

  const hotOpportunitiesList: OpportunityItem[] = [...activeOpps]
    .sort((a: Opportunity, b: Opportunity) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 5)
    .map((o: Opportunity) => ({
      id: o.id,
      company: o.company_name || 'Unknown',
      title: o.title,
      value: o.estimated_fee_usd || 0,
      stage: o.stage,
      probability: o.probability || 10,
    }));

  const pipelineByStage: StagePipeline[] = STAGES.map((stage) => {
    const stageOpps = activeOpps.filter((o: Opportunity) => o.stage === stage);
    const count = stageOpps.length;
    const value = stageOpps.reduce((sum: number, o: Opportunity) => sum + (o.estimated_fee_usd || 0), 0);
    return { stage, count, value };
  });

  const thisWeekActivityList: ActivityItem[] = activeOpps
    .filter((o: Opportunity) => o.next_action_at || o.next_action)
    .slice(0, 5)
    .map((o: Opportunity, i: number) => ({
      id: o.id + '_' + i,
      type: (o.next_action?.includes('meeting') ? 'meeting' :
            o.next_action?.includes('proposal') ? 'proposal' :
            o.next_action?.includes('follow') ? 'followup' : 'meeting') as ActivityItem['type'],
      title: o.next_action || 'Follow up',
      company: o.company_name || 'Unknown',
      time: o.next_action_at ? formatDateShort(o.next_action_at) : 'TBD',
    }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'proposal': return <FileText className="w-4 h-4" />;
      case 'followup': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'text-blue-500 bg-blue-500/10';
      case 'proposal': return 'text-purple-500 bg-purple-500/10';
      case 'followup': return 'text-amber-500 bg-amber-500/10';
      case 'email': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-text-muted">Your BD pipeline and activity overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => window.location.href = '/bd/opportunities/new'}>
            <Briefcase className="w-4 h-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Pipeline Value</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {oppsLoading ? '—' : formatCurrency(pipelineTotal)}
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Weighted Forecast</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {oppsLoading ? '—' : formatCurrency(weightedPipeline)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">Q2 2024 target: $500K</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Win Rate</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{oppsLoading ? '—' : `${winRate}%`}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+5% vs last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Active Deals</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{oppsLoading ? '—' : activeOpportunities}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">3 new this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Hot Opportunities
              </CardTitle>
              <Link to="/bd/opportunities" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {oppsLoading ? (
                <div className="text-center py-8 text-text-muted">Loading...</div>
              ) : hotOpportunitiesList.length === 0 ? (
                <div className="text-center py-8 text-text-muted">No opportunities yet</div>
              ) : (
                hotOpportunitiesList.map((opp: OpportunityItem) => (
                  <Link key={opp.id} to={`/bd/opportunities/${opp.id}`}>
                    <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{opp.title}</p>
                          <p className="text-sm text-text-muted">{opp.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-text-primary">
                            {formatCurrency(opp.value)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {STAGE_LABELS[opp.stage] || opp.stage}
                            </Badge>
                            <span className="text-xs text-text-muted">{opp.probability}%</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
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
                <Calendar className="w-4 h-4 text-accent" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {oppsLoading ? (
                <div className="text-center py-8 text-text-muted">Loading...</div>
              ) : thisWeekActivityList.length === 0 ? (
                <div className="text-center py-8 text-text-muted">No upcoming activities</div>
              ) : (
                thisWeekActivityList.map((activity: ActivityItem) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(activity.type)}`}>
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary text-sm">{activity.title}</p>
                      <p className="text-xs text-text-muted">{activity.company}</p>
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap">{activity.time}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {oppsLoading ? (
                <div className="text-center py-4 text-text-muted">Loading...</div>
              ) : (
                pipelineByStage.map(({ stage, count, value }) => {
                  const maxValue = Math.max(...pipelineByStage.map((s: StagePipeline) => s.value), 1);
                  const width = (value / maxValue) * 100;
                  return (
                    <div key={stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{STAGE_LABELS[stage] || stage}</span>
                        <span className="text-text-muted">{count} · {formatCurrency(value)}</span>
                      </div>
                      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${Math.max(5, width)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-purple-50 border-accent/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">BD AI Assistant</h3>
                  <p className="text-xs text-text-muted">Powered by Nexus</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                Get market insights, company research, and pitch help for your deals.
              </p>
              <Link to="/bd/chat">
                <Button variant="outline" size="sm" className="w-full">
                  Talk to Nexus BD
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
