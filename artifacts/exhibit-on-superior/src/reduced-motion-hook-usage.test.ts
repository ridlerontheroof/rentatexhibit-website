import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Lint-style companion to reduced-motion-guard.test.ts (which protects the
 * CSS block). CSS can't stop JS-driven motion — rAF zoom/drag animations,
 * gesture transitions, etc. — so key animated components must branch on the
 * useReducedMotion hook. This test fails if a refactor removes that
 * consultation, which would re-expose vestibular-sensitive visitors to
 * motion despite their OS setting.
 *
 * If you add a new component with JS-driven animation, wire it through
 * useReducedMotion and add it to the list below.
 */

const SRC = path.resolve(import.meta.dirname);

/** Components whose JS-driven animations must respect reduced motion. */
const animatedComponents = [
  // rAF-driven zoom/pan transitions and gesture animations in the plan viewer.
  'components/floor-plans/PlanLightbox.tsx',
];

describe('JS-driven animations consult useReducedMotion', () => {
  it.each(animatedComponents)('%s imports and calls the hook', (relPath) => {
    const source = readFileSync(path.join(SRC, relPath), 'utf8');
    expect(source, `${relPath} must import useReducedMotion`).toMatch(
      /import\s*\{[^}]*\buseReducedMotion\b[^}]*\}\s*from\s*['"][^'"]*use-reduced-motion['"]/,
    );
    expect(source, `${relPath} must call useReducedMotion()`).toMatch(/\buseReducedMotion\s*\(\s*\)/);
  });

  it('the hook itself still targets the prefers-reduced-motion media query', () => {
    const hook = readFileSync(path.join(SRC, 'hooks/use-reduced-motion.ts'), 'utf8');
    expect(hook).toMatch(/prefers-reduced-motion\s*:\s*reduce/);
  });
});
