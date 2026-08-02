import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADII,
  SHADOWS,
  BREAKPOINTS,
  Z_INDEX,
  TRANSITIONS,
} from './tokens';

export * from './tokens';

export interface DesignSystem {
  colors: typeof COLORS;
  spacing: typeof SPACING;
  typography: typeof TYPOGRAPHY;
  radii: typeof RADII;
  shadows: typeof SHADOWS;
  breakpoints: typeof BREAKPOINTS;
  zIndex: typeof Z_INDEX;
  transitions: typeof TRANSITIONS;
}

export const designSystem: DesignSystem = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  radii: RADII,
  shadows: SHADOWS,
  breakpoints: BREAKPOINTS,
  zIndex: Z_INDEX,
  transitions: TRANSITIONS,
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function flattenEntries(
  prefix: string,
  obj: Record<string, unknown>,
  out: Array<[string, string]>
): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}-${k}` : k;
    if (isPlainObject(v)) {
      flattenEntries(key, v, out);
    } else if (typeof v === 'string' || typeof v === 'number') {
      out.push([key, String(v)]);
    }
  }
}

export const generateCSSVariables = (): Record<string, string> => {
  const variables: Record<string, string> = {};
  const colorEntries: Array<[string, string]> = [];
  flattenEntries('color', COLORS as unknown as Record<string, unknown>, colorEntries);
  colorEntries.forEach(([k, v]) => {
    variables[`--${k}`] = v;
  });

  Object.entries(SPACING).forEach(([key, value]) => {
    variables[`--space-${key}`] = `${value}px`;
  });

  Object.entries(TYPOGRAPHY.fontSize).forEach(([key, value]) => {
    variables[`--font-size-${key}`] = `${value}px`;
  });

  Object.entries(RADII).forEach(([key, value]) => {
    variables[`--radius-${key}`] = `${value}px`;
  });

  Object.entries(SHADOWS).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value;
  });

  return variables;
};
