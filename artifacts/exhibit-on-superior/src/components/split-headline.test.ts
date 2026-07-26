// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { SplitHeadline } from './SplitHeadline';
import { Home } from '../pages/Home';

// vitest globals are off in this project, so testing-library's auto-cleanup
// doesn't run; track renders and unmount them ourselves.
let active: RenderResult | null = null;

function renderHeadline(props: Parameters<typeof SplitHeadline>[0]) {
  active = render(createElement(SplitHeadline, props));
  return active;
}

afterEach(() => {
  active?.unmount();
  active = null;
});

describe('SplitHeadline branded typography', () => {
  it('renders script + caps lines with the gold rule by default', () => {
    const { container } = renderHeadline({ script: 'Urban Bliss', caps: 'Just Outside Your Door' });
    const script = container.querySelector('.headline-script');
    const caps = container.querySelector('.headline-caps');
    expect(script?.textContent).toBe('Urban Bliss ');
    expect(caps?.textContent).toBe('Just Outside Your Door');
    expect(container.querySelector('.headline-rule')).not.toBeNull();
    // Light (default) palette: script uses foreground color, caps stays default.
    expect(script?.className).toContain('text-foreground');
    expect(caps?.className).not.toContain('text-white');
  });

  it('separates the script and caps lines with whitespace in extracted text', () => {
    // Crawlers/screen readers read the heading's flattened textContent; the
    // block spans must not run together ("Urban BlissJust Outside…").
    const { container } = renderHeadline({ script: 'Urban Bliss', caps: 'Just Outside Your Door' });
    const heading = container.querySelector('h2');
    expect(heading?.textContent).toContain('Urban Bliss Just Outside Your Door');
    // No lowercase-to-uppercase run-on across the span boundary.
    expect(heading?.textContent).not.toMatch(/[a-z][A-Z]/);
  });

  it('renders a caps-only headline without a script line', () => {
    const { container } = renderHeadline({ caps: 'Floor Plans' });
    expect(container.querySelector('.headline-script')).toBeNull();
    expect(container.querySelector('.headline-caps')?.textContent).toBe('Floor Plans');
    expect(container.querySelector('.headline-rule')).not.toBeNull();
  });

  it('omits the gold rule when underline is false', () => {
    const { container } = renderHeadline({ script: 'Hi', caps: 'There', underline: false });
    expect(container.querySelector('.headline-rule')).toBeNull();
  });

  it('uses white script and white caps on dark backgrounds (gold blends into hero photos)', () => {
    const { container } = renderHeadline({ script: 'Urban Bliss', caps: 'Downtown', dark: true });
    expect(container.querySelector('.headline-script')?.className).toContain('text-white');
    expect(container.querySelector('.headline-caps')?.className).toContain('text-white');
  });

  it('lets scriptClassName override the script color (hero-over-photo case)', () => {
    const { container } = renderHeadline({ script: 'Hero', caps: 'Line', scriptClassName: 'text-white' });
    const script = container.querySelector('.headline-script');
    expect(script?.className).toContain('text-white');
    expect(script?.className).not.toContain('text-foreground');
  });

  it('renders the requested heading element and centers the rule by default', () => {
    const { container } = renderHeadline({ script: 'S', caps: 'C', as: 'h1' });
    expect(container.querySelector('h1')).not.toBeNull();
    expect(container.querySelector('.headline-rule')?.className).toContain('mx-auto');
  });
});

describe('Home page headline regressions', () => {
  it('hero renders script + caps as an h1 with no gold rule', () => {
    active = render(createElement(Home));
    const { container } = active;

    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.querySelector('.headline-script')?.textContent).toBe('River North Chicago ');
    expect(h1?.querySelector('.headline-caps')?.textContent).toBe('Luxury Apartments');
    // Flattened text must not run together for crawlers/screen readers.
    expect(h1?.textContent).toContain('River North Chicago Luxury Apartments');
    // The home hero is the one headline that must NOT carry the gold rule.
    expect(h1?.querySelector('.headline-rule')).toBeNull();

    // Every other SplitHeadline on the page keeps its gold rule.
    const rules = container.querySelectorAll('.headline-rule');
    expect(rules.length).toBeGreaterThanOrEqual(3);
  });
});
