import React from 'react';
import { Calendar, Briefcase, User } from 'lucide-react';
import { NotificationCenter } from '@/components/candidate/NotificationCenter';
import { CareerHealthGrid } from '@/components/candidate/CareerHealthGrid';
import { UpcomingEvents } from '@/components/candidate/UpcomingEvents';
import { AdvancedTools } from '@/components/candidate/AdvancedTools';
import { WeeklyActivity } from '@/components/candidate/WeeklyActivity';

const MOCK_CANDIDATE = {
  name: 'James Wong',
  title: 'VP Engineering',
  activeApps: 2,
  placed: 1,
  profileCompleteness: 78,
};

export function CandidateDashboardPage() {
  const c = MOCK_CANDIDATE;

  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-text-primary">Candidate Portal</h1>
            <p className="text-text-muted mt-1">
              {c.name} — {c.title}
            </p>
            <p className="text-sm text-text-muted mt-0.5">
              {c.activeApps} active applications · {c.placed} placed
            </p>
          </div>
        </div>
      </header>

      <NotificationCenter />

      <section className="bg-bg-secondary border border-bg-tertiary p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-text-primary">
              Welcome back, {c.name.split(' ')[0]}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Profile completeness — {c.profileCompleteness}%
            </p>
            <div className="mt-2 w-full max-w-sm h-2 bg-bg-tertiary">
              <div
                className="h-full bg-accent"
                style={{ width: `${c.profileCompleteness}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
              <Calendar className="w-4 h-4" />
              Prepare for Interview
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-bg-secondary border border-bg-tertiary transition-colors">
              <Briefcase className="w-4 h-4" />
              Check Status
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-bg-secondary border border-bg-tertiary transition-colors">
              <User className="w-4 h-4" />
              Profile
            </button>
          </div>
        </div>
      </section>

      <CareerHealthGrid />

      <UpcomingEvents />

      <AdvancedTools />

      <WeeklyActivity />
    </div>
  );
}
