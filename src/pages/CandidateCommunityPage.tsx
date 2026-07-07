import React from 'react';
import { CandidatePeerNetwork } from '@/components/candidate/CandidatePeerNetwork';
import { IndustryEvents } from '@/components/candidate/IndustryEvents';
import { DiscussionForum } from '@/components/candidate/DiscussionForum';
import { ReferralRequests } from '@/components/candidate/ReferralRequests';

export function CandidateCommunityPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">CANDIDATE COMMUNITY</h1>
      </header>

      <CandidatePeerNetwork />
      <IndustryEvents />
      <DiscussionForum />
      <ReferralRequests />
    </div>
  );
}
