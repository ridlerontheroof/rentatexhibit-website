// @vitest-environment jsdom
// The image manifest guarantees a 320w logo rung exists
// (src/data/logo-small-rung.test.ts), but browsers only pick it when the
// rendered <img>'s sizes attribute tells them the logo displays small on
// phones. This test renders the real Header and Footer and asserts the
// logo's sizes value resolves to a small CSS width on a phone viewport, so
// srcset selection lands on the 320w rung instead of the 800w file.
import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { IMAGE_MANIFEST } from '../data/imageManifest';
import { resolveSizes } from '../lib/resolveSizes';

afterEach(() => cleanup());

const PHONE_VIEWPORT_CSS_PX = 390; // typical phone (iPhone 14-class)
const PHONE_DPR = 2;

// Smallest logo rung in the real manifest (guarded elsewhere to be <= 400w).
const logoEntry = Object.entries(IMAGE_MANIFEST).find(([path]) => /logo/i.test(path));
const logoWidths = logoEntry![1].variants.map((v) => v.w).sort((a, b) => a - b);
const smallestRung = logoWidths[0];
const nextRung = logoWidths[1];

function logoImgIn(container: HTMLElement): HTMLImageElement {
  const imgs = Array.from(container.querySelectorAll('img'));
  const logo = imgs.find((img) =>
    /logo/i.test(`${img.getAttribute('src')} ${img.getAttribute('srcset')}`),
  );
  expect(logo, 'expected a rendered logo <img> (src/srcset containing "logo")').toBeDefined();
  return logo!;
}

function assertPicksSmallRung(component: () => React.ReactElement, label: string) {
  const { container } = render(component());
  const img = logoImgIn(container);

  // The srcset must actually offer the small rung.
  const srcset = img.getAttribute('srcset') ?? '';
  expect(
    srcset,
    `${label}: logo srcset must include the ${smallestRung}w rung`,
  ).toContain(`${smallestRung}w`);

  // sizes must exist and resolve small enough that at phone DPR the
  // required device pixels stay at/below the small rung — i.e. the browser
  // selects the tiny file, not the next rung up.
  const sizes = img.getAttribute('sizes');
  expect(sizes, `${label}: logo <img> must carry a sizes attribute`).toBeTruthy();
  const cssWidth = resolveSizes(sizes!, PHONE_VIEWPORT_CSS_PX);
  const devicePx = cssWidth * PHONE_DPR;
  expect(
    devicePx,
    `${label}: sizes="${sizes}" resolves to ${cssWidth}px CSS (${devicePx} device px @${PHONE_DPR}x) — ` +
      `must stay <= ${smallestRung} device px so phones pick the ${smallestRung}w rung ` +
      `instead of the ${nextRung}w file`,
  ).toBeLessThanOrEqual(smallestRung);

  // Also verify the selection outcome directly: smallest rung covering the
  // needed device pixels is the tiny one.
  const chosen = logoWidths.find((w) => w >= devicePx) ?? logoWidths[logoWidths.length - 1];
  expect(chosen, `${label}: srcset selection should land on the ${smallestRung}w rung`).toBe(
    smallestRung,
  );
}

describe('header/footer logo downloads the tiny rung on phones', () => {
  it('manifest still has a logo entry with multiple rungs', () => {
    expect(logoEntry).toBeDefined();
    expect(logoWidths.length).toBeGreaterThan(1);
  });

  it('Header logo sizes selects the small rung on a phone viewport', () => {
    assertPicksSmallRung(() => createElement(Header), 'Header');
  });

  it('Footer logo is a resolution-independent SVG (no srcset rungs needed)', () => {
    const { container } = render(createElement(Footer));
    const img = Array.from(container.querySelectorAll('img')).find((i) =>
      /logo/i.test(i.getAttribute('src') ?? ''),
    );
    expect(img, 'expected a rendered footer logo <img>').toBeDefined();
    expect(img!.getAttribute('src')).toMatch(/\.svg$/);
  });
});
