import React from 'react';
import { Users } from 'lucide-react';

interface Mentor {
  name: string;
  role: string;
  company: string;
  expertise: string;
  yearsExperience: number;
}

interface MentorMatchingProps {
  mentors?: Mentor[];
}

const DEFAULT_MENTORS: Mentor[] = [
  {
    name: 'Sarah Lim',
    role: 'CTO',
    company: 'PayNow',
    expertise: 'CTO readiness path',
    yearsExperience: 14,
  },
  {
    name: 'David Park',
    role: 'CEO',
    company: 'FinEdge',
    expertise: 'Startup scaling',
    yearsExperience: 18,
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function MentorMatching({ mentors = DEFAULT_MENTORS }: MentorMatchingProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-accent" />
        <div>
          <h3 className="font-serif text-lg font-bold text-text-primary">MENTOR MATCHING</h3>
          <p className="text-xs text-text-muted mt-0.5">Curated matches based on your growth goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mentors.map((mentor, index) => (
          <div
            key={`${mentor.name}-${index}`}
            className="bg-bg-secondary border border-bg-tertiary p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-accent-10 text-accent flex items-center justify-center font-serif font-bold shrink-0">
                {getInitials(mentor.name)}
              </div>
              <div className="min-w-0">
                <div className="font-serif font-bold text-text-primary">{mentor.name}</div>
                <div className="text-xs text-text-secondary">
                  {mentor.role}, {mentor.company}
                </div>
              </div>
            </div>
            <div className="text-xs text-text-primary font-medium">{mentor.expertise}</div>
            <div className="text-xs text-text-muted mb-3">{mentor.yearsExperience}yr experience</div>
            <button className="text-accent border border-accent px-3 py-1 text-sm font-medium">
              Request Intro
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
