// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, type RenderResult } from '@testing-library/react';
import { createElement } from 'react';
import { UnitGalleryLightbox } from './UnitGalleryLightbox';
import { stubTransformAwareRects } from './lightbox-rect-stub';
import type { AvailableUnit } from '../../hooks/use-availability';

// ---------------------------------------------------------------------------
// Desktop zoom in the unit photo gallery lightbox — mirrors PlanLightbox:
//   - wheel / ctrl+wheel zooms toward the cursor (clamped to [1, 4]),
//   - click-and-drag pans while zoomed, rubber-banded then hard-clamped,
//   - +/−/0 keyboard zoom steps around the viewer centre.
// Harness mirrors plan-lightbox-dragpan.test.ts.
// ---------------------------------------------------------------------------

const VIEWER_W = 800;
const VIEWER_H = 600;
const CX = VIEWER_W / 2;
const CY = VIEWER_H / 2;

const unit: AvailableUnit = {
  unit: '0610',
  bedrooms: 0,
  bathrooms: 1,
  sqft: 478,
  rent: 2271,
  availableOn: '2026-10-01',
  photoUrl: 'https://images.cdn.appfolio.com/db/leads_marketing_photos/a/original.jpg',
  listingUrl: null,
  videoUrl: null,
  photos: [
    'https://images.cdn.appfolio.com/db/leads_marketing_photos/a/original.jpg',
    'https://images.cdn.appfolio.com/db/leads_marketing_photos/b/original.jpg',
  ],
  details: [],
  marketingTitle: null,
  description: null,
};

let view: RenderResult | null = null;

const sizeDescriptors: Array<{
  proto: object;
  prop: string;
  original: PropertyDescriptor | undefined;
}> = [];

function stubClientSize(proto: object, prop: string, value: number) {
  sizeDescriptors.push({
    proto,
    prop,
    original: Object.getOwnPropertyDescriptor(proto, prop),
  });
  Object.defineProperty(proto, prop, { configurable: true, get: () => value });
}

beforeEach(() => {
  stubClientSize(HTMLElement.prototype, 'clientWidth', VIEWER_W);
  stubClientSize(HTMLElement.prototype, 'clientHeight', VIEWER_H);
  stubTransformAwareRects({ viewerWidth: VIEWER_W, viewerHeight: VIEWER_H });

  view = render(
    createElement(UnitGalleryLightbox, { unit, onClose: vi.fn() }),
  );
});

afterEach(() => {
  view?.unmount();
  view = null;
  for (const { proto, prop, original } of sizeDescriptors.splice(0)) {
    if (original) Object.defineProperty(proto, prop, original);
    else delete (proto as Record<string, unknown>)[prop];
  }
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function galleryImage(): HTMLImageElement {
  const img = document.querySelector('img');
  if (!img) throw new Error('gallery image not rendered');
  return img;
}

function viewer(): HTMLElement {
  const el = galleryImage().parentElement;
  if (!el) throw new Error('viewer not rendered');
  return el;
}

/** Parse { scale, tx, ty } back out of the rendered transform. */
function readTransform() {
  const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
    galleryImage().style.transform,
  );
  if (!m) throw new Error(`unexpected transform: ${galleryImage().style.transform}`);
  return { tx: Number(m[1]), ty: Number(m[2]), scale: Number(m[3]) };
}

function wheelAt(x: number, y: number, deltaY: number, ctrlKey = false) {
  act(() => {
    viewer().dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        deltaY,
        ctrlKey,
      }),
    );
  });
}

function mouseDownAt(x: number, y: number) {
  act(() => {
    galleryImage().dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );
  });
}

// The move/up listeners are attached to window while dragging.
function mouseMoveTo(x: number, y: number) {
  act(() => {
    window.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }),
    );
  });
}

function mouseUp() {
  act(() => {
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
  });
}

function keyDown(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
  });
}

describe('wheel zoom', () => {
  it('wheel-up at the centre zooms in without translating', () => {
    wheelAt(CX, CY, -500); // exp(-(-500) * 0.002) = e^1 ≈ 2.718
    const t = readTransform();
    expect(t.scale).toBeCloseTo(Math.exp(1), 3);
    expect(t.tx).toBe(0);
    expect(t.ty).toBe(0);
  });

  it('zooms toward the cursor: the image point under the cursor stays put', () => {
    // Cursor 200px right / 100px below centre; scale 1 -> e.
    wheelAt(CX + 200, CY + 100, -500);
    const { scale, tx, ty } = readTransform();
    const ratio = scale; // from scale 1
    // Anchor math: t' = p - ratio * (p - t), with t = 0.
    expect(tx).toBeCloseTo(200 - ratio * 200, 3);
    expect(ty).toBeCloseTo(100 - ratio * 100, 3);
  });

  it('ctrl+wheel (trackpad pinch) uses the higher-sensitivity intensity', () => {
    wheelAt(CX, CY, -100, true); // exp(100 * 0.01) = e^1
    expect(readTransform().scale).toBeCloseTo(Math.exp(1), 3);
  });

  it('clamps to the [1, 4] range and snaps fully back to fit', () => {
    wheelAt(CX, CY, -5000);
    expect(readTransform().scale).toBe(4);
    wheelAt(CX, CY, 5000);
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('prevents default so the page behind the lightbox never scrolls', () => {
    const e = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: CX,
      clientY: CY,
      deltaY: -100,
    });
    act(() => {
      viewer().dispatchEvent(e);
    });
    expect(e.defaultPrevented).toBe(true);
  });
});

describe('mouse drag pan', () => {
  it('click-and-drag pans while zoomed, and hard-clamps on release', () => {
    keyDown('+'); // 1.25
    keyDown('+'); // 1.5625 — image overflow (800*1.5625-800)/2 = 225px per side
    mouseDownAt(CX, CY);
    mouseMoveTo(CX + 50, CY + 30);
    expect(readTransform()).toMatchObject({ tx: 50, ty: 30 });
    // Drag far past the bound: rubber-band allows +40px slack during the drag…
    mouseMoveTo(CX + 500, CY);
    expect(readTransform().tx).toBe(225 + 40);
    mouseUp();
    // …then the release settles back inside the hard bound.
    expect(readTransform().tx).toBe(225);
  });

  it('mousedown while not zoomed does not start a drag', () => {
    mouseDownAt(CX, CY);
    mouseMoveTo(CX + 100, CY);
    mouseUp();
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
});

describe('keyboard zoom', () => {
  it('steps in with +, out with -, and 0 resets to fit', () => {
    keyDown('+');
    expect(readTransform().scale).toBeCloseTo(1.25, 5);
    keyDown('=');
    expect(readTransform().scale).toBeCloseTo(1.5625, 5);
    keyDown('-');
    expect(readTransform().scale).toBeCloseTo(1.25, 5);
    keyDown('0');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('arrow keys pan while zoomed (all four directions, clamped)', () => {
    keyDown('+'); // 1.25
    keyDown('+'); // 1.5625 — overflow (800*1.5625-800)/2 = 225px, (600*1.5625-600)/2 = 168.75px
    keyDown('ArrowLeft');
    expect(readTransform()).toMatchObject({ tx: 60, ty: 0 });
    keyDown('ArrowRight');
    keyDown('ArrowRight');
    expect(readTransform()).toMatchObject({ tx: -60, ty: 0 });
    keyDown('ArrowUp');
    expect(readTransform()).toMatchObject({ tx: -60, ty: 60 });
    keyDown('ArrowDown');
    keyDown('ArrowDown');
    expect(readTransform()).toMatchObject({ tx: -60, ty: -60 });
    // Panning far past the bound hard-clamps at the overflow edge.
    for (let i = 0; i < 10; i++) keyDown('ArrowLeft');
    expect(readTransform().tx).toBe(225);
    // Still on the first photo — arrows did not navigate.
    expect(document.body.textContent).toContain('1 / 2');
  });

  it('arrow keys keep navigating photos while fully zoomed out', () => {
    expect(document.body.textContent).toContain('1 / 2');
    keyDown('ArrowRight');
    expect(document.body.textContent).toContain('2 / 2');
    keyDown('ArrowLeft');
    expect(document.body.textContent).toContain('1 / 2');
    expect(readTransform()).toEqual({ tx: 0, ty: 0, scale: 1 });
  });

  it('padded layout: the pan clamp reaches — but never passes — every edge', () => {
    // Image centre 60px right / 40px below the viewer centre (padded/flex
    // layout). The clamp bounds shift by the offset: with overflow m per
    // side, tx ∈ [−m − 60, m − 60] and ty ∈ [−m − 40, m − 40].
    stubTransformAwareRects({
      viewerWidth: VIEWER_W,
      viewerHeight: VIEWER_H,
      imgOffsetX: 60,
      imgOffsetY: 40,
    });
    keyDown('+'); // 1.25
    keyDown('+'); // 1.5625 — overflow 225px (x), 168.75px (y) per side
    for (let i = 0; i < 10; i++) keyDown('ArrowLeft');
    expect(readTransform().tx).toBe(225 - 60); // reaches the left edge, never past
    for (let i = 0; i < 20; i++) keyDown('ArrowRight');
    expect(readTransform().tx).toBe(-225 - 60); // right edge
    for (let i = 0; i < 10; i++) keyDown('ArrowUp');
    expect(readTransform().ty).toBe(168.75 - 40); // top edge
    for (let i = 0; i < 20; i++) keyDown('ArrowDown');
    expect(readTransform().ty).toBe(-168.75 - 40); // bottom edge
  });

  it('zooming out with - rescales the pan so it stays proportional', () => {
    // Zoom in with wheel off-centre so tx/ty are non-zero.
    wheelAt(CX + 200, CY + 100, -500);
    const before = readTransform();
    expect(before.tx).not.toBe(0);
    keyDown('-');
    const after = readTransform();
    const ratio = after.scale / before.scale;
    expect(after.tx).toBeCloseTo(before.tx * ratio, 3);
    expect(after.ty).toBeCloseTo(before.ty * ratio, 3);
  });
});
