#!/usr/bin/env node
// Refresh the cached Vimeo oEmbed metadata for the "Life at Exhibit On
// Superior" video (src/data/vimeo-oembed.json). The cached file is committed
// so builds stay deterministic and never depend on Vimeo being reachable;
// re-run this script if the video is replaced or its thumbnail changes.
//
// Usage: node scripts/fetch-vimeo-oembed.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const VIDEO_URL = 'https://vimeo.com/968009600';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'vimeo-oembed.json');

const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(VIDEO_URL)}`);
if (!res.ok) {
  console.error(`Vimeo oEmbed request failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const data = await res.json();

for (const key of ['title', 'upload_date', 'thumbnail_url', 'duration', 'video_id']) {
  if (data[key] === undefined || data[key] === null || data[key] === '') {
    console.error(`Vimeo oEmbed response missing required field: ${key}`);
    process.exit(1);
  }
}

// oEmbed upload_date is "YYYY-MM-DD HH:MM:SS" wall-clock time with no
// timezone. Vimeo documents its simple-API/oEmbed timestamps as US Eastern
// time (America/New_York), so we derive a full ISO-8601 uploadDate with the
// correct EST/EDT offset for that instant — Search Console fails validation
// on date-only uploadDate values ("missing a timezone"). We cross-check the
// wall time against Vimeo's simple API v2 (same source, second endpoint) so
// a silent format/semantics change is caught here rather than shipped.
const wall = String(data.upload_date);
const wallMatch = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(wall);
if (!wallMatch) {
  console.error(`Unexpected upload_date format: ${data.upload_date}`);
  process.exit(1);
}

// Cross-check: the v2 simple API reports the same wall-clock upload_date.
try {
  const v2res = await fetch(`https://vimeo.com/api/v2/video/${data.video_id}.json`);
  if (v2res.ok) {
    const [v2] = await v2res.json();
    if (v2?.upload_date && v2.upload_date !== wall) {
      console.error(
        `upload_date mismatch between oEmbed ("${wall}") and simple API v2 ` +
          `("${v2.upload_date}") — refusing to guess which is truthful.`,
      );
      process.exit(1);
    }
  }
} catch {
  // v2 endpoint unreachable — non-fatal, oEmbed remains the source.
}

/**
 * Interpret a wall-clock "YYYY-MM-DD HH:MM:SS" in America/New_York and return
 * a full ISO-8601 string with the correct UTC offset (handles EST vs EDT).
 */
function easternWallTimeToIso(m) {
  const [, Y, Mo, D, H, Mi, S] = m.map(Number);
  // Start from the wall time read as UTC, then correct by the zone offset at
  // that instant (iterate once more in case the guess straddles a DST switch).
  let utc = Date.UTC(Y, Mo - 1, D, H, Mi, S);
  for (let i = 0; i < 2; i++) {
    const offsetMin = tzOffsetMinutes(new Date(utc), 'America/New_York');
    const corrected = Date.UTC(Y, Mo - 1, D, H, Mi, S) - offsetMin * 60_000;
    if (corrected === utc) break;
    utc = corrected;
  }
  const offsetMin = tzOffsetMinutes(new Date(utc), 'America/New_York');
  const sign = offsetMin < 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${sign}${oh}:${om}`;
}

/** UTC offset (minutes, e.g. -240 for EDT) of a timezone at a given instant. */
function tzOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - date.getTime()) / 60_000);
}

const uploadDate = easternWallTimeToIso(wallMatch);

// Request a larger thumbnail than the default 295x166 (Google wants >=1200px
// wide where possible; Vimeo serves arbitrary sizes via the -d_WxH suffix).
const thumbnailUrl = String(data.thumbnail_url).replace(/-d_\d+x\d+/, '-d_1280x720');

const cached = {
  videoId: data.video_id,
  videoUrl: VIDEO_URL,
  title: data.title,
  uploadDate,
  thumbnailUrl,
  durationSeconds: data.duration,
  fetchedAt: new Date().toISOString(),
};

writeFileSync(OUT, JSON.stringify(cached, null, 2) + '\n');
console.log(`Wrote ${OUT}`);
console.log(JSON.stringify(cached, null, 2));
