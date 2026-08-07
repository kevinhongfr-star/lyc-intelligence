import React, { useState } from 'react';
import { Plus, Play, Pause, BarChart3, Calendar, Users, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Campaign {
  id: string;
  name: string;
  description: string;
  channel: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  recipient_segment: string;
  sent: number;
  opened: number;
  responded: number;
  started_at?: string;
  ab_test_enabled: boolean;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Q4 Tech Talent Drive', description: 'Target senior engineers across tier-1 tech companies', channel: 'email', status: 'running', recipient_segment: 'tech_leads_50km', sent: 127, opened: 58, responded: 24, started_at: '2026-08-01', ab_test_enabled: true },
  { id: 'c2', name: 'LinkedIn Fall Outreach', description: 'LinkedIn connection requests with personalized notes', channel: 'linkedin', status: 'running', recipient_segment: 'linkedIn_group', sent: 45, opened: 32, responded: 12, started_at: '2026-07-28', ab_test_enabled: false },
  { id: 'c3', name: 'SMS Follow-up Blast', description: 'Follow-up SMS for candidates who opened emails', channel: 'sms', status: 'paused', recipient_segment: 'email_openers', sent: 89, opened: 72, responded: 31, started_at: '2026-07-15', ab_test_enabled: false },
  { id: 'c4', name: 'Executive Search Q3', description: 'High-touch executive outreach targeting C-suite', channel: 'email', status: 'draft', recipient_segment: 'executives', sent: 0, opened: 0, responded: 0, ab_test_enabled: true },
  { id: 'c5', name: 'Diversity Initiative', description: 'Promoting diverse talent pool connections', channel: 'email', status: 'completed', recipient_segment: 'diverse_leads', sent: 340, opened: 180, responded: 67, started_at: '2026-06-01', ab_test_enabled: false },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-bg-tertiary text-text-muted',
  running: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
};

export function OutreachCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [filter, setFilter] = useState<'all' | 'draft' | 'running' | 'paused' | 'completed'>('all');

  const filtered = campaigns.filter(c => filter === 'all' || c.status === filter);

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.status === 'draft') return { ...c, status: 'running', started_at: new Date().toISOString().split('T')[0] };
      if (c.status === 'running') return { ...c, status: 'paused' };
      if (c.status === 'paused') return { ...c, status: 'running' };
      return c;
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Outreach Campaigns
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4">
          {(['all', 'draft', 'running', 'paused', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs border transition-colors ${
                filter === s
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-accent/50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(campaign => (
            <div key={campaign.id} className="border border-border p-4 hover:border-accent/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">{campaign.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 ${STATUS_STYLES[campaign.status]}`}>
                      {campaign.status}
                    </span>
                    {campaign.ab_test_enabled && (
                      <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent">A/B Test</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{campaign.description}</p>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      {campaign.channel === 'email' ? '📧' : campaign.channel === 'sms' ? '💬' : '🔗'}
                      {campaign.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {campaign.recipient_segment}
                    </span>
                    {campaign.started_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {campaign.started_at}
                      </span>
                    )}
                  </div>
                  {(campaign.sent > 0) && (
                    <div className="mt-2 flex gap-4 text-xs">
                      <span>Sent: <strong className="text-text-primary">{campaign.sent}</strong></span>
                      <span>Opened: <strong className="text-text-primary">{campaign.opened}</strong> ({campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0}%)</span>
                      <span>Responded: <strong className="text-text-primary">{campaign.responded}</strong></span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(campaign.status === 'draft' || campaign.status === 'paused') && (
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(campaign.id)}>
                      <Play className="w-4 h-4 text-accent" />
                    </Button>
                  )}
                  {campaign.status === 'running' && (
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(campaign.id)}>
                      <Pause className="w-4 h-4 text-amber-500" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm"><Edit3 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">No campaigns found</div>
        )}
      </CardContent>
    </Card>
  );
}