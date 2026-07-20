/**
 * Homepage Archetype CTA + Webinar Widget (T-603)
 */
import React from 'react';
import { getNextWebinars } from '@/data/webinars';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';

export const HomepageArchetypeCTA: React.FC = () => {
  const nextWebinars = getNextWebinars(3);

  return (
    <>
      {/* Archetype Discovery CTA */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold">Discover Your Leadership Archetype</h2>
          <p className="mb-8 text-lg text-slate-300">9 diagnostics. 62 archetypes. One integrated profile. Free to start.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['quest', 'drive', 'impact', 'prism', 'bridge', 'forge', 'spark'].map(inst => {
              const color = INSTRUMENT_COLORS[inst as InstrumentColorKey];
              return (
                <a key={inst} href={`/assess/${inst}`} className="rounded-full px-4 py-2 text-sm font-medium transition-all hover:opacity-80" style={{ backgroundColor: color.main, color: 'white' }}>
                  {inst.toUpperCase()}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Webinar Widget */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Webinars</h2>
            <a href="/webinars" className="text-sm font-medium text-blue-600 hover:underline">View all →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {nextWebinars.map(w => {
              const color = INSTRUMENT_COLORS[w.linkedDiagnostic.toLowerCase() as InstrumentColorKey] ?? INSTRUMENT_COLORS.shift;
              return (
                <a key={w.slug} href={`/webinars/${w.slug}`} className="rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: color.main }}>{w.linkedDiagnostic}</span>
                  <h3 className="mt-2 font-semibold text-gray-900">{w.title}</h3>
                  <p className="text-xs text-gray-500">{w.month} {w.year}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomepageArchetypeCTA;
