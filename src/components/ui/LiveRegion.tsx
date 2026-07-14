import React, { useState, useEffect } from 'react';

interface LiveRegionProps {
  message?: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function LiveRegion({ message = '', politeness = 'polite', atomic = true }: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    if (message) {
      setAnnouncement('');
      const timer = setTimeout(() => setAnnouncement(message), 50);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
}

let liveRegionInstance: { announce: (msg: string, politeness?: 'polite' | 'assertive') => void } | null = null;

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  if (typeof document === 'undefined') return;
  
  let region = document.getElementById('global-live-region') as HTMLDivElement | null;
  
  if (!region) {
    region = document.createElement('div');
    region.id = 'global-live-region';
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    region.className = 'sr-only';
    region.style.position = 'absolute';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.padding = '0';
    region.style.margin = '-1px';
    region.style.overflow = 'hidden';
    region.style.clip = 'rect(0, 0, 0, 0)';
    region.style.whiteSpace = 'nowrap';
    region.style.border = '0';
    document.body.appendChild(region);
  }
  
  region.textContent = '';
  setTimeout(() => {
    if (region) region.textContent = message;
  }, 50);
}

liveRegionInstance = { announce };

export const useAnnounce = () => {
  return { announce };
};
