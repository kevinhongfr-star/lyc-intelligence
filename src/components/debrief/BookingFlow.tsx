import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle2, ArrowRight, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  SESSION_BUCKETS,
  SESSION_TYPES,
  SESSION_BUCKET_ORDER,
  INSTRUMENT_TO_SESSION_RECS,
  BOOKING_WINDOW_MIN_DAYS,
  BOOKING_WINDOW_MAX_DAYS,
  TIME_SLOTS,
  getSessionKeyByMiles,
  getDurationByMiles,
  type SessionKey,
  type SessionTypeKey,
} from '@/config/sessions';
import { INSTRUMENT_MILE_COST, getMileCostTier } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export interface BookingFlowProps {
  instrumentCode: string;
  preselectedSessionType?: SessionTypeKey;
  onSuccess?: (booking: {
    sessionKey: SessionKey;
    sessionType: SessionTypeKey;
    date: string;
    time: string;
  }) => void;
}

type BookingStep = 'select-session' | 'select-type' | 'select-time' | 'confirm';

function getInstrumentMeta(code: string) {
  const isCPI = code === 'CPI';
  const miles = INSTRUMENT_MILE_COST[code] ?? 2;
  const tier = getMileCostTier(code);
  const catalog = ASSESSMENT_CATALOG[code];
  const name = isCPI ? 'China Leadership Pipeline Index' : catalog?.b2cName || catalog?.name || code;
  const tierLabel = tier?.label ?? 'Standard';
  return { name, miles, tierLabel, isCPI };
}

function getAvailableDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = BOOKING_WINDOW_MIN_DAYS; i <= BOOKING_WINDOW_MAX_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d.toISOString().split('T')[0]);
      if (dates.length >= 21) break;
    }
  }
  return dates;
}

export function BookingFlow({ instrumentCode, preselectedSessionType, onSuccess }: BookingFlowProps) {
  const meta = useMemo(() => getInstrumentMeta(instrumentCode), [instrumentCode]);
  const miles = meta.miles;

  const autoSessionKey = useMemo<SessionKey | null>(() => getSessionKeyByMiles(miles), [miles]);
  const defaultDuration = getDurationByMiles(miles);
  const recommendedTypes: readonly SessionTypeKey[] =
    INSTRUMENT_TO_SESSION_RECS[instrumentCode] ?? INSTRUMENT_TO_SESSION_RECS.LEAP;

  const [step, setStep] = useState<BookingStep>('select-session');
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(autoSessionKey);
  const [sessionType, setSessionType] = useState<SessionTypeKey | null>(preselectedSessionType ?? null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const availableDates = useMemo(() => getAvailableDates(), []);

  const headline = meta.isCPI
    ? `China Leadership Pipeline Index — Diagnostic Debrief Booking`
    : `${meta.name} — Diagnostic Debrief Booking`;

  function formatDateLabel(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function handleConfirm() {
    if (!sessionKey || !sessionType || !selectedDate || !selectedTime) return;
    onSuccess?.({
      sessionKey,
      sessionType,
      date: selectedDate,
      time: selectedTime,
    });
  }

  const canAdvanceSession = sessionKey !== null;
  const canAdvanceType = sessionType !== null;
  const canAdvanceTime = selectedDate !== null && selectedTime !== null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="info" size="sm">
              {meta.tierLabel} Tier · {meta.miles} mi
            </Badge>
            <Badge variant="default" size="sm">
              {defaultDuration ? `${defaultDuration} min` : 'Custom'}
            </Badge>
          </div>
          <CardTitle className="text-2xl">{headline}</CardTitle>
          <CardDescription>
            Book your expert-led diagnostic debrief. We match you with the right specialist for your {meta.name} results.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between mb-6 px-2">
        {(['select-session', 'select-type', 'select-time', 'confirm'] as BookingStep[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                step === s
                  ? 'bg-accent text-white'
                  : (['select-session', 'select-type', 'select-time', 'confirm'].indexOf(step) > i)
                    ? 'bg-green-500 text-white'
                    : 'bg-bg-tertiary text-text-muted'
              )}>
                {(['select-session', 'select-type', 'select-time', 'confirm'].indexOf(step) > i) ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={cn(
                'text-xs font-medium',
                step === s ? 'text-text-primary' : 'text-text-muted'
              )}>
                {s === 'select-session' && 'Session'}
                {s === 'select-type' && 'Specialist'}
                {s === 'select-time' && 'Date & Time'}
                {s === 'confirm' && 'Confirm'}
              </span>
            </div>
            {i < 3 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2',
                (['select-session', 'select-type', 'select-time', 'confirm'].indexOf(step) > i)
                  ? 'bg-green-500'
                  : 'bg-bg-tertiary'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 'select-session' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {SESSION_BUCKET_ORDER.map((key) => {
              const cfg = SESSION_BUCKETS[key];
              const isMatch = autoSessionKey === key;
              const isSelected = sessionKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSessionKey(key)}
                  className={cn(
                    'text-left p-5 border-2 transition-all',
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-white hover:border-accent/50',
                    cfg.bucket === 'flagship' && !isSelected && 'border-accent/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isMatch ? 'success' : 'default'} size="sm">
                        {cfg.bucket === 'light' && 'Light'}
                        {cfg.bucket === 'standard' && 'Standard'}
                        {cfg.bucket === 'signature' && 'Signature'}
                        {cfg.bucket === 'flagship' && 'Flagship'}
                      </Badge>
                      {isMatch && (
                        <Badge variant="info" size="sm">Recommended for {meta.name}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-muted">
                      <Clock className="w-4 h-4" />
                      {cfg.durationMinutes} min
                    </div>
                  </div>
                  <div className="font-semibold text-text-primary mb-1">{cfg.label}</div>
                  <div className="text-sm text-text-muted mb-3">
                    {cfg.recommendedInstruments.length} diagnostic{cfg.recommendedInstruments.length > 1 ? 's' : ''} · {cfg.miles} mi
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.recommendedInstruments.slice(0, 3).map((c) => (
                      <span key={c} className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-secondary">
                        {c}
                      </span>
                    ))}
                    {cfg.recommendedInstruments.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-secondary">
                        +{cfg.recommendedInstruments.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button
              variant="default"
              disabled={!canAdvanceSession}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep('select-type')}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'select-type' && (
        <div>
          <div className="space-y-3 mb-6">
            {recommendedTypes.map((typeKey) => {
              const st = SESSION_TYPES[typeKey];
              const isSelected = sessionType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setSessionType(typeKey)}
                  className={cn(
                    'w-full text-left p-5 border-2 transition-all flex items-start gap-4',
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-white hover:border-accent/50'
                  )}
                >
                  <div className="w-12 h-12 bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary mb-1">{st.title}</div>
                    <div className="text-sm text-text-muted">{st.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep('select-session')}
            >
              Back
            </Button>
            <Button
              variant="default"
              disabled={!canAdvanceType}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep('select-time')}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'select-time' && (
        <div>
          <div className="mb-6">
            <div className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select a date
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {availableDates.map((date) => {
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                    className={cn(
                      'p-3 text-center border-2 transition-all',
                      isSelected
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border bg-white hover:border-accent/50 text-text-primary'
                    )}
                  >
                    <div className="text-xs font-medium">{formatDateLabel(date)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="mb-6">
              <div className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select a time
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {TIME_SLOTS.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'p-2.5 text-center border-2 transition-all text-sm font-medium',
                        isSelected
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-border bg-white hover:border-accent/50 text-text-primary'
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep('select-type')}
            >
              Back
            </Button>
            <Button
              variant="default"
              disabled={!canAdvanceTime}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep('confirm')}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && sessionKey && sessionType && selectedDate && selectedTime && (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Confirm your booking</CardTitle>
              <CardDescription>
                Please review the details below before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg-tertiary/50">
                <div>
                  <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Diagnostic</div>
                  <div className="font-semibold text-text-primary">{meta.name}</div>
                  <div className="text-sm text-text-muted">{meta.tierLabel} tier · {meta.miles} mi</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Session</div>
                  <div className="font-semibold text-text-primary">{SESSION_BUCKETS[sessionKey].label}</div>
                  <div className="text-sm text-text-muted">{SESSION_BUCKETS[sessionKey].durationMinutes} minutes</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Specialist</div>
                  <div className="font-semibold text-text-primary">{SESSION_TYPES[sessionType].title}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Date &amp; Time</div>
                  <div className="font-semibold text-text-primary">{formatDateLabel(selectedDate)}</div>
                  <div className="text-sm text-text-muted">at {selectedTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setStep('select-time')}
            >
              Back
            </Button>
            <Button
              variant="default"
              size="lg"
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirm}
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingFlow;
