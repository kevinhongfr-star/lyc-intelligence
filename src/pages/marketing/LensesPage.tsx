/**
 * V7.0 — Lenses page (/lenses).
 *
 * Lens library grouped by 4 pillars. Uses MARKETING_LENSES (built from
 * ASSESSMENT_CATALOG) — no hardcoded lens list. CPI renders as dark
 * flagship variant. 3-column grid desktop, 1-column mobile.
 *
 * Editorial minimalism: rule lines between pillars, zero radius, no shadows.
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
  Button,
  MonoLabel,
  SectionTitle,
  BodySerif,
  RuleLine,
} from '@/components/marketing/v7-shell';
import {
  MARKETING_LENSES,
  PILLAR_GROUPS,
  type MarketingLens,
  type LensPillar,
} from '@/config/marketing-data';

/* ── Pillar display labels + ordering ── */
const PILLAR_META: Record<LensPillar, { label: string; count: string }> = {
  positioning: { label: 'Positioning', count: '2 lenses' },
  leadership: { label: 'Leadership', count: '3 lenses' },
  operating: { label: 'Operating', count: '4 lenses' },
  narrative: { label: 'Narrative', count: '2 lenses' },
};

/* ── Lens card ──
 * Default = white surface. CPI = dark flagship variant (ink-900 bg, cream
 * text). Borders are handled by the .v3-lens-grid rule lines between cells
 * (editorial minimalism — rule lines, not boxed cards).
 */
function LensCard({ lens }: { lens: MarketingLens }): React.ReactElement {
  const onDark = lens.flagship;
  const cardBg = onDark ? V3.ink900 : V3.white;
  const textColor = onDark ? V3.cream : V3.ink900;
  const descColor = onDark ? V3.onDarkMuted : V3.ink700;

  return (
    <article
      className="reveal"
      style={{
        background: cardBg,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 260,
      }}
    >
      {/* Code + tier badge row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: V3.monoFont,
            fontSize: '0.95rem',
            letterSpacing: V3.trackingMono,
            color: onDark ? V3.teal300 : V3.ocean600,
            fontWeight: V3.fwMedium,
          }}
        >
          {lens.code}
        </span>
        {lens.flagship ? (
          <MonoLabel color={V3.fuchsia600}>Flagship</MonoLabel>
        ) : lens.complimentary ? (
          <MonoLabel color={onDark ? V3.teal300 : V3.teal600}>
            Complimentary
          </MonoLabel>
        ) : (
          <MonoLabel color={onDark ? V3.onDarkMuted : V3.ink400}>
            {lens.tierLabel}
          </MonoLabel>
        )}
      </div>

      {/* Name (serif) */}
      <h3
        style={{
          fontFamily: V3.displayFont,
          fontSize: '1.3rem',
          lineHeight: 1.3,
          fontWeight: V3.fwRegular,
          color: textColor,
          margin: '0 0 12px 0',
          letterSpacing: V3.trackingDisplay,
        }}
      >
        {lens.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: V3.displayFont,
          fontSize: '1.05rem',
          lineHeight: V3.leadingBodySerif,
          fontWeight: V3.fwRegular,
          color: descColor,
          margin: '0 0 24px 0',
          flex: 1,
        }}
      >
        {lens.description}
      </p>

      {/* Meta row: duration · tier */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 20,
          fontFamily: V3.monoFont,
          fontSize: '0.68rem',
          letterSpacing: V3.trackingMono,
          textTransform: 'uppercase',
          color: onDark ? V3.onDarkMuted : V3.ink400,
        }}
      >
        <span>{lens.durationLabel}</span>
        <span aria-hidden>·</span>
        <span>{lens.tierLabel}</span>
      </div>

      {/* CTA */}
      <Link
        to={lens.ctaDestination}
        onClick={() =>
          trackCTA({
            location: 'lenses',
            label: lens.ctaLabel,
            destination: lens.ctaDestination,
          })
        }
        style={{
          fontFamily: V3.bodyFont,
          fontSize: '0.85rem',
          fontWeight: V3.fwMedium,
          color: onDark ? V3.teal300 : V3.ocean600,
          textDecoration: 'none',
          borderBottom: `1px solid ${onDark ? V3.teal300 : V3.ocean600}`,
          paddingBottom: 2,
          alignSelf: 'flex-start',
        }}
      >
        {lens.ctaLabel} →
      </Link>
    </article>
  );
}

/* ── Pillar block: label header + 3-col grid of lens cards ── */
function PillarBlock({ pillar }: { pillar: LensPillar }): React.ReactElement {
  const meta = PILLAR_META[pillar];
  const lenses = MARKETING_LENSES.filter((l) => l.pillar === pillar);
  return (
    <div className="reveal" style={{ marginBottom: 80 }}>
      {/* Pillar header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '0 0 20px 0',
          borderBottom: `1px solid ${V3.ink200}`,
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            fontFamily: V3.displayFont,
            fontSize: '1.8rem',
            lineHeight: 1.25,
            fontWeight: V3.fwRegular,
            color: V3.ink900,
            margin: 0,
            letterSpacing: V3.trackingDisplay,
          }}
        >
          {meta.label}
        </h2>
        <MonoLabel color={V3.ink400}>{meta.count}</MonoLabel>
      </div>

      {/* Lens grid — 3 col desktop, 1 col mobile (CSS class) */}
      <div className="v3-lens-grid">
        {lenses.map((lens) => (
          <LensCard key={lens.code} lens={lens} />
        ))}
      </div>
    </div>
  );
}

export function LensesPage(): React.ReactElement {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <>
      <SEO
        page="lenses"
        title="Lenses — Eleven ways of looking. One full picture. | NEXUS."
        description="Each lens is a different instrument — a structured way of seeing a specific dimension of how you operate. Use them one at a time, or the right one finds you."
        path="/lenses"
      />

      {/* Page header */}
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <PageHeader
          eyebrow="Lenses"
          title={
            <>
              Eleven ways of looking.
              <br />
              One full picture.
            </>
          }
          lead="Each lens is a different instrument \u2014 a structured way of seeing a specific dimension of how you operate. Use them one at a time, or the right one finds you."
        />
      </ContentSection>

      {/* Pillar groups */}
      <ContentSection bg="cream" paddingY={0} style={{ paddingBottom: V3.marketingPadY }}>
        <Container>
          {PILLAR_GROUPS.map((group) => (
            <PillarBlock key={group.id} pillar={group.id} />
          ))}
        </Container>
      </ContentSection>

      {/* Bottom CTA — dark */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY}>
        <Container style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <MonoLabel color={V3.teal400} style={{ display: 'block', margin: '0 0 20px 0' }}>
            Talk it through
          </MonoLabel>
          <SectionTitle onDark style={{ marginBottom: 24 }}>
            The right lens finds you.
          </SectionTitle>
          <BodySerif onDark style={{ margin: '0 0 36px 0' }}>
            You don’t have to pick. Talk through what’s on your mind, and the right lens shows up.
          </BodySerif>
          <Button
            to="/auth"
            variant="primary"
            onDark
            onClick={() => trackCTA({ location: 'lenses-cta', label: 'Start here', destination: '/auth' })}
          >
            Start here
          </Button>
        </Container>
      </ContentSection>
    </>
  );
}

export default LensesPage;
