import React from 'react';
import { SoftCTABlock } from '@/components/diagnostic/SoftCTABlock';

export const Force1DiscoveryPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <section className="py-20" style={{ backgroundColor: '#DC262615' }}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#DC2626' }}>Workshop</span>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Force 1 Discovery Workshop</h1>
        <p className="mb-6 text-lg text-gray-600">Uncover your hidden leadership force</p>
        <a href="#register" className="inline-flex rounded-lg px-8 py-3 font-semibold text-white" style={{ backgroundColor: '#DC2626' }}>Register for Next Session</a>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-gray-600">A breakthrough workshop that helps you identify and activate your primary leadership force. Through diagnostic assessment, group exercises, and facilitated reflection, you'll discover the force that drives your most impactful leadership.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">1 Day</p>
          <p className="text-sm text-gray-500">Intensive format</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">12-20</p>
          <p className="text-sm text-gray-500">Participants</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">Hands-on</p>
          <p className="text-sm text-gray-500">Practical exercises</p>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Workshop Outcomes</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✓ Practical frameworks you can apply immediately</li>
          <li>✓ Personal diagnostic insights</li>
          <li>✓ Peer learning from other senior leaders</li>
          <li>✓ Follow-up resources and templates</li>
        </ul>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-6 py-12"><SoftCTABlock /></section>
  </div>
);
export default Force1DiscoveryPage;
