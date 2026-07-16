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
 * @param allowance extra slack in px for a rubber-band feel during a drag;
 *                  pass 0 to hard-clamp (e.g. on gesture end).
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
): { tx: number; ty: number } {
  const maxTx = Math.max(0, (imgWidth * scale - containerWidth) / 2) + allowance;
  const maxTy = Math.max(0, (imgHeight * scale - containerHeight) / 2) + allowance;
  return {
    // `+ 0` normalises -0 to 0 when the limit is zero.
    tx: Math.min(maxTx, Math.max(-maxTx, tx)) + 0,
    ty: Math.min(maxTy, Math.max(-maxTy, ty)) + 0,
  };
}
