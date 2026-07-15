import React, { useState } from 'react';
import {
  Crown,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Coins,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Download,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Council Member Dashboard (M1) — auth required.
 *
 * The signed-in member's home base inside The Council.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 */

type TierId = 'Founding' | 'Individual' | 'Corporate' | 'PE Partner';

interface KpiCard {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: boolean;
  hint?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string; // ISO
  type: 'Roundtable' | 'Workshop' | 'Dinner' | 'Briefing';
  location: string;
}

interface ActivityItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  timestamp: string;
}

const MEMBER = {
  name: 'Sarah Chen',
  tier: 'Founding' as TierId,
  credits: 9,
  creditsTotal: 12,
};

const KPIS: KpiCard[] = [
  {
    id: 'credits',
    label: 'Credits Available',
    value: '9',
    icon: Coins,
    accent: true,
    hint: 'of 12 this year',
  },
  {
    id: 'events',
    label: 'Upcoming Events',
    value: '4',
    icon: CalendarDays,
    accent: false,
    hint: 'next in 3 days',
  },
  {
    id: 'coaching',
    label: 'Coaching Sessions',
    value: '8',
    icon: GraduationCap,
    accent: false,
    hint: '4 completed this quarter',
  },
  {
    id: 'posts',
    label: 'Community Posts',
    value: '23',
    icon: MessageSquare,
    accent: false,
    hint: '2 new replies',
  },
];

const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: 'e1',
    title: 'CFO Roundtable: Navigating Capital Markets in 2026',
    date: '2026-07-18T18:30:00',
    type: 'Roundtable',
    location: 'Shanghai · The Council Room',
  },
  {
    id: 'e2',
    title: 'Workshop: Executive Presence & Board Communication',
    date: '2026-07-24T09:00:00',
    type: 'Workshop',
    location: 'Online · Council Live',
  },
  {
    id: 'e3',
    title: 'Members Dinner — Growth Equity Partners Meetup',
    date: '2026-08-02T19:00:00',
    type: 'Dinner',
    location: 'Beijing · Private Dining',
  },
  {
    id: 'e4',
    title: 'Q3 Market Briefing: Talent & Compensation Trends',
    date: '2026-08-12T11:00:00',
    type: 'Briefing',
    location: 'Online · Council Live',
  },
];

const ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    icon: GraduationCap,
    text: 'Completed a coaching session with Marcus Wei on negotiation strategy.',
    timestamp: '2 hours ago',
  },
  {
    id: 'a2',
    icon: MessageSquare,
    text: 'Your post in "Career transitions" received 5 new replies.',
    timestamp: 'Yesterday',
  },
  {
    id: 'a3',
    icon: Coins,
    text: '1 Council Credit redeemed for the Q3 Market Briefing registration.',
    timestamp: '2 days ago',
  },
  {
    id: 'a4',
    icon: Users,
    text: 'Connected with David Park, CFO at a Series D startup.',
    timestamp: '4 days ago',
  },
  {
    id: 'a5',
    icon: TrendingUp,
    text: 'Monthly intelligence report "APAC Leadership Mobility" is now available.',
    timestamp: '1 week ago',
  },
];

const EVENT_TYPE_BADGE: Record<UpcomingEvent['type'], { label: string; cls: string }> = {
  Roundtable: { label: 'Roundtable', cls: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]' },
  Workshop: { label: 'Workshop', cls: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]' },
  Dinner: { label: 'Dinner', cls: 'bg-[rgba(184,134,11,0.08)] text-[#B8860B]' },
  Briefing: { label: 'Briefing', cls: 'bg-[#F7F7F7] text-[#525252]' },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function CouncilDashboardPage() {
  const [events] = useState<UpcomingEvent[]>(UPCOMING_EVENTS);
  const [activity] = useState<ActivityItem[]>(ACTIVITY);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleDownloadReport = () => {
    setDownloadingReport(true);
    setTimeout(() => setDownloadingReport(false), 800);
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
              {MEMBER.credits} credits
            </div>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/council/profile')}>
              <Crown className="w-3.5 h-3.5" />
              {MEMBER.name.split(' ')[0]}
            </Button>
          </div>
        </div>
      </nav>

      {/* Welcome header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-[11px] font-semibold uppercase tracking-widest px-3 py-1">
                  <Crown className="w-3 h-3" />
                  {MEMBER.tier} Member
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] text-[#525252] text-[11px] font-semibold uppercase tracking-widest px-3 py-1">
                  <Sparkles className="w-3 h-3" />
                  Active
                </span>
              </div>
              <h1
                className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Welcome back, {MEMBER.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-[#525252] mt-2 max-w-xl leading-relaxed">
                Here is what is happening across The Council this week — your coaching, your events, and your peers.
              </p>
            </div>
            <Card className="border border-[#E5E5E5] !shadow-none px-5 py-4 bg-[#F7F7F7]">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                Credit Balance
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold text-[#C108AB]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {MEMBER.credits}
                </span>
                <span className="text-xs text-[#A3A3A3]">of {MEMBER.creditsTotal} Council Credits</span>
              </div>
              <Button
                size="xs"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => (window.location.href = '/council/benefits')}
              >
                Manage credits
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="px-6 pt-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.id}
                className={`p-5 border ${kpi.accent ? 'border-[#C108AB] bg-[rgba(193,8,171,0.03)]' : 'border-[#E5E5E5] bg-white'} !shadow-none`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 flex items-center justify-center ${
                      kpi.accent ? 'bg-[#C108AB]' : 'bg-[rgba(193,8,171,0.08)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${kpi.accent ? 'text-white' : 'text-[#C108AB]'}`} />
                  </div>
                </div>
                <div
                  className="text-2xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {kpi.value}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mt-1">
                  {kpi.label}
                </div>
                {kpi.hint && <div className="text-xs text-[#525252] mt-2">{kpi.hint}</div>}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main two-column area */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming events */}
          <div className="lg:col-span-2">
            <Card className="border border-[#E5E5E5] bg-white !shadow-none">
              <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#C108AB]" />
                  <h2
                    className="text-base font-bold text-[#1C1C1C]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    Upcoming Events
                  </h2>
                </div>
                <a
                  href="/council/coaching"
                  className="text-xs font-medium text-[#C108AB] hover:text-[#A50798] no-underline inline-flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <ul className="divide-y divide-[#F0F0F0]">
                {events.map((ev) => {
                  const badge = EVENT_TYPE_BADGE[ev.type];
                  return (
                    <li key={ev.id} className="px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 text-center bg-[#F7F7F7] border border-[#E5E5E5] py-2">
                          <div className="text-[10px] uppercase tracking-wide text-[#A3A3A3]">
                            {new Date(ev.date).toLocaleDateString(undefined, { month: 'short' })}
                          </div>
                          <div
                            className="text-lg font-bold text-[#1C1C1C] leading-tight"
                            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                          >
                            {new Date(ev.date).getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#A3A3A3]">
                              <Clock className="w-3 h-3" />
                              {formatTime(ev.date)}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#1C1C1C] leading-snug">
                            {ev.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-[#525252] mt-1">
                            <MapPin className="w-3 h-3" />
                            {ev.location}
                          </div>
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => (window.location.href = `/council/events/${ev.id}`)}
                          className="flex-shrink-0 hidden sm:inline-flex"
                        >
                          Details
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Recent activity */}
          <div>
            <Card className="border border-[#E5E5E5] bg-white !shadow-none">
              <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#C108AB]" />
                <h2
                  className="text-base font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Recent Activity
                </h2>
              </div>
              <ul className="px-6 py-2">
                {activity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id} className="py-3.5 border-b border-[#F0F0F0] last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-[#C108AB]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-[#1C1C1C] leading-relaxed">{item.text}</p>
                          <p className="text-[11px] text-[#A3A3A3] mt-1">{item.timestamp}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-base font-bold text-[#1C1C1C] mb-4"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              interactive
              className="border border-[#E5E5E5] bg-white p-5"
            >
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-3">
                <Plus className="w-4 h-4 text-[#C108AB]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">Book a coaching session</h3>
              <p className="text-xs text-[#525252] mb-3">1 Council Credit · senior LYC coaches</p>
              <Button
                size="xs"
                onClick={() => (window.location.href = '/council/coaching')}
              >
                Book now
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>

            <Card
              interactive
              className="border border-[#E5E5E5] bg-white p-5"
            >
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-[#C108AB]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">Post to the community</h3>
              <p className="text-xs text-[#525252] mb-3">Share an insight with peers</p>
              <Button
                size="xs"
                variant="outline"
                onClick={() => (window.location.href = '/council/community')}
              >
                Compose post
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>

            <Card
              interactive
              className="border border-[#E5E5E5] bg-white p-5"
            >
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-3">
                <Users className="w-4 h-4 text-[#C108AB]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">Browse member directory</h3>
              <p className="text-xs text-[#525252] mb-3">Connect with senior peers</p>
              <Button
                size="xs"
                variant="outline"
                onClick={() => (window.location.href = '/council/directory')}
              >
                Open directory
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>

            <Card
              interactive
              className="border border-[#E5E5E5] bg-white p-5"
            >
              <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-3">
                <Download className="w-4 h-4 text-[#C108AB]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">Download intelligence report</h3>
              <p className="text-xs text-[#525252] mb-3">APAC Leadership Mobility · July 2026</p>
              <Button
                size="xs"
                variant="outline"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                aria-busy={downloadingReport}
              >
                {downloadingReport ? 'Preparing…' : 'Download'}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            className="text-sm font-bold"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council — Member Dashboard
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council" className="hover:text-white transition-colors no-underline">Council Home</a>
            <a href="/dex/chat" className="hover:text-white transition-colors no-underline">DEX AI</a>
            <a href="/council/benefits" className="hover:text-white transition-colors no-underline">Benefits</a>
            <a href="/council/profile" className="hover:text-white transition-colors no-underline">Profile</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
