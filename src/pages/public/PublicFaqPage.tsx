import React, { useState } from 'react';
import { Heading, Paragraph, Container, Badge, Card, Button } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is LYC Intelligence?',
        answer: 'LYC Intelligence is a premium executive search and leadership consulting platform powered by DEX AI. We help organizations find, evaluate, and develop exceptional leaders across APAC markets.',
      },
      {
        question: 'How does LYC Intelligence differ from traditional search firms?',
        answer: 'We leverage cutting-edge AI and data analytics to deliver faster, more accurate results. Our platform provides transparency, real-time insights, and collaborative tools that traditional firms cannot match.',
      },
      {
        question: 'Which regions do you cover?',
        answer: 'LYC Intelligence operates across 12 APAC markets including China, Hong Kong, Singapore, Japan, Korea, Australia, and Southeast Asia.',
      },
    ],
  },
  {
    category: 'Services',
    questions: [
      {
        question: 'What types of roles do you recruit for?',
        answer: 'We specialize in C-suite and senior executive roles across all industries, including technology, finance, healthcare, consumer, and industrial sectors.',
      },
      {
        question: 'How long does a typical search take?',
        answer: 'Our AI-powered platform significantly reduces search timelines. Most executive searches are completed in 6-8 weeks, compared to the industry average of 12-16 weeks.',
      },
      {
        question: 'Do you offer assessment services?',
        answer: 'Yes. We provide comprehensive leadership assessments using our proprietary SHIFT methodology, which evaluates cognitive, emotional, and behavioral competencies.',
      },
    ],
  },
  {
    category: 'Pricing',
    questions: [
      {
        question: 'How do you structure your fees?',
        answer: 'We offer flexible pricing models including traditional retained search fees, success-based fees, and subscription-based access to our intelligence platform.',
      },
      {
        question: 'Are there any additional costs?',
        answer: 'Our pricing includes all standard services. Additional assessments, background checks, and premium services may have separate fees.',
      },
      {
        question: 'Do you offer free trials?',
        answer: 'Yes, we offer a 14-day free trial of our platform with access to core features. Contact us to learn more.',
      },
    ],
  },
  {
    category: 'Technology',
    questions: [
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use enterprise-grade security measures including encryption, access controls, and regular security audits. Our platform is GDPR and SOC 2 compliant.',
      },
      {
        question: 'Can your platform integrate with our HR systems?',
        answer: 'Yes. We offer integrations with leading HRIS platforms including Workday, SAP SuccessFactors, and Oracle HCM.',
      },
      {
        question: 'Do you offer mobile access?',
        answer: 'Yes. Our platform is fully responsive and available as a PWA (Progressive Web App) for iOS and Android devices.',
      },
    ],
  },
];

interface AccordionItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: `${SPACING[4]}px 0`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: `${SPACING[4]}px` }}>{question}</span>
        <span
          style={{
            fontSize: `${SPACING[5]}px`,
            color: COLORS.textMuted,
            transition: 'transform 200ms',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? '500px' : '0',
          transition: 'max-height 300ms ease-out',
        }}
      >
        <Paragraph color="textSecondary" style={{ paddingBottom: `${SPACING[4]}px`, margin: 0 }}>
          {answer}
        </Paragraph>
      </div>
    </div>
  );
};

export const PublicFaqPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: COLORS.bg }}>
      <section style={{ padding: `${SPACING[20]}px 0`, textAlign: 'center' }}>
        <Container>
          <Badge>Help</Badge>
          <Heading level={1} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[6]}px` }}>
            Frequently Asked Questions
          </Heading>
          <Paragraph color="textSecondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Find answers to common questions about LYC Intelligence and our services.
          </Paragraph>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[16]}px 0` }}>
        <Container>
          {faqs.map((faq) => (
            <div key={faq.category} style={{ marginBottom: `${SPACING[10]}px` }}>
              <Heading level={2} style={{ marginBottom: `${SPACING[6]}px` }}>
                {faq.category}
              </Heading>
              <Card padding="0" variant="outline">
                {faq.questions.map((q, index) => (
                  <AccordionItem
                    key={q.question}
                    question={q.question}
                    answer={q.answer}
                    defaultOpen={index === 0}
                  />
                ))}
              </Card>
            </div>
          ))}
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
            Still Have Questions?
          </Heading>
          <Paragraph color="textSecondary" style={{ marginBottom: `${SPACING[8]}px` }}>
            Contact our team for personalized assistance
          </Paragraph>
          <Button onClick={() => {}}>Contact Us</Button>
        </Container>
      </section>
    </div>
  );
};