import React from 'react';
import { User, Star } from 'lucide-react';

const SPECIALTIES = ['Leadership', 'Career Transition', 'Executive Presence'];

export function ServiceProviderProfile() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">SERVICE PROVIDER</h3>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-accent-10 text-accent flex items-center justify-center font-serif text-xl font-bold shrink-0">
          EZ
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-lg font-bold text-text-primary">Emily Zhang</h4>
          <p className="text-sm text-text-muted mb-1">Executive Coach</p>
          <p className="text-xs text-text-muted mb-3">12 years experience</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {SPECIALTIES.map((specialty) => (
              <span
                key={specialty}
                className="bg-bg-secondary text-text-secondary text-xs px-2 py-0.5"
              >
                {specialty}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-medium text-accent">4.9</span>
            <span className="text-xs text-text-muted">rating</span>
          </div>
        </div>
      </div>
    </div>
  );
}
