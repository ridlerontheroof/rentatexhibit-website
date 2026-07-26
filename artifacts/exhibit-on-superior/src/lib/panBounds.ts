/**
 * Clamp a pinch-zoom pan translation so the scaled image can never be
 * dragged fully off screen.
 *
 * The image is rendered with `transform: translate(tx, ty) scale(scale)`
 * and `transform-origin: center center`, so `(tx, ty)` is the offset of the
 * image centre from the container centre in screen pixels.
 *
 * Along each axis, if the scaled image is larger than the container, the
 * translation is limited so the image always covers the container edge
 * (i.e. no black gap can be dragged in past the allowance). If the scaled
 * image is smaller than the container along an axis, no panning is allowed
 * on that axis.
 *
 * The image's untransformed centre can sit away from the container centre
 * in padded/flex layouts (e.g. the floor-plan lightbox's `p-4 sm:p-8`
 * viewer). Pass that offset (image centre minus container centre, in
 * screen px) as `offsetX`/`offsetY` so the bounds line up with the real
 * container edges — with symmetric bounds an offset of d px let the image
 * be dragged d px past one edge while stopping d px short of the other.
 *
 * @param allowance extra slack in px for a rubber-band feel during a drag;
 *                  pass 0 to hard-clamp (e.g. on gesture end).
 * @param offsetX / offsetY untransformed image centre minus container
 *                  centre, in screen px (default 0).
 */
/**
 * Compute the translation that keeps the image point under the pinch
 * midpoint anchored under the fingers.
 *
 * The image is rendered with `transform: translate(tx, ty) scale(scale)`
 * and `transform-origin: center center`. A screen point p maps to
 * `p = center + t + s * q`, where q is the image-space offset from the
 * image centre. Solving for the translation that keeps q under the
 * current midpoint gives:
 *
 *   t = mid - center - (s / s0) * (startMid - center - t0)
 *
 * @param midX / midY         current pinch midpoint (screen px)
 * @param startMidX/startMidY midpoint when the pinch started (screen px)
 * @param centerX / centerY   container centre (screen px)
 * @param scale               current scale s
 * @param startScale          scale when the pinch started, s0
 * @param startTx / startTy   translation when the pinch started, t0
 */
export function anchorPinchTranslation(
  midX: number,
  midY: number,
  startMidX: number,
  startMidY: number,
  centerX: number,
  centerY: number,
  scale: number,
  startScale: number,
  startTx: number,
  startTy: number,
): { tx: number; ty: number } {
  if (scale <= 1) return { tx: 0, ty: 0 };
  const ratio = scale / startScale;
  return {
    tx: midX - centerX - ratio * (startMidX - centerX - startTx),
    ty: midY - centerY - ratio * (startMidY - centerY - startTy),
  };
}

export function clampPanTranslation(
  tx: number,
  ty: number,
  scale: number,
  imgWidth: number,
  imgHeight: number,
  containerWidth: number,
  containerHeight: number,
  allowance = 0,
  offsetX = 0,
  offsetY = 0,
): { tx: number; ty: number } {
  // The scaled image spans [imgCentre + t ± imgSize*scale/2]; with the image
  // centre at containerCentre + offset, keeping the container edges covered
  // requires t in [-max - offset, max - offset] (max as in the centred case).
  // When the scaled image doesn't overflow an axis, no panning is allowed on
  // that axis: the image stays where the layout put it (t = 0) — the offset
  // only shifts the bounds when there is real overflow to pan across.
  const overflowX = imgWidth * scale - containerWidth > 0;
  const overflowY = imgHeight * scale - containerHeight > 0;
  const maxTx = Math.max(0, (imgWidth * scale - containerWidth) / 2) + allowance;
  const maxTy = Math.max(0, (imgHeight * scale - containerHeight) / 2) + allowance;
  const ox = overflowX ? offsetX : 0;
  const oy = overflowY ? offsetY : 0;
  return {
    // `+ 0` normalises -0 to 0 when the limit is zero.
    tx: Math.min(maxTx - ox, Math.max(-maxTx - ox, tx)) + 0,
    ty: Math.min(maxTy - oy, Math.max(-maxTy - oy, ty)) + 0,
  };
}
