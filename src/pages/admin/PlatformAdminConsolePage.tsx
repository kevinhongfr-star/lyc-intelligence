import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const systemStats = [
  { title: 'Total Users', value: '12,500', change: { value: '+12%', positive: true } },
  { title: 'Active Organizations', value: '200+', change: { value: '+8%', positive: true } },
  { title: 'Revenue This Month', value: '$245K', change: { value: '+15%', positive: true } },
  { title: 'System Uptime', value: '99.9%', change: { value: '0.1%', positive: true } },
];

const users = [
  { id: 'U001', name: 'John Smith', email: 'john@lyc.com', role: 'Admin', status: 'active', lastLogin: '2024-01-20' },
  { id: 'U002', name: 'Sarah Chen', email: 'sarah@techcorp.com', role: 'Client', status: 'active', lastLogin: '2024-01-19' },
  { id: 'U003', name: 'Michael Tan', email: 'michael@fintech.com', role: 'Council Member', status: 'active', lastLogin: '2024-01-18' },
  { id: 'U004', name: 'Emily Wang', email: 'emily@healthcare.com', role: 'Client', status: 'inactive', lastLogin: '2024-01-10' },
  { id: 'U005', name: 'David Kim', email: 'david@retail.com', role: 'Consultant', status: 'active', lastLogin: '2024-01-20' },
];

const organizations = [
  { id: 'ORG001', name: 'LYC Intelligence', plan: 'Enterprise', users: 15, status: 'active', createdAt: '2023-01-01' },
  { id: 'ORG002', name: 'TechCorp Asia', plan: 'Professional', users: 8, status: 'active', createdAt: '2023-06-15' },
  { id: 'ORG003', name: 'FinTech Startup', plan: 'Starter', users: 3, status: 'active', createdAt: '2023-09-01' },
  { id: 'ORG004', name: 'Healthcare Global', plan: 'Professional', users: 6, status: 'active', createdAt: '2023-10-15' },
];

const revenueData = [
  { month: 'Jan', recurring: '$85K', oneTime: '$45K', total: '$130K' },
  { month: 'Feb', recurring: '$92K', oneTime: '$38K', total: '$130K' },
  { month: 'Mar', recurring: '$98K', oneTime: '$52K', total: '$150K' },
  { month: 'Apr', recurring: '$105K', oneTime: '$48K', total: '$153K' },
  { month: 'May', recurring: '$112K', oneTime: '$65K', total: '$177K' },
  { month: 'Jun', recurring: '$120K', oneTime: '$58K', total: '$178K' },
];

export const PlatformAdminConsolePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: `${SPACING[4]}px` }}>
            <div>
              <Heading level={1}>Platform Admin Console</Heading>
              <Paragraph color="textSecondary">System-wide management, analytics, and governance</Paragraph>
            </div>
            <Button>System Settings</Button>
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
                  {systemStats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                  ))}
                </Grid>

                <Grid columns={2} gap="6">
                  <Card padding="6">
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Recent Activity</Heading>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                      {[
                        { action: 'New user registered', user: 'Lisa Zhang', time: '2 hours ago' },
                        { action: 'Organization upgraded', org: 'TechCorp Asia', time: '5 hours ago' },
                        { action: 'Report generated', type: 'Cohort Report', time: '1 day ago' },
                        { action: 'Payment processed', amount: '$25,000', time: '1 day ago' },
                      ].map((activity, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{activity.action}</div>
                            <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                              {activity.user || activity.org || activity.type || activity.amount}
                            </div>
                          </div>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {activity.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card padding="6">
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Top Organizations</Heading>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                      {organizations.map((org) => (
                        <div key={org.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{org.name}</div>
                            <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                              {org.plan} | {org.users} users
                            </div>
                          </div>
                          <Badge variant="success">{org.status}</Badge>
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
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {user.email} | {user.role}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[4]}px`, alignItems: 'center' }}>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            Last login: {user.lastLogin}
                          </div>
                          <Badge variant={user.status === 'active' ? 'success' : 'warning'}>
                            {user.status}
                          </Badge>
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
                            {org.plan} | {org.users} users | Created: {org.createdAt}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                          <Badge variant={org.status === 'active' ? 'success' : 'warning'}>
                            {org.status}
                          </Badge>
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
                      {revenueData.map((row) => (
                        <tr key={row.month} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: `${SPACING[4]}px`, fontWeight: 600 }}>{row.month}</td>
                          <td style={{ padding: `${SPACING[4]}px`, textAlign: 'right', color: COLORS.textSecondary }}>{row.recurring}</td>
                          <td style={{ padding: `${SPACING[4]}px`, textAlign: 'right', color: COLORS.textSecondary }}>{row.oneTime}</td>
                          <td style={{ padding: `${SPACING[4]}px`, textAlign: 'right', fontWeight: 600 }}>{row.total}</td>
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
                    {[
                      { name: 'API Server', status: 'healthy', latency: '45ms' },
                      { name: 'Database', status: 'healthy', latency: '12ms' },
                      { name: 'Redis Cache', status: 'healthy', latency: '2ms' },
                      { name: 'CDN', status: 'healthy', latency: '8ms' },
                    ].map((service) => (
                      <div key={service.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 500 }}>{service.name}</div>
                        <div style={{ display: 'flex', gap: `${SPACING[4]}px` }}>
                          <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>{service.latency}</span>
                          <Badge variant={service.status === 'healthy' ? 'success' : 'error'}>
                            {service.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="6">
                  <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>Recent Logs</Heading>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[3]}px`, fontSize: `${SPACING[3]}px` }}>
                    {[
                      { level: 'INFO', message: 'API request completed successfully', time: '2024-01-20 14:30:00' },
                      { level: 'WARN', message: 'Rate limit approaching for user U001', time: '2024-01-20 14:25:00' },
                      { level: 'INFO', message: 'Database backup completed', time: '2024-01-20 14:00:00' },
                      { level: 'ERROR', message: 'Failed to send email notification', time: '2024-01-20 13:45:00' },
                      { level: 'INFO', message: 'User session created', time: '2024-01-20 13:30:00' },
                    ].map((log, index) => (
                      <div key={index} style={{ display: 'flex', gap: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                        <Badge variant={log.level === 'ERROR' ? 'error' : log.level === 'WARN' ? 'warning' : 'info'} style={{ textTransform: 'uppercase' }}>
                          {log.level}
                        </Badge>
                        <span>{log.message}</span>
                        <span style={{ color: COLORS.textMuted }}>{log.time}</span>
                      </div>
                    ))}
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