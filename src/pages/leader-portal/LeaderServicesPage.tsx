import React, { useState } from 'react';
import { ShoppingBag, Calendar, Users } from 'lucide-react';
import ServiceMarketplace from '@/components/services/ServiceMarketplace';
import SessionHistory from '@/components/services/SessionHistory';
import UpcomingSessions from '@/components/services/UpcomingSessions';
import ProviderDirectory from '@/components/services/ProviderDirectory';

type Tab = 'marketplace' | 'sessions' | 'providers';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" /> },
  { key: 'sessions', label: 'My Sessions', icon: <Calendar className="w-4 h-4" /> },
  { key: 'providers', label: 'Providers', icon: <Users className="w-4 h-4" /> },
];

export default function LeaderServicesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Page header */}
      <div className="bg-bg-primary border-b border-bg-tertiary">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="font-serif text-2xl font-bold text-text-primary">Career Services</h1>
          <p className="text-sm text-text-muted mt-1">
            Book sessions with executive coaches, resume experts, and interview specialists.
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-bg-primary border-b border-bg-tertiary">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#C108AB] text-[#C108AB]'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === 'marketplace' && <ServiceMarketplace />}
        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingSessions />
            <SessionHistory />
          </div>
        )}
        {activeTab === 'providers' && <ProviderDirectory />}
      </div>
    </div>
  );
}
