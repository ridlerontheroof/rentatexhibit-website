/**
 * AppFolio Reports API client for live unit availability.
 *
 * Calls the Unit Vacancy report (POST /api/v2/reports/unit_vacancy.json) on
 * the management company's AppFolio database using HTTP Basic auth, filters
 * the rows down to the property, and normalizes them into a small stable shape
 * the web app can render.
 *
 * The report's column names are controlled by AppFolio and can drift, so the
 * normalizer matches keys tolerantly (case/format-insensitive substring
 * matching) instead of hard-coding exact column names.
 *
 * Property-specific values are required through environment configuration.
 */

import { recordFeeCopyCheck, reportStrippedFeeCopy } from "./feeCopyAlert";
import { DEFAULT_LEAD_SOURCE } from "./leadSource";
import { isTourUnitName } from "./tourUnit";

// PROPERTY CONFIG: set APPFOLIO_DATABASE to the management company's
// AppFolio database name (visible in your AppFolio portal URL:
// <database>.appfolio.com). Maps to property-config appfolio.database.
const _APPFOLIO_DATABASE = process.env.APPFOLIO_DATABASE?.trim();
if (!_APPFOLIO_DATABASE) {
  throw new Error(
    "APPFOLIO_DATABASE env var is required but not set. " +
    "Set it to your management company's AppFolio database name " +
    "(the subdomain prefix in your AppFolio portal URL, e.g. \"propertymanagement\"). " +
    "Maps to appfolio.database in property-config.json.",
  );
}
const APPFOLIO_DB = _APPFOLIO_DATABASE;
const APPFOLIO_BASE = `https://${APPFOLIO_DB}.appfolio.com/api/v2/reports`;

// Exact property name used for AppFolio's filters[property_list] and for
// row-level filtering in isPropertyRow(). Maps to property-config
// appfolio.propertyName. Set via APPFOLIO_PROPERTY_NAME env var.
// The substring match is lowercased for case-insensitive comparison.
const _APPFOLIO_PROPERTY_NAME = process.env.APPFOLIO_PROPERTY_NAME?.trim();
if (!_APPFOLIO_PROPERTY_NAME) {
  throw new Error(
    "APPFOLIO_PROPERTY_NAME env var is required but not set. " +
    "Set it to the exact property name shown in AppFolio (appfolio.propertyName from property-config.json).",
  );
}
/** Exact property name for the AppFolio listings filter (e.g. "Example Property"). */
const APPFOLIO_PROPERTY_NAME = _APPFOLIO_PROPERTY_NAME;
/** Lowercase substring for tolerant row-level filtering. */
const PROPERTY_MATCH = APPFOLIO_PROPERTY_NAME.toLowerCase();

export interface AvailableUnit {
  /** Apartment number as AppFolio writes it. */
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
  /** Listing info sections (Rental Terms, Pet Policy, Amenities, …). */
  details: DetailSection[];
  /** Listing headline from the public detail page, when posted. */
  marketingTitle: string | null;
  /** Listing description from the public detail page, when posted. */
  description: string | null;
}

export interface DetailSection {
  title: string;
  items: string[];
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

/** True when the row belongs to this property. */
export function isPropertyRow(row: Row): boolean {
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
    details: [],
    marketingTitle: null,
    description: null,
  };
}

export interface ListingMedia {
  photoUrl: string | null;
  listingUrl: string | null;
}

/**
 * Parse the public AppFolio listings page into a map of apartment number →
 * cover photo + listing detail URL.
 */
export function parseListingsHtml(html: string): Map<string, ListingMedia> {
  const media = new Map<string, ListingMedia>();
  const linkRe = /href="(\/listings\/detail\/([a-f0-9-]+))"/g;
  const firstSeen = new Map<string, { path: string; start: number }>();
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) !== null) {
    const [, detailPath, uid] = lm;
    if (!firstSeen.has(uid)) firstSeen.set(uid, { path: detailPath, start: lm.index });
  }
  const cards = [...firstSeen.values()].sort((a, b) => a.start - b.start);
  for (let i = 0; i < cards.length; i++) {
    const segment = html.slice(cards[i].start, cards[i + 1]?.start ?? html.length);
    const unitMatch = segment.match(/Apt\.?\s*([0-9]+)/);
    if (!unitMatch) continue;
    const unit = unitMatch[1];
    const photoMatch = segment.match(
      /data-original="(https:\/\/images\.cdn\.appfolio\.com\/[^"]+)"/,
    );
    if (!media.has(unit) && photoMatch) {
      media.set(unit, {
        photoUrl: photoMatch[1],
        listingUrl: `https://${APPFOLIO_DB}.appfolio.com${cards[i].path}`,
      });
    }
  }
  return media;
}

/**
 * Extract the ordered, deduplicated gallery photo URLs from a public listing
 * detail page.
 */

/**
 * Photo IDs to drop from unit galleries. AppFolio appends management-company
 * logo photos to every listing. Add any such IDs here.
 * PROPERTY CONFIG: replace or clear this set with IDs specific to the
 * management company's AppFolio logo/watermark photos.
 */
const EXCLUDED_PHOTO_IDS = new Set<string>();

export function parseDetailPhotos(html: string): string[] {
  const galleryRe =
    /https:\/\/images\.cdn\.appfolio\.com\/([^"'\s>]*)\/images\/([a-f0-9-]+)\/(?:medium|large)\.jpg/gi;
  const seenIds = new Set<string>();
  const photos: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = galleryRe.exec(html)) !== null) {
    const [, db, id] = m;
    if (!seenIds.has(id) && !EXCLUDED_PHOTO_IDS.has(id.toLowerCase())) {
      seenIds.add(id);
      photos.push(`https://images.cdn.appfolio.com/${db}/images/${id}/large.jpg`);
    }
  }
  const marketingRe =
    /https:\/\/images\.cdn\.appfolio\.com\/[^"'\s>]*leads_marketing_photos\/([a-f0-9-]+)\/original\.jpg/g;
  const seen = new Set<string>();
  let mm: RegExpExecArray | null;
  while ((mm = marketingRe.exec(html)) !== null) {
    const url = mm[0];
    const id = mm[1].toLowerCase();
    if (!seen.has(url) && !EXCLUDED_PHOTO_IDS.has(id)) {
      seen.add(url);
      photos.push(url);
    }
  }
  return photos;
}

/**
 * Extract the unit's YouTube tour video from a public listing detail page.
 */
export function parseDetailVideo(html: string): string | null {
  const m = html.match(
    /https:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,20})/,
  );
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : null;
}

/** Decode the handful of HTML entities AppFolio uses in list items. */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/**
 * Known misspellings in the AppFolio amenity/appliance feed → corrected label.
 * PROPERTY CONFIG: add only typos observed in the property's AppFolio feed.
 */
const AMENITY_SPELLING_FIXES: [RegExp, string][] = [
  [/\bDiswasher\b/gi, "Dishwasher"],
];

export function fixAmenitySpelling(item: string): string {
  let out = item;
  for (const [re, fix] of AMENITY_SPELLING_FIXES) out = out.replace(re, fix);
  return out;
}

/**
 * Sentences in AppFolio marketing descriptions that contradict the
 * leasing-confirmed fee policy.
 * PROPERTY CONFIG: update this regex to match contradictory copy in the
 * AppFolio listings, or set it to never match if your feed is clean.
 */
const CONTRADICTORY_FEE_SENTENCE_RE =
  /(pet\s+deposit|pet\s+rent|deposit[^.!?\n]*per\s+pet|per\s+pet[^.!?\n]*deposit|admin\w*\s+fee[^.!?\n]*per\s+person)/i;

export function stripContradictoryFeeSentences(text: string, removed?: string[]): string {
  const cleaned = text
    .split(/(\n+)/)
    .map((part) => {
      if (/^\n+$/.test(part)) return part;
      const sentences = part.match(/[^.!?]*[.!?]+[)"']?\s*|[^.!?]+$/g) ?? [part];
      return sentences
        .filter((s) => {
          const keep =
            !CONTRADICTORY_FEE_SENTENCE_RE.test(s) ||
            /\bno\b[^.!?\n]*(pet\s+deposit|pet\s+rent)/i.test(s);
          if (!keep) removed?.push(s.trim());
          return keep;
        })
        .join("");
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned;
}

/**
 * Property-wide amenities that must not appear in a unit's headline.
 * PROPERTY CONFIG: update to match verified building-level amenities.
 */
const PROPERTY_AMENITY_RE = /^(sauna|pool|hot\s*tub)$/i;

export function sanitizeMarketingTitle(title: string | null): string | null {
  if (!title) return null;
  title = title.replace(/call\s+today\s+and\s+schedule\s+your\s+tour/gi, "Schedule Your Tour Today");
  const withIdx = title.search(/\bwith\b/i);
  if (withIdx === -1) return title;
  const afterWith = title.slice(withIdx + 4);
  const inIdx = afterWith.toLowerCase().lastIndexOf(" in ");
  const listPart = inIdx === -1 ? afterWith : afterWith.slice(0, inIdx);
  const tail = inIdx === -1 ? "" : afterWith.slice(inIdx);
  const items = listPart
    .split(/,|&/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const kept = items.filter((item) => !PROPERTY_AMENITY_RE.test(item));
  if (kept.length === items.length) return title;
  const head = title.slice(0, withIdx).trimEnd();
  if (kept.length === 0) return `${head}${tail}`.replace(/\s{2,}/g, " ").trim();
  const list =
    kept.length === 1 ? kept[0] : `${kept.slice(0, -1).join(", ")} & ${kept[kept.length - 1]}`;
  return `${head} with ${list}${tail}`.replace(/\s{2,}/g, " ").trim();
}

export function parseDetailSections(html: string, removed?: string[]): DetailSection[] {
  const sections: DetailSection[] = [];
  const sectionRe = /<h3[^>]*>([^<]+)<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(html)) !== null) {
    const title = decodeEntities(m[1].trim());
    const items = [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
      .map((li) => fixAmenitySpelling(decodeEntities(li[1].replace(/<[^>]*>/g, "").trim())))
      .filter((item) => item.length > 0)
      .filter((item) => {
        const keep =
          !CONTRADICTORY_FEE_SENTENCE_RE.test(item) ||
          /\bno\b[^.!?\n]*(pet\s+deposit|pet\s+rent)/i.test(item);
        if (!keep) removed?.push(item);
        return keep;
      });
    if (title && items.length > 0) sections.push({ title, items });
  }
  return sections;
}

export function parseDetailTitle(html: string): string | null {
  const m = html.match(/<h2[^>]*class="[^"]*listing-detail__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/);
  if (!m) return null;
  const title = decodeEntities(m[1].replace(/<[^>]*>/g, "").trim());
  return title || null;
}

export function parseDetailDescription(html: string, removed?: string[]): string | null {
  const m = html.match(/<p[^>]*class="[^"]*listing-detail__description[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  if (!m) return null;
  const text = stripContradictoryFeeSentences(
    decodeEntities(m[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim())
      .replace(/call\s+today\s+and\s+schedule\s+your\s+tour/gi, "Schedule Your Tour Today"),
    removed,
  );
  return text || null;
}

interface DetailInfo {
  photos: string[];
  details: DetailSection[];
  marketingTitle: string | null;
  description: string | null;
  videoUrl: string | null;
  strippedFeeCopy: string[];
}

async function fetchDetailInfo(listingUrl: string): Promise<DetailInfo> {
  const res = await fetch(listingUrl, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`AppFolio listing detail page failed: status ${res.status}`);
  const html = await res.text();
  const strippedFeeCopy: string[] = [];
  return {
    photos: parseDetailPhotos(html),
    details: parseDetailSections(html, strippedFeeCopy),
    marketingTitle: sanitizeMarketingTitle(parseDetailTitle(html)),
    description: parseDetailDescription(html, strippedFeeCopy),
    videoUrl: parseDetailVideo(html),
    strippedFeeCopy,
  };
}

/**
 * Fetch listing media from the public listings page.
 * PROPERTY CONFIG: update the "filters[property_list]" value to match the
 * property's name as it appears in AppFolio's public listings filter.
 */
async function fetchListingMedia(): Promise<Map<string, ListingMedia>> {
  // Uses APPFOLIO_PROPERTY_NAME (property-config appfolio.propertyName) for the listings filter.
  const url = `https://${APPFOLIO_DB}.appfolio.com/listings?${encodeURIComponent("filters[property_list]")}=${encodeURIComponent(APPFOLIO_PROPERTY_NAME)}`;
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`AppFolio public listings page failed: status ${res.status}`);
  return parseListingsHtml(await res.text());
}

/**
 * Extract the listable UID from a public AppFolio listing URL.
 */
export function listableUidFromListingUrl(listingUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(listingUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (!host.endsWith(".appfolio.com")) return null;
  const m = url.pathname.match(/^\/listings\/detail\/([A-Fa-f0-9-]+)\/?$/i);
  return m ? m[1].toLowerCase() : null;
}

export function applyUrlForListing(listingUrl: string): string | null {
  const uid = listableUidFromListingUrl(listingUrl);
  if (!uid) return null;
  const origin = new URL(listingUrl).origin;
  return `${origin}/listings/rental_applications/new?listable_uid=${uid}&source=${encodeURIComponent(DEFAULT_LEAD_SOURCE)}`;
}

export interface GuestCardInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  listableUid: string;
  source?: string;
}

/**
 * Normalize a guest-card name: AppFolio rejects a first_name containing a
 * space with a 422, so split extra words into last_name.
 */
export function normalizeGuestCardName(
  firstName: string,
  lastName: string,
): { firstName: string; lastName: string } {
  const parts = firstName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: firstName.trim(), lastName: lastName.trim() };
  const extra = parts.slice(1).join(" ");
  return {
    firstName: parts[0],
    lastName: `${extra} ${lastName}`.trim(),
  };
}

export async function createGuestCard(input: GuestCardInput): Promise<void> {
  const name = normalizeGuestCardName(input.firstName, input.lastName);
  const source = input.source ?? DEFAULT_LEAD_SOURCE;
  const res = await fetch(`https://${APPFOLIO_DB}.appfolio.com/listings/api/guest_cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({
      first_name: name.firstName,
      last_name: name.lastName,
      email_address: input.email,
      phone_number: input.phone,
      listable_uid: input.listableUid,
      source,
      skip_cta_for_new_inquiries: true,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `AppFolio guest card failed: status ${res.status} body=${detail ? JSON.stringify(detail.slice(0, 300)) : "<empty>"}`,
    );
  }
}

export async function resolveTourUnitListableUid(): Promise<string | null> {
  // PROPERTY CONFIG: implement the tour-unit resolution for the property.
  // See the generic dedicated-tour-unit integration pattern.
  // The pattern: a hidden AppFolio unit reserved for general (non-specific-apartment)
  // tour bookings, resolved via the Unit Directory report.
  return null;
}

export async function fetchAvailability(
  clientId: string,
  clientSecret: string,
): Promise<AvailabilityPayload> {
  const url = `${APPFOLIO_BASE}/unit_vacancy.json`;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ paginate_results: false }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `AppFolio Unit Vacancy report failed: status ${res.status} body=${detail ? JSON.stringify(detail.slice(0, 300)) : "<empty>"}`,
    );
  }
  const data = (await res.json()) as { results?: Row[] };
  const rows: Row[] = Array.isArray(data.results) ? data.results : [];

  const units = rows
    .filter(isPropertyRow)
    .map(normalizeRow)
    .filter((u): u is AvailableUnit => u !== null && !isTourUnitName(u.unit));

  let listingMedia = new Map<string, ListingMedia>();
  try {
    listingMedia = await fetchListingMedia();
  } catch (err) {
    // Non-fatal — availability renders without photos.
  }

  const enriched = await Promise.all(
    units.map(async (u) => {
      const media = listingMedia.get(u.unit);
      if (!media?.listingUrl) return u;
      const enrichedUnit = { ...u, photoUrl: media.photoUrl, listingUrl: media.listingUrl };
      try {
        const info = await fetchDetailInfo(media.listingUrl);
        const removed = info.strippedFeeCopy;
        if (removed.length > 0) void reportStrippedFeeCopy(u.unit, removed);
        recordFeeCopyCheck(removed.length > 0 ? "stripped" : "clean");
        return {
          ...enrichedUnit,
          photos: info.photos,
          details: info.details,
          marketingTitle: info.marketingTitle,
          description: info.description,
          videoUrl: info.videoUrl,
        };
      } catch {
        return enrichedUnit;
      }
    }),
  );

  return { units: enriched, updatedAt: new Date().toISOString() };
}
