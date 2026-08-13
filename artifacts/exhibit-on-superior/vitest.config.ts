import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror the `@` -> `src` alias from tsconfig/vite so component tests can
    // import sources (e.g. ui/dialog.tsx) that use it.
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  // Component tests import React page (.tsx) sources, which rely on the
  // automatic JSX runtime; esbuild defaults to the classic runtime (needs a
  // React global), so opt into automatic here to match the app's build.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    testTimeout: 15000,
  },
});
