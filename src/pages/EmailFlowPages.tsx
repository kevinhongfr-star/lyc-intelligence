import React from 'react';
import { V1 } from '@/styles/v1-tokens';

const DOT_KEYFRAMES = `
  @keyframes emailflow-dot-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-3px); }
  }
`;

const DOT_BASE: React.CSSProperties = {
  display: 'inline-block',
  width: 4,
  height: 4,
  backgroundColor: V1.teal600,
  borderRadius: 0,
  verticalAlign: 'middle',
};

export interface EmailFlowPageProps {
  eyebrow: string;
  eyebrowColor: string;
  eyebrowBorderColor: string;
  title: string;
  body: string;
  ctaLabel: string;
  onCtaClick?: () => void;
  statusLine?: React.ReactNode;
}

const CTA_STYLE: React.CSSProperties = {
  width: '100%',
  fontFamily: V1.monoFont,
  fontSize: '0.7rem',
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
};

const BACK_LINK_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: V1.bodyFont,
  fontSize: 13,
  color: V1.ink500,
  lineHeight: V1.leadingBody,
  textAlign: 'center' as const,
  marginTop: 16,
  textDecoration: 'none',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
};

export function EmailFlowPageBase({
  eyebrow,
  eyebrowColor,
  eyebrowBorderColor,
  title,
  body,
  ctaLabel,
  onCtaClick,
  statusLine,
}: EmailFlowPageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: V1.cream,
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 18,
              fontWeight: V1.fwSemibold,
              color: V1.teal700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            NEXUS
          </div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: V1.textMonoPx,
              color: V1.ink500,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            leadership clarity
          </div>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 420,
            minWidth: 320,
            border: `1px solid ${V1.border}`,
            backgroundColor: V1.white,
            padding: 32,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: eyebrowColor,
              paddingBottom: 8,
              borderBottom: `1px solid ${eyebrowColor}`,
              marginBottom: 16,
              lineHeight: V1.leadingLabel,
              fontWeight: V1.fwMedium,
            }}
          >
            {eyebrow}
          </div>

          <h1
            style={{
              fontFamily: V1.displayFont,
              fontSize: 32,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: V1.ink900,
              fontWeight: V1.fwSemibold,
              margin: 0,
              marginBottom: 12,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 15,
              lineHeight: 1.6,
              color: V1.ink600,
              margin: 0,
              marginBottom: 24,
            }}
          >
            {body}
          </p>

          {statusLine}

          <button type="button" style={CTA_STYLE} onClick={onCtaClick}>
            {ctaLabel}
          </button>

          <button
            type="button"
            style={BACK_LINK_STYLE}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = V1.teal600;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = V1.ink500;
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmailVerificationConfirmedPage() {
  return (
    <EmailFlowPageBase
      eyebrow="Email verified"
      eyebrowColor={V1.teal600}
      eyebrowBorderColor={V1.teal600}
      title="Your email is confirmed"
      body="You can now sign in and start using NEXUS."
      ctaLabel="Go to NEXUS →"
    />
  );
}

export function PasswordResetConfirmedPage() {
  return (
    <EmailFlowPageBase
      eyebrow="Password updated"
      eyebrowColor={V1.teal600}
      eyebrowBorderColor={V1.teal600}
      title="Your password has been updated"
      body="Sign in with your new password to continue."
      ctaLabel="Sign in →"
    />
  );
}

export function PasswordExpiredPage() {
  return (
    <EmailFlowPageBase
      eyebrow="Action required"
      eyebrowColor={V1.fuchsia600}
      eyebrowBorderColor={V1.fuchsia600}
      title="Your password has expired"
      body="For your security, please set a new password to continue."
      ctaLabel="Reset password →"
    />
  );
}

export function MagicLinkLandingPage() {
  const statusLine = (
    <div style={{ marginBottom: 24 }}>
      <style>{DOT_KEYFRAMES}</style>
      <span
        style={{
          fontFamily: V1.monoFont,
          fontSize: V1.textMonoPx,
          color: V1.ink700,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          lineHeight: V1.leadingLabel,
        }}
      >
        Redirecting
        <span aria-hidden="true">
          <span
            style={{
              ...DOT_BASE,
              marginLeft: 2,
              animation: 'emailflow-dot-bounce 1s infinite ease-in-out',
              animationDelay: '0s',
            }}
          />
          <span
            style={{
              ...DOT_BASE,
              marginLeft: 2,
              animation: 'emailflow-dot-bounce 1s infinite ease-in-out',
              animationDelay: '0.15s',
            }}
          />
          <span
            style={{
              ...DOT_BASE,
              marginLeft: 2,
              animation: 'emailflow-dot-bounce 1s infinite ease-in-out',
              animationDelay: '0.3s',
            }}
          />
        </span>
      </span>
    </div>
  );

  return (
    <EmailFlowPageBase
      eyebrow="Signing you in"
      eyebrowColor={V1.teal600}
      eyebrowBorderColor={V1.teal600}
      title="Your sign-in link is ready"
      body="You'll be redirected in a moment."
      ctaLabel="Open NEXUS →"
      statusLine={statusLine}
    />
  );
}
