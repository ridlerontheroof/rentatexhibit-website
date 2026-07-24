// @vitest-environment jsdom
// Rendered-DOM companion to smartimg-sizes.test.ts. The static scan skips
// SmartImg call sites whose sizes/className are dynamic JSX expressions, so a
// future dynamic call site could silently fall back to sizes="100vw" and make
// phones download full-viewport files for small renders. This test renders
// every routed page (plus Header/Footer) and inspects the *actual* sizes
// attribute each responsive <img> ends up with — dynamic expressions are fully
// resolved by render time, so nothing can dodge the guard.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { cleanup, render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routes } from '../routes';
import { Header } from './Header';
import { Footer } from './Footer';
import { resolveSizes } from '../lib/resolveSizes';

afterEach(() => cleanup());

const PHONE_VIEWPORT_CSS_PX = 390;
const DESKTOP_VIEWPORT_CSS_PX = 1440;
// Same thresholds as the static scan (smartimg-sizes.test.ts).
const SMALL_RENDER_PX = 400;
const TOLERANCE = 1.25;

beforeAll(() => {
  // jsdom lacks matchMedia / IntersectionObserver used by hooks and sliders.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

function renderWithProviders(Component: ComponentType) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });
  return render(
    createElement(
      HelmetProvider,
      null,
      createElement(QueryClientProvider, { client: queryClient }, createElement(Component)),
    ),
  );
}

/** Mirror of the static scan's inference, but over the *rendered* class attr. */
function inferFixedSmallWidth(img: HTMLImageElement): number | undefined {
  const className = img.getAttribute('class') ?? '';
  const widths: number[] = [];
  for (const m of className.matchAll(/(?:^|\s)w-(\d+)(?:\s|$)/g)) widths.push(Number(m[1]) * 4);
  for (const m of className.matchAll(/(?:^|\s)(?:max-)?w-\[(\d+(?:\.\d+)?)px\]/g))
    widths.push(Number(m[1]));
  if (/(?:^|\s)w-auto(?:\s|$)/.test(className)) {
    const h = className.match(/(?:^|\s)h-(\d+)(?:\s|$)/);
    const intrinsicW = Number(img.getAttribute('width'));
    const intrinsicH = Number(img.getAttribute('height'));
    if (h && intrinsicW > 0 && intrinsicH > 0)
      widths.push(Number(h[1]) * 4 * (intrinsicW / intrinsicH));
  }
  if (widths.length === 0) return undefined;
  const w = Math.min(...widths);
  return w <= SMALL_RENDER_PX ? w : undefined;
}

function describeImg(pageLabel: string, img: HTMLImageElement): string {
  const src = img.getAttribute('src') ?? '(no src)';
  return `${pageLabel}: <img src="${src}">`;
}

/** Collect human-readable violations for every responsive <img> on a page. */
function collectViolations(pageLabel: string, container: HTMLElement): string[] {
  const violations: string[] = [];
  const imgs = Array.from(container.querySelectorAll('img[srcset], img[srcSet]'));
  for (const el of imgs) {
    const img = el as HTMLImageElement;
    const sizes = img.getAttribute('sizes');
    const where = describeImg(pageLabel, img);
    if (!sizes || sizes.trim() === '') {
      violations.push(
        `${where} has a srcset but no sizes attribute, so the browser assumes 100vw ` +
          `and downloads a full-viewport-width file regardless of rendered size. ` +
          `Fix: make the call site pass a sizes value matching the rendered CSS width.`,
      );
      continue;
    }
    const smallWidth = inferFixedSmallWidth(img);
    if (smallWidth === undefined) continue; // fluid/large element — vw sizes are legit
    for (const viewport of [PHONE_VIEWPORT_CSS_PX, DESKTOP_VIEWPORT_CSS_PX]) {
      let claimed: number;
      try {
        claimed = resolveSizes(sizes, viewport);
      } catch {
        violations.push(`${where} carries an unparseable sizes="${sizes}".`);
        break;
      }
      if (claimed > smallWidth * TOLERANCE) {
        violations.push(
          `${where} renders in a fixed ~${Math.round(smallWidth)}px-wide box (from its class) ` +
            `but sizes="${sizes}" claims ${Math.round(claimed)}px at a ${viewport}px viewport, ` +
            `so browsers download a much larger file than needed. ` +
            `Fix: set sizes ≈ "${Math.round(smallWidth)}px" at the call site.`,
        );
        break;
      }
    }
  }
  return violations;
}

// Also verify the AVIF <source> elements agree — SmartImg mirrors sizes there.
function collectSourceViolations(pageLabel: string, container: HTMLElement): string[] {
  const violations: string[] = [];
  for (const source of Array.from(container.querySelectorAll('picture > source[srcset]'))) {
    const sizes = source.getAttribute('sizes');
    if (!sizes || sizes.trim() === '') {
      const srcset = source.getAttribute('srcset') ?? '';
      violations.push(
        `${pageLabel}: <source srcset="${srcset.slice(0, 60)}…"> has no sizes attribute.`,
      );
    }
  }
  return violations;
}

describe('every rendered responsive <img> carries an honest sizes attribute', () => {
  it('routes list is non-empty (guard is not silently scanning nothing)', () => {
    expect(routes.length).toBeGreaterThanOrEqual(10);
  });

  it('Header and Footer', () => {
    for (const [label, Comp] of [
      ['Header', Header],
      ['Footer', Footer],
    ] as const) {
      const { container } = renderWithProviders(Comp);
      const violations = [
        ...collectViolations(label, container),
        ...collectSourceViolations(label, container),
      ];
      expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
      cleanup();
    }
  });

  for (const route of routes) {
    it(`page ${route.path}`, async () => {
      const Component = await route.load();
      const { container } = renderWithProviders(Component);
      const violations = [
        ...collectViolations(`page ${route.path}`, container),
        ...collectSourceViolations(`page ${route.path}`, container),
      ];
      expect(violations, `\n${violations.join('\n\n')}\n`).toEqual([]);
    });
  }
});

describe('the rendered-DOM checker itself catches violations (self-test)', () => {
  it('flags a responsive img missing sizes', () => {
    const div = document.createElement('div');
    div.innerHTML = `<img src="/x.webp" srcset="/x-400.webp 400w, /x-800.webp 800w" class="w-full">`;
    expect(collectViolations('synthetic', div).join('\n')).toMatch(/no sizes attribute/);
  });

  it('flags a small fixed-width img claiming 100vw', () => {
    const div = document.createElement('div');
    div.innerHTML = `<img src="/x.webp" srcset="/x-400.webp 400w" sizes="100vw" class="w-[200px]">`;
    expect(collectViolations('synthetic', div).join('\n')).toMatch(/~200px-wide box/);
  });

  it('flags a w-auto img with intrinsic ratio claiming 100vw', () => {
    const div = document.createElement('div');
    div.innerHTML = `<img src="/x.webp" srcset="/x-400.webp 400w" sizes="100vw" class="h-12 w-auto" width="800" height="400">`;
    expect(collectViolations('synthetic', div).join('\n')).toMatch(/-wide box/);
  });

  it('accepts a fluid img with viewport sizes and a small img with honest px sizes', () => {
    const div = document.createElement('div');
    div.innerHTML =
      `<img src="/a.webp" srcset="/a-400.webp 400w" sizes="(min-width: 1024px) 25vw, 100vw" class="w-full">` +
      `<img src="/b.webp" srcset="/b-400.webp 400w" sizes="140px" class="w-[140px]">`;
    expect(collectViolations('synthetic', div)).toEqual([]);
  });
});
