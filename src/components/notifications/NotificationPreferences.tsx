// Phase 7.3: Notification Preferences Component
// User notification settings

'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  BellOff,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

type DeliveryMethod = 'email' | 'in_app' | 'both' | 'none';

interface NotificationPreferencesForm {
  feedbackReceived: DeliveryMethod;
  candidateAdvanced: DeliveryMethod;
  interviewScheduled: DeliveryMethod;
  newCandidateAdded: DeliveryMethod;
  reportReady: DeliveryMethod;
  referenceSubmitted: DeliveryMethod;
  offerStatusChanged: DeliveryMethod;
  milestoneAtRisk: DeliveryMethod;
  messageReceived: DeliveryMethod;
}

interface NotificationPreferencesProps {
  userId: string;
}

const NOTIFICATION_TYPES = [
  { key: 'feedbackReceived', label: 'Feedback Received', description: 'When a client approves or rejects a candidate' },
  { key: 'candidateAdvanced', label: 'Candidate Advanced', description: 'When a candidate moves to the next stage' },
  { key: 'interviewScheduled', label: 'Interview Scheduled', description: 'When an interview is booked' },
  { key: 'newCandidateAdded', label: 'New Candidate', description: 'When a new candidate is added to the pipeline' },
  { key: 'reportReady', label: 'Report Ready', description: 'When a LENS report is generated' },
  { key: 'referenceSubmitted', label: 'Reference Submitted', description: 'When a referee completes a reference' },
  { key: 'offerStatusChanged', label: 'Offer Status Changed', description: 'When an offer is accepted or rejected' },
  { key: 'milestoneAtRisk', label: 'Milestone at Risk', description: 'When a milestone is approaching its deadline' },
  { key: 'messageReceived', label: 'Message Received', description: 'When you receive a new message' },
];

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'both', label: 'Both', icon: <><Mail className="w-4 h-4" /><Bell className="w-4 h-4 ml-1" /></> },
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'in_app', label: 'In-App', icon: <Bell className="w-4 h-4" /> },
  { value: 'none', label: 'None', icon: <BellOff className="w-4 h-4" /> },
];

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferencesForm>({
    feedbackReceived: 'both',
    candidateAdvanced: 'in_app',
    interviewScheduled: 'both',
    newCandidateAdded: 'in_app',
    reportReady: 'both',
    referenceSubmitted: 'both',
    offerStatusChanged: 'both',
    milestoneAtRisk: 'both',
    messageReceived: 'both',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch preferences
  useEffect(() => {
    async function fetchPreferences() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/data/notification-preferences/${userId}`);
        const result = await response.json();

        if (result.success && result.data) {
          setPreferences(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, [userId]);

  // Handle preference change
  const handleChange = (key: keyof NotificationPreferencesForm, value: DeliveryMethod) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
    setSaveError(null);
  };

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveError(null);

    try {
      const response = await fetch(`/api/data/notification-preferences/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }

      setSaveStatus('success');
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading preferences...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
          <p className="text-sm text-text-muted mt-1">
            Choose how you want to receive notifications for different events.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-text-secondary">Notification Type</th>
                <th className="text-center py-3 px-4 font-medium text-text-secondary">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_TYPES.map(({ key, label, description }) => (
                <tr key={key} className="border-b border-border hover:bg-bg-alt">
                  <td className="py-4 px-4">
                    <p className="font-medium text-text-primary">{label}</p>
                    <p className="text-sm text-text-muted mt-1">{description}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-1">
                      {DELIVERY_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleChange(key as keyof NotificationPreferencesForm, option.value)}
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            preferences[key as keyof NotificationPreferencesForm] === option.value
                              ? option.value === 'none'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-primary text-white'
                              : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                          }`}
                        >
                          {option.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-bg-alt rounded-lg">
          <span className="text-sm text-text-muted">Legend:</span>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">In-App</span>
          </div>
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">No notifications</span>
          </div>
        </div>

        {/* Save status */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm">Preferences saved successfully</span>
          </div>
        )}

        {saveStatus === 'error' && saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{saveError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default NotificationPreferences;