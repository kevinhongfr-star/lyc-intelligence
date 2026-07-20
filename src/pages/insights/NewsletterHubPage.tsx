/** Newsletter Hub (T-302) — /insights/newsletter */
import React from 'react';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const NewsletterHubPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <section className="bg-gradient-to-br from-blue-50 to-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">LYC Intelligence Newsletter</h1>
        <p className="mb-6 text-lg text-gray-600">Weekly insights on leadership, culture, and organizational intelligence for APAC executives.</p>
        <form className="mx-auto flex max-w-md gap-2">
          <input type="email" placeholder="your@email.com" className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">Subscribe</button>
        </form>
        <p className="mt-2 text-xs text-gray-500">Join 2,000+ APAC leaders. No spam.</p>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h2 className="mb-8 text-2xl font-bold text-gray-900">Recent Issues</h2>
      <div className="space-y-6">
        {['The Governance Shift: What APAC Boards Need to Know', 'AI-Ready Leadership: Beyond the Hype', 'Cross-Border Teams: Building Cultural Bridges', 'Revenue Architecture: From Rainmaker to System Builder'].map((title, i) => (
          <article key={i} className="rounded-lg border border-gray-200 p-6 transition-all hover:shadow-md">
            <span className="text-xs text-gray-400">Issue #{24 - i} · Week of Jul {14 - i * 7}, 2026</span>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">Key insights from this week's analysis of leadership trends across APAC markets...</p>
            <a href="#" className="mt-3 text-sm font-medium text-blue-600 hover:underline">Read more →</a>
          </article>
        ))}
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-6 pb-16"><SoftCTABlock /></section>
  </div>
);
export default NewsletterHubPage;
