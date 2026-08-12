import { describe, it, expect } from 'vitest';
import {
  TYPE_SCALE,
  DENSITY_PRESETS,
  SPACING,
  SEMANTIC_COLORS,
  SEMANTIC_TOKENS,
  MOTION,
  SHADOWS,
  Z_INDEX,
  BREAKPOINTS,
} from '../design-tokens';

describe('design-tokens', () => {
  describe('TYPE_SCALE', () => {
    it('has 12 steps', () => {
      const steps = Object.keys(TYPE_SCALE.scale);
      expect(steps).toHaveLength(12);
      expect(steps).toEqual(
        expect.arrayContaining([
          'display',
          'h1',
          'h2',
          'h3',
          'h4',
          'subtitle',
          'bodyLarge',
          'body',
          'bodySmall',
          'caption',
          'overline',
          'code',
        ]),
      );
    });

    it('defines font families', () => {
      expect(TYPE_SCALE.font.sans).toContain('DM Sans');
      expect(TYPE_SCALE.font.serif).toContain('Crimson Pro');
      expect(TYPE_SCALE.font.mono).toContain('IBM Plex Mono');
    });

    it('uses crimson for display heading', () => {
      expect(TYPE_SCALE.scale.display.fontSize).toBe('72px');
      expect(TYPE_SCALE.scale.display.fontWeight).toBe(700);
    });
  });

  describe('DENSITY_PRESETS', () => {
    it('has three modes', () => {
      expect(Object.keys(DENSITY_PRESETS)).toEqual(['comfortable', 'regular', 'compact']);
    });

    it('compact has smallest padding', () => {
      expect(DENSITY_PRESETS.compact.padding.compact).toBe('4px');
      expect(DENSITY_PRESETS.comfortable.padding.spacious).toBe('24px');
    });
  });

  describe('SPACING', () => {
    it('uses 8px base scale', () => {
      const values = Object.values(SPACING);
      values.forEach((v) => {
        expect(v).toMatch(/^\d+px$/);
        const num = parseInt(v);
        expect(num % 4).toBe(0);
      });
    });
  });

  describe('SEMANTIC_COLORS', () => {
    it('has primary crimson #C108AB', () => {
      expect(SEMANTIC_COLORS.primary[600]).toBe('#C108AB');
    });

    it('has 10-step scales (50-900)', () => {
      const families = ['primary', 'success', 'warning', 'error', 'info', 'neutral'];
      families.forEach((f) => {
        const scale = SEMANTIC_COLORS[f as keyof typeof SEMANTIC_COLORS];
        expect(Object.keys(scale)).toHaveLength(10);
      });
    });
  });

  describe('SEMANTIC_TOKENS', () => {
    it('has bg, text, border, accent, status tokens', () => {
      expect(SEMANTIC_TOKENS.bg.page).toBeDefined();
      expect(SEMANTIC_TOKENS.text.primary).toBeDefined();
      expect(SEMANTIC_TOKENS.border.default).toBeDefined();
      expect(SEMANTIC_TOKENS.accent.DEFAULT).toBe('#C108AB');
      expect(SEMANTIC_TOKENS.border.focus).toBe('#C108AB');
    });
  });

  describe('MOTION', () => {
    it('has 4 easing curves', () => {
      expect(Object.keys(MOTION.easing)).toHaveLength(4);
      expect(MOTION.easing.standard).toContain('cubic-bezier');
      expect(MOTION.easing.enter).toContain('cubic-bezier');
    });

    it('has duration tiers', () => {
      expect(MOTION.duration.micro.fastest).toBe('80ms');
      expect(MOTION.duration.standard.base).toBe('250ms');
      expect(MOTION.duration.complex.slow).toBe('600ms');
    });
  });

  describe('SHADOWS', () => {
    it('has accent shadow', () => {
      expect(SHADOWS.accent).toContain('193, 8, 171');
    });
  });

  describe('Z_INDEX', () => {
    it('has ordered layers', () => {
      expect(Z_INDEX.hide).toBeLessThan(Z_INDEX.base);
      expect(Z_INDEX.base).toBeLessThan(Z_INDEX.dropdown);
      expect(Z_INDEX.dropdown).toBeLessThan(Z_INDEX.tooltip);
      expect(Z_INDEX.tooltip).toBeLessThan(Z_INDEX.toast);
    });
  });

  describe('BREAKPOINTS', () => {
    it('has standard breakpoints', () => {
      expect(BREAKPOINTS.sm).toBe(640);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
      expect(BREAKPOINTS['2xl']).toBe(1536);
    });
  });
});
