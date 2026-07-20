/** Podcast Hub (T-303) — /insights/podcast */
import React from 'react';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const PodcastHubPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <section className="bg-gradient-to-br from-purple-50 to-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">The Leadership Signal Podcast</h1>
        <p className="mb-6 text-lg text-gray-600">Conversations with APAC's most insightful leaders on culture, governance, and organizational intelligence.</p>
        <div className="flex justify-center gap-4">
          <a href="#" className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white">Apple Podcasts</a>
          <a href="#" className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white">Spotify</a>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h2 className="mb-8 text-2xl font-bold text-gray-900">Latest Episodes</h2>
      <div className="space-y-4">
        {[
          { title: 'The Governance Shift with [Guest]', duration: '42 min', date: 'Jul 15, 2026' },
          { title: 'AI-Ready Leadership: What Directors Need to Know', duration: '38 min', date: 'Jul 8, 2026' },
          { title: 'Cross-Border Team Dynamics', duration: '45 min', date: 'Jul 1, 2026' },
          { title: 'Building Your Executive Brand', duration: '35 min', date: 'Jun 24, 2026' },
        ].map((ep, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md">
            <button className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">▶</button>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{ep.title}</h3>
              <p className="text-xs text-gray-500">{ep.date} · {ep.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-6 pb-16"><SoftCTABlock /></section>
  </div>
);
export default PodcastHubPage;
