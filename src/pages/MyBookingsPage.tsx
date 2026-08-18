import React from 'react';
import { Calendar, Clock, CheckCircle2, Video, MapPin, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { INSTRUMENT_MILE_COST, getMileCostTier } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

type BookingStatus = 'upcoming' | 'past' | 'cancelled';

interface MockBooking {
  id: string;
  instrumentCode: string;
  sessionType: string;
  durationMinutes: number;
  status: BookingStatus;
  dateISO: string;
  time: string;
  specialistName: string;
  specialistRole: string;
  modality: 'video' | 'in-person';
  location?: string;
  joinUrl?: string;
}

const TODAY = new Date();

function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(d.getDate() + n);
  return nd;
}

const MOCK_BOOKINGS: readonly MockBooking[] = [
  {
    id: 'bk-cpi-001',
    instrumentCode: 'CPI',
    sessionType: 'CPI (China Leadership Pipeline Index) Specialist',
    durationMinutes: 90,
    status: 'upcoming',
    dateISO: addDays(TODAY, 5).toISOString().split('T')[0],
    time: '10:00',
    specialistName: 'Dr. Wei Zhang',
    specialistRole: 'CPI Specialist & Senior Consultant',
    modality: 'video',
    joinUrl: '#join-cpi',
  },
  {
    id: 'bk-prism-002',
    instrumentCode: 'PRISM',
    sessionType: 'Leadership Coach',
    durationMinutes: 45,
    status: 'upcoming',
    dateISO: addDays(TODAY, 10).toISOString().split('T')[0],
    time: '14:30',
    specialistName: 'Sarah Chen',
    specialistRole: 'Leadership Coach',
    modality: 'video',
    joinUrl: '#join-prism',
  },
  {
    id: 'bk-spark-003',
    instrumentCode: 'SPARK',
    sessionType: 'Senior Consultant',
    durationMinutes: 60,
    status: 'upcoming',
    dateISO: addDays(TODAY, 15).toISOString().split('T')[0],
    time: '11:00',
    specialistName: 'Marcus Lee',
    specialistRole: 'Senior Consultant',
    modality: 'in-person',
    location: 'Singapore · Marina Bay Financial Centre',
  },
  {
    id: 'bk-leap-004',
    instrumentCode: 'LEAP',
    sessionType: 'Executive Diagnostic Specialist',
    durationMinutes: 30,
    status: 'past',
    dateISO: addDays(TODAY, -12).toISOString().split('T')[0],
    time: '09:30',
    specialistName: 'Ananya Rao',
    specialistRole: 'Executive Diagnostic Specialist',
    modality: 'video',
  },
  {
    id: 'bk-bridge-005',
    instrumentCode: 'BRIDGE',
    sessionType: 'Senior Consultant',
    durationMinutes: 60,
    status: 'past',
    dateISO: addDays(TODAY, -22).toISOString().split('T')[0],
    time: '15:00',
    specialistName: 'Kevin O\'Connor',
    specialistRole: 'Senior Consultant',
    modality: 'video',
  },
  {
    id: 'bk-quest-006',
    instrumentCode: 'QUEST',
    sessionType: 'Leadership Coach',
    durationMinutes: 45,
    status: 'past',
    dateISO: addDays(TODAY, -34).toISOString().split('T')[0],
    time: '13:00',
    specialistName: 'Sarah Chen',
    specialistRole: 'Leadership Coach',
    modality: 'video',
  },
] as const;

function getInstrumentDisplay(code: string) {
  const isCPI = code === 'CPI';
  const miles = INSTRUMENT_MILE_COST[code] ?? 2;
  const tier = getMileCostTier(code);
  const catalog = ASSESSMENT_CATALOG[code];
  const name = isCPI ? 'China Leadership Pipeline Index' : catalog?.b2cName || catalog?.name || code;
  const tierLabel = tier?.label ?? 'Standard';
  return { name, tierLabel, miles, isCPI };
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export interface MyBookingsPageProps {
  bookings?: readonly MockBooking[];
  onBookNew?: () => void;
  onJoin?: (bookingId: string, url?: string) => void;
  onReschedule?: (bookingId: string) => void;
}

export function MyBookingsPage({
  bookings = MOCK_BOOKINGS,
  onBookNew,
  onJoin,
  onReschedule,
}: MyBookingsPageProps) {
  const upcoming = bookings.filter((b) => b.status === 'upcoming');
  const past = bookings.filter((b) => b.status === 'past' || b.status === 'cancelled');

  return (
    <>
      <SEO
        title="Your Diagnostic Debriefs | LYC Intelligence"
        description="Manage your upcoming and past executive diagnostic debriefs. Join video sessions, view specialist details, and book new debriefs."
        path="/my-bookings"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-white">
        <header className="max-w-6xl mx-auto px-4 pt-16 pb-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="info" size="md">
                  My Bookings
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Your Diagnostic Debriefs
              </h1>
              <p className="text-text-muted max-w-2xl">
                Track upcoming specialist debriefs, review past sessions, and book new 1:1
                diagnostic walkthroughs across the 11-instrument Executive Intelligence catalog.
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              leftIcon={<Calendar className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={onBookNew}
            >
              Book New Debrief
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-text-primary">
                Upcoming Debriefs
              </h2>
              <Badge variant="info" size="md">
                {upcoming.length} session{upcoming.length === 1 ? '' : 's'}
              </Badge>
            </div>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    No upcoming diagnostic debriefs
                  </h3>
                  <p className="text-text-muted mb-5 max-w-md mx-auto">
                    Book your first 1:1 debrief today and get personalised interpretation
                    of your executive diagnostic results.
                  </p>
                  <Button
                    variant="default"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={onBookNew}
                  >
                    Book a Diagnostic Debrief
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcoming.map((b) => {
                  const info = getInstrumentDisplay(b.instrumentCode);
                  return (
                    <Card key={b.id} className={info.isCPI ? 'ring-2 ring-accent' : ''}>
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="success" size="sm">
                              Confirmed
                            </Badge>
                            <Badge variant={info.isCPI ? 'success' : 'info'} size="sm">
                              {info.tierLabel} Tier
                            </Badge>
                            <Badge variant="default" size="sm">
                              {info.miles} mi · {b.durationMinutes} min
                            </Badge>
                          </div>
                          <Badge variant={b.modality === 'video' ? 'info' : 'default'} size="sm">
                            {b.modality === 'video' ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                            {b.modality === 'video' ? 'Video' : 'In-person'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">
                          {info.isCPI
                            ? `China Leadership Pipeline Index — Flagship Debrief`
                            : `${info.name} — ${info.tierLabel} Debrief`}
                        </CardTitle>
                        <CardDescription>
                          {b.sessionType} · Led by {b.specialistName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-bg-tertiary/50">
                          <div>
                            <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                              Date
                            </div>
                            <div className="font-semibold text-text-primary">{formatDateLong(b.dateISO)}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                              Time
                            </div>
                            <div className="font-semibold text-text-primary flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-text-muted" />
                              {b.time} ({b.durationMinutes} min)
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                            Specialist
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-text-primary">{b.specialistName}</div>
                              <div className="text-text-muted">{b.specialistRole}</div>
                              {b.modality === 'in-person' && b.location && (
                                <div className="text-text-muted text-xs mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {b.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          {b.modality === 'video' && b.joinUrl && (
                            <Button
                              variant="default"
                              className="flex-1"
                              rightIcon={<Video className="w-4 h-4" />}
                              onClick={() => onJoin?.(b.id, b.joinUrl)}
                            >
                              Join Video Session
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className={b.modality === 'video' && b.joinUrl ? 'flex-1' : 'w-full'}
                            onClick={() => onReschedule?.(b.id)}
                          >
                            Reschedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-text-primary">
                Past Debriefs
              </h2>
              <Badge variant="default" size="md">
                {past.length} session{past.length === 1 ? '' : 's'}
              </Badge>
            </div>
            {past.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    No past diagnostic debriefs yet
                  </h3>
                  <p className="text-text-muted max-w-md mx-auto">
                    Completed debriefs will appear here with specialist notes and session summaries.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {past.map((b) => {
                      const info = getInstrumentDisplay(b.instrumentCode);
                      return (
                        <div
                          key={b.id}
                          className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                        >
                          <div className="md:col-span-3">
                            <div className="text-sm text-text-muted">{formatDateShort(b.dateISO)}</div>
                            <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {b.time} · {b.durationMinutes} min
                            </div>
                          </div>
                          <div className="md:col-span-6">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-text-primary">
                                {info.isCPI ? 'China Leadership Pipeline Index' : info.name}
                              </span>
                              <Badge variant="default" size="sm">{info.tierLabel}</Badge>
                            </div>
                            <div className="text-sm text-text-secondary">{b.sessionType}</div>
                            <div className="text-xs text-text-muted mt-0.5">
                              {b.specialistName} · {b.specialistRole}
                            </div>
                          </div>
                          <div className="md:col-span-3 md:text-right">
                            <Badge variant="default" size="sm">
                              {b.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                            </Badge>
                            <div className="mt-2">
                              <Button variant="ghost" size="sm">
                                View Notes
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default MyBookingsPage;
