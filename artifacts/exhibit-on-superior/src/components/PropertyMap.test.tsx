// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { PropertyMap } from './PropertyMap';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PropertyMap viewport-proximity gating', () => {
  it('loads nothing map-related until the container nears the viewport, then loads', () => {
    // Stub IntersectionObserver so the proximity gate is active (jsdom has
    // none, which normally short-circuits to "load immediately").
    let trigger: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    const observed: Element[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          trigger = cb;
        }
        observe(el: Element) {
          observed.push(el);
        }
        disconnect() {}
      },
    );

    const { container, unmount } = render(<PropertyMap />);
    // Before proximity: no iframe (and no Maps JS — no key in tests, and the
    // loader effect is likewise gated on the same nearViewport state).
    expect(container.querySelector('iframe')).toBeNull();
    expect(observed.length).toBe(1);

    // Scrolling the container near the viewport mounts the map embed.
    act(() => trigger!([{ isIntersecting: true }]));
    expect(container.querySelector('iframe')).not.toBeNull();
    unmount();
  });
});

describe('PropertyMap fallback', () => {
  it('renders the keyless place-query iframe when no browser Maps key is available', () => {
    // In the test environment the __GOOGLE_MAPS_BROWSER_KEY__ define is not
    // injected, so the component must degrade to the iframe embed instead of
    // rendering an empty map container or crashing.
    const { container, unmount } = render(<PropertyMap />);
    const iframe = container.querySelector(
      'iframe[title="Map of Exhibit On Superior"]',
    ) as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    expect(iframe!.src).toContain('maps.google.com/maps?q=');
    expect(iframe!.src).toContain('output=embed');
    // No JS-map container should be present in fallback mode.
    expect(
      container.querySelector('div[aria-label="Map of Exhibit On Superior"]'),
    ).toBeNull();
    unmount();
  });
});
