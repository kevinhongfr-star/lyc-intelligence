/**
 * V7.0 — Membership page (/membership).
 *
 * Five-tier detail page. Dark header + intro, 5-column tier row (Pro = dark
 * flagship variant), pull quote, bottom CTA. Tier data from MARKETING_TIERS.
 *
 * Backend wiring:
 *  - Explorer CTA → /auth (signup)
 *  - Paid tiers (Starter/Pro/Executive) → /auth?tier=<key> (signup first;
 *    in-app checkout uses canonical backend pricing). Marketing prices are
 *    V7.0 display copy; billing reconciliation is out of scope for the
 *    marketing surface rebuild.
 *  - Council "Enquire" → mailto contact (invite-only)
 *
 * Editorial minimalism: rule lines between tier columns, zero radius.
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
  PullQuote,
  Button,
  MonoLabel,
  SectionTitle,
  BodySerif,
} from '@/components/marketing/v7-shell';
import { MARKETING_TIERS, type MarketingTier } from '@/config/marketing-data';

const CONTACT_EMAIL = 'hello@lycintelligence.com';

/* ── Tier key mapping (V7.0 name → backend TierKey) ── */
const TIER_KEY_MAP: Record<string, string> = {
  Explorer: 'explorer',
  Starter: 'starter',
  Pro: 'pro',
  Executive: 'executive',
  Council: 'council',
};

function tierDestination(tier: MarketingTier): string {
  // Explorer + paid tiers route through /auth (signup/signin first).
  // Council is invite-only → mailto handled separately.
  const key = TIER_KEY_MAP[tier.name];
  return key ? `/auth?tier=${key}` : tier.ctaDestination;
}

/* ── Tier column ──
 * 5-column horizontal row. Pro (featured) renders as dark flagship variant.
 * Rule lines between columns (1px solid), zero radius, no shadow.
 */
function TierColumn({ tier, index }: { tier: MarketingTier; index: number }): React.ReactElement {
  const onDark = tier.featured === true;
  const bg = onDark ? V3.ink900 : V3.white;
  const textColor = onDark ? V3.cream : V3.ink900;
  const priceColor = onDark ? V3.teal300 : V3.ocean600;
  const descColor = onDark ? V3.onDarkMuted : V3.ink700;
  const borderColor = onDark ? 'rgba(250,250,250,0.10)' : V3.ink200;

  const isCouncil = tier.name === 'Council';
  const dest = isCouncil ? `mailto:${CONTACT_EMAIL}` : tierDestination(tier);

  return (
    <div
      className="reveal v3-tier-col"
      style={{
        background: bg,
        padding: '36px 24px',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: index === 0 ? 'none' : `1px solid ${borderColor}`,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
      }}
    >
      {/* Level label */}
      <MonoLabel
        color={onDark ? V3.teal400 : V3.ink400}
        style={{ display: 'block', margin: '0 0 16px 0' }}
      >
        {tier.level}
      </MonoLabel>

      {/* Name (serif) */}
      <h3
        style={{
          fontFamily: V3.displayFont,
          fontSize: '1.5rem',
          lineHeight: 1.25,
          fontWeight: V3.fwRegular,
          color: textColor,
          margin: '0 0 8px 0',
          letterSpacing: V3.trackingDisplay,
        }}
      >
        {tier.name}
      </h3>

      {/* Price */}
      <p
        style={{
          fontFamily: V3.displayFont,
          fontSize: '1.2rem',
          fontWeight: V3.fwRegular,
          color: priceColor,
          margin: '0 0 24px 0',
        }}
      >
        {tier.price}
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: V3.displayFont,
          fontSize: '1rem',
          lineHeight: V3.leadingBodySerif,
          fontWeight: V3.fwRegular,
          color: descColor,
          margin: '0 0 32px 0',
          flex: 1,
        }}
      >
        {tier.description}
      </p>

      {/* CTA */}
      {isCouncil ? (
        <a
          href={dest}
          onClick={() => trackCTA({ location: 'membership', label: tier.cta, destination: dest })}
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
          {tier.cta} →
        </a>
      ) : (
        <Link
          to={dest}
          onClick={() => trackCTA({ location: 'membership', label: tier.cta, destination: dest })}
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
          {tier.cta} →
        </Link>
      )}
    </div>
  );
}

export function MembershipPage(): React.ReactElement {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <>
      <SEO
        page="membership"
        title="Membership — Five levels of access. One standard of intelligence. | NEXUS."
        description="Quality doesn't change between tiers. The scope of access does. Start wherever it makes sense and move up when the work calls for it."
        path="/membership"
      />

      {/* Section 1 — Dark header + intro */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY}>
        <PageHeader
          eyebrow="Membership"
          title={
            <>
              Five levels of access.
              <br />
              One standard of intelligence.
            </>
          }
          lead="Quality doesn’t change between tiers. The scope of access does. Start wherever it makes sense and move up when the work calls for it."
          onDark
        />
        <Container style={{ marginTop: 56, maxWidth: 760 }}>
          <p style={{ fontFamily: V3.displayFont, fontSize: V3.textBodySerif, lineHeight: V3.leadingBodySerif, color: V3.onDarkMuted, margin: '0 0 24px 0' }}>
            Every tier gets the same intelligence. The same measured, competent attention. The same commitment to discretion.
          </p>
          <p style={{ fontFamily: V3.displayFont, fontSize: V3.textBodySerif, lineHeight: V3.leadingBodySerif, color: V3.onDarkMuted, margin: '0 0 24px 0' }}>
            What changes is depth. How many lenses you have access to. How much human support you want. How fully you want to integrate it into how you work.
          </p>
          <p style={{ fontFamily: V3.displayFont, fontSize: V3.textBodySerif, lineHeight: V3.leadingBodySerif, color: V3.onDarkMuted, margin: 0 }}>
            No contracts. No commitments. Move up or down whenever you want.
          </p>
        </Container>
      </ContentSection>

      {/* Section 2 — 5-tier detail row */}
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <Container>
          <div
            className="v3-tier-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 0,
            }}
          >
            {MARKETING_TIERS.map((tier, i) => (
              <TierColumn key={tier.name} tier={tier} index={i} />
            ))}
          </div>
        </Container>
      </ContentSection>

      {/* Section 3 — Pull quote */}
      <ContentSection bg="white" paddingY={V3.marketingPadY}>
        <PullQuote
          quote="Quality doesn’t go up when you pay more. It’s the same intelligence at every tier. You just get more of it, and deeper access."
          attribution="— the membership principle"
        />
      </ContentSection>

      {/* Section 4 — Bottom CTA (dark) */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY}>
        <Container style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <MonoLabel color={V3.teal400} style={{ display: 'block', margin: '0 0 20px 0' }}>
            Questions
          </MonoLabel>
          <SectionTitle onDark style={{ marginBottom: 24 }}>
            Not sure which is right? Start with Explorer.
          </SectionTitle>
          <BodySerif onDark style={{ margin: '0 0 36px 0' }}>
            It’s complimentary. Takes five minutes. You’ll know pretty quickly if you want more.
          </BodySerif>
          <Button
            to="/auth"
            variant="primary"
            onDark
            onClick={() => trackCTA({ location: 'membership-cta', label: 'Begin with Explorer', destination: '/auth' })}
          >
            Begin with Explorer
          </Button>
        </Container>
      </ContentSection>
    </>
  );
}

export default MembershipPage;
