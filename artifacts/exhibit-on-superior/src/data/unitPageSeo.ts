// Per-unit page SEO: title, description, fact-first summary, head-tag model,
// and Apartment/OfferForLease JSON-LD for /available-units/<unit>.
//
// One shared module feeds BOTH the client <Seo model> on pages/UnitDetail.tsx
// AND the build-time prerenderer (entry-server.tsx), so the crawler-visible
// head and the hydrated head can never drift.
import {
  SITE_URL,
  ogCardUrl,
  WEBSITE_NODE,
  ORGANIZATION_NODE,
  APARTMENT_COMPLEX_NODE,
  type SeoModel,
  type SeoMeta,
} from './seo';
import {
  apartmentNode,
  floorPlanNode,
  offerPriceValidUntil,
  planGroupForUnitNumber,
} from './unitJsonLd';
import { floorDisplayLabel, parseUnitNumber } from './floorPlans';
import { resolveUnitSqft } from './unitSqft';
import { youTubeEmbedUrl, youTubeVideoId } from '../lib/youtube';
import youtubeMetadata from './youtube-metadata.json';
import type { AvailableUnit } from '../hooks/use-availability';

interface CachedYouTubeVideo {
  videoUrl: string;
  title: string;
  uploadDate: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

const YOUTUBE_VIDEOS: Record<string, CachedYouTubeVideo> = youtubeMetadata.videos;

/** ISO-8601 duration (e.g. PT2M1S) from a duration in seconds. */
function isoDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `PT${minutes > 0 ? `${minutes}M` : ''}${seconds}S`;
}

/**
 * VideoObject for a unit's YouTube tour, or null when the unit has no video
 * or its metadata is not in the committed cache. Google requires a truthful
 * uploadDate and thumbnailUrl, which AppFolio does not provide — both come
 * from YouTube itself, cached into youtube-metadata.json (refresh via
 * scripts/fetch-youtube-metadata.mjs) so builds stay deterministic. A video
 * missing from the cache simply ships without the node, never a build break.
 */
export function unitVideoJsonLd(u: AvailableUnit): Record<string, unknown> | null {
  if (!u.videoUrl) return null;
  const id = youTubeVideoId(u.videoUrl);
  const meta = id ? YOUTUBE_VIDEOS[id] : undefined;
  const embedUrl = youTubeEmbedUrl(u.videoUrl);
  if (!id || !meta || !embedUrl) return null;
  const canonical = unitCanonical(u.unit);
  return {
    '@type': 'VideoObject',
    '@id': `${canonical}#video`,
    name: meta.title,
    description:
      `Video tour of the floor plan for Apartment ${u.unit} at Exhibit On Superior, ` +
      `165 W Superior St in Chicago's River North neighborhood.`,
    contentUrl: meta.videoUrl,
    // Same privacy-enhanced player URL the page's iframe embeds.
    embedUrl,
    uploadDate: meta.uploadDate,
    thumbnailUrl: meta.thumbnailUrl,
    duration: isoDuration(meta.durationSeconds),
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
  };
}

export function unitPagePath(unitNumber: string): string {
  return `/available-units/${unitNumber}`;
}

export function unitCanonical(unitNumber: string): string {
  return `${SITE_URL}${unitPagePath(unitNumber)}`;
}

/**
 * Human-facing floor label parsed from the apartment number, or null.
 * "0606" -> "6"; AppFolio's mezzanine form "04M02" -> "4M".
 */
export function unitFloor(unitNumber: string): string | null {
  const parsed = parseUnitNumber(unitNumber);
  if (!parsed || parsed.floor <= 0) return null;
  return floorDisplayLabel(parsed.floor);
}

function bedsLabel(u: AvailableUnit): string | null {
  const group = planGroupForUnitNumber(u.unit);
  const beds = u.bedrooms ?? group?.beds ?? null;
  if (beds === null) return null;
  if (beds === 0) return group?.typeLabel?.toLowerCase().includes('convertible') ? 'convertible' : 'studio';
  return `${beds}-bedroom`;
}

function bathsFor(u: AvailableUnit): number | null {
  return u.bathrooms ?? planGroupForUnitNumber(u.unit)?.baths ?? null;
}

function sqftFor(u: AvailableUnit): number | null {
  // Floor-plan database is authoritative over the AppFolio feed — see unitSqft.ts.
  return resolveUnitSqft(u);
}

function rentText(u: AvailableUnit): string | null {
  return u.rent !== null && u.rent > 0 ? `$${Math.round(u.rent).toLocaleString()} per month` : null;
}

function availableText(u: AvailableUnit): string {
  if (!u.availableOn) return 'available now';
  const date = new Date(`${u.availableOn}T12:00:00`);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return 'available now';
  return `available from ${date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

/**
 * Fact-first summary paragraph rendered at the very top of the unit page —
 * the first ~100 words a crawler or AI assistant reads answer "what is this
 * apartment?" directly: layout, size, floor, availability date, and rent.
 */
export function unitFactSummary(u: AvailableUnit): string {
  const group = planGroupForUnitNumber(u.unit);
  const beds = bedsLabel(u);
  const baths = bathsFor(u);
  const sqft = sqftFor(u);
  const floor = unitFloor(u.unit);
  const rent = rentText(u);

  const layout = [beds, baths !== null ? `${baths}-bath` : null].filter(Boolean).join(', ');
  const first =
    `Apartment ${u.unit} at Exhibit On Superior is a ${layout || 'residence'}` +
    `${sqft !== null ? `, ${sqft.toLocaleString()} sq ft apartment` : ' apartment'}` +
    `${floor !== null ? ` on floor ${floor}` : ''}` +
    `, ${availableText(u)}` +
    `${rent ? ` at ${rent}` : ''}.`;
  const second = group
    ? ` It is a ${group.typeLabel} floor plan (residence line ${String(group.unit).padStart(2, '0')}) at 165 W Superior St in Chicago's River North neighborhood.`
    : ` It is located at 165 W Superior St in Chicago's River North neighborhood.`;
  return first + second;
}

export function unitTitle(u: AvailableUnit): string {
  const beds = bedsLabel(u);
  const parts = [
    `Apartment ${u.unit}`,
    beds ? beds.charAt(0).toUpperCase() + beds.slice(1) : null,
    'Exhibit On Superior Chicago',
  ].filter(Boolean);
  return parts.join(' | ');
}

export function unitDescription(u: AvailableUnit): string {
  // Meta description: the first (fact-dense) sentence of the summary plus a
  // short location tail, clamped to ~160 chars. Search engines truncate longer
  // descriptions mid-sentence, which reads badly in SERPs and ad previews;
  // the full two-sentence summary still appears in the page body and JSON-LD.
  const full = unitFactSummary(u);
  const firstSentence = full.slice(0, full.indexOf('. ') + 1);
  const withTail = `${firstSentence} River North, Chicago.`;
  const text = withTail.length <= 160 ? withTail : firstSentence;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 159);
  return `${cut.slice(0, cut.lastIndexOf(' '))}\u2026`;
}

/** Apartment + OfferForLease JSON-LD @graph for one unit page (self-contained). */
export function unitPageJsonLd(u: AvailableUnit, updatedAt?: string | null): Record<string, unknown> {
  const canonical = unitCanonical(u.unit);
  const group = planGroupForUnitNumber(u.unit);
  const title = unitTitle(u);

  const webPage = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description: unitDescription(u),
    isPartOf: { '@id': `${SITE_URL}#website` },
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
    // The availability snapshot's own timestamp — the same data the page
    // renders — NOT build time, so the claim stays truthful.
    ...(updatedAt ? { dateModified: updatedAt } : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Exhibit On Superior', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Available Units',
        item: `${SITE_URL}/available-units`,
      },
      { '@type': 'ListItem', position: 3, name: `Apartment ${u.unit}`, item: canonical },
    ],
  };

  const graph: Record<string, unknown>[] = [
    // Base entities re-emitted in full so this page's graph resolves every
    // internal @id on its own and the merged nodes stay rich when crawled
    // in isolation.
    WEBSITE_NODE,
    ORGANIZATION_NODE,
    APARTMENT_COMPLEX_NODE,
    webPage,
    breadcrumb,
    ...(group ? [floorPlanNode(group)] : []),
    apartmentNode(u, {
      id: `${canonical}#apartment`,
      url: canonical,
      // Bound the quoted rent to the availability data's own age: prerendered
      // prices can outlive a publish, and priceValidUntil tells engines how
      // long the offer may be trusted before recrawling.
      priceValidUntil: updatedAt ? offerPriceValidUntil(updatedAt) : null,
    }),
  ];
  // YouTube tour, when the unit has one and its metadata (uploadDate,
  // thumbnail) is in the committed cache — see unitVideoJsonLd.
  const video = unitVideoJsonLd(u);
  if (video) graph.push(video);
  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Full head-tag model for a unit page. The unit's own listing photo is the
 * share image when posted (no fixed width/height claimed — AppFolio does not
 * publish dimensions); otherwise the floor-plans share card is reused.
 */
export function buildUnitSeoModel(u: AvailableUnit, updatedAt?: string | null): SeoModel {
  const title = unitTitle(u);
  const description = unitDescription(u);
  const canonical = unitCanonical(u.unit);
  const ogImage = u.photoUrl ?? ogCardUrl('floor-plans');

  const metas: SeoMeta[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Exhibit On Superior' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    ...(u.photoUrl
      ? []
      : [
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '630' },
        ]),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
  ];

  return { title, canonical, metas, jsonLd: [unitPageJsonLd(u, updatedAt)] };
}
