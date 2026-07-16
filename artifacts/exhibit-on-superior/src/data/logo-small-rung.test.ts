// Guards the tiny phone-sized logo rung: scripts/optimize-images.mjs emits a
// 320w variant for stems matching /logo/i so phones fetch ~2KB instead of the
// 800w file. If the logo is re-exported under a name that no longer matches,
// or the optimizer's small-rung logic is edited away, the small rung would
// silently vanish and every page view would download the big file again.
import { describe, expect, it } from 'vitest';
import { IMAGE_MANIFEST } from './imageManifest';

// A "small" rung must sit well under the smallest global rung (800w). The
// optimizer emits 320w today; <= 400w keeps the guard robust to minor tuning.
const MAX_SMALL_RUNG_WIDTH = 400;

const logoEntries = Object.entries(IMAGE_MANIFEST).filter(([original]) => /logo/i.test(original));

describe('logo images keep their phone-sized rung', () => {
  it('the manifest contains at least one logo entry', () => {
    // If this fails, the logo was re-exported under a name without "logo" —
    // the optimizer's SMALL_RUNG_PATTERNS would no longer match it either.
    expect(logoEntries.length).toBeGreaterThan(0);
  });

  it.each(logoEntries)(
    `%s: smallest variant is <= ${MAX_SMALL_RUNG_WIDTH}w`,
    (_original, meta) => {
      const widths = meta.variants.map((v) => v.w);
      const smallest = Math.min(...widths);
      expect(
        smallest,
        `expected a small logo rung (<= ${MAX_SMALL_RUNG_WIDTH}w) but smallest variant is ${smallest}w — ` +
          'was the small-rung logic in scripts/optimize-images.mjs removed, or the manifest regenerated without it?',
      ).toBeLessThanOrEqual(MAX_SMALL_RUNG_WIDTH);
    },
  );
});
