/**
 * CoachingProfileSettingsPage — B2C Coaching Portal profile & settings
 * Renders inside AppShell → Outlet. Shows user profile management,
 * preferences, and account settings.
 */
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Bell, Lock, Globe, Save, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getSupabase } from '@/services/supabaseApi';

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

const STATIC_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'n1', label: 'Session Reminders', description: 'Get notified 1 hour before coaching sessions', enabled: true },
  { id: 'n2', label: 'Weekly Progress Reports', description: 'Receive weekly progress summary emails', enabled: true },
  { id: 'n3', label: 'New Resources', description: 'Be notified when new resources are added', enabled: false },
  { id: 'n4', label: 'Coach Messages', description: 'Instant notifications for coach messages', enabled: true },
  { id: 'n5', label: 'Community Activity', description: 'Updates from your coaching community', enabled: false },
];

export function CoachingProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSetting[]>(STATIC_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { profile: authProfile, candidateProfile } = useTenantContext();

  useEffect(() => {
    const contactId = candidateProfile?.id || authProfile?.id;
    if (!contactId) {
      setLoading(false);
      setError('Unable to identify your contact record.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabase();
        const { data, error: sbError } = await sb
          .from('contacts')
          .select('*, company:companies(*)')
          .eq('id', contactId)
          .single();
        if (cancelled) return;
        if (sbError || !data) {
          console.error('[CoachingProfileSettingsPage] Error:', sbError);
          setError('Failed to load profile');
          setLoading(false);
          return;
        }
        const c = data as {
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          city?: string | null;
          current_title?: string | null;
          summary?: string | null;
          bio?: string | null;
          company?: { name?: string | null } | null;
        };
        setProfile({
          name: c.name || candidateProfile?.name || 'Coachee User',
          email: c.email || candidateProfile?.email || '',
          phone: c.phone ?? '',
          location: c.location || c.city || candidateProfile?.location || '',
          title: c.current_title || candidateProfile?.current_title || '',
          company: c.company?.name || '',
          bio: c.bio || c.summary || '',
          timezone: 'America/Los_Angeles',
          language: 'English',
        });
        setError(null);
      } catch (e) {
        console.error('[CoachingProfileSettingsPage] Error:', e);
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateProfile, authProfile]);

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
            ) : error || !profile ? (
              <EmptyState title="Profile unavailable" description={error || 'We could not load your profile information.'} />
            ) : (
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
