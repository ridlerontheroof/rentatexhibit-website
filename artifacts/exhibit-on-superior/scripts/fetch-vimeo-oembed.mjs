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

// oEmbed upload_date is "YYYY-MM-DD HH:MM:SS" without a timezone; keep only
// the date part so we never assert a time offset we cannot verify.
const uploadDate = String(data.upload_date).slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
  console.error(`Unexpected upload_date format: ${data.upload_date}`);
  process.exit(1);
}

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
