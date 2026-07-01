import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Clock, HelpCircle } from 'lucide-react';
import { Button, Card, Textarea } from '@/components/ui';

interface ClientFeedbackModalProps {
  candidate: any;
  mandateId: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function ClientFeedbackModal({ candidate, mandateId, onClose, onSubmit }: ClientFeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'interested' | 'not_interested' | 'need_more_info' | 'hold'>('interested');
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackOptions = [
    { value: 'interested', label: 'Interested', description: "I'd like to interview this candidate", icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'need_more_info', label: 'Need More Info', description: 'I need additional context first', icon: HelpCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'not_interested', label: 'Not Interested', description: "I'd like to pass on this candidate", icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'hold', label: 'Hold', description: 'Revisit later', icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  ];

  const requiresReason = feedbackType === 'not_interested' || feedbackType === 'need_more_info';
  const requiresAdditionalInfo = feedbackType === 'need_more_info';

  async function handleSubmit() {
    if (requiresReason && !reason.trim()) {
      return;
    }
    if (requiresAdditionalInfo && !additionalInfo.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/client/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_id: mandateId,
          contact_id: candidate.contact_id,
          feedback_type: feedbackType,
          reason: requiresReason ? reason : undefined,
          additional_info: requiresAdditionalInfo ? additionalInfo : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSubmit();
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Give Feedback — {candidate.full_name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-gray-600 mb-6">
          How would you like to proceed with this candidate?
        </p>

        <div className="space-y-3 mb-6">
          {feedbackOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFeedbackType(option.value as any)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  feedbackType === option.value
                    ? `${option.bgColor} border-current ${option.color}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${feedbackType === option.value ? option.color : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-medium ${feedbackType === option.value ? option.color : 'text-gray-800'}`}>
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {requiresReason && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a brief reason..."
              className={`${!reason.trim() ? 'border-red-200' : ''}`}
              rows={3}
            />
          </div>
        )}

        {requiresAdditionalInfo && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to know? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please specify what additional information you need..."
              className={`${!additionalInfo.trim() ? 'border-red-200' : ''}`}
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting || (requiresReason && !reason.trim()) || (requiresAdditionalInfo && !additionalInfo.trim())}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
