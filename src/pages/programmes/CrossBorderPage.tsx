import React from 'react';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const CrossBorderPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <section className="py-20" style={{ backgroundColor: '#05966915' }}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Cross-Border Leadership Programme</h1>
        <p className="mb-6 text-lg text-gray-600">Lead effectively across cultures and borders</p>
        <a href="#enroll" className="inline-flex rounded-lg px-8 py-3 font-semibold text-white" style={{ backgroundColor: '#059669' }}>Enquire Now</a>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="prose prose-gray max-w-none">
        <p>For leaders managing teams, operations, or P&L across multiple APAC markets. Combines BRIDGE and MOSAIC diagnostics with practical cross-cultural leadership coaching.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">What's Included</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Diagnostic assessment</li>
            <li>✓ 1:1 coaching sessions</li>
            <li>✓ Peer learning cohort</li>
            <li>✓ Custom development plan</li>
            <li>✓ 6-month access</li>
          </ul>
        </div>
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">Who It's For</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>→ Senior leaders (VP+)</li>
            <li>→ Board members</li>
            <li>→ Founders scaling organizations</li>
            <li>→ Leaders navigating transitions</li>
          </ul>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-6 py-12"><SoftCTABlock /></section>
  </div>
);
export default CrossBorderPage;
