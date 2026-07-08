import React, { useState } from 'react';
import { MessageSquare, Calendar, Users } from 'lucide-react';
import CandidateForumList from '@/components/candidate-community/CandidateForumList';
import CandidateEvents from '@/components/candidate-community/CandidateEvents';
import CandidateReferralNetwork from '@/components/candidate-community/CandidateReferralNetwork';

type Tab = 'forums' | 'events' | 'referrals';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'forums', label: 'Forums', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
  { id: 'referrals', label: 'Referrals', icon: <Users className="w-4 h-4" /> },
];

export default function CandidateCommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('forums');

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Page header */}
      <header className="bg-bg-primary border-b border-bg-tertiary">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            Community
          </h1>
          <p className="text-text-muted mt-1">
            Connect with peers, attend events, and build your referral network.
          </p>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="bg-bg-primary border-b border-bg-tertiary">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
                style={{ borderRadius: 0 }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        {activeTab === 'forums' && <CandidateForumList />}
        {activeTab === 'events' && <CandidateEvents />}
        {activeTab === 'referrals' && <CandidateReferralNetwork />}
      </main>
    </div>
  );
}
