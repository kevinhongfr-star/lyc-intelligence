/** Quarterly Brief (T-304) — /insights/brief (Gated) */
import React, { useState } from 'react';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const QuarterlyBriefPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="mb-3 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Q2 2026</span>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Executive Brief</h1>
          <p className="mb-6 text-lg text-gray-600">Quarterly deep-dive into APAC leadership intelligence. Data-driven insights you won't find anywhere else.</p>
          {!unlocked ? (
            <form onSubmit={e => { e.preventDefault(); setUnlocked(true); }} className="mx-auto flex max-w-md gap-2">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm" />
              <button type="submit" className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white">Download Brief</button>
            </form>
          ) : (
            <a href="#" className="inline-flex rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white">Download PDF ↓</a>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Previous Briefs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {['Q1 2026: The Year Ahead for APAC Leadership', 'Q4 2025: AI Governance Landscape', 'Q3 2025: Cross-Border M&A Trends', 'Q2 2025: Cultural Intelligence at Scale'].map((title, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-xs text-gray-500">PDF · 12 pages</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16"><SoftCTABlock /></section>
    </div>
  );
};
export default QuarterlyBriefPage;
