import React, { useState } from 'react';
import {
  Mail,
  Bell,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export type AssessmentType = 'SHIFT' | 'PRISM' | 'FORGE' | 'SPARK' | 'BRIDGE' | 'MOSAIC' | 'custom';

export interface AssessmentInvitationData {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  mandate_id: string;
  mandate_title: string;
  client_name: string;
  assessment_type: AssessmentType;
  assessment_id: string;
  assessment_title: string;
  duration_minutes: number;
  assessment_link: string;
  consultant_name: string;
  consultant_email: string;
  invited_at: string;
  expires_at?: string;
  status: 'pending' | 'sent' | 'viewed' | 'completed' | 'expired';
}

export interface NotificationPreferences {
  email_enabled: boolean;
  in_app_enabled: boolean;
  reminder_days_before?: number;
}

export interface AssessmentInvitationProps {
  invitation: AssessmentInvitationData;
  onSendEmail?: (invitationId: string) => Promise<boolean>;
  onSendInApp?: (invitationId: string) => Promise<boolean>;
  onResend?: (invitationId: string) => Promise<boolean>;
  onCancel?: (invitationId: string) => Promise<boolean>;
}

export function AssessmentInvitationCard({
  invitation,
  onSendEmail,
  onSendInApp,
  onResend,
  onCancel,
}: AssessmentInvitationProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingInApp, setIsSendingInApp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSendEmail = async () => {
    if (!onSendEmail || isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      await onSendEmail(invitation.id);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendInApp = async () => {
    if (!onSendInApp || isSendingInApp) return;
    setIsSendingInApp(true);
    try {
      await onSendInApp(invitation.id);
    } finally {
      setIsSendingInApp(false);
    }
  };

  const handleResend = async () => {
    if (!onResend || isResending) return;
    setIsResending(true);
    try {
      await onResend(invitation.id);
    } finally {
      setIsResending(false);
    }
  };

  const getStatusBadge = () => {
    switch (invitation.status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'viewed':
        return <Badge variant="default">Viewed</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'expired':
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="default">{invitation.status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-card-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">{invitation.assessment_title}</h3>
            <p className="text-sm text-text-muted mt-1">{invitation.mandate_title}</p>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Candidate info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent font-medium">
              {invitation.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">{invitation.candidate_name}</p>
            <p className="text-sm text-text-muted">{invitation.candidate_email}</p>
          </div>
        </div>

        {/* Assessment details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Assessment Type</p>
            <p className="font-medium text-text-primary">{invitation.assessment_type}</p>
          </div>
          <div>
            <p className="text-text-muted">Duration</p>
            <p className="font-medium text-text-primary flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{invitation.duration_minutes} min
            </p>
          </div>
          <div>
            <p className="text-text-muted">Client</p>
            <p className="font-medium text-text-primary">{invitation.client_name}</p>
          </div>
          <div>
            <p className="text-text-muted">Invited By</p>
            <p className="font-medium text-text-primary">{invitation.consultant_name}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-sm text-text-muted pt-3 border-t border-border">
          <span>Invited: {formatDate(invitation.invited_at)}</span>
          {invitation.expires_at && (
            <span className={invitation.status === 'expired' ? 'text-red-500' : ''}>
              Expires: {formatDate(invitation.expires_at)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 bg-bg-alt border-t border-border">
        <div className="flex items-center gap-3">
          {invitation.status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex items-center gap-2"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Email
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSendInApp}
                disabled={isSendingInApp}
                className="flex items-center gap-2"
              >
                {isSendingInApp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                Send In-App
              </Button>
            </>
          )}
          {(invitation.status === 'sent' || invitation.status === 'viewed') && (
            <Button
              variant="default"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-2"
            >
              {isResending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Resend
            </Button>
          )}
          <a
            href={invitation.assessment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              Preview Link
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          {invitation.status !== 'completed' && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(invitation.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Email template renderer
export function renderAssessmentEmailTemplate(invitation: AssessmentInvitationData): {
  subject: string;
  body: string;
} {
  const subject = `Assessment Invitation for ${invitation.mandate_title}`;

  const body = `
Hi ${invitation.candidate_name},

You've been invited to complete a ${invitation.assessment_type} assessment for ${invitation.mandate_title} at ${invitation.client_name}.

Click here to start: ${invitation.assessment_link}

Estimated time: ${invitation.duration_minutes} minutes.

Important notes:
- The assessment is mobile-friendly, so you can complete it on any device
- Your progress is auto-saved, so you can resume if interrupted
${invitation.expires_at ? `- Please complete by ${new Date(invitation.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}

If you have any questions, please contact ${invitation.consultant_name} at ${invitation.consultant_email}.

Best regards,
LYC Intelligence
  `.trim();

  return { subject, body };
}

// In-app notification content
export function getInAppNotificationContent(invitation: AssessmentInvitationData): {
  title: string;
  message: string;
  actionUrl: string;
} {
  return {
    title: 'New Assessment Available',
    message: `You have a new ${invitation.assessment_type} assessment for ${invitation.mandate_title}. Estimated time: ${invitation.duration_minutes} minutes.`,
    actionUrl: invitation.assessment_link,
  };
}

// Batch invitation component for consultants
export interface BatchInvitationProps {
  candidates: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  assessmentType: AssessmentType;
  mandateId: string;
  onSendAll: (candidateIds: string[]) => Promise<boolean>;
}

export function BatchInvitationModal({
  candidates,
  assessmentType,
  onSendAll,
}: BatchInvitationProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSendAll = async () => {
    if (selectedIds.size === 0 || isSending) return;
    setIsSending(true);
    try {
      await onSendAll(Array.from(selectedIds));
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setSelectedIds(new Set());
      }, 2000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Select all header */}
      <div className="flex items-center justify-between p-4 bg-bg-alt rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.size === candidates.length && candidates.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="font-medium">Select all ({candidates.length})</span>
        </label>
        <span className="text-sm text-text-muted">
          {selectedIds.size} selected
        </span>
      </div>

      {/* Candidate list */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {candidates.map(candidate => (
          <label
            key={candidate.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-alt cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(candidate.id)}
              onChange={() => toggleOne(candidate.id)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <div>
              <p className="font-medium text-text-primary">{candidate.name}</p>
              <p className="text-sm text-text-muted">{candidate.email}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Send button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {sent && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Invitations sent!
          </span>
        )}
        <Button
          onClick={handleSendAll}
          disabled={selectedIds.size === 0 || isSending}
          className="flex items-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to {selectedIds.size} candidate{selectedIds.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default AssessmentInvitationCard;
