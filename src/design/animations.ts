/**
 * #1372 — ECHO v1.2 Animation system.
 *
 * Single source of truth for motion timing, easings, and presets.
 * Brand rule: functional animations only, 120–350ms duration.
 * No decorative/flashy animations. No "bouncy" or playful curves.
 * Premium = smooth, restrained, purposeful.
 *
 * CSS counterparts live in src/index.css (echo-* keyframes).
 * Reduced-motion is respected globally via the @media (prefers-reduced-motion)
 * block in index.css which disables all animations.
 */

// ── Durations (ms) ───────────────────────────────────────────────────
export const DURATION = {
  fast: 120,      // micro-interactions: hover, tap, focus
  default: 200,   // standard transitions: color, opacity, border
  slow: 350,      // reveal/enter: scroll-triggered, modal open
} as const;

// ── Easings ──────────────────────────────────────────────────────────
export const EASING = {
  /** Default — decelerating, premium feel. Use for enter/reveal. */
  out: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Accelerating — use for exit/dismiss. */
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Symmetric — use for state toggles (expand/collapse). */
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Smooth deceleration for scroll reveals. */
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

// ── Transition presets (inline-style objects) ────────────────────────
/** Button/card hover — subtle scale + color shift. */
export const transitionHover: React.CSSProperties = {
  transition: `transform ${DURATION.fast}ms ${EASING.out}, background-color ${DURATION.default}ms ${EASING.out}, color ${DURATION.default}ms ${EASING.out}, border-color ${DURATION.default}ms ${EASING.out}, box-shadow ${DURATION.default}ms ${EASING.out}`,
};

/** Card lift on hover — subtle elevation. */
export const transitionLift: React.CSSProperties = {
  transition: `transform ${DURATION.fast}ms ${EASING.out}, box-shadow ${DURATION.default}ms ${EASING.out}`,
};

/** Link underline / color shift. */
export const transitionLink: React.CSSProperties = {
  transition: `color ${DURATION.fast}ms ${EASING.out}, border-color ${DURATION.fast}ms ${EASING.out}`,
};

/** Generic fade — for state changes, loading transitions. */
export const transitionFade: React.CSSProperties = {
  transition: `opacity ${DURATION.default}ms ${EASING.out}`,
};

// ── Hover handlers (for inline-styled elements) ──────────────────────
/** Apply a subtle scale-down on press (active state) for CTAs. */
export const ctaPressHandlers = {
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transition = `transform ${DURATION.fast}ms ${EASING.out}`;
    e.currentTarget.style.transform = 'scale(0.98)';
  },
  onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
};

// ── CSS class names (defined in index.css) ───────────────────────────
/** Scroll-reveal class — pair with initScrollReveal() from @/lib/utils. */
export const SCROLL_REVEAL_CLASS = 'reveal';

/** Standard animation utility classes (from index.css). */
export const ANIM_CLASS = {
  fadeInUp: 'echo-fade-in',
  slideInUp: 'echo-slide-in-up',
  spin: 'echo-spin',
} as const;

// ── Scroll reveal helper (re-export for convenience) ─────────────────
export { initScrollReveal } from '@/lib/utils';
