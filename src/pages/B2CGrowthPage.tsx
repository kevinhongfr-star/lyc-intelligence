import React from 'react';
import { DevelopmentPlan } from '@/components/b2c/DevelopmentPlan';
import { SkillProgression } from '@/components/b2c/SkillProgression';
import { GoalTracker } from '@/components/b2c/GoalTracker';
import { ResourceRecommendations } from '@/components/b2c/ResourceRecommendations';
import { MentorMatching } from '@/components/b2c/MentorMatching';

export function B2CGrowthPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-4">
        <h1 className="font-serif text-2xl font-bold text-text-primary">GROWTH &amp; DEVELOPMENT</h1>
        <p className="text-text-muted mt-1 text-sm">
          Personalized development plan, skill tracking, and growth resources.
        </p>
      </header>

      <DevelopmentPlan />

      <SkillProgression />

      <GoalTracker />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResourceRecommendations />
        <MentorMatching />
      </div>
    </div>
  );
}
