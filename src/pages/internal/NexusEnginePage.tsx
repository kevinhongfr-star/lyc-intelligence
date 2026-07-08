import React, { useState } from 'react';
import { UserCog, Brain, FileCode2, BarChart3, MessageCircle } from 'lucide-react';
import PersonaConfig from '@/components/internal/PersonaConfig';
import MemoryManager from '@/components/internal/MemoryManager';
import PromptEditor from '@/components/internal/PromptEditor';
import ChatbotAnalytics from '@/components/internal/ChatbotAnalytics';
import ConversationAudit from '@/components/internal/ConversationAudit';

const TABS = [
  { key: 'persona', label: 'Persona', icon: UserCog },
  { key: 'memory', label: 'Memory', icon: Brain },
  { key: 'prompts', label: 'Prompts', icon: FileCode2 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'conversations', label: 'Conversations', icon: MessageCircle },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function NexusEnginePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('persona');

  return (
    <div className="min-h-screen bg-bg-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">NEXUS Engine</h1>
        <p className="text-text-muted mb-6">AI persona management, memory, and conversation audit</p>

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
          {activeTab === 'persona' && <PersonaConfig />}
          {activeTab === 'memory' && <MemoryManager />}
          {activeTab === 'prompts' && <PromptEditor />}
          {activeTab === 'analytics' && <ChatbotAnalytics />}
          {activeTab === 'conversations' && <ConversationAudit />}
        </div>
      </div>
    </div>
  );
}
