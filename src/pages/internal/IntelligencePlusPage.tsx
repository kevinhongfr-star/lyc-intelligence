import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import GRIDInteractive from '@/components/internal/GRIDInteractive';
import MarketMaps from '@/components/internal/MarketMaps';
import TalentDensityExplorer from '@/components/internal/TalentDensityExplorer';
import SignalFeed from '@/components/internal/SignalFeed';

const tabs = ['GRID', 'Market Maps', 'Talent Density', 'Signal Feed'] as const;
type Tab = typeof tabs[number];

export default function IntelligencePlusPage() {
  const [activeTab, setActiveTab] = useState<Tab>('GRID');

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-[#C108AB]" />
          <h1 className="text-2xl font-serif font-bold text-text-primary">Intelligence+</h1>
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
          {activeTab === 'GRID' && <GRIDInteractive />}
          {activeTab === 'Market Maps' && <MarketMaps />}
          {activeTab === 'Talent Density' && <TalentDensityExplorer />}
          {activeTab === 'Signal Feed' && <SignalFeed />}
        </div>
      </div>
    </div>
  );
}
