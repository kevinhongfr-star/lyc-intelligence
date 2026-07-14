import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Bell,
  BellOff,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Smartphone,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import {
  NotificationPreferences as NotificationPrefs,
  NotificationType,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  DigestMode,
  NotificationChannel,
  getDefaultPreferences,
} from '@/services/notifications/notificationService';

interface NotificationPreferencesProps {
  userId: string;
  initialPreferences?: NotificationPrefs;
  onSave?: (prefs: NotificationPrefs) => Promise<boolean>;
}

type ChannelToggle = 'in_app' | 'email' | 'push' | 'sms';

const CHANNELS: Array<{ id: ChannelToggle; label: string; icon: React.ReactNode }> = [
  { id: 'in_app', label: 'In-App', icon: <Bell className="w-4 h-4" /> },
  { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { id: 'push', label: 'Push', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'sms', label: 'SMS', icon: <MessageSquare className="w-4 h-4" /> },
];

const DIGEST_OPTIONS: Array<{ value: DigestMode; label: string; description: string }> = [
  { value: 'instant', label: 'Instant', description: 'Send notifications as they happen' },
  { value: 'digest_daily', label: 'Daily Digest', description: 'Batch into a daily summary' },
  { value: 'digest_weekly', label: 'Weekly Digest', description: 'Batch into a weekly summary' },
];

export function NotificationPreferences({ userId, initialPreferences, onSave }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPrefs>(
    initialPreferences || getDefaultPreferences(userId)
  );
  const [isLoading, setIsLoading] = useState(!initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'general' | 'types' | 'digest' | 'quiet'>('general');

  const notificationsByCategory = useMemo(() => {
    const groups: Record<string, typeof NOTIFICATION_TYPES> = {};
    NOTIFICATION_TYPES.forEach(n => {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    });
    return groups;
  }, []);

  useEffect(() => {
    if (initialPreferences) return;
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
  }, [userId, initialPreferences]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleChannel = (type: NotificationType, channel: ChannelToggle) => {
    setPreferences(prev => {
      const current = prev.typeSettings[type] || { in_app: false, email: false, push: false, sms: false };
      return {
        ...prev,
        typeSettings: {
          ...prev.typeSettings,
          [type]: {
            ...current,
            [channel]: !current[channel],
          },
        },
      };
    });
    setSaveStatus('idle');
  };

  const setGlobalToggle = (key: 'globalEmailEnabled' | 'globalPushEnabled' | 'globalSmsEnabled', value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const setQuietHoursToggle = (value: boolean) => {
    setPreferences(prev => ({ ...prev, quietHoursEnabled: value }));
    setSaveStatus('idle');
  };

  const setQuietHoursTime = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const setDigestMode = (mode: DigestMode) => {
    setPreferences(prev => ({ ...prev, digestMode: mode }));
    setSaveStatus('idle');
  };

  const setCategoryAll = (category: string, channel: ChannelToggle, value: boolean) => {
    const types = notificationsByCategory[category] || [];
    setPreferences(prev => {
      const newTypeSettings = { ...prev.typeSettings };
      types.forEach(t => {
        const current = newTypeSettings[t.type] || { in_app: false, email: false, push: false, sms: false };
        newTypeSettings[t.type] = { ...current, [channel]: value };
      });
      return { ...prev, typeSettings: newTypeSettings };
    });
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveError(null);

    try {
      if (onSave) {
        const success = await onSave(preferences);
        if (!success) throw new Error('Failed to save');
      } else {
        const response = await fetch(`/api/data/notification-preferences/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to save preferences');
        }
      }
      setSaveStatus('success');
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

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
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
          <p className="text-sm text-text-muted mt-1">
            Customize how and when you receive notifications.
          </p>
        </div>

        <div className="flex gap-1 p-1 bg-bg-alt rounded-none w-fit">
          {[
            { id: 'general', label: 'General' },
            { id: 'types', label: 'By Type' },
            { id: 'digest', label: 'Digest' },
            { id: 'quiet', label: 'Quiet Hours' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium rounded-none transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Global Settings
            </h3>
            <div className="space-y-3">
              {CHANNELS.filter(c => c.id !== 'in_app').map(channel => {
                const keyMap: Record<string, 'globalEmailEnabled' | 'globalPushEnabled' | 'globalSmsEnabled'> = {
                  email: 'globalEmailEnabled',
                  push: 'globalPushEnabled',
                  sms: 'globalSmsEnabled',
                };
                const key = keyMap[channel.id];
                const enabled = preferences[key];

                return (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 bg-bg-alt rounded-none"
                  >
                    <div className="flex items-center gap-3">
                      {channel.icon}
                      <div>
                        <p className="font-medium text-text-primary text-sm">{channel.label} Notifications</p>
                        <p className="text-xs text-text-muted">
                          {channel.id === 'email' && 'Receive notifications via email'}
                          {channel.id === 'push' && 'Receive browser push notifications'}
                          {channel.id === 'sms' && 'Receive SMS for critical alerts only'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setGlobalToggle(key, !enabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        enabled ? 'bg-primary' : 'bg-gray-300'
                      }`}
                      aria-label={`Toggle ${channel.label}`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bell className="w-4 h-4" />
              By Notification Type
            </h3>
            <p className="text-xs text-text-muted">
              Configure notification channels for each type of alert.
            </p>
            <div className="space-y-2">
              {NOTIFICATION_CATEGORIES.map(category => {
                const types = notificationsByCategory[category.id] || [];
                if (types.length === 0) return null;
                const expanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id} className="border border-border rounded-none overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 bg-bg-alt hover:bg-bg-alt/80 transition-colors"
                    >
                      <span className="font-medium text-text-primary text-sm">{category.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{types.length} types</span>
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="divide-y divide-border">
                        <div className="flex items-center justify-end gap-4 px-3 py-2 bg-bg-alt/50 border-b border-border">
                          {CHANNELS.map(channel => (
                            <button
                              key={channel.id}
                              onClick={() => setCategoryAll(category.id, channel.id, true)}
                              className="text-[10px] text-text-muted hover:text-primary"
                              title={`Enable all ${channel.label}`}
                            >
                              All {channel.label}
                            </button>
                          ))}
                        </div>
                        {types.map(ntype => {
                          const settings = preferences.typeSettings[ntype.type] || {
                            in_app: false,
                            email: false,
                            push: false,
                            sms: false,
                          };

                          return (
                            <div
                              key={ntype.type}
                              className="flex items-center justify-between px-3 py-2.5 hover:bg-bg-alt/30"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="text-sm font-medium text-text-primary">{ntype.label}</p>
                                <p className="text-xs text-text-muted truncate">{ntype.description}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {CHANNELS.map(channel => {
                                  const isDisabled =
                                    (channel.id === 'email' && !preferences.globalEmailEnabled) ||
                                    (channel.id === 'push' && !preferences.globalPushEnabled) ||
                                    (channel.id === 'sms' && !preferences.globalSmsEnabled);
                                  const isActive = settings[channel.id];

                                  return (
                                    <button
                                      key={channel.id}
                                      onClick={() => toggleChannel(ntype.type, channel.id)}
                                      disabled={isDisabled && channel.id !== 'in_app'}
                                      className={`w-8 h-5 rounded-full transition-colors relative ${
                                        isActive
                                          ? 'bg-primary'
                                          : isDisabled
                                          ? 'bg-gray-200 cursor-not-allowed'
                                          : 'bg-gray-300'
                                      }`}
                                      title={`${channel.label}: ${isActive ? 'On' : 'Off'}`}
                                    >
                                      <span
                                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                          isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'digest' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Digest Mode
            </h3>
            <p className="text-xs text-text-muted">
              Choose how often you want to receive notification summaries.
            </p>
            <div className="grid gap-3">
              {DIGEST_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDigestMode(opt.value)}
                  className={`p-4 text-left rounded-none border-2 transition-colors ${
                    preferences.digestMode === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <p className="font-medium text-text-primary text-sm">{opt.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>

            {preferences.digestMode !== 'instant' && (
              <div className="p-4 bg-bg-alt rounded-none">
                <label className="text-sm font-medium text-text-primary block mb-2">
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={preferences.digestDeliveryTime}
                  onChange={(e) => setPreferences(prev => ({ ...prev, digestDeliveryTime: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-none text-sm bg-white"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiet' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Quiet Hours
            </h3>
            <p className="text-xs text-text-muted">
              Pause non-critical notifications during these hours.
            </p>

            <div className="flex items-center justify-between p-4 bg-bg-alt rounded-none">
              <div>
                <p className="font-medium text-text-primary text-sm">Enable Quiet Hours</p>
                <p className="text-xs text-text-muted">Critical alerts will still come through</p>
              </div>
              <button
                onClick={() => setQuietHoursToggle(!preferences.quietHoursEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  preferences.quietHoursEnabled ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-bg-alt rounded-none">
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => setQuietHoursTime('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-none text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => setQuietHoursTime('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-none text-sm bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.quietHoursTimezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursTimezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-none text-sm bg-white"
                  >
                    <option value="Asia/Shanghai">Asia/Shanghai (Beijing)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-none text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm">Preferences saved successfully</span>
          </div>
        )}

        {saveStatus === 'error' && saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{saveError}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
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
