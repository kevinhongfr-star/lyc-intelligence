/**
 * Diagnostic Page Layout (T-106 to T-112)
 * Reusable layout for all 9 diagnostic pages.
 * Hero → About → Archetype Grid → Assessment CTA → Free Result → Email Gate → Full Report → Related → SoftCTA
 */

import React, { useState } from 'react';
import { InstrumentId, DimensionScore, ArchetypeResult } from '@/types/assessment';
import { getArchetypesByInstrument } from '@/data/archetypes';
import { INSTRUMENTS } from '@/data/instruments';
import { ArchetypeCard } from '@/components/archetype/ArchetypeCard';
import { RadarChart } from '@/components/archetype/RadarChart';
import { EmailGate } from './EmailGate';
import { SoftCTABlock } from './SoftCTABlock';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';

interface DiagnosticPageLayoutProps {
  instrumentId: InstrumentId;
  title: string;
  tagline: string;
  description: string;
  aboutContent: React.ReactNode;
  relatedProducts?: {
    webinars?: { label: string; href: string }[];
    programmes?: { label: string; href: string }[];
    workshops?: { label: string; href: string }[];
  };
}

export const DiagnosticPageLayout: React.FC<DiagnosticPageLayoutProps> = ({
  instrumentId,
  title,
  tagline,
  description,
  aboutContent,
  relatedProducts,
}) => {
  const [result, setResult] = useState<ArchetypeResult | null>(null);
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const instrument = INSTRUMENTS[instrumentId];
  const archetypes = getArchetypesByInstrument(instrumentId);
  const colors = INSTRUMENT_COLORS[instrumentId] ?? INSTRUMENT_COLORS.shift;

  const handleStartAssessment = () => {
    // Simulate assessment with placeholder scores
    const scores = instrument.dimensions.map(dim => ({
      dimensionId: dim.id,
      dimensionName: dim.name,
      rawScore: Math.round(40 + Math.random() * 50),
      normalizedScore: Math.round(40 + Math.random() * 50),
    }));
    setDimensionScores(scores);

    // Simulate archetype result
    setResult({
      archetypeId: archetypes[0]?.id ?? '',
      archetypeName: archetypes[0]?.name ?? 'Unknown',
      instrument: instrumentId,
      category: archetypes[0]?.category ?? '',
      description: archetypes[0]?.description ?? '',
      confidence: 0.75,
      isTransitional: false,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-20" style={{ backgroundColor: colors.light }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: colors.main }}>
            {instrument.name} Diagnostic
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">{title}</h1>
          <p className="mb-8 text-lg text-gray-600">{tagline}</p>
          <button
            onClick={handleStartAssessment}
            className="rounded-lg px-8 py-3 text-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: colors.main }}
          >
            Discover Your Archetype →
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">What {instrument.name} Measures</h2>
        <div className="prose prose-gray max-w-none text-gray-600">
          {aboutContent}
        </div>
      </section>

      {/* Archetype Grid */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
            {archetypes.length} {instrument.name} Archetypes
          </h2>
          <p className="mb-8 text-center text-gray-600">{description}</p>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archetypes.map((archetype, i) => (
              <ArchetypeCard
                key={archetype.id}
                name={archetype.name}
                instrument={instrumentId}
                description={archetype.description}
                teaser={archetype.teaser}
                iconUrl={archetype.icon}
                blurred={!result || result.archetypeId !== archetype.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Free Result Teaser */}
      {result && (
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-8 rounded-xl border-2 p-6 text-center" style={{ borderColor: colors.main, backgroundColor: colors.light }}>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Your {instrument.name} Archetype</p>
            <h3 className="mt-2 text-3xl font-bold" style={{ color: colors.dark }}>{result.archetypeName}</h3>
            <p className="mt-3 text-gray-600">{result.description.slice(0, 200)}...</p>
            {result.isTransitional && (
              <p className="mt-2 text-sm text-amber-600">
                ⚡ Transitional: You also show strong {result.secondaryArchetypeName} traits.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Email Gate */}
      {result && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <EmailGate
            instrument={instrumentId}
            archetypeName={result.archetypeName}
            isUnlocked={isUnlocked}
            onUnlock={(email) => setIsUnlocked(true)}
          >
            {/* Full Report (unlocked content) */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">
                Your Complete {instrument.name} Report
              </h3>
              
              {/* Radar Chart */}
              <div className="mb-8 flex justify-center">
                <RadarChart dimensions={dimensionScores} instrument={instrumentId} size={350} />
              </div>

              {/* Confidence */}
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-2xl font-bold" style={{ color: colors.main }}>
                  {Math.round(result.confidence * 100)}%
                </p>
              </div>

              {/* Strengths & Risks */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg bg-green-50 p-4">
                  <h4 className="mb-2 font-semibold text-green-800">Core Strengths</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    {(getArchetypesByInstrument(instrumentId).find(a => a.id === result.archetypeId)?.strengths ?? []).map(s => (
                      <li key={s}>✓ {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <h4 className="mb-2 font-semibold text-red-800">Key Risks</h4>
                  <ul className="space-y-1 text-sm text-red-700">
                    {(getArchetypesByInstrument(instrumentId).find(a => a.id === result.archetypeId)?.risks ?? []).map(r => (
                      <li key={r}>⚠ {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </EmailGate>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <h3 className="mb-4 text-xl font-bold text-gray-900">Continue Your Journey</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedProducts.webinars?.map(w => (
              <a key={w.href} href={w.href} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
                <span className="text-sm font-medium text-gray-900">🎓 {w.label}</span>
              </a>
            ))}
            {relatedProducts.programmes?.map(p => (
              <a key={p.href} href={p.href} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
                <span className="text-sm font-medium text-gray-900">📚 {p.label}</span>
              </a>
            ))}
            {relatedProducts.workshops?.map(w => (
              <a key={w.href} href={w.href} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
                <span className="text-sm font-medium text-gray-900">🛠️ {w.label}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Soft CTA Block */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SoftCTABlock instrumentColor={colors.main} />
      </section>
    </div>
  );
};

export default DiagnosticPageLayout;
