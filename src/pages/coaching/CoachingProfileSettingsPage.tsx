/**
 * CoachingProfileSettingsPage — B2C Coaching Portal profile & settings
 * Renders inside AppShell → Outlet. Shows user profile management,
 * preferences, and account settings.
 */
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Bell, Lock, Globe, Save, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  company: string;
  bio: string;
  timezone: string;
  language: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const MOCK_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'n1', label: 'Session Reminders', description: 'Get notified 1 hour before coaching sessions', enabled: true },
  { id: 'n2', label: 'Weekly Progress Reports', description: 'Receive weekly progress summary emails', enabled: true },
  { id: 'n3', label: 'New Resources', description: 'Be notified when new resources are added', enabled: false },
  { id: 'n4', label: 'Coach Messages', description: 'Instant notifications for coach messages', enabled: true },
  { id: 'n5', label: 'Community Activity', description: 'Updates from your coaching community', enabled: false },
];

export function CoachingProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { profile: authProfile } = useTenantContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile({
        name: authProfile?.name || 'Coachee User',
        email: authProfile?.email || 'coachee@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        title: 'Senior Engineering Manager',
        company: 'TechCorp Inc.',
        bio: 'Passionate engineering leader with 10+ years of experience building scalable systems and high-performing teams.',
        timezone: 'America/Los_Angeles',
        language: 'English',
      });
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [authProfile]);

  const displayName = authProfile?.name || 'Coachee';
  const tier = authProfile?.tier || 'Professional';

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
  };

  const handleSave = () => {
    setEditing(false);
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
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading profile...</div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Full Name</label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Email</label>
                    <Input
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Phone</label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Location</label>
                    <Input
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Current Title</label>
                    <Input
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Company</label>
                    <Input
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border bg-white text-sm text-text-primary focus:outline-none focus:border-fuchsia rounded-md disabled:bg-bg-warm disabled:text-text-secondary"
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!editing}
                  />
                </div>
              </div>
            ) : null}
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
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading settings...</div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingProfileSettingsPage;
