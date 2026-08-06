import { useEffect, useState } from 'react';
import { MOTION } from '@/styles/design-tokens';

export interface MotionConfig {
  reducedMotion: boolean;
  duration: typeof MOTION.duration;
  easing: typeof MOTION.easing;
  transitionClass: string;
}

export function useMotionConfig(): MotionConfig {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const transitionClass = reducedMotion ? 'transition-none' : 'transition-normal';

  return {
    reducedMotion,
    duration: MOTION.duration,
    easing: MOTION.easing,
    transitionClass,
  };
}
