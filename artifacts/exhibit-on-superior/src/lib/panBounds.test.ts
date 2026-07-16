import { describe, expect, it } from 'vitest';
import { anchorPinchTranslation, clampPanTranslation } from './panBounds';

// Phone-sized viewer: 390x700, fitted image 358x500 (object-contain inside padding).
const IMG_W = 358;
const IMG_H = 500;
const CW = 390;
const CH = 700;

describe('clampPanTranslation', () => {
  it('allows no panning at fit scale (image smaller than container)', () => {
    expect(clampPanTranslation(120, -300, 1, IMG_W, IMG_H, CW, CH)).toEqual({ tx: 0, ty: 0 });
  });

  it('keeps a zoomed image from being dragged fully off screen', () => {
    const scale = 3; // scaled: 1074 x 1500
    const maxTx = (IMG_W * scale - CW) / 2; // 342
    const maxTy = (IMG_H * scale - CH) / 2; // 400
    expect(clampPanTranslation(5000, 5000, scale, IMG_W, IMG_H, CW, CH)).toEqual({
      tx: maxTx,
      ty: maxTy,
    });
    expect(clampPanTranslation(-5000, -5000, scale, IMG_W, IMG_H, CW, CH)).toEqual({
      tx: -maxTx,
      ty: -maxTy,
    });
  });

  it('leaves in-bounds translations untouched', () => {
    const scale = 2;
    const result = clampPanTranslation(50, -60, scale, IMG_W, IMG_H, CW, CH);
    expect(result).toEqual({ tx: 50, ty: -60 });
  });

  it('limits grow with scale', () => {
    const at2 = clampPanTranslation(9999, 9999, 2, IMG_W, IMG_H, CW, CH);
    const at4 = clampPanTranslation(9999, 9999, 4, IMG_W, IMG_H, CW, CH);
    expect(at4.tx).toBeGreaterThan(at2.tx);
    expect(at4.ty).toBeGreaterThan(at2.ty);
  });

  it('adds rubber-band allowance to the limits', () => {
    const scale = 3;
    const hard = clampPanTranslation(9999, 9999, scale, IMG_W, IMG_H, CW, CH, 0);
    const soft = clampPanTranslation(9999, 9999, scale, IMG_W, IMG_H, CW, CH, 40);
    expect(soft.tx - hard.tx).toBe(40);
    expect(soft.ty - hard.ty).toBe(40);
  });

  it('clamps an axis to zero when the scaled image only exceeds the other axis', () => {
    // scale 1.05: width 375.9 < 390 container, height 525 < 700 → both zero
    expect(clampPanTranslation(30, 30, 1.05, IMG_W, IMG_H, CW, CH)).toEqual({ tx: 0, ty: 0 });
    // wide container: only vertical overflow at scale 2 with a short container
    const r = clampPanTranslation(999, 999, 2, IMG_W, IMG_H, 1000, 400);
    expect(r.tx).toBe(0);
    expect(r.ty).toBe((IMG_H * 2 - 400) / 2);
  });
});

describe('anchorPinchTranslation', () => {
  // Container centre used by all cases.
  const CX = 195;
  const CY = 350;

  /** Screen position of image point q under translate(t)+scale(s), origin center. */
  const project = (qx: number, qy: number, tx: number, ty: number, s: number) => ({
    x: CX + tx + s * qx,
    y: CY + ty + s * qy,
  });

  it('keeps the anchored image point fixed under a stationary midpoint while zooming', () => {
    // Pinch starts at fit (s0=1, t0=0) with midpoint over image point q.
    const q = { x: 60, y: -80 };
    const start = project(q.x, q.y, 0, 0, 1);
    for (const scale of [1.5, 2, 3, 4]) {
      const t = anchorPinchTranslation(start.x, start.y, start.x, start.y, CX, CY, scale, 1, 0, 0);
      const p = project(q.x, q.y, t.tx, t.ty, scale);
      expect(p.x).toBeCloseTo(start.x);
      expect(p.y).toBeCloseTo(start.y);
    }
  });

  it('pans with the midpoint at constant scale', () => {
    const s = 2;
    const t0 = { tx: 10, ty: -20 };
    const startMid = { x: 250, y: 300 };
    const moved = anchorPinchTranslation(
      startMid.x + 35,
      startMid.y - 15,
      startMid.x,
      startMid.y,
      CX,
      CY,
      s,
      s,
      t0.tx,
      t0.ty,
    );
    expect(moved.tx).toBeCloseTo(t0.tx + 35);
    expect(moved.ty).toBeCloseTo(t0.ty - 15);
  });

  it('handles scale ratio across pinch handoffs (non-unit start scale/translation)', () => {
    // Second pinch begins already zoomed: s0 = 2, t0 = (30, -40).
    const s0 = 2;
    const t0 = { tx: 30, ty: -40 };
    const q = { x: -50, y: 25 };
    const startMid = project(q.x, q.y, t0.tx, t0.ty, s0);
    const s = 3.2;
    const t = anchorPinchTranslation(
      startMid.x,
      startMid.y,
      startMid.x,
      startMid.y,
      CX,
      CY,
      s,
      s0,
      t0.tx,
      t0.ty,
    );
    const p = project(q.x, q.y, t.tx, t.ty, s);
    expect(p.x).toBeCloseTo(startMid.x);
    expect(p.y).toBeCloseTo(startMid.y);
  });

  it('anchors while zooming and panning simultaneously', () => {
    const s0 = 1.5;
    const t0 = { tx: -12, ty: 8 };
    const q = { x: 40, y: 40 };
    const startMid = project(q.x, q.y, t0.tx, t0.ty, s0);
    const mid = { x: startMid.x + 20, y: startMid.y - 30 };
    const s = 2.5;
    const t = anchorPinchTranslation(mid.x, mid.y, startMid.x, startMid.y, CX, CY, s, s0, t0.tx, t0.ty);
    const p = project(q.x, q.y, t.tx, t.ty, s);
    expect(p.x).toBeCloseTo(mid.x);
    expect(p.y).toBeCloseTo(mid.y);
  });

  it('returns identity translation at or below scale 1', () => {
    expect(anchorPinchTranslation(200, 300, 180, 320, CX, CY, 1, 1, 15, -25)).toEqual({
      tx: 0,
      ty: 0,
    });
    expect(anchorPinchTranslation(200, 300, 180, 320, CX, CY, 0.8, 2, 15, -25)).toEqual({
      tx: 0,
      ty: 0,
    });
  });
});
