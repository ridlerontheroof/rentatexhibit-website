import { vi } from 'vitest';

/**
 * Shared transform-aware getBoundingClientRect stub for the lightbox test
 * harnesses (PlanLightbox and UnitGalleryLightbox).
 *
 * In a real browser getBoundingClientRect reflects the element's
 * `translate(tx, ty)` transform, and usePinchZoom's clampPan measures the
 * image-centre offset as (rect centre − live translation). A *static* rect
 * stub makes that measurement report a spurious offset of −tx/−ty, and a
 * zero-size rect silently exercises the "no layout info" fallback instead
 * of the real offset path — both keep tests from seeing what browsers see.
 *
 * This stub parses the element's own inline translate() back out of
 * `style.transform`, so the reported rect moves with the element exactly
 * like a live layout. (Scaling about `transform-origin: center center`
 * doesn't move the centre, and the clamp math only reads the rect centre,
 * so the rect's width/height stay at the untransformed size.)
 *
 * `imgOffsetX` / `imgOffsetY` shift the <img>'s untransformed rect relative
 * to the viewer's, modelling padded/flex layouts (e.g. PlanLightbox's
 * `p-4 sm:p-8` viewer) where the image centre sits away from the viewer
 * centre — the case the offsetX/offsetY arguments of clampPanTranslation
 * exist for.
 *
 * Call it in beforeEach (after any vi.restoreAllMocks-driven teardown), or
 * re-call it inside a test to swap in a padded layout: the new
 * mockImplementation replaces the previous one on the same spy.
 */
export interface TransformAwareRectOptions {
  viewerWidth: number;
  viewerHeight: number;
  /** Untransformed image-centre offset from the viewer centre (screen px). */
  imgOffsetX?: number;
  /** Untransformed image-centre offset from the viewer centre (screen px). */
  imgOffsetY?: number;
}

export function stubTransformAwareRects({
  viewerWidth,
  viewerHeight,
  imgOffsetX = 0,
  imgOffsetY = 0,
}: TransformAwareRectOptions) {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(this.style?.transform ?? '');
      const tx = m ? Number(m[1]) : 0;
      const ty = m ? Number(m[2]) : 0;
      const isImg = this.tagName === 'IMG';
      const left = tx + (isImg ? imgOffsetX : 0);
      const top = ty + (isImg ? imgOffsetY : 0);
      return {
        x: left,
        y: top,
        left,
        top,
        right: left + viewerWidth,
        bottom: top + viewerHeight,
        width: viewerWidth,
        height: viewerHeight,
        toJSON: () => ({}),
      } as DOMRect;
    });
}
