#!/usr/bin/env node
// Refresh the cached YouTube metadata for the per-unit video tours
// (src/data/youtube-metadata.json). Google's VideoObject rich results require
// a truthful uploadDate and thumbnailUrl, which AppFolio does not provide —
// so, mirroring scripts/fetch-vimeo-oembed.mjs, we source them from YouTube
// itself and commit the cache so builds stay deterministic and never depend
// on YouTube being reachable.
//
// The set of videos comes from the committed availability snapshot
// (src/data/availabilitySnapshot.json); re-run this script after the snapshot
// picks up units with new tour videos. Units whose video id is missing from
// the cache simply ship without a VideoObject node (never a build failure).
//
// Usage:
//   node scripts/fetch-youtube-metadata.mjs                  # full refresh (fatal on any failure)
//   node scripts/fetch-youtube-metadata.mjs --missing-only   # only fetch ids absent from the cache,
//                                                            # keep existing entries, never fail
//                                                            # (used by fetch-availability-snapshot.mjs)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = join(ROOT, 'src', 'data', 'availabilitySnapshot.json');
const OUT = join(ROOT, 'src', 'data', 'youtube-metadata.json');

// Same ID extraction rules as src/lib/youtube.ts (kept in sync by the vitest
// suite src/data/unit-video-jsonld.test.ts, which cross-checks both).
function videoId(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, '');
  const isValid = (id) => !!id && /^[A-Za-z0-9_-]{6,20}$/.test(id);
  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/')[1];
    return isValid(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = parsed.searchParams.get('v');
    if (isValid(v)) return v;
    const m = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    return m && isValid(m[1]) ? m[1] : null;
  }
  return null;
}

const missingOnly = process.argv.includes('--missing-only');

const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
const units = Array.isArray(snapshot) ? snapshot : snapshot.units;
const ids = new Map(); // id -> canonical watch URL
for (const u of units) {
  if (!u.videoUrl) continue;
  const id = videoId(u.videoUrl);
  if (id) ids.set(id, `https://www.youtube.com/watch?v=${id}`);
}
if (ids.size === 0) {
  console.error('No YouTube video URLs found in the availability snapshot.');
  process.exit(missingOnly ? 0 : 1);
}

// In --missing-only mode, keep every existing cache entry (even for ids no
// longer in the snapshot — a full refresh prunes those) and only fetch ids
// the cache doesn't know about yet. Nothing to do → don't rewrite the file,
// so fetchedAt doesn't churn on every snapshot refresh.
const existing =
  missingOnly && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { videos: {} };
if (missingOnly) {
  for (const id of ids.keys()) {
    if (existing.videos?.[id]) ids.delete(id);
  }
  if (ids.size === 0) {
    console.log('YouTube metadata cache already covers all snapshot videos; nothing to fetch.');
    process.exit(0);
  }
}

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';

/** First match of a JSON string field like "uploadDate":"..." in the page. */
function jsonField(html, field) {
  const m = html.match(new RegExp(`"${field}":"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? JSON.parse(`"${m[1]}"`) : null;
}

async function fetchVideo(id, watchUrl) {
  const res = await fetch(watchUrl, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`watch page fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const uploadDateRaw = jsonField(html, 'uploadDate');
  const title = jsonField(html, 'title');
  const lengthSeconds = jsonField(html, 'lengthSeconds');
  if (!uploadDateRaw || !title || !lengthSeconds) {
    throw new Error(`could not parse uploadDate/title/lengthSeconds from watch page`);
  }
  // Keep only the date part: the microformat timestamp carries YouTube's
  // studio timezone offset, which we should not assert more precisely than
  // the day (mirrors the Vimeo cache).
  const uploadDate = String(uploadDateRaw).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
    throw new Error(`unexpected uploadDate format: ${uploadDateRaw}`);
  }

  // Prefer the 1280x720 maxresdefault thumbnail (Google recommends >=1200px
  // wide); fall back to the always-present 480x360 hqdefault.
  let thumbnailUrl = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const head = await fetch(thumbnailUrl, { method: 'HEAD', headers: { 'user-agent': UA } });
  if (!head.ok) thumbnailUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return {
    videoUrl: watchUrl,
    title,
    uploadDate,
    thumbnailUrl,
    durationSeconds: Number(lengthSeconds),
  };
}

const videos = missingOnly ? { ...existing.videos } : {};
let fetched = 0;
for (const [id, watchUrl] of [...ids.entries()].sort()) {
  try {
    videos[id] = await fetchVideo(id, watchUrl);
    fetched += 1;
    console.log(`ok ${id}: ${videos[id].title} (${videos[id].uploadDate})`);
  } catch (err) {
    console.error(`${missingOnly ? 'WARN' : 'FAILED'} ${id}: ${err.message}`);
    if (!missingOnly) process.exitCode = 1;
  }
}
if (process.exitCode) process.exit(process.exitCode);
// --missing-only: if every fetch failed (e.g. YouTube unreachable), keep the
// committed cache untouched and exit 0 — pages for the new video ship without
// a VideoObject node until the next refresh, never a broken build.
if (missingOnly && fetched === 0) {
  console.warn('WARN no new YouTube metadata could be fetched; keeping the existing cache.');
  process.exit(0);
}

const cached = { fetchedAt: new Date().toISOString(), videos };
writeFileSync(OUT, JSON.stringify(cached, null, 2) + '\n');
console.log(`Wrote ${OUT}`);
