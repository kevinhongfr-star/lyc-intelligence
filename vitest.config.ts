/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest configuration for Phase 3 hook + component tests.
 *
 * - Uses happy-dom (lighter than jsdom) for the test environment
 * - Sets up the `@/*` alias so tests can import source modules verbatim
 * - Loads setup files for @testing-library/jest-dom matchers + global mocks
 *
 * Run with:  npx vitest run
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', 'dist', 'tests/integration'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/hooks/v1/**', 'src/components/ui/**'],
    },
  },
});
