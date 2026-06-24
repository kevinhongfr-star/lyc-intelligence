import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, MapPin, Loader2, X, Briefcase, Users, FileText, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useEvents, useMandates } from '@/hooks/useSupabaseData';
import { createEvent } from '@/services/supabaseApi';
import type { CalendarEvent } from '@/services/supabaseApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push(new Date(year, month - 1, daysInPrev - i));
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(new Date(year, month + 1, cells.length - daysInMonth - firstDay + 1));
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function getEventColor(event: CalendarEvent) {
  switch (event.event_type) {
    case 'interview':
      return 'bg-blue-500/20 text-blue-500 border-l-blue-500';
    case 'deadline':
      return 'bg-red-500/20 text-red-500 border-l-red-500';
    case 'followup':
      return 'bg-amber-500/20 text-amber-600 border-l-amber-500';
    case 'client_meeting':
      return 'bg-green-500/20 text-green-600 border-l-green-500';
    case 'scoring':
      return 'bg-purple-500/20 text-purple-500 border-l-purple-500';
    default:
      return 'bg-accent/20 text-accent border-l-accent';
  }
}

function getEventIcon(event: CalendarEvent) {
  switch (event.event_type) {
    case 'interview':
      return <Users className="w-3 h-3" />;
    case 'deadline':
      return <AlertCircle className="w-3 h-3" />;
    case 'followup':
      return <FileText className="w-3 h-3" />;
    case 'client_meeting':
      return <Briefcase className="w-3 h-3" />;
    default:
      return <Calendar className="w-3 h-3" />;
  }
}

function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function formatDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export function SchedulerPage() {
  const { data: events, loading, setData: setEvents } = useEvents();
  const { data: mandates } = useMandates({ limit: 20 });
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: formatDate(today), time: '10:00', location: '' });

  const mandateEvents = useMemo(() => {
    const derived: CalendarEvent[] = [];
    mandates.forEach((m) => {
      if (m.target_date) {
        derived.push({
          id: `deadline-${m.id}`,
          title: `Deadline: ${m.title}`,
          start_time: new Date(m.target_date).toISOString(),
          end_time: new Date(m.target_date).toISOString(),
          event_type: 'deadline',
          mandate_id: m.id,
        });
      }
      if (m.created_at) {
        const weekLater = new Date(new Date(m.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
        if (weekLater >= today) {
          derived.push({
            id: `followup-${m.id}`,
            title: `Follow-up: ${m.title}`,
            start_time: weekLater.toISOString(),
            end_time: weekLater.toISOString(),
            event_type: 'followup',
            mandate_id: m.id,
          });
        }
      }
      if (m.status === '3_deliver') {
        const interviewDate = new Date();
        interviewDate.setDate(interviewDate.getDate() + 3);
        derived.push({
          id: `interview-${m.id}`,
          title: `Interview: ${m.title}`,
          start_time: interviewDate.toISOString(),
          end_time: interviewDate.toISOString(),
          event_type: 'interview',
          mandate_id: m.id,
        });
      }
    });
    return derived;
  }, [mandates]);

  const allEvents = useMemo(() => {
    return [...events, ...mandateEvents].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [events, mandateEvents]);

  const weeks = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const eventsForDate = (date: Date) => allEvents.filter(e => isSameDay(new Date(e.start_time), date));
  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];
  const upcomingEvents = allEvents.filter(e => new Date(e.start_time) >= today).slice(0, 10);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const handleCreate = async () => {
    if (!newEvent.title.trim()) return;
    setCreating(true);
    const startTime = `${newEvent.date}T${newEvent.time}:00`;
    const endTime = `${newEvent.date}T${String(Number(newEvent.time.split(':')[0]) + 1).padStart(2, '0')}:${newEvent.time.split(':')[1]}:00`;
    const created = await createEvent({ title: newEvent.title.trim(), start_time: startTime, end_time: endTime, location: newEvent.location || undefined });
    if (created && setEvents) {
      setEvents(prev => [...prev, created].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
    }
    setCreating(false); setShowCreate(false);
    setNewEvent({ title: '', date: selectedDate ? formatDate(selectedDate) : formatDate(today), time: '10:00', location: '' });
  };

  const openCreateModal = (date?: Date) => {
    if (date) setNewEvent(prev => ({ ...prev, date: formatDate(date) }));
    setShowCreate(true);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-bg-secondary rounded-xl border border-bg-tertiary w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-text-primary">New Event</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-bg-tertiary rounded-lg"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title" className="w-full px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} className="px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent" />
              <input type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} className="px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="Location (optional)" className="w-full px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
            <Button onClick={handleCreate} disabled={creating || !newEvent.title.trim()} className="w-full">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span className="ml-2">{creating ? 'Creating...' : 'Create Event'}</span>
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-serif font-bold text-text-primary">Scheduler</h1><p className="text-text-secondary">Interviews, calls, and pipeline events</p></div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Interview</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Client Meeting</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Deadline</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Follow-up</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Scoring</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openCreateModal()} className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg min-h-[44px]"><Plus className="w-4 h-4" />New Event</button>
            <button onClick={() => setView('month')} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${view === 'month' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Month</button>
            <button onClick={() => setView('agenda')} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${view === 'agenda' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Agenda</button>
          </div>
        </div>
      </div>
      {view === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <button onClick={prevMonth} className="p-2 hover:bg-bg-tertiary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-text-muted" /></button>
                <CardTitle>{MONTHS[viewMonth]} {viewYear}</CardTitle>
                <button onClick={nextMonth} className="p-2 hover:bg-bg-tertiary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"><ChevronRight className="w-4 h-4 text-text-muted" /></button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px bg-bg-tertiary">
                  {DAYS.map(d => <div key={d} className="p-2 text-center text-xs text-text-muted font-medium">{d}</div>)}
                  {weeks.map((week, wi) => week.map((date, di) => {
                    if (!date) return <div key={`${wi}-${di}`} className="p-2 min-h-[64px] bg-bg-primary" />;
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const dayEvents = eventsForDate(date);
                    return (
                      <button key={`${wi}-${di}`} onClick={() => setSelectedDate(date)} onDoubleClick={() => openCreateModal(date)}
                        className={`p-1.5 min-h-[64px] text-left bg-bg-primary hover:bg-bg-tertiary/50 transition-colors ${isSelected ? 'ring-1 ring-accent' : ''}`}>
                        <span className={`text-xs font-medium ${isToday ? 'w-5 h-5 flex items-center justify-center rounded-full bg-accent text-white' : 'text-text-primary'}`}>{date.getDate()}</span>
                        <div className="mt-1 space-y-0.5">{dayEvents.slice(0, 2).map((e, i) => <div key={i} className={`text-[10px] px-1 py-0.5 rounded truncate border-l-2 ${getEventColor(e)}`}>{e.title}</div>)}</div>
                      </button>
                    );
                  }))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>{selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}</CardTitle></CardHeader>
            <CardContent>
              {selectedEvents.length === 0 ? (
                <div className="text-center py-6"><p className="text-text-muted text-sm mb-3">No events</p><button onClick={() => openCreateModal(selectedDate || undefined)} className="text-accent text-sm hover:underline">+ Add event</button></div>
              ) : selectedEvents.map(e => (
                <div key={e.id} className="p-3 bg-bg-tertiary rounded-lg mb-2">
                  <p className="text-sm font-medium text-text-primary">{e.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted"><Clock className="w-3 h-3" />{new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{e.location && <><MapPin className="w-3 h-3 ml-1" />{e.location}</>}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8"><p className="text-text-muted text-sm mb-3">No upcoming events</p><button onClick={() => openCreateModal()} className="text-accent text-sm hover:underline">+ Schedule an event</button></div>
            ) : upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-4 p-3 bg-bg-tertiary rounded-lg mb-2">
                <div className="w-12 text-center flex-shrink-0"><p className="text-lg font-bold text-text-primary">{new Date(e.start_time).getDate()}</p><p className="text-[10px] text-text-muted uppercase">{new Date(e.start_time).toLocaleDateString('en-US', { month: 'short' })}</p></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text-primary truncate">{e.title}</p><div className="flex items-center gap-2 text-xs text-text-muted mt-0.5"><Clock className="w-3 h-3" />{new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
