/**
 * CookieConsent — Bottom-of-page consent banner (S4-T03)
 *
 * Shows a cookie consent banner with three options:
 *   - "Essential Only" (reject non-essential)
 *   - "Accept All" (accept analytics + marketing)
 *   - Persisted in localStorage; never re-shown once decided.
 */
import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, decidedAt: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored || stored.choice === null) {
      // Small delay so it doesn't flash on initial paint
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E] text-white border-t border-[#2A2A45] shadow-lg">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 text-fuchsia flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#B8B8C8] leading-relaxed">
            We use cookies to operate this site and improve your experience. Essential cookies are always on.
            Analytics cookies help us understand usage. See our{' '}
            <a href="/cookies" className="text-fuchsia hover:underline">Cookie Policy</a> and{' '}
            <a href="/privacy" className="text-fuchsia hover:underline">Privacy Policy</a>.
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleChoice('essential')}
            className="px-4 py-2 text-xs font-medium text-[#B8B8C8] border border-[#3A3A52] hover:bg-[#252540] transition-colors"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => handleChoice('all')}
            className="px-4 py-2 text-xs font-medium text-white bg-fuchsia hover:opacity-90 transition-opacity"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={() => handleChoice('essential')}
            aria-label="Dismiss"
            className="p-2 text-[#6A6A80] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns the user's stored consent choice (for gating analytics scripts). */
export function getConsentChoice(): ConsentChoice {
  return getStoredConsent()?.choice ?? null;
}

export default CookieConsent;
