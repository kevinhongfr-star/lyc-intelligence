import React, { useState } from 'react';
import { Settings, Shield, Flag, Key, Link2 } from 'lucide-react';
import RBACManager from '@/components/internal/RBACManager';
import FeatureFlags from '@/components/internal/FeatureFlags';
import APIKeyManager from '@/components/internal/APIKeyManager';
import IntegrationSettings from '@/components/internal/IntegrationSettings';

const TABS = [
  { id: 'rbac', label: 'RBAC', icon: Shield },
  { id: 'feature-flags', label: 'Feature Flags', icon: Flag },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('rbac');

  const renderContent = () => {
    switch (activeTab) {
      case 'rbac':
        return <RBACManager />;
      case 'feature-flags':
        return <FeatureFlags />;
      case 'api-keys':
        return <APIKeyManager />;
      case 'integrations':
        return <IntegrationSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-accent" />
        <h1 className="font-serif font-semibold text-2xl text-text-primary">Platform Settings</h1>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-bg-tertiary">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Tab Content */}
      <div>{renderContent()}</div>
    </div>
  );
}
