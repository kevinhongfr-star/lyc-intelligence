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

  const pipelineTotal = 1250000;
  const weightedPipeline = 425000;
  const winRate = 32;
  const activeOpportunities = 18;

  const hotOpportunities = [
    { id: '1', company: 'TechCorp', title: 'VP Engineering', value: 150000, stage: 'negotiation', probability: 70 },
    { id: '2', company: 'FinanceCo', title: 'Managing Director', value: 180000, stage: 'proposal_sent', probability: 50 },
    { id: '3', company: 'ScaleUp Inc', title: 'CFO', value: 120000, stage: 'meeting_done', probability: 40 },
  ];

  const thisWeekActivity = [
    { id: '1', type: 'meeting', title: 'TechCorp discovery call', company: 'TechCorp', time: 'Today, 2:00 PM' },
    { id: '2', type: 'proposal', title: 'Send proposal to FinanceCo', company: 'FinanceCo', time: 'Tomorrow' },
    { id: '3', type: 'followup', title: 'Follow up with Retail Group', company: 'Retail Group', time: 'Wed' },
    { id: '4', type: 'meeting', title: 'ScaleUp Inc intro meeting', company: 'ScaleUp Inc', time: 'Thu, 10:00 AM' },
  ];

  const firstName = profile?.first_name || profile?.name?.split(' ')[0] || 'there';

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
                  {formatCurrency(pipelineTotal)}
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
                  {formatCurrency(weightedPipeline)}
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
                <p className="text-2xl font-bold text-text-primary mt-1">{winRate}%</p>
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
                <p className="text-2xl font-bold text-text-primary mt-1">{activeOpportunities}</p>
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
              {hotOpportunities.map((opp) => (
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
                            {STAGE_LABELS[opp.stage]}
                          </Badge>
                          <span className="text-xs text-text-muted">{opp.probability}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                </Link>
              ))}
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
              {thisWeekActivity.map((activity) => (
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
              ))}
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
              {STAGES.map((stage) => {
                const count = STAGES.indexOf(stage) + 2;
                const value = pipelineTotal * (0.3 - STAGES.indexOf(stage) * 0.04);
                const maxWidth = 100;
                const width = (value / pipelineTotal) * maxWidth;
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{STAGE_LABELS[stage]}</span>
                      <span className="text-text-muted">{count} · {formatCurrency(Math.max(0, value))}</span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${Math.max(5, width)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
