import React from 'react';
import { Link } from 'react-router-dom';
import {
  ASSESSMENT_CATALOG,
  FLAGSHIP_KEYS,
  SHIFT_SUITE_KEYS,
  ADVISORY_PRODUCT_KEYS,
  TIER_GROUP_LABELS,
  type InstrumentTierGroup,
  type AssessmentInfo,
} from '@/assessments/catalog';

interface SectionProps {
  tierGroup: InstrumentTierGroup;
  keys: string[];
}

function InstrumentCard({ key, assessment, fullWidth }: { key?: string | number; assessment: AssessmentInfo; fullWidth?: boolean }) {
  void key;
  const accentBg = assessment.code === 'CPI' ? '#C108AB' : '#1a1a2e';
  const dimNames = assessment.dimensions.slice(0, 3).map((d) => d.name);
  const moreCount = assessment.dimensions.length - dimNames.length;
  const dimsText = moreCount > 0
    ? `${dimNames.join(', ')}, …`
    : dimNames.join(', ');

  return (
    <div
      className={`bg-bg-primary border border-bg-tertiary p-5 flex flex-col hover:bg-bg-secondary transition-colors ${
        fullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''
      }`}
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            background: accentBg,
            color: '#ffffff',
            padding: '4px 8px',
            fontSize: '10px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {assessment.code}
        </span>
      </div>

      <h3
        className="font-serif font-semibold text-text-primary text-lg mb-1"
        style={{ lineHeight: 1.25 }}
      >
        {assessment.b2cName}
      </h3>

      <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
        <span>{assessment.total_questions} questions</span>
        <span>·</span>
        <span>{assessment.duration_minutes} min</span>
        <span>·</span>
        <span>{assessment.style_count} archetypes</span>
      </div>

      <p className="text-sm text-text-muted mb-4 line-clamp-2" style={{ minHeight: '2.5rem' }}>
        {assessment.tagline}
      </p>

      <div className="flex items-center flex-wrap gap-2 mb-4">
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-1 border border-bg-tertiary text-text-muted"
          style={{ fontFamily: 'monospace' }}
        >
          {assessment.dimensions.length} dimensions
        </span>
        <span className="text-xs text-text-muted truncate" style={{ flex: 1, minWidth: 0 }}>
          {dimsText}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-1 border border-bg-tertiary text-text-muted whitespace-nowrap"
        >
          {assessment.tierLabel}
        </span>

        <span
          className="font-serif text-2xl font-bold"
          style={{ color: '#C108AB' }}
        >
          {assessment.priceMiles} mi
        </span>

        <Link
          to={`/assessment/${assessment.code.toLowerCase()}`}
          className="text-sm text-text-primary px-3 py-1.5 border border-bg-tertiary hover:bg-bg-tertiary transition-colors whitespace-nowrap"
          style={{ borderRadius: 0 }}
        >
          Explore →
        </Link>
      </div>
    </div>
  );
}

function TierSection({ tierGroup, keys }: SectionProps) {
  const label = TIER_GROUP_LABELS[tierGroup];
  const isFlagship = tierGroup === 'flagship';

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm tracking-widest uppercase text-text-muted"
          style={{ fontFamily: 'monospace' }}
        >
          {label}
        </h2>
        <span className="text-xs text-text-muted">
          {keys.length} instrument{keys.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        className="w-full mb-5"
        style={{ borderTop: '1px solid #c8cbd0' }}
      />

      <div
        className={`grid gap-4 ${
          isFlagship
            ? 'grid-cols-1'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {keys.map((code) => {
          const info = ASSESSMENT_CATALOG[code];
          if (!info) return null;
          return (
            <InstrumentCard
              key={code}
              assessment={info}
              fullWidth={isFlagship}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function AssessmentCatalog() {
  return (
    <div className="space-y-0">
      <TierSection tierGroup="flagship" keys={FLAGSHIP_KEYS} />
      <TierSection tierGroup="shift" keys={SHIFT_SUITE_KEYS} />
      <TierSection tierGroup="advisory" keys={ADVISORY_PRODUCT_KEYS} />
    </div>
  );
}
