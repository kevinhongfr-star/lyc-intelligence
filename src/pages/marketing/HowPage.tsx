/**
 * V7.0 — How It Works page (/how).
 *
 * Methodology page explaining the four pillars, lenses, and discretion.
 * Uses shared v3.5 shell components.
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { initScrollReveal } from '@/lib/utils';
import { V3 } from '@/styles/v3-tokens';
import { trackCTA } from '@/analytics/eventTracker';
import {
  Container,
  PageHeader,
  ContentSection,
  TwoCol,
  Button,
  MonoLabel,
  SectionTitle,
  BodySerif,
} from '@/components/marketing/v7-shell';
import { HOW_PILLARS } from '@/config/marketing-data';

export function HowPage(): React.ReactElement {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => { if (observer) observer.disconnect(); };
  }, []);

  return (
    <>
      <SEO page="how" />
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <PageHeader
          eyebrow="How it works"
          title={
            <>
              Four pillars of
              <br />
              executive intelligence.
            </>
          }
          lead="A picture builds across four dimensions of leadership. Lenses calibrate each pillar. Conversations deepen them. Over time, the full picture comes into focus."
        />
      </ContentSection>

      {/* Section 1 — 4 pillar list */}
      <ContentSection bg="cream" paddingY={0} style={{ paddingBottom: V3.marketingPadY }}>
        <Container>
          {HOW_PILLARS.map((p, i) => (
            <div
              key={p.n}
              className="reveal"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr',
                gap: 32,
                padding: '32px 0',
                borderTop: i === 0 ? `1px solid ${V3.ink200}` : 'none',
                borderBottom: `1px solid ${V3.ink200}`,
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: V3.monoFont,
                  fontSize: '0.9rem',
                  color: V3.ink400,
                  letterSpacing: V3.trackingMono,
                }}
              >
                {p.n}
              </span>
              <SectionTitle style={{ fontSize: '1.5rem' }}>
                {p.name}
              </SectionTitle>
              <MonoLabel color={V3.ocean500}>
                {p.lenses}
              </MonoLabel>
            </div>
          ))}
        </Container>
      </ContentSection>

      {/* Section 2 — About lenses (alt bg) */}
      <ContentSection bg="white" paddingY={V3.marketingPadY}>
        <TwoCol label="About lenses">
          <p style={{ margin: '0 0 24px 0' }}>
            Lenses are diagnostic instruments. Each one looks at a different dimension of how you operate. They’re not tests — there are no right or wrong answers. They’re structured ways of seeing.
          </p>
          <p style={{ margin: '0 0 24px 0' }}>
            You can take a lens anytime. Or you can just talk through what’s on your mind and a clearer way of looking shows up. The lenses calibrate the intelligence; the conversation is where the thinking happens.
          </p>
          <p style={{ margin: '0 0 32px 0' }}>
            CPI is the flagship — a full-day private assessment with an LYC advisor, by introduction only. The deepest lens available and the gold standard for executive self-awareness.
          </p>
          <Link
            to="/lenses"
            onClick={() => trackCTA({ location: 'how-lenses', label: 'Explore all eleven lenses', destination: '/lenses' })}
            style={{
              fontFamily: V3.bodyFont,
              fontSize: '0.85rem',
              color: V3.ocean600,
              textDecoration: 'none',
              borderBottom: `1px solid ${V3.ocean600}`,
              paddingBottom: 2,
            }}
          >
            Explore all eleven lenses →
          </Link>
        </TwoCol>
      </ContentSection>

      {/* Section 3 — Discretion (dark bg) */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY}>
        <TwoCol label="Discretion" onDark>
          <p style={{ margin: '0 0 24px 0', color: V3.onDarkMuted }}>
            Everything you share is private. End-to-end. Conversations are never used to train models. Your data is never sold or shared.
          </p>
          <p style={{ margin: '0 0 24px 0', color: V3.onDarkMuted }}>
            This isn’t a team product. It isn’t a collaboration tool. You don’t invite your colleagues. There’s no admin dashboard watching what you do.
          </p>
          <p style={{ margin: 0, color: V3.onDarkMuted }}>
            It’s yours. Like a notebook, but intelligent. Like a conversation with yourself, but with a second opinion in the room.
          </p>
        </TwoCol>
      </ContentSection>

      {/* Section 4 — Bottom CTA */}
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <Container style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <MonoLabel color={V3.ocean600} style={{ display: 'block', margin: '0 0 20px 0' }}>
            The baseline
          </MonoLabel>
          <SectionTitle style={{ marginBottom: 24 }}>
            Start with two lenses.
            <br />
            See where you stand.
          </SectionTitle>
          <BodySerif style={{ margin: '0 0 36px 0' }}>
            LEAP and PRISM — complimentary, no card required. Ten minutes each. A clear first picture.
          </BodySerif>
          <Button
            to="/lenses"
            variant="primary"
            onClick={() => trackCTA({ location: 'how-cta', label: 'Explore the lenses', destination: '/lenses' })}
          >
            Explore the lenses
          </Button>
        </Container>
      </ContentSection>
    </>
  );
}

export default HowPage;
