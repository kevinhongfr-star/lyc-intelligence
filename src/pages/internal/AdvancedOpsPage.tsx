import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import OpsExecutionLogs from '@/components/internal/OpsExecutionLogs';
import OpsRuleAudit from '@/components/internal/OpsRuleAudit';
import OpsSystemHealth from '@/components/internal/OpsSystemHealth';
import OpsAlertPanel from '@/components/internal/OpsAlertPanel';

const tabs = ['Execution Logs', 'Rule Audit', 'System Health', 'Alerts'] as const;
type Tab = typeof tabs[number];

export default function AdvancedOpsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Execution Logs');

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-6 h-6 text-[#C108AB]" />
          <h1 className="text-2xl font-serif font-bold text-text-primary">Advanced Ops</h1>
        </div>

        <div className="flex border-b border-bg-tertiary mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-[#C108AB]'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              style={{ borderRadius: 0 }}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C108AB]" />
              )}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'Execution Logs' && <OpsExecutionLogs />}
          {activeTab === 'Rule Audit' && <OpsRuleAudit />}
          {activeTab === 'System Health' && <OpsSystemHealth />}
          {activeTab === 'Alerts' && <OpsAlertPanel />}
        </div>
      </div>
    </div>
  );
}
