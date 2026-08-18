import React, { useState } from 'react';
import { StatusPage } from '../components/monitoring/StatusPage';
import { HealthCheck } from '../components/monitoring/HealthCheck';
import { PaymentMethods } from '../components/payments/PaymentMethods';

type Tab = 'status' | 'health' | 'payments';

export function SystemStatusPage() {
  const [activeTab, setActiveTab] = useState<Tab>('status');

  const tabs: Tab[] = ['status', 'health', 'payments'];
  const tabLabels: Record<Tab, string> = {
    status: 'System Status',
    health: 'Health Check',
    payments: 'Payments',
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
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === t ? 'text-[#C108AB]' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                style={activeTab === t ? { borderColor: '#C108AB' } : {}}
                data-testid={`status-tab-${t}`}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6">
        {activeTab === 'status' && <StatusPage />}
        {activeTab === 'health' && <HealthCheck />}
        {activeTab === 'payments' && <PaymentMethods />}
      </div>
    </div>
  );
}