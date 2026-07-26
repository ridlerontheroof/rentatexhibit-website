// Build-time pre-compression (SEO Phase 1): writes .br and .gz siblings for
// every compressible file in dist/public so the production server can serve
// them with zero runtime CPU cost and maximum-quality compression.
//
// Runs last in the build chain. Stale sibling cleanup: any .br/.gz whose
// source file no longer exists is removed (prerender rewrites HTML in place,
// so siblings are always regenerated from the current bytes).

import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const brotli = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'dist', 'public');

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.xml', '.txt', '.json', '.webmanifest']);
const MIN_BYTES = 512; // below this, headers outweigh the savings

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let made = 0;
let cleaned = 0;
let inBytes = 0;
let brBytes = 0;

const files = [];
for await (const f of walk(publicDir)) files.push(f);

// Remove stale siblings first.
for (const f of files) {
  if (f.endsWith('.br') || f.endsWith('.gz')) {
    const src = f.slice(0, -3);
    try {
      await fs.access(src);
    } catch {
      await fs.rm(f);
      cleaned++;
    }
  }
}

for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  if (!COMPRESSIBLE.has(ext)) continue;
  const buf = await fs.readFile(f);
  if (buf.length < MIN_BYTES) continue;
  const [br, gz] = await Promise.all([
    brotli(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } }),
    gzip(buf, { level: 9 }),
  ]);
  await Promise.all([fs.writeFile(`${f}.br`, br), fs.writeFile(`${f}.gz`, gz)]);
  made++;
  inBytes += buf.length;
  brBytes += br.length;
}

console.log(
  `Precompressed ${made} file(s): ${(inBytes / 1024).toFixed(0)} KB → ${(brBytes / 1024).toFixed(0)} KB brotli` +
    (cleaned ? `; removed ${cleaned} stale sibling(s)` : ''),
);
