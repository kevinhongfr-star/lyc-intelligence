import React, { useState } from 'react';
import {
  Crown,
  Coins,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  CalendarPlus,
  Download,
  Link2,
  Briefcase,
  Video,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Council Event Detail Page (M3) — auth required.
 *
 * Full details for a single Council event: header, description, speaker,
 * RSVP + calendar sync, downloadable materials, attendee count.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 */

type EventType = 'Roundtable' | 'Workshop' | 'Dinner' | 'Briefing';

interface EventDetail {
  id: string;
  title: string;
  date: string; // ISO
  endTime: string; // ISO
  type: EventType;
  mode: 'In-person' | 'Online';
  location: string;
  description: string;
  speaker: {
    name: string;
    title: string;
    company: string;
    bio: string;
  };
  attendeeCount: number;
  capacity: number;
  creditCost: number;
}

interface Material {
  id: string;
  name: string;
  type: 'PDF' | 'Slides' | 'Worksheet' | 'Recording';
  size: string;
}

const EVENT: EventDetail = {
  id: 'e1',
  title: 'CFO Roundtable: Navigating Capital Markets in 2026',
  date: '2026-07-18T18:30:00',
  endTime: '2026-07-18T20:30:00',
  type: 'Roundtable',
  mode: 'In-person',
  location: 'Shanghai · The Council Room, Floor 22',
  description:
    'A closed-door roundtable for senior finance leaders. We will dissect the 2026 capital markets landscape — volatility in cross-border listings, the return of growth equity, and how CFOs are restructuring capital plans under renewed rate uncertainty. Expect a candid peer discussion under Chatham House rules. A Complimentary aperitivo precedes the session.',
  speaker: {
    name: 'Wei Zhang',
    title: 'Managing Partner',
    company: 'LiangYu Capital',
    bio: 'Wei has led 30+ growth-stage financings across APAC and North America over the past decade. He sits on the advisory boards of two sovereign-backed funds and writes the monthly Council briefing on capital markets.',
  },
  attendeeCount: 18,
  capacity: 24,
  creditCost: 1,
};

const MATERIALS: Material[] = [
  { id: 'm1', name: 'Pre-read: 2026 Capital Markets Outlook', type: 'PDF', size: '2.4 MB' },
  { id: 'm2', name: 'Roundtable discussion framework', type: 'Worksheet', size: '180 KB' },
  { id: 'm3', name: 'Speaker slides — LiangYu Capital', type: 'Slides', size: '5.1 MB' },
  { id: 'm4', name: 'Prior session recording (May 2026)', type: 'Recording', size: 'Stream' },
];

const TYPE_BADGE: Record<EventType, string> = {
  Roundtable: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  Workshop: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  Dinner: 'bg-[rgba(184,134,11,0.08)] text-[#B8860B]',
  Briefing: 'bg-[#F7F7F7] text-[#525252]',
};

const MATERIAL_ICON: Record<Material['type'], React.ComponentType<{ className?: string }>> = {
  PDF: FileText,
  Slides: FileText,
  Worksheet: FileText,
  Recording: Video,
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTimeRange(startIso: string, endIso: string): string {
  try {
    const s = new Date(startIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const e = new Date(endIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${s} – ${e}`;
  } catch {
    return '';
  }
}

export function CouncilEventDetailPage() {
  const [rsvped, setRsvped] = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [event] = useState<EventDetail>(EVENT);
  const [materials] = useState<Material[]>(MATERIALS);

  const spotsLeft = event.capacity - event.attendeeCount;
  const attendancePct = Math.round((event.attendeeCount / event.capacity) * 100);

  const handleRsvp = () => {
    setRsvping(true);
    setTimeout(() => {
      setRsvping(false);
      setRsvped(true);
    }, 700);
  };

  const handleCalendarSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 800);
  };

  const handleDownload = (material: Material) => {
    setDownloadingId(material.id);
    setTimeout(() => setDownloadingId(null), 900);
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
            <a href="/council/dashboard" className="text-sm font-medium text-[#C108AB] no-underline">Dashboard</a>
            <a href="/council/coaching" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Coaching</a>
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

      {/* Back link */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <a
            href="/council/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </a>
        </div>
      </div>

      {/* Event header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 py-10 md:py-12">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGE[event.type]}`}>
              {event.type}
            </span>
            <Badge variant={event.mode === 'In-person' ? 'default' : 'fuchsia'}>
              {event.mode === 'In-person' ? <MapPin className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
              {event.mode}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#C108AB] bg-[rgba(193,8,171,0.08)] px-2.5 py-1">
              <Coins className="w-3 h-3" />
              {event.creditCost} Council Credit
            </span>
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C] leading-tight"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {event.title}
          </h1>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#C108AB]" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3]">Date</div>
                <div className="text-sm font-medium text-[#1C1C1C]">{formatDate(event.date)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-[#C108AB]" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3]">Time</div>
                <div className="text-sm font-medium text-[#1C1C1C]">{formatTimeRange(event.date, event.endTime)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#C108AB]" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3]">Location</div>
                <div className="text-sm font-medium text-[#1C1C1C]">{event.location}</div>
              </div>
            </div>
          </div>

          {/* RSVP + calendar sync */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={handleRsvp}
              disabled={rsvping || rsvped}
              aria-busy={rsvping}
              className={rsvped ? '!bg-[#1A7D42] hover:!bg-[#156B36]' : ''}
            >
              {rsvping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reserving your seat…
                </>
              ) : rsvped ? (
                <>
                  <Check className="w-4 h-4" />
                  You are attending
                </>
              ) : (
                <>
                  RSVP — Reserve seat
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleCalendarSync}
              disabled={syncing || synced}
              aria-busy={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : synced ? (
                <Check className="w-4 h-4" />
              ) : (
                <CalendarPlus className="w-4 h-4" />
              )}
              {synced ? 'Added to calendar' : 'Add to calendar'}
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border border-[#E5E5E5] bg-white p-6 !shadow-none">
              <h2
                className="text-base font-bold text-[#1C1C1C] mb-3"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                About this event
              </h2>
              <p className="text-sm text-[#525252] leading-relaxed">{event.description}</p>
            </Card>

            {/* Speaker */}
            <Card className="border border-[#E5E5E5] bg-white p-6 !shadow-none">
              <h2
                className="text-base font-bold text-[#1C1C1C] mb-4"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Speaker
              </h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#C108AB] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-white" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                    {event.speaker.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1C1C1C]">{event.speaker.name}</div>
                  <div className="text-xs text-[#525252] mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    {event.speaker.title}, {event.speaker.company}
                  </div>
                  <p className="text-sm text-[#525252] leading-relaxed mt-3">{event.speaker.bio}</p>
                </div>
              </div>
            </Card>

            {/* Materials */}
            <Card className="border border-[#E5E5E5] bg-white !shadow-none">
              <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
                <h2
                  className="text-base font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Materials
                </h2>
                <Badge variant="default">{materials.length} items</Badge>
              </div>
              <ul className="divide-y divide-[#F0F0F0]">
                {materials.map((m) => {
                  const Icon = MATERIAL_ICON[m.type];
                  const isDownloading = downloadingId === m.id;
                  return (
                    <li key={m.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#C108AB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#1C1C1C] truncate">{m.name}</div>
                        <div className="text-[11px] text-[#A3A3A3] mt-0.5">
                          {m.type} · {m.size}
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleDownload(m)}
                        disabled={isDownloading}
                        aria-busy={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">{isDownloading ? 'Downloading' : 'Download'}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attendee count */}
            <Card className="border border-[#E5E5E5] bg-white p-6 !shadow-none">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#C108AB]" />
                <h3
                  className="text-base font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Attendees
                </h3>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-3xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {event.attendeeCount}
                </span>
                <span className="text-xs text-[#A3A3A3]">of {event.capacity} seats</span>
              </div>
              <div className="w-full h-2 bg-[#F0F0F0] mb-2 overflow-hidden">
                <div
                  className="h-full bg-[#C108AB] transition-all duration-500"
                  style={{ width: `${attendancePct}%` }}
                />
              </div>
              <p className="text-xs text-[#525252]">
                {spotsLeft > 0
                  ? `${spotsLeft} seats remaining. Council members only.`
                  : 'This event is at capacity. Join the waitlist.'}
              </p>
            </Card>

            {/* Join info */}
            <Card className="border border-[#E5E5E5] bg-white p-6 !shadow-none">
              <h3
                className="text-base font-bold text-[#1C1C1C] mb-3"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Joining details
              </h3>
              {event.mode === 'Online' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#525252]">
                    <Link2 className="w-4 h-4 text-[#A3A3A3]" />
                    Council Live link provided after RSVP
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    A calendar invite with the secure link is sent 24 hours before the session.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-[#525252]">
                    <MapPin className="w-4 h-4 text-[#A3A3A3] mt-0.5" />
                    <span>{event.location}</span>
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    Doors open 30 minutes prior. A Complimentary aperitivo is served before the roundtable begins.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            The Council — Events
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</a>
            <a href="/council/coaching" className="hover:text-white transition-colors no-underline">Coaching</a>
            <a href="/council/community" className="hover:text-white transition-colors no-underline">Community</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
