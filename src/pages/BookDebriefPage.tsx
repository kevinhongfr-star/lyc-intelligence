import React, { useMemo } from 'react';
import { SEO } from '@/components/seo/SEO';
import { BookingFlow } from '@/components/debrief/BookingFlow';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { INSTRUMENT_MILE_COST, getMileCostTier } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export interface BookDebriefPageProps {
  instrumentCode?: string;
  onSuccess?: (result: {
    sessionKey: string;
    sessionType: string;
    date: string;
    time: string;
  }) => void;
}

function readInstrumentFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('instrument');
    return v || undefined;
  } catch {
    return undefined;
  }
}

function resolveMeta(code?: string) {
  if (!code) {
    return {
      resolvedCode: 'LEAP' as string,
      displayName: 'Your Diagnostic',
      miles: 1,
      tierLabel: 'Light',
      isCPI: false,
    };
  }
  const isCPI = code === 'CPI';
  const miles = INSTRUMENT_MILE_COST[code] ?? 2;
  const tier = getMileCostTier(code);
  const catalog = ASSESSMENT_CATALOG[code];
  const displayName = isCPI
    ? 'China Leadership Pipeline Index'
    : catalog?.b2cName || catalog?.name || code;
  const tierLabel = tier?.label ?? 'Standard';
  return { resolvedCode: code, displayName, miles, tierLabel, isCPI };
}

export function BookDebriefPage({ instrumentCode, onSuccess }: BookDebriefPageProps) {
  const effectiveCode = useMemo(() => {
    return instrumentCode ?? readInstrumentFromUrl();
  }, [instrumentCode]);

  const meta = resolveMeta(effectiveCode);

  const seoTitle = meta.isCPI
    ? `China Leadership Pipeline Index — Diagnostic Debrief Booking | LYC Intelligence`
    : `${meta.displayName} — Diagnostic Debrief Booking | LYC Intelligence`;
  const seoDescription = meta.isCPI
    ? `Book your 90-minute Flagship diagnostic debrief for the ${meta.displayName}. CPI-certified specialist-led walkthrough with APAC benchmarks and personalised interpretation.`
    : `Book a live diagnostic debrief for the ${meta.displayName} (${meta.tierLabel} tier, ${meta.miles} mi). Specialist-matched 1:1 interpretation with actionable next steps.`;

  const handleSuccess = (booking: {
    sessionKey: string;
    sessionType: string;
    date: string;
    time: string;
  }) => {
    onSuccess?.(booking);
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        path="/debrief/book"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-white py-10 px-4">
        <div className="max-w-5xl mx-auto mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="info" size="md">
                  Diagnostic Debrief Booking
                </Badge>
                <Badge variant={meta.isCPI ? 'success' : 'default'} size="md">
                  {meta.tierLabel} Tier · {meta.miles} mi
                </Badge>
                {meta.isCPI && (
                  <Badge variant="success" size="md">
                    China Leadership Pipeline Index
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                {meta.isCPI
                  ? 'China Leadership Pipeline Index — Diagnostic Debrief Booking'
                  : `${meta.displayName} — Diagnostic Debrief Booking`}
              </h1>
              <p className="text-text-muted">
                Choose your session tier, specialist, and preferred time. Bookings open from 2 to 60 days out.
              </p>
            </CardContent>
          </Card>
        </div>
        <BookingFlow
          instrumentCode={meta.resolvedCode}
          onSuccess={handleSuccess}
        />
      </div>
    </>
  );
}

export default BookDebriefPage;
