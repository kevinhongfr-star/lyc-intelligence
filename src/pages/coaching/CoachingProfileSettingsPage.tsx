/**
 * CoachingProfileSettingsPage — B2C Coaching Portal profile & settings
 * Renders inside AppShell → Outlet. Shows user profile management,
 * preferences, and account settings.
 */
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Bell, Lock, Globe, Save, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { useAuthStore } from '@/stores/authStore';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// No DB table — UI notification toggles (stored in local state)
// TODO: Add notification_preferences JSONB column to profiles table
const STATIC_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'n1', label: 'Session Reminders', description: 'Get notified 1 hour before coaching sessions', enabled: true },
  { id: 'n2', label: 'Weekly Progress Reports', description: 'Receive weekly progress summary emails', enabled: true },
  { id: 'n3', label: 'New Resources', description: 'Be notified when new resources are added', enabled: false },
  { id: 'n4', label: 'Coach Messages', description: 'Instant notifications for coach messages', enabled: true },
  { id: 'n5', label: 'Community Activity', description: 'Updates from your coaching community', enabled: false },
];

export function CoachingProfileSettingsPage() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>(STATIC_NOTIFICATIONS);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { profile, isLoading } = useTenantContext();
  const updateProfile = useAuthStore(s => s.updateProfile);

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
  });

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateProfile({
        name: formData.name || profile.name,
      });
      if (!result.success) {
        setSaveError(result.error || 'Failed to save profile');
      } else {
        setEditing(false);
      }
    } catch (e) {
      console.error('[CoachingProfileSettingsPage] Save error:', e);
      setSaveError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Profile & Settings</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your personal information and account preferences.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{tier}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-fuchsia" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              {editing ? (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => {
                  setFormData({ name: profile?.name || '', email: profile?.email || '' });
                  setEditing(true);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading profile...</div>
            ) : !profile ? (
              <div className="py-8 text-center text-text-muted text-sm">Profile unavailable.</div>
            ) : (
              <div className="space-y-4">
                {saveError && (
                  <div className="p-3 bg-red/10 text-red text-sm rounded-md">{saveError}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Full Name</label>
                    <Input
                      value={editing ? formData.name : profile.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Email</label>
                    <Input
                      value={profile.email}
                      disabled={true}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Role</label>
                    <Input
                      value={profile.role || 'Coachee'}
                      disabled={true}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Tier</label>
                    <Input
                      value={profile.tier || 'free'}
                      disabled={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-fuchsia" />
                <CardTitle>Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Timezone</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia rounded-md"
                    disabled={!editing}
                  >
                    <option>America/Los_Angeles</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Language</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia rounded-md"
                    disabled={!editing}
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-fuchsia" />
                <CardTitle>Account Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Two-Factor Auth
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-fuchsia" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 bg-bg-warm rounded-lg">
                <div>
                  <div className="font-medium text-text-primary text-sm">{setting.label}</div>
                  <div className="text-xs text-text-muted mt-1">{setting.description}</div>
                </div>
                <button
                  onClick={() => toggleNotification(setting.id)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    setting.enabled ? 'bg-fuchsia' : 'bg-bg-tertiary'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    setting.enabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingProfileSettingsPage;
