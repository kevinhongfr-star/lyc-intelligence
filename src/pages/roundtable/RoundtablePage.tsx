/** Roundtable Page (T-402) — /roundtable */
import React from 'react';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const RoundtablePage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <section className="bg-gradient-to-br from-amber-50 to-white py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Executive Roundtable</h1>
        <p className="mb-6 text-lg text-gray-600">Monthly deep-dive sessions with APAC's senior leaders. Small groups. Big conversations. No selling.</p>
        <div className="flex justify-center gap-4">
          <a href="#pricing" className="rounded-lg bg-amber-600 px-8 py-3 font-semibold text-white hover:bg-amber-700">View Pricing</a>
          <a href="/webinars" className="rounded-lg border border-amber-600 px-8 py-3 font-semibold text-amber-600 hover:bg-amber-50">Attend a Free Webinar First</a>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">What Is a Roundtable?</h2>
          <p className="text-gray-600">A curated session of 8-12 senior leaders exploring a single leadership challenge in depth. Facilitated by Kevin Hong. Structured for peer learning, not presentation.</p>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Who Attends?</h2>
          <p className="text-gray-600">C-suite leaders, board members, and senior VPs from APAC organizations. All participants are vetted for seniority and relevance.</p>
        </div>
      </div>
    </section>

    <section id="pricing" className="bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Membership Options</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Single Session</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$490</p>
            <p className="text-sm text-gray-500">per session</p>
            <ul className="mt-4 space-y-2 text-left text-sm text-gray-600">
              <li>✓ 1 roundtable session</li>
              <li>✓ Session recording</li>
              <li>✓ Follow-up resources</li>
            </ul>
            <button className="mt-6 w-full rounded-lg border border-amber-600 py-2.5 font-semibold text-amber-600">Book Now</button>
          </div>
          <div className="rounded-xl border-2 border-amber-500 bg-white p-6 text-center shadow-lg">
            <div className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">Most Popular</div>
            <h3 className="text-lg font-semibold text-gray-900">Quarterly</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$1,190</p>
            <p className="text-sm text-gray-500">per quarter (3 sessions)</p>
            <ul className="mt-4 space-y-2 text-left text-sm text-gray-600">
              <li>✓ 3 roundtable sessions</li>
              <li>✓ All recordings</li>
              <li>✓ Priority topic input</li>
              <li>✓ Peer introductions</li>
            </ul>
            <button className="mt-6 w-full rounded-lg bg-amber-600 py-2.5 font-semibold text-white hover:bg-amber-700">Subscribe</button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Annual</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$3,990</p>
            <p className="text-sm text-gray-500">per year (12 sessions)</p>
            <ul className="mt-4 space-y-2 text-left text-sm text-gray-600">
              <li>✓ 12 roundtable sessions</li>
              <li>✓ All recordings + transcripts</li>
              <li>✓ 1:1 debrief with Kevin</li>
              <li>✓ Council introduction</li>
            </ul>
            <button className="mt-6 w-full rounded-lg border border-amber-600 py-2.5 font-semibold text-amber-600">Subscribe</button>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-12"><SoftCTABlock /></section>
  </div>
);
export default RoundtablePage;
