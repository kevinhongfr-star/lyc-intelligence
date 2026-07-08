import React, { useState } from 'react';
import {
  Bell, Mail, MessageSquare, Calendar, FileText, TrendingUp,
  Lightbulb, CheckCircle2, Save, Loader2, AlertCircle
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

interface NotificationPreferences {
  assessment_invitation: {
    enabled: boolean;
    email: boolean;
    in_app: boolean;
  };
  interview_reminder: {
    enabled: boolean;
    email: boolean;
    in_app: boolean;
  };
  stage_change: {
    enabled: boolean;
    email: boolean;
    in_app: boolean;
  };
  feedback_received: {
    enabled: boolean;
    email: boolean;
    in_app: boolean;
  };
  career_insight: {
    enabled: boolean;
    email: boolean;
    in_app: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
}

interface NotificationSettingsProps {
  candidateId?: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  assessment_invitation: {
    enabled: true,
    email: true,
    in_app: true,
  },
  interview_reminder: {
    enabled: true,
    email: true,
    in_app: true,
  },
  stage_change: {
    enabled: true,
    email: true,
    in_app: true,
  },
  feedback_received: {
    enabled: true,
    email: true,
    in_app: true,
  },
  career_insight: {
    enabled: true,
    email: true,
    in_app: true,
    frequency: 'weekly',
  },
};

const NOTIFICATION_TYPES = [
  {
    key: 'assessment_invitation' as const,
    label: 'Assessment Invitation',
    description: 'When a consultant assigns an assessment to you',
    icon: FileText,
    color: 'blue',
  },
  {
    key: 'interview_reminder' as const,
    label: 'Interview Reminder',
    description: '24 hours before a scheduled interview',
    icon: Calendar,
    color: 'purple',
  },
  {
    key: 'stage_change' as const,
    label: 'Application Stage Change',
    description: 'When your application advances to a new stage',
    icon: TrendingUp,
    color: 'green',
  },
  {
    key: 'feedback_received' as const,
    label: 'Client Feedback',
    description: 'When the client provides feedback on your application',
    icon: MessageSquare,
    color: 'yellow',
  },
  {
    key: 'career_insight' as const,
    label: 'Career Insights',
    description: 'New AI-generated insights for your career development',
    icon: Lightbulb,
    color: 'orange',
  },
];

export function NotificationSettings({ candidateId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update preference
  const updatePreference = (
    type: keyof NotificationPreferences,
    field: string,
    value: boolean | string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
    setSaved(false);
  };

  // Enable/disable all for a type
  const toggleType = (type: keyof NotificationPreferences) => {
    const current = preferences[type].enabled;
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !current,
        email: !current,
        in_app: !current,
      },
    }));
    setSaved(false);
  };

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // In a real app, call API to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get icon color
  const getIconColor = (color: string): string => {
    switch (color) {
      case 'blue': return 'bg-blue-500/10 text-blue-500';
      case 'purple': return 'bg-purple-500/10 text-purple-500';
      case 'green': return 'bg-green-500/10 text-green-500';
      case 'yellow': return 'bg-yellow-500/10 text-yellow-500';
      case 'orange': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
        <p className="text-sm text-text-muted">
          Choose how you want to receive notifications about your applications
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 rounded-none flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-500">{error}</span>
        </div>
      )}

      {/* Notification types */}
      <div className="space-y-4">
        {NOTIFICATION_TYPES.map(({ key, label, description, icon: Icon, color }) => (
          <div 
            key={key}
            className={`bg-card rounded-none border p-5 transition-all ${
              preferences[key].enabled 
                ? 'border-card-border' 
                : 'border-border opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-none ${getIconColor(color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">{label}</div>
                  <div className="text-sm text-text-muted">{description}</div>
                </div>
              </div>
              
              {/* Master toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[key].enabled}
                  onChange={() => toggleType(key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-accent peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {/* Delivery options */}
            {preferences[key].enabled && (
              <div className="pl-[72px] space-y-3">
                {/* Email toggle */}
                <label className="flex items-center justify-between p-3 bg-bg-alt rounded-none cursor-pointer hover:bg-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-text-muted" />
                    <div>
                      <div className="text-sm font-medium text-text-primary">Email</div>
                      <div className="text-xs text-text-muted">Receive via email</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key].email}
                    onChange={(e) => updatePreference(key, 'email', e.target.checked)}
                    className="w-5 h-5 text-accent rounded"
                  />
                </label>

                {/* In-app toggle */}
                <label className="flex items-center justify-between p-3 bg-bg-alt rounded-none cursor-pointer hover:bg-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-text-muted" />
                    <div>
                      <div className="text-sm font-medium text-text-primary">In-App</div>
                      <div className="text-xs text-text-muted">Show in notification center</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key].in_app}
                    onChange={(e) => updatePreference(key, 'in_app', e.target.checked)}
                    className="w-5 h-5 text-accent rounded"
                  />
                </label>

                {/* Frequency selector for career insights */}
                {key === 'career_insight' && (
                  <div className="p-3 bg-bg-alt rounded-none">
                    <div className="text-sm font-medium text-text-primary mb-2">Email Frequency</div>
                    <div className="flex gap-2">
                      {(['immediate', 'daily', 'weekly'] as const).map(freq => (
                        <button
                          key={freq}
                          onClick={() => updatePreference(key, 'frequency', freq)}
                          className={`px-3 py-1.5 rounded-none text-sm font-medium transition-all ${
                            preferences[key].frequency === freq
                              ? 'bg-accent text-white'
                              : 'bg-bg text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Email digest section */}
      <div className="bg-card rounded-none border border-card-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-none bg-accent/10 text-accent">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="font-medium text-text-primary">Email Digest</div>
            <div className="text-sm text-text-muted">Consolidate notifications into scheduled emails</div>
          </div>
        </div>

        <div className="pl-[72px]">
          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              className="w-5 h-5 text-accent rounded"
              defaultChecked
            />
            <span className="text-sm text-text-primary">Enable email digest</span>
          </label>

          <div className="flex gap-2">
            {['Immediate', 'Daily', 'Weekly'].map(freq => (
              <button
                key={freq}
                className="px-3 py-1.5 rounded-none text-sm font-medium bg-bg-alt text-text-muted hover:text-text-primary transition-colors"
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quiet hours */}
      <div className="bg-card rounded-none border border-card-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-none bg-gray-500/10 text-gray-500">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="font-medium text-text-primary">Quiet Hours</div>
            <div className="text-sm text-text-muted">Pause notifications during specific hours</div>
          </div>
        </div>

        <div className="pl-[72px]">
          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              className="w-5 h-5 text-accent rounded"
            />
            <span className="text-sm text-text-primary">Enable quiet hours</span>
          </label>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">From</label>
              <input
                type="time"
                defaultValue="22:00"
                className="px-3 py-2 bg-bg border border-border rounded-none text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">To</label>
              <input
                type="time"
                defaultValue="08:00"
                className="px-3 py-2 bg-bg border border-border rounded-none text-text-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Preferences saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}