import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const briefings = [
  { id: 'MB001', title: 'January 2024 Briefing', date: '2024-01-15', status: 'published', topics: ['Leadership Trends', 'Market Intelligence', 'Talent Supply'], readCount: 256 },
  { id: 'MB002', title: 'December 2023 Briefing', date: '2023-12-15', status: 'published', topics: ['Year-End Review', '2024 Predictions', 'Executive Compensation'], readCount: 312 },
  { id: 'MB003', title: 'November 2023 Briefing', date: '2023-11-15', status: 'published', topics: ['AI Impact', 'Remote Work', 'Diversity Trends'], readCount: 289 },
];

const briefingContent = {
  overview: {
    title: 'Key Insights',
    items: [
      'Executive turnover rates increased by 15% quarter-over-quarter',
      'AI and digital transformation remain top priorities for C-suites',
      'APAC talent market shows signs of stabilization',
      'Diversity and inclusion initiatives gaining momentum',
    ],
  },
  market: {
    title: 'Market Intelligence',
    items: [
      'Singapore leads in executive talent demand',
      'China market showing recovery signs',
      'FinTech sector continues strong growth',
      'Healthcare executive roles on the rise',
    ],
  },
  talent: {
    title: 'Talent Supply',
    items: [
      'CFO talent pool remains tight',
      'CTO demand surging with AI focus',
      'CHRO role evolving with strategic importance',
      'Leadership development programs expanding',
    ],
  },
};

export const MonthlyBriefingPage: React.FC = () => {
  const [selectedBriefing, setSelectedBriefing] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: `${SPACING[20]}px 0`,
          color: COLORS.white,
        }}
      >
        <Container>
          <Badge style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: COLORS.white }}>
            Signal Council Exclusive
          </Badge>
          <Heading level={1} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[4]}px` }}>
            Monthly Intelligence Briefing
          </Heading>
          <Paragraph style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', maxWidth: '600px' }}>
            Exclusive insights for Signal Council members. Stay ahead of market trends and talent movements across APAC.
          </Paragraph>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <Grid columns={3} gap="6">
            {briefings.map((briefing) => (
              <Card key={briefing.id} padding="6" variant="elevated" onClick={() => setSelectedBriefing(briefing.id)}>
                <div style={{ marginBottom: `${SPACING[4]}px` }}>
                  <Badge variant="success">{briefing.status}</Badge>
                  <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted, marginTop: `${SPACING[2]}px` }}>
                    {briefing.date}
                  </div>
                </div>
                <Heading level={3} style={{ marginBottom: `${SPACING[4]}px` }}>{briefing.title}</Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${SPACING[2]}px`, marginBottom: `${SPACING[4]}px` }}>
                  {briefing.topics.map((topic) => (
                    <Badge key={topic} variant="info" style={{ textTransform: 'none' }}>
                      {topic}
                    </Badge>
                  ))}
                </div>
                <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                  {briefing.readCount} members read this briefing
                </div>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      {selectedBriefing && (
        <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
          <Container>
            <Card padding="8">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[6]}px` }}>
                <div>
                  <Heading level={2}>{briefings.find(b => b.id === selectedBriefing)?.title}</Heading>
                  <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                    Published: {briefings.find(b => b.id === selectedBriefing)?.date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                  <Button>Download PDF</Button>
                  <Button variant="ghost" onClick={() => setSelectedBriefing(null)}>Close</Button>
                </div>
              </div>

              <Tabs>
                <Tab active={activeSection === 'overview'} onClick={() => setActiveSection('overview')}>
                  Key Insights
                </Tab>
                <Tab active={activeSection === 'market'} onClick={() => setActiveSection('market')}>
                  Market Intelligence
                </Tab>
                <Tab active={activeSection === 'talent'} onClick={() => setActiveSection('talent')}>
                  Talent Supply
                </Tab>
              </Tabs>

              <div style={{ marginTop: `${SPACING[8]}px` }}>
                <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>
                  {briefingContent[activeSection as keyof typeof briefingContent].title}
                </Heading>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {briefingContent[activeSection as keyof typeof briefingContent].items.map((item, index) => (
                    <li key={index} style={{ marginBottom: `${SPACING[4]}px`, display: 'flex', gap: `${SPACING[3]}px` }}>
                      <span style={{ color: COLORS.primary, fontWeight: 700 }}>0{index + 1}.</span>
                      <span style={{ color: COLORS.textSecondary }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Container>
        </section>
      )}
    </div>
  );
};