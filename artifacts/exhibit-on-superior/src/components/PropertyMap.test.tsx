// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PropertyMap } from './PropertyMap';

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
