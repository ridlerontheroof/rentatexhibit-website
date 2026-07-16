import { describe, expect, it } from 'vitest';
import { clampPanTranslation } from './panBounds';

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
