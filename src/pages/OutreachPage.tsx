import React, { useState } from 'react';
import { CampaignBuilder } from '@/components/outreach/CampaignBuilder';
import { OutreachCampaigns } from '@/components/outreach/OutreachCampaigns';
import { TemplateEditor } from '@/components/outreach/TemplateEditor';
import { CalendarSync } from '@/components/outreach/CalendarSync';
import { OutreachAnalytics } from '@/components/outreach/OutreachAnalytics';

type TabId = 'campaigns' | 'builder' | 'templates' | 'calendar' | 'analytics';

const TABS: { id: TabId; label: string }[] = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'builder', label: 'Campaign Builder' },
  { id: 'templates', label: 'Templates' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'analytics', label: 'Analytics' },
];

export function OutreachPage() {
  const [activeTab, setActiveTab] = useState<TabId>('campaigns');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-text-primary">Candidate Outreach</h1>
        <p className="text-text-secondary mt-1">
          Multi-channel outreach campaigns, templates, calendar scheduling, and analytics
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'campaigns' && (
          <div className="lg:col-span-2">
            <OutreachCampaigns />
          </div>
        )}
        {activeTab === 'builder' && (
          <div className="lg:col-span-2">
            <CampaignBuilder />
          </div>
        )}
        {activeTab === 'templates' && (
          <div className="lg:col-span-2">
            <TemplateEditor />
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="lg:col-span-2">
            <CalendarSync />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="lg:col-span-2">
            <OutreachAnalytics />
          </div>
        )}
      </div>
    </div>
  );
}