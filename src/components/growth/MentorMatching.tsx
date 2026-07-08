import React, { useState } from 'react';
import { Users, Star, CheckCircle } from 'lucide-react';
import { MOCK_MENTORS } from '@/mocks/advancedFeatures';

function MentorMatching() {
  const [requestedMentors, setRequestedMentors] = useState<Set<string>>(new Set());

  function requestMentorship(id: string) {
    setRequestedMentors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderStars(rating: number) {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#C108AB' }} />
        );
      } else if (i === full && hasHalf) {
        stars.push(
          <Star
            key={i}
            className="w-3.5 h-3.5 fill-current opacity-50"
            style={{ color: '#C108AB' }}
          />
        );
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-bg-tertiary" />);
      }
    }
    return stars;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-text-primary">Mentor Matching</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_MENTORS.map((mentor) => {
          const isRequested = requestedMentors.has(mentor.id);
          return (
            <div
              key={mentor.id}
              className="border border-bg-tertiary bg-bg-secondary p-5"
              style={{ borderRadius: 0 }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white text-sm font-bold"
                  style={{ borderRadius: 0, backgroundColor: mentor.avatarColor }}
                >
                  {mentor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-serif text-base text-text-primary">{mentor.name}</h3>
                  <p className="text-xs text-text-muted">
                    {mentor.title}, {mentor.company}
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {mentor.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-bg-tertiary text-text-secondary"
                    style={{ borderRadius: 0 }}
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Rating + sessions */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  {renderStars(mentor.rating)}
                  <span className="text-xs text-text-muted ml-1">{mentor.rating}</span>
                </div>
                <span className="text-xs text-text-muted">
                  <Users className="w-3 h-3 inline mr-1" />
                  {mentor.sessionsCompleted} sessions
                </span>
              </div>

              {/* Bio excerpt */}
              <p className="text-sm text-text-muted mb-3 line-clamp-2">{mentor.bio}</p>

              {/* Availability */}
              <p className="text-xs text-text-muted mb-4">
                Available: <span className="text-text-primary">{mentor.availability}</span>
              </p>

              {/* Request button */}
              <button
                onClick={() => requestMentorship(mentor.id)}
                className="w-full px-4 py-2 text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                style={{
                  borderRadius: 0,
                  backgroundColor: isRequested ? '#C108AB' : 'transparent',
                  color: isRequested ? '#ffffff' : '#C108AB',
                  border: isRequested ? '1px solid #C108AB' : '1px solid #C108AB',
                }}
              >
                {isRequested ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Requested
                  </>
                ) : (
                  'Request Mentorship'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MentorMatching;
