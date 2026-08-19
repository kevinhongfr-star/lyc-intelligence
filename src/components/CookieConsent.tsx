import React, { useEffect, useState } from 'react';
import { V1 } from '@/styles/v1-tokens';

const STORAGE_KEY = 'lyc_cookie_consent_v1';

export type ConsentChoice = 'all' | 'essential' | null;

interface ConsentRecord {
  choice: ConsentChoice;
  decidedAt: string;
}

function getStoredConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentRecord;
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ choice, decidedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

const DECLINE_STYLE: React.CSSProperties = {
  fontFamily: V1.monoFont,
  fontSize: '0.65rem',
  letterSpacing: V1.trackingMono,
  textTransform: 'uppercase',
  backgroundColor: 'transparent',
  color: V1.ink700,
  border: `1px solid ${V1.ink300}`,
  borderRadius: 0,
  padding: '12px 16px',
  cursor: 'pointer',
  lineHeight: V1.leadingLabel,
  fontWeight: V1.fwMedium,
  transition: 'background-color 150ms ease-out',
};

const ACCEPT_STYLE: React.CSSProperties = {
  fontFamily: V1.monoFont,
  fontSize: '0.65rem',
  letterSpacing: V1.trackingMono,
  textTransform: 'uppercase',
  backgroundColor: V1.teal800,
  color: V1.white,
  border: 'none',
  borderRadius: 0,
  padding: '12px 16px',
  cursor: 'pointer',
  lineHeight: V1.leadingLabel,
  fontWeight: V1.fwMedium,
  transition: 'opacity 150ms ease-out',
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored || stored.choice === null) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleChoice = (choice: ConsentChoice) => {
    storeConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: V1.cream,
        borderTop: `1px solid ${V1.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: V1.bodyFont,
            fontSize: 13,
            color: V1.ink600,
            lineHeight: V1.leadingBody,
            flex: 1,
            minWidth: 260,
          }}
        >
          We use cookies to improve your experience.{' '}
          <a
            href="/cookies"
            style={{
              color: V1.teal600,
              fontWeight: V1.fwMedium,
              textDecoration: 'none',
            }}
          >
            Cookie policy →
          </a>{' '}
          <a
            href="/privacy"
            style={{
              color: V1.teal600,
              fontWeight: V1.fwMedium,
              textDecoration: 'none',
            }}
          >
            Privacy →
          </a>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            style={DECLINE_STYLE}
            onClick={() => handleChoice('essential')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = V1.ink50;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Decline
          </button>
          <button
            type="button"
            style={ACCEPT_STYLE}
            onClick={() => handleChoice('all')}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export function getConsentChoice(): ConsentChoice {
  return getStoredConsent()?.choice ?? null;
}

export default CookieConsent;
