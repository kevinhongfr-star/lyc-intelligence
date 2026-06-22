import React, { useState } from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  MessageSquare,
  Calendar,
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export interface FollowUpEmail {
  type: '1m' | '3m' | '6m';
  scheduledDate: Date;
  sentAt?: Date;
  response?: string;
  status: 'pending' | 'sent' | 'responded';
}

export interface PostPlacementFollowUpProps {
  candidateName: string;
  positionTitle: string;
  clientName: string;
  startDate: string;
  consultantName: string;
  consultantEmail: string;
  followUps: FollowUpEmail[];
  onSendManually?: (type: '1m' | '3m' | '6m') => Promise<void>;
  onRecordResponse?: (type: '1m' | '3m' | '6m', response: string) => Promise<void>;
  readOnly?: boolean;
}

const FOLLOW_UP_CONFIG = {
  '1m': {
    label: '1-Month Follow-up',
    description: 'Check on transition and initial experience',
    color: 'blue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700',
  },
  '3m': {
    label: '3-Month Follow-up',
    description: 'Mid-point check-in',
    color: 'purple',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700',
  },
  '6m': {
    label: '6-Month Follow-up',
    description: 'Extended review and feedback',
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700',
  },
};

export function PostPlacementFollowUp({
  candidateName,
  positionTitle,
  clientName,
  startDate,
  consultantName,
  consultantEmail,
  followUps,
  onSendManually,
  onRecordResponse,
  readOnly = false,
}: PostPlacementFollowUpProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const startDateObj = new Date(startDate);
  const today = new Date();

  const getFollowUpDate = (type: '1m' | '3m' | '6m'): Date => {
    const date = new Date(startDateObj);
    const months = type === '1m' ? 1 : type === '3m' ? 3 : 6;
    date.setMonth(date.getMonth() + months);
    return date;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFollowUp = (type: '1m' | '3m' | '6m'): FollowUpEmail | undefined => {
    return followUps.find(f => f.type === type);
  };

  const handleSendManually = async (type: '1m' | '3m' | '6m') => {
    if (!onSendManually) return;
    setLoading(type);
    try {
      await onSendManually(type);
    } finally {
      setLoading(null);
    }
  };

  const handleRecordResponse = async () => {
    if (!showResponseModal || !responseText.trim() || !onRecordResponse) return;
    setLoading('response');
    try {
      await onRecordResponse(showResponseModal as '1m' | '3m' | '6m', responseText);
      setShowResponseModal(null);
      setResponseText('');
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (followUp?: FollowUpEmail, type?: '1m' | '3m' | '6m') => {
    if (!followUp) {
      // Not yet due
      const dueDate = type ? getFollowUpDate(type) : null;
      if (dueDate && today < dueDate) {
        return (
          <Badge className="bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      }
    }
    
    if (followUp?.status === 'responded') {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Responded
        </Badge>
      );
    }
    
    if (followUp?.status === 'sent') {
      return (
        <Badge className="bg-blue-100 text-blue-700">
          <Mail className="w-3 h-3 mr-1" />
          Sent
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Post-Placement Follow-up</h2>
            <p className="text-sm text-text-muted">
              {candidateName} at {clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Started: {formatDate(startDateObj)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{positionTitle}</Badge>
          </div>
        </div>
      </div>

      {/* Follow-up Timeline */}
      <div className="p-6">
        <div className="space-y-4">
          {(['1m', '3m', '6m'] as const).map((type, idx) => {
            const config = FOLLOW_UP_CONFIG[type];
            const followUp = getFollowUp(type);
            const dueDate = getFollowUpDate(type);
            const isPastDue = today > dueDate && !followUp?.sentAt;
            const isDue = today.toDateString() === dueDate.toDateString();
            const Icon = Mail;

            return (
              <div
                key={type}
                className={`p-4 rounded-xl border-2 ${
                  followUp?.status === 'responded'
                    ? 'bg-green-50 border-green-500'
                    : followUp?.status === 'sent'
                    ? 'bg-blue-50 border-blue-500'
                    : isPastDue
                    ? 'bg-red-50 border-red-500'
                    : isDue
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{config.label}</h3>
                      <p className="text-sm text-text-muted">{config.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-muted">
                          {followUp?.sentAt
                            ? `Sent ${formatDate(new Date(followUp.sentAt))}`
                            : `Due ${formatDate(dueDate)}`}
                          {isPastDue && !followUp?.sentAt && (
                            <span className="text-red-600 font-medium ml-2">Overdue!</span>
                          )}
                          {isDue && !followUp?.sentAt && (
                            <span className="text-yellow-600 font-medium ml-2">Due today</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(followUp, type)}
                    
                    {!readOnly && !followUp?.sentAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendManually(type)}
                        disabled={loading === type}
                      >
                        {loading === type ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Send Now
                          </>
                        )}
                      </Button>
                    )}

                    {!readOnly && followUp?.sentAt && followUp?.status !== 'responded' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowResponseModal(type);
                          setResponseText('');
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Record Response
                      </Button>
                    )}
                  </div>
                </div>

                {/* Response */}
                {followUp?.response && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">Candidate Response:</p>
                    <p className="text-sm text-green-700 whitespace-pre-line">{followUp.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Record Response
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Record the candidate's response to the {FOLLOW_UP_CONFIG[showResponseModal as keyof typeof FOLLOW_UP_CONFIG].label}.
            </p>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter the candidate's feedback..."
              rows={6}
              className="w-full px-4 py-3 bg-bg-alt border border-card-border rounded-lg text-text-primary resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowResponseModal(null);
                  setResponseText('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordResponse}
                disabled={loading === 'response' || !responseText.trim()}
              >
                {loading === 'response' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Response'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Email Template Generation
export function generateFollowUpEmail(
  type: '1m' | '3m' | '6m',
  candidateName: string,
  positionTitle: string,
  clientName: string,
  consultantName: string
): { subject: string; body: string } {
  const months = type === '1m' ? 'one' : type === '3m' ? 'three' : 'six';
  
  const subject = `Checking in — ${positionTitle}`;

  const body = `Hi ${candidateName},

Hope you're settling in well at ${clientName}! It's been ${months} month${type === '1m' ? '' : 's'} since you started as ${positionTitle}.

How's the transition going? Any support you need from our side?

Feel free to reach out if you have any questions or just want to catch up.

Best,
${consultantName}
`;

  return { subject, body };
}

// Schedule follow-up emails
export async function scheduleFollowUps(
  offerId: string,
  startDate: string,
  candidateEmail: string,
  candidateName: string,
  positionTitle: string,
  clientName: string,
  consultantName: string
): Promise<{ scheduled: Array<{ type: string; date: string }> }> {
  const start = new Date(startDate);
  const scheduled: Array<{ type: string; date: string }> = [];

  const followUpTypes = [
    { type: 'follow_up_1m', months: 1, key: '1m' },
    { type: 'follow_up_3m', months: 3, key: '3m' },
    { type: 'follow_up_6m', months: 6, key: '6m' },
  ];

  for (const followUp of followUpTypes) {
    const scheduledDate = new Date(start);
    scheduledDate.setMonth(scheduledDate.getMonth() + followUp.months);

    // In production, this would call the email scheduling API
    // For now, we'll just return the scheduled dates
    scheduled.push({
      type: followUp.key,
      date: scheduledDate.toISOString(),
    });
  }

  return { scheduled };
}