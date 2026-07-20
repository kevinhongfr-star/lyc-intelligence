import React from 'react';
import { Heading, Paragraph, Container, Card, Badge, Grid, Flex } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const featureCategories = [
  {
    category: 'Talent Intelligence',
    icon: '🧠',
    features: [
      {
        title: 'AI Candidate Sourcing',
        description: 'Automatically identify and surface top talent from multiple sources using advanced AI algorithms.',
      },
      {
        title: 'Skill Assessment Engine',
        description: 'Comprehensive evaluation tools to assess leadership capabilities and cultural fit.',
      },
      {
        title: 'Market Intelligence',
        description: 'Real-time insights into talent availability, compensation trends, and competitive landscape.',
      },
    ],
  },
  {
    category: 'Executive Search',
    icon: '🔍',
    features: [
      {
        title: 'Smart Matching',
        description: 'AI-powered matching that considers skills, experience, culture, and potential.',
      },
      {
        title: 'Pipeline Management',
        description: 'End-to-end tracking of candidates through every stage of the search process.',
      },
      {
        title: 'Client Collaboration',
        description: 'Secure portal for clients to review candidates, provide feedback, and track progress.',
      },
    ],
  },
  {
    category: 'Leadership Development',
    icon: '🚀',
    features: [
      {
        title: 'Assessment Center',
        description: 'Scientific assessment tools for leadership potential and development needs.',
      },
      {
        title: 'Coaching Programs',
        description: 'Personalized coaching for executives and emerging leaders.',
      },
      {
        title: 'Succession Planning',
        description: 'Strategic planning tools for identifying and developing future leaders.',
      },
    ],
  },
  {
    category: 'Analytics & Reporting',
    icon: '📊',
    features: [
      {
        title: 'Dashboard Analytics',
        description: 'Real-time dashboards with key metrics and performance indicators.',
      },
      {
        title: 'Intelligence Reports',
        description: 'Automated reports on market trends, talent pools, and competitive analysis.',
      },
      {
        title: 'Custom Insights',
        description: 'Tailored analytics based on your specific business needs and goals.',
      },
    ],
  },
];

export const PublicFeaturesPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: COLORS.bg }}>
      <section style={{ padding: `${SPACING[20]}px 0`, textAlign: 'center' }}>
        <Container>
          <Badge>Platform</Badge>
          <Heading level={1} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[6]}px` }}>
            Explore Our Features
          </Heading>
          <Paragraph color="textSecondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Discover how LYC Intelligence can help you find, evaluate, and develop exceptional leaders for your organization.
          </Paragraph>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[16]}px 0` }}>
        <Container>
          <Grid columns={2} gap="8">
            {featureCategories.map((category) => (
              <Card key={category.category} padding="8" variant="outline">
                <div style={{ marginBottom: `${SPACING[6]}px` }}>
                  <div
                    style={{
                      fontSize: '3rem',
                      marginBottom: `${SPACING[3]}px`,
                    }}
                  >
                    {category.icon}
                  </div>
                  <Heading level={2}>{category.category}</Heading>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[6]}px` }}>
                  {category.features.map((feature) => (
                    <div key={feature.title}>
                      <Heading level={4} style={{ marginBottom: `${SPACING[2]}px` }}>
                        {feature.title}
                      </Heading>
                      <Paragraph color="textSecondary" style={{ margin: 0 }}>
                        {feature.description}
                      </Paragraph>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      <section
        style={{
          backgroundColor: COLORS.primaryLight,
          padding: `${SPACING[20]}px 0`,
          textAlign: 'center',
        }}
      >
        <Container>
          <Heading level={2} style={{ marginBottom: `${SPACING[4]}px` }}>
            See It All in Action
          </Heading>
          <Paragraph color="textSecondary" style={{ marginBottom: `${SPACING[8]}px` }}>
            Schedule a personalized demo to experience the full power of LYC Intelligence
          </Paragraph>
          <Flex justify="center">
            <Button onClick={() => {}}>Book a Demo</Button>
          </Flex>
        </Container>
      </section>
    </div>
  );
};