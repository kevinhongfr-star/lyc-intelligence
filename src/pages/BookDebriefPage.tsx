/**
 * Batch 5 — /debrief/book page.
 *
 * Renders the 3-step BookingFlow component full-page within MarketingLayout.
 * Proxies URL query param ?session=<slug> to BookingFlow.initialSessionSlug.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingFlow } from '@/components/debrief/BookingFlow';
import { ACCENT, INK, TEXT, MUTED, BG } from '@/tokens';

export function BookDebriefPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSessionSlug = searchParams.get('session') ?? undefined;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay so skeleton paints cleanly on slow mounts.
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Page heading strip */}
      <div
        style={{
          borderBottom: `1px solid ${MUTED}22`,
          padding: '40px 24px 32px',
          background: INK,
          color: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: MUTED,
              marginBottom: 12,
            }}
          >
            [Emily: Booking flow eyebrow — placeholder] · Human Debrief
          </div>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.1,
              margin: 0,
              color: '#FFFFFF',
            }}
          >
            [Emily: Booking flow page headline — placeholder]
          </h1>
          <p
            style={{
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontSize: 17,
              lineHeight: 1.6,
              color: '#CCCCDD',
              maxWidth: 640,
              marginTop: 12,
            }}
          >
            [Emily: Booking flow page subhead — placeholder. Three steps: pick a session, find a time, confirm. Live debriefs with certified coaches.]
          </p>
        </div>
      </div>

      {/* Booking flow body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        {mounted ? (
          <BookingFlow
            initialSessionSlug={initialSessionSlug}
            onComplete={() => navigate('/app/bookings')}
            onClose={() => navigate('/debrief')}
          />
        ) : (
          <div
            style={{
              height: 480,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: MUTED,
              fontFamily: 'DM Sans, system-ui, sans-serif',
              fontSize: 14,
            }}
          >
            Loading booking flow…
          </div>
        )}
      </div>
    </div>
  );
}

export default BookDebriefPage;
