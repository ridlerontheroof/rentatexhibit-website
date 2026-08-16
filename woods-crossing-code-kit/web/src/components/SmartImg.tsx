import type { ImgHTMLAttributes, Ref } from 'react';
import { IMAGE_MANIFEST } from '../data/imageManifest';

interface SmartImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Original image path (e.g. "/images/foo.jpg") — resolved to AVIF/WebP variants. */
  src: string;
  alt: string;
  /** Forwarded to the inner <img> (React 19 ref-as-prop). */
  ref?: Ref<HTMLImageElement>;
}

/**
 * Renders an optimized <picture> for any image under public/images:
 * - an AVIF <source> is preferred where supported (smallest files)
 * - img src/srcSet fall back to the generated WebP variants
 *   (see scripts/optimize-images.mjs)
 * - intrinsic width/height are set so the browser reserves space (no CLS)
 * - defaults to lazy loading; pass loading="eager" + fetchPriority="high" for LCP images
 *
 * Falls back to a plain <img> for paths not present in the manifest.
 */
export function SmartImg({ src, sizes = '100vw', loading = 'lazy', ...rest }: SmartImgProps) {
  const meta = IMAGE_MANIFEST[src];
  if (!meta || meta.variants.length === 0) {
    return <img src={src} loading={loading} {...rest} />;
  }
  const largest = meta.variants[meta.variants.length - 1];
  const srcSet = meta.variants.map((v) => `${v.src} ${v.w}w`).join(', ');
  // Rungs whose AVIF didn't beat the WebP twin are omitted from the manifest.
  const avifSrcSet = meta.variants
    .filter((v) => v.avif)
    .map((v) => `${v.avif} ${v.w}w`)
    .join(', ');
  return (
    <picture>
      {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
      <img
        src={largest.src}
        srcSet={srcSet}
        sizes={sizes}
        width={meta.width}
        height={meta.height}
        loading={loading}
        {...rest}
      />
    </picture>
  );
}
