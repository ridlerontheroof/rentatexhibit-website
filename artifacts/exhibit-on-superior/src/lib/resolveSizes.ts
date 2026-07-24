/**
 * Resolve a `sizes` attribute to a CSS px width for a given viewport,
 * mirroring the browser's algorithm: first matching media condition wins;
 * a bare length is the default. Supports the px/vw forms used in this app.
 *
 * Shared by logo-sizes.test.tsx (rendered-DOM check) and
 * smartimg-sizes.test.ts (static call-site scan).
 */
export function resolveSizes(sizes: string, viewportCssPx: number): number {
  const clauses = sizes.split(',').map((c) => c.trim());
  for (const clause of clauses) {
    const media = clause.match(/^\((min|max)-width:\s*([\d.]+)px\)\s+(.+)$/);
    let length = clause;
    if (media) {
      const [, kind, px, len] = media;
      const bound = parseFloat(px);
      const matches = kind === 'min' ? viewportCssPx >= bound : viewportCssPx <= bound;
      if (!matches) continue;
      length = len;
    }
    const pxMatch = length.match(/^([\d.]+)px$/);
    if (pxMatch) return parseFloat(pxMatch[1]);
    const vwMatch = length.match(/^([\d.]+)vw$/);
    if (vwMatch) return (parseFloat(vwMatch[1]) / 100) * viewportCssPx;
    throw new Error(`Unsupported sizes length "${length}" in "${sizes}"`);
  }
  throw new Error(`No clause of sizes="${sizes}" matched viewport ${viewportCssPx}px`);
}
