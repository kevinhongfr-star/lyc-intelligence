// Phase 3.11: Delegation Manager Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Calendar,
  Plus,
  Trash2,
  X,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select } from '@/components/ui';

interface Delegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  approval_type: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

interface DelegationManagerProps {
  orgId: string;
  delegatorId: string;
}

const APPROVAL_TYPES = [
  { value: 'candidate_submission', label: 'Candidate Submission' },
  { value: 'fee_change', label: 'Fee Change' },
  { value: 'offer_approval', label: 'Offer Approval' },
  { value: 'mandate_creation', label: 'Mandate Creation' },
  { value: 'budget_exception', label: 'Budget Exception' },
  { value: 'data_export', label: 'Data Export' },
  { value: 'custom', label: 'Custom' },
];

const MOCK_USERS = [
  { id: 'user-1', name: 'Alex Chen', role: 'partner' },
  { id: 'user-2', name: 'Sarah Johnson', role: 'senior_consultant' },
  { id: 'user-3', name: 'Michael Wang', role: 'principal' },
  { id: 'user-4', name: 'Emily Davis', role: 'consultant' },
  { id: 'user-5', name: 'David Li', role: 'managing_partner' },
];

export function DelegationManager({ orgId, delegatorId }: DelegationManagerProps) {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDelegation, setNewDelegation] = useState({
    delegate_id: '',
    approval_type: 'candidate_submission',
    starts_at: '',
    ends_at: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDelegations();
  }, [orgId, delegatorId]);

  const fetchDelegations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/approvals/delegations?org_id=${orgId}&delegator_id=${delegatorId}&active=true`
      );
      const result = await response.json();

      if (result.success) {
        setDelegations(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch delegations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDelegation = async () => {
    if (!newDelegation.delegate_id || !newDelegation.starts_at || !newDelegation.ends_at) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/approvals/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          delegator_id: delegatorId,
          delegate_id: newDelegation.delegate_id,
          approval_type: newDelegation.approval_type,
          starts_at: new Date(newDelegation.starts_at).toISOString(),
          ends_at: new Date(newDelegation.ends_at).toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchDelegations();
        setShowAddForm(false);
        setNewDelegation({
          delegate_id: '',
          approval_type: 'candidate_submission',
          starts_at: '',
          ends_at: '',
        });
      }
    } catch (err) {
      console.error('Failed to add delegation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDelegation = async (delegationId: string) => {
    if (!confirm('Remove this delegation?')) return;

    try {
      await fetch(`/api/approvals/delegations?id=${delegationId}`, {
        method: 'DELETE',
      });
      fetchDelegations();
    } catch (err) {
      console.error('Failed to remove delegation:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getApprovalTypeLabel = (type: string) => {
    return APPROVAL_TYPES.find(t => t.value === type)?.label || type;
  };

  const getUserName = (userId: string) => {
    return MOCK_USERS.find(u => u.id === userId)?.name || userId.slice(0, 8);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Delegations</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Delegation
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-bg-alt rounded-none">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-text-primary">New Delegation</h4>
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Delegate To *</label>
              <Select
                value={newDelegation.delegate_id}
                onValueChange={(value) => setNewDelegation({ ...newDelegation, delegate_id: value })}
                className="mt-1"
              >
                <option value="">Select user...</option>
                {MOCK_USERS.filter(u => u.id !== delegatorId).map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted">Approval Type *</label>
              <Select
                value={newDelegation.approval_type}
                onValueChange={(value) => setNewDelegation({ ...newDelegation, approval_type: value })}
                className="mt-1"
              >
                {APPROVAL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start Date *
              </label>
              <Input
                type="date"
                value={newDelegation.starts_at}
                onChange={(e) => setNewDelegation({ ...newDelegation, starts_at: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                End Date *
              </label>
              <Input
                type="date"
                value={newDelegation.ends_at}
                onChange={(e) => setNewDelegation({ ...newDelegation, ends_at: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleAddDelegation}
              disabled={isSaving || !newDelegation.delegate_id || !newDelegation.starts_at || !newDelegation.ends_at}
              className="gap-2"
            >
              {isSaving ? 'Saving...' : 'Add Delegation'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Delegations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : delegations.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-muted mt-4">No active delegations</p>
          <p className="text-sm text-text-muted mt-2">Delegate approvals when you're away</p>
        </div>
      ) : (
        <div className="space-y-3">
          {delegations.map(delegation => (
            <div key={delegation.id} className="p-4 bg-bg-alt rounded-none">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">
                    {getApprovalTypeLabel(delegation.approval_type)}
                  </div>
                  <div className="text-sm text-text-muted mt-1">
                    Delegated to: {getUserName(delegation.delegate_id)}
                  </div>
                  <div className="text-sm text-text-muted">
                    {formatDate(delegation.starts_at)} — {formatDate(delegation.ends_at)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDelegation(delegation.id)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default DelegationManager;
