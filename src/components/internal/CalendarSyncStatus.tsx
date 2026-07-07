import React from 'react';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface CalendarConnection {
  name: string;
  connected: boolean;
  email?: string;
}

const CALENDARS: CalendarConnection[] = [
  { name: 'Google Calendar', connected: true, email: 'kevin@lyc-partners.ai' },
  { name: 'Outlook', connected: false },
  { name: 'Feishu', connected: true, email: 'kevin@lyc-partners.feishu.cn' },
];

export function CalendarSyncStatus() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">CALENDAR SYNC STATUS</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CALENDARS.map((cal) => (
          <div key={cal.name} className="border border-bg-tertiary p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif font-medium text-text-primary">{cal.name}</span>
              {cal.connected ? (
                <CheckCircle2 className="w-4 h-4 text-teal" />
              ) : (
                <XCircle className="w-4 h-4 text-error" />
              )}
            </div>

            <p className={`text-sm ${cal.connected ? 'text-teal' : 'text-error'}`}>
              {cal.connected ? 'Connected' : 'Not connected'}
            </p>

            {cal.email && (
              <p className="text-xs text-text-muted mt-1">{cal.email}</p>
            )}

            <div className="mt-auto pt-3">
              {cal.connected ? (
                <button className="text-text-muted text-sm hover:text-text-primary">
                  Disconnect
                </button>
              ) : (
                <button className="bg-accent text-white px-3 py-1 text-sm hover:bg-accent-hover">
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
