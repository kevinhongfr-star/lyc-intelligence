/**
 * ClientAdminPage — B2B Client Portal admin & security
 * Renders inside AppShell → Outlet. Shows user management,
 * permissions, and security settings.
 */
import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Key, Lock, Activity, User, Edit, Trash2, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getClientTeamMembers, type ClientTeamMember } from '@/services/supabaseApi';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'client_admin' | 'client_user';
  status: 'Active' | 'Invited' | 'Inactive';
  lastLogin: string;
}

interface SecuritySetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const STATIC_SETTINGS: SecuritySetting[] = [
  { id: 's1', label: 'Two-Factor Authentication', description: 'Require 2FA for all user logins', enabled: true },
  { id: 's2', label: 'Session Timeout', description: 'Auto-logout after 30 minutes of inactivity', enabled: true },
  { id: 's3', label: 'IP Whitelisting', description: 'Restrict access to specific IP ranges', enabled: false },
  { id: 's4', label: 'Audit Logs', description: 'Track all user actions and access', enabled: true },
  { id: 's5', label: 'Single Sign-On', description: 'Enable SSO via SAML 2.0', enabled: false },
  { id: 's6', label: 'Password Policy', description: 'Enforce strong password requirements', enabled: true },
];

export function ClientAdminPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<SecuritySetting[]>(STATIC_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { clientAccount, profile } = useTenantContext();

  useEffect(() => {
    const organization = clientAccount?.organization;
    if (!organization) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const data = await getClientTeamMembers(organization);
        if (cancelled) return;
        const mapped: TeamMember[] = data.map((m: ClientTeamMember) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.is_active ? 'Active' : 'Inactive',
          lastLogin: '—',
        }));
        setMembers(mapped);
      } catch (e) {
        console.error('[ClientAdminPage] Error:', e);
        if (!cancelled) setError('Failed to load team members');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientAccount?.organization]);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  const roleLabels: Record<string, string> = {
    client_admin: 'Admin',
    client_user: 'User',
  };

  const roleColors: Record<string, string> = {
    client_admin: 'bg-fuchsia/10 text-fuchsia',
    client_user: 'bg-blue/10 text-blue',
  };

  const statusColors: Record<string, string> = {
    Active: 'bg-green/10 text-green',
    Invited: 'bg-amber/10 text-amber',
    Inactive: 'bg-text-muted/10 text-text-muted',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Admin & Security</h1>
            <p className="text-text-secondary text-sm mt-1">Manage team members, permissions, and security settings.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{organization}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : members.length}</div>
              <div className="text-xs text-text-muted">Team Members</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{settings.filter(s => s.enabled).length}</div>
              <div className="text-xs text-text-muted">Security Features</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">24</div>
              <div className="text-xs text-text-muted">Active Sessions</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia" />
                <CardTitle>Team Members</CardTitle>
              </div>
              <Button size="sm">
                <User className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading team members...</div>
            ) : error ? (
              <EmptyState title="Failed to load team members" description={error} />
            ) : filteredMembers.length === 0 ? (
              <EmptyState title="No team members found" description="No team members match your search." />
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-fuchsia-light flex items-center justify-center">
                        <User className="w-5 h-5 text-fuchsia" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm">{member.name}</div>
                        <div className="text-xs text-text-muted">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={roleColors[member.role]}>{roleLabels[member.role]}</Badge>
                        <div className="text-xs text-text-muted mt-1">Last login: {member.lastLogin}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === member.id ? (
                          <>
                            <button className="p-2 hover:bg-green/10 rounded-lg text-green">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 hover:bg-red/10 rounded-lg text-red">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingId(member.id)} className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red/10 rounded-lg text-text-secondary hover:text-red">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-fuchsia" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-bg-warm rounded-lg">
                    <div>
                      <div className="font-medium text-text-primary text-sm">{setting.label}</div>
                      <div className="text-xs text-text-muted mt-1">{setting.description}</div>
                    </div>
                    <button
                      onClick={() => toggleSetting(setting.id)}
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-fuchsia" />
            <CardTitle>Access Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-bg-warm rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5 text-fuchsia" />
                <span className="font-medium text-text-primary">API Keys</span>
              </div>
              <div className="text-sm text-text-muted mb-3">Manage API access tokens for integrations.</div>
              <Button variant="outline" size="sm">View Keys</Button>
            </div>
            <div className="p-4 bg-bg-warm rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-fuchsia" />
                <span className="font-medium text-text-primary">Audit Logs</span>
              </div>
              <div className="text-sm text-text-muted mb-3">Track user actions and access history.</div>
              <Button variant="outline" size="sm">View Logs</Button>
            </div>
            <div className="p-4 bg-bg-warm rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Settings className="w-5 h-5 text-fuchsia" />
                <span className="font-medium text-text-primary">System Preferences</span>
              </div>
              <div className="text-sm text-text-muted mb-3">Configure organization-wide settings.</div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientAdminPage;