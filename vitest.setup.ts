/**
 * Vitest global setup — runs before every test file.
 *
 * - Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
 * - Resets fetch mocks + DOM between tests
 * - Stubs matchMedia / IntersectionObserver (not implemented in happy-dom)
 *
 * DOM-touching code is guarded so this file is also safe for test files that
 * opt into the `node` environment (e.g. server-side API tests) where
 * `window` / `document` are not defined.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

// Reset DOM + mocks after each test for isolation
afterEach(() => {
  if (hasDocument) {
    document.body.innerHTML = '';
  }
  vi.restoreAllMocks();
});

beforeEach(() => {
  if (!hasWindow) return;

  // happy-dom does not implement matchMedia — stub it for components that
  // query prefers-color-scheme / reduced-motion on mount.
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // IntersectionObserver stub (used by reveal-on-scroll utilities)
  if (!('IntersectionObserver' in window)) {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      MockIntersectionObserver;
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      MockIntersectionObserver;
  }
});
