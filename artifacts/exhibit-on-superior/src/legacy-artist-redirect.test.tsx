// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import App from './App';

afterEach(() => cleanup());

/**
 * The Artist-in-Residence page was removed from the site. Its old URLs must
 * not dead-end in a 404 — the SPA router must redirect them to the homepage.
 * (Non-JS crawlers are handled by generated redirect stubs plus artifact.toml
 * rewrites from the shared legacyRedirects.ts source of truth.)
 */
describe('legacy Artist-in-Residence URLs redirect to the homepage', () => {
  const legacyPaths = [
    '/artist-in-residence',
    '/artist-in-residence/',
    '/apartments/il/chicago/artist-in-residence',
    '/apartments/il/chicago/artist-in-residence/',
  ];

  for (const path of legacyPaths) {
    it(`${path} resolves to /`, async () => {
      const { hook, history } = memoryLocation({ path, record: true });
      render(
        <Router hook={hook}>
          <App />
        </Router>,
      );
      await waitFor(() => expect(history[history.length - 1]).toBe('/'));
    });
  }
});
