/**
 * AppFolio Reports API client for live unit availability.
 *
 * Calls the Unit Vacancy report (POST /api/v2/reports/unit_vacancy.json) on
 * the management company's AppFolio database using HTTP Basic auth, filters
 * the rows down to the Exhibit On Superior property, and normalizes them into
 * a small stable shape the web app can render.
 *
 * The report's column names are controlled by AppFolio and can drift, so the
 * normalizer matches keys tolerantly (case/format-insensitive substring
 * matching) instead of hard-coding exact column names.
 */

// The AppFolio database name comes from the management company's Duda CMS
// sync ("AppFolio Database: highlandrealestatepartners"), overridable via env
// if the database is ever renamed.
const APPFOLIO_DB = process.env.APPFOLIO_DATABASE ?? "highlandrealestatepartners";
const APPFOLIO_BASE = `https://${APPFOLIO_DB}.appfolio.com/api/v2/reports`;
const PROPERTY_MATCH = "exhibit";

export interface AvailableUnit {
  /** Apartment number, e.g. "0606" (pad2 floor + pad2 unit line). */
  unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  /** Advertised monthly rent in dollars. */
  rent: number | null;
  /** ISO date the unit becomes available, or null when unknown/now. */
  availableOn: string | null;
  /** Cover photo from the public AppFolio listing, when the unit is posted. */
  photoUrl: string | null;
  /** Public AppFolio listing detail page (full photo gallery), when posted. */
  listingUrl: string | null;
  /** YouTube video URL from the unit's marketing info, when set. */
  videoUrl: string | null;
  /** Full listing photo gallery (ordered), from the public listing page. */
  photos: string[];
}

export interface AvailabilityPayload {
  units: AvailableUnit[];
  updatedAt: string;
}

type Row = Record<string, unknown>;

/** Lower-case a key and strip everything that isn't a letter, for tolerant matching. */
function canon(key: string): string {
  return key.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Find the first value in the row whose canonical key contains any needle.
 * Needles prefixed with "=" must match the canonical key exactly (for short
 * abbreviations like "bd"/"ba" that would otherwise over-match).
 */
function pick(row: Row, needles: string[], exclude: string[] = []): unknown {
  for (const [key, value] of Object.entries(row)) {
    const c = canon(key);
    if (exclude.some((e) => c.includes(e))) continue;
    if (needles.some((n) => (n.startsWith("=") ? c === n.slice(1) : c.includes(n)))) return value;
  }
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    if (cleaned === "") return null;
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toDateString(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** True when the row belongs to the Exhibit property. */
export function isExhibitRow(row: Row): boolean {
  const prop = pick(row, ["property"], ["group", "id"]);
  if (typeof prop === "string") return prop.toLowerCase().includes(PROPERTY_MATCH);
  // When the report is already filtered upstream some views omit the property
  // column entirely; in that case keep the row.
  return prop === undefined;
}

/** Normalize one Unit Vacancy report row into an AvailableUnit. */
export function normalizeRow(row: Row): AvailableUnit | null {
  const unitRaw = pick(row, ["unitname", "unitnumber", "unit"], ["type", "status", "id", "visibility", "tags", "turn"]);
  const unit = typeof unitRaw === "string" ? unitRaw.trim() : typeof unitRaw === "number" ? String(unitRaw) : "";
  if (!unit) return null;

  // Units already re-rented (status "Vacant-Rented"/"Notice-Rented") are not
  // available — a new lease is signed, so never advertise them.
  const status = pick(row, ["unitstatus"]);
  if (typeof status === "string") {
    const s = status.toLowerCase();
    if (s.includes("rented") && !s.includes("unrented")) return null;
  }

  // Beds/baths arrive combined as "2/2.00" in the unit_vacancy detail view.
  let bedrooms: number | null = null;
  let bathrooms: number | null = null;
  const bedAndBath = pick(row, ["bedandbath"]);
  if (typeof bedAndBath === "string" && bedAndBath.includes("/")) {
    const [b, ba] = bedAndBath.split("/");
    bedrooms = toNumber(b);
    bathrooms = toNumber(ba);
  }
  bedrooms ??= toNumber(pick(row, ["bed", "=bd"], ["bedandbath"]));
  bathrooms ??= toNumber(pick(row, ["bath", "=ba"], ["bedandbath"]));

  // "available_on" is often null for occupied units on notice; fall back to
  // the unit-turn target date (day after move-out) so we never claim
  // "available now" for a home someone still lives in.
  const availableOn =
    toDateString(pick(row, ["availableon", "availabledate"], ["days"])) ??
    toDateString(pick(row, ["unitturntargetdate"])) ??
    toDateString(pick(row, ["lastmoveout", "moveout"], ["days", "lastmovein"]));

  return {
    unit,
    bedrooms,
    bathrooms,
    sqft: toNumber(pick(row, ["sqft", "squarefeet", "squarefootage"])),
    rent: toNumber(pick(row, ["advertisedrent", "marketrent", "rent"], ["deposit", "historical", "monthlease", "noleaseterm"])),
    availableOn,
    photoUrl: null,
    listingUrl: null,
    videoUrl: null,
    photos: [],
  };
}

export interface ListingMedia {
  photoUrl: string | null;
  listingUrl: string | null;
}

/**
 * Parse the public AppFolio listings page (the same page the official
 * embed widget iframes) into a map of apartment number → cover photo +
 * listing detail URL. Each card wraps its image in an anchor to
 * /listings/detail/<uuid>; the image alt text carries "Apt. NNNN".
 */
export function parseListingsHtml(html: string): Map<string, ListingMedia> {
  const media = new Map<string, ListingMedia>();
  const cardRe =
    /href="(\/listings\/detail\/[a-f0-9-]+)"[^>]*>[\s\S]*?data-original="(https:\/\/images\.cdn\.appfolio\.com\/[^"]+)"[^>]*alt="[^"]*Apt\.?\s*([0-9]+)/g;
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html)) !== null) {
    const [, detailPath, photoUrl, unit] = m;
    if (!media.has(unit)) {
      media.set(unit, {
        photoUrl,
        listingUrl: `https://${APPFOLIO_DB}.appfolio.com${detailPath}`,
      });
    }
  }
  return media;
}

/**
 * Extract the ordered, deduplicated gallery photo URLs from a public listing
 * detail page. Gallery images live under leads_marketing_photos/<uuid>/ on
 * AppFolio's public image CDN.
 */
export function parseDetailPhotos(html: string): string[] {
  const re = /https:\/\/images\.cdn\.appfolio\.com\/[^"'\s>]*leads_marketing_photos\/[a-f0-9-]+\/original\.jpg/g;
  const seen = new Set<string>();
  const photos: string[] = [];
  for (const m of html.match(re) ?? []) {
    if (!seen.has(m)) {
      seen.add(m);
      photos.push(m);
    }
  }
  return photos;
}

/** Fetch a listing detail page's photo gallery. Public page, no credentials. */
async function fetchDetailPhotos(listingUrl: string): Promise<string[]> {
  const res = await fetch(listingUrl, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`AppFolio listing detail page failed: status ${res.status}`);
  return parseDetailPhotos(await res.text());
}

/**
 * Fetch listing media from the public listings page, filtered to the Exhibit
 * property group. Public page, no credentials attached. Failures are
 * non-fatal — availability renders fine without photos.
 */
async function fetchListingMedia(): Promise<Map<string, ListingMedia>> {
  const url = `https://${APPFOLIO_DB}.appfolio.com/listings?${encodeURIComponent("filters[property_list]")}=${encodeURIComponent("Exhibit")}`;
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`AppFolio public listings page failed: status ${res.status}`);
  return parseListingsHtml(await res.text());
}

export interface UnitMarketing {
  /** Units flagged "Posted to Website" in AppFolio. */
  posted: Set<string>;
  /** Unit → YouTube video URL, when set. */
  videos: Map<string, string>;
}

/** Fetch posted-to-website flags + YouTube URLs from the Unit Directory report. */
async function fetchUnitMarketing(auth: string): Promise<UnitMarketing> {
  const response = await postReport(`${APPFOLIO_BASE}/unit_directory.json`, auth, "{}");
  const posted = new Set<string>();
  const videos = new Map<string, string>();
  for (const row of response.results ?? []) {
    if (!isExhibitRow(row)) continue;
    const unitRaw = pick(row, ["unitname", "unitnumber", "unit"], ["type", "status", "id", "visibility", "tags", "turn"]);
    const unit = typeof unitRaw === "string" ? unitRaw.trim() : typeof unitRaw === "number" ? String(unitRaw) : "";
    if (!unit) continue;
    const postedFlag = pick(row, ["postedtowebsite"]);
    if (typeof postedFlag === "string" && postedFlag.trim().toLowerCase() === "yes") {
      posted.add(unit);
    }
    const video = pick(row, ["youtube"]);
    if (typeof video === "string" && video.trim().startsWith("http")) {
      videos.set(unit, video.trim());
    }
  }
  return { posted, videos };
}

interface ReportResponse {
  results?: Row[];
  next_page_url?: string | null;
}

/**
 * Only follow pagination URLs that stay on the AppFolio database host over
 * HTTPS — the Basic auth header is attached to every page request, so an
 * unexpected next_page_url must never be able to send credentials elsewhere.
 */
export function isSafeNextPageUrl(url: string): boolean {
  try {
    const parsed = new URL(url, APPFOLIO_BASE);
    const base = new URL(APPFOLIO_BASE);
    return parsed.protocol === "https:" && parsed.host === base.host;
  } catch {
    return false;
  }
}

async function postReport(url: string, auth: string, body: string): Promise<ReportResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error(`AppFolio unit_vacancy request failed: status ${res.status}, content-type ${contentType}`);
  }
  return (await res.json()) as ReportResponse;
}

/** Fetch and normalize the current available units from AppFolio. */
export async function fetchAvailability(clientId: string, clientSecret: string): Promise<AvailabilityPayload> {
  const auth = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const rows: Row[] = [];
  let response = await postReport(
    `${APPFOLIO_BASE}/unit_vacancy.json`,
    auth,
    JSON.stringify({ level_of_detail: "detail_view", unit_visibility: "active" }),
  );
  rows.push(...(response.results ?? []));
  // Follow pagination (5,000-row pages; effectively one page for a single
  // property, but stay correct if the report ever grows).
  let guard = 0;
  while (response.next_page_url && guard < 10) {
    if (!isSafeNextPageUrl(response.next_page_url)) {
      throw new Error("AppFolio returned an unexpected next_page_url host; refusing to follow it");
    }
    response = await postReport(new URL(response.next_page_url, APPFOLIO_BASE).toString(), auth, "{}");
    rows.push(...(response.results ?? []));
    guard += 1;
  }

  const allUnits = rows
    .filter(isExhibitRow)
    .map(normalizeRow)
    .filter((u): u is AvailableUnit => u !== null)
    .sort((a, b) => a.unit.localeCompare(b.unit));

  // Marketing info (posted-to-website flags + video) and public listing media.
  const [mediaResult, marketingResult] = await Promise.allSettled([fetchListingMedia(), fetchUnitMarketing(auth)]);
  const media = mediaResult.status === "fulfilled" ? mediaResult.value : new Map<string, ListingMedia>();
  const marketing = marketingResult.status === "fulfilled" ? marketingResult.value : null;

  // Only show units the leasing team has explicitly posted to the website.
  // The posted flag comes from the Unit Directory report; presence on the
  // public listings page means the same thing, so accept either signal.
  // If both sources failed we cannot know what is posted — fail the refresh
  // so the route keeps serving the last good snapshot instead of guessing.
  if (!marketing && media.size === 0) {
    throw new Error("AppFolio posted-to-website sources unavailable; keeping last snapshot");
  }
  const units = allUnits.filter((u) => media.has(u.unit) || marketing?.posted.has(u.unit));

  for (const unit of units) {
    const m = media.get(unit.unit);
    if (m) {
      unit.photoUrl = m.photoUrl;
      unit.listingUrl = m.listingUrl;
    }
    unit.videoUrl = marketing?.videos.get(unit.unit) ?? null;
  }

  // Pull each posted unit's full photo gallery from its public detail page
  // (sequential — a handful of pages, and it keeps us polite to their CDN).
  // Best-effort per unit: a failed gallery leaves photos empty and the
  // frontend falls back to linking out.
  for (const unit of units) {
    if (!unit.listingUrl) continue;
    try {
      unit.photos = await fetchDetailPhotos(unit.listingUrl);
    } catch {
      unit.photos = [];
    }
  }

  return { units, updatedAt: new Date().toISOString() };
}
