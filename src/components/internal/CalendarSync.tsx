import React, { useState } from 'react';
import { Calendar, Link2, Unlink } from 'lucide-react';
import { MOCK_CALENDAR_CONNECTIONS } from '@/mocks/internalPortal';

export default function CalendarSync() {
  const [connections, setConnections] = useState(MOCK_CALENDAR_CONNECTIONS);

  const toggleConnection = (id: string) => {
    setConnections(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === 'connected' ? 'disconnected' : 'connected' }
          : c
      )
    );
  };

  return (
    <div className="space-y-3">
      {connections.map(conn => (
        <div
          key={conn.id}
          className="border border-bg-tertiary bg-bg-primary p-4 flex items-center gap-4"
          style={{ borderRadius: 0 }}
        >
          <div className="flex-shrink-0 p-2 bg-bg-secondary">
            <Calendar className="w-5 h-5 text-text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">{conn.provider}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                  conn.status === 'connected'
                    ? 'bg-green-500/15 text-green-700'
                    : 'bg-red-500/15 text-red-600'
                }`}
              >
                {conn.status}
              </span>
            </div>
            <p className="text-sm text-text-muted mt-0.5">{conn.email}</p>
            {conn.status === 'connected' && conn.lastSync && (
              <p className="text-xs text-text-muted mt-1">Last sync: {conn.lastSync}</p>
            )}
          </div>
          <button
            onClick={() => toggleConnection(conn.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
              conn.status === 'connected'
                ? 'border-red-300 text-red-600 hover:bg-red-500/10'
                : 'border-[#C108AB]/30 text-[#C108AB] hover:bg-[#C108AB]/10'
            }`}
            style={{ borderRadius: 0 }}
          >
            {conn.status === 'connected' ? (
              <><Unlink className="w-3 h-3" /> Disconnect</>
            ) : (
              <><Link2 className="w-3 h-3" /> Connect</>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
