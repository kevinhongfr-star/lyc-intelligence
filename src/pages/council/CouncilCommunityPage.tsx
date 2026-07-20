import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Avatar, Input, TextArea } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const members = [
  { id: 1, name: 'Sarah Chen', title: 'VP Operations', company: 'TechCorp Asia', avatar: 'SC', tier: 'Gold', connections: 128 },
  { id: 2, name: 'Michael Tan', title: 'CEO', company: 'FinTech Startup', avatar: 'MT', tier: 'Platinum', connections: 256 },
  { id: 3, name: 'Emily Wang', title: 'CMO', company: 'Healthcare Global', avatar: 'EW', tier: 'Gold', connections: 89 },
  { id: 4, name: 'David Kim', title: 'COO', company: 'Retail Group', avatar: 'DK', tier: 'Silver', connections: 67 },
  { id: 5, name: 'Lisa Zhang', title: 'CFO', company: 'Manufacturing Co', avatar: 'LZ', tier: 'Gold', connections: 145 },
  { id: 6, name: 'James Liu', title: 'CTO', company: 'Tech Startup', avatar: 'JL', tier: 'Platinum', connections: 198 },
];

const forums = [
  { id: 1, title: 'Leadership Challenges in APAC', posts: 156, members: 89, lastPost: '2 hours ago' },
  { id: 2, title: 'AI and Future of Work', posts: 89, members: 67, lastPost: '5 hours ago' },
  { id: 3, title: 'Executive Compensation Trends', posts: 45, members: 42, lastPost: '1 day ago' },
  { id: 4, title: 'Board Governance Best Practices', posts: 78, members: 56, lastPost: '1 day ago' },
];

const recentPosts = [
  { id: 1, title: 'Navigating Economic Uncertainty as a Leader', author: 'Michael Tan', replies: 23, likes: 156, time: '3 hours ago' },
  { id: 2, title: 'Building High-Performing Remote Teams', author: 'Sarah Chen', replies: 18, likes: 98, time: '6 hours ago' },
  { id: 3, title: 'The Role of AI in Executive Search', author: 'David Kim', replies: 15, likes: 76, time: '1 day ago' },
];

export const CouncilCommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState('');

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConnect = (id: number) => {
    console.log('Connecting to member:', id);
  };

  const handlePost = () => {
    if (newPost.trim()) {
      console.log('Posting:', newPost);
      setNewPost('');
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <Heading level={1}>Council Community</Heading>
          <Paragraph color="textSecondary">Connect with fellow members, participate in discussions, and expand your network.</Paragraph>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <Tabs>
            <Tab active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
              Member Directory ({members.length})
            </Tab>
            <Tab active={activeTab === 'forums'} onClick={() => setActiveTab('forums')}>
              Forums ({forums.length})
            </Tab>
            <Tab active={activeTab === 'posts'} onClick={() => setActiveTab('posts')}>
              Recent Posts
            </Tab>
          </Tabs>

          <div style={{ marginTop: `${SPACING[6]}px` }}>
            {activeTab === 'members' && (
              <Card padding="6">
                <div style={{ marginBottom: `${SPACING[6]}px` }}>
                  <Input
                    placeholder="Search members by name or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Grid columns={3} gap="6">
                  {filteredMembers.map((member) => (
                    <Card key={member.id} padding="6" variant="outline">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Avatar name={member.name} size="lg" />
                        <Heading level={4} style={{ marginTop: `${SPACING[3]}px`, marginBottom: `${SPACING[1]}px` }}>
                          {member.name}
                        </Heading>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                          {member.title}
                        </div>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                          {member.company}
                        </div>
                        <Badge style={{ marginTop: `${SPACING[3]}px`, marginBottom: `${SPACING[3]}px` }}>
                          {member.tier}
                        </Badge>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                          {member.connections} connections
                        </div>
                        <Button size="sm" style={{ marginTop: `${SPACING[4]}px`, width: '100%' }} onClick={() => handleConnect(member.id)}>
                          Connect
                        </Button>
                      </div>
                    </Card>
                  ))}
                </Grid>
              </Card>
            )}

            {activeTab === 'forums' && (
              <Card padding="6">
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                  {forums.map((forum) => (
                    <Card key={forum.id} padding="6" variant="outline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Heading level={4}>{forum.title}</Heading>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {forum.posts} posts | {forum.members} members | Last post: {forum.lastPost}
                          </div>
                        </div>
                        <Button size="sm">View</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'posts' && (
              <div>
                <Card padding="6" style={{ marginBottom: `${SPACING[6]}px` }}>
                  <Heading level={3} style={{ marginBottom: `${SPACING[4]}px` }}>Start a Discussion</Heading>
                  <TextArea
                    placeholder="Share your thoughts, ask a question, or start a discussion..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                  />
                  <Button style={{ marginTop: `${SPACING[4]}px` }} onClick={handlePost}>Post</Button>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                  {recentPosts.map((post) => (
                    <Card key={post.id} padding="6" variant="outline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Heading level={4}>{post.title}</Heading>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            By {post.author} | {post.time}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[4]}px`, fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                          <span>💬 {post.replies}</span>
                          <span>❤️ {post.likes}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
};

const Tabs: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}` }}>
    {children}
  </div>
);

const Tab: React.FC<{ children: React.ReactNode; active?: boolean; onClick?: () => void }> = ({ 
  children, 
  active = false,
  onClick 
}) => (
  <button
    onClick={onClick}
    style={{
      padding: `${SPACING[3]}px ${SPACING[4]}px`,
      fontSize: `${SPACING[4]}px`,
      fontWeight: active ? 600 : 500,
      color: active ? COLORS.primary : COLORS.textSecondary,
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: active ? `2px solid ${COLORS.primary}` : 'none',
      cursor: 'pointer',
      marginBottom: '-1px',
    }}
  >
    {children}
  </button>
);