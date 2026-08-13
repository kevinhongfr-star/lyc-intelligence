import React, { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { DS } from '@/tokens';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ASSESSMENT_CATALOG,
  type AssessmentInfo,
} from '@/assessments/catalog';
import { SEO } from '@/components/seo/SEO';
import { trackCTA } from '@/analytics/eventTracker';

type FilterCategory = 'all' | 'self-awareness' | 'leadership-impact' | 'transition-change' | 'team-culture';

const CATEGORY_FILTERS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'self-awareness', label: 'Self-Awareness' },
  { key: 'leadership-impact', label: 'Leadership Impact' },
  { key: 'transition-change', label: 'Transition & Change' },
  { key: 'team-culture', label: 'Team & Culture' },
];

const ASSESSMENT_CATEGORIES: Record<string, FilterCategory> = {
  cpi: 'self-awareness',
  prism: 'self-awareness',
  spark: 'self-awareness',
  coach: 'self-awareness',
  impact: 'leadership-impact',
  leap: 'leadership-impact',
  forge: 'leadership-impact',
  bridge: 'transition-change',
  drive: 'transition-change',
  mosaic: 'transition-change',
  quest: 'team-culture',
};

const ALL_11_ORDER = ['CPI', 'LEAP', 'SPARK', 'IMPACT', 'QUEST', 'BRIDGE', 'DRIVE', 'FORGE', 'COACH', 'PRISM', 'MOSAIC'];

interface CatalogEntry {
  code: string;
  slug: string;
  name: string;
  benefit: string;
  dimensions: number;
  archetypes: number;
  price: number;
  questions: number;
  minutes: number;
}

function buildCatalogEntry(code: string): CatalogEntry {
  const slug = code.toLowerCase();
  const fromCatalog: AssessmentInfo | undefined = (ASSESSMENT_CATALOG as any)[code];
  if (fromCatalog) {
    return {
      code,
      slug,
      name: fromCatalog.name,
      benefit: fromCatalog.tagline || `${fromCatalog.b2cName} assessment.`,
      dimensions: fromCatalog.dimensions.length,
      archetypes: fromCatalog.archetype_count,
      price: fromCatalog.priceMiles,
      questions: fromCatalog.total_questions,
      minutes: fromCatalog.duration_minutes,
    };
  }
  const FALLBACKS: Record<string, Partial<CatalogEntry> & { name: string; benefit: string }> = {
    CPI: { name: 'China Pipeline Index', benefit: 'Flagship executive positioning diagnostic for APAC markets.', dimensions: 6, archetypes: 12, price: 199, questions: 120, minutes: 45 },
    LEAP: { name: 'LEAP Transition', benefit: 'Role-transition readiness for executives stepping up or across.', dimensions: 5, archetypes: 16, price: 149, questions: 80, minutes: 30 },
    IMPACT: { name: 'IMPACT Board', benefit: 'Governance and board-level contribution calibration.', dimensions: 5, archetypes: 9, price: 149, questions: 75, minutes: 25 },
    QUEST: { name: 'QUEST Leadership', benefit: 'Leadership operating model across six executive dimensions.', dimensions: 6, archetypes: 12, price: 149, questions: 90, minutes: 30 },
    COACH: { name: 'COACH Developmental', benefit: 'Developmental coaching orientation and bilateral capability.', dimensions: 4, archetypes: 8, price: 99, questions: 60, minutes: 20 },
  };
  const fb = FALLBACKS[code] || { name: code, benefit: `${code} executive assessment.`, dimensions: 4, archetypes: 8, price: 99, questions: 60, minutes: 20 };
  return {
    code,
    slug,
    name: fb.name,
    benefit: fb.benefit,
    dimensions: fb.dimensions ?? 4,
    archetypes: fb.archetypes ?? 8,
    price: fb.price ?? 99,
    questions: fb.questions ?? 60,
    minutes: fb.minutes ?? 20,
  };
}

const FULL_CATALOG: CatalogEntry[] = ALL_11_ORDER.map(buildCatalogEntry);
const BY_CODE: Record<string, CatalogEntry> = Object.fromEntries(FULL_CATALOG.map((e) => [e.code, e]));

function FlagshipBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: DS.monoFont,
        fontSize: '10px',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        background: DS.accent,
        color: DS.bg,
        padding: '4px 10px',
        fontWeight: 600,
      }}
    >
      Flagship
    </span>
  );
}

function MethodologySignal({ entry }: { entry: CatalogEntry }) {
  return (
    <div
      style={{
        fontFamily: DS.monoFont,
        fontSize: '11px',
        letterSpacing: '0.06em',
        color: DS.muted,
        textTransform: 'uppercase',
      }}
    >
      {entry.dimensions} dimensions · {entry.archetypes} archetypes
    </div>
  );
}

function LearnMoreLink({ slug }: { slug: string }) {
  return (
    <a
      href={`/assessment/${slug}`}
      onClick={() => trackCTA({ location: 'catalog_card', label: `Learn more: ${slug}`, destination: `/assessment/${slug}` })}
      style={{
        fontFamily: DS.bodyFont,
        fontSize: '13px',
        fontWeight: 600,
        color: DS.text,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: `1px solid ${DS.border}`,
        paddingBottom: '2px',
      }}
    >
      Learn more <ArrowRight style={{ width: 12, height: 12 }} />
    </a>
  );
}

function FlagshipCard() {
  const cpi = BY_CODE['CPI'];
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Card variant="flat" interactive>
        <CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FlagshipBadge />
            <div>
              <CardTitle
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: '32px',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                }}
              >
                {cpi.name}
              </CardTitle>
              <CardDescription
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '15px',
                  marginTop: '8px',
                  color: DS.textSecondary,
                }}
              >
                {cpi.benefit}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <MethodologySignal entry={cpi} />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  trackCTA({ location: 'catalog_flagship', label: 'Start CPI Assessment', destination: '/assessment/cpi' });
                  window.location.href = '/assessment/cpi';
                }}
              >
                Start CPI Assessment
              </Button>
              <LearnMoreLink slug={cpi.slug} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HeroCard({ code }: { code: string }) {
  const entry = BY_CODE[code];
  return (
    <Card variant="flat" interactive>
      <CardHeader>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: DS.eyebrow,
            marginBottom: '8px',
          }}
        >
          {entry.code}
        </div>
        <CardTitle
          style={{
            fontFamily: DS.headingFont,
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {entry.name}
        </CardTitle>
        <CardDescription
          style={{
            fontFamily: DS.bodyFont,
            fontSize: '13.5px',
            marginTop: '6px',
            color: DS.textSecondary,
            minHeight: '44px',
          }}
        >
          {entry.benefit}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          <MethodologySignal entry={entry} />
          <LearnMoreLink slug={entry.slug} />
        </div>
      </CardContent>
    </Card>
  );
}

function FullCatalogCard({ entry }: { entry: CatalogEntry }) {
  return (
    <a
      href={`/assessment/${entry.slug}`}
      onClick={() => trackCTA({ location: 'catalog_grid', label: `Card: ${entry.code}`, destination: `/assessment/${entry.slug}` })}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
    >
      <Card variant="flat" interactive style={{ height: '100%' }}>
        <CardHeader>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: DS.eyebrow,
              marginBottom: '8px',
            }}
          >
            {entry.code}
          </div>
          <CardTitle
            style={{
              fontFamily: DS.headingFont,
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {entry.name}
          </CardTitle>
          <CardDescription
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12.5px',
              marginTop: '4px',
              color: DS.textSecondary,
              minHeight: '38px',
            }}
          >
            {entry.benefit}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <MethodologySignal entry={entry} />
            <ArrowRight style={{ width: 14, height: 14, color: DS.text }} />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

function FilterTabs({
  active,
  onChange,
}: {
  active: FilterCategory;
  onChange: (k: FilterCategory) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0',
        borderBottom: `1px solid ${DS.border}`,
        marginBottom: '32px',
      }}
    >
      {CATEGORY_FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.key)}
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? DS.text : DS.textSecondary,
              background: 'transparent',
              border: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
              borderBottom: isActive ? `2px solid ${DS.accent}` : '2px solid transparent',
              transition: DS.transition,
              marginBottom: '-1px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = DS.text;
                (e.currentTarget as HTMLButtonElement).style.borderBottom = `2px solid ${DS.accent}4D`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = DS.textSecondary;
                (e.currentTarget as HTMLButtonElement).style.borderBottom = '2px solid transparent';
              }
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

const PAGE_STYLE: React.CSSProperties = {
  minHeight: '100vh',
  background: DS.bg,
  color: DS.text,
};

const WRAPPER: React.CSSProperties = {
  maxWidth: '1180px',
  margin: '0 auto',
  padding: '64px 32px',
};

const SECTION_HEAD: React.CSSProperties = {
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: `1px solid ${DS.border}`,
};

const EYEBROW_MONO: React.CSSProperties = {
  fontFamily: DS.monoFont,
  fontSize: '10px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: DS.eyebrow,
  marginBottom: '8px',
  fontWeight: 600,
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: DS.headingFont,
  fontSize: '26px',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  margin: 0,
  color: DS.text,
};

const SECTION_SUB: React.CSSProperties = {
  fontFamily: DS.bodyFont,
  fontSize: '13.5px',
  color: DS.textSecondary,
  marginTop: '6px',
  lineHeight: 1.55,
  maxWidth: '620px',
};

const PAGE_TITLE: React.CSSProperties = {
  fontFamily: DS.headingFont,
  fontSize: 'clamp(34px, 5vw, 48px)',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 12px',
  color: DS.text,
  lineHeight: 1.1,
};

const PAGE_LEAD: React.CSSProperties = {
  fontFamily: DS.bodyFont,
  fontSize: '15px',
  color: DS.textSecondary,
  lineHeight: 1.65,
  maxWidth: '640px',
  margin: 0,
};

const HERO_WRAP: React.CSSProperties = {
  background: DS.bgAlt,
  padding: '64px 32px',
  borderBottom: `1px solid ${DS.border}`,
};

const HERO_INNER: React.CSSProperties = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '32px',
  flexWrap: 'wrap',
};

export function AssessmentCatalogPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const filteredCatalog = useMemo(() => {
    if (activeFilter === 'all') return FULL_CATALOG;
    return FULL_CATALOG.filter((e) => ASSESSMENT_CATEGORIES[e.slug] === activeFilter);
  }, [activeFilter]);

  return (
    <div style={PAGE_STYLE}>
      <SEO page="assessments" />

      <div style={HERO_WRAP}>
        <div style={HERO_INNER}>
          <div>
            <div style={EYEBROW_MONO}>Assessment Catalog</div>
            <h1 style={PAGE_TITLE}>
              Eleven leadership assessments.<br />One right fit per moment.
            </h1>
            <p style={PAGE_LEAD}>
              Validated against 20 years of LYC APAC placement data. Targeted diagnostics
              matched to the transition you are actually in — not generic personality tests.
            </p>
          </div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '11px',
              color: DS.muted,
              letterSpacing: '0.16em',
              textAlign: 'right',
            }}
          >
            11 ASSESSMENTS · USD PRICING · COMPLIMENTARY INTRO AVAILABLE
          </div>
        </div>
      </div>

      <main style={WRAPPER}>
        {/* SECTION 1 — FLAGSHIP CPI */}
        <section style={{ marginBottom: '72px' }}>
          <div style={SECTION_HEAD}>
            <div style={EYEBROW_MONO}>01 · Flagship</div>
            <h2 style={SECTION_TITLE}>Flagship Instrument</h2>
            <p style={SECTION_SUB}>
              The CPI is our flagship — validated against two decades of APAC executive placements.
              For executives who want the complete calibration.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}
          >
            <FlagshipCard />
          </div>
        </section>

        {/* SECTION 2 — HERO ASSESSMENTS (LEAP, SPARK, IMPACT) */}
        <section style={{ marginBottom: '72px' }}>
          <div style={SECTION_HEAD}>
            <div style={EYEBROW_MONO}>02 · Hero</div>
            <h2 style={SECTION_TITLE}>Hero Assessments</h2>
            <p style={SECTION_SUB}>
              Three focused diagnostics for the most common executive pressure points
              in mid-career transition, AI leadership readiness, and board-level contribution.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
            className="hero-grid"
          >
            <HeroCard code="LEAP" />
            <HeroCard code="SPARK" />
            <HeroCard code="IMPACT" />
          </div>
        </section>

        {/* SECTION 3 — FULL CATALOG 11 WITH FILTER TABS */}
        <section style={{ marginBottom: '24px' }}>
          <div style={SECTION_HEAD}>
            <div style={EYEBROW_MONO}>03 · Full Catalog</div>
            <h2 style={SECTION_TITLE}>Browse All Eleven Instruments</h2>
            <p style={SECTION_SUB}>
              Filter by category. Every assessment can be started directly from its landing page
              or surfaced through NEXUS if you are unsure which fits.
            </p>
          </div>

          <FilterTabs active={activeFilter} onChange={setActiveFilter} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
            className="catalog-grid"
          >
            {filteredCatalog.map((entry) => (
              <FullCatalogCard key={entry.code} entry={entry} />
            ))}
          </div>
        </section>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .catalog-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .catalog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .catalog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default AssessmentCatalogPage;
