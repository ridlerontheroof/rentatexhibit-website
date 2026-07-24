// Guard against the /virtual-tour VideoObject schema going stale if the
// leasing team swaps the Vimeo video or Vimeo rotates the thumbnail URL.
//
// The schema is built from the cached oEmbed snapshot in vimeo-oembed.json
// (see virtualTours.ts). This networked test re-fetches Vimeo's live oEmbed
// response and verifies the cached title/uploadDate/duration/videoId still
// match, and that the cached 1280x720 thumbnail URL still returns 200.
//
// If Vimeo is unreachable (offline/sandboxed CI), the checks are skipped
// gracefully — builds must never depend on Vimeo being up. On a genuine
// mismatch, the fix is: node scripts/fetch-vimeo-oembed.mjs

import { describe, it, expect } from 'vitest';
import vimeoOembed from './vimeo-oembed.json';

const REFRESH_HINT =
  'Cached Vimeo oEmbed data (src/data/vimeo-oembed.json) is stale. ' +
  'Re-run `node scripts/fetch-vimeo-oembed.mjs` in artifacts/exhibit-on-superior ' +
  'to refresh it, then review the /virtual-tour VideoObject schema output.';

const FETCH_TIMEOUT_MS = 10_000;

interface LiveOembed {
  title: string;
  upload_date: string;
  thumbnail_url: string;
  duration: number;
  video_id: number;
}

// null => network unreachable (skip); throws only on unexpected shapes.
async function fetchLiveOembed(): Promise<LiveOembed | null> {
  const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoOembed.videoUrl)}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    return null; // offline / DNS blocked — skip gracefully
  }
  if (res.status === 404) {
    throw new Error(
      `Vimeo returned 404 for ${vimeoOembed.videoUrl} — the video appears to have been ` +
        `removed or replaced. ${REFRESH_HINT}`,
    );
  }
  if (!res.ok) {
    // Transient Vimeo-side error (rate limit, 5xx): don't fail the build.
    return null;
  }
  return (await res.json()) as LiveOembed;
}

// null => network unreachable (skip)
async function headThumbnail(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res.status;
  } catch {
    return null;
  }
}

describe('cached Vimeo oEmbed snapshot matches the live video (networked, skips offline)', () => {
  it('live oEmbed metadata still matches vimeo-oembed.json', async () => {
    const live = await fetchLiveOembed();
    if (live === null) {
      console.warn('[vimeo-oembed-live] Vimeo unreachable — skipping live oEmbed check.');
      return;
    }

    expect(live.video_id, REFRESH_HINT).toBe(vimeoOembed.videoId);
    expect(live.title, REFRESH_HINT).toBe(vimeoOembed.title);
    expect(String(live.upload_date).slice(0, 10), REFRESH_HINT).toBe(vimeoOembed.uploadDate);
    expect(live.duration, REFRESH_HINT).toBe(vimeoOembed.durationSeconds);

    // The cached thumbnail is the live one with the size suffix swapped to
    // 1280x720 (see scripts/fetch-vimeo-oembed.mjs). Compare the stable image
    // hash portion so a rotated thumbnail is caught regardless of size.
    const liveBase = String(live.thumbnail_url).replace(/-d_\d+x\d+.*$/, '');
    const cachedBase = vimeoOembed.thumbnailUrl.replace(/-d_\d+x\d+.*$/, '');
    expect(cachedBase, REFRESH_HINT).toBe(liveBase);
  });

  it('cached 1280x720 thumbnail URL still returns 200', async () => {
    const status = await headThumbnail(vimeoOembed.thumbnailUrl);
    if (status === null) {
      console.warn('[vimeo-oembed-live] Vimeo CDN unreachable — skipping thumbnail check.');
      return;
    }
    expect(
      status,
      `Cached thumbnail URL no longer resolves (HTTP ${status}): ${vimeoOembed.thumbnailUrl}. ${REFRESH_HINT}`,
    ).toBe(200);
  });
});
