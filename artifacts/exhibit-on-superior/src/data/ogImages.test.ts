import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_OG_IMAGE, PAGE_SEO, SITE_URL } from './seo';

// Guards social-share previews: every page in PAGE_SEO must resolve to an OG
// image file that actually exists under public/, with the standard social-card
// dimensions (1200x630) that buildSeoModel advertises via og:image:width/height.

const ROOT = join(__dirname, '..', '..');
const PUBLIC_DIR = join(ROOT, 'public');

const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 630;

/** Map an absolute og image URL (https://site/images/...) to a public/ file path. */
function urlToPublicPath(url: string): string {
  expect(url.startsWith(`${SITE_URL}/`)).toBe(true);
  // Strip the cache-busting version query (?v=N) — it is not part of the file path.
  return join(PUBLIC_DIR, url.slice(SITE_URL.length).replace(/\?.*$/, ''));
}

/** Parse JPEG dimensions from SOF0/SOF2 (baseline/progressive) markers. */
function jpegDimensions(buf: Buffer): { width: number; height: number } {
  expect(buf.readUInt16BE(0)).toBe(0xffd8); // SOI marker — must be a JPEG
  let offset = 2;
  while (offset < buf.length - 1) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF markers carrying dimensions (excludes DHT/JPG/DAC: C4, C8, CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    // Standalone markers without a length segment.
    if (marker === 0xff || (marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
      offset += 2;
      continue;
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  throw new Error('No SOF marker found — cannot read JPEG dimensions');
}

const pages = Object.values(PAGE_SEO);

describe('OG share-card images', () => {
  it('covers every PAGE_SEO entry', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it('default OG image exists', () => {
    expect(existsSync(urlToPublicPath(DEFAULT_OG_IMAGE))).toBe(true);
  });

  describe.each(pages.map((p) => [p.path, p] as const))('%s', (_path, page) => {
    const url = page.ogImage ?? DEFAULT_OG_IMAGE;
    const file = urlToPublicPath(url);

    it(`has an existing OG image file (${url.slice(SITE_URL.length)})`, () => {
      expect(existsSync(file), `missing OG image file for ${page.path}: ${file}`).toBe(true);
    });

    it(`is a ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT} JPEG`, () => {
      expect(/\.jpe?g$/i.test(file)).toBe(true);
      const { width, height } = jpegDimensions(readFileSync(file));
      expect({ width, height }).toEqual({ width: EXPECTED_WIDTH, height: EXPECTED_HEIGHT });
    });
  });
});
