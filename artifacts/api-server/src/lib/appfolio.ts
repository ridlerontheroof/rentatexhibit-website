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
import { recordFeeCopyCheck, reportStrippedFeeCopy } from "./feeCopyAlert";

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
 * Parse the public AppFolio listings page (the same page the official
 * embed widget iframes) into a map of apartment number → cover photo +
 * listing detail URL. Each card wraps its image in an anchor to
 * /listings/detail/<uuid>; the image alt text carries "Apt. NNNN".
 */
export function parseListingsHtml(html: string): Map<string, ListingMedia> {
  const media = new Map<string, ListingMedia>();

  // Each listing card references its own /listings/detail/<uuid> link twice
  // (photo anchor + address anchor), with the unit address and photo appearing
  // AFTER the first link occurrence. A single greedy regex can pair one card's
  // link with the NEXT card's address, so instead: segment the page at each
  // first occurrence of a distinct detail link, and read that card's unit
  // number and photo from within its own segment only.
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
 *
 * A detail page carries TWO photo groups on the AppFolio image CDN:
 *  - `<db>/images/<uuid>/(medium|large).jpg` — the unit's own gallery
 *    (same group the listings-page cover photo comes from), and
 *  - `<db>/leads_marketing_photos/<uuid>/original.jpg` — a property-wide
 *    marketing set that is IDENTICAL across every listing.
 * The `images/` group is unit-specific, so it leads the gallery (as
 * large.jpg); the property-wide marketing set is appended after it so a
 * unit with only a cover photo still shows the full building gallery.
 */

/**
 * Photo IDs to drop from unit galleries. AppFolio appends the Highland
 * Partners logo (a 338×100 JPEG) as the final photo of every listing's
 * gallery; it is not a unit photo and should never reach the site.
 */
const EXCLUDED_PHOTO_IDS = new Set(["a2d081fb-43de-4bf9-9089-5e9d2525575a"]);

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
 * AppFolio embeds it as a youtube.com/watch link; the Unit Directory report
 * doesn't reliably expose it, so the public page is the source of truth.
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
 * Extract the listing's info sections (Rental Terms, Pet Policy, Amenities,
 * Utilities Included, Appliances) from a detail page. Each section is an
 * `<h3>` heading followed by a `<ul>` of `list__item` entries.
 */
export function parseDetailSections(html: string, removed?: string[]): DetailSection[] {
  const sections: DetailSection[] = [];
  const sectionRe = /<h3[^>]*>([^<]+)<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(html)) !== null) {
    const title = decodeEntities(m[1].trim());
    const items = [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
      .map((li) => decodeEntities(li[1].replace(/<[^>]*>/g, "").trim()))
      .filter((item) => item.length > 0)
      // Same fee-policy guard as descriptions: drop line items asserting a pet
      // deposit / pet rent / per-person admin fee, which contradict the
      // leasing-confirmed policy published on the site.
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

/** Extract the listing headline (`listing-detail__title`) from a detail page. */
export function parseDetailTitle(html: string): string | null {
  const m = html.match(/<h2[^>]*class="[^"]*listing-detail__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/);
  if (!m) return null;
  const title = decodeEntities(m[1].replace(/<[^>]*>/g, "").trim());
  return title || null;
}

/**
 * Property-wide amenities that must not appear in a unit's headline — they
 * describe the building (sauna, pool, hot tub), not the apartment itself, so
 * listing them per-unit reads as misleading.
 */
const PROPERTY_AMENITY_RE = /^(sauna|pool|hot\s*tub)$/i;

/**
 * Strip property-level amenities from an AppFolio marketing headline's
 * "with X, Y & Z" list, e.g. "Luxury 1-Bedroom Apartment with Sauna, Pool &
 * In-Unit Laundry in River North Chicago" → "Luxury 1-Bedroom Apartment with
 * In-Unit Laundry in River North Chicago". If nothing unit-specific remains,
 * the whole "with …" clause is dropped.
 */
export function sanitizeMarketingTitle(title: string | null): string | null {
  if (!title) return null;
  // Rewrite phone-first CTAs: the site funnels prospects to the on-page
  // "Schedule a Tour" button, so "Call Today and Schedule Your Tour!" would
  // point people away from it.
  title = title.replace(/call\s+today\s+and\s+schedule\s+your\s+tour/gi, "Schedule Your Tour Today");
  const withIdx = title.search(/\bwith\b/i);
  if (withIdx === -1) return title;
  const afterWith = title.slice(withIdx + 4);
  // The location tail starts at the last standalone " in " (hyphenated terms
  // like "In-Unit" don't match).
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

/**
 * Sentences in AppFolio marketing descriptions that contradict the
 * leasing-confirmed fee policy published on the site (one-time non-refundable
 * pet fee $650/$750 dogs / $325 cats, NO pet deposit, NO monthly pet rent;
 * $500 administrative fee is per apartment, not per person). Older listing
 * copy said "a $300 deposit and $30 monthly pet rent per pet" and "$500 admin
 * fee per person" — the leasing team owns that text and can reintroduce it on
 * any re-sync, so strip any sentence asserting those charges before it reaches
 * the site.
 */
const CONTRADICTORY_FEE_SENTENCE_RE =
  /(pet\s+deposit|pet\s+rent|deposit[^.!?\n]*per\s+pet|per\s+pet[^.!?\n]*deposit|admin\w*\s+fee[^.!?\n]*per\s+person)/i;

/**
 * Drop whole sentences that state a pet deposit / monthly pet rent / per-person
 * admin fee. Sentence-level (not paragraph-level) so surrounding accurate copy
 * survives. Negations like "no pet deposit" are kept — they agree with policy.
 */
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
    // Collapse paragraphs emptied entirely by the filter.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned;
}

/** Extract the listing description (`listing-detail__description`) from a detail page. */
export function parseDetailDescription(html: string, removed?: string[]): string | null {
  const m = html.match(/<p[^>]*class="[^"]*listing-detail__description[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  if (!m) return null;
  const text = stripContradictoryFeeSentences(
    decodeEntities(m[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim())
      // Same phone-first CTA rewrite as sanitizeMarketingTitle — the site
      // funnels prospects to the on-page Schedule a Tour button.
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
  /** Sentences/line items removed by the fee-policy sanitizer, for alerting. */
  strippedFeeCopy: string[];
}

/** Fetch a listing detail page's photos + info sections. Public page, no credentials. */
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

/**
 * Extract the listable UID from a public AppFolio listing URL
 * (…/listings/detail/<uuid>). Returns null for anything else.
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
  // Match the listing-detail path case-insensitively; ignore query/fragment.
  const m = url.pathname.match(/^\/listings\/detail\/([A-Fa-f0-9-]+)\/?$/i);
  return m ? m[1].toLowerCase() : null;
}

export interface GuestCardInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** The AppFolio listing UID the prospect is asking about. */
  listableUid: string;
}

/**
 * Create a guest card (prospect record) in AppFolio for a listing — the same
 * endpoint AppFolio's own hosted listing pages use when a prospect submits
 * their contact info. This attaches the prospect, with the property and unit
 * from the listing, directly in AppFolio for the leasing team.
 *
 * Returns true when AppFolio accepted the guest card.
 */
export async function createGuestCard(input: GuestCardInput): Promise<boolean> {
  const res = await fetch(`https://${APPFOLIO_DB}.appfolio.com/listings/api/guest_cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      emailAddress: input.email,
      phoneNumber: input.phone,
      listableUid: input.listableUid,
      // Lead attribution shown to the leasing team in AppFolio. Keep in sync
      // with LEAD_SOURCE on the web app (tour/apply link `source` param).
      source: "Website (Exhibit)",
      skipCtaForNewInquiries: true,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `AppFolio guest card failed: status ${res.status} ${detail.slice(0, 300)}`,
    );
  }
  return true;
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
      const info = await fetchDetailInfo(unit.listingUrl);
      unit.photos = info.photos;
      unit.details = info.details;
      unit.marketingTitle = info.marketingTitle;
      unit.description = info.description;
      // The public page is the most reliable video source; the Unit
      // Directory report is only a fallback when the page has no embed.
      unit.videoUrl = info.videoUrl ?? unit.videoUrl;
      // The sanitizer removed copy that contradicts the published fee
      // policy — the wrong text still lives in AppFolio (hosted pages,
      // ILS syndication), so tell the leasing team. Best-effort, deduped
      // to one email per offending text per day; never fails the refresh.
      if (info.strippedFeeCopy.length > 0) {
        void reportStrippedFeeCopy(unit.unit, info.strippedFeeCopy);
      }
      // Daily proof-of-life: healthy (clean) checks are otherwise silent,
      // so record every check for the once-per-UTC-day info heartbeat.
      recordFeeCopyCheck(info.strippedFeeCopy.length > 0 ? "stripped" : "clean");
    } catch {
      unit.photos = [];
      unit.details = [];
      // The detail page could not be fetched, so its copy went unchecked —
      // still counts toward the heartbeat so the watchdog proves liveness.
      recordFeeCopyCheck("failed");
    }
  }

  return { units, updatedAt: new Date().toISOString() };
}
