/**
 * Webinar Hub Page (T-201) — /webinars
 */
import React, { useState, useMemo } from 'react';
import { WEBINARS, getNextWebinars } from '@/data/webinars';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const WebinarHubPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const next3 = getNextWebinars(3);
  
  const filtered = useMemo(() => {
    if (filter === 'all') return WEBINARS;
    return WEBINARS.filter(w => w.linkedDiagnostic.toLowerCase() === filter.toLowerCase());
  }, [filter]);

  const instruments = ['all', 'quest', 'drive', 'impact', 'prism', 'bridge', 'mosaic', 'forge', 'spark', 'shift'];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Executive Forum</h1>
          <p className="mb-2 text-lg text-slate-300">Free Monthly Webinars for APAC Leaders</p>
          <p className="text-sm text-slate-400">24 sessions · 9 diagnostics · 12 months of leadership intelligence</p>
        </div>
      </section>

      {/* Next 3 Webinars */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Coming Up Next</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {next3.map(webinar => {
            const diagnosticKey = webinar.linkedDiagnostic.toLowerCase() as InstrumentColorKey;
            const color = INSTRUMENT_COLORS[diagnosticKey] ?? INSTRUMENT_COLORS.shift;
            return (
              <a key={webinar.slug} href={`/webinars/${webinar.slug}`} className="group rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-gray-300 hover:shadow-lg">
                <div className="mb-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: color.main }}>
                  {webinar.linkedDiagnostic}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">{webinar.title}</h3>
                <p className="text-sm text-gray-500">{webinar.month} {webinar.year} · {webinar.time}</p>
                <p className="mt-3 text-sm text-gray-600">{webinar.description.slice(0, 100)}...</p>
              </a>
            );
          })}
        </div>
      </section>

      {/* Filter + Full Calendar */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Full Calendar</h2>
          
          {/* Filter pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            {instruments.map(inst => {
              const isActive = filter === inst;
              const color = INSTRUMENT_COLORS[inst as InstrumentColorKey];
              return (
                <button
                  key={inst}
                  onClick={() => setFilter(inst)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${isActive ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                  style={isActive ? { backgroundColor: color?.main ?? '#475569' } : {}}
                >
                  {inst === 'all' ? 'All' : inst.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(webinar => {
              const diagnosticKey = webinar.linkedDiagnostic.toLowerCase() as InstrumentColorKey;
              const color = INSTRUMENT_COLORS[diagnosticKey] ?? INSTRUMENT_COLORS.shift;
              return (
                <a key={webinar.slug} href={`/webinars/${webinar.slug}`} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 transition-all hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: color.main }}>
                      {webinar.linkedDiagnostic}
                    </span>
                    <span className="text-xs text-gray-400">{webinar.date}</span>
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-900">{webinar.title}</h3>
                  <p className="text-xs text-gray-500">{webinar.speaker}{webinar.guest ? ` + ${webinar.guest}` : ''}</p>
                  <p className="mt-2 flex-1 text-sm text-gray-600">{webinar.description.slice(0, 80)}...</p>
                  <div className="mt-3 text-sm font-medium" style={{ color: color.main }}>Register →</div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Get Webinar Recaps in Your Inbox</h2>
        <p className="mb-4 text-sm text-gray-600">Join our newsletter for post-webinar insights, frameworks, and resources.</p>
        <form className="mx-auto flex max-w-md gap-2">
          <input type="email" placeholder="your@email.com" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800">Subscribe</button>
        </form>
      </section>

      {/* Standing CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-12 text-center">
        <p className="text-gray-600">Can't find a topic? <a href="/platform" className="font-medium text-blue-600 hover:underline">Try our free diagnostics →</a></p>
      </section>

      {/* Soft CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SoftCTABlock />
      </section>
    </div>
  );
};

export default WebinarHubPage;
