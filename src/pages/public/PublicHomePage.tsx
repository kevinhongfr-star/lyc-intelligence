import React from 'react';
import { Heading, Paragraph, Button, Container, Card, Badge, Grid, Flex, StatCard } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const features = [
  {
    title: 'AI-Powered Talent Intelligence',
    description: 'Leverage cutting-edge AI to identify and evaluate executive talent across APAC markets.',
    icon: '🧠',
  },
  {
    title: 'Strategic Leadership Consulting',
    description: 'Expert guidance for C-suite placement, succession planning, and leadership development.',
    icon: '💼',
  },
  {
    title: 'Data-Driven Decision Making',
    description: 'Access comprehensive analytics and insights to inform your hiring strategy.',
    icon: '📊',
  },
  {
    title: 'Candidate Matching Engine',
    description: 'Advanced algorithms match candidates to mandates based on skills, culture, and potential.',
    icon: '🔗',
  },
];

const stats = [
  { title: 'Clients', value: '200+', change: { value: '15%', positive: true } },
  { title: 'Placements', value: '1,500+', change: { value: '22%', positive: true } },
  { title: 'APAC Markets', value: '12', change: { value: 'New', positive: true } },
  { title: 'Success Rate', value: '94%', change: { value: '3%', positive: true } },
];

const testimonials = [
  {
    quote: 'LYC Intelligence transformed our executive hiring process. Their AI insights saved us months of search time.',
    author: 'Sarah Chen',
    role: 'CHRO, TechCorp Asia',
  },
  {
    quote: 'The Signal Council community has been invaluable for networking and staying ahead of market trends.',
    author: 'Michael Tan',
    role: 'CEO, FinTech Startup',
  },
];

export const PublicHomePage: React.FC = () => {
  return (
    <div style={{ backgroundColor: COLORS.bg }}>
      <section
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: `${SPACING[20]}px 0`,
          color: COLORS.white,
          textAlign: 'center',
        }}
      >
        <Container>
          <Badge
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: COLORS.white,
              marginBottom: `${SPACING[6]}px`,
            }}
          >
            Executive Search & Leadership Intelligence
          </Badge>
          <Heading level={1} style={{ fontSize: '4rem', marginBottom: `${SPACING[6]}px` }}>
            Find Your Next
            <br />
            <span style={{ color: '#FFD700' }}>Transformational Leader</span>
          </Heading>
          <Paragraph
            style={{
              fontSize: '1.25rem',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '600px',
              margin: '0 auto',
              marginBottom: `${SPACING[10]}px`,
            }}
          >
            Powered by DEX AI, LYC Intelligence delivers executive talent solutions across APAC
            with unmatched precision and speed.
          </Paragraph>
          <Flex justify="center" gap="6">
            <Button size="lg" onClick={() => {}}>
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" style={{ borderColor: 'white', color: 'white' }}>
              Explore Features
            </Button>
          </Flex>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[20]}px 0` }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: `${SPACING[12]}px` }}>
            <Badge>Trusted by Leading Organizations</Badge>
            <Heading level={2} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[4]}px` }}>
              Numbers That Speak
            </Heading>
            <Paragraph color="textSecondary">
              Track record of excellence in executive search and leadership consulting
            </Paragraph>
          </div>
          <Grid columns={4} gap="6">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </Grid>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[20]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: `${SPACING[12]}px` }}>
            <Badge>Our Platform</Badge>
            <Heading level={2} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[4]}px` }}>
              Powerful Features
            </Heading>
            <Paragraph color="textSecondary">
              Everything you need to source, evaluate, and place top executive talent
            </Paragraph>
          </div>
          <Grid columns={2} gap="6">
            {features.map((feature) => (
              <Card key={feature.title} padding="8">
                <div
                  style={{
                    fontSize: '3rem',
                    marginBottom: `${SPACING[4]}px`,
                  }}
                >
                  {feature.icon}
                </div>
                <Heading level={3} style={{ marginBottom: `${SPACING[3]}px` }}>
                  {feature.title}
                </Heading>
                <Paragraph color="textSecondary">{feature.description}</Paragraph>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[20]}px 0` }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: `${SPACING[12]}px` }}>
            <Badge>Testimonials</Badge>
            <Heading level={2} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[4]}px` }}>
              What Our Clients Say
            </Heading>
          </div>
          <Grid columns={2} gap="6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} padding="8" variant="elevated">
                <div style={{ fontSize: '2rem', marginBottom: `${SPACING[4]}px` }}>"</div>
                <Paragraph style={{ marginBottom: `${SPACING[6]}px` }}>
                  {testimonial.quote}
                </Paragraph>
                <div>
                  <div style={{ fontWeight: 600 }}>{testimonial.author}</div>
                  <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                    {testimonial.role}
                  </div>
                </div>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      <section
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          padding: `${SPACING[20]}px 0`,
          color: COLORS.white,
          textAlign: 'center',
        }}
      >
        <Container>
          <Heading level={2} style={{ marginBottom: `${SPACING[4]}px` }}>
            Ready to Transform Your Executive Hiring?
          </Heading>
          <Paragraph
            style={{
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '500px',
              margin: '0 auto',
              marginBottom: `${SPACING[10]}px`,
            }}
          >
            Schedule a demo to see how LYC Intelligence can help you find your next leader.
          </Paragraph>
          <Flex justify="center" gap="6">
            <Button size="lg" onClick={() => {}}>
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" style={{ borderColor: 'white', color: 'white' }}>
              View Pricing
            </Button>
          </Flex>
        </Container>
      </section>

      <footer style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.text, color: COLORS.white }}>
        <Container>
          <Flex justify="between" align="center">
            <div style={{ fontWeight: 700, fontSize: `${SPACING[6]}px` }}>LYC Intelligence</div>
            <div style={{ fontSize: `${SPACING[4]}px`, color: 'rgba(255,255,255,0.7)' }}>
              2024 LYC Intelligence. All rights reserved.
            </div>
          </Flex>
        </Container>
      </footer>
    </div>
  );
};