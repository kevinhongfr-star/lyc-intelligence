/**
 * LYC Branded Animated SVG Icons
 * Ported from corporate site lyc-partners.ai — pure CSS keyframe animations on SVGs
 * Each icon has its own branded animation identity
 */
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

const defaultColor = 'currentColor';

/* ── Bridge — lines drawing together ── */
export function IconBridge({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-bridge ${className}`}>
      <path d="M4 20L12 4L20 20" />
      <path d="M8 14H16" />
    </svg>
  );
}

/* ── Leap — upward bounce ── */
export function IconLeap({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-leap ${className}`}>
      <path d="M12 20V4" />
      <path d="M5 11L12 4L19 11" />
    </svg>
  );
}

/* ── Trident — pulsing three-prong ── */
export function IconTrident({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-trident ${className}`}>
      <path d="M12 20V8" />
      <path d="M6 4V8C6 10.2 8.7 12 12 12C15.3 12 18 10.2 18 8V4" />
      <path d="M12 4V12" />
    </svg>
  );
}

/* ── Quest — compass spin ── */
export function IconQuest({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-quest ${className}`}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3L14 10L12 12L10 10L12 3Z" fill={color} opacity="0.3" />
      <path d="M12 21L10 14L12 12L14 14L12 21Z" fill={color} opacity="0.15" />
    </svg>
  );
}

/* ── Drive — forward thrust ── */
export function IconDrive({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-drive ${className}`}>
      <path d="M5 12H19" />
      <path d="M13 6L19 12L13 18" />
    </svg>
  );
}

/* ── Coach — breath/wind ── */
export function IconCoach({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-coach ${className}`}>
      <path d="M4 8C4 8 7 6 12 6C17 6 20 8 20 8" />
      <path d="M4 12C4 12 7 10 12 10C17 10 20 12 20 12" />
      <path d="M4 16C4 16 7 14 12 14C17 14 20 16 20 16" />
    </svg>
  );
}

/* ── Impact — ripple outward ── */
export function IconImpact({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-impact ${className}`}>
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.3" />
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="10" opacity="0.5" />
    </svg>
  );
}

/* ── Prism — light scatter ── */
export function IconPrism({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-prism ${className}`}>
      <path d="M12 3L22 20H2L12 3Z" />
      <line x1="7" y1="15" x2="17" y2="15" opacity="0.5" />
    </svg>
  );
}

/* ── Forge — hammer strike ── */
export function IconForge({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-forge ${className}`}>
      <path d="M14 4L20 10" />
      <path d="M4 20L10 14" />
      <path d="M14 10L10 14" />
    </svg>
  );
}

/* ── Spark — flash ── */
export function IconSpark({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-spark ${className}`}>
      <path d="M12 2V8" />
      <path d="M12 16V22" />
      <path d="M4.93 4.93L8.46 8.46" />
      <path d="M15.54 15.54L19.07 19.07" />
      <path d="M2 12H8" />
      <path d="M16 12H22" />
      <path d="M4.93 19.07L8.46 15.54" />
      <path d="M15.54 8.46L19.07 4.93" />
    </svg>
  );
}

/* ── Mosaic — tiles shifting ── */
export function IconMosaic({ size = 24, className = '', color = defaultColor }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={`anim-mosaic ${className}`}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
