/**
 * Webinar Detail Page (T-202) — /webinars/[slug]
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWebinarBySlug, getNextWebinars } from '@/data/webinars';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const WebinarDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const webinar = slug ? getWebinarBySlug(slug) : null;
  const nextWebinars = getNextWebinars(3).filter(w => w.slug !== slug).slice(0, 3);

  if (!webinar) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Webinar Not Found</h1>
          <Link to="/webinars" className="mt-4 text-blue-600 hover:underline">← Back to Webinars</Link>
        </div>
      </div>
    );
  }

  const diagnosticKey = webinar.linkedDiagnostic.toLowerCase() as InstrumentColorKey;
  const color = INSTRUMENT_COLORS[diagnosticKey] ?? INSTRUMENT_COLORS.shift;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-16" style={{ backgroundColor: color.light }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color.main }}>
            {webinar.linkedDiagnostic} · {webinar.month} {webinar.year}
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">{webinar.title}</h1>
          <p className="mb-6 text-lg text-gray-600">{webinar.description}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href={`/webinars/${webinar.slug}/register`} className="rounded-lg px-6 py-3 font-semibold text-white" style={{ backgroundColor: color.main }}>
              Register Now
            </a>
            <span className="text-sm text-gray-500">{webinar.date} · {webinar.time}</span>
          </div>
        </div>
      </section>

      {/* Speaker Section */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Speaker</h2>
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{webinar.speaker}</h3>
            <p className="text-sm text-gray-600">Founder, LYC Partners · Executive Leadership Advisor</p>
            {webinar.guest && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-900">Guest: {webinar.guest}</h4>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">What You'll Learn</h2>
          <ul className="space-y-3">
            {webinar.learnings.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color.main }} />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Related Products */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Related LYC Products</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {webinar.linkedDiagnostic !== 'All 9' && (
            <a href={`/assess/${webinar.linkedDiagnostic.toLowerCase()}`} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
              <span className="text-sm font-medium text-gray-900">🎯 Free {webinar.linkedDiagnostic} Diagnostic</span>
              <p className="mt-1 text-xs text-gray-500">Take the assessment →</p>
            </a>
          )}
          {webinar.linkedProgramme && (
            <a href={webinar.linkedProgramme} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
              <span className="text-sm font-medium text-gray-900">📚 Related Programme</span>
              <p className="mt-1 text-xs text-gray-500">Deep-dive programme →</p>
            </a>
          )}
          {webinar.linkedWorkshop && (
            <a href={webinar.linkedWorkshop} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
              <span className="text-sm font-medium text-gray-900">🛠️ Related Workshop</span>
              <p className="mt-1 text-xs text-gray-500">Hands-on workshop →</p>
            </a>
          )}
        </div>
      </section>

      {/* Content Cascade */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Resources</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">Newsletter recap (after webinar)</div>
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">Podcast episode (after webinar)</div>
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">Executive Brief download</div>
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">LinkedIn article</div>
          </div>
        </div>
      </section>

      {/* Soft CTA */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <SoftCTABlock />
      </section>

      {/* Upcoming Webinars */}
      {nextWebinars.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Upcoming Webinars</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {nextWebinars.map(w => (
              <a key={w.slug} href={`/webinars/${w.slug}`} className="rounded-lg border border-gray-200 p-4 hover:shadow-md">
                <span className="text-xs font-medium text-gray-500">{w.month} {w.year}</span>
                <h3 className="mt-1 font-semibold text-gray-900">{w.title}</h3>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default WebinarDetailPage;
