// Knowledge-bundle isolation guard (Task: keep every page's speed win from
// quietly regressing when new sections are added).
//
// The mobile Lighthouse budget was met by keeping the ~176 KB knowledge
// article bundle (src/data/knowledge.ts → knowledgeArticles.ts) OUT of every
// non-knowledge page's JavaScript. Site-wide components use the light
// modules instead:
//   - src/data/knowledgePath.ts       (URL builder)
//   - src/data/knowledgeQuestions.ts  (slug → question index)
//
// Nothing in the type system stops a future edit from importing
// src/data/knowledge.ts into a shared component (FaqSection, KnowledgeLinks,
// a new footer widget, …) and silently re-inflating EVERY page chunk. This
// guard fails the suite the moment that happens, by inspecting the actual
// built output in dist/public/assets:
//
//   For each emitted JS chunk that is NOT itself a knowledge page/data
//   chunk, assert it never imports the knowledge data chunk. In Rollup
//   output, imports of a sibling chunk use the "./knowledge-<hash>.js"
//   specifier (both static `from"./…"` and dynamic `import("./…")`).
//   Vite's `__vite__mapDeps` preload manifest in the entry chunk instead
//   lists "assets/knowledge-<hash>.js" — a harmless lookup table that only
//   triggers when a knowledge route is actually visited — so matching the
//   "./" specifier form checks exactly the imports that inflate a page.
//
// Allowed importers of the knowledge data chunk:
//   - Knowledge-<hash>.js         (the /knowledge hub page)
//   - KnowledgeArticle-<hash>.js  (the /knowledge/<slug> article page)
//   - knowledge-<hash>.js         (the data chunk itself / its internals)
//
// Documented next to the perf checks: see scripts/check-perf.mjs header and
// the "check:perf" workflow — this test is the build-time complement that
// catches the regression without a Lighthouse run.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '..', 'dist', 'public');
const assetsDir = path.join(publicDir, 'assets');

// Skip (not fail) without a COMPLETE build: precompress writes index.html.br
// LAST in the build chain, so its presence marks a finished, settled build.
// (Same gate as the other dist-based guards — never poll in beforeAll.)
const hasCompleteBuild = existsSync(path.join(publicDir, 'index.html.br'));

describe.skipIf(!hasCompleteBuild)('knowledge bundle isolation (dist/public/assets)', () => {
  const jsChunks = hasCompleteBuild
    ? readdirSync(assetsDir).filter((f) => f.endsWith('.js'))
    : [];

  // The heavyweight knowledge DATA chunk(s): lowercase "knowledge-<hash>.js"
  // (from src/data/knowledge.ts + knowledgeArticles.ts). NOT knowledgePath-*
  // or KnowledgeLinks-* — those are the deliberately light modules.
  const knowledgeDataChunks = jsChunks.filter((f) => /^knowledge-[\w-]+\.js$/.test(f));

  // Chunks allowed to import the knowledge data chunk: the two knowledge
  // route pages and the data chunk itself.
  const isAllowedImporter = (f: string) =>
    /^(Knowledge|KnowledgeArticle|knowledge)-[\w-]+\.js$/.test(f);

  it('build still emits a separate knowledge data chunk', () => {
    // If this fails, the article bundle got inlined somewhere (or renamed);
    // either way the isolation contract below can no longer be verified —
    // investigate before trusting page weights.
    expect(knowledgeDataChunks.length).toBeGreaterThan(0);
  });

  it('no non-knowledge chunk imports the knowledge data chunk', () => {
    const offenders: string[] = [];
    for (const chunk of jsChunks) {
      if (isAllowedImporter(chunk)) continue;
      const code = readFileSync(path.join(assetsDir, chunk), 'utf8');
      for (const dataChunk of knowledgeDataChunks) {
        // "./knowledge-<hash>.js" = a real import specifier (static or
        // dynamic). "assets/knowledge-<hash>.js" (mapDeps) is fine.
        if (code.includes(`./${dataChunk}`)) {
          offenders.push(`${chunk} imports ${dataChunk}`);
        }
      }
    }
    expect(
      offenders,
      'A non-knowledge page chunk imports the ~176 KB knowledge article bundle again — ' +
        'every page would ship it in its mobile critical path. Import ' +
        'src/data/knowledgePath.ts or src/data/knowledgeQuestions.ts instead of ' +
        'src/data/knowledge.ts in shared components. Offenders:\n' +
        offenders.join('\n'),
    ).toEqual([]);
  });
});
