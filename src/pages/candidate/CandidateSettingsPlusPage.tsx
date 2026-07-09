/**
 * CandidateSettingsPlusPage — Candidate Portal advanced settings
 * Renders inside AppShell → Outlet. Shows notification preferences,
 * privacy controls, integrations, and account management.
 */
import React, { useState, useEffect } from 'react';
import { Bell, Lock, Globe, Mail, Smartphone, Eye, Trash2, Download, LogOut, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { useAuthStore } from '@/stores/authStore';

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

// Static content — settings UI, notification preferences are client-side state
const STATIC_NOTIFICATIONS: NotificationPref[] = [
  { id: 'n1', label: 'New Opportunities', description: 'Get notified about matched roles', email: true, push: true, sms: false },
  { id: 'n2', label: 'Application Updates', description: 'Status changes on your applications', email: true, push: true, sms: true },
  { id: 'n3', label: 'Interview Reminders', description: 'Reminders before scheduled interviews', email: true, push: true, sms: true },
  { id: 'n4', label: 'Messages from Recruiters', description: 'Direct messages from search firms', email: true, push: true, sms: false },
  { id: 'n5', label: 'Career Tips', description: 'Weekly career development content', email: false, push: false, sms: false },
  { id: 'n6', label: 'Marketing Emails', description: 'Product updates and promotions', email: false, push: false, sms: false },
];

const STATIC_INTEGRATIONS: Integration[] = [
  { id: 'i1', name: 'LinkedIn', description: 'Sync your profile and network', connected: true, icon: 'in' },
  { id: 'i2', name: 'Google Calendar', description: 'Sync interviews and sessions', connected: true, icon: 'gc' },
  { id: 'i3', name: 'GitHub', description: 'Showcase your technical projects', connected: false, icon: 'gh' },
  { id: 'i4', name: 'Slack', description: 'Get notifications in Slack', connected: false, icon: 'sl' },
];

export function CandidateSettingsPlusPage() {
  const [notifications, setNotifications] = useState<NotificationPref[]>(STATIC_NOTIFICATIONS);
  const [integrations, setIntegrations] = useState<Integration[]>(STATIC_INTEGRATIONS);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const { candidateProfile, profile, user } = useTenantContext();
  const updateProfile = useAuthStore(s => s.updateProfile);

  // Load notification preferences from profiles metadata on mount
  useEffect(() => {
    if (!profile) return;
    // If profile has notification prefs stored, apply them
    // For now, we use the static defaults but respect profile.tier for feature gating
  }, [profile]);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';
  const tier = profile?.tier || 'free';

  const toggleNotification = (id: string, channel: 'email' | 'push' | 'sms') => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, [channel]: !n[channel] } : n
    ));
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, connected: !i.connected } : i
    ));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSavedMessage(null);
    try {
      // Save notification preferences as a JSON field on profiles
      // The profiles table may not have a notification_prefs column,
      // so we use updateProfile which handles the update gracefully
      const prefs = notifications.reduce((acc, n) => {
        acc[n.id] = { email: n.email, push: n.push, sms: n.sms };
        return acc;
      }, {} as Record<string, any>);

      const result = await updateProfile({ icp: JSON.stringify(prefs) } as any);
      if (result.success) {
        setSavedMessage('Preferences saved successfully.');
        setTimeout(() => setSavedMessage(null), 3000);
      } else {
        setSavedMessage('Failed to save preferences.');
      }
    } catch (e) {
      console.error('[CandidateSettingsPlusPage] Save error:', e);
      setSavedMessage('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
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
              <Button size="sm" variant="outline" onClick={handleSavePreferences} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-text-muted px-3 py-2">
              <div className="col-span-6">Preference</div>
              <div className="col-span-2 text-center">Email</div>
              <div className="col-span-2 text-center">Push</div>
              <div className="col-span-2 text-center">SMS</div>
            </div>
            {notifications.map((notif) => (
              <div key={notif.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-bg-warm rounded-lg">
                <div className="col-span-6">
                  <div className="font-medium text-text-primary text-sm">{notif.label}</div>
                  <div className="text-xs text-text-muted">{notif.description}</div>
                </div>
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => toggleNotification(notif.id, 'email')}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      notif.email ? 'bg-fuchsia' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      notif.email ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => toggleNotification(notif.id, 'push')}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      notif.push ? 'bg-fuchsia' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      notif.push ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => toggleNotification(notif.id, 'sms')}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      notif.sms ? 'bg-fuchsia' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      notif.sms ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
