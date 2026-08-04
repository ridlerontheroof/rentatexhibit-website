/**
 * WCAG 2.4.7 Focus Visible — source-level guard for btn-gold-outline and
 * btn-dark-outline focus rings.
 *
 * Asserts that:
 * 1. The base focus rule uses a dual-layer box-shadow with explicit black (#000)
 *    outer ring (21:1 on white light-bg) — no unresolved CSS custom properties.
 * 2. Dark-context overrides exist for .bg-footer and .bg-dark-section, flipping
 *    the outer ring to white (#fff) so it reaches 21:1 on #1c1c1c / #3c3c3e.
 * 3. The old undefined variable (--color-gold-300) is not referenced anywhere.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

describe('btn-gold-outline focus ring (WCAG 2.4.7)', () => {
  it('uses explicit #000 outer ring on the base light-background rule', () => {
    // Locate the .btn-gold-outline:focus-visible block (base, not inside a dark-context selector)
    // The pattern we expect: box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000
    expect(css).toMatch(/\.btn-gold-outline:focus-visible\s*\{[^}]*box-shadow:\s*0 0 0 2px #fff,\s*0 0 0 4px #000/);
  });

  it('provides a dark-context override with #fff outer ring for .bg-footer', () => {
    expect(css).toMatch(/\.bg-footer\s+\.btn-gold-outline:focus-visible[^{]*\{[^}]*box-shadow:[^}]*0 0 0 4px #fff/);
  });

  it('provides a dark-context override with #fff outer ring for .bg-dark-section', () => {
    expect(css).toMatch(/\.bg-dark-section\s+\.btn-gold-outline:focus-visible[^{]*\{[^}]*box-shadow:[^}]*0 0 0 4px #fff/);
  });

  it('does not reference the undefined --color-gold-300 variable', () => {
    expect(css).not.toContain('--color-gold-300');
  });
});

describe('btn-dark-outline focus ring (WCAG 2.4.7)', () => {
  it('uses explicit #000 outer ring on the base light-background rule', () => {
    expect(css).toMatch(/\.btn-dark-outline:focus-visible\s*\{[^}]*box-shadow:\s*0 0 0 2px #fff,\s*0 0 0 4px #000/);
  });
});
