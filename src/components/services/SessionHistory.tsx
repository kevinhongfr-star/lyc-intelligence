import React from 'react';
import { Calendar, Star, Clock } from 'lucide-react';
import { MOCK_UPCOMING_SESSIONS, MOCK_PAST_SESSIONS } from '@/mocks/advancedFeatures';

export default function SessionHistory() {
  return (
    <div className="space-y-8">
      {/* Upcoming */}
      <section>
        <h3 className="font-serif font-semibold text-lg text-text-primary mb-3">Upcoming</h3>
        {MOCK_UPCOMING_SESSIONS.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">No upcoming sessions.</p>
        ) : (
          <div className="space-y-3">
            {MOCK_UPCOMING_SESSIONS.map((session) => (
              <div
                key={session.id}
                className="bg-bg-primary border border-bg-tertiary p-4 flex items-start gap-4"
                style={{ borderRadius: 0 }}
              >
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="text-xs text-text-muted uppercase">
                    {new Date(session.date).toLocaleString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-xl font-bold text-text-primary">
                    {new Date(session.date).getDate()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary text-sm">{session.serviceName}</h4>
                  <p className="text-xs text-text-muted mt-0.5">{session.providerName}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {session.date}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium ${
                    session.status === 'confirmed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <h3 className="font-serif font-semibold text-lg text-text-primary mb-3">Past</h3>
        {MOCK_PAST_SESSIONS.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">No past sessions.</p>
        ) : (
          <div className="space-y-3">
            {MOCK_PAST_SESSIONS.map((session) => (
              <div
                key={session.id}
                className="bg-bg-primary border border-bg-tertiary p-4"
                style={{ borderRadius: 0 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary text-sm">{session.serviceName}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{session.providerName}</p>
                    <p className="text-xs text-text-muted mt-0.5">{session.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < session.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-bg-tertiary'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {session.notes && (
                  <p className="text-xs text-text-muted mt-2 border-t border-bg-tertiary pt-2 line-clamp-2">
                    {session.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
