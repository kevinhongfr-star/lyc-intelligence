import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

interface EmailCaptureProps {
  onCapture: (email: string) => void;
}

export function EmailCapture({ onCapture }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [capturing, setCapturing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setCapturing(true);
    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'nexus_chat' })
      });
      onCapture(email);
    } catch (e) {
      console.error('Failed to capture lead:', e);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div style={{
      alignSelf: 'center',
      width: '100%',
      maxWidth: '400px',
      background: DS.card,
      border: `1px solid ${DS.cardBorder}`,
      borderRadius: '0px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{
        fontFamily: DS.headingFont,
        fontSize: '16px',
        fontWeight: 600,
        color: DS.text,
        marginBottom: '8px'
      }}>
        Save our conversation
      </h3>
      <p style={{
        fontSize: '13px',
        color: DS.muted,
        marginBottom: '16px'
      }}>
        Enter your email to get your full leadership report and continue our chat.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: DS.bg,
            border: `1px solid ${DS.cardBorder}`,
            borderRadius: '0px',
            color: DS.text,
            fontSize: '14px',
            outline: 'none',
            minHeight: '44px'
          }}
        />
        <button
          type="submit"
          disabled={capturing || !email}
          style={{
            padding: '12px 20px',
            background: DS.accent,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '0px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: (capturing || !email) ? 'not-allowed' : 'pointer',
            opacity: (capturing || !email) ? 0.5 : 1,
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {capturing ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              ...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>
    </div>
  );
}
