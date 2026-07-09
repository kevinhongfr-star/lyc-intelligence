import React from 'react';
import { Link } from 'react-router-dom';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  bgDark: '#0d0a14',
  border: '#3a2040',
  text: '#FFFFFF',
  muted: '#9CA3AF',
};

export function MinimalFooter() {
  return (
    <footer
      style={{
        background: DS.bgDark,
        borderTop: `1px solid ${DS.border}`,
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: '14px',
            fontWeight: 700,
            color: DS.text,
          }}
        >
          LYC Intelligence
        </div>
        <nav
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: DS.muted,
              textDecoration: 'none',
            }}
          >
            Home
          </Link>
          <Link
            to="/pricing"
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: DS.muted,
              textDecoration: 'none',
            }}
          >
            Pricing
          </Link>
          <Link
            to="/nexus"
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: DS.muted,
              textDecoration: 'none',
            }}
          >
            Nexus
          </Link>
        </nav>
        <div
          style={{
            fontFamily: DS.bodyFont,
            fontSize: '11px',
            color: DS.muted,
          }}
        >
          © 2026 LYC Partners
        </div>
      </div>
    </footer>
  );
}
