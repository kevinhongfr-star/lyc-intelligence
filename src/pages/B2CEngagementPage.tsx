import React from 'react';
import { CommunityFeed } from '@/components/b2c/CommunityFeed';
import { EventsList } from '@/components/b2c/EventsList';
import { PeerNetwork } from '@/components/b2c/PeerNetwork';
import { ReferralProgram } from '@/components/b2c/ReferralProgram';

export function B2CEngagementPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">
          COMMUNITY & ENGAGEMENT
        </h1>
      </header>

      <CommunityFeed />

      <EventsList />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeerNetwork />
        <ReferralProgram />
      </div>
    </div>
  );
}
