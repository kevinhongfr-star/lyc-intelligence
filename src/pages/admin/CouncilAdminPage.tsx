import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, Avatar, Input, Select } from '@/components/design-system';
import { COLORS, SPACING, RADII } from '@/styles/tokens';

const applications = [
  { id: 'APP001', name: 'Sarah Chen', email: 'sarah@techcorp.com', company: 'TechCorp Asia', title: 'VP Operations', tier: 'Gold', status: 'pending', submittedAt: '2024-01-15' },
  { id: 'APP002', name: 'Michael Tan', email: 'michael@fintech.com', company: 'FinTech Startup', title: 'CEO', tier: 'Platinum', status: 'pending', submittedAt: '2024-01-14' },
  { id: 'APP003', name: 'Emily Wang', email: 'emily@healthcare.com', company: 'Healthcare Global', title: 'CMO', tier: 'Gold', status: 'reviewing', submittedAt: '2024-01-13' },
  { id: 'APP004', name: 'David Kim', email: 'david@retail.com', company: 'Retail Group', title: 'COO', tier: 'Silver', status: 'approved', submittedAt: '2024-01-12' },
  { id: 'APP005', name: 'Lisa Zhang', email: 'lisa@manufacturing.com', company: 'Manufacturing Co', title: 'CFO', tier: 'Gold', status: 'rejected', submittedAt: '2024-01-11' },
];

const members = [
  { id: 'MEM001', name: 'John Smith', email: 'john@lyc.com', company: 'LYC Intelligence', title: 'Founder', tier: 'Platinum', joinedAt: '2023-06-01', status: 'active' },
  { id: 'MEM002', name: 'Sarah Chen', email: 'sarah@techcorp.com', company: 'TechCorp Asia', title: 'VP Operations', tier: 'Gold', joinedAt: '2023-08-15', status: 'active' },
  { id: 'MEM003', name: 'Michael Tan', email: 'michael@fintech.com', company: 'FinTech Startup', title: 'CEO', tier: 'Platinum', joinedAt: '2023-09-01', status: 'active' },
  { id: 'MEM004', name: 'Emily Wang', email: 'emily@healthcare.com', company: 'Healthcare Global', title: 'CMO', tier: 'Gold', joinedAt: '2023-10-15', status: 'inactive' },
  { id: 'MEM005', name: 'David Kim', email: 'david@retail.com', company: 'Retail Group', title: 'COO', tier: 'Silver', joinedAt: '2023-11-01', status: 'active' },
];

const tiers = [
  { id: 'platinum', name: 'Platinum', price: '$50,000', benefits: ['Unlimited access to talent pool', 'Priority AI matching', 'Personalized coaching', 'Quarterly intelligence reports', 'Exclusive events'], color: '#E5E4E2' },
  { id: 'gold', name: 'Gold', price: '$25,000', benefits: ['Access to talent pool', 'AI matching', 'Bi-monthly intelligence reports', 'Networking events'], color: '#FFD700' },
  { id: 'silver', name: 'Silver', price: '$10,000', benefits: ['Basic talent pool access', 'Monthly intelligence digest', 'Community forum access'], color: '#C0C0C0' },
];

export const CouncilAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (id: string) => {
    console.log('Approving application:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejecting application:', id);
  };

  const handleUpdateTier = (memberId: string, tier: string) => {
    console.log('Updating tier for:', memberId, 'to:', tier);
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <Container style={{ padding: `${SPACING[10]}px` }}>
        <div style={{ marginBottom: `${SPACING[8]}px` }}>
          <Heading level={1}>Council Portal Admin</Heading>
          <Paragraph color="textSecondary">Manage council applications, members, and tiers</Paragraph>
        </div>

        <Tabs>
          <Tab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')}>
            Applications ({applications.filter(a => a.status === 'pending').length} pending)
          </Tab>
          <Tab active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
            Members ({members.length})
          </Tab>
          <Tab active={activeTab === 'tiers'} onClick={() => setActiveTab('tiers')}>
            Tier Management
          </Tab>
        </Tabs>

        <div style={{ marginTop: `${SPACING[6]}px` }}>
          {activeTab === 'applications' && (
            <Card padding="6">
              <div style={{ display: 'flex', gap: `${SPACING[4]}px`, marginBottom: `${SPACING[6]}px`, flexWrap: 'wrap' }}>
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                {filteredApplications.map((app) => (
                  <Card key={app.id} padding="6" variant="outline">
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING[4]}px`, flexWrap: 'wrap' }}>
                      <Avatar name={app.name} />
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: 600 }}>{app.name}</div>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                          {app.title} | {app.company}
                        </div>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                          {app.email} | Applied: {app.submittedAt}
                        </div>
                      </div>
                      <Badge variant={
                        app.status === 'approved' ? 'success' :
                        app.status === 'rejected' ? 'error' :
                        app.status === 'reviewing' ? 'warning' : 'default'
                      }>
                        {app.status}
                      </Badge>
                      <Badge style={{ backgroundColor: `${tiers.find(t => t.name === app.tier)?.color || COLORS.primaryLight}20`, color: COLORS.text }}>
                        {app.tier}
                      </Badge>
                      {app.status === 'pending' && (
                        <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                          <Button size="sm" onClick={() => handleApprove(app.id)}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(app.id)}>Reject</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'members' && (
            <Card padding="6">
              <div style={{ marginBottom: `${SPACING[6]}px` }}>
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                {filteredMembers.map((member) => (
                  <Card key={member.id} padding="6" variant="outline">
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING[4]}px`, flexWrap: 'wrap' }}>
                      <Avatar name={member.name} />
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                          {member.title} | {member.company}
                        </div>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                          {member.email} | Joined: {member.joinedAt}
                        </div>
                      </div>
                      <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                        {member.status}
                      </Badge>
                      <Select value={member.tier} onChange={(e) => handleUpdateTier(member.id, e.target.value)}>
                        <option value="Platinum">Platinum</option>
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                      </Select>
                      <Button size="sm" variant="ghost">View Profile</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'tiers' && (
            <Grid columns={3} gap="6">
              {tiers.map((tier) => (
                <Card key={tier.id} padding="8" variant="elevated">
                  <div style={{ 
                    width: `${SPACING[10]}px`, 
                    height: `${SPACING[10]}px`, 
                    backgroundColor: tier.color,
                    borderRadius: `${RADII.full}px`,
                    marginBottom: `${SPACING[4]}px`,
                  }} />
                  <Heading level={3}>{tier.name}</Heading>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: `${SPACING[6]}px` }}>
                    {tier.price}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} style={{ marginBottom: `${SPACING[3]}px`, display: 'flex', alignItems: 'center', gap: `${SPACING[2]}px` }}>
                        <span>✓</span>
                        <span style={{ color: COLORS.textSecondary }}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button style={{ marginTop: `${SPACING[6]}px`, width: '100%' }}>Edit Tier</Button>
                </Card>
              ))}
            </Grid>
          )}
        </div>
      </Container>
    </div>
  );
};