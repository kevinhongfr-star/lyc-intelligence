/**
 * V7.0 — Journal page (/journal).
 *
 * Editorial article list with rule lines between rows. Article data is
 * static placeholder (JOURNAL_ARTICLES) — structured for CMS integration
 * later. Rows are clickable (# placeholder links for now).
 *
 * Bottom CTA "Get the journal" → mailto fallback (no existing newsletter
 * API; CMS/newsletter integration deferred per spec scope).
 *
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
  MonoLabel,
  SectionTitle,
  BodySerif,
} from '@/components/marketing/v7-shell';
import { JOURNAL_ARTICLES, type JournalArticle } from '@/config/marketing-data';

const CONTACT_EMAIL = 'hello@lycintelligence.com';

/* ── Article row — clickable, rule lines between ── */
function ArticleRow({
  article,
  index,
}: {
  article: JournalArticle;
  index: number;
}): React.ReactElement {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        trackCTA({ location: 'journal', label: article.title, destination: '#' });
      }}
      className="reveal v3-journal-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 140px',
        gap: 32,
        padding: '32px 0',
        alignItems: 'baseline',
        textDecoration: 'none',
        borderTop: index === 0 ? `1px solid ${V3.ink200}` : 'none',
        borderBottom: `1px solid ${V3.ink200}`,
        transition: `background ${V3.durNormal}ms ${V3.ease}`,
      }}
    >
      {/* Date (mono, left) */}
      <span
        style={{
          fontFamily: V3.monoFont,
          fontSize: '0.78rem',
          letterSpacing: V3.trackingMono,
          textTransform: 'uppercase',
          color: V3.ink400,
          fontWeight: V3.fwMedium,
        }}
      >
        {article.date}
      </span>

      {/* Title + excerpt */}
      <div>
        <h3
          style={{
            fontFamily: V3.displayFont,
            fontSize: '1.5rem',
            lineHeight: 1.3,
            fontWeight: V3.fwRegular,
            color: V3.ink900,
            margin: '0 0 8px 0',
            letterSpacing: V3.trackingDisplay,
          }}
        >
          {article.title}
        </h3>
        <p
          style={{
            fontFamily: V3.displayFont,
            fontSize: '1.05rem',
            lineHeight: V3.leadingBodySerif,
            fontWeight: V3.fwRegular,
            color: V3.ink500,
            margin: 0,
          }}
        >
          {article.excerpt}
        </p>
      </div>

      {/* Tag (mono label, right) */}
      <MonoLabel
        color={V3.ocean500}
        style={{ justifySelf: 'end', textAlign: 'right' }}
      >
        {article.tag}
      </MonoLabel>
    </a>
  );
}

export function JournalPage(): React.ReactElement {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  const journalMailto = `mailto:${CONTACT_EMAIL}?subject=Journal%20subscription&body=I'd%20like%20to%20receive%20the%20weekly%20NEXUS%20journal.`;

  return (
    <>
      <SEO
        page="journal"
        title="Journal — Reading for people who think carefully. | NEXUS."
        description="Essays on leadership, decision-making, and the quiet work of running something important. One new piece per week."
        path="/journal"
      />

      {/* Page header */}
      <ContentSection bg="cream" paddingY={V3.marketingPadY}>
        <PageHeader
          eyebrow="Journal"
          title={
            <>
              Reading for people who
              <br />
              think carefully.
            </>
          }
          lead="Essays on leadership, decision-making, and the quiet work of running something important. One new piece per week."
        />
      </ContentSection>

      {/* Article list */}
      <ContentSection bg="cream" paddingY={0} style={{ paddingBottom: V3.marketingPadY }}>
        <Container>
          {JOURNAL_ARTICLES.map((article, i) => (
            <ArticleRow key={article.title} article={article} index={i} />
          ))}
        </Container>
      </ContentSection>

      {/* Bottom CTA — dark */}
      <ContentSection bg="dark" paddingY={V3.marketingPadY}>
        <Container style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <MonoLabel color={V3.teal400} style={{ display: 'block', margin: '0 0 20px 0' }}>
            Weekly
          </MonoLabel>
          <SectionTitle onDark style={{ marginBottom: 24 }}>
            One essay.
            <br />
            Every Friday.
          </SectionTitle>
          <BodySerif onDark style={{ margin: '0 0 36px 0' }}>
            Short enough to read before your first meeting. Long enough to stay with you all week.
          </BodySerif>
          <a
            href={journalMailto}
            onClick={() => trackCTA({ location: 'journal-cta', label: 'Get the journal', destination: journalMailto })}
            className="v3-cta-primary"
            style={{
              display: 'inline-block',
              fontFamily: V3.bodyFont,
              fontSize: '0.9rem',
              fontWeight: V3.fwMedium,
              textDecoration: 'none',
              padding: '14px 32px',
              background: V3.cream,
              color: V3.ink900,
              transition: `transform ${V3.durNormal}ms ${V3.ease}, background ${V3.durNormal}ms ${V3.ease}`,
              cursor: 'pointer',
            }}
          >
            Get the journal
          </a>
        </Container>
      </ContentSection>
    </>
  );
}

export default JournalPage;
