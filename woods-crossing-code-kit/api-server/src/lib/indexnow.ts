// IndexNow integration: tell Bing/Copilot (and other IndexNow-participating
// engines) the moment availability-relevant pages change, instead of waiting
// for a recrawl.
//
// PROPERTY CONFIG: four values must be supplied below:
//   1. INDEXNOW_KEY   — generate a fresh key at https://www.indexnow.org/
//   2. SITE_URL       — your production www domain
//   3. AVAILABILITY_URLS  — your availability page URLs
//   4. CORE_SITEMAP_URLS  — your full sitemap URL list
//
// After replacing INDEXNOW_KEY, also create public/<KEY>.txt in the web
// artifact containing only the key on one line (the indexnow.test.ts guard
// asserts the two are in sync).
import type { AvailabilityPayload } from "./appfolio";

// PROPERTY CONFIG: generate a property key at https://www.indexnow.org/
// and host it at https://www.yourdomain.com/<key>.txt
// Then set the INDEXNOW_KEY env var.
const _INDEXNOW_KEY = process.env.INDEXNOW_KEY?.trim() || "";
if (!_INDEXNOW_KEY && process.env.NODE_ENV === "production") {
  throw new Error(
    "INDEXNOW_KEY env var is required but not set. " +
    "Generate a key at https://www.indexnow.org/, host <key>.txt at your domain root, " +
    "and set this env var to that key string.",
  );
}
export const INDEXNOW_KEY = _INDEXNOW_KEY;

// Read canonical www URL from SITE_URL env var (property-config identity.canonicalOrigin).
const _SITE_URL = process.env.SITE_URL?.trim();
if (!_SITE_URL) {
  throw new Error(
    "SITE_URL env var is required but not set. " +
    "Set it to your canonical www origin (identity.canonicalOrigin from property-config.json).",
  );
}
export const SITE_URL = _SITE_URL;

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Pages whose content is driven by the availability feed. */
// PROPERTY CONFIG: update to match the site's availability page paths
export const AVAILABILITY_URLS = [`${SITE_URL}/`, `${SITE_URL}/available-units`];

/**
 * The sitemap's key URLs, submitted once per publish so engines learn about
 * every indexable page promptly.
 * PROPERTY CONFIG: replace this list with the site's actual page paths.
 */
export const CORE_SITEMAP_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/available-units`,
  `${SITE_URL}/photo-gallery`,
  `${SITE_URL}/virtual-tour`,
  `${SITE_URL}/amenities`,
  `${SITE_URL}/pet-friendly`,
  `${SITE_URL}/neighborhood`,
  `${SITE_URL}/apartment-guide`,
  `${SITE_URL}/fees`,
  `${SITE_URL}/parking-transportation`,
  `${SITE_URL}/application-guide`,
  `${SITE_URL}/faq`,
  `${SITE_URL}/contact-us`,
  `${SITE_URL}/map-directions`,
  `${SITE_URL}/residents`,
  `${SITE_URL}/schedule-a-tour`,
  `${SITE_URL}/reviews`,
]; // PROPERTY CONFIG: replace with the site's verified page list

type MinimalLog = {
  info: (o: object, msg: string) => void;
  warn: (o: object, msg: string) => void;
};

const noopLog: MinimalLog = { info: () => {}, warn: () => {} };

/**
 * Submit URLs to IndexNow. Never throws — indexing pings are best-effort and
 * must not disturb the availability pipeline. Returns true when the endpoint
 * accepted the submission.
 */
export async function pingIndexNow(urls: string[], log: MinimalLog = noopLog): Promise<boolean> {
  if (urls.length === 0) return false;
  if (!INDEXNOW_KEY) {
    log.warn({ urls }, "IndexNow submission skipped outside production: INDEXNOW_KEY is not configured");
    return false;
  }
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    if (res.ok || res.status === 202) {
      log.info({ urls, status: res.status }, "IndexNow submission accepted");
      return true;
    }
    log.warn({ urls, status: res.status }, "IndexNow submission rejected");
    return false;
  } catch (err) {
    log.warn({ err, urls }, "IndexNow submission failed");
    return false;
  }
}

/**
 * Stable inventory fingerprint: unit id + rent + available date. New units,
 * rented (disappeared) units, and re-priced or re-dated units all change it;
 * photo/description churn does not.
 */
export function inventoryFingerprint(payload: AvailabilityPayload): string {
  return payload.units
    .map((u) => `${u.unit}|${u.rent ?? ""}|${u.availableOn ?? ""}`)
    .sort()
    .join("\n");
}

/**
 * True when the two snapshots differ in inventory terms (units added,
 * removed, re-priced, or re-dated).
 */
export function inventoryChanged(
  prev: AvailabilityPayload | null,
  next: AvailabilityPayload,
): boolean {
  if (!prev) return false;
  return inventoryFingerprint(prev) !== inventoryFingerprint(next);
}

/** Canonical URL of a unit's own prerendered page. */
export function unitPageUrl(unit: string): string {
  return `${SITE_URL}/available-units/${unit}`;
}

/**
 * Per-unit page URLs affected by an inventory change.
 */
export function changedUnitUrls(
  prev: AvailabilityPayload | null,
  next: AvailabilityPayload,
): string[] {
  if (!prev) return [];
  const fingerprint = (u: AvailabilityPayload["units"][number]) =>
    `${u.rent ?? ""}|${u.availableOn ?? ""}`;
  const prevByUnit = new Map(prev.units.map((u) => [u.unit, fingerprint(u)]));
  const nextByUnit = new Map(next.units.map((u) => [u.unit, fingerprint(u)]));
  const changed: string[] = [];
  for (const [unit, fp] of nextByUnit) {
    if (!prevByUnit.has(unit) || prevByUnit.get(unit) !== fp) changed.push(unitPageUrl(unit));
  }
  for (const unit of prevByUnit.keys()) {
    if (!nextByUnit.has(unit)) changed.push(unitPageUrl(unit));
  }
  return changed;
}

/**
 * Fire-and-forget IndexNow ping for an availability change. Skipped outside
 * production so dev/test refreshes never spam the endpoint.
 */
export function notifyAvailabilityChanged(log: MinimalLog = noopLog, extraUrls: string[] = []): void {
  if (process.env.NODE_ENV !== "production") return;
  void pingIndexNow([...AVAILABILITY_URLS, ...extraUrls], log);
}

/** One-shot per process: submit the sitemap's key URLs after a publish. */
let corePingDone = false;

export function submitCoreUrlsOnce(log: MinimalLog = noopLog): void {
  if (corePingDone || process.env.NODE_ENV !== "production") return;
  corePingDone = true;
  void pingIndexNow(CORE_SITEMAP_URLS, log);
}

/** Test-only: reset the one-shot latch. */
export function resetIndexNowForTests(): void {
  corePingDone = false;
}
