import React, { useState, useEffect } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';
import { supabase } from '@/lib/supabase/client';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalOrganizations: number;
  monthlyRevenue: number;
  systemUptime: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization_id?: string;
  created_at: string;
  last_login_at?: string;
}

interface Organization {
  id: string;
  name: string;
  tier: string;
  status: string;
  created_at: string;
  userCount: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  actor: string;
  amount?: number;
  timestamp: string;
}

interface RevenueData {
  month: string;
  recurring: number;
  oneTime: number;
}

interface SystemService {
  name: string;
  status: string;
  latency: number;
}

export const PlatformAdminConsolePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemHealth, setSystemHealth] = useState<{ services: SystemService[]; uptime: string } | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const [statsRes, usersRes, orgsRes, revenueRes, activityRes, healthRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/organizations'),
        fetch('/api/admin/revenue'),
        fetch('/api/admin/activity'),
        fetch('/api/admin/system-health'),
      ]);

      const [statsJson, usersJson, orgsJson, revenueJson, activityJson, healthJson] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        orgsRes.json(),
        revenueRes.json(),
        activityRes.json(),
        healthRes.json(),
      ]);

      if (statsJson.success) setStats(statsJson.data);
      if (usersJson.success) setUsers(usersJson.users);
      if (orgsJson.success) setOrganizations(orgsJson.organizations);
      if (revenueJson.success) setRevenue(revenueJson.revenue);
      if (activityJson.success) setActivities(activityJson.activities);
      if (healthJson.success) setSystemHealth(healthJson);
    } catch (e) {
      console.error('[PlatformAdminConsole] Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString('en-US');
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid', borderColor: COLORS.border, borderTopColor: COLORS.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <Heading level={2}>Loading admin data...</Heading>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: `${SPACING[4]}px` }}>
            <div>
              <Heading level={1}>Platform Admin Console</Heading>
              <Paragraph color="textSecondary">System-wide management, analytics, and governance</Paragraph>
            </div>
            <Button onClick={fetchAdminData}>Refresh Data</Button>
          </div>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <Tabs>
            <Tab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </Tab>
            <Tab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              Users ({users.length})
            </Tab>
            <Tab active={activeTab === 'organizations'} onClick={() => setActiveTab('organizations')}>
              Organizations ({organizations.length})
            </Tab>
            <Tab active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')}>
              Revenue Analytics
            </Tab>
            <Tab active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
              System Health
            </Tab>
          </Tabs>

          <div style={{ marginTop: `${SPACING[6]}px` }}>
            {activeTab === 'dashboard' && (
              <div>
                <Grid columns={4} gap="6" style={{ marginBottom: `${SPACING[10]}px` }}>
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers.toLocaleString() || '0'}
                    change={{ value: `+${stats?.newUsersThisMonth || 0} this month`, positive: true }}
                  />
                  <StatCard
                    title="Active Organizations"
                    value={stats?.totalOrganizations.toLocaleString() || '0'}
                    change={{ value: '+8%', positive: true }}
                  />
                  <StatCard
                    title="Revenue This Month"
                    value={formatCurrency(stats?.monthlyRevenue || 0)}
                    change={{ value: '+15%', positive: true }}
                  />
                  <StatCard
                    title="System Uptime"
                    value={stats?.systemUptime || '0%'}
                    change={{ value: '0.1%', positive: true }}
                  />
                </Grid>

                <Grid columns={2} gap="6">
                  <Card padding="6">
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Recent Activity</Heading>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                      {activities.map((activity) => (
                        <div key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{activity.message}</div>
                            <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                              {activity.actor} {activity.amount ? `| ${formatCurrency(activity.amount)}` : ''}
                            </div>
                          </div>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {formatDateTime(activity.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card padding="6">
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Top Organizations</Heading>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                      {organizations.slice(0, 5).map((org) => (
                        <div key={org.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{org.name}</div>
                            <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                              {org.tier} | {org.userCount} users
                            </div>
                          </div>
                          <Badge variant={org.status === 'active' ? 'success' : 'warning'}>{org.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Grid>
              </div>
            )}

            {activeTab === 'users' && (
              <Card padding="6">
                <div style={{ marginBottom: `${SPACING[6]}px` }}>
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                  {filteredUsers.map((user) => (
                    <Card key={user.id} padding="6" variant="outline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.full_name || user.email}</div>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {user.email} | {user.role}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[4]}px`, alignItems: 'center' }}>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            Last login: {formatDate(user.last_login_at)}
                          </div>
                          <Badge variant="success">active</Badge>
                          <Button size="sm" variant="ghost">View</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'organizations' && (
              <Card padding="6">
                <div style={{ marginBottom: `${SPACING[6]}px` }}>
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                  {filteredOrgs.map((org) => (
                    <Card key={org.id} padding="6" variant="outline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{org.name}</div>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {org.tier} | {org.userCount} users | Created: {formatDate(org.created_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                          <Badge variant={org.status === 'active' ? 'success' : 'warning'}>{org.status}</Badge>
                          <Button size="sm">Manage</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'revenue' && (
              <Card padding="6">
                <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Revenue Overview</Heading>
                <Card padding="6" variant="outline">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                        <th style={{ textAlign: 'left', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Month</th>
                        <th style={{ textAlign: 'right', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Recurring</th>
                        <th style={{ textAlign: 'right', padding: `${SPACING[4]}px`, fontWeight: 600 }}>One-Time</th>
                        <th style={{ textAlign: 'right', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.map((row) => (
                        <tr key={row.month} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: `${SPACING[4]}px`, fontWeight: 600 }}>{row.month}</td>
                          <td style={{ padding: `${SPACING[4]}px`, textAlign: 'right', color: COLORS.textSecondary }}>{formatCurrency(row.recurring)}</td>
                          <td style={{ padding: `${SPACING[4]}px`, textAlign: 'right', color: COLORS.textSecondary }}>{formatCurrency(row.oneTime)}</td>
                          <td style={{ padding: `${SPACING[4]}px`, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(row.recurring + row.oneTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </Card>
            )}

            {activeTab === 'system' && (
              <Grid columns={2} gap="6">
                <Card padding="6">
                  <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Server Status</Heading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                    {systemHealth?.services.map((service) => (
                      <div key={service.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 500 }}>{service.name}</div>
                        <div style={{ display: 'flex', gap: `${SPACING[4]}px` }}>
                          <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>{service.latency}ms</span>
                          <Badge variant={service.status === 'healthy' ? 'success' : 'error'}>{service.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="6">
                  <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>System Metrics</Heading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 500 }}>Uptime</div>
                      <div style={{ fontSize: `${SPACING[4]}px`, fontWeight: 600, color: COLORS.success }}>{systemHealth?.uptime || 'N/A'}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 500 }}>Active Users</div>
                      <div style={{ fontSize: `${SPACING[4]}px`, fontWeight: 600 }}>{stats?.activeUsers.toLocaleString() || '0'}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 500 }}>Organizations</div>
                      <div style={{ fontSize: `${SPACING[4]}px`, fontWeight: 600 }}>{stats?.totalOrganizations.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                </Card>
              </Grid>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
};
