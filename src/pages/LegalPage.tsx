import React, { useState } from 'react';
import { TermsPage } from '../components/legal/TermsPage';
import { PrivacyPage } from '../components/legal/PrivacyPage';
import { DPA } from '../components/legal/DPA';
import { ComplianceBadge } from '../components/legal/ComplianceBadge';
import { DS } from '@/tokens';

type Tab = 'terms' | 'privacy' | 'dpa' | 'cookies' | 'subprocessors' | 'compliance';

export function LegalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const tabs: Tab[] = ['terms', 'privacy', 'dpa', 'compliance'];
  const tabLabels: Record<Tab, string> = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    dpa: 'Data Processing Agreement',
    cookies: 'Cookie Policy',
    subprocessors: 'Subprocessors',
    compliance: 'Compliance',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-300 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === t ? '' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                style={activeTab === t ? { color: DS.accent, borderColor: DS.accent } : {}}
                data-testid={`legal-tab-${t}`}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6">
        {activeTab === 'terms' && <TermsPage />}
        {activeTab === 'privacy' && <PrivacyPage />}
        {activeTab === 'dpa' && <DPA />}
        {activeTab === 'compliance' && (
          <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Compliance Status</h1>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-300">
                <div>
                  <div className="font-semibold">GDPR</div>
                  <div className="text-sm text-gray-500">General Data Protection Regulation</div>
                </div>
                <ComplianceBadge framework="GDPR" status="compliant" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white border border-gray-300">
                <div>
                  <div className="font-semibold">CCPA</div>
                  <div className="text-sm text-gray-500">California Consumer Privacy Act</div>
                </div>
                <ComplianceBadge framework="CCPA" status="compliant" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white border border-gray-300">
                <div>
                  <div className="font-semibold">SOC 2</div>
                  <div className="text-sm text-gray-500">Service Organization Control 2</div>
                </div>
                <ComplianceBadge framework="SOC 2" status="in_progress" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white border border-gray-300">
                <div>
                  <div className="font-semibold">ISO 27001</div>
                  <div className="text-sm text-gray-500">Information Security Management</div>
                </div>
                <ComplianceBadge framework="ISO 27001" status="certified" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white border border-gray-300">
                <div>
                  <div className="font-semibold">HIPAA</div>
                  <div className="text-sm text-gray-500">Health Insurance Portability</div>
                </div>
                <ComplianceBadge framework="HIPAA" status="not_applicable" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}