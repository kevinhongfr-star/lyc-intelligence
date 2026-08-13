import React, { useEffect, useState, useCallback } from 'react';

// ── DESIGN TOKENS ──────────────────────────────────────────────────
export const INK = '#0F1115';
export const OFF = '#F5F5F3';
export const G100 = '#FAFAFA';
export const G200 = '#E8E8E5';
export const G300 = '#D4D4D1';
export const G400 = '#9CA3AF';
export const G600 = '#4B5563';
export const WHITE = '#FFFFFF';

// #1376 — ECHO brand spec v1.2. ONE accent (LYC fuchsia #C108AB), reserved for
// CTAs + key highlights only. Section eyebrows use light gray #9CA3AF.
export const BRAND_ACCENT = '#C108AB';
export const EYEBROW_GRAY = '#9CA3AF';

// #1376 — canonical category labels for the 6 assessments. Mirrors the subtitle
// system on the catalog page so every landing shows the same descriptive label
// regardless of which caller built the config (PrismLanding vs DiagnosticLandingPage).
export const ASSESSMENT_SUBTITLE: Record<string, string> = {
  PRISM: 'Career & Professional Branding',
  SPARK: 'AI Leadership Readiness',
  FORGE: 'Sales Excellence',
  BRIDGE: 'China Leadership Readiness',
  MOSAIC: 'Cultural Intelligence',
  DRIVE: 'Execution Capability',
};

export const monoStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 500,
};

export const containerStyle: React.CSSProperties = {
  maxWidth: 940,
  margin: '0 auto',
  padding: '0 32px',
};

export const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 28px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  border: `1px solid ${INK}`,
  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: 'pointer',
  minHeight: 44,
};

// ── ACCENT-COLORED BUTTONS (built dynamically per diagnostic) ──────
export function makeBtnPrimary(accent: string): React.CSSProperties {
  return { ...btnBase, background: accent, color: WHITE, borderColor: accent };
}
export function makeBtnSecondary(accent: string): React.CSSProperties {
  return { ...btnBase, background: 'transparent', color: INK, borderColor: INK };
}
export function makeSectionLabel(_accent: string): React.CSSProperties {
  // Phase 9 Batch 6 ticket #1355 — brand v1.2 spec: eyebrow/section labels use light gray #9CA3AF,
  // NOT the accent color. Accent is reserved for CTAs + interactive key highlights only.
  return { ...monoStyle, color: '#9CA3AF', marginBottom: 20, display: 'inline-block' };
}

// ── MOTION HOOKS ───────────────────────────────────────────────────

/**
 * M1 — Scroll Reveal: IntersectionObserver, 350ms cubic-bezier(0.16,1,0.3,1)
 * fadeUp 24px. Disabled on mobile (<=768px).
 * Uses a unique prefix to avoid class collisions when multiple instances mount.
 */
export function useScrollReveal(prefix: string) {
  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const revealClass = `${prefix}-reveal`;
    const visibleClass = `${prefix}-visible`;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll(`.${revealClass}`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [prefix]);
}

/**
 * M5 — CTA micro-compress: scale(0.98) on mousedown, 120ms.
 */
export const ctaCompressHandlers = {
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transition = 'transform 120ms cubic-bezier(0.4,0,0.2,1)';
    e.currentTarget.style.transform = 'scale(0.98)';
  },
  onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
};

/**
 * M2 — Card hover lift: translateY(-2px) + accent border, 200ms.
 */
export function makeCardHoverHandlers(accent: string) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = accent;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'transparent';
    },
  };
}

// ── SCROLL REVEAL STYLE TAG ────────────────────────────────────────
/** Injects the CSS for scroll-reveal classes for the given prefix. */
export function RevealStyles({ prefix }: { prefix: string }) {
  return React.createElement('style', null, `
      .${prefix}-reveal { opacity: 0; transform: translateY(24px); transition: opacity 350ms cubic-bezier(0.16,1,0.3,1), transform 350ms cubic-bezier(0.16,1,0.3,1); }
      .${prefix}-reveal.${prefix}-visible { opacity: 1; transform: translateY(0); }
      @media (max-width: 768px) { .${prefix}-reveal { opacity: 1; transform: none; transition: none; } }
    `);
}

// ── EXPANDABLE HOOK ────────────────────────────────────────────────
/** Toggle hook for expandable dimension cards. */
export function useExpandable() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  }, []);
  return { openIndex, toggle };
}

// ── CONFIG TYPES ───────────────────────────────────────────────────

export interface AssessmentLandingConfig {
  /** Diagnostic code, e.g. "PRISM" */
  code: string;
  /** Display name, e.g. "PRISM" */
  name: string;
  /** B2C tagline, e.g. "Career & Professional Branding" */
  tagline: string;
  /** Short marketing description for hero */
  heroDescription: string;
  /** Accent color (hex) */
  accent: string;
  /** CSS class prefix for scroll-reveal isolation */
  prefix: string;
  /** Primary CTA label */
  ctaLabel: string;
  /** Primary CTA link */
  ctaHref: string;
  /** Secondary CTA label (optional) */
  ctaSecondaryLabel?: string;
  /** Secondary CTA link (optional) */
  ctaSecondaryHref?: string;
  /** 5 dimensions from catalog */
  dimensions: Array<{
    id: string;
    name: string;
    description: string;
    lowLabel: string;
    highLabel: string;
  }>;
  /** 3-step "how it works" process */
  howItWorks: Array<{
    step: string;
    title: string;
    desc: string;
  }>;
  /** 2-3 persona cards */
  personas: Array<{
    title: string;
    desc: string;
  }>;
  /** Deliverables list */
  deliverables: Array<{
    title: string;
    desc: string;
  }>;
  /** Optional: sample result preview text */
  sampleResult?: string;
}
