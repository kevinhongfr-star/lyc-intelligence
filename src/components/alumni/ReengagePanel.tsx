// Phase 4.6: Re-engagement Panel Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  Target,
  Users,
  Send,
  Edit3,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Select } from '@/components/ui';

interface AlumniCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  target_tags: string[];
  target_companies: string[];
  message_template: string;
  send_date: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  sent_count: number;
  response_count: number;
  created_at: string;
}

interface ReengagePanelProps {
  orgId: string;
}

const CAMPAIGN_TYPES = [
  { value: 'opportunity_match', label: 'Opportunity Match' },
  { value: 'industry_newsletter', label: 'Industry Newsletter' },
  { value: 'event_invitation', label: 'Event Invitation' },
  { value: 'general_checkin', label: 'General Check-in' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Sent', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
};

export function ReengagePanel({ orgId }: ReengagePanelProps) {
  const [campaigns, setCampaigns] = useState<AlumniCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AlumniCampaign | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'general_checkin' as const,
    target_tags: [] as string[],
    target_companies: [] as string[],
    message_template: '',
    send_date: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, [orgId]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/alumni/reengage?org_id=${orgId}`);
      const result = await response.json();

      if (result.success) {
        setCampaigns(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/alumni/reengage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCampaign,
          org_id: orgId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchCampaigns();
        setIsCreating(false);
        setNewCampaign({
          campaign_name: '',
          campaign_type: 'general_checkin',
          target_tags: [],
          target_companies: [],
          message_template: '',
          send_date: '',
        });
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await fetch('/api/alumni/reengage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaignId,
          status: 'sent',
        }),
      });

      fetchCampaigns();
    } catch (err) {
      console.error('Failed to send campaign:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">Re-engagement Campaigns</h3>
          <p className="text-sm text-text-muted mt-1">
            Manage outreach campaigns to alumni
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Create Campaign Modal */}
      {isCreating && (
        <Card className="p-6">
          <h4 className="font-semibold text-text-primary mb-4">Create New Campaign</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Campaign Name</label>
              <Input
                value={newCampaign.campaign_name}
                onChange={(e) => setNewCampaign({ ...newCampaign, campaign_name: e.target.value })}
                placeholder="Enter campaign name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Campaign Type</label>
              <Select
                value={newCampaign.campaign_type}
                onValueChange={(value) => setNewCampaign({ ...newCampaign, campaign_type: value as any })}
              >
                {CAMPAIGN_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Target Tags (comma-separated)</label>
              <Input
                value={newCampaign.target_tags.join(',')}
                onChange={(e) => setNewCampaign({ ...newCampaign, target_tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="vp-level, manufacturing, shanghai"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Target Companies (comma-separated)</label>
              <Input
                value={newCampaign.target_companies.join(',')}
                onChange={(e) => setNewCampaign({ ...newCampaign, target_companies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="Company A, Company B"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Send Date (optional)</label>
              <Input
                type="date"
                value={newCampaign.send_date}
                onChange={(e) => setNewCampaign({ ...newCampaign, send_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Message Template</label>
              <Textarea
                value={newCampaign.message_template}
                onChange={(e) => setNewCampaign({ ...newCampaign, message_template: e.target.value })}
                placeholder="Dear [Name],\n\nWe hope this message finds you well..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign} disabled={!newCampaign.campaign_name || !newCampaign.message_template}>
                Create Campaign
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Campaign List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-muted mt-4">No campaigns created</p>
          <Button onClick={() => setIsCreating(true)} className="mt-4">
            Create First Campaign
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <Card
              key={campaign.id}
              className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
              onClick={() => {
                setSelectedCampaign(campaign);
                setShowDetail(!showDetail);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-alt flex items-center justify-center">
                    <Mail className="w-5 h-5 text-text-muted" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{campaign.campaign_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[campaign.status].color}`}>
                        {STATUS_CONFIG[campaign.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {campaign.campaign_type.replace('_', ' ')}
                      </span>
                      {campaign.send_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(campaign.send_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.sent_count} sent
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${showDetail && selectedCampaign?.id === campaign.id ? 'rotate-180' : ''}`} />
              </div>

              {/* Detail View */}
              {showDetail && selectedCampaign?.id === campaign.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-muted">Message Template</label>
                    <Textarea
                      value={campaign.message_template}
                      readOnly
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  {campaign.target_tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-text-muted">Target Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {campaign.target_tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-bg-alt rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button onClick={(e) => { e.stopPropagation(); handleSendCampaign(campaign.id); }} className="gap-2">
                        <Send className="w-4 h-4" />
                        Send Now
                      </Button>
                    )}
                    {campaign.status === 'scheduled' && (
                      <Button onClick={(e) => { e.stopPropagation(); handleSendCampaign(campaign.id); }} className="gap-2">
                        <Send className="w-4 h-4" />
                        Send Now
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-red-500">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReengagePanel;