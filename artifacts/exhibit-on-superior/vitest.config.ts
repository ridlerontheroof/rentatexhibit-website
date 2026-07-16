import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Component tests import React page (.tsx) sources, which rely on the
  // automatic JSX runtime; esbuild defaults to the classic runtime (needs a
  // React global), so opt into automatic here to match the app's build.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
