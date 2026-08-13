// Regenerates artifacts/api-server/src/lib/blogQueueSnapshot.json from the
// blog cluster plan + article list, so the api-server's weekly SEO digest can
// name the next guide to draft without a cross-artifact source import.
//
// Modes:
//   pnpm --filter @workspace/exhibit-on-superior run generate:blog-queue          # write
//   pnpm --filter @workspace/exhibit-on-superior run generate:blog-queue:check    # exit 1 on drift
//
// Run this after publishing an article (flipping draft: false), adding a
// draft, or editing the cluster plan. The parity test
// src/data/blogQueueSnapshot.test.ts fails until the snapshot is regenerated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBlogQueueSnapshot, serializeBlogQueueSnapshot } from './lib/blog-queue';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(
  HERE,
  '..',
  '..',
  'api-server',
  'src',
  'lib',
  'blogQueueSnapshot.json',
);

const expected = serializeBlogQueueSnapshot(buildBlogQueueSnapshot());
const mode = process.argv.includes('--check') ? 'check' : 'write';

const current = fs.existsSync(SNAPSHOT_PATH) ? fs.readFileSync(SNAPSHOT_PATH, 'utf8') : null;

if (mode === 'check') {
  if (current === expected) {
    console.log(`blog-queue snapshot is up to date (${SNAPSHOT_PATH})`);
    process.exit(0);
  }
  console.error(
    `blog-queue snapshot is OUT OF DATE: ${SNAPSHOT_PATH}\n` +
      'Run: pnpm --filter @workspace/exhibit-on-superior run generate:blog-queue',
  );
  process.exit(1);
}

if (current === expected) {
  console.log('blog-queue snapshot already up to date; nothing written.');
} else {
  fs.writeFileSync(SNAPSHOT_PATH, expected);
  console.log(`Wrote ${SNAPSHOT_PATH}`);
}
