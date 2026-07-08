import React, { useState } from 'react';
import { FileText, Shield, Database, ClipboardCheck } from 'lucide-react';
import AuditLog from '@/components/internal/AuditLog';
import ConsentManager from '@/components/internal/ConsentManager';
import DataRetention from '@/components/internal/DataRetention';
import ComplianceChecklist from '@/components/internal/ComplianceChecklist';

const TABS = [
  { key: 'audit', label: 'Audit Log', icon: FileText },
  { key: 'consent', label: 'Consent', icon: Shield },
  { key: 'retention', label: 'Retention', icon: Database },
  { key: 'checklist', label: 'Checklist', icon: ClipboardCheck },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('audit');

  return (
    <div className="min-h-screen bg-bg-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">Compliance</h1>
        <p className="text-text-muted mb-6">Data governance, audit trails, and regulatory compliance</p>

        <div className="flex gap-1 mb-6 border-b border-bg-tertiary">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
                style={{ borderRadius: 0 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === 'audit' && <AuditLog />}
          {activeTab === 'consent' && <ConsentManager />}
          {activeTab === 'retention' && <DataRetention />}
          {activeTab === 'checklist' && <ComplianceChecklist />}
        </div>
      </div>
    </div>
  );
}
