// Shims for Next.js modules used by PWA components (portals use react-router-dom, but PWA views were drafted with Next primitives)

declare module 'next/link' {
  import * as React from 'react';
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string;
    children?: React.ReactNode;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (href: string, options?: { scroll?: boolean }) => void;
    replace: (href: string, options?: { scroll?: boolean }) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (href: string) => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams(): Record<string, string | string[]>;
}

// PWA install prompt event (added to Window in Chromium)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface Window {
  BeforeInstallPromptEvent?: typeof BeforeInstallPromptEvent;
  beforeinstallprompt?: BeforeInstallPromptEvent;
}
