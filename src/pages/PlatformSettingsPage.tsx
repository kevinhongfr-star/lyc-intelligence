import React, { useState } from 'react';
import { Shield, ToggleRight, Key, Plug, Palette } from 'lucide-react';
import { RBACManagement } from '@/components/internal/RBACManagement';
import { FeatureFlags } from '@/components/internal/FeatureFlags';
import { APIKeyManagement } from '@/components/internal/APIKeyManagement';
import { IntegrationSettings } from '@/components/internal/IntegrationSettings';
import { WhitelabelConfig } from '@/components/internal/WhitelabelConfig';

type Section = 'rbac' | 'features' | 'apikeys' | 'integrations' | 'whitelabel';

interface NavItem {
  key: Section;
  label: string;
  icon: typeof Shield;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'rbac', label: 'RBAC', icon: Shield },
  { key: 'features', label: 'Features', icon: ToggleRight },
  { key: 'apikeys', label: 'API Keys', icon: Key },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'whitelabel', label: 'Whitelabel', icon: Palette },
];

export function PlatformSettingsPage() {
  const [active, setActive] = useState<Section>('rbac');

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">PLATFORM SETTINGS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        <nav className="flex flex-col">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm text-left border-l-2 ${
                  isActive
                    ? 'text-accent border-accent'
                    : 'text-text-muted border-transparent hover:text-text-primary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div>
          {active === 'rbac' && <RBACManagement />}
          {active === 'features' && <FeatureFlags />}
          {active === 'apikeys' && <APIKeyManagement />}
          {active === 'integrations' && <IntegrationSettings />}
          {active === 'whitelabel' && <WhitelabelConfig />}
        </div>
      </div>
    </div>
  );
}
