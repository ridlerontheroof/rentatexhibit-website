import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the site-wide reduced-motion CSS block in src/index.css.
 *
 * That block (under `@media (prefers-reduced-motion: reduce)`) makes all CSS
 * animations/transitions effectively instant for vestibular-sensitive
 * visitors. A stylesheet refactor or Tailwind upgrade could silently drop or
 * weaken it — this test fails if the media block or any of its key
 * declarations disappear or lose their `!important` weight.
 */

const css = readFileSync(path.resolve(import.meta.dirname, 'index.css'), 'utf8');

/** Extract the full body of the first prefers-reduced-motion media block, brace-balanced. */
function extractReducedMotionBlock(source: string): string | null {
  const match = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/.exec(source);
  if (!match) return null;
  let depth = 1;
  let i = match.index + match[0].length;
  const start = i;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  return depth === 0 ? source.slice(start, i - 1) : null;
}

describe('site-wide reduced-motion guard (index.css)', () => {
  const block = extractReducedMotionBlock(css);

  it('contains a prefers-reduced-motion: reduce media block', () => {
    expect(block, 'index.css must contain @media (prefers-reduced-motion: reduce) { ... }').not.toBeNull();
  });

  it('applies to all elements including pseudo-elements', () => {
    expect(block).toMatch(/\*\s*,\s*\*::before\s*,\s*\*::after\s*\{/);
  });

  const requiredDeclarations: Array<[name: string, pattern: RegExp]> = [
    ['animation-duration override', /animation-duration\s*:\s*0\.01ms\s*!important/],
    ['animation-iteration-count override', /animation-iteration-count\s*:\s*1\s*!important/],
    ['transition-duration override', /transition-duration\s*:\s*0\.01ms\s*!important/],
    ['transition-delay override', /transition-delay\s*:\s*0m?s\s*!important/],
    ['scroll-behavior override', /scroll-behavior\s*:\s*auto\s*!important/],
  ];

  it.each(requiredDeclarations)('keeps the %s with !important', (_name, pattern) => {
    expect(block ?? '').toMatch(pattern);
  });
});
