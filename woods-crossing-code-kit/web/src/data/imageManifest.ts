import { verifiedContent } from "./generated";
export interface ImageVariant { src: string; w: number; avif?: string }
export interface ImageMeta { src: string; width: number; height: number; alt: string; variants: ImageVariant[] }
export const IMAGE_MANIFEST: Record<string, ImageMeta> = Object.fromEntries(
  verifiedContent.gallery.map((image: any) => [image.src, { ...image, variants: [{ src: image.src, w: image.width }] }]),
);