// Guard against dead Matterport tour links on /virtual-tour.
//
// The visible iframes AND the ItemList JSON-LD are both built from
// `matterportTours` in virtualTours.ts, so if Matterport removes or re-shares
// a space (new ?m= id), visitors hit a blank embed and the structured data
// points at a dead resource. This networked test verifies each tour URL still
// resolves — following the pattern in vimeo-oembed-live.test.ts.
//
// If Matterport is unreachable (offline/sandboxed CI), the checks are skipped
// gracefully — builds must never depend on Matterport being up. On a genuine
// 404/410, the fix is: update the dead entry in `matterportTours` in
// src/data/virtualTours.ts with the space's new share URL.

import { describe, it, expect } from 'vitest';
import { matterportTours } from './virtualTours';

const FETCH_TIMEOUT_MS = 10_000;

function fixHint(tourName: string): string {
  return (
    `The Matterport space for "${tourName}" appears to have been removed or ` +
    `re-shared under a new URL. Update its entry in \`matterportTours\` in ` +
    `artifacts/exhibit-on-superior/src/data/virtualTours.ts with the current ` +
    `share URL from the Matterport account.`
  );
}

// null => network unreachable / transient server error (skip gracefully)
async function fetchStatus(url: string): Promise<number | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return null; // offline / DNS blocked
  }
  if (
    res.status >= 500 ||
    res.status === 429 ||
    res.status === 401 ||
    res.status === 403
  ) {
    // Matterport can deny automated requests to the public /show/ shell even
    // while the space remains published. The player-model, name, and poster
    // checks below are the authoritative dead-space checks.
    return null;
  }
  return res.status;
}

function spaceIdFrom(url: string): string {
  return new URL(url).searchParams.get('m') ?? '';
}

interface PlayerModel {
  name?: string;
  status?: string;
  image?: string;
}

// Fetch a poster image URL. Returns:
// - `{ ok, httpStatus, contentType }` on a definitive response,
// - null on offline / transient errors (skip gracefully).
async function fetchImageInfo(
  url: string,
): Promise<{ httpStatus: number; contentType: string } | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return null; // offline / DNS blocked
  }
  if (res.status >= 500 || res.status === 429) {
    return null; // transient CDN-side error: don't fail the build
  }
  // Drain the body so the connection can be reused/closed cleanly.
  try {
    await res.arrayBuffer();
  } catch {
    // Body errors don't affect the status/content-type verdict.
  }
  return {
    httpStatus: res.status,
    contentType: res.headers.get('content-type') ?? '',
  };
}

// Fetch the public player-models API for a space. Returns:
// - the parsed model on success,
// - `{ httpStatus }` when Matterport gave a definitive client error (dead id),
// - null on offline / transient errors (skip gracefully).
// Pass `bustCache: true` when you need the signed asset URLs inside the
// response (e.g. `image`) to be fresh: Matterport's CDN caches this endpoint,
// and a cached response can carry already-expired signed URLs (HTTP 410).
async function fetchPlayerModel(
  spaceId: string,
  opts: { bustCache?: boolean } = {},
): Promise<PlayerModel | { httpStatus: number } | null> {
  const cacheBust = opts.bustCache
    ? `?_ts=${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    : '';
  let res: Response;
  try {
    res = await fetch(`https://my.matterport.com/api/player/models/${spaceId}${cacheBust}`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return null; // offline / DNS blocked
  }
  if (res.status >= 500 || res.status === 429) {
    return null; // transient Matterport-side error: don't fail the build
  }
  if (!res.ok) {
    return { httpStatus: res.status };
  }
  try {
    return (await res.json()) as PlayerModel;
  } catch {
    return null; // malformed/interrupted body — treat as transient
  }
}

describe('Matterport tour URLs on /virtual-tour still resolve (networked, skips offline)', () => {
  it('has the expected tour list shape', () => {
    expect(matterportTours.length).toBeGreaterThan(0);
    for (const tour of matterportTours) {
      expect(
        tour.url,
        `Tour "${tour.name}" URL should be a Matterport player URL with an ?m= space id`,
      ).toMatch(/^https:\/\/my\.matterport\.com\/show\/\?m=[A-Za-z0-9]+$/);
    }
  });

  for (const tour of matterportTours) {
    it(`"${tour.name}" (${tour.url}) still resolves`, async () => {
      const status = await fetchStatus(tour.url);
      if (status === null) {
        console.warn(
          `[matterport-tours-live] Matterport unreachable — skipping live check for "${tour.name}".`,
        );
        return;
      }
      expect(
        status,
        `Matterport returned HTTP ${status} for ${tour.url}. ${fixHint(tour.name)}`,
      ).toBe(200);
    });

    it(`"${tour.name}" player-models API shows a viewable space with a matching name`, async () => {
      const spaceId = spaceIdFrom(tour.url);
      const model = await fetchPlayerModel(spaceId);
      if (model === null) {
        console.warn(
          `[matterport-tours-live] Matterport unreachable — skipping content check for "${tour.name}".`,
        );
        return;
      }
      if ('httpStatus' in model) {
        expect.fail(
          `Matterport player-models API returned HTTP ${model.httpStatus} for space ` +
            `${spaceId}. ${fixHint(tour.name)}`,
        );
      }
      expect(
        model.status,
        `Matterport reports space ${spaceId} ("${tour.name}") has status ` +
          `"${model.status}" instead of "viewable" — the tour may be unpublished ` +
          `or processing. ${fixHint(tour.name)}`,
      ).toBe('viewable');
      const expectedName = tour.matterportName ?? tour.name;
      expect(
        model.name,
        `Matterport space ${spaceId} is now named "${model.name}", but the site expects ` +
          `"${expectedName}" (shown as "${tour.name}") — the space id may have been ` +
          `re-used for a different apartment. Update the name/matterportName or URL in ` +
          `\`matterportTours\` in artifacts/exhibit-on-superior/src/data/virtualTours.ts ` +
          `so visitors see the right unit.`,
      ).toBe(expectedName);
    });

    it(`"${tour.name}" poster image from player-models still resolves as an image`, async () => {
      const spaceId = spaceIdFrom(tour.url);
      // bustCache: the image URL is signed with a short-lived token; a CDN-cached
      // response would hand us an already-expired URL and 410.
      const model = await fetchPlayerModel(spaceId, { bustCache: true });
      if (model === null) {
        console.warn(
          `[matterport-tours-live] Matterport unreachable — skipping poster image check for "${tour.name}".`,
        );
        return;
      }
      if ('httpStatus' in model) {
        // The dead-id failure is already reported by the content check above;
        // don't double-fail here.
        return;
      }
      expect(
        model.image,
        `Matterport player-models API no longer returns an \`image\` URL for space ` +
          `${spaceId} ("${tour.name}") — the tour preview/poster may render blank. ` +
          fixHint(tour.name),
      ).toMatch(/^https:\/\//);
      const info = await fetchImageInfo(model.image!);
      if (info === null) {
        console.warn(
          `[matterport-tours-live] Poster image CDN unreachable — skipping image check for "${tour.name}".`,
        );
        return;
      }
      expect(
        info.httpStatus,
        `Matterport poster image for "${tour.name}" (${model.image}) returned HTTP ` +
          `${info.httpStatus} — visitors may see a blank/broken preview. ${fixHint(tour.name)}`,
      ).toBe(200);
      expect(
        info.contentType,
        `Matterport poster image for "${tour.name}" (${model.image}) returned ` +
          `content-type "${info.contentType}" instead of an image — visitors may see a ` +
          `blank/broken preview. ${fixHint(tour.name)}`,
      ).toMatch(/^image\//);
    });
  }
});
