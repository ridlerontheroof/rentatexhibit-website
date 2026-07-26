// IndexNow integration: tell Bing/Copilot (and other IndexNow-participating
// engines) the moment availability-relevant pages change, instead of waiting
// for a recrawl.
//
// The key file is hosted by the web artifact at
// artifacts/exhibit-on-superior/public/<KEY>.txt — a parity test
// (indexnow.test.ts) asserts the two never drift.
import type { AvailabilityPayload } from "./appfolio";

export const INDEXNOW_KEY = "fc45d4f042a0d056c865fb0b348a0065";

export const SITE_URL = "https://www.rentatexhibit.com";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Pages whose content is driven by the availability feed. */
export const AVAILABILITY_URLS = [`${SITE_URL}/`, `${SITE_URL}/available-units`];

/**
 * The sitemap's key URLs, submitted once per publish (process start in
 * production) so engines learn about every indexable page promptly.
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
];

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
    // IndexNow returns 200 or 202 on acceptance.
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
  if (!prev) return false; // nothing to compare against (cold start)
  return inventoryFingerprint(prev) !== inventoryFingerprint(next);
}

/** Canonical URL of a unit's own prerendered page. */
export function unitPageUrl(unit: string): string {
  return `${SITE_URL}/available-units/${unit}`;
}

/**
 * Per-unit page URLs affected by an inventory change: units added, removed
 * (rented), re-priced, or re-dated between two snapshots. Removed units are
 * included deliberately — their page turns into a "no longer available"
 * notice and engines should recrawl it promptly.
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
 * production so dev/test refreshes never spam the endpoint. `extraUrls`
 * carries the specific per-unit pages affected by this change.
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
