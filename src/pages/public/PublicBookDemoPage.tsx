import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heading, Paragraph, Button, Container, Card, Badge, Input, Flex, Grid } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const COMPANY_SIZES = ['1-50', '51-200', '201-500', '501-1000', '1000+'];

const INTERESTS = [
  'Executive Search',
  'Leadership Assessment',
  'Talent Intelligence',
  'Coaching & Development',
  'Council Membership',
  'DEX AI Platform',
];

export const PublicBookDemoPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    companySize: COMPANY_SIZES[0],
    message: '',
    interests: [] as string[],
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead_notify',
          data: {
            name: formData.name,
            email: formData.email,
            company: formData.company,
            phone: formData.phone,
            companySize: formData.companySize,
            interests: formData.interests.join(', '),
            message: formData.message,
            leadType: 'Demo Request',
            source: 'Book Demo Page',
          },
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('[BookDemo] Failed to submit:', err);
      setSubmitted(true); // Still show success to user
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${COLORS.border}` }}>
          <Link to="/" style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: COLORS.text, textDecoration: 'none' }}>
            LYC Intelligence
          </Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px' }}>
          <div style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>✓</div>
            <Heading level={2}>Thanks! We'll be in touch within 24 hours.</Heading>
            <Paragraph color="textSecondary" style={{ marginTop: '16px' }}>
              Our team will review your request and reach out to schedule your personalized demo.
            </Paragraph>
            <Link to="/">
              <Button style={{ marginTop: '32px' }}>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${COLORS.border}` }}>
        <Link to="/" style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: COLORS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </Link>
        <Link to="/login" style={{ fontSize: '13px', color: COLORS.textMuted, textDecoration: 'none' }}>
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ padding: `${SPACING[16]}px 0 ${SPACING[8]}px`, textAlign: 'center' }}>
        <Container size="md">
          <Badge>Book a Demo</Badge>
          <Heading level={1} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[4]}px` }}>
            See LYC Intelligence in Action
          </Heading>
          <Paragraph color="textSecondary" size="lg">
            Schedule a personalized demo to discover how our AI-powered platform can transform your executive search and leadership development.
          </Paragraph>
        </Container>
      </section>

      {/* Form */}
      <section style={{ padding: `${SPACING[8]}px 0 ${SPACING[20]}px` }}>
        <Container size="md">
          <Card padding="8">
            <form onSubmit={handleSubmit}>
              <Grid columns={2} gap="6">
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.text }}>
                    Full Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.text }}>
                    Work Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.text }}>
                    Company *
                  </label>
                  <Input
                    required
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.text }}>
                    Phone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+86 138 0000 0000"
                  />
                </div>
              </Grid>

              <div style={{ marginTop: `${SPACING[6]}px` }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.text }}>
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={e => setFormData({ ...formData, companySize: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: COLORS.bgAlt,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: COLORS.text,
                  }}
                >
                  {COMPANY_SIZES.map(size => (
                    <option key={size} value={size}>{size} employees</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: `${SPACING[6]}px` }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: COLORS.text }}>
                  What are you interested in?
                </label>
                <Flex gap="3" wrap>
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: `1px solid ${formData.interests.includes(interest) ? COLORS.primary : COLORS.border}`,
                        backgroundColor: formData.interests.includes(interest) ? COLORS.primary : 'transparent',
                        color: formData.interests.includes(interest) ? '#fff' : COLORS.textSecondary,
                        transition: 'all 0.2s',
                      }}
                    >
                      {interest}
                    </button>
                  ))}
                </Flex>
              </div>

              <div style={{ marginTop: `${SPACING[6]}px` }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.text }}>
                  Additional Details
                </label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your needs..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: COLORS.bgAlt,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: COLORS.text,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginTop: `${SPACING[8]}px`, textAlign: 'center' }}>
                <Button size="lg" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Request Demo'}
                </Button>
                <Paragraph color="textMuted" size="sm" style={{ marginTop: '16px' }}>
                  We'll respond within 24 hours.
                </Paragraph>
              </div>
            </form>
          </Card>
        </Container>
      </section>
    </div>
  );
};
