/**
 * V7.0 — What It Is page (/what).
 *
 * Narrative page explaining what NEXUS is. Uses shared v3.5 shell components.
 * Editorial minimalism: rule lines, zero radius, no shadows.
 */
import React, { useEffect } from 'react';
import { SEO } from '@/components/seo/SEO';
import { initScrollReveal } from '@/lib/utils';
import { V3 } from '@/styles/v3-tokens';
import { trackCTA } from '@/analytics/eventTracker';
import {
  Container,
  PageHeader,
  ContentSection,
  TwoCol,
  PullQuote,
  Button,
  MonoLabel,
  SectionTitle,
  BodySerif,
  RuleLine,
} from '@/components/marketing/v7-shell';

const DIFFERENCES: Array<{ label: string; body: string }> = [
  {
    label: 'From generic AI',
    body: 'Generic AI forgets. It starts fresh every time. NEXUS remembers everything you\u2019ve said \u2014 every conversation, every lens, every decision \u2014 and builds on it. The intelligence gets sharper, not flatter, the more you use it.',
  },
  {
    label: 'From executive coaches',
    body: 'A coach sees you for an hour a week. NEXUS is always on \u2014 available at 5am before the board meeting, at 11pm after the call with Shanghai. It doesn\u2019t replace coaching. It gives you something to bring to coaching that\u2019s already thought through.',
  },
  {
    label: 'From assessment tools',
    body: 'Assessments give you a snapshot \u2014 a single moment, a static report. NEXUS gives you a moving picture. Lenses calibrate where you are, but the conversation is where the thinking happens. The picture deepens over time.',
  },
  {
    label: 'From everything else',
    body: 'Nothing else combines structured instruments, continuous conversation, and human advisory in one private service. It\u2019s not an app. It\u2019s not a platform. It\u2019s a place \u2014 one that holds the full picture of where you stand and where you\u2019re heading.',
  },
];

export function WhatPage(): React.ReactElement {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => { if (observer) observer.disconnect(); };
  }, []);

  return (
    <>
      <SEO page="what" />
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <PageHeader
          eyebrow="What it is"
          title={
            <>
              Not another tool.
              <br />
              A place for the thinking you do alone.
            </>
          }
          lead="Discreet executive intelligence for senior leaders. Everything you\u2019ve said stays remembered. The patterns you can\u2019t see come into focus. The questions no one else asks, get asked."
        />
      </ContentSection>

      {/* Section 1 — Who it's for */}
      <ContentSection bg="white" paddingY={V3.marketingPadY}>
        <TwoCol label="Who it\u2019s for">
          <p style={{ margin: '0 0 24px 0' }}>
            Senior leaders who carry the weight of decisions that don’t have clean answers. CEOs, founders, board members, partners — people who can’t talk freely with their team, their board, or their spouse about the things that actually keep them up at night.
          </p>
          <p style={{ margin: '0 0 24px 0' }}>
            You’re not looking for motivation. You’re not looking for a framework. You’re looking for a place to think out loud — with something that remembers, that pushes back, that asks the question you haven’t asked yourself yet.
          </p>
          <p style={{ margin: 0 }}>
            That’s what this is.
          </p>
        </TwoCol>
      </ContentSection>

      {/* Section 2 — Pull quote */}
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <PullQuote
          quote="You don\u2019t come because you have a task. You come because you have a question that won\u2019t leave you alone."
          attribution="\u2014 how members describe it"
        />
      </ContentSection>

      {/* Section 3 — What it feels like */}
      <ContentSection bg="white" paddingY={V3.marketingPadY}>
        <TwoCol label="What it feels like">
          <p style={{ margin: '0 0 24px 0' }}>
            Like a conversation with someone who already knows the context — because they do. You don’t repeat yourself. You don’t explain the background. You pick up where you left off, even if that was three weeks ago at 2am.
          </p>
          <p style={{ margin: '0 0 24px 0' }}>
            Sometimes it’s practical — a decision you’re weighing, a conversation you need to prepare for, a pattern you keep falling into. Sometimes it’s bigger — where this is all going, what you actually want, what you’re avoiding.
          </p>
          <p style={{ margin: 0 }}>
            It doesn’t feel like software. It doesn’t feel like therapy. It feels like the thinking you do in the shower or on the walk to the office — except it talks back, and it remembers.
          </p>
        </TwoCol>
      </ContentSection>

      {/* Section 4 — How it's different (dark) */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY}>
        <Container style={{ marginBottom: 56 }}>
          <MonoLabel color={V3.teal400} style={{ display: 'block', margin: '0 0 20px 0' }}>
            How it’s different
          </MonoLabel>
          <SectionTitle onDark>
            Not a better version of something else.
            <br />
            Something that didn’t exist before.
          </SectionTitle>
        </Container>
        {DIFFERENCES.map((d, i) => (
          <Container key={d.label}>
            <div
              className="reveal"
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                gap: 64,
                padding: '32px 0',
                borderTop: i === 0 ? `1px solid rgba(250,250,250,0.08)` : 'none',
                borderBottom: `1px solid rgba(250,250,250,0.08)`,
              }}
            >
              <MonoLabel color={V3.teal300} style={{ paddingTop: 4 }}>
                {d.label}
              </MonoLabel>
              <BodySerif onDark style={{ maxWidth: 680 }}>
                {d.body}
              </BodySerif>
            </div>
          </Container>
        ))}
      </ContentSection>

      {/* Section 5 — Bottom CTA */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY} style={{ paddingTop: 0 }}>
        <Container style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto', paddingTop: V3.marketingPadY }}>
          <MonoLabel color={V3.teal400} style={{ display: 'block', margin: '0 0 20px 0' }}>
            Ready?
          </MonoLabel>
          <SectionTitle onDark style={{ marginBottom: 24 }}>
            Your first conversation takes five minutes.
          </SectionTitle>
          <BodySerif onDark style={{ margin: '0 0 36px 0' }}>
            Complimentary. No card required. No sales follow-up. Just the work.
          </BodySerif>
          <Button
            to="/auth"
            variant="primary"
            onDark
            onClick={() => trackCTA({ location: 'what-cta', label: 'Start here', destination: '/auth' })}
          >
            Start here
          </Button>
        </Container>
      </ContentSection>
    </>
  );
}

export default WhatPage;
