import { useCallback, useEffect, useState } from 'react';
import { DENSITY_PRESETS, type DensityMode } from '@/styles/design-tokens';

const STORAGE_KEY = 'echo-density';
const DENSITY_ATTRIBUTE = 'data-density';

function getStoredDensity(): DensityMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'comfortable' || stored === 'regular' || stored === 'compact') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return 'regular';
}

function applyDensity(mode: DensityMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute(DENSITY_ATTRIBUTE, mode);

  const preset = DENSITY_PRESETS[mode];
  root.style.setProperty('--echo-density-padding-compact', preset.padding.compact);
  root.style.setProperty('--echo-density-padding-regular', preset.padding.regular);
  root.style.setProperty('--echo-density-padding-spacious', preset.padding.spacious);
  root.style.setProperty('--echo-density-line-height', String(preset.lineHeight));
  root.style.setProperty('--echo-density-icon-sm', preset.iconSize.sm);
  root.style.setProperty('--echo-density-icon-md', preset.iconSize.md);
  root.style.setProperty('--echo-density-icon-lg', preset.iconSize.lg);
}

function storeDensity(mode: DensityMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Best-effort
  }
}

export interface UseDensityReturn {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  cycleDensity: () => void;
  preset: (typeof DENSITY_PRESETS)[DensityMode];
}

export function useDensity(): UseDensityReturn {
  const [density, setDensityState] = useState<DensityMode>(getStoredDensity);

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityState(mode);
    storeDensity(mode);
  }, []);

  const cycleDensity = useCallback(() => {
    const modes: DensityMode[] = ['comfortable', 'regular', 'compact'];
    const idx = modes.indexOf(density);
    const next = modes[(idx + 1) % modes.length];
    setDensity(next);
  }, [density, setDensity]);

  return {
    density,
    setDensity,
    cycleDensity,
    preset: DENSITY_PRESETS[density],
  };
}
