import React from 'react';
import { MessageSquare, Clock, Star, Zap, CreditCard, Hash } from 'lucide-react';
import { MOCK_CHATBOT_STATS } from '@/mocks/internalPortal';

export default function ChatbotAnalytics() {
  const stats = [
    { label: 'Total Conversations', value: MOCK_CHATBOT_STATS.totalConversations.toLocaleString(), icon: MessageSquare },
    { label: 'Avg Messages', value: MOCK_CHATBOT_STATS.avgMessagesPerConversation, icon: Hash },
    { label: 'Avg Response Time', value: MOCK_CHATBOT_STATS.avgResponseTime, icon: Clock },
    { label: 'Satisfaction', value: `${MOCK_CHATBOT_STATS.satisfactionScore}/5`, icon: Star },
    { label: 'Credit Usage', value: MOCK_CHATBOT_STATS.creditUsage.toLocaleString(), icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-bg-primary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: '#C108AB' }} />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-bg-primary border border-bg-tertiary p-4" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: '#C108AB' }} />
          <span className="text-sm font-medium text-text-primary">Top Topics</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOCK_CHATBOT_STATS.topTopics.map((topic) => (
            <span
              key={topic}
              className="px-3 py-1 text-sm font-medium border border-bg-tertiary text-text-primary"
              style={{ borderRadius: 0, backgroundColor: '#C108AB10', borderColor: '#C108AB30', color: '#C108AB' }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
