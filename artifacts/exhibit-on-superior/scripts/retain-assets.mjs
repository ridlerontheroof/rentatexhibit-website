#!/usr/bin/env node
// Stale-bundle protection (Semrush 17 Aug 2026: every page flagged "broken
// JavaScript" because a crawl cached HTML referencing the PREVIOUS build's
// hashed bundle, which 404ed the moment the next publish replaced dist/assets).
//
// Each publish ships a fresh dist/public/assets with new content-hashed file
// names, so any stale HTML (crawler cache, a browser inside the 5-minute HTML
// cache window, an open tab lazy-loading a route chunk) points at bundles
// that no longer exist. This script carries the previous few builds' hashed
// assets forward into the shipped output so those references keep resolving
// with 200 until the stale HTML naturally expires.
//
// How it works
//   - asset-retention/ (gitignored — committing it would create generated-data
//     drift on task branches, like reports/indexnow/) holds:
//       manifest.json     — bounded list of recent build generations
//       store/<file>      — raw copies of each generation's hashed assets
//   - On every build (after write-build-id, before precompress):
//       1. Snapshot the current dist/public/assets file list as the newest
//          generation (skipped when identical to the newest recorded one, so
//          repeated workspace rebuilds don't churn real generations out).
//       2. Copy the previous KEEP_PREVIOUS generations' files from the store
//          into dist/public/assets (current build's names always win).
//       3. Prune the manifest to 1 + KEEP_PREVIOUS generations and delete
//          store files no kept generation references.
//   - precompress.mjs then runs as usual, so retained assets get .br/.gz
//     siblings and are served identically to current ones.
//
// The store self-populates: the first build after this ships has no previous
// generations to retain; every later build is covered.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP_PREVIOUS = 5; // previous generations carried into each build

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(root, 'dist', 'public', 'assets');
const retentionDir = path.join(root, 'asset-retention');
const storeDir = path.join(retentionDir, 'store');
const manifestPath = path.join(retentionDir, 'manifest.json');

if (!fs.existsSync(assetsDir)) {
  console.error(`retain-assets: no ${assetsDir} — run the build first.`);
  process.exit(1);
}

fs.mkdirSync(storeDir, { recursive: true });

/** Build id stamped by write-build-id.mjs (runs immediately before us). */
let buildId = 'unknown';
try {
  buildId = JSON.parse(
    fs.readFileSync(path.join(root, 'dist', 'public', 'build-id.json'), 'utf8'),
  ).buildId;
} catch {
  // Non-fatal: the id is informational; file-name sets drive everything.
}

let manifest = { generations: [] };
try {
  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (Array.isArray(parsed.generations)) manifest = parsed;
} catch {
  // First run (or corrupted manifest): start fresh.
}

// 1. Current generation = the hashed files this build just produced.
const currentFiles = fs
  .readdirSync(assetsDir)
  .filter((f) => !f.endsWith('.br') && !f.endsWith('.gz'))
  .sort();

const newest = manifest.generations[0];
const sameAsNewest =
  newest && newest.files.length === currentFiles.length &&
  newest.files.every((f, i) => f === currentFiles[i]);

let generations = manifest.generations;
if (!sameAsNewest) {
  generations = [
    { id: buildId, builtAt: new Date().toISOString(), files: currentFiles },
    ...generations,
  ];
} else {
  // Same bundle set rebuilt (e.g. repeated workspace builds): refresh the id
  // but keep the generation list stable.
  generations = [{ ...newest, id: buildId }, ...generations.slice(1)];
}
generations = generations.slice(0, 1 + KEEP_PREVIOUS);

// 2. Copy previous generations' files into dist/public/assets.
let retained = 0;
let missing = 0;
for (const gen of generations.slice(1)) {
  for (const file of gen.files) {
    const dest = path.join(assetsDir, file);
    if (fs.existsSync(dest)) continue; // current build (or newer gen) wins
    const src = path.join(storeDir, file);
    if (!fs.existsSync(src)) {
      missing++; // store predates this file (pre-retention build) — skip
      continue;
    }
    fs.copyFileSync(src, dest);
    retained++;
  }
}

// 3. Sync the store: add current files, prune unreferenced ones.
for (const file of currentFiles) {
  const dest = path.join(storeDir, file);
  if (!fs.existsSync(dest)) fs.copyFileSync(path.join(assetsDir, file), dest);
}
const referenced = new Set(generations.flatMap((g) => g.files));
let pruned = 0;
for (const file of fs.readdirSync(storeDir)) {
  if (!referenced.has(file)) {
    fs.rmSync(path.join(storeDir, file));
    pruned++;
  }
}

fs.writeFileSync(manifestPath, JSON.stringify({ generations }, null, 2) + '\n');
console.log(
  `retain-assets: ${generations.length - 1} previous generation(s) tracked — ` +
    `${retained} stale-HTML asset(s) carried into dist/public/assets` +
    `${missing ? ` (${missing} unavailable pre-retention file(s) skipped)` : ''}` +
    `${pruned ? `, ${pruned} expired file(s) pruned from the store` : ''}.`,
);
