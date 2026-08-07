import React, { useState } from 'react';
import { Calendar, RefreshCw, ExternalLink, Clock, CheckCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  provider: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
}

interface Provider {
  id: string;
  provider: 'google' | 'outlook' | 'apple';
  connected: boolean;
  email: string;
}

const MOCK_PROVIDERS: Provider[] = [
  { id: 'p1', provider: 'google', connected: true, email: 'user@gmail.com' },
  { id: 'p2', provider: 'outlook', connected: false, email: '' },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Technical Screen - Senior Engineer', type: 'interview', provider: 'google', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), location: 'Google Meet', status: 'scheduled' },
  { id: 'e2', title: 'Discovery Call - VP of Engineering', type: 'call', provider: 'google', start_time: new Date(Date.now() + 2 * 86400000).toISOString(), end_time: new Date(Date.now() + 2 * 86400000 + 1800000).toISOString(), location: 'Phone', status: 'scheduled' },
  { id: 'e3', title: 'Client Check-in', type: 'meeting', provider: 'google', start_time: new Date(Date.now() + 3 * 86400000).toISOString(), end_time: new Date(Date.now() + 3 * 86400000 + 3600000).toISOString(), location: 'Zoom', status: 'confirmed' },
];

export function CalendarSync() {
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [syncing, setSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setEvents(prev => [
      ...prev,
      { id: `e_${Date.now()}`, title: 'New Synced Event', type: 'other', provider: 'google', start_time: new Date().toISOString(), end_time: new Date(Date.now() + 3600000).toISOString(), location: 'Unknown', status: 'scheduled' },
    ]);
    setSyncing(false);
  };

  const handleConnect = (providerId: string) => {
    setProviders(prev => prev.map(p => p.id === providerId ? { ...p, connected: !p.connected, email: p.connected ? '' : `${p.provider}_user@test.com` } : p));
  };

  const generateSlots = () => {
    const slots: { start: string; end: string }[] = [];
    const base = new Date(selectedDate);
    base.setHours(9, 0, 0, 0);
    for (let i = 0; i < 16; i++) {
      const start = new Date(base.getTime() + i * 1800000);
      if (start.getHours() >= 9 && start.getHours() < 17) {
        slots.push({ start: start.toISOString(), end: new Date(start.getTime() + 1800000).toISOString() });
      }
    }
    return slots;
  };

  const slots = generateSlots();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-xs text-text-muted mb-2 font-medium">Connected Providers</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {providers.map(provider => (
              <div key={provider.id} className="border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-text-primary capitalize">{provider.provider}</span>
                  {provider.connected && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                {provider.connected && provider.email && (
                  <p className="text-xs text-text-muted mb-2">{provider.email}</p>
                )}
                <Button
                  variant={provider.connected ? 'ghost' : 'outline'}
                  size="sm"
                  onClick={() => handleConnect(provider.id)}
                >
                  {provider.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleSync} loading={syncing}>
              <RefreshCw className="w-4 h-4" /> Sync Now
            </Button>
            <span className="text-xs text-text-muted">Last synced: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted font-medium">Upcoming Events</p>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" /> Add Event
            </Button>
          </div>
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="border border-border p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text-primary">{event.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 ${event.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-bg-tertiary text-text-muted'}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleTimeString()}
                    <span>· {event.location}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-2">
            <Clock className="w-3 h-3" /> Availability — {selectedDate}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent rounded-none"
            />
            <span className="text-xs text-text-muted">{slots.length} available slots</span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
            {slots.map((slot, i) => (
              <button
                key={i}
                className="px-2 py-1 text-xs border border-border bg-bg hover:border-accent hover:bg-accent/5 transition-colors"
              >
                {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}