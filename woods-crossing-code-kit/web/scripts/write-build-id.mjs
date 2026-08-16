#!/usr/bin/env node
// Stamp the build output with a unique build id.
//
// Written as dist/public/build-id.json, served as a plain static file in
// production. The post-publish watcher (scripts/watch-postpublish.mjs) polls
// this file on the live site: when the id changes, a new publish has gone
// live and the post-publish checks (check:postpublish) run automatically.
//
// Runs near the end of the build (before precompress, so the .br/.gz
// variants exist like every other static file).

import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..', 'dist', 'public');
mkdirSync(outDir, { recursive: true });

const stamp = {
  buildId: `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`,
  builtAt: new Date().toISOString(),
};
const outFile = path.join(outDir, 'build-id.json');
writeFileSync(outFile, JSON.stringify(stamp, null, 2) + '\n');
console.log(`build-id.json written: ${stamp.buildId} (${stamp.builtAt})`);
