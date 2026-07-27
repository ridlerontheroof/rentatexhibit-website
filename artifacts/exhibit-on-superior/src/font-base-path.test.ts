import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Regression guard for task "Keep fonts loading if the site ever moves off
 * the root URL".
 *
 * The self-hosted fonts (Reenie Beanie, Barlow Semi Condensed) are referenced
 * with root-absolute URLs (/fonts/*.woff2) in index.html preloads and the
 * index.css @font-face rules. Vite rebases those references with the
 * configured `base` (BASE_PATH) at build time. This test proves that by
 * building with a non-root base and asserting every font URL in the built
 * HTML and CSS carries the base prefix — so a Vite upgrade, config change, or
 * moving the fonts out of public/ can't silently break fonts off the root URL.
 */

const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/font-base-check/';
// NOTE: deliberately OUTSIDE dist/ — validation runs this suite concurrently
// with the prepublish rebuild, which recreates dist/ and would delete this
// test's freshly built output mid-assertion (spurious ENOENT failures).
const OUT_DIR = path.join(artifactRoot, 'node_modules', '.cache', 'font-base-check');

const FONT_FILES = [
  'BarlowSemiCondensed-300-latin.woff2',
  'BarlowSemiCondensed-400-latin.woff2',
  'BarlowSemiCondensed-500-latin.woff2',
  'BarlowSemiCondensed-600-latin.woff2',
  'BarlowSemiCondensed-700-latin.woff2',
  'ReenieBeanie-400-latin.woff2',
];

describe('font URLs are base-path aware', () => {
  it('build with a non-root BASE_PATH prefixes every font URL in HTML and CSS', () => {
    execFileSync(
      'npx',
      ['vite', 'build', '--config', 'vite.config.ts', '--outDir', OUT_DIR, '--emptyOutDir'],
      {
        cwd: artifactRoot,
        env: { ...process.env, BASE_PATH: BASE, PORT: process.env.PORT ?? '5000' },
        stdio: 'pipe',
        timeout: 180_000,
      },
    );

    try {
      // index.html: preload links must be rebased.
      const html = readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8');
      const preloads = [...html.matchAll(/href="([^"]*\.woff2)"/g)].map((m) => m[1]);
      expect(preloads.length).toBeGreaterThanOrEqual(2);
      for (const url of preloads) {
        expect(url).toMatch(new RegExp(`^${BASE}fonts/`));
      }

      // Emitted CSS: every @font-face url() must be rebased, and all six
      // font files must be referenced.
      const assetsDir = path.join(OUT_DIR, 'assets');
      const cssFiles = readdirSync(assetsDir).filter((f) => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
      const css = cssFiles.map((f) => readFileSync(path.join(assetsDir, f), 'utf8')).join('\n');
      const cssUrls = [...css.matchAll(/url\(([^)]*\.woff2)\)/g)].map((m) => m[1].replace(/^["']|["']$/g, ''));
      expect(cssUrls.length).toBeGreaterThanOrEqual(FONT_FILES.length);
      for (const url of cssUrls) {
        expect(url).toMatch(new RegExp(`^${BASE}fonts/`));
      }
      for (const file of FONT_FILES) {
        expect(cssUrls.some((u) => u.endsWith(`/${file}`))).toBe(true);
      }

      // The font files themselves must be copied into the build output.
      const builtFonts = readdirSync(path.join(OUT_DIR, 'fonts'));
      for (const file of FONT_FILES) {
        expect(builtFonts).toContain(file);
      }
    } finally {
      rmSync(OUT_DIR, { recursive: true, force: true });
    }
  }, 240_000);
});
