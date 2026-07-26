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
    expect(script?.textContent).toBe('Urban Bliss');
    expect(caps?.textContent).toBe('Just Outside Your Door');
    expect(container.querySelector('.headline-rule')).not.toBeNull();
    // Light (default) palette: script uses foreground color, caps stays default.
    expect(script?.className).toContain('text-foreground');
    expect(caps?.className).not.toContain('text-white');
  });

  it('keeps the decorative script line OUTSIDE the heading element', () => {
    // The script flourish must not pollute the accessible/SEO heading text
    // ("Urban Bliss Just Outside Your Door" run-ons in the a11y tree/SERPs).
    const { container } = renderHeadline({ script: 'Urban Bliss', caps: 'Just Outside Your Door' });
    const heading = container.querySelector('h2');
    expect(heading?.textContent).toBe('Just Outside Your Door');
    expect(heading?.querySelector('.headline-script')).toBeNull();
    // The script line renders as a plain sibling paragraph before the heading.
    const script = container.querySelector('p.headline-script');
    expect(script?.textContent).toBe('Urban Bliss');
  });

  it('renders a caps-only headline without a script line', () => {
    const { container } = renderHeadline({ caps: 'Floor Plans' });
    expect(container.querySelector('.headline-script')).toBeNull();
    expect(container.querySelector('.headline-caps')?.textContent).toBe('Floor Plans');
    expect(container.querySelector('.headline-rule')).not.toBeNull();
  });

  it('renders a script-only flourish without any heading element', () => {
    const { container } = renderHeadline({ script: 'Just a Flourish', underline: false });
    expect(container.querySelector('.headline-script')?.textContent).toBe('Just a Flourish');
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
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
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('C');
    expect(container.querySelector('.headline-rule')?.className).toContain('mx-auto');
  });
});

describe('Home page headline regressions', () => {
  it('hero renders a clean caps-only h1 with the script flourish outside it and no gold rule', () => {
    active = render(createElement(Home));
    const { container } = active;

    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    // The accessible/SEO page title is the caps line only.
    expect(h1?.textContent).toBe('Luxury Apartments');
    expect(h1?.querySelector('.headline-script')).toBeNull();
    // The script flourish still renders, as a decorative sibling.
    expect(container.querySelector('.headline-script')?.textContent).toBe('River North Chicago');
    // The home hero is the one headline that must NOT carry the gold rule.
    expect(h1?.closest('div')?.querySelector('.headline-rule')).toBeNull();

    // Every other SplitHeadline on the page keeps its gold rule.
    const rules = container.querySelectorAll('.headline-rule');
    expect(rules.length).toBeGreaterThanOrEqual(3);
  });
});
