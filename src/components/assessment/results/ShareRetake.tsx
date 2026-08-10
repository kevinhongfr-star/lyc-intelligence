import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Share2, Check } from 'lucide-react';
import {
  INK, G200, G400, G600, WHITE,
  monoStyle, containerStyle,
} from '../landing/shared';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

export function ShareRetake({ config }: Props) {
  const { assessmentName, accent, retakePath } = config;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${assessmentName} Results`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled or clipboard unavailable — non-blocking
    }
  };

  return (
    <section style={{ padding: '80px 0', borderTop: `1px solid ${G200}` }}>
      <div style={containerStyle}>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Link to={retakePath} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px',
            border: `1px solid ${G200}`,
            background: WHITE,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 14, fontWeight: 500, color: INK,
            textDecoration: 'none', cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
            minHeight: 44,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = G200; e.currentTarget.style.color = INK; }}>
            <RotateCcw style={{ width: 16, height: 16 }} /> Retake assessment
          </Link>

          <button onClick={handleShare} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px',
            border: `1px solid ${G200}`,
            background: WHITE,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 14, fontWeight: 500, color: INK,
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
            minHeight: 44,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = G200; e.currentTarget.style.color = INK; }}>
            {copied ? (
              <><Check style={{ width: 16, height: 16, color: '#2D7A3E' }} /> Link copied</>
            ) : (
              <><Share2 style={{ width: 16, height: 16 }} /> Share results</>
            )}
          </button>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 24,
          fontSize: 13, color: G400,
        }}>
          Your results are saved to your profile and synced with NEXUS.
        </p>
      </div>
    </section>
  );
}
