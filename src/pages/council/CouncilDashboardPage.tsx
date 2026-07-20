import React from 'react';
import { Heading, Paragraph, Container, Card, Badge, Grid, StatCard, Button } from '@/components/design-system';
import { COLORS, SPACING, RADII } from '@/styles/tokens';

const stats = [
  { title: 'Network Members', value: '2,500+', icon: '👥' },
  { title: 'Events This Month', value: '12', icon: '📅' },
  { title: 'New Connections', value: '45', icon: '🔗' },
  { title: 'Resources Available', value: '150+', icon: '📚' },
];

const recentActivity = [
  { id: 1, type: 'connection', message: 'Sarah Chen sent you a connection request', time: '2 hours ago', avatar: 'SC' },
  { id: 2, type: 'event', message: 'Executive Leadership Forum - RSVP now', time: '5 hours ago', avatar: '📅' },
  { id: 3, type: 'resource', message: 'New whitepaper: AI in Talent Acquisition', time: '1 day ago', avatar: '📄' },
  { id: 4, type: 'message', message: 'Michael Tan commented on your post', time: '1 day ago', avatar: 'MT' },
];

const upcomingEvents = [
  { id: 1, title: 'Executive Leadership Forum', date: 'Jan 25, 2024', location: 'Singapore', type: 'in-person' },
  { id: 2, title: 'AI in HR Roundtable', date: 'Feb 1, 2024', location: 'Virtual', type: 'virtual' },
  { id: 3, title: 'CFO Network Mixer', date: 'Feb 15, 2024', location: 'Hong Kong', type: 'in-person' },
];

const featuredResources = [
  { id: 1, title: 'Future of Work Report 2024', category: 'Report', views: '2.4k' },
  { id: 2, title: 'Leadership Development Guide', category: 'Guide', views: '1.8k' },
  { id: 3, title: 'APAC Talent Trends', category: 'Whitepaper', views: '1.2k' },
];

export const CouncilDashboardPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: `${SPACING[4]}px` }}>
            <div>
              <Heading level={1}>Council Dashboard</Heading>
              <Paragraph color="textSecondary">Welcome back, John. Here's what's happening in the community.</Paragraph>
            </div>
            <Button>View Full Calendar</Button>
          </div>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <Grid columns={4} gap="6">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </Grid>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[6]}px` }}>
            <Heading level={2}>Recent Activity</Heading>
            <Button variant="ghost">View All</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
            {recentActivity.map((activity) => (
              <Card key={activity.id} padding="6" variant="outline">
                <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING[4]}px` }}>
                  <div
                    style={{
                      width: `${SPACING[10]}px`,
                      height: `${SPACING[10]}px`,
                      backgroundColor: COLORS.primaryLight,
                      borderRadius: `${RADII.full}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: `${SPACING[5]}px`,
                    }}
                  >
                    {activity.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>{activity.message}</div>
                    <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>{activity.time}</div>
                  </div>
                  {activity.type === 'connection' && (
                    <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                      <Button size="sm">Accept</Button>
                      <Button size="sm" variant="ghost">Decline</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <Grid columns={2} gap="8">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[6]}px` }}>
                <Heading level={2}>Upcoming Events</Heading>
                <Button variant="ghost">View All</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                {upcomingEvents.map((event) => (
                  <Card key={event.id} padding="6">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Heading level={4} style={{ marginBottom: `${SPACING[2]}px` }}>{event.title}</Heading>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                          {event.date} | {event.location}
                        </div>
                      </div>
                      <Badge variant={event.type === 'virtual' ? 'info' : 'default'}>
                        {event.type}
                      </Badge>
                    </div>
                    <Button style={{ marginTop: `${SPACING[4]}px`, width: '100%' }}>RSVP</Button>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[6]}px` }}>
                <Heading level={2}>Featured Resources</Heading>
                <Button variant="ghost">Browse Library</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                {featuredResources.map((resource) => (
                  <Card key={resource.id} padding="6" variant="outline">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Heading level={4}>{resource.title}</Heading>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                          {resource.category} | {resource.views} views
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">Download</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Grid>
        </Container>
      </section>
    </div>
  );
};