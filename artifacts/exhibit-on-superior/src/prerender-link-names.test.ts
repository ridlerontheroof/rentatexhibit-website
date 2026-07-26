import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// Task: catch link names that don't match their visible text — site-wide.
//
// The /faq "Full answer" links once failed WCAG 2.5.3 (label-in-name): an
// aria-label dropped part of the visible text, so speech-input users saying
// the visible words couldn't activate the link. FaqHub.link-names.test.tsx
// guards only that page. This guard walks EVERY prerendered page in
// dist/public and fails if ANY <a> or <button> carries an aria-label that
// does not begin with the element's visible text.
//
// Contract per element with an aria-label:
//   - normalize both the label and the visible text (decode entities, strip
//     sr-only spans, drop symbols like "→", collapse whitespace, lowercase —
//     2.5.3 is about the spoken words, not punctuation or case);
//   - if the element has visible text, the label must START with it verbatim
//     (WCAG 2.5.3 requires the accessible name to begin with the visible
//     label so "click <visible text>" works);
//   - icon-only elements (no visible text) always pass.

import { spokenWords, visibleTextFromHtml } from './lib/link-name-lint';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');

interface Offender {
  page: string;
  tag: string;
  label: string;
  visible: string;
}

/**
 * Every <a>/<button> in the page that has an aria-label whose spoken form
 * does not begin with the element's visible text. Links and buttons cannot
 * nest themselves, so a lazy match to the closing tag is safe.
 */
function offendersIn(page: string, html: string): Offender[] {
  const out: Offender[] = [];
  for (const m of html.matchAll(/<(a|button)\b([^>]*)>(.*?)<\/\1>/gis)) {
    const attrs = m[2];
    const labelMatch = attrs.match(/aria-label="([^"]*)"/i);
    if (!labelMatch) continue;
    const label = spokenWords(labelMatch[1]);
    const visible = visibleTextFromHtml(m[3]);
    if (!visible) continue; // icon-only — nothing visible to mismatch
    if (label.startsWith(visible)) continue;
    out.push({
      page,
      tag: m[0].length > 200 ? `${m[0].slice(0, 200)}…` : m[0],
      label: labelMatch[1],
      visible,
    });
  }
  return out;
}

async function collectIndexHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectIndexHtml(full)));
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

// Skip (not fail) without a COMPLETE build: precompress writes index.html.br
// LAST in the build chain, so its presence marks a settled dist/public.
// Validation runs this suite concurrently with the prepublish rebuild, which
// wipes dist mid-flight — grading a half-built dist gives spurious failures.
const hasCompleteBuild = existsSync(path.join(publicDir, 'index.html.br'));

let pages: { page: string; html: string }[] = [];
let labelledCount = 0;

beforeAll(async () => {
  if (!hasCompleteBuild) return;
  const files = await collectIndexHtml(publicDir);
  pages = await Promise.all(
    files.map(async (file) => ({
      page: path.relative(publicDir, file),
      html: await fs.readFile(file, 'utf8'),
    })),
  );
  for (const { html } of pages) {
    for (const m of html.matchAll(/<(a|button)\b([^>]*)>/gi)) {
      if (/aria-label="/i.test(m[2])) labelledCount += 1;
    }
  }
});

describe.skipIf(!hasCompleteBuild)(
  'prerendered link/button label-in-name (dist/public, WCAG 2.5.3)',
  () => {
    it('the prerendered output exists and covers the whole site', () => {
      expect(pages.length).toBeGreaterThan(20);
      expect(pages.some((p) => p.page === 'index.html')).toBe(true);
      expect(pages.some((p) => p.page.startsWith('available-units/'))).toBe(true);
      expect(pages.some((p) => p.page.startsWith('knowledge/'))).toBe(true);
    });

    it('the scan actually sees aria-labelled links/buttons (guard is not vacuous)', () => {
      // Unit cards and the mobile menu button carry aria-labels today; if
      // this count collapses to zero the mismatch check below proves nothing.
      expect(labelledCount).toBeGreaterThan(0);
    });

    it('every aria-label on an <a>/<button> begins with its visible text', () => {
      const offenders = pages.flatMap(({ page, html }) => offendersIn(page, html));
      const report = offenders
        .map(
          (o) =>
            `${o.page}: aria-label "${o.label}" does not begin with visible text "${o.visible}"\n  ${o.tag}`,
        )
        .join('\n');
      expect(
        offenders,
        `aria-labels that break WCAG 2.5.3 label-in-name (make the label start with the visible text, or drop it):\n${report}`,
      ).toEqual([]);
    });
  },
);
