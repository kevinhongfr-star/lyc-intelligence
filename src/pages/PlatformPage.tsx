import React, { useState } from 'react';
import { FileText, Search, Edit2, Puzzle, Key, Layout, Database } from 'lucide-react';
import { DocUpload } from '@/components/platform/DocUpload';
import { DocViewer } from '@/components/platform/DocViewer';
import { WebSearchPanel } from '@/components/platform/WebSearchPanel';
import { CustomPromptEditor } from '@/components/platform/CustomPromptEditor';
import { PluginMarketplace } from '@/components/platform/PluginMarketplace';
import { ApiKeyManager } from '@/components/platform/ApiKeyManager';

type TabId = 'documents' | 'search' | 'prompts' | 'plugins' | 'apikeys';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  { id: 'search', label: 'Web Search', icon: <Search className="w-4 h-4" /> },
  { id: 'prompts', label: 'Prompts', icon: <Edit2 className="w-4 h-4" /> },
  { id: 'plugins', label: 'Plugins', icon: <Puzzle className="w-4 h-4" /> },
  { id: 'apikeys', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
];

export function PlatformPage() {
  const [activeTab, setActiveTab] = useState<TabId>('documents');
  const [docs, setDocs] = useState<Array<{ id: string; filename: string; extracted_length: number }>>([]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-text-primary flex items-center gap-2">
          <Layout className="w-6 h-6 text-accent" />
          Platform Capabilities
        </h1>
        <p className="text-text-secondary mt-1">
          Manage documents, web search, custom prompts, plugins, and API integrations
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'documents' && (
          <>
            <DocUpload onUploadComplete={(doc) => setDocs(prev => [doc, ...prev])} />
            <DocViewer documents={docs.map(d => ({ ...d, file_type: 'pdf' }))} />
          </>
        )}

        {activeTab === 'search' && (
          <div className="lg:col-span-2">
            <WebSearchPanel />
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="lg:col-span-2">
            <CustomPromptEditor />
          </div>
        )}

        {activeTab === 'plugins' && (
          <div className="lg:col-span-2">
            <PluginMarketplace />
          </div>
        )}

        {activeTab === 'apikeys' && (
          <div className="lg:col-span-2">
            <ApiKeyManager />
          </div>
        )}
      </div>
    </div>
  );
}