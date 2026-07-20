/**
 * Instrument Color System — 9 colors as CSS variables + Tailwind tokens
 * Phase 1 (T-101)
 * 
 * Provisional palette — Kevin to approve final colors.
 */

export const INSTRUMENT_COLORS = {
  quest:   { main: '#2563EB', light: '#DBEAFE', dark: '#1E40AF', name: 'Blue' },
  drive:   { main: '#DC2626', light: '#FEE2E2', dark: '#991B1B', name: 'Red' },
  impact:  { main: '#7C3AED', light: '#EDE9FE', dark: '#5B21B6', name: 'Violet' },
  prism:   { main: '#F59E0B', light: '#FEF3C7', dark: '#B45309', name: 'Amber' },
  bridge:  { main: '#059669', light: '#D1FAE5', dark: '#047857', name: 'Emerald' },
  mosaic:  { main: '#0891B2', light: '#CFFAFE', dark: '#0E7490', name: 'Cyan' },
  forge:   { main: '#EA580C', light: '#FFF7ED', dark: '#C2410C', name: 'Orange' },
  spark:   { main: '#8B5CF6', light: '#F3E8FF', dark: '#6D28D9', name: 'Purple' },
  shift:   { main: '#475569', light: '#F1F5F9', dark: '#1E293B', name: 'Slate' },
} as const;

export type InstrumentColorKey = keyof typeof INSTRUMENT_COLORS;

export function getInstrumentColorCSS(instrument: string): { color: string; bg: string; border: string } {
  const colors = INSTRUMENT_COLORS[instrument as InstrumentColorKey] ?? INSTRUMENT_COLORS.shift;
  return {
    color: colors.main,
    bg: colors.light,
    border: colors.main,
  };
}

/**
 * CSS custom properties to inject into :root or component scope.
 */
export function getInstrumentCSSVars(instrument: string): Record<string, string> {
  const colors = INSTRUMENT_COLORS[instrument as InstrumentColorKey] ?? INSTRUMENT_COLORS.shift;
  return {
    '--instrument-color': colors.main,
    '--instrument-color-light': colors.light,
    '--instrument-color-dark': colors.dark,
  };
}
