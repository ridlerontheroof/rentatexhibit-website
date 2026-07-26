// Per-unit page SEO: title, description, fact-first summary, head-tag model,
// and Apartment/OfferForLease JSON-LD for /available-units/<unit>.
//
// One shared module feeds BOTH the client <Seo model> on pages/UnitDetail.tsx
// AND the build-time prerenderer (entry-server.tsx), so the crawler-visible
// head and the hydrated head can never drift.
import {
  SITE_URL,
  WEBSITE_NODE,
  ORGANIZATION_NODE,
  APARTMENT_COMPLEX_NODE,
  type SeoModel,
  type SeoMeta,
} from './seo';
import {
  apartmentNode,
  floorPlanNode,
  planGroupForUnitNumber,
} from './unitJsonLd';
import type { AvailableUnit } from '../hooks/use-availability';

export function unitPagePath(unitNumber: string): string {
  return `/available-units/${unitNumber}`;
}

export function unitCanonical(unitNumber: string): string {
  return `${SITE_URL}${unitPagePath(unitNumber)}`;
}

/** Floor number parsed from the "FFUU" apartment number, or null. */
export function unitFloor(unitNumber: string): number | null {
  if (!/^\d{4}$/.test(unitNumber)) return null;
  const floor = Number(unitNumber.slice(0, 2));
  return Number.isFinite(floor) && floor > 0 ? floor : null;
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
  return u.sqft ?? planGroupForUnitNumber(u.unit)?.sqftMin ?? null;
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
  // Meta-description-length restatement of the same hard facts.
  return unitFactSummary(u);
}

/** Apartment + OfferForLease JSON-LD @graph for one unit page (self-contained). */
export function unitPageJsonLd(u: AvailableUnit): Record<string, unknown> {
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
    apartmentNode(u, { id: `${canonical}#apartment`, url: canonical }),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Full head-tag model for a unit page. The unit's own listing photo is the
 * share image when posted (no fixed width/height claimed — AppFolio does not
 * publish dimensions); otherwise the floor-plans share card is reused.
 */
export function buildUnitSeoModel(u: AvailableUnit): SeoModel {
  const title = unitTitle(u);
  const description = unitDescription(u);
  const canonical = unitCanonical(u.unit);
  const ogImage = u.photoUrl ?? `${SITE_URL}/images/og/floor-plans.jpg`;

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

  return { title, canonical, metas, jsonLd: [unitPageJsonLd(u)] };
}
