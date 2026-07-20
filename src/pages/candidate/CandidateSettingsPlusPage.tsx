/**
 * CandidateSettingsPlusPage — Candidate Portal advanced settings
 * Renders inside AppShell → Outlet. Shows notification preferences,
 * privacy controls, integrations, and account management.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Lock, Globe, Mail, Smartphone, Eye, Trash2, Download, LogOut, User, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import {
  getUserPreferences,
  saveUserPreferences,
  type NotificationPreferences as NotificationPrefs,
  type NotificationType,
  type NotificationChannel,
} from '@/services/notifications/notificationService';

/**
 * Map each candidate-facing toggle to a notification type.
 * Each toggle controls email/push/sms channels for that type.
 */
const CANDIDATE_TOGGLE_CONFIG: Array<{
  id: string;
  label: string;
  description: string;
  type: NotificationType;
}> = [
  { id: 'n1', label: 'New Opportunities', description: 'Get notified about matched roles', type: 'candidate_advanced' },
  { id: 'n2', label: 'Application Updates', description: 'Status changes on your applications', type: 'status_change' },
  { id: 'n3', label: 'Interview Reminders', description: 'Reminders before scheduled interviews', type: 'reminder' },
  { id: 'n4', label: 'Messages from Recruiters', description: 'Direct messages from search firms', type: 'message_received' },
  { id: 'n5', label: 'Career Tips', description: 'Weekly career development content', type: 'coaching' },
  { id: 'n6', label: 'Marketing Emails', description: 'Product updates and promotions', type: 'billing' },
];

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

const STATIC_INTEGRATIONS: Integration[] = [
  { id: 'i1', name: 'LinkedIn', description: 'Sync your profile and network', connected: true, icon: 'in' },
  { id: 'i2', name: 'Google Calendar', description: 'Sync interviews and sessions', connected: true, icon: 'gc' },
  { id: 'i3', name: 'GitHub', description: 'Showcase your technical projects', connected: false, icon: 'gh' },
  { id: 'i4', name: 'Slack', description: 'Get notifications in Slack', connected: false, icon: 'sl' },
];

export function CandidateSettingsPlusPage() {
  const [preferences, setPreferences] = useState<NotificationPrefs | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [savingToggleId, setSavingToggleId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(STATIC_INTEGRATIONS);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const { candidateProfile, profile, user } = useTenantContext();
  const updateProfile = useAuthStore(s => s.updateProfile);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';
  const tier = profile?.tier || 'free';

  useEffect(() => {
    if (!user?.id) {
      setPrefsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setPrefsLoading(true);
      setPrefsError(null);
      try {
        const prefs = await getUserPreferences(supabase, user.id);
        if (cancelled) return;
        setPreferences(prefs);
      } catch (e) {
        console.error('[CandidateSettingsPlusPage] Failed to load preferences:', e);
        if (!cancelled) setPrefsError('Failed to load notification preferences');
      } finally {
        if (!cancelled) setPrefsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isChannelEnabled = useCallback(
    (type: NotificationType, channel: NotificationChannel): boolean => {
      if (!preferences) return false;
      const settings = preferences.typeSettings[type];
      return Boolean(settings?.[channel]);
    },
    [preferences]
  );

  const toggleNotificationChannel = async (
    toggleId: string,
    type: NotificationType,
    channel: NotificationChannel
  ) => {
    if (!preferences || !user?.id) return;

    const current = preferences.typeSettings[type] || { in_app: false, email: false, push: false, sms: false };
    const nextSettings = { ...current, [channel]: !current[channel] };
    const nextPrefs: NotificationPrefs = {
      ...preferences,
      typeSettings: { ...preferences.typeSettings, [type]: nextSettings },
    };

    setPreferences(nextPrefs);
    setSavingToggleId(`${toggleId}-${channel}`);
    try {
      const ok = await saveUserPreferences(supabase, user.id, { typeSettings: nextPrefs.typeSettings });
      if (!ok) {
        setPreferences(preferences);
        setPrefsError('Failed to save notification preference');
      } else {
        setSavedMessage('Saved');
        setTimeout(() => setSavedMessage(null), 2000);
      }
    } catch (e) {
      console.error('[CandidateSettingsPlusPage] Save preference failed:', e);
      setPreferences(preferences);
      setPrefsError('Failed to save notification preference');
    } finally {
      setSavingToggleId(null);
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, connected: !i.connected } : i
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Settings+</h1>
            <p className="text-text-secondary text-sm mt-1">Advanced preferences, privacy controls, and account management.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-fuchsia" />
              <CardTitle>Notification Channels</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className="text-xs text-green">{savedMessage}</span>
              )}
              {preferences && (
                <Badge variant="outline" className="text-xs">
                  Digest: {preferences.digestMode.replace('digest_', '')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {prefsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse h-14 bg-bg-tertiary rounded-lg" />
              ))}
            </div>
          ) : prefsError ? (
            <div className="py-6 text-center text-red text-sm">{prefsError}</div>
          ) : !preferences ? (
            <div className="py-6 text-center text-text-muted text-sm">
              Sign in to manage notification preferences.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-text-muted px-3 py-2">
                <div className="col-span-6">Preference</div>
                <div className="col-span-2 text-center">Email</div>
                <div className="col-span-2 text-center">Push</div>
                <div className="col-span-2 text-center">SMS</div>
              </div>
              {CANDIDATE_TOGGLE_CONFIG.map((setting) => {
                const emailEnabled = isChannelEnabled(setting.type, 'email');
                const pushEnabled = isChannelEnabled(setting.type, 'push');
                const smsEnabled = isChannelEnabled(setting.type, 'sms');
                const savingEmail = savingToggleId === `${setting.id}-email`;
                const savingPush = savingToggleId === `${setting.id}-push`;
                const savingSms = savingToggleId === `${setting.id}-sms`;
                return (
                  <div key={setting.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-bg-warm rounded-lg">
                    <div className="col-span-6">
                      <div className="font-medium text-text-primary text-sm">{setting.label}</div>
                      <div className="text-xs text-text-muted">{setting.description}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => toggleNotificationChannel(setting.id, setting.type, 'email')}
                        disabled={savingEmail}
                        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
                          emailEnabled ? 'bg-fuchsia' : 'bg-bg-tertiary'
                        }`}
                        aria-pressed={emailEnabled}
                        aria-label={`${setting.label} email`}
                      >
                        {savingEmail ? (
                          <Loader2 className="absolute top-0.5 left-0.5 w-4 h-4 animate-spin text-white" />
                        ) : (
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            emailEnabled ? 'left-5' : 'left-0.5'
                          }`} />
                        )}
                      </button>
                    </div>
                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => toggleNotificationChannel(setting.id, setting.type, 'push')}
                        disabled={savingPush}
                        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
                          pushEnabled ? 'bg-fuchsia' : 'bg-bg-tertiary'
                        }`}
                        aria-pressed={pushEnabled}
                        aria-label={`${setting.label} push`}
                      >
                        {savingPush ? (
                          <Loader2 className="absolute top-0.5 left-0.5 w-4 h-4 animate-spin text-white" />
                        ) : (
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            pushEnabled ? 'left-5' : 'left-0.5'
                          }`} />
                        )}
                      </button>
                    </div>
                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => toggleNotificationChannel(setting.id, setting.type, 'sms')}
                        disabled={savingSms}
                        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
                          smsEnabled ? 'bg-fuchsia' : 'bg-bg-tertiary'
                        }`}
                        aria-pressed={smsEnabled}
                        aria-label={`${setting.label} sms`}
                      >
                        {savingSms ? (
                          <Loader2 className="absolute top-0.5 left-0.5 w-4 h-4 animate-spin text-white" />
                        ) : (
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            smsEnabled ? 'left-5' : 'left-0.5'
                          }`} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-text-muted pt-2">
                Toggles control email/push/sms delivery for each category. Quiet hours and digest mode apply globally.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-fuchsia" />
              <CardTitle>Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center font-bold text-fuchsia">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{integration.name}</div>
                      <div className="text-xs text-text-muted">{integration.description}</div>
                    </div>
                  </div>
                  <Button
                    variant={integration.connected ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleIntegration(integration.id)}
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-fuchsia" />
              <CardTitle>Privacy & Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download My Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Profile Visibility Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Email Preferences
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Smartphone className="w-4 h-4 mr-2" />
                Two-Factor Authentication
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red" />
            <CardTitle className="text-red">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-red/5 border border-red/20 rounded-lg">
              <div>
                <div className="font-medium text-text-primary text-sm">Sign Out Everywhere</div>
                <div className="text-xs text-text-muted">End all active sessions on all devices</div>
              </div>
              <Button variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-red/5 border border-red/20 rounded-lg">
              <div>
                <div className="font-medium text-text-primary text-sm">Delete Account</div>
                <div className="text-xs text-text-muted">Permanently delete your account and all data</div>
              </div>
              <Button variant="outline" size="sm" className="text-red border-red/30">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateSettingsPlusPage;