// Phase 2.8: BD Opportunity Detail Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Link,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  ArrowRight,
  Handshake,
  Plus,
  Send,
  Edit2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  STAGE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from '@/types/bd';
import type { BDOpportunity, BDActivity, BDProposal, BDStage } from '@/types/bd';
import { getValidNextStages, getDaysInStage } from '@/services/bdStageTransition';
import { cn } from '@/lib/utils';

interface OpportunityDetailProps {
  orgId: string;
  opportunityId: string;
  onBack?: () => void;
  userId: string;
}

export function OpportunityDetail({ orgId, opportunityId, onBack, userId }: OpportunityDetailProps) {
  const [opportunity, setOpportunity] = useState<BDOpportunity | null>(null);
  const [activities, setActivities] = useState<BDActivity[]>([]);
  const [proposals, setProposals] = useState<BDProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'proposals'>('overview');
  const [newActivity, setNewActivity] = useState('');
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [readyForHandoff, setReadyForHandoff] = useState(false);

  useEffect(() => {
    fetchOpportunity();
    fetchActivities();
    fetchProposals();
  }, [orgId, opportunityId]);

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/bd/opportunities/${opportunityId}?org_id=${orgId}`);
      const result = await response.json();
      if (result.success) {
        setOpportunity(result.data);
        setReadyForHandoff(result.ready_for_handoff);
      }
    } catch (err) {
      console.error('Failed to fetch opportunity:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(
        `/api/bd/opportunities/${opportunityId}/activities?org_id=${orgId}`
      );
      const result = await response.json();
      if (result.success) {
        setActivities(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await fetch(
        `/api/bd/proposals?org_id=${orgId}&opportunity_id=${opportunityId}`
      );
      const result = await response.json();
      if (result.success) {
        setProposals(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    }
  };

  const handleStageTransition = async (newStage: BDStage) => {
    if (!opportunity) return;

    try {
      const response = await fetch(`/api/bd/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transition_stage',
          org_id: orgId,
          user_id: userId,
          new_stage: newStage,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setOpportunity(result.data);
        setShowStageMenu(false);
        fetchActivities();
      }
    } catch (err) {
      console.error('Failed to transition stage:', err);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;

    try {
      const response = await fetch(
        `/api/bd/opportunities/${opportunityId}/activities`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: orgId,
            activity_type: 'note',
            description: newActivity,
            performed_by: userId,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setNewActivity('');
        fetchActivities();
      }
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
  };

  const handleHandoff = async () => {
    if (!confirm('Hand off this opportunity to the Intake module?')) return;

    try {
      const response = await fetch(`/api/bd/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'handoff_to_intake',
          org_id: orgId,
          user_id: userId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Mandate created: ${result.mandate_id}`);
        fetchOpportunity();
      } else {
        alert(`Handoff failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to handoff:', err);
    }
  };

  const formatCurrency = (value: number | null | string): string => {
    if (!value) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Loading opportunity...</div>
      </Card>
    );
  }

  if (!opportunity) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Opportunity not found</div>
      </Card>
    );
  }

  const validNextStages = getValidNextStages(opportunity.stage);
  const daysInStage = getDaysInStage(opportunity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-serif font-semibold text-xl text-text-primary">
              {opportunity.company_name}
            </h1>
            <Badge
              variant={
                opportunity.stage === 'signed'
                  ? 'success'
                  : opportunity.stage === 'lost'
                  ? 'danger'
                  : 'default'
              }
            >
              {STAGE_LABELS[opportunity.stage]}
            </Badge>
          </div>
          <p className="text-sm text-text-muted">
            {opportunity.primary_contact_name}
            {opportunity.primary_contact_title && ` • ${opportunity.primary_contact_title}`}
          </p>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowStageMenu(!showStageMenu)}
            disabled={validNextStages.length === 0}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Change Stage
          </Button>

          {showStageMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-base border border-bg-hover rounded-lg shadow-lg z-10">
              {validNextStages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleStageTransition(stage)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          )}
        </div>

        {readyForHandoff && (
          <Button onClick={handleHandoff}>
            <Handshake className="w-4 h-4 mr-2" />
            Handoff to Intake
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-text-muted mb-1">Estimated Roles</div>
          <div className="font-semibold text-text-primary">
            {opportunity.estimated_roles}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-muted mb-1">Estimated Fee</div>
          <div className="font-semibold text-text-primary">
            {formatCurrency(opportunity.estimated_fee_total)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-muted mb-1">Days in Stage</div>
          <div className="font-semibold text-text-primary">{daysInStage}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text-muted mb-1">Created</div>
          <div className="font-semibold text-text-primary">
            {formatDate(opportunity.created_at)}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bg-hover">
        {(['overview', 'activities', 'proposals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'text-accent border-accent'
                : 'text-text-muted border-transparent hover:text-text-primary'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'activities' && (
              <span className="ml-1 text-xs">({activities.length})</span>
            )}
            {tab === 'proposals' && (
              <span className="ml-1 text-xs">({proposals.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Company Info */}
          <Card className="p-5">
            <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              Company Information
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Industry" value={opportunity.industry} />
              <InfoRow label="Company Size" value={opportunity.company_size} />
              <InfoRow label="Country" value={opportunity.country} />
              <InfoRow label="City" value={opportunity.city} />
              <InfoRow
                label="Website"
                value={
                  opportunity.website ? (
                    <a
                      href={opportunity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <Link className="w-3 h-3" />
                      {opportunity.website}
                    </a>
                  ) : null
                }
              />
            </div>
          </Card>

          {/* Contact Info */}
          <Card className="p-5">
            <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Primary Contact
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Name" value={opportunity.primary_contact_name} />
              <InfoRow label="Title" value={opportunity.primary_contact_title} />
              <InfoRow
                label="Email"
                value={
                  opportunity.primary_contact_email ? (
                    <a
                      href={`mailto:${opportunity.primary_contact_email}`}
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {opportunity.primary_contact_email}
                    </a>
                  ) : null
                }
              />
              <InfoRow
                label="Phone"
                value={opportunity.primary_contact_phone}
              />
            </div>
          </Card>

          {/* Opportunity Details */}
          <Card className="p-5">
            <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              Opportunity Details
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Type" value={opportunity.opportunity_type} />
              <InfoRow label="Fee Structure" value={opportunity.fee_structure} />
              <InfoRow label="Source" value={opportunity.source} />
              <InfoRow label="Source Detail" value={opportunity.source_detail} />
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Timeline
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Qualified At" value={formatDate(opportunity.qualified_at)} />
              <InfoRow label="Proposal Sent" value={formatDate(opportunity.proposal_sent_at)} />
              <InfoRow label="Pitch Delivered" value={formatDate(opportunity.pitch_delivered_at)} />
              <InfoRow label="Signed At" value={formatDate(opportunity.signed_at)} />
              <InfoRow label="Lost At" value={formatDate(opportunity.lost_at)} />
              {opportunity.stage === 'deferred' && (
                <InfoRow
                  label="Deferred Until"
                  value={formatDate(opportunity.deferred_until)}
                />
              )}
            </div>
          </Card>

          {/* Notes */}
          {opportunity.notes && (
            <Card className="p-5 col-span-2">
              <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Notes
              </h3>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {opportunity.notes}
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <Card className="p-5">
          {/* Add Activity */}
          <div className="flex gap-2 mb-6">
            <Input
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Add a note..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
              className="flex-1"
            />
            <Button onClick={handleAddActivity} disabled={!newActivity.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Activity List */}
          {activities.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No activities yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {ACTIVITY_TYPE_LABELS[activity.activity_type] || activity.activity_type}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        {new Date(activity.performed_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary mt-1">
                      {activity.description}
                    </p>
                    {activity.outcome && (
                      <p className="text-sm text-text-muted mt-1">{activity.outcome}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'proposals' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Proposals
            </h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No proposals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 bg-bg-secondary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary">
                        {proposal.title}
                      </div>
                      <div className="text-xs text-text-muted">
                        v{proposal.version} • Created {formatDate(proposal.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {formatCurrency(proposal.fee_amount)}
                      </span>
                      <Badge
                        variant={
                          proposal.status === 'accepted'
                            ? 'success'
                            : proposal.status === 'rejected'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {proposal.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary text-right">
        {value || <span className="text-text-muted">—</span>}
      </span>
    </div>
  );
}

export default OpportunityDetail;
