import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Target,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Clock,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STAGE_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  meeting_booked: 'Meeting Booked',
  meeting_done: 'Meeting Held',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const STAGES = ['prospect', 'meeting_booked', 'meeting_done', 'proposal_sent', 'negotiation', 'won'];

const MOCK_OPP = {
  id: '1',
  title: 'VP Engineering',
  company_name: 'TechCorp',
  stage: 'negotiation',
  estimated_fee_usd: 150000,
  probability: 70,
  fee_type: 'contingency',
  contact_name: 'Sarah Chen',
  contact_email: 'sarah@techcorp.com',
  contact_phone: '+86 138 1234 5678',
  source: 'Referral',
  source_detail: 'Referred by former client',
  bd_owner: 'Kevin Chen',
  first_contact_at: '2024-04-15',
  next_action: 'Final negotiation call',
  next_action_at: '2024-06-25',
  days_in_stage: 7,
};

const MOCK_ACTIVITIES = [
  { id: '1', activity_type: 'meeting', summary: 'Discovery call with Sarah Chen', details: 'Discussed engineering leadership needs, team structure, and hiring timeline. Strong interest in VP Engineering role.', occurred_at: '2024-06-20T10:00:00Z', created_by: 'Kevin Chen' },
  { id: '2', activity_type: 'email', summary: 'Sent company overview deck', details: 'Follow-up email with LYC company overview and case studies.', occurred_at: '2024-06-18T14:30:00Z', created_by: 'Kevin Chen' },
  { id: '3', activity_type: 'call', summary: 'Initial cold call', details: '15 minute intro call. Sarah agreed to a formal discovery meeting.', occurred_at: '2024-06-15T09:00:00Z', created_by: 'Kevin Chen' },
  { id: '4', activity_type: 'note', summary: 'Company research notes', details: 'Series C startup, 200+ employees. Recently closed $50M funding round. Engineering team of 60 across Shanghai and Singapore.', occurred_at: '2024-06-14T12:00:00Z', created_by: 'Kevin Chen' },
];

export function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [newActivityType, setNewActivityType] = useState('note');
  const [newActivitySummary, setNewActivitySummary] = useState('');
  const [newActivityDetails, setNewActivityDetails] = useState('');

  const opp = MOCK_OPP;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'call': return <Phone className="w-4 h-4 text-green-500" />;
      case 'email': return <Mail className="w-4 h-4 text-purple-500" />;
      case 'note': return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'proposal': return <FileText className="w-4 h-4 text-pink-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStageIndex = (stage: string) => STAGES.indexOf(stage);

  const handleAdvanceStage = () => {
    console.log('Advance stage');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-text-primary">{opp.title}</h1>
            <p className="text-text-secondary mt-1">{opp.company_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                {STAGE_LABELS[opp.stage]}
              </Badge>
              <span className="text-sm text-text-muted">
                {opp.days_in_stage} days in stage
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleAdvanceStage}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Advance Stage
          </Button>
          <button className="p-2 text-text-muted hover:text-text-primary">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Estimated Fee</span>
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(opp.estimated_fee_usd)}</p>
            <p className="text-xs text-text-muted mt-1 capitalize">{opp.fee_type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Probability</span>
            </div>
            <p className="text-xl font-bold text-text-primary">{opp.probability}%</p>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full mt-2">
              <div className="h-full bg-accent rounded-full" style={{ width: `${opp.probability}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Next Action</span>
            </div>
            <p className="text-sm font-medium text-text-primary">{opp.next_action}</p>
            <p className="text-xs text-text-muted mt-1">{formatDate(opp.next_action_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">BD Owner</span>
            </div>
            <p className="text-sm font-medium text-text-primary">{opp.bd_owner}</p>
            <p className="text-xs text-text-muted mt-1">Source: {opp.source}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <div className="flex justify-between">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      i <= getStageIndex(opp.stage)
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-muted'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-text-muted mt-2 text-center w-20">
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-bg-tertiary -z-0">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${(getStageIndex(opp.stage) / (STAGES.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Timeline</CardTitle>
              <Button size="sm" onClick={() => setShowActivityModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {MOCK_ACTIVITIES.map((activity) => (
                <div key={activity.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text-primary text-sm">{activity.summary}</p>
                      <span className="text-xs text-text-muted">{formatDate(activity.occurred_at)}</span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-text-secondary mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-text-muted mt-1">by {activity.created_by}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{opp.contact_name}</p>
                  <p className="text-sm text-text-muted">Decision Maker</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="w-4 h-4 text-text-muted" />
                  {opp.contact_email}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="w-4 h-4 text-text-muted" />
                  {opp.contact_phone}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunity Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Source</span>
                <span className="text-text-primary">{opp.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">First Contact</span>
                <span className="text-text-primary">{formatDate(opp.first_contact_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fee Type</span>
                <span className="text-text-primary capitalize">{opp.fee_type}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-purple-50 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-text-primary text-sm">Nexus BD Insights</h3>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                Get AI-powered insights on this opportunity, company research, and negotiation strategy.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Ask Nexus About This Deal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['call', 'meeting', 'email', 'note'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewActivityType(type)}
                      className={`p-2 rounded-lg text-xs capitalize transition-colors border ${
                        newActivityType === type
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Summary</label>
                <input
                  value={newActivitySummary}
                  onChange={(e) => setNewActivitySummary(e.target.value)}
                  placeholder="Brief summary"
                  className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Details</label>
                <textarea
                  value={newActivityDetails}
                  onChange={(e) => setNewActivityDetails(e.target.value)}
                  placeholder="Add notes or details..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm min-h-[80px] resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowActivityModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => setShowActivityModal(false)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
