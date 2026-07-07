import React, { useState } from 'react';
import { CreditBar } from '@/components/b2c/CreditBar';
import { B2CCoachChat } from '@/components/b2c/B2CCoachChat';
import {
  ChatHistoryPanel,
  Conversation,
} from '@/components/b2c/ChatHistoryPanel';

const MOCK_CREDITS = {
  remaining: 2,
  dailyLimit: 2,
  plan: 'Free',
};

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Leadership style assessment', date: 'Today' },
  { id: '2', title: 'CTO readiness gap analysis', date: 'Yesterday' },
  { id: '3', title: 'Negotiation strategy', date: 'Jul 2' },
  { id: '4', title: 'Cross-cultural challenges', date: 'Jun 28' },
];

export function B2CCoachPage() {
  const [activeId, setActiveId] = useState<string>('1');

  return (
    <div className="space-y-4">
      <header className="border-b border-bg-tertiary pb-4">
        <h1 className="font-serif text-2xl font-bold text-text-primary">DEX Coach</h1>
        <p className="text-text-muted mt-1 text-sm">
          AI coaching with dimensional scoring — sharpen your strategic depth, one conversation at a time.
        </p>
      </header>

      <CreditBar
        remaining={MOCK_CREDITS.remaining}
        dailyLimit={MOCK_CREDITS.dailyLimit}
        plan={MOCK_CREDITS.plan}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        <div className="lg:col-span-2 min-h-[500px]">
          <B2CCoachChat />
        </div>
        <div className="lg:col-span-1 min-h-[500px]">
          <ChatHistoryPanel
            conversations={MOCK_CONVERSATIONS}
            activeId={activeId}
            onSelect={setActiveId}
            onNewChat={() => setActiveId('')}
          />
        </div>
      </div>
    </div>
  );
}
