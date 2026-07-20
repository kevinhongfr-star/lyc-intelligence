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

export const generateCSSVariables = (): Record<string, string> => {
  const variables: Record<string, string> = {};
  
  Object.entries(COLORS).forEach(([key, value]) => {
    variables[`--color-${key}`] = value;
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