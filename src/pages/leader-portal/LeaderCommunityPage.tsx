import React, { useState } from 'react';
import { MessageSquare, Calendar, Users, Award } from 'lucide-react';
import ForumList from '@/components/community/ForumList';
import EventsCalendar from '@/components/community/EventsCalendar';
import PeerConnections from '@/components/community/PeerConnections';
import ReferralTracker from '@/components/community/ReferralTracker';

const TABS = [
  { key: 'forums', label: 'Forums', icon: MessageSquare },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'peers', label: 'Peers', icon: Users },
  { key: 'referrals', label: 'Referrals', icon: Award },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function LeaderCommunityPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('forums');

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-text-primary">Community</h1>
          <p className="text-sm text-text-muted mt-1">
            Connect, learn, and grow with fellow leaders
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-0 border-b border-bg-tertiary mb-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors"
                style={{
                  borderRadius: 0,
                  borderBottom: isActive ? '2px solid #C108AB' : '2px solid transparent',
                  color: isActive ? '#C108AB' : '#666666',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon style={{ width: 16, height: 16 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'forums' && <ForumList />}
          {activeTab === 'events' && <EventsCalendar />}
          {activeTab === 'peers' && <PeerConnections />}
          {activeTab === 'referrals' && <ReferralTracker />}
        </div>
      </div>
    </div>
  );
}

export default LeaderCommunityPage;
