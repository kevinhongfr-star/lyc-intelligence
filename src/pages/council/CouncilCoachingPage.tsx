import React, { useState } from 'react';
import {
  Crown,
  Coins,
  GraduationCap,
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  Check,
  Loader2,
  ArrowRight,
  FileText,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Council Coaching Page (M2) — auth required.
 *
 * Member's coaching hub: upcoming sessions, history table, and notes.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 */

type SessionStatus = 'Completed' | 'Scheduled' | 'Cancelled' | 'No-show';

interface UpcomingSession {
  id: string;
  coach: string;
  topic: string;
  date: string; // ISO
  durationMin: number;
  mode: 'Video' | 'In-person';
  location: string;
}

interface PastSession {
  id: string;
  date: string; // ISO
  coach: string;
  topic: string;
  durationMin: number;
  status: SessionStatus;
}

interface CoachingNote {
  id: string;
  sessionDate: string;
  coach: string;
  content: string;
}

const UPCOMING: UpcomingSession[] = [
  {
    id: 'u1',
    coach: 'Marcus Wei',
    topic: 'Negotiating a CTO offer at Series D',
    date: '2026-07-16T15:00:00',
    durationMin: 60,
    mode: 'Video',
    location: 'Council Live',
  },
  {
    id: 'u2',
    coach: 'Elena Rodriguez',
    topic: 'Board communication & executive presence',
    date: '2026-07-23T10:30:00',
    durationMin: 45,
    mode: 'In-person',
    location: 'Shanghai · The Council Room',
  },
];

const HISTORY: PastSession[] = [
  {
    id: 'h1',
    date: '2026-07-09',
    coach: 'Marcus Wei',
    topic: 'Career transition: VP → COO pathway',
    durationMin: 60,
    status: 'Completed',
  },
  {
    id: 'h2',
    date: '2026-06-25',
    coach: 'Elena Rodriguez',
    topic: 'Compensation benchmarking for executive roles',
    durationMin: 45,
    status: 'Completed',
  },
  {
    id: 'h3',
    date: '2026-06-11',
    coach: 'James Liu',
    topic: 'Leading through organizational restructure',
    durationMin: 60,
    status: 'Completed',
  },
  {
    id: 'h4',
    date: '2026-05-28',
    coach: 'Marcus Wei',
    topic: 'Stakeholder mapping for board presentation',
    durationMin: 30,
    status: 'No-show',
  },
  {
    id: 'h5',
    date: '2026-05-14',
    coach: 'Elena Rodriguez',
    topic: 'Personal brand as an executive',
    durationMin: 45,
    status: 'Completed',
  },
  {
    id: 'h6',
    date: '2026-04-30',
    coach: 'James Liu',
    topic: 'Building and scaling a leadership team',
    durationMin: 60,
    status: 'Cancelled',
  },
];

const NOTES: CoachingNote[] = [
  {
    id: 'n1',
    sessionDate: '2026-07-09',
    coach: 'Marcus Wei',
    content:
      'Sarah is well-positioned for a COO step-up within 12–18 months. Focus areas: delegate P&L ownership to two direct reports, and secure one board-adjacent advisory role to broaden governance exposure. Next session: pressure-test the two internal pathways she has identified.',
  },
  {
    id: 'n2',
    sessionDate: '2026-06-25',
    coach: 'Elena Rodriguez',
    content:
      'Reviewed compensation benchmark for VP-level moves in growth-stage tech. Sarah is currently at the 60th percentile of total comp — there is meaningful upside at the 75th–90th percentile for the right scope expansion. Action: model two scenarios before the next interview cycle.',
  },
];

const STATUS_BADGE: Record<SessionStatus, { variant: 'success' | 'warning' | 'danger' | 'default' | 'fuchsia'; label: string }> = {
  Completed: { variant: 'success', label: 'Completed' },
  Scheduled: { variant: 'fuchsia', label: 'Scheduled' },
  Cancelled: { variant: 'danger', label: 'Cancelled' },
  'No-show': { variant: 'warning', label: 'No-show' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function CouncilCoachingPage() {
  const [upcoming] = useState<UpcomingSession[]>(UPCOMING);
  const [history] = useState<PastSession[]>(HISTORY);
  const [notes, setNotes] = useState<CoachingNote[]>(NOTES);
  const [booking, setBooking] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const completedCount = history.filter((h) => h.status === 'Completed').length;

  const handleBook = () => {
    setBooking(true);
    setTimeout(() => {
      setBooking(false);
      window.location.href = '/council/benefits';
    }, 700);
  };

  const handleAddNote = () => {
    const text = newNote.trim();
    if (!text) return;
    setSavingNote(true);
    setTimeout(() => {
      setNotes((prev) => [
        {
          id: `n${Date.now()}`,
          sessionDate: new Date().toISOString().slice(0, 10),
          coach: 'Self-reflection',
          content: text,
        },
        ...prev,
      ]);
      setNewNote('');
      setSavingNote(false);
    }, 500);
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Member nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/council/dashboard"
            className="font-bold text-base tracking-tight text-[#1C1C1C] no-underline"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/council/dashboard" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Dashboard</a>
            <a href="/council/coaching" className="text-sm font-medium text-[#C108AB] no-underline">Coaching</a>
            <a href="/council/community" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Community</a>
            <a href="/council/directory" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Directory</a>
            <a href="/council/benefits" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Benefits</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs font-semibold">
              <Coins className="w-3.5 h-3.5" />
              9 credits
            </div>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/council/profile')}>
              <Crown className="w-3.5 h-3.5" />
              Sarah
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
                My Coaching
              </div>
              <h1
                className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Coaching sessions & notes
              </h1>
              <p className="text-sm text-[#525252] mt-2 max-w-xl leading-relaxed">
                Book senior LYC coaches on-demand. Each session uses 1 Council Credit. Your notes are private to you.
              </p>
            </div>
            <Button onClick={handleBook} disabled={booking} aria-busy={booking}>
              {booking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Book a session
                </>
              )}
            </Button>
          </div>

          {/* Summary strip */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Sessions used</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#1C1C1C]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  {completedCount}
                </span>
                <span className="text-xs text-[#A3A3A3]">of 12</span>
              </div>
            </div>
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Upcoming</div>
              <div className="text-2xl font-bold text-[#1C1C1C]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                {upcoming.length}
              </div>
            </div>
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1">Active coaches</div>
              <div className="text-2xl font-bold text-[#1C1C1C]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                3
              </div>
            </div>
            <div className="bg-[rgba(193,8,171,0.06)] border border-[rgba(193,8,171,0.20)] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#C108AB] mb-1 flex items-center gap-1.5">
                <Coins className="w-3 h-3" />
                Credits left
              </div>
              <div className="text-2xl font-bold text-[#C108AB]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                9
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Upcoming sessions */}
      <section className="px-6 pt-8">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-base font-bold text-[#1C1C1C] mb-4 flex items-center gap-2"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            <Calendar className="w-4 h-4 text-[#C108AB]" />
            Upcoming sessions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((s) => (
              <Card key={s.id} className="border border-[#E5E5E5] bg-white p-5 !shadow-none">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[#C108AB]" />
                  </div>
                  <Badge variant="fuchsia">{s.mode === 'Video' ? 'Video' : 'In-person'}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-[#1C1C1C] leading-snug">{s.topic}</h3>
                <p className="text-xs text-[#525252] mt-1">with {s.coach}</p>
                <div className="mt-4 pt-4 border-t border-[#F0F0F0] flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#525252]">
                    <Clock className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    {formatDateTime(s.date)} · {s.durationMin} min
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#525252]">
                    {s.mode === 'Video' ? <Video className="w-3.5 h-3.5 text-[#A3A3A3]" /> : <MapPin className="w-3.5 h-3.5 text-[#A3A3A3]" />}
                    {s.location}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="xs" onClick={() => (window.location.href = `/council/coaching/${s.id}`)}>
                    Join
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => (window.location.href = `/council/coaching/${s.id}`)}>
                    Reschedule
                  </Button>
                </div>
              </Card>
            ))}
            {upcoming.length === 0 && (
              <Card className="border border-[#E5E5E5] bg-white p-8 !shadow-none text-center">
                <GraduationCap className="w-6 h-6 text-[#A3A3A3] mx-auto mb-2" />
                <p className="text-sm text-[#525252]">No upcoming sessions. Book one to get started.</p>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Session history table */}
      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-base font-bold text-[#1C1C1C] mb-4"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Session history
          </h2>
          <Card className="border border-[#E5E5E5] bg-white !shadow-none overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-[#F7F7F7] border-b border-[#E5E5E5]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">Coach</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">Topic</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">Duration</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s, i) => {
                  const badge = STATUS_BADGE[s.status];
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-[#F0F0F0] ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                    >
                      <td className="px-5 py-3.5 text-sm text-[#525252] whitespace-nowrap">{formatDate(s.date)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-[#1C1C1C] whitespace-nowrap">{s.coach}</td>
                      <td className="px-5 py-3.5 text-sm text-[#1C1C1C]">{s.topic}</td>
                      <td className="px-5 py-3.5 text-sm text-[#525252] whitespace-nowrap">{s.durationMin} min</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      {/* Coaching notes */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2
              className="text-base font-bold text-[#1C1C1C] mb-4 flex items-center gap-2"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              <FileText className="w-4 h-4 text-[#C108AB]" />
              Coaching notes
            </h2>
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="border border-[#E5E5E5] bg-white p-5 !shadow-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[rgba(193,8,171,0.08)] flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-[#C108AB]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1C1C1C]">{note.coach}</div>
                        <div className="text-[11px] text-[#A3A3A3]">{formatDate(note.sessionDate)}</div>
                      </div>
                    </div>
                    <Badge variant="default">Private</Badge>
                  </div>
                  <p className="text-sm text-[#525252] leading-relaxed">{note.content}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Add note composer */}
          <div>
            <h2
              className="text-base font-bold text-[#1C1C1C] mb-4"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Add a note
            </h2>
            <Card className="border border-[#E5E5E5] bg-white p-5 !shadow-none">
              <p className="text-xs text-[#525252] mb-3 leading-relaxed">
                Capture a reflection or action item from your latest session. Notes are visible only to you.
              </p>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What did you take away from your last session?"
                rows={5}
                className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#E5E5E5] text-sm text-[#1C1C1C] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200 resize-none"
              />
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={handleAddNote}
                disabled={!newNote.trim() || savingNote}
                aria-busy={savingNote}
              >
                {savingNote ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save note
                  </>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            The Council — Coaching
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</a>
            <a href="/council/benefits" className="hover:text-white transition-colors no-underline">Benefits</a>
            <a href="/dex/chat" className="hover:text-white transition-colors no-underline">DEX AI</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
