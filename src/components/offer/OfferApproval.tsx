import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Edit2,
  Loader2,
  AlertCircle,
  ChevronRight,
  User,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { OfferStatus } from './OfferCreate';

export interface Offer {
  id: string;
  candidate_id: string;
  mandate_id: string | null;
  position_title: string;
  start_date: string;
  compensation: {
    base_salary: number;
    bonus?: number;
    equity?: string;
    benefits?: string;
    total_compensation?: number;
  };
  conditions: string;
  expiration_date: string;
  status: OfferStatus;
  cover_letter?: string;
  additional_notes?: string;
  created_by: string;
  partner_approved_by?: string;
  client_approved_by?: string;
  partner_approval_notes?: string;
  client_approval_notes?: string;
  client_rejection_reason?: string;
  partner_rejection_reason?: string;
  sent_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  candidate_name: string;
  candidate_email: string;
  client_name: string;
  created_by_name: string;
  organization_id: string;
}

export interface OfferApprovalProps {
  offer: Offer;
  userRole: 'consultant' | 'partner' | 'client';
  onApprove: (offerId: string, notes?: string) => Promise<void>;
  onReject: (offerId: string, reason: string) => Promise<void>;
  onSend: (offerId: string) => Promise<void>;
  onEdit: (offerId: string) => void;
  onClose: () => void;
}

const STATUS_STEPS: Array<{ key: OfferStatus; label: string; role: 'consultant' | 'partner' | 'client' | 'system' }> = [
  { key: 'draft', label: 'Draft', role: 'consultant' },
  { key: 'pending_partner_approval', label: 'Partner Review', role: 'partner' },
  { key: 'pending_client_approval', label: 'Client Review', role: 'client' },
  { key: 'sent', label: 'Sent to Candidate', role: 'system' },
  { key: 'accepted', label: 'Accepted', role: 'system' },
];

export function OfferApproval({
  offer,
  userRole,
  onApprove,
  onReject,
  onSend,
  onEdit,
  onClose,
}: OfferApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const canApprove = () => {
    if (userRole === 'partner' && offer.status === 'pending_partner_approval') return true;
    if (userRole === 'client' && offer.status === 'pending_client_approval') return true;
    return false;
  };

  const canSend = () => {
    return offer.status === 'pending_client_approval';
  };

  const canEdit = () => {
    return offer.status === 'draft' && userRole === 'consultant';
  };

  const getCurrentStep = () => {
    return STATUS_STEPS.findIndex(s => s.key === offer.status);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(offer.id, approvalNotes);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    try {
      await onReject(offer.id, rejectReason);
      setShowRejectModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      await onSend(offer.id);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OfferStatus): string => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'pending_partner_approval': return 'bg-yellow-100 text-yellow-700';
      case 'pending_client_approval': return 'bg-blue-100 text-blue-700';
      case 'sent': return 'bg-purple-100 text-purple-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'withdrawn': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Offer Approval</h1>
            <p className="text-text-muted">
              {offer.position_title} - {offer.candidate_name}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(offer.status)}>
          {offer.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Approval Progress */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-4">Approval Progress</h2>
        <div className="flex items-center">
          {STATUS_STEPS.map((step, idx) => {
            const currentStep = getCurrentStep();
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isPending = idx > currentStep;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-accent text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${isPending ? 'text-text-muted' : 'font-medium text-text-primary'}`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {step.role === 'system' ? '' : `(${step.role})`}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Offer Details */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-4">Offer Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Candidate</p>
              <p className="font-medium text-text-primary">{offer.candidate_name}</p>
              <p className="text-sm text-text-muted">{offer.candidate_email}</p>
            </div>
          </div>

          {/* Client */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Client</p>
              <p className="font-medium text-text-primary">{offer.client_name}</p>
            </div>
          </div>

          {/* Position */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Position</p>
              <p className="font-medium text-text-primary">{offer.position_title}</p>
            </div>
          </div>

          {/* Start Date */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Start Date</p>
              <p className="font-medium text-text-primary">{formatDate(offer.start_date)}</p>
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Compensation Package</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-green-700">Base Salary</p>
              <p className="font-bold text-green-800">
                {formatCurrency(offer.compensation.base_salary)}
              </p>
            </div>
            {offer.compensation.bonus ? (
              <div>
                <p className="text-sm text-green-700">Signing Bonus</p>
                <p className="font-bold text-green-800">
                  {formatCurrency(offer.compensation.bonus)}
                </p>
              </div>
            ) : null}
            {offer.compensation.equity ? (
              <div>
                <p className="text-sm text-green-700">Equity</p>
                <p className="font-medium text-green-800 text-sm">
                  {offer.compensation.equity}
                </p>
              </div>
            ) : null}
            {offer.compensation.benefits ? (
              <div>
                <p className="text-sm text-green-700">Benefits</p>
                <p className="font-medium text-green-800 text-sm">
                  {offer.compensation.benefits}
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800">Total First Year</span>
              <span className="text-xl font-bold text-green-700">
                {formatCurrency(
                  (offer.compensation.base_salary || 0) + (offer.compensation.bonus || 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {offer.conditions && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-800">Conditions</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {offer.conditions}
            </p>
          </div>
        )}

        {/* Cover Letter */}
        {offer.cover_letter && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Additional Notes</p>
            <p className="text-sm text-blue-700 whitespace-pre-line">
              {offer.cover_letter}
            </p>
          </div>
        )}

        {/* Expiration */}
        <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
          <AlertCircle className="w-4 h-4" />
          <span>Offer expires on {formatDate(offer.expiration_date)}</span>
        </div>
      </div>

      {/* Approval Notes History */}
      {(offer.partner_approval_notes || offer.client_approval_notes || 
        offer.partner_rejection_reason || offer.client_rejection_reason) && (
        <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-text-primary mb-4">Approval History</h2>
          <div className="space-y-3">
            {offer.partner_approval_notes && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Partner Notes</p>
                <p className="text-sm text-yellow-700">{offer.partner_approval_notes}</p>
              </div>
            )}
            {offer.partner_rejection_reason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">Partner Rejection Reason</p>
                <p className="text-sm text-red-700">{offer.partner_rejection_reason}</p>
              </div>
            )}
            {offer.client_approval_notes && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Client Notes</p>
                <p className="text-sm text-blue-700">{offer.client_approval_notes}</p>
              </div>
            )}
            {offer.client_rejection_reason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">Client Rejection Reason</p>
                <p className="text-sm text-red-700">{offer.client_rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-card-border">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>

        <div className="flex items-center gap-3">
          {canEdit() && (
            <Button variant="outline" onClick={() => onEdit(offer.id)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Offer
            </Button>
          )}

          {canApprove() && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
            </>
          )}

          {canSend() && userRole === 'client' && (
            <Button onClick={handleSend} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send to Candidate
            </Button>
          )}
        </div>
      </div>

      {/* Approval Notes Modal */}
      {canApprove() && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Approval Notes (optional)
          </label>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes for the next approver..."
            rows={2}
            className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg text-text-primary resize-none"
          />
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Reject Offer
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Please provide a reason for rejecting this offer. This will be shared with the consultant.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-2 bg-bg-alt border border-card-border rounded-lg text-text-primary resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reject Offer'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}