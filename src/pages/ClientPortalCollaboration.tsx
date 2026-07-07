import React from 'react';
import { MessageSquare, Bell, Calendar } from 'lucide-react';

const MOCK_NOTES = [
  { id: 1, author: 'Claire Jin', content: 'Interview with David Tan went well. Strong cultural fit.', date: 'Jul 5, 2026' },
  { id: 2, author: 'Michael Wong', content: 'Budget approved for VP Risk role. Up to $280K.', date: 'Jul 3, 2026' },
];

const MOCK_FEEDBACK_THREADS = [
  { candidate: 'David Tan', messages: 5, lastActivity: '2 hours ago' },
  { candidate: 'Sophie Lau', messages: 3, lastActivity: '1 day ago' },
];

export function ClientPortalCollaboration() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Collaboration</h1>
        <p className="text-text-muted mt-1">Team notes, feedback, and notifications</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-bg-secondary border border-bg-tertiary p-6">
          <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Team Notes
          </h2>
          <div className="space-y-4">
            {MOCK_NOTES.map((note) => (
              <div key={note.id} className="bg-bg-primary border border-bg-tertiary p-4">
                <p className="text-sm font-medium text-text-primary">{note.author}</p>
                <p className="text-sm text-text-secondary mt-1">{note.content}</p>
                <p className="text-xs text-text-muted mt-2">{note.date}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary border border-bg-tertiary p-6">
          <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback Threads
          </h2>
          <div className="space-y-2">
            {MOCK_FEEDBACK_THREADS.map((thread) => (
              <button
                key={thread.candidate}
                className="w-full bg-bg-primary border border-bg-tertiary p-4 hover:border-accent/50 transition-colors text-left"
              >
                <p className="font-medium text-text-primary">{thread.candidate}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-text-muted">{thread.messages} messages</span>
                  <span className="text-xs text-text-muted">{thread.lastActivity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary border border-bg-tertiary p-6">
          <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {['New candidates presented', 'Interview scheduled', 'Offer updates', 'Report ready'].map((pref) => (
              <div key={pref} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{pref}</span>
                <div className="w-10 h-5 bg-accent" />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-bg-tertiary">
            <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Shared Calendar
            </h3>
            <div className="h-24 bg-bg-tertiary flex items-center justify-center">
              <span className="text-sm text-text-muted">Calendar integration placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}